/* ═══════════════════════════════════════════════════════════
   Transfer Tracker Prompts
   Rule: LLM phrases correlations. Never invents them.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export interface TransferSignal {
  source_domain: string;
  target_domain: string;
  correlation: number;      // -1 to 1 (Pearson r)
  sample_days: number;      // number of days with both domains
  slope: number;            // estimated slope: how much target changes per source +10%
}

export interface DomainLabel {
  id: string;
  en: string;
  ar: string;
}

/* ─── Domain human labels ─── */
export const DOMAIN_LABELS: Record<string, DomainLabel> = {
  memory:     { id: 'memory',     en: 'Memory',      ar: 'الذاكرة' },
  attention:  { id: 'attention',  en: 'Attention',   ar: 'الانتباه' },
  speed:      { id: 'speed',      en: 'Speed',       ar: 'السرعة' },
  spatial:    { id: 'spatial',    en: 'Spatial',     ar: 'المكاني' },
  logic:      { id: 'logic',      en: 'Logic',       ar: 'المنطق' },
  language:   { id: 'language',   en: 'Language',    ar: 'اللغة' },
  creativity: { id: 'creativity', en: 'Creativity',  ar: 'الإبداع' },
  emotional:  { id: 'emotional',  en: 'Emotional',   ar: 'العاطفي' },
  problem:    { id: 'problem',    en: 'Problem Solving', ar: 'حل المشكلات' },
};

export function domainLabel(id: string, lang: Lang): string {
  return DOMAIN_LABELS[id]?.[lang] ?? id;
}

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_TRANSFER_EN = `You write short insights about cognitive skill transfer for a training app.

You receive correlations between daily performance across cognitive domains.
Write ONE paragraph (3-5 sentences) that:
- Highlights the strongest 1-2 correlations
- Explains what "transfer" means in plain language
- Suggests ONE concrete next step

STRICT RULES:
- Use ONLY the correlations in the fact sheet. Never invent numbers.
- If sample size is < 7 days, mention evidence is still forming.
- Correlation is NOT causation — use words like "moved together" or "tended to improve alongside", never "caused".
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- Never claim medical benefits. No hype words.
- No exclamation marks. No emojis.
- Tone: calm analyst observing a pattern.
- 3-5 sentences only.

OUTPUT: one paragraph. Plain text. No JSON. No markdown.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_TRANSFER_AR = `أنت كاتب فقرات قصيرة عن انتقال المهارات المعرفية لتطبيق تدريب.

هتستقبل ارتباطات (correlations) بين الأداء اليومي عبر مجالات معرفية.
اكتب فقرة واحدة من 3-5 جمل:
- تسلّط الضوء على أقوى 1-2 ارتباطات
- تشرح معنى "الانتقال" بلغة بسيطة
- تقترح خطوة واحدة عملية

قواعد صارمة:
- استخدم فقط الارتباطات الموجودة في ورقة الحقائق. ممنوع تألف أرقام.
- لو عدد الأيام < 7، وضّح إن الأدلة لسه بتتكوّن.
- الارتباط مش سببية — استخدم كلمات زي "تحركوا مع بعض" أو "بيتحسن مع"، مش "سبّب".
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع ادعاء فائدة علاجية. ممنوع كلمات مبالغ فيها.
- ممنوع علامات تعجب. ممنوع إيموجي.
- النبرة: محلل هادئ.
- 3-5 جمل بس.

المخرجات: فقرة واحدة. نص عادي. بدون JSON. بدون markdown.`;

/* ─── User prompt ─── */
export function buildTransferPrompt(
  signals: TransferSignal[],
  analyzedDays: number,
  lang: Lang
): string {
  const lines = signals.map((s, i) => {
    const src = domainLabel(s.source_domain, lang);
    const tgt = domainLabel(s.target_domain, lang);
    const dir = s.correlation > 0 ? '+' : '';
    const pct = Math.round(s.correlation * 100) / 100;
    return `${i + 1}. ${src} → ${tgt} | r=${dir}${pct} | days=${s.sample_days} | slope=${s.slope >= 0 ? '+' : ''}${s.slope.toFixed(1)}%/10%`;
  });

  if (lang === 'ar') {
    return `تم تحليل ${analyzedDays} يوم. الارتباطات المكتشفة:\n\n${lines.join('\n')}\n\nاكتب الفقرة (3-5 جمل):`;
  }
  return `Analyzed ${analyzedDays} days. Detected correlations:\n\n${lines.join('\n')}\n\nWrite the paragraph (3-5 sentences):`;
}

/* ─── Strength label ─── */
export function strengthLabel(r: number, lang: Lang): 'strong' | 'moderate' | 'weak' {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.5) return 'moderate';
  return 'weak';
}