/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Auth Middleware
   Reads `Authorization: Bearer adm_...`, attaches req.admin.
   Role gate: owner bypasses; others must match required role.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAdminToken, logAdminAction, type Admin, type AdminRole } from '../services/auth/admin-auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: Admin;
  }
}

/** PreHandler factory. Pass minRole to restrict. */
export function requireAdmin(minRole?: AdminRole) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'unauthorized', message: 'Missing Bearer token' });
    }
    const token = header.slice(7).trim();
    const admin = await verifyAdminToken(token);
    if (!admin) {
      return reply.code(401).send({ error: 'invalid_token' });
    }
    if (minRole && admin.role !== minRole && admin.role !== 'owner') {
      return reply.code(403).send({
        error: 'forbidden',
        required: minRole,
        your_role: admin.role,
      });
    }
    req.admin = admin;
  };
}

/** Audit helper: use inside route handlers to record actions. */
export async function audit(
  req: FastifyRequest,
  action: string,
  opts: { targetType?: string; targetId?: string; reason?: string } = {}
): Promise<void> {
  try {
    await logAdminAction({
      adminId: req.admin?.id ?? null,
      action,
      targetType: opts.targetType,
      targetId: opts.targetId,
      reason: opts.reason,
      ip: req.ip,
      userAgent: String(req.headers['user-agent'] ?? ''),
    });
  } catch (err) {
    req.log.warn({ err }, 'audit log failed (non-fatal)');
  }
}