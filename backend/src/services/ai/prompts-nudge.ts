/* ═══════════════════════════════════════════════════════════
   In-Game Micro-Coach Prompts
   Rule: ONE short sentence (2-12 words). Calm. No hype.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type NudgeTrigger =
  | 'slow_down'
  | 'speed_up'
  | 'tired'
  | 'focus'
  | 'streak_break'
  | 'great_run';

export interface NudgeContext {
  trigger: NudgeTrigger;
  game_id: string;
  game_name: string;
  recent_accuracy: number;
  recent_median_rt_ms: number;
  baseline_accuracy: number | null;
  baseline_rt_ms: number | null;
  consecutive_mistakes: number;
  session_duration_ms: number;
  trials_count: number;
}

export const SYSTEM_PROMPT_NUDGE_EN = `You are a calm in-game coach. Output EXACTLY ONE short sentence.

STRICT RULES:
- 2-12 words MAXIMUM. One sentence. No period at end optional.
- No exclamation marks. No emojis.
- Never mention IQ, ADHD, diagnoses, or clinical terms.
- Never say "great job", "amazing", "awesome" (hype words forbidden).
- Reference ONE concrete number OR one concrete action.
- Tone: quiet, precise, supportive.

EXAMPLES (match this style):
- "Response time up 40% — take a breath."
- "Accuracy at 95% — try slightly faster."
- "Three misses in a row — slow down."
- "12 minutes in — that's enough for today."
- "Consistent pace — hold it."

OUTPUT: just the sentence. Nothing else.`;

export const SYSTEM_PROMPT_NUDGE_AR = `أنت مدرب هادئ جوّه اللعبة. اكتب جملة واحدة قصيرة بس.

قواعد صارمة:
- من كلمتين لـ 12 كلمة بالكتير. جملة واحدة. النقطة اختيارية.
- ممنوع علامات تعجب. ممنوع إيموجي.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع "أداء رائع" أو "ممتاز" (كلمات مبالغ فيها).
- اذكر رقم واحد أو إجراء واحد ملموس.
- النبرة: هادئة، دقيقة، داعمة.

أمثلة (اتبع نفس الأسلوب):
- "زمن ردك زاد 40% — خد نفس."
- "دقتك 95% — جرّب أسرع شوية."
- "3 أخطاء ورا بعض — اهدأ."
- "12 دقيقة — كفاية النهاردة."
- "إيقاع ثابت — حافظ عليه."

المخرجات: الجملة بس. مفيش أي حاجة تانية.`;

export function buildNudgeUserPrompt(c: NudgeContext, lang: Lang): string {
  const baseAcc = c.baseline_accuracy === null ? 'n/a' : `${c.baseline_accuracy.toFixed(0)}%`;
  const baseRt = c.baseline_rt_ms === null ? 'n/a' : `${Math.round(c.baseline_rt_ms)}ms`;
  const durationSec = Math.round(c.session_duration_ms / 1000);

  const lines = [
    `trigger: ${c.trigger}`,
    `game: ${c.game_name} (${c.game_id})`,
    `recent_accuracy: ${c.recent_accuracy.toFixed(0)}%`,
    `recent_median_rt_ms: ${Math.round(c.recent_median_rt_ms)}`,
    `baseline_accuracy: ${baseAcc}`,
    `baseline_rt_ms: ${baseRt}`,
    `consecutive_mistakes: ${c.consecutive_mistakes}`,
    `session_duration_sec: ${durationSec}`,
    `trials_this_session: ${c.trials_count}`,
  ];

  if (lang === 'ar') {
    return `سياق:\n\n${lines.join('\n')}\n\nاكتب جملة واحدة قصيرة:`;
  }
  return `Context:\n\n${lines.join('\n')}\n\nWrite ONE short sentence:`;
}