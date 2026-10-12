/* ═══════════════════════════════════════════════════════════
   FLASH - Player Auth Middleware (R03b)
   Reads `Authorization: Bearer ses_...`, attaches req.player.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifySession, getPlayer, type AuthedPlayer } from '../services/auth/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    player?: AuthedPlayer & {
      email: string | null;
      display_name: string;
      origin: string;
      locale: string;
    };
  }
}

export async function requirePlayer(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
  const token = header.slice(7).trim();
  const session = await verifySession(token);
  if (!session) return reply.code(401).send({ error: 'invalid_token' });

  const user = await getPlayer(session.playerId);
  if (!user || user.status !== 'active') {
    return reply.code(403).send({ error: 'account_not_active' });
  }
  req.player = { ...session, email: user.email, display_name: user.display_name, origin: user.origin, locale: user.locale };
}

/** Optional auth: attaches req.player if valid, but never 401s. */
export async function optionalPlayer(req: FastifyRequest): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return;
  const token = header.slice(7).trim();
  const session = await verifySession(token);
  if (!session) return;
  const user = await getPlayer(session.playerId);
  if (user && user.status === 'active') {
    req.player = { ...session, email: user.email, display_name: user.display_name, origin: user.origin, locale: user.locale };
  }
}