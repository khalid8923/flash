/* ═══════════════════════════════════════════════════════════
   AI Content Generation + Validator Integration
   Flow: cache check → Groq → shape validation → L4 filter → cache
   Rule: Never cache or return content that fails validation.
   ═══════════════════════════════════════════════════════════ */

import { createHash } from 'node:crypto';
import { pool } from '../../config/db.js';
import { routeJson } from './router.js';
import { getPrompt, isGenerativeGame } from './prompts.js';
import { validateAiText, validateGeneratedShape } from './validator.js';

export interface GenerateParams {
  gameId: string;
  difficulty: number;
  language?: string;
  exclude?: string[];
  bypassCache?: boolean;
}

export interface GenerateResult {
  content: unknown;
  source: 'cache' | 'groq';
  game_id: string;
  difficulty: number;
  language: string;
  cached_hash?: string;
  latency_ms?: number;
  model?: string;
  provider?: string;
  tokens?: { prompt: number; completion: number; total: number };
  validation?: {
    shape_ok: boolean;
    text_ok: boolean;
    issues: { code: string; detail: string }[];
  };
}

function contentFingerprint(content: unknown): string {
  const str = JSON.stringify(content);
  return createHash('sha256').update(str).digest('hex').slice(0, 12);
}

/* Recursively extract all string values from a nested object */
function extractStrings(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === 'string') {
    out.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) extractStrings(item, out);
  } else if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      extractStrings(v, out);
    }
  }
  return out;
}

/* Validate the entire generated object:
   1. Shape: required fields exist
   2. Text: each string passes L4/hype checks
*/
function validateGeneratedObject(
  data: Record<string, unknown>,
  requiredFields: string[]
): {
  ok: boolean;
  shape_ok: boolean;
  text_ok: boolean;
  issues: { code: string; detail: string }[];
} {
  const issues: { code: string; detail: string }[] = [];

  /* Shape check */
  const shape = validateGeneratedShape(data, requiredFields);
  if (!shape.ok) {
    issues.push(...shape.issues);
  }

  /* Text check: every string value */
  const strings = extractStrings(data);
  let textIssues = 0;
  for (const s of strings) {
    // Skip short codes/slugs (like "part-whole", "ad-hominem")
    if (s.length < 8 || !s.includes(' ')) continue;
    const check = validateAiText(s, { minLen: 1, maxLen: 3000 });
    if (!check.ok) {
      // Filter out too_short issues (we already gated with length < 8)
      const meaningful = check.issues.filter(
        (i) => i.code !== 'too_short' && i.code !== 'too_long'
      );
      if (meaningful.length > 0) {
        issues.push(...meaningful);
        textIssues++;
      }
    }
  }

  return {
    ok: issues.length === 0,
    shape_ok: shape.ok,
    text_ok: textIssues === 0,
    issues,
  };
}

export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const { gameId, difficulty, language = 'en', exclude = [], bypassCache = false } = params;

  if (!isGenerativeGame(gameId)) {
    throw new Error(`Game ${gameId} does not support generative content`);
  }

  const prompt = getPrompt(gameId, { difficulty, exclude, lang: language });
  if (!prompt) throw new Error(`Prompt not found for ${gameId}`);

  /* ─── Cache check ─── */
  if (!bypassCache) {
    const cached = await pool.query<{ content: unknown; content_hash: string }>(
      `SELECT content, content_hash FROM generated_content_cache
       WHERE game_id = $1 AND difficulty = $2 AND used_count < 5
       ORDER BY used_count ASC, generated_at DESC
       LIMIT 1`,
      [gameId, difficulty]
    );

    const cachedRow = cached.rows[0];
    if (cachedRow) {
      await pool.query(
        `UPDATE generated_content_cache SET used_count = used_count + 1 WHERE content_hash = $1`,
        [cachedRow.content_hash]
      );
      return {
        content: cachedRow.content,
        source: 'cache',
        game_id: gameId,
        difficulty,
        language,
        cached_hash: cachedRow.content_hash,
      };
    }
  }

  /* ─── Generate via Router ─── */
  const { data, meta } = await routeJson<Record<string, unknown>>(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    {
      temperature: 0.85,
      max_tokens: 1500,
      language: (language === 'ar' ? 'ar' : 'en') as 'en' | 'ar',
    }
  );
  console.error('[generate] provider=' + meta.provider, '| model=' + meta.model, '| chain=' + meta.fallback_chain.join('>'));

  /* ─── Validate ─── */
  const validation = validateGeneratedObject(data, [
    /* Generic required fields every generated object must have */
    'correct_index',
  ]);

  if (!validation.ok) {
    const err = new Error(
      `Generated content failed validation: ${validation.issues
        .map((i) => i.code)
        .join(', ')}`
    );
    (err as Error & { issues?: unknown }).issues = validation.issues;
    throw err;
  }

  const hash = contentFingerprint(data);

  /* ─── Cache only validated content ─── */
  try {
    await pool.query(
      `INSERT INTO generated_content_cache (game_id, difficulty, content_hash, content)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_id, difficulty, content_hash) DO NOTHING`,
      [gameId, difficulty, hash, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn('[AI] Cache insert failed:', (err as Error).message);
  }

  return {
    content: data,
    source: 'groq',
    game_id: gameId,
    difficulty,
    language,
    cached_hash: hash,
    latency_ms: meta.latency_ms,
    model: meta.model,
    provider: meta.provider,
    tokens: {
      prompt: meta.usage.prompt_tokens,
      completion: meta.usage.completion_tokens,
      total: meta.usage.total_tokens,
    },
    validation: {
      shape_ok: validation.shape_ok,
      text_ok: validation.text_ok,
      issues: validation.issues,
    },
  };
}