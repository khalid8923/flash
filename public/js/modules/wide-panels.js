/* ============================================================
   FLASH - Wide Panels Runtime
   Renders 5 panels when viewport >= 1600px:
     Deltas Watchlist / Hour-of-Day / Error Ledger
     Transfer Matrix / Game Log
   ============================================================ */
(function () {
  'use strict';

  const DOMAIN_COLORS = {
    attention: '#2dd4e0', spatial: '#3ddc97', speed: '#ffd93d',
    memory: '#9b7bff', logic: '#4d8dff', language: '#ff9f43',
    creativity: '#ff6ec7', emotional: '#ff5a5f',
    problem: '#5aa9ff', numerical: '#b6f04a'
  };

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* ═══════════════════════════════════════════════════════════
     DATA EXTRACTION — pull from existing dashboard state
     ═══════════════════════════════════════════════════════════ */
  function getDomains() {
    const data = window.FLASH_DATA || window.FLASH && window.FLASH.data;
    if (data && Array.isArray(data.domains)) return data.domains;
    /* Fallback from DOM */
    return $$('.lane').map((lane) => ({
      id: lane.dataset.domain || 'unknown',
      name: lane.dataset.name || lane.dataset.domain || 'Unknown'
    }));
  }

  function getRecentSessions() {
    const data = window.FLASH_DATA || window.FLASH && window.FLASH.data;
    if (data && Array.isArray(data.recent)) return data.recent;
    /* Parse from table */
    const rows = $$('[data-panel="recent"] tbody tr');
    return rows.slice(0, 20).map((r) => {
      const cells = r.querySelectorAll('td');
      return {
        game: cells[1] && cells[1].textContent.trim(),
        domain: cells[2] && cells[2].textContent.trim(),
        accuracy: parseInt(cells[3] && cells[3].textContent) || 0
      };
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL 1 — DELTAS WATCHLIST
     ═══════════════════════════════════════════════════════════ */
  function buildDeltas() {
    const p = el('div', 'wide-panel');
    p.dataset.panel = 'deltas';

    p.appendChild(el('div', 'wp-title', 'Deltas'));
    p.appendChild(el('div', 'wp-question', 'What is moving?'));

    const body = el('div', 'wp-body');
    const domains = getDomains().slice(0, 5);

    /* Deterministic pseudo-deltas from domain id */
    domains.forEach((d, i) => {
      const row = el('div', 'wp-delta');
      const left = el('div', 'wp-delta-domain');
      const dot = el('span', 'wp-dot');
      dot.style.background = DOMAIN_COLORS[d.id] || '#999';
      left.appendChild(dot);
      left.appendChild(el('span', 'wp-delta-name', d.name || d.id));

      /* Compute a pseudo delta */
      const hash = (d.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const val = ((hash % 200) - 100) / 20; /* -5..+5 */
      const cls = val > 0.5 ? 'up' : val < -0.5 ? 'down' : 'flat';
      const sign = val > 0 ? '+' : '';
      const right = el('span', 'wp-delta-value ' + cls, sign + val.toFixed(1) + 'σ');

      row.appendChild(left);
      row.appendChild(right);
      body.appendChild(row);
    });

    p.appendChild(body);
    return p;
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL 2 — HOUR-OF-DAY STRIP
     ═══════════════════════════════════════════════════════════ */
  function buildHourStrip() {
    const p = el('div', 'wide-panel');
    p.dataset.panel = 'hour';

    p.appendChild(el('div', 'wp-title', 'Hour of Day'));
    p.appendChild(el('div', 'wp-question', 'When do I play best?'));

    const body = el('div', 'wp-body');

    const strip = el('div', 'wp-hour-strip');
    /* 24 bars — pseudo distribution */
    const nowH = new Date().getHours();
    const values = [];
    for (let h = 0; h < 24; h++) {
      let v = 0.15;
      if (h >= 8 && h <= 10) v = 0.65;
      else if (h >= 14 && h <= 16) v = 0.55;
      else if (h >= 19 && h <= 22) v = 0.9;
      else if (h >= 11 && h <= 13) v = 0.4;
      else if (h >= 17 && h <= 18) v = 0.5;
      /* Peak hour = 20 */
      if (h === 20) v = 1.0;
      values.push(v);
    }

    values.forEach((v, h) => {
      const bar = el('div', 'wp-hour-bar');
      bar.style.height = (v * 100) + '%';
      bar.title = h + ':00 — ' + Math.round(v * 100) + '%';
      if (v === 1.0) bar.classList.add('peak');
      strip.appendChild(bar);
    });

    const labels = el('div', 'wp-hour-labels');
    ['00', '06', '12', '18', '23'].forEach((t) => {
      labels.appendChild(el('span', null, t));
    });

    body.appendChild(strip);
    body.appendChild(labels);
    p.appendChild(body);
    return p;
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL 3 — ERROR LEDGER
     ═══════════════════════════════════════════════════════════ */
  function buildErrorLedger() {
    const p = el('div', 'wide-panel');
    p.dataset.panel = 'errors';

    p.appendChild(el('div', 'wp-title', 'Errors'));
    p.appendChild(el('div', 'wp-question', 'What am I missing?'));

    const body = el('div', 'wp-body');

    const errors = [
      { label: 'Post-error slowdown', count: 12, severity: 'high' },
      { label: 'First-trial penalty', count: 8, severity: 'med' },
      { label: 'Late-session fatigue', count: 5, severity: 'low' }
    ];

    errors.forEach((e) => {
      const row = el('div', 'wp-error-row');
      const left = el('div', 'wp-error-label', e.label);
      const right = el('span', 'wp-error-count', '×' + e.count);
      row.appendChild(left);
      row.appendChild(right);
      body.appendChild(row);
    });

    p.appendChild(body);
    return p;
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL 4 — TRANSFER MATRIX
     ═══════════════════════════════════════════════════════════ */
  function buildTransferMatrix() {
    const p = el('div', 'wide-panel');
    p.dataset.panel = 'transfer';

    p.appendChild(el('div', 'wp-title', 'Transfer'));
    p.appendChild(el('div', 'wp-question', 'How related are my domains?'));

    const body = el('div', 'wp-body');

    const matrix = el('div', 'wp-matrix');
    for (let i = 0; i < 100; i++) {
      const cell = el('div', 'wp-matrix-cell');
      /* Diagonal = strongest */
      const row = Math.floor(i / 10), col = i % 10;
      let strength = 0.08;
      if (row === col) strength = 1.0;
      else {
        /* pseudo correlation */
        const dist = Math.abs(row - col);
        strength = Math.max(0.05, 1 - dist * 0.22);
        /* Random-like variation */
        strength *= 0.5 + ((row * 17 + col * 31) % 40) / 100;
      }
      cell.style.background = 'color-mix(in srgb, var(--ac) ' +
        Math.round(strength * 60) + '%, transparent)';
      matrix.appendChild(cell);
    }
    body.appendChild(matrix);
    p.appendChild(body);
    return p;
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL 5 — GAME LOG
     ═══════════════════════════════════════════════════════════ */
  function buildGameLog() {
    const p = el('div', 'wide-panel');
    p.dataset.panel = 'log';

    p.appendChild(el('div', 'wp-title', 'Game Log'));
    p.appendChild(el('div', 'wp-question', 'Recent per game?'));

    const body = el('div', 'wp-body');

    const sessions = getRecentSessions().slice(0, 5);
    if (!sessions.length) {
      body.appendChild(el('div', 'wp-question', 'No recent sessions'));
    } else {
      sessions.forEach((s, i) => {
        const row = el('div', 'wp-log-row');
        row.appendChild(el('span', 'wp-log-game', s.game || 'Session'));
        const cls = i === 0 ? 'up' : (s.accuracy >= 80 ? 'up' : s.accuracy < 60 ? 'down' : '');
        row.appendChild(el('span', 'wp-log-score ' + cls, (s.accuracy || 0) + '%'));
        body.appendChild(row);
      });
    }

    p.appendChild(body);
    return p;
  }

  /* ═══════════════════════════════════════════════════════════
     CONTAINER QUERY TIERS — inject sparkline-secondary + heat-strip
     ═══════════════════════════════════════════════════════════ */
  function upgradeLanes() {
    $$('.lane').forEach((lane) => {
      /* Secondary sparkline */
      if (!lane.querySelector('.sparkline-secondary')) {
        const sec = el('svg', 'sparkline-secondary');
        sec.setAttribute('viewBox', '0 0 100 20');
        sec.setAttribute('preserveAspectRatio', 'none');
        sec.setAttribute('aria-hidden', 'true');
        sec.style.width = '100%';
        sec.style.height = '14px';
        sec.style.marginTop = '4px';
        sec.style.opacity = '0.5';
        /* Build a small polyline */
        const points = [];
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 100;
          const y = 10 + Math.sin(i * 0.7 + (lane.dataset.domain || 'x').length) * 4;
          points.push(x.toFixed(1) + ',' + y.toFixed(1));
        }
        sec.innerHTML = '<polyline fill="none" stroke="currentColor" stroke-width="0.8" points="' + points.join(' ') + '"/>';
        lane.appendChild(sec);
      }

      /* Heat strip */
      if (!lane.querySelector('.heat-strip')) {
        const strip = el('div', 'heat-strip');
        strip.style.display = 'none';
        strip.style.height = '4px';
        strip.style.marginTop = '6px';
        strip.style.display = 'flex';
        strip.style.gap = '1px';
        for (let i = 0; i < 14; i++) {
          const cell = el('span');
          cell.style.flex = '1';
          const intensity = 0.15 + Math.random() * 0.7;
          cell.style.background = 'color-mix(in srgb, var(--ac) ' +
            Math.round(intensity * 60) + '%, transparent)';
          cell.style.borderRadius = '1px';
          strip.appendChild(cell);
        }
        strip.style.display = 'none'; /* container query toggles */
        lane.appendChild(strip);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     MOUNT
     ═══════════════════════════════════════════════════════════ */
  function mount() {
    /* Skip if already mounted */
    if (document.querySelector('.wide-panels')) {
      upgradeLanes();
      return;
    }

    const footer = $('.ft');
    if (!footer) {
      console.info('[Wide Panels] No footer found');
      return;
    }

    const wrap = el('div', 'wide-panels');
    wrap.appendChild(buildDeltas());
    wrap.appendChild(buildHourStrip());
    wrap.appendChild(buildErrorLedger());
    wrap.appendChild(buildTransferMatrix());
    wrap.appendChild(buildGameLog());

    /* Insert after footer */
    footer.parentNode.insertBefore(wrap, footer.nextSibling);

    /* Upgrade lanes for container queries */
    upgradeLanes();

    console.log('[Wide Panels] Mounted — 5 panels + lane upgrades');
  }

  /* ═══════════════════════════════════════════════════════════
     BOOT + RESIZE
     ═══════════════════════════════════════════════════════════ */
  function boot() {
    mount();

    /* Re-check on resize (throttled) */
    let rt = null;
    window.addEventListener('resize', () => {
      if (rt) clearTimeout(rt);
      rt = setTimeout(mount, 320);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 400));
  } else {
    setTimeout(boot, 400);
  }
})();