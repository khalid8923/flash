/* ═══════════════════════════════════════════════════════════
   MODULE — Week Heatmap Strip
   Injects a 7-day activity strip at the bottom of the footer.
   Cells are intensity levels 0-4 based on sessions per day.
   Hover → tooltip showing date + count.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const DAYS = {
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  ar: ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
};

function countByDate(){
  const map = {};
  F.M.recentSessions.forEach(s => {
    map[s.date] = (map[s.date] || 0) + 1;
  });
  return map;
}

function levelFor(count){
  if (!count) return 0;
  if (count >= 4) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

function render(){
  const foot = document.getElementById('foot');
  if (!foot) return;

  // Remove old
  const old = foot.querySelector('.week-heat');
  if (old) old.remove();

  const map = countByDate();
  const ar = F.state.lang === 'ar';
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  // Build last 7 days (oldest → today)
  const days = [];
  for (let i = 6; i >= 0; i--){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = map[key] || 0;
    days.push({
      key,
      count,
      level: levelFor(count),
      date: d,
      dayName: DAYS[F.state.lang][d.getDay()],
      isToday: key === todayKey
    });
  }

  // Determine total sessions this week (for the label)
  const total = days.reduce((sum, d) => sum + d.count, 0);

  const cellsHTML = days.map(d => `
    <div class="week-cell${d.isToday ? ' today' : ''}"
         data-level="${d.level}"
         title="${d.dayName} · ${d.count} ${ar ? 'جلسات' : 'sessions'}">
    </div>
  `).join('');

  const labelsHTML = days.map(d => `<span>${d.dayName}</span>`).join('');

  const el = document.createElement('div');
  el.className = 'week-heat';
  el.innerHTML = `
    <span class="lh">${ar ? 'هذا الأسبوع' : 'This week'} · ${total} ${ar ? 'جلسات' : 'sessions'}</span>
    <div>
      <div class="week-grid">${cellsHTML}</div>
      <div class="week-days">${labelsHTML}</div>
    </div>
  `;

  foot.appendChild(el);
}

F.onReady(() => {
  setTimeout(render, 300);
  window.addEventListener('flash:render', () => setTimeout(render, 120));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.weekHeatmap = { render };
})();