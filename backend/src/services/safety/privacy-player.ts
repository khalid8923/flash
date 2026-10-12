/* ═══════════════════════════════════════════════════════════
   FLASH - Player Privacy (R20)
   exportPlayerData + erasePlayer (30-day grace).
   Each export query is wrapped in try/catch — missing columns
   don't break the whole export.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

async function safeQuery<T = Record<string, unknown>>(sql: string, params: unknown[]): Promise<T[]> {
  try {
    const r = await pool.query(sql, params);
    return r.rows as T[];
  } catch {
    return [];
  }
}

export interface ExportBundle {
  exported_at: string;
  user: Record<string, unknown> | null;
  sessions: unknown[];
  session_trials_count: number;
  personal_bests: unknown[];
  user_badges: unknown[];
  domain_scores: unknown[];
  settings: unknown[];
  conversations: unknown[];
  journal_entries: unknown[];
}

export async function exportPlayerData(userId: string): Promise<ExportBundle> {
  const [
    userRows,
    sessions,
    trialsRows,
    pbs,
    badges,
    domainScores,
    settings,
    convos,
    journals,
  ] = await Promise.all([
    safeQuery(`SELECT id, email, display_name, status, origin, locale, created_at FROM users WHERE id = $1`, [userId]),
    safeQuery(`SELECT id, game_id, domain_id, mode, started_at, ended_at, accuracy, median_rt_ms, rcs, primary_score FROM sessions WHERE user_id = $1 ORDER BY started_at ASC`, [userId]),
    safeQuery<{ n: number }>(`SELECT COUNT(*)::int AS n FROM session_trials WHERE session_id IN (SELECT id FROM sessions WHERE user_id = $1)`, [userId]),
    safeQuery(`SELECT game_id, variant, metric, value, achieved_at FROM personal_bests WHERE user_id = $1`, [userId]),
    safeQuery(`SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = $1 AND revoked_at IS NULL`, [userId]),
    safeQuery(`SELECT domain_id, score, confidence, games_contributing FROM domain_scores WHERE user_id = $1`, [userId]),
    safeQuery(`SELECT key, value FROM user_settings WHERE user_id = $1`, [userId]),
    safeQuery(`SELECT id, title, language, created_at FROM ai_conversations WHERE user_id = $1`, [userId]),
    safeQuery(`SELECT id FROM journal_entries WHERE user_id = $1`, [userId]),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user: (userRows[0] as Record<string, unknown>) ?? null,
    sessions,
    session_trials_count: trialsRows[0]?.n ?? 0,
    personal_bests: pbs,
    user_badges: badges,
    domain_scores: domainScores,
    settings,
    conversations: convos,
    journal_entries: journals,
  };
}

export interface EraseResult {
  request_id: string;
  user_id: string;
  scheduled_for: string;
  grace_days: number;
  message: string;
}

/** Start erasure: mark user as deleted, schedule hard-delete. */
export async function requestErasure(userId: string, reason: string | null): Promise<EraseResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const req = await client.query<{ id: string }>(
      `INSERT INTO privacy_requests (user_id, kind, status, reason)
       VALUES ($1, 'erasure', 'processing', $2) RETURNING id`,
      [userId, reason]
    );
    const requestId = req.rows[0]!.id;

    await client.query(
      `UPDATE users SET deleted_at = now(), status = 'deleted' WHERE id = $1`,
      [userId]
    );

    await client.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE player_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    await client.query('COMMIT');

    const scheduledFor = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    return {
      request_id: requestId,
      user_id: userId,
      scheduled_for: scheduledFor,
      grace_days: 30,
      message: 'Account scheduled for permanent deletion in 30 days. Contact support to cancel.',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Executes hard-delete for a user past the grace period. */
export async function hardDeleteUser(userId: string): Promise<{ deleted: boolean }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ops: Array<[string, string]> = [
      ['session_trials', 'session_id IN (SELECT id FROM sessions WHERE user_id = $1)'],
      ['session_reviews', 'session_id IN (SELECT id FROM sessions WHERE user_id = $1)'],
      ['integrity_events', 'user_id = $1'],
      ['personal_bests', 'user_id = $1'],
      ['user_badges', 'user_id = $1'],
      ['user_game_stats', 'user_id = $1'],
      ['domain_scores', 'user_id = $1'],
      ['player_game_ability', 'user_id = $1'],
      ['engine_decisions', 'user_id = $1'],
      ['predictions', 'user_id = $1'],
      ['error_patterns', 'user_id = $1'],
      ['transfer_signals', 'user_id = $1'],
      ['sessions', 'user_id = $1'],
      ['ai_messages', 'conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = $1)'],
      ['ai_conversations', 'user_id = $1'],
      ['journal_entries', 'user_id = $1'],
      ['voice_requests', 'user_id = $1'],
      ['auth_sessions', 'player_id = $1'],
      ['auth_identities', 'player_id = $1'],
      ['auth_otp_codes', "email IN (SELECT email FROM users WHERE id = $1)"],
      ['user_settings', 'user_id = $1'],
      ['user_cognitive_profile', 'user_id = $1'],
      ['users', 'id = $1'],
    ];

    for (const [table, where] of ops) {
      try {
        await client.query(`DELETE FROM ${table} WHERE ${where}`, [userId]);
      } catch {
        /* skip tables that don't exist */
      }
    }

    await client.query(
      `UPDATE privacy_requests SET status = 'done', completed_at = now()
        WHERE user_id = $1 AND kind = 'erasure' AND status != 'done'`,
      [userId]
    );

    await client.query('COMMIT');
    return { deleted: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}