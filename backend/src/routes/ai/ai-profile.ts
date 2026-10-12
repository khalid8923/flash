/* ═══════════════════════════════════════════════════════════
   AI Profile Routes
   - Cognitive Fingerprint (#2)
   - Error Pattern Analysis (#11)
   - Micro-Lessons (#10)
   - Transfer Tracker (#12)
   - AI Lab (#7)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateFingerprint } from '../../services/ai/fingerprint.js';
import { generateErrorInsights } from '../../services/ai/error-patterns.js';
import { generateMicroLesson, listTopics } from '../../services/ai/micro-lessons.js';
import { generateTransferInsights } from '../../services/ai/transfer-tracker.js';
import {
  getLabSuggestions,
  startLabExperiment,
  getCurrentLab,
  completeLabExperiment,
  abandonLabExperiment,
  getLabHistory,
} from '../../services/ai/lab.js';
import { getOrCreateDemoUser } from '../../services/users.js';
import type { Lang } from '../../services/ai/providers/types.js';
import type { LessonTopic } from '../../services/ai/prompts-micro-lessons.js';

const VALID_TOPICS: LessonTopic[] = [
  'working_memory',
  'attention_control',
  'processing_speed',
  'inhibitory_control',
  'cognitive_flexibility',
];

const StartLabBody = z.object({
  experiment_key: z.string().min(1),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiProfileRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ Cognitive Fingerprint ═══ */
  fastify.get<{ Querystring: { language?: string; refresh?: string } }>(
    '/ai/fingerprint',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateFingerprint(userId, lang, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'fingerprint_failed', message: (err as Error).message });
      }
    }
  );

  fastify.post<{ Body: { language?: string } }>(
    '/ai/fingerprint/regenerate',
    async (request, reply) => {
      const lang: Lang = request.body?.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateFingerprint(userId, lang, true);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'fingerprint_failed', message: (err as Error).message });
      }
    }
  );

  /* ═══ Error Pattern Analysis ═══ */
  fastify.get<{ Querystring: { language?: string; game_id?: string; refresh?: string } }>(
    '/ai/error-patterns',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const gameId = request.query.game_id || null;
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateErrorInsights(userId, lang, gameId, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'error_patterns_failed', message: (err as Error).message });
      }
    }
  );

  /* ═══ Micro-Lessons ═══ */

  fastify.get('/ai/lessons/topics', async () => {
    return { topics: listTopics() };
  });

  fastify.get<{ Querystring: { language?: string; refresh?: string } }>(
    '/ai/lessons',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateMicroLesson(userId, lang, undefined, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lesson_failed', message: (err as Error).message });
      }
    }
  );

  fastify.get<{ Params: { topic: string }; Querystring: { language?: string; refresh?: string } }>(
    '/ai/lessons/:topic',
    async (request, reply) => {
      const topicParam = request.params.topic as LessonTopic;
      if (!VALID_TOPICS.includes(topicParam)) {
        return reply.code(404).send({
          error: 'unknown_topic',
          valid_topics: VALID_TOPICS,
        });
      }
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateMicroLesson(userId, lang, topicParam, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lesson_failed', message: (err as Error).message });
      }
    }
  );

  fastify.post<{ Body: { language?: string; topic?: string } }>(
    '/ai/lessons/regenerate',
    async (request, reply) => {
      const lang: Lang = request.body?.language === 'ar' ? 'ar' : 'en';
      const bodyTopic = request.body?.topic as LessonTopic | undefined;
      if (bodyTopic && !VALID_TOPICS.includes(bodyTopic)) {
        return reply.code(400).send({ error: 'unknown_topic', valid_topics: VALID_TOPICS });
      }
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateMicroLesson(userId, lang, bodyTopic, true);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lesson_failed', message: (err as Error).message });
      }
    }
  );

  /* ═══ Transfer Tracker ═══ */
  fastify.get<{ Querystring: { language?: string; refresh?: string } }>(
    '/ai/transfer-tracker',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await generateTransferInsights(userId, lang, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'transfer_tracker_failed', message: (err as Error).message });
      }
    }
  );

  /* ═══ AI Lab ═══ */

  fastify.get<{ Querystring: { language?: string } }>(
    '/ai/lab/suggestions',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const items = await getLabSuggestions(userId, lang);
        return reply.code(200).send({ suggestions: items });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lab_suggestions_failed', message: (err as Error).message });
      }
    }
  );

  fastify.get<{ Querystring: { language?: string } }>(
    '/ai/lab/current',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const current = await getCurrentLab(userId, lang);
        if (!current) return reply.code(404).send({ error: 'no_experiment' });
        return reply.code(200).send(current);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lab_current_failed', message: (err as Error).message });
      }
    }
  );

  fastify.post(
    '/ai/lab/start',
    async (request, reply) => {
      const parsed = StartLabBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'invalid_payload',
          issues: parsed.error.flatten().fieldErrors,
        });
      }
      const lang: Lang = parsed.data.language;
      const userId = await getOrCreateDemoUser();
      try {
        const result = await startLabExperiment(userId, parsed.data.experiment_key, lang);
        return reply.code(201).send(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'unknown_experiment') return reply.code(404).send({ error: msg });
        if (msg === 'experiment_already_active') return reply.code(409).send({ error: msg });
        if (msg === 'not_enough_sessions') return reply.code(403).send({ error: msg });
        request.log.error(err);
        return reply.code(500).send({ error: 'lab_start_failed', message: msg });
      }
    }
  );

  fastify.post<{ Body: { language?: string } }>(
    '/ai/lab/complete',
    async (request, reply) => {
      const lang: Lang = request.body?.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const result = await completeLabExperiment(userId, lang);
        return reply.code(200).send(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'no_experiment') return reply.code(404).send({ error: msg });
        if (msg === 'experiment_not_active') return reply.code(409).send({ error: msg });
        if (msg === 'not_enough_sessions_to_complete') return reply.code(400).send({ error: msg, message: 'Need at least 3 sessions to complete the experiment' });
        request.log.error(err);
        return reply.code(500).send({ error: 'lab_complete_failed', message: msg });
      }
    }
  );

  fastify.delete('/ai/lab/abandon', async (request, reply) => {
    const userId = await getOrCreateDemoUser();
    try {
      await abandonLabExperiment(userId);
      return reply.code(200).send({ status: 'abandoned' });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'lab_abandon_failed', message: (err as Error).message });
    }
  });

  fastify.get<{ Querystring: { limit?: string } }>(
    '/ai/lab/history',
    async (request, reply) => {
      const limit = Math.min(20, Math.max(1, parseInt(request.query.limit ?? '10', 10) || 10));
      const userId = await getOrCreateDemoUser();
      try {
        const items = await getLabHistory(userId, limit);
        return reply.code(200).send({ history: items });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'lab_history_failed', message: (err as Error).message });
      }
    }
  );
};

export default aiProfileRoutes;