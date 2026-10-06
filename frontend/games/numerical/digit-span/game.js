/* ═══════════════════════════════════════════════════════════
   FLASH — Backward Digit Span Game (Numerical Domain)
   ─────────────────────────────────────────────────────────
   Scientific basis:
   - Wechsler Adult Intelligence Scale (WAIS-IV) — Digit Span
     subtest is one of the most widely used measures of working
     memory.
   - Backward Digit Span specifically requires holding digits in
     working memory AND manipulating them (reversing order),
     which correlates strongly with fluid reasoning.

   Mechanic:
   - Digits appear one at a time.
   - User must enter them in REVERSE order.
   - Span increases by 1 each level (starting at 3).
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    maxLives: 3,
    maxLevel: 12,
    startDigits: 3,
    digitShowDuration: 950,
    digitGapDuration: 280,
    maxInputLength: 15,
    correctBase: 100,
    streakBonus: 40
  };

  // ─── State ───
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    phase: 'idle',
    sequence: [],                // original forward sequence
    expected: [],                // reversed (what user must enter)
    userInput: [],
    results: [],
    streak: 0,
    maxStreak: 0,
    totalScore: 0,
    timeoutIds: [],
    onComplete: null
  };

  // ─── DOM refs ───
  let elStage, elLevel, elSpan, elLives, elContent, elHintBar;

  const $ = (id) => document.getElementById(id);

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
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

  function digitsForLevel(level) {
    return CONFIG.startDigits + (level - 1);
  }

  function generateDigit(excludeLast) {
    let d;
    let attempts = 0;
    do {
      d = Math.floor(Math.random() * 10);
      attempts++;
    } while (d === excludeLast && attempts < 20);
    return d;
  }

  function generateSequence(length) {
    const seq = [];
    for (let i = 0; i < length; i++) {
      const last = i > 0 ? seq[i - 1] : -1;
      seq.push(generateDigit(last));
    }
    return seq;
  }

  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
  }

  function render(html) {
    elContent.innerHTML = html;
  }

  function setProgress(pct) {
    if (elHintBar) elHintBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  function renderProgressDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      const r = state.results.find(x => x.level === i);
      let cls = '';
      if (r) cls = r.passed ? 'done' : 'fail';
      else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // GAME FLOW
  // ═══════════════════════════════════════════════════════════
  function showIdle() {
    setPhase('idle');
    setProgress(0);
    render(`
      <div class="phase-title">Numerical Domain · Backward Digit Span (WAIS-IV)</div>
      <h1 class="phase-headline grd">Digit Span</h1>
      <p class="phase-sub">
        Digits will appear one at a time. After they finish, enter them
        <strong style="color:#FF9F1C">in REVERSE order</strong>.
        <br><br>
        Example: you see <span style="color:#9D4EDD">4 → 7 → 2</span>, you enter <span style="color:#00FF96">2 → 7 → 4</span>.
        <br><br>
        Each level adds one digit. You have <strong>3 lives</strong>.
      </p>
      <button class="big-btn" id="start-btn">Start Test</button>
      <p class="phase-hint" style="margin-top:16px;">
        Or press <kbd>Space</kbd> · Use <kbd>0</kbd>–<kbd>9</kbd> to type
      </p>
    `);
    $('start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      startLevel();
    });
  }

  async function startLevel() {
    clearAllTimeouts();
    state.userInput = [];

    const length = digitsForLevel(state.level);
    state.sequence = generateSequence(length);
    state.expected = [...state.sequence].reverse();

    elLevel.textContent = String(state.level);
    elSpan.textContent = String(length);

    await showCountdown();
    await showSequence();
    startInputPhase();
  }

  async function showCountdown() {
    setPhase('countdown');
    setProgress(0);

    for (let i = 3; i > 0; i--) {
      render(`
        <div class="phase-title">Level ${state.level} · ${state.sequence.length} digits</div>
        <div class="countdown-num">${i}</div>
        <p class="phase-sub" style="margin-top:20px;">Get ready...</p>
      `);
      await wait(650);
    }
  }

  async function showSequence() {
    setPhase('showing');
    setProgress(0);

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Watch Carefully</div>
      <h2 class="phase-headline">Memorize the digits</h2>
      <div class="digit-display" id="digit-display">
        <div class="digit-value" id="digit-value"></div>
      </div>
      <p class="phase-hint">${state.sequence.length} digits incoming</p>
    `);

    const displayEl = $('digit-display');
    const valueEl = $('digit-value');

    await wait(500);

    for (let i = 0; i < state.sequence.length; i++) {
      valueEl.textContent = String(state.sequence[i]);
      displayEl.classList.add('active');
      setProgress(((i + 1) / state.sequence.length) * 100);
      await wait(CONFIG.digitShowDuration);

      displayEl.classList.remove('active');
      await wait(CONFIG.digitGapDuration);
    }

    setProgress(0);
    await wait(400);
  }

  function startInputPhase() {
    setPhase('input');
    state.userInput = [];

    const expectedLen = state.expected.length;

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Your Turn</div>
      <h2 class="phase-headline">Enter in REVERSE order</h2>

      <div class="direction-badge">
        <span class="arrow">←</span>
        <span>BACKWARD RECALL · ${expectedLen} DIGITS</span>
      </div>

      <div class="input-display" id="input-display">
        <span class="input-placeholder">TYPE ${expectedLen} DIGITS IN REVERSE ORDER</span>
      </div>

      <div class="keypad" id="keypad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="key" data-digit="${n}">${n}</button>`).join('')}
        <button class="key action" data-action="back">⌫ DEL</button>
        <button class="key" data-digit="0">0</button>
        <button class="key action submit" data-action="submit">✓ ENTER</button>
      </div>
      <p class="phase-hint" style="margin-top:16px;">
        <kbd>⌫</kbd> delete · <kbd>Enter</kbd> submit
      </p>
    `);

    elContent.querySelectorAll('.key').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.digit !== undefined) {
          addDigit(parseInt(btn.dataset.digit, 10));
        } else if (btn.dataset.action === 'back') {
          removeDigit();
        } else if (btn.dataset.action === 'submit') {
          submitAnswer();
        }
      });
    });
  }

  function addDigit(d) {
    if (state.phase !== 'input') return;
    if (state.userInput.length >= CONFIG.maxInputLength) return;
    state.userInput.push(d);
    updateInputDisplay();

    // Auto-submit when length matches
    if (state.userInput.length === state.expected.length) {
      setTimeout(() => {
        if (state.phase === 'input') submitAnswer();
      }, 350);
    }
  }

  function removeDigit() {
    if (state.phase !== 'input') return;
    if (state.userInput.length === 0) return;
    state.userInput.pop();
    updateInputDisplay();
  }

  function updateInputDisplay() {
    const el = $('input-display');
    if (!el) return;
    el.classList.remove('correct', 'wrong');

    if (state.userInput.length === 0) {
      el.innerHTML = `<span class="input-placeholder">TYPE ${state.expected.length} DIGITS IN REVERSE ORDER</span>`;
      return;
    }
    el.innerHTML = state.userInput
      .map(d => `<span class="input-digit">${d}</span>`)
      .join('');
  }

  function submitAnswer() {
    if (state.phase !== 'input') return;
    if (state.userInput.length === 0) return;

    const isCorrect =
      state.userInput.length === state.expected.length &&
      state.userInput.every((d, i) => d === state.expected[i]);

    const correctDigits = state.userInput.reduce(
      (acc, d, i) => acc + (state.expected[i] === d ? 1 : 0),
      0
    );

    state.results.push({
      level: state.level,
      span: state.expected.length,
      passed: isCorrect,
      correctDigits,
      totalDigits: state.expected.length
    });

    const inputEl = $('input-display');
    if (inputEl) inputEl.classList.add(isCorrect ? 'correct' : 'wrong');

    setPhase('feedback');

    if (isCorrect) {
      setTimeout(() => handleSuccess(), 500);
    } else {
      setTimeout(() => handleMiss(correctDigits), 500);
    }
  }

  function handleSuccess() {
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
    state.totalScore += CONFIG.correctBase + streakBonus;

    setProgress(0);
    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Correct</h2>
      <p class="phase-sub">You recalled all ${state.expected.length} digits in reverse order.</p>
      <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top level!'}</p>
    `);

    setTimeout(() => {
      if (state.level < CONFIG.maxLevel) {
        state.level++;
        startLevel();
      } else {
        completeGame();
      }
    }, 1600);
  }

  function handleMiss(correctDigits) {
    state.streak = 0;
    state.lives--;
    elLives.textContent = String(state.lives);

    setProgress(0);

    const expected = state.expected;
    const user = state.userInput;
    const maxLen = Math.max(expected.length, user.length);

    // Build comparison grid
    const expectedCells = expected.map(d => `<span class="match">${d}</span>`).join('');
    const userCells = [];
    for (let i = 0; i < maxLen; i++) {
      const u = user[i];
      const e = expected[i];
      if (u === undefined) {
        userCells.push(`<span class="dim">·</span>`);
      } else if (u === e) {
        userCells.push(`<span class="match">${u}</span>`);
      } else {
        userCells.push(`<span class="miss">${u}</span>`);
      }
    }

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF0077">Incorrect</h2>
      <p class="phase-sub">
        ${correctDigits} of ${expected.length} digits correct.
        <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
      </p>

      <div class="answer-grid">
        <div class="answer-row">
          <div class="answer-label">SEEN</div>
          <div class="answer-digits">
            ${state.sequence.map(d => `<span class="dim">${d}</span>`).join('')}
          </div>
        </div>
        <div class="answer-row">
          <div class="answer-label">EXPECTED</div>
          <div class="answer-digits">${expectedCells}</div>
        </div>
        <div class="answer-row">
          <div class="answer-label">YOURS</div>
          <div class="answer-digits">${userCells.join('')}</div>
        </div>
      </div>
    `);

    setTimeout(() => {
      if (state.lives > 0) {
        startLevel();
      } else {
        completeGame();
      }
    }, 3000);
  }

  function completeGame() {
    setPhase('gameover');
    setProgress(0);

    const maxSpan = Math.max(
      ...state.results.filter(r => r.passed).map(r => r.span),
      0
    );
    const passedLevels = state.results.filter(r => r.passed).length;
    const totalCorrect = state.results.reduce((a, r) => a + r.correctDigits, 0);
    const totalDigits = state.results.reduce((a, r) => a + r.totalDigits, 0);
    const accuracy = totalDigits > 0
      ? Math.round((totalCorrect / totalDigits) * 100)
      : 0;

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">MAX SPAN</div>
          <div class="stat-value">${maxSpan}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">PASSED</div>
          <div class="stat-value">${passedLevels}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">ACCURACY</div>
          <div class="stat-value">${accuracy}%</div>
        </div>
      </div>
      <p class="phase-sub" style="margin-top:16px;">
        Average adult backward span is <strong>4–5 digits</strong>. 
        ${maxSpan >= 6 ? 'Your score is above average!' : ''}
      </p>
      <button class="big-btn" id="restart-btn">Try Again</button>
    `);

    $('restart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      resetGame();
    });

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'digit-span',
        domain: 'numerical',
        maxSpan,
        passedLevels,
        accuracy,
        maxStreak: state.maxStreak,
        totalScore: state.totalScore,
        results: state.results.slice()
      });
    }
  }

  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.sequence = [];
    state.expected = [];
    state.userInput = [];
    state.results = [];
    state.streak = 0;
    state.maxStreak = 0;
    state.totalScore = 0;

    elLevel.textContent = '1';
    elSpan.textContent = '0';
    elLives.textContent = String(CONFIG.maxLives);

    showIdle();
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT
  // ═══════════════════════════════════════════════════════════
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!root) { console.error('[DigitSpanBackward] Container not found'); return; }

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
              <span class="g-meta-label">SPAN</span>
              <span class="g-meta-value" id="span-display">0</span>
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
          <div class="hint-bar"><div class="hint-progress" id="hint-progress"></div></div>
        </footer>
      </div>
    `;

    wireRefs();
    bindGlobalKeys();

    if (typeof options.onComplete === 'function') {
      state.onComplete = options.onComplete;
    }

    showIdle();
  }

  function wireRefs() {
    elStage   = $('stage');
    elLevel   = $('level-display');
    elSpan    = $('span-display');
    elLives   = $('lives-display');
    elContent = $('phase-content');
    elHintBar = $('hint-progress');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle') startLevel();
        else if (state.phase === 'gameover') resetGame();
        return;
      }

      if (state.phase === 'input' && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        addDigit(parseInt(e.key, 10));
        return;
      }

      if (state.phase === 'input' && e.key === 'Backspace') {
        e.preventDefault();
        removeDigit();
        return;
      }

      if (state.phase === 'input' && e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
      }
    });
  }

  function autoInit() {
    if (!document.getElementById('game-root')) return;
    if (!document.getElementById('phase-content')) return;
    wireRefs();
    bindGlobalKeys();
    showIdle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.DigitSpanGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };
})();