/* ═══════════════════════════════════════════════════════════
   Catalog — Registry
   Central access to every game config. 36 games total.
   ═══════════════════════════════════════════════════════════ */

import type { GameConfig, DomainId, ConfigValidation } from './types.js';
import { CLASSIC_LEVEL_COUNT, REQUIRED_DOMAINS } from './types.js';

/* ─── Attention ─── */
import { flankerConfig } from './games/flanker.js';
import { goNoGoConfig } from './games/go-no-go.js';
import { taskSwitchingConfig } from './games/task-switching.js';
import { vigilanceConfig } from './games/vigilance.js';

/* ─── Spatial ─── */
import { mentalRotationConfig } from './games/mental-rotation.js';
import { corsiBlocksConfig } from './games/corsi-blocks.js';
import { mapMemoryConfig } from './games/map-memory.js';
import { blockCounterConfig } from './games/block-counter.js';

/* ─── Speed ─── */
import { reactionConfig } from './games/reaction.js';
import { colorMatchConfig } from './games/color-match.js';
import { symbolSprintConfig } from './games/symbol-sprint.js';
import { rapidFireConfig } from './games/rapid-fire.js';

/* ─── Memory ─── */
import { nBackConfig } from './games/n-back.js';
import { faceMatchConfig } from './games/face-match.js';
import { patternRecallConfig } from './games/pattern-recall.js';
import { seqMemConfig } from './games/seq-mem.js';

/* ─── Logic ─── */
import { matrixLogicConfig } from './games/matrix-logic.js';
import { syllogismsConfig } from './games/syllogisms.js';
import { deductionConfig } from './games/deduction.js';
import { argumentAnalyzerConfig } from './games/argument-analyzer.js';

/* ─── Language ─── */
import { lexicalDecisionConfig } from './games/lexical-decision.js';
import { vocabularyEliteConfig } from './games/vocabulary-elite.js';
import { verbalAnalogiesConfig } from './games/verbal-analogies.js';
import { wordScrambleConfig } from './games/word-scramble.js';

/* ─── Creativity ─── */
import { alternativeUsesConfig } from './games/alternative-uses.js';
import { creativeConnectConfig } from './games/creative-connect.js';
import { storySparkConfig } from './games/story-spark.js';
import { ideaFlowConfig } from './games/idea-flow.js';

/* ─── Emotional ─── */
import { microExpressionsConfig } from './games/micro-expressions.js';
import { toneDetectorConfig } from './games/tone-detector.js';
import { empathyEngineConfig } from './games/empathy-engine.js';
import { socialReadConfig } from './games/social-read.js';

/* ─── Problem Solving ─── */
import { hanoiConfig } from './games/hanoi.js';
import { riverCrossingConfig } from './games/river-crossing.js';
import { gearLogicConfig } from './games/gear-logic.js';
import { pathFinderConfig } from './games/path-finder.js';

/* ─── Master list ─── */
export const ALL_GAMES: GameConfig[] = [
  // Attention (4)
  flankerConfig, goNoGoConfig, taskSwitchingConfig, vigilanceConfig,
  // Spatial (4)
  mentalRotationConfig, corsiBlocksConfig, mapMemoryConfig, blockCounterConfig,
  // Speed (4)
  reactionConfig, colorMatchConfig, symbolSprintConfig, rapidFireConfig,
  // Memory (4)
  nBackConfig, faceMatchConfig, patternRecallConfig, seqMemConfig,
  // Logic (4)
  matrixLogicConfig, syllogismsConfig, deductionConfig, argumentAnalyzerConfig,
  // Language (4)
  lexicalDecisionConfig, vocabularyEliteConfig, verbalAnalogiesConfig, wordScrambleConfig,
  // Creativity (4)
  alternativeUsesConfig, creativeConnectConfig, storySparkConfig, ideaFlowConfig,
  // Emotional (4)
  microExpressionsConfig, toneDetectorConfig, empathyEngineConfig, socialReadConfig,
  // Problem (4)
  hanoiConfig, riverCrossingConfig, gearLogicConfig, pathFinderConfig,
];

