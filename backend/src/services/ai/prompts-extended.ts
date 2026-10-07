/* ═══════════════════════════════════════════════════════════
   FLASH AI — Complete Prompt Templates
   All 36 games supported
   ═══════════════════════════════════════════════════════════ */

import type { PromptTemplate } from './prompts-base.js';

const SAFETY_RULES = `
RULES:
- Return ONLY valid JSON matching the schema. No markdown, no explanations.
- All text must be in the requested language (en or ar).
- Never repeat content from the EXCLUDE list.
- Content must be scientifically valid for the game's paradigm.
- Difficulty is on a scale 1-10 (1=easiest, 10=hardest).
- Keep each string value SHORT (under 20 words) to avoid token overflow.
`;

export const EXTENDED_PROMPTS: Record<string, PromptTemplate> = {

  /* ═══════════════════ LOGIC ═══════════════════ */
  'deduction': {
    system: `You are a logic puzzle designer (Evans 2008). Return ONLY a JSON object with keys: scenario, premises, question, options, correct_index, explanation.${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE short deduction puzzle.
Difficulty: ${difficulty}/10 | Language: ${lang}

EXACT JSON:
{"scenario":"...","premises":["...","...","..."],"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}

Keep scenario ≤ 20 words. premises 3-5 items ≤ 15 words each.`,
    schema: 'Deduction',
  },

  /* ═══════════════════ LANGUAGE ═══════════════════ */
  'word-scramble': {
    system: `You are a vocabulary puzzle designer (lexical access).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE word scramble. JSON keys: word, scrambled, hint, category, letter_count.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Difficulty: 1-3 → 4-5 letters | 4-7 → 6-7 letters | 8-10 → 8-10 letters.
JSON: {"word":"...","scrambled":"...","hint":"...","category":"animal|object|nature|abstract|place","letter_count":8}`,
    schema: 'WordScramble',
  },

  'lexical-decision': {
    system: `You are a psycholinguist generating lexical decision items (Meyer 1971).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE lexical decision trial. JSON keys: prime, target, is_word, relation, expected_priming.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
If is_word=false, target must be a plausible pseudoword.
JSON: {"prime":"doctor","target":"nurse","is_word":true,"relation":"semantic-related|semantic-unrelated|unrelated","expected_priming":45}`,
    schema: 'LexicalDecision',
  },

  /* ═══════════════════ CREATIVITY ═══════════════════ */
  'creative-connect': {
    system: `You are a Remote Associates Test designer (Mednick 1962).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE remote associates puzzle. JSON keys: words, answer, compound_examples, hint.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
All 3 words must combine with the answer.
JSON: {"words":["cottage","swiss","cake"],"answer":"cheese","compound_examples":["cottage cheese","swiss cheese","cheesecake"],"hint":"Think of dairy"}`,
    schema: 'CreativeConnect',
  },

  'idea-flow': {
    system: `You are an ideational fluency expert (Guilford).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE category for idea generation. JSON keys: category, time_limit_seconds, sample_ideas, success_criteria.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Difficulty: 1-3 → broad | 4-7 → specific | 8-10 → abstract.
JSON: {"category":"...","time_limit_seconds":60,"sample_ideas":["...","...","..."],"success_criteria":"12+ valid ideas"}`,
    schema: 'IdeaFlow',
  },

  'story-spark': {
    system: `You are a creative writing instructor (Amabile 1982).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE story prompt. JSON keys: words, opening_type, opening, constraint.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
words: 3 unexpected evocative words. opening_type: character|setting|dialogue|action.
JSON: {"words":["lighthouse","whisper","midnight"],"opening_type":"setting","opening":"...","constraint":"under 100 words"}`,
    schema: 'StorySpark',
  },

  'alternative-uses': {
    system: `You are a creativity researcher generating Alternative Uses items (Guilford 1967).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE object for the Alternative Uses task. JSON keys: object, category, time_limit_seconds, sample_uses.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Difficulty: 1-3 → common | 4-7 → less obvious | 8-10 → abstract.
JSON: {"object":"brick","category":"household|nature|tool|toy|clothing|food","time_limit_seconds":60,"sample_uses":["example1","example2","example3"]}`,
    schema: 'AlternativeUses',
  },

  /* ═══════════════════ EMOTIONAL ═══════════════════ */
  'tone-detector': {
    system: `You are a social cognition designer (MSCEIT).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE tone detection scenario. JSON keys: context, message, options, correct_index, explanation.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"context":"...","message":"...","options":["sarcastic","apologetic","enthusiastic","concerned"],"correct_index":0,"explanation":"..."}`,
    schema: 'ToneDetector',
  },

  'micro-expressions': {
    system: `You are an emotion recognition designer (Ekman 1969).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE micro-expression scenario. JSON keys: scenario, facial_cues, duration_ms, options, correct_index, explanation.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"scenario":"...","facial_cues":["...","..."],"duration_ms":250,"options":["surprised","afraid","angry","happy"],"correct_index":0,"explanation":"..."}`,
    schema: 'MicroExpressions',
  },

  'empathy-engine': {
    system: `You are an empathic accuracy designer (Ickes 1993).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE empathy scenario. JSON keys: situation, their_words, options, correct_index, explanation.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"situation":"...","their_words":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}`,
    schema: 'EmpathyEngine',
  },

  'social-read': {
    system: `You are a group dynamics expert (Burgoon 1994).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE group social-read scenario. JSON keys: setting, observations, question, options, correct_index, explanation.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
observations: 3 short strings.
JSON: {"setting":"...","observations":["...","...","..."],"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}`,
    schema: 'SocialRead',
  },

  /* ═══════════════════ ATTENTION ═══════════════════ */
  'go-no-go': {
    system: `You are a response inhibition designer (Drewe 1975).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE go/no-go sequence. JSON keys: stimuli, go_ratio, instruction.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
stimuli: 8-12 items.
JSON: {"stimuli":[{"shape":"circle","color":"green","type":"go","rt_window_ms":800}],"go_ratio":0.75,"instruction":"Press only for circles"}`,
    schema: 'GoNoGo',
  },

  'vigilance': {
    system: `You are a sustained-attention task designer (Rosvold 1956 — CPT-X).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE vigilance sequence. JSON keys: sequence, target, duration_ms, instruction.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
sequence: 15-25 single letters. Target appears ~15%.
JSON: {"sequence":["A","B","X","C","D"],"target":"X","duration_ms":30000,"instruction":"Click when you see X"}`,
    schema: 'Vigilance',
  },

  'task-switching': {
    system: `You are a task-switching designer (Monsell 2003).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE task-switching sequence. JSON keys: trials, rule_change_after.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
trials: 6-10 items.
JSON: {"trials":[{"card":{"color":"red","shape":"circle"},"rule":"color","is_switch":false,"options":["red","blue","green","yellow"],"correct_index":0}],"rule_change_after":4}`,
    schema: 'TaskSwitching',
  },

  'color-match': {
    system: `You are a Stroop effect designer (Stroop 1935).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE Stroop sequence. JSON keys: trials, instruction.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
trials: 8-12 items.
JSON: {"trials":[{"word":"RED","ink_color":"blue","congruent":false,"options":["red","blue","green","yellow"],"correct_index":1}],"instruction":"Pick the INK color, not the word"}`,
    schema: 'ColorMatch',
  },

  'symbol-sprint': {
    system: `You are a visual search designer (Treisman 1980).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE visual search trial. JSON keys: target, grid, target_position, set_size, distractor_type.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
distractor_type: "feature" (easy) | "conjunction" (harder).
JSON: {"target":"▲","grid":[["●","▲"],["◆","●"]],"target_position":[0,1],"set_size":4,"distractor_type":"feature"}`,
    schema: 'SymbolSprint',
  },

  'rapid-fire': {
    system: `You are a rapid task-switching designer (Monsell 2003).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE rapid-fire sequence. JSON keys: sequence, time_per_trial_ms, switch_rate.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
sequence: 6-10 items.
JSON: {"sequence":[{"task":"color","stimulus":"red square","answer":"red","options":["red","blue","green","yellow"],"correct_index":0}],"time_per_trial_ms":1500,"switch_rate":0.5}`,
    schema: 'RapidFire',
  },

  'flanker': {
    system: `You are a conflict-resolution designer (Eriksen 1974).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE flanker trial. JSON keys: target_arrow, flankers, congruent, correct_answer, rt_window_ms.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
congruent: true (flankers same as target) | false (opposite).
Difficulty: 1-3 → 80% congruent | 4-7 → 50% | 8-10 → 80% incongruent.
JSON: {"target_arrow":"<","flankers":"<<<<<","congruent":true,"correct_answer":"left","rt_window_ms":1500}`,
    schema: 'Flanker',
  },

  /* ═══════════════════ SPEED ═══════════════════ */
  'reaction': {
    system: `You are a reaction-time task designer.${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE reaction-time trial. JSON keys: signal_color, delay_ms, rt_window_ms, instruction.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Difficulty: 1-3 → 800ms window | 4-7 → 500ms | 8-10 → 300ms.
JSON: {"signal_color":"#00FF00","delay_ms":2000,"rt_window_ms":800,"instruction":"Click as fast as you can when green"}`,
    schema: 'Reaction',
  },

  /* ═══════════════════ SPATIAL ═══════════════════ */
  'corsi-blocks': {
    system: `You are a visuospatial span designer (Corsi 1972).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE corsi-block sequence. JSON keys: grid_size, sequence, show_duration_ms, gap_ms.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
grid_size: 9 (3x3). sequence: positions 0-8.
JSON: {"grid_size":9,"sequence":[3,7,1,5],"show_duration_ms":800,"gap_ms":200}`,
    schema: 'CorsiBlocks',
  },

  'map-memory': {
    system: `You are a topographical memory designer (Postma 1996).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE map memory scenario. JSON keys: map_size, landmarks, question, options, correct_index.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"map_size":[5,5],"landmarks":[{"name":"bank","position":[1,3]}],"question":"Where was the bank?","options":[[1,3],[2,4],[3,1],[4,2]],"correct_index":0}`,
    schema: 'MapMemory',
  },

  'block-counter': {
    system: `You are a hidden-block counting designer (KABC).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE block-counting puzzle. JSON keys: layers, total_blocks, options, correct_index.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"layers":[[[1,1,0],[1,1,0],[0,0,0]]],"total_blocks":4,"options":[3,4,5,6],"correct_index":1}`,
    schema: 'BlockCounter',
  },

  'mental-rotation': {
    system: `You are a mental rotation designer (Shepard 1971).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE mental rotation item. JSON keys: shape_description, is_same, angle_deg, options, correct_index.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
JSON: {"shape_description":"L-tetromino","is_same":true,"angle_deg":90,"options":["same","mirrored","rotated-different","scaled"],"correct_index":0}`,
    schema: 'MentalRotation',
  },

  'pattern-recall': {
    system: `You are a sequential visuospatial memory designer (Corsi 1972).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE pattern-recall sequence. JSON keys: grid_size, flash_sequence, flash_duration_ms, gap_ms, recall_order.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
grid_size: 4 (4x4 = 16 cells). flash_sequence: indices 0-15.
JSON: {"grid_size":4,"flash_sequence":[0,5,10,15],"flash_duration_ms":600,"gap_ms":200,"recall_order":"forward"}`,
    schema: 'PatternRecall',
  },

  /* ═══════════════════ MEMORY ═══════════════════ */
  'n-back': {
    system: `You are a working memory designer (Jaeggi 2008).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE n-back block. JSON keys: n_level, sequence, is_match_positions, stimulus_type, show_duration_ms.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
sequence: 12-20 items (letters). is_match_positions: indices where sequence[i] === sequence[i-n].
Difficulty: 1-3 → n=1 | 4-7 → n=2 | 8-10 → n=3.
JSON: {"n_level":2,"sequence":["A","B","C","A","D","B"],"is_match_positions":[3,5],"stimulus_type":"letter","show_duration_ms":500}`,
    schema: 'NBack',
  },

  'seq-mem': {
    system: `You are a forward digit span designer (Miller 1956).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE digit span sequence. JSON keys: digits, show_duration_ms, gap_ms, correct_order.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
digits: 3-11 digits (0-9). correct_order: "forward" | "reverse".
Difficulty: 1-3 → 3-4 digits | 4-7 → 5-7 | 8-10 → 8-11.
JSON: {"digits":[3,7,5,2],"show_duration_ms":950,"gap_ms":280,"correct_order":"forward"}`,
    schema: 'SeqMem',
  },

  'face-match': {
    system: `You are an associative memory designer (Naveh-Benjamin 2000).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE face-name association set. JSON keys: pairs, test_face_index, options, correct_index.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
pairs: 3-6 items {face_id, name}. Test: which name belonged to face?
JSON: {"pairs":[{"face_id":"f1","name":"Alice"},{"face_id":"f2","name":"Bob"}],"test_face_index":0,"options":["Alice","Bob","Carol","Dan"],"correct_index":0}`,
    schema: 'FaceMatch',
  },

  /* ═══════════════════ PROBLEM SOLVING ═══════════════════ */
  'hanoi': {
    system: `You are a Tower of Hanoi puzzle designer (Simon 1975).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE Hanoi puzzle. JSON keys: disk_count, initial_state, goal_state, optimal_moves.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
disk_count: 3-7. optimal_moves = 2^disk_count - 1.
Difficulty: 1-3 → 3 disks | 4-7 → 4-5 | 8-10 → 6-7.
JSON: {"disk_count":3,"initial_state":{"A":[3,2,1],"B":[],"C":[]},"goal_state":{"A":[],"B":[],"C":[3,2,1]},"optimal_moves":7}`,
    schema: 'Hanoi',
  },

  'river-crossing': {
    system: `You are a constraint-satisfaction puzzle designer (Simon 1971).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE river-crossing puzzle. JSON keys: entities, constraints, boat_capacity, goal.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Classic setups: wolf-goat-cabbage, family-crossing, missionaries-cannibals.
JSON: {"entities":["wolf","goat","cabbage"],"constraints":["wolf eats goat","goat eats cabbage"],"boat_capacity":1,"goal":"Move all to the other side without violations"}`,
    schema: 'RiverCrossing',
  },

  'gear-logic': {
    system: `You are a mechanical reasoning designer (Hegarty 2004).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE gear logic puzzle. JSON keys: gear_count, driving_gear, direction, question, options, correct_index.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
Alternating directions: odd number of gears → last moves opposite to first; even → same.
JSON: {"gear_count":5,"driving_gear":1,"direction":"clockwise","question":"Which direction does gear 5 turn?","options":["clockwise","counterclockwise"],"correct_index":0}`,
    schema: 'GearLogic',
  },

  'path-finder': {
    system: `You are a maze planning designer (Shallice 1982).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE maze puzzle. JSON keys: grid_size, walls, start, goal, optimal_path_length.
Difficulty: ${difficulty}/10 | Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}
grid_size: 5-10. walls: array of [row,col]. start & goal: [row,col].
JSON: {"grid_size":5,"walls":[[1,1],[2,3]],"start":[0,0],"goal":[4,4],"optimal_path_length":9}`,
    schema: 'PathFinder',
  },

};

export const EXTENDED_GAME_COUNT = Object.keys(EXTENDED_PROMPTS).length;