import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import sessionsRoutes from './routes/sessions.js';
import gamesRoutes from './routes/games.js';
import profileRoutes from './routes/profile.js';
import aiRoutes from './routes/ai.js';
import nextRoutes from './routes/next.js';
import planRoutes from './routes/plan.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: { level: env.LOG_LEVEL },
    bodyLimit: 2 * 1024 * 1024,
  });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  await fastify.register(healthRoutes);
  await fastify.register(sessionsRoutes);
  await fastify.register(gamesRoutes);
  await fastify.register(profileRoutes);
  await fastify.register(aiRoutes);
  await fastify.register(nextRoutes);
  await fastify.register(planRoutes);

  return fastify;
}

async function start() {
  const fastify = await buildServer();
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    fastify.log.info(`⚡ FLASH Backend on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();