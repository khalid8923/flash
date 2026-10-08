/* ═══════════════════════════════════════════════════════════
   AI Daily Plan Service
   Flow: context → candidates → Groq (whitelist) → validate → fallback
   Rule: LLM picks from candidates, explains. Never invents game IDs.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { env } from '../../config/env.js';
import { routeChat } from './router.js';
import {
  SYSTEM_PROMPT_DAILY_PLAN_EN,
  SYSTEM_PROMPT_DAILY_PLAN_AR,
  buildDailyPlanUserPrompt,
  type DailyPlanContext,
  type DailyPlanCandidate,
  type Lang,
} from './prompts-daily-plan.js';
import { validateAiText } from './validator.js';

export interface DailyPlanItem {
  game_id: string;
  game_name: string;
  domain_id: string;
  mode: string;
  minutes: number;
  reason: string;
}

export interface DailyPlanResult {
  plan: DailyPlanItem[];
  summary: string;
  generated_at: string;
  source: 'llm' | 'rule' | 'cache';
  language: Lang;
  model: string;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  validation_issues?: { code: string; detail: string }[];
}

/* Simple in-memory cache keyed by userId:YYYY-MM-DD */
const memCache = new Map<string, DailyPlanResult>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const cacheTimestamps = new Map<string, number>();

