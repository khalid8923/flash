/* Engagement Routes — Batch 2 (streaks, favorites, ratings, notes, feedback) */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requirePlayer } from '../../middleware/auth.js';
import { getOrCreateStreak, recordActivity, awardFreezeToken } from '../../services/engagement/streaks.js';
import { list as listFav, add as addFav, remove as removeFav } from '../../services/engagement/favorites.js';
import { rate, getMyRating, getAggregate } from '../../services/engagement/ratings.js';
import { save as saveNote, get as getNote, listRecent as listNotes } from '../../services/engagement/session-notes.js';
import { submit as submitFeedback, getStats as feedbackStats } from '../../services/engagement/coach-feedback.js';

const GameBody = z.object({ game_id: z.string().min(1).max(80) });
const RateBody = z.object({
  game_id: z.string().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});
const NoteBody = z.object({
  session_id: z.string().uuid(),
  note: z.string().min(1).max(2000),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
});
const FeedbackBody = z.object({
  rating: z.number().int().min(1).max(5),
  helpful: z.boolean().optional(),
  comment: z.string().max(500).optional(),
  message_id: z.string().uuid().optional(),
});

const engagement2Routes: FastifyPluginAsync = async (fastify) => {

  /* ─── Streaks ─── */
  fastify.get('/me/streak', { preHandler: requirePlayer }, async (req) => {
    return await getOrCreateStreak(req.player!.playerId);
  });

  fastify.post('/me/streak/checkin', { preHandler: requirePlayer }, async (req) => {
    return await recordActivity(req.player!.playerId);
  });

  fastify.post('/me/streak/freeze-token', { preHandler: requirePlayer }, async (req) => {
    const count = await awardFreezeToken(req.player!.playerId, 1);
    return { freeze_tokens: count };
  });

  /* ─── Favorites ─── */
  fastify.get('/me/favorites', { preHandler: requirePlayer }, async (req) => {
    return { favorites: await listFav(req.player!.playerId) };
  });

  fastify.post('/me/favorites', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = GameBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_payload' });
    await addFav(req.player!.playerId, parsed.data.game_id);
    return { ok: true };
  });

  fastify.delete<{ Params: { gameId: string } }>(
    '/me/favorites/:gameId',
    { preHandler: requirePlayer },
    async (req) => {
      await removeFav(req.player!.playerId, req.params.gameId);
      return { ok: true };
    }
  );

  /* ─── Ratings ─── */
  fastify.post('/me/ratings', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = RateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_payload' });
    await rate(req.player!.playerId, parsed.data.game_id, parsed.data.rating, parsed.data.feedback);
    return { ok: true };
  });

  fastify.get<{ Params: { gameId: string } }>(
    '/games/:gameId/rating',
    async (req) => {
      return await getAggregate(req.params.gameId);
    }
  );

  fastify.get<{ Params: { gameId: string } }>(
    '/me/ratings/:gameId',
    { preHandler: requirePlayer },
    async (req) => {
      return { rating: await getMyRating(req.player!.playerId, req.params.gameId) };
    }
  );

  /* ─── Session Notes ─── */
  fastify.post('/me/session-notes', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = NoteBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_payload' });
    await saveNote(
      req.player!.playerId,
      parsed.data.session_id,
      parsed.data.note,
      parsed.data.mood,
      parsed.data.energy
    );
    return { ok: true };
  });

  fastify.get<{ Params: { sessionId: string } }>(
    '/me/session-notes/:sessionId',
    { preHandler: requirePlayer },
    async (req) => {
      return { note: await getNote(req.player!.playerId, req.params.sessionId) };
    }
  );

  fastify.get('/me/session-notes', { preHandler: requirePlayer }, async (req) => {
    return { notes: await listNotes(req.player!.playerId) };
  });

  /* ─── Coach Feedback ─── */
  fastify.post('/me/coach-feedback', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = FeedbackBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_payload' });
    await submitFeedback(
      req.player!.playerId,
      parsed.data.rating,
      parsed.data.helpful,
      parsed.data.comment,
      parsed.data.message_id
    );
    return { ok: true };
  });

  fastify.get('/admin/coach-feedback/stats', async () => {
    return await feedbackStats(30);
  });
};

export default engagement2Routes;