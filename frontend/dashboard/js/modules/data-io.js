/* =========================================================
   MODULE - Data Export / Import
   Exports the entire flash.* namespace to a JSON file.
   Import restores it. Download via Blob URL.
   Public: FLASH_MODULES.dataIO.export(), .import()
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

const VERSION = 1;
const NS = 'flash.';

function collect(){
  const data = {};
  for (let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if (k && k.indexOf(NS) === 0){
      data[k] = localStorage.getItem(k);
    }
  }
  return data;
}

function download(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function doExport(){
  const payload = {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FLASH',
    keys: collect()
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const stamp = new Date().toISOString().slice(0, 10);
  download(blob, `flash-backup-${stamp}.json`);

  toast(F.state.lang === 'ar' ? 'تم تصدير البيانات' : 'Data exported');
}

function doImport(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload || !payload.keys || payload.version !== VERSION){
          throw new Error('Invalid backup file');
        }

        const ar = F.state.lang === 'ar';
        const msg = ar
          ? 'سيتم استبدال كل البيانات الحالية. متابعة؟'
          : 'This will replace all current data. Continue?';
        if (!confirm(msg)) return;

        // Clear existing
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++){
          const k = localStorage.key(i);
          if (k && k.indexOf(NS) === 0) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));

        // Restore
        Object.keys(payload.keys).forEach(k => {
          localStorage.setItem(k, payload.keys[k]);
        });

        toast(ar ? 'تم استيراد البيانات. جارٍ إعادة التحميل…' : 'Data imported. Reloading…');
        setTimeout(() => location.reload(), 900);
      } catch(err){
        toast(F.state.lang === 'ar' ? 'ملف غير صالح' : 'Invalid file');
      }
    };
    reader.readAsText(file);
  });

  input.click();
}

function toast(msg){
  const el = document.createElement('div');
  el.className = 'dataio-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => {
    el.classList.remove('on');
    setTimeout(() => el.remove(), 400);
  }, 2600);
}

F.onReady(() => {
  // Wire into the settings panel via event
  window.addEventListener('flash:dataio-export', doExport);
  window.addEventListener('flash:dataio-import', doImport);
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.dataIO = { export: doExport, import: doImport };
})();