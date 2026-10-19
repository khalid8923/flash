/* ============================================================
   FLASH - Session Restore
   If user refreshes mid-session, restore pending save
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const KEY = 'flash.activeSession';
  const MAX_AGE_MS = 30 * 60 * 1000; /* 30 minutes */

  /* ============================================================
     SAVE ACTIVE SESSION ON GAME START
     ============================================================ */
  function saveActiveSession(sessionDraft) {
    if (!sessionDraft || !sessionDraft.client_session_id) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        session: sessionDraft,
        savedAt: Date.now()
      }));
    } catch (_) {}
  }

  function clearActiveSession() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  /* ============================================================
     CHECK ON LOAD
     ============================================================ */
  function checkPending() {
    let data = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      data = JSON.parse(raw);
    } catch (_) {
      clearActiveSession();
      return null;
    }

    if (!data || !data.session || !data.savedAt) {
      clearActiveSession();
      return null;
    }

    /* Too old → discard */
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      clearActiveSession();
      return null;
    }

    return data;
  }

  /* ============================================================
     OFFER RESUME
     ============================================================ */
  function offerResume(pending) {
    const UI = window.FLASH_UI;
    if (!UI) return;

    const gameName = pending.session.game_id || 'session';

    UI.showModal({
      title: 'Unsaved session',
      body: 'We found an unfinished ' + gameName + ' session from a few minutes ago. ' +
            'You can submit it now or discard it.',
      retryLabel: 'Submit now',
      dismissLabel: 'Discard',
      onRetry: () => {
        const Q = window.FLASH_SAVE_QUEUE;
        if (Q) {
          Q.enqueue(pending.session);
          UI.showToast({
            kind: 'info',
            title: 'Queued',
            message: 'Your session will sync shortly.'
          });
        }
        clearActiveSession();
      },
      errorId: null
    });

    /* Also handle "Discard" via dismiss */
    const dismissBtn = document.querySelector('.flash-modal-btn.secondary');
    if (dismissBtn) {
      const handler = () => { clearActiveSession(); };
      dismissBtn.addEventListener('click', handler, { once: true });
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    const pending = checkPending();
    if (pending) {
      /* Wait a beat for UI to be ready */
      setTimeout(() => offerResume(pending), 1500);
    }
  }

  /* ============================================================
     HOOK INTO GAME START
     ============================================================ */
  window.addEventListener('flash:game-start', (e) => {
    if (e && e.detail && e.detail.session) {
      saveActiveSession(e.detail.session);
    }
  });

  window.addEventListener('flash:game-complete', () => {
    clearActiveSession();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FLASH_SESSION_RESTORE = {
    save: saveActiveSession,
    clear: clearActiveSession,
    check: checkPending,
    version: '1.0.0'
  };
})();