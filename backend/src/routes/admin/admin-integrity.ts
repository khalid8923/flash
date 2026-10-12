/* ═══════════════════════════════════════════════════════════
   FLASH - Integrity Queue + Session Review (M4-01/02)
   GET  /admin/integrity/queue          — grouped flags
   GET  /admin/integrity/sessions/:id   — session detail + reviews
   POST /admin/integrity/sessions/:id/review
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { requireAdmin, audit } from '../../middleware/admin-auth.js';

const ReviewBody = z.object({
  verdict: z.enum(['accept', 'quarantine', 'invalidate']),
  reason: z.string().min(3).max(500),
  notes: z.string().max(2000).optional(),
});

const adminIntegrityRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ GET /admin/integrity/queue ═══ */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/admin/integrity/queue',
    { preHandler: requireAdmin('ops') },
    async (req) => {
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));

      /* Grouped by rule + severity */
      const grouped = await pool.query<{ rule: string; severity: string; n: number }>(
        `SELECT rule, severity, COUNT(*)::int AS n
           FROM integrity_events
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY rule, severity
          ORDER BY n DESC
          LIMIT $1`,
        [limit]
      );

      /* Recent events */
      const recent = await pool.query<{
        id: number; session_id: string | null; user_id: string | null;
        rule: string; severity: string; created_at: string;
      }>(
        `SELECT id, session_id, user_id, rule, severity, created_at
           FROM integrity_events
          WHERE created_at > NOW() - INTERVAL '30 days'
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit]
      );

      await audit(req, 'integrity.queue.read');

      return {
        ok: true,
        window_days: 30,
        grouped: grouped.rows,
        recent: recent.rows,
      };
    }
  );

  /* ═══ GET /admin/integrity/sessions/:id ═══ */
  fastify.get<{ Params: { id: string } }>(
    '/admin/integrity/sessions/:id',
    { preHandler: requireAdmin('science') },
    async (req, reply) => {
      const { id } = req.params;

      const s = await pool.query(
        `SELECT id, user_id, game_id, domain_id, mode, started_at, ended_at,
                accuracy, median_rt_ms, rcs, primary_score, n_trials, n_correct,
                status, trust_tier, created_at
           FROM sessions WHERE id = $1`,
        [id]
      );
      if (!s.rowCount) return reply.code(404).send({ error: 'not_found' });

      const reviews = await pool.query(
        `SELECT id, verdict, reason, notes, created_at, reviewer_id
           FROM session_reviews
          WHERE session_id = $1
          ORDER BY created_at DESC`,
        [id]
      );

      const events = await pool.query(
        `SELECT id, rule, severity, detail, created_at
           FROM integrity_events
          WHERE session_id = $1
          ORDER BY created_at DESC`,
        [id]
      );

      await audit(req, 'integrity.session.read', { targetType: 'session', targetId: id });

      return {
        ok: true,
        session: s.rows[0],
        reviews: reviews.rows,
        integrity_events: events.rows,
      };
    }
  );

  /* ═══ POST /admin/integrity/sessions/:id/review ═══ */
  fastify.post<{ Params: { id: string } }>(
    '/admin/integrity/sessions/:id/review',
    { preHandler: requireAdmin('science') },
    async (req, reply) => {
      const parsed = ReviewBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
      }
      const { id } = req.params;
      const { verdict, reason, notes } = parsed.data;

      const s = await pool.query(
        `SELECT id FROM sessions WHERE id = $1`,
        [id]
      );
      if (!s.rowCount) return reply.code(404).send({ error: 'session_not_found' });

      const r = await pool.query<{ id: string; verdict: string; created_at: string }>(
        `INSERT INTO session_reviews (session_id, reviewer_id, verdict, reason, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, verdict, created_at`,
        [id, req.admin?.id ?? null, verdict, reason, notes ?? null]
      );

      await audit(req, `integrity.review.${verdict}`, {
        targetType: 'session',
        targetId: id,
        reason,
      });

      return reply.code(201).send({
        ok: true,
        review: r.rows[0],
        note: 'Facts unchanged. Rebuild will honor this review.',
      });
    }
  );
};

export default adminIntegrityRoutes;