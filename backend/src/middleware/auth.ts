/* ═══════════════════════════════════════════════════════════
   FLASH - Player Auth Middleware (Fixed Import)
   ═══════════════════════════════════════════════════════════ */
import type { FastifyRequest, FastifyReply } from 'fastify';
// FIXED: Correct path is services/auth/auth.js not services/auth.js
import { verifySession, getPlayer, type AuthedPlayer } from '../services/auth/auth.js';
import { getOrCreateDemoUser } from '../services/users.js';

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
  
  // DEV BYPASS: If no token and in dev, use Demo User
  if (!header && process.env.NODE_ENV !== 'production') {
    const demoId = await getOrCreateDemoUser();
    req.player = { 
      playerId: demoId, 
      sessionId: 'demo-session', 
      email: 'demo@flash.app', 
      display_name: 'Demo User', 
      origin: 'demo', 
      locale: 'en' 
    };
    return;
  }

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