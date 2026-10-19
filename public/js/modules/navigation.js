/* ═══════════════════════════════════════════════════════════
   MODULE — Navigation
   • CTA click → circular reveal from button, then navigate
   • Lane click → lane ring + shell fade, then navigate
   • Back from domain → arrival wash on index
   Uses sessionStorage to remember which lane we left from.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Circular reveal from an element, then call cb ─── */
function circularReveal(originEl, cb){
  if (prefersReduced()){ cb(); return; }

  const r = originEl.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top + r.height / 2;
  const maxR = Math.hypot(
    Math.max(ox, window.innerWidth - ox),
    Math.max(oy, window.innerHeight - oy)
  );

  const layer = document.createElement('div');
  layer.className = 'nav-reveal';
  layer.style.clipPath = `circle(0px at ${ox}px ${oy}px)`;
  document.body.appendChild(layer);

  requestAnimationFrame(() => {
    layer.classList.add('on');
    layer.style.clipPath = `circle(${maxR}px at ${ox}px ${oy}px)`;
  });

  setTimeout(cb, 480);
}

/* ─── Lane exit ─── */
function laneExit(lane, domainId, cb){
  // Remember origin for back-nav
  try { sessionStorage.setItem('flash:lastDomain', domainId); } catch(e){}

  if (prefersReduced()){ cb(); return; }

  lane.classList.add('leaving');
  document.body.classList.add('leaving');
  setTimeout(cb, 440);
}

/* ─── Arrival wash on index load ─── */
function arrivalWash(){
  const from = (function(){
    try { return sessionStorage.getItem('flash:returnFrom'); } catch(e){ return null; }
  })();

  if (!from || prefersReduced()) return;

  try { sessionStorage.removeItem('flash:returnFrom'); } catch(e){}

  document.body.classList.add('arriving');
  setTimeout(() => document.body.classList.remove('arriving'), 480);
}

/* ─── Wire all clicks ─── */
function bind(){
  const app = F.$('#app');
  if (!app || app._navBound) return;
  app._navBound = true;

  app.addEventListener('click', function(e){
    // CTA — reveal → session placeholder
    const cta = e.target.closest('.cta');
    if (cta){
      e.preventDefault();
      // XP gain as a small reward before navigating
      if (window.FLASH_MODULES && window.FLASH_MODULES.xpGain){
        window.FLASH_MODULES.xpGain.play(40);
      }
      circularReveal(cta, function(){
        console.log('[FLASH] Start session');
        // Cleanup overlay
        document.querySelectorAll('.nav-reveal').forEach(el => el.remove());
      });
      return;
    }

    // Lane — exit → domain.html
    const lane = e.target.closest('.lane');
    if (lane && lane.dataset.domain){
      e.preventDefault();
      const id = lane.dataset.domain;
      laneExit(lane, id, function(){
        location.href = 'domain.html?d=' + encodeURIComponent(id);
      });
    }
  });
}

F.onReady(() => {
  arrivalWash();
  setTimeout(bind, 240);
  window.addEventListener('flash:render', () => setTimeout(bind, 100));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.nav = { circularReveal, laneExit, arrivalWash };
})();