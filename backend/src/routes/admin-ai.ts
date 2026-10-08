/* ═══════════════════════════════════════════════════════════
   FLASH - Admin AI Operations (M6-01 + M6-02/04 + R14)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getProviderStatus } from '../services/ai/router.js';
import { env } from '../config/env.js';
import { getPoolReport } from '../services/ai-content-pool.js';
import { getBudgetSummary } from '../services/ai-usage.js';

const adminAiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/ai/health', { preHandler: requireAdmin('ops') }, async (req) => {
    const status = getProviderStatus();
    await audit(req, 'ai.health.read');
    return {
      ok: true,
      ...status,
      models: {
        groq_en:    env.GROQ_MODEL_EN,
        groq_ar:    env.GROQ_MODEL_AR,
        openrouter: env.OPENROUTER_MODEL,
        gemini:     env.GEMINI_MODEL,
      },
    };
  });

  fastify.get('/admin/ai/providers', { preHandler: requireAdmin('ops') }, async (req) => {
    const status = getProviderStatus();
    await audit(req, 'ai.providers.read');
    return {
      ok: true,
      providers: status.providers.map((p) => ({ name: p.name, enabled: p.enabled })),
    };
  });

  fastify.get('/admin/ai/pool', { preHandler: requireAdmin('ops') }, async (req) => {
    const report = await getPoolReport();
    await audit(req, 'ai.pool.read');
    return { ok: true, ...report };
  });

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/ai/budget',
    { preHandler: requireAdmin('ops') },
    async (req) => {
      const days = Math.min(90, Math.max(1, parseInt(req.query.days ?? '7', 10) || 7));
      const summary = await getBudgetSummary(days);
      await audit(req, 'ai.budget.read');
      return { ok: true, ...summary };
    }
  );
};

export default adminAiRoutes;