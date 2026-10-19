/* =========================================================
   MODULE - Domain Compare
   Side-by-side comparison overlay.
   Open: FLASH_MODULES.domainCompare.open([id1, id2])
   Shorthand: press "C" to open with defaults.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

let overlay = null;
let selected = [];

/* Line path helper */
function linePath(values, w, h, pad){
  const n = values.length;
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
}

function build(){
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-box" role="dialog" aria-modal="true">
      <div class="compare-hdr">
        <h2 id="cmp-title"></h2>
        <button class="compare-close" type="button" aria-label="Close">x</button>
      </div>
      <div class="compare-grid" id="cmp-grid"></div>
      <div class="compare-diff" id="cmp-diff"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.compare-close').addEventListener('click', close);

  return overlay;
}

function render(){
  const grid = overlay.querySelector('#cmp-grid');
  const diff = overlay.querySelector('#cmp-diff');
  const title = overlay.querySelector('#cmp-title');
  const ar = F.state.lang === 'ar';

  title.textContent = ar ? 'مقارنة المجالات' : 'Compare domains';

  const W = 200, H = 40, PAD = 4;

  grid.innerHTML = F.M.domains.map(d => {
    const name = d['name_' + F.state.lang] || d.name_en;
    const path = linePath(d.last10, W, H, PAD);
    const isSel = selected.includes(d.id);
    return `
      <div class="compare-col${isSel ? ' selected' : ''}"
           data-id="${d.id}" style="--dc:${d.c}">
        <div class="compare-col-h">
          <span class="compare-dot"></span>
          ${name}
        </div>
        <div class="compare-num">${F.N(d.mastery)}<small>%</small></div>
        <div class="compare-spark">
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            <path d="${path}"/>
          </svg>
        </div>
        <div class="compare-meta">
          <span>${ar ? 'ذروة:' : 'Peak:'} ${F.N(Math.max.apply(null, d.last10))}</span>
          <span>${ar ? 'أدنى:' : 'Low:'} ${F.N(Math.min.apply(null, d.last10))}</span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.compare-col').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const idx = selected.indexOf(id);
      if (idx === -1){
        if (selected.length >= 3) selected.shift();
        selected.push(id);
      } else {
        selected.splice(idx, 1);
      }
      render();
    });
  });

  /* Diff panel when exactly 2 selected */
  if (selected.length === 2){
    const [a, b] = selected.map(id => F.M.domains.find(d => d.id === id));
    const na = a['name_' + F.state.lang] || a.name_en;
    const nb = b['name_' + F.state.lang] || b.name_en;
    const diffMastery = a.mastery - b.mastery;
    const cls = diffMastery > 0 ? 'up' : 'dn';
    const sign = diffMastery > 0 ? '+' : '';

    diff.classList.add('on');
    diff.innerHTML = ar
      ? `${na} يتقدم على ${nb} بـ <b class="${cls}">${sign}${F.N(diffMastery)}</b> نقطة`
      : `${na} leads ${nb} by <b class="${cls}">${sign}${F.N(diffMastery)}</b> points`;
  } else {
    diff.classList.remove('on');
    diff.innerHTML = '';
  }
}

function open(ids){
  build();
  selected = Array.isArray(ids) && ids.length ? ids.slice(0, 3) : [];
  render();
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', esc);
}

function close(){
  if (!overlay) return;
  overlay.classList.remove('on');
  document.body.style.overflow = '';
  selected = [];
  document.removeEventListener('keydown', esc);
}

function esc(e){
  if (e.key === 'Escape') close();
}

/* ─── Keyboard: C opens compare ─── */
function globalKey(e){
  const tag = (document.activeElement.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'c' || e.key === 'C'){
    if (overlay && overlay.classList.contains('on')){
      close();
    } else {
      open(['memory', 'spatial']);
    }
  }
}

F.onReady(() => {
  document.addEventListener('keydown', globalKey);
  window.addEventListener('flash:render', () => {
    if (overlay && overlay.classList.contains('on')) render();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.domainCompare = { open, close };
})();