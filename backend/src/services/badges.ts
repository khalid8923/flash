import { pool } from '../config/db.js';

export interface BadgeUnlock {
  badge_id: string;
  name: string;
  tier: string;
  unlocked_at: string;
}

interface BadgeRow {
  id: string;
  name: string;
  tier: string;
  rule: {
    scope: string;
    mode?: string;
    metric?: string;
    threshold?: number;
    window?: string;
  };
}

interface CheckParams {
  userId: string;
  sessionId: string;
  mode: string;
  accuracy: number;
}

export async function checkAndUnlockBadges(params: CheckParams): Promise<BadgeUnlock[]> {
  const { userId, sessionId, mode, accuracy } = params;

  const allBadges = await pool.query<BadgeRow>('SELECT id, name, tier, rule FROM badges');

  const alreadyOwned = await pool.query<{ badge_id: string }>(
    `SELECT badge_id FROM user_badges WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  const ownedSet = new Set(alreadyOwned.rows.map((r) => r.badge_id));

  const unlocked: BadgeUnlock[] = [];

  for (const badge of allBadges.rows) {
    if (ownedSet.has(badge.id)) continue;

    const rule = badge.rule;
    if (rule.scope !== 'mode') continue;
    if (rule.mode !== mode) continue;
    if (rule.metric !== 'accuracy') continue;
    if (typeof rule.threshold !== 'number') continue;

    if (accuracy >= rule.threshold) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id, unlocked_at, source_session_id)
         VALUES ($1, $2, now(), $3)
         ON CONFLICT (user_id, badge_id) DO NOTHING`,
        [userId, badge.id, sessionId]
      );

      unlocked.push({
        badge_id: badge.id,
        name: badge.name,
        tier: badge.tier,
        unlocked_at: new Date().toISOString(),
      });
    }
  }

  return unlocked;
}