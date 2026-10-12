/* Session Notes Service */
import { pool } from '../../config/db.js';

export async function save(userId: string, sessionId: string, note: string, mood?: number, energy?: number) {
  await pool.query(
    `INSERT INTO session_notes (session_id, user_id, note, mood, energy)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id) DO UPDATE SET
       note = EXCLUDED.note,
       mood = EXCLUDED.mood,
       energy = EXCLUDED.energy,
       updated_at = now()`,
    [sessionId, userId, note, mood ?? null, energy ?? null]
  );
}

export async function get(userId: string, sessionId: string) {
  const r = await pool.query(
    'SELECT * FROM session_notes WHERE user_id = $1 AND session_id = $2',
    [userId, sessionId]
  );
  return r.rows[0] ?? null;
}

export async function listRecent(userId: string, limit = 30) {
  const r = await pool.query(
    `SELECT session_id, note, mood, energy, created_at
       FROM session_notes
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return r.rows;
}