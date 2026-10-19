/* ============================================================
   FLASH - Live Data Loader
   Fetches real data from backend and updates FLASH_DATA
   ============================================================ */
(function () {
  'use strict';
  const API = window.FLASH_API;
  const M = window.FLASH_DATA;

  async function loadLiveData() {
    if (!window.FLASH_CONFIG.liveMode) {
      window.dispatchEvent(new CustomEvent('flash:data-loaded', { detail: { source: 'mock' } }));
      return;
    }

    window.dispatchEvent(new CustomEvent('flash:data-loading'));
    
    try {
      const [snapshot, sessions, plan] = await Promise.all([
        API.snapshot().catch(() => null),
        API.sessions().catch(() => null),
        API.plan().catch(() => null)
      ]);

      if (snapshot) {
        // Update user stats
        M.user.streak = snapshot.quick_stats?.streak || M.user.streak;
        M.user.level = snapshot.quick_stats?.level || M.user.level;
        
        // Update domains
        if (snapshot.domain_cards) {
          snapshot.domain_cards.forEach(card => {
            const dom = M.domains.find(d => d.id === card.domain_id);
            if (dom) {
              dom.mastery = card.score || dom.mastery;
              if (card.recent_history) dom.last10 = card.recent_history;
            }
          });
        }
      }

      if (sessions && Array.isArray(sessions)) {
        M.recentSessions = sessions.map(s => ({
          date: s.ended_at,
          game_en: s.game_id, // Ideally mapped to real name
          game_ar: s.game_id,
          domain: s.domain_id,
          accuracy: s.accuracy,
          medianRT: s.median_rt_ms,
          deltaVsPB: 0
        }));
      }

      if (plan && plan.sessions) {
        M.todayPlan = plan.sessions.map(s => ({
          kind_en: s.kind,
          kind_ar: s.kind,
          game_en: s.game_id,
          game_ar: s.game_id,
          domain: s.domain_id,
          minutes: s.minutes,
          reason_en: s.reason,
          reason_ar: s.reason
        }));
      }

      window.dispatchEvent(new CustomEvent('flash:data-loaded', { detail: { source: 'live' } }));
      window.dispatchEvent(new Event('flash:render'));
      
    } catch (err) {
      console.warn('[LiveData] Failed to load live data:', err);
      window.dispatchEvent(new CustomEvent('flash:data-loaded', { detail: { source: 'mock' } }));
    }
  }

  window.FLASH_MODULES = window.FLASH_MODULES || {};
  window.FLASH_MODULES.liveData = { load: loadLiveData };
  
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadLiveData, 500);
  });
})();