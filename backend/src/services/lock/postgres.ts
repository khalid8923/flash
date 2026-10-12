/* ═══════════════════════════════════════════════════════════
   Lock Layer — Postgres Advisory Lock
   ═══════════════════════════════════════════════════════════
   Uses pg_advisory_xact_lock (auto-released at txn end).
*/

import type { PoolClient } from 'pg';
import { pool } from '../../config/db.js';
import type { Lock } from './types.js';

function hashKeyToInt(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h) + key.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2147483647;
}

export class PostgresLock implements Lock {
  async acquire(key: string, opts: { ttlMs?: number; waitMs?: number } = {}): Promise<() => Promise<void>> {
    const client = await pool.connect();
    try {
      const lockId = hashKeyToInt(key);
      const waitMs = opts.waitMs ?? 5000;
      await client.query(`SET LOCAL statement_timeout = ${waitMs}`);
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);
      return async () => {
        try { await client.query('COMMIT'); } catch (_) {}
        client.release();
      };
    } catch (err) {
      client.release();
      throw err;
    }
  }

  async tryAcquire(key: string, _opts?: { ttlMs?: number }): Promise<(() => Promise<void>) | null> {
    const client = await pool.connect();
    try {
      const lockId = hashKeyToInt(key);
      await client.query('BEGIN');
      const r = await client.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1) AS locked', [lockId]
      );
      if (!r.rows[0]?.locked) {
        await client.query('ROLLBACK');
        client.release();
        return null;
      }
      return async () => {
        try { await client.query('COMMIT'); } catch (_) {}
        client.release();
      };
    } catch (err) {
      client.release();
      throw err;
    }
  }

  /** For integration with existing transactions */
  async withClient(client: PoolClient, key: string, fn: () => Promise<void>): Promise<void> {
    const lockId = hashKeyToInt(key);
    await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);
    await fn();
  }
}