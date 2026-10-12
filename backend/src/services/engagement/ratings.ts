/* Game Ratings Service */
import { pool } from '../../config/db.js';

export async function rate(userId: string, gameId: string, rating: number, feedback?: string) {
  await pool.query(
    `INSERT INTO game_ratings (user_id, game_id, rating, feedback)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, game_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       feedback = EXCLUDED.feedback,
       updated_at = now()`,
    [userId, gameId, rating, feedback ?? null]
  );
}

export async function getMyRating(userId: string, gameId: string) {
  const r = await pool.query(
    'SELECT rating, feedback, updated_at FROM game_ratings WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  return r.rows[0] ?? null;
}

export async function getAggregate(gameId: string) {
  const r = await pool.query<{ avg: string; count: string }>(
    `SELECT COALESCE(AVG(rating), 0)::text AS avg,
            COUNT(*)::text AS count
       FROM game_ratings
      WHERE game_id = $1`,
    [gameId]
  );
  return {
    average: parseFloat(r.rows[0]?.avg ?? '0'),
    count: parseInt(r.rows[0]?.count ?? '0', 10),
  };
}