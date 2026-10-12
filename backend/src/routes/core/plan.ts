import type { FastifyPluginAsync } from 'fastify';
import { getOrCreateDemoUser } from '../../services/users.js';
import { buildDailyPlan } from '../../services/planner.js';

const planRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/plan', async (request, reply) => {
    const userId = await getOrCreateDemoUser();
    try {
      const plan = await buildDailyPlan(userId);
      return reply.code(200).send(plan);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: 'plan_generation_failed',
        message: (err as Error).message,
      });
    }
  });
};

export default planRoutes;