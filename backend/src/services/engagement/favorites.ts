/* Favorites Service — Bookmarked games */
import { pool } from '../../config/db.js';

export async function list(userId: string) {
  const r = await pool.query(
    'SELECT game_id, created_at FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return r.rows;
}

export async function add(userId: string, gameId: string) {
  await pool.query(
    `INSERT INTO user_favorites (user_id, game_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, gameId]
  );
}

export async function remove(userId: string, gameId: string) {
  await pool.query(
    'DELETE FROM user_favorites WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
}

export async function isFavorite(userId: string, gameId: string): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM user_favorites WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  return (r.rowCount ?? 0) > 0;
}