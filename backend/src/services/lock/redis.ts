/* ═══════════════════════════════════════════════════════════
   Lock Layer — Redis Implementation (STUB)
   ═══════════════════════════════════════════════════════════
   Uses Redlock algorithm or SET NX PX.
   Activate when: > 1 backend instance with shared cache.
*/

import type { Lock } from './types.js';

export class RedisLock implements Lock {
  constructor(_opts: { url: string }) {
    throw new Error('RedisLock not yet implemented. Use PostgresLock for now.');
  }
  async acquire(_key: string, _opts?: { ttlMs?: number; waitMs?: number }): Promise<() => Promise<void>> { throw new Error('not_implemented'); }
  async tryAcquire(_key: string, _opts?: { ttlMs?: number }): Promise<(() => Promise<void>) | null> { throw new Error('not_implemented'); }
}