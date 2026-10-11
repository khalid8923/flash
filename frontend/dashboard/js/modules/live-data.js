/* =========================================================
   MODULE - Live Data
   Fetches real data from the backend and merges it into
   FLASH.M. Falls back to mock data on any failure.
   Re-renders the dashboard when data arrives.

   Flow:
     1. Check /health once
     2. If live → fetch /profile, /sessions, /plan in parallel
     3. Merge into FLASH.M (only fields that exist in response)
     4. Dispatch flash:render
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;
const A = window.FLASH_API;
const C = window.FLASH_CONFIG;

const state = {
  loaded: false,
  loading: false,
  source: 'mock',          // 'live' | 'mock' | 'partial'
  lastLoaded: 0
};

/* ─── Merge helpers ─── */
function mergeUser(data){
  if (!data) return false;
  let changed = false;
  const u = F.M.user;

  // /profile returns: { user: { level, xp, ... }, stats: { ... } }
  if (data.user){
    if (typeof data.user.level === 'number'){ u.level = data.user.level; changed = true; }
    if (typeof data.user.xp === 'number'){ u.xp = data.user.xp; changed = true; }
    if (typeof data.user.xp_next === 'number'){ u.xpNext = data.user.xp_next; changed = true; }
    if (typeof data.user.streak === 'number'){ u.streak = data.user.streak; changed = true; }
  }
  if (data.stats){
    if (typeof data.stats.freeze_tokens === 'number'){ u.freezeTokens = data.stats.freeze_tokens; changed = true; }
  }
  return changed;
}

function mergeDomains(profile){
  if (!profile || !profile.domain_scores) return false;
  let changed = false;

  const scoreMap = {};
  const scores = Array.isArray(profile.domain_scores)
    ? profile.domain_scores
    : Object.entries(profile.domain_scores).map(([id, v]) => ({ domain_id: id, score: v }));

  scores.forEach(s => {
    const id = s.domain_id || s.id;
    if (!id) return;
    scoreMap[id] = s;
  });

  F.M.domains.forEach(d => {
    const live = scoreMap[d.id];
    if (live){
      if (typeof live.score === 'number' && live.score !== d.mastery){
        /* Score may be 0-1; normalize */
        const normalized = live.score <= 1 ? Math.round(live.score * 100) : Math.round(live.score);
        d.mastery = Math.max(0, Math.min(100, normalized));
        changed = true;
      }
    }
  });

  return changed;
}

function mergeSessions(sessionsData){
  if (!sessionsData || !Array.isArray(sessionsData.sessions)) return false;
  const list = sessionsData.sessions;
  if (!list.length) return false;

  const mapped = list.slice(0, 10).map(s => ({
    date: (s.ended_at || s.server_received_at || '').slice(0, 10),
    game_en: s.game_name_en || s.game_id,
    game_ar: s.game_name_ar || s.game_id,
    domain: s.domain_id,
    accuracy: typeof s.accuracy === 'number' ? Math.round(s.accuracy) : 0,
    medianRT: typeof s.median_rt_ms === 'number' ? Math.round(s.median_rt_ms) : 0,
    deltaVsPB: 0
  }));

  F.M.recentSessions = mapped;
  return true;
}

function mergePlan(planData){
  if (!planData || !Array.isArray(planData.sessions)) return false;
  const list = planData.sessions;
  if (!list.length) return false;

  F.M.todayPlan = list.slice(0, 3).map((p, i) => ({
    kind_en: p.kind || ['Warm-up', 'Main', 'Challenge'][i] || 'Session',
    kind_ar: p.kind_ar || ['إحماء', 'أساسي', 'تحدٍّ'][i] || 'جلسة',
    game_en: p.game_name_en || p.game_id,
    game_ar: p.game_name_ar || p.game_id,
    domain: p.domain_id,
    minutes: p.minutes || 5,
    reason_en: p.reason_en || p.reason || 'Recommended for you',
    reason_ar: p.reason_ar || p.reason || 'مقترح لك'
  }));
  return true;
}

/* ─── Load everything ─── */
async function loadAll(){
  if (state.loading) return;
  state.loading = true;

  dispatch('flash:data-loading', { loading: true });

  try {
    /* Health first */
    const live = await A.checkLive();
    if (!live){
      state.source = 'mock';
      state.loading = false;
      dispatch('flash:data-loaded', { source: 'mock', reason: 'no_backend' });
      return;
    }

    /* Parallel fetch */
    const [profileRes, sessionsRes, planRes] = await Promise.all([
      A.get('/profile',      { cache: 'profile' }),
      A.get('/sessions?limit=10', { cache: 'sessions' }),
      A.get('/plan',         { cache: 'plan' })
    ]);

    let merged = 0;
    if (profileRes.ok){
      if (mergeUser(profileRes.data)) merged++;
      if (mergeDomains(profileRes.data)) merged++;
    }
    if (sessionsRes.ok && mergeSessions(sessionsRes.data)) merged++;
    if (planRes.ok && mergePlan(planRes.data)) merged++;

    state.source = merged > 0 ? 'live' : 'partial';
    state.loaded = true;
    state.lastLoaded = Date.now();

    dispatch('flash:data-loaded', {
      source: state.source,
      merged,
      profile: profileRes.ok,
      sessions: sessionsRes.ok,
      plan: planRes.ok
    });

    /* Trigger re-render */
    window.dispatchEvent(new Event('flash:render'));

  } catch (e){
    state.source = 'mock';
    dispatch('flash:data-loaded', { source: 'mock', reason: 'error', message: String(e) });
  } finally {
    state.loading = false;
    dispatch('flash:data-loading', { loading: false });
  }
}

/* ─── Dispatch helper ─── */
function dispatch(name, detail){
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch(e){}
}

/* ─── Public ─── */
function refresh(){
  A.cacheClear();
  state.loaded = false;
  return loadAll();
}

/* ─── Init ─── */
F.onReady(() => {
  if (!C.FLAGS.liveMode) return;
  /* Delay so the first paint happens with mock data */
  setTimeout(loadAll, 500);
  /* Refresh every 60 seconds */
  setInterval(() => {
    if (!document.hidden) loadAll();
  }, 60_000);
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.liveData = {
  load: loadAll,
  refresh,
  status: () => Object.assign({}, state)
};
})();