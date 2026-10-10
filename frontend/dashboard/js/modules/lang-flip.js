/* ═══════════════════════════════════════════════════════════
   MODULE — Language FLIP
   Cinematic RTL/LTR transition using the FLIP technique.
   Measures the .main grid's columns before/after direction
   change, then inverts and plays. 480ms total.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function flip(nextLang, applyLang){
  if (nextLang === F.state.lang) return;

  if (prefersReduced()){
    applyLang();
    window.dispatchEvent(new Event('flash:render'));
    return;
  }

  const main = F.$('.main');
  const shell = F.$('.shell');
  const footer = F.$('#foot');
  const hdr = F.$('.hdr');

  // First — capture current bounds
  const targets = [main, footer, hdr].filter(Boolean);
  const first = targets.map(el => el.getBoundingClientRect());

  // Also capture column positions inside main
  const colsBefore = main ? Array.from(main.children).map(el => el.getBoundingClientRect()) : [];
  const cols = main ? Array.from(main.children) : [];

  // Apply language change (this reflows everything)
  applyLang();
  window.dispatchEvent(new Event('flash:render'));

  // Force a sync layout read
  void document.body.offsetHeight;

  // Last — capture new bounds
  const last = targets.map(el => el.getBoundingClientRect());
  const colsAfter = main ? Array.from(main.children).map(el => el.getBoundingClientRect()) : [];

  // Invert — apply transforms to put them back
  targets.forEach((el, i) => {
    const dx = first[i].left - last[i].left;
    const dy = first[i].top - last[i].top;
    if (dx === 0 && dy === 0) return;
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  cols.forEach((el, i) => {
    if (!colsAfter[i]) return;
    const dx = colsBefore[i].left - colsAfter[i].left;
    const dy = colsBefore[i].top - colsAfter[i].top;
    if (dx === 0 && dy === 0) return;
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  // Play — next frame, release transforms with staggered easing
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targets.forEach((el, i) => {
        el.style.transition = 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transitionDelay = (i * 30) + 'ms';
        el.style.transform = '';
      });
      cols.forEach((el, i) => {
        el.style.transition = 'transform 520ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transitionDelay = (i * 60) + 'ms';
        el.style.transform = '';
      });

      // Cleanup
      setTimeout(() => {
        targets.concat(cols).forEach(el => {
          el.style.transition = '';
          el.style.transitionDelay = '';
          el.style.transform = '';
        });
      }, 700);
    });
  });
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.langFlip = { flip };
})();