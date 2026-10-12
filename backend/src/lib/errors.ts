/* ============================================================
   FLASH Backend - Central Error Types
   ============================================================ */

export type ErrorCategory =
  | 'NETWORK'
  | 'AUTH'
  | 'PERMISSION'
  | 'VALIDATION'
  | 'GAME_STATE'
  | 'SAVE_SYNC'
  | 'AI_SERVICE'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'STORAGE'
  | 'INTEGRATION'
  | 'UNKNOWN';

export interface AppErrorOptions {
  code: string;
  category: ErrorCategory;
  status: number;
  message: string;
  retryable?: boolean;
  userMessage?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  code: string;
  category: ErrorCategory;
  status: number;
  retryable: boolean;
  userMessage: string;
  requestId?: string;
  context: Record<string, unknown>;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = 'AppError';
    this.code = opts.code;
    this.category = opts.category;
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
    this.userMessage = opts.userMessage ?? defaultUserMessage(opts.category);
    this.requestId = opts.requestId;
    this.context = opts.context ?? {};
    Error.captureStackTrace?.(this, AppError);
  }
}

function defaultUserMessage(category: ErrorCategory): string {
  const M: Record<ErrorCategory, string> = {
    NETWORK: 'Connection issue. Try again.',
    AUTH: 'Your session has ended. Sign in again.',
    PERMISSION: 'You do not have access.',
    VALIDATION: 'Please check your input.',
    GAME_STATE: 'This session is no longer available.',
    SAVE_SYNC: 'Your result is waiting to sync.',
    AI_SERVICE: 'AI assistant temporarily unavailable.',
    RATE_LIMIT: 'Too many requests. Try again shortly.',
    SERVER: 'Something went wrong.',
    STORAGE: 'Storage unavailable.',
    INTEGRATION: 'A service we depend on is unavailable.',
    UNKNOWN: 'Something unexpected happened.'
  };
  return M[category] ?? M.UNKNOWN;
}

/* ============================================================
   COMMON CONSTRUCTORS
   ============================================================ */

export const badRequest = (msg = 'Bad request', code = 'BAD_REQUEST') =>
  new AppError({ code, category: 'VALIDATION', status: 400, message: msg });

export const unauthorized = (msg = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new AppError({ code, category: 'AUTH', status: 401, message: msg });

export const forbidden = (msg = 'Forbidden', code = 'FORBIDDEN') =>
  new AppError({ code, category: 'PERMISSION', status: 403, message: msg });

export const notFound = (msg = 'Not found', code = 'NOT_FOUND') =>
  new AppError({ code, category: 'GAME_STATE', status: 404, message: msg });

export const conflict = (msg = 'Conflict', code = 'CONFLICT') =>
  new AppError({ code, category: 'SAVE_SYNC', status: 409, message: msg });

export const unprocessable = (msg = 'Unprocessable', code = 'UNPROCESSABLE') =>
  new AppError({ code, category: 'VALIDATION', status: 422, message: msg });

export const tooManyRequests = (msg = 'Too many requests', code = 'RATE_LIMIT') =>
  new AppError({ code, category: 'RATE_LIMIT', status: 429, message: msg, retryable: true });

export const serverError = (msg = 'Internal error', code = 'SERVER_ERROR') =>
  new AppError({ code, category: 'SERVER', status: 500, message: msg, retryable: true });

export const serviceUnavailable = (msg = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') =>
  new AppError({ code, category: 'SERVER', status: 503, message: msg, retryable: true });

/* ============================================================
   POSTGRES ERROR MAPPING
   ============================================================ */

interface PgError {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

export function mapPgError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const pgErr = err as PgError;
  const code = pgErr?.code;

  switch (code) {
    case '23505': /* unique_violation */
      return new AppError({
        code: 'DUPLICATE_RECORD',
        category: 'SAVE_SYNC',
        status: 409,
        message: 'Duplicate record',
        context: { constraint: pgErr.constraint }
      });
    case '23503': /* foreign_key_violation */
      return new AppError({
        code: 'FK_VIOLATION',
        category: 'VALIDATION',
        status: 400,
        message: 'Reference does not exist',
        context: { constraint: pgErr.constraint }
      });
    case '23502': /* not_null_violation */
      return new AppError({
        code: 'NOT_NULL_VIOLATION',
        category: 'VALIDATION',
        status: 422,
        message: 'Required field is missing'
      });
    case '23514': /* check_violation */
      return new AppError({
        code: 'CHECK_VIOLATION',
        category: 'VALIDATION',
        status: 422,
        message: 'Value violates constraint'
      });
    case '40001': /* serialization_failure */
    case '40P01': /* deadlock_detected */
      return new AppError({
        code: 'TRANSIENT_CONFLICT',
        category: 'SAVE_SYNC',
        status: 503,
        message: 'Transient conflict',
        retryable: true
      });
    case '57014': /* query_canceled */
      return new AppError({
        code: 'QUERY_TIMEOUT',
        category: 'SERVER',
        status: 504,
        message: 'Query timed out',
        retryable: true
      });
    case '53300': /* too_many_connections */
      return new AppError({
        code: 'POOL_EXHAUSTED',
        category: 'SERVER',
        status: 503,
        message: 'Database pool exhausted',
        retryable: true
      });
    default:
      return new AppError({
        code: 'DB_ERROR',
        category: 'SERVER',
        status: 500,
        message: 'Database error',
        context: { pgCode: code || 'unknown' }
      });
  }
}

/* ============================================================
   RESPONSE SERIALIZER
   ============================================================ */

export interface ErrorResponse {
  error: string;
  code: string;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  requestId?: string;
}

export function toResponse(err: AppError, requestId?: string): ErrorResponse {
  return {
    error: err.code,
    code: err.code,
    category: err.category,
    message: err.userMessage,
    retryable: err.retryable,
    requestId: requestId || err.requestId
  };
}