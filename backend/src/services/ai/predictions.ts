/* ═══════════════════════════════════════════════════════════
   Predictive Coach Service (MAXIMUM)
   Analysis: weighted linear regression + EMA + R² + risk detectors
   LLM phrases the summary. All math is deterministic.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  SYSTEM_PROMPT_PREDICTION_EN,
  SYSTEM_PROMPT_PREDICTION_AR,
  buildPredictionPrompt,
  buildFallbackSummary,
  trajectoryLabel,
  type GamePrediction,
  type PredictionContext,
  type Trajectory,
  type ConfidenceTier,
  type Lang,
} from './prompts-predictions.js';

/* ═══════════════════════════════════════════════════════════
   Public types
   ═══════════════════════════════════════════════════════════ */
export interface PredictionResult {
  games: Array<{
    game_id: string;
    game_name: string;
    current_level: number;
    sessions_analyzed: number;
    trajectory: Trajectory;
    trajectory_label: string;
    confidence: number;
    confidence_tier: ConfidenceTier;
    accuracy_slope: number;
    rt_slope: number;
    r_squared: number;
    ema_accuracy: number;
    predicted_next_accuracy: number;
    predicted_accuracy_band: number;
    sessions_until_next_level: number;
    sessions_until_max_level: number;
    risk_factors: Array<{ key: string; detail: string }>;
    evidence: {
      first_accuracy: number;
      last_accuracy: number;
      best_accuracy: number;
      sessions_span_days: number;
    };
  }>;
  summary: string;
  strongest_game: string | null;
  weakest_game: string | null;
  overall_trajectory: Trajectory;
  total_sessions_analyzed: number;
  source: 'llm' | 'rule' | 'insufficient_data';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  message?: string;
}

const MIN_SESSIONS_PER_GAME = 5;
const TOP_GAMES_LIMIT = 10;
const LOOKBACK_DAYS = 60;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE = new Map<string, { result: PredictionResult; ts: number }>();

/* ═══════════════════════════════════════════════════════════
   MATH
   ═══════════════════════════════════════════════════════════ */

/* Weighted linear regression: recent sessions weighted higher.
   Weight = i+1 (linear ramp). Returns {slope, intercept, r2}. */
