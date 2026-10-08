/* ═══════════════════════════════════════════════════════════
   FLASH - Difficulty Explorer + Trial Stats (M3-01 + R22)
   GET /admin/difficulty/:gameId
   GET /admin/difficulty/calibration
   GET /admin/registry/trial-stats
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getTrialStats } from '../services/trial-stats.js';

const adminDifficultyRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /admin/registry/trial-stats (R22) ═══ */
  fastify.get('/admin/registry/trial-stats', { preHandler: requireAdmin('ops') }, async (req) => {
    const stats = await getTrialStats();
    await audit(req, 'catalog.trial_stats.read');
    return { ok: true, ...stats };
  });

  /* ═══ GET /admin/difficulty/calibration ═══ */
  fastify.get('/admin/difficulty/calibration', { preHandler: requireAdmin('science') }, async (req) => {
    const codes = await pool.query<{ reason_code: string; n: number }>(
      `SELECT reason_code, COUNT(*)::int AS n
         FROM engine_decisions
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY reason_code
        ORDER BY n DESC`
    );

    const moves = await pool.query<{ direction: string; n: number }>(
      `SELECT
         CASE
           WHEN to_level > from_level THEN 'promoted'
           WHEN to_level < from_level THEN 'demoted'
           ELSE 'held'
         END AS direction,
         COUNT(*)::int AS n
       FROM engine_decisions
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY n DESC`
    );

    const avgPredicted = await pool.query<{ avg: number | null; n: number }>(
      `SELECT AVG(predicted_success)::float AS avg, COUNT(*)::int AS n
         FROM engine_decisions
        WHERE created_at > NOW() - INTERVAL '30 days' AND predicted_success IS NOT NULL`
    );

    await audit(req, 'difficulty.calibration.read');

    return {
      ok: true,
      window_days: 30,
      reason_codes: codes.rows,
      moves: moves.rows,
      avg_predicted_success: avgPredicted.rows[0]?.avg ?? 0,
      total_decisions: avgPredicted.rows[0]?.n ?? 0,
    };
  });

  /* ═══ GET /admin/difficulty/:gameId ═══ */
  fastify.get<{ Params: { gameId: string } }>(
    '/admin/difficulty/:gameId',
    { preHandler: requireAdmin('science') },
    async (req, reply) => {
      const { gameId } = req.params;

      const levels = await pool.query<{
        level: number;
        label: string;
        levers: unknown;
        calibrated_difficulty: number;
        domain_loadings: unknown;
      }>(
        `SELECT level, label, levers, calibrated_difficulty, domain_loadings
           FROM difficulty_configs
          WHERE game_id = $1 AND mode = 'classic'
          ORDER BY level ASC`,
        [gameId]
      );

      if (!levels.rowCount) {
        return reply.code(404).send({ error: 'unknown_game_or_no_levels' });
      }

      const calib = await pool.query<{
        to_level: number;
        n: number;
        avg_predicted: number | null;
      }>(
        `SELECT to_level, COUNT(*)::int AS n, AVG(predicted_success)::float AS avg_predicted
           FROM engine_decisions
          WHERE game_id = $1 AND to_level IS NOT NULL
          GROUP BY to_level
          ORDER BY to_level ASC`,
        [gameId]
      );

      let observedRows: Array<{ level: number; n: number; avg_accuracy: number | null }> = [];
      try {
        const observed = await pool.query<{
          level: number;
          n: number;
          avg_accuracy: number | null;
        }>(
          `SELECT (config->>'difficulty_level')::int AS level,
                  COUNT(*)::int AS n,
                  AVG(accuracy)::float AS avg_accuracy
             FROM sessions
            WHERE game_id = $1
              AND status = 'accepted'
              AND deleted_at IS NULL
              AND jsonb_typeof(config) = 'object'
              AND config ? 'difficulty_level'
              AND (config->>'difficulty_level') ~ '^[0-9]+$'
            GROUP BY (config->>'difficulty_level')::int
            ORDER BY 1`,
          [gameId]
        );
        observedRows = observed.rows;
      } catch (e) {
        req.log.warn({ err: e }, 'observed sub-query failed (non-fatal)');
      }

      let monotonic = true;
      let prev = -1;
      for (const row of levels.rows) {
        if (row.calibrated_difficulty < prev) { monotonic = false; break; }
        prev = row.calibrated_difficulty;
      }

      await audit(req, 'difficulty.explorer.read', { targetType: 'game', targetId: gameId });

      return {
        ok: true,
        game_id: gameId,
        levels: levels.rows,
        levels_count: levels.rowCount,
        monotonic_difficulty: monotonic,
        calibration: {
          predicted: calib.rows,
          observed: observedRows,
        },
      };
    }
  );
};

export default adminDifficultyRoutes;