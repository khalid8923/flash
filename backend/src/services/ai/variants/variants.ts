/* ═══════════════════════════════════════════════════════════
   Game Variants Service
   Flow: base game → pick axis → LLM generates rules → validate → cache
   Rule: LLM produces structured rules. Validator enforces schema.
   ═══════════════════════════════════════════════════════════ */

import { createHash } from 'node:crypto';
import { pool } from '../../../config/db.js';
import { routeChat } from '../router.js';
import {
  SYSTEM_PROMPT_VARIANT_EN,
  SYSTEM_PROMPT_VARIANT_AR,
  buildVariantPrompt,
  buildFallbackVariantRules,
  type VariantPromptInput,
} from './prompts.js';
import { validateVariantRules, validateVariantText } from './validators.js';
import {
  ALLOWED_AXES,
  axisLabel,
  type Lang,
  type TrialPattern,
  type VariantAxis,
  type VariantRules,
  type VariantGenerateResult,
} from './types.js';

/* ═══════════════════════════════════════════════════════════
   DB reads
   ═══════════════════════════════════════════════════════════ */
interface BaseGameInfo {
  id: string;
  name: string;
  trial_pattern: TrialPattern;
  primary_metric: string;
}

async function getBaseGameInfo(gameId: string): Promise<BaseGameInfo | null> {
  const res = await pool.query<{
    id: string;
    name: string;
    trial_pattern: string;
    primary_metric: string;
  }>(
    `SELECT id, name, trial_pattern, primary_metric
       FROM games
      WHERE id = $1 AND status = 'ready'
      LIMIT 1`,
    [gameId]
  );
  const row = res.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    trial_pattern: row.trial_pattern as TrialPattern,
    primary_metric: row.primary_metric,
  };
}

