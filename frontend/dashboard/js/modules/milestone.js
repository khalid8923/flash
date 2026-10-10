/* =========================================================
   MODULE - XP Milestone Celebration
   Called when the user levels up. Radial ring burst from
   screen center. No confetti, no particles.
   API: FLASH_MODULES.milestone.celebrate()
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function celebrate(){
  const ar = F.state.lang === 'ar';
  const label = ar ? 'ارتقاء مستوى!' : 'LEVEL UP';

  const wrap = document.createElement('div');
  wrap.className = 'milestone-burst';

  if (!prefersReduced()){
    ['r1','r2','r3'].forEach(cls => {
      const ring = document.createElement('div');
      ring.className = 'milestone-ring ' + cls;
      wrap.appendChild(ring);
    });
  }

  const tag = document.createElement('div');
  tag.className = 'milestone-label';
  tag.textContent = label;
  wrap.appendChild(tag);

  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2400);
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.milestone = { celebrate };
})();