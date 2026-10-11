/* =========================================================
   MODULE - API Client
   Unified fetch wrapper with:
     - Timeout via AbortController
     - Retry with backoff
     - In-memory cache with TTL
     - Graceful failure (returns null on error)
   Public: FLASH_API.get(path), .post(path, body), .isLive()
   ========================================================= */
(function(){
'use strict';
const C = window.FLASH_CONFIG;

const state = {
  baseUrl: null,
  live: false,
  lastCheck: 0,
  failures: 0,
  cache: new Map()   // path -> { value, expiresAt }
};

/* ─── Base URL detection ─── */
function detectBaseUrl(){
  const protocol = location.protocol;
  if (protocol === 'file:'){
    /* Try dev URL even from file:// — may work if CORS allows */
    return C.BACKEND_URL.dev;
  }
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1'){
    return C.BACKEND_URL.dev;
  }
  return C.BACKEND_URL.prod;
}

state.baseUrl = detectBaseUrl();

/* ─── Low-level fetch with timeout ─── */
async function fetchWithTimeout(url, opts, timeoutMs){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
    clearTimeout(timer);
    return res;
  } catch (e){
    clearTimeout(timer);
    throw e;
  }
}

/* ─── Retry wrapper ─── */
async function fetchWithRetry(url, opts){
  const { timeoutMs, retryCount, retryDelayMs } = C.REQUEST;
  let lastErr = null;

  for (let attempt = 0; attempt <= retryCount; attempt++){
    try {
      const res = await fetchWithTimeout(url, opts, timeoutMs);
      if (!res.ok){
        /* Don't retry 4xx — client errors */
        if (res.status >= 400 && res.status < 500){
          return { ok: false, status: res.status, error: 'client_error', data: null };
        }
        /* 5xx gets retried */
        lastErr = 'server_error_' + res.status;
      } else {
        const data = await res.json().catch(() => null);
        return { ok: true, status: res.status, data };
      }
    } catch (e){
      lastErr = e.name === 'AbortError' ? 'timeout' : 'network';
    }
    if (attempt < retryCount){
      await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
    }
  }

  return { ok: false, status: 0, error: lastErr || 'unknown', data: null };
}

/* ─── Cache helpers ─── */
function cacheGet(path){
  if (!C.FLAGS.cacheEnabled) return null;
  const hit = state.cache.get(path);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()){
    state.cache.delete(path);
    return null;
  }
  return hit.value;
}
function cacheSet(path, value, ttlKey){
  if (!C.FLAGS.cacheEnabled) return;
  const ttl = C.CACHE_TTL[ttlKey] || 30_000;
  state.cache.set(path, { value, expiresAt: Date.now() + ttl });
}
function cacheClear(){
  state.cache.clear();
}

/* ─── Public API ─── */
async function get(path, opts){
  opts = opts || {};
  const ttlKey = opts.cache;

  /* Cache hit */
  const cached = cacheGet(path);
  if (cached){
    return { ok: true, data: cached, fromCache: true };
  }

  const url = state.baseUrl + path;
  const res = await fetchWithRetry(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  if (res.ok){
    state.failures = 0;
    state.live = true;
    state.lastCheck = Date.now();
    if (ttlKey) cacheSet(path, res.data, ttlKey);
    return { ok: true, data: res.data, fromCache: false };
  }

  state.failures++;
  if (state.failures >= 3){
    state.live = false;
  }
  return { ok: false, error: res.error, data: null };
}

async function post(path, body){
  const url = state.baseUrl + path;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

/* ─── Health check ─── */
async function checkLive(){
  const res = await get('/health', { cache: 'health' });
  state.live = res.ok;
  state.lastCheck = Date.now();
  return state.live;
}

/* ─── Status accessor ─── */
function status(){
  return {
    live: state.live,
    baseUrl: state.baseUrl,
    lastCheck: state.lastCheck,
    failures: state.failures
  };
}

window.FLASH_API = {
  get, post, checkLive, status, cacheClear,
  isLive: () => state.live
};
})();