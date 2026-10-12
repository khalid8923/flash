/* ═══════════════════════════════════════════════════════════
   XP Service — User XP + Leveling
   ═══════════════════════════════════════════════════════════ */
import { pool } from '../config/db.js';

export interface UserXp {
  user_id: string;
  total_xp: number;
  level: number;
  xp_to_next: number;
  lifetime_levels_gained: number;
}

function xpForLevel(level: number): number {
  /* Level 1→2: 100 XP, Level 2→3: 150, Level 3→4: 220 ... */
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export async function getOrCreateXp(userId: string): Promise<UserXp> {
  const r = await pool.query<UserXp>(
    'SELECT * FROM user_xp WHERE user_id = $1', [userId]
  );
  if (r.rows[0]) return r.rows[0];

  const ins = await pool.query<UserXp>(
    `INSERT INTO user_xp (user_id, total_xp, level, xp_to_next)
     VALUES ($1, 0, 1, $2)
     RETURNING *`,
    [userId, xpForLevel(1)]
  );
  return ins.rows[0]!;
}

export interface AwardResult {
  amount: number;
  total_xp: number;
  level: number;
  leveled_up: boolean;
  levels_gained: number;
}

export async function awardXp(
  userId: string,
  amount: number,
  source: string,
  sourceId?: string,
  metadata: Record<string, unknown> = {}
): Promise<AwardResult> {
  const current = await getOrCreateXp(userId);
  let newTotal = current.total_xp + amount;
  let newLevel = current.level;
  let levelsGained = 0;

  /* Handle multi-level ups */
  while (newTotal >= xpForLevel(newLevel)) {
    newTotal -= xpForLevel(newLevel);
    newLevel++;
    levelsGained++;
  }

  const xpToNext = xpForLevel(newLevel);

  await pool.query(
    `UPDATE user_xp
        SET total_xp = $1, level = $2, xp_to_next = $3,
            lifetime_levels_gained = lifetime_levels_gained + $4,
            last_xp_at = now(), updated_at = now()
      WHERE user_id = $5`,
    [newTotal, newLevel, xpToNext, levelsGained, userId]
  );

  await pool.query(
    `INSERT INTO xp_events (user_id, amount, source, source_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, amount, source, sourceId ?? null, metadata]
  );

  return {
    amount,
    total_xp: newTotal,
    level: newLevel,
    leveled_up: levelsGained > 0,
    levels_gained: levelsGained,
  };
}

export async function getXpHistory(userId: string, limit = 50) {
  const r = await pool.query(
    `SELECT id, amount, source, metadata, created_at
       FROM xp_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return r.rows;
}