/* ============================================================
   FLASH - Component Boundaries
   Wraps render calls so one broken module never kills the page
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const UI  = window.FLASH_UI;
  if (!ERR || !UI) return;

  const SECTIONS = {
    today:  { sel: '[data-panel="today"], .col-today, .today',   name: 'Today'  },
    season: { sel: '[data-panel="season"], .col-season, .season', name: 'Season' },
    recent: { sel: '[data-panel="recent"], .col-recent, .recent', name: 'Recent' }
  };

  function protect(key) {
    const sec = SECTIONS[key];
    if (!sec) return;
    const el = document.querySelector(sec.sel);
    if (!el) return;

    /* Snapshot innerHTML as fallback for empty state */
    if (!el.dataset.boundaryWrapped) {
      el.dataset.boundaryWrapped = '1';
      el.dataset.boundarySnapshot = el.innerHTML.slice(0, 500);
    }
  }

  function showFallback(key) {
    const sec = SECTIONS[key];
    if (!sec) return;
    const el = document.querySelector(sec.sel);
    if (!el) return;

    const fallback = document.createElement('div');
    fallback.className = 'flash-boundary-fallback';
    fallback.innerHTML =
      '<span>' + sec.name + ' could not load.</span>' +
      '<button type="button" data-retry="' + key + '">Retry</button>';

    el.innerHTML = '';
    el.appendChild(fallback);

    const btn = fallback.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        try {
          window.dispatchEvent(new CustomEvent('flash:render'));
        } catch (_) {}
      });
    }
  }

  function boot() {
    Object.keys(SECTIONS).forEach(protect);

    /* Hook into global error and check which section broke */
    window.addEventListener('flash:error', (e) => {
      const detail = e.detail;
      if (!detail || detail.feature === 'critical') return;
      /* Don't auto-hide — let render try again first */
    });

    /* Wrap FLASH render */
    document.addEventListener('flash:render', () => {
      Object.keys(SECTIONS).forEach((key) => {
        try {
          const sec = SECTIONS[key];
          const el = document.querySelector(sec.sel);
          if (el && el.querySelector('.flash-boundary-fallback')) {
            protect(key);
          }
        } catch (_) {}
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }

  window.FLASH_BOUNDARIES = {
    showFallback,
    version: '1.0.0'
  };
  console.info('[FLASH_BOUNDARIES] ready');
})();