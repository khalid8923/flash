/* ═══════════════════════════════════════════════════════════
   FLASH - Claims Lexicon (M6-03 / M2-07)
   Centralized banned claims + hype words (EN + AR).
   Used by AI validator before any output reaches users.
   ═══════════════════════════════════════════════════════════ */

/* ═══ L4 Clinical claims (ABSOLUTELY PROHIBITED) ═══ */
export const L4_EN: RegExp[] = [
  /\bADHD\b/i, /\bautis(m|tic)\b/i, /\bdepress(ion|ed)\b/i, /\banxiety disorder\b/i,
  /\bdiagnos(is|e|ed)\b/i, /\bdisorder\b/i, /\bmedical\b/i, /\bclinical\b/i,
  /\btherapy\b/i, /\btreatment\b/i, /\bcure\b/i, /\bpatient\b/i,
  /\bbrain age\b/i, /\bIQ\s*(score|test|boost)\b/i,
  /\bprevent(s)? (cognitive )?decline\b/i,
  /\bAlzheimer\b/i, /\bdementia\b/i, /\bParkinson\b/i,
  /\bmental (illness|health condition)\b/i,
];

export const L4_AR: RegExp[] = [
  /التوحد/, /الاكتئاب/, /القلق المرضي/, /اضطراب/,
  /(?:تشخيص|علاج|استشارة|حالة|فحص|تقويم)\s+طبي/,
  /معالج(?:ة)? نفسي/, /مريض/, /شفاء/,
  /العمر العقلي/, /(?:رفع|زيادة) الذكاء/,
  /(?:الوقاية من|منع) التدهور المعرفي/,
  /الزهايمر/, /الخرف/, /باركنسون/,
];

/* ═══ Hype words (marketing overreach) ═══ */
export const HYPE_EN: RegExp[] = [
  /\bmiracle\b/i, /\bgenius\b/i, /\bguaranteed\b/i,
  /\bboost your brain\b/i, /\bsupercharge\b/i,
  /\bunlock your (full )?potential\b/i,
  /\bsecrets? of\b/i, /\brevolutionary\b/i,
  /!{2,}/, // Multiple exclamation marks
];

export const HYPE_AR: RegExp[] = [
  /عبقري/, /معجزة/, /مضمون/, /(?:نشّ?ط|فعّل) عقلك/,
  /سر(?: الأسرار| النجاح)/, /ثوري/,
];

/* ═══ API ═══ */
export interface ClaimsCheck {
  ok: boolean;
  violations: Array<{ type: 'l4' | 'hype'; lang: 'en' | 'ar'; pattern: string }>;
}

function findMatches(text: string, patterns: RegExp[], type: 'l4' | 'hype', lang: 'en' | 'ar') {
  const out: ClaimsCheck['violations'] = [];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) out.push({ type, lang, pattern: p.source });
  }
  return out;
}

export function checkClaims(text: string): ClaimsCheck {
  const violations = [
    ...findMatches(text, L4_EN, 'l4', 'en'),
    ...findMatches(text, L4_AR, 'l4', 'ar'),
    ...findMatches(text, HYPE_EN, 'hype', 'en'),
    ...findMatches(text, HYPE_AR, 'hype', 'ar'),
  ];
  return { ok: violations.length === 0, violations };
}

export function isSafeText(text: string): boolean {
  return checkClaims(text).ok;
}