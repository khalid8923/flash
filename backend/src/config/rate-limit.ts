/* ═══════════════════════════════════════════════════════════
   FLASH - Rate Limit Config (R11)
   Per-route limits, layered by sensitivity.
   ═══════════════════════════════════════════════════════════ */

import type { RateLimitOptions } from '@fastify/rate-limit';

/** Consistent key: prefer X-Forwarded-For, fallback to req.ip */
export function ipKey(req: { ip: string; headers: Record<string, string | string[] | undefined> }): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0];
    return first ? first.trim() : req.ip;
  }
  return req.ip;
}

/** Standard limits for a route */
export const LIMITS = {
  /* Public, cheap */
  PUBLIC: { max: 200, timeWindow: '1 minute' } as RateLimitOptions,

  /* AI endpoints - protect Groq quota */
  AI: { max: 20, timeWindow: '1 minute' } as RateLimitOptions,

  /* Session ingestion */
  SESSION_POST: { max: 30, timeWindow: '1 minute' } as RateLimitOptions,

  /* Admin */
  ADMIN: { max: 10, timeWindow: '1 minute' } as RateLimitOptions,

  /* Voice (Whisper is expensive) */
  VOICE: { max: 5, timeWindow: '1 minute' } as RateLimitOptions,

  /* Write paths (future auth) */
  AUTH: { max: 5, timeWindow: '1 minute' } as RateLimitOptions,
};