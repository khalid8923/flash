/* ═══════════════════════════════════════════════════════════
   FLASH — Symbol Sprint Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.SSAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let M = {};
  let timeouts = [];

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (M.responseTimer) { clearInterval(M.responseTimer); M.responseTimer = null; }
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 grids · Short deadline',  meta: '→ 4s per grid' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',   meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 grids · Accuracy only',  meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 grids · Fixed protocol', meta: '→ Once per day' }
    ];
  }

  /* ═══ SHARED: RUN ONE TRIAL ═══ */
  function runTrial(trial, timeLimit) {
    return new Promise(resolve => {
      let settled = false;
      let startTime = 0;

      API.setPhase('trial');
      API.render(API.renderTrial(trial, M.headerHTML || ''));

      startTime = performance.now();

      const cells = API.getElContent().querySelectorAll('.ss-cell');

      function finish(foundIdx, rt) {
        if (settled) return;
        settled = true;
        if (M.responseTimer) { clearInterval(M.responseTimer); M.responseTimer = null; }
        resolve({ foundIdx, rt: rt || 0, timedOut: foundIdx === null });
      }

      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          if (settled) return;
          const idx = parseInt(cell.dataset.idx, 10);
          const rt = performance.now() - startTime;

          // Visual lock
          cells.forEach(c => { c.style.pointerEvents = 'none'; });
          if (idx === trial.targetIdx) {
            cell.classList.add('ss-cell-correct');
          } else {
            cell.classList.add('ss-cell-wrong');
            // Reveal correct target
            const correctCell = API.getElContent().querySelector(`.ss-cell[data-idx="${trial.targetIdx}"]`);
            if (correctCell) correctCell.classList.add('ss-cell-target-reveal');
          }
          finish(idx, rt);
        });
      });

      // Response timer
      API.setTimer(100);
      const start = performance.now();
      M.responseTimer = setInterval(() => {
        if (settled || M.ended) {
          if (M.responseTimer) { clearInterval(M.responseTimer); M.responseTimer = null; }
          return;
        }
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, timeLimit - elapsed);
        const pct = (remaining / timeLimit) * 100;
        API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
        if (remaining <= 0) {
          clearInterval(M.responseTimer); M.responseTimer = null;
          cells.forEach(c => {
            c.style.pointerEvents = 'none';
            if (parseInt(c.dataset.idx, 10) === trial.targetIdx) c.classList.add('ss-cell-target-reveal');
          });
          finish(null, timeLimit);
        }
      }, 40);
      timeouts.push(M.responseTimer);
    });
  }

  /* ═══ SHARED: HANDLE RESULT ═══ */
  function handleResult(trial, result, state) {
    const isTimeout = result.timedOut;
    const isCorrect = !isTimeout && result.foundIdx === trial.targetIdx;

    state.total++;
    if (isCorrect) {
      state.correct++;
      if (result.rt >= 100 && result.rt <= 8000) state.rtList.push(result.rt);
    }

    // Track search type performance
    if (trial.searchType === 'feature') {
      state.featureTotal++;
      if (isCorrect && result.rt >= 100) state.featureRTs.push(result.rt);
    } else {
      state.conjunctionTotal++;
      if (isCorrect && result.rt >= 100) state.conjunctionRTs.push(result.rt);
    }

    // Track RT by grid size for slope
    if (isCorrect && result.rt >= 100) {
      const key = 'size' + trial.gridSize;
      if (!state.rtBySize[key]) state.rtBySize[key] = { total: 0, count: 0 };
      state.rtBySize[key].total += result.rt;
      state.rtBySize[key].count++;
    }

    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }
    if (API.haptic) API.haptic(isCorrect ? 'correct' : 'wrong');

    return isCorrect;
  }

  /* ═══ COMPUTE SEARCH SLOPE ═══ */
  function computeSearchSlope(state) {
    // slope = ΔRT / Δdistractors
    const points = [];
    Object.keys(state.rtBySize).forEach(key => {
      const size = parseInt(key.replace('size', ''), 10);
      const data = state.rtBySize[key];
      if (data.count > 0) {
        const avgRT = data.total / data.count;
        const distractors = size * size - 1;
        points.push({ x: distractors, y: avgRT });
      }
    });

    if (points.length < 2) return 0;

    // Simple linear regression
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    points.forEach(p => {
      sumX += p.x; sumY += p.y;
      sumXY += p.x * p.y; sumXX += p.x * p.x;
    });
    const denom = (n * sumXX - sumX * sumX);
    if (denom === 0) return 0;
    const slope = (n * sumXY - sumX * sumY) / denom;
    return Math.max(0, Math.round(slope * 10) / 10);
  }

  function newState() {
    return {
      total: 0, correct: 0,
      rtList: [],
      featureTotal: 0, conjunctionTotal: 0,
      featureRTs: [], conjunctionRTs: [],
      rtBySize: {},
      ended: false,
      headerHTML: ''
    };
  }

  /* ═══════════════════════════════════════════
     SPEED MODE — 15 grids · 4s each
     ═══════════════════════════════════════════ */
  function startSpeed() {
    M = newState();
    M.mode = 'speed';
    M.totalPlanned = 15;

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 grids · 4s per grid', async () => {
      for (let i = 1; i <= 15; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(6);
        M.headerHTML = `<div class="practice-badge">SPEED · ${i} / 15</div>`;

        const result = await runTrial(trial, 4000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 1200 : 700);
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
    const searchSlope = computeSearchSlope(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy, medianRT, searchSlope });
    API.emit({ gameId: 'symbol-sprint', domain: 'speed', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT, searchSlope });
  }

  /* ═══════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════ */
  function startEndless() {
    M = newState();
    M.mode = 'endless';
    M.level = 1;

    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', async () => {
      while (!M.ended) {
        const trial = API.generateTrial(Math.min(15, M.level + 2));

        M.headerHTML = `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `;

        const timeLimit = Math.max(1200, 5000 - M.level * 250);
        const result = await runTrial(trial, timeLimit);
        if (M.ended) return;

        const isCorrect = handleResult(trial, result, M);
        await wait(isCorrect ? 600 : 1400);

        if (!isCorrect) {
          endEndless();
          return;
        }

        if (M.correct % 3 === 0) {
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
    const searchSlope = computeSearchSlope(M);

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.correct, medianRT, searchSlope });
    API.emit({ gameId: 'symbol-sprint', domain: 'speed', mode: 'endless', levelReached: M.level, totalCorrect: M.correct, medianRT, searchSlope });
  }

  /* ═══════════════════════════════════════════
     PRECISION — 15 grids · Accuracy focus
     ═══════════════════════════════════════════ */
  function startPrecision() {
    M = newState();
    M.mode = 'precision';
    M.totalPlanned = 15;

    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 grids · Accuracy focus', async () => {
      for (let i = 1; i <= 15; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(10);
        M.headerHTML = `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${i} / 15</div>`;

        const result = await runTrial(trial, 30000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 1400 : 1000);
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
    const searchSlope = computeSearchSlope(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, searchSlope });
    API.emit({ gameId: 'symbol-sprint', domain: 'speed', mode: 'precision', accuracy, medianRT, searchSlope, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════
     DAILY — 20 grids · Fixed protocol
     ═══════════════════════════════════════════ */
  function startDaily() {
    M = newState();
    M.mode = 'daily';
    M.totalPlanned = 20;

    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 grids · Fixed protocol', async () => {
      for (let i = 1; i <= 20; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(8);
        M.headerHTML = `<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">DAILY · ${i} / 20</div>`;

        const result = await runTrial(trial, 6000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 1200 : 800);
      }
      endDaily();
    });
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const searchSlope = computeSearchSlope(M);
    const rcs = H.rcs(M.correct, M.rtList);

    H.markTodayDone({ accuracy, rcs, searchSlope });

    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">SLOPE</div><div class="stat-value">${searchSlope}<span style="font-size:11px;color:var(--t2)">ms</span></div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, medianRT, searchSlope });
    API.emit({ gameId: 'symbol-sprint', domain: 'speed', mode: 'daily', accuracy, medianRT, searchSlope, rcs });
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

  window.SymbolSprintExtraModes = { getModeDefinitions, start, abort };
})();