(function(){
'use strict';
var F = window.FLASH;
var M = F.M;
function render(){
  var t = F.t, n = F.N, DF = F.DF, pc = F.pc;
  var sess = Array.isArray(M && M.recentSessions) ? M.recentSessions : [];
  var doms = Array.isArray(M && M.domains) ? M.domains : [];
  var rows = sess.map(function(s){
    var safe = s || {};
    var d = null;
    for (var i = 0; i < doms.length; i++) {
      if (doms[i] && doms[i].id === safe.domain) { d = doms[i]; break; }
    }
    if (!d) d = { c: '#888', name_en: 'Unknown', name_ar: 'Unknown' };
    var game = (safe['game_' + F.state.lang] || safe.game_en) || 'Unknown';
    var domName = (d['name_' + F.state.lang] || d.name_en) || 'Unknown';
    var delta = (typeof safe.deltaVsPB === 'number') ? safe.deltaVsPB : 0;
    var deltaStr = (delta > 0 ? '+' : '-') + Math.abs(delta).toFixed(1);
    var pb = delta > 0;
    return '<tr style="--dc:' + d.c + '">' +
      '<td>' + DF(safe.date || '') + '</td>' +
      '<td>' + game + '</td>' +
      '<td><span class="tr-dot"></span>' + domName + '</td>' +
      '<td class="num">' + pc(safe.accuracy || 0) + '</td>' +
      '<td class="num">' + n(safe.medianRT || 0) + ' ' + t('ms') + '</td>' +
      '<td class="num">' + deltaStr + (pb ? '<span class="pb-tag">PB</span>' : '') + '</td>' +
    '</tr>';
  }).join('');
  return '<div class="recent-h">' +
      '<h2>' + t('rec') + '</h2>' +
      '<span class="cnt">' + n(sess.length) + '</span>' +
    '</div>' +
    '<table class="recent-table">' +
      '<thead><tr>' +
        '<th>' + t('date') + '</th>' +
        '<th>' + t('game') + '</th>' +
        '<th>' + t('domain') + '</th>' +
        '<th>' + t('accuracy') + '</th>' +
        '<th>' + t('medianRT') + '</th>' +
        '<th>' + t('delta') + '</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}
window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.recent = { render: render };
console.info('[recent] SAFE v3 loaded');
})();