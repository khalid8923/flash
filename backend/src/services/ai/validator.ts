/* ═══════════════════════════════════════════════════════════
   AI Content Validator — Evidence Ladder enforcement
   Blocks L4 (clinical claims) + hype words + fact-sheet echoes.
   Rule: LLM phrases facts, never invents them.
   ═══════════════════════════════════════════════════════════ */

export interface ValidationIssue {
  code: string;
  detail: string;
}

export interface TextValidation {
  ok: boolean;
  issues: ValidationIssue[];
  cleaned: string;
}

export interface ShapeValidation<T = unknown> {
  ok: boolean;
  issues: ValidationIssue[];
  data?: T;
}

/* ─── L4 forbidden terms (clinical claims) ─── */
const L4_PATTERNS_EN: RegExp[] = [
  /\bADHD\b/i, /\bADD\b/i, /\bautis(?:m|tic)\b/i,
  /\bAsperger\b/i, /\bdyslexi(?:a|c)\b/i,
  /\bdepress(?:ion|ed|ive)\b/i, /\banxiety disorder\b/i,
  /\bbipolar\b/i, /\bschizophreni(?:a|c)\b/i,
  /\bPTSD\b/i, /\bOCD\b/i, /\bdiagnos(?:e|ed|is)\b/i,
  /\bdisorder\b/i, /\bsyndrome\b/i, /\bbrain age\b/i,
  /\bIQ\b/i, /\bmental illness\b/i, /\bclinical(?:ly)?\b/i,
  /\btreat(?:ment|s|ing)?\b/i, /\bcure[sd]?\b/i,
  /\bprevent(?:s|ion|ing)?\b/i, /\bheal(?:s|ing)?\b/i,
  /\btherap(?:y|eutic)\b/i, /\bmedical(?:ly)?\b/i,
  /\bprescri(?:be|ption)\b/i,
];

const L4_PATTERNS_AR: RegExp[] = [
  /التوحد/, /فرط الحركة/, /الاكتئاب/, /القلق المرضي/,
  /انفصام/, /ثنائي القطب/, /اضطراب/, /متلازمة/, /تشخيص/,
  /علاج/, /شفاء/, /مرض نفسي/, /عيادة/,
  // "طبي" alone is too broad — only block real clinical contexts
  /(?:تشخيص|علاج|استشارة|حالة|فحص|تقويم)\s+طبي/,
  /طبي(?:اً|ا)\s+(?:موثق|معترف|معتمد)/,
  /عمر الدماغ/, /نسبة الذكاء/,
];

/* ─── Hype / manipulation terms ─── */
const HYPE_PATTERNS_EN: RegExp[] = [
  /\bboost your brain\b/i, /\bsupercharge\b/i,
  /\bunlock your potential\b/i, /\bgenius\b/i,
  /\bmastermind\b/i, /\bmiracle\b/i,
  /\bguaranteed\b/i, /\b100%\s+effective\b/i,
];

const HYPE_PATTERNS_AR: RegExp[] = [
  /عبقري/, /معجزة/, /مضمون/, /نشّط عقلك/, /ضاعف ذكاءك/,
];

/* ─── Echo detection: too many "key: value" lines = fact-sheet echo ─── */
const ECHO_LINE_RE = /^[a-zA-Z_\u0600-\u06FF]+:\s*.+$/;

function countEchoLines(text: string): number {
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    if (ECHO_LINE_RE.test(line.trim())) count++;
  }
  return count;
}

/* ─── Text validation ─── */
/* Detect section headers like "الخطوة التالية:" or "Next step:" on their own line */
const HEADER_LINE_RE = /^[^\n]{2,30}:\s*$/m;

