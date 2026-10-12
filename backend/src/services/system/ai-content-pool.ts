/* ═══════════════════════════════════════════════════════════
   FLASH - AI Content Pool (R14)
   Reports pool depth per game × difficulty × language.
   Alerts when pool falls below target threshold.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

const TARGET_DEPTH = 20;  // want this many items per (game × difficulty)
const MIN_DEPTH = 5;      // below this = critical

export interface PoolDepth {
  game_id: string;
  difficulty: number;
  language: string;
  count: number;
  status: 'critical' | 'low' | 'ok';
}

export interface PoolReport {
  target_depth: number;
  min_depth: number;
  total_items: number;
  total_cells: number;
  critical_cells: number;
  low_cells: number;
  ok_cells: number;
  depth: PoolDepth[];
  needs_refill: Array<{ game_id: string; difficulty: number }>;
}

export async function getPoolReport(limit = 200): Promise<PoolReport> {
  const overall = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM generated_content_cache`
  );

  /* Group by game_id × difficulty (language not stored per row yet) */
  const rows = await pool.query<{
    game_id: string;
    difficulty: number;
    n: number;
  }>(
    `SELECT game_id, difficulty, COUNT(*)::int AS n
       FROM generated_content_cache
      GROUP BY game_id, difficulty
      ORDER BY game_id, difficulty`
  );

  const depth: PoolDepth[] = rows.rows.map((r) => {
    let status: PoolDepth['status'] = 'ok';
    if (r.n < MIN_DEPTH) status = 'critical';
    else if (r.n < TARGET_DEPTH) status = 'low';
    return {
      game_id: r.game_id,
      difficulty: r.difficulty,
      language: 'en', // single-language for now
      count: r.n,
      status,
    };
  });

  const critical_cells = depth.filter((d) => d.status === 'critical').length;
  const low_cells = depth.filter((d) => d.status === 'low').length;
  const ok_cells = depth.filter((d) => d.status === 'ok').length;

  const needs_refill = depth
    .filter((d) => d.status !== 'ok')
    .map((d) => ({ game_id: d.game_id, difficulty: d.difficulty }))
    .slice(0, limit);

  return {
    target_depth: TARGET_DEPTH,
    min_depth: MIN_DEPTH,
    total_items: overall.rows[0]?.total ?? 0,
    total_cells: depth.length,
    critical_cells,
    low_cells,
    ok_cells,
    depth: depth.slice(0, limit),
    needs_refill,
  };
}