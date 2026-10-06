/* ═══════════════════════════════════════════════════════════
   FLASH — River Crossing Sounds
   Web Audio API — pure synthesis (no files)
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

  function beep(freq, dur, type, gainVal, delay) {
    const c = init();
    if (!c || !enabled) return;
    const t = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gainVal || 0.15, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function chirp(freq, dur) {
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
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function hit() {
    beep(880, 0.10, 'sine', 0.14, 0);
    beep(1320, 0.12, 'sine', 0.10, 0.06);
    chirp(1200, 0.05);
  }

  function miss() {
    beep(220, 0.16, 'sawtooth', 0.10, 0);
    beep(180, 0.20, 'sawtooth', 0.08, 0.05);
  }

  function tick() { beep(660, 0.05, 'sine', 0.08, 0); }
  function go()   { beep(990, 0.12, 'sine', 0.14, 0); }

  function levelUp() {
    beep(523, 0.10, 'sine', 0.12, 0);
    beep(659, 0.10, 'sine', 0.12, 0.08);
    beep(784, 0.14, 'sine', 0.14, 0.16);
    beep(1047, 0.20, 'sine', 0.16, 0.26);
    chirp(1400, 0.08);
  }

  function gameOver() {
    beep(440, 0.12, 'triangle', 0.10, 0);
    beep(330, 0.14, 'triangle', 0.10, 0.10);
    beep(220, 0.22, 'triangle', 0.12, 0.22);
  }

  function victory() {
    beep(523, 0.12, 'sine', 0.13, 0);
    beep(659, 0.12, 'sine', 0.13, 0.10);
    beep(784, 0.12, 'sine', 0.13, 0.20);
    beep(1047, 0.25, 'sine', 0.16, 0.30);
    beep(1319, 0.30, 'sine', 0.14, 0.42);
    chirp(1600, 0.10);
  }

  function badge() {
    beep(1319, 0.08, 'sine', 0.10, 0);
    beep(1568, 0.08, 'sine', 0.10, 0.06);
    beep(2093, 0.20, 'sine', 0.12, 0.12);
    chirp(1800, 0.06);
  }

  function click() { beep(440, 0.03, 'square', 0.05, 0); }

  function personalBest() {
    beep(659, 0.08, 'sine', 0.11, 0);
    beep(880, 0.08, 'sine', 0.11, 0.07);
    beep(1175, 0.08, 'sine', 0.11, 0.14);
    beep(1568, 0.22, 'sine', 0.14, 0.21);
    chirp(1900, 0.10);
  }

  function breakChime() {
    beep(523, 0.15, 'sine', 0.10, 0);
    beep(659, 0.15, 'sine', 0.10, 0.12);
    beep(784, 0.20, 'sine', 0.12, 0.24);
  }

  // Game-specific: item picked
  function itemPick() {
    beep(620, 0.05, 'sine', 0.10, 0);
  }

  // Row / sail sound (short water splash)
  function sail() {
    beep(380, 0.08, 'triangle', 0.10, 0);
    beep(520, 0.10, 'triangle', 0.08, 0.04);
    beep(280, 0.12, 'triangle', 0.08, 0.10);
  }

  const correct = hit;
  const wrong   = miss;

  window.RiverCrossingSounds = {
    setEnabled, isEnabled,
    hit, miss, correct, wrong,
    tick, go,
    levelUp, gameOver, victory,
    badge, click, personalBest, breakChime,
    itemPick, sail
  };
})();