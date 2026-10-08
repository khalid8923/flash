/* ═══════════════════════════════════════════════════════════
   Game Variants — Validators
   Strict validation of LLM-generated variant rules.
   Reject if schema or param spec violated.
   ═══════════════════════════════════════════════════════════ */

import {
  ALLOWED_AXES,
  AXIS_PARAM_SPECS,
  isValidAxis,
  type TrialPattern,
  type VariantAxis,
  type VariantRules,
} from './types.js';

export interface VariantValidation {
  ok: boolean;
  issues: string[];
  cleaned?: VariantRules;
}

/* ─── Single param check ─── */
function checkParam(
  name: string,
  value: unknown,
  spec: { type: string; min?: number; max?: number; enum?: string[] }
): string | null {
  if (spec.type === 'int') {
    if (typeof value !== 'number' || !Number.isInteger(value)) return `${name}: not an int`;
    if (spec.min !== undefined && value < spec.min) return `${name}: below min (${spec.min})`;
    if (spec.max !== undefined && value > spec.max) return `${name}: above max (${spec.max})`;
    return null;
  }
  if (spec.type === 'float') {
    if (typeof value !== 'number' || !isFinite(value)) return `${name}: not a number`;
    if (spec.min !== undefined && value < spec.min) return `${name}: below min (${spec.min})`;
    if (spec.max !== undefined && value > spec.max) return `${name}: above max (${spec.max})`;
    return null;
  }
  if (spec.type === 'bool') {
    if (typeof value !== 'boolean') return `${name}: not a boolean`;
    return null;
  }
  if (spec.type === 'string') {
    if (typeof value !== 'string' || value.length === 0) return `${name}: not a string`;
    return null;
  }
  if (spec.type === 'string_enum') {
    if (typeof value !== 'string' || !spec.enum?.includes(value)) {
      return `${name}: not in enum (${spec.enum?.join('|')})`;
    }
    return null;
  }
  return `${name}: unknown spec type`;
}

/* ─── Full rules validation ─── */
export function validateVariantRules(
  raw: unknown,
  trialPattern: TrialPattern
): VariantValidation {
  const issues: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, issues: ['not_an_object'] };
  }

  const obj = raw as Record<string, unknown>;

  /* ─── 1. Axis ─── */
  const axis = obj.axis;
  if (!isValidAxis(axis)) {
    issues.push(`invalid_axis: ${String(axis)}`);
    return { ok: false, issues };
  }

  const allowed = ALLOWED_AXES[trialPattern] ?? [];
  if (!allowed.includes(axis)) {
    issues.push(`axis_not_allowed_for_pattern: ${axis} / ${trialPattern}`);
    return { ok: false, issues };
  }

  /* ─── 2. Params ─── */
  const paramsRaw = obj.params;
  const params: Record<string, number | string | boolean> = {};
  const spec = AXIS_PARAM_SPECS[axis] ?? [];

  if (!paramsRaw || typeof paramsRaw !== 'object' || Array.isArray(paramsRaw)) {
    issues.push('params: not_an_object');
  } else {
    const paramObj = paramsRaw as Record<string, unknown>;
    for (const s of spec) {
      const v = paramObj[s.name];
      if (v === undefined || v === null) {
        issues.push(`param_missing: ${s.name}`);
        continue;
      }
      const err = checkParam(s.name, v, s);
      if (err) {
        issues.push(`param_invalid: ${err}`);
      } else {
        params[s.name] = v as number | string | boolean;
      }
    }
    /* Reject unknown params (strictness) */
    for (const key of Object.keys(paramObj)) {
      if (!spec.some((s) => s.name === key)) {
        issues.push(`param_unknown: ${key}`);
      }
    }
  }

  /* ─── 3. Instructions ─── */
  const inst = obj.instructions;
  let instructions: { en: string; ar: string } = { en: '', ar: '' };
  if (!inst || typeof inst !== 'object') {
    issues.push('instructions: not_an_object');
  } else {
    const i = inst as Record<string, unknown>;
    const en = typeof i.en === 'string' ? i.en.trim() : '';
    const ar = typeof i.ar === 'string' ? i.ar.trim() : '';
    if (en.length < 8 || en.length > 200) issues.push('instructions.en: bad_length');
    if (ar.length < 8 || ar.length > 200) issues.push('instructions.ar: bad_length');
    instructions = { en: en.slice(0, 200), ar: ar.slice(0, 200) };
  }

  /* ─── 4. Example trial (loose) ─── */
  const ex = obj.example_trial;
  let exampleTrial: VariantRules['example_trial'] = {
    index: 0,
    stimulus: {},
    response: {},
    rt_ms: null,
    correct: null,
    is_practice: false,
  };
  if (ex && typeof ex === 'object' && !Array.isArray(ex)) {
    const e = ex as Record<string, unknown>;
    exampleTrial = {
      index: typeof e.index === 'number' ? Math.max(0, Math.floor(e.index)) : 0,
      stimulus: (e.stimulus && typeof e.stimulus === 'object' && !Array.isArray(e.stimulus))
        ? (e.stimulus as Record<string, unknown>) : {},
      response: (e.response && typeof e.response === 'object' && !Array.isArray(e.response))
        ? (e.response as Record<string, unknown>) : {},
      rt_ms: typeof e.rt_ms === 'number' && e.rt_ms >= 0 ? Math.round(e.rt_ms) : null,
      correct: typeof e.correct === 'boolean' ? e.correct : null,
      is_practice: typeof e.is_practice === 'boolean' ? e.is_practice : false,
    };
  } else {
    issues.push('example_trial: missing_or_invalid');
  }

  /* ─── 5. Difficulty modifier ─── */
  const dmRaw = obj.difficulty_mod;
  let difficultyMod = 1.0;
  if (typeof dmRaw !== 'number' || !isFinite(dmRaw)) {
    issues.push('difficulty_mod: not_a_number');
  } else if (dmRaw < 0.7 || dmRaw > 1.5) {
    issues.push(`difficulty_mod: out_of_range (${dmRaw})`);
  } else {
    difficultyMod = Math.round(dmRaw * 100) / 100;
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const cleaned: VariantRules = {
    axis,
    parent_game: '', // filled by caller
    params,
    instructions,
    example_trial: exampleTrial,
    difficulty_mod: difficultyMod,
  };

  return { ok: true, issues: [], cleaned };
}

/* ─── Sanity: no L4 words in instructions ─── */
export function validateVariantText(instructions: { en: string; ar: string }): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const banned_en = /\b(ADHD|autism|depression|diagnos|disorder|medical|clinical|therap)\w*/i;
  const banned_ar = /(التوحد|الاكتئاب|اضطراب|تشخيص|علاج|طبي)/;

  if (banned_en.test(instructions.en)) issues.push('l4_en');
  if (banned_ar.test(instructions.ar)) issues.push('l4_ar');

  return { ok: issues.length === 0, issues };
}