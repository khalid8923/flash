/* ============================================================
   FLASH - Game Complete Bridge
   Receives postMessage from games, formats to Zod Schema, sends to Backend
   ============================================================ */
(function () {
  'use strict';
  const API = window.FLASH_API;
  const UI  = window.FLASH_UI;

  async function handleGameComplete(payload) {
    if (!payload || !payload.gameId) return;
    
    const clientSessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    
    // Format to match backend SessionSchema (27 fields)
    const sessionPayload = {
      schema_version: 1,
      client_session_id: clientSessionId,
      game_id: payload.gameId,
      domain_id: payload.domain || 'memory', // fallback
      mode: payload.mode || 'classic',
      seed: payload.seed || '12345678',
      ticket_id: null,
      started_at: new Date(Date.now() - (payload.durationMs || 60000)).toISOString(),
      ended_at: new Date().toISOString(),
      game_version: '1.0.0',
      scoring_version: 1,
      trials: payload.trials || [], // Must be populated by game
      config: {},
      client_meta: {
        user_agent: navigator.userAgent,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        device_id: 'web-' + (localStorage.getItem('flash.deviceId') || 'unknown'),
        device_clock_skew_ms: 0
      },
      source: window.FLASH_CONFIG.liveMode ? 'live' : 'offline'
    };

    // If offline, save to queue
    if (!window.FLASH_CONFIG.liveMode) {
      console.log('[Bridge] Offline mode - saving to queue');
      if (UI) UI.showToast({ kind: 'info', title: 'Session saved locally' });
      return;
    }

    try {
      if (UI) UI.showToast({ kind: 'info', title: 'Saving session...' });
      
      const res = await API.submitSession(sessionPayload);
      
      if (res.status === 'accepted') {
        if (UI) UI.showToast({ kind: 'success', title: 'Session saved!' });
        
        // Trigger AI Recap if backend returned a server_session_id
        if (res.server_session_id) {
          const lang = document.documentElement.lang || 'en';
          API.aiRecap(res.server_session_id, lang).then(recap => {
            if (recap && recap.text) {
               // Show Recap Modal (handled by session-recap.js)
               window.dispatchEvent(new CustomEvent('flash:recap-ready', { detail: recap }));
            }
          }).catch(e => console.warn('AI Recap failed:', e));
        }
      }
    } catch (err) {
      console.error('[Bridge] Failed to submit session:', err);
      if (UI) UI.showToast({ kind: 'error', title: 'Failed to save session' });
      // TODO: Save to offline queue
    }
  }

  // Listen to postMessage from iframes
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'flash:game-complete') {
      handleGameComplete(event.data);
    }
  });

  window.FLASH_MODULES = window.FLASH_MODULES || {};
  window.FLASH_MODULES.gameBridge = { submit: handleGameComplete };
  console.info('[GameBridge] Ready and listening.');
})();