/* ═══════════════════════════════════════════════════════════
   FLASH - Sync Protocol (R28, pull only)
   GET /sync/changes?cursor=N
   Returns facts + settings since cursor + new cursor.
   Derived data is NEVER synced (client rebuilds from server).
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { requirePlayer } from '../middleware/auth.js';
import { pool } from '../config/db.js';

const MAX_CHANGES = 500;

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /sync/changes ═══ */
  fastify.get<{ Querystring: { cursor?: string; limit?: string } }>(
    '/sync/changes',
    { preHandler: requirePlayer },
    async (req) => {
      const playerId = req.player!.playerId;
      const since = Math.max(0, parseInt(req.query.cursor ?? '0', 10) || 0);
      const limit = Math.min(MAX_CHANGES, Math.max(1, parseInt(req.query.limit ?? '200', 10) || 200));

      /* ─── Sessions (facts) since cursor ─── */
      const sessions = await pool.query<{
        id: string;
        change_seq: number;
        game_id: string;
        domain_id: string;
        mode: string;
        started_at: string;
        ended_at: string;
        accuracy: number;
        median_rt_ms: number;
        rcs: number;
        primary_score: number;
      }>(
        `SELECT id, change_seq, game_id, domain_id, mode,
                started_at, ended_at, accuracy, median_rt_ms, rcs, primary_score
           FROM sessions
          WHERE user_id = $1 AND change_seq > $2 AND deleted_at IS NULL
          ORDER BY change_seq ASC
          LIMIT $3`,
        [playerId, since, limit]
      );

      /* ─── Settings since cursor (via changed_at, no cursor column; send all) ─── */
      const settings = await pool.query<{ key: string; value: unknown; changed_at: string }>(
        `SELECT key, value, changed_at
           FROM user_settings
          WHERE user_id = $1`,
        [playerId]
      );

      /* ─── Current sync state ─── */
      const state = await pool.query<{ change_seq: number }>(
        `SELECT COALESCE(change_seq, 0)::int AS change_seq
           FROM user_sync_state WHERE user_id = $1`,
        [playerId]
      );

      /* ─── Compute new cursor: max(seen seq, current state) ─── */
      const maxSeen = sessions.rows.length > 0
        ? sessions.rows[sessions.rows.length - 1]!.change_seq
        : since;
      const stateSeq = state.rows[0]?.change_seq ?? 0;
      const newCursor = Math.max(maxSeen, since);

      return {
        ok: true,
        cursor: since,
        new_cursor: newCursor,
        server_seq: stateSeq,
        has_more: sessions.rows.length >= limit,
        counts: {
          sessions: sessions.rows.length,
          settings: settings.rows.length,
        },
        changes: {
          sessions: sessions.rows,
          settings: settings.rows.map((s) => ({
            key: s.key,
            value: s.value,
            changed_at: s.changed_at,
          })),
        },
      };
    }
  );

  /* ═══ GET /sync/state — current cursor without changes ═══ */
  fastify.get('/sync/state', { preHandler: requirePlayer }, async (req) => {
    const playerId = req.player!.playerId;
    const state = await pool.query<{ change_seq: number }>(
      `SELECT COALESCE(change_seq, 0)::int AS change_seq
         FROM user_sync_state WHERE user_id = $1`,
      [playerId]
    );
    return { ok: true, server_seq: state.rows[0]?.change_seq ?? 0 };
  });
};

export default syncRoutes;