function cacheKey(userId: string, lang: Lang): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${userId}:${d}:${lang}`;
}

function getCached(userId: string, lang: Lang): DailyPlanResult | null {
  const k = cacheKey(userId, lang);
  const ts = cacheTimestamps.get(k);
  if (ts && Date.now() - ts < CACHE_TTL_MS) {
    const hit = memCache.get(k);
    if (hit) return { ...hit, source: 'cache' };
  }
  return null;
}

function setCached(userId: string, lang: Lang, result: DailyPlanResult): void {
  const k = cacheKey(userId, lang);
  memCache.set(k, result);
  cacheTimestamps.set(k, Date.now());
}

/* ───────────────────────────────────────────────────────── */

/* ─── Robust JSON extraction ─── */
function extractJson(text: string): { summary?: unknown; games?: unknown } | null {
  const candidates: string[] = [];
  candidates.push(text.trim());
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) candidates.push(fenceMatch[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    candidates.push(text.slice(first, last + 1).trim());
  }
  for (const c of candidates) {
    if (!c) continue;
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return obj as { summary?: unknown; games?: unknown };
      }
    } catch { /* try next */ }
  }
  return null;
}
/* ─── Ensure reasons are varied + reference data ─── */
function enrichReasons(
  plan: DailyPlanItem[],
  candidates: DailyPlanCandidate[],
  language: Lang
): DailyPlanItem[] {
  const candMap = new Map(candidates.map((c) => [c.game_id, c]));
  const seen = new Set<string>();
  const result: DailyPlanItem[] = [];

  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    if (!item) continue;
    const cand = candMap.get(item.game_id);
    let reason = item.reason.trim();

    // Detect duplication or generic reasons
    const isDuplicate = seen.has(reason.toLowerCase());
    const isTooGeneric =
      reason.length < 15 ||
      /^(لتنويع|لتحسين|لتطوير|to improve|for variety|good for)/i.test(reason) && reason.length < 40;

    if (isDuplicate || isTooGeneric || !cand) {
      // Generate a varied reason from candidate data
      const fallbackReason = buildVariedReason(cand, i, language);
      reason = fallbackReason;
    }
    seen.add(reason.toLowerCase());

    result.push({ ...item, reason });
  }
  return result;
}

function buildVariedReason(
  cand: DailyPlanCandidate | undefined,
  index: number,
  language: Lang
): string {
  if (!cand) {
    return language === 'ar' ? 'اختار متنوع.' : 'Good for variety.';
  }
  const stage =
    index === 0 ? 'warmup' : index === 1 ? 'main' : index === 2 ? 'main2' : 'finish';
  const level = cand.current_level;

  if (language === 'ar') {
    if (cand.rule_reason.includes('never played')) {
      return index === 0
        ? 'جديد — ابدأ بيه خفيف (3 دقايق).'
        : 'مجال جديد — وسّع تدريبك.';
    }
    if (cand.rule_reason.includes('low accuracy')) {
      return `دقتك هنا ضعيفة — محتاج شغل على مستوى ${level}.`;
    }
    if (cand.rule_reason.includes('not played recently')) {
      return `مش لعبته من فترة — جدد المهارة.`;
    }
    return `ثابت على مستوى ${level} — عزّز الأداء.`;
  } else {
    if (cand.rule_reason.includes('never played')) {
      return index === 0 ? 'New — start light (3 min).' : 'New domain — broaden your range.';
    }
    if (cand.rule_reason.includes('low accuracy')) {
      return `Accuracy gap here — work at level ${level}.`;
    }
    if (cand.rule_reason.includes('not played recently')) {
      return `Haven't played in a while — refresh the skill.`;
    }
    return `Solid at level ${level} — reinforce the pattern.`;
  }
}
export async function generateDailyPlan(
  userId: string,
  language: Lang = 'en'
): Promise<DailyPlanResult> {
  const started = Date.now();

  const cached = getCached(userId, language);
  if (cached) return { ...cached, latency_ms: 0 };

  const [ctx, candidates] = await Promise.all([
    loadContext(userId),
    loadCandidates(userId),
  ]);

  if (candidates.length === 0) {
    return ruleFallback(userId, language, started, 'no_candidates');
  }

  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_DAILY_PLAN_AR : SYSTEM_PROMPT_DAILY_PLAN_EN;
  const userPrompt = buildDailyPlanUserPrompt(ctx, candidates, language);
  const model = language === 'ar' ? env.GROQ_MODEL_AR : env.GROQ_MODEL_EN;

  let llmText = '';
  let tokens: DailyPlanResult['tokens'];
  let usedModel = '';
  let usedProvider = '';

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, max_tokens: 1400, language, json_mode: true }
    );
    llmText = res.content;
    usedModel = res.model;
    usedProvider = res.provider;
    tokens = {
      prompt: res.usage.prompt_tokens,
      completion: res.usage.completion_tokens,
      total: res.usage.total_tokens,
    };
    console.error('[daily-plan] provider=' + usedProvider, '| model=' + usedModel, '| chain=' + res.fallback_chain.join('>'));
  } catch (err) {
    console.error('[daily-plan] all providers failed:', (err as Error).message);
    return ruleFallback(userId, language, started, 'llm_error');
  }

  /* Parse JSON — try multiple strategies */
  const parsed = extractJson(llmText);
  if (!parsed) {
    console.error('[daily-plan] JSON parse failed.');
    console.error('[daily-plan] Raw LLM output (first 800 chars):');
    console.error(llmText.slice(0, 800));
    console.error('[daily-plan] ---');
    return ruleFallback(userId, language, started, 'json_parse_error');
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  const gamesArr = Array.isArray(parsed.games) ? parsed.games : [];

  if (!summary || gamesArr.length === 0) {
    return ruleFallback(userId, language, started, 'missing_fields');
  }

  /* Validate the summary text */
  const summaryCheck = validateAiText(summary, { minLen: 10, maxLen: 400 });
  if (!summaryCheck.ok) {
    return ruleFallback(userId, language, started, 'summary_invalid');
  }

  /* Build plan items, filtered against candidate whitelist */
  const candMap = new Map(candidates.map((c) => [c.game_id, c]));
  const plan: DailyPlanItem[] = [];
  for (const g of gamesArr) {
    if (!g || typeof g !== 'object') continue;
    const item = g as { game_id?: unknown; reason?: unknown };
    const gid = typeof item.game_id === 'string' ? item.game_id : '';
    const reasonRaw = typeof item.reason === 'string' ? item.reason.trim() : '';
    if (!gid || !reasonRaw) continue;
    const cand = candMap.get(gid);
    if (!cand) continue; // hallucinated game_id — reject silently
    const reasonCheck = validateAiText(reasonRaw, { minLen: 5, maxLen: 200 });
    if (!reasonCheck.ok) continue;
    plan.push({
      game_id: cand.game_id,
      game_name: cand.game_name,
      domain_id: cand.domain_id,
      mode: cand.mode,
      minutes: cand.suggested_minutes,
      reason: reasonCheck.cleaned,
    });
    if (plan.length >= 5) break;
  }

  const enrichedPlan = enrichReasons(plan, candidates, language);
  plan.length = 0;
  plan.push(...enrichedPlan);

  if (plan.length < 2) {
    console.error('[daily-plan] Only', plan.length, 'valid items. LLM games:', JSON.stringify(gamesArr), 'Candidates:', candidates.map(c => c.game_id));
    return ruleFallback(userId, language, started, 'too_few_valid_items');
  }

  const result: DailyPlanResult = {
    plan,
    summary: summaryCheck.cleaned,
    generated_at: new Date().toISOString(),
    source: 'llm',
    language,
    model: usedModel,
    latency_ms: Date.now() - started,
    tokens,
  };

  setCached(userId, language, result);
  return result;
}

