/* ============================================================
   FLASH — Idea Flow · Stages (8 progressive)
   ============================================================ */
(function () {
  'use strict';

  window.IdeaFlowStages = [
    { id: 'apprentice',     name: 'Apprentice',     icon: '🥉', desc: 'Reach Level 5 in Classic mode',           check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 5 },
    { id: 'journeyman',     name: 'Journeyman',     icon: '🥈', desc: 'Reach Level 10 in Classic mode',          check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 10 },
    { id: 'adept',          name: 'Adept',          icon: '🥇', desc: 'Reach Level 15 in Classic mode',          check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 15 },
    { id: 'specialist',     name: 'Specialist',     icon: '🎯', desc: 'Generate 20+ ideas in one session',       check: (s) => (s.fluency || 0) >= 20 },
    { id: 'sprinter',       name: 'Sprinter',       icon: '⚡', desc: 'Score 70%+ novelty in Speed mode',        check: (s) => s.mode === 'speed' && (s.novelty || 0) >= 70 },
    { id: 'perfectionist',  name: 'Perfectionist',  icon: '💎', desc: 'Achieve 90%+ novelty in any mode',        check: (s) => (s.novelty || 0) >= 90 },
    { id: 'endless-runner', name: 'Endless Runner', icon: '🏃', desc: 'Reach Level 6 in Endless mode',           check: (s) => s.mode === 'endless' && (s.maxLevel || 0) >= 6 },
    { id: 'master',         name: 'Master',         icon: '👑', desc: 'Beat your PB with Level 12+',             check: (s) => s.isNewPB === true && (s.maxLevel || 0) >= 12 }
  ];

  window.IdeaFlowStages.PREVIEW = {
    game: 'idea-flow',
    domain: 'creativity',
    paradigm: 'Guilford 1967 — Divergent thinking / fluency'
  };
})();