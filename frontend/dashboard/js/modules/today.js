(function(){
'use strict';
var F = window.FLASH;
var M = F.M;

function render(){
  var t = F.t, n = F.N, pc = F.pc;
  var user = M.user;
  var xpPct = (user.xp / user.xpNext) * 100;
  
  var planRows = M.todayPlan.map(function(p){
    return '<div class="plan-row">' +
      '<div class="plan-kind">' + t(p['kind_' + F.state.lang] || p.kind_en) + '</div>' +
      '<div class="plan-game">' + (p['game_' + F.state.lang] || p.game_en) + '</div>' +
      '<div class="plan-mins">' + n(p.minutes) + 'm</div>' +
    '</div>';
  }).join('');

  var missionsHtml = (window.FLASH_MODULES && window.FLASH_MODULES.missions) 
    ? window.FLASH_MODULES.missions.render() 
    : '';

  return '<div class="today-h">' +
      '<h2>' + t('today') + '</h2>' +
      '<span class="date">' + F.DF(new Date()) + '</span>' +
    '</div>' +
    
    // XP BAR
    '<div class="xp-block">' +
      '<div class="xp-head"><span>Level ' + n(user.level) + '</span><span>' + n(user.xp) + ' / ' + n(user.xpNext) + ' XP</span></div>' +
      '<div class="xp-track"><div class="xp-fill" style="width:' + xpPct + '%"></div></div>' +
    '</div>' +

    // STREAK
    '<div class="streak-block">' +
      '<div class="streak-fire">🔥</div>' +
      '<div class="streak-info"><span class="streak-num">' + n(user.streak) + '</span> Day Streak</div>' +
    '</div>' +

    // PLAN
    '<div class="plan-block">' +
      '<h3>' + t('plan') + '</h3>' +
      planRows +
      '<button class="cta" data-action="begin">' + t('begin') + '</button>' +
    '</div>' +

    // MISSIONS
    missionsHtml;
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.today = { render: render };
console.info('[today] UPGRADED v5 loaded');
})();