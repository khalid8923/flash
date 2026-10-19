/* ============================================================
   FLASH — Argument Analyzer · Stages
   8 progressive stages — follows FLASH standard template
   ============================================================ */
(function () {
  'use strict';

  window.ArgumentAnalyzerStages = [
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
      id: 'specialist',
      name: 'Specialist',
      icon: '🎯',
      desc: 'Detect 20 fallacies correctly in one session',
      check: (s) => (s.correctCount || 0) >= 20 && s.mode === 'classic'
    },
    {
      id: 'sprinter',
      name: 'Sprinter',
      icon: '⚡',
      desc: 'Score 80%+ accuracy in Speed mode',
      check: (s) => s.mode === 'speed' && (s.accuracy || 0) >= 80
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      icon: '💎',
      desc: 'Achieve 100% accuracy in any mode',
      check: (s) => (s.accuracy || 0) === 100 && (s.maxLevel || 0) >= 5
    },
    {
      id: 'endless-runner',
      name: 'Endless Runner',
      icon: '🏃',
      desc: 'Reach Level 6 in Endless mode',
      check: (s) => s.mode === 'endless' && (s.maxLevel || 0) >= 6
    },
    {
      id: 'master',
      name: 'Master',
      icon: '👑',
      desc: 'Beat your PB with Level 12+',
      check: (s) => s.isNewPB === true && (s.maxLevel || 0) >= 12
    }
  ];

  /* Preview helper — used by dashboard to show what's next */
  window.ArgumentAnalyzerStages.PREVIEW = {
    game: 'argument-analyzer',
    domain: 'logic',
    paradigm: 'Abrami 2015 — Critical thinking / fallacy detection'
  };

})();