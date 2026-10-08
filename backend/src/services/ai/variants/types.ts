/* ═══════════════════════════════════════════════════════════
   Game Variants — Types & Schema
   Strict contract: frontend applies these rules to base game.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

/* ─── 6 axes ─── */
export type VariantAxis =
  | 'rule_shift'
  | 'reverse'
  | 'speed'
  | 'multi_track'
  | 'hidden_cue'
  | 'dual_task';

/* ─── Trial pattern (matches GAME_CATALOG) ─── */
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

/* ─── Which axes make sense per trial pattern ─── */
export const ALLOWED_AXES: Record<TrialPattern, VariantAxis[]> = {
  multiple_choice:  ['rule_shift', 'hidden_cue', 'dual_task'],
  sequence_recall:  ['reverse', 'speed', 'dual_task'],
  spatial_click:    ['reverse', 'multi_track', 'speed'],
  simple_rt:        ['speed', 'dual_task', 'hidden_cue'],
  go_no_go:         ['rule_shift', 'reverse', 'dual_task'],
  task_switch:      ['rule_shift', 'speed', 'dual_task'],
  puzzle_move:      ['reverse', 'hidden_cue', 'multi_track'],
  memory_match:     ['reverse', 'speed', 'dual_task'],
  free_response:    ['speed', 'dual_task'],
  visual_search:    ['speed', 'hidden_cue', 'multi_track'],
  spatial_rotation: ['reverse', 'speed', 'dual_task'],
  remote_associate: ['hidden_cue', 'dual_task', 'speed'],
};

/* ─── Variant rules shape (frontend contract) ─── */
export interface VariantRules {
  axis: VariantAxis;
  parent_game: string;
  params: Record<string, number | string | boolean>;
  instructions: {
    en: string;
    ar: string;
  };
  example_trial: {
    index: number;
    stimulus: Record<string, unknown>;
    response: Record<string, unknown>;
    rt_ms: number | null;
    correct: boolean | null;
    is_practice: boolean;
  };
  difficulty_mod: number;   // 0.7 - 1.5
}

/* ─── Full record (DB row shape) ─── */
export interface GameVariant {
  id: string;
  parent_game_id: string;
  variant_id: string;
  title: string;
  description: string;
  rules: VariantRules;
  difficulty_mod: number;
  language: Lang;
  generated_at: string;
}

/* ─── API Response ─── */
export interface VariantGenerateResult {
  variant_id: string;
  parent_game_id: string;
  parent_game_name: string;
  title: string;
  description: string;
  rules: VariantRules;
  difficulty_mod: number;
  source: 'llm' | 'cache' | 'rule';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  validation?: { ok: boolean; issues: string[] };
}

/* ─── Param constraint per axis ─── */
export interface AxisParamSpec {
  name: string;
  type: 'int' | 'float' | 'string' | 'bool' | 'string_enum';
  min?: number;
  max?: number;
  enum?: string[];
  description: string;
}

export const AXIS_PARAM_SPECS: Record<VariantAxis, AxisParamSpec[]> = {
  rule_shift: [
    { name: 'switch_after_trials', type: 'int', min: 2, max: 10, description: 'تغيير القاعدة بعد كام trial' },
    { name: 'new_rule_kind', type: 'string_enum', enum: ['opposite', 'alternate', 'color_based', 'position_based', 'count_based'], description: 'نوع القاعدة الجديدة' },
  ],
  reverse: [
    { name: 'reverse_kind', type: 'string_enum', enum: ['stimulus', 'response', 'both'], description: 'نوع العكس' },
  ],
  speed: [
    { name: 'speed_factor', type: 'float', min: 1.2, max: 2.0, description: 'معامل التسريع (1.5 = أسرع 50%)' },
  ],
  multi_track: [
    { name: 'track_count', type: 'int', min: 2, max: 4, description: 'عدد المسارات' },
    { name: 'interleave_mode', type: 'string_enum', enum: ['alternate', 'random', 'parallel'], description: 'طريقة الدمج' },
  ],
  hidden_cue: [
    { name: 'cue_type', type: 'string_enum', enum: ['dot', 'tone', 'frame_color', 'corner_mark'], description: 'نوع الإشارة' },
    { name: 'cue_lead_ms', type: 'int', min: 100, max: 800, description: 'قبل الـ stimulus بكام مللي' },
  ],
  dual_task: [
    { name: 'secondary_task', type: 'string_enum', enum: ['count_taps', 'track_color', 'monitor_side', 'recall_digit'], description: 'المهمة الثانوية' },
    { name: 'secondary_weight', type: 'float', min: 0.2, max: 0.6, description: 'وزن المهمة الثانوية' },
  ],
};

/* ─── Constraints ─── */
export const MAX_VARIANTS_PER_GAME = 10;
export const VARIANT_CACHE_DAYS = 30;

/* ─── Helpers ─── */
export function isValidAxis(v: unknown): v is VariantAxis {
  return typeof v === 'string' && [
    'rule_shift', 'reverse', 'speed', 'multi_track', 'hidden_cue', 'dual_task',
  ].includes(v);
}

export function isAxisAllowedForPattern(axis: VariantAxis, pattern: TrialPattern): boolean {
  return (ALLOWED_AXES[pattern] ?? []).includes(axis);
}

/* ─── Human labels ─── */
export function axisLabel(axis: VariantAxis, lang: Lang): string {
  const map: Record<VariantAxis, { en: string; ar: string }> = {
    rule_shift:  { en: 'Rule Shift',   ar: 'تغيير القاعدة' },
    reverse:     { en: 'Reverse',      ar: 'عكس الاتجاه' },
    speed:       { en: 'Speed',        ar: 'تسريع' },
    multi_track: { en: 'Multi-Track',  ar: 'متعدد المسارات' },
    hidden_cue:  { en: 'Hidden Cue',   ar: 'إشارة خفية' },
    dual_task:   { en: 'Dual Task',    ar: 'مهمة مزدوجة' },
  };
  return map[axis][lang];
}