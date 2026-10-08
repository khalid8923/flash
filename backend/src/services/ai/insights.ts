/* ═══════════════════════════════════════════════════════════
   Weekly Insights Service
   Flow: load 7-day facts -> compare to previous week -> router -> validate -> fallback
   Rule: ONE insight + ONE next step. LLM phrases, never invents.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import {
  SYSTEM_PROMPT_INSIGHTS_EN,
  SYSTEM_PROMPT_INSIGHTS_AR,
  buildInsightsUserPrompt,
  type WeekFactSheet,
  type Lang,
} from './prompts-insights.js';
import { validateAiText } from './validator.js';

export interface InsightsResult {
  insights: string;
  week_start: string;
  week_end: string;
  stats: {
    sessions: number;
    avg_accuracy: number;
    avg_median_rt_ms: number;
    accuracy_delta: number | null;
    top_domain: string | null;
    weakest_domain: string | null;
    promotions: number;
    demotions: number;
    days_active: number;
  };
  source: 'llm' | 'fallback' | 'no_data';
  language: Lang;
  model: string;
  provider: string;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  validation_issues?: { code: string; detail: string }[];
}

const DAY_MS = 86_400_000;

export async function generateWeeklyInsights(
  userId: string,
  language: Lang = 'en'
): Promise<InsightsResult> {
  const started = Date.now();
  const now = new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now.getTime() - 7 * DAY_MS);
  const prevWeekStart = new Date(now.getTime() - 14 * DAY_MS);

  const sheet = await loadWeekFacts(userId, weekStart, weekEnd, prevWeekStart);

  if (sheet.total_sessions === 0) {
    return {
      insights:
        language === 'ar'
          ? 'مفيش جلسات مسجلة الأسبوع ده. ابدأ بجلسة واحدة لتكوين صورة أوضح لأدائك.'
          : 'No sessions recorded this week. Start with a single session to build a clearer picture.',
      week_start: sheet.week_start,
      week_end: sheet.week_end,
      stats: {
        sessions: 0, avg_accuracy: 0, avg_median_rt_ms: 0, accuracy_delta: null,
        top_domain: null, weakest_domain: null, promotions: 0, demotions: 0, days_active: 0,
      },
      source: 'no_data',
      language,
      model: 'none',
      provider: 'none',
      latency_ms: Date.now() - started,
    };
  }

  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_INSIGHTS_AR : SYSTEM_PROMPT_INSIGHTS_EN;
  const userPrompt = buildInsightsUserPrompt(sheet, language);

  let llmText = '';
  let tokens: InsightsResult['tokens'];
  let usedModel = '';
  let usedProvider = '';

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.55, max_tokens: 600, language }
    );
    llmText = res.content;
    usedModel = res.model;
    usedProvider = res.provider;
    tokens = {
      prompt: res.usage.prompt_tokens,
      completion: res.usage.completion_tokens,
      total: res.usage.total_tokens,
    };
    console.error('[insights] provider=' + usedProvider, '| model=' + usedModel, '| chain=' + res.fallback_chain.join('>'));
  } catch (err) {
    console.error('[insights] all providers failed:', (err as Error).message);
    return buildFallback(sheet, language, started, undefined, usedModel, usedProvider);
  }

  const check = validateAiText(llmText, { minLen: 40, maxLen: 1500 });
  if (!check.ok) {
    console.error('[insights] validation failed:', JSON.stringify(check.issues));
    return buildFallback(sheet, language, started, check.issues, usedModel, usedProvider);
  }

  return {
    insights: check.cleaned,
    week_start: sheet.week_start,
    week_end: sheet.week_end,
    stats: toStats(sheet),
    source: 'llm',
    language,
    model: usedModel,
    provider: usedProvider,
    latency_ms: Date.now() - started,
    tokens,
  };
}

/* --- Fact loading (same as before) --- */
async function loadWeekFacts(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  prevWeekStart: Date
): Promise<WeekFactSheet> {
  const weekStartISO = weekStart.toISOString();
  const weekEndISO = weekEnd.toISOString();
  const prevWeekStartISO = prevWeekStart.toISOString();

  const aggRes = await pool.query<{
    total: number; trials: number; avg_acc: number | null; avg_rt: number | null; days_active: number;
  }>(
    `SELECT COUNT(*)::int AS total,
            COALESCE(SUM(n_trials), 0)::int AS trials,
            AVG(accuracy)::float AS avg_acc,
            AVG(median_rt_ms)::float AS avg_rt,
            COUNT(DISTINCT DATE(ended_at))::int AS days_active
       FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL
        AND ended_at >= $2 AND ended_at < $3`,
    [userId, weekStartISO, weekEndISO]
  );
  const agg = aggRes.rows[0] ?? { total: 0, trials: 0, avg_acc: null, avg_rt: null, days_active: 0 };

  const prevRes = await pool.query<{ total: number; avg_acc: number | null }>(
    `SELECT COUNT(*)::int AS total, AVG(accuracy)::float AS avg_acc
       FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL
        AND ended_at >= $2 AND ended_at < $3`,
    [userId, prevWeekStartISO, weekStartISO]
  );
  const prev = prevRes.rows[0] ?? { total: 0, avg_acc: null };

  const domRes = await pool.query<{ domain_id: string; avg_acc: number; n: number }>(
    `SELECT g.domain_id, AVG(s.accuracy)::float AS avg_acc, COUNT(*)::int AS n
       FROM sessions s JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1 AND s.status = 'accepted' AND s.deleted_at IS NULL
        AND s.ended_at >= $2 AND s.ended_at < $3
      GROUP BY g.domain_id HAVING COUNT(*) >= 1 ORDER BY avg_acc DESC`,
    [userId, weekStartISO, weekEndISO]
  );
  const topDom = domRes.rows[0] ?? null;
  const lastDom = domRes.rows[domRes.rows.length - 1] ?? null;
  const weakDom = topDom && lastDom && topDom.domain_id === lastDom.domain_id ? null : lastDom;

  const gameRes = await pool.query<{ game_id: string; n: number }>(
    `SELECT game_id, COUNT(*)::int AS n
       FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL
        AND ended_at >= $2 AND ended_at < $3
      GROUP BY game_id ORDER BY n DESC LIMIT 1`,
    [userId, weekStartISO, weekEndISO]
  );
  const topGame = gameRes.rows[0]?.game_id ?? null;

  const uniqRes = await pool.query<{ n: number }>(
    `SELECT COUNT(DISTINCT game_id)::int AS n
       FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL
        AND ended_at >= $2 AND ended_at < $3`,
    [userId, weekStartISO, weekEndISO]
  );

  const decRes = await pool.query<{ reason_code: string; n: number }>(
    `SELECT reason_code, COUNT(*)::int AS n
       FROM engine_decisions
      WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
      GROUP BY reason_code`,
    [userId, weekStartISO, weekEndISO]
  );
  let promotions = 0;
  let demotions = 0;
  for (const row of decRes.rows) {
    if (row.reason_code === 'PROMOTE_STABLE') promotions += row.n;
    if (row.reason_code === 'DEMOTE_STRUGGLE') demotions += row.n;
  }

  const totalEver = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL`,
    [userId]
  );
  const everCount = totalEver.rows[0]?.n ?? 0;
  const tier: WeekFactSheet['evidence_tier'] =
    everCount < 5 ? 'calibrating' : everCount < 20 ? 'provisional' : 'established';

  const avgAcc = agg.avg_acc ?? 0;
  const prevAcc = prev.avg_acc;
  const delta = prevAcc === null || prev.total === 0 ? null : avgAcc - prevAcc;

  return {
    week_start: weekStartISO.slice(0, 10),
    week_end: weekEndISO.slice(0, 10),
    total_sessions: agg.total,
    total_trials: agg.trials,
    avg_accuracy: avgAcc,
    avg_median_rt_ms: agg.avg_rt ?? 0,
    prev_week_sessions: prev.total,
    prev_week_avg_accuracy: prevAcc,
    accuracy_delta: delta,
    top_domain: topDom?.domain_id ?? null,
    top_domain_accuracy: topDom?.avg_acc ?? null,
    weakest_domain: weakDom?.domain_id ?? null,
    weakest_domain_accuracy: weakDom?.avg_acc ?? null,
    most_practiced_game: topGame,
    unique_games_played: uniqRes.rows[0]?.n ?? 0,
    days_active: agg.days_active,
    promotions,
    demotions,
    current_streak_days: 0,
    evidence_tier: tier,
  };
}

function toStats(s: WeekFactSheet): InsightsResult['stats'] {
  return {
    sessions: s.total_sessions,
    avg_accuracy: Math.round(s.avg_accuracy * 10) / 10,
    avg_median_rt_ms: Math.round(s.avg_median_rt_ms),
    accuracy_delta: s.accuracy_delta === null ? null : Math.round(s.accuracy_delta * 10) / 10,
    top_domain: s.top_domain,
    weakest_domain: s.weakest_domain,
    promotions: s.promotions,
    demotions: s.demotions,
    days_active: s.days_active,
  };
}

/* --- Fallback --- */
function buildFallback(
  sheet: WeekFactSheet,
  language: Lang,
  startedAt: number,
  issues?: { code: string; detail: string }[],
  usedModel = 'fallback/template',
  usedProvider = 'none'
): InsightsResult {
  const sessions = sheet.total_sessions;
  const acc = Math.round(sheet.avg_accuracy);
  const trend = sheet.accuracy_delta;
  const top = sheet.top_domain ?? '-';
  const weak = sheet.weakest_domain ?? '-';
  const hasWeak = weak !== '-';

  let text: string;
  if (language === 'ar') {
    const trendTxt =
      trend === null ? 'مفيش بيانات أسبوع سابق للمقارنة.'
      : trend >= 0 ? `الدقة ارتفعت ${Math.abs(trend).toFixed(1)} نقطة عن الأسبوع الماضي.`
      : `الدقة انخفضت ${Math.abs(trend).toFixed(1)} نقطة عن الأسبوع الماضي.`;
    const weakTxt = hasWeak
      ? `أقوى مجال: ${top}، وأضعف مجال: ${weak}. الخطوة الجاية: ركّز على ${weak} في الجلسات القادمة.`
      : `المجال الوحيد اللي لعبته: ${top}. الخطوة الجاية: جرّب مجال تاني لتوسيع التدريب.`;
    text = `لعبت ${sessions} جلسة بمتوسط دقة ${acc}%. ${trendTxt} ${weakTxt}`;
  } else {
    const trendTxt =
      trend === null ? 'No previous week data to compare.'
      : trend >= 0 ? `Accuracy is up ${Math.abs(trend).toFixed(1)} points from last week.`
      : `Accuracy is down ${Math.abs(trend).toFixed(1)} points from last week.`;
    const weakTxt = hasWeak
      ? `Strongest domain: ${top}. Weakest: ${weak}. Next step: focus on ${weak} to close the gap.`
      : `Only domain played: ${top}. Next step: try a different domain to broaden your training.`;
    text = `You logged ${sessions} sessions at ${acc}% average accuracy. ${trendTxt} ${weakTxt}`;
  }

  return {
    insights: text,
    week_start: sheet.week_start,
    week_end: sheet.week_end,
    stats: toStats(sheet),
    source: 'fallback',
    language,
    model: usedModel,
    provider: usedProvider,
    latency_ms: Date.now() - startedAt,
    validation_issues: issues,
  };
}