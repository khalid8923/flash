/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Sounds
   Pure Web Audio API
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

  function beep(freq, dur, type, gain, delay) {
    const c = init();
    if (!c || !enabled) return;
    const t = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.15, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* ═══ Effects ═══ */

  // Correct GO — bright blip
  function hit() {
    beep(880, 0.08, 'sine', 0.12, 0);
  }

  // Correct rejection — soft tick
  function correctReject() {
    beep(440, 0.04, 'sine', 0.05, 0);
  }

  // Missed GO (omission) — low soft tone
  function miss() {
    beep(330, 0.10, 'triangle', 0.08, 0);
  }

  // Commission error (clicked on No-Go) — buzz
  function commission() {
    beep(180, 0.18, 'sawtooth', 0.10, 0);
    beep(140, 0.22, 'sawtooth', 0.08, 0.05);
  }

  // Countdown tick
  function tick() {
    beep(660, 0.05, 'sine', 0.08, 0);
  }

  // GO
  function go() {
    beep(990, 0.12, 'sine', 0.14, 0);
  }

  // Level up
  function levelUp() {
    beep(523, 0.08, 'sine', 0.11, 0);
    beep(659, 0.08, 'sine', 0.11, 0.07);
    beep(784, 0.12, 'sine', 0.13, 0.14);
    beep(1047, 0.18, 'sine', 0.14, 0.22);
  }

  // Game over
  function gameOver() {
    beep(440, 0.10, 'triangle', 0.10, 0);
    beep(330, 0.12, 'triangle', 0.10, 0.09);
    beep(220, 0.20, 'triangle', 0.12, 0.20);
  }

  // Victory
  function victory() {
    beep(523, 0.10, 'sine', 0.12, 0);
    beep(659, 0.10, 'sine', 0.12, 0.09);
    beep(784, 0.10, 'sine', 0.12, 0.18);
    beep(1047, 0.22, 'sine', 0.15, 0.27);
  }

  // Badge
  function badge() {
    beep(1319, 0.07, 'sine', 0.10, 0);
    beep(1568, 0.07, 'sine', 0.10, 0.05);
    beep(2093, 0.18, 'sine', 0.11, 0.11);
  }

  // Click
  function click() {
    beep(440, 0.025, 'square', 0.04, 0);
  }

  // Personal Best
  function personalBest() {
    beep(659, 0.07, 'sine', 0.10, 0);
    beep(880, 0.07, 'sine', 0.10, 0.06);
    beep(1175, 0.07, 'sine', 0.10, 0.12);
    beep(1568, 0.20, 'sine', 0.13, 0.18);
  }

  // Recovery / break chime
  function breakChime() {
    beep(784, 0.15, 'sine', 0.10, 0);
    beep(988, 0.20, 'sine', 0.10, 0.12);
  }

  /* ═══ FLASH Signature Layer — unique chirp on top of standard tones ═══ */
  // Small frequency sweep added for a "premium" feel. Optional, toggleable.
  function chirpStart(freq, dur) {
    const c = init();
    if (!c || !enabled) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Wrapped versions with signature chirp
  function hitSignature()     { hit();     chirpStart(1200, 0.05); }
  function missSignature()    { miss();    chirpStart(400, 0.08); }
  function commissionSig()    { commission(); chirpStart(300, 0.10); }
  function levelUpSignature() { levelUp(); chirpStart(1500, 0.15); }
  function victorySig()       { victory(); chirpStart(1800, 0.20); }

  window.GNGSounds = {
    setEnabled, isEnabled,
    hit, correctReject, miss, commission,
    tick, go, levelUp, gameOver, victory,
    badge, click, personalBest, breakChime,
    // FLASH signature variants
    hitSignature, missSignature, commissionSig,
    levelUpSignature, victorySig
  };
})();