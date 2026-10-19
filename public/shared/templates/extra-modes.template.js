/* ═══════════════════════════════════════════════════════════
   FLASH — __GAME_NAME__ Extra Modes
   Loaded BEFORE game.js
   Uses window.__CAMEL_GAME__API at runtime
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
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ═══ MODE DEFINITIONS ═══ */
  function getModeDefinitions() {
    return [
      { id: 'speed',    name: 'Speed',    icon: '⏱️', desc: 'Answer as fast as possible',         meta: '→ Wrong = penalty' },
      { id: 'endless',  name: 'Endless',  icon: '⚡', desc: 'One mistake = game over',            meta: '→ Level ∞' },
      { id: 'precision',name: 'Precision',icon: '🎯', desc: 'Max accuracy · No pressure',         meta: '→ 20 trials' },
      { id: 'daily',    name: 'Daily',    icon: '★',  desc: 'Fixed protocol · Once per day',      meta: '→ 30 trials' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     SPEED MODE
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
      current: null
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '20 trials · Fast answers', nextSpeedTrial);
  }

  function nextSpeedTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endSpeed(); return; }

    const q = API.generateQuestion(1);  // TODO: use higher difficulty
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(`
      <div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:var(--gold);">
        SPEED · ${M.trial + 1} / ${M.total}
      </div>
      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>
      <div class="uses-grid">
        ${q.uses.map((u, i) => `<button class="use-btn" data-index="${i}" data-key="${i+1}">${u.text}</button>`).join('')}
      </div>
    `);

    API.getElContent().querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', () => handleSpeedAnswer(btn, TIME_LIMIT));
    });

    M.current.startTime = performance.now();
    const start = performance.now();
    const tid = setInterval(() => {
      if (M.ended || M.answered) { clearInterval(tid); return; }
      const elapsed = performance.now() - start;
      if (elapsed >= TIME_LIMIT) {
        clearInterval(tid);
        if (!M.answered) { M.answered = true; M.trial++; push(nextSpeedTrial, 400); }
      }
    }, 40);
    timeouts.push(tid);
  }

  function handleSpeedAnswer(btn, TIME_LIMIT) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 6000) M.rtList.push(rt);
    }

    API.getElContent().querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextSpeedTrial, isCorrect ? 350 : 800);
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

    API.emit({ gameId: 'GAME_ID_PLACEHOLDER', domain: 'DOMAIN_PLACEHOLDER', mode: 'speed', accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS
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

    const q = API.generateQuestion(1);
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(`
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
      </div>
      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>
      <div class="uses-grid">
        ${q.uses.map((u, i) => `<button class="use-btn" data-index="${i}" data-key="${i+1}">${u.text}</button>`).join('')}
      </div>
    `);

    API.getElContent().querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEndlessAnswer(btn));
    });
  }

  function handleEndlessAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;

    API.getElContent().querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    if (S) { isCorrect ? S.hit() : S.miss(); }

    if (!isCorrect) {
      push(() => endEndless('wrong'), 900);
      return;
    }

    M.totalCorrect++;
    M.level = Math.floor(M.totalCorrect / 5) + 1;
    push(nextEndlessTrial, 500);
  }

  function endEndless(reason) {
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

    API.emit({ gameId: 'GAME_ID_PLACEHOLDER', domain: 'DOMAIN_PLACEHOLDER', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', trial: 0, total: 20, correct: 0, current: null, answered: false, ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '20 trials · Accuracy only', nextPrecisionTrial);
  }

  function nextPrecisionTrial() {
    if (M.ended || M.trial >= M.total) { endPrecision(); return; }

    const q = API.generateQuestion(1);
    M.current = q;
    M.answered = false;

    API.setPhase('question');
    API.render(`
      <div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:var(--green);">
        PRECISION · ${M.trial + 1} / ${M.total}
      </div>
      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>
      <div class="uses-grid">
        ${q.uses.map((u, i) => `<button class="use-btn" data-index="${i}" data-key="${i+1}">${u.text}</button>`).join('')}
      </div>
    `);

    API.getElContent().querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', () => handlePrecisionAnswer(btn));
    });
  }

  function handlePrecisionAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = M.current.correctIdx;
    const isCorrect = chosen === correct;

    if (isCorrect) M.correct++;

    API.getElContent().querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

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

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} correct</p>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    API.emit({ gameId: 'GAME_ID_PLACEHOLDER', domain: 'DOMAIN_PLACEHOLDER', mode: 'precision', accuracy });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', trial: 0, total: 30, correct: 0, current: null, answered: false, ended: false, rtList: [] };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '30 trials · Fixed protocol', nextDailyTrial);
  }

  function nextDailyTrial() {
    if (M.ended || M.trial >= M.total) { endDaily(); return; }

    const q = API.generateQuestion(1);
    M.current = { ...q, startTime: performance.now() };
    M.answered = false;

    API.setPhase('question');
    API.render(`
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        DAILY · ${M.trial + 1} / ${M.total}
      </div>
      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>
      <div class="uses-grid">
        ${q.uses.map((u, i) => `<button class="use-btn" data-index="${i}" data-key="${i+1}">${u.text}</button>`).join('')}
      </div>
    `);

    API.getElContent().querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDailyAnswer(btn));
    });
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
      if (rt >= 100 && rt <= 6000) M.rtList.push(rt);
    }

    API.getElContent().querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

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
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    API.emit({ gameId: 'GAME_ID_PLACEHOLDER', domain: 'DOMAIN_PLACEHOLDER', mode: 'daily', accuracy, rcs });
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

  window.__CAMEL_GAME__ExtraModes = { getModeDefinitions, start };
})();