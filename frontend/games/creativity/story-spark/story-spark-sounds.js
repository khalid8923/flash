/* ═══════════════════════════════════════════════════════════
   FLASH — Story Spark Sounds
   Pure Web Audio API + FLASH signature chirp
   Narrative/soft-themed
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

  /* ═══ Story sounds — soft/warm/harmonic ═══ */
  function hit() {
    // Warm 3-note chime
    beep(659, 0.12, 'sine', 0.10, 0);
    beep(880, 0.14, 'sine', 0.09, 0.08);
    beep(1175, 0.18, 'sine', 0.11, 0.16);
    chirp(1400, 0.10);
  }
  function miss() {
    beep(330, 0.14, 'triangle', 0.09, 0);
    beep(247, 0.18, 'triangle', 0.08, 0.08);
    chirp(350, 0.08);
  }
  function tick() { beep(660, 0.05, 'sine', 0.08, 0); }
  function go() { beep(880, 0.14, 'sine', 0.14, 0); }
  function levelUp() {
    beep(523, 0.10, 'sine', 0.10, 0);
    beep(659, 0.10, 'sine', 0.10, 0.09);
    beep(880, 0.12, 'sine', 0.12, 0.18);
    beep(1047, 0.20, 'sine', 0.13, 0.27);
    chirp(1500, 0.16);
  }
  function gameOver() {
    beep(440, 0.12, 'triangle', 0.10, 0);
    beep(330, 0.14, 'triangle', 0.10, 0.10);
    beep(220, 0.22, 'triangle', 0.11, 0.22);
  }
  function victory() {
    beep(523, 0.10, 'sine', 0.11, 0);
    beep(659, 0.10, 'sine', 0.11, 0.09);
    beep(784, 0.10, 'sine', 0.11, 0.18);
    beep(1047, 0.22, 'sine', 0.14, 0.27);
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
  function sparkSound() {
    // Narrative "spark" moment
    beep(1047, 0.06, 'sine', 0.09, 0);
    beep(1319, 0.06, 'sine', 0.09, 0.05);
    beep(1568, 0.10, 'sine', 0.11, 0.10);
    chirp(2000, 0.12);
  }

  window.StorySparkSounds = {
    setEnabled, isEnabled,
    hit, miss, tick, go, levelUp, gameOver,
    victory, badge, click, personalBest, breakChime, sparkSound
  };
})();