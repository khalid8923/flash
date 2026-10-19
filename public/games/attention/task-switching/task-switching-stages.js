/* ═══════════════════════════════════════════════════════════
   FLASH — Task Switching Stages
   8 progressive stages
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
      id: 'flexible',
      name: 'Flexible Mind',
      icon: '🧠',
      desc: 'Achieve switch cost under 100ms',
      check: (s) => s.switchCost !== null && s.switchCost !== undefined && s.switchCost < 100 && s.switchCost >= 0
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 30+ correct in Rule Rush',
      check: (s) => s.mode === 'rule-rush' && (s.totalCorrect || 0) >= 30
    },
    {
      id: 'precision',
      name: 'Precision',
      icon: '🎯',
      desc: 'Achieve 98%+ accuracy',
      check: (s) => (s.accuracy || 0) >= 98
    },
    {
      id: 'endless-runner',
      name: 'Endless Runner',
      icon: '🏃',
      desc: 'Reach Level 8 in Endless',
      check: (s) => s.mode === 'endless' && (s.levelReached || 0) >= 8
    },
    {
      id: 'champion',
      name: 'Champion',
      icon: '👑',
      desc: 'Complete 5 Challenges',
      check: (s) => s.mode === 'challenge' && s.success && (s.challengeIndex || 0) >= 5
    }
  ];

  window.TaskSwitchingStages = STAGES;
})();