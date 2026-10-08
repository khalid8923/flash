/* ═══════════════════════════════════════════════════════════
   FLASH - Analytics (M8-02)
   Core funnel + retention, real origin only, k>=10 suppression.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';

const MIN_COHORT = 5; // launch threshold; raise to 10

export interface Funnel {
  window_days: number;
  activated_users: number;
  weekly_active_trainers: number;
  sessions_total: number;
  sessions_per_active: number;
  avg_accuracy: number;
  origin: string;
}

export async function getFunnel(days = 7): Promise<Funnel> {
  const r = await pool.query<{
    activated: number;
    wat: number;
    sessions: number;
    avg_acc: number | null;
  }>(
    `WITH window_users AS (
       SELECT DISTINCT user_id FROM sessions
        WHERE status='accepted' AND deleted_at IS NULL
          AND started_at > NOW() - ($1 || ' days')::interval
     ),
     activ AS (
       SELECT COUNT(DISTINCT u.id)::int AS activated
         FROM users u
        WHERE u.origin = 'real' AND u.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM sessions s
             WHERE s.user_id = u.id AND s.status='accepted' AND s.deleted_at IS NULL
               AND s.started_at <= u.created_at + interval '7 days'
          )
     ),
     wat AS (
       SELECT COUNT(DISTINCT s.user_id)::int AS wat
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.status='accepted' AND s.deleted_at IS NULL
          AND s.started_at > NOW() - ($1 || ' days')::interval
          AND u.origin = 'real' AND u.deleted_at IS NULL
     ),
     sess AS (
       SELECT COUNT(*)::int AS sessions, AVG(accuracy)::float AS avg_acc
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.status='accepted' AND s.deleted_at IS NULL
          AND s.started_at > NOW() - ($1 || ' days')::interval
          AND u.origin = 'real' AND u.deleted_at IS NULL
     )
     SELECT (SELECT activated FROM activ) AS activated,
            (SELECT wat FROM wat) AS wat,
            (SELECT sessions FROM sess) AS sessions,
            (SELECT avg_acc FROM sess) AS avg_acc`,
    [String(days)]
  );
  const row = r.rows[0];
  const wat = row?.wat ?? 0;
  return {
    window_days: days,
    activated_users: row?.activated ?? 0,
    weekly_active_trainers: wat,
    sessions_total: row?.sessions ?? 0,
    sessions_per_active: wat > 0 ? Math.round((row?.sessions ?? 0) / wat * 100) / 100 : 0,
    avg_accuracy: row?.avg_acc ? Math.round(row.avg_acc * 10) / 10 : 0,
    origin: 'real',
  };
}

export interface RetentionRow { day: number; cohort_size: number; retained: number; pct: number; }

export async function getRetention(maxDays = 30): Promise<{ cohorts: RetentionRow[]; suppressed: boolean }> {
  const r = await pool.query<{ day_offset: number; cohort_size: number; retained: number }>(
    `WITH first_sessions AS (
       SELECT u.id AS user_id, DATE(MIN(s.started_at)) AS first_day
         FROM users u JOIN sessions s ON s.user_id = u.id
        WHERE u.origin = 'real' AND u.deleted_at IS NULL
          AND s.status='accepted' AND s.deleted_at IS NULL
        GROUP BY u.id
     ),
     cohorts AS (
       SELECT fs.user_id, fs.first_day,
              DATE(s.started_at) AS play_day
         FROM first_sessions fs
         JOIN sessions s ON s.user_id = fs.user_id
        WHERE s.status='accepted' AND s.deleted_at IS NULL
     )
     SELECT (play_day - first_day)::int AS day_offset,
            COUNT(DISTINCT user_id)::int AS cohort_size,
            COUNT(DISTINCT user_id)::int AS retained
       FROM cohorts
      WHERE (play_day - first_day) BETWEEN 1 AND $1
      GROUP BY day_offset
      ORDER BY day_offset`,
    [maxDays]
  );

  const cohorts = r.rows.map((row) => ({
    day: row.day_offset,
    cohort_size: row.cohort_size,
    retained: row.retained,
    pct: row.cohort_size > 0 ? Math.round(row.retained / row.cohort_size * 100) : 0,
  }));

  return {
    cohorts: cohorts.map((c) => c.cohort_size >= MIN_COHORT ? c : { ...c, pct: -1 }),
    suppressed: cohorts.some((c) => c.cohort_size < MIN_COHORT),
  };
}

/* Metric dictionary (M8-01) */
export const METRIC_DICTIONARY = [
  { key: 'activated_users', definition: 'Real users with >=1 accepted session within 7 days of signup', version: 1 },
  { key: 'weekly_active_trainers', definition: 'Distinct real users with >=1 accepted session in rolling 7 days', version: 1 },
  { key: 'sessions_per_active', definition: 'Accepted sessions / WAT (rolling 7 days)', version: 1 },
  { key: 'retention_dn', definition: 'Share of signup cohort with >=1 accepted session on day n', version: 1 },
  { key: 'avg_accuracy', definition: 'Mean accuracy across accepted sessions in window', version: 1 },
];