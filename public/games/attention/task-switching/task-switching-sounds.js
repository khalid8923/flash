/* ═══════════════════════════════════════════════════════════
   Task Switching Sounds — Web Audio Synthesis
   Paradigm: Monsell (2003) — switch cost / rule inversion
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let _ctx = null;

  function ctx() {
    if (_ctx) return _ctx;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _ctx = null; }
    return _ctx;
  }

  function enabled() {
    if (window.FlashSettings && typeof window.FlashSettings.get === 'function') {
      return window.FlashSettings.get('soundEnabled') !== false;
    }
    return true;
  }

  function volume() {
    if (window.FlashSettings && typeof window.FlashSettings.get === 'function') {
      const v = window.FlashSettings.get('soundVolume');
      return typeof v === 'number' ? v : 0.7;
    }
    return 0.7;
  }

  function beep(freq, dur, type, gain, delay) {
    if (!enabled()) return;
    const c = ctx();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime((gain || 0.15) * volume(), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function sweep(f1, f2, dur, type, gain) {
    if (!enabled()) return;
    const c = ctx();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime((gain || 0.15) * volume(), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  window.TaskSwitchingSounds = {
    setEnabled(_v) { /* reads from FlashSettings on next call */ },
    isEnabled: enabled,

    /* ─── Core feedback ─── */
    hit() {
      beep(880, 0.07, 'sine', 0.14, 0);
      beep(1320, 0.09, 'sine', 0.09, 0.035);
    },
    miss() {
      beep(220, 0.14, 'square', 0.11, 0);
      beep(160, 0.16, 'square', 0.09, 0.05);
    },
    tick() {
      beep(1200, 0.025, 'sine', 0.05, 0);
    },
    go() {
      beep(660, 0.09, 'sine', 0.14, 0);
    },

    /* ─── Level & session ─── */
    levelUp() {
      [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.13, 'sine', 0.13, i * 0.06));
    },
    gameOver() {
      sweep(400, 110, 0.5, 'sawtooth', 0.13);
    },
    victory() {
      [659, 784, 988, 1319].forEach((f, i) => beep(f, 0.16, 'triangle', 0.13, i * 0.08));
    },
    personalBest() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.14, 'triangle', 0.12, i * 0.07));
    },
    badge() {
      [880, 1047, 1319].forEach((f, i) => beep(f, 0.11, 'sine', 0.13, i * 0.045));
    },
    click() {
      beep(600, 0.035, 'sine', 0.07, 0);
    },

    /* ─── Task-switching specific cues ─── */
    switchCue() {
      /* Rapid upward sweep = "switch!" signal */
      sweep(560, 990, 0.16, 'sine', 0.13);
    },
    repeatCue() {
      /* Flat lower tone = "repeat same rule" */
      beep(420, 0.14, 'sine', 0.12, 0);
    },
    ruleCue() {
      /* Subtle ping when a new rule is introduced */
      beep(1047, 0.18, 'triangle', 0.11, 0);
      beep(1319, 0.14, 'triangle', 0.08, 0.08);
    }
  };
})();