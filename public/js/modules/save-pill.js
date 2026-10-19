/* ============================================================
   FLASH - Save Status Pill
   Tiny indicator in header showing sync state
   Reflects FLASH_SAVE_QUEUE pending count
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  let el = null;
  let lastState = null;

  function build() {
    if (el) return el;
    el = document.createElement('span');
    el.className = 'flash-save-status';
    el.dataset.state = 'saved';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="flash-save-dot"></span><span class="flash-save-label">Saved</span>';

    const tools = $('.hdr .tools');
    if (tools) tools.insertBefore(el, tools.firstChild);
    return el;
  }

  function setState(state, label) {
    if (!el) build();
    if (!el || lastState === state) return;
    lastState = state;
    el.dataset.state = state;
    const lbl = el.querySelector('.flash-save-label');
    if (lbl) lbl.textContent = label;
    el.setAttribute('aria-label', 'Save status: ' + label);
  }

  function refresh() {
    const q = window.FLASH_SAVE_QUEUE;
    const net = window.FLASH_NETWORK;
    if (!q) return;

    const pending = q.pendingCount();
    const online = net ? net.isOnline() : navigator.onLine;

    if (pending === 0) {
      setState('saved', 'Saved');
    } else if (online) {
      setState('pending', 'Syncing ' + pending);
    } else {
      setState('failed', 'Pending ' + pending);
    }
  }

  function boot() {
    build();
    refresh();
    window.addEventListener('flash:save-status', refresh);
    window.addEventListener('flash:queue-changed', refresh);
    window.addEventListener('flash:online', refresh);
    window.addEventListener('flash:offline', refresh);
    setInterval(refresh, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 300));
  } else {
    setTimeout(boot, 300);
  }

  window.FLASH_SAVE_PILL = { refresh, version: '1.0.0' };
})();