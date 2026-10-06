import { pool } from '../config/db.js';

const DEMO_USER_ID = '00000000-0000-7000-8000-000000000001';

export async function getOrCreateDemoUser(): Promise<string> {
  const res = await pool.query('SELECT id FROM users WHERE id = $1', [DEMO_USER_ID]);
  if (res.rowCount === 0) {
    await pool.query(
      `INSERT INTO users (id, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [DEMO_USER_ID, 'demo@flash.local', 'Demo User']
    );
  }
  return DEMO_USER_ID;
}

export async function getNextChangeSeq(userId: string): Promise<number> {
  const res = await pool.query(
    `INSERT INTO user_sync_state (user_id, change_seq)
     VALUES ($1, 1)
     ON CONFLICT (user_id)
     DO UPDATE SET change_seq = user_sync_state.change_seq + 1
     RETURNING change_seq`,
    [userId]
  );
  return res.rows[0].change_seq;
}