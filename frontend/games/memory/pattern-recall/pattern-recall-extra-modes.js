/* ═══════════════════════════════════════════════════════════
   FLASH — Pattern Recall Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.PRAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let M = {};
  let timeouts = [];

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (M.inputTimer) { clearTimeout(M.inputTimer); M.inputTimer = null; }
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 sequences · Fast flash',     meta: '→ Quick recall' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',       meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '8 sequences · Slow flash',      meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '15 sequences · Fixed protocol', meta: '→ Once per day' }
    ];
  }

  /* ═══ SHARED: SHOW SEQUENCE ═══ */
  async function showSequence(seq, flashDur, gapDur) {
    API.setPhase('showing');
    API.setProgress(0);
    API.render(`
      <div class="phase-title">Watch Carefully</div>
      <h2 class="phase-headline">Memorize the order</h2>
      <p class="phase-sub">${seq.length} steps in this sequence</p>
      ${API.renderGrid()}
    `);

    await wait(500);

    for (let i = 0; i < seq.length; i++) {
      if (M.ended) return false;
      const cell = API.getCell(seq[i]);
      if (!cell) continue;
      cell.classList.add('lit');
      API.setProgress(((i + 1) / seq.length) * 100);
      await wait(flashDur);
      cell.classList.remove('lit');
      await wait(gapDur);
    }

    await wait(350);
    API.setProgress(0);
    return true;
  }

  /* ═══ SHARED: COLLECT INPUT ═══ */
  function collectInput(seq, inputTimeout) {
    return new Promise(resolve => {
      let userIdx = 0;
      let correctClicks = 0;
      let totalClicks = 0;
      let settled = false;

      API.setPhase('input');
      API.render(`
        <div class="phase-title">Your Turn</div>
        <h2 class="phase-headline">Repeat the sequence</h2>
        <p class="phase-sub" id="input-status">Step 1 of ${seq.length}</p>
        ${API.renderGrid()}
      `);

      const cells = API.getElContent().querySelectorAll('.cell');

      function finish(success, reason) {
        if (settled) return;
        settled = true;
        if (M.inputTimer) { clearTimeout(M.inputTimer); M.inputTimer = null; }
        cells.forEach(c => { c.style.pointerEvents = 'none'; });
        resolve({ success, reason, userIdx, correctClicks, totalClicks });
      }

      function resetTimer() {
        if (M.inputTimer) clearTimeout(M.inputTimer);
        M.inputTimer = setTimeout(() => finish(false, 'timeout'), inputTimeout);
      }

      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          if (M.ended || settled) return;
          const idx = parseInt(cell.dataset.idx, 10);
          const expected = seq[userIdx];
          const isCorrect = idx === expected;
          totalClicks++;

          if (isCorrect) {
            correctClicks++;
            cell.classList.add('correct');
            setTimeout(() => cell.classList.remove('correct'), 260);
            userIdx++;

            const status = document.getElementById('input-status');
            if (status) {
              if (userIdx >= seq.length) status.innerHTML = 'Complete!';
              else status.innerHTML = `Step ${userIdx + 1} of ${seq.length}`;
            }
            API.setProgress((userIdx / seq.length) * 100);

            if (userIdx >= seq.length) {
              finish(true, 'complete');
            } else {
              resetTimer();
            }
          } else {
            cell.classList.add('wrong');
            finish(false, 'wrong-click');
          }
        });
      });

      resetTimer();
    });
  }

  /* ═══ SHARED: RUN ONE TRIAL ═══ */
  async function runTrial(level, flashDur, gapDur, inputTimeout) {
    if (M.ended) return null;
    const seq = API.generateSequence(level);
    const shown = await showSequence(seq, flashDur, gapDur);
    if (!shown) return null;
    const result = await collectInput(seq, inputTimeout);
    return result;
  }

  /* ═══════════════════════════════════════════
     SPEED — 10 sequences · Fast flash
     ═══════════════════════════════════════════ */
  async function startSpeed() {
    M = { mode: 'speed', trial: 0, total: 10, correct: 0, ended: false, inputTimer: null };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 sequences · Fast flash', async () => {
      for (M.trial = 1; M.trial <= M.total; M.trial++) {
        if (M.ended) return;
        const level = 2 + Math.floor(M.trial / 3);
        const flashDur = Math.max(320, 500 - M.trial * 20);
        const gapDur = 120;
        const inputTimeout = 5000;

        const result = await runTrial(level, flashDur, gapDur, inputTimeout);
        if (!result || M.ended) return;

        if (result.success) {
          M.correct++;
          API.showFeedbackFlash(true);
          if (S) S.hit();
          await wait(700);
        } else {
          API.showFeedbackFlash(false);
          if (S) S.miss();
          await wait(1200);
        }
      }
      endSpeed();
    });
  }

  function endSpeed() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = Math.round((M.correct / M.total) * 100);
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} sequences correct</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy });
    API.emit({ gameId: 'pattern-recall', domain: 'memory', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy });
  }

  /* ═══════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════ */
  async function startEndless() {
    M = { mode: 'endless', level: 1, totalCorrect: 0, ended: false, inputTimer: null };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', async () => {
      while (!M.ended) {
        const level = Math.min(15, M.level + 2);
        const flashDur = Math.max(320, 620 - M.level * 35);
        const gapDur = 130;
        const inputTimeout = 6000;

        API.setProgress(0);

        const result = await runTrial(level, flashDur, gapDur, inputTimeout);
        if (!result || M.ended) return;

        if (!result.success) {
          API.showFeedbackFlash(false);
          if (S) S.miss();
          await wait(1500);
          endEndless();
          return;
        }

        M.totalCorrect++;
        API.showFeedbackFlash(true);
        if (S) S.hit();

        if (M.totalCorrect % 3 === 0) {
          M.level++;
          API.showLevelUpFlash(`LEVEL ${M.level}!`);
          if (S) S.levelUp();
        }

        await wait(700);
      }
    });
  }

  function endEndless() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.totalCorrect}</div></div>
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
    API.emit({ gameId: 'pattern-recall', domain: 'memory', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════
     PRECISION — 8 sequences · Slow flash
     ═══════════════════════════════════════════ */
  async function startPrecision() {
    M = { mode: 'precision', trial: 0, total: 8, correct: 0, ended: false, inputTimer: null };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '8 sequences · Slow flash', async () => {
      for (M.trial = 1; M.trial <= M.total; M.trial++) {
        if (M.ended) return;
        const level = 3 + Math.floor(M.trial / 2);
        const flashDur = 900;
        const gapDur = 250;
        const inputTimeout = 15000;

        const result = await runTrial(level, flashDur, gapDur, inputTimeout);
        if (!result || M.ended) return;

        if (result.success) {
          M.correct++;
          API.showFeedbackFlash(true);
          if (S) S.hit();
          await wait(800);
        } else {
          API.showFeedbackFlash(false);
          if (S) S.miss();
          await wait(1400);
        }
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

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} sequences correct</p>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('precision', { accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy });
    API.emit({ gameId: 'pattern-recall', domain: 'memory', mode: 'precision', accuracy, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════
     DAILY — 15 sequences · Fixed protocol
     ═══════════════════════════════════════════ */
  async function startDaily() {
    M = { mode: 'daily', trial: 0, total: 15, correct: 0, ended: false, inputTimer: null };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '15 sequences · Fixed', async () => {
      for (M.trial = 1; M.trial <= M.total; M.trial++) {
        if (M.ended) return;
        const level = 3 + Math.floor(M.trial / 3);
        const flashDur = 620;
        const gapDur = 180;
        const inputTimeout = 7000;

        const result = await runTrial(level, flashDur, gapDur, inputTimeout);
        if (!result || M.ended) return;

        if (result.success) {
          M.correct++;
          API.showFeedbackFlash(true);
          if (S) S.hit();
          await wait(700);
        } else {
          API.showFeedbackFlash(false);
          if (S) S.miss();
          await wait(1300);
        }
      }
      endDaily();
    });
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const accuracy = Math.round((M.correct / M.total) * 100);
    H.markTodayDone({ accuracy, rcs: 0 });

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

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy });
    API.emit({ gameId: 'pattern-recall', domain: 'memory', mode: 'daily', accuracy });
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

  function abort() {
    M.ended = true;
    clearAll();
  }

  window.PatternRecallExtraModes = { getModeDefinitions, start, abort };
})();