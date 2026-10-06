/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Stages Definition
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
      id: 'runner',
      name: 'Endless Runner',
      icon: '⚡',
      desc: 'Reach Level 5 in Endless mode',
      check: (s) => s.mode === 'endless' && (s.levelReached || 0) >= 5
    },
    {
      id: 'challenger',
      name: 'Challenger',
      icon: '🏆',
      desc: 'Complete Challenge 5',
      check: (s) => {
        if (s.mode !== 'challenge' || !s.success) return false;
        // Challenge index is the one just completed
        return (s.challengeIndex || 0) >= 5;
      }
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⏱️',
      desc: 'Score 25+ correct in Time Attack',
      check: (s) => s.mode === 'time-attack' && (s.totalCorrect || 0) >= 25
    },
    {
      id: 'boss-slayer',
      name: 'Boss Slayer',
      icon: '👹',
      desc: 'Defeat the Boss Fight',
      check: (s) => s.mode === 'boss' && s.won === true
    },
    {
      id: 'contrarian',
      name: 'Contrarian',
      icon: '🔄',
      desc: 'Complete Reverse mode',
      check: (s) => s.mode === 'reverse' && s.won === true
    }
  ];

  window.FlankerStages = STAGES;
})();