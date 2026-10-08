/* ═══════════════════════════════════════════════════════════
   AI Journal Service
   Mood + energy → personalized plan adjustment
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  SYSTEM_PROMPT_JOURNAL_EN,
  SYSTEM_PROMPT_JOURNAL_AR,
  buildJournalPrompt,
  buildFallbackMessage,
  adjustmentLabel,
  moodLabel,
  pickAdjustment,
  type JournalContext,
  type Mood,
  type PlanAdjustment,
  type Lang,
} from './prompts-journal.js';

/* ─── Public types ─── */
export interface JournalEntry {
  id: string;
  entry_date: string;
  mood: Mood;
  energy: number;
  note: string | null;
  plan_adjusted: boolean;
  created_at: string;
}

export interface JournalToday {
  entry: JournalEntry | null;
  adjustment: PlanAdjustment;
  adjustment_label: string;
  message: string | null;
  base_plan_minutes: number;
  adjusted_plan_minutes: number;
  source: 'llm' | 'rule' | 'none';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
}

export interface JournalHistoryItem {
  entry_date: string;
  mood: Mood;
  mood_label: string;
  energy: number;
  sessions_that_day: number;
  avg_accuracy_that_day: number | null;
}

export interface JournalHistory {
  days: number;
  items: JournalHistoryItem[];
  mood_correlations: Array<{
    mood: Mood;
    mood_label: string;
    avg_accuracy: number;
    sessions_count: number;
    days_count: number;
  }>;
}

const VALID_MOODS: Mood[] = ['calm', 'focused', 'tired', 'stressed', 'energized'];

export function isValidMood(v: unknown): v is Mood {
  return typeof v === 'string' && VALID_MOODS.includes(v as Mood);
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getBasePlanMinutes(userId: string): Promise<number> {
  /* Read from daily-plan service if available; else fall back */
  const res = await pool.query<{ total: number }>(
    `SELECT COALESCE(SUM(n_trials), 0)::int AS total
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= NOW() - INTERVAL '7 days'`,
    [userId]
  );
  /* Simple heuristic: base plan is 8 minutes; may be overridden by caller */
  return 8;
}

function adjustedMinutes(base: number, adj: PlanAdjustment): number {
  switch (adj) {
    case 'lighter':      return Math.round(base * 0.6);
    case 'recovery':     return Math.round(base * 0.4);
    case 'stretch':      return Math.round(base * 1.3);
    case 'warmup_only':  return 3;
    default:             return base;
  }
}

async function getSessionsToday(userId: string): Promise<number> {
  const res = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= CURRENT_DATE`,
    [userId]
  );
  return res.rows[0]?.n ?? 0;
}

async function isReturningAfterGap(userId: string): Promise<boolean> {
  const res = await pool.query<{ days: number | null }>(
    `SELECT DATE_PART('day', NOW() - MAX(ended_at))::int AS days
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
    [userId]
  );
  const days = res.rows[0]?.days;
  return days !== null && days !== undefined && days >= 3;
}

/* ═══════════════════════════════════════════════════════════
   UPSERT TODAY'S ENTRY
   ═══════════════════════════════════════════════════════════ */
export async function upsertTodayEntry(
  userId: string,
  mood: Mood,
  energy: number,
  note: string | null
): Promise<JournalEntry> {
  const date = todayISO();
  const energyClamped = Math.max(1, Math.min(5, Math.round(energy)));
  const safeNote = note ? note.slice(0, 500) : null;

  const res = await pool.query<{
    id: string;
    entry_date: string;
    mood: string;
    energy: number;
    note: string | null;
    plan_adjusted: boolean;
    created_at: string;
  }>(
    `INSERT INTO journal_entries (user_id, entry_date, mood, energy, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, entry_date)
     DO UPDATE SET mood = EXCLUDED.mood,
                   energy = EXCLUDED.energy,
                   note = EXCLUDED.note,
                   created_at = NOW()
     RETURNING id, entry_date::text AS entry_date, mood, energy, note, plan_adjusted, created_at`,
    [userId, date, mood, energyClamped, safeNote]
  );

  const row = res.rows[0];
  if (!row) throw new Error('journal_upsert_failed');

  return {
    id: row.id,
    entry_date: String(row.entry_date).slice(0, 10),
    mood: row.mood as Mood,
    energy: row.energy,
    note: row.note,
    plan_adjusted: row.plan_adjusted,
    created_at: row.created_at,
  };
}

/* ═══════════════════════════════════════════════════════════
   LOAD TODAY'S ENTRY
   ═══════════════════════════════════════════════════════════ */
export async function getTodayEntry(userId: string): Promise<JournalEntry | null> {
  const date = todayISO();
  const res = await pool.query<{
    id: string;
    entry_date: string;
    mood: string;
    energy: number;
    note: string | null;
    plan_adjusted: boolean;
    created_at: string;
  }>(
    `SELECT id, entry_date::text AS entry_date, mood, energy, note, plan_adjusted, created_at
       FROM journal_entries
      WHERE user_id = $1 AND entry_date = $2
      LIMIT 1`,
    [userId, date]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    entry_date: String(row.entry_date).slice(0, 10),
    mood: row.mood as Mood,
    energy: row.energy,
    note: row.note,
    plan_adjusted: row.plan_adjusted,
    created_at: row.created_at,
  };
}

/* ═══════════════════════════════════════════════════════════
   GET TODAY (entry + adjustment + message)
   ═══════════════════════════════════════════════════════════ */
