/* ═══════════════════════════════════════════════════════════
   FLASH — Micro Expressions Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.MEAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let timeouts = [];
  let M = {};

  function clearAll() { timeouts.forEach(clearTimeout); timeouts = []; }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 faces · Fast reads',         meta: '→ 600ms flash' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',       meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 faces · Slow flash · Max accuracy', meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 faces · Fixed protocol',     meta: '→ Once per day' }
    ];
  }

  /* ═══ COMMON RENDER — Uses API's renderFace ═══ */
  function renderTrial(q, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="stimulus-blank" id="stimulus-area">⌛</div>
      <p class="phase-hint" style="margin-top:10px;">Watch carefully...</p>
    `;
  }

  function renderOptions(q, emoMap) {
    return `
      <p class="phase-sub" style="margin-bottom:16px;">What emotion did you see?</p>
      <div class="options-grid">
        ${q.options.map((o, i) => {
          const e = emoMap[o.key];
          return `
            <button class="option-btn" data-index="${i}" data-key="${i+1}">
              <span class="em-icon">${e.icon}</span>
              ${e.label}
            </button>
          `;
        }).join('')}
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

  function revealFace(q) {
    const optionsGrid = API.getElContent().querySelector('.options-grid');
    if (optionsGrid) {
      optionsGrid.insertAdjacentHTML('beforebegin',
        `<div class="face-display">${API.renderFace(q.emotionKey)}</div>`);
    }
  }

  /* ═══════════════════════════════════════════════════════
     CORE TRIAL RUNNER — shared by all modes
     ═══════════════════════════════════════════════════════ */
  function runTrial(q, config, onAnswer, onTimeout) {
    // 1. Show pause
    API.setPhase('ready');
    API.render(`<div class="stimulus-blank">⌛</div><p class="phase-hint" style="margin-top:10px;">Face appearing...</p>`);

    // 2. After 350ms show the face
    push(() => {
      API.setPhase('stimulus');
      API.render(`<div class="face-display">${API.renderFace(q.emotionKey)}</div>`);

      // 3. Hide after flash duration
      push(() => {
        API.setPhase('question');
        M.trialStart = performance.now();

        API.render(`
          ${config.headerHTML || ''}
          ${renderOptions(q, API.EMOTIONS)}
        `);
        wireButtons((btn) => onAnswer(btn, q));

        // Start response timer
        const timeLimit = config.responseTimeLimit || 10000;
        const start = performance.now();
        API.setTimer(100);
        M.responseTimerId = setInterval(() => {
          const elapsed = performance.now() - start;
          const remaining = Math.max(0, timeLimit - elapsed);
          const pct = (remaining / timeLimit) * 100;
          API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
          if (remaining <= 0) {
            clearInterval(M.responseTimerId);
            M.responseTimerId = null;
            if (!M.answered) onTimeout(q);
          }
        }, 50);
        timeouts.push(M.responseTimerId);
      }, config.flashDuration);
    }, 350);
  }

  function stopResponseTimer() {
    if (M.responseTimerId) {
      clearInterval(M.responseTimerId);
      M.responseTimerId = null;
    }
  }

  /* ═══════════════════════════════════════════════════════
     SPEED MODE — 15 faces · 600ms flash
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = {
      mode: 'speed', trial: 0, total: 15, correct: 0,
      rtList: [], answered: false, ended: false,
      flashDuration: 600, responseTimeLimit: 6000
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 faces · 600ms flash each', nextSpeedTrial);
  }

  function nextSpeedTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endSpeed(); return; }

    const q = API.generateQuestion(5);
    M.current = q;
    M.answered = false;
    M.trial++;

    const headerHTML = `<div class="practice-badge" style="background:rgba(255,77,109,.12);border-color:rgba(255,77,109,.4);color:#FF4D6D;">SPEED · ${M.trial} / ${M.total}</div>`;

    runTrial(q, {
      flashDuration: M.flashDuration,
      responseTimeLimit: M.responseTimeLimit,
      headerHTML
    }, handleSpeedAnswer, handleSpeedTimeout);
  }

  function handleSpeedAnswer(btn, q) {
    if (M.answered) return;
    M.answered = true;
    stopResponseTimer();

    const chosen = parseInt(btn.dataset.index, 10);
    const isCorrect = chosen === q.correctIdx;
    const rt = performance.now() - M.trialStart;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= M.responseTimeLimit) M.rtList.push(rt);
    }

    lockButtons(btn, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    push(nextSpeedTrial, isCorrect ? 1000 : 1800);
  }

  function handleSpeedTimeout(q) {
    if (M.answered) return;
    M.answered = true;
    lockButtons(null, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(false);
    if (S) S.miss();
    push(nextSpeedTrial, 1800);
  }

  function endSpeed() {
    M.ended = true; clearAll();
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

    const nb = H.checkAndUnlockBadges('speed', { trials: M.total, medianRT, accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy, medianRT });
    API.emit({ gameId: 'micro-expressions', domain: 'emotional', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = {
      mode: 'endless', level: 1, totalCorrect: 0,
      answered: false, ended: false, rtList: [],
      flashDuration: 900, responseTimeLimit: 8000
    };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', nextEndlessTrial);
  }

  function nextEndlessTrial() {
    if (M.ended) return;

    // Difficulty ramps: flash duration decreases
    const flashDur = Math.max(350, 900 - (M.level - 1) * 60);
    const q = API.generateQuestion(Math.min(15, M.level + 2));
    M.current = q;
    M.answered = false;

    const headerHTML = `
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
      </div>
    `;

    runTrial(q, {
      flashDuration: flashDur,
      responseTimeLimit: M.responseTimeLimit,
      headerHTML
    }, handleEndlessAnswer, handleEndlessTimeout);
  }

  function handleEndlessAnswer(btn, q) {
    if (M.answered) return;
    M.answered = true;
    stopResponseTimer();

    const chosen = parseInt(btn.dataset.index, 10);
    const isCorrect = chosen === q.correctIdx;
    const rt = performance.now() - M.trialStart;

    lockButtons(btn, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    if (!isCorrect) {
      push(() => endEndless('wrong'), 1600);
      return;
    }

    M.totalCorrect++;
    if (rt >= 100 && rt <= M.responseTimeLimit) M.rtList.push(rt);

    // Level up every 3 correct
    if (M.totalCorrect % 3 === 0) {
      M.level++;
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
    }

    push(nextEndlessTrial, 1200);
  }

  function handleEndlessTimeout(q) {
    if (M.answered) return;
    M.answered = true;
    lockButtons(null, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(false);
    if (S) S.miss();
    push(() => endEndless('timeout'), 1600);
  }

  function endEndless(reason) {
    M.ended = true; clearAll();
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

    const nb = H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'micro-expressions', domain: 'emotional', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 faces · Slow flash · Max accuracy
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision', trial: 0, total: 15, correct: 0,
      answered: false, ended: false, rtList: [],
      flashDuration: 2000, responseTimeLimit: 30000
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 faces · Slow flash · Accuracy only', nextPrecisionTrial);
  }

  function nextPrecisionTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endPrecision(); return; }

    const q = API.generateQuestion(12);
    M.current = q;
    M.answered = false;
    M.trial++;

    const headerHTML = `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.trial} / ${M.total}</div>`;

    runTrial(q, {
      flashDuration: M.flashDuration,
      responseTimeLimit: M.responseTimeLimit,
      headerHTML
    }, handlePrecisionAnswer, handlePrecisionTimeout);
  }

  function handlePrecisionAnswer(btn, q) {
    if (M.answered) return;
    M.answered = true;
    stopResponseTimer();

    const chosen = parseInt(btn.dataset.index, 10);
    const isCorrect = chosen === q.correctIdx;
    const rt = performance.now() - M.trialStart;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= M.responseTimeLimit) M.rtList.push(rt);
    }

    lockButtons(btn, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    push(nextPrecisionTrial, isCorrect ? 1400 : 2200);
  }

  function handlePrecisionTimeout(q) {
    if (M.answered) return;
    M.answered = true;
    lockButtons(null, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(false);
    if (S) S.miss();
    push(nextPrecisionTrial, 2200);
  }

  function endPrecision() {
    M.ended = true; clearAll();
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

    const nb = H.checkAndUnlockBadges('precision', { accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT });
    API.emit({ gameId: 'micro-expressions', domain: 'emotional', mode: 'precision', accuracy, medianRT, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 faces · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily', trial: 0, total: 20, correct: 0,
      answered: false, ended: false, rtList: [],
      flashDuration: 800, responseTimeLimit: 10000
    };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 faces · Fixed protocol', nextDailyTrial);
  }

  function nextDailyTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endDaily(); return; }

    const q = API.generateQuestion(8);
    M.current = q;
    M.answered = false;
    M.trial++;

    const headerHTML = `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.trial} / ${M.total}</div>`;

    runTrial(q, {
      flashDuration: M.flashDuration,
      responseTimeLimit: M.responseTimeLimit,
      headerHTML
    }, handleDailyAnswer, handleDailyTimeout);
  }

  function handleDailyAnswer(btn, q) {
    if (M.answered) return;
    M.answered = true;
    stopResponseTimer();

    const chosen = parseInt(btn.dataset.index, 10);
    const isCorrect = chosen === q.correctIdx;
    const rt = performance.now() - M.trialStart;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= M.responseTimeLimit) M.rtList.push(rt);
    }

    lockButtons(btn, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    push(nextDailyTrial, isCorrect ? 1200 : 2000);
  }

  function handleDailyTimeout(q) {
    if (M.answered) return;
    M.answered = true;
    lockButtons(null, q.correctIdx);
    revealFace(q);
    API.showFeedbackFlash(false);
    if (S) S.miss();
    push(nextDailyTrial, 2000);
  }

  function endDaily() {
    M.ended = true; clearAll();

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

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'micro-expressions', domain: 'emotional', mode: 'daily', accuracy, rcs });
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

  window.MicroExpressionsExtraModes = { getModeDefinitions, start };
})();