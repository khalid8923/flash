/* ═══════════════════════════════════════════════════════════
   MODULE — Split-Pane Master/Detail
   Opens an inspector panel when a domain lane is clicked.
   Renders domain summary, sparkline, recent sessions.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const SVG = 'http://www.w3.org/2000/svg';

let pane = null;
let currentDomain = null;
let onClose = null;

/* ─── Build the shell once ─── */
function ensurePane(){
  if (pane) return pane;
  pane = document.createElement('aside');
  pane.className = 'split-pane';
  pane.setAttribute('role', 'dialog');
  pane.setAttribute('aria-modal', 'false');
  pane.setAttribute('aria-label', 'Domain detail');
  pane.innerHTML = `
    <div class="sp-hdr">
      <button class="sp-back" type="button" aria-label="Close">←</button>
      <div class="sp-title" id="sp-title"></div>
    </div>
    <div class="sp-body" id="sp-body"></div>
  `;
  document.body.appendChild(pane);

  pane.querySelector('.sp-back').addEventListener('click', close);
  return pane;
}

/* ─── Minimal line path for a values array ─── */
function linePath(values, w, h, pad){
  const n = values.length;
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  });
  return pts.join(' ');
}

/* ─── Build body for a domain ─── */
function renderBody(domain){
  const t = F.t, n = F.N, ai = F.ai, DF = F.DF;
  const M = F.M;
  const name = domain['name_' + F.state.lang] || domain.name_en;

  // Recent sessions filtered by this domain
  const sessions = M.recentSessions.filter(s => s.domain === domain.id).slice(0, 6);

  // Sparkline data
  const all = domain.last10.concat(domain.forecast);
  const min = Math.min.apply(null, all);
  const max = Math.max.apply(null, all);
  const range = max - min || 1;
  const W = 400, H = 90, PAD = 8;
  const splitX = PAD + (9 / 14) * (W - PAD * 2);

  const histPath = linePath(domain.last10, W, H, PAD);
  const foreValues = [domain.last10[domain.last10.length - 1]].concat(domain.forecast);
  const forePath = linePath(foreValues, W, H, PAD);

  const sessionHTML = sessions.length ? sessions.map(s => {
    const game = s['game_' + F.state.lang] || s.game_en;
    return `
      <div class="sp-row">
        <span class="d">${DF(s.date)}</span>
        <span class="n">${game}</span>
        <span class="a">${F.pc(s.accuracy)}</span>
      </div>
    `;
  }).join('') : `<div class="sp-empty">${F.state.lang === 'ar' ? 'لا توجد جلسات بعد' : 'No sessions yet'}</div>`;

  return `
    <div class="sp-section">
      <span class="sp-label">${t('ac')}</span>
      <span class="sp-mastery">${n(domain.mastery)}<small>%</small></span>
    </div>
    <div class="sp-section">
      <span class="sp-label">${t('sea')}</span>
      <div class="sp-spark">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <path d="${histPath}"/>
          <path class="f" d="${forePath}" transform="translate(${(W - PAD * 2) * 9 / 14 - (W - PAD * 2) * 9 / 14},0) translate(${(W - PAD * 2) * 9 / 14 * 0},0)"/>
          <line x1="${splitX}" y1="${PAD}" x2="${splitX}" y2="${H - PAD}"
                stroke="var(--ac)" stroke-width="1" stroke-dasharray="2 3" opacity=".5"/>
        </svg>
      </div>
    </div>
    <div class="sp-section">
      <span class="sp-label">${t('rec')}</span>
      <div class="sp-sessions">${sessionHTML}</div>
    </div>
    <button class="sp-cta" type="button">${t('cta')}</button>
  `;
}

/* ─── Open / Close ─── */
function open(domainId){
  const domain = F.M.domains.find(d => d.id === domainId);
  if (!domain) return;

  ensurePane();
  currentDomain = domainId;

  // Set domain color context
  const name = domain['name_' + F.state.lang] || domain.name_en;
  pane.style.setProperty('--dc', domain.c);
  pane.querySelector('#sp-title').innerHTML =
    `<span class="sp-dot"></span>${name}`;
  pane.querySelector('#sp-body').innerHTML = renderBody(domain);

  // Wire CTA
  const cta = pane.querySelector('.sp-cta');
  if (cta){
    cta.addEventListener('click', () => {
      console.log('[FLASH] Begin session for', domainId);
      // Phase 4 will route to game.html
    });
  }

  // Focus management
  pane.querySelector('.sp-back').focus();

  document.body.classList.add('split-open');
  document.body.classList.remove('split-closing');

  // ESC to close
  document.addEventListener('keydown', escHandler);
}

function close(){
  if (!currentDomain) return;
  currentDomain = null;

  document.body.classList.add('split-closing');
  document.body.classList.remove('split-open');

  setTimeout(() => {
    document.body.classList.remove('split-closing');
  }, 400);

  document.removeEventListener('keydown', escHandler);
  if (onClose) onClose();
}

function escHandler(e){
  if (e.key === 'Escape') close();
}

/* ─── Re-render on theme/lang change ─── */
function refresh(){
  if (!currentDomain) return;
  const domain = F.M.domains.find(d => d.id === currentDomain);
  if (!domain) return;
  const name = domain['name_' + F.state.lang] || domain.name_en;
  pane.style.setProperty('--dc', domain.c);
  pane.querySelector('#sp-title').innerHTML =
    `<span class="sp-dot"></span>${name}`;
  pane.querySelector('#sp-body').innerHTML = renderBody(domain);
  // Re-wire CTA
  const cta = pane.querySelector('.sp-cta');
  if (cta){
    cta.addEventListener('click', () => {
      console.log('[FLASH] Begin session for', currentDomain);
    });
  }
}

/* ─── Wire lane clicks ─── */
function bindLanes(){
  const app = F.$('#app');
  if (!app) return;
  if (app._splitBound) return;
  app._splitBound = true;

  app.addEventListener('click', function(e){
    const lane = e.target.closest('.lane');
    if (!lane || !lane.dataset.domain) return;
    e.preventDefault();
    open(lane.dataset.domain);
  });
}

F.onReady(() => {
  setTimeout(bindLanes, 200);
  window.addEventListener('flash:render', () => {
    setTimeout(bindLanes, 100);
    refresh();
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.splitPane = { open, close, refresh };
})();