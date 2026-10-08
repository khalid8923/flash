/* ═══════════════════════════════════════════════════════════
   Error Pattern Analysis Service
   Flow: load trials → detect patterns (rule-based) → LLM phrasing → cache
   Rule: detectors are deterministic. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  SYSTEM_PROMPT_ERROR_PATTERNS_EN,
  SYSTEM_PROMPT_ERROR_PATTERNS_AR,
  buildErrorPatternsPrompt,
  patternLabel,
  type DetectedPattern,
  type Lang,
} from './prompts-error-patterns.js';

/* ─── Trial shape (from session_trials.trials) ─── */
interface Trial {
  index: number;
  rt_ms: number | null;
  correct: boolean | null;
  is_practice: boolean;
  stimulus?: unknown;
  response?: unknown;
}

interface SessionWithTrials {
  session_id: string;
  game_id: string;
  accuracy: number;
  median_rt_ms: number;
  trials: Trial[];
}

/* ─── Result ─── */
export interface ErrorPatternsResult {
  insights: string;
  patterns: Array<{
    key: string;
    label: string;
    frequency: number;
    total_sessions: number;
    evidence: string;
    game_scope: string;
  }>;
  analyzed_sessions: number;
  analyzed_trials: number;
  top_game: string | null;
  source: 'llm' | 'rule' | 'insufficient_data';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  message?: string;
}

const MIN_SESSIONS = 3;
const MIN_TRIALS = 20;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MIN_FREQ_FOR_PATTERN = 2;

/* In-memory cache */
const memCache = new Map<string, { result: ErrorPatternsResult; ts: number }>();

function cacheKey(userId: string, lang: Lang, gameId: string | null): string {
  return `${userId}:${lang}:${gameId ?? 'all'}`;
}

/* ─── Utilities ─── */
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function validTrials(trials: Trial[]): Trial[] {
  return trials.filter((t) => !t.is_practice && t.correct !== null);
}

function fmtPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

/* ═══════════════════════════════════════════════════════════
   DETECTORS
   ═══════════════════════════════════════════════════════════ */

interface DetectorHit {
  triggered: boolean;
  evidence_en: string;
  evidence_ar: string;
}

/* 1. Post-error slowdown */
function detectPostErrorSlowdown(s: SessionWithTrials): DetectorHit {
  const trials = validTrials(s.trials);
  const afterError: number[] = [];
  const afterCorrect: number[] = [];

  for (let i = 1; i < trials.length; i++) {
    const prev = trials[i - 1];
    const cur = trials[i];
    if (!prev || !cur || cur.rt_ms === null) continue;
    if (prev.correct === false) afterError.push(cur.rt_ms);
    else if (prev.correct === true) afterCorrect.push(cur.rt_ms);
  }

  if (afterError.length < 3 || afterCorrect.length < 3) {
    return { triggered: false, evidence_en: '', evidence_ar: '' };
  }

  const mErr = median(afterError);
  const mCorr = median(afterCorrect);
  if (mCorr === 0) return { triggered: false, evidence_en: '', evidence_ar: '' };

  const ratio = mErr / mCorr;
  if (ratio >= 1.25) {
    const pct = Math.round((ratio - 1) * 100);
    return {
      triggered: true,
      evidence_en: `RT rises ~${pct}% after a wrong answer (${Math.round(mErr)}ms vs ${Math.round(mCorr)}ms)`,
      evidence_ar: `زمن ردك بيزيد ~${pct}% بعد الخطأ (${Math.round(mErr)}ms مقابل ${Math.round(mCorr)}ms)`,
    };
  }
  return { triggered: false, evidence_en: '', evidence_ar: '' };
}

/* 2. First-trial penalty */
function detectFirstTrialPenalty(s: SessionWithTrials): DetectorHit {
  const trials = validTrials(s.trials);
  if (trials.length < 8) return { triggered: false, evidence_en: '', evidence_ar: '' };

  const firstThree = trials.slice(0, 3);
  const rest = trials.slice(3);
  const firstAcc = firstThree.filter((t) => t.correct === true).length / firstThree.length;
  const restAcc = rest.filter((t) => t.correct === true).length / rest.length;

  if (rest.length < 5) return { triggered: false, evidence_en: '', evidence_ar: '' };
  const diff = restAcc - firstAcc;

  if (diff >= 0.25) {
    return {
      triggered: true,
      evidence_en: `First 3 trials: ${fmtPct(firstAcc * 100)} accuracy vs ${fmtPct(restAcc * 100)} for the rest`,
      evidence_ar: `أول 3 محاولات: دقة ${fmtPct(firstAcc * 100)} مقابل ${fmtPct(restAcc * 100)} للباقي`,
    };
  }
  return { triggered: false, evidence_en: '', evidence_ar: '' };
}

