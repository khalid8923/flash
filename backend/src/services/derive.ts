import { pool } from '../config/db.js';
import type { Trial } from '../schemas/session.js';

function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

interface GameInfo {
  primary_metric: string;
  metric_direction: 'higher' | 'lower';
  rt_floor_ms: number | null;
  max_score: number | null;
}

async function getGameInfo(gameId: string): Promise<GameInfo | null> {
  const res = await pool.query<GameInfo>(
    'SELECT primary_metric, metric_direction, rt_floor_ms, max_score FROM games WHERE id = $1',
    [gameId]
  );
  return res.rows[0] ?? null;
}

export interface DerivedMetrics {
  n_trials: number;
  n_correct: number;
  accuracy: number;
  median_rt_ms: number | null;
  rcs: number | null;
  primary_score: number;
}

export async function deriveMetrics(gameId: string, trials: Trial[]): Promise<DerivedMetrics> {
  const game = await getGameInfo(gameId);
  const rtFloor = game?.rt_floor_ms ?? 100;

  const valid = trials.filter((t) => !t.is_practice);
  const correctTrials = valid.filter((t) => t.correct === true);
  const rts = correctTrials
    .map((t) => t.rt_ms)
    .filter((rt): rt is number => rt !== null && rt >= rtFloor);

  const n_trials = valid.length;
  const n_correct = correctTrials.length;
  const accuracy = n_trials > 0 ? (n_correct / n_trials) * 100 : 0;
  const median_rt_ms = median(rts);
  const total_rt_seconds = rts.reduce((a, b) => a + b, 0) / 1000;
  const rcs = total_rt_seconds > 0 ? n_correct / total_rt_seconds : null;

  let primary_score = 0;
  const metric = game?.primary_metric ?? 'accuracy';
  switch (metric) {
    case 'accuracy':
    case 'hard_emotion_accuracy':
    case 'novelty_score':
    case 'optimal_move_ratio':
    case 'optimal_path_ratio':
      primary_score = accuracy;
      break;
    case 'median_rt_ms':
      primary_score = median_rt_ms ? Math.round(1000 / (median_rt_ms / 1000)) : 0;
      break;
    case 'max_span':
    case 'max_n_level':
      primary_score = accuracy;
      break;
    default:
      primary_score = accuracy;
  }

  if (game?.max_score && primary_score > game.max_score) {
    primary_score = game.max_score;
  }

  return {
    n_trials,
    n_correct,
    accuracy: Math.round(accuracy * 100) / 100,
    median_rt_ms: median_rt_ms !== null ? Math.round(median_rt_ms) : null,
    rcs: rcs !== null ? Math.round(rcs * 10000) / 10000 : null,
    primary_score: Math.round(primary_score * 100) / 100,
  };
}