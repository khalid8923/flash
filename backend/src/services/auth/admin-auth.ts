/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Auth Service
   Simple token-based identity + hash-chained audit log.
   Upgrade path: add Passkey/TOTP later (M1-01 P0+).
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { createHash, randomBytes } from 'node:crypto';

export type AdminRole = 'owner' | 'ops' | 'science' | 'support' | 'analyst';

export interface Admin {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
}

export interface AuditParams {
  adminId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
}

/** Generate a new admin token (shown once, never stored plain). */
export function generateToken(): string {
  return 'adm_' + randomBytes(32).toString('base64url');
}

/** SHA-256 hash for storage/lookup. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Verify a Bearer token → Admin or null. */
export async function verifyAdminToken(token: string): Promise<Admin | null> {
  if (!token || !token.startsWith('adm_')) return null;
  const hash = hashToken(token);
  const r = await pool.query<Admin>(
    `SELECT id, email, display_name, role
       FROM admin_users
      WHERE token_hash = $1 AND status = 'active'`,
    [hash]
  );
  return r.rows[0] ?? null;
}

/** Append one audit entry (hash-chained). */
export async function logAdminAction(p: AuditParams): Promise<void> {
  const last = await pool.query<{ current_hash: string }>(
    `SELECT current_hash FROM admin_audit_log ORDER BY id DESC LIMIT 1`
  );
  const prevHash = last.rows[0]?.current_hash ?? '0'.repeat(64);

  const payload = JSON.stringify({
    adminId: p.adminId,
    action: p.action,
    targetType: p.targetType ?? null,
    targetId: p.targetId ?? null,
    reason: p.reason ?? null,
    prevHash,
  });
  const currentHash = createHash('sha256').update(payload).digest('hex');

  await pool.query(
    `INSERT INTO admin_audit_log
       (admin_id, action, target_type, target_id, reason, ip, user_agent, prev_hash, current_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      p.adminId, p.action,
      p.targetType ?? null, p.targetId ?? null, p.reason ?? null,
      p.ip ?? null, p.userAgent ?? null,
      prevHash, currentHash,
    ]
  );
}

/** Create an admin (used by setup script + invite endpoint). */
export async function createAdmin(params: {
  email: string;
  displayName: string;
  role: AdminRole;
  createdBy?: string | null;
}): Promise<{ admin: Admin; token: string }> {
  const token = generateToken();
  const hash = hashToken(token);
  const r = await pool.query<Admin>(
    `INSERT INTO admin_users (email, display_name, role, token_hash, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, display_name, role`,
    [params.email, params.displayName, params.role, hash, params.createdBy ?? null]
  );
  const admin = r.rows[0];
  if (!admin) throw new Error('createAdmin: insert returned no row');
  return { admin, token };
}