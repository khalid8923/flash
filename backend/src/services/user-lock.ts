/* ═══════════════════════════════════════════════════════════
   FLASH - Per-user lock (R05)
   Serializes concurrent writes for the same user.
   Uses Postgres advisory lock (auto-released on COMMIT/ROLLBACK).
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';
import type { PoolClient } from 'pg';

export async function withUserLock<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    /* Advisory lock on hashtext(userId), category 0.
       Released automatically at COMMIT/ROLLBACK. */
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), 0)', [userId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}