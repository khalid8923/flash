/* ═══════════════════════════════════════════════════════════
   Difficulty Atlas — Lever definitions per game
   Defines: 15 levels, each with a difficulty vector
   Used by:  Session Planner, Adaptive Engine
   ═══════════════════════════════════════════════════════════ */

export interface LeverSet {
  sequence_length?: number;
  time_limit_ms?: number;
  distractor_count?: number;
  stimulus_similarity?: number;
  rule_complexity?: number;
  switching_rate?: number;
  novelty?: number;
  penalty?: 'soft' | 'medium' | 'hard';
  [key: string]: unknown;
}

export interface AtlasLevel {
  level: number;
  label: string;
  levers: LeverSet;
  calibrated_difficulty: number;
  domain_loadings: Record<string, number>;
}

export interface GameAtlas {
  game_id: string;
  mode: string;
  levels: AtlasLevel[];
}

/* ═══════════════════════════════════════════════════════════
   SEQ-MEM — Forward digit span (Miller 1956)
   Levers: sequence_length, time_limit_ms, distractor_count
   ═══════════════════════════════════════════════════════════ */
const SEQ_MEM: AtlasLevel[] = [
  { level: 1,  label: '3 digits',         levers: { sequence_length: 3,  time_limit_ms: 8000,  distractor_count: 0 }, calibrated_difficulty: 0.10, domain_loadings: { memory: 1.0 } },
  { level: 2,  label: '4 digits',         levers: { sequence_length: 4,  time_limit_ms: 8500,  distractor_count: 0 }, calibrated_difficulty: 0.18, domain_loadings: { memory: 1.0 } },
  { level: 3,  label: '5 digits',         levers: { sequence_length: 5,  time_limit_ms: 9000,  distractor_count: 0 }, calibrated_difficulty: 0.28, domain_loadings: { memory: 1.0 } },
  { level: 4,  label: '5 digits + tone',  levers: { sequence_length: 5,  time_limit_ms: 9500,  distractor_count: 1 }, calibrated_difficulty: 0.38, domain_loadings: { memory: 1.0, attention: 0.3 } },
  { level: 5,  label: '6 digits',         levers: { sequence_length: 6,  time_limit_ms: 10000, distractor_count: 0 }, calibrated_difficulty: 0.45, domain_loadings: { memory: 1.0 } },
  { level: 6,  label: '6 digits + tone',  levers: { sequence_length: 6,  time_limit_ms: 10500, distractor_count: 1 }, calibrated_difficulty: 0.55, domain_loadings: { memory: 1.0, attention: 0.4 } },
  { level: 7,  label: '7 digits',         levers: { sequence_length: 7,  time_limit_ms: 11000, distractor_count: 0 }, calibrated_difficulty: 0.62, domain_loadings: { memory: 1.0 } },
  { level: 8,  label: '7 digits + tone',  levers: { sequence_length: 7,  time_limit_ms: 11500, distractor_count: 1 }, calibrated_difficulty: 0.70, domain_loadings: { memory: 1.0, attention: 0.5 } },
  { level: 9,  label: '8 digits',         levers: { sequence_length: 8,  time_limit_ms: 12000, distractor_count: 0 }, calibrated_difficulty: 0.76, domain_loadings: { memory: 1.0 } },
  { level: 10, label: '8 digits + tone',  levers: { sequence_length: 8,  time_limit_ms: 12000, distractor_count: 2 }, calibrated_difficulty: 0.82, domain_loadings: { memory: 1.0, attention: 0.6 } },
  { level: 11, label: '9 digits',         levers: { sequence_length: 9,  time_limit_ms: 13000, distractor_count: 0 }, calibrated_difficulty: 0.87, domain_loadings: { memory: 1.0 } },
  { level: 12, label: '9 digits + tone',  levers: { sequence_length: 9,  time_limit_ms: 13000, distractor_count: 2 }, calibrated_difficulty: 0.91, domain_loadings: { memory: 1.0, attention: 0.7 } },
  { level: 13, label: '10 digits',        levers: { sequence_length: 10, time_limit_ms: 14000, distractor_count: 0 }, calibrated_difficulty: 0.94, domain_loadings: { memory: 1.0 } },
  { level: 14, label: '10 digits + tone', levers: { sequence_length: 10, time_limit_ms: 14000, distractor_count: 2 }, calibrated_difficulty: 0.96, domain_loadings: { memory: 1.0, attention: 0.8 } },
  { level: 15, label: '11 digits',        levers: { sequence_length: 11, time_limit_ms: 15000, distractor_count: 0 }, calibrated_difficulty: 0.99, domain_loadings: { memory: 1.0 } },
];

