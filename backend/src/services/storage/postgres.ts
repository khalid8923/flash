/* ═══════════════════════════════════════════════════════════
   Storage Layer — Postgres Implementation
   ═══════════════════════════════════════════════════════════
   Uses blobs table. Works for: small files, backups, exports.
   Limit: Postgres bytea max ~1GB per row. Neon has 1GB total.
*/

import { pool } from '../../config/db.js';
import type { Storage, StorageObject, StoragePutOptions, StorageStats } from './types.js';

export class PostgresStorage implements Storage {
  async put(key: string, data: Buffer | Uint8Array, opts: StoragePutOptions = {}): Promise<StorageObject> {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const contentType = opts.contentType ?? 'application/octet-stream';
    const expiresAt = opts.ttlMs ? new Date(Date.now() + opts.ttlMs) : null;

    await pool.query(
      `INSERT INTO blobs (key, data, content_type, size, public, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (key) DO UPDATE SET
         data = EXCLUDED.data,
         content_type = EXCLUDED.content_type,
         size = EXCLUDED.size,
         public = EXCLUDED.public,
         metadata = EXCLUDED.metadata,
         expires_at = EXCLUDED.expires_at,
         uploaded_at = now()`,
      [key, buf, contentType, buf.length, opts.public ?? false, opts.metadata ?? {}, expiresAt]
    );

    return {
      key,
      size: buf.length,
      contentType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async get(key: string): Promise<Buffer | null> {
    const r = await pool.query<{ data: Buffer }>(
      `SELECT data FROM blobs WHERE key = $1 AND (expires_at IS NULL OR expires_at > now())`,
      [key]
    );
    return r.rows[0]?.data ?? null;
  }

  async del(key: string): Promise<boolean> {
    const r = await pool.query(`DELETE FROM blobs WHERE key = $1`, [key]);
    return (r.rowCount ?? 0) > 0;
  }

  async exists(key: string): Promise<boolean> {
    const r = await pool.query(
      `SELECT 1 FROM blobs WHERE key = $1 AND (expires_at IS NULL OR expires_at > now())`,
      [key]
    );
    return (r.rowCount ?? 0) > 0;
  }

  async list(prefix: string, limit = 100): Promise<StorageObject[]> {
    const r = await pool.query<{
      key: string; size: number; content_type: string; uploaded_at: string;
    }>(
      `SELECT key, size, content_type, uploaded_at
         FROM blobs
        WHERE key LIKE $1 || '%' AND (expires_at IS NULL OR expires_at > now())
        ORDER BY uploaded_at DESC LIMIT $2`,
      [prefix, limit]
    );
    return r.rows.map((row) => ({
      key: row.key,
      size: row.size,
      contentType: row.content_type,
      uploadedAt: row.uploaded_at,
    }));
  }

  async url(key: string, _expiresInMs?: number): Promise<string | null> {
    const r = await pool.query<{ public: boolean }>(
      `SELECT public FROM blobs WHERE key = $1`,
      [key]
    );
    if (!r.rows[0]) return null;
    return `/storage/${encodeURIComponent(key)}`;
  }

  async stats(): Promise<StorageStats> {
    const r = await pool.query<{ n: string; bytes: string }>(
      `SELECT COUNT(*)::text AS n, COALESCE(SUM(size), 0)::text AS bytes FROM blobs`
    );
    return {
      provider: 'postgres',
      objects: parseInt(r.rows[0]?.n ?? '0', 10),
      totalBytes: parseInt(r.rows[0]?.bytes ?? '0', 10),
    };
  }
}