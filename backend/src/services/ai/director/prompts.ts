/* ═══════════════════════════════════════════════════════════
   Director Mode — Prompts
   Three LLM calls per session:
   1. Generate initial script
   2. Decide after each round
   3. Generate final summary
   ═══════════════════════════════════════════════════════════ */

import type { Lang, DirectorRound, DirectorCheckpoint, DirectorContext } from './types.js';

/* ═══════════════════════════════════════════════════════════
   1. INITIAL SCRIPT GENERATION
   ═══════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPT_SCRIPT_EN = `You design a short cognitive training session (4-6 rounds) for a player.

You receive:
1. PLAYER CONTEXT (accuracy, weaknesses, streak, fatigue).
2. CANDIDATES (a whitelist of games to choose from).

YOUR JOB:
Output a session script as JSON with 4-6 rounds.

RULES:
- Pick games ONLY from the CANDIDATES list. Any invented game_id = failure.
- Structure: 1 warmup, 2-3 main rounds, 1 light finish.
- Each round should be 2-4 minutes.
- Total session 8-15 minutes.
- If a weakness domain is listed, at least 2 rounds should target it.
- Each "reason" must reference the player's data (max 20 words).
- The "rationale" summarizes the whole plan (max 40 words).
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- No hype words. No exclamation marks. No emojis.

OUTPUT (JSON only, no markdown):
{
  "rounds": [
    {
      "round_number": 1,
      "game_id": "string",
      "game_name": "string",
      "domain_id": "string",
      "mode": "warmup" | "train" | "challenge" | "recovery",
      "target_level": 3,
      "estimated_minutes": 2,
      "reason": "string (max 20 words)"
    }
  ],
  "rationale": "string (max 40 words)"
}`;

export const SYSTEM_PROMPT_SCRIPT_AR = `أنت مصمم جلسة تدريب معرفي قصيرة (4-6 جولات) للاعب.

هتستقبل:
1. سياق اللاعب (دقة، نقاط ضعف، streak، إجهاد).
2. المرشحين (قائمة ألعاب مسموح تختار منها).

مهمتك:
طوّر سكريبت جلسة JSON فيه 4-6 جولات.

قواعد:
- اختار ألعاب من قائمة المرشحين فقط. أي game_id مخترع = فشل.
- البنية: جولة تسخين، 2-3 جولات أساسية، جولة ختام خفيفة.
- كل جولة 2-4 دقايق.
- الجلسة كلها 8-15 دقيقة.
- لو فيه domain ضعيف، لازم جولتين على الأقل يستهدفوه.
- كل "reason" لازم يشير لبيانات اللاعب (max 20 كلمة).
- الـ "rationale" يلخص الخطة (max 40 كلمة).
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع كلمات مبالغ فيها. ممنوع علامات تعجب. ممنوع إيموجي.

المخرجات (JSON فقط، بدون markdown):
{
  "rounds": [
    {
      "round_number": 1,
      "game_id": "معرّف",
      "game_name": "اسم",
      "domain_id": "معرّف",
      "mode": "warmup" | "train" | "challenge" | "recovery",
      "target_level": 3,
      "estimated_minutes": 2,
      "reason": "نص (max 20 كلمة)"
    }
  ],
  "rationale": "نص (max 40 كلمة)"
}`;

/* ═══════════════════════════════════════════════════════════
   2. DECISION AFTER ROUND
   ═══════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPT_DECISION_EN = `You decide what to do next after a training round.

You receive:
1. SESSION CONTEXT (progress, averages, tier).
2. ORIGINAL SCRIPT (rounds 1-5 as planned).
3. LATEST ROUND RESULT (accuracy, RT, level).

DECIDE ONE OF:
- "continue" — player is on track, next round goes as planned
- "adjust" — change the next round (easier / different game / skip ahead)
- "end_early" — stop the session now (fatigue, low performance, or goal reached)

RULES:
- If the last round accuracy < 50%, prefer "adjust" (easier next round).
- If 2 consecutive rounds < 55%, prefer "end_early" with a supportive reason.
- If the player is crushing it (3 rounds > 92%), you may skip ahead to a "challenge".
- If session_duration > 20 minutes, prefer "end_early".
- next_round.game_id must be from the original script OR from the CANDIDATES list.
- "reason" max 20 words. "nudge" max 12 words (or null).
- Never mention IQ, ADHD, diagnoses. No hype words. No exclamation marks.

OUTPUT (JSON only, no markdown):
{
  "action": "continue" | "adjust" | "end_early",
  "next_round": { ...full round object... } | null,
  "reason": "string (max 20 words)",
  "nudge": "string (max 12 words)" | null,
  "session_progress": 0.6
}`;

export const SYSTEM_PROMPT_DECISION_AR = `أنت تقرر إيه اللي بعده بعد جولة تدريب.

هتستقبل:
1. سياق الجلسة (تقدم، متوسطات، tier).
2. السكريبت الأصلي (الجولات 1-5 زي ما اتخططوا).
3. نتيجة آخر جولة (دقة، زمن، مستوى).

قرر واحد من:
- "continue" — اللاعب على المسار، الجولة الجاية زي ما اتخططة
- "adjust" — غيّر الجولة الجاية (أسهل / لعبة مختلفة / تخطي للأمام)
- "end_early" — أوقف الجلسة دلوقتي (إجهاد، أداء ضعيف، أو الهدف اتحقق)

قواعد:
- لو دقة آخر جولة < 50%، فضّل "adjust" (جولة أسهل).
- لو جولتين ورا بعض < 55%، فضّل "end_early" بسبب داعم.
- لو اللاعب شغال حلو (3 جولات > 92%)، ممكن تتخطى لتحدي.
- لو الجلسة > 20 دقيقة، فضّل "end_early".
- next_round.game_id لازم يكون من السكريبت الأصلي أو من قائمة المرشحين.
- الـ "reason" max 20 كلمة. الـ "nudge" max 12 كلمة (أو null).
- ممنوع ذكر الذكاء أو ADHD أو تشخيص. ممنوع مبالغة. بدون علامات تعجب.

المخرجات (JSON فقط، بدون markdown):
{
  "action": "continue" | "adjust" | "end_early",
  "next_round": { ...full round object... } | null,
  "reason": "نص (max 20 كلمة)",
  "nudge": "نص (max 12 كلمة)" | null,
  "session_progress": 0.6
}`;

/* ═══════════════════════════════════════════════════════════
   3. FINAL SUMMARY
   ═══════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPT_FINAL_EN = `You write a short end-of-session summary.

Write 3-5 sentences describing:
- What was completed
- The strongest and weakest moments
- One clear next-step recommendation

RULES:
- Mention at least 2 concrete numbers (accuracy, RT, rounds).
- No clinical claims. No IQ. No ADHD. No diagnoses.
- No hype words. No exclamation marks. No emojis.
- Tone: calm analyst.
- Never compare the user to other people.

OUTPUT (JSON only, no markdown):
{
  "final_script": "string (3-5 sentences)",
  "highlights": ["bullet 1", "bullet 2", "bullet 3"],
  "next_recommendation": "string (1 sentence)"
}`;

export const SYSTEM_PROMPT_FINAL_AR = `أنت كاتب ملخص قصير لنهاية الجلسة.

اكتب 3-5 جمل تصف:
- اللي اتم
- أقوى وأضعف لحظات
- توصية واحدة واضحة للخطوة الجاية

قواعد:
- اذكر رقمين على الأقل (دقة، زمن، عدد جولات).
- ممنوع أي ادعاء طبي. ممنوع IQ. ممنوع ADHD. ممنوع تشخيص.
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب. بدون إيموجي.
- النبرة: محلل هادئ.
- ممنوع مقارنة المستخدم بغيره.

المخرجات (JSON فقط، بدون markdown):
{
  "final_script": "نص (3-5 جمل)",
  "highlights": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "next_recommendation": "نص (جملة واحدة)"
}`;

/* ═══════════════════════════════════════════════════════════
   USER PROMPT BUILDERS
   ═══════════════════════════════════════════════════════════ */

