/* ═══════════════════════════════════════════════════════════
   Error Pattern Analysis Prompts
   LLM phrases detected patterns. Never invents them.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export interface DetectedPattern {
  key: string;
  frequency: number;         // عدد الجلسات اللي ظهر فيها
  total_sessions: number;    // إجمالي الجلسات المحللة
  evidence_en: string;       // نص إنجليزي فيه أرقام
  evidence_ar: string;       // نص عربي فيه أرقام
  game_scope: string;        // 'all' أو اسم لعبة محددة
}

/* ─── EN ─── */
export const SYSTEM_PROMPT_ERROR_PATTERNS_EN = `You are a calm analyst summarizing a player's error patterns.

You will receive a list of detected patterns (each with frequency + evidence).
Write ONE short paragraph (3-5 sentences) that:
- Describes the top 1-2 patterns in plain language
- Explains what they mean in cognitive terms
- Suggests ONE concrete next step

STRICT RULES:
- Use ONLY the facts in the detected patterns. Never invent numbers.
- If frequency is low (< 3 sessions), mention that evidence is still forming.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words ("miracle", "genius"). No exclamation marks. No emojis.
- Tone: calm analyst observing a pattern.
- 3-5 sentences only.

OUTPUT: one paragraph. Plain text. No JSON. No markdown.`;

/* ─── AR ─── */
export const SYSTEM_PROMPT_ERROR_PATTERNS_AR = `أنت محلل هادئ بيلخص أنماط أخطاء اللاعب.

هتستقبل قائمة patterns مكتشفة (كل واحدة فيها عدد مرات + دليل).
اكتب فقرة واحدة من 3-5 جمل:
- تصف أقوى 1-2 patterns بلغة بسيطة
- تشرح معناهم معرفياً
- تقترح خطوة واحدة عملية

قواعد صارمة:
- استخدم فقط الحقائق الموجودة في الـ patterns. ممنوع تألف أرقام.
- لو عدد المرات قليل (< 3 جلسات)، وضّح إن الأدلة لسه بتتكوّن.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب. بدون إيموجي.
- النبرة: محلل هادئ.
- 3-5 جمل بس.

المخرجات: فقرة واحدة. نص عادي. بدون JSON. بدون markdown.`;

/* ─── Human labels for each pattern key ─── */
export function patternLabel(key: string, lang: Lang): string {
  const map: Record<string, { en: string; ar: string }> = {
    post_error_slowdown:   { en: 'Slower after mistakes',   ar: 'أبطأ بعد الأخطاء' },
    first_trial_penalty:   { en: 'Slow start',              ar: 'بداية بطيئة' },
    late_session_fatigue:  { en: 'Fatigue late in session', ar: 'إجهاد آخر الجلسة' },
    consecutive_errors:    { en: 'Error streaks',           ar: 'سلاسل الأخطاء' },
  };
  return map[key]?.[lang] ?? key;
}

/* ─── User prompt builder ─── */
export function buildErrorPatternsPrompt(
  patterns: DetectedPattern[],
  sessionsCount: number,
  lang: Lang
): string {
  const lines = patterns.map((p, i) => {
    const label = patternLabel(p.key, lang);
    const evidence = lang === 'ar' ? p.evidence_ar : p.evidence_en;
    return `${i + 1}. ${label} (${p.frequency}/${p.total_sessions} sessions) — ${evidence}`;
  });

  if (lang === 'ar') {
    return `تم تحليل ${sessionsCount} جلسة. الأنماط المكتشفة:\n\n${lines.join('\n')}\n\nاكتب الفقرة (3-5 جمل):`;
  }
  return `Analyzed ${sessionsCount} sessions. Detected patterns:\n\n${lines.join('\n')}\n\nWrite the paragraph (3-5 sentences):`;
}