/* 3. Late session fatigue */
function detectLateFatigue(s: SessionWithTrials): DetectorHit {
  const trials = validTrials(s.trials);
  if (trials.length < 10) return { triggered: false, evidence_en: '', evidence_ar: '' };

  const half = Math.floor(trials.length / 2);
  const first = trials.slice(0, half);
  const second = trials.slice(half);
  const firstAcc = first.filter((t) => t.correct === true).length / first.length;
  const secondAcc = second.filter((t) => t.correct === true).length / second.length;
  const diff = firstAcc - secondAcc;

  if (diff >= 0.15) {
    return {
      triggered: true,
      evidence_en: `Accuracy drops ${fmtPct(diff * 100)} in the second half (${fmtPct(firstAcc * 100)} → ${fmtPct(secondAcc * 100)})`,
      evidence_ar: `دقتك بتقل ${fmtPct(diff * 100)} في النص التاني (${fmtPct(firstAcc * 100)} → ${fmtPct(secondAcc * 100)})`,
    };
  }
  return { triggered: false, evidence_en: '', evidence_ar: '' };
}

/* 4. Consecutive error streaks */
function detectConsecutiveErrors(s: SessionWithTrials): DetectorHit {
  const trials = validTrials(s.trials);
  let maxStreak = 0;
  let cur = 0;
  for (const t of trials) {
    if (t.correct === false) {
      cur++;
      if (cur > maxStreak) maxStreak = cur;
    } else {
      cur = 0;
    }
  }

  if (maxStreak >= 3) {
    return {
      triggered: true,
      evidence_en: `Longest error streak: ${maxStreak} wrong answers in a row`,
      evidence_ar: `أطول سلسلة أخطاء: ${maxStreak} إجابات غلط ورا بعض`,
    };
  }
  return { triggered: false, evidence_en: '', evidence_ar: '' };
}

/* ═══════════════════════════════════════════════════════════
   LOAD SESSIONS WITH TRIALS
   ═══════════════════════════════════════════════════════════ */
async function loadSessionsWithTrials(
  userId: string,
  gameId: string | null,
  limit: number = 30
): Promise<SessionWithTrials[]> {
  const params: unknown[] = [userId, limit];
  let gameFilter = '';
  if (gameId) {
    gameFilter = ' AND s.game_id = $3';
    params.push(gameId);
  }

  const res = await pool.query<{
    session_id: string;
    game_id: string;
    accuracy: number;
    median_rt_ms: number;
    trials: unknown;
  }>(
    `SELECT s.id AS session_id, s.game_id, s.accuracy, s.median_rt_ms, st.trials
       FROM sessions s
       INNER JOIN session_trials st ON st.session_id = s.id
      WHERE s.user_id = $1
        AND s.status = 'accepted'
        AND s.deleted_at IS NULL
        ${gameFilter}
      ORDER BY s.ended_at DESC
      LIMIT $2`,
    params
  );

  return res.rows.map((r) => ({
    session_id: r.session_id,
    game_id: r.game_id,
    accuracy: r.accuracy ?? 0,
    median_rt_ms: r.median_rt_ms ?? 0,
    trials: Array.isArray(r.trials) ? (r.trials as Trial[]) : [],
  }));
}

/* ═══════════════════════════════════════════════════════════
   AGGREGATE PATTERNS
   ═══════════════════════════════════════════════════════════ */
function aggregatePatterns(sessions: SessionWithTrials[]): DetectedPattern[] {
  const detectors: Array<{ key: string; fn: (s: SessionWithTrials) => DetectorHit }> = [
    { key: 'post_error_slowdown', fn: detectPostErrorSlowdown },
    { key: 'first_trial_penalty', fn: detectFirstTrialPenalty },
    { key: 'late_session_fatigue', fn: detectLateFatigue },
    { key: 'consecutive_errors', fn: detectConsecutiveErrors },
  ];

  const total = sessions.length;
  const patterns: DetectedPattern[] = [];

  for (const d of detectors) {
    let freq = 0;
    let lastEvidenceEn = '';
    let lastEvidenceAr = '';
    for (const s of sessions) {
      const hit = d.fn(s);
      if (hit.triggered) {
        freq++;
        if (!lastEvidenceEn) {
          lastEvidenceEn = hit.evidence_en;
          lastEvidenceAr = hit.evidence_ar;
        }
      }
    }
    if (freq >= MIN_FREQ_FOR_PATTERN) {
      patterns.push({
        key: d.key,
        frequency: freq,
        total_sessions: total,
        evidence_en: lastEvidenceEn,
        evidence_ar: lastEvidenceAr,
        game_scope: 'all',
      });
    }
  }

  /* Sort by frequency desc */
  patterns.sort((a, b) => b.frequency - a.frequency);
  return patterns.slice(0, 4);
}

/* ═══════════════════════════════════════════════════════════
   FALLBACK SUMMARY
   ═══════════════════════════════════════════════════════════ */
