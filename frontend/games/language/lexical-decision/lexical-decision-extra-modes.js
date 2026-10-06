/* ═══════════════════════════════════════════════════════════
   FLASH — Lexical Decision Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.LDAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let M = {};
  let timeouts = [];

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      timeouts.push(id);
    });
  }

  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 trials · Fast decisions',    meta: '→ Quick primed decisions' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',       meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 trials · Slow pace',         meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 trials · Fixed protocol',    meta: '→ Once per day' }
    ];
  }

  /* ═══ SHARED: RUN ONE TRIAL ═══ */
  function runTrial(trial, primeDur, gapDur, responseDur) {
    return new Promise(resolve => {
      let settled = false;
      let timerId = null;
      let startTime = 0;

      function finish(answer, rt) {
        if (settled) return;
        settled = true;
        if (timerId) { clearInterval(timerId); timerId = null; }
        resolve({ answer, rt: rt || 0 });
      }

      // 1. Prime phase
      API.setPhase('prime');
      API.render(`
        ${M.headerHTML || ''}
        <div class="word-stage">
          <div class="word-prime">${trial.prime}</div>
        </div>
      `);
      if (S && S.primeShow) S.primeShow();

      push(() => {
        if (M.ended) return;

        // 2. Gap phase
        API.setPhase('gap');
        API.render(`
          ${M.headerHTML || ''}
          <div class="word-stage">
            <div class="word-blank">···</div>
          </div>
        `);

        push(() => {
          if (M.ended) return;

          // 3. Target phase + buttons
          API.setPhase('target');
          startTime = performance.now();

          API.render(`
            ${M.headerHTML || ''}
            <div class="word-stage">
              <div class="word-target">${trial.target}</div>
            </div>
            <div class="answer-row">
              <button class="answer-btn real-word" data-answer="real">
                <span class="btn-icon">✓</span>
                <span>Real Word</span>
                <span class="key-hint">[1]</span>
              </button>
              <button class="answer-btn non-word" data-answer="non">
                <span class="btn-icon">✕</span>
                <span>Non-Word</span>
                <span class="key-hint">[2]</span>
              </button>
            </div>
          `);
          if (S && S.targetShow) S.targetShow();

          const btns = API.getElContent().querySelectorAll('.answer-btn');
          btns.forEach(btn => {
            btn.addEventListener('click', () => {
              if (settled) return;
              const rt = performance.now() - startTime;
              btns.forEach(b => b.disabled = true);
              finish(btn.dataset.answer, rt);
            });
          });

          // Response timer
          API.setTimer(100);
          const start = performance.now();
          timerId = setInterval(() => {
            if (settled || M.ended) { clearInterval(timerId); timerId = null; return; }
            const elapsed = performance.now() - start;
            const remaining = Math.max(0, responseDur - elapsed);
            const pct = (remaining / responseDur) * 100;
            API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
            if (remaining <= 0) {
              clearInterval(timerId); timerId = null;
              btns.forEach(b => b.disabled = true);
              finish(null, responseDur);
            }
          }, 40);
          timeouts.push(timerId);

        }, gapDur);

      }, primeDur);
    });
  }

  /* ═══ SHARED: HANDLE RESULT ═══ */
  function handleResult(trial, result, state) {
    const isTimeout = result.answer === null;
    const isCorrect = !isTimeout && (
      (result.answer === 'real' && trial.isReal) ||
      (result.answer === 'non'  && !trial.isReal)
    );

    // Record
    state.total++;
    if (isCorrect) {
      state.correct++;
      if (result.rt >= 100 && result.rt <= 5000) state.rtList.push(result.rt);
    }

    if (trial.isReal) {
      state.realTotal++;
      if (isCorrect) state.realCorrect++;
    } else {
      state.nonTotal++;
      if (isCorrect) state.nonCorrect++;
    }

    // Relatedness tracking for priming effect
    if (trial.related) {
      state.relatedTotal++;
      if (isCorrect && result.rt >= 100 && result.rt <= 5000) state.relatedRTs.push(result.rt);
    } else {
      state.unrelatedTotal++;
      if (isCorrect && result.rt >= 100 && result.rt <= 5000) state.unrelatedRTs.push(result.rt);
    }

    // Visual feedback
    const btns = API.getElContent().querySelectorAll('.answer-btn');
    btns.forEach(b => {
      b.disabled = true;
      const correctAnswer = trial.isReal ? 'real' : 'non';
      if (b.dataset.answer === correctAnswer) b.classList.add('correct');
      else if (b.dataset.answer === result.answer) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }
    if (API.haptic) API.haptic(isCorrect ? 'correct' : 'wrong');

    return isCorrect;
  }

  function computePriming(state) {
    const relMed = H.median(state.relatedRTs);
    const unrelMed = H.median(state.unrelatedRTs);
    if (!relMed || !unrelMed) return 0;
    return Math.max(0, Math.round(unrelMed - relMed));
  }

  /* ═══════════════════════════════════════════
     SPEED MODE — 15 trials · Fast decisions
     ═══════════════════════════════════════════ */
  function startSpeed() {
    M = {
      mode: 'speed',
      total: 15,
      correct: 0,
      rtList: [],
      realTotal: 0, realCorrect: 0,
      nonTotal: 0, nonCorrect: 0,
      relatedTotal: 0, unrelatedTotal: 0,
      relatedRTs: [], unrelatedRTs: [],
      ended: false,
      headerHTML: ''
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 trials · Fast decisions', async () => {
      for (let i = 1; i <= 15; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(8);
        M.headerHTML = `<div class="practice-badge">SPEED · ${i} / 15</div>`;

        const result = await runTrial(trial, 350, 200, 2500);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.answer === null ? 1200 : 700);
      }
      endSpeed();
    });
  }

  function endSpeed() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const priming = computePriming(M);

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

    const nb = H.checkAndUnlockBadges('speed', { totalCorrect: M.correct });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy, medianRT, primingEffect: priming });
    API.emit({ gameId: 'lexical-decision', domain: 'language', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT, primingEffect: priming });
  }

  /* ═══════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════ */
  function startEndless() {
    M = {
      mode: 'endless',
      level: 1,
      totalCorrect: 0,
      rtList: [],
      realTotal: 0, realCorrect: 0,
      nonTotal: 0, nonCorrect: 0,
      relatedTotal: 0, unrelatedTotal: 0,
      relatedRTs: [], unrelatedRTs: [],
      ended: false,
      headerHTML: ''
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', async () => {
      while (!M.ended) {
        const trial = API.generateTrial(Math.min(15, M.level + 3));
        M.headerHTML = `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `;

        const primeDur = Math.max(200, 450 - M.level * 15);
        const gapDur = Math.max(120, 250 - M.level * 8);
        const responseDur = 3000;

        const result = await runTrial(trial, primeDur, gapDur, responseDur);
        if (M.ended) return;

        const isCorrect = handleResult(trial, result, M);
        await wait(isCorrect ? 700 : 1500);

        if (!isCorrect) {
          endEndless();
          return;
        }

        M.totalCorrect++;
        if (M.totalCorrect % 3 === 0) {
          M.level++;
          API.showLevelUpFlash(`LEVEL ${M.level}!`);
          if (S) S.levelUp();
        }
      }
    });
  }

  function endEndless() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    const medianRT = H.median(M.rtList);
    const priming = computePriming(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect, medianRT, primingEffect: priming });
    API.emit({ gameId: 'lexical-decision', domain: 'language', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect, medianRT, primingEffect: priming });
  }

  /* ═══════════════════════════════════════════
     PRECISION — 15 trials · Slow pace
     ═══════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision',
      total: 15,
      correct: 0,
      rtList: [],
      realTotal: 0, realCorrect: 0,
      nonTotal: 0, nonCorrect: 0,
      relatedTotal: 0, unrelatedTotal: 0,
      relatedRTs: [], unrelatedRTs: [],
      ended: false,
      headerHTML: ''
    };

    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 trials · Slow pace', async () => {
      for (let i = 1; i <= 15; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(10);
        M.headerHTML = `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${i} / 15</div>`;

        const result = await runTrial(trial, 700, 350, 20000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.answer === null ? 1400 : 1000);
      }
      endPrecision();
    });
  }

  function endPrecision() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const priming = computePriming(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, primingEffect: priming });
    API.emit({ gameId: 'lexical-decision', domain: 'language', mode: 'precision', accuracy, medianRT, primingEffect: priming, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════
     DAILY — 20 trials · Fixed protocol
     ═══════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily',
      total: 20,
      correct: 0,
      rtList: [],
      realTotal: 0, realCorrect: 0,
      nonTotal: 0, nonCorrect: 0,
      relatedTotal: 0, unrelatedTotal: 0,
      relatedRTs: [], unrelatedRTs: [],
      ended: false,
      headerHTML: ''
    };

    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 trials · Fixed protocol', async () => {
      for (let i = 1; i <= 20; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(8);
        M.headerHTML = `<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">DAILY · ${i} / 20</div>`;

        const result = await runTrial(trial, 450, 250, 8000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.answer === null ? 1200 : 800);
      }
      endDaily();
    });
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const priming = computePriming(M);
    const rcs = H.rcs(M.correct, M.rtList);

    H.markTodayDone({ accuracy, rcs, primingEffect: priming });

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

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, medianRT, primingEffect: priming });
    API.emit({ gameId: 'lexical-decision', domain: 'language', mode: 'daily', accuracy, medianRT, primingEffect: priming, rcs });
  }

  /* ═══ PUBLIC ═══ */
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

  function abort() {
    M.ended = true;
    clearAll();
  }

  window.LexicalDecisionExtraModes = { getModeDefinitions, start, abort };
})();