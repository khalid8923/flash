/* =========================================================
   MODULE - Onboarding
   First-time visitor overlay. Persists dismissal in
   localStorage under flash.onboarded = '1'.
   Public: FLASH_MODULES.onboarding.start(force)
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

const STEPS = {
  en: [
    {
      icon: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
      title: 'Welcome to FLASH',
      body: 'A cognitive training instrument. 42 games across 10 domains, each rooted in a peer-reviewed paradigm.'
    },
    {
      icon: '<path d="M3 12h3l3-9 3 18 3-12 2 3h4"/>',
      title: 'The Season',
      body: 'Every domain has its own lane. Watch your history, see the forecast, and open a domain to play its games.'
    },
    {
      icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      title: 'Press ? for shortcuts',
      body: 'Cmd+K opens the command palette. F toggles focus mode. C compares domains. Everything has a shortcut.'
    }
  ],
  ar: [
    {
      icon: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
      title: 'مرحباً بك في فلاش',
      body: 'أداة تدريب معرفي. 42 لعبة عبر 10 مجالات، كل منها مبني على نموذج علمي محكّم.'
    },
    {
      icon: '<path d="M3 12h3l3-9 3 18 3-12 2 3h4"/>',
      title: 'الموسم',
      body: 'كل مجال له مساره الخاص. راقب تاريخك، شاهد التوقع، وافتح مجالاً للعب ألعابه.'
    },
    {
      icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      title: 'اضغط ؟ للاختصارات',
      body: 'Cmd+K تفتح لوحة الأوامر. F يبدّل وضع التركيز. C يقارن المجالات.'
    }
  ]
};

let overlay = null;
let step = 0;

function seen(){
  try { return localStorage.getItem('flash.onboarded') === '1'; } catch(e){ return false; }
}
function mark(){
  try { localStorage.setItem('flash.onboarded', '1'); } catch(e){}
}

function build(){
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'onb-overlay';
  document.body.appendChild(overlay);
  return overlay;
}

function render(){
  const ar = F.state.lang === 'ar';
  const steps = ar ? STEPS.ar : STEPS.en;
  const s = steps[step];
  const isLast = step === steps.length - 1;

  overlay.innerHTML = `
    <div class="onb-card" role="dialog" aria-modal="true">
      <div class="onb-icon"><svg viewBox="0 0 24 24">${s.icon}</svg></div>
      <h2 class="onb-title">${s.title}</h2>
      <p class="onb-body">${s.body}</p>
      <div class="onb-dots">
        ${steps.map((_, i) => `<span class="onb-dot${i === step ? ' on' : ''}"></span>`).join('')}
      </div>
      <div class="onb-actions">
        <button class="ghost" type="button" data-act="skip">${ar ? 'تخطّي' : 'Skip'}</button>
        <button class="primary" type="button" data-act="next">${isLast ? (ar ? 'ابدأ' : 'Get started') : (ar ? 'التالي' : 'Next')}</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-act="skip"]').addEventListener('click', close);
  overlay.querySelector('[data-act="next"]').addEventListener('click', () => {
    if (isLast){ close(); return; }
    step++;
    render();
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' || e.key === 'ArrowRight'){
      e.preventDefault();
      if (isLast) close(); else { step++; render(); }
    }
  });
}

function start(force){
  if (!force && seen()) return;
  build();
  step = 0;
  render();
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function close(){
  if (!overlay) return;
  overlay.classList.remove('on');
  document.body.style.overflow = '';
  mark();
}

F.onReady(() => {
  setTimeout(() => start(false), 600);
  window.addEventListener('flash:render', () => {
    if (overlay && overlay.classList.contains('on')) render();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.onboarding = { start, close };
})();