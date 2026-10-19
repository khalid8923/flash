/* ============================================================
   FLASH - Accessibility Runtime
   Announces errors/saves to screen readers
   Adds skip link
   ============================================================ */
(function () {
  'use strict';

  let announcer = null;

  function ensureAnnouncer() {
    if (announcer && document.body.contains(announcer)) return announcer;
    announcer = document.createElement('div');
    announcer.className = 'flash-sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
    return announcer;
  }

  function announce(message, priority) {
    const el = ensureAnnouncer();
    if (!el) return;
    /* Set priority attribute for screen readers */
    el.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
    /* Clear then set — forces re-announce */
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 40);
  }

  /* Skip link */
  function addSkipLink() {
    if (document.querySelector('.flash-skip-link')) return;
    const link = document.createElement('a');
    link.className = 'flash-skip-link';
    link.href = '#app';
    link.textContent = 'Skip to main content';
    document.body.insertBefore(link, document.body.firstChild);
  }

  /* Hook into error/save events */
  function boot() {
    addSkipLink();
    ensureAnnouncer();

    window.addEventListener('flash:error', (e) => {
      const detail = e.detail;
      if (!detail) return;
      const msg = detail.userMessage || detail.message || 'An error occurred';
      announce('Error: ' + msg, detail.severity === 'high' ? 'assertive' : 'polite');
    });

    window.addEventListener('flash:save-status', (e) => {
      const detail = e.detail || {};
      const pending = detail.pending || 0;
      if (pending === 0) announce('All changes saved');
      else announce(pending + ' session' + (pending > 1 ? 's' : '') + ' waiting to sync');
    });

    window.addEventListener('flash:offline', () => announce('You are offline. Changes will sync when reconnected.'));
    window.addEventListener('flash:online', () => announce('Back online.'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FLASH_A11Y = { announce, version: '1.0.0' };
})();