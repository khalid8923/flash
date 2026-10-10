/* =========================================================
   MODULE - PWA
   Registers the service worker + handles update prompts.
   Shows an "offline ready" toast the first time.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

const isLocalFile = location.protocol === 'file:';
const supportsSW = 'serviceWorker' in navigator;

/* --- Offline toast --- */
function showOfflineToast(){
  const ar = F.state.lang === 'ar';
  const el = document.createElement('div');
  el.className = 'offline-toast';
  el.innerHTML = `
    <span class="dot"></span>
    <span>${ar ? 'جاهز للعمل دون اتصال' : 'Ready to work offline'}</span>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => {
    el.classList.remove('on');
    setTimeout(() => el.remove(), 400);
  }, 3200);
}

/* --- Online/offline indicator --- */
function buildIndicator(){
  const pill = document.createElement('div');
  pill.className = 'net-pill';
  pill.innerHTML = '<span class="net-dot"></span>';
  document.body.appendChild(pill);

  const update = () => {
    const online = navigator.onLine;
    pill.dataset.state = online ? 'online' : 'offline';
    const ar = F.state.lang === 'ar';
    pill.title = online
      ? (ar ? 'متصل' : 'Online')
      : (ar ? 'غير متصل' : 'Offline');
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/* --- Register --- */
function register(){
  if (isLocalFile || !supportsSW){
    return;   // No SW on file://
  }

  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then((reg) => {
      // Watch for updates
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdatePrompt();
          } else if (sw.state === 'installed'){
            setTimeout(showOfflineToast, 1400);
          }
        });
      });

      if (reg.active){
        setTimeout(showOfflineToast, 1400);
      }
    })
    .catch(() => {});
}

function showUpdatePrompt(){
  const ar = F.state.lang === 'ar';
  const el = document.createElement('div');
  el.className = 'update-toast';
  el.innerHTML = `
    <span>${ar ? 'تحديث متوفر' : 'Update available'}</span>
    <button type="button">${ar ? 'تحديث' : 'Refresh'}</button>
  `;
  el.querySelector('button').addEventListener('click', () => {
    if (navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
    }
    location.reload();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
}

F.onReady(() => {
  register();
  buildIndicator();
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.pwa = { register };
})();