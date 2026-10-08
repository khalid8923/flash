/* ═══════════════════════════════════════════════════════════
   Admin — Catalog Management
   Guarded by x-admin-token header.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { ALL_GAMES, getGame } from '../catalog/registry.js';
import { syncCatalog, checkCatalogDrift } from '../services/catalog-sync.js';

const adminCatalogRoutes: FastifyPluginAsync = async (fastify) => {
  /* Guard: every route requires x-admin-token matching ADMIN_TOKEN */
  fastify.addHook('onRequest', async (request, reply) => {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      return reply.code(503).send({ error: 'admin_not_configured', message: 'Set ADMIN_TOKEN in .env' });
    }
    const token = request.headers['x-admin-token'];
    if (token !== expected) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });

  /* ─── List catalog + DB state ─── */
  fastify.get('/admin/catalog', async () => {
    const dbGames = await pool.query<{
      id: string;
      name: string;
      domain_id: string;
      status: string;
      deleted_at: string | null;
    }>(
      `SELECT id, name, domain_id, status, deleted_at
         FROM games
        ORDER BY id`
    );
    return {
      config_count: ALL_GAMES.length,
      db_count: dbGames.rows.length,
      db_games: dbGames.rows,
    };
  });

  /* ─── Drift report ─── */
  fastify.get('/admin/catalog/drift', async () => {
    const drift = await checkCatalogDrift();
    return drift;
  });

  /* ─── One game full config ─── */
  fastify.get<{ Params: { id: string } }>('/admin/catalog/:id', async (request, reply) => {
    const cfg = getGame(request.params.id);
    if (!cfg) return reply.code(404).send({ error: 'not_in_configs' });
    return cfg;
  });

  /* ─── Trigger sync ─── */
  fastify.post('/admin/catalog/sync', async (request, reply) => {
    try {
      const result = await syncCatalog();
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'sync_failed', message: (err as Error).message });
    }
  });

  /* ─── Soft-disable a game ─── */
  fastify.post<{ Params: { id: string }; Body?: { reason?: string } }>(
    '/admin/catalog/:id/disable',
    async (request, reply) => {
      const reason = request.body?.reason ?? 'admin_disabled';
      const res = await pool.query(
        `UPDATE games
            SET deleted_at = NOW(),
                deleted_reason = $2,
                status = 'disabled'
          WHERE id = $1 AND deleted_at IS NULL`,
        [request.params.id, reason]
      );
      if (!res.rowCount) return reply.code(404).send({ error: 'not_found_or_already_disabled' });
      return reply.code(200).send({ id: request.params.id, disabled: true, reason });
    }
  );

  /* ─── Re-enable a disabled game ─── */
  fastify.post<{ Params: { id: string } }>(
    '/admin/catalog/:id/enable',
    async (request, reply) => {
      const res = await pool.query(
        `UPDATE games
            SET deleted_at = NULL,
                deleted_reason = NULL,
                status = 'ready'
          WHERE id = $1 AND deleted_at IS NOT NULL`,
        [request.params.id]
      );
      if (!res.rowCount) return reply.code(404).send({ error: 'not_found_or_not_disabled' });
      return reply.code(200).send({ id: request.params.id, enabled: true });
    }
  );
};

export default adminCatalogRoutes;