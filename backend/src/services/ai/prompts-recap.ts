/* ═══════════════════════════════════════════════════════════
   Recap Prompts — LLM phrases facts, never invents them.
   Uses few-shot examples to prevent fact-sheet echoing.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export interface RecapFactSheet {
  game_id: string;
  game_name: string;
  domain_id: string;
  mode: string;
  accuracy: number;
  median_rt_ms: number;
  rcs: number;
  n_trials: number;
  n_correct: number;
  reason_code: string;
  from_level: number;
  to_level: number;
  predicted_success: number;
  user_baseline_accuracy: number | null;
  sessions_played: number;
  evidence_tier: 'calibrating' | 'provisional' | 'established';
}

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_RECAP_EN = `You write short recaps of cognitive training sessions.

Your task: summarize the session data in 2-4 natural English sentences.

EXAMPLE:
Session data:
accuracy: 100%
median_rt_ms: 2200
level_from: 3
level_to: 4
engine_reason_code: PROMOTE_STABLE

Your recap:
"Strong session — you finished with 100% accuracy and a 2200ms median reaction time. The engine promoted you from level 3 to level 4 after two consistent rounds."

STRICT RULES:
- Do NOT repeat the data verbatim. Write a human summary in narrative form.
- Do NOT use key:value format. Write full sentences.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- Never claim medical or therapeutic benefits.
- Never use hype words ("miracle", "genius", "boost your brain").
- Never compare the user to other people. Only to their own baseline.
- Include at least one concrete number (accuracy, RT, or level change).
- Explain the engine reason code in human terms (one short clause).
- Tone: calm analyst, not cheerleader. No exclamation marks.

OUTPUT: 2-4 full sentences. Plain English. No JSON. No markdown. No lists.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_RECAP_AR = `أنت كاتب ملخصات قصيرة لجلسات تدريب معرفي.

مهمتك: تلخيص بيانات الجلسة في 2-4 جمل عربية طبيعية.

مثال:
بيانات الجلسة:
accuracy: 100%
median_rt_ms: 2200
level_from: 3
level_to: 4
engine_reason_code: PROMOTE_STABLE

الملخص:
"أداء قوي — خلصت الجلسة بدقة 100% ومتوسط زمن 2200 مللي ثانية. المحرك رقّاك من مستوى 3 إلى 4 بعد ثبات الأداء."

قواعد صارمة:
- لا تكرر البيانات كما هي. اكتب ملخص بشري بأسلوب سردي.
- لا تستخدم صيغة "المفتاح: القيمة". اكتب جملاً كاملة.
- ممنوع ذكر الذكاء أو ADHD أو أي تشخيص أو مصطلح طبي.
- ممنوع ادعاء فائدة علاجية.
- ممنوع كلمات مبالغ فيها ("معجزة"، "عبقري"، "نشّط عقلك").
- ممنوع مقارنة المستخدم بغيره. قارن بخطه الأساسي فقط.
- اذكر رقم واحد على الأقل (دقة، زمن، أو تغير مستوى).
- اشرح reason_code بعبارة بشرية قصيرة.
- النبرة: محلل هادئ، مش مشجّع مبالغ. بدون علامات تعجب.

المخرجات: 2-4 جمل عربية كاملة. بدون JSON. بدون markdown. بدون قوائم.`;

/* ─── Fact Sheet Serializer ─── */
function fmt(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}

export function buildRecapUserPrompt(f: RecapFactSheet, lang: Lang): string {
  const baseline =
    f.user_baseline_accuracy === null
      ? '(none yet)'
      : `${fmt(f.user_baseline_accuracy)}%`;

  const lines = [
    `game: ${f.game_name} (${f.game_id})`,
    `domain: ${f.domain_id}`,
    `mode: ${f.mode}`,
    `accuracy: ${fmt(f.accuracy)}%`,
    `median_rt_ms: ${Math.round(f.median_rt_ms)}`,
    `trials: ${f.n_correct}/${f.n_trials} correct`,
    `rcs: ${fmt(f.rcs, 2)}`,
    `level: ${f.from_level} -> ${f.to_level}`,
    `engine_reason: ${f.reason_code}`,
    `predicted_success: ${fmt(f.predicted_success, 2)}`,
    `user_baseline: ${baseline}`,
    `sessions_on_game: ${f.sessions_played}`,
    `evidence_tier: ${f.evidence_tier}`,
  ];

  if (lang === 'ar') {
    return `بيانات الجلسة:\n\n${lines.join('\n')}\n\nاكتب الملخص (2-4 جمل):`;
  }
  return `Session data:\n\n${lines.join('\n')}\n\nWrite the recap (2-4 sentences):`;
}