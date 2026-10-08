/* ═══════════════════════════════════════════════════════════
   Session Recap Service
   Flow: load facts -> build fact sheet -> router -> validate -> fallback
   Rule: LLM phrases facts. It never generates them.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import {
  SYSTEM_PROMPT_RECAP_EN,
  SYSTEM_PROMPT_RECAP_AR,
  buildRecapUserPrompt,
  type RecapFactSheet,
  type Lang,
} from './prompts-recap.js';
import { validateAiText, safeFallbackRecap } from './validator.js';

export interface RecapResult {
  recap: string;
  language: Lang;
  model: string;
  provider: string;
  source: 'llm' | 'fallback';
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  validation_issues?: { code: string; detail: string }[];
}

export async function generateSessionRecap(
  sessionId: string,
  userId: string,
  language: Lang = 'en'
): Promise<RecapResult> {
  const started = Date.now();

  const sheet = await loadFactSheet(sessionId, userId);
  if (!sheet) throw new Error('session_not_found_or_not_owned');

  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_RECAP_AR : SYSTEM_PROMPT_RECAP_EN;
  const userPrompt = buildRecapUserPrompt(sheet, language);

  let llmText = '';
  let usedModel = '';
  let usedProvider = '';
  let tokens: RecapResult['tokens'];

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 500, language }
    );
    llmText = res.content;
    usedModel = res.model;
    usedProvider = res.provider;
    tokens = {
      prompt: res.usage.prompt_tokens,
      completion: res.usage.completion_tokens,
      total: res.usage.total_tokens,
    };
    console.error('[recap] provider=' + usedProvider, '| model=' + usedModel, '| chain=' + res.fallback_chain.join('>'));
  } catch (err) {
    console.error('[recap] all providers failed:', (err as Error).message);
    return buildFallback(sheet, language, started, undefined);
  }

  const check = validateAiText(llmText, { minLen: 30, maxLen: 900 });
  if (!check.ok) {
    console.error('[recap] validation failed:', JSON.stringify(check.issues));
    return buildFallback(sheet, language, started, check.issues);
  }

  return {
    recap: check.cleaned,
    language,
    model: usedModel,
    provider: usedProvider,
    source: 'llm',
    latency_ms: Date.now() - started,
    tokens,
  };
}

/* --- Fact loading --- */
async function loadFactSheet(
  sessionId: string,
  userId: string
): Promise<RecapFactSheet | null> {
  const sessionRes = await pool.query<{
    game_id: string;
    domain_id: string;
    mode: string;
    accuracy: number | null;
    median_rt_ms: number | null;
    rcs: number | null;
    n_trials: number | null;
    n_correct: number | null;
  }>(
    `SELECT game_id, domain_id, mode, accuracy, median_rt_ms, rcs, n_trials, n_correct
       FROM sessions
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      LIMIT 1`,
    [sessionId, userId]
  );
  const s = sessionRes.rows[0];
  if (!s) return null;

  const gameRes = await pool.query<{ name: string }>(
    `SELECT name FROM games WHERE id = $1 LIMIT 1`,
    [s.game_id]
  );
  const gameName = gameRes.rows[0]?.name ?? s.game_id;

  const engRes = await pool.query<{
    reason_code: string;
    from_level: number | null;
    to_level: number | null;
    predicted_success: number | null;
  }>(
    `SELECT reason_code, from_level, to_level, predicted_success
       FROM engine_decisions
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [sessionId]
  );
  const eng = engRes.rows[0] ?? null;

  const statsRes = await pool.query<{
    sessions_count: number | null;
    recent_accuracy: number | null;
  }>(
    `SELECT sessions_count, recent_accuracy
       FROM user_game_stats
      WHERE user_id = $1 AND game_id = $2
      LIMIT 1`,
    [userId, s.game_id]
  );
  const stats = statsRes.rows[0] ?? null;

  const played = stats?.sessions_count ?? 0;
  const tier: RecapFactSheet['evidence_tier'] =
    played < 5 ? 'calibrating' : played < 20 ? 'provisional' : 'established';

  return {
    game_id: s.game_id,
    game_name: gameName,
    domain_id: s.domain_id,
    mode: s.mode,
    accuracy: s.accuracy ?? 0,
    median_rt_ms: s.median_rt_ms ?? 0,
    rcs: s.rcs ?? 0,
    n_trials: s.n_trials ?? 0,
    n_correct: s.n_correct ?? 0,
    reason_code: eng?.reason_code ?? 'HOLD_IN_BAND',
    from_level: eng?.from_level ?? 1,
    to_level: eng?.to_level ?? 1,
    predicted_success: eng?.predicted_success ?? 0,
    user_baseline_accuracy: stats?.recent_accuracy ?? null,
    sessions_played: played,
    evidence_tier: tier,
  };
}

/* --- Fallback --- */
function buildFallback(
  sheet: RecapFactSheet,
  language: Lang,
  startedAt: number,
  issues?: { code: string; detail: string }[]
): RecapResult {
  return {
    recap: safeFallbackRecap(
      sheet.accuracy,
      sheet.median_rt_ms,
      sheet.from_level,
      sheet.to_level,
      language
    ),
    language,
    model: 'fallback/template',
    provider: 'none',
    source: 'fallback',
    latency_ms: Date.now() - startedAt,
    validation_issues: issues,
  };
}