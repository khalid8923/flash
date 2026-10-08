/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Platform Health (M13-01)
   Single-pane view: DB + AI + Jobs + Migrations + Flags + Retention.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { getProviderStatus } from '../services/ai/router.js';
import { getJobStats } from '../services/job-runner.js';
import { listFlags } from '../services/feature-flags.js';
import { previewRetention } from '../services/retention.js';

interface ComponentStatus {
  name: string;
  ok: boolean;
  detail: Record<string, unknown>;
}

const adminPlatformRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/platform/health', { preHandler: requireAdmin('ops') }, async (req) => {
    const components: ComponentStatus[] = [];

    /* DB */
    const dbStart = Date.now();
    let dbOk = false;
    let dbMs = 0;
    try {
      await pool.query('SELECT 1');
      dbMs = Date.now() - dbStart;
      dbOk = true;
    } catch { /* db down */ }
    components.push({ name: 'database', ok: dbOk, detail: { ping_ms: dbMs } });

    /* Migrations */
    let migrations = 0;
    try {
      const r = await pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM _migrations');
      migrations = r.rows[0]?.n ?? 0;
    } catch { /* skip */ }
    components.push({ name: 'migrations', ok: migrations > 0, detail: { applied: migrations } });

    /* AI providers */
    let aiOk = false;
    let aiProviders: unknown[] = [];
    try {
      const s = getProviderStatus();
      aiProviders = s.providers.map((p) => ({ name: p.name, enabled: p.enabled }));
      aiOk = s.providers.some((p) => p.enabled);
    } catch { /* skip */ }
    components.push({ name: 'ai_providers', ok: aiOk, detail: { providers: aiProviders } });

    /* Jobs */
    let jobsOk = true;
    let jobsData: Record<string, number> = { pending: 0, running: 0, done: 0, failed: 0 };
    try {
      const js = await getJobStats();
      jobsData = { pending: js.pending, running: js.running, done: js.done, failed: js.failed };
      /* Not OK if failed > 10 or pending > 100 */
      jobsOk = js.failed <= 10 && js.pending <= 100;
    } catch { /* skip */ }
    components.push({ name: 'jobs', ok: jobsOk, detail: jobsData });

    /* Feature flags */
    let flagsTotal = 0;
    let flagsDisabled = 0;
    try {
      const flags = await listFlags();
      flagsTotal = flags.length;
      flagsDisabled = flags.filter((f) => !f.enabled).length;
    } catch { /* skip */ }
    components.push({ name: 'feature_flags', ok: true, detail: { total: flagsTotal, disabled: flagsDisabled } });

    /* Retention */
    let retentionTotal = 0;
    try {
      const r = await previewRetention();
      retentionTotal = r.reduce((a, p) => a + p.would_delete, 0);
    } catch { /* skip */ }
    components.push({ name: 'retention', ok: true, detail: { would_delete: retentionTotal } });

    const allOk = components.every((c) => c.ok);

    await audit(req, 'platform.health.read');

    return {
      ok: allOk,
      ts: new Date().toISOString(),
      uptime_s: Math.floor(process.uptime()),
      components,
    };
  });

  /* Public liveness — no admin auth */
  fastify.get('/admin/platform/ping', async () => ({
    ok: true,
    ts: new Date().toISOString(),
  }));
};

export default adminPlatformRoutes;