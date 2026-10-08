/* ═══════════════════════════════════════════════════════════
   FLASH - Ingestion Hardening (R07)
   Server-side plausibility checks BEFORE writing to DB.
   Reject impossible trials to protect norms + PB validity.
   ═══════════════════════════════════════════════════════════ */

export interface TrialInput {
  index: number;
  rt_ms: number | null;
  correct: boolean | null;
  is_practice: boolean;
  stimulus: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface ValidateOptions {
  gameId: string;
  mode: string;
  trials: TrialInput[];
  minDurationMs?: number;
}

export interface ValidateResult {
  ok: boolean;
  errors: string[];
  stats: {
    total: number;
    valid: number;
    practice: number;
    timeouts: number;
    fast: number;   // RT < floor
    slow: number;   // RT > ceiling
  };
}

const RT_FLOOR_MS = 100;         // Any RT below = implausible
const RT_CEILING_MS = 60_000;    // Any RT above = implausible
const MIN_VALID_TRIALS = 1;
const MAX_TRIALS_PER_SESSION = 500;

export function validateIngestion(opts: ValidateOptions): ValidateResult {
  const { trials, gameId, mode } = opts;
  const errors: string[] = [];

  /* ═══ Hard cap ═══ */
  if (!Array.isArray(trials)) {
    return err('trials_not_array', 0, 0);
  }
  if (trials.length > MAX_TRIALS_PER_SESSION) {
    errors.push(`too_many_trials:${trials.length}`);
  }
  if (trials.length < MIN_VALID_TRIALS) {
    errors.push('empty_trials');
  }

  /* ═══ Per-trial scan ═══ */
  let valid = 0;
  let practice = 0;
  let timeouts = 0;
  let fast = 0;
  let slow = 0;
  const indexes = new Set<number>();

  for (const t of trials) {
    if (typeof t.index !== 'number' || t.index < 0) {
      errors.push(`bad_index:${t.index}`);
      continue;
    }
    if (indexes.has(t.index)) {
      errors.push(`duplicate_index:${t.index}`);
    }
    indexes.add(t.index);

    if (t.is_practice) {
      practice++;
      continue;
    }
    if (t.rt_ms === null) {
      timeouts++;
      valid++;
      continue;
    }
    if (typeof t.rt_ms !== 'number' || t.rt_ms < 0) {
      errors.push(`bad_rt:${t.index}`);
      continue;
    }
    if (t.rt_ms < RT_FLOOR_MS) { fast++; errors.push(`rt_too_fast:${t.index}`); continue; }
    if (t.rt_ms > RT_CEILING_MS) { slow++; continue; }
    valid++;
  }

  /* ═══ Mode-specific rules ═══ */
  if (mode === 'classic' && valid === 0 && practice === 0) {
    errors.push('no_valid_trials_classic');
  }

  /* ═══ Cap errors — return first 5 only ═══ */
  const trimmedErrors = errors.slice(0, 5);
  const ok = trimmedErrors.filter((e) => !e.startsWith('rt_too_slow')).length === 0;

  return {
    ok,
    errors: trimmedErrors,
    stats: {
      total: trials.length,
      valid,
      practice,
      timeouts,
      fast,
      slow,
    },
  };

  function err(msg: string, _v: number, _t: number): ValidateResult {
    return { ok: false, errors: [msg], stats: { total: 0, valid: 0, practice: 0, timeouts: 0, fast: 0, slow: 0 } };
  }
}

/* ═══ Session duration check ═══ */
export function validateDuration(startedAt: string, endedAt: string): { ok: boolean; durationMs: number } {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return { ok: false, durationMs: 0 };
  const d = end - start;
  /* Between 5 seconds and 60 minutes */
  return { ok: d >= 5_000 && d <= 3_600_000, durationMs: d };
}