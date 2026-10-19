/* =========================================================
   MODULE - Daily Reminder
   Requests Notification permission, schedules a daily ping
   at a chosen hour (stored as flash.reminderHour).
   Uses setTimeout - works while the tab is open.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

const LS = {
  get(k, d){ try { const v = localStorage.getItem('flash.' + k); return v === null ? d : v; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('flash.' + k, v); } catch(e){} }
};

let timerId = null;

function supported(){
  return 'Notification' in window;
}

async function requestPermission(){
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const p = await Notification.requestPermission();
  return p;
}

function scheduleNext(){
  if (timerId) clearTimeout(timerId);
  if (!supported()) return;
  if (Notification.permission !== 'granted') return;

  const hour = parseInt(LS.get('reminderHour', '20'), 10);
  const now = new Date();
  const target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= now.getTime()){
    target.setDate(target.getDate() + 1);
  }
  const delay = target.getTime() - now.getTime();
  const safeDelay = Math.min(delay, 24 * 60 * 60 * 1000);

  timerId = setTimeout(() => {
    fire();
    scheduleNext();
  }, safeDelay);
}

function fire(){
  if (!supported()) return;
  if (Notification.permission !== 'granted') return;

  const ar = F.state.lang === 'ar';
  const title = ar ? 'وقت التدريب' : 'Time to train';
  const body = ar
    ? 'جلسة قصيرة اليوم تبقي سلسلتك حية.'
    : 'A short session today keeps your streak alive.';

  try {
    const n = new Notification(title, {
      body,
      icon: 'assets/icon-192.svg',
      badge: 'assets/icon-192.svg',
      tag: 'flash-daily',
      silent: false
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch(e){}
}

async function enable(hour){
  const perm = await requestPermission();
  if (perm !== 'granted') return false;
  if (typeof hour === 'number') LS.set('reminderHour', String(hour));
  LS.set('reminderOn', '1');
  scheduleNext();
  return true;
}

function disable(){
  LS.set('reminderOn', '0');
  if (timerId) clearTimeout(timerId);
  timerId = null;
}

function isOn(){
  return LS.get('reminderOn', '0') === '1';
}

F.onReady(() => {
  window.addEventListener('flash:reminder-enable', (e) => enable(e.detail && e.detail.hour));
  window.addEventListener('flash:reminder-disable', disable);

  if (isOn()) scheduleNext();
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.reminder = {
  enable, disable, isOn, fire, supported
};
})();