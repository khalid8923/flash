/* ============================================================
   FLASH - Game Complete Bridge
   Listens to postMessage from game iframes, converts to
   session schema, enqueues via saveQueue (offline-safe).
   Idempotent: duplicate messages are ignored.
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const UI = window.FLASH_UI;
  const QUEUE = window.FLASH_SAVE_QUEUE;

  if (!ERR || !QUEUE) {
    console.error('[game-bridge] requires errors.js + save-queue.js');
    return;
  }

  const SEEN_KEY = 'flash.seenSessions';
  const SEEN_MAX = 200;

  /* ============================================================
     VALIDATION
     ============================================================ */
  function isValidPayload(p) {
    if (!p || typeof p !== 'object') return false;
    if (p.type !== 'flash:game-complete') return false;
    if (!p.gameId || typeof p.gameId !== 'string') return false;
    if (!p.domain || typeof p.domain !== 'string') return false;
    return true;
  }

  /* ============================================================
     UUID
     ============================================================ */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /* ============================================================
     SEEN LIST (dedup guard for identical payloads)
     ============================================================ */
  function readSeen() {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function writeSeen(arr) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr.slice(-SEEN_MAX)));
    } catch (_) {}
  }

  function markSeen(id) {
    const s = readSeen();
    if (!s.includes(id)) {
      s.push(id);
      writeSeen(s);
    }
  }

  function hasSeen(id) {
    return readSeen().includes(id);
  }

  /* ============================================================
     NORMALIZE PAYLOAD → SESSION SCHEMA
     ============================================================ */
  function normalize(payload) {
    const now = new Date();
    const endedAt = payload.endedAt ? new Date(payload.endedAt) : now;
    const startedAt = payload.startedAt
      ? new Date(payload.startedAt)
      : new Date(endedAt.getTime() - 60_000);

    const clientSessionId = payload.client_session_id
      || payload.sessionId
      || ('flash_' + payload.gameId + '_' + endedAt.getTime() + '_' + Math.random().toString(36).slice(2, 8));

    /* Prepare trials array — if the game provides them */
    const trials = Array.isArray(payload.trials) ? payload.trials : [];

    /* Client metadata */
    const clientMeta = {
      user_agent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      device_id: getOrCreateDeviceId(),
      device_clock_skew_ms: null
    };

    return {
      schema_version: 1,
      client_session_id: clientSessionId,
      game_id: payload.gameId,
      domain_id: payload.domain,
      mode: payload.mode || 'classic',
      seed: payload.seed || '0000000000000000',
      ticket_id: payload.ticketId || null,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      game_version: payload.gameVersion || '1.0.0',
      scoring_version: 1,
      trials,
      config: payload.config || {},
      client_meta: clientMeta,
      source: navigator.onLine ? 'live' : 'offline'
    };
  }

  function getOrCreateDeviceId() {
    const KEY = 'flash.deviceId';
    try {
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch (_) {
      return 'unknown';
    }
  }

  /* ============================================================
     HANDLER
     ============================================================ */
  function handleMessage(payload) {
    if (!isValidPayload(payload)) return;

    /* Dedup guard — same gameId within 500ms should be ignored */
    const dedupKey = 'msg_' + payload.gameId + '_' + (payload.endedAt || 'now');
    if (hasSeen(dedupKey)) {
      console.info('[game-bridge] duplicate ignored:', payload.gameId);
      return;
    }
    markSeen(dedupKey);

    /* Normalize to session schema */
    let session;
    try {
      session = normalize(payload);
    } catch (err) {
      ERR.log('VALIDATION', {
        message: 'Failed to normalize game payload',
        operation: 'game-complete',
        feature: payload.gameId,
        context: { error: err.message }
      });
      return;
    }

    /* Enqueue */
    const item = QUEUE.enqueue(session);

    if (!item) {
      /* Already queued (same idempotency key) */
      console.info('[game-bridge] already queued:', session.client_session_id);
      return;
    }

    /* User feedback */
    if (UI) {
      const online = navigator.onLine;
      UI.showToast({
        kind: online ? 'info' : 'warning',
        title: online ? 'Saving result…' : 'Saved locally',
        message: online
          ? 'Sending your session to the server.'
          : 'Will sync automatically when back online.',
        ttl: 3200
      });
    }

    /* Notify interested UI */
    try {
      window.dispatchEvent(new CustomEvent('flash:game-complete', {
        detail: { session, item }
      }));
    } catch (_) {}
  }

  /* ============================================================
     LISTEN FOR MESSAGES
     ============================================================ */
  window.addEventListener('message', (e) => {
    try {
      if (!e || !e.data) return;
      if (typeof e.data !== 'object') return;
      if (e.data.type !== 'flash:game-complete') return;
      handleMessage(e.data);
    } catch (err) {
      ERR.log('GAME_STATE', {
        message: err.message,
        operation: 'game-message-received'
      });
    }
  });

  /* ============================================================
     FLUSH ON VISIBILITY CHANGE
     (helps when user switches tabs mid-save)
     ============================================================ */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine && QUEUE.pendingCount() > 0) {
      QUEUE.flush().catch(() => {});
    }
  });

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_GAME_BRIDGE = {
    handle: handleMessage,
    pending: () => QUEUE.pendingCount(),
    flush: () => QUEUE.flush(),
    version: '1.0.0'
  };

  console.info('[FLASH_GAME_BRIDGE] ready — listening for game-complete messages');
})();