/* ============================================================
   FLASH - Central Error System
   Classification, logging, message mapping (EN + AR)
   ============================================================ */
(function () {
  'use strict';

  const CATEGORIES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    PERMISSION: 'PERMISSION',
    VALIDATION: 'VALIDATION',
    GAME_STATE: 'GAME_STATE',
    SAVE_SYNC: 'SAVE_SYNC',
    AI_SERVICE: 'AI_SERVICE',
    RATE_LIMIT: 'RATE_LIMIT',
    SERVER: 'SERVER',
    STORAGE: 'STORAGE',
    INTEGRATION: 'INTEGRATION',
    UNKNOWN: 'UNKNOWN'
  };

  const RETRYABLE = new Set([
    CATEGORIES.NETWORK,
    CATEGORIES.RATE_LIMIT,
    CATEGORIES.SERVER,
    CATEGORIES.AI_SERVICE
  ]);

  const MESSAGES = {
    en: {
      NETWORK:      'Connection issue. Retrying...',
      AUTH:         'Your session ended. Please sign in again.',
      PERMISSION:   "You don't have access to this.",
      VALIDATION:   'Please check your input.',
      GAME_STATE:   'This session is no longer available.',
      SAVE_SYNC:    'Your result is waiting to sync.',
      AI_SERVICE:   'AI assistant is temporarily unavailable.',
      RATE_LIMIT:   'Too many requests. Try again in a moment.',
      SERVER:       'Something went wrong. We are on it.',
      STORAGE:      'Local storage is full or blocked.',
      INTEGRATION:  'A service we depend on is unavailable.',
      UNKNOWN:      'Something unexpected happened.'
    },
    ar: {
      NETWORK:      'مشكلة في الاتصال. بتحاول تاني...',
      AUTH:         'انتهت جلستك. سجّل دخول تاني.',
      PERMISSION:   'مش عندك صلاحية للوصول.',
      VALIDATION:   'اتأكد من البيانات المدخلة.',
      GAME_STATE:   'الجلسة دي مبقاش متاحة.',
      SAVE_SYNC:    'النتيجة بتنتظر المزامنة.',
      AI_SERVICE:   'المساعد الذكي مش متاح مؤقتًا.',
      RATE_LIMIT:   'طلبات كثيرة. حاول بعد شوية.',
      SERVER:       'حصلت مشكلة. بنعالجها.',
      STORAGE:      'مساحة التخزين ممتلئة أو مغلقة.',
      INTEGRATION:  'خدمة خارجية متعطلة.',
      UNKNOWN:      'حصلت حاجة غير متوقعة.'
    }
  };

  const STATUS_MAP = {
    400: CATEGORIES.VALIDATION,
    401: CATEGORIES.AUTH,
    403: CATEGORIES.PERMISSION,
    404: CATEGORIES.GAME_STATE,
    405: CATEGORIES.UNKNOWN,
    408: CATEGORIES.NETWORK,
    409: CATEGORIES.SAVE_SYNC,
    410: CATEGORIES.GAME_STATE,
    413: CATEGORIES.VALIDATION,
    415: CATEGORIES.VALIDATION,
    422: CATEGORIES.VALIDATION,
    429: CATEGORIES.RATE_LIMIT,
    500: CATEGORIES.SERVER,
    502: CATEGORIES.SERVER,
    503: CATEGORIES.SERVER,
    504: CATEGORIES.SERVER
  };

  function genId() {
    return 'err_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function classify(err) {
    if (!err) return { category: CATEGORIES.UNKNOWN, retryable: false, aborted: false };

    if (err.name === 'AbortError') {
      return { category: CATEGORIES.NETWORK, retryable: false, aborted: true };
    }

    const status = err.status || err.httpStatus || 0;
    if (status && STATUS_MAP[status]) {
      const category = STATUS_MAP[status];
      return { category, retryable: RETRYABLE.has(category), aborted: false, status };
    }

    if (err.name === 'TypeError' && /fetch|network/i.test(err.message || '')) {
      return { category: CATEGORIES.NETWORK, retryable: true, aborted: false };
    }

    if (err.name === 'QuotaExceededError') {
      return { category: CATEGORIES.STORAGE, retryable: false, aborted: false };
    }

    return { category: CATEGORIES.UNKNOWN, retryable: false, aborted: false };
  }

  function message(category, langOverride) {
    const lang = langOverride || document.documentElement.lang || 'en';
    const dict = MESSAGES[lang] || MESSAGES.en;
    return dict[category] || dict.UNKNOWN;
  }

  function isRetryable(category) { return RETRYABLE.has(category); }

  /* ==========================================================
     LOG - safe, never leaks secrets
     ========================================================== */
  const LOG_KEY = 'flash.errorLog';
  const LOG_MAX = 50;

  function readLog() {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function writeLog(arr) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(-LOG_MAX)));
    } catch (_) {}
  }

  function sanitizeContext(ctx) {
    if (!ctx) return {};
    const out = {};
    const BANNED = /token|password|secret|apikey|api_key|authorization|cookie/i;
    for (const k in ctx) {
      if (BANNED.test(k)) { out[k] = '[redacted]'; continue; }
      const v = ctx[k];
      if (typeof v === 'string' && v.length > 500) out[k] = v.slice(0, 500) + '...';
      else out[k] = v;
    }
    return out;
  }

  function log(category, options) {
    const opts = options || {};
    const entry = {
      id: opts.id || genId(),
      category,
      severity: opts.severity || (category === CATEGORIES.SERVER ? 'high' : 'medium'),
      message: opts.message || null,
      context: sanitizeContext(opts.context),
      feature: opts.feature || null,
      operation: opts.operation || null,
      requestId: opts.requestId || null,
      status: opts.status || null,
      userImpact: opts.userImpact || null,
      timestamp: new Date().toISOString()
    };

    const arr = readLog();
    arr.push(entry);
    writeLog(arr);

    const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isDev || window.FLASH_DEBUG) {
      console.warn('[FLASH/' + category + ']', entry);
    }

    try {
      window.dispatchEvent(new CustomEvent('flash:error', { detail: entry }));
    } catch (_) {}

    return entry;
  }

  function getLog() { return readLog(); }

  function clearLog() {
    try { localStorage.removeItem(LOG_KEY); } catch (_) {}
  }

  /* ==========================================================
     EXPORT
     ========================================================== */
  window.FLASH_ERRORS = {
    CATEGORIES,
    RETRYABLE,
    classify,
    message,
    isRetryable,
    log,
    getLog,
    clearLog,
    genId,
    version: '1.0.0'
  };
})();