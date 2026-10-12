/* ============================================================
   FLASH — Auth Guard + User Menu + API Authorization
   Loaded FIRST in index.html. Handles:
     1. Redirect to auth.html if not signed in
     2. Patch fetch() to add Authorization header
     3. Inject user menu into header
     4. Logout flow
   ============================================================ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     1. CONFIG + STORAGE KEYS
     ═══════════════════════════════════════════════════════════ */
  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  const KEYS = {
    token: 'flash.session',
    guest: 'flash.guest',
    user:  'flash.user'
  };

  const AUTH_PAGE = 'auth.html';

  /* ═══════════════════════════════════════════════════════════
     2. AUTH STATE
     ═══════════════════════════════════════════════════════════ */
  const auth = {
    token: localStorage.getItem(KEYS.token) || null,
    guest: localStorage.getItem(KEYS.guest) === '1',
    user: null
  };

  try {
    const raw = localStorage.getItem(KEYS.user);
    if (raw) auth.user = JSON.parse(raw);
  } catch (_) {}

  /* ═══════════════════════════════════════════════════════════
     3. REDIRECT IF NOT AUTHED
     ═══════════════════════════════════════════════════════════ */
  if (!auth.token && !auth.guest) {
    const next = encodeURIComponent(
      window.location.pathname.split('/').pop() + window.location.search
    );
    window.location.replace(AUTH_PAGE + '?next=' + next);
    return;
  }

  /* ═══════════════════════════════════════════════════════════
     4. PATCH fetch() — auto-add Authorization header
     ═══════════════════════════════════════════════════════════ */
  const _fetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    init = init || {};

    let url = typeof input === 'string' ? input : (input && input.url) || '';

    /* Only patch requests to our backend */
    if (url.startsWith(API_BASE) || url.startsWith('/api/')) {
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        if (auth.token) init.headers.set('Authorization', 'Bearer ' + auth.token);
      } else {
        init.headers = Object.assign({}, init.headers);
        if (auth.token) init.headers['Authorization'] = 'Bearer ' + auth.token;
      }
    }

    return _fetch(input, init);
  };

  /* ═══════════════════════════════════════════════════════════
     5. EXPORT SESSION API (for other modules)
     ═══════════════════════════════════════════════════════════ */
  window.FLASH_AUTH = {
    isGuest: () => auth.guest,
    hasToken: () => !!auth.token,
    token: () => auth.token,
    user: () => auth.user,
    logout: logout,
    requireAuth: function () {
      if (!auth.token && !auth.guest) {
        window.location.href = AUTH_PAGE;
        return false;
      }
      return true;
    }
  };

  /* ═══════════════════════════════════════════════════════════
     6. LOGOUT
     ═══════════════════════════════════════════════════════════ */
  async function logout() {
    /* Try to notify backend (best-effort) */
    if (auth.token) {
      try {
        await _fetch(API_BASE + '/auth/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + auth.token }
        });
      } catch (_) {}
    }

    /* Clear local state */
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.guest);
    localStorage.removeItem(KEYS.user);

    window.location.href = AUTH_PAGE;
  }

  /* ═══════════════════════════════════════════════════════════
     7. USER MENU — inject into header
     ═══════════════════════════════════════════════════════════ */
  function getUserInitials() {
    if (auth.user && auth.user.email) {
      const email = auth.user.email;
      const before = email.split('@')[0];
      return before.slice(0, 2);
    }
    if (auth.guest) return 'G';
    return 'U';
  }

  function getUserLabel() {
    if (auth.user && auth.user.email) return auth.user.email;
    if (auth.user && auth.user.displayName) return auth.user.displayName;
    if (auth.guest) return 'Guest';
    return 'User';
  }

  function getUserRole() {
    if (auth.guest) return 'Guest mode';
    if (auth.user && auth.user.role) return auth.user.role;
    return 'Member';
  }

  function buildUserMenu() {
    const wrap = document.createElement('div');
    wrap.className = 'flash-user-wrap';
    wrap.style.position = 'relative';

    wrap.innerHTML = `
      <button type="button" class="flash-user" aria-haspopup="menu" aria-expanded="false" id="flash-user-btn">
        <span class="flash-user-avatar">${getUserInitials()}</span>
        <span class="flash-user-label">${getUserLabel()}</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div class="flash-user-menu" role="menu" hidden id="flash-user-menu">
        <div class="flash-user-menu-head">
          <div class="flash-user-menu-email">${getUserLabel()}</div>
          <div class="flash-user-menu-role">${getUserRole()}</div>
        </div>
        <button type="button" role="menuitem" id="flash-user-settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Settings</span>
        </button>
        <button type="button" role="menuitem" id="flash-user-export">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Export data</span>
        </button>
        <button type="button" role="menuitem" class="danger" id="flash-user-logout">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign out</span>
        </button>
      </div>
    `;

    return wrap;
  }

  function wireUserMenu(wrap) {
    const btn  = wrap.querySelector('#flash-user-btn');
    const menu = wrap.querySelector('#flash-user-menu');
    const logoutBtn = wrap.querySelector('#flash-user-logout');
    const settingsBtn = wrap.querySelector('#flash-user-settings');
    const exportBtn = wrap.querySelector('#flash-user-export');

    let open = false;

    function toggle(force) {
      open = typeof force === 'boolean' ? force : !open;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) toggle(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) toggle(false);
    });

    logoutBtn.addEventListener('click', () => logout());

    settingsBtn.addEventListener('click', () => {
      toggle(false);
      window.dispatchEvent(new CustomEvent('flash:open-settings'));
    });

    exportBtn.addEventListener('click', () => {
      toggle(false);
      window.dispatchEvent(new CustomEvent('flash:export-data'));
    });
  }

  function injectUserMenu() {
    const header = document.querySelector('.hdr');
    if (!header) return;

    /* Avoid double-inject */
    if (header.querySelector('.flash-user-wrap')) return;

    const wrap = buildUserMenu();
    wireUserMenu(wrap);

    /* Insert before .tools if exists, else append */
    const tools = header.querySelector('.tools');
    if (tools) {
      tools.insertBefore(wrap, tools.firstChild);
    } else {
      header.appendChild(wrap);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     8. MARK AUTH READY
     ═══════════════════════════════════════════════════════════ */
  function markReady() {
    document.documentElement.setAttribute('data-auth-ready', '1');
  }

  /* ═══════════════════════════════════════════════════════════
     9. BOOT
     ═══════════════════════════════════════════════════════════ */
  function boot() {
    injectUserMenu();
    markReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();