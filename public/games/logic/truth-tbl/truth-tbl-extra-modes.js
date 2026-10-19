/* truth-tbl-extra-modes.js — Speed, Endless, Precision, Daily */
(function () {
  'use strict';
  const H = () => window.TruthTblHelpers;
  const MODES = {
    classic: {
      id: 'classic', name: 'Classic', name_ar: 'كلاسيكي',
      desc: '15 levels, 3 lives', desc_ar: '١٥ مستوى، ٣ فرص',
      maxLevels: 15, lives: 3, timeLimitMs: null,
      lvl: n => n + 1
    },
    speed: {
      id: 'speed', name: 'Speed', name_ar: 'سرعة',
      desc: 'Short time limit', desc_ar: 'حد زمني قصير',
      maxLevels: 15, lives: 0, penalty: 100, timeLimitMs: 3500,
      lvl: n => 1 + Math.floor(n / 3)
    },
    endless: {
      id: 'endless', name: 'Endless', name_ar: 'بلا نهاية',
      desc: 'One mistake ends it', desc_ar: 'خطأ واحد ينتهي',
      maxLevels: Infinity, lives: 1, timeLimitMs: null,
      lvl: n => 1 + Math.floor(n / 2)
    },
    precision: {
      id: 'precision', name: 'Precision', name_ar: 'دقة',
      desc: 'No rush, max accuracy', desc_ar: 'بلا ضغط، أقصى دقة',
      maxLevels: 15, lives: 0, timeLimitMs: null,
      lvl: () => 8
    },
    daily: {
      id: 'daily', name: 'Daily', name_ar: 'يومي',
      desc: 'Once per day', desc_ar: 'مرة كل يوم',
      maxLevels: 15, lives: 0, daily: true, timeLimitMs: 8000,
      lvl: () => 6,
      locked: () => H().dailyDone(),
      onEnd: (s) => H().dailyAdd({ score: s.totalScore, level: s.maxLevel, acc: s.accuracy })
    }
  };
  window.TruthTblExtraModes = {
    list: Object.keys(MODES),
    get: id => MODES[id],
    install: api => { Object.keys(MODES).forEach(id => { if (!api.CONFIG.modes[id]) api.CONFIG.modes[id] = MODES[id]; }); return api; }
  };
})();