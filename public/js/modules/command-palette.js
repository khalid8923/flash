/* ═══════════════════════════════════════════════════════════
   MODULE — Command Palette
   Keyboard: Cmd+K / Ctrl+K to open, Esc to close,
             Up/Down to navigate, Enter to run.
   Commands are built from FLASH data + static actions.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const ICONS = {
  domain: '<path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="4"/>',
  theme:  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  lang:   '<path d="M4 6h7a3 3 0 0 1 3 3v9M20 18h-7a3 3 0 0 1-3-3V6"/>',
  action: '<path d="M5 12h14M13 5l7 7-7 7"/>'
};

let overlay = null;
let input = null;
let list = null;
let items = [];        // current rendered commands
let filtered = [];     // after filtering
let cursor = 0;

/* ─── Build the command list ─── */
function buildCommands(){
  const t = F.t;
  const ar = F.state.lang === 'ar';
  const cmds = [];

  // Domains
  F.M.domains.forEach(d => {
    const name = d['name_' + F.state.lang] || d.name_en;
    cmds.push({
      id: 'domain-' + d.id,
      section: ar ? 'المجالات' : 'Domains',
      name: name,
      hint: F.pc(d.mastery),
      color: d.c,
      icon: ICONS.domain,
      run(){
        const lane = document.querySelector('.lane[data-domain="' + d.id + '"]');
        if (lane){
          close();
          setTimeout(() => lane.click(), 80);
        }
      }
    });
  });

  // Actions
  cmds.push({
    id: 'toggle-theme',
    section: ar ? 'إجراءات' : 'Actions',
    name: F.state.theme === 'dark'
      ? (ar ? 'التبديل إلى السمة الفاتحة' : 'Switch to light theme')
      : (ar ? 'التبديل إلى السمة الداكنة' : 'Switch to dark theme'),
    hint: '⌘⇧L',
    icon: ICONS.theme,
    run(){
      close();
      const th = document.getElementById('th');
      if (th) th.click();
    }
  });

  cmds.push({
    id: 'toggle-lang',
    section: ar ? 'إجراءات' : 'Actions',
    name: ar ? 'Switch to English' : 'التبديل إلى العربية',
    hint: '⌘⇧K',
    icon: ICONS.lang,
    run(){
      close();
      const next = F.state.lang === 'ar' ? 'en' : 'ar';
      const btn = document.querySelector('.lg button[data-l="' + next + '"]');
      if (btn) btn.click();
    }
  });

  cmds.push({
    id: 'begin-session',
    section: ar ? 'إجراءات' : 'Actions',
    name: t('cta'),
    hint: ar ? 'إدخال' : 'Enter',
    icon: ICONS.action,
    run(){
      close();
      const cta = document.querySelector('.cta');
      if (cta) cta.click();
    }
  });

  cmds.push({
    id: 'xp-pulse',
    section: ar ? 'إجراءات' : 'Actions',
    name: ar ? 'تأثير XP (تجربة)' : 'XP pulse (demo)',
    icon: ICONS.action,
    run(){
      close();
      if (window.FLASH_MODULES && window.FLASH_MODULES.xpGain){
        window.FLASH_MODULES.xpGain.play(40);
      }
    }
  });

  cmds.push({
    id: 'brain-pulse',
    section: ar ? 'إجراءات' : 'Actions',
    name: ar ? 'موجة الدماغ (تجربة)' : 'Brain wave (demo)',
    icon: ICONS.action,
    run(){
      close();
      if (window.FLASH_MODULES && window.FLASH_MODULES.brainState){
        window.FLASH_MODULES.brainState.pulse();
      }
    }
  });

  return cmds;
}

/* ─── Fuzzy-ish match ─── */
function matches(cmd, q){
  if (!q) return true;
  const haystack = (cmd.name + ' ' + cmd.section).toLowerCase();
  const needle = q.toLowerCase();
  if (haystack.indexOf(needle) !== -1) return true;
  // Sequence match
  let i = 0;
  for (const ch of needle){
    const j = haystack.indexOf(ch, i);
    if (j === -1) return false;
    i = j + 1;
  }
  return true;
}

/* ─── Render ─── */
function renderItems(){
  if (!list) return;
  if (!filtered.length){
    list.innerHTML = '<li class="cp-empty">' + (F.state.lang === 'ar' ? 'لا توجد نتائج' : 'No results') + '</li>';
    return;
  }

  let html = '';
  let lastSection = null;
  filtered.forEach((cmd, i) => {
    if (cmd.section !== lastSection){
      lastSection = cmd.section;
      html += '<li class="cp-section">' + cmd.section + '</li>';
    }
    html += `
      <li class="cp-item" role="option" aria-selected="${i === cursor}"
          data-idx="${i}" style="${cmd.color ? '--dc:' + cmd.color : ''}">
        <span class="cp-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${cmd.icon}</svg></span>
        <span class="cp-name">${cmd.name}${cmd.hint ? ' <small>' + cmd.hint + '</small>' : ''}</span>
        <span class="cp-dot"></span>
      </li>
    `;
  });
  list.innerHTML = html;
}

