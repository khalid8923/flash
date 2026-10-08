/* ═══════════════════════════════════════════════════════════
   Micro-Lessons Service
   Flow: pick topic (based on weakness) → cache check → LLM → store
   Rule: LLM phrases a real citation. Never invents one.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  SYSTEM_PROMPT_LESSON_EN,
  SYSTEM_PROMPT_LESSON_AR,
  buildLessonUserPrompt,
  TOPIC_META,
  type LessonContext,
  type LessonTopic,
  type Lang,
} from './prompts-micro-lessons.js';

export interface MicroLessonResult {
  topic: LessonTopic;
  title: string;
  body: string;
  takeaway: string;
  citation: string;
  related_games: string[];
  trigger_reason: string;
  source: 'llm' | 'cache' | 'rule';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
}

const CACHE_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/* ─── Topic → game_ids map ─── */
const TOPIC_GAMES: Record<LessonTopic, string[]> = {
  working_memory:       ['n-back', 'seq-mem', 'corsi-blocks'],
  attention_control:    ['flanker', 'task-switching', 'symbol-sprint'],
  processing_speed:     ['reaction', 'color-match', 'rapid-fire'],
  inhibitory_control:   ['go-no-go', 'flanker', 'vigilance'],
  cognitive_flexibility:['task-switching', 'rapid-fire', 'color-match'],
};

/* ─── Detect topic based on user's data ─── */
interface TopicDecision {
  topic: LessonTopic;
  reason_en: string;
  reason_ar: string;
  weakness_domain: string | null;
  weakness_score: number | null;
}

