/* ═══════════════════════════════════════════════════════════
   Voice Coach — combines Whisper transcription + AI Coach chat
   Flow: audio -> Whisper -> text + detected lang -> coach -> reply
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../../config/db.js';
import { transcribeAudio, type TranscribeResult } from './transcribe.js';
import { chat } from '../coach.js';
import type { Lang } from '../providers/types.js';

export interface VoiceChatInput {
  userId: string;
  audioBuffer: Buffer;
  mimetype: string;
  filename: string;
  conversationId?: string | null;
  languageOverride?: Lang | null;   // if user wants to force a language
}

export interface VoiceChatResult {
  transcript: string;
  detected_language: 'en' | 'ar' | 'unknown';
  used_language: Lang;
  reply: string;
  conversation_id: string;
  transcription: {
    model: string;
    latency_ms: number;
    duration_ms: number;
  };
  coach: {
    model: string;
    latency_ms: number;
    tokens: { prompt: number; completion: number; total: number };
  };
  total_latency_ms: number;
}

const MAX_EMPTY_LEN = 1;

export async function voiceChat(input: VoiceChatInput): Promise<VoiceChatResult> {
  const started = Date.now();

  /* 1) Transcribe */
  const tx: TranscribeResult = await transcribeAudio(
    input.audioBuffer,
    input.mimetype,
    input.filename
  );

  if (!tx.text || tx.text.trim().length < MAX_EMPTY_LEN) {
    throw new Error('empty_transcript');
  }

  /* 2) Choose language — override > detected > default en */
  let usedLang: Lang = 'en';
  if (input.languageOverride === 'ar' || input.languageOverride === 'en') {
    usedLang = input.languageOverride;
  } else if (tx.detected_language === 'ar' || tx.detected_language === 'en') {
    usedLang = tx.detected_language;
  }

  /* 3) Pass to existing coach */
  const coachReply = await chat({
    userId: input.userId,
    message: tx.text,
    conversationId: input.conversationId ?? null,
    language: usedLang,
  });

  /* 4) Log voice request (optional — for debugging + metrics) */
  try {
    await pool.query(
      `INSERT INTO voice_requests (user_id, duration_ms, transcript, reply)
       VALUES ($1, $2, $3, $4)`,
      [
        input.userId,
        tx.duration_ms,
        tx.text.slice(0, 2000),
        coachReply.reply.slice(0, 2000),
      ]
    );
  } catch (err) {
    console.warn('[voice] log insert failed:', (err as Error).message);
  }

  return {
    transcript: tx.text,
    detected_language: tx.detected_language,
    used_language: usedLang,
    reply: coachReply.reply,
    conversation_id: coachReply.conversation_id,
    transcription: {
      model: tx.model,
      latency_ms: tx.latency_ms,
      duration_ms: tx.duration_ms,
    },
    coach: {
      model: coachReply.model,
      latency_ms: coachReply.latency_ms,
      tokens: coachReply.tokens,
    },
    total_latency_ms: Date.now() - started,
  };
}