/* ============================================================
   FLASH - Command Palette v2 (Ctrl+K)
   Fuzzy search + groups (Actions, Games, Domains, Settings)
   ============================================================ */
(function () {
  'use strict';

  const API = window.FLASH_API;
  const TM = window.FLASH_THEME;
  const F = window.FLASH;

  let el = null;
  let input = null;
  let results = null;
  let activeIndex = 0;
  let flatItems = [];

  /* ─── Built-in commands ─── */
  const COMMANDS = [
    { group: 'Actions', title: 'Toggle theme', subtitle: 'Light ↔ Dark ↔ Auto', icon: '◐', key: 'Ctrl+Shift+L',
      run: () => TM && TM.cycle() },
    { group: 'Actions', title: 'Open settings', subtitle: 'Theme, accent, density', icon: '⚙', key: 'Ctrl+,',
      run: () => window.FLASH_SETTINGS_V2 && window.FLASH_SETTINGS_V2.open() },
    { group: 'Actions', title: 'Refresh data', subtitle: 'Reload from backend', icon: '↻',
      run: () => API && API.checkLive && API.checkLive() },
    { group: 'Actions', title: 'Export data', subtitle: 'Download JSON', icon: '↧',
      run: () => window.FLASH_DATA_EXPORT && window.FLASH_DATA_EXPORT.downloadJSON() },
    { group: 'Actions', title: 'Print dashboard', subtitle: 'Ctrl+P', icon: '🖶',
      run: () => window.print() },
    { group: 'Actions', title: 'Show keyboard shortcuts', subtitle: 'Press ?', icon: '⌘',
      run: () => window.FLASH_KEYBOARD_HELP && window.FLASH_KEYBOARD_HELP.open() },
    { group: 'Navigation', title: 'Go to Sessions', subtitle: 'Full archive', icon: '📋',
      run: () => { window.location.href = 'sessions.html'; } },
    { group: 'Navigation', title: 'Go to Fingerprint', subtitle: 'Cognitive fingerprint', icon: '🧠',
      run: () => { window.location.href = 'fingerprint.html'; } },
    { group: 'Navigation', title: 'Go to AI Lab', subtitle: 'Experiments', icon: '🧪',
      run: () => { window.location.href = 'ai-lab.html'; } },
  ];

  /* ─── Build DOM ─── */
  function build() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'cmd-palette';
    el.setAttribute('data-open', '0');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="cp-panel">
        <div class="cp-input-row">
          <svg class="cp-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input class="cp-input" type="text" placeholder="Search games, actions, settings…" aria-label="Command" />
          <span class="cp-hint">ESC</span>
        </div>
        <div class="cp-results" role="listbox"></div>
      </div>
    `;
    document.body.appendChild(el);

    input = el.querySelector('.cp-input');
    results = el.querySelector('.cp-results');

    input.addEventListener('input', debounce(filter, 60));
    input.addEventListener('keydown', handleKey);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
  }

  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  /* ─── Search & filter ─── */
  async function getItems() {
    const items = [...COMMANDS];

    /* Games from FLASH_DATA */
    const M = window.FLASH_DATA;
    if (M && M.games) {
      Object.keys(M.games).forEach(domain => {
        (M.games[domain] || []).forEach(g => {
          items.push({
            group: 'Games',
            title: g.n_en || g.id,
            subtitle: (g.d_en || '') + ' · ' + domain,
            icon: g.ic || '🎮',
            search: [g.id, g.n_en, g.n_ar, domain].join(' ').toLowerCase(),
            run: () => {
              const url = '../games/' + domain + '/' + g.id + '/game.html';
              window.location.href = url;
            }
          });
        });
      });
    }

    /* Domains */
    if (M && M.domains) {
      M.domains.forEach(d => {
        items.push({
          group: 'Domains',
          title: d.name_en || d.id,
          subtitle: 'Jump to domain',
          icon: '◯',
          search: [d.id, d.name_en, d.name_ar].join(' ').toLowerCase(),
          run: () => { window.location.href = 'domain.html#' + d.id; }
        });
      });
    }

    return items;
  }

  async function filter() {
    const q = (input.value || '').trim().toLowerCase();
    const all = await getItems();

    const matched = q
      ? all.filter(i => {
          const hay = (i.search || (i.title + ' ' + i.subtitle).toLowerCase());
          return hay.includes(q) || fuzzyMatch(hay, q);
        })
      : all;

    render(matched.slice(0, 30));
  }

  function fuzzyMatch(text, q) {
    let i = 0;
    for (const ch of q) {
      i = text.indexOf(ch, i);
      if (i === -1) return false;
      i++;
    }
    return true;
  }

  /* ─── Render ─── */
  function render(items) {
    if (!results) return;
    flatItems = items;
    activeIndex = 0;

    if (items.length === 0) {
      results.innerHTML = '<div class="cp-empty">No results</div>';
      return;
    }

    const byGroup = {};
    items.forEach((it, idx) => {
      if (!byGroup[it.group]) byGroup[it.group] = [];
      byGroup[it.group].push({ ...it, _idx: idx });
    });

    let html = '';
    let first = true;
    Object.keys(byGroup).forEach(group => {
      html += `<div class="cp-group-title">${escapeHtml(group)}</div>`;
      byGroup[group].forEach(it => {
        const active = it._idx === activeIndex ? ' active' : '';
        html += `
          <div class="cp-item${active}" role="option" data-idx="${it._idx}">
            <div class="cp-item-icon">${escapeHtml(it.icon || '·')}</div>
            <div class="cp-item-body">
              <div class="cp-item-title">${escapeHtml(it.title)}</div>
              <div class="cp-item-subtitle">${escapeHtml(it.subtitle || '')}</div>
            </div>
            ${it.key ? `<span class="cp-item-key">${escapeHtml(it.key)}</span>` : ''}
          </div>
        `;
        first = false;
      });
    });

    results.innerHTML = html;
    results.querySelectorAll('.cp-item').forEach(row => {
      row.addEventListener('mouseenter', () => setActive(parseInt(row.dataset.idx, 10)));
      row.addEventListener('click', () => runItem(parseInt(row.dataset.idx, 10)));
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function setActive(idx) {
    activeIndex = idx;
    results.querySelectorAll('.cp-item').forEach(row => {
      row.classList.toggle('active', parseInt(row.dataset.idx, 10) === idx);
    });
  }

  function runItem(idx) {
    const item = flatItems[idx];
    if (!item) return;
    close();
    try { item.run(); } catch (e) { console.error(e); }
  }

  /* ─── Keyboard ─── */
  function handleKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(flatItems.length - 1, activeIndex + 1));
      scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(0, activeIndex - 1));
      scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(activeIndex);
    }
  }

  function scrollActiveIntoView() {
    const el = results.querySelector('.cp-item.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  /* ─── Open / Close ─── */
  function open() {
    build();
    input.value = '';
    el.setAttribute('data-open', '1');
    filter();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    if (el) el.setAttribute('data-open', '0');
  }

  /* ─── Global shortcuts ─── */
  document.addEventListener('keydown', (e) => {
    /* Ctrl/Cmd + K */
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (el && el.getAttribute('data-open') === '1') close();
      else open();
    }
    /* "/" opens palette when not typing */
    if (e.key === '/' && !isTyping(e.target)) {
      e.preventDefault();
      open();
    }
  });

  function isTyping(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  window.FLASH_CMD_PALETTE = { open, close, version: '1.0.0' };
  console.info('[CMD_PALETTE] loaded — Ctrl+K to open');
})();