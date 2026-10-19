/* ═══════════════════════════════════════════════════════════
   FLASH — Verbal Analogies Stages
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
      id: 'streak-master',
      name: 'Streak Master',
      icon: '🎯',
      desc: 'Reach a 10-streak in Classic mode',
      check: (s) => (s.maxStreak || 0) >= 10
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 12+ correct in Speed mode',
      check: (s) => s.mode === 'speed' && (s.totalCorrect || 0) >= 12
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      icon: '💎',
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
      id: 'analogy-master',
      name: 'Analogy Master',
      icon: '👑',
      desc: 'Reach Level 12+ with 90%+ accuracy',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 12 && (s.accuracy || 0) >= 90
    }
  ];

  window.VerbalAnalogiesStages = STAGES;
})();