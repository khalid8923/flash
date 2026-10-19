/* ═══════════════════════════════════════════════════════════
   FLASH — Symbol Sprint v1.0
   Speed Domain · Treisman & Gelade (1980) Visual Search
   Feature Search (parallel) vs Conjunction Search (serial)
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.SymbolSprintHelpers;
  const S = window.SymbolSprintSounds;
  const STAGES = window.SymbolSprintStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[SymbolSprint] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('symbol-sprint', STAGES, {
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
    trialsPerLevel: 8,
    baseTime: 5000,
    timeStepPerLevel: 250,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 30000,
    passThreshold: 0.7
  };

  /* ═══════════════════════════════════════════════════════════
     SYMBOLS & COLORS
     ═══════════════════════════════════════════════════════════ */
  const SYMBOLS = ['●', '▲', '■', '◆', '★', '✚', '▼', '❖'];
  const COLORS = [
    '#00EEFF', // cyan
    '#FF0077', // pink
    '#00FF96', // green
    '#FFD60A', // yellow
    '#9D4EDD', // purple
    '#FF6B35'  // orange
  ];

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
    allRTs: [],
    invalidRTs: 0,
    featureRTs: [],
    conjunctionRTs: [],
    featureTotal: 0,
    conjunctionTotal: 0,
    rtBySize: {},
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

  function gridSizeForLevel(level) {
    if (level <= 3) return 4;
    if (level <= 6) return 5;
    if (level <= 9) return 6;
    return 7;
  }

  function responseTimeForLevel(level) {
    return CONFIG.baseTime + (level - 1) * CONFIG.timeStepPerLevel;
  }

  /* ═══════════════════════════════════════════════════════════
     TRIAL GENERATOR — Treisman & Gelade paradigm
     ═══════════════════════════════════════════════════════════ */
  function generateTrial(level) {
    const gridSize = gridSizeForLevel(level);
    const totalCells = gridSize * gridSize;
    const targetIdx = randInt(0, totalCells - 1);

    // Feature search at low levels (parallel pop-out), conjunction at high
    // Level 1-4: mostly feature. Level 5+: mix. Level 10+: mostly conjunction.
    let searchType;
    const r = Math.random();
    if (level <= 4) {
      searchType = r < 0.75 ? 'feature' : 'conjunction';
    } else if (level <= 9) {
      searchType = r < 0.5 ? 'feature' : 'conjunction';
    } else {
      searchType = r < 0.3 ? 'feature' : 'conjunction';
    }

    let cells = [];
    let targetSymbol, targetColor;

    if (searchType === 'feature') {
      /* ═══ FEATURE SEARCH ═══
         All distractors identical. Target differs in ONE feature
         (either color OR shape). Produces pop-out — RT independent
         of distractor count.
      */
      const baseSymbol = pickOne(SYMBOLS);
      const baseColor = pickOne(COLORS);
      targetSymbol = baseSymbol;
      targetColor = baseColor;

      const differInColor = Math.random() < 0.5;
      if (differInColor) {
        let otherColor;
        do { otherColor = pickOne(COLORS); } while (otherColor === baseColor);
        targetColor = otherColor;
      } else {
        let otherSymbol;
        do { otherSymbol = pickOne(SYMBOLS); } while (otherSymbol === baseSymbol);
        targetSymbol = otherSymbol;
      }

      for (let i = 0; i < totalCells; i++) {
        if (i === targetIdx) {
          cells.push({ symbol: targetSymbol, color: targetColor });
        } else {
          cells.push({ symbol: baseSymbol, color: baseColor });
        }
      }
    } else {
      /* ═══ CONJUNCTION SEARCH ═══
         Distractors use 2 combos (sym1+col1, sym2+col2).
         Target uses a UNIQUE combo (sym1+col2).
         Produces serial search — RT increases with distractor count.
      */
      let sym1, sym2, col1, col2;
      do { sym1 = pickOne(SYMBOLS); sym2 = pickOne(SYMBOLS); } while (sym1 === sym2);
      do { col1 = pickOne(COLORS); col2 = pickOne(COLORS); } while (col1 === col2);

      targetSymbol = sym1;
      targetColor = col2;

      for (let i = 0; i < totalCells; i++) {
        if (i === targetIdx) {
          cells.push({ symbol: targetSymbol, color: targetColor });
        } else {
          if (Math.random() < 0.5) {
            cells.push({ symbol: sym1, color: col1 });
          } else {
            cells.push({ symbol: sym2, color: col2 });
          }
        }
      }
    }

    // Build grid HTML
    let gridHTML = `<div class="ss-grid-wrap" style="grid-template-columns:repeat(${gridSize},1fr);">`;
    cells.forEach((cell, i) => {
      gridHTML += `<div class="ss-cell" data-idx="${i}" style="color:${cell.color};">${cell.symbol}</div>`;
    });
    gridHTML += '</div>';

    return {
      gridSize,
      totalCells,
      distractors: totalCells - 1,
      targetIdx,
      targetSymbol,
      targetColor,
      searchType,
      gridHTML
    };
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER TRIAL
     ═══════════════════════════════════════════════════════════ */
  function renderTrial(trial, headerHTML) {
    const isRTL = T.getLang && T.getLang() === 'ar';
    const isConjunction = trial.searchType === 'conjunction';
    const typeLabel = isConjunction
      ? (isRTL ? 'ربط' : 'CONJUNCTION')
      : (isRTL ? 'ميزة' : 'FEATURE');
    const typeClass = isConjunction ? 'conjunction' : '';
    const cueLabel = isRTL ? 'ابحث عن' : 'FIND';

    return `
      ${headerHTML || ''}
      <div class="ss-target-cue">
        <span class="ss-cue-label">${cueLabel}</span>
        <span class="ss-cue-symbol" style="color:${trial.targetColor};">${trial.targetSymbol}</span>
        <span class="ss-cue-type ${typeClass}">${typeLabel}</span>
      </div>
      ${trial.gridHTML}
    `;
  }

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
      FS.onChange('highContrast',  () => FS.applyToDOM());
      FS.onChange('soundEnabled',  (v) => { if (S) S.setEnabled(v); });
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
  function setTimer(pct, level = 'normal') {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTimerFill.classList.remove('warning', 'danger');
    if (level === 'warning') elTimerFill.classList.add('warning');
    if (level === 'danger')  elTimerFill.classList.add('danger');
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
    el.className = 'feedback-flash ' + (hit ? 'hit' : 'miss');
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 450);
  }
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function showCountdown(from, title, subtitle, onDone) {
    let c = from;
    const tick = () => {
      if (c > 0) {
        const s = snd(); if (s) s.tick();
        render(`<div class="phase-title">${title}</div><div class="countdown-num">${c}</div><p class="phase-sub" style="margin-top:16px;">${subtitle}</p>`);
        c--;
        push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
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
    const pbSlope = pb.bestSearchSlope < 99999 ? pb.bestSearchSlope + ' ms' : '—';

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

    const extraModesHTML = (window.SymbolSprintExtraModes
      ? window.SymbolSprintExtraModes.getModeDefinitions() : []
    ).map(m => `
      <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
        ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
        <div class="mode-icon">${m.icon}</div>
        <div class="mode-name">${T.t('mode_' + m.id) || m.name}</div>
        <div class="mode-desc">${m.id === 'daily' && daily ? 'Completed today' : m.desc}</div>
        <div class="mode-meta">${m.id === 'daily' && daily ? '→ Come back tomorrow' : m.meta}</div>
      </div>
    `).join('');

    render(`
      <div class="phase-title">Speed Domain · Visual Search</div>
      <h1 class="phase-headline grd">Symbol Sprint</h1>
      <p class="phase-sub">
        A target symbol appears at the top.
        <br>Find it in the grid as <strong style="color:#00FF96">fast as you can</strong>.
        <br>Feature trials pop out. <strong style="color:#FFD60A">Conjunction trials</strong> are harder.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">SEARCH SLOPE</div><div class="stat-value" style="font-size:16px">${pbSlope}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔍</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 8 grids each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${extraModesHTML}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        Click the target tile · <kbd>Space</kbd> to start
      </p>
    `);

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    const classicBtn = $('mode-classic');
    if (classicBtn) {
      classicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = snd(); if (s) s.click();
        startClassic();
      });
    }

    if (window.SymbolSprintExtraModes && window.SSAPI) {
      window.SymbolSprintExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.SymbolSprintExtraModes.start(m.id, window.SSAPI, S, H);
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
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.featureRTs = [];
    state.conjunctionRTs = [];
    state.featureTotal = 0;
    state.conjunctionTotal = 0;
    state.rtBySize = {};

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

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, `Level ${state.level} · Get Ready`, 'Find the target fast', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    const trial = generateTrial(state.level);
    state.currentTrial = { ...trial, startTime: 0, answered: false, timeLimit: 0 };

    showTrial();
  }

  function showTrial() {
    const trial = state.currentTrial;
    const timeLimit = responseTimeForLevel(state.level);
    trial.timeLimit = timeLimit;

    setPhase('trial');
    const headerHTML = `
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level} · ${trial.gridSize}×${trial.gridSize}</span>
      </div>
    `;
    render(renderTrial(trial, headerHTML));

    const s = snd(); if (s && s.gridAppear) s.gridAppear();

    elContent.querySelectorAll('.ss-cell').forEach(cell => {
      cell.addEventListener('click', () => handleAnswer(cell));
    });

    trial.startTime = performance.now();
    startResponseTimer(timeLimit);
  }

  function startResponseTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        return;
      }
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

  function handleAnswer(cell) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const trial = state.currentTrial;
    const idx = parseInt(cell.dataset.idx, 10);
    const isCorrect = idx === trial.targetIdx;
    const elapsed = performance.now() - trial.startTime;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    recordTrial(trial, isCorrect, elapsed, isValid);

    // Visual feedback
    elContent.querySelectorAll('.ss-cell').forEach(c => {
      c.style.pointerEvents = 'none';
      const cidx = parseInt(c.dataset.idx, 10);
      if (cidx === trial.targetIdx) c.classList.add('ss-cell-correct');
      else if (c === cell) c.classList.add('ss-cell-wrong');
    });

    if (isCorrect) {
      const s = snd(); if (s && s.targetFound) s.targetFound();
    } else {
      const s = snd(); if (s && s.wrongCell) s.wrongCell();
    }

    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / trial.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('feedback');
      push(nextTrial, 500);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
      if (state.lives <= 0) push(completeGame, 1200);
      else push(nextTrial, 1200);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    const trial = state.currentTrial;

    recordTrial(trial, false, trial.timeLimit, false);

    elContent.querySelectorAll('.ss-cell').forEach(c => {
      c.style.pointerEvents = 'none';
      if (parseInt(c.dataset.idx, 10) === trial.targetIdx) c.classList.add('ss-cell-target-reveal');
    });

    showFeedbackFlash(false);
    const s = snd(); if (s) s.miss();
    haptic('wrong');
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);
    setPhase('feedback');
    if (state.lives <= 0) push(completeGame, 1200);
    else push(nextTrial, 1200);
  }

  function recordTrial(trial, isCorrect, rt, isValidRT) {
    state.levelTotal++;
    if (isValidRT) state.levelTotalTime += rt;
    if (isValidRT && isCorrect) state.allRTs.push(rt);

    if (trial.searchType === 'feature') {
      state.featureTotal++;
      if (isCorrect && isValidRT) state.featureRTs.push(rt);
    } else {
      state.conjunctionTotal++;
      if (isCorrect && isValidRT) state.conjunctionRTs.push(rt);
    }

    if (isCorrect && isValidRT) {
      const key = 'size' + trial.gridSize;
      if (!state.rtBySize[key]) state.rtBySize[key] = { total: 0, count: 0 };
      state.rtBySize[key].total += rt;
      state.rtBySize[key].count++;
    }
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed: accuracy >= CONFIG.passThreshold
    });

    if (accuracy >= CONFIG.passThreshold) {
      const s = snd(); if (s) s.levelUp();
      setPhase('feedback');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct · Avg: ${Math.round(state.levelTotalTime / Math.max(1, state.levelTotal))} ms</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);
      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else {
          completeGame();
        }
      }, 1400);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
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
  function computeSearchSlope() {
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
    const searchSlope = computeSearchSlope();

    const avgFeatureRT = H.median(state.featureRTs);
    const avgConjunctionRT = H.median(state.conjunctionRTs);

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      searchSlope,
      avgFeatureRT,
      avgConjunctionRT,
      maxStreak: state.maxStreak
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

    let slopeInterpretation = '';
    if (searchSlope === 0) slopeInterpretation = 'Insufficient data — play more grids.';
    else if (searchSlope < 20) slopeInterpretation = 'Flat slope — parallel pop-out search. Elite!';
    else if (searchSlope < 50) slopeInterpretation = 'Moderate slope — efficient serial search.';
    else slopeInterpretation = 'Steep slope — very serial search.';

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
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">SEARCH SLOPE</div><div class="stat-value">${searchSlope}<span style="font-size:11px;color:var(--t2)">ms</span></div></div>
      </div>

      <div class="search-box">
        <strong>Visual Search Profile</strong>
        <br>
        Search slope: <strong>${searchSlope} ms/item</strong> — ${slopeInterpretation}
        <br>
        Feature RT: <strong>${avgFeatureRT || '—'} ms</strong> · Conjunction RT: <strong>${avgConjunctionRT || '—'} ms</strong>
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
        mode: 'classic',
        maxLevel,
        accuracy,
        medianRT,
        searchSlope,
        maxStreak: state.maxStreak,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'symbol-sprint',
      domain: 'speed',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      searchSlope,
      avgFeatureRT,
      avgConjunctionRT,
      maxStreak: state.maxStreak,
      isNewPB: hasNewPB
    });
  }

  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*');
      } catch (e) {}
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
    state.currentTrial = null;
    state.trialIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.featureRTs = [];
    state.conjunctionRTs = [];
    state.featureTotal = 0;
    state.conjunctionTotal = 0;
    state.rtBySize = {};

    elLevel.textContent = '1';
    elStreak.textContent = '0';
    elLives.textContent = String(CONFIG.maxLives);

    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!root) { console.error('[SymbolSprint] Container not found'); return; }

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

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle' && state.mode === 'idle') { startClassic(); return; }
        if (state.phase === 'gameover') { resetGame(); return; }
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
    if (window.SymbolSprintExtraModes && window.SymbolSprintExtraModes.abort) {
      window.SymbolSprintExtraModes.abort();
    }
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
  window.SSAPI = {
    CONFIG,
    state,
    SYMBOLS,
    COLORS,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateTrial,
    renderTrial,
    clearAllTimeouts,

    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*');
        } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $,
    getElContent: () => elContent
  };

  window.SymbolSprintGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    generateTrial,
    renderTrial
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();