/* ═══════════════════════════════════════════════════════════
   REACTION — Simple reaction time
   Levers: time_limit_ms, penalty, distractor_count
   ═══════════════════════════════════════════════════════════ */
const REACTION: AtlasLevel[] = [
  { level: 1,  label: 'Simple, 3s window',   levers: { time_limit_ms: 3000, distractor_count: 0, penalty: 'soft' },   calibrated_difficulty: 0.10, domain_loadings: { speed: 1.0 } },
  { level: 2,  label: 'Simple, 2.5s',        levers: { time_limit_ms: 2500, distractor_count: 0, penalty: 'soft' },   calibrated_difficulty: 0.20, domain_loadings: { speed: 1.0 } },
  { level: 3,  label: 'Simple, 2s',          levers: { time_limit_ms: 2000, distractor_count: 0, penalty: 'soft' },   calibrated_difficulty: 0.30, domain_loadings: { speed: 1.0 } },
  { level: 4,  label: 'Simple, 1.8s',        levers: { time_limit_ms: 1800, distractor_count: 0, penalty: 'medium' }, calibrated_difficulty: 0.40, domain_loadings: { speed: 1.0 } },
  { level: 5,  label: 'Simple, 1.5s',        levers: { time_limit_ms: 1500, distractor_count: 0, penalty: 'medium' }, calibrated_difficulty: 0.48, domain_loadings: { speed: 1.0 } },
  { level: 6,  label: '1 distractor, 1.5s',  levers: { time_limit_ms: 1500, distractor_count: 1, penalty: 'medium' }, calibrated_difficulty: 0.55, domain_loadings: { speed: 1.0, attention: 0.4 } },
  { level: 7,  label: 'Simple, 1.2s',        levers: { time_limit_ms: 1200, distractor_count: 0, penalty: 'medium' }, calibrated_difficulty: 0.63, domain_loadings: { speed: 1.0 } },
  { level: 8,  label: '1 distractor, 1.2s',  levers: { time_limit_ms: 1200, distractor_count: 1, penalty: 'medium' }, calibrated_difficulty: 0.70, domain_loadings: { speed: 1.0, attention: 0.5 } },
  { level: 9,  label: 'Simple, 1s',          levers: { time_limit_ms: 1000, distractor_count: 0, penalty: 'hard' },   calibrated_difficulty: 0.77, domain_loadings: { speed: 1.0 } },
  { level: 10, label: '2 distractors, 1s',   levers: { time_limit_ms: 1000, distractor_count: 2, penalty: 'hard' },   calibrated_difficulty: 0.83, domain_loadings: { speed: 1.0, attention: 0.6 } },
  { level: 11, label: 'Simple, 0.9s',        levers: { time_limit_ms: 900,  distractor_count: 0, penalty: 'hard' },   calibrated_difficulty: 0.87, domain_loadings: { speed: 1.0 } },
  { level: 12, label: '2 distractors, 0.9s', levers: { time_limit_ms: 900,  distractor_count: 2, penalty: 'hard' },   calibrated_difficulty: 0.91, domain_loadings: { speed: 1.0, attention: 0.7 } },
  { level: 13, label: 'Simple, 0.8s',        levers: { time_limit_ms: 800,  distractor_count: 0, penalty: 'hard' },   calibrated_difficulty: 0.94, domain_loadings: { speed: 1.0 } },
  { level: 14, label: '2 distractors, 0.8s', levers: { time_limit_ms: 800,  distractor_count: 2, penalty: 'hard' },   calibrated_difficulty: 0.96, domain_loadings: { speed: 1.0, attention: 0.8 } },
  { level: 15, label: 'Simple, 0.7s',        levers: { time_limit_ms: 700,  distractor_count: 0, penalty: 'hard' },   calibrated_difficulty: 0.99, domain_loadings: { speed: 1.0 } },
];

/* ═══════════════════════════════════════════════════════════
   FLANKER — Eriksen flanker (conflict resolution)
   Levers: stimulus_similarity, time_limit_ms, switching_rate
   ═══════════════════════════════════════════════════════════ */
