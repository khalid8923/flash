/* ═══════════════════════════════════════════════════════════
   MODULE — Today Panel
   KPIs (Level/XP/Streak/Freeze) + Today's Plan
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const M = F.M;

function render(){
  const t = F.t, n = F.N, ai = F.ai;
  const u = M.user;
  const xpPct = (u.xp / u.xpNext * 100).toFixed(1);

  const planHTML = M.todayPlan.map((p, i) => {
    const d = M.domains.find(x => x.id === p.domain);
    const kind = p['kind_' + F.state.lang] || p.kind_en;
    const game = p['game_' + F.state.lang] || p.game_en;
    const reason = p['reason_' + F.state.lang] || p.reason_en;
    return `
      <li style="--dc:${d.c}">
        <span class="pl-k">${n(i+1)} · ${kind} · ${n(p.minutes)} ${t('min')}</span>
        <b class="pl-name">${game}</b>
        <span class="pl-dom">
          <span class="lane-dot" style="--dc:${d.c}"></span>
          ${d['name_' + F.state.lang] || d.name_en}
        </span>
        <em class="pl-reason">${ai(reason)}</em>
      </li>
    `;
  }).join('');

  return `
    <div class="brain-wrap" aria-hidden="true"></div>
    <div class="today-stats">
      <div class="stat">
        <span class="k">${t('lv')}</span>
        <b>${n(u.level)}<small>+${n(u.levelDelta)}</small></b>
      </div>
      <div class="stat stat-xp">
        <span class="k">${t('xp')}</span>
        <b>${n(u.xp)}<small>/ ${n(u.xpNext)}</small></b>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
          <rect class="xp-bg"   width="100"  height="6" rx="1"/>
          <rect class="xp-fill" width="${xpPct}" height="6" rx="1"/>
        </svg>
      </div>
      <div class="stat"></div>
      <div class="stat">
        <span class="k">${t('st')}</span>
        <div class="streak-wrap">
          <b>${n(u.streak)}</b>
          <small>${t('d')} +${n(u.streakDelta)}</small>
        </div>
      </div>
      <div class="stat">
        <span class="k">${t('fz')}</span>
        <b>${n(u.freezeTokens)}</b>
      </div>
    </div>
    <ol class="plan">${planHTML}</ol>
    <a class="cta" href="#" data-action="begin">${t('cta')} ${n(1)} ${t('of')} ${n(M.todayPlan.length)}</a>
  `;
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.today = { render };
})();