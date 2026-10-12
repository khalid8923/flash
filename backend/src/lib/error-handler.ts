/* ============================================================
   FLASH Backend - Central Error Handler Plugin
   ============================================================ */
import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError, mapPgError, toResponse } from './errors.js';
import { randomUUID } from 'node:crypto';

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  /* Generate request ID if not present */
  app.addHook('onRequest', async (req) => {
    if (!req.headers['x-request-id']) {
      (req as FastifyRequest & { id: string }).id = randomUUID();
    }
  });

  app.setErrorHandler((err: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req as FastifyRequest & { id: string }).id ||
      undefined;

    /* Map to AppError */
    let appErr: AppError;

    if (err instanceof AppError) {
      appErr = err;
    } else if (err.validation) {
      appErr = new AppError({
        code: 'VALIDATION_ERROR',
        category: 'VALIDATION',
        status: 400,
        message: 'Request validation failed',
        context: { details: err.validation }
      });
    } else if (err.statusCode === 429) {
      appErr = new AppError({
        code: 'RATE_LIMIT',
        category: 'RATE_LIMIT',
        status: 429,
        message: 'Too many requests',
        retryable: true
      });
    } else if (err.statusCode === 413) {
      appErr = new AppError({
        code: 'PAYLOAD_TOO_LARGE',
        category: 'VALIDATION',
        status: 413,
        message: 'Request payload too large'
      });
    } else if ((err as { code?: string }).code && /^[0-9A-Z]{5}$/.test((err as { code?: string }).code || '')) {
      /* Postgres error shape */
      appErr = mapPgError(err);
    } else if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      appErr = new AppError({
        code: 'CLIENT_ERROR',
        category: 'VALIDATION',
        status: err.statusCode,
        message: err.message || 'Client error'
      });
    } else {
      appErr = new AppError({
        code: 'SERVER_ERROR',
        category: 'SERVER',
        status: 500,
        message: 'Internal server error',
        retryable: true
      });
    }

    /* Log safely (never leak secrets) */
    const logLevel = appErr.status >= 500 ? 'error' : 'warn';
    req.log[logLevel]({
      err: {
        code: appErr.code,
        category: appErr.category,
        status: appErr.status,
        message: appErr.message
      },
      requestId,
      context: appErr.context,
      path: req.url,
      method: req.method
    }, 'Request error');

    /* Send response */
    const body = toResponse(appErr, requestId);

    reply
      .code(appErr.status)
      .header('x-request-id', requestId || '')
      .header('content-type', 'application/json; charset=utf-8')
      .send(body);
  });

  /* 404 handler */
  app.setNotFoundHandler((req, reply) => {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req as FastifyRequest & { id: string }).id ||
      undefined;

    reply
      .code(404)
      .header('x-request-id', requestId || '')
      .send({
        error: 'NOT_FOUND',
        code: 'NOT_FOUND',
        category: 'GAME_STATE',
        message: 'Resource not found',
        retryable: false,
        requestId
      });
  });
}