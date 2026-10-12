/* ═══════════════════════════════════════════════════════════
   Engagement Routes (XP + Referrals + Daily Challenge)
   ═══════════════════════════════════════════════════════════ */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requirePlayer } from '../../middleware/auth.js';
import { getOrCreateXp, awardXp, getXpHistory } from '../../services/engagement/xp.js';
import { getOrCreateCode, redeemCode, getStats } from '../../services/engagement/referrals.js';
import { getOrCreateToday, submitResult, getLeaderboard } from '../../services/engagement/daily-challenge.js';

const RedeemBody = z.object({ code: z.string().min(4).max(20) });
const ChallengeResultBody = z.object({
  challenge_id: z.string().uuid(),
  score: z.number().int().min(0),
  accuracy: z.number().min(0).max(100),
  median_rt_ms: z.number().int().min(0),
  session_id: z.string().uuid().optional(),
});

const engagementRoutes: FastifyPluginAsync = async (fastify) => {

  /* ─── XP ─── */
  fastify.get('/me/xp', { preHandler: requirePlayer }, async (req) => {
    const userId = req.player!.playerId;
    return await getOrCreateXp(userId);
  });

  fastify.get('/me/xp/history', { preHandler: requirePlayer }, async (req) => {
    const userId = req.player!.playerId;
    const limit = 50;
    const history = await getXpHistory(userId, limit);
    return { history };
  });

  /* ─── Referrals ─── */
  fastify.get('/me/referral/code', { preHandler: requirePlayer }, async (req) => {
    const userId = req.player!.playerId;
    const code = await getOrCreateCode(userId);
    return { code };
  });

  fastify.get('/me/referral/stats', { preHandler: requirePlayer }, async (req) => {
    const userId = req.player!.playerId;
    return await getStats(userId);
  });

  fastify.post('/referrals/redeem', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = RedeemBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload' });
    }
    const userId = req.player!.playerId;
    try {
      const result = await redeemCode(userId, parsed.data.code);
      /* Award XP to both */
      await awardXp(userId, 100, 'referral_welcome');
      await awardXp(result.referrer_id, 200, 'referral_success');
      return { ok: true };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  /* ─── Daily Challenge ─── */
  fastify.get('/daily-challenge', async () => {
    const ch = await getOrCreateToday();
    return ch;
  });

  fastify.get('/daily-challenge/leaderboard', async () => {
    const ch = await getOrCreateToday();
    const leaderboard = await getLeaderboard(ch.id);
    return { challenge_id: ch.id, leaderboard };
  });

  fastify.post('/daily-challenge/result', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = ChallengeResultBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload' });
    }
    const userId = req.player!.playerId;
    const { challenge_id, score, accuracy, median_rt_ms, session_id } = parsed.data;
    await submitResult(userId, challenge_id, score, accuracy, median_rt_ms, session_id);
    /* Award XP for participation */
    const award = await awardXp(userId, 50, 'daily_challenge', challenge_id);
    return { ok: true, xp: award };
  });
};

export default engagementRoutes;