/* ─── Filter ─── */
function filter(){
  const q = input ? input.value.trim() : '';
  filtered = items.filter(c => matches(c, q));
  cursor = 0;
  renderItems();
}

/* ─── Open / Close ─── */
function open(){
  if (!overlay) build();
  overlay.classList.add('on');
  setTimeout(() => input && input.focus(), 40);
  document.body.style.overflow = 'hidden';
}

function close(){
  if (!overlay) return;
  overlay.classList.remove('on');
  document.body.style.overflow = '';
  if (input) input.value = '';
  cursor = 0;
}

/* ─── Build DOM once ─── */
function build(){
  overlay = document.createElement('div');
  overlay.className = 'cp-overlay';
  overlay.innerHTML = `
    <div class="cp-box" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="cp-input-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
        <input id="cp-input" type="text" placeholder="${F.state.lang === 'ar' ? 'ابحث عن مجالات أو إجراءات…' : 'Search domains or actions…'}" autocomplete="off" spellcheck="false">
        <span class="cp-kbd">ESC</span>
      </div>
      <ul class="cp-list" role="listbox" id="cp-list"></ul>
      <div class="cp-hint">
        <span><kbd>↑</kbd><kbd>↓</kbd> ${F.state.lang === 'ar' ? 'تنقّل' : 'Navigate'}</span>
        <span><kbd>↵</kbd> ${F.state.lang === 'ar' ? 'تشغيل' : 'Run'}</span>
        <span><kbd>esc</kbd> ${F.state.lang === 'ar' ? 'إغلاق' : 'Close'}</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  input = overlay.querySelector('#cp-input');
  list = overlay.querySelector('#cp-list');

  // Events
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  input.addEventListener('input', filter);

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      cursor = Math.min(filtered.length - 1, cursor + 1);
      renderItems();
      scrollCursorIntoView();
      return;
    }
    if (e.key === 'ArrowUp'){
      e.preventDefault();
      cursor = Math.max(0, cursor - 1);
      renderItems();
      scrollCursorIntoView();
      return;
    }
    if (e.key === 'Enter'){
      e.preventDefault();
      const cmd = filtered[cursor];
      if (cmd && cmd.run) cmd.run();
    }
  });

  list.addEventListener('click', e => {
    const el = e.target.closest('.cp-item');
    if (!el) return;
    const cmd = filtered[+el.dataset.idx];
    if (cmd && cmd.run) cmd.run();
  });

  list.addEventListener('mousemove', e => {
    const el = e.target.closest('.cp-item');
    if (!el) return;
    const i = +el.dataset.idx;
    if (i !== cursor){
      cursor = i;
      renderItems();
    }
  });
}

function scrollCursorIntoView(){
  if (!list) return;
  const el = list.querySelector('.cp-item[aria-selected="true"]');
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
}

/* ─── Global keyboard ─── */
function globalKey(e){
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
  const cmd = isMac ? e.metaKey : e.ctrlKey;

  // Cmd+K — open palette
  if (cmd && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    overlay && overlay.classList.contains('on') ? close() : open();
    return;
  }

  // Cmd+Shift+L — toggle theme
  if (cmd && e.shiftKey && e.key.toLowerCase() === 'l'){
    e.preventDefault();
    const th = document.getElementById('th');
    if (th) th.click();
    return;
  }

  // Cmd+Shift+K — toggle language
  if (cmd && e.shiftKey && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    const next = F.state.lang === 'ar' ? 'en' : 'ar';
    const btn = document.querySelector('.lg button[data-l="' + next + '"]');
    if (btn) btn.click();
    return;
  }

  // "/" — quick open
  if (e.key === '/' && !overlay.classList.contains('on')){
    const tag = (document.activeElement.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    e.preventDefault();
    open();
  }
}

/* ─── Refresh on language/theme change ─── */
function refresh(){
  items = buildCommands();
  if (overlay){
    // Update placeholder + hint text
    const inp = overlay.querySelector('#cp-input');
    if (inp) inp.placeholder = F.state.lang === 'ar'
      ? 'ابحث عن مجالات أو إجراءات…'
      : 'Search domains or actions…';
  }
}

F.onReady(() => {
  setTimeout(() => {
    items = buildCommands();
    document.addEventListener('keydown', globalKey);
  }, 300);

  window.addEventListener('flash:render', refresh);
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.commandPalette = { open, close, refresh };
})();