export function validateAiText(
  text: unknown,
  opts: { minLen?: number; maxLen?: number } = {}
): TextValidation {
  const minLen = opts.minLen ?? 20;
  const maxLen = opts.maxLen ?? 2000;
  const issues: ValidationIssue[] = [];

  if (typeof text !== 'string') {
    return {
      ok: false,
      issues: [{ code: 'not_string', detail: `got ${typeof text}` }],
      cleaned: '',
    };
  }

  // Strip stray surrounding quotes
  let cleaned = text.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith('\u201C') && cleaned.endsWith('\u201D'))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  cleaned = cleaned.replace(/"$/, '').trim();

  // Strip exclamation marks (both ASCII and fullwidth Arabic)
  cleaned = cleaned.replace(/[!！]/g, '.').replace(/\.\s*\./g, '.').replace(/\s{2,}/g, ' ').trim();

  if (cleaned.length < minLen) {
    issues.push({ code: 'too_short', detail: `${cleaned.length} < ${minLen}` });
  }
  if (cleaned.length > maxLen) {
    issues.push({ code: 'too_long', detail: `${cleaned.length} > ${maxLen}` });
  }

  const echoLines = countEchoLines(cleaned);
  if (echoLines >= 4) {
    issues.push({ code: 'fact_sheet_echo', detail: `${echoLines} key:value lines` });
  }

  // Auto-strip standalone header lines: convert "Header:\nbody" to "Header: body"
  if (HEADER_LINE_RE.test(cleaned)) {
    cleaned = cleaned.replace(
      /^([^\n]{2,30}:)\s*\n+/gm,
      '$1 '
    ).replace(/\n{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  for (const re of L4_PATTERNS_EN) {
    if (re.test(cleaned)) issues.push({ code: 'l4_violation', detail: re.source });
  }
  for (const re of L4_PATTERNS_AR) {
    if (re.test(cleaned)) issues.push({ code: 'l4_violation_ar', detail: re.source });
  }
  for (const re of HYPE_PATTERNS_EN) {
    if (re.test(cleaned)) issues.push({ code: 'hype_violation', detail: re.source });
  }
  for (const re of HYPE_PATTERNS_AR) {
    if (re.test(cleaned)) issues.push({ code: 'hype_violation_ar', detail: re.source });
  }

  return { ok: issues.length === 0, issues, cleaned };
}

/* ─── Shape validation for /ai/generate outputs ─── */
export function validateGeneratedShape(
  data: unknown,
  requiredFields: string[]
): ShapeValidation {
  const issues: ValidationIssue[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, issues: [{ code: 'not_object', detail: 'expected plain object' }] };
  }

  const obj = data as Record<string, unknown>;
  for (const f of requiredFields) {
    if (!(f in obj) || obj[f] === null || obj[f] === undefined) {
      issues.push({ code: 'missing_field', detail: f });
    }
  }

  return { ok: issues.length === 0, issues, data: issues.length === 0 ? obj : undefined };
}

/* ─── Deterministic fallback for recap ─── */
export function safeFallbackRecap(
  accuracy: number,
  medianRtMs: number,
  levelFrom: number,
  levelTo: number,
  language: 'en' | 'ar'
): string {
  const acc = Math.round(accuracy);
  const rt = Math.round(medianRtMs);

  if (language === 'ar') {
    if (levelTo > levelFrom) {
      return `خلصت الجلسة بدقة ${acc}% ومتوسط زمن ${rt} مللي ثانية. المحرك رقّاك من مستوى ${levelFrom} إلى ${levelTo}.`;
    }
    if (levelTo < levelFrom) {
      return `خلصت الجلسة بدقة ${acc}% ومتوسط زمن ${rt} مللي ثانية. المحرك خفّضك من مستوى ${levelFrom} إلى ${levelTo} لبناء الزخم.`;
    }
    return `خلصت الجلسة بدقة ${acc}% ومتوسط زمن ${rt} مللي ثانية. المحرك ثبّتك على مستوى ${levelFrom} لترسيخ الأداء.`;
  }

  if (levelTo > levelFrom) {
    return `You finished with ${acc}% accuracy and ${rt}ms median RT. The engine promoted you from level ${levelFrom} to ${levelTo}.`;
  }
  if (levelTo < levelFrom) {
    return `You finished with ${acc}% accuracy and ${rt}ms median RT. The engine eased you from level ${levelFrom} to ${levelTo} to rebuild momentum.`;
  }
  return `You finished with ${acc}% accuracy and ${rt}ms median RT. The engine kept you at level ${levelFrom} to confirm stability.`;
}