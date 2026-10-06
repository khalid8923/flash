/* ═══════════════════════════════════════════════════════════
   FLASH — Gear Logic v1.0
   Hegarty (2004) · Mechanical Reasoning · Gear Chains
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: SVG gear rendering · Parity reasoning · Settings ·
             i18n · Stages · postMessage · Back button
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.GearLogicHelpers;
  const S = window.GearLogicSounds;
  const STAGES = window.GearLogicStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[GearLogic] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('gear-logic', STAGES, {
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
    trialsPerLevel: 5,
    baseTime: 15000,
    minTime: 7000,
    timeStepPerLevel: 500,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000
  };

  /* ═══ GEAR COLORS ═══ */
  const GEAR_COLORS = ['#0FD9B4', '#00EEFF', '#9D4EDD', '#FFD60A', '#FF9F1C', '#FF4D6D', '#3A86FF'];

  /* ═══ SVG GEAR RENDERER ═══ */
  function gearPath(cx, cy, rOuter, rInner, teeth) {
    const steps = teeth * 4;
    let d = '';
    for (let i = 0; i < steps; i++) {
      const phase = i % 4;
      const angle = (i / steps) * Math.PI * 2;
      const radius = (phase === 0 || phase === 3) ? rOuter : rInner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    d += 'Z';
    return d;
  }

  function renderGearSVG(cx, cy, radius, teeth, color, opts) {
    opts = opts || {};
    const rOuter = radius;
    const rInner = radius * 0.78;
    const rHub = radius * 0.25;
    const rInnerHole = radius * 0.15;

    let parts = '';

    // Gear body
    parts += `<path d="${gearPath(cx, cy, rOuter, rInner, teeth)}" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="1.2" stroke-linejoin="round"/>`;

    // Hub circle
    parts += `<circle cx="${cx}" cy="${cy}" r="${rHub}" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.2)" stroke-width="1"/>`;

    // Inner hole
    parts += `<circle cx="${cx}" cy="${cy}" r="${rInnerHole}" fill="#04040A" stroke="rgba(0,0,0,.6)" stroke-width="1"/>`;

    // Rotation arrow indicator if specified
    if (opts.direction) {
      const arrowR = radius * 0.55;
      const arrowLen = radius * 0.35;
      const sign = opts.direction === 'cw' ? 1 : -1;
      const startA = -Math.PI * 0.5;
      const endA = startA + sign * 1.2;
      const x1 = cx + Math.cos(startA) * arrowR;
      const y1 = cy + Math.sin(startA) * arrowR;
      const x2 = cx + Math.cos(endA) * arrowR;
      const y2 = cy + Math.sin(endA) * arrowR;
      parts += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${arrowR.toFixed(1)} ${arrowR.toFixed(1)} 0 0 ${sign > 0 ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#fff" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/>`;
    }

    // "?" symbol on last gear
    if (opts.showQuestion) {
      parts += `<text x="${cx}" y="${cy + radius * 0.15}" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="${(radius * 0.9).toFixed(1)}" font-weight="700" fill="#fff" opacity="0.95">?</text>`;
    }

    return parts;
  }

  /* ═══ PUZZLE GENERATION ═══ */
  function gearsForLevel(level) {
    if (level <= 2) return 3;
    if (level <= 4) return 4;
    if (level <= 7) return 5;
    if (level <= 10) return 6;
    if (level <= 13) return 7;
    return 8;
  }

  function generateGearChain(level) {
    const count = gearsForLevel(level);

    // Radii: uniform (L1-3), alternating (L4-6), random (L7+)
    const radii = [];
    for (let i = 0; i < count; i++) {
      if (level <= 3) {
        radii.push(38);
      } else if (level <= 6) {
        radii.push(i % 2 === 0 ? 40 : 32);
      } else {
        radii.push(28 + Math.random() * 20);
      }
    }

    // Positions: chain of gears, each meshes with previous
    const width = 780;
    const height = 280;
    const positions = [];

    // First gear position
    const totalWidth = radii.reduce((sum, r) => sum + r, 0) * 2;
    const scale = Math.min(1, (width - 60) / totalWidth);
    const scaledRadii = radii.map(r => r * scale);

    let cursorX = (width - (scaledRadii.reduce((s, r) => s + r * 2, 0) * 0.9)) / 2;
    cursorX = Math.max(50, cursorX);

    for (let i = 0; i < count; i++) {
      const r = scaledRadii[i];
      let cx, cy;

      if (i === 0) {
        cx = cursorX + r;
        cy = height / 2;
      } else {
        const prevR = scaledRadii[i - 1];
        const prevCx = positions[i - 1].cx;
        const prevCy = positions[i - 1].cy;
        const mesh = prevR + r - 6;

        // Alternate up/down for variety
        const angle = (i % 3 === 0) ? -0.35 : (i % 3 === 1) ? 0.35 : 0;
        const dx = mesh * Math.cos(angle);
        const dy = mesh * Math.sin(angle);
        cx = prevCx + dx;
        cy = prevCy + dy;
      }

      // Clamp inside stage
      cx = Math.max(r + 10, Math.min(width - r - 10, cx));
      cy = Math.max(r + 30, Math.min(height - r - 10, cy));

      positions.push({ cx, cy, r });
    }

    // Assign colors and teeth
    const gears = positions.map((p, i) => ({
      cx: p.cx,
      cy: p.cy,
      radius: p.r,
      teeth: Math.round(p.r / 3.5),
      color: GEAR_COLORS[i % GEAR_COLORS.length],
      direction: i % 2 === 0 ? 'cw' : 'ccw'
    }));

    return { gears, width, height };
  }

  function renderGearChainSVG(puzzle) {
    const { gears, width, height } = puzzle;
    let svgParts = '';

    gears.forEach((g, i) => {
      const isFirst = i === 0;
      const isLast = i === gears.length - 1;
      svgParts += renderGearSVG(g.cx, g.cy, g.radius, g.teeth, g.color, {
        direction: isFirst ? 'cw' : null,
        showQuestion: isLast
      });
    });

    // "CW" label above first gear
    if (gears.length > 0) {
      const first = gears[0];
      svgParts += `<text x="${first.cx}" y="${(first.cy - first.radius - 12).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#00FF96" letter-spacing="2">CW →</text>`;
    }

    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${svgParts}</svg>`;
  }

  /* ═══ PUZZLE BUILDER ═══ */
  function generatePuzzle(level) {
    const { gears, width, height } = generateGearChain(level);

    // Parity: gear[i] = cw if i even, ccw if i odd
    const lastIdx = gears.length - 1;
    const lastDirection = lastIdx % 2 === 0 ? 'cw' : 'ccw';
    const correctIdx = lastDirection === 'cw' ? 0 : 1;

    const chain = gears.map((g, i) => {
      if (i === 0) return 'CW';
      return i % 2 === 0 ? 'CW' : 'CCW';
    }).join(' → ');

    return {
      gears,
      width,
      height,
      direction: lastDirection,
      correctIdx,
      count: gears.length,
      explanation: `Each meshing gear reverses direction: ${chain}. The last gear (${gears.length}) turns ${lastDirection === 'cw' ? 'clockwise' : 'counter-clockwise'}.`
    };
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentPuzzle: null,
    trialIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    parityCorrect: 0,
    parityTotal: 0,
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
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

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
  function showExplanation(puzzle) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">Why</div><div class="explanation-text">${puzzle.explanation}</div>`;
    elContent.appendChild(ex);
  }
  function renderTrial(puzzle) {
    return `
      <div class="gear-stage">
        ${renderGearChainSVG(puzzle)}
      </div>
      <p class="phase-hint" style="margin-bottom:14px;">Which way does the last gear turn?</p>
      <div class="answer-row">
        <button class="answer-btn cw-btn" data-index="0" data-key="1">
          <span class="ab-icon">↻</span>
          CLOCKWISE
        </button>
        <button class="answer-btn ccw-btn" data-index="1" data-key="2">
          <span class="ab-icon">↺</span>
          COUNTER-CW
        </button>
      </div>
    `;
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
    const pbPar = pb.bestParityAccuracy > 0 ? pb.bestParityAccuracy + '%' : '—';

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
      <div class="phase-title">Problem Solving · Mechanical Reasoning</div>
      <h1 class="phase-headline grd">Gear Logic</h1>
      <p class="phase-sub">
        A chain of meshed gears. The first turns <strong style="color:#00FF96">clockwise</strong>.
        <br>Which way does the <strong style="color:#00EEFF">last gear</strong> turn?
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">PARITY RATE</div><div class="stat-value" style="font-size:16px">${pbPar}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">⚙️</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 5 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.GearLogicExtraModes ? window.GearLogicExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>1</kbd> CW · <kbd>2</kbd> CCW · <kbd>Space</kbd> to start classic
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

    if (window.GearLogicExtraModes && window.GLAPI) {
      window.GearLogicExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.GearLogicExtraModes.start(m.id, window.GLAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.parityCorrect = 0;
    state.parityTotal = 0;

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
    showCountdown(3, 'Level ' + state.level, 'Track direction through the chain', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('trial');
    state.trialIndex++;

    const timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    const puzzle = generatePuzzle(state.level);
    state.currentPuzzle = {
      ...puzzle,
      startTime: 0,
      timeLimit,
      answered: false
    };

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Puzzle <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level} · ${puzzle.count} gears</span>
      </div>
      ${renderTrial(puzzle)}
    `);

    elContent.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    state.currentPuzzle.startTime = performance.now();
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
    }, 60);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentPuzzle || state.currentPuzzle.answered) return;
    state.currentPuzzle.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenIdx = parseInt(btn.dataset.index, 10);
    const correctIdx = state.currentPuzzle.correctIdx;
    const elapsed = performance.now() - state.currentPuzzle.startTime;
    const isCorrect = chosenIdx === correctIdx;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    state.parityTotal++;
    if (isCorrect) state.parityCorrect++;

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showExplanation(state.currentPuzzle);
    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentPuzzle.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');
      push(() => nextTrial(), 1800);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2400);
      else push(() => nextTrial(), 2400);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentPuzzle || state.currentPuzzle.answered) return;
    state.currentPuzzle.answered = true;
    state.levelTotal++;
    state.levelTotalTime += state.currentPuzzle.timeLimit;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === state.currentPuzzle.correctIdx) b.classList.add('correct');
    });

    showExplanation(state.currentPuzzle);
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 2200);
    else push(() => nextTrial(), 2200);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.6
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct</p>
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
          ${state.levelCorrect}/${state.levelTotal} correct — need 60% to pass.
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
    const parityAcc = state.parityTotal > 0
      ? Math.round((state.parityCorrect / state.parityTotal) * 100)
      : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      parityAccuracy: parityAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional mechanical reasoning (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong parity reasoning ability';
    else if (accuracy >= 50) interpretation = 'Average — normal range';
    else interpretation = 'Mechanical reasoning needs practice';

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
        <div class="stat-card"><div class="stat-label">PARITY RATE</div><div class="stat-value">${parityAcc}%</div></div>
      </div>

      <div class="pbm-box">
        <strong>Mechanical Reasoning Profile</strong>
        <br>
        Parity accuracy: <strong>${parityAcc}%</strong> correct
        <br>
        <span style="color:var(--cyan)">${interpretation}</span>
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
        parityAccuracy: parityAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'gear-logic', domain: 'problem', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      parityAccuracy: parityAcc,
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
    state.currentPuzzle = null;
    state.trialIndex = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.parityCorrect = 0;
    state.parityTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[GearLogic] Container not found'); return; }

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

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle' && state.mode === 'idle') { startClassic(); return; }
        if (state.phase === 'gameover') { resetGame(); return; }
        return;
      }

      if (state.phase === 'trial') {
        if (e.key === '1') {
          e.preventDefault();
          const btn = elContent.querySelector('.cw-btn');
          if (btn && !btn.disabled) btn.click();
        }
        if (e.key === '2') {
          e.preventDefault();
          const btn = elContent.querySelector('.ccw-btn');
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
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══ EXPOSE API for extra modes ═══ */
  window.GLAPI = {
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

    renderGearChainSVG,
    renderGearSVG,
    generatePuzzle,
    generateGearChain,
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

  window.GearLogicGame = {
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