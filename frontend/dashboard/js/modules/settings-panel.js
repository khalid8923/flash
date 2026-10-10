/* =========================================================
   MODULE - Settings Panel
   Right drawer with:
     - Theme (light/dark/system)
     - Language (EN/AR)
     - Accent color (pink/neon/violet/blue/teal)
     - Reduced motion toggle
     - Sound toggle
     - Reset progress
   Persisted to localStorage via core.js setters.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;
const LS = {
  get(k, d){ try { const v = localStorage.getItem('flash.' + k); return v === null ? d : v; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('flash.' + k, v); } catch(e){} }
};

let panel = null;
let btn = null;

const ACCENTS = [
  { id: 'pink',  light: '#EC4899', dark: '#39FF14' },
  { id: 'violet',light: '#8B5CF6', dark: '#A78BFA' },
  { id: 'blue',  light: '#3B82F6', dark: '#60A5FA' },
  { id: 'teal',  light: '#14B8A6', dark: '#2DD4BF' },
  { id: 'amber', light: '#F59E0B', dark: '#FBBF24' }
];

function currentAccent(){
  return LS.get('accent', 'pink');
}

function applyAccent(id){
  const a = ACCENTS.find(x => x.id === id) || ACCENTS[0];
  const theme = document.documentElement.dataset.theme;
  const color = theme === 'dark' ? a.dark : a.light;
  document.documentElement.style.setProperty('--ac', color);
  LS.set('accent', id);
}

function injectButton(){
  if (btn) return;
  const tools = document.querySelector('.tools');
  if (!tools) return;

  btn = document.createElement('button');
  btn.id = 'settings-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Settings');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  `;
  btn.addEventListener('click', () => panel && panel.classList.contains('open') ? close() : open());

  // Insert before theme toggle
  const th = document.getElementById('th');
  if (th && th.parentNode === tools) tools.insertBefore(btn, th);
  else tools.appendChild(btn);
}

function build(){
  if (panel) return panel;
  panel = document.createElement('aside');
  panel.className = 'settings-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  document.body.appendChild(panel);

  // Click backdrop closes
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    if (e.target === panel) return;
    if (panel.contains(e.target)) return;
    if (btn && btn.contains(e.target)) return;
    close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    if (cmd && e.key === ','){
      e.preventDefault();
      panel.classList.contains('open') ? close() : open();
    }
  });

  return panel;
}

function render(){
  if (!panel) return;
  const ar = F.state.lang === 'ar';
  const theme = F.state.theme;
  const lang = F.state.lang;
  const accent = currentAccent();
  const reduced = document.documentElement.hasAttribute('data-reduced-motion');
  const soundOn = LS.get('sound', '1') === '1';

  panel.innerHTML = `
    <div class="settings-hdr">
      <h2>${ar ? 'الإعدادات' : 'Settings'}</h2>
      <button class="settings-close" type="button" aria-label="Close">x</button>
    </div>
    <div class="settings-body">

      <div class="settings-group">
        <h3>${ar ? 'المظهر' : 'Appearance'}</h3>

        <div class="settings-row">
          <span>${ar ? 'السمة' : 'Theme'}</span>
          <div class="seg-ctrl" data-key="theme">
            <button type="button" data-val="light" aria-pressed="${theme === 'light'}">${ar ? 'فاتح' : 'Light'}</button>
            <button type="button" data-val="dark" aria-pressed="${theme === 'dark'}">${ar ? 'داكن' : 'Dark'}</button>
          </div>
        </div>

        <div class="settings-row">
          <span>${ar ? 'اللغة' : 'Language'}</span>
          <div class="seg-ctrl" data-key="lang">
            <button type="button" data-val="en" aria-pressed="${lang === 'en'}">EN</button>
            <button type="button" data-val="ar" aria-pressed="${lang === 'ar'}">AR</button>
          </div>
        </div>

        <div class="settings-row" style="align-items:flex-start; flex-direction:column; gap:10px;">
          <span>${ar ? 'اللون المميز' : 'Accent color'}</span>
          <div class="accent-grid">
            ${ACCENTS.map(a => `
              <button class="accent-swatch" type="button"
                      data-accent="${a.id}"
                      aria-pressed="${accent === a.id}"
                      style="background:${theme === 'dark' ? a.dark : a.light}"
                      title="${a.id}"></button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h3>${ar ? 'تجربة الاستخدام' : 'Experience'}</h3>

        <div class="settings-row">
          <span>${ar ? 'تقليل الحركة' : 'Reduced motion'}</span>
          <span class="switch" role="switch" aria-checked="${reduced}" tabindex="0" data-toggle="reduced-motion"></span>
        </div>

        <div class="settings-row">
          <span>${ar ? 'الأصوات' : 'Sound effects'}</span>
          <span class="switch" role="switch" aria-checked="${soundOn}" tabindex="0" data-toggle="sound"></span>
        </div>
      </div>

      <div class="settings-group">
        <h3>${ar ? 'البيانات' : 'Data'}</h3>

        <div class="settings-row">
          <span>${ar ? 'نسخة احتياطية' : 'Backup'}</span>
          <div style="display:flex;gap:8px;">
            <button type="button" data-action="export" style="padding:6px 12px; border:1px solid var(--ln); border-radius:var(--r-2); font-size:12px;">${ar ? 'تصدير' : 'Export'}</button>
            <button type="button" data-action="import" style="padding:6px 12px; border:1px solid var(--ln); border-radius:var(--r-2); font-size:12px;">${ar ? 'استيراد' : 'Import'}</button>
          </div>
        </div>

        <div class="settings-row">
          <span>${ar ? 'إعادة تعيين التقدم' : 'Reset progress'}</span>
          <button type="button" data-action="reset" style="padding:6px 14px; border:1px solid var(--ln); border-radius:var(--r-2); font-size:12px; color:var(--tx-mu);">
            ${ar ? 'حذف' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
    <div class="settings-footer">
      <span>FLASH v1.0</span>
      <span>${ar ? 'اضغط ⌘، للفتح' : 'Press Cmd+, to open'}</span>
    </div>
  `;

  // Wire close
  panel.querySelector('.settings-close').addEventListener('click', close);

  // Wire segments
  panel.querySelectorAll('.seg-ctrl').forEach(ctrl => {
    ctrl.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const key = ctrl.dataset.key;
      const val = b.dataset.val;
      if (key === 'theme') F.setTheme(val);
      if (key === 'lang') F.setLang(val);
      window.dispatchEvent(new Event('flash:render'));
      render();
    });
  });

  // Wire accent swatches
  panel.querySelectorAll('.accent-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      applyAccent(sw.dataset.accent);
      render();
    });
  });

  // Wire toggles
  panel.querySelectorAll('.switch[data-toggle]').forEach(sw => {
    const activate = () => {
      const checked = sw.getAttribute('aria-checked') === 'true';
      const next = !checked;
      sw.setAttribute('aria-checked', String(next));
      const key = sw.dataset.toggle;
      if (key === 'reduced-motion'){
        document.documentElement.toggleAttribute('data-reduced-motion', next);
        LS.set('reduced-motion', next ? '1' : '0');
      }
      if (key === 'sound'){
        LS.set('sound', next ? '1' : '0');
        if (window.FLASH_MODULES && window.FLASH_MODULES.sound){
          window.FLASH_MODULES.sound.muted(!next);
        }
      }
    };
    sw.addEventListener('click', activate);
    sw.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); activate(); }
    });
  });

  // Wire export / import
  const expBtn = panel.querySelector('[data-action="export"]');
  if (expBtn){
    expBtn.addEventListener('click', () => {
      if (window.FLASH_MODULES && window.FLASH_MODULES.dataIO){
        window.FLASH_MODULES.dataIO.export();
      }
    });
  }
  const impBtn = panel.querySelector('[data-action="import"]');
  if (impBtn){
    impBtn.addEventListener('click', () => {
      if (window.FLASH_MODULES && window.FLASH_MODULES.dataIO){
        window.FLASH_MODULES.dataIO.import();
      }
    });
  }

  // Wire reset
  const resetBtn = panel.querySelector('[data-action="reset"]');
  if (resetBtn){
    resetBtn.addEventListener('click', () => {
      const ar = F.state.lang === 'ar';
      const msg = ar
        ? 'سيتم حذف كل التقدم. متابعة؟'
        : 'This will erase all progress. Continue?';
      if (!confirm(msg)) return;
      Object.keys(localStorage).forEach(k => {
        if (k.indexOf('flash.') === 0 && k.indexOf('flash.theme') !== 0 && k.indexOf('flash.lang') !== 0){
          localStorage.removeItem(k);
        }
      });
      location.reload();
    });
  }
}

function open(){
  build();
  render();
  panel.classList.add('open');
  document.body.classList.add('settings-open');
}
function close(){
  if (!panel) return;
  panel.classList.remove('open');
  document.body.classList.remove('settings-open');
}

/* Restore accent on load */
function restore(){
  applyAccent(currentAccent());
  const rm = LS.get('reduced-motion', '0') === '1';
  if (rm) document.documentElement.setAttribute('data-reduced-motion', '');
  const sound = LS.get('sound', '1') === '1';
  if (window.FLASH_MODULES && window.FLASH_MODULES.sound){
    window.FLASH_MODULES.sound.muted(!sound);
  }
}

F.onReady(() => {
  setTimeout(() => { injectButton(); restore(); }, 260);
  window.addEventListener('flash:render', () => {
    setTimeout(injectButton, 100);
    if (panel && panel.classList.contains('open')) render();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.settingsPanel = { open, close, applyAccent };
})();