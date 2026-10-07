export interface PromptTemplate {
  system: string;
  build: (params: { difficulty: number; exclude: string[]; lang: string }) => string;
  schema: string;
}

const SAFETY_RULES = `
RULES:
- Return ONLY valid JSON matching the schema. No markdown, no explanations.
- All text must be in the requested language (en or ar).
- Never repeat content from the EXCLUDE list.
- Content must be scientifically valid for the game's paradigm.
- Difficulty is on a scale 1-10 (1=easiest, 10=hardest).
`;

export const PROMPTS: Record<string, PromptTemplate> = {

  'verbal-analogies': {
    system: `You are an expert psychometrician generating verbal analogy items (Sternberg 1977 paradigm).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE verbal analogy item.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE (do not reuse): ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "a": "word1",
  "b": "word2",
  "c": "word3",
  "options": ["correct_word", "distractor1", "distractor2", "distractor3"],
  "correct_index": 0,
  "relation_type": "one of: synonym|antonym|part-whole|category|function|cause-effect|degree|producer|location|characteristic|instrument|worker",
  "explanation": "short explanation of the relationship"
}

The relationship between a and b must match the relationship between c and the correct answer.
Make distractors plausible but clearly incorrect.`,
    schema: 'VerbalAnalogy',
  },

  'vocabulary-elite': {
    system: `You are a lexicographer generating vocabulary items (WAIS-IV synonym matching).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE vocabulary synonym item.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE (do not reuse): ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "word": "target_word",
  "options": ["correct_synonym", "distractor1", "distractor2", "distractor3"],
  "correct_index": 0,
  "part_of_speech": "noun|verb|adjective|adverb",
  "definition": "brief definition"
}

Difficulty guide:
- 1-3: common words (happy, big, fast)
- 4-7: moderate (lucid, ambiguous, prudent)
- 8-10: rare (obfuscate, ubiquitous, perspicacious)

Distractors must be semantically related but wrong.`,
    schema: 'VocabularyItem',
  },

  'syllogisms': {
    system: `You are a logician generating categorical syllogisms (Aristotelian).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE syllogism.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "premise1": "All A are B",
  "premise2": "All B are C",
  "options": ["valid conclusion", "invalid 1", "invalid 2", "invalid 3"],
  "correct_index": 0,
  "form": "AAA-1|AEE-2|etc",
  "validity": true,
  "explanation": "why the correct answer follows"
}

Use real syllogistic forms. Vary between valid and subtly invalid conclusions.`,
    schema: 'Syllogism',
  },

  'argument-analyzer': {
    system: `You are a critical thinking expert generating fallacy detection items (Abrami 2015).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE argument containing a fallacy.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "argument": "the flawed argument text",
  "options": ["correct fallacy name", "distractor 1", "distractor 2", "distractor 3"],
  "correct_index": 0,
  "fallacy": "ad-hominem|straw-man|false-dilemma|slippery-slope|appeal-to-authority|circular-reasoning",
  "explanation": "why this argument commits the fallacy"
}

Make the fallacy subtle but detectable. Avoid obvious caricatures.`,
    schema: 'ArgumentAnalyzer',
  },

  'matrix-logic': {
    system: `You are a psychometrician generating Raven-style matrix items.${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE 3x3 matrix logic puzzle.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "grid": [[cell00, cell01, cell02], [cell10, cell11, cell12], [cell20, cell21, null]],
  "cell_format": {
    "shape": "circle|square|triangle|diamond|pentagon|hexagon",
    "fill": "empty|solid|striped|dotted",
    "rotation": 0,
    "count": 1
  },
  "options": [option1, option2, option3, option4],
  "correct_index": 0,
  "rule": "description of the transformation rule"
}

Each cell is an object matching cell_format. Options are also cell objects.
The bottom-right cell (grid[2][2]) is the missing one.`,
    schema: 'MatrixLogic',
  },

  'story-spark': {
    system: `You are a creative writing instructor generating narrative prompts (Amabile 1982).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE creative story prompt.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "words": ["word1", "word2", "word3"],
  "opening_type": "character|setting|dialogue|action",
  "opening": "optional opening line to inspire",
  "constraint": "optional constraint (e.g. no more than 100 words)"
}

The three words should be unexpected together and evocative.
Higher difficulty = more abstract or dissonant word combinations.`,
    schema: 'StorySpark',
  },

  'alternative-uses': {
    system: `You are a creativity researcher generating Alternative Uses Test items (Guilford 1967).${SAFETY_RULES}`,
    build: ({ difficulty, exclude, lang }) => `
Generate ONE object for the Alternative Uses task.

Difficulty: ${difficulty}/10
Language: ${lang}
EXCLUDE: ${exclude.join(', ') || '(none)'}

SCHEMA:
{
  "object": "object name",
  "category": "household|nature|tool|toy|clothing|food",
  "time_limit_seconds": 60,
  "sample_uses": ["example1", "example2", "example3"]
}

Difficulty guide:
- 1-3: common objects (brick, newspaper, spoon)
- 4-7: less obvious (umbrella, paperclip, sock)
- 8-10: abstract or unusual (cloud, silence, mirror)`,
    schema: 'AlternativeUses',
  },

};

export function getPrompt(gameId: string, params: { difficulty: number; exclude: string[]; lang: string }): { system: string; user: string } | null {
  const tpl = PROMPTS[gameId];
  if (!tpl) return null;
  return { system: tpl.system, user: tpl.build(params) };
}

export function isGenerativeGame(gameId: string): boolean {
  return gameId in PROMPTS;
}

export function listGenerativeGames(): string[] {
  return Object.keys(PROMPTS);
}