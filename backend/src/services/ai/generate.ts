import { createHash } from 'node:crypto';
import { pool } from '../../config/db.js';
import { groq } from './groq-client.js';
import { getPrompt, isGenerativeGame } from './prompts.js';

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
  tokens?: { prompt: number; completion: number; total: number };
}

function hashContent(gameId: string, difficulty: number, lang: string, content: unknown): string {
  const str = `${gameId}|${difficulty}|${lang}|${JSON.stringify(content)}`;
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function contentFingerprint(content: unknown): string {
  const str = JSON.stringify(content);
  return createHash('sha256').update(str).digest('hex').slice(0, 12);
}

export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const { gameId, difficulty, language = 'en', exclude = [], bypassCache = false } = params;

  if (!isGenerativeGame(gameId)) {
    throw new Error(`Game ${gameId} does not support generative content`);
  }

  const prompt = getPrompt(gameId, { difficulty, exclude, lang: language });
  if (!prompt) throw new Error(`Prompt not found for ${gameId}`);

  // Try cache first (only if not bypassing)
  if (!bypassCache) {
    const cached = await pool.query<{ content: unknown; content_hash: string }>(
      `SELECT content, content_hash FROM generated_content_cache
       WHERE game_id = $1 AND difficulty = $2 AND used_count < 5
       ORDER BY used_count ASC, generated_at DESC
       LIMIT 1`,
      [gameId, difficulty]
    );

    if (cached.rowCount && cached.rows.length > 0) {
      await pool.query(
        `UPDATE generated_content_cache SET used_count = used_count + 1 WHERE content_hash = $1`,
        [cached.rows[0].content_hash]
      );
      return {
        content: cached.rows[0].content,
        source: 'cache',
        game_id: gameId,
        difficulty,
        language,
        cached_hash: cached.rows[0].content_hash,
      };
    }
  }

  // Generate new via Groq
  if (!groq.isEnabled()) {
    throw new Error('Groq not configured â€” cannot generate new content');
  }

  const { data, meta } = await groq.json<Record<string, unknown>>(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    { temperature: 0.85, max_tokens: 1500, json_mode: true }
  );

  const hash = contentFingerprint(data);

  // Store in cache
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
    tokens: {
      prompt: meta.usage.prompt_tokens,
      completion: meta.usage.completion_tokens,
      total: meta.usage.total_tokens,
    },
  };
}