/* =========================================================
   MODULE - Session Timer Mini-HUD
   Floating timer during an active session.
   API:
     FLASH_MODULES.sessionHud.start()   -- begin 5-minute demo
     FLASH_MODULES.sessionHud.start(ms) -- custom duration
     FLASH_MODULES.sessionHud.stop()
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

let hud = null;
let startTs = 0;
let durationMs = 0;
let raf = null;
let timerId = null;

function build(){
  if (hud) return hud;
  hud = document.createElement('div');
  hud.className = 'session-hud';
  hud.innerHTML = `
    <div class="hud-ring">
      <svg viewBox="0 0 28 28">
        <circle class="tr" cx="14" cy="14" r="11" pathLength="100"/>
        <circle class="fl" cx="14" cy="14" r="11" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/>
      </svg>
    </div>
    <div class="hud-body">
      <span class="hud-label" id="hud-label"></span>
      <span class="hud-time" id="hud-time">00:00</span>
    </div>
    <button class="hud-stop" type="button" aria-label="Stop">
      <svg viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" rx="1"/></svg>
    </button>
  `;
  document.body.appendChild(hud);

  hud.querySelector('.hud-stop').addEventListener('click', stop);
  return hud;
}

function fmt(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function tick(){
  if (!hud) return;
  const elapsed = performance.now() - startTs;
  const remain = Math.max(0, durationMs - elapsed);
  const pct = durationMs > 0 ? 1 - (remain / durationMs) : 0;

  const timeEl = hud.querySelector('#hud-time');
  const fill = hud.querySelector('.hud-ring .fl');
  if (timeEl) timeEl.textContent = fmt(remain);
  if (fill) fill.style.strokeDashoffset = (100 * pct).toFixed(2);

  if (remain <= 0){
    stop();
    return;
  }
  raf = requestAnimationFrame(tick);
}

function start(ms){
  build();
  durationMs = typeof ms === 'number' ? ms : 5 * 60 * 1000;
  startTs = performance.now();

  const label = hud.querySelector('#hud-label');
  const ar = F.state.lang === 'ar';
  if (label) label.textContent = ar ? 'جلسة جارية' : 'Session';

  hud.classList.add('on');
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

function stop(){
  if (!hud) return;
  hud.classList.remove('on');
  cancelAnimationFrame(raf);
  raf = null;
}

/* Refresh label on language change */
F.onReady(() => {
  window.addEventListener('flash:render', () => {
    if (!hud || !hud.classList.contains('on')) return;
    const label = hud.querySelector('#hud-label');
    const ar = F.state.lang === 'ar';
    if (label) label.textContent = ar ? 'جلسة جارية' : 'Session';
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.sessionHud = { start, stop };
})();