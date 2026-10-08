/* ═══════════════════════════════════════════════════════════
   Micro-Lessons Prompts
   5 topics tied to cognitive domains + error patterns.
   Each lesson: 60-second read, real citation, related games.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type LessonTopic =
  | 'working_memory'
  | 'attention_control'
  | 'processing_speed'
  | 'inhibitory_control'
  | 'cognitive_flexibility';

export interface LessonContext {
  topic: LessonTopic;
  trigger_reason: string;      // why we picked this topic
  user_weakness_domain: string | null;
  user_weakness_score: number | null;
  related_games: string[];      // 2-3 game_ids
}

/* ─── Topic descriptors ─── */
export const TOPIC_META: Record<LessonTopic, {
  en_title: string;
  ar_title: string;
  citation: string;
  domain_hint: string;
}> = {
  working_memory: {
    en_title: 'Working Memory & The N-Back',
    ar_title: 'الذاكرة العاملة و N-Back',
    citation: 'Jaeggi, S. M., et al. (2008). PNAS, 105(19), 6829-6833.',
    domain_hint: 'memory',
  },
  attention_control: {
    en_title: 'Attention Control & The Flanker Task',
    ar_title: 'التحكم في الانتباه ومهمة Flanker',
    citation: 'Eriksen, B. A., & Eriksen, C. W. (1974). Perception & Psychophysics, 16(1), 143-149.',
    domain_hint: 'attention',
  },
  processing_speed: {
    en_title: 'Processing Speed & Reaction Time',
    ar_title: 'سرعة المعالجة وزمن الاستجابة',
    citation: 'Ball, K., et al. (2002). JAMA, 288(18), 2271-2281.',
    domain_hint: 'speed',
  },
  inhibitory_control: {
    en_title: 'Inhibitory Control & The Go/No-Go Task',
    ar_title: 'التحكم المثبط ومهمة Go/No-Go',
    citation: 'Drewe, E. A. (1975). Cortex, 11(1), 8-16.',
    domain_hint: 'attention',
  },
  cognitive_flexibility: {
    en_title: 'Cognitive Flexibility & Task Switching',
    ar_title: 'المرونة المعرفية وتبديل المهام',
    citation: 'Monsell, S. (2003). Trends in Cognitive Sciences, 7(3), 134-140.',
    domain_hint: 'attention',
  },
};

/* ─── EN System Prompt ─── */
export const SYSTEM_PROMPT_LESSON_EN = `You write a 60-second micro-lesson about cognitive science for a training app.

You will receive:
- Topic (with a real academic citation)
- Player context (why this topic was chosen)
- Related games

YOUR JOB:
Write a short lesson as JSON with:
- "title": engaging but serious (max 8 words)
- "body": 2-3 short paragraphs, TOTAL 90-130 words, plain language
- "takeaway": one actionable sentence (max 20 words)

STRUCTURE OF body:
1. What this cognitive skill is (1-2 sentences)
2. Why it matters in daily life (1-2 sentences)
3. How this specific game trains it (1-2 sentences)

STRICT RULES:
- Mention the citation's authors + year in "body" naturally (one mention).
- Never mention IQ, ADHD, diagnoses, or any clinical term.
- Never claim medical or therapeutic benefits.
- 🚫 Do NOT write "medical", "clinically", or disclaimers like "not medical advice".
- No hype words ("miracle", "genius"). No exclamation marks. No emojis.
- Talk to the player in second person ("you", "your brain").
- Tone: thoughtful science writer, calm.
- Do NOT invent statistics. Only reference the given citation.

OUTPUT (JSON only, no markdown):
{
  "title": "string",
  "body": "string (90-130 words, 2-3 paragraphs separated by \\n\\n)",
  "takeaway": "string (max 20 words)"
}`;

/* ─── AR System Prompt ─── */
export const SYSTEM_PROMPT_LESSON_AR = `أنت كاتب درس صغير (60 ثانية) عن علم الأعصاب لتطبيق تدريب معرفي.

هتستقبل:
- الموضوع (مع citation أكاديمي حقيقي)
- سياق اللاعب (ليه اخترنا الموضوع ده)
- ألعاب مرتبطة

مهمتك:
اكتب درس قصير كـ JSON فيه:
- "title": جذاب بس جدي (max 8 كلمة)
- "body": 2-3 فقرات قصيرة، الإجمالي 90-130 كلمة، بلغة بسيطة
- "takeaway": جملة واحدة عملية (max 20 كلمة)

بنية الـ body:
1. إيه المهارة المعرفية دي (1-2 جملة)
2. ليه مهمة في الحياة اليومية (1-2 جملة)
3. إزاي اللعبة دي بتدربها (1-2 جملة)

قواعد صارمة:
- اذكر اسم المؤلف والسنة في الـ body بشكل طبيعي (مرة واحدة).
- 🚫 الـ body لا يزيد عن 130 كلمة بالكتير. لو زاد، اتقطع للجملة الأخيرة المكتملة.
- 🚫 اكتب 2-3 جمل لكل فقرة، مش 4-5.
- ممنوع ذكر الذكاء أو ADHD أو أي مصطلح طبي.
- ممنوع ادعاء فائدة علاجية.
- 🚫 ممنوع كلمة "طبي" أو "طبية" أو "طبية" حتى في النفي.
- 🚫 ممنوع كتابة disclaimers مثل "غير طبي" أو "استشر طبيبك".
- ممنوع كلمات مبالغ فيها. بدون علامات تعجب. بدون إيموجي.
- كلم اللاعب بصيغة المخاطب.
- النبرة: كاتب علمي هادئ.
- ممنوع تألف أرقام. استخدم بس الـ citation المعطى.

المخرجات (JSON فقط، بدون markdown):
{
  "title": "نص",
  "body": "نص (90-130 كلمة، 2-3 فقرات مفصولة بـ \\n\\n)",
  "takeaway": "نص (max 20 كلمة)"
}`;

/* ─── User prompt builder ─── */
export function buildLessonUserPrompt(ctx: LessonContext, lang: Lang): string {
  const meta = TOPIC_META[ctx.topic];
  const title = lang === 'ar' ? meta.ar_title : meta.en_title;
  const weakText = ctx.user_weakness_domain
    ? `${ctx.user_weakness_domain} (${ctx.user_weakness_score?.toFixed(0) ?? '?'}%)`
    : '(none)';

  const lines = [
    `topic: ${ctx.topic}`,
    `suggested_title: ${title}`,
    `citation: ${meta.citation}`,
    `trigger_reason: ${ctx.trigger_reason}`,
    `player_weakness: ${weakText}`,
    `related_games: ${ctx.related_games.join(', ')}`,
  ];

  if (lang === 'ar') {
    return `معلومات الدرس:\n\n${lines.join('\n')}\n\nاكتب الدرس (JSON):`;
  }
  return `Lesson brief:\n\n${lines.join('\n')}\n\nWrite the lesson (JSON):`;
}