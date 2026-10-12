/* ═══════════════════════════════════════════════════════════
   Cache Layer — Redis Implementation (STUB)
   ═══════════════════════════════════════════════════════════
   Status: Not implemented. For scale migration.
   When to activate: > 1 backend instance OR > 10K users.
   Dependency needed: ioredis or @upstash/redis
*/

import type { Cache, CacheStats } from './types.js';

export class RedisCache implements Cache {
  constructor(_opts: { url: string; prefix?: string }) {
    throw new Error(
      'RedisCache not yet implemented. ' +
      'To activate: npm install ioredis, then implement using the same interface as MemoryCache.'
    );
  }

  async get<T>(_key: string): Promise<T | null> { throw new Error('not_implemented'); }
  async set<T>(_key: string, _value: T): Promise<void> { throw new Error('not_implemented'); }
  async del(_key: string): Promise<boolean> { throw new Error('not_implemented'); }
  async has(_key: string): Promise<boolean> { throw new Error('not_implemented'); }
  async getOrSet<T>(_key: string, _fn: () => Promise<T>): Promise<T> { throw new Error('not_implemented'); }
  async incr(_key: string, _by?: number): Promise<number> { throw new Error('not_implemented'); }
  async clearPrefix(_prefix: string): Promise<number> { throw new Error('not_implemented'); }
  async stats(): Promise<CacheStats> { throw new Error('not_implemented'); }
  async close(): Promise<void> { throw new Error('not_implemented'); }
}