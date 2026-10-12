/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Demo Scripts (M11-03)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAdmin, audit } from '../../middleware/admin-auth.js';
import { ensureScripts, resetScripts, listScripts } from '../../services/system/demo-scripts.js';

const EnsureBody = z.object({ reason: z.string().min(3).max(500) });

const adminDemoScriptsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/demo/scripts', { preHandler: requireAdmin('ops') }, async (req) => {
    const scripts = await listScripts();
    await audit(req, 'demo.scripts.list');
    return { ok: true, count: scripts.length, scripts };
  });

  fastify.post('/admin/demo/scripts', { preHandler: requireAdmin('ops') }, async (req, reply) => {
    const parsed = EnsureBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const scripts = await ensureScripts();
    const created = scripts.filter((s) => s.created).length;
    await audit(req, 'demo.scripts.ensure', { reason: parsed.data.reason });
    return reply.code(201).send({ ok: true, created, total: scripts.length, scripts });
  });

  fastify.post('/admin/demo/scripts/reset', { preHandler: requireAdmin('ops') }, async (req, reply) => {
    const parsed = EnsureBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const deleted = await resetScripts();
    await audit(req, 'demo.scripts.reset', { reason: parsed.data.reason });
    return { ok: true, deleted };
  });
};

export default adminDemoScriptsRoutes;