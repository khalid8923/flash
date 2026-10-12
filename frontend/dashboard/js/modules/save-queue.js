/* ============================================================
   FLASH - Save Queue
   Offline-first result saving with idempotency + retry
   Guarantees no data loss + no duplicate submissions
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const UI = window.FLASH_UI;
  if (!ERR || !UI) { console.error('[save-queue] deps missing'); return; }

  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  const QUEUE_KEY = 'flash.saveQueue';
  const MAX_QUEUE = 200;

  /* ============================================================
     QUEUE OPERATIONS
     ============================================================ */
  function readQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function writeQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
      return true;
    } catch (err) {
      const cls = ERR.classify(err);
      ERR.log(cls.category, {
        message: 'Queue write failed',
        context: { name: err.name }
      });
      return false;
    }
  }

  function makeIdempotencyKey(payload) {
    const base = (payload && (payload.client_session_id || payload.id)) || '';
    const ts = payload && payload.ended_at ? payload.ended_at : Date.now();
    return 'flash_' + base + '_' + ts;
  }

  /* ============================================================
     ENQUEUE
     ============================================================ */
  function enqueue(payload) {
    if (!payload) return null;

    const item = {
      id: ERR.genId(),
      idempotencyKey: makeIdempotencyKey(payload),
      endpoint: '/sessions',
      method: 'POST',
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
      lastAttemptAt: null,
      lastError: null,
      status: 'pending'
    };

    const q = readQueue();
    /* Prevent duplicate: same idempotency key */
    if (q.some((x) => x.idempotencyKey === item.idempotencyKey)) {
      return null;
    }
    q.push(item);
    if (!writeQueue(q)) {
      UI.showToast({
        kind: 'error',
        category: 'STORAGE',
        message: 'Could not queue result. Please retry.'
      });
      return null;
    }

    try {
      window.dispatchEvent(new CustomEvent('flash:queue-changed'));
    } catch (_) {}

    /* Try to flush immediately */
    flush().catch(() => {});

    return item;
  }

  /* ============================================================
     FLUSH — attempt to send all pending items
     ============================================================ */
  let flushing = false;

  async function flush() {
    if (flushing) return { sent: 0, pending: readQueue().length };
    flushing = true;

    const q = readQueue();
    let sent = 0;
    let touched = false;

    for (let i = 0; i < q.length; i++) {
      const item = q[i];
      if (item.status === 'sent') continue;

      item.attempts++;
      item.lastAttemptAt = new Date().toISOString();

      try {
        const res = await window.FLASH_SAFE_FETCH(API_BASE + item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
          idempotencyKey: item.idempotencyKey,
          timeoutMs: 15000
        });

        if (res.ok) {
          item.status = 'sent';
          item.lastError = null;
          sent++;
          touched = true;
          continue;
        }

        if (res.status === 409) {
          /* Already accepted - treat as success */
          item.status = 'sent';
          item.lastError = 'duplicate';
          touched = true;
          sent++;
          continue;
        }

        /* Non-OK: classify, mark failed after N attempts */
        const cls = ERR.classify({ status: res.status });
        item.lastError = res.status;

        if (item.attempts >= 5 || !ERR.isRetryable(cls.category)) {
          item.status = 'failed';
        }
        touched = true;
      } catch (err) {
        const cls = ERR.classify(err);
        item.lastError = err.message || 'network';
        if (item.attempts >= 5) item.status = 'failed';
        touched = true;
      }
    }

    if (touched) {
      /* Keep only unsent items (pending + failed but not sent) */
      const remaining = q.filter((x) => x.status !== 'sent');
      writeQueue(remaining);
      try {
        window.dispatchEvent(new CustomEvent('flash:queue-changed'));
      } catch (_) {}
    }

    flushing = false;

    return { sent, pending: readQueue().length };
  }

  /* ============================================================
     STATE HELPERS
     ============================================================ */
  function pendingCount() {
    return readQueue().filter((x) => x.status !== 'sent').length;
  }

  function clearSent() {
    const q = readQueue().filter((x) => x.status !== 'sent');
    writeQueue(q);
  }

  function clearAll() {
    try { localStorage.removeItem(QUEUE_KEY); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('flash:queue-changed')); } catch (_) {}
  }

  /* ============================================================
     AUTO-FLUSH
     ============================================================ */
  window.addEventListener('flash:online', () => { flush().catch(() => {}); });
  window.addEventListener('online', () => { flush().catch(() => {}); });

  /* Periodic retry */
  setInterval(() => {
    if (navigator.onLine && pendingCount() > 0) {
      flush().catch(() => {});
    }
  }, 45000);

  /* Flush on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => { flush().catch(() => {}); }, 1500);
    });
  } else {
    setTimeout(() => { flush().catch(() => {}); }, 1500);
  }

  /* Save status events */
  function emitSaveStatus() {
    const count = pendingCount();
    try {
      window.dispatchEvent(new CustomEvent('flash:save-status', {
        detail: { pending: count }
      }));
    } catch (_) {}
  }

  window.addEventListener('flash:queue-changed', emitSaveStatus);

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_SAVE_QUEUE = {
    enqueue,
    flush,
    pendingCount,
    clearSent,
    clearAll,
    version: '1.0.0'
  };
})();