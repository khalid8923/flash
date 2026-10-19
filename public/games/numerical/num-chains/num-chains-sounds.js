/* ============================================================
   FLASH — Num Chains · Sounds (Web Audio synthesis)
   ============================================================ */
(function () {
  'use strict';

  let ctx = null, enabled = true, master = null;

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    return ctx;
  }

  function setEnabled(v) { enabled = !!v; if (master) master.gain.value = enabled ? 0.7 : 0; }
  function isEnabled() { return enabled; }

  function beep(freq, dur, type, gain, delay) {
    if (!enabled) return;
    const c = init(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function chirp(f1, f2, dur, gain) {
    if (!enabled) return;
    const c = init(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  window.NumChainsSounds = {
    setEnabled, isEnabled,
    hit()  { beep(880, 0.10, 'sine', 0.13, 0); beep(1175, 0.12, 'sine', 0.10, 0.05); },
    miss() { beep(240, 0.15, 'triangle', 0.13, 0); beep(180, 0.18, 'triangle', 0.10, 0.05); },
    chainStep() { beep(1046, 0.05, 'sine', 0.09, 0); },
    timeout() { beep(200, 0.22, 'sawtooth', 0.09, 0); },
    levelUp() { chirp(440, 880, 0.28, 0.13); beep(1320, 0.15, 'sine', 0.09, 0.10); },
    gameOver() { beep(330, 0.18, 'triangle', 0.12, 0); beep(247, 0.20, 'triangle', 0.10, 0.10); beep(165, 0.30, 'triangle', 0.08, 0.20); },
    victory() { chirp(523, 1046, 0.42, 0.14); beep(1568, 0.20, 'sine', 0.08, 0.18); },
    badge() { beep(1046, 0.10, 'sine', 0.12, 0); beep(1318, 0.10, 'sine', 0.10, 0.08); beep(1568, 0.16, 'sine', 0.10, 0.16); },
    click() { beep(660, 0.05, 'sine', 0.08, 0); },
    personalBest() { chirp(660, 1760, 0.35, 0.13); },
    tick() { beep(1200, 0.03, 'sine', 0.05, 0); },
    num() { beep(980, 0.04, 'sine', 0.07, 0); }
  };
})();