/* =========================================================
   MODULE - Session Detail Modal
   Click any session row → detailed view.
   Public: FLASH_MODULES.sessionDetail.open(session)
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

let overlay = null;
let current = null;

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
  overlay.className = 'sdm-overlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('on')) close();
  });

  return overlay;
}

function render(){
  if (!current) return;
  const ar = F.state.lang === 'ar';
  const s = current;
  const d = F.M.domains.find(x => x.id === s.domain);
  const game = s['game_' + F.state.lang] || s.game_en;
  const dom = d ? (d['name_' + F.state.lang] || d.name_en) : s.domain;

  // Synthesize trial-level chart from domain last10 (mock)
  const chartData = d ? d.last10 : [50,52,55,58,60,62,61,63,65,68];
  const chartPath = linePath(chartData, 400, 100, 8);
  const bestAcc = Math.max.apply(null, chartData);
  const trend = chartData[chartData.length - 1] - chartData[0];
  const trendSign = trend > 0 ? '+' : '';

  // Compute derived metrics
  const rtv = Math.round(s.medianRT * 0.18);
  const rcs = (s.accuracy / (s.medianRT / 1000)).toFixed(2);

  overlay.innerHTML = `
    <div class="sdm-box" role="dialog" aria-modal="true">
      <div class="sdm-hdr">
        <div>
          <div class="sdm-title" style="--dc:${d ? d.c : 'var(--ac)'}">
            <span class="sdm-dot"></span>
            ${game}
          </div>
          <div class="sdm-sub">${dom} · ${F.DF(s.date)}</div>
        </div>
        <button class="sdm-close" type="button" aria-label="Close">x</button>
      </div>

      <div class="sdm-kv">
        <div class="cell">
          <div class="lbl">${ar ? 'الدقة' : 'Accuracy'}</div>
          <div class="val">${F.N(s.accuracy)}<small>%</small></div>
        </div>
        <div class="cell">
          <div class="lbl">${ar ? 'الزمن الوسيط' : 'Median RT'}</div>
          <div class="val">${F.N(s.medianRT)}<small>${ar ? 'م ث' : 'ms'}</small></div>
        </div>
        <div class="cell">
          <div class="lbl">${ar ? 'تباين الزمن' : 'RTV'}</div>
          <div class="val">${F.N(rtv)}<small>${ar ? 'م ث' : 'ms'}</small></div>
        </div>
        <div class="cell">
          <div class="lbl">${ar ? 'RCS' : 'RCS'}</div>
          <div class="val">${rcs}<small>${ar ? '/ث' : '/s'}</small></div>
        </div>
      </div>

      <div class="sdm-chart" style="--dc:${d ? d.c : 'var(--ac)'}">
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="${chartPath}"/>
        </svg>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <span class="sdm-badge" style="--dc:${d ? d.c : 'var(--ac)'}">
          ${ar ? 'الاتجاه' : 'Trend'} ${trendSign}${F.N(trend)}
        </span>
        ${s.deltaVsPB > 0 ? `<span class="sdm-badge" style="--dc:var(--ac)">${ar ? 'رقم شخصي' : 'Personal best'}</span>` : ''}
      </div>
    </div>
  `;

  overlay.querySelector('.sdm-close').addEventListener('click', close);
}

function open(session){
  build();
  current = session;
  render();
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function close(){
  if (!overlay) return;
  overlay.classList.remove('on');
  document.body.style.overflow = '';
  current = null;
}

/* Wire row clicks */
function bind(){
  const tbl = document.querySelector('.tbl');
  if (!tbl || tbl._sdmBound) return;
  tbl._sdmBound = true;

  tbl.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const idx = Array.prototype.indexOf.call(tbl.querySelectorAll('tbody tr'), tr);
    if (idx === -1 || !F.M.recentSessions[idx]) return;
    open(F.M.recentSessions[idx]);
  });
}

F.onReady(() => {
  setTimeout(bind, 300);
  window.addEventListener('flash:render', () => {
    setTimeout(bind, 120);
    if (overlay && overlay.classList.contains('on')) render();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.sessionDetail = { open, close };
})();