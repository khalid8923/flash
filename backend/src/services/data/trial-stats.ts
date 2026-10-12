/* ═══════════════════════════════════════════════════════════
   FLASH - Trial Storage Stats (R22 base)
   Measure real trial sizes to justify future compaction.
   No schema change — read-only reporting.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

export interface TrialStats {
  sessions: number;
  total_trials: number;
  avg_trials_per_session: number;
  avg_bytes_per_session: number;
  total_bytes: number;
  total_mb: number;
  p50_bytes: number;
  p95_bytes: number;
  p99_bytes: number;
  top_games: Array<{ game_id: string; sessions: number; avg_bytes: number }>;
}

export async function getTrialStats(): Promise<TrialStats> {
  /* Overall aggregates */
  const overall = await pool.query<{
    sessions: number;
    total_bytes: number | null;
  }>(
    `SELECT COUNT(*)::int AS sessions,
            SUM(pg_column_size(st.trials))::bigint AS total_bytes
       FROM session_trials st`
  );

  const totalBytes = Number(overall.rows[0]?.total_bytes ?? 0);
  const sessions = overall.rows[0]?.sessions ?? 0;

  /* Trial counts: extract array length from JSONB */
  const trialCounts = await pool.query<{ total_trials: number | null }>(
    `SELECT SUM(jsonb_array_length(trials))::int AS total_trials
       FROM session_trials`
  );
  const totalTrials = trialCounts.rows[0]?.total_trials ?? 0;

  /* Percentiles */
  const percentiles = await pool.query<{ p50: number | null; p95: number | null; p99: number | null }>(
    `SELECT
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY pg_column_size(trials))::int AS p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pg_column_size(trials))::int AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pg_column_size(trials))::int AS p99
       FROM session_trials`
  );

  /* Top games by size */
  const topGames = await pool.query<{ game_id: string; sessions: number; avg_bytes: number }>(
    `SELECT s.game_id,
            COUNT(*)::int AS sessions,
            AVG(pg_column_size(st.trials))::int AS avg_bytes
       FROM session_trials st
       JOIN sessions s ON s.id = st.session_id
      GROUP BY s.game_id
      ORDER BY SUM(pg_column_size(st.trials)) DESC
      LIMIT 10`
  );

  return {
    sessions,
    total_trials: totalTrials,
    avg_trials_per_session: sessions > 0 ? Math.round(totalTrials / sessions) : 0,
    avg_bytes_per_session: sessions > 0 ? Math.round(totalBytes / sessions) : 0,
    total_bytes: totalBytes,
    total_mb: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
    p50_bytes: percentiles.rows[0]?.p50 ?? 0,
    p95_bytes: percentiles.rows[0]?.p95 ?? 0,
    p99_bytes: percentiles.rows[0]?.p99 ?? 0,
    top_games: topGames.rows,
  };
}