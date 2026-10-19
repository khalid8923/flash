/* ═══════════════════════════════════════════════════════════
   FLASH — Speed Calculus Game (Numerical Domain)
   Global timer (90s) that runs continuously. Each question
   has its own timer. Correct answers increase difficulty,
   wrong answers burn time. Score rewards speed + accuracy.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    totalTime: 90000,           // 90 seconds total session
    baseQuestionTime: 10000,    // 10s per question at difficulty 1
    minQuestionTime: 3000,      // floor
    timeStepPerLevel: 500,      // each difficulty level reduces question time by 500ms
    correctBase: 100,
    timeBonusMax: 80,
    streakBonusPerLevel: 30,
    wrongPenaltyTime: 2000,     // lose 2s from global timer on wrong answer
    wrongPenaltyScore: 50,      // score penalty
    optionCount: 4
  };

  // ─── State ───
  const state = {
    phase: 'idle',
    difficulty: 1,
    score: 0,
    streak: 0,
    maxStreak: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeouts: 0,
    remainingTime: CONFIG.totalTime,
    globalTimerStart: 0,
    globalTimerId: null,
    questionTimerId: null,
    currentQuestion: null,
    onComplete: null,
    results: []
  };

  // ─── DOM refs ───
  let elStage, elScore, elDifficulty, elStreak, elContent;
  let elTotalFill, elTotalLabel, elQuestionFill;

  const $ = (id) => document.getElementById(id);

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  function clearAllTimers() {
    if (state.globalTimerId) { clearInterval(state.globalTimerId); state.globalTimerId = null; }
    if (state.questionTimerId) { clearInterval(state.questionTimerId); state.questionTimerId = null; }
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
  // QUESTION GENERATION
  // Difficulty scales from simple arithmetic to compound
  // expressions with larger operands.
  // ═══════════════════════════════════════════════════════════
  function generateQuestion(difficulty) {
    if (difficulty <= 2)      return buildSimple(2, 20);
    if (difficulty <= 4)      return buildSimple(10, 60);
    if (difficulty <= 6)      return buildMultiply(2, 12, 2, 12);
    if (difficulty <= 8)      return buildMixed(2, 10);
    if (difficulty <= 10)     return buildMultiply(2, 15, 2, 15);
    if (difficulty <= 12)     return buildChain(2, 20);
    if (difficulty <= 14)     return buildPowerOrRoot();
    return buildComplex();
  }

  function buildSimple(min, max) {
    const isAdd = Math.random() < 0.5;
    const a = randInt(min, max);
    const b = randInt(min, max);
    if (isAdd) {
      return { text: `${a} + ${b}`, answer: a + b };
    }
    const [big, small] = a >= b ? [a, b] : [b, a];
    return { text: `${big} − ${small}`, answer: big - small };
  }

  function buildMultiply(aMin, aMax, bMin, bMax) {
    const a = randInt(aMin, aMax);
    const b = randInt(bMin, bMax);
    const isMul = Math.random() < 0.6;
    if (isMul) {
      return { text: `${a} × ${b}`, answer: a * b };
    }
    // Division — ensure integer result
    const prod = a * b;
    return { text: `${prod} ÷ ${a}`, answer: b };
  }

  function buildMixed(lo, hi) {
    // a + b × c (with precedence)
    const a = randInt(lo, hi);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const useMulSecond = Math.random() < 0.5;
    if (useMulSecond) {
      return { text: `${a} + ${b} × ${c}`, answer: a + b * c };
    } else {
      return { text: `${b} × ${c} + ${a}`, answer: b * c + a };
    }
  }

  function buildChain(lo, hi) {
    // a × b − c or a × b + c
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    const c = randInt(lo, hi);
    const useAdd = Math.random() < 0.5;
    if (useAdd) {
      return { text: `${a} × ${b} + ${c}`, answer: a * b + c };
    }
    return { text: `${a} × ${b} − ${c}`, answer: a * b - c };
  }

  function buildPowerOrRoot() {
    const usePower = Math.random() < 0.7;
    if (usePower) {
      const base = randInt(2, 9);
      const exp = randInt(2, 3);
      const addon = Math.random() < 0.5 ? 0 : randInt(1, 10);
      const text = addon === 0
        ? `${base}^${exp}`
        : `${base}^${exp} + ${addon}`;
      const answer = Math.pow(base, exp) + addon;
      return { text, answer };
    } else {
      // Square root of perfect square
      const root = randInt(3, 15);
      const sq = root * root;
      const addon = randInt(0, 5);
      const text = addon === 0 ? `√${sq}` : `√${sq} + ${addon}`;
      return { text, answer: root + addon };
    }
  }

  function buildComplex() {
    // (a + b) × c or a × (b + c)
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    const c = randInt(2, 9);
    const variant = randInt(0, 1);
    if (variant === 0) {
      return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c };
    } else {
      return { text: `${a} × (${b} + ${c})`, answer: a * (b + c) };
    }
  }

  function buildDistractors(answer, difficulty) {
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
      answer + randInt(3, 12),
      answer - randInt(3, 12),
      answer + randInt(15, 25),
      answer - randInt(15, 25)
    ];

    for (const c of shuffle(candidates)) {
      if (set.size >= CONFIG.optionCount - 1) break;
      if (c === answer) continue;
      if (c < 0) continue;
      if (!Number.isInteger(c)) continue;
      set.add(c);
    }

    let guard = 0;
    while (set.size < CONFIG.optionCount - 1 && guard < 100) {
      guard++;
      const offset = randInt(2, 20);
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

  function setTotalTimeBar(pct) {
    if (!elTotalFill) return;
    elTotalFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTotalFill.classList.remove('warning', 'danger');
    if (pct < 30) elTotalFill.classList.add('danger');
    else if (pct < 60) elTotalFill.classList.add('warning');
  }

  function setQuestionTimeBar(pct) {
    if (elQuestionFill) elQuestionFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  function updateHeader() {
    elScore.textContent = state.score.toLocaleString();
    elDifficulty.textContent = String(state.difficulty);
    elStreak.textContent = String(state.streak);
    elDifficulty.classList.toggle('hot', state.difficulty >= 8);
    elStreak.classList.toggle('hot', state.streak >= 5);
  }

  function showScorePopup(amount, positive) {
    const pop = document.createElement('div');
    pop.className = `score-popup ${positive ? 'positive' : 'negative'}`;
    pop.textContent = (positive ? '+' : '−') + Math.abs(amount);
    const eq = elContent.querySelector('.equation');
    if (eq && eq.parentElement) {
      eq.parentElement.style.position = 'relative';
      eq.parentElement.appendChild(pop);
    } else {
      elContent.appendChild(pop);
    }
    setTimeout(() => pop.remove(), 1000);
  }

  function showStreakFlame() {
    const flame = document.createElement('div');
    flame.className = 'streak-flame';
    flame.textContent = `🔥 ${state.streak}× STREAK`;
    document.body.appendChild(flame);
    setTimeout(() => flame.remove(), 1200);
  }

  // ═══════════════════════════════════════════════════════════
  // GAME FLOW
  // ═══════════════════════════════════════════════════════════
  function showIdle() {
    setPhase('idle');
    setTotalTimeBar(100);
    setQuestionTimeBar(100);
    updateHeader();
    elTotalLabel.textContent = '90.0s';

    render(`
      <div class="phase-title">Numerical Domain · Speed Challenge</div>
      <h1 class="phase-headline grd">Speed Calculus</h1>
      <p class="phase-sub">
        You have <strong style="color:#FF9F1C">90 seconds</strong> to solve as many as you can.
        Every correct answer increases difficulty and reduces the time per question.
        Wrong answers burn <strong style="color:#FF0077">2 seconds</strong> from your clock.
        <br><br>
        Answer with keys <strong>1–4</strong>.
      </p>
      <button class="big-btn" id="start-btn">Start Challenge</button>
      <p class="phase-hint" style="margin-top:16px;">Or press <kbd>Space</kbd></p>
    `);
    $('start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      startGame();
    });
  }

  function startGame() {
    clearAllTimers();

    state.difficulty = 1;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.timeouts = 0;
    state.remainingTime = CONFIG.totalTime;
    state.results = [];
    state.globalTimerStart = performance.now();

    updateHeader();
    startGlobalTimer();
    nextQuestion();
  }

  function startGlobalTimer() {
    state.globalTimerId = setInterval(() => {
      const elapsed = performance.now() - state.globalTimerStart;
      const remaining = Math.max(0, CONFIG.totalTime - elapsed);
      state.remainingTime = remaining;

      const pct = (remaining / CONFIG.totalTime) * 100;
      setTotalTimeBar(pct);
      elTotalLabel.textContent = (remaining / 1000).toFixed(1) + 's';

      if (remaining <= 0) {
        clearAllTimers();
        endGame('timeout');
      }
    }, 100);
  }

  function questionTimeForDifficulty(d) {
    const t = CONFIG.baseQuestionTime - (d - 1) * CONFIG.timeStepPerLevel;
    return Math.max(CONFIG.minQuestionTime, t);
  }

  function nextQuestion() {
    if (state.phase === 'gameover') return;

    setPhase('question');

    const q = generateQuestion(state.difficulty);
    const distractors = buildDistractors(q.answer, state.difficulty);
    const options = shuffle([q.answer, ...distractors]);
    const timeLimit = questionTimeForDifficulty(state.difficulty);

    state.currentQuestion = {
      ...q,
      options,
      timeLimit,
      startTime: performance.now()
    };

    // Format equation text with colored operators
    const eqHTML = q.text
      .replace(/\+/g, '<span class="op">+</span>')
      .replace(/−/g, '<span class="op">−</span>')
      .replace(/×/g, '<span class="op">×</span>')
      .replace(/÷/g, '<span class="op">÷</span>')
      .replace(/\^/g, '<span class="op">^</span>')
      .replace(/√/g, '<span class="op">√</span>');

    render(`
      <div class="phase-title">Difficulty ${state.difficulty} · Time: ${(timeLimit/1000).toFixed(1)}s</div>
      <div class="equation flash">${eqHTML} <span class="eq-mark">=</span> <span class="q-mark">?</span></div>
      <div class="options-grid" id="options">
        ${options.map((opt, i) => `
          <button class="option-btn" data-value="${opt}" data-key="${i + 1}">${opt}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    startQuestionTimer(timeLimit);
  }

  function startQuestionTimer(timeLimit) {
    if (state.questionTimerId) clearInterval(state.questionTimerId);

    const start = performance.now();
    setQuestionTimeBar(100);

    state.questionTimerId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      setQuestionTimeBar(pct);

      if (remaining <= 0) {
        clearInterval(state.questionTimerId);
        state.questionTimerId = null;
        handleQuestionTimeout();
      }
    }, 40);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'question') return;
    if (state.questionTimerId) {
      clearInterval(state.questionTimerId);
      state.questionTimerId = null;
    }

    const chosen = parseInt(btn.dataset.value, 10);
    const correct = state.currentQuestion.answer;
    const elapsed = performance.now() - state.currentQuestion.startTime;
    const isCorrect = chosen === correct;

    state.questionsAnswered++;

    // Disable all
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    if (isCorrect) {
      state.correctAnswers++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = Math.round((1 - elapsed / state.currentQuestion.timeLimit) * CONFIG.timeBonusMax);
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonusPerLevel : 0;
      const gained = CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;
      state.score += gained;

      showScorePopup(gained, true);
      if (state.streak >= 3) showStreakFlame();

      // Increase difficulty
      state.difficulty = Math.min(20, state.difficulty + 1);
      updateHeader();

      setPhase('correct');
      setTimeout(() => nextQuestion(), 380);
    } else {
      state.wrongAnswers++;
      state.streak = 0;

      // Penalties
      state.score = Math.max(0, state.score - CONFIG.wrongPenaltyScore);
      state.globalTimerStart -= CONFIG.wrongPenaltyTime; // effectively takes 2s off the clock

      showScorePopup(CONFIG.wrongPenaltyScore, false);
      updateHeader();

      setPhase('wrong');
      setTimeout(() => nextQuestion(), 700);
    }
  }

  function handleQuestionTimeout() {
    if (state.phase !== 'question') return;

    state.questionsAnswered++;
    state.timeouts++;
    state.streak = 0;

    state.score = Math.max(0, state.score - CONFIG.wrongPenaltyScore);
    state.globalTimerStart -= CONFIG.wrongPenaltyTime;

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === state.currentQuestion.answer) b.classList.add('correct');
    });

    showScorePopup(CONFIG.wrongPenaltyScore, false);
    updateHeader();

    setPhase('wrong');
    setTimeout(() => nextQuestion(), 700);
  }

  function endGame(reason) {
    clearAllTimers();
    setPhase('gameover');
    setQuestionTimeBar(0);

    const accuracy = state.questionsAnswered > 0
      ? Math.round((state.correctAnswers / state.questionsAnswered) * 100)
      : 0;

    render(`
      <div class="phase-title">Challenge Complete</div>
      <h1 class="phase-headline grd">Time's Up!</h1>
      <div class="stats-grid cols-5">
        <div class="stat-card">
          <div class="stat-label">SCORE</div>
          <div class="stat-value orange">${state.score.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">ANSWERED</div>
          <div class="stat-value">${state.questionsAnswered}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">CORRECT</div>
          <div class="stat-value green">${state.correctAnswers}</div>
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
      showIdle();
    });

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'speed-calc',
        domain: 'numerical',
        score: state.score,
        questionsAnswered: state.questionsAnswered,
        correctAnswers: state.correctAnswers,
        wrongAnswers: state.wrongAnswers,
        timeouts: state.timeouts,
        accuracy,
        maxStreak: state.maxStreak,
        finalDifficulty: state.difficulty
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT
  // ═══════════════════════════════════════════════════════════
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!root) { console.error('[SpeedCalc] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-logo">
            <span class="g-logo-icon">⚡</span>
            <span class="g-logo-text">FLASH</span>
          </div>
          <div class="g-meta">
            <span class="g-meta-item">
              <span class="g-meta-label">SCORE</span>
              <span class="g-meta-value" id="score-display">0</span>
            </span>
            <span class="g-meta-item">
              <span class="g-meta-label">DIFFICULTY</span>
              <span class="g-meta-value" id="difficulty-display">1</span>
            </span>
            <span class="g-meta-item">
              <span class="g-meta-label">STREAK</span>
              <span class="g-meta-value" id="streak-display">0</span>
            </span>
          </div>
        </header>
        <main id="stage" class="stage" data-phase="idle">
          <div class="stage-inner"><div id="phase-content"></div></div>
        </main>
        <footer class="g-footer">
          <div class="total-time-bar">
            <div class="total-time-fill" id="total-time-fill"></div>
            <span class="total-time-label" id="total-time-label">90.0s</span>
          </div>
          <div class="question-time-bar">
            <div class="question-time-fill" id="question-time-fill"></div>
          </div>
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
    elStage         = $('stage');
    elScore         = $('score-display');
    elDifficulty    = $('difficulty-display');
    elStreak        = $('streak-display');
    elContent       = $('phase-content');
    elTotalFill     = $('total-time-fill');
    elTotalLabel    = $('total-time-label');
    elQuestionFill  = $('question-time-fill');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle') startGame();
        else if (state.phase === 'gameover') showIdle();
        return;
      }
      if (state.phase === 'question') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= CONFIG.optionCount) {
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[n - 1] && !btns[n - 1].disabled) btns[n - 1].click();
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

  window.SpeedCalcGame = {
    mount,
    reset: showIdle,
    state,
    config: CONFIG
  };
})();