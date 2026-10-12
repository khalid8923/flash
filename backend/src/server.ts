import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import { env } from './config/env.js';
import { ipKey } from './config/rate-limit.js';
import { registerErrorHandler } from './lib/error-handler.js';
import { idempotencyHook } from './middleware/idempotency.js';

import healthRoutes from './routes/core/health.js';
import authRoutes from './routes/player/auth.js';
import playsRoutes from './routes/player/plays.js';
import syncRoutes from './routes/player/sync.js';
import meRoutes from './routes/player/me.js';
import sessionsRoutes from './routes/player/sessions.js';
import gamesRoutes from './routes/core/games.js';
import profileRoutes from './routes/player/profile.js';
import aiRoutes from './routes/ai/ai.js';
import aiCoachRoutes from './routes/ai/ai-coach.js';
import aiProfileRoutes from './routes/ai/ai-profile.js';
import aiDirectorRoutes from './routes/ai/ai-director.js';
import aiVoiceRoutes from './routes/ai/ai-voice.js';
import aiVariantsRoutes from './routes/ai/ai-variants.js';
import aiJournalRoutes from './routes/ai/ai-journal.js';
import aiPredictionsRoutes from './routes/ai/ai-predictions.js';
import profileSnapshotRoutes from './routes/player/profile-snapshot.js';
import adminCatalogRoutes from './routes/admin/admin-catalog.js';
import adminAuthRoutes from './routes/admin/admin-auth.js';
import adminAiRoutes from './routes/admin/admin-ai.js';
import adminDemoRoutes from './routes/admin/admin-demo.js';
import adminRegistryRoutes from './routes/admin/admin-registry.js';
import adminDifficultyRoutes from './routes/admin/admin-difficulty.js';
import adminIntegrityRoutes from './routes/admin/admin-integrity.js';
import adminNormsRoutes from './routes/admin/admin-norms.js';
import adminAnalyticsRoutes from './routes/admin/admin-analytics.js';
import adminFlagsRoutes from './routes/admin/admin-flags.js';
import adminPrivacyRoutes from './routes/admin/admin-privacy.js';
import adminJobsRoutes from './routes/admin/admin-jobs.js';
import adminDemoScriptsRoutes from './routes/admin/admin-demo-scripts.js';
import adminRetentionRoutes from './routes/admin/admin-retention.js';
import adminConsoleRoutes from './routes/admin/admin-console.js';
import adminPlatformRoutes from './routes/admin/admin-platform.js';
import nextRoutes from './routes/core/next.js';
import planRoutes from './routes/core/plan.js';
import engagementRoutes from './routes/player/engagement.js';
import engagement2Routes from './routes/player/engagement-2.js';

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

  /* ═══ Idempotency (mutations only) ═══ */
  fastify.addHook('onRequest', idempotencyHook);

    /* ═══ Central Error Handler ═══ */
  await registerErrorHandler(fastify);

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
  await fastify.register(engagementRoutes);
  await fastify.register(engagement2Routes);

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