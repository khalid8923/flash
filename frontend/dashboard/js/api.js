/* ============================================================
   FLASH - API Client (v3 - config-aligned)
   Uses FLASH_SAFE_FETCH for all network calls
   Auto auth header, classified errors, no secret leaks
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const SF  = window.FLASH_SAFE_FETCH;
  const CFG = window.FLASH_CONFIG || {};

  if (!ERR || !SF) {
    console.error('[api] requires errors.js + safe-fetch.js');
    return;
  }

  /* ─── Aligned with config.js ─── */
  const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  const API_BASE = isProd
    ? (CFG.BACKEND_URL && CFG.BACKEND_URL.prod) || 'https://flash-backend.onrender.com'
    : (CFG.BACKEND_URL && CFG.BACKEND_URL.dev) || 'http://localhost:3000';

  /* ─── Auth token ─── */
  function getToken() {
    try { return localStorage.getItem('flash.session'); } catch (_) { return null; }
  }

  function authHeader() {
    const t = getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  /* ─── Core request ─── */
  async function request(path, opts) {
    opts = opts || {};
    const url = /^https?:\/\//.test(path) ? path : API_BASE + path;

    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      authHeader(),
      opts.headers || {}
    );

    try {
      const res = await SF(url, Object.assign({}, opts, {
        headers,
        idempotencyKey: opts.idempotencyKey
      }));
      return await parseBody(res);
    } catch (err) {
      throw enrichError(err, opts);
    }
  }

  async function parseBody(res) {
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct.indexOf('application/json') >= 0) {
      try { return await res.json(); }
      catch (e) {
        ERR.log('INTEGRATION', {
          message: 'Invalid JSON in response',
          operation: res.url,
          status: res.status
        });
        return null;
      }
    }
    return res.text();
  }

  function enrichError(err, opts) {
    const cls = ERR.classify(err);
    err.category = cls.category;
    err.retryable = cls.retryable;
    err.aborted = cls.aborted;

    if (!opts.silent && !cls.aborted) {
      const UI = window.FLASH_UI;
      if (UI && UI.showToast) {
        UI.showToast({
          kind: 'error',
          category: cls.category,
          title: opts.errorTitle || null
        });
      }
    }
    return err;
  }

  /* ─── Public API ─── */
  const API = {
    request,
    baseUrl: API_BASE,

    get: (path, opts) => request(path, Object.assign({}, opts, { method: 'GET' })),

    post: (path, body, opts) => request(path, Object.assign({}, opts, {
      method: 'POST',
      body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    })),

    put: (path, body, opts) => request(path, Object.assign({}, opts, {
      method: 'PUT',
      body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    })),

    del: (path, opts) => request(path, Object.assign({}, opts, { method: 'DELETE' })),

    /* Core */
    health: () => API.get('/health', { silent: true }),
    domains: () => API.get('/domains'),
    games: () => API.get('/games'),
    profile: () => API.get('/profile'),
    sessions: (limit) => API.get('/sessions' + (limit ? '?limit=' + limit : '')),
    plan: () => API.get('/plan'),
    ability: () => API.get('/ability'),
    nextLevel: (gameId) => API.get('/next/' + encodeURIComponent(gameId)),
    decisions: () => API.get('/decisions'),

    /* AI */
    aiChat: (message, opts) => API.post('/ai/chat', Object.assign({ message }, opts || {})),
    aiInsights: (lang) => API.get('/ai/insights' + (lang ? '?language=' + lang : '')),
    aiDailyPlan: (lang) => API.get('/ai/daily-plan' + (lang ? '?language=' + lang : '')),
    aiFingerprint: (lang) => API.get('/ai/fingerprint' + (lang ? '?language=' + lang : '')),
    aiNudge: (payload) => API.post('/ai/nudge', payload),
    aiRecap: (sessionId, lang) => API.post('/ai/recap', {
      session_id: sessionId,
      language: lang || 'en'
    }),

    /* Auth */
    authRequestOtp: (email) => API.post('/auth/otp/request', { email }, { silent: true }),
    authVerifyOtp: (email, code) => API.post('/auth/otp/verify', { email, code }, { silent: true }),
    authMe: () => API.get('/auth/me', { silent: true }),
    authLogout: () => API.post('/auth/logout', null, { silent: true }),

    /* Sessions */
    submitSession: (session, opts) => API.post('/sessions', session, Object.assign({
      idempotencyKey: session.client_session_id
    }, opts || {})),

    /* Privacy */
    meExport: () => API.get('/me/export'),
    meErase: (confirm) => API.post('/me/erase', { confirm })
  };

  /* ─── Status ─── */
  let _lastStatus = { live: false, mode: 'mock', checkedAt: null };

  API.status = () => Object.assign({}, _lastStatus);

  API.checkLive = async () => {
    try {
      const res = await SF(API_BASE + '/health', {
        method: 'GET',
        silent: true,
        timeoutMs: 3000
      });
      _lastStatus = {
        live: !!(res && res.ok),
        mode: res && res.ok ? 'live' : 'mock',
        checkedAt: Date.now()
      };
    } catch (_) {
      _lastStatus = { live: false, mode: 'mock', checkedAt: Date.now() };
    }
    try {
      window.dispatchEvent(new CustomEvent('flash:api-status', { detail: _lastStatus }));
    } catch (_) {}
    return _lastStatus;
  };

  setTimeout(() => { API.checkLive().catch(() => {}); }, 500);
  setInterval(() => { API.checkLive().catch(() => {}); }, 30000);

  window.FLASH_API = API;
  window.api = API;

  console.info('[FLASH_API] v3 ready — base:', API_BASE, '(mode:', isProd ? 'prod' : 'dev', ')');
})();