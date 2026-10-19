/* flash-cards-extra-modes.js — Speed, Endless, Precision, Daily */
(function () {
  'use strict';
  const H = () => window.FlashCardsHelpers;
  const MODES = {
    classic: {
      id: 'classic', name: 'Classic', name_ar: 'كلاسيكي',
      desc: '10 levels, 3 lives', desc_ar: '١٠ مستويات، ٣ فرص',
      maxLevels: 10, lives: 3,
      flashMs: 1400, gapMs: 200,
      startTiles: 3, tilesPerLevel: 1
    },
    speed: {
      id: 'speed', name: 'Speed', name_ar: 'سرعة',
      desc: 'Short flash, tight', desc_ar: 'وميض أقصر، أضيق',
      maxLevels: 10, lives: 0, penalty: 100,
      flashMs: 700, gapMs: 100,
      startTiles: 3, tilesPerLevel: 1
    },
    endless: {
      id: 'endless', name: 'Endless', name_ar: 'بلا نهاية',
      desc: 'One mistake ends it', desc_ar: 'خطأ واحد ينتهي',
      maxLevels: Infinity, lives: 1,
      flashMs: 1400, gapMs: 200,
      startTiles: 3, tilesPerLevel: 1
    },
    precision: {
      id: 'precision', name: 'Precision', name_ar: 'دقة',
      desc: 'No rush, max accuracy', desc_ar: 'بلا ضغط، أقصى دقة',
      maxLevels: 15, lives: 0,
      flashMs: 2200, gapMs: 300,
      startTiles: 3, tilesPerLevel: 1
    },
    daily: {
      id: 'daily', name: 'Daily', name_ar: 'يومي',
      desc: 'Once per day', desc_ar: 'مرة كل يوم',
      maxLevels: 10, lives: 0, daily: true,
      flashMs: 1400, gapMs: 200,
      startTiles: 3, tilesPerLevel: 1,
      locked: () => H().dailyDone(),
      onEnd: (s) => H().dailyAdd({ score: s.totalScore, level: s.maxLevel, acc: s.accuracy })
    }
  };
  window.FlashCardsExtraModes = {
    list: Object.keys(MODES),
    get: id => MODES[id],
    install: api => { Object.keys(MODES).forEach(id => { if (!api.CONFIG.modes[id]) api.CONFIG.modes[id] = MODES[id]; }); return api; }
  };
})();