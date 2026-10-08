/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Norms Routes (R34)
   GET  /admin/norms                    — list current + versions
   GET  /admin/norms/candidates         — compute candidates
   POST /admin/norms/publish            — publish
   GET  /admin/norms/percentile         — score percentile
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { requireStepUp } from '../middleware/step-up.js';
import { computeCandidates, publishCandidates, listNorms, scorePercentile } from '../services/norms.js';

const PublishBody = z.object({ reason: z.string().min(3).max(500) });

const adminNormsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { game_id?: string } }>(
    '/admin/norms',
    { preHandler: requireAdmin('science') },
    async (req) => {
      const norms = await listNorms(req.query.game_id);
      await audit(req, 'norms.list');
      return { ok: true, count: norms.length, norms };
    }
  );

  fastify.get('/admin/norms/candidates', { preHandler: requireAdmin('science') }, async (req) => {
    const result = await computeCandidates();
    await audit(req, 'norms.candidates.compute');
    return { ok: true, ...result };
  });

  fastify.post('/admin/norms/publish', { preHandler: [requireAdmin('owner'), requireStepUp] }, async (req, reply) => {
    const parsed = PublishBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const result = await publishCandidates();
    await audit(req, 'norms.publish', { reason: parsed.data.reason });
    return { ok: true, ...result };
  });

  fastify.get<{ Querystring: { game_id: string; variant?: string; score: string } }>(
    '/admin/norms/percentile',
    { preHandler: requireAdmin('science') },
    async (req, reply) => {
      const { game_id, variant = 'classic', score } = req.query;
      if (!game_id || !score) return reply.code(400).send({ error: 'missing_params' });
      const num = parseFloat(score);
      if (Number.isNaN(num)) return reply.code(400).send({ error: 'bad_score' });

      const result = await scorePercentile(game_id, variant, num);
      if (!result) return reply.code(404).send({ error: 'no_published_norm' });

      await audit(req, 'norms.percentile.read', { targetType: 'game', targetId: game_id });
      return { ok: true, game_id, variant, ...result };
    }
  );
};

export default adminNormsRoutes;