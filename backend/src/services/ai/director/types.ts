/* ═══════════════════════════════════════════════════════════
   Director Mode — Type Definitions
   AI manages a full cognitive training session end-to-end.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type RoundMode = 'warmup' | 'train' | 'challenge' | 'recovery';

/* ─── A single round in the script ─── */
export interface DirectorRound {
  round_number: number;      // 1, 2, 3, 4, 5
  game_id: string;
  game_name: string;
  domain_id: string;
  mode: RoundMode;
  target_level: number;
  estimated_minutes: number;
  reason: string;            // max 20 words
}

/* ─── The full script ─── */
export interface DirectorScript {
  version: 1;
  rounds: DirectorRound[];
  rationale: string;         // max 40 words
  estimated_minutes: number;
}

/* ─── Result of one round (client reports back) ─── */
export interface DirectorRoundResult {
  round_number: number;
  game_id: string;
  accuracy: number;          // 0-100
  median_rt_ms: number;
  level_reached: number;
  duration_ms: number;
  user_feedback?: string | null;  // optional: 'tired' | 'energized' | null
}

/* ─── A checkpoint = round result + AI decision ─── */
export interface DirectorCheckpoint extends DirectorRoundResult {
  created_at: string;
  decision: DirectorDecision | null;
}

/* ─── AI decision between rounds ─── */
export type DirectorAction = 'continue' | 'adjust' | 'end_early';

export interface DirectorDecision {
  action: DirectorAction;
  next_round: DirectorRound | null;
  reason: string;            // max 20 words
  nudge: string | null;      // max 12 words, optional in-game nudge
  session_progress: number;  // 0-1 estimate of session completion
}

/* ─── Full session state (DB row) ─── */
export interface DirectorSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  script: DirectorScript;
  checkpoints: DirectorCheckpoint[];
  final_state: 'active' | 'completed' | 'abandoned' | null;
}

/* ─── API Response shapes ─── */

export interface DirectorStartResponse {
  session_id: string;
  started_at: string;
  script: DirectorScript;
  first_round: DirectorRound;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
}

export interface DirectorCheckpointResponse {
  session_id: string;
  round_just_finished: number;
  decision: DirectorDecision;
  next_round: DirectorRound | null;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
}

export interface DirectorEndResponse {
  session_id: string;
  ended_at: string;
  duration_ms: number;
  total_rounds: number;
  completed_rounds: number;
  avg_accuracy: number;
  avg_median_rt_ms: number;
  final_script: string;      // narrative summary
  highlights: string[];      // 2-4 bullets
  next_recommendation: string;
  source: 'llm' | 'rule';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
}

/* ─── Context the decider needs ─── */
export interface DirectorContext {
  /* Player state */
  total_sessions: number;
  avg_accuracy_7d: number;
  days_since_last: number | null;
  top_strengths: string[];
  top_weaknesses: string[];
  evidence_tier: 'calibrating' | 'provisional' | 'established';
  /* This session so far */
  rounds_completed: number;
  rounds_planned: number;
  session_duration_ms: number;
  session_avg_accuracy: number;
  /* Round just finished */
  last_round_accuracy: number;
  last_round_rt_ms: number;
  consecutive_low_rounds: number;  // < 60% accuracy
}