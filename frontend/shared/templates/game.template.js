/* ═══════════════════════════════════════════════════════════
   FLASH — {{GAME_NAME}} v1.0
   {{DOMAIN_NAME}} Domain
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.__CAMEL_HELPERS__;
  const S = window.__CAMEL_SOUNDS__;  // optional
  const STAGES = window.__CAMEL_STAGES__;
  const FlashStages = window.FlashStages;

  if (!H) {
    console.error('[{{GAME_NAME}}] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('{{GAME_ID}}', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══ CONFIG ═══ */
  // TODO: customize for your game
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    trialsPerLevel: 12,
    baseTime: 3000,
    minTime: 1000,
    timeStepPerLevel: 100,
    correctBase: 100,
    streakBonusPerLevel: 30,
    rtMin: 100,
    rtMax: 3000
  };

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentTrial: null,
    trialIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    rtList: [],
    invalidRTs: 0,
    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES (DON'T TOUCH) ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  /* ═══ SETTINGS (DON'T TOUCH) ═══ */
  let settings = H.getSettings();
  function applySettings() { H.applySettingsToDOM(settings); }
  function openSettings() {
    const d = $('settings-drawer'); if (!d) return;
    $('opt-reduced-motion').checked = settings.reducedMotion;
    $('opt-high-contrast').checked  = settings.highContrast;
    $('opt-input-mode').value       = settings.inputMode;
    $('opt-sound').checked          = settings.soundEnabled;
    $('opt-haptics').checked        = settings.haptics;
    d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() {
    const d = $('settings-drawer'); if (!d) return;
    d.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
  }
  function wireSettings() {
    const d = $('settings-drawer'); if (!d) return;
    const b = $('settings-btn'); if (b) b.addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    d.addEventListener('click', (e) => { if (e.target === d) closeSettings(); });
    $('opt-reduced-motion').addEventListener('change', e => { settings.reducedMotion = e.target.checked; H.saveSettings(settings); applySettings(); });
    $('opt-high-contrast').addEventListener('change', e => { settings.highContrast = e.target.checked; H.saveSettings(settings); applySettings(); });
    $('opt-input-mode').addEventListener('change', e => { settings.inputMode = e.target.value; H.saveSettings(settings); });
    $('opt-sound').addEventListener('change', e => { settings.soundEnabled = e.target.checked; H.saveSettings(settings); });
    $('opt-haptics').addEventListener('change', e => { settings.haptics = e.target.checked; H.saveSettings(settings); });
    $('opt-reset-data').addEventListener('click', () => {
      if (confirm('Reset ALL progress?')) {
        H.resetAll();
        if (FlashStages) FlashStages.reset();
        closeSettings(); showIdle();
      }
    });
  }
  function haptic(type) {
    if (!settings.haptics || !('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }
  function snd() {
    return (S && settings.soundEnabled !== false) ? S : null;
  }

  /* ═══ UI HELPERS (DON'T TOUCH) ═══ */
  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
    const b = $('back-btn');
    if (b) {
      if (p === 'idle' && state.mode === 'idle') b.classList.add('hidden');
      else b.classList.remove('hidden');
    }
  }
  function render(html) { elContent.innerHTML = html; }
  function setTimer(pct, level = 'normal') {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTimerFill.classList.remove('warning', 'danger');
    if (level === 'warning') elTimerFill.classList.add('warning');
    if (level === 'danger') elTimerFill.classList.add('danger');
  }
  function renderProgressDots() {
    let s = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      let cls = '';
      if (i < state.level) {
        const r = state.results.find(x => x.level === i);
        cls = r && r.passed ? 'done' : 'fail';
      } else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      s += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${s}</div>`;
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = `feedback-flash ${hit ? 'hit' : 'miss'}`;
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 500);
    const s = snd();
    if (s) { hit ? s.correct() : s.wrong(); }
  }
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash'; el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function showCountdown(from, title, subtitle, onDone) {
    let c = from;
    const tick = () => {
      if (c > 0) {
        render(`<div class="phase-title">${title}</div><div class="countdown-num">${c}</div><p class="phase-sub" style="margin-top:16px;">${subtitle}</p>`);
        c--; state.timeoutIds.push(setTimeout(tick, 700));
      } else { onDone(); }
    };
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     🎯 TODO — CUSTOMIZE THESE FOR YOUR GAME
     ═══════════════════════════════════════════════════════════ */

  /* ═══ TODO 1: TRIAL GENERATION ═══
     Return an object with everything needed to render the trial.
     This is CALLED ONCE per trial.
  */
  function generateTrial(level, mode) {
    // Example: simple math problem
    const a = randInt(1, 10);
    const b = randInt(1, 10);
    const answer = a + b;
    return {
      prompt: `${a} + ${b}`,
      answer: answer,
      options: [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5)
    };
  }

  /* ═══ TODO 2: RENDER STIMULUS ═══
     Show the trial on screen. Wire buttons.
  */
  function showStimulus(timeLimit) {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
      </div>

      <div class="stimulus-wrap" id="stimulus-wrap">
        <div style="font-size:48px;font-family:var(--f-d);font-weight:700;color:var(--cyan);">
          ${trial.prompt}
        </div>
      </div>

      <div class="answer-row">
        ${trial.options.map((opt, i) => `
          <button class="answer-btn" data-value="${opt}" data-key="${i+1}">${opt}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    startTimer(timeLimit);
  }

  /* ═══ TODO 3: HANDLE ANSWER ═══
     Compare user's response with correct answer.
     Track RT, score, streak, lives.
  */
  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosen = parseInt(btn.dataset.value, 10);
    const correct = state.currentTrial.answer;
    const elapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosen === correct;

    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;
    if (isCorrect && isValid) state.rtList.push(elapsed);

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.value, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentTrial.timeLimit) * 50) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonusPerLevel : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');
      state.timeoutIds.push(setTimeout(nextTrial, 500));
    } else {
      state.streak = 0; elStreak.textContent = '0';
      state.lives--; elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) state.timeoutIds.push(setTimeout(completeGame, 1000));
      else state.timeoutIds.push(setTimeout(nextTrial, 1000));
    }
  }

  /* ═══ TODO 4: HANDLE TIMEOUT ═══
     Called when response window closes without an answer.
  */
  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial) return;
    state.currentTrial.answered = true;
    state.levelTotal++;
    state.streak = 0; elStreak.textContent = '0';
    state.lives--; elLives.textContent = String(state.lives);
    showFeedbackFlash(false); haptic('wrong');
    setPhase('wrong');
    if (state.lives <= 0) state.timeoutIds.push(setTimeout(completeGame, 1000));
    else state.timeoutIds.push(setTimeout(nextTrial, 1000));
  }

  /* ═══════════════════════════════════════════════════════════
     🏗️ SHARED FLOW (DON'T TOUCH — adjust threshold only)
     ═══════════════════════════════════════════════════════════ */

  function showIdle() {
    clearAllTimeouts();
    setPhase('idle'); setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const dailyDone = H.isTodayDone();
    const hasHistory = H.getHistory().length > 0;
    const missions = H.getTodayMissions();

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT = pb.bestMedianRT < 9999 ? pb.bestMedianRT + ' ms' : '—';
    const pbRCS = pb.bestRCS > 0 ? pb.bestRCS : '—';

    const missionHTML = missions.missions.map(m => {
      const pct = Math.min(100, Math.round(((m.progress || 0) / m.target) * 100));
      return `
        <div class="mission-item ${m.done ? 'done' : ''}">
          <div class="mission-check">${m.done ? '✓' : ''}</div>
          <div class="mission-body">
            <div class="mission-text">${m.text}</div>
            <div class="mission-prog"><div class="mission-prog-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="mission-count">${m.progress || 0}/${m.target}</div>
        </div>`;
    }).join('');

    render(`
      <div class="phase-title">{{DOMAIN_NAME}} Domain</div>
      <h1 class="phase-headline grd">{{GAME_NAME}}</h1>
      <p class="phase-sub">{{DESCRIPTION}}</p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RT</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RCS</div><div class="stat-value" style="font-size:16px">${pbRCS}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">Today's Missions</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-3">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">{{ICON}}</div>
          <div class="mode-name">Classic</div>
          <div class="mode-desc">15 levels · 3 lives · Progressive difficulty</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        <div class="mode-card tier-hard" id="mode-endless">
          <div class="mode-icon">⚡</div>
          <div class="mode-name">Endless</div>
          <div class="mode-desc">Speed increases · One mistake = game over</div>
          <div class="mode-meta">→ Coming soon</div>
        </div>
        <div class="mode-card ${dailyDone ? 'disabled' : ''}" id="mode-daily">
          <div class="mode-icon">★</div>
          <div class="mode-name">Daily</div>
          <div class="mode-desc">${dailyDone ? 'Completed today' : 'Fixed protocol'}</div>
          <div class="mode-meta">${dailyDone ? '✓ Come back tomorrow' : '→ Once per day'}</div>
        </div>
      </div>
    `);

    if (FlashStages) {
      const el = $('stages-container');
      if (el) FlashStages.renderStrip(el);
    }

    $('mode-classic').addEventListener('click', (e) => { e.stopPropagation(); const s = snd(); if (s) s.click(); startClassic(); });
    // TODO: wire other mode buttons
  }

  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.rtList = [];
    state.invalidRTs = 0;
    elLevel.textContent = '1'; elLives.textContent = String(CONFIG.maxLives); elStreak.textContent = '0';
    startLevel();
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.trialIndex = 0;
    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, `Level ${state.level}`, 'Get ready', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }
    setPhase('trial');
    state.trialIndex++;

    const timeLimit = Math.max(CONFIG.minTime, CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel);
    const trial = generateTrial(state.level, 'classic');
    state.currentTrial = { ...trial, startTime: 0, timeLimit, answered: false };

    showStimulus(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now(); setTimer(100);
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal';
      if (pct < 50) lvl = 'warning';
      if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);
      if (remaining <= 0) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; handleTimeout(); }
    }, 40);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;
    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed: accuracy >= 0.7
    });

    if (accuracy >= 0.7) {
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct</p>
      `);
      state.timeoutIds.push(setTimeout(() => {
        if (state.level < CONFIG.maxLevel) { state.level++; elLevel.textContent = String(state.level); startLevel(); }
        else completeGame();
      }, 1400));
    } else {
      state.lives--; elLives.textContent = String(state.lives);
      setPhase('wrong');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct — need 70%</p>
      `);
      state.timeoutIds.push(setTimeout(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1800));
    }
  }

  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover'); setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const medianRT = H.median(state.rtList);
    const rtv = H.stdDev(state.rtList);
    const rcs = H.rcs(totalCorrect, state.rtList);

    const session = { mode: 'classic', accuracy, medianRT, rtv, rcs };
    const newRecords = H.checkAndUpdatePB(session);
    const hasNewPB = Object.keys(newRecords).length > 0;
    session.isNewPB = hasNewPB;

    H.addToHistory(session);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(session);

    if (FlashStages) {
      FlashStages.checkSession({ mode: 'classic', maxLevel, accuracy, medianRT });
    }

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : '';
    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    render(`
      <div class="phase-title">Session Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${pbBanner}
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
      </div>
      ${insightsHTML}
      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions</div>
        <div class="history-chart" id="history-chart"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">Try Again</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    setTimeout(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'medianRT');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    emitComplete({
      gameId: '{{GAME_ID}}', domain: '{{DOMAIN}}', mode: 'classic',
      maxLevel, accuracy, medianRT, rtv, rcs, isNewPB: hasNewPB,
      score: state.totalScore
    });
  }

  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
    }
  }

  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentTrial = null;
    state.trialIndex = 0;
    state.rtList = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[{{GAME_NAME}}] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu">←</button>
            <div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>
          </div>
          <div class="g-meta">
            <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">STREAK</span><span class="g-meta-value" id="streak-display">0</span></span>
            <span class="g-meta-item"><span class="g-meta-label">LIVES</span><span class="g-meta-value" id="lives-display">3</span></span>
          </div>
          <button class="g-settings-btn" id="settings-btn" title="Settings">⚙</button>
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
    wireSettings();
    applySettings();
    wireBackButton();

    if (typeof options.onComplete === 'function') state.onComplete = options.onComplete;
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
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle' && state.mode === 'idle') { startClassic(); return; }
        if (state.phase === 'gameover') { resetGame(); return; }
      }
      // Add game-specific number keys here
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    showIdle();
  }

  function wireBackButton() {
    const b = $('back-btn');
    if (b) b.addEventListener('click', (e) => { e.stopPropagation(); handleBackClick(); });
  }

  function autoInit() {
    if (!document.getElementById('game-root')) return;
    if (!document.getElementById('phase-content')) return;
    wireRefs();
    bindGlobalKeys();
    wireSettings();
    applySettings();
    wireBackButton();
    showIdle();
  }

  window.__CAMEL_GAME__Game = { mount, reset: resetGame, state, config: CONFIG };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();