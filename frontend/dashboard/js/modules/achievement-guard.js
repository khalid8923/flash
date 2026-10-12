/* ============================================================
   FLASH - Progress & Achievement Double-Fire Guard
   Prevents: duplicate session counts, duplicate badges,
   duplicate milestones, duplicate streak increments
   Uses: session id + hash + cooldown window
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;

  const KEYS = {
    fired:   'flash.firedEvents',    /* [{ id, at }] */
    sessions: 'flash.sessionIdLog'    /* [ sessionId ] */
  };

  const FIRED_MAX = 500;
  const SESSIONS_MAX = 500;

  /* ============================================================
     STORAGE
     ============================================================ */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      /* QuotaExceeded — clean oldest half */
      if (e && e.name === 'QuotaExceededError') {
        if (Array.isArray(val)) {
          try {
            localStorage.setItem(key, JSON.stringify(val.slice(-Math.floor(val.length / 2))));
            return true;
          } catch (_) { return false; }
        }
      }
      return false;
    }
  }

  /* ============================================================
     SESSION DEDUP
     ============================================================ */
  function hasSessionFired(sessionId) {
    if (!sessionId) return false;
    const arr = readJSON(KEYS.sessions, []);
    return arr.indexOf(sessionId) >= 0;
  }

  function markSessionFired(sessionId) {
    if (!sessionId) return;
    const arr = readJSON(KEYS.sessions, []);
    if (arr.indexOf(sessionId) >= 0) return false;
    arr.push(sessionId);
    /* Trim */
    const trimmed = arr.slice(-SESSIONS_MAX);
    return writeJSON(KEYS.sessions, trimmed);
  }

  /* ============================================================
     EVENT DEDUP (badges, milestones, achievements)
     ============================================================ */
  function hasEventFired(eventId) {
    if (!eventId) return false;
    const arr = readJSON(KEYS.fired, []);
    return arr.some((e) => e.id === eventId);
  }

  function markEventFired(eventId) {
    if (!eventId) return false;
    const arr = readJSON(KEYS.fired, []);
    if (arr.some((e) => e.id === eventId)) return false;
    arr.push({ id: eventId, at: Date.now() });
    const trimmed = arr.slice(-FIRED_MAX);
    return writeJSON(KEYS.fired, trimmed);
  }

  /* ============================================================
     UNIFIED GUARD API
     ============================================================ */
  const guard = {
    /**
     * Check + mark a session result in one atomic call.
     * Returns TRUE if this is the first time we've seen it.
     * Returns FALSE if it's a duplicate (should be ignored).
     */
    claimSession(sessionId) {
      if (!sessionId) return true; /* allow when no id (fallback) */
      if (hasSessionFired(sessionId)) {
        if (ERR) ERR.log('SAVE_SYNC', {
          message: 'Duplicate session claim blocked',
          context: { session_id: sessionId }
        });
        return false;
      }
      const ok = markSessionFired(sessionId);
      if (!ok && ERR) {
        ERR.log('STORAGE', {
          message: 'Failed to persist session claim',
          context: { session_id: sessionId }
        });
      }
      return true;
    },

    /**
     * Check + mark a milestone/badge/achievement event.
     * `id` should be unique per (player, achievement, tier) tuple.
     */
    claimAchievement(achievementId) {
      if (!achievementId) return true;
      if (hasEventFired(achievementId)) return false;
      markEventFired(achievementId);
      return true;
    },

    /**
     * Convenience: build a deterministic idempotency key
     */
    key(parts) {
      return parts.filter(Boolean).join(':');
    },

    /* Diagnostics */
    stats() {
      return {
        sessions: readJSON(KEYS.sessions, []).length,
        events: readJSON(KEYS.fired, []).length
      };
    },

    reset() {
      try {
        localStorage.removeItem(KEYS.sessions);
        localStorage.removeItem(KEYS.fired);
      } catch (_) {}
    },

    version: '1.0.0'
  };

  /* ============================================================
     HOOK INTO GAME-COMPLETE EVENTS
     ============================================================ */
  window.addEventListener('flash:game-complete', (e) => {
    const detail = e && e.detail;
    if (!detail || !detail.session) return;

    const sid = detail.session.client_session_id;
    if (!sid) return;

    /* Already claimed? Ignore silently */
    if (!guard.claimSession(sid)) {
      if (ERR) ERR.log('SAVE_SYNC', {
        message: 'Prevented duplicate game-complete processing',
        context: { session_id: sid }
      });
    }
  });

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_GUARD = guard;
  console.info('[FLASH_GUARD] ready — double-fire protection active');
})();