async function detectTopic(userId: string): Promise<TopicDecision> {
  /* Load domain averages over last 30 days */
  const domRes = await pool.query<{ domain_id: string; avg_acc: number; n: number }>(
    `SELECT g.domain_id, AVG(s.accuracy)::float AS avg_acc, COUNT(*)::int AS n
       FROM sessions s
       JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1 AND s.status='accepted' AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - INTERVAL '30 days'
      GROUP BY g.domain_id
      HAVING COUNT(*) >= 2
      ORDER BY avg_acc ASC`,
    [userId]
  );

  const weakest = domRes.rows[0] ?? null;
  const strongest = domRes.rows[domRes.rows.length - 1] ?? null;

  /* Count consecutive error patterns from engine decisions */
  const errRes = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n
       FROM engine_decisions
      WHERE user_id = $1 AND reason_code = 'HOLD_FRUSTRATION'
        AND created_at >= NOW() - INTERVAL '14 days'`,
    [userId]
  );
  const frustrations = errRes.rows[0]?.n ?? 0;

  /* Unique games played in last 30 days */
  const varietyRes = await pool.query<{ n: number }>(
    `SELECT COUNT(DISTINCT game_id)::int AS n
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
        AND ended_at >= NOW() - INTERVAL '30 days'`,
    [userId]
  );
  const variety = varietyRes.rows[0]?.n ?? 0;

  /* Priority logic */
  if (frustrations >= 3) {
    return {
      topic: 'inhibitory_control',
      reason_en: 'Several frustrating rounds recently — worth understanding impulse control.',
      reason_ar: 'عدة جولات محبطة مؤخراً — يستحق فهم التحكم في الاندفاع.',
      weakness_domain: weakest?.domain_id ?? null,
      weakness_score: weakest?.avg_acc ?? null,
    };
  }

  if (variety >= 8) {
    return {
      topic: 'cognitive_flexibility',
      reason_en: 'You train across many games — flexibility is worth understanding.',
      reason_ar: 'بتدرب على ألعاب كتير — المرونة تستحق الفهم.',
      weakness_domain: weakest?.domain_id ?? null,
      weakness_score: weakest?.avg_acc ?? null,
    };
  }

  /* Only report weakness if score is actually weak (< 80) */
  const isActuallyWeak = weakest && weakest.avg_acc < 80 && domRes.rows.length >= 2;

  if (isActuallyWeak && weakest) {
    const d = weakest.domain_id;
    const score = weakest.avg_acc.toFixed(0);
    if (d === 'memory') {
      return {
        topic: 'working_memory',
        reason_en: `Memory is your lowest domain at ${score}%.`,
        reason_ar: `الذاكرة أضعف مجال عندك بنسبة ${score}%.`,
        weakness_domain: d,
        weakness_score: weakest.avg_acc,
      };
    }
    if (d === 'speed') {
      return {
        topic: 'processing_speed',
        reason_en: `Speed is your lowest domain at ${score}%.`,
        reason_ar: `السرعة أضعف مجال عندك بنسبة ${score}%.`,
        weakness_domain: d,
        weakness_score: weakest.avg_acc,
      };
    }
    if (d === 'attention') {
      return {
        topic: 'attention_control',
        reason_en: `Attention is your lowest domain at ${score}%.`,
        reason_ar: `الانتباه أضعف مجال عندك بنسبة ${score}%.`,
        weakness_domain: d,
        weakness_score: weakest.avg_acc,
      };
    }
  }

  /* Default: working memory (most universal) */
  const totalSessionsRes = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
    [userId]
  );
  const totalSessions = totalSessionsRes.rows[0]?.n ?? 0;

  let defaultReasonEn: string;
  let defaultReasonAr: string;

  if (totalSessions < 10) {
    defaultReasonEn = `Early training phase — ${totalSessions} sessions so far. Starting with the most universal skill.`;
    defaultReasonAr = `مرحلة تدريب مبكرة — ${totalSessions} جلسات لحد دلوقتي. بنبدأ بالمهارة الأكثر شمولاً.`;
  } else if (domRes.rows.length < 3) {
    defaultReasonEn = `Only ${domRes.rows.length} domains trained so far. Working memory underpins most cognitive tasks.`;
    defaultReasonAr = `درّبت ${domRes.rows.length} مجالات بس لحد دلوقتي. الذاكرة العاملة أساس لمعظم المهام المعرفية.`;
  } else {
    defaultReasonEn = 'Working memory underpins most cognitive tasks — useful general refresher.';
    defaultReasonAr = 'الذاكرة العاملة أساس لمعظم المهام المعرفية — تمرين عام مفيد.';
  }

  return {
    topic: 'working_memory',
    reason_en: defaultReasonEn,
    reason_ar: defaultReasonAr,
    weakness_domain: null,
    weakness_score: null,
  };
}

/* ─── Fallback lesson (deterministic) ─── */
function buildFallbackLesson(
  topic: LessonTopic,
  lang: Lang
): { title: string; body: string; takeaway: string } {
  const meta = TOPIC_META[topic];
  if (lang === 'ar') {
    return {
      title: meta.ar_title,
      body:
        `${meta.ar_title} مهارة معرفية أساسية. لما بتلعب الألعاب المرتبطة، دماغك بتدرب دوائر عصبية مرتبطة بالانتباه والتحكم.\n\n` +
        `الدراسة (${meta.citation}) بتوصف المهمة الأصلية. الجلسات القصيرة المنتظمة أنسب من الجلسات الطويلة.`,
      takeaway: 'العب بانتظام - الجودة أهم من الكمية.',
    };
  }
  return {
    title: meta.en_title,
    body:
      `${meta.en_title} is a foundational cognitive skill. When you play the related games, your brain trains neural circuits tied to attention and control.\n\n` +
      `The paradigm is based on ${meta.citation} Short, regular sessions work better than long, occasional ones.`,
    takeaway: 'Play regularly - quality over quantity.',
  };
}

/* ─── Robust JSON extraction ─── */
function extractJson<T>(text: string): T | null {
  const candidates: string[] = [];
  candidates.push(text.trim());
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) candidates.push(fence[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  for (const c of candidates) {
    if (!c) continue;
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as T;
    } catch { /* try next */ }
  }
  return null;
}

/* ─── Save lesson to DB ─── */
async function saveLesson(
  topic: LessonTopic,
  language: Lang,
  title: string,
  body: string,
  citation: string,
  relatedGames: string[]
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO micro_lessons (topic, language, title, body, citation, related_games)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (topic, language) DO UPDATE
         SET title = EXCLUDED.title,
             body = EXCLUDED.body,
             citation = EXCLUDED.citation,
             related_games = EXCLUDED.related_games,
             generated_at = NOW()`,
      [topic, language, title, body, citation, JSON.stringify(relatedGames)]
    );
  } catch (err) {
    console.warn('[micro-lessons] save failed:', (err as Error).message);
  }
}

