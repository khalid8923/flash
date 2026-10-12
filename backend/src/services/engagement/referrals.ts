/* ═══════════════════════════════════════════════════════════
   Referrals Service
   ═══════════════════════════════════════════════════════════ */
import { pool } from '../../config/db.js';
import { randomBytes } from 'node:crypto';

function makeCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

export async function getOrCreateCode(userId: string): Promise<string> {
  const r = await pool.query<{ code: string }>(
    'SELECT code FROM referral_codes WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
    [userId]
  );
  if (r.rows[0]) return r.rows[0].code;

  const code = makeCode();
  await pool.query(
    'INSERT INTO referral_codes (code, user_id) VALUES ($1, $2)',
    [code, userId]
  );
  return code;
}

export async function redeemCode(newUserId: string, code: string) {
  /* Validate code */
  const codeRes = await pool.query<{ user_id: string; uses_count: number; max_uses: number }>(
    'SELECT user_id, uses_count, max_uses FROM referral_codes WHERE code = $1',
    [code]
  );
  const ref = codeRes.rows[0];
  if (!ref) throw new Error('invalid_code');
  if (ref.user_id === newUserId) throw new Error('self_referral');
  if (ref.uses_count >= ref.max_uses) throw new Error('code_exhausted');

  /* Check not already referred */
  const existing = await pool.query(
    'SELECT id FROM referrals WHERE referred_id = $1', [newUserId]
  );
  if (existing.rowCount && existing.rowCount > 0) throw new Error('already_referred');

  /* Insert referral */
  await pool.query(
    `INSERT INTO referrals (referrer_id, referred_id, code, status, completed_at)
     VALUES ($1, $2, $3, 'completed', now())`,
    [ref.user_id, newUserId, code]
  );

  await pool.query(
    'UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = $1',
    [code]
  );

  return { referrer_id: ref.user_id };
}

export async function getStats(userId: string) {
  const r = await pool.query<{ total: string; xp_earned: string }>(
    `SELECT COUNT(*)::text AS total,
            COALESCE(SUM(referrer_xp), 0)::text AS xp_earned
       FROM referrals
      WHERE referrer_id = $1 AND status = 'completed'`,
    [userId]
  );
  return {
    total: parseInt(r.rows[0]?.total ?? '0', 10),
    xp_earned: parseInt(r.rows[0]?.xp_earned ?? '0', 10),
  };
}