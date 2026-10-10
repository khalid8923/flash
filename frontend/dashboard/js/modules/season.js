/* ═══════════════════════════════════════════════════════════
   MODULE — Season Panel
   10 domain lanes with sparklines + forecast
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const M = F.M;

function lanePath(values, w, h, pad){
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = (i / (n - 1)) * w;
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
}

function render(){
  const t = F.t, n = F.N, ai = F.ai;
  const arch = M.fingerprint['archetype_' + F.state.lang] || M.fingerprint.archetype_en;
  const mod  = M.fingerprint['modifier_' + F.state.lang]  || M.fingerprint.modifier_en;

  const lanes = M.domains.map(d => {
    const all = d.last10.concat(d.forecast);
    const h = lanePath(d.last10, 100, 30, 3);
    const f = lanePath([d.last10[d.last10.length - 1]].concat(d.forecast), 100, 30, 3);
    // the last point of history
    const last = d.last10[d.last10.length - 1];
    const min = Math.min(...all), max = Math.max(...all), range = max - min || 1;
    const lastY = 3 + (1 - (last - min) / range) * (30 - 6);
    const name = d['name_' + F.state.lang] || d.name_en;

    return `
      <a class="lane" href="#" data-domain="${d.id}" style="--dc:${d.c}">
        <span class="lane-label">
          <span class="lane-dot"></span>
          <span>${name}</span>
          <b class="lane-pct">${F.pc(d.mastery)}</b>
        </span>
        <span class="lane-plot">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
            <path class="l-hist" d="${h}" transform="scale(0.667,1)"/>
            <path class="l-fore" d="${f}"  transform="translate(66.7,0) scale(0.333,1)"/>
            <circle class="l-dot" cx="${(9 * 100 / 10 * 0.667).toFixed(1)}" cy="${lastY.toFixed(1)}" r="2"/>
            <line class="l-now" x1="66.7" y1="0" x2="66.7" y2="30"/>
          </svg>
        </span>
        <span class="lane-chev">→</span>
      </a>
    `;
  }).join('');

  return `
    <div class="season-h">
      <h2>${t('sea')}</h2>
      <span class="arch">${ai(arch + ' — ' + mod)}</span>
    </div>
    <div class="season-axis">
      <div></div>
      <div>
        <span style="inset-inline-start:0">${t('last')}</span>
        <span class="ax-now">${t('now')}</span>
        <span style="inset-inline-end:0">${t('fc')}</span>
      </div>
      <div></div>
    </div>
    <div class="lanes">${lanes}</div>
  `;
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.season = { render };
})();