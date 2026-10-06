import { pool } from '../config/db.js';

export interface PBCheckResult {
  is_new_pb: boolean;
  previous_value: number | null;
  new_value: number;
  metric: string;
  direction: 'higher' | 'lower';
}

interface PBParams {
  userId: string;
  gameId: string;
  variant: string;
  metric: string;
  direction: 'higher' | 'lower';
  value: number;
  sessionId: string;
}

export async function checkAndUpdatePB(params: PBParams): Promise<PBCheckResult> {
  const { userId, gameId, variant, metric, direction, value, sessionId } = params;

  const existing = await pool.query<{ value: number }>(
    `SELECT value FROM personal_bests
     WHERE user_id = $1 AND game_id = $2 AND variant = $3 AND metric = $4`,
    [userId, gameId, variant, metric]
  );

  const previous = existing.rows[0]?.value ?? null;
  const isBetter =
    previous === null ||
    (direction === 'higher' && value > previous) ||
    (direction === 'lower' && value < previous);

  if (!isBetter) {
    return {
      is_new_pb: false,
      previous_value: previous,
      new_value: previous ?? value,
      metric,
      direction,
    };
  }

  await pool.query(
    `INSERT INTO personal_bests (user_id, game_id, variant, metric, value, session_id, achieved_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id, game_id, variant, metric)
     DO UPDATE SET value = EXCLUDED.value,
                   session_id = EXCLUDED.session_id,
                   achieved_at = EXCLUDED.achieved_at`,
    [userId, gameId, variant, metric, value, sessionId]
  );

  return {
    is_new_pb: true,
    previous_value: previous,
    new_value: value,
    metric,
    direction,
  };
}

export async function getGameMetricInfo(gameId: string): Promise<{
  primary_metric: string;
  metric_direction: 'higher' | 'lower';
} | null> {
  const res = await pool.query<{ primary_metric: string; metric_direction: 'higher' | 'lower' }>(
    `SELECT primary_metric, metric_direction FROM games WHERE id = $1`,
    [gameId]
  );
  return res.rows[0] ?? null;
}