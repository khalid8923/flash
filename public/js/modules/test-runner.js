// FLASH - Automated Game Testing Runner
document.addEventListener('DOMContentLoaded', () => {
  console.log('[TestRunner] Initializing 42-game sanity check...');
  const games = ['flanker', 'go-no-go', 'task-switching', 'vigilance', 'mental-rotation', 'corsi-blocks', 'map-memory', 'block-counter', 'reaction', 'color-match', 'symbol-sprint', 'rapid-fire', 'n-back', 'face-match', 'pattern-recall', 'seq-mem', 'flash-cards', 'matrix-logic', 'syllogisms', 'deduction', 'argument-analyzer', 'truth-tbl', 'lexical-decision', 'vocabulary-elite', 'verbal-analogies', 'word-scramble', 'alternative-uses', 'creative-connect', 'story-spark', 'idea-flow', 'micro-expressions', 'tone-detector', 'empathy-engine', 'social-read', 'hanoi', 'river-crossing', 'gear-logic', 'path-finder', 'digit-span', 'mental-math', 'num-chains', 'speed-calc'];
  let passed = 0;
  games.forEach(g => {
     fetch('games/' + g + '/game.html', { method: 'HEAD' })
       .then(res => { if(res.ok) passed++; else console.error('[TestRunner] FAILED:', g); })
       .catch(() => console.error('[TestRunner] ERROR:', g));
  });
  setTimeout(() => console.log('[TestRunner] Passed ' + passed + '/42 games.'), 3000);
});
