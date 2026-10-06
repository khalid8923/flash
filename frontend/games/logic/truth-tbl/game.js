/* ═══════════════════════════════════════════════════════════
   FLASH — Truth Tables Game (Logic Domain)
   Evaluate boolean expressions with assigned variable values.
   Includes step-by-step solution breakdown after each answer.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    optionCount: 2,             // true / false
    baseTime: 16000,
    minTime: 8000,
    questionsPerLevel: 4,
    correctBase: 100,
    streakBonus: 30,
    timeBonusMax: 80
  };

  // ─── Boolean Operation Definitions ───
  // Each op: { symbol, fn, renderClass }
  const OPS = {
    AND:    { symbol: '∧', fn: (a, b) => a && b,        cls: 'tok-and' },
    OR:     { symbol: '∨', fn: (a, b) => a || b,        cls: 'tok-or' },
    XOR:    { symbol: '⊕', fn: (a, b) => a !== b,       cls: 'tok-xor' },
    NAND:   { symbol: '↑', fn: (a, b) => !(a && b),     cls: 'tok-nand' },
    NOR:    { symbol: '↓', fn: (a, b) => !(a || b),     cls: 'tok-nor' },
    IMPLIES:{ symbol: '→', fn: (a, b) => !a || b,       cls: 'tok-imp' }
  };

  const OP_NAMES = Object.keys(OPS);

  // ─── State ───
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    currentQuestion: null,
    questionIndex: 0,
    results: [],
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

  function pickOne(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  // ═══════════════════════════════════════════════════════════
  // EXPRESSION TREE
  // Node types:
  //   { type: 'var', name: 'A' }
  //   { type: 'not', child: node }
  //   { type: 'op',  op: 'AND', left: node, right: node }
  // ═══════════════════════════════════════════════════════════

  // Build a random expression tree for given variables and difficulty
  function buildExpression(vars, level, depth = 0) {
    const maxDepth = Math.min(2 + Math.floor(level / 4), 4);
    const availableOps = opsForLevel(level);

    // Base case: leaf variable
    if (depth >= maxDepth || (depth > 0 && Math.random() < 0.25)) {
      const varNode = { type: 'var', name: pickOne(vars) };
      // 30% chance of NOT wrapping
      if (depth > 0 && Math.random() < 0.3) {
        return { type: 'not', child: varNode };
      }
      return varNode;
    }

    // Decide: unary NOT or binary op
    if (Math.random() < 0.2) {
      return { type: 'not', child: buildExpression(vars, level, depth + 1) };
    }

    const op = pickOne(availableOps);
    return {
      type: 'op',
      op,
      left: buildExpression(vars, level, depth + 1),
      right: buildExpression(vars, level, depth + 1)
    };
  }

  function opsForLevel(level) {
    if (level <= 2) return ['AND', 'OR'];
    if (level <= 4) return ['AND', 'OR', 'NOT'];
    if (level <= 6) return ['AND', 'OR', 'XOR'];
    if (level <= 8) return ['AND', 'OR', 'XOR', 'NAND'];
    if (level <= 10) return ['AND', 'OR', 'XOR', 'NAND', 'NOR'];
    return ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'IMPLIES'];
  }

  function varsForLevel(level) {
    if (level <= 3) return ['A', 'B'];
    if (level <= 7) return ['A', 'B', 'C'];
    if (level <= 11) return ['A', 'B', 'C', 'D'];
    return ['A', 'B', 'C', 'D', 'E'];
  }

  // ─── Evaluate expression tree with variable assignment ───
  function evaluate(node, env, steps = []) {
    let result;
    if (node.type === 'var') {
      result = env[node.name];
      return result;
    }
    if (node.type === 'not') {
      const inner = evaluate(node.child, env, steps);
      result = !inner;
      return result;
    }
    // binary op
    const l = evaluate(node.left, env, steps);
    const r = evaluate(node.right, env, steps);
    const op = OPS[node.op];
    result = op.fn(l, r);
    return result;
  }

  // ─── Render expression tree as HTML with syntax coloring ───
  function renderTree(node) {
    if (node.type === 'var') {
      return `<span class="tok-var">${node.name}</span>`;
    }
    if (node.type === 'not') {
      return `<span class="tok-not">¬</span>${renderTree(node.child)}`;
    }
    const op = OPS[node.op];
    const opLabel = `<span class="${op.cls}">${node.op}</span>`;
    return `<span class="tok-paren">(</span>${renderTree(node.left)} ${opLabel} ${renderTree(node.right)}<span class="tok-paren">)</span>`;
  }

  // ─── Render solution steps (partial evaluation) ───
  function buildSolutionSteps(node, env) {
    // We do a post-order walk, computing each subexpression and
    // recording human-readable steps.
    const steps = [];

    function walk(n) {
      if (n.type === 'var') return { val: env[n.name], html: n.name };

      if (n.type === 'not') {
        const c = walk(n.child);
        const v = !c.val;
        const html = `¬(${c.html}) = ${v ? 'T' : 'F'}`;
        steps.push(html);
        return { val: v, html };
      }

      const l = walk(n.left);
      const r = walk(n.right);
      const op = OPS[n.op];
      const v = op.fn(l.val, r.val);
      const html = `(${l.html}) ${n.op} (${r.html}) = ${v ? 'T' : 'F'}`;
      steps.push(html);
      return { val: v, html };
    }

    walk(node);
    return steps;
  }

  // ═══════════════════════════════════════════════════════════
  // QUESTION GENERATION
  // ═══════════════════════════════════════════════════════════
  function generateQuestion(level) {
    const vars = varsForLevel(level);

    // Try up to 10 times to get a non-trivial expression
    let tree, answer, env, steps;
    let guard = 0;
    do {
      guard++;
      tree = buildExpression(vars, level);

      // Random assignment
      env = {};
      vars.forEach(v => { env[v] = Math.random() < 0.5; });

      steps = [];
      answer = evaluate(tree, env, steps);
    } while (guard < 10 && appearsConstant(tree, vars));

    return {
      vars,
      env,
      tree,
      answer,
      steps: buildSolutionSteps(tree, env)
    };
  }

  // Guard: avoid expressions that simplify to a single variable or constant
  function appearsConstant(tree, vars) {
    // Sample 30 random assignments and check result variance
    let trueCount = 0;
    const samples = 30;
    for (let i = 0; i < samples; i++) {
      const env = {};
      vars.forEach(v => env[v] = Math.random() < 0.5);
      if (evaluate(tree, env)) trueCount++;
    }
    // Must not always be true or always be false
    return trueCount === 0 || trueCount === samples;
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

  function renderVarChips(env, vars) {
    return `
      <div class="var-values">
        ${vars.map((v, i) => `
          <div class="var-chip" style="animation-delay: ${i * 60}ms">
            <div class="var-name">${v}</div>
            <div class="var-val ${env[v] ? 'true' : 'false'}">${env[v] ? 'TRUE' : 'FALSE'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSolution(steps, answer) {
    return `
      <div class="solution">
        <div class="solution-title">Solution Breakdown</div>
        ${steps.map(s => `<div class="solution-step">${s}</div>`).join('')}
        <div class="solution-step" style="margin-top:8px;">Final: <span class="final">${answer ? 'TRUE' : 'FALSE'}</span></div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // GAME FLOW
  // ═══════════════════════════════════════════════════════════
  function showIdle() {
    setPhase('idle');
    setTimer(100);
    render(`
      <div class="phase-title">Logic Domain · Boolean Evaluation</div>
      <h1 class="phase-headline grd">Truth Tables</h1>
      <p class="phase-sub">
        You'll see a boolean expression with variable assignments.
        Determine whether the whole expression evaluates to
        <strong style="color:#00FF96">TRUE</strong> or
        <strong style="color:#FF0077">FALSE</strong>.
        <br><br>
        Answer with keys <strong>1</strong> / <strong>2</strong> · 
        <strong>4 questions</strong> per level.
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
    const t = CONFIG.baseTime - (level - 1) * 550;
    return Math.max(CONFIG.minTime, t);
  }

  function nextQuestion() {
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
      
      <div class="expr-box">
        <div class="expr-label">EXPRESSION</div>
        <div class="expr-formula">${renderTree(q.tree)}</div>
      </div>

      ${renderVarChips(q.env, q.vars)}

      <div class="result-prompt">Evaluate →</div>
      <div class="options-grid" id="options">
        <button class="option-btn" data-value="true" data-key="1" style="color:#00FF96">TRUE</button>
        <button class="option-btn" data-value="false" data-key="2" style="color:#FF0077">FALSE</button>
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    startTimer(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;

      let lvl = 'normal';
      if (pct < 50) lvl = 'warning';
      if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);

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

    const chosen = btn.dataset.value === 'true';
    const correct = state.currentQuestion.answer;
    const elapsed = performance.now() - state.currentQuestion.startTime;
    const isCorrect = chosen === correct;

    state.levelTotal++;
    state.levelTotalTime += elapsed;

    // Disable both
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = b.dataset.value === 'true';
      if (val === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    // Add solution breakdown
    const solutionHTML = renderSolution(state.currentQuestion.steps, correct);
    elContent.insertAdjacentHTML('beforeend', solutionHTML);

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = Math.round((1 - elapsed / state.currentQuestion.timeLimit) * CONFIG.timeBonusMax);
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');

      setTimeout(() => nextQuestion(), 1800);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';

      state.lives--;
      elLives.textContent = String(state.lives);

      setPhase('wrong');

      if (state.lives <= 0) {
        setTimeout(() => completeGame(), 2800);
      } else {
        setTimeout(() => nextQuestion(), 2800);
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

    const correct = state.currentQuestion.answer;

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = b.dataset.value === 'true';
      if (val === correct) b.classList.add('correct');
    });

    const solutionHTML = renderSolution(state.currentQuestion.steps, correct);
    elContent.insertAdjacentHTML('beforeend', solutionHTML);

    setPhase('wrong');

    if (state.lives <= 0) {
      setTimeout(() => completeGame(), 2800);
    } else {
      setTimeout(() => nextQuestion(), 2800);
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
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct
          · Avg: ${Math.round(state.levelTotalTime / state.levelTotal)} ms
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
        gameId: 'truth-tbl',
        domain: 'logic',
        score: state.totalScore,
        maxLevel,
        accuracy,
        avgResponseTime: avgTime,
        maxStreak: state.maxStreak,
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

    if (!root) { console.error('[TruthTables] Container not found'); return; }

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
      if (state.phase === 'question') {
        if (e.key === '1') {
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[0] && !btns[0].disabled) btns[0].click();
        }
        if (e.key === '2') {
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[1] && !btns[1].disabled) btns[1].click();
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

  window.TruthTablesGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };
})();