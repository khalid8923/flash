/* ═══════════════════════════════════════════════════════════
   FLASH - Admin Privacy Routes (M12-01/02)
   GET /admin/privacy/inventory       — data inventory
   GET /admin/privacy/processors      — processor register
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin, audit } from '../middleware/admin-auth.js';
import { DATA_INVENTORY, PROCESSOR_REGISTER, inventoryByClass } from '../services/privacy.js';

const adminPrivacyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/privacy/inventory', { preHandler: requireAdmin('support') }, async (req) => {
    await audit(req, 'privacy.inventory.read');
    return {
      ok: true,
      total: DATA_INVENTORY.length,
      by_class: inventoryByClass(),
      inventory: DATA_INVENTORY,
    };
  });

  fastify.get('/admin/privacy/processors', { preHandler: requireAdmin('support') }, async (req) => {
    await audit(req, 'privacy.processors.read');
    return {
      ok: true,
      total: PROCESSOR_REGISTER.length,
      processors: PROCESSOR_REGISTER,
    };
  });
};

export default adminPrivacyRoutes;