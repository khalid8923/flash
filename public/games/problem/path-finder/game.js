/* ═══════════════════════════════════════════════════════════
   FLASH — Path Finder v1.0
   Shallice (1982) · Maze Planning · Optimal Path
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Randomized DFS maze generation · BFS solver ·
             Player movement · Optimal tracking · Settings ·
             i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.PathFinderHelpers;
  const S = window.PathFinderSounds;
  const STAGES = window.PathFinderStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[PathFinder] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('path-finder', STAGES, {
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
    mazesPerLevel: 2,
    startSize: 7,
    maxSize: 25,
    correctBase: 150,
    streakBonus: 50,
    optimalBonus: 100,
    stepPenalty: 8,
    rtMin: 500,
    rtMax: 600000
  };

  /* ═══ CELL TYPES ═══ */
  const WALL = 1;
  const PATH = 0;

  /* ═══ MAZE GENERATION — Randomized DFS (Recursive Backtracking) ═══ */
  function generateMaze(size) {
    // Size must be odd for clean generation
    if (size % 2 === 0) size++;

    // Initialize grid — all walls
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        grid[r][c] = WALL;
      }
    }

    // Start DFS at (1, 1)
    const stack = [[1, 1]];
    grid[1][1] = PATH;

    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];

    while (stack.length > 0) {
      const [r, c] = stack[stack.length - 1];

      // Shuffle directions
      const shuffled = dirs.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }

      let moved = false;
      for (const [dr, dc] of shuffled) {
        const nr = r + dr;
        const nc = c + dc;

        if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && grid[nr][nc] === WALL) {
          // Carve wall between
          grid[r + dr / 2][c + dc / 2] = PATH;
          grid[nr][nc] = PATH;
          stack.push([nr, nc]);
          moved = true;
          break;
        }
      }

      if (!moved) stack.pop();
    }

    // Ensure start (0,0) connects to (1,1)
    grid[0][0] = PATH;
    grid[0][1] = PATH;
    grid[1][0] = PATH;

    // Ensure goal (size-1, size-1) connects to (size-2, size-2)
    grid[size - 1][size - 1] = PATH;
    grid[size - 1][size - 2] = PATH;
    grid[size - 2][size - 1] = PATH;

    return {
      grid,
      size,
      start: { row: 0, col: 0 },
      goal: { row: size - 1, col: size - 1 }
    };
  }

  /* ═══ BFS SOLVER — Shortest Path ═══ */
  function solveMaze(maze) {
    const { grid, size, start, goal } = maze;

    const queue = [{ row: start.row, col: start.col }];
    const visited = new Set();
    visited.add(start.row + ',' + start.col);

    const parent = {};
    parent[start.row + ',' + start.col] = null;

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const { row, col } = queue.shift();

      if (row === goal.row && col === goal.col) {
        // Reconstruct path
        const path = [];
        let cur = { row, col };
        while (cur) {
          path.unshift(cur);
          const key = cur.row + ',' + cur.col;
          cur = parent[key];
        }
        return path;
      }

      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (grid[nr][nc] === WALL) continue;

        const key = nr + ',' + nc;
        if (visited.has(key)) continue;

        visited.add(key);
        parent[key] = { row, col };
        queue.push({ row: nr, col: nc });
      }
    }

    return [start]; // Fallback
  }

  /* ═══ PLAYER MOVEMENT ═══ */
  function movePlayer(maze, pos, dir) {
    let dr = 0, dc = 0;
    if (dir === 'up') dr = -1;
    else if (dir === 'down') dr = 1;
    else if (dir === 'left') dc = -1;
    else if (dir === 'right') dc = 1;
    else return null;

    const nr = pos.row + dr;
    const nc = pos.col + dc;

    if (nr < 0 || nr >= maze.size || nc < 0 || nc >= maze.size) return null;
    if (maze.grid[nr][nc] === WALL) return null;

    return { row: nr, col: nc };
  }

  function isGoal(maze, pos) {
    return pos.row === maze.goal.row && pos.col === maze.goal.col;
  }

  /* ═══ SIZE FOR LEVEL ═══ */
  function sizeForLevel(level) {
    const size = CONFIG.startSize + (level - 1);
    return Math.min(CONFIG.maxSize, size % 2 === 0 ? size + 1 : size);
  }

  /* ═══ RENDER HELPERS ═══ */
  function renderMaze(maze, playerPos, visited, badgeHTML, hudHTML, showOptimalPath, optimalPath) {
    const { grid, size, start, goal } = maze;

    // Build optimal set for lookup
    const optimalSet = new Set();
    if (showOptimalPath && optimalPath) {
      optimalPath.forEach(p => optimalSet.add(p.row + ',' + p.col));
    }

    const cellSize = size <= 11 ? 24 : size <= 17 ? 18 : size <= 21 ? 14 : 11;
    const gapSize = size <= 11 ? 2 : 1;

    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let cls = 'maze-cell';
        const isWall = grid[r][c] === WALL;
        const key = r + ',' + c;

        if (isWall) cls += ' wall';
        else if (visited.has(key)) cls += ' visited';

        if (r === playerPos.row && c === playerPos.col) cls += ' player';
        else if (r === goal.row && c === goal.col) cls += ' goal';
        else if (r === start.row && c === start.col) cls += ' start';
        else if (optimalSet.has(key)) cls += ' optimal-path';

        cells.push(`<div class="${cls}" style="width:${cellSize}px;height:${cellSize}px;"></div>`);
      }
    }

    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="maze-wrap">
        <div class="maze-grid" style="grid-template-columns:repeat(${size},${cellSize}px);grid-template-rows:repeat(${size},${cellSize}px);gap:${gapSize}px;">
          ${cells.join('')}
        </div>
      </div>
      <div class="controls-row">
        <div class="d-pad">
          <div class="d-btn spacer"></div>
          <div class="d-btn" data-dir="up">↑</div>
          <div class="d-btn spacer"></div>
          <div class="d-btn" data-dir="left">←</div>
          <div class="d-btn spacer"></div>
          <div class="d-btn" data-dir="right">→</div>
          <div class="d-btn spacer"></div>
          <div class="d-btn" data-dir="down">↓</div>
          <div class="d-btn spacer"></div>
        </div>
      </div>
      <p class="phase-hint" style="margin-top:10px;"><kbd>↑↓←→</kbd> or click D-pad</p>
    `;
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentMaze: null,
    currentOptimal: null,
    currentOptimalSteps: 0,
    playerPos: null,
    visited: new Set(),
    steps: 0,
    mazeIndex: 0,
    mazeStartTime: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    optimalCount: 0,
    timeoutIds: [],
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
  }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
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
  function showExplanation(text) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">Path</div><div class="explanation-text">${text}</div>`;
    elContent.appendChild(ex);
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
      <div class="phase-title">Problem Solving · Maze Planning</div>
      <h1 class="phase-headline grd">Path Finder</h1>
      <p class="phase-sub">
        Navigate from top-left to bottom-right.
        <br>Find the <strong style="color:#00FF96">shortest path</strong> — no timer.
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
          <div class="mode-icon">🗺️</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 2 mazes each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.PathFinderExtraModes ? window.PathFinderExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>↑↓←→</kbd> to move · <kbd>Space</kbd> to start classic
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

    if (window.PathFinderExtraModes && window.PFAPI) {
      window.PathFinderExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.PathFinderExtraModes.start(m.id, window.PFAPI, S, H);
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
    state.mazeIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, sizeForLevel(state.level) + '×' + sizeForLevel(state.level) + ' maze', nextMaze);
  }

  function nextMaze() {
    if (state.mazeIndex >= CONFIG.mazesPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    state.mazeIndex++;
    const size = sizeForLevel(state.level);

    state.currentMaze = generateMaze(size);
    state.currentOptimal = solveMaze(state.currentMaze);
    state.currentOptimalSteps = state.currentOptimal.length - 1;
    state.playerPos = { row: state.currentMaze.start.row, col: state.currentMaze.start.col };
    state.visited = new Set();
    state.visited.add(state.playerPos.row + ',' + state.playerPos.col);
    state.steps = 0;
    state.mazeStartTime = performance.now();

    renderCurrentMaze();
  }

  function renderCurrentMaze() {
    setPhase('trial');

    const badge = `<div class="practice-badge">Maze ${state.mazeIndex} / ${CONFIG.mazesPerLevel}</div>`;
    const hud = `
      <div class="move-info">
        <span class="mv"><span>MOVES</span><span class="mv-num">${state.steps}</span></span>
        <span class="mv"><span>OPTIMAL</span><span class="mv-num good">${state.currentOptimalSteps}</span></span>
      </div>
    `;

    render(renderMaze(
      state.currentMaze,
      state.playerPos,
      state.visited,
      badge,
      hud,
      false,
      null
    ));

    wireDPad();
  }

  function wireDPad() {
    elContent.querySelectorAll('.d-btn[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => tryMove(btn.dataset.dir));
    });
  }

  function tryMove(dir) {
    if (state.phase !== 'trial') return;

    const next = movePlayer(state.currentMaze, state.playerPos, dir);
    if (!next) {
      if (S && S.wallBump) S.wallBump();
      return;
    }

    state.playerPos = next;
    state.steps++;
    state.visited.add(next.row + ',' + next.col);
    if (S && S.step) S.step();

    if (isGoal(state.currentMaze, state.playerPos)) {
      handleMazeSuccess();
      return;
    }

    renderCurrentMaze();
  }

  function handleMazeSuccess() {
    const rt = performance.now() - state.mazeStartTime;
    state.levelTotal++;

    if (rt >= CONFIG.rtMin && rt <= CONFIG.rtMax) state.allRTs.push(rt);
    state.levelTotalTime += rt;

    const isOptimal = state.steps === state.currentOptimalSteps;
    if (isOptimal) state.optimalCount++;

    state.levelCorrect++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    // Score
    let score = CONFIG.correctBase + (state.streak - 1) * CONFIG.streakBonus;
    if (isOptimal) score += CONFIG.optimalBonus;
    score -= Math.max(0, state.steps - state.currentOptimalSteps) * CONFIG.stepPenalty;
    state.totalScore += Math.max(0, score);

    if (S && S.goalReached) S.goalReached();
    showFeedbackFlash(true);
    haptic('correct');

    setPhase('correct');

    const optimalMsg = isOptimal
      ? '<span style="color:#00FF96">Optimal path!</span>'
      : `Reached in <strong>${state.steps}</strong> moves (optimal: ${state.currentOptimalSteps})`;

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Maze ${state.mazeIndex} Solved!</h2>
      <p class="phase-sub">${optimalMsg}</p>
    `);

    push(() => {
      if (state.mazeIndex >= CONFIG.mazesPerLevel) endLevel();
      else nextMaze();
    }, 900);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.5
    });

    if (accuracy >= 0.5) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} mazes solved</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' — larger maze' : 'You reached the top!'}</p>
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
          ${state.levelCorrect}/${state.levelTotal} solved — need 50% to pass.
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
    if (optimalRate >= 85) interpretation = 'Exceptional planning — near-optimal path-finding.';
    else if (optimalRate >= 65) interpretation = 'Strong path-planning ability.';
    else if (optimalRate >= 40) interpretation = 'Average — normal spatial planning.';
    else interpretation = 'Planning could improve — try tracing the path before moving.';

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
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${totalCorrect}/${totalTrials}</div></div>
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${optimalRate}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="pbm-box">
        <strong>Path-Planning Profile</strong>
        <br>
        Optimal solves: <strong>${state.optimalCount}</strong> / ${totalCorrect}
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
      gameId: 'path-finder', domain: 'problem', mode: 'classic',
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
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.currentMaze = null;
    state.currentOptimal = null;
    state.playerPos = null;
    state.visited = new Set();
    state.steps = 0;
    state.mazeIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.optimalCount = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[PathFinder] Container not found'); return; }

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
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault(); tryMove('up');
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault(); tryMove('down');
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault(); tryMove('left');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault(); tryMove('right');
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
  window.PFAPI = {
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

    generateMaze,
    solveMaze,
    movePlayer,
    isGoal,
    renderMaze,
    sizeForLevel,
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

  window.PathFinderGame = {
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