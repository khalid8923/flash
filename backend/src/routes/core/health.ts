import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../../config/db.js';

const startedAt = Date.now();
const VERSION = '0.1.0';

/* Retry a query once (Neon cold start). */
async function queryWithRetry<T>(sql: string): Promise<T> {
  try {
    return (await pool.query(sql)).rows as T;
  } catch {
    await new Promise((r) => setTimeout(r, 300));
    return (await pool.query(sql)).rows as T;
  }
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  /* Liveness - no DB */
  fastify.get('/health', async () => ({
    ok: true,
    service: 'flash-backend',
    version: VERSION,
    uptime_s: Math.floor((Date.now() - startedAt) / 1000),
    ts: new Date().toISOString(),
  }));

  /* Readiness - DB reachable */
  fastify.get('/ready', async (req, reply) => {
    const t0 = Date.now();
    try {
      await pool.query('SELECT 1');
      const pingMs = Date.now() - t0;

      const [mig, games] = await Promise.all([
        queryWithRetry<{ n: number }[]>('SELECT COUNT(*)::int AS n FROM _migrations'),
        queryWithRetry<{ n: number }[]>('SELECT COUNT(*)::int AS n FROM games WHERE deleted_at IS NULL'),
      ]);

      return {
        ok: true,
        db: {
          reachable: true,
          ping_ms: pingMs,
          migrations: mig[0]?.n ?? 0,
          games: games[0]?.n ?? 0,
        },
        ts: new Date().toISOString(),
      };
    } catch (err) {
      req.log.error({ err }, '/ready failed');
      return reply.code(503).send({
        ok: false,
        db: { reachable: false, error: 'unavailable' },
        ts: new Date().toISOString(),
      });
    }
  });
};

export default healthRoutes;