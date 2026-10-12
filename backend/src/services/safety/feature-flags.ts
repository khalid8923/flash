/* ═══════════════════════════════════════════════════════════
   FLASH - Feature Flags (M9-01)
   In-memory cached + DB-backed. Simple percentage rollout
   via deterministic hash(playerId + flagKey) mod 100.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { createHash } from 'node:crypto';

interface Flag {
  key: string;
  enabled: boolean;
  rollout_pct: number;
  description: string | null;
  owner: string | null;
  expires_at: string | null;
}

const CACHE_TTL_MS = 30_000;
let cache: Map<string, Flag> = new Map();
let lastFetch = 0;

async function loadCache(): Promise<void> {
  if (Date.now() - lastFetch < CACHE_TTL_MS && cache.size > 0) return;
  const r = await pool.query<Flag>(
    `SELECT key, enabled, rollout_pct, description, owner, expires_at FROM feature_flags`
  );
  cache = new Map(r.rows.map((row) => [row.key, row]));
  lastFetch = Date.now();
}

export function invalidateCache(): void {
  lastFetch = 0;
}

export async function listFlags(): Promise<Flag[]> {
  const r = await pool.query<Flag>(
    `SELECT key, enabled, rollout_pct, description, owner, expires_at FROM feature_flags ORDER BY key`
  );
  return r.rows;
}

export async function setFlag(params: {
  key: string;
  enabled?: boolean;
  rollout_pct?: number;
  description?: string;
  owner?: string;
  expires_at?: string | null;
  actorId?: string | null;
}): Promise<Flag> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof params.enabled === 'boolean') { fields.push(`enabled = $${i++}`); values.push(params.enabled); }
  if (typeof params.rollout_pct === 'number') { fields.push(`rollout_pct = $${i++}`); values.push(params.rollout_pct); }
  if (params.description !== undefined) { fields.push(`description = $${i++}`); values.push(params.description); }
  if (params.owner !== undefined) { fields.push(`owner = $${i++}`); values.push(params.owner); }
  if (params.expires_at !== undefined) { fields.push(`expires_at = $${i++}`); values.push(params.expires_at); }

  fields.push(`updated_at = now()`);
  fields.push(`updated_by = $${i++}`);
  values.push(params.actorId ?? null);

  values.push(params.key);

  const r = await pool.query<Flag>(
    `UPDATE feature_flags SET ${fields.join(', ')} WHERE key = $${i}
       RETURNING key, enabled, rollout_pct, description, owner, expires_at`,
    values
  );

  invalidateCache();
  if (!r.rowCount) throw new Error('flag_not_found');
  return r.rows[0]!;
}

/** Evaluate a flag for a specific playerId (or null for global). */
export async function isEnabled(key: string, playerId?: string | null): Promise<boolean> {
  await loadCache();
  const flag = cache.get(key);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.expires_at && new Date(flag.expires_at).getTime() < Date.now()) return false;
  if (flag.rollout_pct >= 100) return true;
  if (flag.rollout_pct <= 0) return false;
  if (!playerId) return false;
  const h = createHash('sha1').update(key + ':' + playerId).digest();
  const bucket = h[0]! % 100;
  return bucket < flag.rollout_pct;
}