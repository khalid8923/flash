/* Coach Feedback Service */
import { pool } from '../../config/db.js';

export async function submit(userId: string, rating: number, helpful?: boolean, comment?: string, messageId?: string) {
  await pool.query(
    `INSERT INTO coach_feedback (user_id, message_id, rating, helpful, comment)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, messageId ?? null, rating, helpful ?? null, comment ?? null]
  );
}

export async function getStats(days = 30) {
  const r = await pool.query<{ avg: string; count: string; helpful_pct: string }>(
    `SELECT COALESCE(AVG(rating), 0)::text AS avg,
            COUNT(*)::text AS count,
            COALESCE(AVG(CASE WHEN helpful THEN 1 ELSE 0 END) * 100, 0)::text AS helpful_pct
       FROM coach_feedback
      WHERE created_at > now() - ($1 || ' days')::interval`,
    [String(days)]
  );
  return {
    average_rating: parseFloat(r.rows[0]?.avg ?? '0'),
    total: parseInt(r.rows[0]?.count ?? '0', 10),
    helpful_pct: parseFloat(r.rows[0]?.helpful_pct ?? '0'),
  };
}