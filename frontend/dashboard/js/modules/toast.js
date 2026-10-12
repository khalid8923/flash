/* ============================================================
   FLASH - Toast Notifications
   Unified notifications with icons, actions, progress
   ============================================================ */
(function () {
  'use strict';

  let stack = null;

  function ensureStack() {
    if (stack) return stack;
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'region');
    stack.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(stack);
    return stack;
  }

  function icon(kind) {
    switch (kind) {
      case 'success': return '✓';
      case 'error':   return '✕';
      case 'warning': return '!';
      case 'info':
      default:        return 'i';
    }
  }

  function show(opts) {
    const o = Object.assign({
      kind: 'info',
      title: null,
      message: '',
      duration: 4000,
      action: null,
      actionLabel: 'Action',
    }, opts || {});

    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('data-kind', o.kind);
    el.setAttribute('role', o.kind === 'error' ? 'alert' : 'status');

    const iconEl = `<div class="tst-icon">${icon(o.kind)}</div>`;
    const titleEl = o.title ? `<div class="tst-title">${escapeHtml(o.title)}</div>` : '';
    const msgEl = o.message ? `<p class="tst-message">${escapeHtml(o.message)}</p>` : '';
    const actionEl = o.action ? `<button class="tst-action" type="button">${escapeHtml(o.actionLabel)}</button>` : '';
    const progressEl = o.duration > 0
      ? `<div class="tst-progress" style="animation-duration: ${o.duration}ms"></div>`
      : '';

    el.innerHTML = `
      ${iconEl}
      <div class="tst-body">
        ${titleEl}
        ${msgEl}
        ${actionEl}
      </div>
      <button class="tst-close" aria-label="Dismiss" type="button">×</button>
      ${progressEl}
    `;

    const close = () => {
      el.setAttribute('data-leaving', '1');
      setTimeout(() => el.remove(), 220);
    };

    el.querySelector('.tst-close').addEventListener('click', close);
    if (o.action) {
      el.querySelector('.tst-action').addEventListener('click', () => {
        try { o.action(); } catch (e) { console.error(e); }
        close();
      });
    }

    ensureStack().appendChild(el);

    if (o.duration > 0) {
      setTimeout(close, o.duration);
    }

    return { dismiss: close };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─── Public API ─── */
  window.FLASH_TOAST = {
    show,
    success: (msg, title) => show({ kind: 'success', message: msg, title }),
    error:   (msg, title) => show({ kind: 'error',   message: msg, title, duration: 6000 }),
    warning: (msg, title) => show({ kind: 'warning', message: msg, title, duration: 5000 }),
    info:    (msg, title) => show({ kind: 'info',    message: msg, title }),
    action:  (msg, label, fn) => show({ kind: 'info', message: msg, action: fn, actionLabel: label, duration: 8000 }),
    version: '1.0.0'
  };

  /* ─── Auto-hook error events ─── */
  window.addEventListener('flash:error', (e) => {
    const cat = e.detail && e.detail.category;
    if (cat === 'AI_SERVICE' || cat === 'NETWORK' || cat === 'SERVER') {
      const msg = (window.FLASH_ERRORS && window.FLASH_ERRORS.message(cat)) || 'Something went wrong';
      show({ kind: cat === 'NETWORK' ? 'warning' : 'error', message: msg, duration: 5000 });
    }
  });

  console.info('[TOAST] loaded — window.FLASH_TOAST available');
})();