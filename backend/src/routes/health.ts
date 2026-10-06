import type { FastifyPluginAsync } from 'fastify';
import { ping } from '../config/db.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    const dbOk = await ping();
    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_s: Math.floor(process.uptime()),
      db: dbOk ? 'connected' : 'disconnected',
      version: '0.1.0',
    };
  });
};

export default healthRoutes;
