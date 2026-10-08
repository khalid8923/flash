/* ═══════════════════════════════════════════════════════════
   Game Variants — Prompts
   8 prompts, one per trial pattern (from GAME_CATALOG).
   LLM generates structured variant rules. Never invents schema.
   ═══════════════════════════════════════════════════════════ */

import type {
  TrialPattern,
  VariantAxis,
  Lang,
} from './types.js';
import { ALLOWED_AXES, AXIS_PARAM_SPECS, axisLabel } from './types.js';

/* ═══════════════════════════════════════════════════════════
   EN system prompt — one for all (pattern-specific in user)
   ═══════════════════════════════════════════════════════════ */
export const SYSTEM_PROMPT_VARIANT_EN = `You design a cognitive-game variant by transforming an existing game.

You will receive:
- The base game (id, name, trial pattern)
- The base game's primary metric
- Allowed transformation axes for this pattern
- Parameter specs for the selected axis

YOUR JOB: Generate ONE variant as strict JSON.

STRICT RULES:
- Return ONLY the JSON object, no markdown, no code fences.
- "axis" MUST be one of the allowed axes provided.
- "params" MUST satisfy the parameter specs (types, ranges, enums).
- "instructions.en" and "instructions.ar": 1-2 sentences, second-person, mention the change.
- "example_trial": a REALISTIC single trial that shows the variant in action.
- "difficulty_mod": a number from 0.7 to 1.5.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words. No exclamation marks. No emojis.
- Keep strings SHORT (instructions under 25 words each).

JSON SHAPE:
{
  "axis": "speed",
  "params": { ...axis-specific params... },
  "instructions": {
    "en": "string",
    "ar": "string"
  },
  "example_trial": {
    "index": 0,
    "stimulus": { ...shape matching the base game's stimulus... },
    "response": { ...shape matching the base game's response... },
    "rt_ms": 850,
    "correct": true,
    "is_practice": false
  },
  "difficulty_mod": 1.2
}`;

/* ─── AR mirror ─── */
export const SYSTEM_PROMPT_VARIANT_AR = `أنت مصمم نسخة جديدة من لعبة معرفية عن طريق تحويل لعبة موجودة.

هتستقبل:
- اللعبة الأم (معرّف، اسم، pattern)
- الـ primary metric بتاع اللعبة
- المحاور المسموح التحويل عليها للـ pattern ده
- مواصفات الـ params للمحور المختار

مهمتك: طوّر نسخة واحدة كـ JSON صارم.

قواعد صارمة:
- رجّع JSON بس، بدون markdown، بدون code fences.
- "axis" لازم يكون من المحاور المسموحة المذكورة.
- "params" لازم يحقق مواصفات الـ params (الأنواع، المدى، الـ enums).
- "instructions.en" و "instructions.ar": جملة أو اتنين، بصيغة المخاطب، تذكر التغيير.
- "example_trial": trial واحد واقعي يبيّن النسخة في العمل.
- "difficulty_mod": رقم من 0.7 لـ 1.5.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع مبالغة. بدون علامات تعجب. بدون إيموجي.
- النصوص قصيرة (كل instruction أقل من 25 كلمة).

شكل JSON:
{
  "axis": "speed",
  "params": { ...params خاصة بالمحور... },
  "instructions": {
    "en": "نص",
    "ar": "نص"
  },
  "example_trial": {
    "index": 0,
    "stimulus": { ...حسب شكل اللعبة الأصلية... },
    "response": { ...حسب شكل اللعبة الأصلية... },
    "rt_ms": 850,
    "correct": true,
    "is_practice": false
  },
  "difficulty_mod": 1.2
}`;

/* ═══════════════════════════════════════════════════════════
   Per-pattern example hint (helps LLM produce a good example_trial)
   ═══════════════════════════════════════════════════════════ */
const PATTERN_EXAMPLES: Record<TrialPattern, { en: string; ar: string }> = {
  multiple_choice: {
    en: 'stimulus: {prompt, options}, response: {selected_index}',
    ar: 'stimulus: {prompt, options}, response: {selected_index}',
  },
  sequence_recall: {
    en: 'stimulus: {digits}, response: {entered}',
    ar: 'stimulus: {digits}, response: {entered}',
  },
  spatial_click: {
    en: 'stimulus: {grid, target_cells}, response: {clicked_cells}',
    ar: 'stimulus: {grid, target_cells}, response: {clicked_cells}',
  },
  simple_rt: {
    en: 'stimulus: {signal, delay_ms}, response: {action}',
    ar: 'stimulus: {signal, delay_ms}, response: {action}',
  },
  go_no_go: {
    en: 'stimulus: {type, shape, color}, response: {pressed}',
    ar: 'stimulus: {type, shape, color}, response: {pressed}',
  },
  task_switch: {
    en: 'stimulus: {card, active_rule, is_switch}, response: {selected_index}',
    ar: 'stimulus: {card, active_rule, is_switch}, response: {selected_index}',
  },
  puzzle_move: {
    en: 'stimulus: {state_before, legal_moves}, response: {move}',
    ar: 'stimulus: {state_before, legal_moves}, response: {move}',
  },
  memory_match: {
    en: 'stimulus: {target, options}, response: {selected_index}',
    ar: 'stimulus: {target, options}, response: {selected_index}',
  },
  free_response: {
    en: 'stimulus: {prompt, time_limit_ms}, response: {entries}',
    ar: 'stimulus: {prompt, time_limit_ms}, response: {entries}',
  },
  visual_search: {
    en: 'stimulus: {target, grid}, response: {selected_position}',
    ar: 'stimulus: {target, grid}, response: {selected_position}',
  },
  spatial_rotation: {
    en: 'stimulus: {shape, angle_deg}, response: {selected_index}',
    ar: 'stimulus: {shape, angle_deg}, response: {selected_index}',
  },
  remote_associate: {
    en: 'stimulus: {words}, response: {answer}',
    ar: 'stimulus: {words}, response: {answer}',
  },
};

