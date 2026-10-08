/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Retention Routes (R19)
   GET  /admin/retention/preview   — what would be deleted
   POST /admin/retention/run       — execute purges
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { requireStepUp } from '../middleware/step-up.js';
import { previewRetention, runRetention, RETENTION_RULES } from '../services/retention.js';

const RunBody = z.object({ reason: z.string().min(3).max(500) });

const adminRetentionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/retention/rules', { preHandler: requireAdmin('support') }, async (req) => {
    await audit(req, 'retention.rules.read');
    return { ok: true, count: RETENTION_RULES.length, rules: RETENTION_RULES };
  });

  fastify.get('/admin/retention/preview', { preHandler: requireAdmin('support') }, async (req) => {
    const preview = await previewRetention();
    await audit(req, 'retention.preview');
    const total = preview.reduce((a, p) => a + p.would_delete, 0);
    return { ok: true, total_would_delete: total, preview };
  });

  fastify.post(
    '/admin/retention/run',
    { preHandler: [requireAdmin('owner'), requireStepUp] },
    async (req, reply) => {
      const parsed = RunBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
      }
      const results = await runRetention();
      const total = results.reduce((a, r) => a + r.deleted, 0);
      await audit(req, 'retention.run', { reason: parsed.data.reason });
      return { ok: true, total_deleted: total, results };
    }
  );
};

export default adminRetentionRoutes;