/* ═══════════════════════════════════════════════════════════
   FLASH — Creative Connect Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.CCAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null;
  let S = null;
  let H = null;
  let timeouts = [];
  let M = {};

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  /* ═══ MODE DEFINITIONS ═══ */
  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 puzzles · Fast answers',         meta: '→ 12s per puzzle' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',            meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 puzzles · Max accuracy · No rush',meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 puzzles · Fixed protocol',        meta: '→ Once per day' }
    ];
  }

  /* ═══ COMMON RENDER HELPERS ═══ */
  function renderPuzzle(q, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="triad-wrap">
        <div class="triad-word">${q.triad[0]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[1]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[2]}</div>
      </div>
      <div class="triad-question">Which word connects all three?</div>
      <div class="options-grid">
        ${q.options.map((o, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i+1}">${o.text}</button>
        `).join('')}
      </div>
    `;
  }

  function wireButtons(handler) {
    API.getElContent().querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handler(btn));
    });
  }

  function lockButtons(btn, correctIdx) {
    API.getElContent().querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
  }

  function showExplanation(q) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `
      <div class="explanation-title">The Connection</div>
      <div class="explanation-text"><strong>${q.answer}</strong> · ${q.solution}</div>
    `;
    API.getElContent().appendChild(ex);
  }

  /* ═══════════════════════════════════════════════════════
     SPEED MODE — 15 puzzles · 12s per puzzle
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    const TOTAL = 15;
    const TIME_LIMIT = 12000;

    M = {
      mode: 'speed',
      trial: 0,
      total: TOTAL,
      correct: 0,
      rtList: [],
      answered: false,
      ended: false,
      current: null,
      timerId: null
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 puzzles · 12 seconds each', () => nextSpeedTrial(TIME_LIMIT));
  }

  function nextSpeedTrial(TIME_LIMIT) {
    if (M.ended) return;
    if (M.trial >= M.total) { endSpeed(); return; }

    const q = API.generateQuestion(5);  // mid-level pool for speed
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(renderPuzzle(q, `
      <div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:var(--gold);">
        SPEED · ${M.trial + 1} / ${M.total}
      </div>
    `));

    wireButtons((btn) => handleSpeedAnswer(btn, TIME_LIMIT));

    M.current.startTime = performance.now();
    const start = performance.now();
    M.timerId = setInterval(() => {
      if (M.ended || M.answered) { clearInterval(M.timerId); return; }
      const elapsed = performance.now() - start;
      const pct = Math.max(0, 100 - (elapsed / TIME_LIMIT) * 100);
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (elapsed >= TIME_LIMIT) {
        clearInterval(M.timerId);
        if (!M.answered) {
          M.answered = true;
          lockButtons(null, M.current.correctIdx);
          showExplanation(M.current);
          API.showFeedbackFlash(false);
          if (S) S.miss();
          M.trial++;
          push(() => nextSpeedTrial(TIME_LIMIT), 1800);
        }
      }
    }, 50);
    timeouts.push(M.timerId);
  }

  function handleSpeedAnswer(btn, TIME_LIMIT) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    if (M.timerId) clearInterval(M.timerId);

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= TIME_LIMIT) M.rtList.push(rt);
    }

    lockButtons(btn, correct);
    showExplanation(M.current);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(() => nextSpeedTrial(TIME_LIMIT), isCorrect ? 1200 : 2200);
  }

  function endSpeed() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);

    if (S) S.victory();

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} correct</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const newBadges = H.checkAndUnlockBadges('speed', { trials: M.total, medianRT, accuracy });
    if (newBadges.length && S) S.badge();

    if (window.FlashStages) {
      window.FlashStages.checkSession({
        mode: 'speed', totalCorrect: M.correct, accuracy, medianRT
      });
    }

    API.emit({
      gameId: 'creative-connect', domain: 'creativity', mode: 'speed',
      totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT
    });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = {
      mode: 'endless',
      level: 1,
      totalCorrect: 0,
      current: null,
      answered: false,
      ended: false,
      rtList: []
    };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', nextEndlessTrial);
  }

  function nextEndlessTrial() {
    if (M.ended) return;

    const difficulty = Math.min(15, M.level + 2);
    const q = API.generateQuestion(difficulty);
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(renderPuzzle(q, null, `
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
      </div>
    `));

    wireButtons((btn) => handleEndlessAnswer(btn));
    API.setTimer(100);
  }

  function handleEndlessAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    lockButtons(btn, correct);
    showExplanation(M.current);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    if (!isCorrect) {
      push(() => endEndless('wrong'), 1800);
      return;
    }

    M.totalCorrect++;
    if (rt >= 100 && rt <= 60000) M.rtList.push(rt);

    // Level up every 3 correct
    if (M.totalCorrect % 3 === 0) {
      M.level++;
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
    }

    push(nextEndlessTrial, 1800);
  }

  function endEndless(reason) {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.totalCorrect}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const newBadges = H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (newBadges.length && S) S.badge();

    if (window.FlashStages) {
      window.FlashStages.checkSession({
        mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect
      });
    }

    API.emit({
      gameId: 'creative-connect', domain: 'creativity', mode: 'endless',
      levelReached: M.level, totalCorrect: M.totalCorrect, medianRT
    });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 puzzles · No rush
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision',
      trial: 0,
      total: 15,
      correct: 0,
      current: null,
      answered: false,
      ended: false,
      rtList: []
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 puzzles · Accuracy only', nextPrecisionTrial);
  }

  function nextPrecisionTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endPrecision(); return; }

    const q = API.generateQuestion(12);  // hard pool for precision
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(renderPuzzle(q, `
      <div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:var(--green);">
        PRECISION · ${M.trial + 1} / ${M.total}
      </div>
    `));

    wireButtons((btn) => handlePrecisionAnswer(btn));
    API.setTimer(100);
  }

  function handlePrecisionAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 120000) M.rtList.push(rt);
    }

    lockButtons(btn, correct);
    showExplanation(M.current);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextPrecisionTrial, isCorrect ? 1400 : 2400);
  }

  function endPrecision() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} correct</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const newBadges = H.checkAndUnlockBadges('precision', { accuracy });
    if (newBadges.length && S) S.badge();

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT });
    }

    API.emit({
      gameId: 'creative-connect', domain: 'creativity', mode: 'precision',
      accuracy, medianRT, totalTrials: M.total
    });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 puzzles · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily',
      trial: 0,
      total: 20,
      correct: 0,
      current: null,
      answered: false,
      ended: false,
      rtList: []
    };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 puzzles · Fixed protocol', nextDailyTrial);
  }

  function nextDailyTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endDaily(); return; }

    const q = API.generateQuestion(8);  // medium pool
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(renderPuzzle(q, `
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        DAILY · ${M.trial + 1} / ${M.total}
      </div>
    `));

    wireButtons((btn) => handleDailyAnswer(btn));
    API.setTimer(100);
  }

  function handleDailyAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 60000) M.rtList.push(rt);
    }

    lockButtons(btn, correct);
    showExplanation(M.current);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextDailyTrial, isCorrect ? 1200 : 2200);
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const rcs = H.rcs(M.correct, M.rtList);
    H.markTodayDone({ rcs, accuracy });
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    }

    API.emit({
      gameId: 'creative-connect', domain: 'creativity', mode: 'daily',
      accuracy, rcs
    });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef;
    S = sRef;
    H = hRef;
    clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.CreativeConnectExtraModes = { getModeDefinitions, start };
})();