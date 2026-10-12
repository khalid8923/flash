/* ═══════════════════════════════════════════════════════════
   Idempotency Layer — Postgres Implementation
   ═══════════════════════════════════════════════════════════
   Durable across restarts and instances.
   Use for: production, any scale.
*/

import { pool } from '../../config/db.js';
import type { IdempotencyStore, IdempotentRecord } from './types.js';

export class DbIdempotencyStore implements IdempotencyStore {
  async get<T>(key: string): Promise<IdempotentRecord<T> | null> {
    const r = await pool.query<{
      key: string; response: string; status: number;
      created_at: string; expires_at: string;
    }>(
      `SELECT key, response::text, status, created_at, expires_at
         FROM idempotency_keys
        WHERE key = $1 AND expires_at > now()`,
      [key]
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      key: row.key,
      response: JSON.parse(row.response) as T,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async set<T>(key: string, response: T, status: number, ttlMs = 300_000): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    await pool.query(
      `INSERT INTO idempotency_keys (key, response, status, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(response), status, expiresAt]
    );
  }

  async del(key: string): Promise<boolean> {
    const r = await pool.query(`DELETE FROM idempotency_keys WHERE key = $1`, [key]);
    return (r.rowCount ?? 0) > 0;
  }

  async cleanup(): Promise<number> {
    const r = await pool.query(`DELETE FROM idempotency_keys WHERE expires_at < now()`);
    return r.rowCount ?? 0;
  }
}