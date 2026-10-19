/* ═══════════════════════════════════════════════════════════
   FLASH — Alternative Uses Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.AUAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '20 trials · Fast answers',         meta: '→ 6s per item' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',           meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '20 trials · Max accuracy · No rush',meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '30 trials · Fixed protocol',        meta: '→ Once per day' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     COMMON RENDER HELPERS
     ═══════════════════════════════════════════════════════ */
  function renderQuestion(q, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>
      <div class="uses-grid">
        ${q.uses.map((u, i) => `
          <button class="use-btn" data-index="${i}" data-key="${i+1}">${u.text}</button>
        `).join('')}
      </div>
    `;
  }

  function wireButtons(handler) {
    API.getElContent().querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', () => handler(btn));
    });
  }

  function lockButtons(btn, correctIdx) {
    API.getElContent().querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
  }

  /* ═══════════════════════════════════════════════════════
     SPEED MODE — 20 trials · 6s per item
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    const TOTAL = 20;
    const TIME_LIMIT = 6000;

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
    API.showCountdown(3, '⏱️ SPEED', '20 trials · 6 seconds each', () => nextSpeedTrial(TIME_LIMIT));
  }

  function nextSpeedTrial(TIME_LIMIT) {
    if (M.ended) return;
    if (M.trial >= M.total) { endSpeed(); return; }

    const q = API.generateQuestion(3);  // medium pool for speed
    M.current = { ...q, startTime: performance.now(), correctIdx: q.uses.findIndex(u => u.novel) };
    M.answered = false;

    API.setPhase('question');
    API.render(renderQuestion(q, `
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
          API.showFeedbackFlash(false);
          if (S) S.miss();
          M.trial++;
          push(() => nextSpeedTrial(TIME_LIMIT), 700);
        }
      }
    }, 40);
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
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(() => nextSpeedTrial(TIME_LIMIT), isCorrect ? 400 : 900);
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
      gameId: 'alternative-uses', domain: 'creativity', mode: 'speed',
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
    M.current = { ...q, startTime: performance.now(), correctIdx: q.uses.findIndex(u => u.novel) };
    M.answered = false;

    API.setPhase('question');
    API.render(renderQuestion(q, null, `
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
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    if (!isCorrect) {
      push(() => endEndless('wrong'), 900);
      return;
    }

    M.totalCorrect++;
    if (rt >= 100 && rt <= 6000) M.rtList.push(rt);

    // Level up every 3 correct
    if (M.totalCorrect % 3 === 0) {
      M.level++;
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
    }

    push(nextEndlessTrial, 500);
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
      gameId: 'alternative-uses', domain: 'creativity', mode: 'endless',
      levelReached: M.level, totalCorrect: M.totalCorrect, medianRT
    });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 20 trials · No rush · Max accuracy
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision',
      trial: 0,
      total: 20,
      correct: 0,
      current: null,
      answered: false,
      ended: false,
      rtList: []
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '20 trials · Accuracy only', nextPrecisionTrial);
  }

  function nextPrecisionTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endPrecision(); return; }

    const q = API.generateQuestion(10);  // hard pool for precision
    M.current = { ...q, startTime: performance.now(), correctIdx: q.uses.findIndex(u => u.novel) };
    M.answered = false;

    API.setPhase('question');
    API.render(renderQuestion(q, `
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
      if (rt >= 100 && rt <= 60000) M.rtList.push(rt);
    }

    lockButtons(btn, correct);
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextPrecisionTrial, isCorrect ? 500 : 900);
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
      gameId: 'alternative-uses', domain: 'creativity', mode: 'precision',
      accuracy, medianRT, totalTrials: M.total
    });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 30 trials · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily',
      trial: 0,
      total: 30,
      correct: 0,
      current: null,
      answered: false,
      ended: false,
      rtList: []
    };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '30 trials · Fixed protocol', nextDailyTrial);
  }

  function nextDailyTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endDaily(); return; }

    const q = API.generateQuestion(8);  // medium-hard pool
    M.current = { ...q, startTime: performance.now(), correctIdx: q.uses.findIndex(u => u.novel) };
    M.answered = false;

    API.setPhase('question');
    API.render(renderQuestion(q, `
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
    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextDailyTrial, isCorrect ? 500 : 900);
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
      gameId: 'alternative-uses', domain: 'creativity', mode: 'daily',
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

  window.AlternativeUsesExtraModes = { getModeDefinitions, start };
})();