/* ============================================================
   FLASH Backend - AI Fallback Policy
   When all providers fail, return SAFE defaults instead of error
   No player data is ever invented; no L4 claims; no fake metrics
   ============================================================ */

export type FallbackKind =
  | 'nudge'
  | 'chat'
  | 'difficulty'
  | 'content'
  | 'recommendation'
  | 'insight';

export interface FallbackResult<T = unknown> {
  source: 'fallback';
  provider: 'none';
  model: 'fallback/policy';
  language: 'en' | 'ar';
  latency_ms: 0;
  data: T;
}

/* ============================================================
   NEUTRAL MESSAGES (no claims, no advice, no diagnosis)
   ============================================================ */
const MESSAGES = {
  en: {
    chat: 'The AI coach is temporarily unavailable. Your data is safe — try again in a few minutes.',
    nudge: 'Take a breath.',
    insight: 'Keep your routine steady this week.',
    recommendation: 'Continue with your current plan.'
  },
  ar: {
    chat: 'المساعد الذكي مش متاح مؤقتًا. بياناتك بأمان — جرّب تاني بعد شوية.',
    nudge: 'خد نفس.',
    insight: 'حافظ على روتينك هذا الأسبوع.',
    recommendation: 'كمّل على خطتك الحالية.'
  }
};

/* ============================================================
   FALLBACK BUILDERS
   ============================================================ */
export function fallbackNudge(language: 'en' | 'ar'): FallbackResult<{ message: string; trigger: string }> {
  return {
    source: 'fallback',
    provider: 'none',
    model: 'fallback/policy',
    language,
    latency_ms: 0,
    data: {
      message: MESSAGES[language].nudge,
      trigger: 'system_fallback'
    }
  };
}

export function fallbackChat(language: 'en' | 'ar'): FallbackResult<{ reply: string }> {
  return {
    source: 'fallback',
    provider: 'none',
    model: 'fallback/policy',
    language,
    latency_ms: 0,
    data: { reply: MESSAGES[language].chat }
  };
}

export function fallbackDifficulty(currentLevel: number): FallbackResult<{ level: number; reason_code: string }> {
  /* Rule: stay at the current level — never invent progression */
  const safeLevel = Math.max(1, Math.min(15, Math.floor(currentLevel) || 3));
  return {
    source: 'fallback',
    provider: 'none',
    model: 'fallback/policy',
    language: 'en',
    latency_ms: 0,
    data: {
      level: safeLevel,
      reason_code: 'HOLD_IN_BAND'
    }
  };
}

export function fallbackRecommendation(language: 'en' | 'ar'): FallbackResult<{ message: string }> {
  return {
    source: 'fallback',
    provider: 'none',
    model: 'fallback/policy',
    language,
    latency_ms: 0,
    data: { message: MESSAGES[language].recommendation }
  };
}

export function fallbackInsight(language: 'en' | 'ar'): FallbackResult<{ insight: string; source: string }> {
  return {
    source: 'fallback',
    provider: 'none',
    model: 'fallback/policy',
    language,
    latency_ms: 0,
    data: {
      insight: MESSAGES[language].insight,
      source: 'no_data'
    }
  };
}

/* ============================================================
   UNIFIED ENTRYPOINT
   ============================================================ */
export function getFallback<T>(kind: FallbackKind, opts: {
  language?: 'en' | 'ar';
  currentLevel?: number;
} = {}): FallbackResult<T> {
  const lang = opts.language === 'ar' ? 'ar' : 'en';

  switch (kind) {
    case 'nudge':          return fallbackNudge(lang) as FallbackResult<T>;
    case 'chat':           return fallbackChat(lang) as FallbackResult<T>;
    case 'difficulty':     return fallbackDifficulty(opts.currentLevel ?? 3) as FallbackResult<T>;
    case 'recommendation': return fallbackRecommendation(lang) as FallbackResult<T>;
    case 'insight':        return fallbackInsight(lang) as FallbackResult<T>;
    case 'content':
    default:               return fallbackChat(lang) as FallbackResult<T>;
  }
}

/* ============================================================
   GUARD — never throw, always returns something usable
   ============================================================ */
export async function withFallback<T>(
  fn: () => Promise<T>,
  kind: FallbackKind,
  opts?: { language?: 'en' | 'ar'; currentLevel?: number }
): Promise<T | FallbackResult<T>> {
  try {
    return await fn();
  } catch (err) {
    /* Log for diagnosis, but never surface error to caller */
    console.warn('[ai-fallback] provider failure -> fallback', { kind, error: (err as Error).message });
    return getFallback<T>(kind, opts || {});
  }
}