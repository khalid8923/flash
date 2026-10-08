/* ═══════════════════════════════════════════════════════════
   AI Coach — Groq for both EN + AR
   Arabic uses allam-2-7b with compressed context
   English uses gpt-oss-120b with full context
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { buildUserContext, contextToPrompt } from './context.js';
import { env } from '../../config/env.js';

export interface ChatInput {
  userId: string;
  message: string;
  conversationId?: string | null;
  language?: 'en' | 'ar';
}

export interface ChatReply {
  conversation_id: string;
  reply: string;
  tokens: { prompt: number; completion: number; total: number };
  latency_ms: number;
  model: string;
}

const SYSTEM_PROMPT_EN = `You are the FLASH Coach — a careful, evidence-minded guide for a cognitive training platform called FLASH.

WHO YOU ARE:
- A thoughtful analyst, not a cheerleader
- You speak in plain language, never in hype
- You never diagnose, never claim medical benefits
- You know that "brain games" claims are mostly exaggerated
- You tell the truth about what the data shows, and what it cannot show

WHAT YOU KNOW ABOUT THE USER:
You will receive a USER PROFILE block. Use it. Reference specifics — game names, scores, domains, streaks. Never invent numbers.

HOW TO ANSWER:
- Be concise (2-5 sentences unless asked for depth)
- Cite specific data when relevant
- If you do not know, say so
- Suggest concrete next steps

DO NOT:
- Diagnose any condition
- Claim to raise IQ or prevent cognitive decline
- Use hype words
- Recommend anything outside the FLASH catalogue`;

const SYSTEM_PROMPT_AR = `أنت "مدرب FLASH" — مرشد دقيق مبني على الأدلة لمنصة تدريب معرفي.

قواعد مهمة:
- تتكلم بالعربية دائماً
- افهم اللهجة المصرية العامية (إيه، ازاي، ليه، عايز، مش)
- لا تسأل "رسالتك غير واضحة" — الأسئلة العادية واضحة
- أجب مباشرة بإجابة عملية

هويتك:
- محلل مدروس، ليس مشجعاً حماسياً
- لا تشخّص أي حالة
- لا تدّعي رفع الذكاء
- تقول الحقيقة عما تظهره البيانات

كيف تجيب:
- اختصر (2-5 جمل)
- اذكر الأرقام والمجالات بالعربية
- اقترح خطوات عملية`;

export async function chat(input: ChatInput): Promise<ChatReply> {
  const { userId, message, conversationId, language = 'en' } = input;

  // Get or create conversation
  let convId = conversationId ?? null;
  if (!convId) {
    const res = await pool.query(
      `INSERT INTO ai_conversations (user_id, title, language)
       VALUES ($1, $2, $3) RETURNING id`,
      [userId, message.slice(0, 60), language]
    );
    convId = res.rows[0].id as string;
  }

  // Load prior messages
  const history = await pool.query(
    `SELECT role, content FROM ai_messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [convId]
  );

  // Build user context
  const ctx = await buildUserContext(userId);
  const ctxBlock = contextToPrompt(ctx);

  // Save user message
  await pool.query(
    `INSERT INTO ai_messages (conversation_id, role, content)
     VALUES ($1, 'user', $2)`,
    [convId, message]
  );

  const priorMsgs = [...history.rows].reverse();

  let reply = '';
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let latency = 0;
  let modelUsed = '';

  if (language === 'ar') {
    // ─── Arabic path ───
    // allam-2-7b has small context (~4K), compress aggressively
    const compactCtx = ctxBlock.length > 1000
      ? ctxBlock.slice(0, 1000) + '\n[...]'
      : ctxBlock;

    const compactSys = SYSTEM_PROMPT_AR + '\n\n' + compactCtx;
    const lastTwo = priorMsgs.slice(-2);

    const arMessages = [
      { role: 'system' as const, content: compactSys },
      ...lastTwo.map((h: any) => ({
        role: h.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: String(h.content || ''),
      })),
      { role: 'user' as const, content: message },
    ];

    const gRes = await routeChat(arMessages, {
      temperature: 0.7,
      max_tokens: 500,
      language: 'ar',
    });
    reply = gRes.content.trim();
    usage = gRes.usage;
    latency = gRes.latency_ms;
    modelUsed = gRes.model + ' (' + gRes.provider + ')';
  } else {
    // ─── English path ───
    const fullSys = SYSTEM_PROMPT_EN + '\n\n' + ctxBlock;
    const messages = [
      { role: 'system' as const, content: fullSys },
      ...priorMsgs.map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: String(h.content || ''),
      })),
      { role: 'user' as const, content: message },
    ];

    const gRes = await routeChat(messages, {
      temperature: 0.7,
      max_tokens: 600,
      language: 'en',
    });
    reply = gRes.content.trim();
    usage = gRes.usage;
    latency = gRes.latency_ms;
    modelUsed = gRes.model + ' (' + gRes.provider + ')';
  }

  // Save assistant reply
  await pool.query(
    `INSERT INTO ai_messages
     (conversation_id, role, content, tokens_prompt, tokens_completion, latency_ms)
     VALUES ($1, 'assistant', $2, $3, $4, $5)`,
    [convId, reply, usage.prompt_tokens, usage.completion_tokens, latency]
  );

  // Update conversation timestamp
  await pool.query(
    `UPDATE ai_conversations SET updated_at = now() WHERE id = $1`,
    [convId]
  );

  return {
    conversation_id: convId,
    reply,
    tokens: {
      prompt: usage.prompt_tokens,
      completion: usage.completion_tokens,
      total: usage.total_tokens,
    },
    latency_ms: latency,
    model: modelUsed,
  };
}