/* ═══════════════════════════════════════════════════════════
   Catalog — Game Config Schema
   Single source of truth for every game in FLASH.
   Add a game = add one file in ./games/
   ═══════════════════════════════════════════════════════════ */

/* ─── Domain IDs ─── */
export type DomainId =
  | 'attention'
  | 'spatial'
  | 'speed'
  | 'memory'
  | 'logic'
  | 'language'
  | 'creativity'
  | 'emotional'
  | 'problem';

/* ─── Trial patterns (from GAME_CATALOG) ─── */
export type TrialPattern =
  | 'multiple_choice'
  | 'sequence_recall'
  | 'spatial_click'
  | 'simple_rt'
  | 'go_no_go'
  | 'task_switch'
  | 'puzzle_move'
  | 'memory_match'
  | 'free_response'
  | 'visual_search'
  | 'spatial_rotation'
  | 'remote_associate';

/* ─── Game modes (5 across the platform) ─── */
export type GameMode = 'classic' | 'speed' | 'endless' | 'precision' | 'daily';

/* ─── Status flags ─── */
export type GameStatus = 'ready' | 'wip' | 'disabled';

/* ─── Difficulty level (one of 15) ─── */
export interface DifficultyLevel {
  level: number;                                    // 1-15
  label: string;                                    // short human label
  levers: Record<string, number | string | boolean>; // calibrated parameters
  calibrated_difficulty: number;                    // 0-1
}

/* ─── AI content-generation prompt (optional) ─── */
export interface AiPromptTemplate {
  /** System prompt — teaches the LLM the paradigm */
  system: string;
  /** Response schema name (for docs) */
  schema: string;
  /** User prompt builder — receives difficulty + exclude + lang */
  build: (params: { difficulty: number; exclude: string[]; lang: string }) => string;
}

/* ─── Main game config ─── */
export interface GameConfig {
  /* Metadata */
  id: string;                                       // unique slug (e.g. 'flanker')
  name: { en: string; ar: string };
  domain: DomainId;
  icon: string;                                     // emoji for dashboard
  description: { en: string; ar: string };

  /* Trial & scoring schema */
  trial_pattern: TrialPattern;
  primary_metric: string;
  metric_direction: 'higher' | 'lower';
  rt_floor_ms: number;
  rt_ceiling_ms: number;
  max_trials_per_session: number;
  min_duration_ms: number;
  max_duration_ms: number;
  max_score: number;
  trial_exclusion_rules: string[];

  /* Versioning */
  game_version: string;                             // semver
  scoring_version: number;                          // bump when metric formula changes
  status: GameStatus;

  /* Domain loading weights */
  domain_weights: Partial<Record<DomainId, number>>;

  /* Difficulty Atlas (15 levels — classic mode) */
  levels: DifficultyLevel[];

  /* AI content generation (optional — only for generative games) */
  ai_prompt?: AiPromptTemplate;

  /* Academic citation (documentation only) */
  citation?: string;

  /* Seed schema (documentation only — how seed drives stimuli) */
  seed_schema?: string;
}

/* ─── Validation helpers (used by sync) ─── */
export interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const REQUIRED_DOMAINS: DomainId[] = [
  'attention', 'spatial', 'speed', 'memory',
  'logic', 'language', 'creativity', 'emotional', 'problem',
];

export const CLASSIC_LEVEL_COUNT = 15;
export const MIN_LEVEL_DIFF = 0.05;   // min gap between consecutive levels
export const MAX_LEVEL_DIFF = 1.0;