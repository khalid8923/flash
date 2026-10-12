/* ============================================================
   FLASH - XP Bar
   Compact level indicator in the header
   Fetches from /me/xp on load, updates on xp gain
   ============================================================ */
(function () {
  'use strict';

  const F = window.FLASH;
  const API = window.FLASH_API;

  let el = null;
  let state = { level: 1, xp: 0, xp_to_next: 100 };
  let lastLevel = null;

  function t(key) { return F && F.t ? F.t(key) : key; }

  function build() {
    if (el) return el;
    const tools = document.querySelector('.hdr .tools');
    if (!tools) return null;

    el = document.createElement('div');
    el.className = 'xp-bar';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Experience progress');
    el.innerHTML = `
      <span class="lv" data-xp-lv>LV 1</span>
      <span class="progress"><span class="fill" data-xp-fill style="width:0%"></span></span>
      <span class="nums"><b data-xp-num>0</b> / <span data-xp-next>100</span></span>
    `;

    tools.insertBefore(el, tools.firstChild);
    return el;
  }

  function render() {
    if (!el) return;
    const pct = state.xp_to_next > 0 ? Math.min(100, (state.xp / state.xp_to_next) * 100) : 0;

    el.querySelector('[data-xp-lv]').textContent = 'LV ' + state.level;
    el.querySelector('[data-xp-fill]').style.width = pct + '%';
    el.querySelector('[data-xp-num]').textContent = F && F.N ? F.N(state.xp) : state.xp;
    el.querySelector('[data-xp-next]').textContent = F && F.N ? F.N(state.xp_to_next) : state.xp_to_next;

    /* Level-up pulse */
    if (lastLevel !== null && state.level > lastLevel) {
      el.classList.add('levelup');
      setTimeout(() => el.classList.remove('levelup'), 700);
    }
    lastLevel = state.level;
  }

  async function load() {
    if (!API || !API.xp) return;
    try {
      const data = await API.xp();
      if (data) {
        state = {
          level: data.level || 1,
          xp: data.total_xp || 0,
          xp_to_next: data.xp_to_next || 100
        };
        render();
      }
    } catch (_) {
      /* Offline / no auth → keep last state */
    }
  }

  /* ─── Boot ─── */
  if (F && F.onReady) {
    F.onReady(() => {
      setTimeout(() => {
        build();
        render();
        load();
      }, 800);

      /* Refresh on render / focus */
      window.addEventListener('flash:render', () => setTimeout(load, 300));
      window.addEventListener('focus', () => load());
    });
  }

  /* ─── Public API ─── */
  window.FLASH_XP_BAR = {
    refresh: load,
    getState: () => ({ ...state }),
    version: '1.0.0'
  };

  console.info('[XP_BAR] loaded');
})();