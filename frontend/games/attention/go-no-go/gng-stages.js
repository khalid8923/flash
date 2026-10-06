/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Stages Definition
   8 progressive stages covering all modes
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STAGES = [
    {
      id: 'apprentice',
      name: 'Apprentice',
      icon: '🥉',
      desc: 'Reach Level 3 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 3
    },
    {
      id: 'journeyman',
      name: 'Journeyman',
      icon: '🥈',
      desc: 'Reach Level 6 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 6
    },
    {
      id: 'adept',
      name: 'Adept',
      icon: '🥇',
      desc: 'Reach Level 10 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 10
    },
    {
      id: 'master',
      name: 'Master',
      icon: '👑',
      desc: 'Reach Level 15 in Classic mode',
      check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 15
    },
    {
      id: 'sentinel',
      name: 'Sentinel',
      icon: '⏱️',
      desc: 'Complete SART with d\' ≥ 2.0',
      check: (s) => s.mode === 'sart' && (s.dPrime || 0) >= 2.0
    },
    {
      id: 'contrarian',
      name: 'Contrarian',
      icon: '🔄',
      desc: 'Complete Reversed mode with 85%+',
      check: (s) => s.mode === 'reversed' && s.won && (s.accuracy || 0) >= 85
    },
    {
      id: 'reader',
      name: 'Reader',
      icon: '🎴',
      desc: 'Complete Cued mode with d\' ≥ 2.5',
      check: (s) => s.mode === 'cued' && (s.dPrime || 0) >= 2.5
    },
    {
      id: 'shifter',
      name: 'Shifter',
      icon: '🔀',
      desc: 'Complete Rule-Switching with 80%+',
      check: (s) => s.mode === 'rule-switching' && (s.accuracy || 0) >= 80
    }
  ];

  window.GNGStages = STAGES;
})();