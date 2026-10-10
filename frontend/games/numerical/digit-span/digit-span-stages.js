/* digit-span-stages.js — 8 progressive stages */
(function () {
  'use strict';
  function stg(id, en, ar, den, dar, icon, fn) {
    return {
      id, icon,
      name: en, desc: den,
      n: [en, ar], d: [den, dar],
      test: fn, check: fn
    };
  }
  window.DigitSpanStages = {
    game: 'digit-span',
    list: [
      stg('apprentice', 'Apprentice', 'متدرّب', 'Reach level 5', 'بلغ المستوى ٥', '🥉',
        s => s.mode === 'classic' && s.maxLevel >= 5),
      stg('journeyman', 'Journeyman', 'ماهر', 'Reach level 10', 'بلغ المستوى ١٠', '🥈',
        s => s.mode === 'classic' && s.maxLevel >= 10),
      stg('adept', 'Adept', 'بارع', 'Reach level 12', 'بلغ المستوى ١٢', '🥇',
        s => s.mode === 'classic' && s.maxLevel >= 12),
      stg('specialist', 'Specialist', 'متخصص', 'Max span of 6+', 'مدى ٦ أو أعلى', '🎯',
        s => s.maxSpan >= 6),
      stg('sprinter', 'Sprinter', 'عدّاء', 'Speed mode at 85%', 'وضع السرعة بدقة ٨٥٪', '⚡',
        s => s.mode === 'speed' && s.accuracy >= 85),
      stg('perfectionist', 'Perfectionist', 'مُتقِن', '100% over 5+ levels', 'دقة ١٠٠٪ في ٥+', '💎',
        s => s.n >= 5 && s.accuracy === 100),
      stg('endless', 'Endless Runner', 'عدّاء بلا حدود', 'Level 4 in Endless', 'المستوى ٤ في بلا نهاية', '🏃',
        s => s.mode === 'endless' && s.maxLevel >= 4),
      stg('master', 'Master', 'أستاذ', 'Beat your best at span 8+', 'تجاوز رقمك عند مدى ٨+', '👑',
        s => s.isNewPB && s.prevPB > 0 && s.maxSpan >= 8)
    ]
  };
})();