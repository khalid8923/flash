/* ═══════════════════════════════════════════════════════════
   FLASH — Task Switching v2.0 (Full Rewrite)
   Monsell (2003) · Rogers & Monsell (1995)
   Modes: Classic · Rule Rush · Endless · Precision · Daily
   Features: Adaptive · Stages · Missions · Badges · Sounds ·
             Settings · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.TaskSwitchingHelpers;
  const S = window.TaskSwitchingSounds;
  const STAGES = window.TaskSwitchingStages;
  const FlashStages = window.FlashStages;

  if (!H) {
    console.error('[TaskSwitching] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('task-switching', STAGES, {
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
    trialsPerLevel: 18,
    baseTime: 2400,
    minTime: 1000,
    timeStepPerLevel: 90,
    switchChanceBase: 0.20,
    switchChanceMax: 0.55,
    correctBase: 100,
    streakBonus: 30,
    timeBonusMax: 70,
    rtMin: 100,
    rtMax: 3000,
    fatigueAfterTrials: 80
  };

  /* ═══ RULES ═══ */
  const NUMBER_RULES = [
    {
      id: 'odd-even',
      dimension: 'number',
      prompt: 'Is the number ODD or EVEN?',
      options: ['ODD', 'EVEN'],
      classify: (s) => (s.value % 2 === 0 ? 'right' : 'left')
    },
    {
      id: 'greater-less',
      dimension: 'number',
      prompt: 'Is the number less than 5 or 5+?',
      options: ['< 5', '≥ 5'],
      classify: (s) => (s.value >= 5 ? 'right' : 'left')
    }
  ];

  const LETTER_RULES = [
    {
      id: 'vowel-consonant',
      dimension: 'letter',
      prompt: 'Is the letter a VOWEL or CONSONANT?',
      options: ['VOWEL', 'CONSONANT'],
      classify: (s) => (s.isVowel ? 'left' : 'right')
    },
    {
      id: 'upper-lower',
      dimension: 'letter',
      prompt: 'Is the letter UPPERCASE or lowercase?',
      options: ['UPPER', 'lower'],
      classify: (s) => (s.isUpper ? 'left' : 'right')
    }
  ];

  /* ═══ STIMULUS ═══ */
  function generateNumberStimulus() {
    const value = Math.floor(Math.random() * 9) + 1;
    return { type: 'number', value, display: String(value) };
  }
  function generateLetterStimulus() {
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const isVowel = Math.random() < 0.4;
    const pool = isVowel ? vowels : consonants;
    const ch = pool[Math.floor(Math.random() * pool.length)];
    const isUpper = Math.random() < 0.5;
    return { type: 'letter', value: ch, isVowel, isUpper, display: isUpper ? ch : ch.toLowerCase() };
  }
  function generateStimulus() {
    return Math.random() < 0.5 ? generateNumberStimulus() : generateLetterStimulus();
  }
  function rulesForStimulus(stimulus) {
    return stimulus.type === 'number' ? NUMBER_RULES : LETTER_RULES;
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentTrial: null,
    previousRule: null,
    trialIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,

    switchRTs: [], repeatRTs: [],
    switchCorrect: 0, switchTotal: 0,
    repeatCorrect: 0, repeatTotal: 0,

    sessionTrialsCompleted: 0,
    breakOffered: false,
    settings: null,

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
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }
  function switchChanceForLevel(level) {
    return Math.min(CONFIG.switchChanceMax, CONFIG.switchChanceBase + (level - 1) * 0.025);
  }

  /* ═══ SETTINGS ═══ */
  function loadSettings() {
    state.settings = H.getSettings();
    H.applySettingsToDOM(state.settings);
    if (S) S.setEnabled(state.settings.soundEnabled !== false);
  }
  function openSettings() {
    const d = $('settings-drawer'); if (!d) return;
    $('opt-reduced-motion').checked = state.settings.reducedMotion;
    $('opt-high-contrast').checked  = state.settings.highContrast;
    $('opt-input-mode').value       = state.settings.inputMode;
    $('opt-sound').checked          = state.settings.soundEnabled;
    $('opt-haptics').checked        = state.settings.haptics;
    $('opt-adaptive').checked       = state.settings.adaptive;
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
    $('opt-sound').addEventListener('change', e => { state.settings.soundEnabled = e.target.checked; H.saveSettings(state.settings); if (S) S.setEnabled(e.target.checked); });
    $('opt-haptics').addEventListener('change', e => { state.settings.haptics = e.target.checked; H.saveSettings(state.settings); });
    $('opt-adaptive').addEventListener('change', e => { state.settings.adaptive = e.target.checked; H.saveSettings(state.settings); });
    $('opt-reset-data').addEventListener('click', () => {
      if (confirm('Reset ALL Task Switching progress?')) {
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
  function snd() {
    return (S && state.settings.soundEnabled !== false) ? S : null;
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
      } else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = `feedback-flash ${hit ? 'hit' : 'miss'}`;
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 420);
    const s = snd();
    if (s) { hit ? s.hit() : s.miss(); }
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
        const s = snd(); if (s) s.tick();
        render(`<div class="phase-title">${title}</div><div class="countdown-num">${c}</div><p class="phase-sub" style="margin-top:16px;">${subtitle}</p>`);
        c--; push(tick, 700);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }
  function computeSwitchCost() {
    const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    if (!state.switchRTs.length || !state.repeatRTs.length) return null;
    return avg(state.switchRTs) - avg(state.repeatRTs);
  }

  /* ═══════════════════════════════════════════════════════════
     IDLE SCREEN
     ═══════════════════════════════════════════════════════════ */
  function showIdle() {
    clearAllTimeouts();
    setPhase('idle');
    setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT  = pb.bestMedianRT < 9999 ? pb.bestMedianRT + ' ms' : '—';
    const pbSC  = pb.bestSwitchCost < 9999 ? pb.bestSwitchCost + ' ms' : '—';

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
      <div class="phase-title">Attention Domain · Cognitive Flexibility</div>
      <h1 class="phase-headline grd">Task Switching</h1>
      <p class="phase-sub">
        A letter or number appears with a <strong>rule banner</strong>.
        Answer according to the current rule.
        <br>
        ⚡ <strong>The rule may switch without warning</strong>.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST SWITCH COST</div><div class="stat-value" style="font-size:16px">${pbSC}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">Today's Missions</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎯</div>
          <div class="mode-name">Classic</div>
          <div class="mode-desc">15 levels · 3 lives · Progressive difficulty</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.TaskSwitchingExtraModes ? window.TaskSwitchingExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
            ${m.id === 'daily' && !daily ? '' : m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${m.name}</div>
            <div class="mode-desc">${m.id === 'daily' && daily ? 'Completed today' : m.desc}</div>
            <div class="mode-meta">${m.id === 'daily' && daily ? '→ Come back tomorrow' : m.meta}</div>
          </div>
        `).join('')}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>1</kbd> / <kbd>2</kbd> to answer · <kbd>Space</kbd> to start classic
      </p>
    `);

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    // Wire Classic
    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    // Wire Extra modes
    if (window.TaskSwitchingExtraModes && window.TSAPI) {
      window.TaskSwitchingExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;  // disabled
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.TaskSwitchingExtraModes.start(m.id, window.TSAPI, S, H);
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CLASSIC MODE
     ═══════════════════════════════════════════════════════════ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.switchRTs = []; state.repeatRTs = [];
    state.switchCorrect = 0; state.switchTotal = 0;
    state.repeatCorrect = 0; state.repeatTotal = 0;
    state.sessionTrialsCompleted = 0;
    state.breakOffered = false;

    elLevel.textContent = '1';
    elLives.textContent = String(CONFIG.maxLives);
    elStreak.textContent = '0';
    startLevel();
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.trialIndex = 0;
    state.previousRule = null;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, `Level ${state.level} · Get Ready`, 'Rules may switch mid-level', () => nextTrial(false));
  }

  function nextTrial(switched = false) {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('trial');
    state.trialIndex++;

    const stimulus = generateStimulus();
    let rule, didSwitch = false;

    if (!state.previousRule) {
      rule = pickOne(rulesForStimulus(stimulus));
    } else {
      const shouldSwitch = Math.random() < switchChanceForLevel(state.level);
      if (shouldSwitch && state.previousRule.dimension !== stimulus.type) {
        rule = pickOne(rulesForStimulus(stimulus));
        didSwitch = true;
      } else if (shouldSwitch) {
        const sameDim = rulesForStimulus(stimulus).filter(r => r.id !== state.previousRule.id);
        rule = sameDim.length ? pickOne(sameDim) : state.previousRule;
        didSwitch = rule.id !== state.previousRule.id;
      } else if (state.previousRule.dimension === stimulus.type) {
        rule = state.previousRule;
      } else {
        rule = pickOne(rulesForStimulus(stimulus));
        didSwitch = true;
      }
    }

    state.previousRule = rule;

    const timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    state.currentTrial = {
      stimulus, rule, didSwitch,
      startTime: 0, timeLimit, answered: false
    };

    const dimClass = stimulus.type === 'number' ? 'number-rule' : 'letter-rule';
    const stimClass = stimulus.type === 'number' ? 'number' : 'letter';

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="rule-banner ${dimClass} ${didSwitch ? 'switched' : ''}">
        <span class="rule-icon">⚡</span>
        <span>${rule.prompt}</span>
      </div>

      <div class="stimulus-wrap">
        <div class="stimulus-char ${stimClass}">${stimulus.display}</div>
      </div>

      <div class="options-grid">
        <button class="option-btn" data-side="left" data-key="1">${rule.options[0]}</button>
        <button class="option-btn" data-side="right" data-key="2">${rule.options[1]}</button>
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    state.currentTrial.startTime = performance.now();
    startTimer(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal';
      if (pct < 50) lvl = 'warning';
      if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);
      if (remaining <= 0) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        handleTimeout();
      }
    }, 40);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosen = btn.dataset.side;
    const correctSide = state.currentTrial.rule.classify(state.currentTrial.stimulus);
    const elapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosen === correctSide;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    if (state.currentTrial.didSwitch) {
      state.switchTotal++;
      if (isCorrect) { state.switchCorrect++; if (isValid) state.switchRTs.push(elapsed); }
    } else {
      state.repeatTotal++;
      if (isCorrect) { state.repeatCorrect++; if (isValid) state.repeatRTs.push(elapsed); }
    }

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentTrial.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');
      state.timeoutIds.push(setTimeout(() => nextTrial(), 380));
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) state.timeoutIds.push(setTimeout(() => completeGame(), 900));
      else state.timeoutIds.push(setTimeout(() => nextTrial(), 900));
    }

    state.sessionTrialsCompleted++;
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial) return;
    state.currentTrial.answered = true;
    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    const correctSide = state.currentTrial.rule.classify(state.currentTrial.stimulus);
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correctSide) b.classList.add('correct');
    });

    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) state.timeoutIds.push(setTimeout(() => completeGame(), 900));
    else state.timeoutIds.push(setTimeout(() => nextTrial(), 900));

    state.sessionTrialsCompleted++;
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

    // Fatigue check
    if (state.sessionTrialsCompleted > 0 && state.sessionTrialsCompleted % CONFIG.fatigueAfterTrials === 0 && !state.breakOffered) {
      state.breakOffered = true;
      offerBreak();
      return;
    }

    if (accuracy >= 0.7) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct
          · Avg: ${state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0} ms
        </p>
      `);
      state.timeoutIds.push(setTimeout(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else completeGame();
      }, 1400));
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      const s = snd(); if (s) s.gameOver();
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct — need 70% to pass.
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
        </p>
      `);
      state.timeoutIds.push(setTimeout(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1800));
    }
  }

  function offerBreak() {
    const s = snd(); if (s) s.breakChime();
    setPhase('correct');
    render(`
      <div class="feedback-icon good">☕</div>
      <h2 class="phase-headline grd">Time for a Break</h2>
      <p class="phase-sub">
        You've completed <strong>${state.sessionTrialsCompleted}</strong> trials.
        <br>Research shows switching performance drops after this point.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
        <button class="big-btn" id="break-continue">Continue</button>
        <button class="big-btn" id="break-end" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">End Session</button>
      </div>
    `);
    $('break-continue').addEventListener('click', (e) => {
      e.stopPropagation();
      const s2 = snd(); if (s2) s2.click();
      state.breakOffered = false;
      state.timeoutIds.push(setTimeout(() => nextTrial(), 100));
    });
    $('break-end').addEventListener('click', (e) => {
      e.stopPropagation();
      const s2 = snd(); if (s2) s2.click();
      endLevel();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     COMPLETE GAME
     ═══════════════════════════════════════════════════════════ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const medianRT = H.median(state.allRTs);
    const rtv = H.stdDev(state.allRTs);
    const rcs = H.rcs(totalCorrect, state.allRTs);
    const switchCost = computeSwitchCost();
    const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const switchAvg = avg(state.switchRTs);
    const repeatAvg = avg(state.repeatRTs);

    // PB check
    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs,
      switchCost, rtv
    };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    // Badges
    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy });
    if (newBadges.length && S) S.badge();
    const modeBadges = H.getModeBadges('classic');
    const badgeHTML = modeBadges.length ? `
      <div class="badges-row">
        ${modeBadges.map(b => `<span class="badge-icon ${b.unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">${b.icon}</span>`).join('')}
      </div>` : '';

    H.addToHistory(sessionPayload);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(sessionPayload);

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : '';

    let interpretation = '';
    if (switchCost !== null) {
      if (switchCost < 80) interpretation = 'Exceptional cognitive flexibility';
      else if (switchCost < 160) interpretation = 'Strong mental set shifting';
      else if (switchCost < 280) interpretation = 'Average — normal switch cost';
      else interpretation = 'High switch cost — practice reconfiguration';
    }

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    const switchHTML = switchCost !== null
      ? `<div class="switch-box">
           <strong>Switch Cost:</strong> ${switchCost >= 0 ? '+' : ''}${switchCost} ms
           <br>
           <span style="color:var(--t2);font-size:11px">Repeat: ${repeatAvg}ms · Switch: ${switchAvg}ms</span>
           <br>
           <span style="color:var(--cyan)">${interpretation}</span>
         </div>`
      : '';

    if (S) S.victory();

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
      </div>

      ${switchHTML}
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

    // Stages check
    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, medianRT, switchCost
      });
    }
   // postMessage to dashboard
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({
        type: 'flash:game-complete', gameId: 'task-switching', domain: 'attention',
        mode: 'classic', maxLevel, accuracy, score: state.totalScore,
        medianRT, rtv, rcs, switchCost, isNewPB: hasNewPB
      }, '*'); } catch (e) {}
    }
    emitComplete({
      gameId: 'task-switching', domain: 'attention', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, switchCost,
      switchAvgRT: switchAvg, repeatAvgRT: repeatAvg,
      isNewPB: hasNewPB
    });
  }

  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
    }
  }

  /* ═══ RESET ═══ */
  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentTrial = null;
    state.previousRule = null;
    state.trialIndex = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.switchRTs = []; state.repeatRTs = [];
    state.switchCorrect = 0; state.switchTotal = 0;
    state.repeatCorrect = 0; state.repeatTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[TaskSwitching] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>
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
    loadSettings();
    wireSettings();
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
        return;
      }
      if (state.phase === 'trial') {
        if (e.key === '1') {
          e.preventDefault();
          const btn = elContent.querySelector('.option-btn[data-side="left"]');
          if (btn && !btn.disabled) btn.click();
        }
        if (e.key === '2') {
          e.preventDefault();
          const btn = elContent.querySelector('.option-btn[data-side="right"]');
          if (btn && !btn.disabled) btn.click();
        }
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
    loadSettings();
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══════════════════════════════════════════════════════════
     EXPOSE API for extra modes
     ═══════════════════════════════════════════════════════════ */
  window.TSAPI = {
    CONFIG,
    state,
    settings: () => state.settings,

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    haptic,
    showCountdown,
    showLevelUpFlash,

    generateStimulus,
    rulesForStimulus,
    NUMBER_RULES,
    LETTER_RULES,

    clearAllTimeouts,

    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $,
    getElContent: () => elContent
  };

  window.TaskSwitchingGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();