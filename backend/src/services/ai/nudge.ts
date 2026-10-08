/* ═══════════════════════════════════════════════════════════
   In-Game Micro-Coach Service
   Uses AI Router (Groq → OpenRouter → Gemini) with fallback.
   Rule: ONE short sentence. Latency < 800ms. Calm tone.
   ═══════════════════════════════════════════════════════════ */

import { createHash } from 'node:crypto';
import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import {
  SYSTEM_PROMPT_NUDGE_EN,
  SYSTEM_PROMPT_NUDGE_AR,
  buildNudgeUserPrompt,
  type NudgeContext,
  type Lang,
  type NudgeTrigger,
} from './prompts-nudge.js';
import { validateAiText } from './validator.js';

export interface NudgeResult {
  message: string;
  trigger: NudgeTrigger;
  source: 'cache' | 'llm' | 'static';
  provider?: string;
  language: Lang;
  latency_ms: number;
}

/* Deterministic fallback per trigger + language */
const FALLBACK: Record<NudgeTrigger, Record<Lang, string>> = {
  slow_down:    { en: 'Pace is slow - take a breath.',              ar: 'إيقاعك بطيء - خد نفس.' },
  speed_up:     { en: 'Accuracy is high - try slightly faster.',    ar: 'دقتك عالية - جرّب أسرع.' },
  tired:        { en: "You've been at it a while - consider a break.", ar: 'قعدت فترة - خد بريك.' },
  focus:        { en: 'Three misses - slow down and refocus.',      ar: '3 أخطاء - اهدأ وركّز.' },
  streak_break: { en: 'Streak ended - reset and continue.',         ar: 'السلسلة انقطعت - ابدأ من جديد.' },
  great_run:    { en: 'Consistent pace - hold it.',                 ar: 'إيقاع ثابت - حافظ عليه.' },
};

function patternHash(c: NudgeContext): string {
  const accBucket = Math.floor(c.recent_accuracy / 10) * 10;
  const rtBucket = Math.floor(c.recent_median_rt_ms / 100) * 100;
  const durationBucket = Math.floor(c.session_duration_ms / 60_000);
  const raw = `${c.trigger}|${c.game_id}|${accBucket}|${rtBucket}|${durationBucket}|${c.consecutive_mistakes}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export async function generateNudge(
  ctx: NudgeContext,
  language: Lang = 'en'
): Promise<NudgeResult> {
  const started = Date.now();
  const hash = patternHash(ctx);

  /* 1) Cache check */
  try {
    const cached = await pool.query<{ message: string }>(
      `SELECT message FROM nudge_cache
        WHERE pattern_hash = $1 AND language = $2
        ORDER BY used_count ASC, created_at DESC
        LIMIT 1`,
      [hash, language]
    );
    if (cached.rows[0]) {
      await pool.query(
        `UPDATE nudge_cache SET used_count = used_count + 1 WHERE pattern_hash = $1 AND language = $2`,
        [hash, language]
      );
      return {
        message: cached.rows[0].message,
        trigger: ctx.trigger,
        source: 'cache',
        language,
        latency_ms: Date.now() - started,
      };
    }
  } catch (err) {
    console.warn('[nudge] cache lookup failed:', (err as Error).message);
  }

  /* 2) Call LLM via router (Groq → OpenRouter → Gemini) */
  const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_NUDGE_AR : SYSTEM_PROMPT_NUDGE_EN;
  const userPrompt = buildNudgeUserPrompt(ctx, language);

  let llmText = '';
  let provider = '';
  try {
    const result = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, max_tokens: 500, language }
    );
    llmText = result.content;
    provider = result.provider;
    console.error(
      '[nudge] provider=' + result.provider,
      'model=' + result.model,
      'chain=' + result.fallback_chain.join('>'),
      'len=' + llmText.length
    );
  } catch (err) {
    console.error('[nudge] All providers failed:', (err as Error).message);
    return {
      message: FALLBACK[ctx.trigger][language],
      trigger: ctx.trigger,
      source: 'static',
      language,
      latency_ms: Date.now() - started,
    };
  }

  if (!llmText || llmText.trim().length < 5) {
    console.error('[nudge] Empty LLM response');
    return {
      message: FALLBACK[ctx.trigger][language],
      trigger: ctx.trigger,
      source: 'static',
      language,
      latency_ms: Date.now() - started,
    };
  }

  /* 3) Validate */
  const check = validateAiText(llmText, { minLen: 5, maxLen: 200 });
  if (!check.ok) {
    console.error('[nudge] validation failed:', JSON.stringify(check.issues));
    return {
      message: FALLBACK[ctx.trigger][language],
      trigger: ctx.trigger,
      source: 'static',
      language,
      latency_ms: Date.now() - started,
    };
  }

  const message = check.cleaned.replace(/\s+/g, ' ').replace(/[.!]+$/g, '').trim();

  /* 4) Store in cache */
  try {
    await pool.query(
      `INSERT INTO nudge_cache (pattern_hash, trigger_type, language, message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (pattern_hash, language) DO NOTHING`,
      [hash, ctx.trigger, language, message]
    );
  } catch (err) {
    console.warn('[nudge] cache insert failed:', (err as Error).message);
  }

  return {
    message,
    trigger: ctx.trigger,
    source: 'llm',
    provider,
    language,
    latency_ms: Date.now() - started,
  };
}