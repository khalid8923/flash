/* ═══════════════════════════════════════════════════════════
   FLASH — Vigilance v1.0
   Rosvold (1956) · CPT-X · Sustained Attention
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Letter stream · SPACE key response · Block
             analysis · d' (Signal Detection Theory) ·
             Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.VigilanceHelpers;
  const S = window.VigilanceSounds;
  const STAGES = window.VigilanceStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[Vigilance] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('vigilance', STAGES, {
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
    trialsPerLevel: 45,
    blocksPerLevel: 3,
    baseStimDuration: 900,
    minStimDuration: 450,
    baseISI: 1100,
    minISI: 700,
    correctBase: 50,
    streakBonus: 15,
    correctRejectionBonus: 20,
    falseAlarmPenalty: 60,
    missPenalty: 40,
    rtMin: 150,
    rtMax: 5000
  };

  const LETTERS = ['A','B','C','D','E','F','H','J','K','L','M','N','P','R','S','T','U','V','W','Y'];

  /* ═══ TARGETS BY LEVEL ═══ */
  function targetsForLevel(level) {
    if (level <= 3) return ['X'];
    if (level <= 6) return ['X', 'O'];
    if (level <= 9) return ['X', 'O', 'Q'];
    if (level <= 12) return ['X', 'O', 'Q', 'V'];
    return ['X', 'O', 'Q', 'V', 'Z'];
  }

  function stimDurationForLevel(level) {
    return Math.max(
      CONFIG.minStimDuration,
      CONFIG.baseStimDuration - (level - 1) * 30
    );
  }

  function isiForLevel(level) {
    return Math.max(
      CONFIG.minISI,
      CONFIG.baseISI - (level - 1) * 25
    );
  }

  /* ═══ SEQUENCE GENERATOR ═══ */
  function generateSequence(totalTrials, targets, targetRate) {
    const seq = [];
    let lastWasTarget = false;
    let consecutiveDistractors = 0;

    for (let i = 0; i < totalTrials; i++) {
      // Prevent consecutive targets
      const canBeTarget = !lastWasTarget && consecutiveDistractors >= 1;
      const makeTarget = canBeTarget && Math.random() < targetRate;

      if (makeTarget) {
        seq.push({
          letter: targets[Math.floor(Math.random() * targets.length)],
          isTarget: true
        });
        lastWasTarget = true;
        consecutiveDistractors = 0;
      } else {
        const pool = LETTERS.filter(l => !targets.includes(l));
        seq.push({
          letter: pool[Math.floor(Math.random() * pool.length)],
          isTarget: false
        });
        lastWasTarget = false;
        consecutiveDistractors++;
      }
    }
    return seq;
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    sequence: [],
    trialIdx: 0,
    currentLetter: null,
    answered: false,
    stimStartTime: 0,
    currentBlock: 1,
    blockSize: 0,
    // Per-session counters
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    hitRTs: [],
    // Per-block RT tracking (for vigilance decrement)
    block1RTs: [],
    block3RTs: [],
    block2RTs: [],
    // Level stats
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    // Cumulative
    results: [],
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    timeoutIds: [],
    stimTimeoutId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.stimTimeoutId) { clearTimeout(state.stimTimeoutId); state.stimTimeoutId = null; }
  }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  /* ═══ SETTINGS ═══ */
  function wireSettings() {
    const btn = $('settings-btn');
    if (btn && FS) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = snd(); if (s) s.click();
        FS.openPanel();
      });
    }
    if (FS) {
      FS.applyToDOM();
      FS.onChange('reducedMotion', () => FS.applyToDOM());
      FS.onChange('highContrast', () => FS.applyToDOM());
      FS.onChange('soundEnabled', (v) => { if (S) S.setEnabled(v); });
    }
  }
  function haptic(type) {
    if (FS && FS.get('haptics') === false) return;
    if (!('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }
  function snd() {
    if (!S) return null;
    if (FS && FS.get('soundEnabled') === false) return null;
    return S;
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
  function setTimer(pct, level) {
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
      dots += '<span class="p-dot ' + cls + '"></span>';
    }
    return '<div class="progress-dots">' + dots + '</div>';
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = 'feedback-flash ' + (hit ? 'hit' : 'miss');
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 450);
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
        render('<div class="phase-title">' + title + '</div><div class="countdown-num">' + c + '</div><p class="phase-sub" style="margin-top:16px;">' + subtitle + '</p>');
        c--; push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }

  /* ═══ TRIAL RENDERING ═══ */
  function renderTrialUI(letter, isTarget, armed) {
    return `
      ${renderProgressDots()}
      <div class="block-info">
        <span class="bi">TRIAL <span class="bi-val">${state.trialIdx}/${CONFIG.trialsPerLevel}</span></span>
        <span class="bi">BLOCK <span class="bi-val">${state.currentBlock}/3</span></span>
        <span class="bi">HITS <span class="bi-val good">${state.hits}</span></span>
        <span class="bi">MISS <span class="bi-val bad">${state.misses}</span></span>
        <span class="bi">FA <span class="bi-val warn">${state.falseAlarms}</span></span>
      </div>
      <div class="letter-stage">
        <div class="letter-display ${isTarget ? 'target' : ''}">${letter}</div>
      </div>
      <div class="response-row">
        <button class="response-btn ${armed ? 'armed' : ''}" id="response-btn" ${armed ? '' : 'disabled'}>
          <span class="rb-icon">🎯</span>
          PRESS FOR TARGET
        </button>
      </div>
    `;
  }

  function renderBlankUI() {
    return `
      ${renderProgressDots()}
      <div class="block-info">
        <span class="bi">TRIAL <span class="bi-val">${state.trialIdx}/${CONFIG.trialsPerLevel}</span></span>
        <span class="bi">BLOCK <span class="bi-val">${state.currentBlock}/3</span></span>
      </div>
      <div class="letter-stage">
        <div class="letter-display idle-symbol">•</div>
      </div>
      <div class="response-row">
        <button class="response-btn" id="response-btn" disabled>
          <span class="rb-icon">🎯</span>
          PRESS FOR TARGET
        </button>
      </div>
    `;
  }

  function wireResponseButton() {
    const btn = $('response-btn');
    if (btn && !btn.disabled) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleResponse();
      });
    }
  }

  /* ═══ IDLE SCREEN ═══ */
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
    const pbRT  = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbDP  = pb.bestDPrime > 0 ? pb.bestDPrime : '—';

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
      <div class="phase-title">Attention Domain · Sustained Focus</div>
      <h1 class="phase-headline grd">Vigilance</h1>
      <p class="phase-sub">
        Letters appear one at a time.
        Press <strong style="color:#00FF96">SPACE</strong> or click
        when you see a <strong style="color:#00FF96">target letter</strong>.
        <br>Ignore everything else.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RT</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST d'</div><div class="stat-value" style="font-size:16px">${pbDP}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎯</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 45 trials · 3 blocks · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.VigilanceExtraModes ? window.VigilanceExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
            ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${T.t('mode_' + m.id) || m.name}</div>
            <div class="mode-desc">${m.id === 'daily' && daily ? 'Completed today' : m.desc}</div>
            <div class="mode-meta">${m.id === 'daily' && daily ? '→ Come back tomorrow' : m.meta}</div>
          </div>
        `).join('')}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>SPACE</kbd> to respond · <kbd>Space</kbd> in idle starts classic
      </p>
    `);

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    if (window.VigilanceExtraModes && window.VigilanceAPI) {
      window.VigilanceExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.VigilanceExtraModes.start(m.id, window.VigilanceAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.hitRTs = [];
    state.block1RTs = [];
    state.block2RTs = [];
    state.block3RTs = [];

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
    state.trialIdx = 0;
    state.currentBlock = 1;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.hitRTs = [];
    state.block1RTs = [];
    state.block2RTs = [];
    state.block3RTs = [];

    const targets = targetsForLevel(state.level);
    const targetRate = 0.17;

    state.sequence = generateSequence(CONFIG.trialsPerLevel, targets, targetRate);
    state.blockSize = Math.floor(CONFIG.trialsPerLevel / CONFIG.blocksPerLevel);

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(
      3,
      'Level ' + state.level,
      'Targets: ' + targets.join(' · '),
      nextTrial
    );
  }

  function nextTrial() {
    if (state.trialIdx >= CONFIG.trialsPerLevel) { endLevel(); return; }

    if (state.lives <= 0) { completeGame(); return; }

    // Update block
    state.currentBlock = Math.min(
      CONFIG.blocksPerLevel,
      Math.floor(state.trialIdx / state.blockSize) + 1
    );

    state.trialIdx++;
    const trial = state.sequence[state.trialIdx - 1];
    state.currentLetter = trial;
    state.answered = false;

    const isi = isiForLevel(state.level);
    const stimDur = stimDurationForLevel(state.level);

    // Show blank ISI
    setPhase('trial');
    render(renderBlankUI());

    push(() => {
      // Show letter
      setPhase('stimulus');
      state.stimStartTime = performance.now();
      render(renderTrialUI(trial.letter, trial.isTarget, true));
      wireResponseButton();

      // Hide after stimDur
      state.stimTimeoutId = setTimeout(() => {
        state.stimTimeoutId = null;
        if (state.answered) return;
        evaluateNoResponse();
      }, stimDur);
    }, isi);
  }

  function evaluateNoResponse() {
    if (state.answered) return;
    state.answered = true;

    const isTarget = state.currentLetter.isTarget;

    if (isTarget) {
      // Miss
      state.misses++;
      state.levelTotal++;
      state.streak = 0;
      elStreak.textContent = '0';
      showFeedbackFlash(false);
      haptic('wrong');
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      push(() => {
        if (state.lives <= 0) completeGame();
        else nextTrial();
      }, 700);
    } else {
      // Correct rejection
      state.correctRejections++;
      state.levelTotal++;
      state.levelCorrect++;
      state.totalScore += CONFIG.correctRejectionBonus;
      push(nextTrial, 300);
    }
  }

  function handleResponse() {
    if (state.phase !== 'stimulus') return;
    if (state.answered) return;
    if (!state.currentLetter) return;
    state.answered = true;

    if (state.stimTimeoutId) { clearTimeout(state.stimTimeoutId); state.stimTimeoutId = null; }

    const rt = performance.now() - state.stimStartTime;
    const isTarget = state.currentLetter.isTarget;
    const isValid = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;

    if (isTarget) {
      // Hit
      state.hits++;
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      elStreak.textContent = String(state.streak);

      const rtToPush = isValid ? rt : null;
      if (rtToPush !== null) {
        state.hitRTs.push(rtToPush);
        state.allRTs.push(rtToPush);
        // Block tracking
        if (state.currentBlock === 1) state.block1RTs.push(rtToPush);
        else if (state.currentBlock === 2) state.block2RTs.push(rtToPush);
        else state.block3RTs.push(rtToPush);
      }

      state.levelTotalTime += rt;
      state.totalScore += CONFIG.correctBase + (state.streak - 1) * CONFIG.streakBonus;
      showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 400);
    } else {
      // False alarm
      state.falseAlarms++;
      state.streak = 0;
      elStreak.textContent = '0';
      state.totalScore = Math.max(0, state.totalScore - CONFIG.falseAlarmPenalty);
      showFeedbackFlash(false);
      haptic('wrong');
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      push(() => {
        if (state.lives <= 0) completeGame();
        else nextTrial();
      }, 700);
    }
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.7
    });

    if (accuracy >= 0.7) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct
          · ${state.hits} hits · ${state.falseAlarms} FA
        </p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);
      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else completeGame();
      }, 1500);
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
      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1800);
    }
  }

  /* ═══ COMPLETE GAME ═══ */
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
    const dPrime = H.dPrime(state.hits, state.misses, state.falseAlarms, state.correctRejections);

    // Vigilance decrement: block3 RT - block1 RT
    let vigilanceDecrement = null;
    if (state.block1RTs.length >= 2 && state.block3RTs.length >= 2) {
      vigilanceDecrement = H.median(state.block3RTs) - H.median(state.block1RTs);
    }

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      dPrime, vigilanceDecrement
    };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

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
    if (dPrime >= 3) interpretation = 'Exceptional signal detection — elite vigilance.';
    else if (dPrime >= 2) interpretation = 'Strong sustained attention.';
    else if (dPrime >= 1) interpretation = 'Average — normal range.';
    else interpretation = 'Sustained attention needs practice.';

    let decrementMsg = '';
    if (vigilanceDecrement !== null) {
      if (vigilanceDecrement > 150) decrementMsg = '<span style="color:#FF0077">Attention faded significantly over the session.</span>';
      else if (vigilanceDecrement < 30) decrementMsg = '<span style="color:#00FF96">Sustained attention maintained — minimal decrement.</span>';
      else decrementMsg = '<span style="color:#FFD60A">Moderate vigilance decrement detected.</span>';
    }

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
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
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="att-box">
        <strong>Sustained Attention Profile (CPT-X)</strong>
        <br>
        Hits: <strong>${state.hits}</strong> · Misses: <strong>${state.misses}</strong>
        · False Alarms: <strong>${state.falseAlarms}</strong>
        <br>
        ${interpretation}
        ${decrementMsg ? '<br>' + decrementMsg : ''}
      </div>

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

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, medianRT,
        dPrime, vigilanceDecrement, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'vigilance', domain: 'attention', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, dPrime, vigilanceDecrement,
      hits: state.hits, misses: state.misses, falseAlarms: state.falseAlarms,
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
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.sequence = [];
    state.trialIdx = 0;
    state.currentLetter = null;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.hitRTs = [];
    state.block1RTs = [];
    state.block2RTs = [];
    state.block3RTs = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[Vigilance] Container not found'); return; }

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

      if (e.code === 'Space') {
        e.preventDefault();

        if (state.phase === 'idle' && state.mode === 'idle') {
          startClassic();
          return;
        }
        if (state.phase === 'gameover') {
          resetGame();
          return;
        }
        if (state.phase === 'stimulus') {
          handleResponse();
          return;
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'stimulus' || state.phase === 'countdown') {
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
    wireBackButton();
    showIdle();
  }

  /* ═══ EXPOSE API for extra modes ═══ */
  window.VigilanceAPI = {
    CONFIG,
    state,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateSequence,
    targetsForLevel,
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

  window.VigilanceGame = {
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