/* ═══════════════════════════════════════════════════════════
   FLASH — Face Match Stages
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
      id: 'face-reader',
      name: 'Face Reader',
      icon: '👤',
      desc: 'Remember 5+ faces in one round',
      check: (s) => (s.maxFaces || 0) >= 5
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Match 10+ names in Speed mode',
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
      id: 'associative-master',
      name: 'Associative Master',
      icon: '👑',
      desc: 'Remember 7+ faces with 12+ levels',
      check: (s) => s.mode === 'classic' && (s.maxFaces || 0) >= 7 && (s.maxLevel || 0) >= 12
    }
  ];

  window.FaceMatchStages = STAGES;
})();