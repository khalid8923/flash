/* =========================================================
   MODULE - Keyboard Cheat Sheet
   Overlay showing all shortcuts. Open with "?" or "/" (or
   Cmd+/). Close with ESC.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

let overlay = null;

const SHORTCUTS = {
  en: [
    { section: 'Navigation', items: [
      { keys: ['⌘','K'], desc: 'Open command palette' },
      { keys: ['/'],     desc: 'Quick search' },
      { keys: ['Esc'],   desc: 'Close anything' },
      { keys: ['↑','↓'], desc: 'Navigate lists' },
      { keys: ['↵'],     desc: 'Run / open' }
    ]},
    { section: 'Views', items: [
      { keys: ['F'],       desc: 'Toggle focus mode' },
      { keys: ['C'],       desc: 'Compare domains' },
      { keys: ['Space'],   desc: 'Quick-look a lane' }
    ]},
    { section: 'Actions', items: [
      { keys: ['⌘','⇧','L'], desc: 'Toggle theme' },
      { keys: ['⌘','⇧','K'], desc: 'Toggle language' },
      { keys: ['⌘','⇧','F'], desc: 'Focus mode' }
    ]},
    { section: 'Help', items: [
      { keys: ['?'], desc: 'This cheat sheet' }
    ]}
  ],
  ar: [
    { section: 'التنقل', items: [
      { keys: ['⌘','K'], desc: 'افتح لوحة الأوامر' },
      { keys: ['/'],     desc: 'بحث سريع' },
      { keys: ['Esc'],   desc: 'إغلاق كل شيء' },
      { keys: ['↑','↓'], desc: 'التنقل في القوائم' },
      { keys: ['↵'],     desc: 'تشغيل / فتح' }
    ]},
    { section: 'العروض', items: [
      { keys: ['F'],     desc: 'وضع التركيز' },
      { keys: ['C'],     desc: 'مقارنة المجالات' },
      { keys: ['Space'], desc: 'نظرة سريعة على مسار' }
    ]},
    { section: 'الإجراءات', items: [
      { keys: ['⌘','⇧','L'], desc: 'تبديل السمة' },
      { keys: ['⌘','⇧','K'], desc: 'تبديل اللغة' },
      { keys: ['⌘','⇧','F'], desc: 'وضع التركيز' }
    ]},
    { section: 'المساعدة', items: [
      { keys: ['?'], desc: 'هذه القائمة' }
    ]}
  ]
};

function build(){
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.className = 'cheat-overlay';
  overlay.innerHTML = `
    <div class="cheat-box" role="dialog" aria-modal="true">
      <div class="cheat-hdr">
        <h2 id="cheat-title"></h2>
        <button class="cheat-close" type="button" aria-label="Close">x</button>
      </div>
      <div class="cheat-grid" id="cheat-grid"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.cheat-close').addEventListener('click', close);

  return overlay;
}

function render(){
  const ar = F.state.lang === 'ar';
  const title = overlay.querySelector('#cheat-title');
  const grid = overlay.querySelector('#cheat-grid');

  title.textContent = ar ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts';

  const data = ar ? SHORTCUTS.ar : SHORTCUTS.en;

  grid.innerHTML = data.map(sec => `
    <div class="cheat-section">
      <h3>${sec.section}</h3>
      ${sec.items.map(row => `
        <div class="cheat-row">
          <span>${row.desc}</span>
          <span class="cheat-keys">
            ${row.keys.map((k, i) =>
              (i ? '<span class="plus">+</span>' : '') + '<kbd>' + k + '</kbd>'
            ).join('')}
          </span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function open(){
  build();
  render();
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function close(){
  if (!overlay) return;
  overlay.classList.remove('on');
  document.body.style.overflow = '';
}

/* ─── Keyboard ─── */
function globalKey(e){
  // Ignore if typing
  const tag = (document.activeElement.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  // "?" or "/" without modifiers
  if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !e.metaKey && !e.ctrlKey && !e.altKey){
    e.preventDefault();
    if (overlay && overlay.classList.contains('on')) close();
    else open();
    return;
  }

  // Cmd/Ctrl + /
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
  const cmd = isMac ? e.metaKey : e.ctrlKey;
  if (cmd && e.key === '/'){
    e.preventDefault();
    if (overlay && overlay.classList.contains('on')) close();
    else open();
    return;
  }

  // ESC closes
  if (e.key === 'Escape' && overlay && overlay.classList.contains('on')){
    e.preventDefault();
    close();
  }
}

F.onReady(() => {
  document.addEventListener('keydown', globalKey);
  window.addEventListener('flash:render', () => {
    if (overlay && overlay.classList.contains('on')) render();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.cheatSheet = { open, close };
})();