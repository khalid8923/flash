/* FLASH — Difficulty Atlas v2 (36 games × 15 levels) */

export interface LeverSet {
  [key: string]: number | string | boolean;
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

function levels(cfg: {
  ids: string[];
  make: (i: number) => LeverSet;
  diffs: number[];
  loads: Record<string, number>;
}): AtlasLevel[] {
  return cfg.ids.map((id, i) => ({
    level: i + 1,
    label: id,
    levers: cfg.make(i + 1),
    calibrated_difficulty: cfg.diffs[i]!,
    domain_loadings: cfg.loads,
  }));
}

const D = [0.10,0.18,0.28,0.38,0.45,0.55,0.62,0.70,0.76,0.82,0.87,0.91,0.94,0.96,0.99];

/* ═══ ATTENTION ═══ */
const FLANKER = levels({
  ids: ['Congruent only','Faster cong.','20% incong.','30% incong.','40% incong.','50% incong.','60% + faster','70% + faster','80% incong.','80% + 1s','90% incong.','90% + 0.9s','95% incong.','95% + 0.8s','100% + 0.7s'],
  make: (n) => ({ congruent_ratio: Math.max(0.05, 1-(n-1)*0.075), time_limit_ms: Math.max(700, 2000-(n-1)*90), similarity: Math.min(1, 0.2+(n-1)*0.055) }),
  diffs: D, loads: { attention: 1.0, speed: 0.4 },
});
const GO_NO_GO = levels({
  ids: ['80% go, easy','75% go','70% go','65% go','60% go','58% go','56% go','54% go','52% go','50% go','48% go','46% go','44% go','42% go','40% go'],
  make: (n) => ({ go_ratio: Math.max(0.40, 0.80-(n-1)*0.028), rt_window_ms: Math.max(500, 1000-(n-1)*35), stimulus_similarity: Math.min(1, 0.2+(n-1)*0.055) }),
  diffs: D, loads: { attention: 1.0, speed: 0.3 },
});
const TASK_SWITCHING = levels({
  ids: ['Single rule','Slow 2-rule','20% switch','30% switch','40% switch','50% switch','60% switch','65% switch','70% switch','75% switch','80% switch','85% switch','90% switch','95% switch','All switch'],
  make: (n) => ({ switch_rate: Math.max(0, (n-1)*0.075), rule_complexity: Math.min(4, 1+Math.floor((n-1)/4)), time_per_trial_ms: Math.max(800, 2500-(n-1)*110) }),
  diffs: D, loads: { attention: 1.0, logic: 0.4 },
});
const VIGILANCE = levels({
  ids: ['30% target','28% target','25% target','22% target','20% target','18% target','16% target','15% target','14% target','13% target','12% target','11% target','10% target','9% target','8% target'],
  make: (n) => ({ target_rate: Math.max(0.08, 0.30-(n-1)*0.016), sequence_length: Math.min(80, 20+(n-1)*4), duration_ms: Math.min(300000, 30000+(n-1)*15000) }),
  diffs: D, loads: { attention: 1.0 },
});

/* ═══ SPATIAL ═══ */
const MENTAL_ROTATION = levels({
  ids: ['45° easy','60° easy','75° easy','90° easy','90° medium','105° medium','120° medium','135° medium','135° hard','150° hard','160° hard','170° hard','175° hard','178° hard','180° hard'],
  make: (n) => ({ angle_deg: Math.min(180, 45+(n-1)*9), shape_complexity: Math.min(5, 1+Math.floor((n-1)/3)), time_limit_ms: Math.max(3000, 12000-(n-1)*600) }),
  diffs: D, loads: { spatial: 1.0 },
});
const CORSI_BLOCKS = levels({
  ids: ['3 blocks','4 blocks','4 fast','5 blocks','5 fast','6 blocks','6 fast','7 blocks','7 fast','8 blocks','8 fast','9 blocks','9 fast','10 blocks','10 fast'],
  make: (n) => ({ sequence_length: Math.min(10, 3+Math.floor((n-1)*0.5)), show_duration_ms: Math.max(400, 800-Math.floor((n-1)*0.5)*60), gap_ms: Math.max(100, 250-(n-1)*10) }),
  diffs: D, loads: { memory: 0.8, spatial: 1.0 },
});
const MAP_MEMORY = levels({
  ids: ['4 landmarks','5 landmarks','6 landmarks','7 landmarks','8 landmarks','8 + delay','9 + delay','10 + delay','11 + delay','12 + delay','13 + delay','14 + delay','15 + delay','16 + delay','17 + delay'],
  make: (n) => ({ landmark_count: Math.min(17, 4+(n-1)), map_size: Math.min(10, 5+Math.floor((n-1)/3)), delay_ms: Math.min(8000, 1000+(n-1)*500) }),
  diffs: D, loads: { spatial: 1.0, memory: 0.7 },
});
const BLOCK_COUNTER = levels({
  ids: ['2 layers','2 layers fast','3 layers','3 layers fast','4 layers','4 layers fast','5 layers','5 layers fast','5 + hidden','6 + hidden','6 + tight','7 + tight','7 + very tight','8 + very tight','8 expert'],
  make: (n) => ({ layer_count: Math.min(8, 2+Math.floor((n-1)*0.5)), hidden_ratio: Math.min(0.6, (n-1)*0.04), time_limit_ms: Math.max(4000, 15000-(n-1)*800) }),
  diffs: D, loads: { spatial: 1.0, logic: 0.5 },
});

/* ═══ SPEED ═══ */
const REACTION = levels({
  ids: ['3s window','2.5s','2s','1.8s','1.5s','1.5s+dist','1.2s','1.2s+dist','1s','1s+dist','0.9s','0.9s+dist','0.8s','0.8s+dist','0.7s'],
  make: (n) => ({ rt_window_ms: Math.max(700, 3000-(n-1)*165), distractor_count: Math.floor((n-1)/4), penalty: n > 8 ? 'hard' : n > 4 ? 'medium' : 'soft' }),
  diffs: D, loads: { speed: 1.0 },
});
const COLOR_MATCH = levels({
  ids: ['80% congruent','70% congruent','60% congruent','55% congruent','50% congruent','48% congruent','46% congruent','44% congruent','42% congruent','40% congruent','35% congruent','30% congruent','25% congruent','20% congruent','15% congruent'],
  make: (n) => ({ congruent_ratio: Math.max(0.15, 0.80-(n-1)*0.046), color_similarity: Math.min(1, 0.2+(n-1)*0.055), time_limit_ms: Math.max(700, 2000-(n-1)*90) }),
  diffs: D, loads: { speed: 1.0, attention: 0.5 },
});
const SYMBOL_SPRINT = levels({
  ids: ['4 set','5 set','6 set','7 set','6 conj.','7 conj.','8 conj.','9 conj.','10 conj.','11 conj.','12 conj.','13 conj.','14 conj.','15 conj.','16 conj.'],
  make: (n) => ({ set_size: Math.min(16, 4+(n-1)), distractor_type: n <= 4 ? 'feature' : 'conjunction', time_limit_ms: Math.max(1000, 4000-(n-1)*200) }),
  diffs: D, loads: { speed: 1.0, attention: 0.6 },
});
const RAPID_FIRE = levels({
  ids: ['2 rules 30%','2 rules 35%','2 rules 40%','3 rules 40%','3 rules 45%','3 rules 50%','3 rules 55%','4 rules 55%','4 rules 60%','4 rules 65%','4 rules 70%','5 rules 70%','5 rules 75%','5 rules 80%','5 rules 85%'],
  make: (n) => ({ rule_count: Math.min(5, 2+Math.floor((n-1)/3)), switch_rate: Math.min(0.85, 0.30+(n-1)*0.04), time_per_trial_ms: Math.max(500, 2000-(n-1)*100) }),
  diffs: D, loads: { speed: 1.0, attention: 0.7 },
});

export const ATLAS_PART_1: GameAtlas[] = [
  { game_id: 'flanker',         mode: 'classic', levels: FLANKER },
  { game_id: 'go-no-go',        mode: 'classic', levels: GO_NO_GO },
  { game_id: 'task-switching',  mode: 'classic', levels: TASK_SWITCHING },
  { game_id: 'vigilance',       mode: 'classic', levels: VIGILANCE },
  { game_id: 'mental-rotation', mode: 'classic', levels: MENTAL_ROTATION },
  { game_id: 'corsi-blocks',    mode: 'classic', levels: CORSI_BLOCKS },
  { game_id: 'map-memory',      mode: 'classic', levels: MAP_MEMORY },
  { game_id: 'block-counter',   mode: 'classic', levels: BLOCK_COUNTER },
  { game_id: 'reaction',        mode: 'classic', levels: REACTION },
  { game_id: 'color-match',     mode: 'classic', levels: COLOR_MATCH },
  { game_id: 'symbol-sprint',   mode: 'classic', levels: SYMBOL_SPRINT },
  { game_id: 'rapid-fire',      mode: 'classic', levels: RAPID_FIRE },
];
/* ═══ MEMORY ═══ */
const N_BACK = levels({
  ids: ['1-back slow','1-back','1-back fast','2-back slow','2-back','2-back fast','2-back very fast','3-back slow','3-back','3-back fast','3-back very fast','4-back slow','4-back','4-back fast','4-back very fast'],
  make: (n) => ({ n_level: Math.min(4, 1+Math.floor((n-1)/3)), sequence_length: Math.min(30, 12+Math.floor((n-1)*1.5)), show_duration_ms: Math.max(300, 800-(n-1)*35) }),
  diffs: D, loads: { memory: 1.0, attention: 0.6 },
});
const FACE_MATCH = levels({
  ids: ['3 pairs','4 pairs','5 pairs','5 + delay','6 + delay','7 + delay','7 similar','8 similar','9 similar','10 similar','11 similar','12 similar','13 similar','14 similar','15 similar'],
  make: (n) => ({ pair_count: Math.min(15, 3+(n-1)*0.9), delay_ms: Math.min(6000, 500+(n-1)*400), similarity: Math.min(0.9, 0.2+(n-1)*0.05) }),
  diffs: D, loads: { memory: 1.0, emotional: 0.3 },
});
const PATTERN_RECALL = levels({
  ids: ['3 cells','4 cells','4 fast','5 cells','5 fast','6 cells','6 fast','7 cells','7 fast','7 reverse','8 reverse','8 rev fast','9 reverse','9 rev fast','10 rev fast'],
  make: (n) => ({ sequence_length: Math.min(10, 3+Math.floor((n-1)*0.5)), flash_duration_ms: Math.max(300, 700-(n-1)*30), recall_order: n >= 10 ? 'reverse' : 'forward' }),
  diffs: D, loads: { memory: 1.0, spatial: 0.7 },
});
const SEQ_MEM = levels({
  ids: ['3 digits','4 digits','5 digits','5 + tone','6 digits','6 + tone','7 digits','7 + tone','8 digits','8 + tone','9 digits','9 + tone','10 digits','10 + tone','11 digits'],
  make: (n) => ({ sequence_length: Math.min(11, 3+Math.floor((n-1)*0.6)), show_duration_ms: Math.max(500, 950-Math.floor((n-1)*0.5)*50), distractor_count: n % 2 === 0 ? 1 : 0 }),
  diffs: D, loads: { memory: 1.0 },
});

/* ═══ LOGIC ═══ */
const MATRIX_LOGIC = levels({
  ids: ['1 feature','1 fast','2 features','2 fast','2 + rot','3 features','3 fast','3 + rot','4 features','4 + rot','4 + complex','5 features','5 + rot','5 + complex','5 + all'],
  make: (n) => ({ feature_count: Math.min(5, 1+Math.floor((n-1)/3)), has_rotation: n >= 5, time_limit_ms: Math.max(10000, 30000-(n-1)*1400) }),
  diffs: D, loads: { logic: 1.0, spatial: 0.5 },
});
const SYLLOGISMS = levels({
  ids: ['1 prem easy','2 prem easy','2 premises','2 + subtle','2 + subtle fast','3 premises','3 + subtle','3 + subtle fast','3 very subtle','4 premises','4 + subtle','4 very subtle','4 v.subtle fast','5 premises','5 very subtle'],
  make: (n) => ({ premise_count: Math.min(5, 1+Math.floor((n-1)/2.5)), subtlety: Math.min(1, 0.2+(n-1)*0.055), time_limit_ms: Math.max(8000, 25000-(n-1)*1200) }),
  diffs: D, loads: { logic: 1.0, language: 0.4 },
});
const DEDUCTION = levels({
  ids: ['2 entities','3 entities','3 + indir','3 + 2 indir','4 entities','4 + indir','4 + 2 indir','5 entities','5 + indir','5 + 2 indir','5 very indir','6 + indir','6 very indir','7 very indir','8 expert'],
  make: (n) => ({ entity_count: Math.min(8, 2+Math.floor((n-1)*0.45)), premise_count: Math.min(7, 2+Math.floor((n-1)*0.4)), indirect_clues: Math.min(4, (n-1)*0.3) }),
  diffs: D, loads: { logic: 1.0 },
});
const ARGUMENT_ANALYZER = levels({
  ids: ['1 fallacy','2 fallacies','3 fallacies','3 + subtle','4 + subtle','4 subtle fast','5 + subtle','5 very subtle','6 very subtle','6 very sub fast','7 very subtle','8 expert','9 expert','10 expert','All fallacies'],
  make: (n) => ({ option_count: Math.min(6, 3+Math.floor((n-1)/4)), subtlety: Math.min(1, 0.15+(n-1)*0.06), time_limit_ms: Math.max(10000, 30000-(n-1)*1400) }),
  diffs: D, loads: { logic: 1.0, language: 0.3 },
});

/* ═══ LANGUAGE ═══ */
const LEXICAL_DECISION = levels({
  ids: ['Common','Slightly rare','Moderate','Mod. + prime','Mod. - prime','Rare','Rare + prime','Rare - prime','Rare 40% nw','Very rare','V rare + nw','V rare 40% nw','Expert','Expert 50% nw','Expert 50% v.rare'],
  make: (n) => ({ word_frequency: Math.max(0.1, 1.0-(n-1)*0.06), prime_strength: Math.max(0, 0.5-(n-1)*0.03), non_word_ratio: Math.min(0.5, (n-1)*0.04) }),
  diffs: D, loads: { language: 1.0, speed: 0.4 },
});
const VOCABULARY_ELITE = levels({
  ids: ['Easy','Easy faster','Easy + sim','Medium','Medium + sim','Medium subtle','Medium fast','Hard','Hard + sim','Hard + very sim','Hard fast','Very hard','V hard + sim','V hard fast','V hard + v.sim'],
  make: (n) => ({ word_rarity: Math.min(1, 0.1+(n-1)*0.06), distractor_similarity: Math.min(1, 0.2+(n-1)*0.055), time_limit_ms: Math.max(5000, 15000-(n-1)*700) }),
  diffs: D, loads: { language: 1.0 },
});
const VERBAL_ANALOGIES = levels({
  ids: ['Synonym','Antonym','Part-whole','Category','Function','Cause-effect','Degree','Producer','Location','Characteristic','Instrument','Worker','Abstract 1','Abstract 2','Abstract 3'],
  make: (n) => ({ relation_complexity: Math.min(5, 1+Math.floor((n-1)/3)), distractor_similarity: Math.min(1, 0.2+(n-1)*0.055), time_limit_ms: Math.max(6000, 20000-(n-1)*1000) }),
  diffs: D, loads: { language: 1.0, logic: 0.4 },
});
const WORD_SCRAMBLE = levels({
  ids: ['4L hint','5L hint','5L','6L','6 + time','7L','7 + time','8L','8 + time','9L','9 + time','9 v.rare','10 v.rare','11 v.rare','11 v.rare fast'],
  make: (n) => ({ word_length: Math.min(11, 4+Math.floor((n-1)*0.5)), hint_availability: n <= 2 ? 1 : n <= 6 ? 0.5 : 0, time_limit_ms: Math.max(15000, 60000-(n-1)*3000) }),
  diffs: D, loads: { language: 1.0 },
});

export const ATLAS_PART_2: GameAtlas[] = [
  { game_id: 'n-back',            mode: 'classic', levels: N_BACK },
  { game_id: 'face-match',        mode: 'classic', levels: FACE_MATCH },
  { game_id: 'pattern-recall',    mode: 'classic', levels: PATTERN_RECALL },
  { game_id: 'seq-mem',           mode: 'classic', levels: SEQ_MEM },
  { game_id: 'matrix-logic',      mode: 'classic', levels: MATRIX_LOGIC },
  { game_id: 'syllogisms',        mode: 'classic', levels: SYLLOGISMS },
  { game_id: 'deduction',         mode: 'classic', levels: DEDUCTION },
  { game_id: 'argument-analyzer', mode: 'classic', levels: ARGUMENT_ANALYZER },
  { game_id: 'lexical-decision',  mode: 'classic', levels: LEXICAL_DECISION },
  { game_id: 'vocabulary-elite',  mode: 'classic', levels: VOCABULARY_ELITE },
  { game_id: 'verbal-analogies',  mode: 'classic', levels: VERBAL_ANALOGIES },
  { game_id: 'word-scramble',     mode: 'classic', levels: WORD_SCRAMBLE },
];
/* ═══ CREATIVITY ═══ */
const ALTERNATIVE_USES = levels({
  ids: ['Brick','Newspaper','Spoon','Umbrella','Paperclip','Sock','Cup','Towel','Bottle','Hanger','Cloud','Silence','Mirror','Shadow','Regret'],
  make: (n) => ({ object_abstractness: Math.min(1, (n-1)*0.07), time_limit_seconds: Math.max(30, 90-(n-1)*4) }),
  diffs: D, loads: { creativity: 1.0 },
});
const CREATIVE_CONNECT = levels({
  ids: ['Obvious 1','Obvious 2','Obvious 3','Moderate 1','Moderate 2','Moderate 3','Mod fast','Distant 1','Distant 2','Distant 3','Distant fast','V distant 1','V distant 2','V distant 3','V dist fast'],
  make: (n) => ({ association_distance: Math.min(1, (n-1)*0.07), hint_availability: n <= 6 ? 1 : n <= 10 ? 0.5 : 0, time_limit_ms: Math.max(8000, 30000-(n-1)*1500) }),
  diffs: D, loads: { creativity: 1.0 },
});
const STORY_SPARK = levels({
  ids: ['Easy','Easy + 1','2 abstract','2 abs fast','3 abstract','3 + tight','4 abstract','4 + tight','4 v.tight','5 abstract','5 v.tight','5 all abs','5 v.abs','5 v.abs fast','Expert'],
  make: (n) => ({ word_abstractness: Math.min(1, (n-1)*0.07), time_limit_ms: Math.max(30000, 120000-(n-1)*6000) }),
  diffs: D, loads: { creativity: 1.0, language: 0.4 },
});
const IDEA_FLOW = levels({
  ids: ['Round things','Square things','Blue things','Kitchen items','Office items','Things to hold','Break things','Cannot touch','Change things','Repeat things','Abstract','Emotions','Philosophical','Time itself','Nothingness'],
  make: (n) => ({ category_abstractness: Math.min(1, (n-1)*0.07), time_limit_seconds: Math.max(30, 90-(n-1)*4) }),
  diffs: D, loads: { creativity: 1.0 },
});

/* ═══ EMOTIONAL ═══ */
const MICRO_EXPRESSIONS = levels({
  ids: ['Happy','Sad','Angry','Scared','Surprised','Disgusted','Mixed 2','Mixed 3','Subtle happy','Subtle sad','Subtle angry','Contempt','Nostalgia','Bittersweet','Mixed subtle'],
  make: (n) => ({ emotion_subtlety: Math.min(1, (n-1)*0.07), duration_ms: Math.max(100, 400-(n-1)*20), face_count: n >= 10 ? 2 : 1 }),
  diffs: D, loads: { emotional: 1.0, attention: 0.4 },
});
const TONE_DETECTOR = levels({
  ids: ['Obvious sarcasm','Obvious','Clear','Slight','Mixed','Slight mixed','Subtle 1','Subtle 2','Subtle 3','V subtle 1','V subtle 2','V subtle 3','Ambiguous 1','Ambiguous 2','Expert'],
  make: (n) => ({ tone_subtlety: Math.min(1, (n-1)*0.07), option_count: Math.min(6, 3+Math.floor((n-1)/4)), time_limit_ms: Math.max(8000, 25000-(n-1)*1200) }),
  diffs: D, loads: { emotional: 1.0, language: 0.4 },
});
const EMPATHY_ENGINE = levels({
  ids: ['Obvious','Clear','Clear fast','Moderate','Mod fast','Subtle','Subtle fast','Complex','Complex fast','Complex v.sub','V subtle','V subtle fast','Ambiguous','Amb fast','Expert'],
  make: (n) => ({ scenario_complexity: Math.min(5, 1+Math.floor((n-1)/3)), ambiguity: Math.min(1, (n-1)*0.07), time_limit_ms: Math.max(10000, 30000-(n-1)*1400) }),
  diffs: D, loads: { emotional: 1.0 },
});
const SOCIAL_READ = levels({
  ids: ['1 signal','2 signals','3 signals','3 + subtle','4 signals','4 + subtle','4 v.subtle','5 signals','5 + subtle','5 v.subtle','6 signals','6 + subtle','6 v.subtle','7 v.subtle','Expert'],
  make: (n) => ({ observation_count: Math.min(7, 1+Math.floor((n-1)*0.45)), complexity: Math.min(5, 1+Math.floor((n-1)/3)), time_limit_ms: Math.max(10000, 30000-(n-1)*1400) }),
  diffs: D, loads: { emotional: 1.0 },
});

/* ═══ PROBLEM ═══ */
const HANOI = levels({
  ids: ['3 disks','3 fast','4 disks','4 fast','4 + limit','5 disks','5 fast','5 + limit','6 disks','6 fast','6 + limit','7 disks','7 fast','7 + limit','7 expert'],
  make: (n) => ({ disk_count: Math.min(7, 3+Math.floor((n-1)*0.35)), move_limit: n % 3 === 0 ? Math.pow(2, Math.min(7, 3+Math.floor((n-1)*0.35))) - 1 : 0 }),
  diffs: D, loads: { problem: 1.0, logic: 0.6 },
});
const RIVER_CROSSING = levels({
  ids: ['W-G-C simple','Family simple','Family + 1','Missionaries 3','Missionaries + 1','Missionaries 4','Missionaries 5','Jealous husbands','Bridge + torch','Weight puzzle','Complex 1','Complex 2','Complex 3','Complex 4','Expert'],
  make: (n) => ({ entity_count: Math.min(8, 3+Math.floor((n-1)*0.4)), constraint_count: Math.min(6, 1+Math.floor((n-1)/3)), time_limit_ms: Math.max(30000, 180000-(n-1)*8000) }),
  diffs: D, loads: { problem: 1.0, logic: 0.7 },
});
const GEAR_LOGIC = levels({
  ids: ['2 gears','3 gears','3 fast','4 gears','4 fast','5 gears','5 fast','6 gears','6 fast','7 gears','7 fast','8 gears','8 fast','9 gears','9 expert'],
  make: (n) => ({ gear_count: Math.min(9, 2+(n-1)*0.5), time_limit_ms: Math.max(3000, 12000-(n-1)*600) }),
  diffs: D, loads: { problem: 1.0, spatial: 0.6 },
});
const PATH_FINDER = levels({
  ids: ['3x3 easy','4x4 easy','5x5','5x5 walls','6x6 walls','7x7 walls','8x8','8x8 walls','9x9','9x9 walls','10x10','10x10 walls','12x12','14x14','15x15 walls'],
  make: (n) => ({ maze_size: Math.min(15, 3+Math.floor((n-1)*0.85)), wall_density: Math.min(0.5, (n-1)*0.033), time_limit_ms: Math.max(20000, 90000-(n-1)*4500) }),
  diffs: D, loads: { problem: 1.0, spatial: 0.7 },
});

export const ATLAS_PART_3: GameAtlas[] = [
  { game_id: 'alternative-uses', mode: 'classic', levels: ALTERNATIVE_USES },
  { game_id: 'creative-connect', mode: 'classic', levels: CREATIVE_CONNECT },
  { game_id: 'story-spark',      mode: 'classic', levels: STORY_SPARK },
  { game_id: 'idea-flow',        mode: 'classic', levels: IDEA_FLOW },
  { game_id: 'micro-expressions', mode: 'classic', levels: MICRO_EXPRESSIONS },
  { game_id: 'tone-detector',    mode: 'classic', levels: TONE_DETECTOR },
  { game_id: 'empathy-engine',   mode: 'classic', levels: EMPATHY_ENGINE },
  { game_id: 'social-read',      mode: 'classic', levels: SOCIAL_READ },
  { game_id: 'hanoi',            mode: 'classic', levels: HANOI },
  { game_id: 'river-crossing',   mode: 'classic', levels: RIVER_CROSSING },
  { game_id: 'gear-logic',       mode: 'classic', levels: GEAR_LOGIC },
  { game_id: 'path-finder',      mode: 'classic', levels: PATH_FINDER },
];

/* ═══ FINAL EXPORT ═══ */
export const ATLAS: GameAtlas[] = [
  ...ATLAS_PART_1,
  ...ATLAS_PART_2,
  ...ATLAS_PART_3,
];