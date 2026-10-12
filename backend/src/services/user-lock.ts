/* ============================================================
   FLASH Backend - Per-User Advisory Lock (R05)
   ============================================================
   Uses Lock abstraction (postgres | redis).
   Default: Postgres advisory lock (pg_advisory_xact_lock).
   Ensures serial writes to sessions per user.
   ============================================================ */

import { pool } from '../config/db.js';
import { getLock } from './lock/index.js';

/**
 * Execute `fn` while holding a per-user write lock.
 * The lock is auto-released when the transaction commits/rolls back.
 *
 * Uses the Lock abstraction so we can migrate to Redis at scale
 * without touching this file.
 */
export async function withUserLock<T>(
  userId: string,
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const lock = getLock();
  const release = await lock.acquire(`user:${userId}`, {
    waitMs: 10_000,   // wait up to 10 seconds
    ttlMs: 30_000,    // max hold 30 seconds (safety)
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
    await release();
  }
}