/* ═══════════════════════════════════════════════════════════
   FLASH - Player /me routes (R20)
   GET  /me/export       — download my data (JSON)
   POST /me/erase        — request account deletion (30-day grace)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requirePlayer } from '../middleware/auth.js';
import { exportPlayerData, requestErasure } from '../services/privacy-player.js';

const EraseBody = z.object({
  reason: z.string().max(500).optional(),
  confirm: z.literal('DELETE'),
});

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me/export', { preHandler: requirePlayer }, async (req, reply) => {
    const data = await exportPlayerData(req.player!.playerId);
    reply.header('content-disposition', `attachment; filename="flash-export-${Date.now()}.json"`);
    return data;
  });

  fastify.post('/me/erase', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = EraseBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        note: 'Send { "confirm": "DELETE" } to proceed',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const result = await requestErasure(req.player!.playerId, parsed.data.reason ?? null);
    return reply.code(202).send({ ok: true, ...result });
  });
};

export default meRoutes;