/* digit-span-extra-modes.js — Speed, Endless, Precision, Daily */
(function () {
  'use strict';
  const H = () => window.DigitSpanHelpers;
  const MODES = {
    classic: { id: 'classic', name: 'Classic', name_ar: 'كلاسيكي', desc: '12 levels, 3 lives', desc_ar: '١٢ مستوى، ٣ فرص', trials: 12, lives: 3, lvl: n => n + 1, digitShow: 950, digitGap: 280, shape: null },
    speed: {
      id: 'speed', name: 'Speed', name_ar: 'سرعة', desc: 'Faster show, tighter gap', desc_ar: 'عرض أسرع، فجوة أقصر',
      trials: 12, lives: 0, penalty: 100, lvl: n => 1 + Math.floor(n / 4),
      digitShow: 550, digitGap: 150, shape: q => q
    },
    endless: {
      id: 'endless', name: 'Endless', name_ar: 'بلا نهاية', desc: 'One mistake ends it', desc_ar: 'خطأ واحد ينتهي',
      trials: Infinity, lives: 1, lvl: n => 1 + Math.floor(n / 3), digitShow: 950, digitGap: 280, shape: null
    },
    precision: {
      id: 'precision', name: 'Precision', name_ar: 'دقة', desc: 'No rush, max accuracy', desc_ar: 'بلا ضغط، أقصى دقة',
      trials: 15, lives: 0, lvl: () => 6, digitShow: 1600, digitGap: 500, shape: null
    },
    daily: {
      id: 'daily', name: 'Daily', name_ar: 'يومي', desc: 'Once per day', desc_ar: 'مرة كل يوم',
      trials: 12, lives: 0, daily: true, lvl: () => 5, digitShow: 950, digitGap: 280, shape: null,
      locked: () => H().dailyDone(),
      onEnd: (s) => H().dailyAdd({ score: s.totalScore, span: s.maxSpan, acc: s.accuracy })
    }
  };
  window.DigitSpanExtraModes = {
    list: Object.keys(MODES),
    get: id => MODES[id],
    install: api => { Object.keys(MODES).forEach(id => { if (!api.CONFIG.modes[id]) api.CONFIG.modes[id] = MODES[id]; }); return api; }
  };
})();