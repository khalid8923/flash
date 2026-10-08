/* ═══════════════════════════════════════════════════════════
   Voice Routes — multipart audio -> transcript -> coach reply
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { getOrCreateDemoUser } from '../services/users.js';
import { voiceChat } from '../services/ai/voice/voice-coach.js';
import { isVoiceEnabled } from '../services/ai/voice/transcribe.js';
import type { Lang } from '../services/ai/providers/types.js';

const aiVoiceRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ Voice capability check ═══ */
  fastify.get('/ai/voice/status', async () => {
    return {
      enabled: isVoiceEnabled(),
      provider: 'groq',
      model: process.env.VOICE_MODEL || 'whisper-large-v3-turbo',
      max_bytes: Number(process.env.VOICE_MAX_BYTES || 10485760),
      supported_formats: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'],
      language_detection: true,
    };
  });

  /* ═══ Voice chat — accepts multipart with field "audio" ═══ */
  fastify.post('/ai/voice/chat', async (request, reply) => {
    if (!isVoiceEnabled()) {
      return reply.code(503).send({ error: 'voice_not_configured' });
    }

    /* Parse multipart */
    let audioBuffer: Buffer | null = null;
    let mimetype = 'audio/webm';
    let filename = 'audio.webm';
    let conversationId: string | null = null;
    let langOverride: Lang | null = null;

    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          /* Only accept one audio file */
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          audioBuffer = Buffer.concat(chunks);
          mimetype = part.mimetype || mimetype;
          filename = part.filename || filename;
        } else if (part.type === 'field') {
          const fieldname = (part as { fieldname: string }).fieldname;
          const value = String((part as { value: unknown }).value ?? '');
          if (fieldname === 'conversation_id') conversationId = value || null;
          if (fieldname === 'language') {
            langOverride = value === 'ar' ? 'ar' : value === 'en' ? 'en' : null;
          }
        }
      }
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ error: 'invalid_multipart', message: (err as Error).message });
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return reply.code(400).send({ error: 'missing_audio', message: 'field "audio" is required' });
    }

    const userId = await getOrCreateDemoUser();

    try {
      const result = await voiceChat({
        userId,
        audioBuffer,
        mimetype,
        filename,
        conversationId,
        languageOverride: langOverride,
      });
      return reply.code(200).send(result);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'empty_transcript') {
        return reply.code(422).send({ error: 'empty_transcript', message: 'Could not detect speech' });
      }
      if (msg === 'audio_too_large') {
        return reply.code(413).send({ error: 'audio_too_large' });
      }
      if (msg === 'voice_not_configured') {
        return reply.code(503).send({ error: 'voice_not_configured' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'voice_chat_failed', message: msg });
    }
  });
};

export default aiVoiceRoutes;