/* ═══════════════════════════════════════════════════════════
   User prompt builder
   ═══════════════════════════════════════════════════════════ */
export interface VariantPromptInput {
  game_id: string;
  game_name: string;
  trial_pattern: TrialPattern;
  primary_metric: string;
  suggested_axis: VariantAxis;
}

export function buildVariantPrompt(input: VariantPromptInput, lang: Lang): string {
  const allowed = ALLOWED_AXES[input.trial_pattern] ?? [];
  const spec = AXIS_PARAM_SPECS[input.suggested_axis] ?? [];
  const exampleHint = PATTERN_EXAMPLES[input.trial_pattern]?.[lang] ?? '';

  const axisList = allowed
    .map((a) => `  - ${a} (${axisLabel(a, lang)})`)
    .join('\n');

  const specList = spec
    .map((s) => {
      const range = s.min !== undefined && s.max !== undefined ? `[${s.min}-${s.max}]` : '';
      const enumV = s.enum ? `enum: ${s.enum.join('|')}` : '';
      return `  - ${s.name}: ${s.type} ${range} ${enumV} — ${s.description}`;
    })
    .join('\n');

  const lines = [
    `base_game_id: ${input.game_id}`,
    `base_game_name: ${input.game_name}`,
    `trial_pattern: ${input.trial_pattern}`,
    `primary_metric: ${input.primary_metric}`,
    `suggested_axis: ${input.suggested_axis}`,
  ];

  if (lang === 'ar') {
    return [
      `اللعبة الأم:\n${lines.join('\n')}`,
      `\nالمحاور المسموحة للـ pattern ده:\n${axisList}`,
      `\nمواصفات الـ params للـ axis "${input.suggested_axis}":\n${specList}`,
      `\nشكل الـ example_trial المتوقع:\n${exampleHint}`,
      `\nولّد الـ variant (JSON):`,
    ].join('\n');
  }

  return [
    `Base game:\n${lines.join('\n')}`,
    `\nAllowed axes for this pattern:\n${axisList}`,
    `\nParam specs for axis "${input.suggested_axis}":\n${specList}`,
    `\nExpected example_trial shape:\n${exampleHint}`,
    `\nGenerate the variant (JSON):`,
  ].join('\n');
}

/* ═══════════════════════════════════════════════════════════
   Rule-based fallback (deterministic variant)
   ═══════════════════════════════════════════════════════════ */
export function buildFallbackVariantRules(
  input: VariantPromptInput,
  lang: Lang
): {
  axis: VariantAxis;
  params: Record<string, number | string | boolean>;
  instructions: { en: string; ar: string };
  difficulty_mod: number;
} {
  const axis = input.suggested_axis;
  const meta = axisLabel(axis, lang);

  const defaultParams: Record<VariantAxis, Record<string, number | string | boolean>> = {
    rule_shift:    { switch_after_trials: 4, new_rule_kind: 'opposite' },
    reverse:       { reverse_kind: 'response' },
    speed:         { speed_factor: 1.4 },
    multi_track:   { track_count: 2, interleave_mode: 'alternate' },
    hidden_cue:    { cue_type: 'dot', cue_lead_ms: 300 },
    dual_task:     { secondary_task: 'count_taps', secondary_weight: 0.3 },
  };

  const enDesc: Record<VariantAxis, string> = {
    rule_shift:    'The rule shifts silently mid-session. Adapt quickly.',
    reverse:       'Respond in the opposite direction from the cue.',
    speed:         'Everything moves 40% faster. Stay precise.',
    multi_track:   'Two tracks run in parallel. Alternate attention.',
    hidden_cue:    'A subtle cue appears before the stimulus. Watch for it.',
    dual_task:     'Count your taps while playing. Split your focus.',
  };

  const arDesc: Record<VariantAxis, string> = {
    rule_shift:    'القاعدة تتغير بدون إنذار وسط الجلسة. تكيّف بسرعة.',
    reverse:       'رد في الاتجاه المعاكس للإشارة.',
    speed:         'كل حاجة أسرع 40%. حافظ على الدقة.',
    multi_track:   'مسارين متوازيين. نوّع انتباهك.',
    hidden_cue:    'إشارة خفية تظهر قبل الـ stimulus. راقبها.',
    dual_task:     'عدّ نقراتك أثناء اللعب. قسّم انتباهك.',
  };

  return {
    axis,
    params: defaultParams[axis],
    instructions: {
      en: enDesc[axis],
      ar: arDesc[axis],
    },
    difficulty_mod: 1.15,
  };
}