/* ─── Fast lookup ─── */
const byId = new Map<string, GameConfig>();
for (const g of ALL_GAMES) byId.set(g.id, g);

export function getGame(id: string): GameConfig | undefined {
  return byId.get(id);
}

export function getAllGameIds(): string[] {
  return ALL_GAMES.map((g) => g.id);
}

export function getGamesByDomain(domain: DomainId): GameConfig[] {
  return ALL_GAMES.filter((g) => g.domain === domain);
}

export function getReadyGames(): GameConfig[] {
  return ALL_GAMES.filter((g) => g.status === 'ready');
}

/* ═══════════════════════════════════════════════════════════
   Validation
   ═══════════════════════════════════════════════════════════ */
export function validateConfig(game: GameConfig): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!game.id || !/^[a-z][a-z0-9-]*$/.test(game.id)) {
    errors.push('id must be a lowercase slug (got "' + game.id + '")');
  }
  if (!game.name.en || !game.name.ar) {
    errors.push('both name.en and name.ar are required');
  }
  if (!game.description.en || !game.description.ar) {
    errors.push('both description.en and description.ar are required');
  }
  if (!REQUIRED_DOMAINS.includes(game.domain)) {
    errors.push('unknown domain "' + game.domain + '"');
  }

  if (game.rt_floor_ms < 0) errors.push('rt_floor_ms must be >= 0');
  if (game.rt_ceiling_ms <= game.rt_floor_ms) errors.push('rt_ceiling_ms must be > rt_floor_ms');
  if (game.max_trials_per_session <= 0) errors.push('max_trials_per_session must be > 0');
  if (game.max_score <= 0) errors.push('max_score must be > 0');

  if (!/^\d+\.\d+\.\d+$/.test(game.game_version)) {
    errors.push('game_version must be semver (got "' + game.game_version + '")');
  }

  if (game.levels.length !== CLASSIC_LEVEL_COUNT) {
    errors.push('must have exactly ' + CLASSIC_LEVEL_COUNT + ' levels (got ' + game.levels.length + ')');
  } else {
    for (let i = 0; i < game.levels.length; i++) {
      const lvl = game.levels[i];
      if (!lvl) {
        errors.push('level at index ' + i + ' is missing');
        continue;
      }
      if (lvl.level !== i + 1) {
        errors.push('level numbering broken at index ' + i);
      }
      if (lvl.calibrated_difficulty < 0 || lvl.calibrated_difficulty > 1) {
        errors.push('level ' + lvl.level + ': calibrated_difficulty out of range [0,1]');
      }
      if (i > 0) {
        const prev = game.levels[i - 1];
        if (prev && lvl.calibrated_difficulty < prev.calibrated_difficulty) {
          warnings.push('level ' + lvl.level + ': difficulty decreased from level ' + prev.level);
        }
      }
    }
  }

  const weightKeys = Object.keys(game.domain_weights) as DomainId[];
  if (weightKeys.length === 0) {
    errors.push('at least one domain_weight required');
  }
  for (const k of weightKeys) {
    if (!REQUIRED_DOMAINS.includes(k)) {
      errors.push('domain_weight has unknown domain "' + k + '"');
    }
  }

  if (game.ai_prompt) {
    if (!game.ai_prompt.system) errors.push('ai_prompt.system is empty');
    if (!game.ai_prompt.build) errors.push('ai_prompt.build is not a function');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAll(): { game: string; result: ConfigValidation }[] {
  return ALL_GAMES.map((g) => ({ game: g.id, result: validateConfig(g) }));
}

export function findDuplicates(): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const g of ALL_GAMES) {
    if (seen.has(g.id)) dupes.push(g.id);
    seen.add(g.id);
  }
  return dupes;
}