async function listExistingVariantIds(
  gameId: string,
  lang: Lang
): Promise<string[]> {
  const res = await pool.query<{ variant_id: string }>(
    `SELECT variant_id FROM game_variants
      WHERE parent_game_id = $1 AND language = $2`,
    [gameId, lang]
  );
  return res.rows.map((r) => r.variant_id);
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function buildVariantId(gameId: string, axis: VariantAxis): string {
  return `${gameId}__${axis}__${shortHash(`${gameId}:${axis}:${Date.now()}`)}`;
}

/* Pick an axis not used yet, else rotate */
function pickAxis(pattern: TrialPattern, usedAxes: string[]): VariantAxis | null {
  const allowed = ALLOWED_AXES[pattern] ?? [];
  if (allowed.length === 0) return null;

  const usedSet = new Set(usedAxes);
  const fresh = allowed.filter((a) => !usedSet.has(a));
  if (fresh.length > 0) return fresh[0]!;

  /* All used — pick first (caller may force regenerate) */
  return allowed[0]!;
}

/* Robust JSON extraction */
function extractJson<T>(text: string): T | null {
  const candidates: string[] = [];
  candidates.push(text.trim());
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) candidates.push(fence[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  for (const c of candidates) {
    if (!c) continue;
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as T;
    } catch { /* try next */ }
  }
  return null;
}

/* Compose title & description */
function composeTitle(gameName: string, axis: VariantAxis, lang: Lang): string {
  return `${gameName} — ${axisLabel(axis, lang)}`;
}

/* ═══════════════════════════════════════════════════════════
   Fallback example_trial per pattern
   ═══════════════════════════════════════════════════════════ */
function fallbackExampleTrial(pattern: TrialPattern): VariantRules['example_trial'] {
  const base: VariantRules['example_trial'] = {
    index: 0,
    stimulus: {},
    response: {},
    rt_ms: 850,
    correct: true,
    is_practice: false,
  };
  switch (pattern) {
    case 'multiple_choice':
      return { ...base, stimulus: { prompt: 'sample', options: ['A', 'B', 'C', 'D'] }, response: { selected_index: 0 } };
    case 'sequence_recall':
      return { ...base, stimulus: { digits: [3, 7, 5] }, response: { entered: [3, 7, 5] }, rt_ms: 2200 };
    case 'spatial_click':
      return { ...base, stimulus: { grid: { rows: 4, cols: 4 }, target_cells: [0, 5, 10] }, response: { clicked_cells: [0, 5, 10] }, rt_ms: 1650 };
    case 'simple_rt':
      return { ...base, stimulus: { signal: 'green', delay_ms: 2000 }, response: { action: 'space' }, rt_ms: 245 };
    case 'go_no_go':
      return { ...base, stimulus: { type: 'go', shape: 'circle', color: 'blue' }, response: { pressed: true }, rt_ms: 340 };
    case 'task_switch':
      return { ...base, stimulus: { card: { color: 'red', shape: 'circle' }, active_rule: 'color', is_switch: false }, response: { selected_index: 0 }, rt_ms: 720 };
    case 'puzzle_move':
      return { ...base, stimulus: { state_before: { A: [3, 2, 1], B: [], C: [] }, legal_moves: [{ from: 'A', to: 'B' }] }, response: { move: { from: 'A', to: 'B' } }, rt_ms: 4200 };
    case 'memory_match':
      return { ...base, stimulus: { target: 'f2', options: ['Alice', 'Bob', 'Carol', 'Dan'] }, response: { selected_index: 1 }, rt_ms: 2400 };
    case 'free_response':
      return { ...base, stimulus: { prompt: 'List uses for a brick', time_limit_ms: 30000 }, response: { entries: ['wall', 'weight'] }, rt_ms: 12800 };
    case 'visual_search':
      return { ...base, stimulus: { target: 'A', grid: [['B', 'A'], ['C', 'D']] }, response: { selected_position: [0, 1] }, rt_ms: 640 };
    case 'spatial_rotation':
      return { ...base, stimulus: { shape: 'L-tetromino', angle_deg: 90 }, response: { selected_index: 0 }, rt_ms: 1900 };
    case 'remote_associate':
      return { ...base, stimulus: { words: ['cottage', 'swiss', 'cake'] }, response: { answer: 'cheese' }, rt_ms: 2500 };
    default:
      return base;
  }
}

/* ═══════════════════════════════════════════════════════════
   Persist
   ═══════════════════════════════════════════════════════════ */
async function saveVariant(
  parentGameId: string,
  variantId: string,
  title: string,
  description: string,
  rules: VariantRules,
  difficultyMod: number,
  language: Lang
): Promise<void> {
  await pool.query(
    `INSERT INTO game_variants
       (parent_game_id, variant_id, title, description, rules, difficulty_mod, language)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (parent_game_id, variant_id, language) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           rules = EXCLUDED.rules,
           difficulty_mod = EXCLUDED.difficulty_mod,
           generated_at = NOW()`,
    [parentGameId, variantId, title, description, JSON.stringify(rules), difficultyMod, language]
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — Generate one variant for a base game
   ═══════════════════════════════════════════════════════════ */
export async function generateVariant(
  gameId: string,
  language: Lang = 'en',
  forceRefresh = false
): Promise<VariantGenerateResult> {
  const started = Date.now();

  /* 1. Base game */
  const game = await getBaseGameInfo(gameId);
  if (!game) throw new Error('unknown_game');

  /* 2. Existing variants */
  const existing = await listExistingVariantIds(gameId, language);

  /* 3. Check for cached variant if not forcing refresh */
  if (!forceRefresh && existing.length > 0) {
    const cached = await pool.query<{
      variant_id: string;
      title: string;
      description: string;
      rules: VariantRules;
      difficulty_mod: number;
    }>(
      `SELECT variant_id, title, description, rules, difficulty_mod
         FROM game_variants
        WHERE parent_game_id = $1 AND language = $2
        ORDER BY generated_at DESC
        LIMIT 1`,
      [gameId, language]
    );
    const row = cached.rows[0];
    if (row) {
      const rules = row.rules;
      return {
        variant_id: row.variant_id,
        parent_game_id: game.id,
        parent_game_name: game.name,
        title: row.title,
        description: row.description,
        rules: { ...rules, parent_game: game.id },
        difficulty_mod: row.difficulty_mod,
        source: 'cache',
        provider: 'none',
        model: 'cache',
        language,
        latency_ms: Date.now() - started,
      };
    }
  }

  /* 4. Pick axis */
  const usedAxes = existing.map((id) => id.split('__')[1] ?? '');
  const axis = pickAxis(game.trial_pattern, usedAxes);
  if (!axis) throw new Error('no_allowed_axes');

  const promptInput: VariantPromptInput = {
    game_id: game.id,
    game_name: game.name,
    trial_pattern: game.trial_pattern,
    primary_metric: game.primary_metric,
    suggested_axis: axis,
  };

  /* 5. Try LLM */
  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_VARIANT_AR : SYSTEM_PROMPT_VARIANT_EN;
  const userPrompt = buildVariantPrompt(promptInput, language);

  let llmRules: VariantRules | null = null;
  let provider = '';
  let model = '';
  let source: VariantGenerateResult['source'] = 'llm';
  let tokens: VariantGenerateResult['tokens'];
  let validationIssues: string[] = [];

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1500, language, json_mode: true }
    );

    const parsed = extractJson<Record<string, unknown>>(res.content);
    if (!parsed) {
      validationIssues.push('json_parse_failed');
    } else {
      const validation = validateVariantRules(parsed, game.trial_pattern);
      if (validation.ok && validation.cleaned) {
        const textCheck = validateVariantText(validation.cleaned.instructions);
        if (!textCheck.ok) {
          validationIssues.push(...textCheck.issues);
        } else {
          llmRules = { ...validation.cleaned, parent_game: game.id };
          provider = res.provider;
          model = res.model;
          tokens = {
            prompt: res.usage.prompt_tokens,
            completion: res.usage.completion_tokens,
            total: res.usage.total_tokens,
          };
        }
      } else {
        validationIssues.push(...validation.issues);
      }
    }
  } catch (err) {
    console.error('[variants] LLM failed:', (err as Error).message);
    validationIssues.push('llm_error');
  }

  /* 6. Fallback if LLM failed */
  if (!llmRules) {
    const fb = buildFallbackVariantRules(promptInput, language);
    llmRules = {
      axis: fb.axis,
      parent_game: game.id,
      params: fb.params,
      instructions: fb.instructions,
      example_trial: fallbackExampleTrial(game.trial_pattern),
      difficulty_mod: fb.difficulty_mod,
    };
    source = 'rule';
    provider = 'none';
    model = 'rule';
  }

  /* 7. Build title + description + variantId */
  const title = composeTitle(game.name, llmRules.axis, language);
  const description = llmRules.instructions[language];
  const variantId = buildVariantId(game.id, llmRules.axis);

  /* 8. Persist */
  try {
    await saveVariant(
      game.id,
      variantId,
      title,
      description,
      llmRules,
      llmRules.difficulty_mod,
      language
    );
  } catch (err) {
    console.warn('[variants] save failed:', (err as Error).message);
  }

  return {
    variant_id: variantId,
    parent_game_id: game.id,
    parent_game_name: game.name,
    title,
    description,
    rules: llmRules,
    difficulty_mod: llmRules.difficulty_mod,
    source,
    provider,
    model,
    language,
    latency_ms: Date.now() - started,
    tokens,
    validation: { ok: validationIssues.length === 0, issues: validationIssues },
  };
}

