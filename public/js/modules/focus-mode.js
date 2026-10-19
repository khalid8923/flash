/* ═══════════════════════════════════════════════════════════
   MODULE — Focus Mode
   Toggle:  F key, click on #focus-btn, or Cmd+Shift+F.
   State persists in sessionStorage for the current session.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

let btn = null;

function injectButton(){
  if (btn) return;
  const tools = document.querySelector('.tools');
  if (!tools) return;

  btn = document.createElement('button');
  btn.id = 'focus-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle focus mode');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4"/>
    </svg>
  `;
  btn.addEventListener('click', toggle);

  const th = document.getElementById('th');
  if (th && th.parentNode === tools) tools.insertBefore(btn, th);
  else tools.insertBefore(btn, tools.firstChild);
}

function isOn(){ return document.body.classList.contains('focus-mode'); }
function toggle(){
  if (isOn()) off(); else on();
}
function on(){
  document.body.classList.add('focus-mode');
  try { sessionStorage.setItem('flash.focus', '1'); } catch(e){}
}
function off(){
  document.body.classList.remove('focus-mode');
  try { sessionStorage.removeItem('flash.focus'); } catch(e){}
}

/* ─── Keyboard ─── */
function keyHandler(e){
  // Ignore if typing
  const tag = (document.activeElement.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  // F — toggle focus
  if (e.key === 'f' || e.key === 'F'){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    toggle();
    return;
  }

  // Cmd+Shift+F
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
  const cmd = isMac ? e.metaKey : e.ctrlKey;
  if (cmd && e.shiftKey && (e.key === 'f' || e.key === 'F')){
    e.preventDefault();
    toggle();
  }
}

F.onReady(() => {
  setTimeout(injectButton, 220);
  document.addEventListener('keydown', keyHandler);

  // Restore from session
  try {
    if (sessionStorage.getItem('flash.focus') === '1'){
      document.body.classList.add('focus-mode');
    }
  } catch(e){}

  window.addEventListener('flash:render', () => setTimeout(injectButton, 100));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.focusMode = { on, off, toggle, isOn };
})();