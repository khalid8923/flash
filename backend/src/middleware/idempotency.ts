/* ============================================================
   FLASH Backend - Idempotency Middleware
   ============================================================
   Uses IdempotencyStore abstraction (memory | db).
   Default: DB (durable across restarts and instances).
   ============================================================ */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'node:crypto';
import { getIdempotencyStore } from '../services/idempotency/index.js';

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

function isMutableMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

export async function idempotencyHook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = req.headers['idempotency-key'];
  if (!raw || typeof raw !== 'string') return;
  if (!isMutableMethod(req.method)) return;

  const hashed = hashKey(raw);
  const store = getIdempotencyStore();

  try {
    const cached = await store.get<unknown>(hashed);
    if (cached) {
      reply
        .code(cached.status)
        .header('content-type', 'application/json; charset=utf-8')
        .header('x-idempotent-replay', '1')
        .send(cached.response);
      return;
    }
  } catch (err) {
    req.log.warn({ err }, 'Idempotency lookup failed (non-fatal)');
    return; // fail-open — let the request proceed
  }

  /* Intercept reply.send to persist the result */
  const originalSend = reply.send.bind(reply);
  reply.send = function (payload: unknown) {
    /* Only cache successful mutations */
    if (reply.statusCode < 500 && reply.statusCode !== 409) {
      /* Fire-and-forget persist; do not block the response */
      store
        .set(hashed, payload, reply.statusCode, TTL_MS)
        .catch((err: Error) => {
          req.log.warn({ err: err.message }, 'Idempotency persist failed (non-fatal)');
        });
    }
    return originalSend(payload);
  } as typeof reply.send;
}