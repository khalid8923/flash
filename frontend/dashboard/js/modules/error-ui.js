/* ============================================================
   FLASH - Error UI Runtime
   Banners, toasts, modals, empty, skeleton, save pill
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  if (!ERR) { console.error('[error-ui] errors.js required'); return; }

  const $ = (s, c) => (c || document).querySelector(s);

  /* ============================================================
     BANNER (single global)
     ============================================================ */
  let bannerEl = null;
  let bannerHideTimer = null;

  function ensureBanner() {
    if (bannerEl && document.body.contains(bannerEl)) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.className = 'flash-banner';
    bannerEl.setAttribute('role', 'status');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.dataset.kind = 'info';
    bannerEl.dataset.visible = '0';
    bannerEl.innerHTML =
      '<span class="flash-banner-dot" aria-hidden="true"></span>' +
      '<span class="flash-banner-text"></span>' +
      '<button type="button" class="flash-banner-action" hidden></button>';
    document.body.appendChild(bannerEl);
    return bannerEl;
  }

  function showBanner(opts) {
    opts = opts || {};
    const el = ensureBanner();
    el.dataset.kind = opts.kind || 'info';
    el.dataset.visible = '1';
    const text = el.querySelector('.flash-banner-text');
    if (text) text.textContent = opts.message || ERR.message(opts.category || 'UNKNOWN');

    const action = el.querySelector('.flash-banner-action');
    if (action) {
      if (opts.actionLabel && typeof opts.onAction === 'function') {
        action.textContent = opts.actionLabel;
        action.hidden = false;
        action.onclick = () => { try { opts.onAction(); } catch (_) {} };
      } else {
        action.hidden = true;
        action.onclick = null;
      }
    }

    if (bannerHideTimer) clearTimeout(bannerHideTimer);
    if (opts.autoHide) {
      bannerHideTimer = setTimeout(() => hideBanner(), opts.autoHide);
    }
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.dataset.visible = '0';
  }

  /* ============================================================
     TOASTS
     ============================================================ */
  let toastStack = null;

  function ensureToastStack() {
    if (toastStack && document.body.contains(toastStack)) return toastStack;
    toastStack = document.createElement('div');
    toastStack.className = 'flash-toast-stack';
    toastStack.setAttribute('aria-live', 'polite');
    toastStack.setAttribute('aria-atomic', 'false');
    document.body.appendChild(toastStack);
    return toastStack;
  }

  const ICONS = {
    info:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    success: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };

  function showToast(opts) {
    opts = opts || {};
    const stack = ensureToastStack();
    const kind = opts.kind || 'info';
    const el = document.createElement('div');
    el.className = 'flash-toast';
    el.dataset.kind = kind;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');

    el.innerHTML =
      '<span class="flash-toast-icon">' + (ICONS[kind] || ICONS.info) + '</span>' +
      '<div class="flash-toast-body">' +
        (opts.title ? '<div class="flash-toast-title"></div>' : '') +
        '<div class="flash-toast-msg"></div>' +
      '</div>' +
      '<button type="button" class="flash-toast-close" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      '</button>';

    const titleEl = el.querySelector('.flash-toast-title');
    if (titleEl && opts.title) titleEl.textContent = opts.title;

    const msgEl = el.querySelector('.flash-toast-msg');
    if (msgEl) {
      msgEl.textContent = opts.message ||
        ERR.message(opts.category || 'UNKNOWN');
    }

    function dismiss() {
      el.dataset.leaving = '1';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
    }

    el.querySelector('.flash-toast-close').addEventListener('click', dismiss);

    stack.appendChild(el);

    const ttl = typeof opts.ttl === 'number' ? opts.ttl : (kind === 'error' ? 8000 : 4500);
    if (ttl > 0) setTimeout(dismiss, ttl);

    return { dismiss, el };
  }

  /* ============================================================
     MODAL (blocking)
     ============================================================ */
  function showModal(opts) {
    opts = opts || {};
    const backdrop = document.createElement('div');
    backdrop.className = 'flash-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    backdrop.innerHTML =
      '<div class="flash-modal">' +
        '<div class="flash-modal-title"></div>' +
        '<div class="flash-modal-body"></div>' +
        (opts.errorId ? '<div class="flash-modal-error-id">ID: ' + opts.errorId + '</div>' : '') +
        '<div class="flash-modal-actions"></div>' +
      '</div>';

    const titleEl = backdrop.querySelector('.flash-modal-title');
    if (titleEl) titleEl.textContent = opts.title || ERR.message(opts.category || 'UNKNOWN');

    const bodyEl = backdrop.querySelector('.flash-modal-body');
    if (bodyEl) {
      bodyEl.textContent = opts.body ||
        'Something went wrong. You can retry or continue.';
    }

    const actionsEl = backdrop.querySelector('.flash-modal-actions');

    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (opts.returnFocus && typeof opts.returnFocus.focus === 'function') {
        try { opts.returnFocus.focus(); } catch (_) {}
      }
    }

    if (opts.retryLabel && typeof opts.onRetry === 'function') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'flash-modal-btn primary';
      retry.textContent = opts.retryLabel;
      retry.addEventListener('click', () => { close(); try { opts.onRetry(); } catch (_) {} });
      actionsEl.appendChild(retry);
    }

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'flash-modal-btn ' + (opts.retryLabel ? 'secondary' : 'primary');
    dismiss.textContent = opts.dismissLabel || 'Close';
    dismiss.addEventListener('click', close);
    actionsEl.appendChild(dismiss);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    document.body.appendChild(backdrop);

    // focus first button
    const firstBtn = actionsEl.querySelector('button');
    if (firstBtn) firstBtn.focus();

    return { close };
  }

  /* ============================================================
     EMPTY STATE
     ============================================================ */
  function renderEmpty(container, opts) {
    opts = opts || {};
    if (!container) return;
    const html =
      '<div class="flash-empty">' +
        '<div class="flash-empty-icon">' +
          '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>' +
        '</div>' +
        (opts.title ? '<div class="flash-empty-title">' + escape(opts.title) + '</div>' : '') +
        (opts.message ? '<div class="flash-empty-msg">' + escape(opts.message) + '</div>' : '') +
        (opts.actionLabel ? '<button type="button" class="flash-empty-action">' + escape(opts.actionLabel) + '</button>' : '') +
      '</div>';
    container.innerHTML = html;
    if (opts.actionLabel && typeof opts.onAction === 'function') {
      const btn = container.querySelector('.flash-empty-action');
      if (btn) btn.addEventListener('click', opts.onAction);
    }
  }

  /* ============================================================
     SKELETON
     ============================================================ */
  function renderSkeleton(container, opts) {
    opts = opts || {};
    if (!container) return;
    const lines = opts.lines || 3;
    let html = '<div class="flash-skeleton-block"></div>';
    for (let i = 0; i < lines; i++) {
      html += '<div class="flash-skeleton flash-skeleton-line' + (i === lines - 1 ? ' short' : '') + '"></div>';
    }
    container.innerHTML = html;
  }

  /* ============================================================
     INLINE ERROR (form fields)
     ============================================================ */
  function setInlineError(field, message) {
    if (!field) return;
    const parent = field.parentNode;
    if (!parent) return;
    let err = parent.querySelector('.flash-inline-error');
    if (message) {
      if (!err) {
        err = document.createElement('div');
        err.className = 'flash-inline-error';
        parent.appendChild(err);
      }
      err.textContent = message;
      field.setAttribute('aria-invalid', 'true');
    } else if (err) {
      err.remove();
      field.removeAttribute('aria-invalid');
    }
  }

  /* ============================================================
     COMPONENT BOUNDARY
     ============================================================ */
  function boundary(fn, container, opts) {
    opts = opts || {};
    try {
      return fn();
    } catch (err) {
      const cls = ERR.classify(err);
      ERR.log(cls.category, {
        message: err && err.message,
        feature: opts.feature || null,
        operation: opts.operation || null
      });

      if (container) {
        const fallback = document.createElement('div');
        fallback.className = 'flash-boundary-fallback';
        fallback.innerHTML = escape(opts.fallbackMessage || 'This section could not load.') +
          (typeof opts.onRetry === 'function' ? ' <button type="button">Retry</button>' : '');
        container.innerHTML = '';
        container.appendChild(fallback);
        if (typeof opts.onRetry === 'function') {
          const btn = fallback.querySelector('button');
          if (btn) btn.addEventListener('click', opts.onRetry);
        }
      }
      return null;
    }
  }

  /* ============================================================
     SAVE STATUS PILL
     ============================================================ */
  function setSaveStatus(container, state, message) {
    if (!container) return;
    let pill = container.querySelector('.flash-save-status');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'flash-save-status';
      pill.innerHTML = '<span class="flash-save-dot"></span><span class="flash-save-label"></span>';
      container.appendChild(pill);
    }
    pill.dataset.state = state;
    const label = pill.querySelector('.flash-save-label');
    if (label) label.textContent = message || ({
      saved:   'Saved',
      pending: 'Syncing...',
      failed:  'Sync failed'
    })[state] || state;
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
     GLOBAL ERROR HOOKS
     ============================================================ */
  window.addEventListener('error', (e) => {
    if (!e || !e.error) return;
    const cls = ERR.classify(e.error);
    ERR.log(cls.category, {
      message: e.error.message,
      context: { file: e.filename, line: e.lineno, col: e.colno }
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (!e || !e.reason) return;
    const cls = ERR.classify(e.reason);
    ERR.log(cls.category, {
      message: e.reason.message || String(e.reason)
    });
    // Prevent console spam in production
    if (!window.FLASH_DEBUG) {
      try { e.preventDefault(); } catch (_) {}
    }
  });

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_UI = {
    showBanner,
    hideBanner,
    showToast,
    showModal,
    renderEmpty,
    renderSkeleton,
    setInlineError,
    boundary,
    setSaveStatus,
    version: '1.0.0'
  };
})();