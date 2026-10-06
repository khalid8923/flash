import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';

const gamesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/games', async () => {
    const res = await pool.query(`
      SELECT
        g.id, g.name, g.domain_id, g.primary_metric, g.metric_direction,
        g.trial_pattern, g.status,
        d.name AS domain_name, d.icon AS domain_icon, d.color AS domain_color
      FROM games g
      JOIN domains d ON d.id = g.domain_id
      ORDER BY d.id, g.name
    `);
    return { games: res.rows };
  });

  fastify.get('/domains', async () => {
    const res = await pool.query('SELECT id, name, icon, color FROM domains ORDER BY id');
    return { domains: res.rows };
  });
};

export default gamesRoutes;