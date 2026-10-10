/* ═══════════════════════════════════════════════════════════
   MODULE — Ambient Motion (master metronome)
   Adds animated layers to:
     • Each lane's sparkline  (light packet)
     • Each forecast path     (marching dashes)
     • The XP bar             (specular sweep, only near level-up)
   All animations are pure CSS, synchronized to an 8-second
   master cycle via animation-delay offsets.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const SVG_NS = 'http://www.w3.org/2000/svg';

/* Master cycle length — must match CSS */
const CYCLE = 8000;
const LANE_STAGGER = 400;      // ms between lanes
const XP_THRESHOLD = 0.90;     // show sweep only within 10% of next level

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── 1. Sparkline Light Packets ─── */
function attachPackets(){
  if (prefersReduced()) return;
  const plots = document.querySelectorAll('.lane-plot svg');
  plots.forEach((svg, i) => {
    // Prevent duplicates on re-render
    if (svg.querySelector('.l-packet')) return;

    const hist = svg.querySelector('.l-hist');
    if (!hist) return;

    const d = hist.getAttribute('d');
    if (!d) return;

    const packet = document.createElementNS(SVG_NS, 'path');
    packet.setAttribute('class', 'l-packet');
    packet.setAttribute('d', d);
    packet.setAttribute('pathLength', '100');
    if (hist.getAttribute('transform'))
      packet.setAttribute('transform', hist.getAttribute('transform'));

    // Stagger so packets travel as a slow wave down the Season
    packet.style.animationDelay = (i * LANE_STAGGER) + 'ms';

    svg.appendChild(packet);
  });
}

/* ─── 2. Marching Forecast ─── */
function attachMarching(){
  if (prefersReduced()) return;
  document.querySelectorAll('.l-fore').forEach(p => {
    p.classList.add('marching');
  });
}

/* ─── 3. XP Specular Sweep ─── */
function attachXpSweep(){
  if (prefersReduced()) return;

  const svg = document.querySelector('.stat-xp svg');
  if (!svg) return;
  if (svg.querySelector('.xp-shine-wrap')) return;

  const u = F.M.user;
  const ratio = u.xp / u.xpNext;
  if (ratio < XP_THRESHOLD) return;  // Only near level-up

  const wrap = document.createElementNS(SVG_NS, 'g');
  wrap.setAttribute('class', 'xp-shine-wrap');

  const shine = document.createElementNS(SVG_NS, 'rect');
  shine.setAttribute('class', 'xp-shine');
  shine.setAttribute('x', '-20');
  shine.setAttribute('y', '0');
  shine.setAttribute('width', '20');
  shine.setAttribute('height', '6');
  shine.setAttribute('rx', '1');

  wrap.appendChild(shine);
  svg.appendChild(wrap);
}

/* ─── Apply all (idempotent) ─── */
function applyAll(){
  attachPackets();
  attachMarching();
  attachXpSweep();
}

/* ─── Init ─── */
F.onReady(() => {
  // Wait one tick for render.js to paint
  setTimeout(applyAll, 120);

  // Re-apply on every render (theme/lang change → DOM rebuilt)
  window.addEventListener('flash:render', () => {
    setTimeout(applyAll, 60);
  });
});

/* Public API (for debugging) */
window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.ambient = {
  apply: applyAll,
  kill(){ document.documentElement.dataset.ambient = 'off'; },
  revive(){ delete document.documentElement.dataset.ambient; }
};
})();