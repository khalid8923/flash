/* ═══════════════════════════════════════════════════════════
   FLASH — Flash Cards Game (Memory Domain)
   Grid-based visual memory task. User must reproduce the
   pattern of lit cells.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CONFIG = {
    gridSize: 4,           // 4x4 = 16 cells
    startCells: 3,         // Level 1 starts with 3 lit cells
    maxLevels: 10,
    showDuration: 1400,    // ms cards stay lit
    gapBetweenFlashes: 200,// ms between each flash
    maxLives: 3
  };

  const state = {
    level: 1,
    lives: 3,
    phase: 'idle',
    targetCells: [],       // indices of lit cells this round
    selectedCells: [],     // indices user has clicked
    results: [],           // {level, correct, wrong, time}
    timeoutIds: [],
    onComplete: null
  };

  let elStage, elLevel, elLives, elContent, elHint;

  const $ = (id) => document.getElementById(id);

  // ─── Utilities ───
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
  }

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      state.timeoutIds.push(id);
    });
  }

  function pickRandomCells(count) {
    const total = CONFIG.gridSize * CONFIG.gridSize;
    const pool = Array.from({ length: total }, (_, i) => i);
    const picked = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picked;
  }

  function cellsForLevel(level) {
    return CONFIG.startCells + (level - 1);
  }

  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
  }

  function render(html) {
    elContent.innerHTML = html;
  }

  // ─── Render helpers ───
  function renderGrid(interactive) {
    const total = CONFIG.gridSize * CONFIG.gridSize;
    let cells = '';
    for (let i = 0; i < total; i++) {
      const disabled = interactive ? '' : 'disabled';
      cells += `<div class="cell ${disabled}" data-idx="${i}"></div>`;
    }
    render(`<div class="grid-wrap">${cells}</div>`);

    if (interactive) {
      elContent.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => onCellClick(cell));
      });
    }
  }

  function renderLevelDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevels; i++) {
      let cls = '';
      const r = state.results.find(x => x.level === i);
      if (r) cls = r.correct ? 'done' : 'fail';
      dots += `<span class="level-dot ${cls}"></span>`;
    }
    return `<div class="level-dots">${dots}</div>`;
  }

  // ─── Game flow ───
  function showIdle() {
    setPhase('idle');
    render(`
      <div class="phase-title">Memory Domain · Visual Recall</div>
      <h1 class="phase-headline grd">Flash Cards</h1>
      <p class="phase-sub">
        Watch the lit tiles carefully. When they fade,
        <strong style="color:#00EEFF">click the tiles that were lit</strong>.
        <br><br>
        Each level adds one more tile. You have <strong>3 lives</strong>.
      </p>
      <button class="big-btn" id="start-btn">Start Test</button>
      <p class="phase-hint" style="margin-top:16px;">Or press <kbd>Space</kbd></p>
    `);
    $('start-btn').addEventListener('click', (e) => { e.stopPropagation(); startLevel(); });
  }

  async function startLevel() {
    clearAllTimeouts();
    setPhase('showing');
    const count = cellsForLevel(state.level);
    state.targetCells = pickRandomCells(count);
    state.selectedCells = [];

    // Show empty grid briefly
    render(`
      ${renderLevelDots()}
      <div class="phase-title">Level ${state.level}</div>
      <h2 class="phase-headline">Memorize ${count} tiles</h2>
      <p class="phase-sub" style="margin-bottom:20px;">Watch carefully...</p>
      <div class="grid-wrap">
        ${Array.from({length: CONFIG.gridSize * CONFIG.gridSize}, (_, i) => `<div class="cell" data-idx="${i}"></div>`).join('')}
      </div>
    `);

    await wait(600);

    // Flash cells one by one
    for (const idx of state.targetCells) {
      const cell = elContent.querySelector(`.cell[data-idx="${idx}"]`);
      if (cell) cell.classList.add('lit');
      await wait(CONFIG.gapBetweenFlashes);
    }

    // Hold all lit for showDuration
    await wait(CONFIG.showDuration);

    // Turn off all
    elContent.querySelectorAll('.cell.lit').forEach(c => c.classList.remove('lit'));
    await wait(400);

    // Switch to input phase
    startInputPhase();
  }

  function startInputPhase() {
    setPhase('input');
    const count = state.targetCells.length;
    render(`
      ${renderLevelDots()}
      <div class="phase-title">Level ${state.level}</div>
      <h2 class="phase-headline">Click ${count} tiles</h2>
      <p class="phase-sub" style="margin-bottom:20px;">Select the tiles you saw</p>
      <div class="grid-wrap">
        ${Array.from({length: CONFIG.gridSize * CONFIG.gridSize}, (_, i) => `<div class="cell" data-idx="${i}"></div>`).join('')}
      </div>
    `);
    elContent.querySelectorAll('.cell').forEach(cell => {
      cell.addEventListener('click', () => onCellClick(cell));
    });
  }

  function onCellClick(cell) {
    if (state.phase !== 'input') return;
    if (cell.classList.contains('correct') || cell.classList.contains('wrong')) return;
    if (cell.classList.contains('disabled')) return;

    const idx = parseInt(cell.dataset.idx, 10);
    const isCorrect = state.targetCells.includes(idx);

    if (isCorrect) {
      cell.classList.add('correct');
      state.selectedCells.push(idx);
    } else {
      cell.classList.add('wrong');
      cell.classList.add('disabled');
      state.selectedCells.push(idx);
    }

    // Check if all found
    const found = state.selectedCells.filter(i => state.targetCells.includes(i)).length;
    const wrongCount = state.selectedCells.length - found;

    if (wrongCount > 0) {
      endLevel(false);
      return;
    }

    if (found === state.targetCells.length) {
      endLevel(true);
    }
  }

  function endLevel(passed) {
    state.results.push({
      level: state.level,
      correct: passed,
      target: state.targetCells.length,
      wrong: state.selectedCells.length - state.targetCells.length
    });

    if (passed) {
      setPhase('feedback');
      render(`
        ${renderLevelDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Complete</h2>
        <p class="phase-sub">You recalled ${state.targetCells.length} tiles correctly.</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevels ? 'Next level in 1.5s...' : 'You reached the top level!'}</p>
      `);

      setTimeout(() => {
        if (state.level < CONFIG.maxLevels) {
          state.level++;
          elLevel.textContent = state.level;
          startLevel();
        } else {
          completeGame();
        }
      }, 1500);
    } else {
      state.lives--;
      elLives.textContent = state.lives;

      setPhase('feedback');
      render(`
        ${renderLevelDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Missed One</h2>
        <p class="phase-sub">
          You had <strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} left.
        </p>
        <p class="phase-hint">${state.lives > 0 ? 'Retrying level in 1.5s...' : 'Game over...'}</p>
      `);

      setTimeout(() => {
        if (state.lives > 0) {
          startLevel();
        } else {
          completeGame();
        }
      }, 1500);
    }
  }

  function completeGame() {
    setPhase('complete');
    const maxLevel = state.level;
    const passedLevels = state.results.filter(r => r.correct).length;
    const accuracy = state.results.length
      ? Math.round((passedLevels / state.results.length) * 100)
      : 0;

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      <div class="complete-stats">
        <div class="complete-stat">
          <div class="complete-stat-label">MAX LEVEL</div>
          <div class="complete-stat-value">${maxLevel}</div>
        </div>
        <div class="complete-stat">
          <div class="complete-stat-label">PASSED</div>
          <div class="complete-stat-value">${passedLevels}</div>
        </div>
        <div class="complete-stat">
          <div class="complete-stat-label">ACCURACY</div>
          <div class="complete-stat-value">${accuracy}%</div>
        </div>
      </div>
      <button class="big-btn" id="restart-btn">Try Again</button>
    `);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); resetGame(); });

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'flash-cards',
        domain: 'memory',
        maxLevel,
        passedLevels,
        accuracy,
        totalAttempts: state.results.length,
        results: state.results.slice(),
        score: maxLevel * 100 + accuracy
      });
    }
  }

  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.results = [];
    state.targetCells = [];
    state.selectedCells = [];

    elLevel.textContent = '1';
    elLives.textContent = String(CONFIG.maxLives);

    showIdle();
  }

  // ─── Mount ───
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!root) { console.error('[FlashCards] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-logo">
            <span class="g-logo-icon">⚡</span>
            <span class="g-logo-text">FLASH</span>
          </div>
          <div class="g-meta">
            <span class="g-meta-item">
              <span class="g-meta-label">LEVEL</span>
              <span class="g-meta-value" id="level-display">1</span>
            </span>
            <span class="g-meta-item">
              <span class="g-meta-label">LIVES</span>
              <span class="g-meta-value" id="lives-display">3</span>
            </span>
          </div>
        </header>
        <main id="stage" class="stage" data-phase="idle">
          <div class="stage-inner"><div id="phase-content"></div></div>
        </main>
        <footer class="g-footer">
          <div class="g-hint">Press <kbd>Space</kbd> or click to continue</div>
        </footer>
      </div>
    `;

    elStage   = $('stage');
    elLevel   = $('level-display');
    elLives   = $('lives-display');
    elContent = $('phase-content');

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle') startLevel();
        else if (state.phase === 'complete') resetGame();
      }
    });

    if (typeof options.onComplete === 'function') state.onComplete = options.onComplete;

    showIdle();
  }

  function autoInit() {
    if (!document.getElementById('game-root')) return;
    if (!document.getElementById('phase-content')) return;

    elStage   = document.getElementById('stage');
    elLevel   = document.getElementById('level-display');
    elLives   = document.getElementById('lives-display');
    elContent = document.getElementById('phase-content');

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle') startLevel();
        else if (state.phase === 'complete') resetGame();
      }
    });

    showIdle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.FlashCardsGame = { mount, reset: resetGame, state };
})();