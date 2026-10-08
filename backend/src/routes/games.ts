import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { cacheGet, cacheSet, makeETag, sendIfMatch } from '../services/cache.js';

const CATALOG_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CDN_MAX_AGE_S = 60;             // browser caches 60s, revalidates via ETag

interface GameRow {
  id: string;
  name: string;
  domain_id: string;
  primary_metric: string;
  metric_direction: string;
  trial_pattern: string;
  status: string;
  domain_name: string;
  domain_icon: string;
  domain_color: string;
}

interface DomainRow {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const gamesRoutes: FastifyPluginAsync = async (fastify) => {

  /* ═══ GET /games ═══ */
  fastify.get('/games', async (req, reply) => {
    const key = 'catalog:games';
    let payload = cacheGet<{ games: GameRow[] }>(key);

    if (!payload) {
      const res = await pool.query<GameRow>(`
        SELECT
          g.id, g.name, g.domain_id, g.primary_metric, g.metric_direction,
          g.trial_pattern, g.status,
          d.name AS domain_name, d.icon AS domain_icon, d.color AS domain_color
        FROM games g
        JOIN domains d ON d.id = g.domain_id
        WHERE g.deleted_at IS NULL
        ORDER BY d.id, g.name
      `);
      payload = { games: res.rows };
      cacheSet(key, payload, CATALOG_TTL_MS);
    }

    const etag = makeETag(payload);
    if (sendIfMatch(req.headers['if-none-match'] as string | undefined, etag)) {
      return reply.code(304).header('etag', etag).send();
    }

    return reply
      .header('etag', etag)
      .header('cache-control', `public, max-age=${CDN_MAX_AGE_S}, must-revalidate`)
      .send(payload);
  });

  /* ═══ GET /domains ═══ */
  fastify.get('/domains', async (req, reply) => {
    const key = 'catalog:domains';
    let payload = cacheGet<{ domains: DomainRow[] }>(key);

    if (!payload) {
      const res = await pool.query<DomainRow>(
        'SELECT id, name, icon, color FROM domains ORDER BY id'
      );
      payload = { domains: res.rows };
      cacheSet(key, payload, CATALOG_TTL_MS);
    }

    const etag = makeETag(payload);
    if (sendIfMatch(req.headers['if-none-match'] as string | undefined, etag)) {
      return reply.code(304).header('etag', etag).send();
    }

    return reply
      .header('etag', etag)
      .header('cache-control', `public, max-age=${CDN_MAX_AGE_S}, must-revalidate`)
      .send(payload);
  });
};

export default gamesRoutes;