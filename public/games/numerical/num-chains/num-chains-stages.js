/* ============================================================
   FLASH — Num Chains · Stages (8 progressive)
   ============================================================ */
(function () {
  'use strict';

  window.NumChainsStages = [
    { id: 'apprentice',     name: 'Apprentice',     icon: '🥉', desc: 'Reach Level 5 in Classic mode',           check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 5 },
    { id: 'journeyman',     name: 'Journeyman',     icon: '🥈', desc: 'Reach Level 10 in Classic mode',          check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 10 },
    { id: 'adept',          name: 'Adept',          icon: '🥇', desc: 'Reach Level 15 in Classic mode',          check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 15 },
    { id: 'specialist',     name: 'Specialist',     icon: '🎯', desc: 'Complete a 6-step chain correctly',       check: (s) => (s.maxChainLength || 0) >= 6 },
    { id: 'sprinter',       name: 'Sprinter',       icon: '⚡', desc: 'Score 85%+ in Speed mode',                 check: (s) => s.mode === 'speed' && (s.accuracy || 0) >= 85 },
    { id: 'perfectionist',  name: 'Perfectionist',  icon: '💎', desc: 'Achieve 100% accuracy at Level 5+',       check: (s) => (s.accuracy || 0) === 100 && (s.maxLevel || 0) >= 5 },
    { id: 'endless-runner', name: 'Endless Runner', icon: '🏃', desc: 'Reach Level 6 in Endless mode',           check: (s) => s.mode === 'endless' && (s.maxLevel || 0) >= 6 },
    { id: 'master',         name: 'Master',         icon: '👑', desc: 'Beat your PB with Level 12+',             check: (s) => s.isNewPB === true && (s.maxLevel || 0) >= 12 }
  ];

  window.NumChainsStages.PREVIEW = {
    game: 'num-chains',
    domain: 'numerical',
    paradigm: 'Kyllonen 1990 — Working memory / numerical chains'
  };
})();