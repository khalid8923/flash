/* ═══════════════════════════════════════════════════════════
   FLASH — Mental Math Game (Numerical Domain)
   Arithmetic under time pressure with smart distractors.
   Difficulty scales by operation complexity + number size.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    optionCount: 4,
    baseTime: 8000,           // ms at level 1
    minTime: 3000,            // fastest possible
    questionsPerLevel: 5,
    streakBonus: 100,         // points per streak level
    correctBase: 100          // base points per correct answer
  };

  // ─── State ───
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    currentQuestion: null,    // { text, answer, options, startTime, timeLimit }
    questionIndex: 0,
    results: [],              // { level, correct, total, avgTime }
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null
  };

  // ─── DOM refs ───
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  const $ = (id) => document.getElementById(id);

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) {
      clearInterval(state.timerIntervalId);
      state.timerIntervalId = null;
    }
  }

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      state.timeoutIds.push(id);
    });
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ═══════════════════════════════════════════════════════════
  // QUESTION GENERATION (Core Algorithm)
  // ═══════════════════════════════════════════════════════════
  //
  // Difficulty scales by level:
  //   L1-3   : single-digit +, -, small ×
  //   L4-6   : two-digit +, -, × up to 12
  //   L7-9   : two-digit × one-digit, ÷ exact
  //   L10-12 : three-term chains (a op b op c)
  //   L13-15 : mixed with parentheses, larger numbers
  //
  // Every question generates 4 smart distractors that mimic
  // common mistakes (off-by-one, off-by-ten, wrong op, etc).
  //
  function generateQuestion(level) {
    const q = buildEquation(level);
    const distractors = buildDistractors(q.answer, level);
    const options = shuffle([q.answer, ...distractors]);
    return {
      text: q.text,
      textParts: q.parts,     // for rendering with colored operators
      answer: q.answer,
      options
    };
  }

  function buildEquation(level) {
    if (level <= 3) return buildSimple(1, 20);
    if (level <= 6) return buildSimple(10, 99);
    if (level <= 9) return buildMultiply(level);
    if (level <= 12) return buildChain(level);
    return buildParentheses(level);
  }

  // Simple a + b or a - b
  function buildSimple(min, max) {
    const isAdd = Math.random() < 0.55;
    let a, b, answer, op;

    if (isAdd) {
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      op = '+';
    } else {
      a = randInt(min, max);
      b = randInt(min, a); // guarantee non-negative
      answer = a - b;
      op = '−';
    }
    return {
      text: `${a} ${op} ${b}`,
      parts: { a, op, b },
      answer
    };
  }

  // Multiplication and exact division
  function buildMultiply(level) {
    const isMul = Math.random() < 0.65;
    if (isMul) {
      const maxFactor = Math.min(12 + (level - 7) * 2, 20);
      const a = randInt(2, maxFactor);
      const b = randInt(2, 12);
      return {
        text: `${a} × ${b}`,
        parts: { a, op: '×', b },
        answer: a * b
      };
    } else {
      // Exact division (division answer is always integer)
      const b = randInt(2, 12);
      const answer = randInt(2, 15);
      const a = b * answer;
      return {
        text: `${a} ÷ ${b}`,
        parts: { a, op: '÷', b },
        answer
      };
    }
  }

  // Three-term chain: a op b op c (left-to-right, no precedence headache)
  function buildChain(level) {
    const ops = ['+', '−', '×'];
    const op1 = ops[randInt(0, ops.length - 1)];
    const op2 = ops[randInt(0, ops.length - 1)];

    let a = randInt(2, 15);
    let b = randInt(2, 12);
    let c = randInt(2, 10);

    // Ensure no negative intermediate results and division not needed
    let result = a;
    result = applyOp(result, op1, b);
    result = applyOp(result, op2, c);

    // Retry if result is negative
    if (result < 0 || !Number.isInteger(result)) {
      return buildSimple(10, 30); // fallback
    }

    return {
      text: `${a} ${op1} ${b} ${op2} ${c}`,
      parts: { a, op1, b, op2, c },
      answer: result
    };
  }

  // Parentheses: (a op b) op c
  function buildParentheses(level) {
    const a = randInt(5, 20);
    const b = randInt(2, 10);
    const c = randInt(2, 12);
    const innerOp = Math.random() < 0.5 ? '+' : '−';
    const outerOp = Math.random() < 0.5 ? '+' : '−';

    let inner = innerOp === '+' ? a + b : a - b;
    if (inner < 0) return buildChain(level);

    let answer = outerOp === '+' ? inner + c : inner - c;
    if (answer < 0) return buildChain(level);

    return {
      text: `(${a} ${innerOp} ${b}) ${outerOp} ${c}`,
      parts: { a, innerOp, b, outerOp, c, parens: true },
      answer
    };
  }

  function applyOp(a, op, b) {
    if (op === '+') return a + b;
    if (op === '−') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return a / b;
    return a;
  }

  // ─── Smart Distractor Generator ───
  // Distractors mimic real mistakes: off-by-one, sign flip,
  // wrong-operation result, digit transposition.
  function buildDistractors(answer, level) {
    const set = new Set();
    const candidates = [
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      answer + 10,
      answer - 10,
      answer * 2,
      Math.floor(answer / 2),
      answer + randInt(3, 9),
      answer - randInt(3, 9)
    ];

    // Shuffle candidate order for variety
    const shuffled = shuffle(candidates);

    for (const c of shuffled) {
      if (set.size >= CONFIG.optionCount - 1) break;
      if (c === answer) continue;
      if (c < 0) continue;
      if (!Number.isInteger(c)) continue;
      set.add(c);
    }

    // Pad with random nearby values if not enough
    while (set.size < CONFIG.optionCount - 1) {
      const offset = randInt(2, 15);
      const val = Math.random() < 0.5 ? answer + offset : answer - offset;
      if (val >= 0 && val !== answer) set.add(val);
    }

    return Array.from(set).slice(0, CONFIG.optionCount - 1);
  }

  // ═══════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════
  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
  }

  function render(html) {
    elContent.innerHTML = html;
  }

  function setTimer(pct, level = 'normal') {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTimerFill.classList.remove('warning', 'danger');
    if (level === 'warning') elTimerFill.classList.add('warning');
    if (level === 'danger') elTimerFill.classList.add('danger');
  }

  function renderProgressDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      let cls = '';
      if (i < state.level) cls = 'done';
      else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
  }

  function renderEquationHTML(q) {
    const p = q.textParts;
    let inner = '';

    if (p.parens) {
      inner = `<span class="op">(</span>${p.a} <span class="op">${p.innerOp}</span> ${p.b}<span class="op">)</span> <span class="op">${p.outerOp}</span> ${p.c}`;
    } else if (p.op1 !== undefined) {
      inner = `${p.a} <span class="op">${p.op1}</span> ${p.b} <span class="op">${p.op2}</span> ${p.c}`;
    } else {
      inner = `${p.a} <span class="op">${p.op}</span> ${p.b}`;
    }

    return `${inner} <span class="eq-mark">=</span> <span class="q-mark">?</span>`;
  }

  // ═══════════════════════════════════════════════════════════
  // GAME FLOW
  // ═══════════════════════════════════════════════════════════
  function showIdle() {
    setPhase('idle');
    setTimer(100);
    render(`
      <div class="phase-title">Numerical Domain · Arithmetic Speed</div>
      <h1 class="phase-headline grd">Mental Math</h1>
      <p class="phase-sub">
        Solve as many as you can before time runs out.
        Pick the correct answer using keys <strong>1–4</strong>.
        <br><br>
        <strong>5 questions</strong> per level · <strong>3 lives</strong>
      </p>
      <button class="big-btn" id="start-btn">Start Test</button>
      <p class="phase-hint" style="margin-top:16px;">Or press <kbd>Space</kbd></p>
    `);
    $('start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      startLevel();
    });
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.questionIndex = 0;

    elLevel.textContent = String(state.level);

    nextQuestion();
  }

  function timeForLevel(level) {
    const t = CONFIG.baseTime - (level - 1) * 350;
    return Math.max(CONFIG.minTime, t);
  }

  function nextQuestion() {
    // Check level completion
    if (state.questionIndex >= CONFIG.questionsPerLevel) {
      endLevel();
      return;
    }

    setPhase('question');
    state.questionIndex++;

    const timeLimit = timeForLevel(state.level);
    const q = generateQuestion(state.level);
    state.currentQuestion = {
      ...q,
      startTime: performance.now(),
      timeLimit
    };

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Question ${state.questionIndex}/${CONFIG.questionsPerLevel}</div>
      <div class="equation">${renderEquationHTML(q)}</div>
      <div class="options-grid" id="options">
        ${q.options.map((opt, i) => `
          <button class="option-btn" data-value="${opt}" data-key="${i + 1}">${opt}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    startTimer(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now();

    // Reset
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;

      let level = 'normal';
      if (pct < 50) level = 'warning';
      if (pct < 20) level = 'danger';

      setTimer(pct, level);

      if (remaining <= 0) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        handleTimeout();
      }
    }, 50);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'question') return;
    if (state.timerIntervalId) {
      clearInterval(state.timerIntervalId);
      state.timerIntervalId = null;
    }

    const chosen = parseInt(btn.dataset.value, 10);
    const correct = state.currentQuestion.answer;
    const elapsed = performance.now() - state.currentQuestion.startTime;
    const isCorrect = chosen === correct;

    state.levelTotal++;
    state.levelTotalTime += elapsed;

    // Disable all buttons
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      // Time bonus
      const timeBonus = Math.round((1 - elapsed / state.currentQuestion.timeLimit) * 50);
      const streakBonus = state.streak > 1 ? (state.streak - 1) * 20 : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');

      setTimeout(() => nextQuestion(), 700);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';

      state.lives--;
      elLives.textContent = String(state.lives);

      setPhase('wrong');

      if (state.lives <= 0) {
        setTimeout(() => completeGame(), 1400);
      } else {
        setTimeout(() => nextQuestion(), 1200);
      }
    }
  }

  function handleTimeout() {
    if (state.phase !== 'question') return;

    state.levelTotal++;
    state.levelTotalTime += state.currentQuestion.timeLimit;

    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    // Reveal correct answer
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === state.currentQuestion.answer) b.classList.add('correct');
    });

    setPhase('wrong');

    if (state.lives <= 0) {
      setTimeout(() => completeGame(), 1400);
    } else {
      setTimeout(() => nextQuestion(), 1200);
    }
  }

  function endLevel() {
    const accuracy = state.levelTotal > 0
      ? state.levelCorrect / state.levelTotal
      : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      avgTime: Math.round(state.levelTotalTime / state.levelTotal)
    });

    if (accuracy >= 0.6) {
      // Passed (at least 3/5 correct)
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct
          · Avg time: ${Math.round(state.levelTotalTime / state.levelTotal)} ms
        </p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);

      setTimeout(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else {
          completeGame();
        }
      }, 1600);
    } else {
      // Level failed
      state.lives--;
      elLives.textContent = String(state.lives);

      setPhase('wrong');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct — need 60% to pass.
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
        </p>
      `);

      setTimeout(() => {
        if (state.lives > 0) {
          startLevel();
        } else {
          completeGame();
        }
      }, 2000);
    }
  }

  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalQuestions = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
    const totalTime = state.results.reduce((a, r) => a + r.avgTime * r.total, 0);
    const avgTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;
    const maxLevel = state.results.length;

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">SCORE</div>
          <div class="stat-value">${state.totalScore}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">MAX LEVEL</div>
          <div class="stat-value">${maxLevel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">ACCURACY</div>
          <div class="stat-value">${accuracy}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">MAX STREAK</div>
          <div class="stat-value">${state.maxStreak}</div>
        </div>
      </div>
      <button class="big-btn" id="restart-btn">Try Again</button>
    `);

    $('restart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      resetGame();
    });

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'mental-math',
        domain: 'numerical',
        score: state.totalScore,
        maxLevel,
        accuracy,
        avgResponseTime: avgTime,
        maxStreak: state.maxStreak,
        totalAttempts: state.results.length,
        results: state.results.slice()
      });
    }
  }

  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentQuestion = null;
    state.questionIndex = 0;

    elLevel.textContent = '1';
    elStreak.textContent = '0';
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

    if (!root) { console.error('[MentalMath] Container not found'); return; }

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
              <span class="g-meta-label">STREAK</span>
              <span class="g-meta-value" id="streak-display">0</span>
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
          <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
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
    elStage     = $('stage');
    elLevel     = $('level-display');
    elStreak    = $('streak-display');
    elLives     = $('lives-display');
    elContent   = $('phase-content');
    elTimerFill = $('timer-fill');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle') startLevel();
        else if (state.phase === 'gameover') resetGame();
        return;
      }

      // 1-4 number keys
      if (state.phase === 'question') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= CONFIG.optionCount) {
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[n - 1] && !btns[n - 1].disabled) {
            btns[n - 1].click();
          }
        }
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

  window.MentalMathGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };
})();