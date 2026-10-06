/* ═══════════════════════════════════════════════════════════
   FLASH — Reaction Stages
   8 progressive stages covering all modes
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STAGES = [
    {
      id: 'warm-up',
      name: 'Warm-Up',
      icon: '🥉',
      desc: 'Achieve median RT under 400ms',
      check: (s) => s.mode === 'classic' && (s.medianRT || 9999) < 400 && (s.medianRT || 0) > 0
    },
    {
      id: 'quick',
      name: 'Quick',
      icon: '🥈',
      desc: 'Achieve median RT under 350ms',
      check: (s) => s.mode === 'classic' && (s.medianRT || 9999) < 350 && (s.medianRT || 0) > 0
    },
    {
      id: 'fast',
      name: 'Fast',
      icon: '🥇',
      desc: 'Achieve median RT under 300ms',
      check: (s) => s.mode === 'classic' && (s.medianRT || 9999) < 300 && (s.medianRT || 0) > 0
    },
    {
      id: 'reflex',
      name: 'Reflex',
      icon: '⚡',
      desc: 'Fastest RT under 200ms',
      check: (s) => (s.fastestRT || 9999) < 200 && (s.fastestRT || 0) > 0
    },
    {
      id: 'elite',
      name: 'Elite',
      icon: '💎',
      desc: 'Median RT under 250ms',
      check: (s) => (s.medianRT || 9999) < 250 && (s.medianRT || 0) > 0
    },
    {
      id: 'consistent',
      name: 'Consistent',
      icon: '🎯',
      desc: 'RTV under 30ms with median under 350ms',
      check: (s) => (s.rtv || 9999) < 30 && (s.rtv || 0) > 0 && (s.medianRT || 9999) < 350
    },
    {
      id: 'endless-runner',
      name: 'Endless Runner',
      icon: '🏃',
      desc: 'Reach Level 6 in Endless mode',
      check: (s) => s.mode === 'endless' && (s.levelReached || 0) >= 6
    },
    {
      id: 'superhuman',
      name: 'Superhuman',
      icon: '👑',
      desc: 'Beat PB with median under 220ms',
      check: (s) => s.mode === 'classic' && s.isNewPB && (s.medianRT || 9999) < 220 && (s.medianRT || 0) > 0
    }
  ];

  window.ReactionStages = STAGES;
})();