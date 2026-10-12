/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Feature Flags Routes (M9-01)
   GET  /admin/flags         — list all
   POST /admin/flags/:key    — update
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAdmin, audit } from '../../middleware/admin-auth.js';
import { listFlags, setFlag, isEnabled } from '../../services/safety/feature-flags.js';

const UpdateBody = z.object({
  enabled: z.boolean().optional(),
  rollout_pct: z.number().int().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  owner: z.string().max(100).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  reason: z.string().min(3).max(500),
});

const adminFlagsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/flags', { preHandler: requireAdmin('ops') }, async (req) => {
    const flags = await listFlags();
    await audit(req, 'flags.list');
    return { ok: true, count: flags.length, flags };
  });

  fastify.post<{ Params: { key: string } }>(
    '/admin/flags/:key',
    { preHandler: requireAdmin('ops') },
    async (req, reply) => {
      const parsed = UpdateBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
      }
      const { key } = req.params;
      const { reason, ...updates } = parsed.data;

      try {
        const flag = await setFlag({
          key,
          ...updates,
          actorId: req.admin?.id ?? null,
        });
        await audit(req, 'flags.update', { targetType: 'flag', targetId: key, reason });
        return { ok: true, flag };
      } catch (err) {
        if ((err as Error).message === 'flag_not_found') {
          return reply.code(404).send({ error: 'flag_not_found' });
        }
        throw err;
      }
    }
  );

  /* Public eval (no auth needed — used by client/server code) */
  fastify.get<{ Querystring: { key: string; player_id?: string } }>(
    '/flags/eval',
    async (req, reply) => {
      const { key, player_id } = req.query;
      if (!key) return reply.code(400).send({ error: 'missing_key' });
      const enabled = await isEnabled(key, player_id ?? null);
      return { ok: true, key, enabled };
    }
  );
};

export default adminFlagsRoutes;