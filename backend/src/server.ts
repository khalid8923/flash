import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';

import healthRoutes from './routes/health.js';
import sessionsRoutes from './routes/sessions.js';
import gamesRoutes from './routes/games.js';
import profileRoutes from './routes/profile.js';
import aiRoutes from './routes/ai.js';
import aiCoachRoutes from './routes/ai-coach.js';
import aiProfileRoutes from './routes/ai-profile.js';
import aiDirectorRoutes from './routes/ai-director.js';
import aiVoiceRoutes from './routes/ai-voice.js';
import aiVariantsRoutes from './routes/ai-variants.js';
import aiJournalRoutes from './routes/ai-journal.js';
import aiPredictionsRoutes from './routes/ai-predictions.js';
import nextRoutes from './routes/next.js';
import planRoutes from './routes/plan.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: { level: env.LOG_LEVEL },
    bodyLimit: 15 * 1024 * 1024, // 15 MB — allows audio uploads
  });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  /* Multipart for audio uploads */
  await fastify.register(multipart, {
    limits: {
      fileSize: env.VOICE_MAX_BYTES,
      files: 1,
      fields: 5,
    },
  });

  await fastify.register(healthRoutes);
  await fastify.register(sessionsRoutes);
  await fastify.register(gamesRoutes);
  await fastify.register(profileRoutes);
  await fastify.register(aiRoutes);
  await fastify.register(aiCoachRoutes);
  await fastify.register(aiProfileRoutes);
  await fastify.register(aiDirectorRoutes);
  await fastify.register(aiVoiceRoutes);
  await fastify.register(aiVariantsRoutes);
  await fastify.register(aiJournalRoutes);
  await fastify.register(aiPredictionsRoutes);
  await fastify.register(nextRoutes);
  await fastify.register(planRoutes);

  return fastify;
}

async function start() {
  const fastify = await buildServer();
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    fastify.log.info(`FLASH Backend on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();