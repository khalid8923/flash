/* ═══════════════════════════════════════════════════════════
   FLASH - Player Auth Service (R03b)
   Email OTP + opaque session tokens.
   Player identity is permanent; auth_identities maps providers.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const OTP_TTL_MS = 10 * 60 * 1000;      // 10 min
const OTP_MAX_ATTEMPTS = 5;
const SESSION_IDLE_MS = 15 * 24 * 3600_000; // 15 days
const SESSION_ABS_MS  = 90 * 24 * 3600_000; // 90 days

/* ═══ Hash helpers ═══ */
export function hashHex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateSessionToken(): string {
  return 'ses_' + randomBytes(32).toString('base64url');
}

export function generateOTP(): string {
  return String(randomInt(100000, 999999)); // 6 digits
}

/* ═══ Player resolution ═══ */
async function getOrCreatePlayerByEmail(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const r = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
    [norm]
  );
  if (r.rows[0]) return r.rows[0].id;

  const ins = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, origin) VALUES ($1, $2, 'real') RETURNING id`,
    [norm, norm.split('@')[0]]
  );
  return ins.rows[0]!.id;
}

async function linkIdentity(playerId: string, provider: string, subject: string): Promise<void> {
  await pool.query(
    `INSERT INTO auth_identities (player_id, provider, subject)
     VALUES ($1, $2, $3)
     ON CONFLICT (provider, subject) DO UPDATE SET last_used_at = now()`,
    [playerId, provider, subject]
  );
}

/* ═══ OTP flow ═══ */
export async function requestOTP(email: string): Promise<{ ok: true; dev_code?: string }> {
  const norm = email.trim().toLowerCase();

  /* Rate limit: max 5 OTPs per email in last hour */
  const recent = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM auth_otp_codes
      WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [norm]
  );
  if ((recent.rows[0]?.n ?? 0) >= 5) {
    throw new Error('too_many_requests');
  }

  const code = generateOTP();
  const codeHash = hashHex(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await pool.query(
    `INSERT INTO auth_otp_codes (email, code_hash, purpose, expires_at)
     VALUES ($1, $2, 'login', $3)`,
    [norm, codeHash, expiresAt]
  );

  /* In dev: return the code so you can test without email */
  const isDev = process.env.NODE_ENV !== 'production';
  return { ok: true, ...(isDev ? { dev_code: code } : {}) };
}

export async function verifyOTP(
  email: string,
  code: string,
  meta: { device_id?: string; user_agent?: string; ip?: string }
): Promise<{ sessionToken: string; playerId: string; expiresAt: string }> {
  const norm = email.trim().toLowerCase();
  const codeHash = hashHex(code.trim());

  const r = await pool.query<{
    id: string;
    code_hash: string;
    attempts: number;
    expires_at: string;
    consumed_at: string | null;
  }>(
    `SELECT id, code_hash, attempts, expires_at, consumed_at
       FROM auth_otp_codes
      WHERE email = $1 AND purpose = 'login' AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [norm]
  );
  const row = r.rows[0];
  if (!row) throw new Error('no_otp');

  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error('otp_expired');
  if (row.attempts >= OTP_MAX_ATTEMPTS) throw new Error('too_many_attempts');

  /* Constant-time compare */
  const a = Buffer.from(row.code_hash, 'hex');
  const b = Buffer.from(codeHash, 'hex');
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) {
    await pool.query(
      `UPDATE auth_otp_codes SET attempts = attempts + 1 WHERE id = $1`,
      [row.id]
    );
    throw new Error('otp_invalid');
  }

  await pool.query(
    `UPDATE auth_otp_codes SET consumed_at = now() WHERE id = $1`,
    [row.id]
  );

  /* Resolve player + session */
  const playerId = await getOrCreatePlayerByEmail(norm);
  await linkIdentity(playerId, 'email_otp', norm);

  const token = generateSessionToken();
  const tokenHash = hashHex(token);
  const idleExp = new Date(Date.now() + SESSION_IDLE_MS);
  const absExp  = new Date(Date.now() + SESSION_ABS_MS);

  await pool.query(
    `INSERT INTO auth_sessions
       (player_id, token_hash, device_id, user_agent, ip, idle_expires_at, abs_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      playerId, tokenHash,
      meta.device_id ?? null, meta.user_agent ?? null, meta.ip ?? null,
      idleExp, absExp,
    ]
  );

  return { sessionToken: token, playerId, expiresAt: absExp.toISOString() };
}

/* ═══ Session verification ═══ */
export interface AuthedPlayer { playerId: string; sessionId: string; }

export async function verifySession(token: string): Promise<AuthedPlayer | null> {
  if (!token || !token.startsWith('ses_')) return null;
  const hash = hashHex(token);
  const r = await pool.query<{ id: string; player_id: string }>(
    `SELECT id, player_id FROM auth_sessions
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND idle_expires_at > now()
        AND abs_expires_at > now()`,
    [hash]
  );
  const row = r.rows[0];
  if (!row) return null;

  /* Touch idle window (cheap) */
  await pool.query(
    `UPDATE auth_sessions
        SET last_seen_at = now(),
            idle_expires_at = now() + ($1 || ' milliseconds')::interval
      WHERE id = $2`,
    [String(SESSION_IDLE_MS), row.id]
  );

  return { playerId: row.player_id, sessionId: row.id };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await pool.query(`UPDATE auth_sessions SET revoked_at = now() WHERE id = $1`, [sessionId]);
}

export async function revokeAllForPlayer(playerId: string): Promise<number> {
  const r = await pool.query(
    `UPDATE auth_sessions SET revoked_at = now()
      WHERE player_id = $1 AND revoked_at IS NULL`,
    [playerId]
  );
  return r.rowCount ?? 0;
}

/* ═══ Current user info ═══ */
export async function getPlayer(playerId: string) {
  const r = await pool.query<{
    id: string; email: string | null; display_name: string;
    status: string; origin: string; locale: string; created_at: string;
  }>(
    `SELECT id, email, display_name, status, origin, locale, created_at
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [playerId]
  );
  return r.rows[0] ?? null;
}