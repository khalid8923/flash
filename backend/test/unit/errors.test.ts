import { describe, it, expect } from 'vitest';
import { AppError, badRequest, unauthorized, mapPgError, toResponse } from '../../src/lib/errors.js';

describe('errors', () => {
  it('creates AppError with defaults', () => {
    const err = badRequest();
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(400);
    expect(err.category).toBe('VALIDATION');
    expect(err.retryable).toBe(false);
  });

  it('marks rate limit as retryable', () => {
    const err = mapPgError({ code: '40001' });
    expect(err.retryable).toBe(true);
    expect(err.status).toBe(503);
  });

  it('maps unique violation to 409', () => {
    const err = mapPgError({ code: '23505', constraint: 'test' });
    expect(err.status).toBe(409);
    expect(err.code).toBe('DUPLICATE_RECORD');
  });

  it('serializes safely without leaking internals', () => {
    const err = unauthorized();
    const res = toResponse(err, 'req-123');
    expect(res.code).toBe('UNAUTHORIZED');
    expect(res.requestId).toBe('req-123');
    expect(res).not.toHaveProperty('stack');
  });
});