/* ─── Load cached lesson from DB ─── */
async function loadCachedLesson(
  topic: LessonTopic,
  language: Lang
): Promise<{
  title: string;
  body: string;
  citation: string;
  related_games: string[];
  generated_at: string;
} | null> {
  const res = await pool.query<{
    title: string;
    body: string;
    citation: string;
    related_games: string[] | null;
    generated_at: string;
  }>(
    `SELECT title, body, citation, related_games, generated_at
       FROM micro_lessons
      WHERE topic = $1 AND language = $2
      LIMIT 1`,
    [topic, language]
  );

  const row = res.rows[0];
  if (!row) return null;

  const age = Date.now() - new Date(row.generated_at).getTime();
  if (age > CACHE_TTL_MS) return null;

  return {
    title: row.title,
    body: row.body,
    citation: row.citation,
    related_games: row.related_games ?? [],
    generated_at: row.generated_at,
  };
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export async function generateMicroLesson(
  userId: string,
  language: Lang = 'en',
  forceTopic?: LessonTopic,
  forceRefresh = false
): Promise<MicroLessonResult> {
  const started = Date.now();

  /* 1. Decide topic */
  let decision: TopicDecision;
  if (forceTopic) {
    decision = {
      topic: forceTopic,
      reason_en: 'Topic requested explicitly.',
      reason_ar: 'موضوع مطلوب صريح.',
      weakness_domain: null,
      weakness_score: null,
    };
  } else {
    decision = await detectTopic(userId);
  }

  const topic = decision.topic;
  const meta = TOPIC_META[topic];
  const reason = language === 'ar' ? decision.reason_ar : decision.reason_en;
  const relatedGames = TOPIC_GAMES[topic];

  /* 2. Cache check */
  if (!forceRefresh) {
    const cached = await loadCachedLesson(topic, language);
    if (cached) {
      return {
        topic,
        title: cached.title,
        body: cached.body,
        takeaway: '',
        citation: cached.citation,
        related_games: cached.related_games.length > 0 ? cached.related_games : relatedGames,
        trigger_reason: reason,
        source: 'cache',
        provider: 'none',
        model: 'cache',
        language,
        latency_ms: Date.now() - started,
      };
    }
  }

  /* 3. Build context for LLM */
  const ctx: LessonContext = {
    topic,
    trigger_reason: reason,
    user_weakness_domain: decision.weakness_domain,
    user_weakness_score: decision.weakness_score,
    related_games: relatedGames,
  };

  /* 4. Call LLM */
  const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_LESSON_AR : SYSTEM_PROMPT_LESSON_EN;
  const userPrompt = buildLessonUserPrompt(ctx, language);

  let title = '';
  let body = '';
  let takeaway = '';
  let source: MicroLessonResult['source'] = 'llm';
  let provider = '';
  let model = '';
  let tokens: MicroLessonResult['tokens'];

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.6, max_tokens: 1500, language, json_mode: true }
    );

    const parsed = extractJson<{
      title?: string;
      body?: string;
      takeaway?: string;
    }>(res.content);

    console.error('[micro-lessons] raw LLM len=', res.content.length, '| provider=', res.provider);

    if (parsed) {
      const rawTitle = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 120) : '';
      const rawBody = typeof parsed.body === 'string' ? parsed.body.trim() : '';
      const rawTakeaway = typeof parsed.takeaway === 'string' ? parsed.takeaway.trim().slice(0, 200) : '';
      console.error('[micro-lessons] parsed: title=', rawTitle.length, 'body=', rawBody.length);

      const bodyCheck = validateAiText(rawBody, { minLen: 60, maxLen: 1500 });
      const titleCheck = validateAiText(rawTitle, { minLen: 5, maxLen: 150 });

      if (bodyCheck.ok && titleCheck.ok) {
        title = titleCheck.cleaned;
        body = bodyCheck.cleaned;
        takeaway = rawTakeaway;
        provider = res.provider;
        model = res.model;
        tokens = {
          prompt: res.usage.prompt_tokens,
          completion: res.usage.completion_tokens,
          total: res.usage.total_tokens,
        };
      } else {
        console.error('[micro-lessons] validation failed:');
        console.error('  title issues:', JSON.stringify(titleCheck.issues));
        console.error('  body issues:', JSON.stringify(bodyCheck.issues));
        console.error('  raw body first 200:', rawBody.slice(0, 200));
      }
    } else {
      console.error('[micro-lessons] JSON parse failed. Raw output first 300:');
      console.error(res.content.slice(0, 300));
    }
  } catch (err) {
    console.error('[micro-lessons] LLM failed:', (err as Error).message);
  }

  /* 5. Fallback if empty */
  if (!title || !body) {
    const fb = buildFallbackLesson(topic, language);
    title = fb.title;
    body = fb.body;
    takeaway = fb.takeaway;
    source = 'rule';
    provider = 'none';
    model = 'rule';
  }

  /* 6. Save to DB */
  await saveLesson(topic, language, title, body, meta.citation, relatedGames);

  return {
    topic,
    title,
    body,
    takeaway,
    citation: meta.citation,
    related_games: relatedGames,
    trigger_reason: reason,
    source,
    provider,
    model,
    language,
    latency_ms: Date.now() - started,
    tokens,
  };
}

/* ─── Available topics ─── */
export function listTopics(): Array<{ id: LessonTopic; en_title: string; ar_title: string }> {
  return (Object.keys(TOPIC_META) as LessonTopic[]).map((id) => ({
    id,
    en_title: TOPIC_META[id].en_title,
    ar_title: TOPIC_META[id].ar_title,
  }));
}