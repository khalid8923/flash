/* ═══════════════════════════════════════════════════════════
   MODULE — Session Progress
   Injects a progress panel at the top of the split-pane body
   whenever a domain is open. Progress = games played this
   week / 4 (games per domain target).
   Public: FLASH_MODULES.sessionProgress.render(domainId)
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

function weeklyCount(domainId){
  // Count sessions in the last 7 days for this domain
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  return F.M.recentSessions.filter(s => {
    if (s.domain !== domainId) return false;
    const t = new Date(s.date).getTime();
    return (now - t) <= week;
  }).length;
}

function render(domainId){
  const body = document.getElementById('sp-body');
  if (!body) return;

  const domain = F.M.domains.find(d => d.id === domainId);
  if (!domain) return;

  const target = 4;
  const done = Math.min(target, weeklyCount(domainId));
  const pct = Math.round(done / target * 100);
  const ar = F.state.lang === 'ar';

  // Remove old
  const old = body.querySelector('.sp-progress');
  if (old) old.remove();

  const el = document.createElement('div');
  el.className = 'sp-progress';
  el.innerHTML = `
    <div class="sp-progress-h">
      <span class="t">${ar ? 'هذا الأسبوع' : 'This week'}</span>
      <span class="m">${done} / ${target} ${ar ? 'ألعاب' : 'games'}</span>
    </div>
    <div class="sp-progress-bar">
      <div class="sp-progress-fill" style="width: 0%"></div>
    </div>
    <div class="sp-progress-tick">
      <span>${ar ? 'الهدف' : 'Target'}</span>
      <span>${pct}%</span>
    </div>
  `;
  body.insertBefore(el, body.firstChild);

  // Animate fill on next frame
  requestAnimationFrame(() => {
    const fill = el.querySelector('.sp-progress-fill');
    if (fill) fill.style.width = pct + '%';
  });
}

F.onReady(() => {
  window.addEventListener('flash:render', () => {
    const current = document.body.classList.contains('split-open');
    if (current){
      const id = document.querySelector('.split-pane');
      // Read from the pane's dataset if we stored it
      // Fallback: read the last opened domain from the module
      const S = window.FLASH_MODULES && window.FLASH_MODULES.splitPane;
      // Not exposed directly; re-detect from URL of the last lane click is unreliable
      // Simply rebuild for whatever title shows
    }
  });
});

/* Auto-hook into splitPane.open via patching */
F.onReady(() => {
  setTimeout(() => {
    const SP = window.FLASH_MODULES && window.FLASH_MODULES.splitPane;
    if (!SP) return;
    const origOpen = SP.open;
    SP.open = function(id){
      const r = origOpen.call(SP, id);
      // small delay so the pane body is populated
      setTimeout(() => render(id), 40);
      return r;
    };
  }, 400);
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.sessionProgress = { render };
})();