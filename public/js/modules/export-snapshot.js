/* ═══════════════════════════════════════════════════════════
   MODULE — Export Snapshot
   Captures the dashboard as a PNG.
   Uses SVG foreignObject approach — pure vanilla.
   Public: FLASH_MODULES.exportSnapshot.run()
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

let btn = null;

/* ─── Inject header button ─── */
function injectButton(){
  if (btn) return;
  const tools = document.querySelector('.tools');
  if (!tools) return;

  btn = document.createElement('button');
  btn.id = 'export-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Export snapshot');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>
    </svg>
  `;
  btn.addEventListener('click', run);

  const th = document.getElementById('th');
  if (th && th.parentNode === tools) tools.insertBefore(btn, th);
  else tools.appendChild(btn);
}

/* ─── Toast ─── */
function toast(msg){
  const el = document.createElement('div');
  el.className = 'export-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => {
    el.classList.remove('on');
    setTimeout(() => el.remove(), 400);
  }, 2400);
}

/* ─── Capture ─── */
async function capture(){
  const shell = document.querySelector('.shell');
  if (!shell) throw new Error('No shell');

  const rect = shell.getBoundingClientRect();
  const w = Math.ceil(rect.width);
  const h = Math.ceil(rect.height);

  // Collect CSS from all same-origin stylesheets
  let cssText = '';
  for (const sheet of document.styleSheets){
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of rules){
        cssText += rule.cssText + '\n';
      }
    } catch(e){ /* cross-origin, skip */ }
  }

  // Serialize the shell
  const clone = shell.cloneNode(true);
  // Remove iframes / canvases (they don't serialize)
  clone.querySelectorAll('canvas').forEach(c => {
    const ph = document.createElement('div');
    ph.style.cssText = c.style.cssText + ';background:transparent';
    c.replaceWith(ph);
  });

  const html = clone.outerHTML;
  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>${cssText}</style>
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const cx = canvas.getContext('2d');
  cx.scale(dpr, dpr);
  cx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);

  return canvas;
}

/* ─── Run ─── */
async function run(){
  if (!btn) return;
  btn.classList.add('busy');
  try {
    const canvas = await capture();
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      a.download = `flash-dashboard-${stamp}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
      toast(F.state.lang === 'ar' ? 'تم حفظ اللقطة' : 'Snapshot saved');
      btn.classList.remove('busy');
    }, 'image/png', 0.95);
  } catch(e){
    console.error('[export]', e);
    toast(F.state.lang === 'ar' ? 'فشل التصدير' : 'Export failed');
    btn.classList.remove('busy');
  }
}

F.onReady(() => {
  setTimeout(injectButton, 260);
  window.addEventListener('flash:render', () => setTimeout(injectButton, 100));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.exportSnapshot = { run };
})();