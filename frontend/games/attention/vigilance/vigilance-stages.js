/* ═══════════════════════════════════════════════════════════
   FLASH — Vigilance Stages
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
      id: 'signal-detector',
      name: 'Signal Detector',
      icon: '📡',
      desc: 'Reach d\' of 3.0 or higher',
      check: (s) => (s.dPrime || 0) >= 3.0
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 15+ hits in Speed mode',
      check: (s) => s.mode === 'speed' && (s.totalHits || 0) >= 15
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
      id: 'sustained-master',
      name: 'Sustained Master',
      icon: '👑',
      desc: 'Beat a PB with 12+ levels in Classic',
      check: (s) => s.mode === 'classic' && s.isNewPB && (s.maxLevel || 0) >= 12
    }
  ];

  window.VigilanceStages = STAGES;
})();