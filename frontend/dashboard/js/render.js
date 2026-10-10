/* ═══════════════════════════════════════════════════════════
   FLASH Dashboard — Render orchestrator
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const $ = F.$;

function render(){
  const MOD = window.FLASH_MODULES || {};

  // ─── Panels in #app ───
  const app = $('#app');
  if (app){
    const today   = MOD.today  ? `<section class="pn" id="pn-today">${MOD.today.render()}</section>` : '';
    const season  = MOD.season ? `<section class="pn" id="pn-season">${MOD.season.render()}</section>` : '';
    const recent  = MOD.recent ? `<section class="pn pn-scroll" id="pn-recent">${MOD.recent.render()}</section>` : '';

    app.innerHTML = `
      <div class="col col-left">
        ${today}
      </div>
      <div class="col col-main">
        ${season}
      </div>
      <div class="col col-right">
        ${recent}
      </div>
    `;
  }

  // ─── Footer ───
  const foot = $('#foot');
  if (foot){
    const t = F.t, n = F.N, ai = F.ai;
    const M = F.M;
    const [a, b] = M.prediction.accuracyRange;
    const conf = Math.round(M.prediction.confidence * 100);
    foot.innerHTML = `
      <span class="k">${t('np')}</span>
      <span><em class="ai">${ai(t('pr')(n(a), n(b)))}</em> <span class="k">· ${F.pc(conf)} ${t('cf')}</span></span>
      <span class="k">${t('wi')}</span>
      <em class="ai">${ai(M.weeklyInsight['text_' + F.state.lang] || M.weeklyInsight.text_en)}</em>
    `;
  }

  // ─── Events (basic — clicks handled in later phases) ───
  app && app.addEventListener('click', e => {
    const lane = e.target.closest('.lane');
    if (lane && lane.dataset.domain){
      e.preventDefault();
      console.log('[FLASH] domain clicked:', lane.dataset.domain);
      // Phase 4 will handle: navigate to domain.html
    }
    const cta = e.target.closest('[data-action="begin"]');
    if (cta){
      e.preventDefault();
      console.log('[FLASH] begin session clicked');
      if (window.FLASH_MODULES && window.FLASH_MODULES.xpGain){
        window.FLASH_MODULES.xpGain.play(40);
        if (window.FLASH_MODULES.milestone){
          window.FLASH_MODULES.milestone.celebrate();
        }
      }
      // Phase 4 will handle: start session
    }
  });
}

F.onReady(() => {
  render();
  window.addEventListener('flash:render', render);
  console.log('[FLASH] rendered', F.state);
});
})();