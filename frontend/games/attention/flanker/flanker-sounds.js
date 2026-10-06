/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Sound Effects
   Pure Web Audio API — no external files
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let ctx = null;
  let enabled = true;

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return enabled; }

  function beep(freq, duration, type, gainVal, delay) {
    const c = init();
    if (!c || !enabled) return;
    const t = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal || 0.15, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /* ─── Sound Effects ─── */

  // Correct answer — bright two-note blip
  function correct() {
    beep(880, 0.10, 'sine', 0.14, 0);
    beep(1320, 0.12, 'sine', 0.10, 0.06);
  }

  // Wrong answer — low buzz
  function wrong() {
    beep(220, 0.16, 'sawtooth', 0.10, 0);
    beep(180, 0.20, 'sawtooth', 0.08, 0.05);
  }

  // Countdown tick
  function tick() {
    beep(660, 0.05, 'sine', 0.08, 0);
  }

  // Countdown GO
  function go() {
    beep(990, 0.12, 'sine', 0.14, 0);
  }

  // Level up — rising arpeggio
  function levelUp() {
    beep(523, 0.10, 'sine', 0.12, 0);
    beep(659, 0.10, 'sine', 0.12, 0.08);
    beep(784, 0.14, 'sine', 0.14, 0.16);
    beep(1047, 0.20, 'sine', 0.16, 0.26);
  }

  // Game over — descending
  function gameOver() {
    beep(440, 0.12, 'triangle', 0.10, 0);
    beep(330, 0.14, 'triangle', 0.10, 0.10);
    beep(220, 0.22, 'triangle', 0.12, 0.22);
  }

  // Victory — longer fanfare
  function victory() {
    beep(523, 0.12, 'sine', 0.13, 0);
    beep(659, 0.12, 'sine', 0.13, 0.10);
    beep(784, 0.12, 'sine', 0.13, 0.20);
    beep(1047, 0.25, 'sine', 0.16, 0.30);
    beep(1319, 0.30, 'sine', 0.14, 0.42);
  }

  // Badge unlocked — sparkle
  function badge() {
    beep(1319, 0.08, 'sine', 0.10, 0);
    beep(1568, 0.08, 'sine', 0.10, 0.06);
    beep(2093, 0.20, 'sine', 0.12, 0.12);
  }

  // Button click
  function click() {
    beep(440, 0.03, 'square', 0.05, 0);
  }

  // Personal best
  function personalBest() {
    beep(659, 0.08, 'sine', 0.11, 0);
    beep(880, 0.08, 'sine', 0.11, 0.07);
    beep(1175, 0.08, 'sine', 0.11, 0.14);
    beep(1568, 0.22, 'sine', 0.14, 0.21);
  }

  window.FlankerSounds = {
    setEnabled,
    isEnabled,
    correct,
    wrong,
    tick,
    go,
    levelUp,
    gameOver,
    victory,
    badge,
    click,
    personalBest
  };
})();