/* Streaks Service — Daily streaks with freeze tokens */
import { pool } from '../../config/db.js';

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freeze_tokens: number;
  freeze_max: number;
  freezes_used_total: number;
}

export async function getOrCreateStreak(userId: string): Promise<Streak> {
  const r = await pool.query<Streak>(
    'SELECT * FROM user_streaks WHERE user_id = $1', [userId]
  );
  if (r.rows[0]) return r.rows[0];
  const ins = await pool.query<Streak>(
    'INSERT INTO user_streaks (user_id) VALUES ($1) RETURNING *', [userId]
  );
  return ins.rows[0]!;
}

export interface CheckinResult {
  streak: Streak;
  advanced: boolean;
  used_freeze: boolean;
  is_new_record: boolean;
}

export async function recordActivity(userId: string): Promise<CheckinResult> {
  const current = await getOrCreateStreak(userId);
  const today = new Date().toISOString().slice(0, 10);
  const last = current.last_active_date;

  if (last === today) {
    return { streak: current, advanced: false, used_freeze: false, is_new_record: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = current.current_streak;
  let usedFreeze = false;

  if (last === yesterday) {
    newStreak = current.current_streak + 1;
  } else if (last === null) {
    newStreak = 1;
  } else {
    if (current.freeze_tokens > 0) {
      newStreak = current.current_streak + 1;
      usedFreeze = true;
    } else {
      newStreak = 1;
    }
  }

  const isNewRecord = newStreak > current.longest_streak;
  const newFreezeTokens = usedFreeze ? current.freeze_tokens - 1 : current.freeze_tokens;

  await pool.query(
    `UPDATE user_streaks
        SET current_streak = $1,
            longest_streak = GREATEST(longest_streak, $1),
            last_active_date = $2,
            freeze_tokens = $3,
            freezes_used_total = freezes_used_total + $4,
            updated_at = now()
      WHERE user_id = $5`,
    [newStreak, today, newFreezeTokens, usedFreeze ? 1 : 0, userId]
  );

  await pool.query(
    `INSERT INTO streak_events (user_id, event_type, streak_value, delta, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, usedFreeze ? 'freeze_used' : 'advanced', newStreak,
     newStreak - current.current_streak,
     JSON.stringify({ previous: current.current_streak })]
  );

  const updated = await getOrCreateStreak(userId);
  return { streak: updated, advanced: true, used_freeze: usedFreeze, is_new_record: isNewRecord };
}

export async function awardFreezeToken(userId: string, count = 1): Promise<number> {
  const s = await getOrCreateStreak(userId);
  const newCount = Math.min(s.freeze_max, s.freeze_tokens + count);
  await pool.query(
    'UPDATE user_streaks SET freeze_tokens = $1, updated_at = now() WHERE user_id = $2',
    [newCount, userId]
  );
  return newCount;
}