function fmt(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}

export interface ScriptCandidate {
  game_id: string;
  game_name: string;
  domain_id: string;
  current_level: number;
  rule_reason: string;
}

export function buildScriptPrompt(
  ctx: DirectorContext,
  candidates: ScriptCandidate[],
  lang: Lang
): string {
  const ctxLines = [
    `total_sessions: ${ctx.total_sessions}`,
    `avg_accuracy_7d: ${fmt(ctx.avg_accuracy_7d)}%`,
    `days_since_last: ${ctx.days_since_last ?? 'n/a'}`,
    `top_strengths: ${ctx.top_strengths.join(', ') || '(none)'}`,
    `top_weaknesses: ${ctx.top_weaknesses.join(', ') || '(none)'}`,
    `evidence_tier: ${ctx.evidence_tier}`,
  ];

  const candLines = candidates.map(
    (c, i) =>
      `${i + 1}. game_id="${c.game_id}" | name="${c.game_name}" | domain=${c.domain_id} | level=${c.current_level} | why="${c.rule_reason}"`
  );

  if (lang === 'ar') {
    return `سياق اللاعب:\n\n${ctxLines.join('\n')}\n\nالمرشحون (اختر من القايمة دي بس):\n\n${candLines.join('\n')}\n\nابني السكريبت (4-6 جولات):`;
  }
  return `Player context:\n\n${ctxLines.join('\n')}\n\nCandidates (pick ONLY from this list):\n\n${candLines.join('\n')}\n\nBuild the script (4-6 rounds):`;
}

