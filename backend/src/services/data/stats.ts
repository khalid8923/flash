/* ═══════════════════════════════════════════════════════════
   Stats Service — Updates user_game_stats + domain_scores
   Called after every session ingestion.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

/* ═══════════════════════════════════════════════════════════
   1. Update user_game_stats (per game + mode)
   ═══════════════════════════════════════════════════════════ */
export async function updateUserGameStats(
  userId: string,
  gameId: string,
  variant: string
): Promise<void> {
  /* Compute last 20 sessions aggregate */
  const aggRes = await pool.query<{
    sessions_count: number;
    recent_accuracy: number | null;
    recent_speed: number | null;
    recent_efficiency: number | null;
    last_played_at: string | null;
  }>(
    `SELECT
       COUNT(*)::int AS sessions_count,
       AVG(accuracy)::float AS recent_accuracy,
       AVG(CASE WHEN median_rt_ms > 0 THEN 1000.0 / (median_rt_ms / 1000.0) ELSE 0 END)::float AS recent_speed,
       AVG(rcs)::float AS recent_efficiency,
       MAX(ended_at) AS last_played_at
     FROM (
       SELECT accuracy, median_rt_ms, rcs, ended_at
         FROM sessions
        WHERE user_id = $1
          AND game_id = $2
          AND status = 'accepted'
          AND deleted_at IS NULL
        ORDER BY ended_at DESC
        LIMIT 20
     ) recent`,
    [userId, gameId]
  );

  const row = aggRes.rows[0];
  if (!row || row.sessions_count === 0) return;

  /* Compute normalized_z: raw z-score of last session vs user's own history */
  const lastRes = await pool.query<{ accuracy: number }>(
    `SELECT accuracy FROM sessions
      WHERE user_id = $1 AND game_id = $2 AND status = 'accepted' AND deleted_at IS NULL
      ORDER BY ended_at DESC LIMIT 1`,
    [userId, gameId]
  );
  const lastAcc = lastRes.rows[0]?.accuracy ?? 0;

  const avg = row.recent_accuracy ?? 0;
  const allAccRes = await pool.query<{ accuracy: number }>(
    `SELECT accuracy FROM sessions
      WHERE user_id = $1 AND game_id = $2 AND status = 'accepted' AND deleted_at IS NULL`,
    [userId, gameId]
  );
  const values = allAccRes.rows.map((r) => r.accuracy);
  let sd = 0;
  if (values.length >= 2) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    sd = Math.sqrt(variance);
  }
  const normalizedZ = sd > 0 ? (lastAcc - avg) / sd : 0;

  /* Confidence: 0-1 based on session count */
  const confidence = Math.min(1, row.sessions_count / 15);

  /* Upsert */
  await pool.query(
    `INSERT INTO user_game_stats
       (user_id, game_id, variant, sessions_count, recent_accuracy, recent_speed,
        recent_efficiency, normalized_z, confidence, last_played_at, scoring_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
     ON CONFLICT (user_id, game_id, variant) DO UPDATE
       SET sessions_count = EXCLUDED.sessions_count,
           recent_accuracy = EXCLUDED.recent_accuracy,
           recent_speed = EXCLUDED.recent_speed,
           recent_efficiency = EXCLUDED.recent_efficiency,
           normalized_z = EXCLUDED.normalized_z,
           confidence = EXCLUDED.confidence,
           last_played_at = EXCLUDED.last_played_at`,
    [
      userId,
      gameId,
      variant,
      row.sessions_count,
      row.recent_accuracy !== null ? Math.round(row.recent_accuracy * 100) / 100 : null,
      row.recent_speed !== null ? Math.round(row.recent_speed * 100) / 100 : null,
      row.recent_efficiency !== null ? Math.round(row.recent_efficiency * 10000) / 10000 : null,
      Math.round(normalizedZ * 100) / 100,
      Math.round(confidence * 100) / 100,
      row.last_played_at,
    ]
  );
}

/* ═══════════════════════════════════════════════════════════
   2. Update domain_scores (per domain)
   Weighted average of games' recent_accuracy in that domain
   ═══════════════════════════════════════════════════════════ */
export async function updateDomainScores(userId: string): Promise<void> {
  /* Compute per domain using only the game's own domain (not cross-domain weights for now) */
  const domainRes = await pool.query<{
    domain_id: string;
    weighted_score: number;
    games_count: number;
    total_sessions: number;
  }>(
    `SELECT
       g.domain_id,
       SUM(ugs.recent_accuracy * ugs.sessions_count)::float
         / NULLIF(SUM(ugs.sessions_count), 0) AS weighted_score,
       COUNT(DISTINCT ugs.game_id)::int AS games_count,
       SUM(ugs.sessions_count)::int AS total_sessions
     FROM user_game_stats ugs
     JOIN games g ON g.id = ugs.game_id
     WHERE ugs.user_id = $1
       AND g.status = 'ready'
       AND g.deleted_at IS NULL
       AND ugs.sessions_count > 0
       AND ugs.recent_accuracy IS NOT NULL
     GROUP BY g.domain_id`,
    [userId]
  );

  for (const row of domainRes.rows) {
    /* Confidence based on total sessions */
    const confidence = Math.min(1, row.total_sessions / 20);

    await pool.query(
      `INSERT INTO domain_scores
         (user_id, domain_id, score, confidence, games_contributing, computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, domain_id) DO UPDATE
         SET score = EXCLUDED.score,
             confidence = EXCLUDED.confidence,
             games_contributing = EXCLUDED.games_contributing,
             computed_at = NOW()`,
      [
        userId,
        row.domain_id,
        Math.round(row.weighted_score * 100) / 100,
        Math.round(confidence * 100) / 100,
        row.games_count,
      ]
    );
  }
}

/* ═══════════════════════════════════════════════════════════
   3. Recompute everything (for a full rebuild)
   ═══════════════════════════════════════════════════════════ */
export async function recomputeAllStats(userId: string): Promise<{
  games_updated: number;
  domains_updated: number;
}> {
  /* Find all (game, mode) pairs the user has played */
  const pairsRes = await pool.query<{ game_id: string; mode: string }>(
    `SELECT DISTINCT game_id, mode
       FROM sessions
      WHERE user_id = $1 AND status = 'accepted' AND deleted_at IS NULL`,
    [userId]
  );

  for (const pair of pairsRes.rows) {
    await updateUserGameStats(userId, pair.game_id, pair.mode);
  }

  await updateDomainScores(userId);

  const domainsRes = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM domain_scores WHERE user_id = $1`,
    [userId]
  );

  return {
    games_updated: pairsRes.rows.length,
    domains_updated: domainsRes.rows[0]?.n ?? 0,
  };
}