/* ═══════════════════════════════════════════════════════════
   FLASH - Simple in-memory cache (single-process)
   For per-request caching of rarely-changing data:
   catalog, domains, plans (per-day).
   Auto-prunes expired entries on access.
   ═══════════════════════════════════════════════════════════ */

import { createHash } from 'node:crypto';

interface Entry<T> { value: T; expiresAt: number; }

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key) as Entry<T> | undefined;
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(key); return null; }
  return e.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (store.size > 500) prune();
}

export function cacheDel(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

function prune(): void {
  const now = Date.now();
  for (const [k, e] of store.entries()) if (now > e.expiresAt) store.delete(k);
}

/**
 * Fast ETag: sha1 of JSON, first 16 chars (base64-ish).
 * Short enough for headers, long enough for collision-free.
 */
export function makeETag(payload: unknown): string {
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return '"' + createHash('sha1').update(json).digest('base64url').slice(0, 16) + '"';
}

/**
 * Handle a conditional GET request.
 * Returns true if the client cache is still valid (304 sent).
 */
export function sendIfMatch(ifNoneMatch: string | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false;
  /* Support multi-value: "a", "b", "c" */
  const candidates = ifNoneMatch.split(',').map((s) => s.trim());
  return candidates.includes(etag);
}