/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Console v0 (M45)
   Single endpoint that aggregates the key admin views
   into a dashboard summary.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getJobStats } from '../services/job-runner.js';
import { previewRetention } from '../services/retention.js';

const adminConsoleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/console', { preHandler: requireAdmin('ops') }, async (req) => {
    const [
      usersTotal, usersReal, usersDemo,
      sessionsTotal, sessions24h,
      flagsTotal, flagsDisabled,
      integrityRecent,
      jobs,
      retention,
    ] = await Promise.all([
      pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM users WHERE deleted_at IS NULL'),
      pool.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM users WHERE origin='real' AND deleted_at IS NULL"),
      pool.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM users WHERE origin='demo' AND deleted_at IS NULL"),
      pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM sessions'),
      pool.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM sessions WHERE started_at > NOW() - INTERVAL '24 hours'"),
      pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM feature_flags'),
      pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM feature_flags WHERE enabled = false'),
      pool.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM integrity_events WHERE created_at > NOW() - INTERVAL '7 days'"),
      getJobStats(),
      previewRetention(),
    ]);

    const retentionTotal = retention.reduce((a, r) => a + r.would_delete, 0);

    await audit(req, 'console.read');

    return {
      ok: true,
      ts: new Date().toISOString(),
      users: {
        total: usersTotal.rows[0]?.n ?? 0,
        real:  usersReal.rows[0]?.n ?? 0,
        demo:  usersDemo.rows[0]?.n ?? 0,
      },
      sessions: {
        total: sessionsTotal.rows[0]?.n ?? 0,
        last_24h: sessions24h.rows[0]?.n ?? 0,
      },
      flags: {
        total: flagsTotal.rows[0]?.n ?? 0,
        disabled: flagsDisabled.rows[0]?.n ?? 0,
      },
      integrity: {
        events_7d: integrityRecent.rows[0]?.n ?? 0,
      },
      jobs: {
        pending: jobs.pending,
        running: jobs.running,
        done: jobs.done,
        failed: jobs.failed,
      },
      retention: {
        total_would_delete: retentionTotal,
        table_count: retention.length,
      },
    };
  });
};

export default adminConsoleRoutes;