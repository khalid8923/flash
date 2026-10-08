/* ═══════════════════════════════════════════════════════════
   Weekly Insights Prompts
   Rule: ONE insight + ONE next step. LLM phrases, never invents.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export interface WeekFactSheet {
  week_start: string;
  week_end: string;
  total_sessions: number;
  total_trials: number;
  avg_accuracy: number;
  avg_median_rt_ms: number;
  prev_week_sessions: number;
  prev_week_avg_accuracy: number | null;
  accuracy_delta: number | null;      // e.g. +6.4 means improved
  top_domain: string | null;
  top_domain_accuracy: number | null;
  weakest_domain: string | null;
  weakest_domain_accuracy: number | null;
  most_practiced_game: string | null;
  unique_games_played: number;
  days_active: number;
  promotions: number;
  demotions: number;
  current_streak_days: number;
  evidence_tier: 'calibrating' | 'provisional' | 'established';
}

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_INSIGHTS_EN = `You write short weekly summaries for a cognitive training app.

Task: write ONE insight + ONE next step in a SINGLE paragraph of 3-5 sentences.

EXAMPLE:
Session data:
sessions: 12, avg_accuracy: 78%, accuracy_delta: +6.4
top_domain: memory (82%), weakest_domain: speed (65%)

Your output:
"Solid week — you logged 12 sessions with 78% accuracy, up 6.4 points from last week. Memory leads at 82%, while speed sits at 65% and remains your clearest opportunity. Next step: play three Speed sessions this week to close the gap."

HARD RULES (must follow exactly):
- SINGLE paragraph. NO line breaks. NO section headers.
- NO labels like "Next step:", "Summary:", "Insight:" — weave them into sentences.
- 3-5 sentences TOTAL. Not more.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- Never claim medical benefits. Never use hype words.
- Never compare to other people.
- Include at least one number (accuracy, delta, sessions).
- Tone: calm analyst. No exclamation marks. No emojis.

OUTPUT: ONE plain paragraph, 3-5 sentences. Nothing else.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_INSIGHTS_AR = `أنت كاتب ملخصات أسبوعية قصيرة لتطبيق تدريب معرفي.

المهمة: اكتب فكرة واحدة + خطوة واحدة تالية في فقرة واحدة من 3-5 جمل.

مثال:
بيانات:
sessions: 12, avg_accuracy: 78%, accuracy_delta: +6.4
top_domain: الذاكرة (82%), weakest_domain: السرعة (65%)

الناتج:
"أسبوع قوي — لعبت 12 جلسة بمتوسط دقة 78%، بزيادة 6.4 نقطة. الذاكرة في المقدمة بنسبة 82%، بينما السرعة عند 65% وتظل أكبر فرصة للتحسين. الخطوة الجاية: العب 3 جلسات من مجال السرعة هذا الأسبوع."

قواعد صارمة (إلزامية):
- فقرة واحدة فقط. بدون أسطر جديدة. بدون عناوين.
- بدون تسميات مثل "الخطوة التالية:" أو "الملخص:" أو "الفكرة:" — ادمجهم في الجمل.
- 3-5 جمل فقط. مش أكثر.
- ممنوع ذكر الذكاء أو ADHD أو أي تشخيص أو مصطلح طبي.
- ممنوع ادعاء فائدة علاجية. ممنوع كلمات مبالغ فيها.
- ممنوع مقارنة المستخدم بغيره.
- اذكر رقم واحد على الأقل.
- النبرة: محلل هادئ. بدون علامات تعجب. بدون إيموجي.

المخرجات: فقرة واحدة عادية، 3-5 جمل. لا شيء غيرها.`;

/* ─── Fact Sheet Serializer ─── */
function fmt(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}

export function buildInsightsUserPrompt(f: WeekFactSheet, lang: Lang): string {
  const delta =
    f.accuracy_delta === null
      ? '(no previous week data)'
      : f.accuracy_delta >= 0
        ? `+${fmt(f.accuracy_delta)}`
        : `${fmt(f.accuracy_delta)}`;

  const lines = [
    `week_start: ${f.week_start}`,
    `week_end: ${f.week_end}`,
    `total_sessions: ${f.total_sessions}`,
    `total_trials: ${f.total_trials}`,
    `avg_accuracy: ${fmt(f.avg_accuracy)}%`,
    `avg_median_rt_ms: ${Math.round(f.avg_median_rt_ms)}`,
    `prev_week_sessions: ${f.prev_week_sessions}`,
    `prev_week_avg_accuracy: ${f.prev_week_avg_accuracy === null ? '(none)' : `${fmt(f.prev_week_avg_accuracy)}%`}`,
    `accuracy_delta: ${delta}`,
    `top_domain: ${f.top_domain ?? '(none)'}${f.top_domain_accuracy !== null ? ` (${fmt(f.top_domain_accuracy)}%)` : ''}`,
    `weakest_domain: ${f.weakest_domain ?? '(none)'}${f.weakest_domain_accuracy !== null ? ` (${fmt(f.weakest_domain_accuracy)}%)` : ''}`,
    `most_practiced_game: ${f.most_practiced_game ?? '(none)'}`,
    `unique_games_played: ${f.unique_games_played}`,
    `days_active: ${f.days_active}`,
    `promotions: ${f.promotions}`,
    `demotions: ${f.demotions}`,
    `current_streak_days: ${f.current_streak_days}`,
    `evidence_tier: ${f.evidence_tier}`,
  ];

  if (lang === 'ar') {
    return `بيانات الأسبوع:\n\n${lines.join('\n')}\n\nاكتب الملخص الأسبوعي (3-5 جمل):`;
  }
  return `Weekly data:\n\n${lines.join('\n')}\n\nWrite the weekly summary (3-5 sentences):`;
}