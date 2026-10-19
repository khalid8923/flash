/* ═══════════════════════════════════════════════════════════
   FLASH — {{GAME_NAME}} Stages
   Define 6-8 progressive stages
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // TODO: customize these stages for your game
  // Guidelines:
  // - 6-8 stages
  // - First 3-4 = difficulty progression in main mode
  // - Last 3-4 = accomplishments in other modes
  // - Each check(s) receives the session payload
  // - Icons: 🥉 🥈 🥇 👑 🏆 ⭐ ⚡ 🎯

  const STAGES = [
    {
      id: 'starter',
      name: 'Starter',
      icon: '🥉',
      desc: 'Reach Level 3 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 3
    },
    {
      id: 'learner',
      name: 'Learner',
      icon: '🥈',
      desc: 'Reach Level 7 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 7
    },
    {
      id: 'expert',
      name: 'Expert',
      icon: '🥇',
      desc: 'Reach Level 12 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 12
    },
    {
      id: 'master',
      name: 'Master',
      icon: '👑',
      desc: 'Reach Level 15 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 15
    },
    {
      id: 'daily-warrior',
      name: 'Daily Warrior',
      icon: '⭐',
      desc: 'Complete the Daily Challenge',
      check: (s) => s.mode === 'daily'
    },
    {
      id: 'perfect',
      name: 'Perfectionist',
      icon: '💎',
      desc: 'Achieve 100% accuracy',
      check: (s) => (s.accuracy || 0) >= 100
    },
    {
      id: 'speedster',
      name: 'Speedster',
      icon: '⚡',
      desc: 'Median RT under 400ms with 90%+ accuracy',
      check: (s) => (s.medianRT || 9999) < 400 && (s.accuracy || 0) >= 90
    },
    {
      id: 'dedicated',
      name: 'Dedicated',
      icon: '🏆',
      desc: 'Complete 20 sessions',
      check: (s) => (s.totalSessions || 0) >= 20
    }
  ];

  window.__CAMEL_STAGES__ = STAGES;
})();