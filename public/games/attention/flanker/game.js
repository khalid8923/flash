/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Test v2.2 (Full)
   Modes: Classic · Endless · Challenge · Daily
          + Time Attack · Boss · Reverse (via flanker-extra-modes.js)
   Features: Practice Gate, ITI Jitter, RT Validation,
   Median/RTV/RCS, PB, History, Insights, Settings, Accessibility,
   postMessage → Dashboard
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.FlankerHelpers;
  if (!H) { console.error('[Flanker] FlankerHelpers not loaded'); return; }

  const STAGES = window.FlankerStages;
  const FlashStages = window.FlashStages;

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('flanker', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (window.FlankerSounds) window.FlankerSounds.badge();
      }
    });
  }

  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    trialsPerLevel: 12,
    baseTime: 2200,
    minTime: 900,
    timeStepPerLevel: 80,
    correctBase: 100,
    streakBonusPerLevel: 30,
    timeBonusMax: 90,

    practice: { trials: 16, passAccuracy: 0.80, congruentRatio: 0.60 },
    daily: { trials: 30, congruentRatio: 0.50 },
    iti: { min: 500, max: 1200 },
    fixation: { duration: 400 },
    rtValidation: { minValid: 150, maxValid: 3000, maxInvalidRatio: 0.20 },

    endless: {
      startTimeLimit: 3000,
      minTimeLimit: 600,
      timeDecreasePerLevel: 100,
      correctPerLevel: 5
    },
    challenge: {
      baseTrials: 20,
      trialsIncrement: 10,
      maxChallenge: 10,
      baseTimeLimit: 2500,
      minTimeLimit: 1500,
      timeDecreasePerChallenge: 100
    }
  };

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

    congruentRTs: [], incongruentRTs: [], neutralRTs: [],
    congruentCorrect: 0, congruentTotal: 0,
    incongruentCorrect: 0, incongruentTotal: 0,
    neutralCorrect: 0, neutralTotal: 0,

    invalidRTs: 0,
    practiceCorrect: 0, practiceTotal: 0,

    endless: { level: 1, levelProgress: 0, totalCorrect: 0, timeLimit: 0 },
    challenge: { index: 1, total: 20, passed: false },

    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /* ═══ SETTINGS ═══ */
  let settings = H.getSettings();
  function applySettings() { H.applySettingsToDOM(settings); }
  function openSettings() {
    const drawer = $('settings-drawer'); if (!drawer) return;
    $('opt-reduced-motion').checked = settings.reducedMotion;
    $('opt-high-contrast').checked  = settings.highContrast;
    $('opt-input-mode').value       = settings.inputMode;
    $('opt-haptics').checked        = settings.haptics;
    $('opt-skip-practice').checked  = settings.skipPractice;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() {
    const drawer = $('settings-drawer'); if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  function wireSettings() {
    const drawer = $('settings-drawer'); if (!drawer) return;
    const btn = $('settings-btn');
    if (btn) {
  btn.addEventListener('click', () => {
    if (window.FlashSettings) window.FlashSettings.openPanel();
    else openSettings();
  });
}
    $('settings-close').addEventListener('click', closeSettings);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) closeSettings(); });
    $('opt-reduced-motion').addEventListener('change', (e) => { settings.reducedMotion = e.target.checked; H.saveSettings(settings); applySettings(); });
    $('opt-high-contrast').addEventListener('change', (e) => { settings.highContrast = e.target.checked; H.saveSettings(settings); applySettings(); });
    $('opt-input-mode').addEventListener('change', (e) => { settings.inputMode = e.target.value; H.saveSettings(settings); });
    $('opt-haptics').addEventListener('change', (e) => { settings.haptics = e.target.checked; H.saveSettings(settings); });
    $('opt-skip-practice').addEventListener('change', (e) => { settings.skipPractice = e.target.checked; H.saveSettings(settings); });
    $('opt-reset-data').addEventListener('click', () => {
      if (confirm('Reset ALL progress (PB + history + daily + challenge + endless)?')) {
        H.resetAll(); closeSettings(); showIdle();
      }
    });
  }
    function snd() {
    return (window.FlankerSounds && settings.soundEnabled !== false) ? window.FlankerSounds : null;
  }

  function haptic(type) {
    if (!settings.haptics || !('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }

  /* ═══ TRIAL GENERATION ═══ */
  function generateTrial(level, mode) {
    let type;
    if (mode === 'practice') {
      type = Math.random() < CONFIG.practice.congruentRatio ? 'congruent' : 'incongruent';
    } else if (mode === 'daily') {
      type = Math.random() < CONFIG.daily.congruentRatio ? 'congruent' : 'incongruent';
    } else if (mode === 'endless') {
      type = Math.random() < 0.5 ? 'congruent' : 'incongruent';
    } else if (mode === 'challenge') {
      const c = state.challenge.index;
      const incong = 0.3 + Math.min(0.4, (c - 1) * 0.05);
      type = Math.random() < (1 - incong) ? 'congruent' : 'incongruent';
    } else {
      const incongruentWeight = 0.2 + (level - 1) * 0.035;
      const neutralWeight = Math.max(0.05, 0.2 - (level - 1) * 0.01);
      const congruentWeight = Math.max(0.1, 1 - incongruentWeight - neutralWeight);
      const r = Math.random();
      if (r < congruentWeight) type = 'congruent';
      else if (r < congruentWeight + incongruentWeight) type = 'incongruent';
      else type = 'neutral';
    }

    const centerDir = Math.random() < 0.5 ? 'left' : 'right';
    const centerGlyph = centerDir === 'left' ? '←' : '→';
    let flankerGlyph;
    if (type === 'congruent') flankerGlyph = centerGlyph;
    else if (type === 'incongruent') flankerGlyph = centerDir === 'left' ? '→' : '←';
    else flankerGlyph = '—';

    const row = [
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: centerGlyph,  side: 'center'  },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' }
    ];
    return { type, centerDir, centerGlyph, flankerGlyph, row };
  }

  /* ═══ UI HELPERS ═══ */
  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
    const btn = $('back-btn');
    if (btn) {
      if (p === 'idle' && state.mode === 'idle') btn.classList.add('hidden');
      else btn.classList.remove('hidden');
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
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      let cls = '';
      if (i < state.level) {
        const r = state.results.find(x => x.level === i);
        cls = r && r.passed ? 'done' : 'fail';
      } else if (i === state.level && state.phase !== 'gameover') {
        cls = 'current';
      }
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
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
  function renderFlankerRow(row, revealed, wasCorrect) {
    let extraClass = '';
    if (revealed) extraClass = wasCorrect ? 'reveal' : 'reveal-wrong';
    return `<div class="flanker-row ${extraClass}">${row.map(item => {
      const isCenter = item.side === 'center';
      return `<span class="flanker-arrow ${isCenter ? 'center' : 'flanker'}">${item.glyph}</span>`;
    }).join('')}</div>`;
  }
  function renderFixation() { return `<div class="fixation-cross">+</div>`; }
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function showCountdown(from, title, subtitle, onDone) {
    let count = from;
    const tick = () => {
      if (count > 0) {
        render(`<div class="phase-title">${title}</div><div class="countdown-num">${count}</div><p class="phase-sub" style="margin-top:16px;">${subtitle}</p>`);
        count--;
        state.timeoutIds.push(setTimeout(tick, 650));
      } else { onDone(); }
    };
    tick();
  }

  /* ═══ CONDITION COUNTERS ═══ */
  function resetConditionCounters() {
    state.congruentRTs = []; state.incongruentRTs = []; state.neutralRTs = [];
    state.congruentCorrect = 0; state.congruentTotal = 0;
    state.incongruentCorrect = 0; state.incongruentTotal = 0;
    state.neutralCorrect = 0; state.neutralTotal = 0;
    state.invalidRTs = 0;
  }
  function trackByFlankerType(type, isCorrect, validRT) {
    if (type === 'congruent') {
      state.congruentTotal++;
      if (isCorrect) { state.congruentCorrect++; if (validRT !== null) state.congruentRTs.push(validRT); }
    } else if (type === 'incongruent') {
      state.incongruentTotal++;
      if (isCorrect) { state.incongruentCorrect++; if (validRT !== null) state.incongruentRTs.push(validRT); }
    } else {
      state.neutralTotal++;
      if (isCorrect) { state.neutralCorrect++; if (validRT !== null) state.neutralRTs.push(validRT); }
    }
  }

  /* ═══ PRACTICE ═══ */
  function startPractice() {
    state.mode = 'practice';
    state.practiceCorrect = 0; state.practiceTotal = 0; state.trialIndex = 0;
    clearAllTimeouts();
    setPhase('countdown');
    showCountdown(3, 'Practice Round', 'Answer as accurately as you can', nextPracticeTrial);
  }
  function nextPracticeTrial() {
    if (state.trialIndex >= CONFIG.practice.trials) { endPractice(); return; }
    setPhase('trial');
    state.trialIndex++;
    const trial = generateTrial(1, 'practice');
    state.currentTrial = { ...trial, startTime: 0, timeLimit: 5000, answered: false };
    render(`
      <div class="practice-badge">Practice · ${state.trialIndex} / ${CONFIG.practice.trials}</div>
      <div class="phase-title">Focus on the CENTER arrow</div>
      ${renderFixation()}
    `);
    const delay = settings.reducedMotion ? 100 : CONFIG.fixation.duration;
    state.timeoutIds.push(setTimeout(showPracticeStimulus, delay));
  }
  function showPracticeStimulus() {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();
    render(`
      <div class="practice-badge">Practice · ${state.trialIndex} / ${CONFIG.practice.trials}</div>
      <div class="flanker-wrap">${renderFlankerRow(trial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);
    elContent.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => handlePracticeAnswer(btn)));
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - state.currentTrial.startTime;
      const pct = Math.max(0, 100 - (elapsed / trial.timeLimit) * 100);
      setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (elapsed >= trial.timeLimit) {
        clearInterval(state.timerIntervalId); state.timerIntervalId = null;
        handlePracticeAnswer({ dataset: { side: 'timeout' } });
      }
    }, 50);
  }
  function handlePracticeAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
    const chosenSide = btn.dataset.side;
    const correctSide = state.currentTrial.centerDir;
    const isCorrect = chosenSide === correctSide;
    state.practiceTotal++;
    if (isCorrect) state.practiceCorrect++;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, isCorrect)}</div>`;
    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');
    state.timeoutIds.push(setTimeout(() => { setTimer(100); nextPracticeTrial(); }, isCorrect ? 600 : 900));
  }
  function endPractice() {
    clearAllTimeouts();
    const accuracy = state.practiceTotal > 0 ? state.practiceCorrect / state.practiceTotal : 0;
    const passed = accuracy >= CONFIG.practice.passAccuracy;
    const pct = Math.round(accuracy * 100);
    setPhase(passed ? 'correct' : 'wrong');
    if (passed) {
      render(`
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Practice Complete</h2>
        <p class="phase-sub">You got <strong>${state.practiceCorrect}/${state.practiceTotal}</strong> correct (${pct}%).</p>
        <button class="big-btn" id="continue-btn">Start Real Test</button>
      `);
      $('continue-btn').addEventListener('click', (e) => { e.stopPropagation(); startRealGame(); });
    } else {
      render(`
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Let's Try Again</h2>
        <p class="phase-sub">${state.practiceCorrect}/${state.practiceTotal} correct (${pct}%) — need ${Math.round(CONFIG.practice.passAccuracy * 100)}% to proceed.</p>
        <button class="big-btn" id="retry-practice-btn">Retry Practice</button>
        <p class="phase-hint" style="margin-top:14px;">Or <button id="skip-practice-btn" style="background:none;border:none;color:var(--cyan);text-decoration:underline;cursor:pointer;font-family:inherit;">skip practice</button>.</p>
      `);
      $('retry-practice-btn').addEventListener('click', (e) => { e.stopPropagation(); startPractice(); });
      $('skip-practice-btn').addEventListener('click', (e) => { e.stopPropagation(); startRealGame(); });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startRealGame() {
    state.mode = 'classic';
    state.level = 1; state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = []; state.totalScore = 0;
    resetConditionCounters();
    elLevel.textContent = '1'; elLives.textContent = String(CONFIG.maxLives); elStreak.textContent = '0';
    startLevel();
  }
  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0; state.trialIndex = 0;
    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, `Level ${state.level} · Get Ready`, 'Respond to the CENTER arrow', nextTrial);
  }
  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }
    setPhase('trial');
    state.trialIndex++;
    const timeLimit = Math.max(CONFIG.minTime, CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel);
    const trial = generateTrial(state.level, 'classic');
    state.currentTrial = { ...trial, startTime: 0, timeLimit, answered: false };
    render(`
      ${renderProgressDots()}
      <div class="trial-counter">Trial <span class="current">${state.trialIndex}</span><span class="total"> / ${CONFIG.trialsPerLevel}</span><span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span></div>
      ${renderFixation()}
    `);
    const delay = settings.reducedMotion ? 80 : CONFIG.fixation.duration;
    state.timeoutIds.push(setTimeout(() => showRealStimulus(timeLimit), delay));
  }
  function showRealStimulus(timeLimit) {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();
    render(`
      ${renderProgressDots()}
      <div class="trial-counter">Trial <span class="current">${state.trialIndex}</span><span class="total"> / ${CONFIG.trialsPerLevel}</span><span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span></div>
      <div class="flanker-wrap">${renderFlankerRow(trial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);
    elContent.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => handleAnswer(btn)));
    startTimer(timeLimit);
  }
  function startTimer(timeLimit) {
    const start = performance.now(); setTimer(100);
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal'; if (pct < 50) lvl = 'warning'; if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);
      if (remaining <= 0) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; handleTimeout(); }
    }, 40);
  }
  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
    const chosenSide = btn.dataset.side;
    const correctSide = state.currentTrial.centerDir;
    const rawElapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosenSide === correctSide;
    const isValid = rawElapsed >= CONFIG.rtValidation.minValid && rawElapsed <= CONFIG.rtValidation.maxValid;
    if (!isValid) state.invalidRTs++;
    trackByFlankerType(state.currentTrial.type, isCorrect, isValid ? rawElapsed : null);
    state.levelTotal++;
    if (isValid) state.levelTotalTime += rawElapsed;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, isCorrect)}</div>`;
    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      state.levelCorrect++; state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      const timeBonus = isValid ? Math.round((1 - rawElapsed / state.currentTrial.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonusPerLevel : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;
      elStreak.textContent = String(state.streak);
      setPhase('correct');
      scheduleNext(400);
    } else {
      state.streak = 0; elStreak.textContent = '0';
      state.lives--; elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) state.timeoutIds.push(setTimeout(completeGame, 900));
      else scheduleNext(900);
    }
  }
  function scheduleNext(delay) {
    const jitter = settings.reducedMotion ? 0 : randInt(CONFIG.iti.min, CONFIG.iti.max);
    state.timeoutIds.push(setTimeout(nextTrial, delay + jitter));
  }
  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial) return;
    state.currentTrial.answered = true;
    state.levelTotal++;
    state.streak = 0; elStreak.textContent = '0';
    state.lives--; elLives.textContent = String(state.lives);
    const correctSide = state.currentTrial.centerDir;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, false)}</div>`;
    showFeedbackFlash(false); haptic('wrong'); setPhase('wrong');
    if (state.lives <= 0) state.timeoutIds.push(setTimeout(completeGame, 900));
    else scheduleNext(900);
  }
  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;
    state.results.push({
      level: state.level, correct: state.levelCorrect, total: state.levelTotal,
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed: accuracy >= 0.7
    });
    if (accuracy >= 0.7) {
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct · Avg: ${Math.round(state.levelTotalTime / state.levelTotal)} ms</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
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
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct — need 70% to pass.<br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.</p>
      `);
      state.timeoutIds.push(setTimeout(() => {
        if (state.lives > 0) startLevel(); else completeGame();
      }, 1800));
    }
  }

  /* ═══ ENDLESS MODE ═══ */
  function startEndless() {
    state.mode = 'endless';
    state.endless.level = 1;
    state.endless.levelProgress = 0;
    state.endless.totalCorrect = 0;
    state.endless.timeLimit = CONFIG.endless.startTimeLimit;
    state.streak = 0; state.maxStreak = 0;
    state.trialIndex = 0;
    resetConditionCounters();

    elLevel.textContent = '1';
    elStreak.textContent = '0';
    elLives.textContent = '∞';

    setPhase('countdown');
    showCountdown(3, 'Endless Mode', 'One mistake and it\'s over. Speed increases!', nextEndlessTrial);
  }

  function nextEndlessTrial() {
    setPhase('trial');
    state.trialIndex++;
    const trial = generateTrial(1, 'endless');
    state.currentTrial = { ...trial, startTime: 0, timeLimit: state.endless.timeLimit, answered: false };

    const progPct = (state.endless.levelProgress / CONFIG.endless.correctPerLevel) * 100;

    render(`
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${state.endless.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${state.endless.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val" style="color:${state.streak >= 5 ? '#FFD60A' : 'var(--cyan)'}">${state.streak}</div><div class="hud-lbl">STREAK</div></div>
      </div>
      <div class="endless-progress"><div class="endless-progress-fill" style="width:${progPct}%"></div></div>
      ${renderFixation()}
    `);

    const delay = settings.reducedMotion ? 60 : 300;
    state.timeoutIds.push(setTimeout(showEndlessStimulus, delay));
  }

  function showEndlessStimulus() {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();
    const progPct = (state.endless.levelProgress / CONFIG.endless.correctPerLevel) * 100;

    render(`
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${state.endless.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${state.endless.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val" style="color:${state.streak >= 5 ? '#FFD60A' : 'var(--cyan)'}">${state.streak}</div><div class="hud-lbl">STREAK</div></div>
      </div>
      <div class="endless-progress"><div class="endless-progress-fill" style="width:${progPct}%"></div></div>
      <div class="flanker-wrap">${renderFlankerRow(trial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);

    elContent.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => handleEndlessAnswer(btn)));
    startEndlessTimer(trial.timeLimit);
  }

  function startEndlessTimer(timeLimit) {
    const start = performance.now(); setTimer(100);
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal'; if (pct < 50) lvl = 'warning'; if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);
      if (remaining <= 0) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; endEndless('timeout'); }
    }, 30);
  }

  function handleEndlessAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenSide = btn.dataset.side;
    const correctSide = state.currentTrial.centerDir;
    const rawElapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosenSide === correctSide;

    const isValid = rawElapsed >= CONFIG.rtValidation.minValid && rawElapsed <= CONFIG.rtValidation.maxValid;
    if (!isValid) state.invalidRTs++;
    trackByFlankerType(state.currentTrial.type, isCorrect, isValid ? rawElapsed : null);

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, isCorrect)}</div>`;

    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      state.timeoutIds.push(setTimeout(() => endEndless('wrong'), 700));
      return;
    }

    state.endless.totalCorrect++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    state.endless.levelProgress++;
    elStreak.textContent = String(state.streak);

    if (state.endless.levelProgress >= CONFIG.endless.correctPerLevel) {
      state.endless.level++;
      state.endless.levelProgress = 0;
      state.endless.timeLimit = Math.max(
        CONFIG.endless.minTimeLimit,
        state.endless.timeLimit - CONFIG.endless.timeDecreasePerLevel
      );
      elLevel.textContent = String(state.endless.level);
      showLevelUpFlash(`LEVEL ${state.endless.level}!`);
      haptic('correct');
    }

    const delay = settings.reducedMotion ? 100 : 400;
    state.timeoutIds.push(setTimeout(nextEndlessTrial, delay));
  }

  function endEndless(reason) {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const result = H.updateEndlessBest(state.endless.level, state.endless.totalCorrect, state.maxStreak);
    H.checkAndUnlockBadges('endless', { levelReached: state.endless.level });
    const s1 = snd(); if (s1) s1.gameOver();
    const allValidRTs = [...state.congruentRTs, ...state.incongruentRTs];
    const medianRT = H.median(allValidRTs);
    const isNewBest = result.isNew;

    render(`
      <div class="endless-gameover-icon">${reason === 'timeout' ? '⏱' : '💥'}</div>
      <div class="phase-title">${reason === 'timeout' ? 'Time Ran Out' : 'Mistake Made'}</div>
      <h1 class="phase-headline grd">Endless Over</h1>
      ${isNewBest ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : ''}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">LEVEL REACHED</div><div class="stat-value">${state.endless.level}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${state.endless.totalCorrect}</div></div>
        <div class="stat-card"><div class="stat-label">BEST STREAK</div><div class="stat-value">${state.maxStreak}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="insights-card">
        <div class="insights-title">Endless Record</div>
        <div class="insight-item">Best Level: <strong>${result.best.bestLevel}</strong></div>
        <div class="insight-item">Best Correct: <strong>${result.best.bestCorrect}</strong></div>
        <div class="insight-item">Best Streak: <strong>${result.best.bestStreak}</strong></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    $('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    $('back-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    // ─── Stages check ───
    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'endless', levelReached: state.endless.level, totalCorrect: state.endless.totalCorrect
      });
    }

    // ─── postMessage ───
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({
        type: 'flash:game-complete', gameId: 'flanker', domain: 'attention', mode: 'endless',
        levelReached: state.endless.level, totalCorrect: state.endless.totalCorrect,
        maxStreak: state.maxStreak, medianRT
      }, '*'); } catch (e) {}
    }

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'flanker', domain: 'attention', mode: 'endless',
        levelReached: state.endless.level,
        totalCorrect: state.endless.totalCorrect,
        maxStreak: state.maxStreak,
        medianRT
      });
    }
  }

  /* ═══ CHALLENGE MODE ═══ */
  function getChallengeTrials(n) {
    return CONFIG.challenge.baseTrials + (n - 1) * CONFIG.challenge.trialsIncrement;
  }
  function getChallengeTimeLimit(n) {
    return Math.max(
      CONFIG.challenge.minTimeLimit,
      CONFIG.challenge.baseTimeLimit - (n - 1) * CONFIG.challenge.timeDecreasePerChallenge
    );
  }

  function startChallenge(n) {
    state.mode = 'challenge';
    state.challenge.index = n;
    state.challenge.total = getChallengeTrials(n);
    state.challenge.passed = true;
    state.trialIndex = 0;
    state.streak = 0; state.maxStreak = 0;
    state.levelCorrect = 0; state.levelTotal = 0;
    resetConditionCounters();

    elLevel.textContent = `C${n}`;
    elStreak.textContent = '0';
    elLives.textContent = `0/${state.challenge.total}`;

    setPhase('countdown');
    showCountdown(3, `Challenge ${n}`, `${state.challenge.total} trials · One mistake = fail`, nextChallengeTrial);
  }

  function nextChallengeTrial() {
    if (state.trialIndex >= state.challenge.total) {
      endChallenge(true);
      return;
    }

    setPhase('trial');
    state.trialIndex++;

    const timeLimit = getChallengeTimeLimit(state.challenge.index);
    const trial = generateTrial(1, 'challenge');
    state.currentTrial = { ...trial, startTime: 0, timeLimit, answered: false };

    elLives.textContent = `${state.trialIndex - 1}/${state.challenge.total}`;

    render(`
      <div class="practice-badge" style="background:rgba(255,0,119,.12);border-color:rgba(255,0,119,.4);color:var(--pink);">
        Challenge ${state.challenge.index} · ${state.trialIndex}/${state.challenge.total}
      </div>
      ${renderFixation()}
    `);
    const delay = settings.reducedMotion ? 60 : CONFIG.fixation.duration;
    state.timeoutIds.push(setTimeout(showChallengeStimulus, delay));
  }

  function showChallengeStimulus() {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();
    render(`
      <div class="practice-badge" style="background:rgba(255,0,119,.12);border-color:rgba(255,0,119,.4);color:var(--pink);">
        Challenge ${state.challenge.index} · ${state.trialIndex}/${state.challenge.total}
      </div>
      <div class="flanker-wrap">${renderFlankerRow(trial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);
    elContent.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => handleChallengeAnswer(btn)));
    startChallengeTimer(trial.timeLimit);
  }

  function startChallengeTimer(timeLimit) {
    const start = performance.now(); setTimer(100);
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal'; if (pct < 50) lvl = 'warning'; if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);
      if (remaining <= 0) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; endChallenge(false, 'timeout'); }
    }, 30);
  }

  function handleChallengeAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenSide = btn.dataset.side;
    const correctSide = state.currentTrial.centerDir;
    const rawElapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosenSide === correctSide;

    const isValid = rawElapsed >= CONFIG.rtValidation.minValid && rawElapsed <= CONFIG.rtValidation.maxValid;
    if (!isValid) state.invalidRTs++;
    trackByFlankerType(state.currentTrial.type, isCorrect, isValid ? rawElapsed : null);

    state.levelTotal++;
    if (isCorrect) state.levelCorrect++;

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, isCorrect)}</div>`;

    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      state.timeoutIds.push(setTimeout(() => endChallenge(false, 'wrong'), 900));
      return;
    }

    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);
    elLives.textContent = `${state.trialIndex}/${state.challenge.total}`;

    const delay = settings.reducedMotion ? 80 : 350;
    const jitter = settings.reducedMotion ? 0 : randInt(200, 500);
    state.timeoutIds.push(setTimeout(nextChallengeTrial, delay + jitter));
  }

  function endChallenge(success, reason) {
    clearAllTimeouts();
    setPhase(success ? 'correct' : 'wrong');
    setTimer(0);

    if (success) {
      H.markChallengeComplete(state.challenge.index);
      H.checkAndUnlockBadges('challenge', {});
      const s2 = snd(); if (s2) s2.victory();
    } else {
      const s3 = snd(); if (s3) s3.gameOver();
    }

    const nextN = state.challenge.index + 1;
    const hasNext = nextN <= CONFIG.challenge.maxChallenge;

    render(`
      <div class="feedback-icon ${success ? 'good' : 'bad'}">${success ? '🏆' : '✕'}</div>
      ${success ? `<div class="challenge-success">CHALLENGE COMPLETE</div>` : ''}
      <h1 class="phase-headline grd">Challenge ${state.challenge.index}</h1>
      <p class="phase-sub">
        ${success
          ? `You nailed ${state.challenge.total} trials with zero mistakes!`
          : reason === 'timeout'
            ? `Time ran out at trial ${state.trialIndex}/${state.challenge.total}.`
            : `Mistake at trial ${state.trialIndex}/${state.challenge.total}. In Challenge mode, one mistake ends the run.`}
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">TRIALS</div><div class="stat-value">${state.challenge.total}</div></div>
        <div class="stat-card"><div class="stat-label">${success ? 'CORRECT' : 'REACHED'}</div><div class="stat-value">${success ? state.challenge.total : state.trialIndex}</div></div>
        <div class="stat-card"><div class="stat-label">MAX STREAK</div><div class="stat-value">${state.maxStreak}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        ${success && hasNext ? `<button class="big-btn" id="next-btn">Next: Challenge ${nextN}</button>` : ''}
        ${!success ? `<button class="big-btn" id="retry-btn">Retry Challenge ${state.challenge.index}</button>` : ''}
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Challenge List</button>
      </div>
    `);

    if (success && hasNext) $('next-btn').addEventListener('click', (e) => { e.stopPropagation(); startChallenge(nextN); });
    if (!success) $('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startChallenge(state.challenge.index); });
    $('back-btn').addEventListener('click', (e) => { e.stopPropagation(); showChallengeMenu(); });

    // ─── Stages check ───
    if (FlashStages && success) {
      FlashStages.checkSession({
        mode: 'challenge', challengeIndex: state.challenge.index, success
      });
    }

    // ─── postMessage ───
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({
        type: 'flash:game-complete', gameId: 'flanker', domain: 'attention', mode: 'challenge',
        challengeIndex: state.challenge.index, trials: state.challenge.total,
        success, maxStreak: state.maxStreak
      }, '*'); } catch (e) {}
    }

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'flanker', domain: 'attention', mode: 'challenge',
        challengeIndex: state.challenge.index,
        trials: state.challenge.total,
        success,
        maxStreak: state.maxStreak
      });
    }
  }

  /* ═══ CHALLENGE MENU ═══ */
  function showChallengeMenu() {
    clearAllTimeouts();
    setPhase('idle');
    setTimer(100);
    state.mode = 'challenge-menu';

    const progress = H.getChallengeProgress();

    let itemsHTML = '';
    for (let n = 1; n <= CONFIG.challenge.maxChallenge; n++) {
      const unlocked = n <= progress.highestUnlocked;
      const completed = !!progress.completed[n];
      const trials = getChallengeTrials(n);

      let cls = 'challenge-item';
      if (!unlocked) cls += ' locked';
      else if (completed) cls += ' completed';

      let status = '';
      if (!unlocked) status = '🔒';
      else if (completed) status = '✓';

      itemsHTML += `
        <div class="${cls}" data-challenge="${n}">
          <div class="ch-status">${status}</div>
          <div class="ch-num">CHALLENGE ${n}</div>
          <div class="ch-trials">${trials}</div>
          <div class="ch-meta">trials · 1 life</div>
        </div>
      `;
    }

    render(`
      <div class="challenge-header">
        <button class="challenge-back" id="back-to-menu">← Back</button>
        <div class="challenge-title">Challenges</div>
        <div style="width:80px;"></div>
      </div>
      <p class="phase-sub" style="max-width:500px;">
        Complete each challenge with <strong style="color:#FF0077">zero mistakes</strong>.
        Each challenge adds 10 more trials.
      </p>
      <div class="challenge-list">${itemsHTML}</div>
    `);

    $('back-to-menu').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    elContent.querySelectorAll('.challenge-item').forEach(el => {
      el.addEventListener('click', () => {
        const n = parseInt(el.dataset.challenge, 10);
        if (!H.isChallengeUnlocked(n)) return;
        startChallenge(n);
      });
    });
  }

  /* ═══ DAILY MODE ═══ */
  function startDaily() {
    state.mode = 'daily';
    state.trialIndex = 0;
    state.levelCorrect = 0; state.levelTotal = 0;
    resetConditionCounters();

    elLevel.textContent = '★';
    elStreak.textContent = '0';
    elLives.textContent = '∞';

    setPhase('countdown');
    showCountdown(3, 'Daily Challenge', `${CONFIG.daily.trials} trials · Fixed protocol`, nextDailyTrial);
  }
  function nextDailyTrial() {
    if (state.trialIndex >= CONFIG.daily.trials) { endDaily(); return; }
    setPhase('trial');
    state.trialIndex++;
    const trial = generateTrial(1, 'daily');
    state.currentTrial = { ...trial, startTime: 0, timeLimit: 2500, answered: false };
    render(`
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        Daily Challenge · ${state.trialIndex} / ${CONFIG.daily.trials}
      </div>
      ${renderFixation()}
    `);
    const delay = settings.reducedMotion ? 80 : CONFIG.fixation.duration;
    state.timeoutIds.push(setTimeout(showDailyStimulus, delay));
  }
  function showDailyStimulus() {
    const trial = state.currentTrial;
    state.currentTrial.startTime = performance.now();
    render(`
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        Daily Challenge · ${state.trialIndex} / ${CONFIG.daily.trials}
      </div>
      <div class="flanker-wrap">${renderFlankerRow(trial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);
    elContent.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => handleDailyAnswer(btn)));
    startDailyTimer(trial.timeLimit);
  }
  function startDailyTimer(timeLimit) {
    const start = performance.now(); setTimer(100);
    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (remaining <= 0) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; handleDailyTimeout(); }
    }, 40);
  }
  function handleDailyAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
    const chosenSide = btn.dataset.side;
    const correctSide = state.currentTrial.centerDir;
    const rawElapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosenSide === correctSide;
    const isValid = rawElapsed >= CONFIG.rtValidation.minValid && rawElapsed <= CONFIG.rtValidation.maxValid;
    if (!isValid) state.invalidRTs++;
    trackByFlankerType(state.currentTrial.type, isCorrect, isValid ? rawElapsed : null);
    state.levelTotal++;
    if (isCorrect) state.levelCorrect++;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, isCorrect)}</div>`;
    showFeedbackFlash(isCorrect); haptic(isCorrect ? 'correct' : 'wrong');
    const jitter = settings.reducedMotion ? 0 : randInt(CONFIG.iti.min, CONFIG.iti.max);
    state.timeoutIds.push(setTimeout(nextDailyTrial, (isCorrect ? 350 : 650) + jitter));
  }
  function handleDailyTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial) return;
    state.currentTrial.answered = true;
    state.levelTotal++;
    const correctSide = state.currentTrial.centerDir;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
    });
    const row = elContent.querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${renderFlankerRow(state.currentTrial.row, true, false)}</div>`;
    showFeedbackFlash(false); haptic('wrong');
    const jitter = settings.reducedMotion ? 0 : randInt(CONFIG.iti.min, CONFIG.iti.max);
    state.timeoutIds.push(setTimeout(nextDailyTrial, 650 + jitter));
  }
  function endDaily() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? Math.round((state.levelCorrect / state.levelTotal) * 100) : 0;
    const validRTs = [...state.congruentRTs, ...state.incongruentRTs, ...state.neutralRTs];
    const medianRT = H.median(validRTs);
    const score = H.rcs(state.levelCorrect, validRTs);
    H.markTodayDone({ accuracy, medianRT, rcs: score });
    setPhase('gameover'); setTimer(0);
    render(`
      <div class="phase-title">Daily Challenge Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${score}</div></div>
      </div>
      <button class="big-btn" id="back-btn" style="margin-top:20px">Back to Menu</button>
    `);
    $('back-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    // ─── postMessage ───
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({
        type: 'flash:game-complete', gameId: 'flanker', domain: 'attention', mode: 'daily',
        accuracy, medianRT, score
      }, '*'); } catch (e) {}
    }
  }

  /* ═══ COMPLETE GAME — CLASSIC ═══ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover'); setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const allValidRTs = [...state.congruentRTs, ...state.incongruentRTs, ...state.neutralRTs];
    const medianRT = H.median(allValidRTs);
    const rtv = H.stdDev(allValidRTs);
    const score = H.rcs(totalCorrect, allValidRTs);

    const congruentMedian = H.median(state.congruentRTs);
    const incongruentMedian = H.median(state.incongruentRTs);
    const neutralMedian = H.median(state.neutralRTs);

    let flankerEffect = null;
    if (state.congruentRTs.length >= 2 && state.incongruentRTs.length >= 2) {
      flankerEffect = incongruentMedian - congruentMedian;
    }
    const congruentAccuracy = state.congruentTotal > 0 ? Math.round((state.congruentCorrect / state.congruentTotal) * 100) : null;
    const incongruentAccuracy = state.incongruentTotal > 0 ? Math.round((state.incongruentCorrect / state.incongruentTotal) * 100) : null;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs: score, flankerEffect,
      congruentAccuracy, incongruentAccuracy, rtv
    };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;

    // Badges
    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy, rcs: score });
    if (newBadges.length > 0) {
      const s = snd(); if (s) s.badge();
    }
    const modeBadges = H.getModeBadges('classic');
    const badgeHTML = modeBadges.length ? `
      <div class="badges-row">
        ${modeBadges.map(b => `<span class="badge-icon ${b.unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">${b.icon}</span>`).join('')}
      </div>
    ` : '';
    H.addToHistory(sessionPayload);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(sessionPayload);

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : '';
    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';
    const flankerHTML = flankerEffect !== null
      ? `<div class="flanker-explanation"><strong>Flanker Effect:</strong> ${flankerEffect >= 0 ? '+' : ''}${flankerEffect} ms<br><span style="color:var(--t2);font-size:11px">Congruent: ${congruentMedian} ms · Neutral: ${neutralMedian} ms · Incongruent: ${incongruentMedian} ms</span></div>`
      : '';

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">RCS SCORE</div><div class="stat-value">${score}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
      </div>
      ${flankerHTML}
      ${insightsHTML}
      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Median RT</div>
        <div class="history-chart" id="history-chart"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">Try Again</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    setTimeout(() => {
      const chartEl = $('history-chart');
      if (chartEl) H.renderHistoryChart(chartEl, history, 'medianRT');
    }, 100);
    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); resetGame(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    // ─── Stages check ───
    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, rcs: score, flankerEffect
      });
    }

    // ─── postMessage ───
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({
        type: 'flash:game-complete', gameId: 'flanker', domain: 'attention', mode: 'classic',
        maxLevel, accuracy, maxStreak: state.maxStreak, score: state.totalScore,
        medianRT, rtv, rcs: score, flankerEffect,
        congruentRT: congruentMedian, incongruentRT: incongruentMedian, neutralRT: neutralMedian,
        congruentAccuracy, incongruentAccuracy,
        invalidRTs: state.invalidRTs, isNewPB: hasNewPB
      }, '*'); } catch (e) {}
    }
    if (hasNewPB) {
      const s = snd(); if (s) s.personalBest();
    }

    if (typeof state.onComplete === 'function') {
      state.onComplete({
        gameId: 'flanker', domain: 'attention', mode: 'classic',
        maxLevel, accuracy, maxStreak: state.maxStreak, score: state.totalScore,
        medianRT, rtv, rcs: score, flankerEffect,
        congruentRT: congruentMedian, incongruentRT: incongruentMedian, neutralRT: neutralMedian,
        congruentAccuracy, incongruentAccuracy,
        invalidRTs: state.invalidRTs, isNewPB: hasNewPB
      });
    }
  }

  /* ═══ IDLE / MODE SELECTION ═══ */
  function showIdle() {
    clearAllTimeouts();
    setPhase('idle'); setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const dailyDone = H.isTodayDone();
    const hasHistory = H.getHistory().length > 0;
    const chProgress = H.getChallengeProgress();
    const endlessBest = H.getEndlessBest();

    const pbAccuracy = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbMedianRT = pb.bestMedianRT < 9999 ? pb.bestMedianRT + ' ms' : '—';
    const pbRCS = pb.bestRCS > 0 ? pb.bestRCS : '—';

    const challengeDone = Object.keys(chProgress.completed).length;

    render(`
      <div class="phase-title">Attention Domain · Conflict Resolution</div>
      <h1 class="phase-headline grd">Flanker Test</h1>
      <p class="phase-sub">
        Respond to the <strong style="color:#00EEFF">CENTER arrow only</strong>.
        Ignore the flanking arrows.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0 6px;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAccuracy}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbMedianRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RCS</div><div class="stat-value" style="font-size:16px">${pbRCS}</div></div>
        </div>
      ` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="mode-grid-4">
        <div class="mode-card ${window.FlankerTutorial && window.FlankerTutorial.isDone() ? 'tutorial-done' : 'tutorial-new'}" id="mode-tutorial">
          ${window.FlankerTutorial && !window.FlankerTutorial.isDone() ? '<div class="mode-badge" style="background:rgba(255,214,10,.2);color:#FFD60A;">NEW</div>' : ''}
          <div class="mode-icon">🎓</div>
          <div class="mode-name">Tutorial</div>
          <div class="mode-desc">Learn how to play in 30 seconds</div>
          <div class="mode-meta">${window.FlankerTutorial && window.FlankerTutorial.isDone() ? '✓ Completed' : '→ Start here'}</div>
        </div>

        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎯</div>
          <div class="mode-name">Classic Test</div>
          <div class="mode-desc">15 levels · 3 lives · Progressive difficulty</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>

        <div class="mode-card tier-hard" id="mode-endless">
          ${endlessBest.bestLevel > 0 ? `<div class="mode-badge pink">BEST L${endlessBest.bestLevel}</div>` : ''}
          <div class="mode-icon">⚡</div>
          <div class="mode-name">Endless</div>
          <div class="mode-desc">Speed increases · One mistake = game over</div>
          <div class="mode-meta">→ Level ${endlessBest.bestLevel || '∞'}</div>
        </div>

        <div class="mode-card tier-hard" id="mode-challenge">
          ${challengeDone > 0 ? `<div class="mode-badge green">${challengeDone}/10 ✓</div>` : ''}
          <div class="mode-icon">🏆</div>
          <div class="mode-name">Challenges</div>
          <div class="mode-desc">10 escalating trials · Zero mistakes required</div>
          <div class="mode-meta">→ ${challengeDone}/10 complete</div>
        </div>

        <div class="mode-card ${dailyDone ? 'disabled' : ''}" id="mode-daily">
          <div class="mode-icon">★</div>
          <div class="mode-name">Daily Challenge</div>
          <div class="mode-desc">${dailyDone ? 'Completed today' : '30 trials · Fixed protocol'}</div>
          <div class="mode-meta">${dailyDone ? '✓ Come back tomorrow' : '→ Once per day'}</div>
        </div>

        ${(window.FlankerExtraModes ? window.FlankerExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card tier-hard" id="mode-${m.id}">
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${m.name}</div>
            <div class="mode-desc">${m.desc}</div>
            <div class="mode-meta">${m.meta}</div>
          </div>
        `).join('')}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>←</kbd> <kbd>→</kbd> to answer · <kbd>Space</kbd> to start classic
      </p>
    `);
    
        // ─── Tutorial (auto-offered for first-timers) ───
    const tutDone = window.FlankerTutorial ? window.FlankerTutorial.isDone() : true;
    const tutCard = document.getElementById('mode-tutorial');
    if (tutCard) {
      if (tutDone) tutCard.classList.add('disabled');
      tutCard.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.FlankerTutorial && window.FlankerAPI) {
          const s = snd(); if (s) s.click();
          window.FlankerTutorial.start(window.FlankerAPI);
        }
      });
    }

    $('mode-classic').addEventListener('click', (e) => { e.stopPropagation(); beginClassicFlow(); });
    $('mode-endless').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    $('mode-challenge').addEventListener('click', (e) => { e.stopPropagation(); showChallengeMenu(); });
    if (!dailyDone) $('mode-daily').addEventListener('click', (e) => { e.stopPropagation(); startDaily(); });

    // ─── Extra modes ───
    if (window.FlankerExtraModes && window.FlankerAPI) {
      window.FlankerExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (el) el.addEventListener('click', (e) => {
          e.stopPropagation();
          window.FlankerExtraModes.start(m.id, window.FlankerAPI);
        });
      });
    }

    // Render stages strip
    if (FlashStages) {
      const stagesEl = document.getElementById('stages-container');
      if (stagesEl) FlashStages.renderStrip(stagesEl);
    }
  }

  function beginClassicFlow() {
    if (settings.skipPractice) startRealGame();
    else startPractice();
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
    state.practiceCorrect = 0; state.practiceTotal = 0;
    resetConditionCounters();
    elLevel.textContent = '1'; elStreak.textContent = '0'; elLives.textContent = String(CONFIG.maxLives);
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[Flanker] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>
            <div class="g-logo">
              <span class="g-logo-icon">⚡</span>
              <span class="g-logo-text">FLASH</span>
            </div>
          </div>
          <div class="g-meta">
            <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">STREAK</span><span class="g-meta-value" id="streak-display">0</span></span>
            <span class="g-meta-item"><span class="g-meta-label">LIVES</span><span class="g-meta-value" id="lives-display">3</span></span>
          </div>
          <button class="g-settings-btn" id="settings-btn" title="Settings" aria-label="Settings">⚙</button>
        </header>
        <main id="stage" class="stage" data-phase="idle">
          <div class="stage-inner"><div id="phase-content"></div></div>
        </main>
        <footer class="g-footer">
          <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
        </footer>
      </div>
    `;

    if (!document.getElementById('settings-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'settings-drawer';
      drawer.className = 'settings-drawer';
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `
        <div class="settings-panel">
          <div class="settings-hd"><span>Settings</span><button id="settings-close" aria-label="Close">✕</button></div>
          <div class="settings-body">
            <label class="settings-row"><span>Reduced Motion</span><input type="checkbox" id="opt-reduced-motion"></label>
            <label class="settings-row"><span>High Contrast</span><input type="checkbox" id="opt-high-contrast"></label>
            <label class="settings-row"><span>Input Mode</span>
              <select id="opt-input-mode">
                <option value="both">Keyboard + Touch</option>
                <option value="keyboard">Keyboard only</option>
                <option value="touch">Touch only</option>
              </select>
            </label>
            <label class="settings-row"><span>Haptics (mobile)</span><input type="checkbox" id="opt-haptics" checked></label>
            <label class="settings-row"><span>Skip Practice</span><input type="checkbox" id="opt-skip-practice"></label>
            <button class="settings-reset" id="opt-reset-data">Reset All Progress</button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }

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
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        e.preventDefault();
        if (state.phase === 'idle' && state.mode === 'idle') { beginClassicFlow(); }
        else if (state.phase === 'gameover') { resetGame(); }
        else if (state.phase === 'correct' && state.mode === 'practice') {
          const btn = $('continue-btn'); if (btn) btn.click();
        }
        return;
      }
      if (state.phase !== 'trial') return;
      const mode = settings.inputMode;
      if (mode === 'touch') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const btn = elContent.querySelector('.answer-btn.left-btn');
        if (btn && !btn.disabled) btn.click();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const btn = elContent.querySelector('.answer-btn.right-btn');
        if (btn && !btn.disabled) btn.click();
      }
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
    const btn = $('back-btn');
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBackClick();
    });
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

  /* ═══════════════════════════════════════════════════════════
     EXPOSE API for extra modes
     ═══════════════════════════════════════════════════════════ */
  window.FlankerAPI = {
    CONFIG,
    state,
    settings: () => settings,

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    renderFlankerRow,
    renderFixation,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateTrial,

    clearAllTimeouts,
    onSessionComplete: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', gameId: 'flanker', domain: 'attention', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $,
    getElContent: () => elContent,
    getElTimerFill: () => elTimerFill
  };

  window.FlankerGame = { mount, reset: resetGame, state, config: CONFIG };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();