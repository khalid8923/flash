/* ═══════════════════════════════════════════════════════════
   FLASH — River Crossing v1.0
   Simon & Newell (1971) · Constraint Satisfaction
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: 4 puzzles · Danger detection · Optimal tracking ·
             Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.RiverCrossingHelpers;
  const S = window.RiverCrossingSounds;
  const STAGES = window.RiverCrossingStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[RiverCrossing] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('river-crossing', STAGES, {
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
    baseTime: 180000,
    minTime: 90000,
    timeStepPerLevel: 5000,
    correctBase: 200,
    streakBonus: 60,
    timeBonusMax: 150,
    movePenalty: 20,
    optimalBonus: 100,
    rtMin: 500,
    rtMax: 600000
  };

  /* ═══ PUZZLE DATABASE ═══ */
  const PUZZLES = {
    1: {
      id: 'wgc',
      title: 'Wolf · Goat · Cabbage',
      description: 'Classic — 3 items, farmer aboard.',
      items: [
        { id: 'wolf', name: 'Wolf', icon: '🐺' },
        { id: 'goat', name: 'Goat', icon: '🐐' },
        { id: 'cabbage', name: 'Cabbage', icon: '🥬' }
      ],
      boatCapacity: 1,
      hasFarmer: true,
      optimalMoves: 7,
      detectDanger: (bank, boatSide) => {
        const farSide = boatSide === 'left' ? 'right' : 'left';
        const there = id => bank[id] === farSide;
        if (there('wolf') && there('goat')) return 'Wolf ate the goat!';
        if (there('goat') && there('cabbage')) return 'Goat ate the cabbage!';
        return null;
      }
    },
    2: {
      id: 'fcg',
      title: 'Fox · Chicken · Grain',
      description: 'Same rules, different theme.',
      items: [
        { id: 'fox', name: 'Fox', icon: '🦊' },
        { id: 'chicken', name: 'Chicken', icon: '🐔' },
        { id: 'grain', name: 'Grain', icon: '🌾' }
      ],
      boatCapacity: 1,
      hasFarmer: true,
      optimalMoves: 7,
      detectDanger: (bank, boatSide) => {
        const farSide = boatSide === 'left' ? 'right' : 'left';
        const there = id => bank[id] === farSide;
        if (there('fox') && there('chicken')) return 'Fox ate the chicken!';
        if (there('chicken') && there('grain')) return 'Chicken ate the grain!';
        return null;
      }
    },
    3: {
      id: 'mc2',
      title: 'Missionaries & Cannibals',
      description: '2 missionaries · 2 cannibals · boat holds 2.',
      items: [
        { id: 'm1', name: 'Missionary', icon: '😇' },
        { id: 'm2', name: 'Missionary', icon: '😇' },
        { id: 'c1', name: 'Cannibal', icon: '👹' },
        { id: 'c2', name: 'Cannibal', icon: '👹' }
      ],
      boatCapacity: 2,
      hasFarmer: false,
      optimalMoves: 5,
      detectDanger: (bank) => {
        for (const side of ['left', 'right']) {
          const here = Object.keys(bank).filter(id => bank[id] === side);
          const mCount = here.filter(id => id.startsWith('m')).length;
          const cCount = here.filter(id => id.startsWith('c')).length;
          if (mCount > 0 && cCount > mCount) {
            return `Cannibals outnumber missionaries on the ${side} bank!`;
          }
        }
        return null;
      }
    },
    4: {
      id: 'mc3',
      title: '3 Missionaries & 3 Cannibals',
      description: 'Classic hard mode — boat holds 2.',
      items: [
        { id: 'm1', name: 'Missionary', icon: '😇' },
        { id: 'm2', name: 'Missionary', icon: '😇' },
        { id: 'm3', name: 'Missionary', icon: '😇' },
        { id: 'c1', name: 'Cannibal', icon: '👹' },
        { id: 'c2', name: 'Cannibal', icon: '👹' },
        { id: 'c3', name: 'Cannibal', icon: '👹' }
      ],
      boatCapacity: 2,
      hasFarmer: false,
      optimalMoves: 11,
      detectDanger: (bank) => {
        for (const side of ['left', 'right']) {
          const here = Object.keys(bank).filter(id => bank[id] === side);
          const mCount = here.filter(id => id.startsWith('m')).length;
          const cCount = here.filter(id => id.startsWith('c')).length;
          if (mCount > 0 && cCount > mCount) {
            return `Cannibals outnumber missionaries on the ${side} bank!`;
          }
        }
        return null;
      }
    }
  };

  function getPuzzle(id) { return PUZZLES[id] || PUZZLES[1]; }

  function puzzleForLevel(level) {
    if (level <= 3) return 1;
    if (level <= 6) return 2;
    if (level <= 11) return 3;
    return 4;
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    bank: {},
    boatSide: 'left',
    selected: [],
    moves: 0,
    currentPuzzle: null,
    puzzleStartTime: 0,
    timeLimit: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    optimalCount: 0,
    invalidMoves: 0,
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
  function showExplanation(puzzle, dangerMsg) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">${dangerMsg ? 'Danger!' : 'Solved'}</div><div class="explanation-text">${dangerMsg || puzzle.description}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ RENDER SCENE ═══ */
  function renderScene() {
    const puzzle = state.currentPuzzle;
    const leftItems = puzzle.items.filter(it => state.bank[it.id] === 'left');
    const rightItems = puzzle.items.filter(it => state.bank[it.id] === 'right');
    const optimal = puzzle.optimalMoves;

    function tile(it, side) {
      const sel = state.selected.includes(it.id);
      const canClick = side === state.boatSide;
      return `
        <div class="item-tile ${sel ? 'selected' : ''} ${canClick ? '' : 'disabled'}" data-item="${it.id}">
          <span class="tile-icon">${it.icon}</span>
          <span class="tile-name">${it.name}</span>
        </div>
      `;
    }

    const sailLabel = state.boatSide === 'left' ? 'SAIL →' : '← SAIL';
    const canSail = state.selected.length > 0 || puzzle.hasFarmer;

    return `
      ${renderProgressDots()}
      <div class="trial-counter">
        Puzzle <span class="current">${state.level}</span>
        <span style="margin-left:14px;color:var(--t3)">${puzzle.title}</span>
      </div>
      <div class="move-info">
        <span class="mv">MOVES <span class="mv-num">${state.moves}</span></span>
        <span class="mv">OPTIMAL <span class="mv-num good">${optimal}</span></span>
      </div>
      <div class="river-scene">
        <div class="bank left-bank" data-label="LEFT BANK">
          <div class="bank-slots">
            ${leftItems.length ? leftItems.map(it => tile(it, 'left')).join('') : '<div style="color:var(--t3);font-size:11px;">— empty —</div>'}
          </div>
        </div>
        <div class="river-strip">
          <div class="boat ${state.boatSide === 'left' ? 'on-left' : 'on-right'}">🚣</div>
        </div>
        <div class="bank right-bank" data-label="RIGHT BANK">
          <div class="bank-slots">
            ${rightItems.length ? rightItems.map(it => tile(it, 'right')).join('') : '<div style="color:var(--t3);font-size:11px;">— empty —</div>'}
          </div>
        </div>
      </div>
      <div class="river-controls">
        <button class="ctrl-btn" id="sail-btn" ${canSail ? '' : 'disabled'}>${sailLabel}</button>
        <button class="ctrl-btn secondary" id="clear-btn">Clear</button>
      </div>
    `;
  }

  function wireScene() {
    elContent.querySelectorAll('.item-tile:not(.disabled)').forEach(t => {
      t.addEventListener('click', () => handleTileClick(t.dataset.item));
    });
    const sailBtn = $('sail-btn');
    if (sailBtn) sailBtn.addEventListener('click', handleSail);
    const clearBtn = $('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      state.selected = [];
      render(renderScene());
      wireScene();
    });
  }

  /* ═══ IDLE ═══ */
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
    const pbOpt = pb.bestOptimalRate > 0 ? pb.bestOptimalRate + '%' : '—';

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
      <div class="phase-title">Problem Solving · Constraint Satisfaction</div>
      <h1 class="phase-headline grd">River Crossing</h1>
      <p class="phase-sub">
        Move everyone across the river. The boat has limits.
        <br>Some pairs <strong style="color:#FF4D6D">can't be left alone</strong>.
        <br>Plan carefully.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">OPTIMAL RATE</div><div class="stat-value" style="font-size:16px">${pbOpt}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🌊</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 1 puzzle each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.RiverCrossingExtraModes ? window.RiverCrossingExtraModes.getModeDefinitions() : []).map(m => `
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
        Click items to load · Sail when ready · <kbd>Space</kbd> to start
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

    if (window.RiverCrossingExtraModes && window.RCAPI) {
      window.RiverCrossingExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.RiverCrossingExtraModes.start(m.id, window.RCAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.optimalCount = 0;
    state.invalidMoves = 0;

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
    state.moves = 0;
    state.selected = [];
    state.boatSide = 'left';

    const puzzleId = puzzleForLevel(state.level);
    state.currentPuzzle = getPuzzle(puzzleId);

    state.bank = {};
    state.currentPuzzle.items.forEach(it => state.bank[it.id] = 'left');

    state.timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(
      3,
      'Level ' + state.level,
      state.currentPuzzle.title,
      () => {
        setPhase('trial');
        render(renderScene());
        wireScene();
        state.puzzleStartTime = performance.now();
        startTimer(state.timeLimit);
      }
    );
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
    }, 80);
  }

  function handleTileClick(itemId) {
    if (state.phase !== 'trial') return;
    if (state.bank[itemId] !== state.boatSide) return;

    if (state.selected.includes(itemId)) {
      state.selected = state.selected.filter(x => x !== itemId);
    } else {
      const cap = state.currentPuzzle.boatCapacity;
      if (state.selected.length >= cap) state.selected.shift();
      state.selected.push(itemId);
    }
    if (S && S.itemPick) S.itemPick();
    render(renderScene());
    wireScene();
  }

  function handleSail() {
    if (state.phase !== 'trial') return;
    const puzzle = state.currentPuzzle;

    // In farmer puzzles, farmer must be on boat — sail is always allowed.
    // In passenger puzzles, need at least 1 passenger.
    if (!puzzle.hasFarmer && state.selected.length === 0) {
      state.invalidMoves++;
      haptic('wrong');
      return;
    }
    if (state.selected.length > puzzle.boatCapacity) {
      state.invalidMoves++;
      return;
    }

    // Move selected items
    const fromSide = state.boatSide;
    const toSide = fromSide === 'left' ? 'right' : 'left';
    state.selected.forEach(id => state.bank[id] = toSide);
    state.selected = [];
    state.boatSide = toSide;
    state.moves++;

    if (S && S.sail) S.sail();

    // Check danger
    const danger = puzzle.detectDanger(state.bank, state.boatSide);
    if (danger) {
      // Failed — lose life
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      state.levelTotal++;
      if (S) S.miss();
      showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');

      // Freeze and show
      render(renderScene());
      showExplanation(puzzle, danger);

      push(() => {
        if (state.lives <= 0) completeGame();
        else startLevel();  // Retry same level
      }, 2800);
      return;
    }

    // Check win
    const allRight = puzzle.items.every(it => state.bank[it.id] === 'right');
    if (allRight) {
      handleWin();
      return;
    }

    // Render new state
    render(renderScene());
    wireScene();
  }

  function handleWin() {
    clearAllTimeouts();
    const elapsed = performance.now() - state.puzzleStartTime;
    state.levelTotal++;
    state.levelCorrect++;

    const validRT = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (validRT) state.allRTs.push(elapsed);

    const isOptimal = state.moves === state.currentPuzzle.optimalMoves;
    if (isOptimal) state.optimalCount++;

    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    const baseScore = CONFIG.correctBase;
    const timeBonus = validRT ? Math.round((1 - elapsed / state.timeLimit) * CONFIG.timeBonusMax) : 0;
    const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
    const movePenalty = Math.max(0, state.moves - state.currentPuzzle.optimalMoves) * CONFIG.movePenalty;
    const optimalBonus = isOptimal ? CONFIG.optimalBonus : 0;
    state.totalScore += Math.max(0, baseScore + timeBonus + streakBonus + optimalBonus - movePenalty);

    if (S) S.hit();
    showFeedbackFlash(true);

    setPhase('correct');
    const optimalMsg = isOptimal
      ? '<span style="color:#00FF96">Optimal — perfectly planned!</span>'
      : `Solved in <strong>${state.moves}</strong> moves (optimal: ${state.currentPuzzle.optimalMoves})`;

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Solved!</h2>
      <p class="phase-sub">${optimalMsg}</p>
      <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
    `);

    push(() => {
      if (state.level < CONFIG.maxLevel) {
        state.level++;
        elLevel.textContent = String(state.level);
        startLevel();
      } else completeGame();
    }, 1500);
  }

  function handleTimeout() {
    if (state.phase !== 'trial') return;

    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    if (S) S.miss();
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF0077">Time's Up</h2>
      <p class="phase-sub">
        <strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
      </p>
    `);

    push(() => {
      if (state.lives <= 0) completeGame();
      else startLevel();
    }, 1800);
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
    const optimalRate = totalCorrect > 0 ? Math.round((state.optimalCount / totalCorrect) * 100) : 0;

    const medianRT = H.median(state.allRTs);
    const rtv = H.stdDev(state.allRTs);
    const rcs = H.rcs(totalCorrect, state.allRTs);

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv, optimalRate
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
    if (accuracy >= 80) interpretation = 'Exceptional constraint reasoning.';
    else if (accuracy >= 65) interpretation = 'Strong planning ability.';
    else if (accuracy >= 50) interpretation = 'Average — normal range.';
    else interpretation = 'Planning skills need practice.';

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
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${optimalRate}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="pbm-box">
        <strong>Constraint-Satisfaction Profile</strong>
        <br>
        Optimal solves: <strong>${state.optimalCount}</strong> / ${totalCorrect}
        <br>
        Invalid attempts: <strong>${state.invalidMoves}</strong>
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
        optimalRate, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'river-crossing', domain: 'problem', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, optimalRate,
      optimalCount: state.optimalCount, isNewPB: hasNewPB
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
    state.bank = {};
    state.selected = [];
    state.boatSide = 'left';
    state.moves = 0;
    state.allRTs = [];
    state.optimalCount = 0;
    state.invalidMoves = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[RiverCrossing] Container not found'); return; }

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
        if (state.phase === 'trial') {
          const sailBtn = $('sail-btn');
          if (sailBtn && !sailBtn.disabled) sailBtn.click();
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
  window.RCAPI = {
    CONFIG,
    state,
    PUZZLES,
    getPuzzle,
    puzzleForLevel,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

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

  window.RiverCrossingGame = {
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