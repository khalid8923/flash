/* ═══════════════════════════════════════════════════════════
   FLASH - Integrity Rules (R40 shadow mode)
   Evaluates sessions after ingestion.
   Writes flags to integrity_events. NO ENFORCEMENT yet.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

export interface RuleFlag {
  rule: string;
  severity: 'low' | 'medium' | 'high';
  detail: Record<string, unknown>;
}

const RT_FLOOR_MS = 100;

interface TrialInput {
  index: number;
  rt_ms: number | null;
  correct: boolean | null;
  is_practice: boolean;
  stimulus?: unknown;
  response?: unknown;
}

interface SessionContext {
  gameId: string;
  mode: string;
  durationMs: number;
  accuracy: number;
  medianRtMs: number;
  trials: TrialInput[];
}

export function evaluateSession(ctx: SessionContext): RuleFlag[] {
  const flags: RuleFlag[] = [];
  const valid = ctx.trials.filter((t) => !t.is_practice && t.rt_ms !== null);

  /* Rule 1: RT below floor on non-practice */
  const tooFast = valid.filter((t) => (t.rt_ms ?? 0) < RT_FLOOR_MS);
  if (tooFast.length > 0) {
    flags.push({
      rule: 'rt_too_fast',
      severity: 'high',
      detail: { count: tooFast.length, floor_ms: RT_FLOOR_MS },
    });
  }

  /* Rule 2: zero RT variance (all identical) — bot signature */
  if (valid.length >= 5) {
    const rts = valid.map((t) => t.rt_ms!);
    const allSame = rts.every((v) => v === rts[0]);
    if (allSame) {
      flags.push({
        rule: 'zero_rt_variance',
        severity: 'high',
        detail: { rt: rts[0], count: valid.length },
      });
    }
  }

  /* Rule 3: impossible accuracy — 100% + very fast median */
  if (ctx.accuracy >= 100 && ctx.medianRtMs > 0 && ctx.medianRtMs < 300 && valid.length >= 10) {
    flags.push({
      rule: 'impossible_accuracy_speed',
      severity: 'medium',
      detail: { accuracy: ctx.accuracy, median_rt_ms: ctx.medianRtMs, trials: valid.length },
    });
  }

  /* Rule 4: session too short for trial count */
  if (valid.length >= 10 && ctx.durationMs < 30_000) {
    flags.push({
      rule: 'velocity_burst',
      severity: 'medium',
      detail: { duration_ms: ctx.durationMs, trials: valid.length },
    });
  }

  return flags;
}

export async function logIntegrityEvent(params: {
  sessionId: string;
  userId: string;
  flag: RuleFlag;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO integrity_events (session_id, user_id, rule, severity, detail)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.sessionId, params.userId, params.flag.rule, params.flag.severity, JSON.stringify(params.flag.detail)]
    );
  } catch {
    /* silent */
  }
}