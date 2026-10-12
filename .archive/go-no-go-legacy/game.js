/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go v2.1 (Clean)
   Drewe (1975) + Adaptive DDM + Multi-mode + Stages + Analytics
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.GNGHelpers;
  const DDM = window.GNGDDM;
  const S = window.GNGSounds;
  const STAGES = window.GNGStages;
  const FlashStages = window.FlashStages;

  if (!H || !DDM || !S) {
    console.error('[GoNoGo] Missing modules');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('go-no-go', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══ CONFIG ═══ */
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    trialsPerLevel: 24,
    baseWindow: 800,
    minWindow: 400,
    windowStepPerLevel: 28,
    noGoProbability: 0.22,
    correctBase: 80,
    goHitBonus: 60,
    streakBonusPerLevel: 25,
    timeBonusMax: 70,
    passThreshold: 0.72,
    maxCommissionRate: 0.28,
    pesDelayMs: 200,
    pesTrials: 3,
    fatigueAfterTrials: 90,
    rtMin: 100,
    rtMax: 3000
  };

  const SHAPES = {
    blueCircle:    { id: 'blueCircle',    name: 'Blue Circle',    color: '#4D9EFF', shape: 'circle' },
    redSquare:     { id: 'redSquare',     name: 'Red Square',     color: '#FF4D4D', shape: 'square' },
    greenTriangle: { id: 'greenTriangle', name: 'Green Triangle', color: '#00FF96', shape: 'triangle' },
    yellowDiamond: { id: 'yellowDiamond', name: 'Yellow Diamond', color: '#FFD60A', shape: 'diamond' }
  };

  /* ═══ STATE ═══ */
  const state = {
    level: 1, lives: CONFIG.maxLives, phase: 'idle', mode: 'classic',
    goShapes: [], noGoShapes: [], sequence: [], currentIndex: -1, currentTrial: null,
    goHits: 0, goMisses: 0, noGoCorrect: 0, commissionErrors: 0,
    goRTs: [], allRTs: [],
    levelCorrect: 0, levelTotal: 0, levelTotalTime: 0,
    results: [], totalScore: 0, streak: 0, maxStreak: 0,
    totalCommissionErrors: 0, totalOmissionErrors: 0,
    errorsByType: { commission: 0, omission: 0, anticipatory: 0, postError: 0 },
    adaptiveOn: true, ddmLevel: 1,
    pesRemaining: 0, lastTrialWasError: false,
    sessionStartTime: 0, sessionTrialsCompleted: 0, breakOffered: false,
    settings: null,
    timeoutIds: [], trialTimerId: null, onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elGo, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimers() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.trialTimerId) { clearTimeout(state.trialTimerId); state.trialTimerId = null; }
  }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

  /* ═══ SETTINGS ═══ */
  function loadSettings() {
    state.settings = H.getSettings();
    state.adaptiveOn = state.settings.adaptive !== false;
    H.applySettingsToDOM(state.settings);
    if (S) S.setEnabled(state.settings.soundEnabled !== false);
  }
  function openSettings() {
    const d = $('settings-drawer'); if (!d) return;
    $('opt-reduced-motion').checked = state.settings.reducedMotion;
    $('opt-high-contrast').checked  = state.settings.highContrast;
    $('opt-input-mode').value       = state.settings.inputMode;
    $('opt-haptics').checked        = state.settings.haptics;
    $('opt-sound').checked          = state.settings.soundEnabled;
    $('opt-adaptive').checked       = state.settings.adaptive;
    $('opt-distractors').checked    = state.settings.distractors;
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() {
    const d = $('settings-drawer'); if (!d) return;
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
  }
  function wireSettings() {
    const d = $('settings-drawer'); if (!d) return;
    const btn = $('settings-btn');
    if (btn) btn.addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    d.addEventListener('click', (e) => { if (e.target === d) closeSettings(); });

    $('opt-reduced-motion').addEventListener('change', e => { state.settings.reducedMotion = e.target.checked; H.saveSettings(state.settings); H.applySettingsToDOM(state.settings); });
    $('opt-high-contrast').addEventListener('change', e => { state.settings.highContrast = e.target.checked; H.saveSettings(state.settings); H.applySettingsToDOM(state.settings); });
    $('opt-input-mode').addEventListener('change', e => { state.settings.inputMode = e.target.value; H.saveSettings(state.settings); });
    $('opt-haptics').addEventListener('change', e => { state.settings.haptics = e.target.checked; H.saveSettings(state.settings); });
    $('opt-sound').addEventListener('change', e => { state.settings.soundEnabled = e.target.checked; H.saveSettings(state.settings); S.setEnabled(e.target.checked); });
    $('opt-adaptive').addEventListener('change', e => { state.settings.adaptive = e.target.checked; state.adaptiveOn = e.target.checked; H.saveSettings(state.settings); });
    $('opt-distractors').addEventListener('change', e => { state.settings.distractors = e.target.checked; H.saveSettings(state.settings); });
    $('opt-reset-data').addEventListener('click', () => {
      if (confirm('Reset ALL Go/No-Go progress?')) {
        H.resetAll();
        if (FlashStages) FlashStages.reset();
        closeSettings();
        showIdle();
      }
    });
  }
  function haptic(type) {
    if (!state.settings.haptics || !('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }

  /* ═══ RULES BY LEVEL ═══ */
  function ruleForLevel(level) {
    if (level <= 3) return { goShapes: ['blueCircle'], noGoShapes: ['redSquare'], inverted: false };
    if (level <= 6) return { goShapes: ['blueCircle', 'greenTriangle'], noGoShapes: ['redSquare'], inverted: false };
    if (level <= 9) return { goShapes: ['blueCircle', 'greenTriangle'], noGoShapes: ['redSquare', 'yellowDiamond'], inverted: false };
    if (level <= 12) return { goShapes: ['redSquare', 'yellowDiamond'], noGoShapes: ['blueCircle', 'greenTriangle'], inverted: true };
    return { goShapes: ['blueCircle', 'greenTriangle'], noGoShapes: ['redSquare', 'yellowDiamond'], inverted: false, alternates: true };
  }

  /* ═══ SEQUENCE ═══ */
  function generateSequence(level, length, goShapes, noGoShapes, noGoRatio) {
    const ratio = noGoRatio || CONFIG.noGoProbability;
    const seq = [];
    const noGoCount = Math.round(length * ratio);
    const noGoIdx = new Set();
    let attempts = 0;
    while (noGoIdx.size < noGoCount && attempts < 500) {
      attempts++;
      const idx = randInt(2, length - 1);
      if (noGoIdx.has(idx - 1)) continue;
      noGoIdx.add(idx);
    }
    for (let i = 0; i < length; i++) {
      if (noGoIdx.has(i)) seq.push({ shapeId: pickOne(noGoShapes), isGo: false });
      else seq.push({ shapeId: pickOne(goShapes), isGo: true });
    }
    return seq;
  }

  /* ═══ SVG ═══ */
  function renderShapeSVG(id) {
    const s = SHAPES[id]; if (!s) return '';
    const c = s.color;
    if (s.shape === 'circle')   return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="${c}"/></svg>`;
    if (s.shape === 'square')   return `<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="${c}"/></svg>`;
    if (s.shape === 'triangle') return `<svg viewBox="0 0 100 100"><polygon points="50,8 92,88 8,88" fill="${c}"/></svg>`;
    if (s.shape === 'diamond')  return `<svg viewBox="0 0 100 100"><polygon points="50,6 94,50 50,94 6,50" fill="${c}"/></svg>`;
    return '';
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
  function showFeedbackFlash(type) {
    const el = document.createElement('div');
    el.className = `feedback-flash ${type}`;
    el.textContent = type === 'hit' ? '✓' : type === 'commission' ? '!' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 500);
    if (state.settings.soundEnabled !== false) {
      if (type === 'hit') S.hitSignature();
      else if (type === 'commission') S.commissionSig();
      else S.missSignature();
    }
  }
  function renderRuleBanner(switched = false) {
    const g = state.goShapes.map(id => SHAPES[id]).filter(Boolean);
    const n = state.noGoShapes.map(id => SHAPES[id]).filter(Boolean);
    return `
      <div class="rule-banner ${switched ? 'switched' : ''}">
        <span><span class="go-color">GO:</span> ${g.map(x => x.name).join(', ')}</span>
        <span style="color:var(--t3)">|</span>
        <span><span class="nogo-color">STOP:</span> ${n.map(x => x.name).join(', ')}</span>
      </div>`;
  }
  function renderLiveStats() {
    const total = state.goHits + state.goMisses + state.noGoCorrect + state.commissionErrors;
    const correct = state.goHits + state.noGoCorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    return `
      <div class="live-stats">
        <span class="live-stat">GO HITS <span class="v good">${state.goHits}</span></span>
        <span class="live-stat">MISSES <span class="v bad">${state.goMisses}</span></span>
        <span class="live-stat">COMMISSIONS <span class="v bad">${state.commissionErrors}</span></span>
        <span class="live-stat">ACC <span class="v">${acc}%</span></span>
      </div>`;
  }

  /* ═══ IDLE (FIXED — no more broken template) ═══ */
  function showIdle() {
    setPhase('idle');
    setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT  = pb.bestMedianRT < 9999 ? pb.bestMedianRT + ' ms' : '—';
    const pbD   = pb.bestDPrime > 0 ? pb.bestDPrime : '—';

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
      <div class="phase-title">Attention Domain · Response Inhibition</div>
      <h1 class="phase-headline grd">Go / No-Go</h1>
      <p class="phase-sub">
        Click <strong style="color:#00FF96">GO shapes</strong>.
        Do NOT click <strong style="color:#FF0077">NO-GO shapes</strong>.
      </p>

      ${pb.bestAccuracy > 0 ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RT</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST d'</div><div class="stat-value" style="font-size:16px">${pbD}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">Today's Missions</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-3">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎯</div>
          <div class="mode-name">Classic</div>
          <div class="mode-desc">15 levels · 3 lives · ${state.adaptiveOn ? 'Adaptive DDM' : 'Fixed difficulty'}</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        <div class="mode-card tier-hard" id="mode-sart">
          <div class="mode-icon">⏱️</div>
          <div class="mode-name">SART</div>
          <div class="mode-desc">89% Go · 11% No-Go · Mind-wandering test</div>
          <div class="mode-meta">→ Rapid stream</div>
        </div>

        ${(window.GNGModes ? window.GNGModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card tier-hard" id="mode-${m.id}">
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${m.name}</div>
            <div class="mode-desc">${m.desc}</div>
            <div class="mode-meta">${m.meta}</div>
          </div>
        `).join('')}

        <div class="mode-card ${daily ? 'disabled' : ''}" id="mode-daily">
          <div class="mode-icon">★</div>
          <div class="mode-name">Daily</div>
          <div class="mode-desc">${daily ? 'Completed today' : '30 trials · Fixed protocol'}</div>
          <div class="mode-meta">${daily ? '✓ Come back tomorrow' : '→ Once per day'}</div>
        </div>
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>Space</kbd> to start · <kbd>←</kbd> / <kbd>→</kbd> also work
      </p>
    `);

    // Render stages strip
    if (FlashStages) {
      const stagesEl = document.getElementById('stages-container');
      if (stagesEl) FlashStages.renderStrip(stagesEl);
    }

    // Wire buttons
    $('mode-classic').addEventListener('click', (e) => { e.stopPropagation(); if (S) S.click(); startClassic(); });
    $('mode-sart').addEventListener('click', (e) => { e.stopPropagation(); if (S) S.click(); startSART(); });
    if (!daily) $('mode-daily').addEventListener('click', (e) => { e.stopPropagation(); if (S) S.click(); startDaily(); });

    // Extra modes
    if (window.GNGModes && window.GNGAPI) {
      window.GNGModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (el) el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (S) S.click();
          window.GNGModes.start(m.id, window.GNGAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.totalCommissionErrors = 0;
    state.totalOmissionErrors = 0;
    state.errorsByType = { commission: 0, omission: 0, anticipatory: 0, postError: 0 };
    state.sessionTrialsCompleted = 0;
    state.sessionStartTime = performance.now();
    state.breakOffered = false;
    DDM.reset(1);
    startLevel();
  }

  function startLevel() {
    clearAllTimers();
    const rule = ruleForLevel(state.level);
    state.goShapes = rule.goShapes;
    state.noGoShapes = rule.noGoShapes;

    const ddmDiff = state.adaptiveOn ? DDM.getDifficulty(DDM.getLevel()) : null;
    const noGoRatio = ddmDiff ? ddmDiff.noGoRatio : CONFIG.noGoProbability;

    state.sequence = generateSequence(state.level, CONFIG.trialsPerLevel, rule.goShapes, rule.noGoShapes, noGoRatio);
    state.currentIndex = -1;
    state.goHits = 0; state.goMisses = 0; state.noGoCorrect = 0; state.commissionErrors = 0;
    state.goRTs = []; state.allRTs = [];
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.pesRemaining = 0;

    elLevel.textContent = String(state.level);
    updateHeader();
    showCountdown();
  }

  function updateHeader() {
    elGo.textContent = String(state.goHits);
    elLives.textContent = String(state.lives);
  }

  function showCountdown() {
    setPhase('countdown');
    let count = 3;
    const rule = ruleForLevel(state.level);
    const tick = () => {
      if (count > 0) {
        if (S) S.tick();
        render(`
          ${renderProgressDots()}
          <div class="phase-title">Level ${state.level} · Get Ready</div>
          <div class="countdown-num">${count}</div>
          <p class="phase-sub" style="margin-top:14px;">
            ${rule.inverted ? '⚠ RULES INVERTED' : 'Respond to GO shapes only'}
          </p>
        `);
        count--;
        push(tick, 700);
      } else {
        if (S) S.go();
        startStream();
      }
    };
    tick();
  }

  function startStream() {
    setPhase('trial');
    state.currentIndex = 0;
    showNextTrial(false);
  }

  function showNextTrial(switched = false) {
    if (state.currentIndex >= state.sequence.length) { endLevel(); return; }

    const trial = state.sequence[state.currentIndex];
    const ddmDiff = state.adaptiveOn ? DDM.getDifficulty(DDM.getLevel()) : null;
    const baseWindow = Math.max(CONFIG.minWindow, CONFIG.baseWindow - (state.level - 1) * CONFIG.windowStepPerLevel);
    const windowMs = ddmDiff ? ddmDiff.stimulusDuration : baseWindow;

    state.currentTrial = {
      ...trial,
      startTime: performance.now(),
      windowMs,
      responded: false,
      index: state.currentIndex,
      pesApplied: state.pesRemaining > 0
    };

    render(`
      ${renderProgressDots()}
      ${renderRuleBanner(switched)}
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${SHAPES[trial.shapeId]?.shape || 'circle'}">
          ${renderShapeSVG(trial.shapeId)}
        </div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
      ${renderLiveStats()}
      <div class="trial-progress">
        <div class="trial-progress-fill" style="width:${((state.currentIndex + 1) / state.sequence.length) * 100}%"></div>
      </div>
    `);

    $('response-btn').addEventListener('click', handleResponse);

    const actualWindow = windowMs + (state.pesRemaining > 0 ? CONFIG.pesDelayMs : 0);
    state.trialTimerId = setTimeout(finishTrial, actualWindow);
  }

  function handleResponse() {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.responded) return;
    state.currentTrial.responded = true;

    const rt = performance.now() - state.currentTrial.startTime;
    const wrap = $('stimulus-wrap');
    const isValidRT = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;

    if (rt < CONFIG.rtMin) {
      state.errorsByType.anticipatory++;
      state.streak = 0;
      if (wrap) wrap.classList.add('wrong');
      showFeedbackFlash('miss');
      haptic('wrong');
      DDM.onTrialEnd({ correct: false, rt: 0, isGo: state.currentTrial.isGo, wasCommission: false });
      return;
    }

    if (state.currentTrial.isGo) {
      state.goHits++;
      if (isValidRT) state.goRTs.push(rt);
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = Math.round((1 - rt / state.currentTrial.windowMs) * CONFIG.timeBonusMax);
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonusPerLevel : 0;
      state.totalScore += CONFIG.correctBase + CONFIG.goHitBonus + Math.max(0, timeBonus) + streakBonus;

      if (wrap) wrap.classList.add('correct');
      showFeedbackFlash('hit');
      haptic('correct');
      updateHeader();

      DDM.onTrialEnd({ correct: true, rt, isGo: true, wasCommission: false });
    } else {
      state.commissionErrors++;
      state.totalCommissionErrors++;
      state.errorsByType.commission++;
      if (state.lastTrialWasError) state.errorsByType.postError++;
      state.lastTrialWasError = true;
      state.streak = 0;
      state.pesRemaining = CONFIG.pesTrials;

      if (wrap) wrap.classList.add('wrong');
      showFeedbackFlash('commission');
      haptic('wrong');

      DDM.onTrialEnd({ correct: false, rt: 0, isGo: false, wasCommission: true });
    }
  }

  function finishTrial() {
    if (state.trialTimerId) { clearTimeout(state.trialTimerId); state.trialTimerId = null; }
    if (!state.currentTrial) return;

    const trial = state.currentTrial;

    if (!trial.responded) {
      if (trial.isGo) {
        state.goMisses++;
        state.totalOmissionErrors++;
        state.errorsByType.omission++;
        if (state.lastTrialWasError) state.errorsByType.postError++;
        state.lastTrialWasError = true;
        state.streak = 0;
        state.pesRemaining = CONFIG.pesTrials;
        showFeedbackFlash('miss');
        haptic('wrong');
        DDM.onTrialEnd({ correct: false, rt: 0, isGo: true, wasCommission: false });
      } else {
        state.noGoCorrect++;
        state.lastTrialWasError = false;
        DDM.onTrialEnd({ correct: true, rt: 0, isGo: false, wasCommission: false });
      }
    } else {
      if (trial.isGo && state.goHits > 0) {
        state.lastTrialWasError = false;
      }
    }

    const wasCorrect = (trial.isGo && trial.responded) || (!trial.isGo && !trial.responded);
    state.levelTotal++;
    if (wasCorrect) state.levelCorrect++;
    state.sessionTrialsCompleted++;

    if (state.pesRemaining > 0) state.pesRemaining--;
    updateHeader();
    state.currentIndex++;

    let switched = false;
    if (ruleForLevel(state.level).alternates && state.currentIndex > 0 && state.currentIndex % 8 === 0) {
      const rem = state.sequence.slice(state.currentIndex);
      rem.forEach(t => t.isGo = !t.isGo);
      state.sequence = state.sequence.slice(0, state.currentIndex).concat(rem);
      const tmp = state.goShapes;
      state.goShapes = state.noGoShapes;
      state.noGoShapes = tmp;
      switched = true;
      if (S) S.levelUpSignature();
    }

    if (state.sessionTrialsCompleted > 0 && state.sessionTrialsCompleted % CONFIG.fatigueAfterTrials === 0 && !state.breakOffered) {
      state.breakOffered = true;
      offerBreak();
      return;
    }

    push(() => showNextTrial(switched), 220);
  }

  /* ═══ FATIGUE BREAK ═══ */
  function offerBreak() {
    if (S) S.breakChime();
    setPhase('correct');
    render(`
      <div class="feedback-icon good">☕</div>
      <h2 class="phase-headline grd">Time for a Break</h2>
      <p class="phase-sub">
        You've completed <strong>${state.sessionTrialsCompleted}</strong> trials.
        <br>
        Research shows performance drops after this point. Take 30 seconds.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
        <button class="big-btn" id="break-continue">Continue Playing</button>
        <button class="big-btn" id="break-end" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">End Session</button>
      </div>
    `);
    $('break-continue').addEventListener('click', (e) => {
      e.stopPropagation();
      if (S) S.click();
      state.breakOffered = false;
      push(() => showNextTrial(false), 100);
    });
    $('break-end').addEventListener('click', (e) => {
      e.stopPropagation();
      if (S) S.click();
      endLevel();
    });
  }

  /* ═══ SART MODE ═══ */
  function startSART() {
    state.mode = 'sart';
    clearAllTimers();
    state.goShapes = ['blueCircle', 'greenTriangle', 'yellowDiamond', 'redSquare'];
    state.noGoShapes = ['yellowDiamond'];
    state.level = 1;
    state.goHits = 0; state.goMisses = 0; state.noGoCorrect = 0; state.commissionErrors = 0;
    state.goRTs = []; state.allRTs = [];
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.streak = 0; state.maxStreak = 0;
    state.pesRemaining = 0;

    const SART_TRIALS = 60;
    const SART_NOGO = 0.11;

    state.sequence = [];
    const noGoCount = Math.round(SART_TRIALS * SART_NOGO);
    const noGoIdx = new Set();
    while (noGoIdx.size < noGoCount) {
      const i = randInt(3, SART_TRIALS - 1);
      if (noGoIdx.has(i - 1)) continue;
      noGoIdx.add(i);
    }
    for (let i = 0; i < SART_TRIALS; i++) {
      if (noGoIdx.has(i)) state.sequence.push({ shapeId: 'yellowDiamond', isGo: false });
      else state.sequence.push({ shapeId: pickOne(['blueCircle', 'greenTriangle', 'redSquare']), isGo: true });
    }
    state.currentIndex = -1;

    elLevel.textContent = 'S';
    updateHeader();
    setPhase('countdown');
    let c = 3;
    const tick = () => {
      if (c > 0) {
        if (S) S.tick();
        render(`
          <div class="phase-title">SART · Sustained Attention</div>
          <div class="countdown-num">${c}</div>
          <p class="phase-sub" style="margin-top:14px;">
            60 trials · Respond to everything EXCEPT yellow diamond
          </p>
        `);
        c--; push(tick, 700);
      } else {
        if (S) S.go();
        setPhase('trial');
        state.currentIndex = 0;
        showSARTTrial();
      }
    };
    tick();
  }

  function showSARTTrial() {
    if (state.currentIndex >= state.sequence.length) { finishSART(); return; }
    const trial = state.sequence[state.currentIndex];
    state.currentTrial = {
      ...trial,
      startTime: performance.now(),
      windowMs: 250,
      responded: false,
      index: state.currentIndex
    };

    render(`
      <div class="practice-badge" style="background:rgba(0,238,255,.1);border-color:rgba(0,238,255,.4);color:var(--cyan);">
        SART · ${state.currentIndex + 1} / ${state.sequence.length}
      </div>
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${SHAPES[trial.shapeId]?.shape || 'circle'}">
          ${renderShapeSVG(trial.shapeId)}
        </div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
      ${renderLiveStats()}
    `);
    $('response-btn').addEventListener('click', handleResponse);
    state.trialTimerId = setTimeout(finishSARTTrial, 900);
  }

  function finishSARTTrial() {
    if (state.trialTimerId) { clearTimeout(state.trialTimerId); state.trialTimerId = null; }
    if (!state.currentTrial) return;
    const trial = state.currentTrial;

    if (!trial.responded) {
      if (trial.isGo) {
        state.goMisses++; state.totalOmissionErrors++;
        DDM.onTrialEnd({ correct: false, rt: 0, isGo: true, wasCommission: false });
      } else {
        state.noGoCorrect++;
        DDM.onTrialEnd({ correct: true, rt: 0, isGo: false, wasCommission: false });
      }
    }

    const wasCorrect = (trial.isGo && trial.responded) || (!trial.isGo && !trial.responded);
    state.levelTotal++;
    if (wasCorrect) state.levelCorrect++;
    state.currentIndex++;
    updateHeader();
    push(showSARTTrial, 50);
  }

  function finishSART() {
    clearAllTimers();
    const accuracy = state.levelTotal > 0 ? Math.round((state.levelCorrect / state.levelTotal) * 100) : 0;
    const validRTs = state.goRTs;
    const medianRT = H.median(validRTs);
    const rtv = H.stdDev(validRTs);
    const dPrime = H.computeDPrime(state.goHits, state.goMisses, state.commissionErrors, state.noGoCorrect);

    const sessionPayload = {
      mode: 'sart',
      accuracy, medianRT, rcs: H.rcs(state.levelCorrect, validRTs),
      dPrime, commissionRate: state.commissionErrors / Math.max(1, state.noGoCorrect + state.commissionErrors),
      rtv, isNewPB: false
    };

    const newBadges = H.checkAndUnlockBadges('sart', { trials: state.levelTotal, dPrime });
    if (newBadges.length > 0 && S) S.badge();

    setPhase('gameover');
    setTimer(0);

    render(`
      <div class="phase-title">SART Complete</div>
      <h1 class="phase-headline grd">d' = ${dPrime}</h1>
      <p class="phase-sub">${accuracy}% accuracy · ${state.commissionErrors} impulsions</p>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">COMMISSIONS</div><div class="stat-value bad">${state.commissionErrors}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
      </div>

      <button class="big-btn" id="back-btn-sart" style="margin-top:20px">Back to Menu</button>
    `);
    $('back-btn-sart').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({ mode: 'sart', dPrime, accuracy, trials: state.levelTotal });
    }

    emitComplete({ gameId: 'go-no-go', domain: 'attention', mode: 'sart', ...sessionPayload, results: [] });
  }

  /* ═══ DAILY ═══ */
  function startDaily() {
    state.mode = 'daily';
    clearAllTimers();
    const rule = ruleForLevel(5);
    state.goShapes = rule.goShapes;
    state.noGoShapes = rule.noGoShapes;
    state.sequence = generateSequence(5, 30, rule.goShapes, rule.noGoShapes, 0.25);
    state.currentIndex = -1;
    state.goHits = 0; state.goMisses = 0; state.noGoCorrect = 0; state.commissionErrors = 0;
    state.goRTs = []; state.allRTs = [];
    state.levelCorrect = 0; state.levelTotal = 0;
    state.pesRemaining = 0;

    elLevel.textContent = '★';
    setPhase('countdown');
    let c = 3;
    const tick = () => {
      if (c > 0) { if (S) S.tick(); render(`<div class="phase-title">Daily Challenge</div><div class="countdown-num">${c}</div>`); c--; push(tick, 700); }
      else { if (S) S.go(); setPhase('trial'); state.currentIndex = 0; showDailyTrial(); }
    };
    tick();
  }

  function showDailyTrial() {
    if (state.currentIndex >= state.sequence.length) { finishDaily(); return; }
    const trial = state.sequence[state.currentIndex];
    state.currentTrial = { ...trial, startTime: performance.now(), windowMs: 700, responded: false, index: state.currentIndex };

    render(`
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        Daily · ${state.currentIndex + 1} / 30
      </div>
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${SHAPES[trial.shapeId]?.shape}">${renderShapeSVG(trial.shapeId)}</div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
      ${renderLiveStats()}
    `);
    $('response-btn').addEventListener('click', handleResponse);
    state.trialTimerId = setTimeout(finishDailyTrial, 700);
  }

  function finishDailyTrial() {
    if (state.trialTimerId) { clearTimeout(state.trialTimerId); state.trialTimerId = null; }
    if (!state.currentTrial) return;
    const trial = state.currentTrial;
    if (!trial.responded) {
      if (trial.isGo) state.goMisses++;
      else state.noGoCorrect++;
    }
    const wasCorrect = (trial.isGo && trial.responded) || (!trial.isGo && !trial.responded);
    state.levelTotal++; if (wasCorrect) state.levelCorrect++;
    state.currentIndex++;
    push(showDailyTrial, 300);
  }

  function finishDaily() {
    clearAllTimers();
    const accuracy = state.levelTotal > 0 ? Math.round((state.levelCorrect / state.levelTotal) * 100) : 0;
    const rcs = H.rcs(state.levelCorrect, state.goRTs);
    H.markTodayDone({ rcs, accuracy });
    setPhase('gameover');

    render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
      </div>
      <button class="big-btn" id="back-btn-daily" style="margin-top:20px">Back to Menu</button>
    `);
    $('back-btn-daily').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    }

    emitComplete({ gameId: 'go-no-go', domain: 'attention', mode: 'daily', accuracy, rcs });
  }

  /* ═══ END LEVEL ═══ */
  function endLevel() {
    clearAllTimers();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;
    const totalNoGo = state.noGoCorrect + state.commissionErrors;
    const commissionRate = totalNoGo > 0 ? state.commissionErrors / totalNoGo : 0;
    const passed = accuracy >= CONFIG.passThreshold && commissionRate <= CONFIG.maxCommissionRate;

    state.results.push({
      level: state.level, correct: state.levelCorrect, total: state.levelTotal,
      goHits: state.goHits, goMisses: state.goMisses,
      noGoCorrect: state.noGoCorrect, commissionErrors: state.commissionErrors, passed
    });

    if (passed) {
      if (S) S.levelUpSignature();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.goHits} GO hits · ${state.goMisses} missed
          <br>${state.commissionErrors} impulsive errors
          <br>Accuracy: ${Math.round(accuracy * 100)}%
        </p>
      `);
      push(() => {
        if (state.level < CONFIG.maxLevel) { state.level++; startLevel(); }
        else completeGame();
      }, 1600);
    } else {
      state.lives--;
      updateHeader();
      setPhase('wrong');
      if (S) S.gameOver();
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Not Passed</h2>
        <p class="phase-sub">
          Accuracy: ${Math.round(accuracy * 100)}%
          ${commissionRate > CONFIG.maxCommissionRate ? `<br>Too many impulses (${state.commissionErrors})` : ''}
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} left.
        </p>
      `);
      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1900);
    }
  }

  /* ═══ COMPLETE GAME ═══ */
  function completeGame() {
    clearAllTimers();
    setPhase('gameover');
    setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const avgGoRT = state.goRTs.length > 0 ? Math.round(state.goRTs.reduce((a, b) => a + b, 0) / state.goRTs.length) : 0;
    const medianRT = H.median(state.goRTs);
    const rtv = H.stdDev(state.goRTs);
    const rcs = H.rcs(totalCorrect, state.goRTs);
    const dPrime = H.computeDPrime(state.goHits, state.goMisses, state.totalCommissionErrors, state.results.reduce((a, r) => a + r.noGoCorrect, 0));
    const bias = H.computeBias(state.goHits, state.goMisses, state.totalCommissionErrors, state.results.reduce((a, r) => a + r.noGoCorrect, 0));

    const totalNoGo = state.totalCommissionErrors + state.results.reduce((a, r) => a + r.noGoCorrect, 0);
    const commissionRate = totalNoGo > 0 ? Math.round((state.totalCommissionErrors / totalNoGo) * 100) : 0;

    const sessionPayload = { mode: 'classic', accuracy, medianRT, rcs, dPrime, commissionRate, rtv };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB && S) S.personalBest();

    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy });
    if (newBadges.length > 0 && S) S.badge();
    const modeBadges = H.getModeBadges('classic');
    const badgeHTML = modeBadges.length ? `
      <div class="badges-row">
        ${modeBadges.map(b => `<span class="badge-icon ${b.unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">${b.icon}</span>`).join('')}
      </div>` : '';

    H.addToHistory(sessionPayload);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(sessionPayload);

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : '';

    let dInterp = '';
    if (dPrime >= 3) dInterp = 'Excellent sensitivity';
    else if (dPrime >= 2) dInterp = 'Strong discrimination';
    else if (dPrime >= 1) dInterp = 'Average discrimination';
    else dInterp = 'Low discrimination — practice recommended';

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    const errHTML = `
      <div class="inhibition-box">
        <strong>Error Breakdown</strong><br>
        Commissions: <strong>${state.errorsByType.commission}</strong> ·
        Omissions: <strong>${state.errorsByType.omission}</strong> ·
        Anticipatory: <strong>${state.errorsByType.anticipatory}</strong> ·
        Post-error: <strong>${state.errorsByType.postError}</strong>
      </div>`;

    if (S) S.victorySig();

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">COMMISSIONS</div><div class="stat-value bad">${state.totalCommissionErrors}</div></div>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-top:-10px;">
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
        <div class="stat-card"><div class="stat-label">BIAS</div><div class="stat-value">${bias}</div></div>
      </div>

      <div class="inhibition-box">
        <strong>d' (d-prime):</strong> ${dPrime} — ${dInterp}
        <br>
        <span style="color:var(--t2);font-size:11px">d' separates true discrimination ability from response bias</span>
      </div>

      ${errHTML}
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

    push(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'medianRT');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    // ═══ STAGES CHECK — CORRECT LOCATION ═══
    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, dPrime, score: state.totalScore
      });
    }

    emitComplete({
      gameId: 'go-no-go', domain: 'attention', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, dPrime, bias, commissionRate,
      commissionErrors: state.totalCommissionErrors,
      omissionErrors: state.totalOmissionErrors,
      errorsByType: { ...state.errorsByType },
      isNewPB: hasNewPB
    });
  }

  /* ═══ EMIT ═══ */
  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
    }
  }

  /* ═══ RESET ═══ */
  function resetGame() {
    clearAllTimers();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.totalCommissionErrors = 0;
    state.totalOmissionErrors = 0;
    state.errorsByType = { commission: 0, omission: 0, anticipatory: 0, postError: 0 };
    state.currentTrial = null;
    state.currentIndex = -1;
    state.sequence = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[GoNoGo] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>
            <div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>
          </div>
          <div class="g-meta">
            <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">GO</span><span class="g-meta-value" id="go-display">0</span></span>
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

    if (!document.getElementById('settings-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'settings-drawer';
      drawer.className = 'settings-drawer';
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `
        <div class="settings-panel">
          <div class="settings-hd"><span>Settings</span><button id="settings-close">✕</button></div>
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
            <label class="settings-row"><span>Sound</span><input type="checkbox" id="opt-sound" checked></label>
            <label class="settings-row"><span>Haptics</span><input type="checkbox" id="opt-haptics" checked></label>
            <label class="settings-row"><span>Adaptive DDM</span><input type="checkbox" id="opt-adaptive" checked></label>
            <label class="settings-row"><span>Distractors</span><input type="checkbox" id="opt-distractors"></label>
            <button class="settings-reset" id="opt-reset-data">Reset All Progress</button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    wireRefs();
    bindGlobalKeys();
    loadSettings();
    wireSettings();
    wireBackButton();

    if (typeof options.onComplete === 'function') state.onComplete = options.onComplete;
    showIdle();
  }

  function wireRefs() {
    elStage     = $('stage');
    elLevel     = $('level-display');
    elGo        = $('go-display');
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
        if (state.phase === 'trial') { handleResponse(); return; }
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && state.phase === 'trial') {
        e.preventDefault();
        handleResponse();
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    if (S) S.click();
    clearAllTimers();
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
    loadSettings();
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══ EXPOSE API for extra modes ═══ */
  window.GNGAPI = {
    CONFIG, state,
    settings: () => state.settings,
    render, setPhase, setTimer, showFeedbackFlash, haptic,
    showCountdown: (from, title, subtitle, onDone) => {
      let c = from;
      const tick = () => {
        if (c > 0) {
          if (S) S.tick();
          render(`<div class="phase-title">${title}</div><div class="countdown-num">${c}</div><p class="phase-sub" style="margin-top:14px;">${subtitle}</p>`);
          c--; push(tick, 700);
        } else { if (S) S.go(); onDone(); }
      };
      tick();
    },
    showLevelUpFlash: (txt) => {
      const el = document.createElement('div');
      el.className = 'levelup-flash'; el.textContent = txt;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    },
    renderShape: renderShapeSVG,
    shapeClass: (id) => SHAPES[id]?.shape || 'circle',
    startTrialTimer: (ms, onEnd) => {
      if (state.trialTimerId) clearTimeout(state.trialTimerId);
      state.trialTimerId = setTimeout(onEnd, ms);
    },
    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', gameId: 'go-no-go', domain: 'attention', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,
    $,
    getElContent: () => elContent
  };

  window.GoNoGoGame = { mount, reset: resetGame, state, config: CONFIG };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();