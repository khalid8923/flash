/* ═══════════════════════════════════════════════════════════
   AI Lab Prompts
   6 experiment templates + LLM for result summary.
   Rule: Templates are fixed. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export interface ExperimentTemplate {
  key: string;
  title_en: string;
  title_ar: string;
  hypothesis_en: string;
  hypothesis_ar: string;
  description_en: string;
  description_ar: string;
  duration_days: number;
  protocol: Record<string, unknown>;
  min_prior_sessions: number;   // how much data user needs to try this
}

/* ─── 6 Templates ─── */
export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    key: 'morning_7d',
    title_en: 'Morning Sessions',
    title_ar: 'جلسات الصباح',
    hypothesis_en: 'You will see higher accuracy in the morning.',
    hypothesis_ar: 'هتشوف دقة أعلى في الصبح.',
    description_en: 'Play your sessions before noon for 7 days. Compare with your baseline.',
    description_ar: 'العب جلساتك قبل الظهر لمدة 7 أيام. قارن مع خط الأساس.',
    duration_days: 7,
    protocol: { sessions_per_day: 1, time_of_day: 'morning' },
    min_prior_sessions: 3,
  },
  {
    key: 'precision_week',
    title_en: 'Precision Mode Week',
    title_ar: 'أسبوع وضع الدقة',
    hypothesis_en: 'Precision mode will improve your baseline accuracy.',
    hypothesis_ar: 'وضع الدقة هيرفع دقتك الأساسية.',
    description_en: 'Play ONLY Precision mode for 7 days. No time pressure.',
    description_ar: 'العب وضع Precision بس لمدة 7 أيام. بدون ضغط وقت.',
    duration_days: 7,
    protocol: { preferred_mode: 'precision', min_sessions: 5 },
    min_prior_sessions: 3,
  },
  {
    key: 'short_daily',
    title_en: 'Short Daily Sessions',
    title_ar: 'جلسات يومية قصيرة',
    hypothesis_en: 'Short daily sessions beat long irregular ones.',
    hypothesis_ar: 'الجلسات القصيرة اليومية أفضل من الطويلة المتقطعة.',
    description_en: 'Play 2-3 minutes every day for 7 days. Skip long sessions.',
    description_ar: 'العب 2-3 دقايق كل يوم لمدة 7 أيام. بدون جلسات طويلة.',
    duration_days: 7,
    protocol: { max_duration_min: 3, sessions_per_day: 1 },
    min_prior_sessions: 2,
  },
  {
    key: 'domain_rotation',
    title_en: 'Domain Rotation',
    title_ar: 'تنويع المجالات',
    hypothesis_en: 'Rotating domains prevents plateau and boosts flexibility.',
    hypothesis_ar: 'تنويع المجالات يمنع الثبات ويحسن المرونة.',
    description_en: 'Each session must be a different domain. 5 days in a row.',
    description_ar: 'كل جلسة لازم تكون مجال مختلف. 5 أيام ورا بعض.',
    duration_days: 5,
    protocol: { different_domain_each_session: true },
    min_prior_sessions: 5,
  },
  {
    key: 'focus_game',
    title_en: 'Focus on One Game',
    title_ar: 'التركيز على لعبة واحدة',
    hypothesis_en: 'Deep practice on one game reveals a plateau curve.',
    hypothesis_ar: 'التدريب العميق على لعبة واحدة بيكشف منحنى الثبات.',
    description_en: 'Play the SAME game every session for 5 days.',
    description_ar: 'العب نفس اللعبة كل جلسة لمدة 5 أيام.',
    duration_days: 5,
    protocol: { same_game: true, min_sessions: 4 },
    min_prior_sessions: 3,
  },
  {
    key: 'no_warmup',
    title_en: 'No Warmup Week',
    title_ar: 'أسبوع بدون تسخين',
    hypothesis_en: 'Skipping warmup shows if you need it or not.',
    hypothesis_ar: 'تخطي التسخين هيكشف لو محتاجه ولا لأ.',
    description_en: 'Start each session with your hardest game. 5 days.',
    description_ar: 'ابدأ كل جلسة بأصعب لعبة عندك. 5 أيام.',
    duration_days: 5,
    protocol: { skip_warmup: true, min_sessions: 4 },
    min_prior_sessions: 5,
  },
];

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_LAB_RESULT_EN = `You write a short result summary for a personal cognitive experiment.

You receive:
- Experiment title + hypothesis
- Baseline metric (accuracy before the experiment)
- Result metric (accuracy during the experiment)
- Sessions completed, days elapsed
- Whether the protocol was followed

Write ONE paragraph (3-5 sentences):
- State clearly whether the hypothesis was confirmed, refuted, or inconclusive
- Show the delta (positive or negative) with concrete numbers
- Be honest: if sample is small, say so
- Suggest ONE next step

STRICT RULES:
- Use ONLY the numbers given. Never invent stats.
- Correlation is NOT causation — use "moved with", "changed alongside" not "caused".
- If sessions completed < 3, clearly state evidence is weak.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words. No exclamation marks. No emojis.
- Tone: calm analyst.
- 3-5 sentences only.

OUTPUT: one paragraph. Plain text. No JSON. No markdown.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_LAB_RESULT_AR = `أنت كاتب ملخص نتيجة لتجربة معرفية شخصية.

