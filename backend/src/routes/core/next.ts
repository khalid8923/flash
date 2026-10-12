import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../../config/db.js';
import { getOrCreateDemoUser } from '../../services/users.js';
import {
  getOrInitAbility,
  getRecentDecisions,
} from '../../services/difficulty/engine.js';

const nextRoutes: FastifyPluginAsync = async (fastify) => {
  /* GET /next/:gameId — returns next level + config + explanation */
  fastify.get<{ Params: { gameId: string } }>('/next/:gameId', async (request, reply) => {
    const { gameId } = request.params;
    const userId = await getOrCreateDemoUser();

    const gameRes = await pool.query(
      'SELECT id, name, domain_id, status FROM games WHERE id = $1',
      [gameId]
    );
    if (!gameRes.rowCount) {
      return reply.code(404).send({ error: 'game_not_found' });
    }

    const ability = await getOrInitAbility(userId, gameId, 'classic');

    const configRes = await pool.query(
      `SELECT level, label, levers, calibrated_difficulty, domain_loadings
       FROM difficulty_configs
       WHERE game_id = $1 AND mode = 'classic' AND level = $2`,
      [gameId, ability.current_level]
    );

    return {
      game_id: gameId,
      game_name: gameRes.rows[0].name,
      domain_id: gameRes.rows[0].domain_id,
      level: ability.current_level,
      ability: Math.round(ability.ability * 100) / 100,
      uncertainty: Math.round(ability.uncertainty * 100) / 100,
      evidence_count: ability.evidence_count,
      config: configRes.rows[0] ?? null,
    };
  });

  /* GET /decisions — last N engine decisions */
  fastify.get<{ Querystring: { limit?: string } }>('/decisions', async (request) => {
    const userId = await getOrCreateDemoUser();
    const limit = Math.min(50, parseInt(request.query.limit ?? '10', 10) || 10);
    const decisions = await getRecentDecisions(userId, limit);
    return { decisions };
  });

  /* GET /ability — all games ability for current user */
  fastify.get('/ability', async () => {
    const userId = await getOrCreateDemoUser();
    const res = await pool.query(
      `SELECT pga.game_id, g.name AS game_name, g.domain_id,
              pga.mode, pga.ability, pga.uncertainty, pga.evidence_count,
              pga.current_level, pga.consecutive_successes, pga.consecutive_failures,
              pga.last_updated_at
       FROM player_game_ability pga
       JOIN games g ON g.id = pga.game_id
       WHERE pga.user_id = $1
       ORDER BY pga.last_updated_at DESC`,
      [userId]
    );
    return { abilities: res.rows };
  });
};

export default nextRoutes;