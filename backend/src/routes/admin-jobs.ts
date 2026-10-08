/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Jobs Routes (M7-01)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { listJobs, getJobStats, enqueueJob } from '../services/job-runner.js';

const EnqueueBody = z.object({
  kind: z.string().min(1).max(80),
  payload: z.unknown().optional(),
  reason: z.string().min(3).max(500),
});

const adminJobsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { kind?: string; status?: string; limit?: string } }>(
    '/admin/jobs',
    { preHandler: requireAdmin('ops') },
    async (req) => {
      const jobs = await listJobs({
        kind: req.query.kind,
        status: req.query.status,
        limit: parseInt(req.query.limit ?? '100', 10) || 100,
      });
      const stats = await getJobStats();
      await audit(req, 'jobs.list');
      return { ok: true, count: jobs.length, stats, jobs };
    }
  );

  fastify.post('/admin/jobs/enqueue', { preHandler: requireAdmin('ops') }, async (req, reply) => {
    const parsed = EnqueueBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { kind, payload, reason } = parsed.data;
    const job = await enqueueJob({ kind, payload });
    await audit(req, 'jobs.enqueue', { targetType: 'job', targetId: job.id, reason });
    return reply.code(201).send({ ok: true, job });
  });
};

export default adminJobsRoutes;