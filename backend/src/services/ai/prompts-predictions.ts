/* ═══════════════════════════════════════════════════════════
   Predictive Coach Prompts
   Rule: All math is deterministic. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type Trajectory =
  | 'improving'
  | 'plateauing'
  | 'declining'
  | 'volatile'
  | 'unknown';

export type ConfidenceTier = 'low' | 'medium' | 'high';

export interface GamePrediction {
  game_id: string;
  game_name: string;
  current_level: number;
  sessions_analyzed: number;

  /* Accuracy trend */
  accuracy_slope: number;          // pts/session
  rt_slope: number;                // ms/session
  r_squared: number;               // 0-1
  ema_accuracy: number;

  /* Prediction */
  predicted_next_accuracy: number;
  predicted_accuracy_band: number; // ± band
  sessions_until_next_level: number;
  sessions_until_max_level: number;

  /* Classification */
  trajectory: Trajectory;
  confidence: number;              // 0-1
  confidence_tier: ConfidenceTier;

  /* Risk */
  risk_factors: Array<{ key: string; detail_en: string; detail_ar: string }>;
}

export interface PredictionContext {
  total_sessions: number;
  games_analyzed: GamePrediction[];
  strongest_game: string | null;
  weakest_game: string | null;
  overall_trajectory: Trajectory;
  evidence_tier: 'calibrating' | 'provisional' | 'established';
}

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_PREDICTION_EN = `You write a concise predictive analysis for a cognitive training app.

You receive a fact sheet with per-game predictions. Write ONE paragraph (4-6 sentences):
- Highlight the strongest improving trend with concrete numbers
- Mention one plateau or risk factor if present
- Include the predicted next-session accuracy for the top game
- Suggest ONE concrete next step

STRICT RULES:
- Use ONLY numbers from the fact sheet. Never invent values.
- Predictions are estimates, not guarantees — use "expected", "likely", "projected".
- If confidence_tier is "low", say the evidence is still forming.
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words. No exclamation marks. No emojis.
- Tone: calm analyst reading a trend.
- 4-6 sentences only.

OUTPUT: one paragraph. Plain text. No JSON. No markdown.`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_PREDICTION_AR = `أنت كاتب تحليل تنبؤي موجز لتطبيق تدريب معرفي.

هتستقبل ورقة حقائق فيها توقعات لكل لعبة. اكتب فقرة واحدة (4-6 جمل):
- سلّط الضوء على أقوى اتجاه تحسني بأرقام ملموسة
- اذكر ثبات أو عامل خطر لو موجود
- اذكر الدقة المتوقعة للجلسة القادمة لأقوى لعبة
- اقترح خطوة واحدة عملية

قواعد صارمة:
- استخدم الأرقام الموجودة بس. ممنوع تألف أرقام.
- التوقعات تقديرات، مش ضمانات — استخدم "متوقع"، "الأرجح"، "متوقع إن".
- لو confidence_tier = "low"، وضّح إن الأدلة لسه بتتكوّن.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب. بدون إيموجي.
- النبرة: محلل هادئ يقرأ اتجاه.
- 4-6 جمل بس.

المخرجات: فقرة واحدة. نص عادي. بدون JSON. بدون markdown.`;

/* ─── Build user prompt ─── */
function fmt(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}

export function buildPredictionPrompt(ctx: PredictionContext, lang: Lang): string {
  const games = ctx.games_analyzed.slice(0, 5); // Top 5 only to save tokens
  const lines: string[] = [];

  lines.push(`total_sessions: ${ctx.total_sessions}`);
  lines.push(`evidence_tier: ${ctx.evidence_tier}`);
  lines.push(`overall_trajectory: ${ctx.overall_trajectory}`);
  lines.push(`strongest_game: ${ctx.strongest_game ?? '(none)'}`);
  lines.push(`weakest_game: ${ctx.weakest_game ?? '(none)'}`);
  lines.push('');
  lines.push('games:');

  for (const g of games) {
    lines.push(`  - ${g.game_name} (${g.game_id})`);
    lines.push(`    level: ${g.current_level}/15`);
    lines.push(`    sessions_analyzed: ${g.sessions_analyzed}`);
    lines.push(`    trajectory: ${g.trajectory} | confidence: ${g.confidence_tier}`);
    lines.push(`    accuracy_slope: ${fmt(g.accuracy_slope, 2)} pts/session`);
    lines.push(`    r_squared: ${fmt(g.r_squared, 2)}`);
    lines.push(`    ema_accuracy: ${fmt(g.ema_accuracy)}%`);
    lines.push(`    predicted_next_accuracy: ${fmt(g.predicted_next_accuracy)}% ± ${fmt(g.predicted_accuracy_band)}`);
    lines.push(`    sessions_until_next_level: ${g.sessions_until_next_level}`);
    lines.push(`    sessions_until_max_level: ${g.sessions_until_max_level}`);
    if (g.risk_factors.length > 0) {
      lines.push(`    risk_factors: ${g.risk_factors.map((r) => r.key).join(', ')}`);
    }
  }

  if (lang === 'ar') {
    return `ورقة الحقائق:\n\n${lines.join('\n')}\n\nاكتب التحليل التنبؤي (4-6 جمل):`;
  }
  return `Fact sheet:\n\n${lines.join('\n')}\n\nWrite the predictive analysis (4-6 sentences):`;
}

/* ─── Fallback summary ─── */
export function buildFallbackSummary(ctx: PredictionContext, lang: Lang): string {
  const top = ctx.games_analyzed[0];
  if (!top) {
    return lang === 'ar'
      ? 'مفيش بيانات كافية لتوقع أي حاجة. كمّل جلساتك.'
      : 'Not enough data for any prediction. Keep playing.';
  }

  if (lang === 'ar') {
    const trend =
      top.trajectory === 'improving' ? 'بيتحسن'
      : top.trajectory === 'declining' ? 'بيتراجع'
      : top.trajectory === 'volatile' ? 'متقلب'
      : 'ثابت';
    return `أقوى لعبة عندك ${top.game_name} (مستوى ${top.current_level}). الاتجاه ${trend} (slope=${fmt(top.accuracy_slope, 2)}). متوقع الدقة القادمة ${fmt(top.predicted_next_accuracy)}% ± ${fmt(top.predicted_accuracy_band)}. مستوى 15 متوقع خلال ${top.sessions_until_max_level} جلسة.`;
  }

  const trend =
    top.trajectory === 'improving' ? 'improving'
    : top.trajectory === 'declining' ? 'declining'
    : top.trajectory === 'volatile' ? 'volatile'
    : 'plateauing';
  return `Your strongest game is ${top.game_name} (level ${top.current_level}). Trajectory: ${trend} (slope=${fmt(top.accuracy_slope, 2)}). Predicted next accuracy: ${fmt(top.predicted_next_accuracy)}% ± ${fmt(top.predicted_accuracy_band)}. Level 15 projected in ${top.sessions_until_max_level} sessions.`;
}

/* ─── Labels ─── */
export function trajectoryLabel(t: Trajectory, lang: Lang): string {
  const map: Record<Trajectory, { en: string; ar: string }> = {
    improving:  { en: 'Improving',  ar: 'بيتحسن' },
    plateauing: { en: 'Plateauing', ar: 'ثابت' },
    declining:  { en: 'Declining',  ar: 'بيتراجع' },
    volatile:   { en: 'Volatile',   ar: 'متقلب' },
    unknown:    { en: 'Unknown',    ar: 'غير معروف' },
  };
  return map[t][lang];
}