/* ============================================================
   FLASH - API Client (Phase 3 Patch)
   ============================================================ */
(function () {
  'use strict';
  const SF = window.FLASH_SAFE_FETCH;
  const ERR = window.FLASH_ERRORS;
  const API_BASE = window.FLASH_CONFIG.API_BASE;
  const liveMode = window.FLASH_CONFIG.liveMode;

  async function request(path, opts = {}) {
    if (!liveMode) throw new Error('offline_mode');
    
    const url = path.startsWith('http') ? path : API_BASE + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers);
    
    const token = localStorage.getItem('flash.session');
    if (token) headers['Authorization'] = 'Bearer ' + token;

    try {
      const res = await SF(url, Object.assign({}, opts, { headers }));
      if (res.status === 204) return null;
      const ct = res.headers.get('content-type') || '';
      return ct.includes('application/json') ? await res.json() : await res.text();
    } catch (err) {
      // Silent fail for 401 in dev (expected without login)
      if (err.status === 401 && window.location.hostname === 'localhost') {
        console.warn('[API] 401 Unauthorized - Dev Demo Mode active');
        return null; 
      }
      if (ERR) ERR.log('NETWORK', { message: err.message, operation: path });
      throw err;
    }
  }

  const API = {
    get: (p) => request(p, { method: 'GET' }),
    post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
    
    health: () => API.get('/health'),
    snapshot: () => API.get('/profile/snapshot'),
    sessions: () => API.get('/sessions?limit=10'),
    plan: () => API.get('/plan'),
    xp: () => API.get('/me/xp'),
    
    submitSession: (session) => API.post('/sessions', session),
    aiRecap: (sessionId, lang) => API.post('/ai/recap', { session_id: sessionId, language: lang }),
    
    aiChat: (msg, lang) => API.post('/ai/chat', { message: msg, language: lang }),
    aiDailyPlan: (lang) => API.get('/ai/daily-plan?language=' + lang),
    aiFingerprint: (lang) => API.get('/ai/fingerprint?language=' + lang),
    aiInsights: (lang) => API.get('/ai/insights?language=' + lang),
    dailyChallenge: () => API.get('/daily-challenge'),
    
    authMe: () => API.get('/auth/me')
  };

  window.FLASH_API = API;
  window.api = API;
  console.log('[FLASH_API] Phase 3 Ready.');
})();