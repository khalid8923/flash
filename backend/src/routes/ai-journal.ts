/* ═══════════════════════════════════════════════════════════
   AI Journal Routes
   Mood + energy logging → personalized plan adjustment
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  upsertTodayEntry,
  getTodayEntry,
  getToday,
  getHistory,
  deleteTodayEntry,
  isValidMood,
} from '../services/ai/journal.js';
import { getOrCreateDemoUser } from '../services/users.js';
import type { Lang } from '../services/ai/providers/types.js';

const EntryBody = z.object({
  mood: z.enum(['calm', 'focused', 'tired', 'stressed', 'energized']),
  energy: z.number().int().min(1).max(5),
  note: z.string().max(500).nullable().optional(),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiJournalRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ Create/update today's entry + get adjustment ═══ */
  fastify.post('/ai/journal/entry', async (request, reply) => {
    const parsed = EntryBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    if (!isValidMood(parsed.data.mood)) {
      return reply.code(400).send({ error: 'invalid_mood' });
    }
    const userId = await getOrCreateDemoUser();
    try {
      await upsertTodayEntry(
        userId,
        parsed.data.mood,
        parsed.data.energy,
        parsed.data.note ?? null
      );
      const today = await getToday(userId, parsed.data.language as Lang);
      return reply.code(201).send(today);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: 'journal_entry_failed',
        message: (err as Error).message,
      });
    }
  });

  /* ═══ Get today's entry only ═══ */
  fastify.get('/ai/journal/today/entry', async (request, reply) => {
    const userId = await getOrCreateDemoUser();
    const entry = await getTodayEntry(userId);
    if (!entry) return reply.code(404).send({ error: 'no_entry_today' });
    return reply.code(200).send(entry);
  });

  /* ═══ Get today's summary + adjustment (main endpoint) ═══ */
  fastify.get<{ Querystring: { language?: string } }>(
    '/ai/journal/today',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const userId = await getOrCreateDemoUser();
      try {
        const today = await getToday(userId, lang);
        return reply.code(200).send(today);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'journal_today_failed',
          message: (err as Error).message,
        });
      }
    }
  );

  /* ═══ History (30 days default) ═══ */
  fastify.get<{ Querystring: { days?: string; language?: string } }>(
    '/ai/journal/history',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const daysRaw = parseInt(request.query.days ?? '30', 10);
      const days = Number.isFinite(daysRaw) ? daysRaw : 30;
      const userId = await getOrCreateDemoUser();
      try {
        const history = await getHistory(userId, days, lang);
        return reply.code(200).send(history);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'journal_history_failed',
          message: (err as Error).message,
        });
      }
    }
  );

  /* ═══ Reset today ═══ */
  fastify.delete('/ai/journal/today', async (request, reply) => {
    const userId = await getOrCreateDemoUser();
    try {
      const removed = await deleteTodayEntry(userId);
      return reply.code(200).send({ deleted: removed });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: 'journal_delete_failed',
        message: (err as Error).message,
      });
    }
  });
};

export default aiJournalRoutes;