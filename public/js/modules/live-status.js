/* =========================================================
   MODULE - Live Status UI
   Header badge that shows connection state and lets the user
   retry or switch to demo mode.
   Listens to flash:data-loading and flash:data-loaded.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;
const A = window.FLASH_API;
const LD = window.FLASH_MODULES && window.FLASH_MODULES.liveData;

let badge = null;

const LABELS = {
  en: {
    live:       'Live',
    mock:       'Demo',
    connecting: 'Connecting',
    tooltipLive: 'Connected to backend — click to refresh',
    tooltipMock: 'Using demo data — backend unreachable',
    tooltipConn: 'Trying to reach the backend…'
  },
  ar: {
    live:       'مباشر',
    mock:       'تجريبي',
    connecting: 'جارٍ الاتصال',
    tooltipLive: 'متصل بالخادم — اضغط للتحديث',
    tooltipMock: 'بيانات تجريبية — الخادم غير متاح',
    tooltipConn: 'جارٍ محاولة الاتصال…'
  }
};

function currentLang(){
  return F.state.lang === 'ar' ? 'ar' : 'en';
}

function build(){
  if (badge) return badge;
  const tools = document.querySelector('.tools');
  if (!tools) return null;

  badge = document.createElement('button');
  badge.className = 'live-badge';
  badge.type = 'button';
  badge.dataset.state = 'mock';
  badge.setAttribute('aria-label', 'Connection status');
  badge.innerHTML = `
    <span class="dot"></span>
    <span class="label"></span>
  `;
  badge.addEventListener('click', () => {
    if (badge.dataset.state === 'live'){
      if (LD && LD.refresh) LD.refresh();
    } else {
      if (LD && LD.load) LD.load();
    }
  });

  /* Insert at the start of the tools group */
  tools.insertBefore(badge, tools.firstChild);
  return badge;
}

function setState(state){
  if (!badge) build();
  if (!badge) return;

  badge.dataset.state = state;
  const L = LABELS[currentLang()];
  const labelEl = badge.querySelector('.label');
  const tipEl = badge.querySelector('.dot');

  if (labelEl){
    labelEl.textContent = L[state] || state;
  }
  if (badge.dataset.state === 'live'){
    badge.title = L.tooltipLive;
  } else if (badge.dataset.state === 'mock'){
    badge.title = L.tooltipMock;
  } else if (badge.dataset.state === 'connecting'){
    badge.title = L.tooltipConn;
  }

  if (tipEl) tipEl.setAttribute('aria-hidden', 'true');
}

function refreshLabel(){
  if (!badge) return;
  setState(badge.dataset.state);
}

/* ─── Init ─── */
F.onReady(() => {
  setTimeout(() => {
    build();
    /* Initial state based on API client */
    const s = (A && typeof A.status === "function" ? A.status() : null) || { live: false, mode: "mock" };
    setState(s.live ? 'live' : 'mock');
  }, 400);

  /* Loading events */
  window.addEventListener('flash:data-loading', (e) => {
    if (e.detail && e.detail.loading){
      setState('connecting');
    }
  });

  window.addEventListener('flash:data-loaded', (e) => {
    const src = (e.detail && e.detail.source) || 'mock';
    setState(src === 'live' ? 'live' : 'mock');
  });

  /* Refresh on language change */
  window.addEventListener('flash:render', () => {
    setTimeout(refreshLabel, 50);
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.liveStatus = { setState, refreshLabel };
})();