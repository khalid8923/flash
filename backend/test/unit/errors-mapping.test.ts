import { describe, it, expect } from 'vitest';
import { mapPgError, AppError } from '../../src/lib/errors.js';

describe('PostgreSQL error mapping', () => {
  it('23505 (unique) → 409 DUPLICATE_RECORD', () => {
    const e = mapPgError({ code: '23505', constraint: 'users_email_key' });
    expect(e.status).toBe(409);
    expect(e.code).toBe('DUPLICATE_RECORD');
    expect(e.category).toBe('SAVE_SYNC');
  });

  it('23503 (fk) → 400 FK_VIOLATION', () => {
    const e = mapPgError({ code: '23503' });
    expect(e.status).toBe(400);
    expect(e.code).toBe('FK_VIOLATION');
  });

  it('23502 (not null) → 422', () => {
    const e = mapPgError({ code: '23502' });
    expect(e.status).toBe(422);
    expect(e.code).toBe('NOT_NULL_VIOLATION');
  });

  it('23514 (check) → 422 CHECK_VIOLATION', () => {
    const e = mapPgError({ code: '23514' });
    expect(e.status).toBe(422);
  });

  it('40001 (serialization) → 503 retryable', () => {
    const e = mapPgError({ code: '40001' });
    expect(e.status).toBe(503);
    expect(e.retryable).toBe(true);
  });

  it('40P01 (deadlock) → 503 retryable', () => {
    const e = mapPgError({ code: '40P01' });
    expect(e.status).toBe(503);
    expect(e.retryable).toBe(true);
  });

  it('57014 (timeout) → 504 retryable', () => {
    const e = mapPgError({ code: '57014' });
    expect(e.status).toBe(504);
    expect(e.retryable).toBe(true);
  });

  it('53300 (pool) → 503 retryable', () => {
    const e = mapPgError({ code: '53300' });
    expect(e.status).toBe(503);
    expect(e.retryable).toBe(true);
  });

  it('unknown PG code → 500 generic', () => {
    const e = mapPgError({ code: '99999' });
    expect(e.status).toBe(500);
    expect(e.category).toBe('SERVER');
  });

  it('already-AppError passthrough', () => {
    const orig = new AppError({
      code: 'CUSTOM',
      category: 'VALIDATION',
      status: 422,
      message: 'custom',
    });
    const e = mapPgError(orig);
    expect(e).toBe(orig);
  });
});