/* ─── Context loader ─── */
async function loadContext(userId: string): Promise<DailyPlanContext> {
  /* User's own aggregates */
  const aggRes = await pool.query<{
    total: number;
    sessions_7d: number;
    sessions_today: number;
    avg_acc_7d: number | null;
    last_at: string | null;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL) AS total,
       (SELECT COUNT(*)::int FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL AND ended_at >= NOW() - INTERVAL '7 days') AS sessions_7d,
       (SELECT COUNT(*)::int FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL AND ended_at >= CURRENT_DATE) AS sessions_today,
       (SELECT AVG(accuracy)::float FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL AND ended_at >= NOW() - INTERVAL '7 days') AS avg_acc_7d,
       (SELECT MAX(ended_at) FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL) AS last_at`,
    [userId]
  );
  const row = aggRes.rows[0] ?? null;

  /* Domain strengths/weaknesses */
  const domRes = await pool.query<{ domain_id: string; avg_acc: number }>(
    `SELECT g.domain_id, AVG(s.accuracy)::float AS avg_acc
       FROM sessions s
       JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1 AND s.status='accepted' AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - INTERVAL '30 days'
      GROUP BY g.domain_id
      HAVING COUNT(*) >= 2
      ORDER BY avg_acc DESC`,
    [userId]
  );
  const strengths = domRes.rows.slice(0, 3).map((r) => r.domain_id);
  const weaknesses = domRes.rows.slice(-3).reverse().map((r) => r.domain_id);

  /* Recent engine decisions */
  const decRes = await pool.query<{ reason_code: string; n: number }>(
    `SELECT reason_code, COUNT(*)::int AS n
       FROM engine_decisions
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY reason_code`,
    [userId]
  );
  let promos = 0;
  let demos = 0;
  for (const r of decRes.rows) {
    if (r.reason_code === 'PROMOTE_STABLE') promos += r.n;
    if (r.reason_code === 'DEMOTE_STRUGGLE') demos += r.n;
  }

  const lastAt = row?.last_at ? new Date(row.last_at).getTime() : null;
  const daysSince = lastAt ? Math.floor((Date.now() - lastAt) / 86_400_000) : null;

  const total = row?.total ?? 0;
  const tier: DailyPlanContext['evidence_tier'] =
    total < 5 ? 'calibrating' : total < 20 ? 'provisional' : 'established';

  return {
    total_sessions: total,
    sessions_last_7d: row?.sessions_7d ?? 0,
    sessions_today: row?.sessions_today ?? 0,
    avg_accuracy_last_7d: row?.avg_acc_7d ?? 0,
    days_since_last: daysSince,
    current_streak_days: 0,
    top_strengths: strengths,
    top_weaknesses: weaknesses,
    recent_promotions: promos,
    recent_demotions: demos,
    evidence_tier: tier,
  };
}

/* ─── Candidate loader ─── */
async function loadCandidates(userId: string): Promise<DailyPlanCandidate[]> {
  /* Pick top games by weakness + freshness */
  const res = await pool.query<{
    game_id: string;
    game_name: string;
    domain_id: string;
    avg_acc: number | null;
    plays: number;
    last_played: string | null;
    current_level: number | null;
  }>(
    `SELECT g.id AS game_id, g.name AS game_name, g.domain_id,
            AVG(s.accuracy)::float AS avg_acc,
            COUNT(s.id)::int AS plays,
            MAX(s.ended_at) AS last_played,
            MAX(pga.current_level)::int AS current_level
       FROM games g
       LEFT JOIN sessions s
         ON s.game_id = g.id
        AND s.user_id = $1
        AND s.status='accepted'
        AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - INTERVAL '30 days'
       LEFT JOIN player_game_ability pga
         ON pga.game_id = g.id AND pga.user_id = $1
      WHERE g.status = 'ready'
      GROUP BY g.id, g.name, g.domain_id
      ORDER BY g.domain_id, g.name`,
    [userId]
  );

  const now = Date.now();
  const candidates: DailyPlanCandidate[] = [];

  for (const r of res.rows) {
    /* Skip games played today */
    if (r.last_played && new Date(r.last_played).toDateString() === new Date().toDateString()) {
      continue;
    }
    const avgAcc = r.avg_acc ?? 0;
    const playedRecently = r.last_played
      ? now - new Date(r.last_played).getTime() < 3 * 86_400_000
      : false;
    const level = r.current_level ?? 3;

    let reason: string;
    if (r.plays === 0) {
      reason = 'never played - good for variety';
    } else if (avgAcc < 70) {
      reason = `low accuracy (${Math.round(avgAcc)}%) - needs work`;
    } else if (!playedRecently && r.plays > 0) {
      reason = 'not played recently - keep it fresh';
    } else {
      reason = `solid at level ${level}`;
    }

    candidates.push({
      game_id: r.game_id,
      game_name: r.game_name,
      domain_id: r.domain_id,
      mode: 'classic',
      suggested_minutes: r.plays === 0 ? 3 : 4,
      current_level: level,
      rule_reason: reason,
    });
  }

  /* Sort: never-played first, then low-accuracy, then rest */
  candidates.sort((a, b) => {
    const aNew = a.rule_reason.includes('never played') ? 0 : 1;
    const bNew = b.rule_reason.includes('never played') ? 0 : 1;
    if (aNew !== bNew) return aNew - bNew;
    const aLow = a.rule_reason.includes('low accuracy') ? 0 : 1;
    const bLow = b.rule_reason.includes('low accuracy') ? 0 : 1;
    return aLow - bLow;
  });

  return candidates.slice(0, 10);
}

/* ─── Rule-based fallback (uses existing planner) ─── */
async function ruleFallback(
  userId: string,
  language: Lang,
  startedAt: number,
  reason: string
): Promise<DailyPlanResult> {
  const fallbackPlan: DailyPlanItem[] = [];
  try {
    /* Reuse existing planner via dynamic import to avoid cycle */
    const mod = await import('../planner.js');
    const plan = await mod.buildDailyPlan(userId);
    for (const s of plan.sessions.slice(0, 4)) {
      fallbackPlan.push({
        game_id: s.game_id,
        game_name: s.game_name,
        domain_id: '',
        mode: s.mode,
        minutes: s.estimated_minutes,
        reason: s.reason,
      });
    }
  } catch {
    /* ignore */
  }

  const summary =
    language === 'ar'
      ? 'خطة بسيطة مبنية على بياناتك. ابدأ بجلسة واحدة وقسّم الباقي على اليوم.'
      : 'A simple plan based on your data. Start with one session and spread the rest across the day.';

  return {
    plan: fallbackPlan,
    summary,
    generated_at: new Date().toISOString(),
    source: 'rule',
    language,
    model: 'fallback/planner',
    latency_ms: Date.now() - startedAt,
    validation_issues: reason ? [{ code: reason, detail: 'fell back to rule-based' }] : undefined,
  };
}