/* ═══════════════════════════════════════════════════════════
   LIST — All variants for one game
   ═══════════════════════════════════════════════════════════ */
export async function listVariants(
  gameId: string,
  language: Lang = 'en'
): Promise<Array<{
  variant_id: string;
  title: string;
  description: string;
  axis: VariantAxis;
  difficulty_mod: number;
  generated_at: string;
}>> {
  const res = await pool.query<{
    variant_id: string;
    title: string;
    description: string;
    rules: VariantRules;
    difficulty_mod: number;
    generated_at: string;
  }>(
    `SELECT variant_id, title, description, rules, difficulty_mod, generated_at
       FROM game_variants
      WHERE parent_game_id = $1 AND language = $2
      ORDER BY generated_at DESC`,
    [gameId, language]
  );

  return res.rows.map((r) => ({
    variant_id: r.variant_id,
    title: r.title,
    description: r.description,
    axis: r.rules.axis,
    difficulty_mod: r.difficulty_mod,
    generated_at: r.generated_at,
  }));
}

/* ═══════════════════════════════════════════════════════════
   GET — Single variant by id
   ═══════════════════════════════════════════════════════════ */
export async function getVariant(
  variantId: string,
  language: Lang = 'en'
): Promise<VariantGenerateResult | null> {
  const res = await pool.query<{
    variant_id: string;
    parent_game_id: string;
    title: string;
    description: string;
    rules: VariantRules;
    difficulty_mod: number;
    language: string;
    generated_at: string;
  }>(
    `SELECT variant_id, parent_game_id, title, description, rules, difficulty_mod,
            language, generated_at
       FROM game_variants
      WHERE variant_id = $1 AND language = $2
      LIMIT 1`,
    [variantId, language]
  );

  const row = res.rows[0];
  if (!row) return null;

  /* Also fetch game name */
  const gameRes = await pool.query<{ name: string }>(
    `SELECT name FROM games WHERE id = $1 LIMIT 1`,
    [row.parent_game_id]
  );
  const gameName = gameRes.rows[0]?.name ?? row.parent_game_id;

  return {
    variant_id: row.variant_id,
    parent_game_id: row.parent_game_id,
    parent_game_name: gameName,
    title: row.title,
    description: row.description,
    rules: { ...row.rules, parent_game: row.parent_game_id },
    difficulty_mod: row.difficulty_mod,
    source: 'cache',
    provider: 'none',
    model: 'cache',
    language,
    latency_ms: 0,
  };
}