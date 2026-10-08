/* ═══════════════════════════════════════════════════════════
   Cognitive Fingerprint Prompts
   Rule: LLM phrases a fixed fact sheet. Never invents.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type Archetype =
  | 'sharp_shooter'
  | 'impulsive'
  | 'methodical'
  | 'cautious'
  | 'balanced'
  | 'exploring'
  | 'specialist'
  | 'explorer';

export type Modifier = 'learner' | 'plateaued' | 'variable' | 'specialist' | 'generalist';

export interface FingerprintFactSheet {
  archetype: Archetype;
  modifiers: Modifier[];
  sessions_used: number;
  evidence_tier: 'calibrating' | 'provisional' | 'established';
  avg_accuracy: number;
  median_rt_ms: number;
  rt_std_ms: number;
  accuracy_slope: number;
  top_domain: string | null;
  top_domain_accuracy: number | null;
  weakest_domain: string | null;
  weakest_domain_accuracy: number | null;
  unique_games_played: number;
  domains_touched: number;
}

/* --- EN System Prompt --- */
export const SYSTEM_PROMPT_FINGERPRINT_EN = `You write short cognitive fingerprints for a training app.

You will receive a fact sheet about a player's cognitive style.
Write ONE concise paragraph (3-5 sentences) that describes this player as a distinct "type".

STRICT RULES:
- Use the archetype name EXACTLY as given (e.g., "Sharp Shooter").
- Mention at least 2 concrete numbers (accuracy, RT, slope, domains).
- Reference the top domain and weakest domain by name if available.
- If evidence_tier is "calibrating", note the profile is still forming.
- No clinical claims. No IQ. No diagnoses. No ADHD. No medical terms.
- No hype words ("miracle", "genius"). No exclamation marks. No emojis.
- Tone: calm analyst observing a pattern.
- 3-5 sentences only.

OUTPUT: one paragraph. Plain text. No JSON. No markdown.`;

/* --- AR System Prompt --- */
export const SYSTEM_PROMPT_FINGERPRINT_AR = `أنت كاتب بصمات معرفية قصيرة لتطبيق تدريب.

هتستقبل ورقة حقائق عن أسلوب اللاعب المعرفي.
اكتب فقرة واحدة من 3-5 جمل تصف اللاعب كنوع مميز.

قواعد صارمة:
- استخدم اسم الـ archetype زي ما هو مكتوب (مثلاً "Sharp Shooter" أو "Specialist").
- اذكر رقمين على الأقل (دقة، زمن، منحدر، عدد domains).
- اذكر أقوى مجال وأضعف مجال بالاسم لو موجودين.
- لو evidence_tier = "calibrating"، وضّح إن البصمة لسه بتتكوّن.
- ممنوع أي ادعاء طبي أو تشخيصي. ممنوع IQ. ممنوع ADHD.
- ممنوع كلمات مبالغ فيها. ممنوع علامات تعجب. ممنوع إيموجي.
- النبرة: محلل هادئ يلاحظ نمط.
- 3-5 جمل بس.

المخرجات: فقرة واحدة. نص عادي. بدون JSON. بدون markdown.`;

/* --- Archetype -> Human name --- */
export function archetypeLabel(a: Archetype, lang: Lang): string {
  const map: Record<Archetype, { en: string; ar: string }> = {
    sharp_shooter: { en: 'Sharp Shooter', ar: 'الرامي الدقيق' },
    impulsive:     { en: 'Impulsive',     ar: 'المندفع' },
    methodical:    { en: 'Methodical',    ar: 'المنهجي' },
    cautious:      { en: 'Cautious',      ar: 'الحذر' },
    balanced:      { en: 'Balanced',      ar: 'المتوازن' },
    exploring:     { en: 'Exploring',     ar: 'المستكشف' },
    specialist:    { en: 'Specialist',    ar: 'المتخصص' },
    explorer:      { en: 'Explorer',      ar: 'الرحّالة' },
  };
  return map[a][lang];
}

/* --- Modifier -> Human description --- */
export function modifierLabel(m: Modifier, lang: Lang): string {
  const map: Record<Modifier, { en: string; ar: string }> = {
    learner:    { en: 'improving over time',   ar: 'بيتحسن مع الوقت' },
    plateaued:  { en: 'plateaued',             ar: 'وصل لمرحلة ثبات' },
    variable:   { en: 'variable pace',         ar: 'إيقاع متقلب' },
    specialist: { en: 'deep specialist',       ar: 'متخصص بعمق' },
    generalist: { en: 'broad generalist',      ar: 'عام متعدد' },
  };
  return map[m][lang];
}

/* --- Fact Sheet Serializer --- */
function fmt(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}

export function buildFingerprintUserPrompt(f: FingerprintFactSheet, lang: Lang): string {
  const archetypeName = archetypeLabel(f.archetype, lang);
  const slope =
    f.accuracy_slope >= 0.3 ? 'improving'
    : f.accuracy_slope <= -0.3 ? 'declining'
    : 'stable';

  const modifierText = f.modifiers.length
    ? f.modifiers.map((m) => modifierLabel(m, lang)).join(', ')
    : (lang === 'ar' ? '(مفيش)' : '(none)');

  const rawLines: (string | null)[] = [
    `archetype: ${archetypeName}`,
    `modifiers: ${modifierText}`,
    `sessions_used: ${f.sessions_used}`,
    `evidence_tier: ${f.evidence_tier}`,
    `avg_accuracy: ${fmt(f.avg_accuracy)}%`,
    `median_rt_ms: ${Math.round(f.median_rt_ms)}`,
    `rt_std_ms: ${Math.round(f.rt_std_ms)}`,
    `accuracy_slope_per_session: ${fmt(f.accuracy_slope, 2)} (${slope})`,
    f.top_domain ? `top_domain: ${f.top_domain} (${Math.round(f.top_domain_accuracy ?? 0)}%)` : null,
    f.weakest_domain ? `weakest_domain: ${f.weakest_domain} (${Math.round(f.weakest_domain_accuracy ?? 0)}%)` : null,
    `unique_games_played: ${f.unique_games_played}`,
    `domains_touched: ${f.domains_touched}`,
  ];
  const lines = rawLines.filter((l): l is string => l !== null);

  if (lang === 'ar') {
    return `ورقة الحقائق:\n\n${lines.join('\n')}\n\nاكتب البصمة المعرفية (3-5 جمل):`;
  }
  return `Fact sheet:\n\n${lines.join('\n')}\n\nWrite the fingerprint (3-5 sentences):`;
}