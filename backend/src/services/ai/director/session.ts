/* ═══════════════════════════════════════════════════════════
   Director Mode — Session DB Layer
   CRUD on director_sessions table
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../../config/db.js';
import type {
  DirectorSession,
  DirectorScript,
  DirectorCheckpoint,
  DirectorDecision,
  DirectorRoundResult,
} from './types.js';

/* ─── Create ─── */
export async function createDirectorSession(
  userId: string,
  script: DirectorScript
): Promise<DirectorSession> {
  const res = await pool.query<{
    id: string;
    user_id: string;
    started_at: string;
    ended_at: string | null;
    script: DirectorScript;
    checkpoints: DirectorCheckpoint[];
    final_state: string | null;
  }>(
    `INSERT INTO director_sessions (user_id, script, checkpoints, final_state)
     VALUES ($1, $2, $3, 'active')
     RETURNING id, user_id, started_at, ended_at, script, checkpoints, final_state`,
    [userId, JSON.stringify(script), JSON.stringify([])]
  );

  const row = res.rows[0];
  if (!row) throw new Error('director_session_create_failed');

  return {
    id: row.id,
    user_id: row.user_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    script: row.script,
    checkpoints: row.checkpoints,
    final_state: (row.final_state as DirectorSession['final_state']) ?? 'active',
  };
}

/* ─── Load ─── */
export async function getDirectorSession(
  sessionId: string,
  userId: string
): Promise<DirectorSession | null> {
  const res = await pool.query<{
    id: string;
    user_id: string;
    started_at: string;
    ended_at: string | null;
    script: DirectorScript;
    checkpoints: DirectorCheckpoint[];
    final_state: string | null;
  }>(
    `SELECT id, user_id, started_at, ended_at, script, checkpoints, final_state
       FROM director_sessions
      WHERE id = $1 AND user_id = $2
      LIMIT 1`,
    [sessionId, userId]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    script: row.script,
    checkpoints: row.checkpoints,
    final_state: (row.final_state as DirectorSession['final_state']) ?? 'active',
  };
}

/* ─── Append a checkpoint (round result + decision) ─── */
export async function appendCheckpoint(
  sessionId: string,
  result: DirectorRoundResult,
  decision: DirectorDecision | null
): Promise<DirectorCheckpoint> {
  const checkpoint: DirectorCheckpoint = {
    ...result,
    created_at: new Date().toISOString(),
    decision,
  };

  const res = await pool.query<{ checkpoints: DirectorCheckpoint[] }>(
    `UPDATE director_sessions
        SET checkpoints = checkpoints || $1::jsonb
      WHERE id = $2
      RETURNING checkpoints`,
    [JSON.stringify([checkpoint]), sessionId]
  );

  return res.rows[0]?.checkpoints?.slice(-1)[0] ?? checkpoint;
}

/* ─── Mark session as finished ─── */
export async function markSessionEnded(
  sessionId: string,
  finalState: 'completed' | 'abandoned'
): Promise<void> {
  await pool.query(
    `UPDATE director_sessions
        SET ended_at = NOW(),
            final_state = $2
      WHERE id = $1`,
    [sessionId, finalState]
  );
}