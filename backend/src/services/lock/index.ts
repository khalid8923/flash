/* ═══════════════════════════════════════════════════════════
   Lock Layer — Factory & Singleton
   ═══════════════════════════════════════════════════════════
   To migrate: implement RedisLock, then set LOCK_PROVIDER=redis.
   Current: PostgresLock (pg_advisory_xact_lock).
*/

import type { Lock } from './types.js';
import { PostgresLock } from './postgres.js';

let instance: Lock | null = null;

function createLock(): Lock {
  const provider = process.env.LOCK_PROVIDER ?? 'postgres';
  if (provider === 'redis') {
    throw new Error(
      'RedisLock not yet implemented. ' +
      'To activate: npm install ioredis, then update services/lock/redis.ts. ' +
      'Currently using PostgresLock (pg_advisory_xact_lock).'
    );
  }
  return new PostgresLock();
}

export function getLock(): Lock {
  if (!instance) instance = createLock();
  return instance;
}

export { PostgresLock };
export type { Lock } from './types.js';