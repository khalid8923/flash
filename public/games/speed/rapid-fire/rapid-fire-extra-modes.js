/* ═══════════════════════════════════════════════════════════
   FLASH — Rapid Fire Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.RFAPI at runtime
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
    if (M.trialTimer)    { clearTimeout(M.trialTimer);   M.trialTimer = null; }
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '20 trials · Fast decisions',     meta: '→ 1.5s per trial' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',       meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 trials · Accuracy focus',    meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '25 trials · Fixed protocol',    meta: '→ Once per day' }
    ];
  }

  /* ═══ SHARED: RUN ONE TRIAL ═══ */
  function runTrial(trial, timeLimit) {
    return new Promise(resolve => {
      let settled = false;
      let startTime = 0;

      API.setPhase('trial');
      API.render(API.renderTrial(trial, M.headerHTML || ''));

      // Wire buttons
      const btns = API.getElContent().querySelectorAll('.rf-btn');
      startTime = performance.now();

      function finish(answer, rt) {
        if (settled) return;
        settled = true;
        if (M.responseTimer) { clearInterval(M.responseTimer); M.responseTimer = null; }
        resolve({ answer, rt: rt || 0, timedOut: answer === null });
      }

      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (settled) return;
          const rt = performance.now() - startTime;
          btns.forEach(b => b.disabled = true);
          // Visual lock
          btns.forEach(b => {
            const v = parseInt(b.dataset.value, 10);
            if (v === trial.correctAnswer) b.classList.add('correct');
            else if (b === btn && v !== trial.correctAnswer) b.classList.add('wrong');
          });
          finish(parseInt(btn.dataset.value, 10), rt);
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
          btns.forEach(b => {
            b.disabled = true;
            const v = parseInt(b.dataset.value, 10);
            if (v === trial.correctAnswer) b.classList.add('correct');
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
    const isCorrect = !isTimeout && result.answer === trial.correctAnswer;

    state.total++;
    if (isCorrect) {
      state.correct++;
      if (result.rt >= 100 && result.rt <= 5000) state.rtList.push(result.rt);
    }

    // Switch/Repeat tracking
    if (trial.isSwitch) {
      state.switchTotal++;
      if (isCorrect && result.rt >= 100 && result.rt <= 5000) state.switchRTs.push(result.rt);
    } else {
      state.repeatTotal++;
      if (isCorrect && result.rt >= 100 && result.rt <= 5000) state.repeatRTs.push(result.rt);
    }

    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }
    if (API.haptic) API.haptic(isCorrect ? 'correct' : 'wrong');

    return isCorrect;
  }

  function computeSwitchCost(state) {
    const rMed = H.median(state.repeatRTs);
    const sMed = H.median(state.switchRTs);
    if (!rMed || !sMed) return 0;
    return Math.max(0, Math.round(sMed - rMed));
  }

  function newState() {
    return {
      total: 0, correct: 0,
      rtList: [],
      switchTotal: 0, repeatTotal: 0,
      switchRTs: [], repeatRTs: [],
      ended: false,
      headerHTML: ''
    };
  }

  /* ═══════════════════════════════════════════
     SPEED MODE — 20 trials · 1.5s each
     ═══════════════════════════════════════════ */
  function startSpeed() {
    M = newState();
    M.mode = 'speed';
    M.totalPlanned = 20;

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '20 trials · Fast decisions', async () => {
      let lastRuleKey = null;
      for (let i = 1; i <= 20; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(8, lastRuleKey);
        lastRuleKey = trial.ruleKey;
        M.headerHTML = `<div class="practice-badge">SPEED · ${i} / 20</div>`;

        const result = await runTrial(trial, 1500);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 900 : 450);
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
    const switchCost = computeSwitchCost(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy, medianRT, switchCost });
    API.emit({ gameId: 'rapid-fire', domain: 'speed', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT, switchCost });
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
      let lastRuleKey = null;
      while (!M.ended) {
        const trial = API.generateTrial(Math.min(15, M.level + 2), lastRuleKey);
        lastRuleKey = trial.ruleKey;

        M.headerHTML = `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `;

        const timeLimit = Math.max(800, 2200 - M.level * 80);
        const result = await runTrial(trial, timeLimit);
        if (M.ended) return;

        const isCorrect = handleResult(trial, result, M);
        await wait(isCorrect ? 450 : 1200);

        if (!isCorrect) {
          endEndless();
          return;
        }

        if (M.correct > 0 && M.correct % 3 === 0 && M.correct / 3 === M.level) {
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
    const switchCost = computeSwitchCost(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.correct, medianRT, switchCost });
    API.emit({ gameId: 'rapid-fire', domain: 'speed', mode: 'endless', levelReached: M.level, totalCorrect: M.correct, medianRT, switchCost });
  }

  /* ═══════════════════════════════════════════
     PRECISION — 15 trials · Accuracy focus
     ═══════════════════════════════════════════ */
  function startPrecision() {
    M = newState();
    M.mode = 'precision';
    M.totalPlanned = 15;

    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 trials · Accuracy focus', async () => {
      let lastRuleKey = null;
      for (let i = 1; i <= 15; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(10, lastRuleKey);
        lastRuleKey = trial.ruleKey;
        M.headerHTML = `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${i} / 15</div>`;

        const result = await runTrial(trial, 8000);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 1400 : 900);
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
    const switchCost = computeSwitchCost(M);

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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, switchCost });
    API.emit({ gameId: 'rapid-fire', domain: 'speed', mode: 'precision', accuracy, medianRT, switchCost, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════
     DAILY — 25 trials · Fixed protocol
     ═══════════════════════════════════════════ */
  function startDaily() {
    M = newState();
    M.mode = 'daily';
    M.totalPlanned = 25;

    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '25 trials · Fixed protocol', async () => {
      let lastRuleKey = null;
      for (let i = 1; i <= 25; i++) {
        if (M.ended) return;
        const trial = API.generateTrial(8, lastRuleKey);
        lastRuleKey = trial.ruleKey;
        M.headerHTML = `<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">DAILY · ${i} / 25</div>`;

        const result = await runTrial(trial, 2500);
        if (M.ended) return;

        handleResult(trial, result, M);
        await wait(result.timedOut ? 1000 : 600);
      }
      endDaily();
    });
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const switchCost = computeSwitchCost(M);
    const rcs = H.rcs(M.correct, M.rtList);

    H.markTodayDone({ accuracy, rcs, switchCost });

    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">SWITCH</div><div class="stat-value">${switchCost}<span style="font-size:11px;color:var(--t2)">ms</span></div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, medianRT, switchCost });
    API.emit({ gameId: 'rapid-fire', domain: 'speed', mode: 'daily', accuracy, medianRT, switchCost, rcs });
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

  window.RapidFireExtraModes = { getModeDefinitions, start, abort };
})();