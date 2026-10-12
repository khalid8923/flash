/* ============================================================
   FLASH - Safe Fetch Wrapper
   Timeout + retry with backoff + idempotency + classification
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  if (!ERR) { console.error('[safe-fetch] errors.js required'); return; }

  const CFG = {
    timeoutMs: 30000,
    retries: 2,
    baseDelayMs: 600,
    maxDelayMs: 8000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function backoff(attempt) {
    const base = Math.min(CFG.baseDelayMs * Math.pow(2, attempt), CFG.maxDelayMs);
    return base + Math.random() * 0.3 * base;
  }

  function isIdempotentMethod(method) {
    const m = (method || 'GET').toUpperCase();
    return m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
  }

  function safeFetch(url, options) {
    const opts = Object.assign({}, options || {});
    const method = (opts.method || 'GET').toUpperCase();
    const idempotent = isIdempotentMethod(method);
    const hasIdempKey = !!opts.idempotencyKey;
    const maxRetries = (idempotent || hasIdempKey) ? CFG.retries : 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, opts.timeoutMs || CFG.timeoutMs);

    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const headers = Object.assign({}, opts.headers || {});
    if (hasIdempKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    if (!headers['Content-Type'] && opts.body && typeof opts.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    let lastErr = null;

    async function attempt(attemptNum) {
      const fetchOpts = Object.assign({}, opts, { headers, signal: controller.signal });
      delete fetchOpts.idempotencyKey;
      delete fetchOpts.timeoutMs;

      try {
        const res = await fetch(url, fetchOpts);

        if (res.ok) {
          clearTimeout(timeoutId);
          return res;
        }

        const shouldRetry = CFG.retryableStatuses.indexOf(res.status) >= 0;

        if (shouldRetry && attemptNum < maxRetries) {
          await sleep(backoff(attemptNum));
          return attempt(attemptNum + 1);
        }

        const error = new Error('HTTP ' + res.status);
        error.status = res.status;
        error.response = res;

        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.indexOf('application/json') >= 0) {
            error.body = await res.clone().json();
          }
        } catch (_) {}

        const cls = ERR.classify(error);
        ERR.log(cls.category, {
          status: res.status,
          operation: method + ' ' + url,
          requestId: res.headers.get('x-request-id') || null,
          message: 'HTTP ' + res.status
        });

        throw error;
      } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          const abortErr = new Error('Request aborted or timed out');
          abortErr.name = 'AbortError';
          abortErr.status = 0;
          throw abortErr;
        }

        lastErr = err;

        const status = err.status || 0;
        const retryable = !status || status >= 500 || status === 408 || status === 429;

        if (retryable && attemptNum < maxRetries) {
          await sleep(backoff(attemptNum));
          return attempt(attemptNum + 1);
        }

        throw err;
      }
    }

    return attempt(0);
  }

  /* Helpers */
  safeFetch.json = async function (url, options) {
    const res = await safeFetch(url, options);
    const ct = res.headers.get('content-type') || '';
    if (ct.indexOf('application/json') >= 0) return res.json();
    return null;
  };

  safeFetch.text = async function (url, options) {
    const res = await safeFetch(url, options);
    return res.text();
  };

  window.FLASH_SAFE_FETCH = safeFetch;
  window.safeFetch = safeFetch;
})();