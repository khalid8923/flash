/* ============================================================
   FLASH — Mental Math · Sounds
   Web Audio API synthesis — no external files
   ============================================================ */
(function () {
  'use strict';

  let ctx = null;
  let enabled = true;
  let masterGain = null;

  function initCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function setEnabled(v) {
    enabled = !!v;
    if (masterGain) masterGain.gain.value = enabled ? 0.7 : 0;
  }

  function isEnabled() { return enabled; }

  function beep(freq, dur, type, gain, delay) {
    if (!enabled) return;
    const c = initCtx();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function chirp(f1, f2, dur, gain) {
    if (!enabled) return;
    const c = initCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* ═══ Public sounds ═══ */
  window.MentalMathSounds = {
    setEnabled, isEnabled,

    /* Correct answer — clear, satisfying */
    hit() {
      beep(880, 0.10, 'sine', 0.14, 0);
      beep(1320, 0.14, 'sine', 0.10, 0.06);
    },

    /* Wrong answer — short, non-punishing */
    miss() {
      beep(220, 0.16, 'triangle', 0.14, 0);
      beep(165, 0.20, 'triangle', 0.10, 0.05);
    },

    /* Timeout */
    timeout() {
      beep(180, 0.22, 'sawtooth', 0.08, 0);
    },

    /* Level up */
    levelUp() {
      chirp(440, 880, 0.28, 0.13);
      beep(1320, 0.16, 'sine', 0.09, 0.10);
    },

    /* Game over */
    gameOver() {
      beep(330, 0.18, 'triangle', 0.12, 0);
      beep(247, 0.20, 'triangle', 0.10, 0.10);
      beep(165, 0.30, 'triangle', 0.08, 0.20);
    },

    /* Victory */
    victory() {
      chirp(523, 1046, 0.42, 0.14);
      beep(1568, 0.20, 'sine', 0.08, 0.18);
    },

    /* Badge unlocked */
    badge() {
      beep(1046, 0.10, 'sine', 0.12, 0);
      beep(1318, 0.10, 'sine', 0.10, 0.08);
      beep(1568, 0.16, 'sine', 0.10, 0.16);
    },

    /* Button click */
    click() {
      beep(660, 0.05, 'sine', 0.08, 0);
    },

    /* Personal best */
    personalBest() {
      chirp(660, 1760, 0.35, 0.13);
    },

    /* Generic tick (timer) */
    tick() {
      beep(1200, 0.03, 'sine', 0.05, 0);
    },

    /* Number entry — for on-screen keypad */
    num() {
      beep(980, 0.04, 'sine', 0.07, 0);
    }
  };

})();