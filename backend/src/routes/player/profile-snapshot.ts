/* ═══════════════════════════════════════════════════════════
   Profile Snapshot Routes
   Single endpoint for dashboard — self-comparison only
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { generateSnapshot } from '../../services/profile/snapshot.js';
import { getOrCreateDemoUser } from '../../services/users.js';
import type { Lang } from '../../services/ai/providers/types.js';

const profileSnapshotRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { language?: string } }>(
    '/profile/snapshot',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateSnapshot(userId, lang);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'snapshot_failed',
          message: (err as Error).message,
        });
      }
    }
  );
};

export default profileSnapshotRoutes;