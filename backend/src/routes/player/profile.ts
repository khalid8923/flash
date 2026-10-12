import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../../config/db.js';
import { getOrCreateDemoUser } from '../../services/users.js';
import { buildUserProfile, getRecommendations } from '../../services/recommendations.js';

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/profile', async () => {
    const userId = await getOrCreateDemoUser();

    const profile = await buildUserProfile(userId);
    const recommendations = await getRecommendations(userId, 3);

    const pbs = await pool.query(
      `SELECT game_id, variant, metric, value, achieved_at
       FROM personal_bests WHERE user_id = $1
       ORDER BY achieved_at DESC LIMIT 20`,
      [userId]
    );

    const badges = await pool.query(
      `SELECT ub.badge_id, b.name, b.tier, ub.unlocked_at
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1 AND ub.revoked_at IS NULL
       ORDER BY ub.unlocked_at DESC`,
      [userId]
    );

    const sessionsAgg = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(AVG(accuracy), 0)::float AS avg_accuracy,
              MAX(ended_at) AS last_at
       FROM sessions WHERE user_id = $1 AND status = 'accepted'`,
      [userId]
    );

    return {
      user_id: userId,
      stats: sessionsAgg.rows[0],
      domain_scores: profile.domain_scores,
      personal_bests: pbs.rows,
      badges: badges.rows,
      recommendations,
    };
  });

  fastify.get('/sessions', async () => {
    const userId = await getOrCreateDemoUser();
    const limit = 30;
    const res = await pool.query(
      `SELECT id, game_id, mode, accuracy, median_rt_ms, primary_score, ended_at
       FROM sessions
       WHERE user_id = $1 AND status = 'accepted'
       ORDER BY ended_at DESC LIMIT $2`,
      [userId, limit]
    );
    return { sessions: res.rows };
  });
};

export default profileRoutes;