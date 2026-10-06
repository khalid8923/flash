import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import sessionsRoutes from './routes/sessions.js';

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
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(healthRoutes);
  await fastify.register(sessionsRoutes);

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