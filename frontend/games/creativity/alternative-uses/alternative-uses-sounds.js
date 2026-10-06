/* ═══════════════════════════════════════════════════════════
   FLASH — Alternative Uses Sounds
   Pure Web Audio API + FLASH signature chirp
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
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* ═══ Creative/warm sounds — gold-themed ═══ */
  function hit() {
    beep(880, 0.10, 'sine', 0.12, 0);
    beep(1320, 0.12, 'sine', 0.08, 0.06);
    chirp(1400, 0.06);
  }
  function miss() {
    beep(330, 0.14, 'triangle', 0.10, 0);
    beep(260, 0.18, 'triangle', 0.08, 0.06);
    chirp(400, 0.08);
  }
  function tick() { beep(660, 0.05, 'sine', 0.08, 0); }
  function go() { beep(990, 0.12, 'sine', 0.14, 0); }
  function levelUp() {
    beep(587, 0.09, 'sine', 0.11, 0);
    beep(740, 0.09, 'sine', 0.11, 0.08);
    beep(880, 0.12, 'sine', 0.13, 0.16);
    beep(1175, 0.18, 'sine', 0.14, 0.24);
    chirp(1500, 0.15);
  }
  function gameOver() {
    beep(440, 0.10, 'triangle', 0.10, 0);
    beep(330, 0.12, 'triangle', 0.10, 0.09);
    beep(220, 0.20, 'triangle', 0.12, 0.20);
  }
  function victory() {
    beep(587, 0.10, 'sine', 0.12, 0);
    beep(740, 0.10, 'sine', 0.12, 0.09);
    beep(880, 0.10, 'sine', 0.12, 0.18);
    beep(1175, 0.22, 'sine', 0.15, 0.27);
    chirp(1800, 0.20);
  }
  function badge() {
    beep(1319, 0.07, 'sine', 0.10, 0);
    beep(1568, 0.07, 'sine', 0.10, 0.05);
    beep(2093, 0.18, 'sine', 0.11, 0.11);
  }
  function click() { beep(440, 0.025, 'square', 0.04, 0); }
  function personalBest() {
    beep(659, 0.07, 'sine', 0.10, 0);
    beep(880, 0.07, 'sine', 0.10, 0.06);
    beep(1175, 0.07, 'sine', 0.10, 0.12);
    beep(1568, 0.20, 'sine', 0.13, 0.18);
  }
  function breakChime() {
    beep(784, 0.15, 'sine', 0.10, 0);
    beep(988, 0.20, 'sine', 0.10, 0.12);
  }

  window.AlternativeUsesSounds = {
    setEnabled, isEnabled,
    hit, miss, tick, go, levelUp, gameOver,
    victory, badge, click, personalBest, breakChime
  };
})();