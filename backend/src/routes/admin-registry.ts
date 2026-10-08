/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Game Registry (M2-01)
   GET /admin/catalog/games      — full metadata per game
   GET /admin/catalog/games/:id  — one game details
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getTrialStats } from '../services/trial-stats.js';

const adminRegistryRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /admin/catalog/games ═══ */
  fastify.get('/admin/catalog/games', { preHandler: requireAdmin('science') }, async (req, reply) => {
    const r = await pool.query(
      `SELECT g.id, g.name, g.domain_id, g.trial_pattern, g.primary_metric,
              g.metric_direction, g.rt_floor_ms, g.rt_ceiling_ms,
              g.max_trials_per_session, g.min_duration_ms, g.max_duration_ms,
              g.max_score, g.status, g.game_version, g.scoring_version,
              g.deleted_at, d.name AS domain_name
         FROM games g
         LEFT JOIN domains d ON d.id = g.domain_id
         ORDER BY g.domain_id, g.id`
    );
    await audit(req, 'catalog.games.list');
    return {
      ok: true,
      count: r.rowCount,
      games: r.rows.map((row) => ({
        ...row,
        active: row.deleted_at === null,
      })),
    };
  });

  /* ═══ GET /admin/catalog/games/:id ═══ */
  fastify.get<{ Params: { id: string } }>(
    '/admin/catalog/games/:id',
    { preHandler: requireAdmin('science') },
    async (req, reply) => {
      const { id } = req.params;
      const g = await pool.query(
        `SELECT * FROM games WHERE id = $1`,
        [id]
      );
      if (!g.rowCount) return reply.code(404).send({ error: 'not_found' });

      const w = await pool.query(
        `SELECT domain_id, weight FROM game_domain_weights WHERE game_id = $1`,
        [id]
      );
      const lv = await pool.query(
        `SELECT COUNT(*)::int AS total, MIN(level) AS min, MAX(level) AS max
           FROM difficulty_configs WHERE game_id = $1`,
        [id]
      );

      await audit(req, 'catalog.game.read', { targetType: 'game', targetId: id });

      return {
        ok: true,
        game: g.rows[0],
        weights: w.rows,
        difficulty_levels: lv.rows[0],
      };
    }
  );
};

export default adminRegistryRoutes;