function buildFallback(
  patterns: DetectedPattern[],
  sessionsCount: number,
  lang: Lang
): string {
  if (patterns.length === 0) {
    return lang === 'ar'
      ? `حلّلنا ${sessionsCount} جلسة ومفيش نمط واضح لحد دلوقتي.`
      : `Analyzed ${sessionsCount} sessions — no clear pattern yet.`;
  }
  const top = patterns[0]!;
  const label = patternLabel(top.key, lang);
  const ev = lang === 'ar' ? top.evidence_ar : top.evidence_en;
  if (lang === 'ar') {
    return `أبرز نمط: ${label} (${top.frequency}/${top.total_sessions} جلسة). ${ev}. راقب النمط ده في الجلسات الجاية.`;
  }
  return `Top pattern: ${label} (${top.frequency}/${top.total_sessions} sessions). ${ev}. Keep an eye on this in upcoming sessions.`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export async function generateErrorInsights(
  userId: string,
  language: Lang = 'en',
  gameId: string | null = null,
  forceRefresh = false
): Promise<ErrorPatternsResult> {
  const started = Date.now();

  /* Cache */
  if (!forceRefresh) {
    const key = cacheKey(userId, language, gameId);
    const hit = memCache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      return { ...hit.result, latency_ms: 0, source: 'rule' === hit.result.source ? 'rule' : hit.result.source };
    }
  }

  /* Load */
  const sessions = await loadSessionsWithTrials(userId, gameId, 30);
  const totalTrials = sessions.reduce((sum, s) => sum + s.trials.length, 0);

  const sessionsOk = sessions.length >= MIN_SESSIONS;
  const trialsOk = totalTrials >= MIN_TRIALS;

  if (!sessionsOk || !trialsOk) {
    let reason = '';
    if (!sessionsOk && !trialsOk) {
      reason = language === 'ar'
        ? `محتاجين ${MIN_SESSIONS} جلسات على الأقل (عندك ${sessions.length}) و ${MIN_TRIALS} محاولة (عندك ${totalTrials}).`
        : `Need at least ${MIN_SESSIONS} sessions (you have ${sessions.length}) and ${MIN_TRIALS} trials (you have ${totalTrials}).`;
    } else if (!sessionsOk) {
      reason = language === 'ar'
        ? `محتاجين ${MIN_SESSIONS} جلسات على الأقل. عندك ${sessions.length}.`
        : `Need at least ${MIN_SESSIONS} sessions. You have ${sessions.length}.`;
    } else {
      reason = language === 'ar'
        ? `محتاجين ${MIN_TRIALS} محاولة على الأقل لتحليل الأنماط. عندك ${totalTrials}.`
        : `Need at least ${MIN_TRIALS} trials to analyze patterns. You have ${totalTrials}.`;
    }

    const result: ErrorPatternsResult = {
      insights: (language === 'ar' ? 'لسه بدري — ' : 'Not enough data yet — ') + reason,
      patterns: [],
      analyzed_sessions: sessions.length,
      analyzed_trials: totalTrials,
      top_game: gameId,
      source: 'insufficient_data',
      provider: 'none',
      model: 'none',
      language,
      latency_ms: Date.now() - started,
      message: reason,
    };
    memCache.set(cacheKey(userId, language, gameId), { result, ts: Date.now() });
    return result;
  }

  /* Detect */
  const detected = aggregatePatterns(sessions);
  const topGame = gameId ?? sessions[0]?.game_id ?? null;

  /* LLM phrasing */
  let insights = '';
  let source: ErrorPatternsResult['source'] = 'llm';
  let provider = '';
  let model = '';
  let tokens: ErrorPatternsResult['tokens'];

  if (detected.length === 0) {
    insights = buildFallback(detected, sessions.length, language);
    source = 'rule';
    provider = 'none';
    model = 'rule';
  } else {
    const systemPrompt =
      language === 'ar' ? SYSTEM_PROMPT_ERROR_PATTERNS_AR : SYSTEM_PROMPT_ERROR_PATTERNS_EN;
    const userPrompt = buildErrorPatternsPrompt(detected, sessions.length, language);

    try {
      const res = await routeChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.5, max_tokens: 500, language }
      );
      const check = validateAiText(res.content, { minLen: 50, maxLen: 1200 });
      if (check.ok) {
        insights = check.cleaned;
        provider = res.provider;
        model = res.model;
        tokens = {
          prompt: res.usage.prompt_tokens,
          completion: res.usage.completion_tokens,
          total: res.usage.total_tokens,
        };
      } else {
        insights = buildFallback(detected, sessions.length, language);
        source = 'rule';
        provider = 'none';
        model = 'rule';
      }
    } catch (err) {
      console.error('[error-patterns] LLM failed:', (err as Error).message);
      insights = buildFallback(detected, sessions.length, language);
      source = 'rule';
      provider = 'none';
      model = 'rule';
    }
  }

  const result: ErrorPatternsResult = {
    insights,
    patterns: detected.map((p) => ({
      key: p.key,
      label: patternLabel(p.key, language),
      frequency: p.frequency,
      total_sessions: p.total_sessions,
      evidence: language === 'ar' ? p.evidence_ar : p.evidence_en,
      game_scope: p.game_scope,
    })),
    analyzed_sessions: sessions.length,
    analyzed_trials: totalTrials,
    top_game: topGame,
    source,
    provider,
    model,
    language,
    latency_ms: Date.now() - started,
    tokens,
  };

  memCache.set(cacheKey(userId, language, gameId), { result, ts: Date.now() });
  return result;
}