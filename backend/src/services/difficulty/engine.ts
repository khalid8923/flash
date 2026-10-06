/* ═══════════════════════════════════════════════════════════
   Adaptive Difficulty Engine v1
   - Weighted staircase (no ML, no LLM)
   - Frustration cap
   - Reason codes for explainability
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

export type ReasonCode =
  | 'PROMOTE_STABLE'      // Good performance → up
  | 'DEMOTE_STRUGGLE'     // Poor performance → down
  | 'HOLD_IN_BAND'        // Just right, stay
  | 'HOLD_FRUSTRATION'    // 3+ fails, hold but recover
  | 'RECOVERY'            // Serve easier to rebuild
  | 'WARMUP'              // Fresh session, start easy
  | 'CALIBRATING'         // Not enough data, use prior
  | 'RUST_RETURN'         // Long time away
  | 'STRETCH'             // User opted in
  | 'FIRST_SESSION';      // Never played this game

export interface Ability {
  user_id: string;
  game_id: string;
  mode: string;
  ability: number;
  uncertainty: number;
  evidence_count: number;
  current_level: number;
  consecutive_successes: number;
  consecutive_failures: number;
}

export interface DecisionInput {
  userId: string;
  gameId: string;
  mode: string;
  accuracy: number;      // 0–100
  medianRT?: number | null;
  sessionId: string;
}

export interface Decision {
  from_level: number;
  to_level: number;
  reason_code: ReasonCode;
  explanation: string;   // Player-facing
  predicted_success: number;
}

const MIN_LEVEL = 1;
const MAX_LEVEL = 15;
const PROMOTE_THRESHOLD = 85;   // accuracy >= 85 → promote
const DEMOTE_THRESHOLD = 60;    // accuracy < 60 → demote
const PROMOTE_NEEDED = 2;       // 2 consecutive good rounds
const FRUSTRATION_CAP = 3;      // 3 fails → recovery

export async function getOrInitAbility(
  userId: string,
  gameId: string,
  mode: string
): Promise<Ability> {
  const res = await pool.query<Ability>(
    `SELECT user_id, game_id, mode, ability, uncertainty, evidence_count,
            current_level, consecutive_successes, consecutive_failures
     FROM player_game_ability
     WHERE user_id = $1 AND game_id = $2 AND mode = $3`,
    [userId, gameId, mode]
  );

  if (res.rowCount && res.rows.length > 0) return res.rows[0]!;

  // New: start at level 3, uncertainty = 0.5
  const initial: Ability = {
    user_id: userId,
    game_id: gameId,
    mode,
    ability: 0.3,
    uncertainty: 0.5,
    evidence_count: 0,
    current_level: 3,
    consecutive_successes: 0,
    consecutive_failures: 0,
  };

  await pool.query(
    `INSERT INTO player_game_ability
     (user_id, game_id, mode, ability, uncertainty, evidence_count, current_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, game_id, mode) DO NOTHING`,
    [userId, gameId, mode, initial.ability, initial.uncertainty, 0, initial.current_level]
  );

  return initial;
}

/**
 * Weighted staircase:
 *   promote only after PROMOTE_NEEDED consecutive good rounds
 *   demote immediately if accuracy < DEMOTE_THRESHOLD
 *   frustration cap: 3+ fails → recovery round (stay, but mark for recovery)
 */
export function decideNextLevel(
  current: Ability,
  accuracy: number,
  _medianRT: number | null | undefined
): Decision {
  const from = current.current_level;

  /* Frustration cap */
  if (current.consecutive_failures >= FRUSTRATION_CAP) {
    const to = Math.max(MIN_LEVEL, from - 1);
    return {
      from_level: from,
      to_level: to,
      reason_code: 'HOLD_FRUSTRATION',
      explanation: `Staying at level ${to} to rebuild momentum — you've had ${current.consecutive_failures} tough rounds in a row.`,
      predicted_success: 0.85,
    };
  }

  /* Struggling → demote */
  if (accuracy < DEMOTE_THRESHOLD) {
    const to = Math.max(MIN_LEVEL, from - 1);
    return {
      from_level: from,
      to_level: to,
      reason_code: 'DEMOTE_STRUGGLE',
      explanation: `Moving to level ${to} — the current level felt too hard (${Math.round(accuracy)}% accuracy).`,
      predicted_success: 0.75,
    };
  }

  /* Doing well → check streak for promotion */
  if (accuracy >= PROMOTE_THRESHOLD) {
    const newStreak = current.consecutive_successes + 1;
    if (newStreak >= PROMOTE_NEEDED && from < MAX_LEVEL) {
      const to = Math.min(MAX_LEVEL, from + 1);
      return {
        from_level: from,
        to_level: to,
        reason_code: 'PROMOTE_STABLE',
        explanation: `Moving to level ${to} — you've hit ${PROMOTE_THRESHOLD}%+ accuracy for ${newStreak} rounds in a row.`,
        predicted_success: 0.78,
      };
    }
    return {
      from_level: from,
      to_level: from,
      reason_code: 'HOLD_IN_BAND',
      explanation: `Staying at level ${from} — great accuracy (${Math.round(accuracy)}%), but let's confirm it's stable.`,
      predicted_success: 0.80,
    };
  }

  /* In target band → hold */
  return {
    from_level: from,
    to_level: from,
    reason_code: 'HOLD_IN_BAND',
    explanation: `Staying at level ${from} — you're in your target zone (${Math.round(accuracy)}% accuracy).`,
    predicted_success: 0.80,
  };
}

/**
 * Apply a decision: update player_game_ability + log engine_decision
 */
export async function applyDecision(
  userId: string,
  gameId: string,
  mode: string,
  sessionId: string,
  current: Ability,
  decision: Decision,
  accuracy: number
): Promise<void> {
  const newStreakGood = accuracy >= PROMOTE_THRESHOLD
    ? current.consecutive_successes + 1
    : 0;
  const newStreakBad = accuracy < DEMOTE_THRESHOLD
    ? current.consecutive_failures + 1
    : 0;

  /* Update ability via EMA (exponential moving average) */
  const alpha = Math.max(0.15, 1 / Math.max(3, current.evidence_count));
  const newAbility = current.ability * (1 - alpha) + (accuracy / 100) * alpha;
  const newUncertainty = Math.max(0.05, current.uncertainty * 0.95);
  const newEvidence = current.evidence_count + 1;

  await pool.query(
    `UPDATE player_game_ability
     SET ability = $1,
         uncertainty = $2,
         evidence_count = $3,
         current_level = $4,
         consecutive_successes = $5,
         consecutive_failures = $6,
         last_session_id = $7,
         last_updated_at = now()
     WHERE user_id = $8 AND game_id = $9 AND mode = $10`,
    [newAbility, newUncertainty, newEvidence, decision.to_level,
     newStreakGood, newStreakBad, sessionId,
     userId, gameId, mode]
  );

  await pool.query(
    `INSERT INTO engine_decisions
     (user_id, session_id, game_id, reason_code, mode,
      from_level, to_level, predicted_success, chosen_level, policy_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
    [userId, sessionId, gameId, decision.reason_code, mode,
     decision.from_level, decision.to_level, decision.predicted_success,
     decision.to_level]
  );
}

export async function getRecentDecisions(userId: string, limit = 10) {
  const res = await pool.query(
    `SELECT game_id, reason_code, from_level, to_level, predicted_success, created_at
     FROM engine_decisions
     WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}