/* ═══════════════════════════════════════════════════════════
   Creative Connect Sounds — Web Audio Synthesis
   Paradigm: Mednick (1962) — Remote Associates Test
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

  window.CreativeConnectSounds = {
    setEnabled(_v) { /* reads from FlashSettings on next call */ },
    isEnabled: enabled,

    /* ─── Core feedback ─── */
    hit() {
      beep(880, 0.08, 'sine', 0.14, 0);
      beep(1109, 0.09, 'sine', 0.1, 0.04);
      beep(1480, 0.11, 'sine', 0.08, 0.08);
    },
    miss() {
      beep(330, 0.12, 'sine', 0.1, 0);
      beep(247, 0.16, 'sine', 0.09, 0.06);
    },
    tick() {
      beep(1400, 0.02, 'sine', 0.05, 0);
    },
    go() {
      beep(700, 0.1, 'sine', 0.13, 0);
    },

    /* ─── Level & session ─── */
    levelUp() {
      /* Sparkle arpeggio — creative burst */
      [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.14, 'triangle', 0.12, i * 0.06));
    },
    gameOver() {
      sweep(500, 140, 0.55, 'sine', 0.12);
    },
    victory() {
      [784, 988, 1175, 1568, 2093].forEach((f, i) => beep(f, 0.15, 'triangle', 0.12, i * 0.075));
    },
    personalBest() {
      [659, 880, 1109, 1480, 1760].forEach((f, i) => beep(f, 0.14, 'sine', 0.12, i * 0.065));
    },
    badge() {
      [988, 1319, 1760].forEach((f, i) => beep(f, 0.12, 'triangle', 0.12, i * 0.045));
    },
    click() {
      beep(650, 0.03, 'sine', 0.07, 0);
    },

    /* ─── Creative-specific ─── */
    connection() {
      /* "Aha!" moment — two notes resolving into one */
      beep(880, 0.1, 'sine', 0.12, 0);
      beep(1175, 0.16, 'sine', 0.13, 0.08);
    },
    reveal() {
      /* Reveal the answer */
      sweep(600, 1200, 0.35, 'sine', 0.11);
    },
    hint() {
      beep(1047, 0.09, 'sine', 0.09, 0);
    }
  };
})();