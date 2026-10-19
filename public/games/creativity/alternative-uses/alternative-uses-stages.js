/* ═══════════════════════════════════════════════════════════
   FLASH — Alternative Uses Stages
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
      id: 'divergent',
      name: 'Divergent Mind',
      icon: '💡',
      desc: 'Reach 90% novelty selection rate',
      check: (s) => (s.noveltyRate || 0) >= 90
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 15+ correct in Speed mode',
      check: (s) => s.mode === 'speed' && (s.totalCorrect || 0) >= 15
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
      id: 'creative-genius',
      name: 'Creative Genius',
      icon: '👑',
      desc: 'Beat 5 personal bests',
      check: (s) => s.mode === 'classic' && s.isNewPB && (s.maxLevel || 0) >= 12
    }
  ];

  window.AlternativeUsesStages = STAGES;
})();