function weightedLinearRegression(
  xs: number[],
  ys: number[]
): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };

  const w = xs.map((_, i) => i + 1);
  const wSum = w.reduce((a, b) => a + b, 0);
  const xBar = xs.reduce((s, x, i) => s + x * w[i]!, 0) / wSum;
  const yBar = ys.reduce((s, y, i) => s + y * w[i]!, 0) / wSum;

  let num = 0;
  let denX = 0;
  for (let i = 0; i < n; i++) {
    num += w[i]! * (xs[i]! - xBar) * (ys[i]! - yBar);
    denX += w[i]! * (xs[i]! - xBar) ** 2;
  }
  const slope = denX === 0 ? 0 : num / denX;
  const intercept = yBar - slope * xBar;

  /* R² (unweighted for simplicity) */
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i]! + intercept;
    ssRes += (ys[i]! - pred) ** 2;
    ssTot += (ys[i]! - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

/* Exponential moving average */
function ema(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0;
  let e = values[0]!;
  for (let i = 1; i < values.length; i++) {
    e = alpha * values[i]! + (1 - alpha) * e;
  }
  return e;
}

/* Standard deviation */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/* ═══════════════════════════════════════════════════════════
   TRAJECTORY CLASSIFICATION
   ═══════════════════════════════════════════════════════════ */
function classifyTrajectory(slope: number, sd: number): Trajectory {
  if (sd > 15) return 'volatile';
  if (slope >= 1.2) return 'improving';
  if (slope <= -1.2) return 'declining';
  return 'plateauing';
}

/* ═══════════════════════════════════════════════════════════
   CONFIDENCE
   ═══════════════════════════════════════════════════════════ */
function computeConfidence(sessions: number, r2: number): {
  value: number;
  tier: ConfidenceTier;
} {
  const sessionScore = Math.min(1, sessions / 20);
  const fitScore = Math.min(1, r2 / 0.5);
  const value = Math.round((sessionScore * 0.6 + fitScore * 0.4) * 100) / 100;

  let tier: ConfidenceTier = 'low';
  if (sessions >= 15 && r2 >= 0.25) tier = 'high';
  else if (sessions >= 8) tier = 'medium';

  return { value, tier };
}

/* ═══════════════════════════════════════════════════════════
   RISK DETECTORS
   ═══════════════════════════════════════════════════════════ */
function detectRisks(
  accuracies: number[],
  rts: number[],
  slope: number,
  sd: number,
  daysBetween: number[]
): Array<{ key: string; detail_en: string; detail_ar: string }> {
  const risks: Array<{ key: string; detail_en: string; detail_ar: string }> = [];

  /* 1. Recent decline */
  const last3 = accuracies.slice(-3);
  if (last3.length === 3) {
    const avgLast3 = last3.reduce((a, b) => a + b, 0) / 3;
    const avgAll = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    if (avgLast3 < avgAll - 8) {
      risks.push({
        key: 'recent_dip',
        detail_en: `Last 3 sessions averaged ${avgLast3.toFixed(0)}% vs ${avgAll.toFixed(0)}% overall.`,
        detail_ar: `آخر 3 جلسات ${avgLast3.toFixed(0)}% مقابل ${avgAll.toFixed(0)}% عامة.`,
      });
    }
  }

  /* 2. RT increasing (fatigue signal) */
  if (rts.length >= 5) {
    const rtSlope = weightedLinearRegression(rts.map((_, i) => i), rts).slope;
    if (rtSlope > 30) {
      risks.push({
        key: 'rt_creep',
        detail_en: `Reaction time rising ~${rtSlope.toFixed(0)}ms per session.`,
        detail_ar: `زمن الاستجابة بيزيد ~${rtSlope.toFixed(0)}ms لكل جلسة.`,
      });
    }
  }

  /* 3. High volatility */
  if (sd > 18) {
    risks.push({
      key: 'volatile',
      detail_en: `Accuracy swings ±${sd.toFixed(0)}% between sessions.`,
      detail_ar: `الدقة بتتقلب ±${sd.toFixed(0)}% بين الجلسات.`,
    });
  }

  /* 4. Plateau */
  if (Math.abs(slope) < 0.5 && accuracies.length >= 10) {
    risks.push({
      key: 'plateau',
      detail_en: `No improvement over ${accuracies.length} sessions.`,
      detail_ar: `مفيش تحسّن خلال ${accuracies.length} جلسة.`,
    });
  }

  /* 5. Long gap */
  const lastGap = daysBetween[daysBetween.length - 1] ?? 0;
  if (lastGap >= 4) {
    risks.push({
      key: 'long_gap',
      detail_en: `${lastGap} days since last session.`,
      detail_ar: `${lastGap} يوم منذ آخر جلسة.`,
    });
  }

  return risks;
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════ */
interface SessionRow {
  game_id: string;
  game_name: string;
  accuracy: number;
  median_rt_ms: number;
  ended_at: string;
}

async function loadSessionsByGame(userId: string): Promise<Map<string, {
  game_name: string;
  rows: SessionRow[];
}>> {
  const res = await pool.query<SessionRow & { game_name: string }>(
    `SELECT s.game_id, g.name AS game_name, s.accuracy, s.median_rt_ms, s.ended_at
       FROM sessions s
       JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1
        AND s.status = 'accepted'
        AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - ($2 || ' days')::interval
      ORDER BY s.ended_at ASC`,
    [userId, String(LOOKBACK_DAYS)]
  );

  const map = new Map<string, { game_name: string; rows: SessionRow[] }>();
  for (const r of res.rows) {
    if (!map.has(r.game_id)) {
      map.set(r.game_id, { game_name: r.game_name, rows: [] });
    }
    map.get(r.game_id)!.rows.push(r);
  }
  return map;
}

async function getCurrentLevels(userId: string): Promise<Map<string, number>> {
  const res = await pool.query<{ game_id: string; current_level: number }>(
    `SELECT game_id, current_level FROM player_game_ability
      WHERE user_id = $1 AND mode = 'classic'`,
    [userId]
  );
  const map = new Map<string, number>();
  for (const r of res.rows) map.set(r.game_id, r.current_level);
  return map;
}

async function getEvidenceTier(userId: string): Promise<'calibrating' | 'provisional' | 'established'> {
  const res = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
    [userId]
  );
  const n = res.rows[0]?.n ?? 0;
  if (n < 5) return 'calibrating';
  if (n < 20) return 'provisional';
  return 'established';
}

/* ═══════════════════════════════════════════════════════════
   COMPUTE — per game
   ═══════════════════════════════════════════════════════════ */
function computeGamePrediction(
  gameId: string,
  gameName: string,
  rows: SessionRow[],
  currentLevel: number
): GamePrediction | null {
  const n = rows.length;
  if (n < MIN_SESSIONS_PER_GAME) return null;

  const accuracies = rows.map((r) => r.accuracy);
  const rts = rows.map((r) => r.median_rt_ms);
  const xs = rows.map((_, i) => i);

  /* Weighted linear regression */
  const { slope, intercept, r2 } = weightedLinearRegression(xs, accuracies);
  const rtReg = weightedLinearRegression(xs, rts);

  /* EMA + std */
  const emaAcc = ema(accuracies);
  const sd = stdDev(accuracies);

  /* Predicted next accuracy */
  const nextX = n;
  const rawNext = slope * nextX + intercept;
  const predictedNext = Math.max(0, Math.min(100, rawNext));

  /* Band = based on residual std */
  const band = Math.max(3, Math.min(15, sd * 0.6));

  /* Trajectory */
  const trajectory = classifyTrajectory(slope, sd);

  /* Confidence */
  const { value: confidence, tier: confidenceTier } = computeConfidence(n, r2);

  /* Sessions until next level */
  const sessionsUntilNext = computeSessionsUntilNextLevel(predictedNext, currentLevel);

  /* Sessions until max level (15) */
  const stepsLeft = Math.max(0, 15 - currentLevel);
  const sessionsPerLevel = avgSessionsPerLevel(predictedNext);
  const sessionsUntilMax = stepsLeft * sessionsPerLevel;

  /* Risk factors */
  const daysBetween = computeDaysBetween(rows);
  const riskFactors = detectRisks(accuracies, rts, slope, sd, daysBetween);

  /* Evidence */
  const firstAcc = accuracies[0] ?? 0;
  const lastAcc = accuracies[accuracies.length - 1] ?? 0;
  const bestAcc = Math.max(...accuracies);
  const spanDays = daysBetween.reduce((a, b) => a + b, 0);

  return {
    game_id: gameId,
    game_name: gameName,
    current_level: currentLevel,
    sessions_analyzed: n,
    accuracy_slope: Math.round(slope * 100) / 100,
    rt_slope: Math.round(rtReg.slope * 100) / 100,
    r_squared: Math.round(r2 * 100) / 100,
    ema_accuracy: Math.round(emaAcc * 10) / 10,
    predicted_next_accuracy: Math.round(predictedNext * 10) / 10,
    predicted_accuracy_band: Math.round(band * 10) / 10,
    sessions_until_next_level: sessionsUntilNext,
    sessions_until_max_level: sessionsUntilMax,
    trajectory,
    confidence,
    confidence_tier: confidenceTier,
    risk_factors: riskFactors,
  };
}

function computeSessionsUntilNextLevel(predictedAcc: number, level: number): number {
  if (level >= 15) return 0;
  if (predictedAcc >= 90) return 2;
  if (predictedAcc >= 85) return 3;
  if (predictedAcc >= 75) return 5;
  if (predictedAcc >= 65) return 8;
  return 12;
}

function avgSessionsPerLevel(predictedAcc: number): number {
  if (predictedAcc >= 88) return 3;
  if (predictedAcc >= 80) return 4;
  if (predictedAcc >= 70) return 5;
  return 7;
}

function computeDaysBetween(rows: SessionRow[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1]!.ended_at).getTime();
    const cur = new Date(rows[i]!.ended_at).getTime();
    out.push(Math.max(0, Math.round((cur - prev) / 86_400_000)));
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════
   PERSIST
   ═══════════════════════════════════════════════════════════ */
async function persistPrediction(userId: string, p: GamePrediction): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO predictions
         (user_id, game_id, current_level, predicted_level, sessions_eta,
          confidence, reasoning, trajectory, accuracy_slope, rt_slope,
          predicted_next_accuracy, predicted_accuracy_band, r_squared,
          sessions_until_next_level, sessions_until_max_level,
          risk_factors, evidence, confidence_tier, sessions_analyzed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        userId,
        p.game_id,
        p.current_level,
        Math.min(15, p.current_level + 1),
        p.sessions_until_next_level,
        p.confidence,
        `trajectory=${p.trajectory}; slope=${p.accuracy_slope}; r2=${p.r_squared}`,
        p.trajectory,
        p.accuracy_slope,
        p.rt_slope,
        p.predicted_next_accuracy,
        p.predicted_accuracy_band,
        p.r_squared,
        p.sessions_until_next_level,
        p.sessions_until_max_level,
        JSON.stringify(p.risk_factors),
        JSON.stringify({ ema: p.ema_accuracy, n: p.sessions_analyzed }),
        p.confidence_tier,
        p.sessions_analyzed,
      ]
    );
  } catch (err) {
    console.warn('[predictions] persist failed:', (err as Error).message);
  }
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export async function generatePredictions(
  userId: string,
  language: Lang = 'en',
  forceRefresh = false
): Promise<PredictionResult> {
  const started = Date.now();

  /* Cache */
  if (!forceRefresh) {
    const key = `${userId}:${language}`;
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      return { ...hit.result, latency_ms: 0 };
    }
  }

  /* Load */
  const [sessionsByGame, levels, evidenceTier] = await Promise.all([
    loadSessionsByGame(userId),
    getCurrentLevels(userId),
    getEvidenceTier(userId),
  ]);

  /* Compute per game */
  const predictions: GamePrediction[] = [];
  for (const [gameId, info] of sessionsByGame.entries()) {
    const level = levels.get(gameId) ?? 3;
    const pred = computeGamePrediction(gameId, info.game_name, info.rows, level);
    if (pred) predictions.push(pred);
  }

  /* Sort by confidence desc, then sessions desc */
  predictions.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) return b.confidence - a.confidence;
    return b.sessions_analyzed - a.sessions_analyzed;
  });

  /* Insufficient data */
  if (predictions.length === 0) {
    const total = Array.from(sessionsByGame.values()).reduce((s, v) => s + v.rows.length, 0);
    const result: PredictionResult = {
      games: [],
      summary:
        language === 'ar'
          ? `محتاجين ${MIN_SESSIONS_PER_GAME} جلسات على الأقل في لعبة واحدة على الأقل لبدء التوقعات. عندك ${total} جلسة.`
          : `Need at least ${MIN_SESSIONS_PER_GAME} sessions on a single game to start predicting. You have ${total}.`,
      strongest_game: null,
      weakest_game: null,
      overall_trajectory: 'unknown',
      total_sessions_analyzed: total,
      source: 'insufficient_data',
      provider: 'none',
      model: 'none',
      language,
      latency_ms: Date.now() - started,
      message: language === 'ar' ? 'لسه بدري' : 'Not enough data',
    };
    CACHE.set(`${userId}:${language}`, { result, ts: Date.now() });
    return result;
  }

  /* Top N */
  const top = predictions.slice(0, TOP_GAMES_LIMIT);
  const strongest = top.find((p) => p.trajectory === 'improving') ?? top[0]!;
  const weakest = top[top.length - 1]!;

  /* Overall trajectory */
  const improvingCount = top.filter((p) => p.trajectory === 'improving').length;
  const decliningCount = top.filter((p) => p.trajectory === 'declining').length;
  const overallTrajectory: Trajectory =
    improvingCount > decliningCount * 2 ? 'improving'
    : decliningCount > improvingCount * 2 ? 'declining'
    : improvingCount > 0 || decliningCount > 0 ? 'volatile'
    : 'plateauing';

  /* LLM phrasing */
  const ctx: PredictionContext = {
    total_sessions: top.reduce((s, p) => s + p.sessions_analyzed, 0),
    games_analyzed: top,
    strongest_game: strongest.game_name,
    weakest_game: weakest.game_name,
    overall_trajectory: overallTrajectory,
    evidence_tier: evidenceTier,
  };

  const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_PREDICTION_AR : SYSTEM_PROMPT_PREDICTION_EN;
  const userPrompt = buildPredictionPrompt(ctx, language);

  let summary = '';
  let source: PredictionResult['source'] = 'llm';
  let provider = '';
  let model = '';
  let tokens: PredictionResult['tokens'];

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 700, language }
    );
    const check = validateAiText(res.content, { minLen: 50, maxLen: 1500 });
    if (check.ok) {
      summary = check.cleaned;
      provider = res.provider;
      model = res.model;
      tokens = {
        prompt: res.usage.prompt_tokens,
        completion: res.usage.completion_tokens,
        total: res.usage.total_tokens,
      };
    } else {
      summary = buildFallbackSummary(ctx, language);
      source = 'rule';
      provider = 'none';
      model = 'rule';
    }
  } catch (err) {
    console.error('[predictions] LLM failed:', (err as Error).message);
    summary = buildFallbackSummary(ctx, language);
    source = 'rule';
    provider = 'none';
    model = 'rule';
  }

  /* Persist top 5 */
  for (const p of top.slice(0, 5)) {
    await persistPrediction(userId, p);
  }

  const result: PredictionResult = {
    games: top.map((p) => ({
      game_id: p.game_id,
      game_name: p.game_name,
      current_level: p.current_level,
      sessions_analyzed: p.sessions_analyzed,
      trajectory: p.trajectory,
      trajectory_label: trajectoryLabel(p.trajectory, language),
      confidence: p.confidence,
      confidence_tier: p.confidence_tier,
      accuracy_slope: p.accuracy_slope,
      rt_slope: p.rt_slope,
      r_squared: p.r_squared,
      ema_accuracy: p.ema_accuracy,
      predicted_next_accuracy: p.predicted_next_accuracy,
      predicted_accuracy_band: p.predicted_accuracy_band,
      sessions_until_next_level: p.sessions_until_next_level,
      sessions_until_max_level: p.sessions_until_max_level,
      risk_factors: p.risk_factors.map((r) => ({
        key: r.key,
        detail: language === 'ar' ? r.detail_ar : r.detail_en,
      })),
      evidence: {
        first_accuracy: 0,
        last_accuracy: 0,
        best_accuracy: 0,
        sessions_span_days: 0,
      },
    })),
    summary,
    strongest_game: strongest.game_name,
    weakest_game: weakest.game_name,
    overall_trajectory: overallTrajectory,
    total_sessions_analyzed: ctx.total_sessions,
    source,
    provider,
    model,
    language,
    latency_ms: Date.now() - started,
    tokens,
  };

  CACHE.set(`${userId}:${language}`, { result, ts: Date.now() });
  return result;
}

/* ═══════════════════════════════════════════════════════════
   HISTORY — last N predictions
   ═══════════════════════════════════════════════════════════ */
export async function getPredictionHistory(
  userId: string,
  limit = 20
): Promise<Array<{
  game_id: string;
  current_level: number;
  predicted_level: number;
  trajectory: string | null;
  accuracy_slope: number | null;
  predicted_next_accuracy: number | null;
  confidence_tier: string | null;
  computed_at: string;
}>> {
  const res = await pool.query(
    `SELECT game_id, current_level, predicted_level, trajectory,
            accuracy_slope, predicted_next_accuracy, confidence_tier, computed_at
       FROM predictions
      WHERE user_id = $1
      ORDER BY computed_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}