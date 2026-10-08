import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import { env } from './config/env.js';
import { ipKey } from './config/rate-limit.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import playsRoutes from './routes/plays.js';
import syncRoutes from './routes/sync.js';
import meRoutes from './routes/me.js';
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
import profileSnapshotRoutes from './routes/profile-snapshot.js';
import adminCatalogRoutes from './routes/admin-catalog.js';
import adminAuthRoutes from './routes/admin-auth.js';
import adminAiRoutes from './routes/admin-ai.js';
import adminDemoRoutes from './routes/admin-demo.js';
import adminRegistryRoutes from './routes/admin-registry.js';
import adminDifficultyRoutes from './routes/admin-difficulty.js';
import adminIntegrityRoutes from './routes/admin-integrity.js';
import adminNormsRoutes from './routes/admin-norms.js';
import adminAnalyticsRoutes from './routes/admin-analytics.js';
import adminFlagsRoutes from './routes/admin-flags.js';
import adminPrivacyRoutes from './routes/admin-privacy.js';
import adminJobsRoutes from './routes/admin-jobs.js';
import adminDemoScriptsRoutes from './routes/admin-demo-scripts.js';
import adminRetentionRoutes from './routes/admin-retention.js';
import adminConsoleRoutes from './routes/admin-console.js';
import adminPlatformRoutes from './routes/admin-platform.js';
import nextRoutes from './routes/next.js';
import planRoutes from './routes/plan.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: { level: env.LOG_LEVEL },
    bodyLimit: 15 * 1024 * 1024,
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  /* ═══ Security headers ═══ */
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  });

  /* ═══ Compression ═══ */
  await fastify.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['br', 'gzip', 'deflate'],
  });

  /* ═══ CORS ═══ */
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'x-client-version'],
    exposedHeaders: ['x-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'retry-after'],
    maxAge: 86400,
  });

  /* ═══ Rate limiting (R11) - layered ═══ */
  await fastify.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: ipKey,
    /* Health checks and preflight should not be limited */
    allowList: (req) => {
      const url = req.url;
      if (req.method === 'OPTIONS') return true;
      if (url === '/health' || url === '/ready') return true;
      if (url.startsWith('/_internal/')) return true;
      return false;
    },
    /* Standard headers on every response */
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_req, context) => ({
      error: 'rate_limit_exceeded',
      message: 'Too many requests — slow down.',
      limit: context.max,
      window: context.after,
      retry_after: Math.ceil(context.ttl / 1000),
    }),
  });

  /* ═══ Multipart ═══ */
  await fastify.register(multipart, {
    limits: {
      fileSize: env.VOICE_MAX_BYTES,
      files: 1,
      fields: 5,
    },
  });

  /* ═══ Routes ═══ */
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(playsRoutes);
  await fastify.register(syncRoutes);
  await fastify.register(meRoutes);
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
  await fastify.register(profileSnapshotRoutes);
  await fastify.register(adminAuthRoutes);
  await fastify.register(adminAiRoutes);
  await fastify.register(adminDemoRoutes);
  await fastify.register(adminRegistryRoutes);
  await fastify.register(adminDifficultyRoutes);
  await fastify.register(adminIntegrityRoutes);
  await fastify.register(adminNormsRoutes);
  await fastify.register(adminAnalyticsRoutes);
  await fastify.register(adminFlagsRoutes);
  await fastify.register(adminPrivacyRoutes);
  await fastify.register(adminJobsRoutes);
  await fastify.register(adminDemoScriptsRoutes);
  await fastify.register(adminRetentionRoutes);
  await fastify.register(adminConsoleRoutes);
  await fastify.register(adminPlatformRoutes);
  await fastify.register(adminCatalogRoutes);
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