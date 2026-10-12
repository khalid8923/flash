/* ═══════════════════════════════════════════════════════════
   FLASH - Player Auth Routes (R03b)
   POST /auth/otp/request   { email }
   POST /auth/otp/verify    { email, code }
   GET  /auth/me
   POST /auth/logout
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requestOTP, verifyOTP, revokeSession } from '../../services/auth/auth.js';
import { requirePlayer } from '../../middleware/auth.js';

const RequestOtpBody = z.object({
  email: z.string().email().max(200),
});

const VerifyOtpBody = z.object({
  email: z.string().email().max(200),
  code: z.string().regex(/^\d{6}$/),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ POST /auth/otp/request ═══ */
  fastify.post('/auth/otp/request', async (req, reply) => {
    const parsed = RequestOtpBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    try {
      const result = await requestOTP(parsed.data.email);
      return result;
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'too_many_requests') return reply.code(429).send({ error: msg });
      req.log.error({ err }, 'otp request failed');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  /* ═══ POST /auth/otp/verify ═══ */
  fastify.post('/auth/otp/verify', async (req, reply) => {
    const parsed = VerifyOtpBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { email, code } = parsed.data;
    try {
      const result = await verifyOTP(email, code, {
        user_agent: String(req.headers['user-agent'] ?? ''),
        ip: req.ip,
        device_id: String(req.headers['x-device-id'] ?? '') || undefined,
      });
      return reply.code(201).send({ ok: true, ...result });
    } catch (err) {
      const msg = (err as Error).message;
      const code400 = ['no_otp', 'otp_invalid', 'otp_expired', 'too_many_attempts'];
      if (code400.includes(msg)) return reply.code(401).send({ error: msg });
      req.log.error({ err }, 'otp verify failed');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  /* ═══ GET /auth/me ═══ */
  fastify.get('/auth/me', { preHandler: requirePlayer }, async (req) => {
    return {
      ok: true,
      player: {
        id: req.player!.playerId,
        email: req.player!.email,
        display_name: req.player!.display_name,
        origin: req.player!.origin,
        locale: req.player!.locale,
      },
    };
  });

  /* ═══ POST /auth/logout ═══ */
  fastify.post('/auth/logout', { preHandler: requirePlayer }, async (req) => {
    await revokeSession(req.player!.sessionId);
    return { ok: true };
  });
};

export default authRoutes;