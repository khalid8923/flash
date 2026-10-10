/* ═══════════════════════════════════════════════════════════
   MODULE — Streak Ring
   Draws a visible "day clock" around the streak counter.
   Progress = elapsed fraction of today (00:00 → 24:00).
   Updates every 60 seconds, with a 1s linear transition.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const SVG_NS = 'http://www.w3.org/2000/svg';

function fractionOfDay(){
  const now = new Date();
  const secs = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
  return secs / 86400; // 0..1
}

function buildRing(){
  const wrap = document.querySelector('.streak-wrap');
  if (!wrap) return;
  if (wrap.querySelector('.streak-ring-wrap')) return; // already built

  const streakNum = wrap.querySelector('b');
  if (!streakNum) return;

  const ring = document.createElement('span');
  ring.className = 'streak-ring-wrap';
  ring.innerHTML = `
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <circle class="streak-ring-track" cx="22" cy="22" r="19" pathLength="100"/>
      <circle class="streak-ring-fill"  cx="22" cy="22" r="19" pathLength="100"/>
    </svg>
    <span class="streak-ring-num"></span>
  `;

  // Move the original <b> number content into the ring
  ring.querySelector('.streak-ring-num').textContent = streakNum.textContent.trim();

  // Replace the <b> with our ring
  streakNum.replaceWith(ring);
}

function tick(){
  const fill = document.querySelector('.streak-ring-fill');
  if (!fill) return;
  const p = fractionOfDay();               // 0..1
  const offset = (1 - p) * 100;            // 100 → 0
  fill.style.strokeDashoffset = offset.toFixed(2);
}

F.onReady(() => {
  setTimeout(() => {
    buildRing();
    tick();
  }, 150);

  // Update every 60 seconds
  setInterval(tick, 60_000);

  // Rebuild on every re-render
  window.addEventListener('flash:render', () => {
    setTimeout(() => { buildRing(); tick(); }, 80);
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.streakRing = { build: buildRing, tick };
})();