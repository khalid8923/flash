/* ============================================================
   FLASH - Timer Integrity Guard
   - Detects clock skew (user changed system time)
   - Detects tab switches and pauses timers accurately
   - Uses performance.now() instead of Date.now() for accuracy
   - Distinguishes user abort vs. real timeout
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;

  const state = {
    timers: new Map(),
    clockOffset: 0,
    tabHiddenAt: null
  };

  /* ============================================================
     CLOCK SKEW DETECTION
     ============================================================ */
  function detectClockSkew() {
    const wall = Date.now();
    const perf = performance.now();
    const drift = Math.abs((wall - perf) - (state.clockOffset + perf));
    /* If skew > 60s, likely user changed clock */
    if (drift > 60000) {
      if (ERR) ERR.log('GAME_STATE', {
        message: 'Clock skew detected',
        context: { drift_ms: drift }
      });
      return true;
    }
    return false;
  }

  /* ============================================================
     CREATE MANAGED TIMER
     ============================================================ */
  function createTimer(opts) {
    opts = opts || {};
    const id = 't_' + Math.random().toString(36).slice(2, 10);
    const duration = opts.duration || 30000;
    const onTick = opts.onTick || null;
    const onExpire = opts.onExpire || null;
    const onPause = opts.onPause || null;
    const onResume = opts.onResume || null;

    const t = {
      id,
      startedAt: performance.now(),
      duration,
      paused: false,
      pausedAt: 0,
      totalPaused: 0,
      expired: false,
      aborted: false,
      rafId: null,
      onTick,
      onExpire,
      onPause,
      onResume
    };

    /* Wall-clock safety: also track Date.now() to catch clock jumps */
    t.wallStartedAt = Date.now();

    function loop() {
      if (t.paused || t.expired || t.aborted) return;

      const now = performance.now();
      const elapsed = now - t.startedAt - t.totalPaused;
      const remaining = Math.max(0, t.duration - elapsed);

      /* Clock skew check */
      if (detectClockSkew()) {
        /* Treat as expired to be safe */
        t.expired = true;
        if (t.onExpire) {
          try { t.onExpire({ reason: 'clock_skew', timer: t }); } catch (_) {}
        }
        return;
      }

      if (t.onTick) {
        try { t.onTick(remaining, t); } catch (_) {}
      }

      if (remaining <= 0) {
        t.expired = true;
        if (t.onExpire) {
          try { t.onExpire({ reason: 'timeout', timer: t }); } catch (_) {}
        }
        return;
      }

      t.rafId = requestAnimationFrame(loop);
    }

    t.start = () => {
      t.startedAt = performance.now();
      t.wallStartedAt = Date.now();
      t.expired = false;
      t.aborted = false;
      t.totalPaused = 0;
      loop();
    };

    t.pause = (reason) => {
      if (t.paused) return;
      t.paused = true;
      t.pausedAt = performance.now();
      if (t.rafId) cancelAnimationFrame(t.rafId);
      if (t.onPause) {
        try { t.onPause({ reason: reason || 'unknown', timer: t }); } catch (_) {}
      }
    };

    t.resume = () => {
      if (!t.paused) return;
      t.totalPaused += performance.now() - t.pausedAt;
      t.paused = false;
      if (t.onResume) {
        try { t.onResume({ timer: t }); } catch (_) {}
      }
      loop();
    };

    t.abort = (reason) => {
      t.aborted = true;
      if (t.rafId) cancelAnimationFrame(t.rafId);
      state.timers.delete(id);
      if (ERR && reason && reason !== 'user') {
        ERR.log('GAME_STATE', {
          message: 'Timer aborted',
          context: { reason, timer_id: id }
        });
      }
    };

    t.remaining = () => {
      if (t.expired || t.aborted) return 0;
      const now = performance.now();
      const elapsed = now - t.startedAt - t.totalPaused;
      return Math.max(0, t.duration - elapsed);
    };

    t.destroy = () => {
      t.abort('destroy');
    };

    state.timers.set(id, t);
    return t;
  }

  /* ============================================================
     TAB VISIBILITY HANDLING
     ============================================================ */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.tabHiddenAt = Date.now();
      /* Pause all timers */
      state.timers.forEach((t) => {
        if (!t.paused && !t.expired && !t.aborted) {
          t.pause('tab_hidden');
        }
      });
    } else {
      const hiddenFor = state.tabHiddenAt ? Date.now() - state.tabHiddenAt : 0;
      state.tabHiddenAt = null;

      /* If hidden > 30s, most games should end the timer with awareness */
      const longPause = hiddenFor > 30000;

      state.timers.forEach((t) => {
        if (t.paused && !t.expired && !t.aborted) {
          if (longPause && t.onExpire) {
            /* Treat as timeout because player was away */
            t.expired = true;
            try {
              t.onExpire({ reason: 'tab_hidden_long', timer: t, hidden_ms: hiddenFor });
            } catch (_) {}
          } else {
            t.resume();
          }
        }
      });
    }
  });

  /* ============================================================
     CLOCK JUMP GUARD (poll every 2s)
     ============================================================ */
  let _lastWall = Date.now();
  let _lastPerf = performance.now();
  setInterval(() => {
    const wall = Date.now();
    const perf = performance.now();
    const wallDelta = wall - _lastWall;
    const perfDelta = perf - _lastPerf;
    /* If wall moved much more than perf, clock jumped */
    if (Math.abs(wallDelta - perfDelta) > 5000) {
      if (ERR) ERR.log('GAME_STATE', {
        message: 'Clock jump detected',
        context: { wall_delta: wallDelta, perf_delta: perfDelta }
      });
      /* Force-expire all active timers to avoid corrupted scores */
      state.timers.forEach((t) => {
        if (!t.expired && !t.aborted && t.onExpire) {
          t.expired = true;
          try { t.onExpire({ reason: 'clock_jump', timer: t }); } catch (_) {}
        }
      });
    }
    _lastWall = wall;
    _lastPerf = perf;
  }, 2000);

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_TIMER = {
    create: createTimer,
    activeCount: () => state.timers.size,
    abortAll: () => {
      state.timers.forEach((t) => t.abort('mass'));
      state.timers.clear();
    },
    version: '1.0.0'
  };

  console.info('[FLASH_TIMER] ready — integrity guard active');
})();