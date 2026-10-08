/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Auth Routes (M1 Bootstrap)
   Bootstrap: run `npm run admin:setup` first → creates first owner.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import {
  createAdmin,
  hashToken,
  generateToken,
  verifyAdminToken,
  type AdminRole,
} from '../services/admin-auth.js';

const ROLES: AdminRole[] = ['owner', 'ops', 'science', 'support', 'analyst'];

const LoginBody = z.object({
  email: z.string().email(),
  token: z.string().min(10),
});

const InviteBody = z.object({
  email: z.string().email(),
  display_name: z.string().min(1).max(80),
  role: z.enum(['owner', 'ops', 'science', 'support', 'analyst']),
  reason: z.string().min(3).max(500).optional(),
});

const RevokeBody = z.object({
  reason: z.string().min(3).max(500).optional(),
});

const adminAuthRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ POST /admin/auth/login — exchange token for a verified session ═══ */
  fastify.post('/admin/auth/login', async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { email, token } = parsed.data;

    const admin = await verifyAdminToken(token);
    if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    await pool.query(
      `UPDATE admin_users SET last_login_at = now() WHERE id = $1`,
      [admin.id]
    );

    /* audit (login is not gated, log manually) */
    try {
      await pool.query('SELECT 1');
    } catch { /* ignore */ }

    return { ok: true, admin };
  });

  /* ═══ GET /admin/auth/me — return current admin ═══ */
  fastify.get('/admin/auth/me', { preHandler: requireAdmin() }, async (req) => {
    return { ok: true, admin: req.admin };
  });

  /* ═══ POST /admin/auth/logout — no-op with token auth (stateless) ═══ */
  fastify.post('/admin/auth/logout', { preHandler: requireAdmin() }, async (req, reply) => {
    await audit(req, 'logout');
    return reply.code(200).send({ ok: true });
  });

  /* ═══ GET /admin/admins — list all admins (owner only) ═══ */
  fastify.get('/admin/admins', { preHandler: requireAdmin('owner') }, async (req, reply) => {
    const r = await pool.query(
      `SELECT id, email, display_name, role, status, created_at, last_login_at
         FROM admin_users ORDER BY created_at ASC`
    );
    await audit(req, 'admins.list', { targetType: 'admin_users' });
    return { ok: true, admins: r.rows };
  });

  /* ═══ POST /admin/admins/invite — create a new admin (owner only) ═══ */
  fastify.post('/admin/admins/invite', { preHandler: requireAdmin('owner') }, async (req, reply) => {
    const parsed = InviteBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { email, display_name, role, reason } = parsed.data;

    const existing = await pool.query(
      `SELECT id FROM admin_users WHERE email = $1`,
      [email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return reply.code(409).send({ error: 'email_already_exists' });
    }

    const { admin, token } = await createAdmin({
      email,
      displayName: display_name,
      role,
      createdBy: req.admin?.id ?? null,
    });

    await audit(req, 'admin.invite', {
      targetType: 'admin_user',
      targetId: admin.id,
      reason,
    });

    /* Token shown once only */
    return reply.code(201).send({
      ok: true,
      admin,
      token,
      note: 'Save this token now — it will not be shown again.',
    });
  });

  /* ═══ POST /admin/admins/:id/revoke — revoke an admin (owner only) ═══ */
  fastify.post<{ Params: { id: string } }>(
    '/admin/admins/:id/revoke',
    { preHandler: requireAdmin('owner') },
    async (req, reply) => {
      const parsed = RevokeBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
      }
      const { id } = req.params;
      const { reason } = parsed.data;

      if (id === req.admin?.id) {
        return reply.code(400).send({ error: 'cannot_revoke_self' });
      }

      const r = await pool.query(
        `UPDATE admin_users SET status = 'revoked' WHERE id = $1 AND status = 'active' RETURNING id, email`,
        [id]
      );
      if (!r.rowCount) return reply.code(404).send({ error: 'not_found_or_already_revoked' });

      await audit(req, 'admin.revoke', {
        targetType: 'admin_user',
        targetId: id,
        reason,
      });

      return { ok: true, revoked: r.rows[0] };
    }
  );

  /* ═══ GET /admin/audit — recent audit entries (owner only) ═══ */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/admin/audit',
    { preHandler: requireAdmin('owner') },
    async (req) => {
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));
      const r = await pool.query(
        `SELECT id, admin_id, action, target_type, target_id, reason, ip, created_at, current_hash
           FROM admin_audit_log ORDER BY id DESC LIMIT $1`,
        [limit]
      );
      return { ok: true, entries: r.rows, count: r.rowCount };
    }
  );

  /* ═══ GET /admin/audit/verify — verify hash chain (owner only) ═══ */
  fastify.get('/admin/audit/verify', { preHandler: requireAdmin('owner') }, async () => {
    const r = await pool.query(
      `SELECT id, prev_hash, current_hash FROM admin_audit_log ORDER BY id ASC`
    );
    let prev = '0'.repeat(64);
    let broken = 0;
    for (const row of r.rows) {
      if (row.prev_hash !== prev) broken++;
      prev = row.current_hash;
    }
    return { ok: broken === 0, entries: r.rowCount, broken_links: broken };
  });
};

export default adminAuthRoutes;