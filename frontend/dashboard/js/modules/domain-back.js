/* ═══════════════════════════════════════════════════════════
   MODULE — Domain Back Navigation
   When the user clicks Back, tag the return so index.html
   plays its arrival wash. Also: fade the domain page out.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function patchBack(){
  const back = document.querySelector('.back');
  if (!back || back._bnd) return;
  back._bnd = true;

  back.addEventListener('click', function(e){
    e.preventDefault();
    try { sessionStorage.setItem('flash:returnFrom', 'domain'); } catch(_){}

    if (prefersReduced()){
      location.href = back.getAttribute('href') || 'index.html';
      return;
    }

    document.body.style.transition = 'opacity 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 320ms cubic-bezier(0.4, 0, 0.2, 1)';
    document.body.style.opacity = '0';
    document.body.style.transform = 'scale(0.985)';
    setTimeout(() => {
      location.href = back.getAttribute('href') || 'index.html';
    }, 300);
  });
}

/* Page entrance — small wash on arrival */
function arrivalWash(){
  if (prefersReduced()) return;
  document.body.style.opacity = '0';
  document.body.style.transform = 'scale(0.99)';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 360ms cubic-bezier(0.16, 1, 0.3, 1), transform 360ms cubic-bezier(0.16, 1, 0.3, 1)';
    document.body.style.opacity = '1';
    document.body.style.transform = '';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 400);
  });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init(){
  arrivalWash();
  patchBack();
}
})();