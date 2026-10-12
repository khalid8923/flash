/* ============================================================
   FLASH - Provider Status Runtime
   Polls /ai/health every 30s, shows tiny pill in header
   ============================================================ */
(function () {
  'use strict';

  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  const $ = (s, c) => (c || document).querySelector(s);

  let el = null;

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'provider-status';
    el.dataset.state = 'unknown';
    el.setAttribute('title', 'AI provider status');
    el.innerHTML =
      '<span class="provider-status-dot"></span>' +
      '<span class="provider-status-label">AI</span>';

    /* Insert before .tools in header */
    const tools = $('.hdr .tools');
    if (tools) tools.insertBefore(el, tools.firstChild);
    else {
      const hdr = $('.hdr');
      if (hdr) hdr.appendChild(el);
    }
    return el;
  }

  function setState(state, label) {
    if (!el) build();
    if (!el) return;
    el.dataset.state = state;
    const lbl = el.querySelector('.provider-status-label');
    if (lbl) lbl.textContent = label || 'AI';
    el.title = 'AI: ' + (label || state);
  }

  async function check() {
    try {
      const SF = window.FLASH_SAFE_FETCH;
      const fetchFn = SF || fetch;
      const res = await fetchFn(API_BASE + '/ai/health', {
        method: 'GET',
        silent: true,
        timeoutMs: 5000
      });

      if (!res || !res.ok) {
        setState('down', 'OFF');
        return;
      }

      const data = await res.json();
      const providers = Array.isArray(data.providers) ? data.providers : [];
      const health = Array.isArray(data.health) ? data.health : [];

      /* Primary healthy? */
      const primary = health.find((h) => h.name === 'groq');
      if (primary && primary.healthy) {
        setState('live', 'LIVE');
        return;
      }

      /* Any other healthy? */
      const anyHealthy = health.some((h) => h.healthy);
      if (anyHealthy) {
        setState('fallback', 'FB');
        return;
      }

      setState('down', 'OFF');
    } catch (_) {
      setState('down', 'OFF');
    }
  }

  function boot() {
    build();
    setTimeout(check, 1500);
    setInterval(check, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 200);
  }

  window.FLASH_PROVIDER_STATUS = { check, version: '1.0.0' };
})();