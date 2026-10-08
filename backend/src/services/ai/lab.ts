/* ═══════════════════════════════════════════════════════════
   AI Lab Service
   User-driven experiments with baseline/result comparison.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  EXPERIMENT_TEMPLATES,
  SYSTEM_PROMPT_LAB_RESULT_EN,
  SYSTEM_PROMPT_LAB_RESULT_AR,
  buildLabResultPrompt,
  templateTitle,
  templateHypothesis,
  templateDescription,
  type ExperimentTemplate,
  type LabResultContext,
  type Lang,
} from './prompts-lab.js';

/* ─── Public types ─── */
export interface LabSuggestion {
  key: string;
  title: string;
  hypothesis: string;
  description: string;
  duration_days: number;
  eligible: boolean;
  ineligible_reason?: string;
}

export interface LabCurrent {
  experiment_id: string;
  experiment_key: string;
  title: string;
  hypothesis: string;
  description: string;
  duration_days: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  days_elapsed: number;
  sessions_completed: number;
  sessions_required: number;
  progress_pct: number;
  baseline_accuracy: number | null;
  current_accuracy: number | null;
  delta: number | null;
  result_summary: string | null;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min for suggestions
const suggestionCache = new Map<string, { ts: number; items: LabSuggestion[] }>();

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
async function getUserSessionCount(userId: string): Promise<number> {
  const r = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
    [userId]
  );
  return r.rows[0]?.n ?? 0;
}

async function getBaselineAccuracy(userId: string, beforeDays: number): Promise<number> {
  const r = await pool.query<{ avg: number | null }>(
    `SELECT AVG(accuracy)::float AS avg
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= NOW() - ($2 || ' days')::interval
        AND ended_at < NOW()`,
    [userId, String(beforeDays)]
  );
  return r.rows[0]?.avg ?? 0;
}

