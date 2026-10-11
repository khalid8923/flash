/* truth-tbl-stages.js — 8 progressive stages */
(function () {
  'use strict';
  function stg(id, en, ar, den, dar, icon, fn) {
    return { id, icon, name: en, desc: den, n: [en, ar], d: [den, dar], test: fn, check: fn };
  }
  window.TruthTblStages = {
    game: 'truth-tbl',
    list: [
      stg('apprentice', 'Apprentice', 'متدرّب', 'Reach level 5', 'بلغ المستوى ٥', '🥉',
        s => s.mode === 'classic' && s.maxLevel >= 5),
      stg('journeyman', 'Journeyman', 'ماهر', 'Reach level 10', 'بلغ المستوى ١٠', '🥈',
        s => s.mode === 'classic' && s.maxLevel >= 10),
      stg('adept', 'Adept', 'بارع', 'Reach level 15', 'بلغ المستوى ١٥', '🥇',
        s => s.mode === 'classic' && s.maxLevel >= 15),
      stg('specialist', 'Specialist', 'متخصص', 'Average RT under 3s', 'متوسط زمن أقل من ٣ ثوان', '🎯',
        s => s.medianRT > 0 && s.medianRT < 3000),
      stg('sprinter', 'Sprinter', 'عدّاء', 'Speed mode at 85%', 'وضع السرعة بدقة ٨٥٪', '⚡',
        s => s.mode === 'speed' && s.accuracy >= 85),
      stg('perfectionist', 'Perfectionist', 'مُتقِن', '100% over 5+ rounds', 'دقة ١٠٠٪ في ٥+ جولات', '💎',
        s => s.n >= 5 && s.accuracy === 100),
      stg('endless', 'Endless Runner', 'عدّاء بلا حدود', 'Level 6 in Endless', 'المستوى ٦ في بلا نهاية', '🏃',
        s => s.mode === 'endless' && s.maxLevel >= 6),
      stg('master', 'Master', 'أستاذ', 'Beat your best at level 12+', 'تجاوز رقمك عند مستوى ١٢+', '👑',
        s => s.isNewPB && s.prevPB > 0 && s.maxLevel >= 12)
    ]
  };
})();