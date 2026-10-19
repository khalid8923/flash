/* ============================================================
   FLASH - Audio Unlock
   Browsers block AudioContext until user gesture.
   This module queues sound init until first interaction.
   ============================================================ */
(function () {
  'use strict';

  let unlocked = false;
  const listeners = [];

  function unlock() {
    if (unlocked) return;
    unlocked = true;

    /* Notify all listeners */
    listeners.forEach((cb) => {
      try { cb(); } catch (_) {}
    });
    listeners.length = 0;

    /* Remove listeners */
    ['click', 'keydown', 'touchstart'].forEach((ev) => {
      document.removeEventListener(ev, unlock, true);
    });

    console.info('[FLASH_AUDIO] unlocked');
  }

  /* Register unlock handlers */
  ['click', 'keydown', 'touchstart'].forEach((ev) => {
    document.addEventListener(ev, unlock, { capture: true, once: false, passive: true });
  });

  /* Auto-unlock after 30s as fallback */
  setTimeout(unlock, 30000);

  window.FLASH_AUDIO = {
    isUnlocked: () => unlocked,
    onUnlock: (cb) => {
      if (unlocked) { try { cb(); } catch (_) {} return; }
      listeners.push(cb);
    },
    version: '1.0.0'
  };
})();