/* ═══════════════════════════════════════════════════════════
   Director Mode — Decider
   Handles: initial script, between-round decisions, final summary.
   Uses router with rule-based prefilter to save tokens.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../../config/db.js';
import { routeChat } from '../router.js';
import { validateAiText } from '../validator.js';
import {
  SYSTEM_PROMPT_SCRIPT_EN,
  SYSTEM_PROMPT_SCRIPT_AR,
  SYSTEM_PROMPT_DECISION_EN,
  SYSTEM_PROMPT_DECISION_AR,
  SYSTEM_PROMPT_FINAL_EN,
  SYSTEM_PROMPT_FINAL_AR,
  buildScriptPrompt,
  buildDecisionPrompt,
  buildFinalPrompt,
  type ScriptCandidate,
} from './prompts.js';
import type {
  Lang,
  DirectorScript,
  DirectorRound,
  DirectorDecision,
  DirectorCheckpoint,
  DirectorContext,
} from './types.js';

/* ═══════════════════════════════════════════════════════════
   Robust JSON extraction
   ═══════════════════════════════════════════════════════════ */
function extractJson<T>(text: string): T | null {
  const candidates: string[] = [];
  candidates.push(text.trim());
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) candidates.push(fenceMatch[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  for (const c of candidates) {
    if (!c) continue;
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as T;
    } catch { /* try next */ }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════
   Context loader (reuses data from other services)
   ═══════════════════════════════════════════════════════════ */
export async function loadDirectorContext(userId: string): Promise<DirectorContext> {
  const statsRes = await pool.query<{
    total: number;
    avg_7d: number | null;
    last_at: string | null;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL) AS total,
       (SELECT AVG(accuracy)::float FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL AND ended_at >= NOW() - INTERVAL '7 days') AS avg_7d,
       (SELECT MAX(ended_at) FROM sessions WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL) AS last_at`,
    [userId]
  );
  const s = statsRes.rows[0] ?? null;

  /* Domain strengths / weaknesses */
  const domRes = await pool.query<{ domain_id: string; avg_acc: number }>(
    `SELECT domain_id, AVG(accuracy)::float AS avg_acc
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= NOW() - INTERVAL '30 days'
      GROUP BY domain_id
      HAVING COUNT(*) >= 2
      ORDER BY avg_acc DESC`,
    [userId]
  );
  const strengths = domRes.rows.slice(0, 3).map((r) => r.domain_id);
  const weaknesses = domRes.rows.slice(-3).reverse().map((r) => r.domain_id);

  const total = s?.total ?? 0;
  const lastAt = s?.last_at ? new Date(s.last_at).getTime() : null;
  const daysSince = lastAt ? Math.floor((Date.now() - lastAt) / 86_400_000) : null;

  const tier: DirectorContext['evidence_tier'] =
    total < 5 ? 'calibrating' : total < 20 ? 'provisional' : 'established';

  return {
    total_sessions: total,
    avg_accuracy_7d: s?.avg_7d ?? 0,
    days_since_last: daysSince,
    top_strengths: strengths,
    top_weaknesses: weaknesses,
    evidence_tier: tier,
    rounds_completed: 0,
    rounds_planned: 0,
    session_duration_ms: 0,
    session_avg_accuracy: 0,
    last_round_accuracy: 0,
    last_round_rt_ms: 0,
    consecutive_low_rounds: 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   Candidate loader (same pattern as daily-plan)
   ═══════════════════════════════════════════════════════════ */
export async function loadScriptCandidates(userId: string): Promise<ScriptCandidate[]> {
  const res = await pool.query<{
    game_id: string;
    game_name: string;
    domain_id: string;
    avg_acc: number | null;
    plays: number;
    current_level: number | null;
  }>(
    `SELECT g.id AS game_id, g.name AS game_name, g.domain_id,
            AVG(s.accuracy)::float AS avg_acc,
            COUNT(s.id)::int AS plays,
            MAX(pga.current_level)::int AS current_level
       FROM games g
       LEFT JOIN sessions s
         ON s.game_id = g.id AND s.user_id = $1
        AND s.status='accepted' AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - INTERVAL '30 days'
       LEFT JOIN player_game_ability pga
         ON pga.game_id = g.id AND pga.user_id = $1
      WHERE g.status = 'ready'
      GROUP BY g.id, g.name, g.domain_id
      ORDER BY g.domain_id, g.name`,
    [userId]
  );

  const candidates: ScriptCandidate[] = [];
  for (const r of res.rows) {
    const avgAcc = r.avg_acc ?? 0;
    const level = r.current_level ?? 3;
    let reason: string;
    if (r.plays === 0) reason = 'never played - good variety';
    else if (avgAcc < 70) reason = `low accuracy (${Math.round(avgAcc)}%)`;
    else if (avgAcc >= 85) reason = `strong (${Math.round(avgAcc)}%)`;
    else reason = `solid at level ${level}`;

    candidates.push({
      game_id: r.game_id,
      game_name: r.game_name,
      domain_id: r.domain_id,
      current_level: level,
      rule_reason: reason,
    });
  }

  /* Sort: weaknesses first */
  candidates.sort((a, b) => {
    const aLow = a.rule_reason.includes('low accuracy') ? 0 : 1;
    const bLow = b.rule_reason.includes('low accuracy') ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;
    const aNew = a.rule_reason.includes('never played') ? 0 : 1;
    const bNew = b.rule_reason.includes('never played') ? 0 : 1;
    return aNew - bNew;
  });

  return candidates.slice(0, 12);
}

/* ═══════════════════════════════════════════════════════════
   Rule-based fallback script (no LLM)
   ═══════════════════════════════════════════════════════════ */
export function buildFallbackScript(
  candidates: ScriptCandidate[],
  ctx: DirectorContext,
  lang: Lang
): DirectorScript {
  const rounds: DirectorRound[] = [];
  const weak = ctx.top_weaknesses[0] ?? null;

  /* Round 1: warmup */
  const warmup = candidates[0];
  if (warmup) {
    rounds.push({
      round_number: 1,
      game_id: warmup.game_id,
      game_name: warmup.game_name,
      domain_id: warmup.domain_id,
      mode: 'warmup',
      target_level: Math.max(1, warmup.current_level - 1),
      estimated_minutes: 2,
      reason: lang === 'ar' ? 'تسخين خفيف' : 'Light warmup',
    });
  }

  /* Rounds 2-4: main (prefer weak domain) */
  const main = weak
    ? candidates.filter((c) => c.domain_id === weak).slice(0, 3)
    : candidates.slice(1, 4);
  for (let i = 0; i < main.length; i++) {
    const c = main[i];
    if (!c) continue;
    rounds.push({
      round_number: rounds.length + 1,
      game_id: c.game_id,
      game_name: c.game_name,
      domain_id: c.domain_id,
      mode: 'train',
      target_level: c.current_level,
      estimated_minutes: 3,
      reason: lang === 'ar' ? `تركيز على ${weak ?? c.domain_id}` : `Focus on ${weak ?? c.domain_id}`,
    });
  }

  /* Last round: light finish */
  const finish = candidates.find((c) => !rounds.some((r) => r.game_id === c.game_id));
  if (finish) {
    rounds.push({
      round_number: rounds.length + 1,
      game_id: finish.game_id,
      game_name: finish.game_name,
      domain_id: finish.domain_id,
      mode: 'challenge',
      target_level: finish.current_level,
      estimated_minutes: 2,
      reason: lang === 'ar' ? 'تنويع ختامي' : 'Variety finish',
    });
  }

  const total = rounds.reduce((sum, r) => sum + r.estimated_minutes, 0);

  return {
    version: 1,
    rounds: rounds.slice(0, 5),
    rationale: lang === 'ar'
      ? `جلسة ${total} دقيقة موزعة بين تسخين، تركيز على الضعف، وتنويع.`
      : `${total}-minute session: warmup, weakness focus, variety finish.`,
    estimated_minutes: total,
  };
}

/* ═══════════════════════════════════════════════════════════
   1. GENERATE INITIAL SCRIPT
   ═══════════════════════════════════════════════════════════ */
export interface ScriptResult {
  script: DirectorScript;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
}

export async function generateScript(
  ctx: DirectorContext,
  candidates: ScriptCandidate[],
  lang: Lang
): Promise<ScriptResult> {
  const started = Date.now();

  if (candidates.length < 3) {
    return {
      script: buildFallbackScript(candidates, ctx, lang),
      source: 'rule',
      provider: 'none',
      model: 'fallback',
      latency_ms: Date.now() - started,
    };
  }

  const systemPrompt = lang === 'ar' ? SYSTEM_PROMPT_SCRIPT_AR : SYSTEM_PROMPT_SCRIPT_EN;
  const userPrompt = buildScriptPrompt(ctx, candidates, lang);

  let raw = '';
  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 1500, language: lang, json_mode: true }
    );
    raw = res.content;
    const parsed = extractJson<{ rounds?: unknown; rationale?: unknown }>(raw);

    if (parsed && Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
      const validIds = new Set(candidates.map((c) => c.game_id));
      const rounds: DirectorRound[] = [];
      for (const r of parsed.rounds as unknown[]) {
        if (!r || typeof r !== 'object') continue;
        const obj = r as Record<string, unknown>;
        const gid = typeof obj.game_id === 'string' ? obj.game_id : '';
        if (!validIds.has(gid)) continue;
        const cand = candidates.find((c) => c.game_id === gid);
        if (!cand) continue;
        const reason = typeof obj.reason === 'string' ? obj.reason.trim() : '';
        const reasonCheck = validateAiText(reason, { minLen: 5, maxLen: 200 });
        if (!reasonCheck.ok) continue;

        const mode = obj.mode as DirectorRound['mode'];
        const modeOk = ['warmup', 'train', 'challenge', 'recovery'].includes(mode);

        rounds.push({
          round_number: rounds.length + 1,
          game_id: gid,
          game_name: cand.game_name,
          domain_id: cand.domain_id,
          mode: modeOk ? mode : 'train',
          target_level: typeof obj.target_level === 'number'
            ? Math.max(1, Math.min(15, Math.round(obj.target_level)))
            : cand.current_level,
          estimated_minutes: typeof obj.estimated_minutes === 'number'
            ? Math.max(1, Math.min(5, Math.round(obj.estimated_minutes)))
            : 3,
          reason: reasonCheck.cleaned,
        });
        if (rounds.length >= 6) break;
      }

      if (rounds.length >= 3) {
        const rationale = typeof parsed.rationale === 'string'
          ? parsed.rationale.trim().slice(0, 400)
          : '';
        const total = rounds.reduce((sum, r) => sum + r.estimated_minutes, 0);

        return {
          script: {
            version: 1,
            rounds,
            rationale: rationale || (lang === 'ar' ? 'خطة متوازنة.' : 'Balanced plan.'),
            estimated_minutes: total,
          },
          source: 'llm',
          provider: res.provider,
          model: res.model,
          latency_ms: Date.now() - started,
          tokens: {
            prompt: res.usage.prompt_tokens,
            completion: res.usage.completion_tokens,
            total: res.usage.total_tokens,
          },
        };
      }
    }
  } catch (err) {
    console.error('[director/script] LLM failed:', (err as Error).message);
  }

  /* Fallback */
  return {
    script: buildFallbackScript(candidates, ctx, lang),
    source: 'rule',
    provider: 'none',
    model: 'fallback',
    latency_ms: Date.now() - started,
  };
}

/* ═══════════════════════════════════════════════════════════
   2. DECISION AFTER ROUND
   ═══════════════════════════════════════════════════════════ */
export interface DecisionResult {
  decision: DirectorDecision;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  latency_ms: number;
}

/* Rule-based pre-checks (fast path) */
function ruleBasedDecision(
  ctx: DirectorContext,
  script: DirectorScript,
  latest: DirectorCheckpoint,
  lang: Lang
): DirectorDecision | null {
  /* End early: session too long */
  if (ctx.session_duration_ms > 20 * 60 * 1000) {
    return {
      action: 'end_early',
      next_round: null,
      reason: lang === 'ar' ? 'الجلسة طويلة - وقت بريك' : 'Session is long - time to rest',
      nudge: null,
      session_progress: 1,
    };
  }

  /* End early: repeated failures */
  if (ctx.consecutive_low_rounds >= 2) {
    return {
      action: 'end_early',
      next_round: null,
      reason: lang === 'ar' ? 'جولتين ضعيفتين - خد بريك' : 'Two weak rounds - take a break',
      nudge: lang === 'ar' ? 'وقفة قصيرة' : 'Short break',
      session_progress: 1,
    };
  }

  /* Adjust: one bad round */
  if (latest.accuracy < 50 && ctx.rounds_completed < ctx.rounds_planned) {
    const next = script.rounds[ctx.rounds_completed];
    if (next) {
      const adjusted: DirectorRound = {
        ...next,
        target_level: Math.max(1, next.target_level - 1),
        mode: 'recovery',
        reason: lang === 'ar'
          ? 'تخفيف بعد جولة صعبة'
          : 'Easing after a tough round',
      };
      return {
        action: 'adjust',
        next_round: adjusted,
        reason: lang === 'ar' ? 'تخفيف بسيط' : 'Light adjustment',
        nudge: lang === 'ar' ? 'اهدأ' : 'Slow down',
        session_progress: ctx.rounds_completed / ctx.rounds_planned,
      };
    }
  }

  return null; /* fall through to LLM */
}

export async function decideNextRound(
  ctx: DirectorContext,
  script: DirectorScript,
  latest: DirectorCheckpoint,
  lang: Lang
): Promise<DecisionResult> {
  const started = Date.now();

  /* Rule-based fast path */
  const quick = ruleBasedDecision(ctx, script, latest, lang);
  if (quick) {
    return {
      decision: quick,
      source: 'rule',
      provider: 'none',
      model: 'rule',
      latency_ms: Date.now() - started,
    };
  }

  /* LLM path */
  const systemPrompt = lang === 'ar' ? SYSTEM_PROMPT_DECISION_AR : SYSTEM_PROMPT_DECISION_EN;
  const userPrompt = buildDecisionPrompt(ctx, script, latest, lang);

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, max_tokens: 800, language: lang, json_mode: true }
    );

    const parsed = extractJson<{
      action?: string;
      next_round?: unknown;
      reason?: string;
      nudge?: string | null;
      session_progress?: number;
    }>(res.content);

    if (parsed) {
      const action = parsed.action as DirectorDecision['action'];
      const valid = ['continue', 'adjust', 'end_early'].includes(action);

      if (valid) {
        let nextRound: DirectorRound | null = null;
        if (parsed.next_round && typeof parsed.next_round === 'object') {
          const nr = parsed.next_round as Record<string, unknown>;
          const gid = typeof nr.game_id === 'string' ? nr.game_id : '';
          const planned = script.rounds.find((r) => r.game_id === gid);
          if (planned) {
            nextRound = {
              ...planned,
              target_level: typeof nr.target_level === 'number'
                ? Math.max(1, Math.min(15, Math.round(nr.target_level)))
                : planned.target_level,
            };
          }
        }

        if (action === 'continue' && !nextRound) {
          const planned = script.rounds[ctx.rounds_completed];
          if (planned) nextRound = planned;
        }

        const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
        const reasonCheck = validateAiText(reason, { minLen: 3, maxLen: 200 });

        return {
          decision: {
            action,
            next_round: nextRound,
            reason: reasonCheck.ok ? reasonCheck.cleaned : 'continuing as planned',
            nudge: typeof parsed.nudge === 'string' && parsed.nudge.trim().length > 0
              ? parsed.nudge.trim().slice(0, 120)
              : null,
            session_progress: typeof parsed.session_progress === 'number'
              ? Math.max(0, Math.min(1, parsed.session_progress))
              : ctx.rounds_completed / Math.max(1, ctx.rounds_planned),
          },
          source: 'llm',
          provider: res.provider,
          model: res.model,
          latency_ms: Date.now() - started,
        };
      }
    }
  } catch (err) {
    console.error('[director/decision] LLM failed:', (err as Error).message);
  }

  /* Rule fallback: continue as planned */
  const planned = script.rounds[ctx.rounds_completed];
  return {
    decision: {
      action: planned ? 'continue' : 'end_early',
      next_round: planned ?? null,
      reason: lang === 'ar' ? 'المسار حسب الخطة' : 'On track with plan',
      nudge: null,
      session_progress: ctx.rounds_completed / Math.max(1, ctx.rounds_planned),
    },
    source: 'rule',
    provider: 'none',
    model: 'rule',
    latency_ms: Date.now() - started,
  };
}

/* ═══════════════════════════════════════════════════════════
   3. FINAL SUMMARY
   ═══════════════════════════════════════════════════════════ */
export interface FinalSummaryResult {
  final_script: string;
  highlights: string[];
  next_recommendation: string;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  latency_ms: number;
}

function fallbackFinal(
  ctx: DirectorContext,
  checkpoints: DirectorCheckpoint[],
  lang: Lang
): { final_script: string; highlights: string[]; next_recommendation: string } {
  const rounds = checkpoints.length;
  const acc = Math.round(ctx.session_avg_accuracy);
  if (lang === 'ar') {
    return {
      final_script: `خلصت ${rounds} جولات بمتوسط دقة ${acc}%.`,
      highlights: [`${rounds} جولات`, `متوسط دقة ${acc}%`],
      next_recommendation: 'كمّل بكرة بجلسة قصيرة.',
    };
  }
  return {
    final_script: `Completed ${rounds} rounds with ${acc}% average accuracy.`,
    highlights: [`${rounds} rounds`, `${acc}% accuracy`],
    next_recommendation: 'Continue tomorrow with a short session.',
  };
}

export async function generateFinalSummary(
  ctx: DirectorContext,
  script: DirectorScript,
  checkpoints: DirectorCheckpoint[],
  lang: Lang
): Promise<FinalSummaryResult> {
  const started = Date.now();

  const systemPrompt = lang === 'ar' ? SYSTEM_PROMPT_FINAL_AR : SYSTEM_PROMPT_FINAL_EN;
  const userPrompt = buildFinalPrompt(ctx, script, checkpoints, lang);

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 700, language: lang, json_mode: true }
    );

    const parsed = extractJson<{
      final_script?: string;
      highlights?: unknown;
      next_recommendation?: string;
    }>(res.content);

    if (parsed) {
      const fs = typeof parsed.final_script === 'string' ? parsed.final_script.trim() : '';
      const check = validateAiText(fs, { minLen: 30, maxLen: 1500 });
      const highlights = Array.isArray(parsed.highlights)
        ? (parsed.highlights as unknown[])
            .filter((h): h is string => typeof h === 'string')
            .slice(0, 4)
            .map((h) => h.trim().slice(0, 120))
        : [];
      const next = typeof parsed.next_recommendation === 'string'
        ? parsed.next_recommendation.trim().slice(0, 200)
        : '';

      if (check.ok && highlights.length > 0) {
        return {
          final_script: check.cleaned,
          highlights,
          next_recommendation: next || (lang === 'ar' ? 'كمّل بكرة.' : 'Come back tomorrow.'),
          source: 'llm',
          provider: res.provider,
          model: res.model,
          latency_ms: Date.now() - started,
        };
      }
    }
  } catch (err) {
    console.error('[director/final] LLM failed:', (err as Error).message);
  }

  const fb = fallbackFinal(ctx, checkpoints, lang);
  return {
    ...fb,
    source: 'rule',
    provider: 'none',
    model: 'rule',
    latency_ms: Date.now() - started,
  };
}