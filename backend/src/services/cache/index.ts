/* ═══════════════════════════════════════════════════════════
   Cache Layer — Factory & Singleton
   ═══════════════════════════════════════════════════════════
   To migrate: implement RedisCache, then set CACHE_PROVIDER=redis.
   Current: MemoryCache (single-instance, dev/free-tier).
*/

import type { Cache } from './types.js';
import { MemoryCache } from './memory.js';

let instance: Cache | null = null;

function createCache(): Cache {
  const provider = process.env.CACHE_PROVIDER ?? 'memory';
  if (provider === 'redis') {
    throw new Error(
      'RedisCache not yet implemented. ' +
      'To activate: npm install ioredis, then update services/cache/index.ts. ' +
      'Currently using memory cache (single-instance only).'
    );
  }
  return new MemoryCache();
}

export function getCache(): Cache {
  if (!instance) instance = createCache();
  return instance;
}

export async function closeCache(): Promise<void> {
  if (instance) { await instance.close(); instance = null; }
}

export type { Cache, CacheStats, CacheSetOptions } from './types.js';