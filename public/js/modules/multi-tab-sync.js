/* ============================================================
   FLASH - Multi-Tab Sync
   BroadcastChannel to keep tabs aligned
   Prevents duplicate session submissions across tabs
   ============================================================ */
(function () {
  'use strict';

  const CHANNEL_NAME = 'flash-sync';
  const ERR = window.FLASH_ERRORS;

  let channel = null;

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (_) {
    /* Not supported — silent fallback to localStorage events */
    console.info('[FLASH_SYNC] BroadcastChannel not available');
  }

  /* ============================================================
     BROADCAST EVENTS
     ============================================================ */
  function broadcast(type, payload) {
    if (!channel) return;
    try {
      channel.postMessage({
        type,
        payload: payload || {},
        from: getTabId(),
        at: Date.now()
      });
    } catch (_) {}
  }

  /* ============================================================
     TAB ID
     ============================================================ */
  function getTabId() {
    let id = sessionStorage.getItem('flash.tabId');
    if (!id) {
      id = 'tab_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      try { sessionStorage.setItem('flash.tabId', id); } catch (_) {}
    }
    return id;
  }

  /* ============================================================
     RECEIVE
     ============================================================ */
  if (channel) {
    channel.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg || msg.from === getTabId()) return;

      switch (msg.type) {
        case 'session-submitted':
          /* Another tab submitted a session — notify */
          try {
            window.dispatchEvent(new CustomEvent('flash:session-submitted-elsewhere', {
              detail: msg.payload
            }));
          } catch (_) {}
          break;

        case 'queue-cleared':
          /* Queue cleared in another tab — refresh local UI */
          window.dispatchEvent(new CustomEvent('flash:queue-changed'));
          break;

        case 'auth-changed':
          /* User signed in/out in another tab */
          try {
            window.dispatchEvent(new CustomEvent('flash:auth-changed-elsewhere', {
              detail: msg.payload
            }));
          } catch (_) {}
          break;

        case 'theme-changed':
          if (msg.payload && msg.payload.theme) {
            document.documentElement.dataset.theme = msg.payload.theme;
          }
          break;

        case 'lang-changed':
          if (msg.payload && msg.payload.lang) {
            document.documentElement.lang = msg.payload.lang;
            document.documentElement.dir = msg.payload.lang === 'ar' ? 'rtl' : 'ltr';
          }
          break;
      }
    });
  }

  /* ============================================================
     HOOK GLOBAL EVENTS
     ============================================================ */
  window.addEventListener('flash:game-complete', (e) => {
    if (e && e.detail && e.detail.session) {
      broadcast('session-submitted', {
        sessionId: e.detail.session.client_session_id,
        gameId: e.detail.session.game_id
      });
    }
  });

  window.addEventListener('storage', (e) => {
    /* Fallback for browsers without BroadcastChannel */
    if (!channel && e.key && e.key.indexOf('flash.') === 0) {
      window.dispatchEvent(new CustomEvent('flash:queue-changed'));
    }
  });

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_SYNC = {
    broadcast,
    tabId: getTabId,
    version: '1.0.0'
  };

  console.info('[FLASH_SYNC] ready — tab id:', getTabId());
})();