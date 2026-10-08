/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Analytics Routes (M8-01/02)
   GET  /admin/analytics/metrics     — metric dictionary
   GET  /admin/analytics/funnel      — core funnel
   GET  /admin/analytics/retention   — retention cohorts
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getFunnel, getRetention, METRIC_DICTIONARY } from '../services/analytics.js';

const adminAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/analytics/metrics', { preHandler: requireAdmin('analyst') }, async (req) => {
    await audit(req, 'analytics.metrics.read');
    return { ok: true, dictionary: METRIC_DICTIONARY };
  });

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/analytics/funnel',
    { preHandler: requireAdmin('analyst') },
    async (req) => {
      const days = Math.min(90, Math.max(1, parseInt(req.query.days ?? '7', 10) || 7));
      const funnel = await getFunnel(days);
      await audit(req, 'analytics.funnel.read');
      return { ok: true, funnel };
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/analytics/retention',
    { preHandler: requireAdmin('analyst') },
    async (req) => {
      const days = Math.min(90, Math.max(1, parseInt(req.query.days ?? '30', 10) || 30));
      const r = await getRetention(days);
      await audit(req, 'analytics.retention.read');
      return { ok: true, max_days: days, ...r };
    }
  );
};

export default adminAnalyticsRoutes;