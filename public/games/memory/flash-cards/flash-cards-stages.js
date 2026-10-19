/* flash-cards-stages.js — 8 progressive stages */
(function () {
  'use strict';
  function stg(id, en, ar, den, dar, icon, fn) {
    return { id, icon, name: en, desc: den, n: [en, ar], d: [den, dar], test: fn, check: fn };
  }
  window.FlashCardsStages = {
    game: 'flash-cards',
    list: [
      stg('apprentice', 'Apprentice', 'متدرّب', 'Reach level 5', 'بلغ المستوى ٥', '🥉',
        s => s.mode === 'classic' && s.maxLevel >= 5),
      stg('journeyman', 'Journeyman', 'ماهر', 'Reach level 8', 'بلغ المستوى ٨', '🥈',
        s => s.mode === 'classic' && s.maxLevel >= 8),
      stg('adept', 'Adept', 'بارع', 'Reach level 10', 'بلغ المستوى ١٠', '🥇',
        s => s.mode === 'classic' && s.maxLevel >= 10),
      stg('specialist', 'Specialist', 'متخصص', '7+ tiles correctly recalled', 'استرجاع ٧ بلاطات أو أكثر', '🎯',
        s => s.maxTiles >= 7),
      stg('sprinter', 'Sprinter', 'عدّاء', 'Speed mode at 85%', 'وضع السرعة بدقة ٨٥٪', '⚡',
        s => s.mode === 'speed' && s.accuracy >= 85),
      stg('perfectionist', 'Perfectionist', 'مُتقِن', '100% over 5+ levels', 'دقة ١٠٠٪ في ٥+ مستويات', '💎',
        s => s.n >= 5 && s.accuracy === 100),
      stg('endless', 'Endless Runner', 'عدّاء بلا حدود', 'Level 5 in Endless', 'المستوى ٥ في بلا نهاية', '🏃',
        s => s.mode === 'endless' && s.maxLevel >= 5),
      stg('master', 'Master', 'أستاذ', 'Beat your best at level 8+', 'تجاوز رقمك عند مستوى ٨+', '👑',
        s => s.isNewPB && s.prevPB > 0 && s.maxLevel >= 8)
    ]
  };
})();