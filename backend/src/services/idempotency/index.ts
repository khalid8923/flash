/* ═══════════════════════════════════════════════════════════
   Idempotency Layer — Factory & Singleton
   ═══════════════════════════════════════════════════════════
   To migrate: set IDEMPOTENCY_PROVIDER=db in env.
*/

import type { IdempotencyStore } from './types.js';
import { MemoryIdempotencyStore } from './memory.js';
import { DbIdempotencyStore } from './db.js';

let instance: IdempotencyStore | null = null;

export function getIdempotencyStore(): IdempotencyStore {
  if (instance) return instance;
  const provider = process.env.IDEMPOTENCY_PROVIDER ?? 'db';
  instance = provider === 'memory'
    ? new MemoryIdempotencyStore()
    : new DbIdempotencyStore();
  return instance;
}

export type { IdempotencyStore, IdempotentRecord } from './types.js';