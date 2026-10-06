/* ═══════════════════════════════════════════════════════════
   FLASH — Symbol Sprint Stages
   8 progressive stages covering all modes
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STAGES = [
    {
      id: 'apprentice',
      name: 'Apprentice',
      icon: '🥉',
      desc: 'Reach Level 5 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 5
    },
    {
      id: 'journeyman',
      name: 'Journeyman',
      icon: '🥈',
      desc: 'Reach Level 10 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 10
    },
    {
      id: 'adept',
      name: 'Adept',
      icon: '🥇',
      desc: 'Reach Level 15 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 15
    },
    {
      id: 'parallel-scanner',
      name: 'Parallel Scanner',
      icon: '👁️',
      desc: 'Achieve search slope under 30ms/item',
      check: (s) => s.searchSlope > 0 && s.searchSlope < 30 && (s.accuracy || 0) >= 80
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 10+ correct in Speed mode',
      check: (s) => s.mode === 'speed' && (s.totalCorrect || 0) >= 10
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      icon: '🎯',
      desc: 'Achieve 100% accuracy',
      check: (s) => (s.accuracy || 0) >= 100
    },
    {
      id: 'endless-runner',
      name: 'Endless Runner',
      icon: '🏃',
      desc: 'Reach Level 6 in Endless mode',
      check: (s) => s.mode === 'endless' && (s.levelReached || 0) >= 6
    },
    {
      id: 'visual-master',
      name: 'Visual Master',
      icon: '👑',
      desc: 'Beat PB with 12+ levels, 90%+ accuracy & slope under 50',
      check: (s) => s.mode === 'classic' && s.isNewPB && (s.maxLevel || 0) >= 12 && (s.accuracy || 0) >= 90 && s.searchSlope > 0 && s.searchSlope < 50
    }
  ];

  window.SymbolSprintStages = STAGES;
})();