/* ═══════════════════════════════════════════════════════════
   MODULE — Mobile Bottom Navigation
   Three tabs: Today · Season · Log
   Scrolls to the corresponding section. Tracks via
   IntersectionObserver so the active tab reflects what's
   actually on screen.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const TABS = [
  { id: 'today',  label_en:'Today',  label_ar:'اليوم',  target: '#pn-today',
    icon: '<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>' },
  { id: 'season', label_en:'Season', label_ar:'الموسم', target: '#pn-season',
    icon: '<path d="M3 12h3l3-9 3 18 3-12 2 3h4"/>' },
  { id: 'log',    label_en:'Log',    label_ar:'السجل',  target: '#pn-recent',
    icon: '<path d="M4 6h16M4 12h16M4 18h10"/>' }
];

let nav = null;
let observer = null;

function build(){
  if (nav) return nav;
  nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Sections');
  nav.innerHTML = TABS.map((t, i) => `
    <button class="bnav-btn" type="button" data-target="${t.target}" aria-current="${i === 0 ? 'true' : 'false'}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>
      <span>${F.state.lang === 'ar' ? t.label_ar : t.label_en}</span>
    </button>
  `).join('');
  document.body.appendChild(nav);

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.bnav-btn');
    if (!btn) return;
    const target = document.querySelector(btn.dataset.target);
    if (!target) return;

    // Smooth scroll
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(btn.dataset.target);
  });

  return nav;
}

function setActive(targetSel){
  if (!nav) return;
  nav.querySelectorAll('.bnav-btn').forEach(b => {
    b.setAttribute('aria-current', b.dataset.target === targetSel ? 'true' : 'false');
  });
}

/* ─── Track which section is in view ─── */
function observe(){
  if (observer) observer.disconnect();
  if (!('IntersectionObserver' in window)) return;

  const sections = TABS.map(t => document.querySelector(t.target)).filter(Boolean);
  if (!sections.length) return;

  observer = new IntersectionObserver((entries) => {
    // Pick the one with largest intersection ratio
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length){
      const el = visible[0].target;
      setActive('#' + el.id);
    }
  }, {
    root: null,
    rootMargin: '-30% 0px -40% 0px',
    threshold: [0.2, 0.5, 0.8]
  });

  sections.forEach(s => observer.observe(s));
}

/* Rebuild labels on language change */
function refreshLabels(){
  if (!nav) return;
  nav.querySelectorAll('.bnav-btn').forEach((btn, i) => {
    const t = TABS[i];
    btn.querySelector('span').textContent = F.state.lang === 'ar' ? t.label_ar : t.label_en;
  });
}

F.onReady(() => {
  setTimeout(() => {
    build();
    observe();
  }, 300);

  window.addEventListener('flash:render', () => {
    setTimeout(() => {
      refreshLabels();
      observe();
    }, 100);
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.mobileNav = { build, setActive, refreshLabels };
})();