هتستقبل:
- عنوان التجربة + الفرضية
- خط الأساس (الدقة قبل التجربة)
- النتيجة (الدقة أثناء التجربة)
- عدد الجلسات، عدد الأيام
- هل البروتوكول اتّبع

اكتب فقرة واحدة (3-5 جمل):
- وضّح بوضوح: الفرضية اتحققت، اترفضت، ولا النتيجة غير حاسمة
- اذكر الفرق (إيجابي أو سلبي) بأرقام ملموسة
- كن صادق: لو العينة صغيرة، قول كده
- اقترح خطوة واحدة تالية

قواعد صارمة:
- استخدم بس الأرقام المعطاة. ممنوع تألف أرقام.
- الارتباط مش سببية — استخدم "تحرك مع"، "اتغير مع"، مش "سبّب".
- لو عدد الجلسات < 3، وضّح إن الأدلة ضعيفة.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب. بدون إيموجي.
- النبرة: محلل هادئ.
- 3-5 جمل بس.

المخرجات: فقرة واحدة. نص عادي. بدون JSON. بدون markdown.`;

/* ─── User prompt builders ─── */
export interface LabResultContext {
  title: string;
  hypothesis: string;
  baseline_accuracy: number;
  result_accuracy: number;
  delta: number;
  sessions_completed: number;
  sessions_required: number;
  days_elapsed: number;
  protocol_followed: boolean;
}

export function buildLabResultPrompt(c: LabResultContext, lang: Lang): string {
  const lines = [
    `experiment: ${c.title}`,
    `hypothesis: ${c.hypothesis}`,
    `baseline_accuracy: ${c.baseline_accuracy.toFixed(1)}%`,
    `result_accuracy: ${c.result_accuracy.toFixed(1)}%`,
    `delta: ${c.delta >= 0 ? '+' : ''}${c.delta.toFixed(1)}%`,
    `sessions_completed: ${c.sessions_completed}`,
    `sessions_required: ${c.sessions_required}`,
    `days_elapsed: ${c.days_elapsed}`,
    `protocol_followed: ${c.protocol_followed}`,
  ];
  if (lang === 'ar') {
    return `بيانات التجربة:\n\n${lines.join('\n')}\n\nاكتب الملخص (3-5 جمل):`;
  }
  return `Experiment data:\n\n${lines.join('\n')}\n\nWrite the result summary (3-5 sentences):`;
}

/* ─── Labels ─── */
export function templateTitle(t: ExperimentTemplate, lang: Lang): string {
  return lang === 'ar' ? t.title_ar : t.title_en;
}

export function templateHypothesis(t: ExperimentTemplate, lang: Lang): string {
  return lang === 'ar' ? t.hypothesis_ar : t.hypothesis_en;
}

export function templateDescription(t: ExperimentTemplate, lang: Lang): string {
  return lang === 'ar' ? t.description_ar : t.description_en;
}