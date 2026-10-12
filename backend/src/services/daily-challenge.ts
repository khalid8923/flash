/* ═══════════════════════════════════════════════════════════
   Daily Challenge Service
   ═══════════════════════════════════════════════════════════ */
import { pool } from '../config/db.js';
import { randomBytes } from 'node:crypto';

const CHALLENGE_GAMES = [
  'flanker', 'go-no-go', 'task-switching', 'vigilance',
  'mental-rotation', 'corsi-blocks', 'map-memory', 'block-counter',
  'reaction', 'color-match', 'symbol-sprint', 'rapid-fire',
  'n-back', 'face-match', 'pattern-recall', 'seq-mem',
  'matrix-logic', 'syllogisms', 'deduction', 'argument-analyzer',
  'lexical-decision', 'vocabulary-elite', 'verbal-analogies', 'word-scramble',
];

function pickDailyGame(date: Date): string {
  /* Deterministic by date — same game for everyone */
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return CHALLENGE_GAMES[dayOfYear % CHALLENGE_GAMES.length]!;
}

export async function getOrCreateToday() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const existing = await pool.query(
    'SELECT * FROM daily_challenges WHERE challenge_date = $1', [dateStr]
  );
  if (existing.rows[0]) return existing.rows[0];

  const gameId = pickDailyGame(today);
  const seed = randomBytes(8).toString('hex');

  const ins = await pool.query(
    `INSERT INTO daily_challenges (challenge_date, game_id, mode, seed, config)
     VALUES ($1, $2, 'classic', $3, $4)
     RETURNING *`,
    [dateStr, gameId, seed, JSON.stringify({ duration_min: 3 })]
  );
  return ins.rows[0];
}

export async function submitResult(
  userId: string,
  challengeId: string,
  score: number,
  accuracy: number,
  medianRtMs: number,
  sessionId?: string
) {
  await pool.query(
    `INSERT INTO daily_challenge_results
       (challenge_id, user_id, score, accuracy, median_rt_ms, session_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (challenge_id, user_id) DO UPDATE SET
       score = GREATEST(daily_challenge_results.score, EXCLUDED.score),
       accuracy = EXCLUDED.accuracy,
       median_rt_ms = EXCLUDED.median_rt_ms,
       session_id = EXCLUDED.session_id`,
    [challengeId, userId, score, accuracy, medianRtMs, sessionId ?? null]
  );
}

export async function getLeaderboard(challengeId: string, limit = 50) {
  const r = await pool.query(
    `SELECT user_id, score, accuracy, median_rt_ms, created_at,
            ROW_NUMBER() OVER (ORDER BY score DESC) AS rank
       FROM daily_challenge_results
      WHERE challenge_id = $1
      ORDER BY score DESC
      LIMIT $2`,
    [challengeId, limit]
  );
  return r.rows;
}