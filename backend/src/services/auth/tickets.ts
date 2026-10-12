/* ═══════════════════════════════════════════════════════════
   FLASH - Play Ticket Service (R06)
   Server-chosen seed + level + mode. Single-use. Short TTL.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { randomBytes, createHash } from 'node:crypto';

const TICKET_TTL_MS = 30 * 60 * 1000; // 30 min (game max + slack)

export interface IssuedTicket {
  ticketId: string;
  token: string;
  seed: string;
  gameId: string;
  mode: string;
  level: number;
  expiresAt: string;
}

export interface ConsumedTicket {
  ticketId: string;
  seed: string;
  gameId: string;
  mode: string;
  level: number;
}

function hashToken(t: string): string {
  return createHash('sha256').update(t).digest('hex');
}

/** Issue a new ticket. Returns the raw token shown once. */
export async function issueTicket(params: {
  playerId: string;
  gameId: string;
  mode: string;
  level: number;
  deviceId?: string;
}): Promise<IssuedTicket> {
  const token = 'tkt_' + randomBytes(24).toString('base64url');
  const tokenHash = hashToken(token);
  const seed = randomBytes(8).toString('hex'); // 16 hex chars
  const expiresAt = new Date(Date.now() + TICKET_TTL_MS);

  const r = await pool.query<{ id: string }>(
    `INSERT INTO play_tickets
       (id, user_id, player_id, game_id, mode, level, seed, token_hash, device_id, issued_at, expires_at)
     VALUES (
       gen_random_uuid(), $1, $1, $2, $3, $4, $5, $6, $7, now(), $8
     ) RETURNING id`,
    [
      params.playerId,
      params.gameId,
      params.mode,
      params.level,
      seed,
      tokenHash,
      params.deviceId ?? null,
      expiresAt,
    ]
  );
  const ticketId = r.rows[0]!.id;

  return {
    ticketId,
    token,
    seed,
    gameId: params.gameId,
    mode: params.mode,
    level: params.level,
    expiresAt: expiresAt.toISOString(),
  };
}

/** Consume a ticket. Marks consumed_at. Returns null if invalid/expired/used. */
export async function consumeTicket(
  playerId: string,
  token: string
): Promise<ConsumedTicket | null> {
  if (!token || !token.startsWith('tkt_')) return null;
  const tokenHash = hashToken(token);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query<{
      id: string; seed: string; game_id: string; mode: string; level: number;
      consumed_at: string | null; rejected_at: string | null; expires_at: string;
    }>(
      `SELECT id, seed, game_id, mode, level, consumed_at, rejected_at, expires_at
         FROM play_tickets
        WHERE token_hash = $1 AND player_id = $2
        FOR UPDATE`,
      [tokenHash, playerId]
    );
    const row = r.rows[0];
    if (!row) { await client.query('ROLLBACK'); return null; }
    if (row.consumed_at || row.rejected_at) {
      await client.query('ROLLBACK');
      return null;
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await client.query(
        `UPDATE play_tickets SET rejected_at = now(), rejected_reason = 'expired' WHERE id = $1`,
        [row.id]
      );
      await client.query('COMMIT');
      return null;
    }
    await client.query(
      `UPDATE play_tickets SET consumed_at = now() WHERE id = $1`,
      [row.id]
    );
    await client.query('COMMIT');
    return {
      ticketId: row.id,
      seed: row.seed,
      gameId: row.game_id,
      mode: row.mode,
      level: row.level,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Housekeeping: mark expired tickets (called from a job later). */
export async function expireOldTickets(): Promise<number> {
  const r = await pool.query(
    `UPDATE play_tickets
        SET rejected_at = now(), rejected_reason = 'expired'
      WHERE consumed_at IS NULL AND rejected_at IS NULL AND expires_at < now()`
  );
  return r.rowCount ?? 0;
}