const FLANKER: AtlasLevel[] = [
  { level: 1,  label: 'Congruent only',      levers: { stimulus_similarity: 0.2, time_limit_ms: 2000, switching_rate: 0.0 }, calibrated_difficulty: 0.10, domain_loadings: { attention: 1.0 } },
  { level: 2,  label: 'Congruent, faster',   levers: { stimulus_similarity: 0.3, time_limit_ms: 1800, switching_rate: 0.0 }, calibrated_difficulty: 0.20, domain_loadings: { attention: 1.0 } },
  { level: 3,  label: '20% incongruent',     levers: { stimulus_similarity: 0.5, time_limit_ms: 1700, switching_rate: 0.2 }, calibrated_difficulty: 0.30, domain_loadings: { attention: 1.0, speed: 0.3 } },
  { level: 4,  label: '30% incongruent',     levers: { stimulus_similarity: 0.6, time_limit_ms: 1600, switching_rate: 0.3 }, calibrated_difficulty: 0.40, domain_loadings: { attention: 1.0, speed: 0.3 } },
  { level: 5,  label: '40% incongruent',     levers: { stimulus_similarity: 0.7, time_limit_ms: 1500, switching_rate: 0.4 }, calibrated_difficulty: 0.50, domain_loadings: { attention: 1.0, speed: 0.4 } },
  { level: 6,  label: '50% incongruent',     levers: { stimulus_similarity: 0.8, time_limit_ms: 1400, switching_rate: 0.5 }, calibrated_difficulty: 0.58, domain_loadings: { attention: 1.0, speed: 0.4 } },
  { level: 7,  label: '60% + faster',        levers: { stimulus_similarity: 0.8, time_limit_ms: 1300, switching_rate: 0.6 }, calibrated_difficulty: 0.65, domain_loadings: { attention: 1.0, speed: 0.5 } },
  { level: 8,  label: '70% + faster',        levers: { stimulus_similarity: 0.9, time_limit_ms: 1200, switching_rate: 0.7 }, calibrated_difficulty: 0.72, domain_loadings: { attention: 1.0, speed: 0.6 } },
  { level: 9,  label: '80% incongruent',     levers: { stimulus_similarity: 0.9, time_limit_ms: 1100, switching_rate: 0.8 }, calibrated_difficulty: 0.78, domain_loadings: { attention: 1.0, speed: 0.6 } },
  { level: 10, label: '80% + 1s window',     levers: { stimulus_similarity: 0.9, time_limit_ms: 1000, switching_rate: 0.8 }, calibrated_difficulty: 0.83, domain_loadings: { attention: 1.0, speed: 0.7 } },
  { level: 11, label: '90% incongruent',     levers: { stimulus_similarity: 1.0, time_limit_ms: 950,  switching_rate: 0.9 }, calibrated_difficulty: 0.87, domain_loadings: { attention: 1.0, speed: 0.7 } },
  { level: 12, label: '90% + 0.9s',          levers: { stimulus_similarity: 1.0, time_limit_ms: 900,  switching_rate: 0.9 }, calibrated_difficulty: 0.91, domain_loadings: { attention: 1.0, speed: 0.8 } },
  { level: 13, label: '95% incongruent',     levers: { stimulus_similarity: 1.0, time_limit_ms: 850,  switching_rate: 0.95 }, calibrated_difficulty: 0.94, domain_loadings: { attention: 1.0, speed: 0.8 } },
  { level: 14, label: '95% + 0.8s',          levers: { stimulus_similarity: 1.0, time_limit_ms: 800,  switching_rate: 0.95 }, calibrated_difficulty: 0.96, domain_loadings: { attention: 1.0, speed: 0.9 } },
  { level: 15, label: '100% + 0.7s',         levers: { stimulus_similarity: 1.0, time_limit_ms: 700,  switching_rate: 1.0 }, calibrated_difficulty: 0.99, domain_loadings: { attention: 1.0, speed: 1.0 } },
];

export const ATLAS: GameAtlas[] = [
  { game_id: 'seq-mem', mode: 'classic', levels: SEQ_MEM },
  { game_id: 'reaction', mode: 'classic', levels: REACTION },
  { game_id: 'flanker', mode: 'classic', levels: FLANKER },
];