async function getAccuracySince(userId: string, sinceISO: string): Promise<{
  avg: number;
  sessions: number;
  days: number;
}> {
  const r = await pool.query<{ avg: number | null; n: number; days: number }>(
    `SELECT AVG(accuracy)::float AS avg,
            COUNT(*)::int AS n,
            COUNT(DISTINCT DATE(ended_at))::int AS days
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= $2`,
    [userId, sinceISO]
  );
  const row = r.rows[0];
  return {
    avg: row?.avg ?? 0,
    sessions: row?.n ?? 0,
    days: row?.days ?? 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   SUGGESTIONS
   ═══════════════════════════════════════════════════════════ */
export async function getLabSuggestions(
  userId: string,
  lang: Lang
): Promise<LabSuggestion[]> {
  const cacheKey = `${userId}:${lang}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.items;
  }

  const sessionCount = await getUserSessionCount(userId);

  const items: LabSuggestion[] = EXPERIMENT_TEMPLATES.map((t) => {
    const eligible = sessionCount >= t.min_prior_sessions;
    const reason = eligible
      ? undefined
      : lang === 'ar'
        ? `محتاج ${t.min_prior_sessions} جلسات على الأقل (عندك ${sessionCount})`
        : `Need at least ${t.min_prior_sessions} sessions (you have ${sessionCount})`;
    return {
      key: t.key,
      title: templateTitle(t, lang),
      hypothesis: templateHypothesis(t, lang),
      description: templateDescription(t, lang),
      duration_days: t.duration_days,
      eligible,
      ineligible_reason: reason,
    };
  });

  suggestionCache.set(cacheKey, { ts: Date.now(), items });
  return items;
}

/* ═══════════════════════════════════════════════════════════
   START
   ═══════════════════════════════════════════════════════════ */
export async function startLabExperiment(
  userId: string,
  experimentKey: string,
  lang: Lang
): Promise<LabCurrent> {
  const template = EXPERIMENT_TEMPLATES.find((t) => t.key === experimentKey);
  if (!template) throw new Error('unknown_experiment');

  /* Only one active at a time */
  const active = await pool.query<{ id: string }>(
    `SELECT id FROM lab_experiments
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1`,
    [userId]
  );
  if (active.rowCount && active.rowCount > 0) {
    throw new Error('experiment_already_active');
  }

  /* Check eligibility */
  const sessionCount = await getUserSessionCount(userId);
  if (sessionCount < template.min_prior_sessions) {
    throw new Error('not_enough_sessions');
  }

  /* Baseline: average accuracy over the last 14 days */
  const baseline = await getBaselineAccuracy(userId, 14);

  /* Insert */
  const res = await pool.query<{
    id: string;
    started_at: string;
  }>(
    `INSERT INTO lab_experiments
       (user_id, experiment_key, title, hypothesis, protocol, status, baseline_metric)
     VALUES ($1, $2, $3, $4, $5, 'active', $6)
     RETURNING id, started_at`,
    [
      userId,
      template.key,
      templateTitle(template, lang),
      templateHypothesis(template, lang),
      JSON.stringify(template.protocol),
      baseline,
    ]
  );

  const row = res.rows[0];
  if (!row) throw new Error('lab_insert_failed');

  return {
    experiment_id: row.id,
    experiment_key: template.key,
    title: templateTitle(template, lang),
    hypothesis: templateHypothesis(template, lang),
    description: templateDescription(template, lang),
    duration_days: template.duration_days,
    status: 'active',
    started_at: row.started_at,
    completed_at: null,
    days_elapsed: 0,
    sessions_completed: 0,
    sessions_required: template.duration_days,
    progress_pct: 0,
    baseline_accuracy: baseline > 0 ? Math.round(baseline * 10) / 10 : null,
    current_accuracy: null,
    delta: null,
    result_summary: null,
  };
}

/* ═══════════════════════════════════════════════════════════
   CURRENT
   ═══════════════════════════════════════════════════════════ */
export async function getCurrentLab(
  userId: string,
  lang: Lang
): Promise<LabCurrent | null> {
  const res = await pool.query<{
    id: string;
    experiment_key: string;
    title: string;
    hypothesis: string;
    protocol: Record<string, unknown>;
    status: string;
    baseline_metric: number | null;
    result_metric: number | null;
    result_summary: string | null;
    started_at: string;
    completed_at: string | null;
  }>(
    `SELECT id, experiment_key, title, hypothesis, protocol, status,
            baseline_metric, result_metric, result_summary,
            started_at, completed_at
       FROM lab_experiments
      WHERE user_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1`,
    [userId]
  );

  const row = res.rows[0];
  if (!row) return null;

  const template = EXPERIMENT_TEMPLATES.find((t) => t.key === row.experiment_key);

  /* Compute current accuracy since started_at */
  const during = await getAccuracySince(userId, row.started_at);
  const startedAt = new Date(row.started_at).getTime();
  const daysElapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 86_400_000));

  const baseline = row.baseline_metric ?? 0;
  const current = during.avg > 0 ? during.avg : null;
  const delta = current !== null ? current - baseline : null;

  const required = template?.duration_days ?? 7;
  const progress = Math.min(100, Math.round((daysElapsed / required) * 100));

  return {
    experiment_id: row.id,
    experiment_key: row.experiment_key,
    title: row.title,
    hypothesis: row.hypothesis,
    description: template ? templateDescription(template, lang) : '',
    duration_days: required,
    status: (row.status as LabCurrent['status']) ?? 'active',
    started_at: row.started_at,
    completed_at: row.completed_at,
    days_elapsed: daysElapsed,
    sessions_completed: during.sessions,
    sessions_required: required,
    progress_pct: progress,
    baseline_accuracy: baseline > 0 ? Math.round(baseline * 10) / 10 : null,
    current_accuracy: current !== null ? Math.round(current * 10) / 10 : null,
    delta: delta !== null ? Math.round(delta * 10) / 10 : null,
    result_summary: row.result_summary,
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPLETE
   ═══════════════════════════════════════════════════════════ */
export async function completeLabExperiment(
  userId: string,
  lang: Lang
): Promise<LabCurrent> {
  const current = await getCurrentLab(userId, lang);
  if (!current) throw new Error('no_experiment');
  if (current.status !== 'active') throw new Error('experiment_not_active');

  /* Require at least 3 sessions to compute result */
  if (current.sessions_completed < 3) {
    throw new Error('not_enough_sessions_to_complete');
  }

  const baseline = current.baseline_accuracy ?? 0;
  const result = current.current_accuracy ?? 0;
  const delta = result - baseline;

  const template = EXPERIMENT_TEMPLATES.find((t) => t.key === current.experiment_key);
  const protocolFollowed =
    current.sessions_completed >= Math.min(3, current.sessions_required);

  /* LLM phrasing */
  const ctx: LabResultContext = {
    title: current.title,
    hypothesis: current.hypothesis,
    baseline_accuracy: baseline > 0 ? Math.round(baseline * 10) / 10 : null,
    result_accuracy: result,
    delta,
    sessions_completed: current.sessions_completed,
    sessions_required: current.sessions_required,
    days_elapsed: current.days_elapsed,
    protocol_followed: protocolFollowed,
  };

  let summary = '';
  const systemPrompt =
    lang === 'ar' ? SYSTEM_PROMPT_LAB_RESULT_AR : SYSTEM_PROMPT_LAB_RESULT_EN;
  const userPrompt = buildLabResultPrompt(ctx, lang);

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 600, language: lang }
    );
    const check = validateAiText(res.content, { minLen: 50, maxLen: 1200 });
    if (check.ok) {
      summary = check.cleaned;
    }
  } catch (err) {
    console.error('[lab] LLM failed:', (err as Error).message);
  }

  /* Fallback */
  if (!summary) {
    if (lang === 'ar') {
      const verdict =
        delta > 5 ? 'الفرضية اتحققت' : delta < -5 ? 'الفرضية اترفضت' : 'النتيجة غير حاسمة';
      summary = `خلصت التجربة بـ ${current.sessions_completed} جلسات على ${current.days_elapsed} يوم. خط الأساس ${baseline.toFixed(1)}% والنتيجة ${result.toFixed(1)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%). ${verdict}.`;
    } else {
      const verdict =
        delta > 5 ? 'Hypothesis confirmed' : delta < -5 ? 'Hypothesis refuted' : 'Result inconclusive';
      summary = `Completed the experiment with ${current.sessions_completed} sessions over ${current.days_elapsed} days. Baseline ${baseline.toFixed(1)}% vs result ${result.toFixed(1)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%). ${verdict}.`;
    }
  }

  /* Update DB */
  await pool.query(
    `UPDATE lab_experiments
        SET status = 'completed',
            result_metric = $1,
            result_summary = $2,
            completed_at = NOW()
      WHERE id = $3`,
    [result, summary, current.experiment_id]
  );

  const fresh = await getCurrentLab(userId, lang);
  if (!fresh) throw new Error('lab_refresh_failed');
  return fresh;
}

/* ═══════════════════════════════════════════════════════════
   ABANDON
   ═══════════════════════════════════════════════════════════ */
export async function abandonLabExperiment(userId: string): Promise<void> {
  await pool.query(
    `UPDATE lab_experiments
        SET status = 'abandoned',
            completed_at = NOW()
      WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
}

/* ═══════════════════════════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════════════════════════ */
export async function getLabHistory(
  userId: string,
  limit = 10
): Promise<Array<{
  id: string;
  experiment_key: string;
  title: string;
  hypothesis: string;
  status: string;
  baseline_metric: number | null;
  result_metric: number | null;
  result_summary: string | null;
  started_at: string;
  completed_at: string | null;
}>> {
  const res = await pool.query<{
    id: string;
    experiment_key: string;
    title: string;
    hypothesis: string;
    status: string;
    baseline_metric: number | null;
    result_metric: number | null;
    result_summary: string | null;
    started_at: string;
    completed_at: string | null;
  }>(
    `SELECT id, experiment_key, title, hypothesis, status,
            baseline_metric, result_metric, result_summary,
            started_at, completed_at
       FROM lab_experiments
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}