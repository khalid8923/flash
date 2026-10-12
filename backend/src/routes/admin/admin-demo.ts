/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Demo Readiness (M11-01 + M11-02)
   - Set user origin (real/demo/test/internal)
   - Generate labeled synthetic cohort
   - Reset demo data
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { requireAdmin, audit } from '../../middleware/admin-auth.js';
import { requireStepUp } from '../../middleware/step-up.js';

const SetOriginBody = z.object({
  origin: z.enum(['real', 'demo', 'test', 'internal']),
  reason: z.string().min(3).max(500),
});

const GenerateBody = z.object({
  count: z.number().int().min(1).max(50).default(5),
  reason: z.string().min(3).max(500),
});

const adminDemoRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /admin/demo/origins — count users by origin ═══ */
  fastify.get('/admin/demo/origins', { preHandler: requireAdmin('ops') }, async (req) => {
    const r = await pool.query<{ origin: string; n: number }>(
      `SELECT origin, COUNT(*)::int AS n
         FROM users WHERE deleted_at IS NULL
         GROUP BY origin ORDER BY origin`
    );
    await audit(req, 'demo.origins.read');
    return { ok: true, breakdown: r.rows };
  });

  /* ═══ POST /admin/demo/users/:id/origin — set a user's origin ═══ */
  fastify.post<{ Params: { id: string } }>(
    '/admin/demo/users/:id/origin',
    { preHandler: requireAdmin('ops') },
    async (req, reply) => {
      const parsed = SetOriginBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
      }
      const { id } = req.params;
      const { origin, reason } = parsed.data;

      const r = await pool.query(
        `UPDATE users SET origin = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, origin`,
        [origin, id]
      );
      if (!r.rowCount) return reply.code(404).send({ error: 'user_not_found' });

      await audit(req, 'demo.user.set_origin', { targetType: 'user', targetId: id, reason });
      return { ok: true, user: r.rows[0] };
    }
  );

  /* ═══ POST /admin/demo/generate — create synthetic cohort ═══ */
  fastify.post('/admin/demo/generate', { preHandler: requireAdmin('ops') }, async (req, reply) => {
    const parsed = GenerateBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { count, reason } = parsed.data;
    const batch = 'demo_' + Date.now().toString(36);

    const created: Array<{ id: string; email: string }> = [];
    for (let i = 0; i < count; i++) {
      const email = `${batch}_${i}@demo.local`;
      const r = await pool.query<{ id: string }>(
        `INSERT INTO users (email, display_name, origin, status)
         VALUES ($1, $2, 'demo', 'active') RETURNING id`,
        [email, `Demo User ${i + 1}`]
      );
      created.push({ id: r.rows[0]!.id, email });
    }

    await audit(req, 'demo.generate', { targetType: 'cohort', targetId: batch, reason });

    return reply.code(201).send({
      ok: true,
      batch,
      created: created.length,
      users: created.map((u) => ({ id: u.id, email: u.email })),
    });
  });

  /* ═══ POST /admin/demo/reset — delete all demo users ═══ */
  fastify.post('/admin/demo/reset', { preHandler: [requireAdmin('ops'), requireStepUp] }, async (req, reply) => {
    const body = z.object({ reason: z.string().min(3).max(500) }).safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: body.error.flatten().fieldErrors });
    }

    const r = await pool.query(
      `DELETE FROM users WHERE origin IN ('demo','test') RETURNING id`
    );
    await audit(req, 'demo.reset', { targetType: 'cohort', reason: body.data.reason });
    return { ok: true, deleted: r.rowCount ?? 0 };
  });
};

export default adminDemoRoutes;