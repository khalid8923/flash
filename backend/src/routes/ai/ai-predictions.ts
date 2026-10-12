/* ═══════════════════════════════════════════════════════════
   Predictive Coach Routes
   Multi-horizon predictions with trajectory + confidence
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import {
  generatePredictions,
  getPredictionHistory,
} from '../../services/ai/predictions.js';
import { getOrCreateDemoUser } from '../../services/users.js';
import type { Lang } from '../../services/ai/providers/types.js';

const aiPredictionsRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ Current predictions ═══ */
  fastify.get<{ Querystring: { language?: string; refresh?: string } }>(
    '/ai/predictions',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generatePredictions(userId, lang, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'predictions_failed',
          message: (err as Error).message,
        });
      }
    }
  );

  /* ═══ History ═══ */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/ai/predictions/history',
    async (request, reply) => {
      const limitRaw = parseInt(request.query.limit ?? '20', 10);
      const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 20));
      const userId = await getOrCreateDemoUser();
      try {
        const items = await getPredictionHistory(userId, limit);
        return reply.code(200).send({ count: items.length, items });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'predictions_history_failed',
          message: (err as Error).message,
        });
      }
    }
  );
};

export default aiPredictionsRoutes;