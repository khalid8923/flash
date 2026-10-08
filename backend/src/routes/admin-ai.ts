/* ═══════════════════════════════════════════════════════════
   FLASH - Admin AI Operations (M6-01)
   GET /admin/ai/health     — provider health + recent stats
   GET /admin/ai/providers  — enabled providers + models
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getProviderStatus } from '../services/ai/router.js';
import { env } from '../config/env.js';

const adminAiRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /admin/ai/health ═══ */
  fastify.get('/admin/ai/health', { preHandler: requireAdmin('ops') }, async (req) => {
    const status = getProviderStatus();
    await audit(req, 'ai.health.read');
    return {
      ok: true,
      ...status,
      models: {
        groq_en:   env.GROQ_MODEL_EN,
        groq_ar:   env.GROQ_MODEL_AR,
        openrouter: env.OPENROUTER_MODEL,
        gemini:    env.GEMINI_MODEL,
      },
    };
  });

  /* ═══ GET /admin/ai/providers ═══ */
  fastify.get('/admin/ai/providers', { preHandler: requireAdmin('ops') }, async (req) => {
    const status = getProviderStatus();
    await audit(req, 'ai.providers.read');
    return {
      ok: true,
      providers: status.providers.map((p) => ({
        name: p.name,
        enabled: p.enabled,
      })),
    };
  });
};

export default adminAiRoutes;