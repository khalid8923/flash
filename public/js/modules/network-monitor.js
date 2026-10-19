/* ============================================================
   FLASH - Network Monitor
   Detects offline/online, shows banner, dispatches events
   Uses navigator.onLine + real backend ping
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const UI = window.FLASH_UI;
  if (!ERR || !UI) { console.error('[network-monitor] deps missing'); return; }

  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  const PING_INTERVAL_MS = 20000;
  const PING_TIMEOUT_MS = 3500;

  let isOnline = navigator.onLine;
  let backendReachable = true;
  let pingTimer = null;

  function setOnline(newOnline, reason) {
    if (isOnline === newOnline) return;
    isOnline = newOnline;

    if (isOnline) {
      UI.hideBanner();
      UI.showToast({
        kind: 'success',
        title: 'Back online',
        message: ERR.message('NETWORK').replace('Connection issue. Retrying...', 'Reconnected.'),
        ttl: 3000
      });
      try {
        window.dispatchEvent(new CustomEvent('flash:online'));
      } catch (_) {}
    } else {
      UI.showBanner({
        kind: 'offline',
        message: 'You are offline. Progress is saved locally.',
        actionLabel: 'Retry',
        onAction: pingBackend
      });
      try {
        window.dispatchEvent(new CustomEvent('flash:offline'));
      } catch (_) {}
    }
  }

  async function pingBackend() {
    const controller = new AbortController();
    const tid = setTimeout(() => { try { controller.abort(); } catch (_) {} }, PING_TIMEOUT_MS);

    try {
      const res = await fetch(API_BASE + '/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(tid);
      const reachable = res.ok;
      if (reachable !== backendReachable) {
        backendReachable = reachable;
        if (!reachable) {
          UI.showBanner({
            kind: 'error',
            message: 'Backend is not responding. Some features are limited.',
            actionLabel: 'Retry',
            onAction: pingBackend
          });
        } else if (isOnline) {
          UI.hideBanner();
        }
        try {
          window.dispatchEvent(new CustomEvent('flash:backend-status', {
            detail: { reachable: backendReachable }
          }));
        } catch (_) {}
      }
      return reachable;
    } catch (_) {
      clearTimeout(tid);
      backendReachable = false;
      return false;
    }
  }

  function startPinging() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (isOnline) pingBackend();
    }, PING_INTERVAL_MS);
  }

  window.addEventListener('online', () => {
    setOnline(true, 'event');
    pingBackend();
  });

  window.addEventListener('offline', () => {
    setOnline(false, 'event');
  });

  function boot() {
    /* Initial check: if navigator says online, verify backend is actually up */
    if (isOnline) {
      pingBackend();
      startPinging();
    } else {
      setOnline(false, 'boot');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FLASH_NETWORK = {
    isOnline: () => isOnline,
    isBackendReachable: () => backendReachable,
    ping: pingBackend,
    version: '1.0.0'
  };
})();