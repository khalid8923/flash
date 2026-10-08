/* ═══════════════════════════════════════════════════════════
   Voice Transcription — Groq Whisper wrapper
   Model: whisper-large-v3-turbo (fast, free tier)
   ═══════════════════════════════════════════════════════════ */

import { env } from '../../../config/env.js';

export type DetectedLang = 'en' | 'ar' | 'unknown';

export interface TranscribeResult {
  text: string;
  detected_language: DetectedLang;
  duration_ms: number;
  provider: 'groq';
  model: string;
  latency_ms: number;
}

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

function normalizeLanguage(raw: string | undefined): DetectedLang {
  if (!raw) return 'unknown';
  const l = raw.toLowerCase();
  if (l === 'arabic' || l === 'ar') return 'ar';
  if (l === 'english' || l === 'en') return 'en';
  return 'unknown';
}

export async function transcribeAudio(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<TranscribeResult> {
  const apiKey = env.GROQ_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('voice_not_configured');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('empty_audio');
  }

  if (buffer.length > env.VOICE_MAX_BYTES) {
    throw new Error('audio_too_large');
  }

  const start = Date.now();

  /* Build multipart form for Groq */
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimetype || 'audio/webm' });
  form.append('file', blob, filename || 'audio.webm');
  form.append('model', env.VOICE_MODEL);
  form.append('response_format', 'verbose_json');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(GROQ_WHISPER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq Whisper ${res.status}: ${errText.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      text?: string;
      language?: string;
      duration?: number;
    };

    const text = (json.text ?? '').trim();
    const detected = normalizeLanguage(json.language);

    return {
      text,
      detected_language: detected,
      duration_ms: Math.round((json.duration ?? 0) * 1000),
      provider: 'groq',
      model: env.VOICE_MODEL,
      latency_ms: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ─── Fast-path check ─── */
export function isVoiceEnabled(): boolean {
  return Boolean(env.GROQ_API_KEY);
}