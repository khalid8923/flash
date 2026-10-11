/* flash-cards-sounds.js — Web Audio synthesis. */
(function () {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, muted = false;
  const ac = () => { if (!AC) return null; if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(f, d, type, g, delay) {
    const x = ac(); if (!x || muted) return;
    const o = x.createOscillator(), v = x.createGain(), t = x.currentTime + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g || .1, t + .01); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(v); v.connect(x.destination); o.start(t); o.stop(t + d + .03);
  }
  window.FlashCardsSounds = {
    unlock: ac, mute: m => { muted = !!m; },
    tile: () => tone(523, .04, 'sine', .05),
    hit: () => tone(880, .09, 'sine', .1),
    miss: () => tone(196, .18, 'sawtooth', .08),
    level: () => [523, 659, 784].forEach((f, i) => tone(f, .1, 'sine', .08, i * .07)),
    gameOver: () => [392, 330, 262].forEach((f, i) => tone(f, .16, 'triangle', .08, i * .12)),
    victory: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'sine', .09, i * .1)),
    badge: () => [784, 988, 1319].forEach((f, i) => tone(f, .11, 'sine', .07, i * .06)),
    click: () => tone(330, .03, 'sine', .03),
    personalBest: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .12, 'sine', .08, i * .09))
  };
})();