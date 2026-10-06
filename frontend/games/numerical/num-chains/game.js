/* ═══════════════════════════════════════════════════════════
   FLASH — Number Chains Game (Numerical Domain)
   Identify numeric patterns and select the next term.
   Uses distinct pattern families per difficulty tier with
   carefully generated distractors based on common mistakes.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    optionCount: 4,
    baseTime: 12000,
    minTime: 6000,
    questionsPerLevel: 4,
    correctBase: 100,
    streakBonus: 25,
    timeBonusMax: 80
  };

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

  // ═══════════════════════════════════════════════════════════
  // PATTERN GENERATORS
  // Each generator returns:
  //   { sequence: [t1, t2, t3, t4], answer: t5, rule: "description" }
  // ═══════════════════════════════════════════════════════════

  // ── Arithmetic: t(n+1) = t(n) + d ──
  function patternArithmetic(startMin, startMax, stepMin, stepMax) {
    const start = randInt(startMin, startMax);
    const step = randInt(stepMin, stepMax) * (Math.random() < 0.4 ? -1 : 1);
    const seq = [];
    for (let i = 0; i < 4; i++) seq.push(start + step * i);
    const answer = start + step * 4;
    const rule = step >= 0
      ? `Add ${step} each step`
      : `Subtract ${Math.abs(step)} each step`;
    return { sequence: seq, answer, rule, step };
  }

  // ── Geometric: t(n+1) = t(n) * r ──
  function patternGeometric(startMin, startMax, ratioMin, ratioMax) {
    const ratio = randInt(ratioMin, ratioMax);
    let start = randInt(startMin, startMax);
    // Avoid starting with zero or 1 for readability
    if (start === 0) start = 2;
    const seq = [];
    for (let i = 0; i < 4; i++) seq.push(start * Math.pow(ratio, i));
    const answer = start * Math.pow(ratio, 4);
    return { sequence: seq, answer, rule: `Multiply by ${ratio} each step`, ratio };
  }

  // ── Alternating: +a then ×b (or similar) ──
  function patternAlternating() {
    const a = randInt(2, 6);
    const b = randInt(2, 3);
    const altType = Math.random() < 0.5 ? 'add-then-mul' : 'sub-then-mul';
    const start = randInt(3, 8);
    const seq = [start];
    let current = start;
    for (let i = 0; i < 3; i++) {
      if (altType === 'add-then-mul') {
        current = (i % 2 === 0) ? current + a : current * b;
      } else {
        current = (i % 2 === 0) ? current - a : current * b;
        if (current < 0) current = start + a * (i + 1); // fallback
      }
      seq.push(current);
    }
    // Determine answer by continuing pattern
    const nextIsMul = (3 % 2 === 1);
    let answer;
    if (altType === 'add-then-mul') {
      answer = nextIsMul ? current * b : current + a;
    } else {
      answer = nextIsMul ? current * b : current - a;
    }
    const ruleText = altType === 'add-then-mul'
      ? `Add ${a}, then multiply by ${b}, repeat`
      : `Subtract ${a}, then multiply by ${b}, repeat`;
    return { sequence: seq, answer, rule: ruleText };
  }

  // ── Fibonacci-like: t(n+2) = t(n) + t(n+1) ──
  function patternFibonacci() {
    const a = randInt(1, 5);
    const b = randInt(1, 6);
    const seq = [a, b];
    for (let i = 2; i < 4; i++) seq.push(seq[i - 1] + seq[i - 2]);
    const answer = seq[3] + seq[2];
    return { sequence: seq, answer, rule: 'Each term is the sum of the two previous', };
  }

  // ── Squares: t(n) = n², n²+offset, etc. ──
  function patternSquares() {
    const offset = randInt(0, 3);
    const startN = randInt(2, 4);
    const seq = [];
    for (let i = 0; i < 4; i++) {
      const n = startN + i;
      seq.push(n * n + offset);
    }
    const answer = (startN + 4) * (startN + 4) + offset;
    const rule = offset === 0 ? 'Perfect squares' : `Squares + ${offset}`;
    return { sequence: seq, answer, rule };
  }

  // ── Growing difference: differences increase (1, 2, 3, 4, ...) ──
  function patternGrowingDiff() {
    const start = randInt(1, 8);
    const diffStart = randInt(1, 3);
    const diffInc = randInt(1, 2);
    const seq = [start];
    let diff = diffStart;
    for (let i = 0; i < 3; i++) {
      seq.push(seq[seq.length - 1] + diff);
      diff += diffInc;
    }
    const answer = seq[seq.length - 1] + diff;
    return { sequence: seq, answer, rule: `Differences grow by ${diffInc}` };
  }

  // ── Linear with alternating sign: +a, -b, +a, -b, ... ──
  function patternAltSign() {
    const a = randInt(2, 8);
    const b = randInt(1, a);
    const start = randInt(10, 20);
    const seq = [start];
    for (let i = 0; i < 3; i++) {
      seq.push(i % 2 === 0 ? seq[seq.length - 1] + a : seq[seq.length - 1] - b);
    }
    const nextIsAdd = seq.length % 2 === 0;
    const answer = nextIsAdd ? seq[seq.length - 1] + a : seq[seq.length - 1] - b;
    return { sequence: seq, answer, rule: `+${a}, −${b}, repeating` };
  }

  // ── Interleaved: two independent subsequences ──
  function patternInterleaved() {
    // Positions 0,2,4,6 are one sequence; 1,3,5,7 are another
    const a1 = randInt(1, 5);
    const d1 = randInt(1, 4);
    const b1 = randInt(10, 20);
    const d2 = randInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);

    // seq[0]=a1, seq[1]=b1, seq[2]=a1+d1, seq[3]=b1+d2, seq[4]=a1+2d1 (answer)
    const seq = [a1, b1, a1 + d1, b1 + d2];
    const answer = a1 + 2 * d1;
    return { sequence: seq, answer, rule: 'Two interleaved sequences' };
  }

  // ── Squares of arithmetic: n², (n+1)², ... ──
  function patternCubes() {
    const startN = randInt(1, 3);
    const seq = [];
    for (let i = 0; i < 4; i++) {
      const n = startN + i;
      seq.push(n * n * n);
    }
    const answer = Math.pow(startN + 4, 3);
    return { sequence: seq, answer, rule: 'Perfect cubes' };
  }

  // ═══════════════════════════════════════════════════════════
  // PATTERN DISPATCHER BY LEVEL
  // ═══════════════════════════════════════════════════════════
  function generatePattern(level) {
    if (level <= 3) {
      // Simple arithmetic
      return patternArithmetic(1, 15, 2, 6);
    }
    if (level <= 6) {
      // Arithmetic with negatives + geometric
      return Math.random() < 0.5
        ? patternArithmetic(5, 40, 3, 9)
        : patternGeometric(1, 4, 2, 3);
    }
    if (level <= 9) {
      // Alternating + Fibonacci
      return Math.random() < 0.5
        ? patternAlternating()
        : patternFibonacci();
    }
    if (level <= 12) {
      // Squares + growing diff
      return Math.random() < 0.5
        ? patternSquares()
        : patternGrowingDiff();
    }
    // Level 13-15: Hardest
    const roll = Math.random();
    if (roll < 0.33) return patternAltSign();
    if (roll < 0.66) return patternInterleaved();
    return patternCubes();
  }

  // ═══════════════════════════════════════════════════════════
  // DISTRACTOR GENERATION
  // Distractors are plausible wrong answers derived from
  // applying the pattern incorrectly:
  //   + off-by-one
  //   + wrong operator at the last step
  //   + resetting the pattern
  //   + one-step-behind (using previous difference)
  // ═══════════════════════════════════════════════════════════
  function generateDistractors(answer, pattern, level) {
    const set = new Set();
    const last = pattern.sequence[pattern.sequence.length - 1];
    const prev = pattern.sequence[pattern.sequence.length - 2];
    const step = last - prev;

    const candidates = [
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      last + step,                // would be the term before answer
      last,                       // user forgot to apply pattern
      prev + step * 2,            // doubled the step
      last + Math.abs(step) + 1,
      last - step,                // reversed the direction
      answer * 2,
      Math.floor(answer / 2),
      answer + randInt(3, 7),
      answer - randInt(3, 7)
    ];

    // Shuffle for variety
    const shuffled = shuffle(candidates);

    for (const c of shuffled) {
      if (set.size >= CONFIG.optionCount - 1) break;
      if (c === answer) continue;
      if (c < 0) continue;
      if (!Number.isInteger(c)) continue;
      set.add(c);
    }

    // Pad if not enough
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
  // QUESTION GENERATION
  // ═══════════════════════════════════════════════════════════
  function generateQuestion(level) {
    // Retry if pattern generation produces degenerate cases
    let pattern;
    let guard = 0;
    do {
      pattern = generatePattern(level);
      guard++;
    } while (
      guard < 20 &&
      (pattern.answer <= 0 ||
        pattern.sequence.some(n => n < 0 || !Number.isFinite(n)) ||
        new Set(pattern.sequence).size < 3)
    );

    const distractors = generateDistractors(pattern.answer, pattern, level);
    const options = shuffle([pattern.answer, ...distractors]);

    return {
      sequence: pattern.sequence,
      answer: pattern.answer,
      rule: pattern.rule,
      options
    };
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

  function renderSequence(sequence, revealLast = false, wrongTerm = null) {
    const terms = sequence.map((n, i) => {
      const isLast = i === sequence.length - 1;
      let cls = 'seq-term';
      if (isLast && revealLast) {
        cls += wrongTerm !== null && wrongTerm !== n ? ' revealed wrong-reveal' : ' revealed';
      } else if (isLast) {
        cls += ' mystery';
      }
      return `<span class="${cls}">${n}</span>`;
    }).join('<span class="seq-arrow">→</span>');

    return `<div class="sequence">${terms}</div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // GAME FLOW
  // ═══════════════════════════════════════════════════════════
  function showIdle() {
    setPhase('idle');
    setTimer(100);
    render(`
      <div class="phase-title">Numerical Domain · Pattern Recognition</div>
      <h1 class="phase-headline grd">Number Chains</h1>
      <p class="phase-sub">
        Find the pattern in each sequence and pick the
        <strong style="color:#9D4EDD">next term</strong>.
        <br><br>
        <strong>4 questions</strong> per level · <strong>3 lives</strong>
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
    const t = CONFIG.baseTime - (level - 1) * 400;
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

    // Display sequence + mystery last cell
    const displaySeq = [...q.sequence, q.answer];

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Question ${state.questionIndex}/${CONFIG.questionsPerLevel}</div>
      ${renderSequence(displaySeq, false)}
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

    // Reveal the answer in the sequence display
    const displaySeq = [...state.currentQuestion.sequence, correct];

    // Disable all options
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    // Update sequence display with revealed answer
    const seqEl = elContent.querySelector('.sequence');
    if (seqEl) {
      seqEl.outerHTML = renderSequence(displaySeq, true);
    }

    // Show rule hint
    const ruleEl = document.createElement('div');
    ruleEl.className = 'rule-hint';
    ruleEl.textContent = `Pattern: ${state.currentQuestion.rule}`;
    elContent.appendChild(ruleEl);

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = Math.round((1 - elapsed / state.currentQuestion.timeLimit) * CONFIG.timeBonusMax);
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');

      setTimeout(() => nextQuestion(), 1400);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';

      state.lives--;
      elLives.textContent = String(state.lives);

      setPhase('wrong');

      if (state.lives <= 0) {
        setTimeout(() => completeGame(), 2400);
      } else {
        setTimeout(() => nextQuestion(), 2400);
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
    const displaySeq = [...state.currentQuestion.sequence, correct];

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const val = parseInt(b.dataset.value, 10);
      if (val === correct) b.classList.add('correct');
    });

    const seqEl = elContent.querySelector('.sequence');
    if (seqEl) {
      seqEl.outerHTML = renderSequence(displaySeq, true);
    }

    const ruleEl = document.createElement('div');
    ruleEl.className = 'rule-hint';
    ruleEl.textContent = `Pattern: ${state.currentQuestion.rule}`;
    elContent.appendChild(ruleEl);

    setPhase('wrong');

    if (state.lives <= 0) {
      setTimeout(() => completeGame(), 2400);
    } else {
      setTimeout(() => nextQuestion(), 2400);
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
        gameId: 'num-chains',
        domain: 'numerical',
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

    if (!root) { console.error('[NumChains] Container not found'); return; }

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

  window.NumChainsGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };
})();