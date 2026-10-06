/* ═══════════════════════════════════════════════════════════
   FLASH — Block Counter v1.0
   KABC · Hidden-Block Counting · Spatial Visualization
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Voxel structure generation · Hidden-block
             detection · Isometric rendering · Settings ·
             i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.BlockCounterHelpers;
  const S = window.BlockCounterSounds;
  const STAGES = window.BlockCounterStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[BlockCounter] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('block-counter', STAGES, {
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
    puzzlesPerLevel: 3,
    baseTime: 18000,
    minTime: 8000,
    timeStepPerLevel: 700,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 200,
    rtMax: 120000
  };

  /* ═══ GRID CONFIG BY LEVEL ═══ */
  function gridForLevel(level) {
    if (level <= 3)  return { size: 2, maxH: 2, density: 1.0 };
    if (level <= 6)  return { size: 3, maxH: 3, density: 0.85 };
    if (level <= 9)  return { size: 3, maxH: 4, density: 0.75 };
    if (level <= 12) return { size: 3, maxH: 4, density: 0.9 };
    return { size: 4, maxH: 3, density: 0.65 };
  }

  /* ═══ VOXEL STRUCTURE GENERATION ═══ */
  function generateVoxels(level) {
    const cfg = gridForLevel(level);
    const size = cfg.size;
    const maxH = cfg.maxH;
    const density = cfg.density;

    const heights = [];
    for (let x = 0; x < size; x++) {
      heights[x] = [];
      for (let z = 0; z < size; z++) {
        if (Math.random() < density) {
          heights[x][z] = 1 + Math.floor(Math.random() * maxH);
        } else {
          heights[x][z] = 0;
        }
      }
    }

    // Ensure at least 3 columns have height
    let nonZero = 0;
    for (let x = 0; x < size; x++)
      for (let z = 0; z < size; z++)
        if (heights[x][z] > 0) nonZero++;

    if (nonZero < 3) {
      // Force-fill some columns
      heights[0][0] = 2;
      heights[size - 1][0] = 2;
      heights[0][size - 1] = 2;
    }

    // Build voxel list
    const voxels = [];
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const h = heights[x][z];
        for (let y = 0; y < h; y++) {
          voxels.push([x, y, z]);
        }
      }
    }

    return voxels;
  }

  /* ═══ HIDDEN BLOCK DETECTION ═══ */
  function isHidden(voxel, voxelSet) {
    const [x, y, z] = voxel;
    // A block is hidden if another block exists in front of it
    // In iso view (looking from +x, +y, +z direction toward origin),
    // "in front" means larger (x + z + y*0.5) depth
    for (const v of voxelSet) {
      const [vx, vy, vz] = v;
      if (vx === x && vy === y && vz === z) continue;
      // Block v obscures block at x,y,z if:
      // - Same x,z, higher y (directly above in same column)
      // - x+1 or z+1 with same or higher y (in the viewing direction)
      if (vx === x && vz === z && vy > y) return true;
      if (vx > x && vz >= z && vy >= y) return true;
      if (vz > z && vx >= x && vy >= y) return true;
    }
    return false;
  }

  function countHidden(voxels) {
    const set = voxels.map(v => v.slice());
    const keySet = new Set(set.map(v => v.join(',')));

    // Faster: use array check
    let hidden = 0;
    voxels.forEach(v => {
      if (isHiddenFast(v, keySet)) hidden++;
    });
    return hidden;
  }

  function isHiddenFast(voxel, keySet) {
    const [x, y, z] = voxel;
    // Check same column above
    for (let dy = 1; dy <= 6; dy++) {
      if (keySet.has(`${x},${y + dy},${z}`)) return true;
    }
    // Check front-diagonal: larger x or z with higher or equal y
    for (let dx = 1; dx <= 6; dx++) {
      for (let dy = 0; dy <= 6; dy++) {
        if (keySet.has(`${x + dx},${y + dy},${z}`)) return true;
      }
    }
    for (let dz = 1; dz <= 6; dz++) {
      for (let dy = 0; dy <= 6; dy++) {
        if (keySet.has(`${x},${y + dy},${z + dz}`)) return true;
      }
    }
    for (let dx = 1; dx <= 6; dx++) {
      for (let dz = 1; dz <= 6; dz++) {
        if (keySet.has(`${x + dx},${y},${z + dz}`)) return true;
      }
    }
    return false;
  }

  /* ═══ ISOMETRIC RENDERING ═══ */
  function renderVoxelSVG(voxels) {
    if (!voxels || voxels.length === 0) {
      return '<svg viewBox="0 0 100 100"></svg>';
    }

    const W = 26;      // half-width
    const Hh = W / 2;  // half-height of top diamond
    const V = 28;      // cube side vertical

    // Compute bounds
    let minSx = Infinity, maxSx = -Infinity;
    let minSy = Infinity, maxSy = -Infinity;

    voxels.forEach(([x, y, z]) => {
      const cx = (x - z) * W;
      const cy = (x + z) * Hh - y * V;
      const corners = [
        [cx - W, cy + Hh + V],
        [cx + W, cy + Hh + V],
        [cx - W, cy - Hh],
        [cx + W, cy - Hh],
        [cx, cy - Hh - V],
        [cx, cy + Hh + V]
      ];
      corners.forEach(([px, py]) => {
        if (px < minSx) minSx = px;
        if (px > maxSx) maxSx = px;
        if (py < minSy) minSy = py;
        if (py > maxSy) maxSy = py;
      });
    });

    const pad = 30;
    const width = (maxSx - minSx) + pad * 2;
    const height = (maxSy - minSy) + pad * 2;
    const offsetX = -minSx + pad;
    const offsetY = -minSy + pad;

    // Painter's algorithm — sort by depth (farthest first)
    const sorted = voxels.slice().sort((a, b) => {
      const dA = a[0] + a[2] + a[1] * 0.5;
      const dB = b[0] + b[2] + b[1] * 0.5;
      if (dA !== dB) return dA - dB;
      return a[1] - b[1];
    });

    const colors = {
      top:   '#8B7EE8',
      left:  '#5E5CE6',
      right: '#3D3AB8',
      stroke: 'rgba(0,0,0,.35)'
    };

    let svgParts = '';

    sorted.forEach(([x, y, z]) => {
      const cx = (x - z) * W + offsetX;
      const cy = (x + z) * Hh - y * V + offsetY;

      const topPts = [
        [cx, cy - Hh],
        [cx + W, cy],
        [cx, cy + Hh],
        [cx - W, cy]
      ];
      const leftPts = [
        [cx - W, cy],
        [cx, cy + Hh],
        [cx, cy + Hh + V],
        [cx - W, cy + V]
      ];
      const rightPts = [
        [cx, cy + Hh],
        [cx + W, cy],
        [cx + W, cy + V],
        [cx, cy + Hh + V]
      ];

      function poly(pts, fill) {
        return '<polygon points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="' + fill + '" stroke="' + colors.stroke + '" stroke-width="1.2" stroke-linejoin="round"/>';
      }

      svgParts += poly(leftPts, colors.left);
      svgParts += poly(rightPts, colors.right);
      svgParts += poly(topPts, colors.top);
    });

    return '<svg viewBox="0 0 ' + width.toFixed(0) + ' ' + height.toFixed(0) + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' + svgParts + '</svg>';
  }

  /* ═══ OPTIONS GENERATION ═══ */
  function generateOptions(totalBlocks) {
    const options = [totalBlocks];
    const candidates = [
      totalBlocks + 1,
      totalBlocks - 1,
      totalBlocks + 2,
      totalBlocks - 2,
      Math.round(totalBlocks * 1.3),
      Math.round(totalBlocks * 0.7)
    ].filter(x => x > 0 && x !== totalBlocks);

    // Shuffle candidates
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
    }

    while (options.length < 3 && candidates.length > 0) {
      const c = candidates.shift();
      if (!options.includes(c)) options.push(c);
    }

    // If still fewer, add random
    while (options.length < 3) {
      const c = totalBlocks + Math.floor(Math.random() * 10) - 5;
      if (c > 0 && !options.includes(c)) options.push(c);
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }

    return {
      options,
      correctIdx: options.indexOf(totalBlocks)
    };
  }

  /* ═══ PUZZLE GENERATION ═══ */
  function generatePuzzle(level) {
    let voxels = generateVoxels(level);

    // Ensure at least 3 blocks
    let guard = 0;
    while (voxels.length < 3 && guard < 20) {
      voxels = generateVoxels(level);
      guard++;
    }

    const hiddenCount = countHidden(voxels);
    const totalBlocks = voxels.length;
    const { options, correctIdx } = generateOptions(totalBlocks);

    return {
      voxels,
      totalBlocks,
      hiddenBlocks: hiddenCount,
      options,
      correctIdx
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
    puzzleIndex: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    hiddenCorrect: 0,
    hiddenTotal: 0,
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
  function showExplanation(puzzle) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">Structure</div><div class="explanation-text">Total blocks: <strong>${puzzle.totalBlocks}</strong> · Hidden: <strong>${puzzle.hiddenBlocks}</strong></div>`;
    elContent.appendChild(ex);
  }

  /* ═══ RENDER PUZZLE ═══ */
  function renderPuzzle(puzzle, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="voxel-display">
        ${renderVoxelSVG(puzzle.voxels)}
      </div>
      <p class="phase-hint" style="margin-bottom:14px;">How many blocks in total (including hidden)?</p>
      <div class="options-grid">
        ${puzzle.options.map((opt, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i+1}">${opt}</button>
        `).join('')}
      </div>
    `;
  }

  function wireAnswerButtons(handler) {
    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handler(btn));
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
    const pbHid = pb.bestHiddenAccuracy > 0 ? pb.bestHiddenAccuracy + '%' : '—';

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
      <div class="phase-title">Spatial Domain · Hidden-Block Counting</div>
      <h1 class="phase-headline grd">Block Counter</h1>
      <p class="phase-sub">
        A 3D structure of cubes.
        <br>Count <strong style="color:#00EEFF">ALL</strong> the blocks — including the ones you can't see.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">HIDDEN ACC</div><div class="stat-value" style="font-size:16px">${pbHid}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">📦</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.BlockCounterExtraModes ? window.BlockCounterExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>1</kbd>–<kbd>3</kbd> to answer · <kbd>Space</kbd> to start classic
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

    if (window.BlockCounterExtraModes && window.BCAPI) {
      window.BlockCounterExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.BlockCounterExtraModes.start(m.id, window.BCAPI, S, H);
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
    state.hiddenCorrect = 0;
    state.hiddenTotal = 0;

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
    state.puzzleIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, 'Count all blocks including hidden', nextPuzzle);
  }

  function nextPuzzle() {
    if (state.puzzleIndex >= CONFIG.puzzlesPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    setPhase('trial');
    state.puzzleIndex++;

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
        Puzzle <span class="current">${state.puzzleIndex}</span>
        <span class="total"> / ${CONFIG.puzzlesPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      ${renderPuzzle(puzzle)}
    `);

    wireAnswerButtons(handleAnswer);

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

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    if (state.currentPuzzle.hiddenBlocks > 0) {
      state.hiddenTotal++;
      if (isCorrect) state.hiddenCorrect++;
    }

    elContent.querySelectorAll('.option-btn').forEach(b => {
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
      push(() => nextPuzzle(), 1800);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2200);
      else push(() => nextPuzzle(), 2200);
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

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === state.currentPuzzle.correctIdx) b.classList.add('correct');
    });

    showExplanation(state.currentPuzzle);
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 2000);
    else push(() => nextPuzzle(), 2000);
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
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} puzzles correct</p>
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
    const hiddenAcc = state.hiddenTotal > 0 ? Math.round((state.hiddenCorrect / state.hiddenTotal) * 100) : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      hiddenAccuracy: hiddenAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional spatial visualization (top 10%).';
    else if (accuracy >= 65) interpretation = 'Strong hidden-block detection.';
    else if (accuracy >= 50) interpretation = 'Average — normal range.';
    else interpretation = 'Hidden-block inference needs practice.';

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
        <div class="stat-card"><div class="stat-label">HIDDEN ACC</div><div class="stat-value">${hiddenAcc}%</div></div>
      </div>

      <div class="spatial-box">
        <strong>Spatial Visualization Profile</strong>
        <br>
        Hidden-block accuracy: <strong>${hiddenAcc}%</strong>
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
        hiddenAccuracy: hiddenAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'block-counter', domain: 'spatial', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      hiddenAccuracy: hiddenAcc,
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
    state.currentPuzzle = null;
    state.puzzleIndex = 0;
    state.allRTs = [];
    state.hiddenCorrect = 0;
    state.hiddenTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[BlockCounter] Container not found'); return; }

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
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 3) {
          e.preventDefault();
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[n - 1] && !btns[n - 1].disabled) btns[n - 1].click();
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
  window.BCAPI = {
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

    renderVoxelSVG,
    generateVoxels,
    generatePuzzle,
    countHidden,
    gridForLevel,
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

  window.BlockCounterGame = {
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