export async function getToday(
  userId: string,
  lang: Lang = 'en'
): Promise<JournalToday> {
  const started = Date.now();
  const entry = await getTodayEntry(userId);

  if (!entry) {
    return {
      entry: null,
      adjustment: 'normal',
      adjustment_label: adjustmentLabel('normal', lang),
      message: null,
      base_plan_minutes: 8,
      adjusted_plan_minutes: 8,
      source: 'none',
      provider: 'none',
      model: 'none',
      language: lang,
      latency_ms: Date.now() - started,
    };
  }

  const sessionsToday = await getSessionsToday(userId);
  const returning = await isReturningAfterGap(userId);
  const basePlan = await getBasePlanMinutes(userId);
  const adjustment = pickAdjustment(entry.mood, entry.energy, sessionsToday);
  const adjustedMin = adjustedMinutes(basePlan, adjustment);

  /* Build context */
  const ctx: JournalContext = {
    mood: entry.mood,
    energy: entry.energy,
    note: entry.note,
    adjustment,
    base_plan_minutes: basePlan,
    adjusted_plan_minutes: adjustedMin,
    session_count_today: sessionsToday,
    is_returning: returning,
  };

  /* LLM phrasing */
  const systemPrompt =
    lang === 'ar' ? SYSTEM_PROMPT_JOURNAL_AR : SYSTEM_PROMPT_JOURNAL_EN;
  const userPrompt = buildJournalPrompt(ctx, lang);

  let message = '';
  let source: JournalToday['source'] = 'llm';
  let provider = '';
  let model = '';

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 500, language: lang }
    );
    const check = validateAiText(res.content, { minLen: 15, maxLen: 400 });
    if (check.ok) {
      message = check.cleaned;
      provider = res.provider;
      model = res.model;
    } else {
      message = buildFallbackMessage(ctx, lang);
      source = 'rule';
      provider = 'none';
      model = 'rule';
    }
  } catch (err) {
    console.error('[journal] LLM failed:', (err as Error).message);
    message = buildFallbackMessage(ctx, lang);
    source = 'rule';
    provider = 'none';
    model = 'rule';
  }

  /* Mark plan_adjusted in DB if adjustment != normal */
  if (adjustment !== 'normal' && !entry.plan_adjusted) {
    try {
      await pool.query(
        `UPDATE journal_entries SET plan_adjusted = true WHERE id = $1`,
        [entry.id]
      );
    } catch (err) {
      console.warn('[journal] update plan_adjusted failed:', (err as Error).message);
    }
  }

  return {
    entry,
    adjustment,
    adjustment_label: adjustmentLabel(adjustment, lang),
    message,
    base_plan_minutes: basePlan,
    adjusted_plan_minutes: adjustedMin,
    source,
    provider,
    model,
    language: lang,
    latency_ms: Date.now() - started,
  };
}

/* ═══════════════════════════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════════════════════════ */
export async function getHistory(
  userId: string,
  days: number,
  lang: Lang = 'en'
): Promise<JournalHistory> {
  const clampedDays = Math.max(1, Math.min(90, Math.floor(days)));

  const res = await pool.query<{
    entry_date: string;
    mood: string;
    energy: number;
    sessions_count: number;
    avg_acc: number | null;
  }>(
    `SELECT j.entry_date::text AS entry_date,
            j.mood,
            j.energy,
            COALESCE(s.sessions_count, 0)::int AS sessions_count,
            s.avg_acc
       FROM journal_entries j
       LEFT JOIN (
         SELECT DATE(ended_at) AS d,
                COUNT(*)::int AS sessions_count,
                AVG(accuracy)::float AS avg_acc
           FROM sessions
          WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
          GROUP BY DATE(ended_at)
       ) s ON s.d = j.entry_date
      WHERE j.user_id = $1
        AND j.entry_date >= CURRENT_DATE - ($2 || ' days')::interval
      ORDER BY j.entry_date DESC`,
    [userId, String(clampedDays)]
  );

  const items: JournalHistoryItem[] = res.rows.map((r) => ({
    entry_date: r.entry_date,
    mood: r.mood as Mood,
    mood_label: moodLabel(r.mood as Mood, lang),
    energy: r.energy,
    sessions_that_day: r.sessions_count,
    avg_accuracy_that_day: r.avg_acc !== null ? Math.round(r.avg_acc * 10) / 10 : null,
  }));

  /* Aggregate accuracy by mood */
  const byMood = new Map<Mood, { total_acc: number; n_sessions: number; n_days: number }>();
  for (const row of res.rows) {
    const m = row.mood as Mood;
    const agg = byMood.get(m) ?? { total_acc: 0, n_sessions: 0, n_days: 0 };
    if (row.avg_acc !== null && row.sessions_count > 0) {
      agg.total_acc += row.avg_acc * row.sessions_count;
      agg.n_sessions += row.sessions_count;
    }
    agg.n_days += 1;
    byMood.set(m, agg);
  }

  const correlations = Array.from(byMood.entries())
    .filter(([, v]) => v.n_sessions > 0)
    .map(([mood, v]) => ({
      mood,
      mood_label: moodLabel(mood, lang),
      avg_accuracy: Math.round((v.total_acc / v.n_sessions) * 10) / 10,
      sessions_count: v.n_sessions,
      days_count: v.n_days,
    }))
    .sort((a, b) => b.avg_accuracy - a.avg_accuracy);

  return {
    days: clampedDays,
    items,
    mood_correlations: correlations,
  };
}

/* ═══════════════════════════════════════════════════════════
   DELETE TODAY
   ═══════════════════════════════════════════════════════════ */
export async function deleteTodayEntry(userId: string): Promise<boolean> {
  const res = await pool.query(
    `DELETE FROM journal_entries
      WHERE user_id = $1 AND entry_date = CURRENT_DATE`,
    [userId]
  );
  return (res.rowCount ?? 0) > 0;
}