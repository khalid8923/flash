/* ============================================================
   FLASH - Keyboard Shortcuts Help (?)
   ============================================================ */
(function () {
  'use strict';

  let el = null;

  const SHORTCUTS = [
    { group: 'General',  keys: ['Ctrl', 'K'],        desc: 'Open command palette' },
    { group: 'General',  keys: ['/'],                desc: 'Quick search' },
    { group: 'General',  keys: ['?'],                desc: 'Show this help' },
    { group: 'General',  keys: ['Ctrl', ','],        desc: 'Open settings' },
    { group: 'General',  keys: ['Esc'],              desc: 'Close any overlay' },
    { group: 'Theme',    keys: ['Ctrl', 'Shift', 'L'], desc: 'Cycle theme (Light → Dark → Auto)' },
    { group: 'Theme',    keys: ['Ctrl', 'Shift', 'K'], desc: 'Cycle accent color' },
    { group: 'View',     keys: ['F'],                desc: 'Focus mode' },
    { group: 'View',     keys: ['C'],                desc: 'Compare domains' },
    { group: 'View',     keys: ['Ctrl', 'P'],        desc: 'Print dashboard' },
    { group: 'Navigation', keys: ['↑', '↓'],         desc: 'Navigate lists' },
    { group: 'Navigation', keys: ['Enter'],          desc: 'Open / run' },
  ];

  function build() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'cmd-palette'; /* reuse same base */
    el.setAttribute('data-open', '0');
    el.innerHTML = `
      <div class="cp-panel" style="max-height: 80vh;">
        <div class="cp-input-row">
          <span style="font-weight:600;font-size:14px;color:var(--tx)">⌨ Keyboard Shortcuts</span>
          <span style="flex:1"></span>
          <span class="cp-hint">ESC</span>
        </div>
        <div class="cp-results" style="padding: 12px 16px 20px;">
          ${renderShortcuts()}
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
  }

  function renderShortcuts() {
    const groups = {};
    SHORTCUTS.forEach(s => {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });
    return Object.keys(groups).map(g => `
      <div style="margin-bottom: 16px;">
        <div style="font:600 11px var(--font-ui);color:var(--tx-mu);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${g}</div>
        ${groups[g].map(s => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ln);">
            <span style="font-size:13px;color:var(--tx)">${escapeHtml(s.desc)}</span>
            <span style="display:flex;gap:4px;">
              ${s.keys.map(k => `<kbd style="font:500 10px var(--font-mono);color:var(--tx-faint);padding:2px 6px;border:1px solid var(--ln-strong);border-radius:4px;background:var(--pn-alt)">${escapeHtml(k)}</kbd>`).join('')}
            </span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function open() {
    build();
    el.setAttribute('data-open', '1');
  }

  function close() {
    if (el) el.setAttribute('data-open', '0');
  }

  document.addEventListener('keydown', (e) => {
    if (isTyping(e.target)) return;
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      if (el && el.getAttribute('data-open') === '1') close();
      else open();
    }
    if (e.key === 'Escape' && el && el.getAttribute('data-open') === '1') close();
  });

  function isTyping(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  window.FLASH_KEYBOARD_HELP = { open, close, version: '1.0.0' };
  console.info('[KEYBOARD_HELP] loaded — press ? to see shortcuts');
})();