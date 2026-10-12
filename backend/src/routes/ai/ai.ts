import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { generateContent } from '../../services/ai/generate.js';
import { listGenerativeGames } from '../../services/ai/prompts.js';
import { groq } from '../../services/ai/groq-client.js';
import { chat } from '../../services/ai/coach.js';
import { generateSessionRecap } from '../../services/ai/recap.js';
import { generateWeeklyInsights } from '../../services/ai/insights.js';
import { generateDailyPlan } from '../../services/ai/daily-plan.js';
import { getProviderStatus } from '../../services/ai/router.js';
import { getOrCreateDemoUser } from '../../services/users.js';

const GenerateBody = z.object({
  game_id: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  language: z.enum(['en', 'ar']).default('en'),
  exclude: z.array(z.string()).default([]),
  bypass_cache: z.boolean().default(false),
});

const ChatBody = z.object({
  message: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().nullable().optional(),
  language: z.enum(['en', 'ar']).default('en'),
});

const RecapBody = z.object({
  session_id: z.string().uuid(),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ai/status', async () => {
    return {
      enabled: groq.isEnabled(),
      provider: 'groq',
      generative_games: listGenerativeGames(),
      coach_enabled: groq.isEnabled(),
      recap_enabled: groq.isEnabled(),
    };
  });

  fastify.post('/ai/generate', async (request, reply) => {
    const parsed = GenerateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    try {
      const result = await generateContent({
        gameId: parsed.data.game_id,
        difficulty: parsed.data.difficulty,
        language: parsed.data.language,
        exclude: parsed.data.exclude,
        bypassCache: parsed.data.bypass_cache,
      });
      return reply.code(200).send(result);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('does not support')) return reply.code(400).send({ error: 'unsupported_game', message: msg });
      if (msg.includes('not configured')) return reply.code(503).send({ error: 'ai_not_configured', message: msg });
      return reply.code(500).send({ error: 'generation_failed', message: msg });
    }
  });

  /* ═══ AI Coach Chat ═══ */
  fastify.post('/ai/chat', async (request, reply) => {
    const parsed = ChatBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    if (!groq.isEnabled()) {
      return reply.code(503).send({ error: 'ai_not_configured' });
    }
    const userId = await getOrCreateDemoUser();
    try {
      const result = await chat({
        userId,
        message: parsed.data.message,
        conversationId: parsed.data.conversation_id ?? null,
        language: parsed.data.language,
      });
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'chat_failed', message: (err as Error).message });
    }
  });

  /* ═══ Session Recap ═══ */
  fastify.post('/ai/recap', async (request, reply) => {
    const parsed = RecapBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const userId = await getOrCreateDemoUser();
    try {
      const result = await generateSessionRecap(
        parsed.data.session_id,
        userId,
        parsed.data.language
      );
      return reply.code(200).send(result);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'session_not_found_or_not_owned') {
        return reply.code(404).send({ error: 'session_not_found' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'recap_failed', message: msg });
    }
  });

  /* ═══ List conversations ═══ */
  fastify.get('/ai/conversations', async () => {
    const userId = await getOrCreateDemoUser();
    const res = await pool.query(
      `SELECT id, title, language, updated_at FROM ai_conversations
       WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20`,
      [userId]
    );
    return { conversations: res.rows };
  });

  /* ═══ Get conversation messages ═══ */
  fastify.get<{ Params: { id: string } }>('/ai/conversations/:id', async (request, reply) => {
    const userId = await getOrCreateDemoUser();
    const conv = await pool.query(
      `SELECT id, title, language FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [request.params.id, userId]
    );
    if (!conv.rowCount) return reply.code(404).send({ error: 'not_found' });
    const msgs = await pool.query(
      `SELECT role, content, created_at FROM ai_messages
       WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [request.params.id]
    );
    return { conversation: conv.rows[0], messages: msgs.rows };
  });
  /* ═══ Weekly Insights ═══ */
  fastify.get<{ Querystring: { language?: string } }>('/ai/insights', async (request, reply) => {
    const lang = request.query.language === 'ar' ? 'ar' : 'en';
    const userId = await getOrCreateDemoUser();
    try {
      const result = await generateWeeklyInsights(userId, lang);
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'insights_failed', message: (err as Error).message });
    }
  });
  /* ═══ AI Daily Plan ═══ */
  fastify.get<{ Querystring: { language?: string } }>('/ai/daily-plan', async (request, reply) => {
    const lang = request.query.language === 'ar' ? 'ar' : 'en';
    const userId = await getOrCreateDemoUser();
    try {
      const result = await generateDailyPlan(userId, lang);
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'daily_plan_failed', message: (err as Error).message });
    }
  });
  /* ═══ AI Provider Health ═══ */
  fastify.get('/ai/health', async (_request, reply) => {
    const status = getProviderStatus();
    const anyEnabled = status.providers.some((p) => p.enabled);
    // If no calls yet, treat as healthy (unknown != unhealthy)
    const anyHealthy = status.health.length === 0
      ? true
      : status.health.some((h) => h.healthy);
    return reply.code(anyEnabled ? 200 : 503).send({
      ok: anyEnabled && anyHealthy,
      ...status,
    });
  });
};

export default aiRoutes;