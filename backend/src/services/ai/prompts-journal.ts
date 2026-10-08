/* ═══════════════════════════════════════════════════════════
   AI Journal Prompts
   Rule: mood/energy → plan adjustment. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type Mood = 'calm' | 'focused' | 'tired' | 'stressed' | 'energized';

export type PlanAdjustment =
  | 'normal'        // الخطة زي ما هي
  | 'lighter'       // خفف: جلسة واحدة أقصر
  | 'recovery'      // راحة: precision mode بس
  | 'stretch'       // تحدّي: زوّد صعوبة
  | 'warmup_only';  // تسخين فقط

export interface JournalContext {
  mood: Mood;
  energy: number;   // 1-5
  note: string | null;
  adjustment: PlanAdjustment;
  base_plan_minutes: number;
  adjusted_plan_minutes: number;
  session_count_today: number;
  is_returning: boolean;   // أول مرة بعد غياب
}

/* ─── Mood labels ─── */
export const MOOD_LABELS: Record<Mood, { en: string; ar: string }> = {
  calm:      { en: 'Calm',      ar: 'هادي' },
  focused:   { en: 'Focused',   ar: 'مركّز' },
  tired:     { en: 'Tired',     ar: 'متعب' },
  stressed:  { en: 'Stressed',  ar: 'متوتر' },
  energized: { en: 'Energized', ar: 'نشيط' },
};

export function moodLabel(m: Mood, lang: Lang): string {
  return MOOD_LABELS[m][lang];
}

/* ─── Rule-based adjustment logic ─── */
export function pickAdjustment(
  mood: Mood,
  energy: number,
  sessionCountToday: number
): PlanAdjustment {
  /* Fatigue override: too many sessions today */
  if (sessionCountToday >= 4) return 'warmup_only';

  if (mood === 'tired' || energy <= 2) return 'lighter';
  if (mood === 'stressed') return 'recovery';
  if (mood === 'energized' && energy >= 4) return 'stretch';
  return 'normal';
}

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_JOURNAL_EN = `You write a 1-2 sentence personalized message for today's training plan.

You receive:
- Mood (calm/focused/tired/stressed/energized)
- Energy (1-5)
- The adjustment applied: normal / lighter / recovery / stretch / warmup_only
- Note from user (optional)

YOUR JOB: Write ONE short message (max 30 words) that:
- Acknowledges the mood + energy briefly
- Explains the plan adjustment in human terms
- Sounds like a calm coach, not a robot

STRICT RULES:
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words ("amazing", "genius", "boost"). No exclamation marks.
- No emojis.
- Second person ("you", "your").
- Max 30 words. One or two sentences.

OUTPUT: just the message. Plain text. No JSON. No markdown.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_JOURNAL_AR = `أنت كاتب رسالة مخصصة من جملة أو اتنين لخطة تدريب اليوم.

هتستقبل:
- المزاج (هادي/مركّز/متعب/متوتر/نشيط)
- الطاقة (1-5)
- التعديل اللي اتعمل: normal / lighter / recovery / stretch / warmup_only
- ملاحظة من المستخدم (اختياري)

مهمتك: اكتب رسالة قصيرة واحدة (max 30 كلمة):
- تلخّص المزاج + الطاقة باختصار
- تشرح تعديل الخطة بلغة بشرية
- نبرة مدرب هادئ، مش روبوت

قواعد صارمة:
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب.
- بدون إيموجي.
- بصيغة المخاطب.
- بحد أقصى 30 كلمة. جملة أو جملتين.

المخرجات: الرسالة بس. نص عادي. بدون JSON. بدون markdown.`;

/* ─── Adjustment labels ─── */
export function adjustmentLabel(a: PlanAdjustment, lang: Lang): string {
  const map: Record<PlanAdjustment, { en: string; ar: string }> = {
    normal:      { en: 'Normal plan',      ar: 'الخطة العادية' },
    lighter:     { en: 'Lighter session',  ar: 'جلسة أخف' },
    recovery:    { en: 'Recovery mode',    ar: 'وضع الاسترخاء' },
    stretch:     { en: 'Stretch challenge', ar: 'تحدي إضافي' },
    warmup_only: { en: 'Warmup only',      ar: 'تسخين بس' },
  };
  return map[a][lang];
}

/* ─── User prompt builder ─── */
export function buildJournalPrompt(ctx: JournalContext, lang: Lang): string {
  const mood = moodLabel(ctx.mood, lang);
  const adjust = adjustmentLabel(ctx.adjustment, lang);
  const note = ctx.note ? `note: "${ctx.note.slice(0, 200)}"` : 'note: (none)';

  const lines = [
    `mood: ${mood}`,
    `energy: ${ctx.energy}/5`,
    `adjustment: ${adjust}`,
    `base_plan_minutes: ${ctx.base_plan_minutes}`,
    `adjusted_plan_minutes: ${ctx.adjusted_plan_minutes}`,
    `sessions_completed_today: ${ctx.session_count_today}`,
    `returning_after_gap: ${ctx.is_returning}`,
    note,
  ];

  if (lang === 'ar') {
    return `سياق اليوم:\n\n${lines.join('\n')}\n\nاكتب الرسالة (جملة أو جملتين):`;
  }
  return `Today's context:\n\n${lines.join('\n')}\n\nWrite the message (1-2 sentences):`;
}

/* ─── Deterministic fallback ─── */
export function buildFallbackMessage(ctx: JournalContext, lang: Lang): string {
  const adjust = ctx.adjustment;
  if (lang === 'ar') {
    switch (adjust) {
      case 'lighter':
        return `حالتك النهاردة تقول خفيف. خُد جلسة واحدة أقصر، بدون ضغط.`;
      case 'recovery':
        return `مزاجك متوتر — خُد جلسة Precision بس. بدون وقت، بس ركّز.`;
      case 'stretch':
        return `طاقتك عالية — جرّب تحدّي أكبر. لو حسّيت إنك بتتعب، اهدأ.`;
      case 'warmup_only':
        return `لعبت كتير النهاردة. تسخين قصير بس وخلاص.`;
      default:
        return `الخطة النهاردة زي ما هي. استمتع.`;
    }
  }
  switch (adjust) {
    case 'lighter':
      return `Your state calls for a lighter day. One short session, no pressure.`;
    case 'recovery':
      return `You sound stressed — do a Precision session only. No time limit, just focus.`;
    case 'stretch':
      return `Energy is high — try a bigger challenge. If you feel tired, ease off.`;
    case 'warmup_only':
      return `You've done a lot today. A short warmup and that's it.`;
    default:
      return `Plan is as usual today. Enjoy it.`;
  }
}