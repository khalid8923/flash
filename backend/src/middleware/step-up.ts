/* ═══════════════════════════════════════════════════════════
   FLASH - Step-up Auth (M1-04)
   Requires recent activity (last_seen_at within STEP_UP_MS)
   for destructive admin actions.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../config/db.js';

const STEP_UP_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Reads req.admin.id and checks that the admin's last action
 * (or last login) was within STEP_UP_MS.
 * Requires requireAdmin() to run first.
 */
export async function requireStepUp(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const adminId = req.admin?.id;
  if (!adminId) {
    return reply.code(401).send({ error: 'unauthorized' });
  }

  const r = await pool.query<{ recent: boolean }>(
    `SELECT (last_login_at IS NOT NULL AND last_login_at > now() - ($1 || ' milliseconds')::interval) AS recent
       FROM admin_users WHERE id = $2 AND status = 'active'`,
    [String(STEP_UP_MS), adminId]
  );

  if (!r.rows[0]?.recent) {
    return reply.code(403).send({
      error: 'step_up_required',
      message: 'This action requires re-authentication within the last 5 minutes.',
    });
  }
}

/** Touch step-up (used at login + sensitive reads). */
export async function touchStepUp(adminId: string): Promise<void> {
  await pool.query(
    `UPDATE admin_users SET last_login_at = now() WHERE id = $1`,
    [adminId]
  );
}