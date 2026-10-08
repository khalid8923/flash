/* ═══════════════════════════════════════════════════════════
   FLASH - Norms Pipeline (R34)
   Compute candidate norms from verified sessions.
   Rule: one sample per player (first session after practice).
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';

const MIN_SAMPLE = 5; // Launch threshold — raise to 300 for public

export interface NormCandidate {
  game_id: string;
  variant: string;
  metric: string;
  n: number;
  mean: number;
  sd: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface ComputeResult {
  computed: number;
  skipped: number;
  candidates: NormCandidate[];
}

export async function computeCandidates(): Promise<ComputeResult> {
  /* Per game × mode, use ONE session per user (the most recent) */
  const rows = await pool.query<{
    game_id: string;
    mode: string;
    n: number;
    mean: number;
    sd: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  }>(
    `WITH per_user AS (
       SELECT DISTINCT ON (user_id, game_id, mode)
              user_id, game_id, mode, primary_score
         FROM sessions
        WHERE status = 'accepted'
          AND deleted_at IS NULL
          AND trust_tier IN ('verified','default','unverified')  -- no strict filter yet
          AND primary_score IS NOT NULL
        ORDER BY user_id, game_id, mode, started_at DESC
     )
     SELECT game_id, mode,
            COUNT(*)::int AS n,
            AVG(primary_score)::float AS mean,
            COALESCE(STDDEV(primary_score),0)::float AS sd,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY primary_score)::float AS p25,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY primary_score)::float AS p50,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY primary_score)::float AS p75,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY primary_score)::float AS p95
       FROM per_user
      GROUP BY game_id, mode
      HAVING COUNT(*) >= $1`,
    [MIN_SAMPLE]
  );

  const candidates: NormCandidate[] = rows.rows.map((r) => ({
    game_id: r.game_id,
    variant: r.mode,
    metric: 'primary_score',
    n: r.n,
    mean: Math.round(r.mean * 100) / 100,
    sd: Math.round(r.sd * 100) / 100,
    p25: Math.round(r.p25 * 100) / 100,
    p50: Math.round(r.p50 * 100) / 100,
    p75: Math.round(r.p75 * 100) / 100,
    p95: Math.round(r.p95 * 100) / 100,
  }));

  return {
    computed: candidates.length,
    skipped: 0,
    candidates,
  };
}

export interface PublishResult {
  published: number;
  norms: Array<NormCandidate & { norm_version: number; published_at: string }>;
}

export async function publishCandidates(): Promise<PublishResult> {
  const { candidates } = await computeCandidates();
  const published: PublishResult['norms'] = [];

  for (const c of candidates) {
    /* Get current version */
    const cur = await pool.query<{ max: number | null }>(
      `SELECT MAX(norm_version)::int AS max FROM norms WHERE game_id=$1 AND variant=$2 AND metric=$3`,
      [c.game_id, c.variant, c.metric]
    );
    const nextVersion = (cur.rows[0]?.max ?? 0) + 1;

    /* Retire previous published */
    await pool.query(
      `UPDATE norms SET status='retired'
        WHERE game_id=$1 AND variant=$2 AND metric=$3 AND status='published'`,
      [c.game_id, c.variant, c.metric]
    );

    /* Insert new published */
    await pool.query(
      `INSERT INTO norms (game_id, variant, metric, mean, sd, percentiles, sample_size, source, status, norm_version, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'population', 'published', $8, now())`,
      [
        c.game_id, c.variant, c.metric, c.mean, c.sd,
        JSON.stringify({ p25: c.p25, p50: c.p50, p75: c.p75, p95: c.p95 }),
        c.n, nextVersion,
      ]
    );

    published.push({ ...c, norm_version: nextVersion, published_at: new Date().toISOString() });
  }

  return { published: published.length, norms: published };
}

export async function listNorms(gameId?: string) {
  const where = gameId ? 'WHERE game_id = $1' : '';
  const params = gameId ? [gameId] : [];
  const r = await pool.query(
    `SELECT game_id, variant, metric, mean, sd, sample_size, status, norm_version, published_at
       FROM norms ${where}
       ORDER BY game_id, variant, norm_version DESC`,
    params
  );
  return r.rows;
}

/** Given a raw score, return percentile from the latest published norm. */
export async function scorePercentile(gameId: string, variant: string, score: number) {
  const r = await pool.query<{ mean: number; sd: number; percentiles: Record<string, number>; sample_size: number }>(
    `SELECT mean, sd, percentiles, sample_size
       FROM norms
      WHERE game_id=$1 AND variant=$2 AND metric='primary_score' AND status='published'
      ORDER BY norm_version DESC LIMIT 1`,
    [gameId, variant]
  );
  const row = r.rows[0];
  if (!row) return null;

  /* Simple z-score */
  const z = row.sd > 0 ? (score - row.mean) / row.sd : 0;

  /* Rough percentile from z */
  const pct = Math.round(normCdf(z) * 100 * 100) / 100;

  return {
    score,
    z: Math.round(z * 100) / 100,
    percentile: pct,
    mean: row.mean,
    sd: row.sd,
    sample_size: row.sample_size,
  };
}

/** Standard normal CDF approximation */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}