export function buildDecisionPrompt(
  ctx: DirectorContext,
  script: { rounds: DirectorRound[]; rationale: string },
  latest: DirectorCheckpoint,
  lang: Lang
): string {
  const ctxLines = [
    `rounds_completed: ${ctx.rounds_completed} / ${ctx.rounds_planned}`,
    `session_duration_ms: ${ctx.session_duration_ms}`,
    `session_avg_accuracy: ${fmt(ctx.session_avg_accuracy)}%`,
    `consecutive_low_rounds: ${ctx.consecutive_low_rounds}`,
  ];

  const scriptLines = script.rounds.map(
    (r) =>
      `  R${r.round_number}: [${r.mode}] ${r.game_name} @ level ${r.target_level} (${r.estimated_minutes}min)`
  );

  const latestLine = `  R${latest.round_number}: accuracy=${fmt(latest.accuracy)}%, rt=${Math.round(latest.median_rt_ms)}ms, level=${latest.level_reached}, duration=${latest.duration_ms}ms`;

  if (lang === 'ar') {
    return `سياق الجلسة:\n\n${ctxLines.join('\n')}\n\nالسكريبت الأصلي:\n${scriptLines.join('\n')}\n\nآخر جولة:\n${latestLine}\n\nقرر إيه اللي بعد كده (JSON):`;
  }
  return `Session context:\n\n${ctxLines.join('\n')}\n\nOriginal script:\n${scriptLines.join('\n')}\n\nLatest round:\n${latestLine}\n\nDecide next step (JSON):`;
}

export function buildFinalPrompt(
  ctx: DirectorContext,
  script: { rounds: DirectorRound[] },
  checkpoints: DirectorCheckpoint[],
  lang: Lang
): string {
  const completed = checkpoints.map(
    (c) => `  R${c.round_number}: ${fmt(c.accuracy)}% | ${Math.round(c.median_rt_ms)}ms | level ${c.level_reached}`
  );

  const ctxLines = [
    `planned_rounds: ${script.rounds.length}`,
    `completed_rounds: ${checkpoints.length}`,
    `session_avg_accuracy: ${fmt(ctx.session_avg_accuracy)}%`,
  ];

  if (lang === 'ar') {
    return `سياق الجلسة:\n\n${ctxLines.join('\n')}\n\nالجولات المكتملة:\n${completed.join('\n') || '  (مفيش)'}\n\nاكتب الملخص النهائي (JSON):`;
  }
  return `Session context:\n\n${ctxLines.join('\n')}\n\nCompleted rounds:\n${completed.join('\n') || '  (none)'}\n\nWrite the final summary (JSON):`;
}