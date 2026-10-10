/* ═══════════════════════════════════════════════════════════
   MODULE — Theme Transition
   Circular reveal originating from the theme toggle button.
   Falls back to instant swap under reduced-motion.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

/* Detect reduced-motion */
function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Get the background color of the CURRENT theme */
function currentBgColor(){
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--bg').trim();
}

/* Compute farthest-corner distance from origin (x,y) */
function maxRadius(x, y){
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.hypot(
    Math.max(x, w - x),
    Math.max(y, h - y)
  );
}

/**
 * Apply a new theme with a circular reveal.
 * @param {'light'|'dark'} nextTheme
 * @param {HTMLElement} originEl  Element the circle grows/shrinks from
 * @param {Function} [applyFn]   Callback that actually sets the theme
 */
function transition(nextTheme, originEl, applyFn){
  const root = document.documentElement;
  const current = root.dataset.theme;
  if (current === nextTheme) return;

  // Reduced motion → instant
  if (prefersReducedMotion()){
    applyFn && applyFn();
    return;
  }

  // Origin point (defaults to top-right if no element)
  let ox = window.innerWidth / 2;
  let oy = 0;
  if (originEl && originEl.getBoundingClientRect){
    const r = originEl.getBoundingClientRect();
    ox = r.left + r.width / 2;
    oy = r.top + r.height / 2;
  }

  const oldBg = currentBgColor();
  const r = maxRadius(ox, oy);

  // Create overlay with the OLD theme's bg color
  const overlay = document.createElement('div');
  overlay.className = 'theme-overlay';
  overlay.style.background = oldBg;
  overlay.style.clipPath = `circle(${r}px at ${ox}px ${oy}px)`;
  document.body.appendChild(overlay);

  // Suppress transitions on body children during reveal
  document.body.classList.add('theme-transitioning');

  // Apply the new theme immediately (underneath the overlay)
  applyFn && applyFn();

  // Animate the circle shrinking to 0 → new theme reveals
  requestAnimationFrame(() => {
    overlay.style.transition = 'clip-path 620ms cubic-bezier(0.76, 0, 0.24, 1)';
    overlay.style.clipPath = `circle(0px at ${ox}px ${oy}px)`;
  });

  // Cleanup
  const done = () => {
    overlay.remove();
    document.body.classList.remove('theme-transitioning');
  };
  overlay.addEventListener('transitionend', done, { once:true });
  setTimeout(done, 720); // safety net
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.themeTransition = { transition };
})();