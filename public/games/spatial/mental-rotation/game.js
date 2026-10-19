/* ═══════════════════════════════════════════════════════════
   FLASH — Mental Rotation v1.0
   Shepard & Metzler (1971) · 3D Mental Rotation
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Voxel shapes · Isometric projection · Painter's
             algorithm · 3D rotations · Mirror detection ·
             Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.MentalRotationHelpers;
  const S = window.MentalRotationSounds;
  const STAGES = window.MentalRotationStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[MentalRotation] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('mental-rotation', STAGES, {
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
    trialsPerLevel: 10,
    baseTime: 16000,
    minTime: 7000,
    timeStepPerLevel: 600,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000,
    sameProbability: 0.5
  };

  /* ═══ VOXEL SHAPE GENERATION ═══ */
  const DIRS = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1]
  ];

  function normalize(voxels) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    voxels.forEach(v => {
      if (v[0] < minX) minX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[2] < minZ) minZ = v[2];
    });
    return voxels.map(v => [v[0] - minX, v[1] - minY, v[2] - minZ]);
  }

  function shapeKey(voxels) {
    return voxels
      .map(v => v.join(','))
      .sort()
      .join('|');
  }

  function rotX(v, k) {
    k = ((k % 4) + 4) % 4;
    for (let i = 0; i < k; i++) v = v.map(c => [c[0], -c[2], c[1]]);
    return v;
  }
  function rotY(v, k) {
    k = ((k % 4) + 4) % 4;
    for (let i = 0; i < k; i++) v = v.map(c => [c[2], c[1], -c[0]]);
    return v;
  }
  function rotZ(v, k) {
    k = ((k % 4) + 4) % 4;
    for (let i = 0; i < k; i++) v = v.map(c => [-c[1], c[0], c[2]]);
    return v;
  }

  function allRotations(voxels) {
    const set = new Set();
    const out = [];
    for (let kx = 0; kx < 4; kx++) {
      for (let ky = 0; ky < 4; ky++) {
        for (let kz = 0; kz < 4; kz++) {
          let v = rotX(voxels, kx);
          v = rotY(v, ky);
          v = rotZ(v, kz);
          v = normalize(v);
          const key = shapeKey(v);
          if (!set.has(key)) {
            set.add(key);
            out.push(v);
          }
        }
      }
    }
    return out;
  }

  function mirrorX(voxels) {
    return normalize(voxels.map(v => [-v[0], v[1], v[2]]));
  }

  function isSymmetric(voxels) {
    const norm = normalize(voxels);
    const key = shapeKey(norm);
    const rots = allRotations(voxels);
    for (const r of rots) {
      if (shapeKey(r) === key) return true;
    }
    return false;
  }

  function generateVoxelShape(numCubes) {
    let attempts = 0;
    while (attempts < 60) {
      attempts++;
      const voxels = [[0, 0, 0]];
      const set = new Set(['0,0,0']);

      while (voxels.length < numCubes) {
        const base = voxels[randInt(0, voxels.length - 1)];
        const dir = DIRS[randInt(0, 5)];
        const nx = base[0] + dir[0];
        const ny = base[1] + dir[1];
        const nz = base[2] + dir[2];
        const key = nx + ',' + ny + ',' + nz;
        if (!set.has(key)) {
          set.add(key);
          voxels.push([nx, ny, nz]);
        }
      }

      const norm = normalize(voxels);
      if (!isSymmetric(norm)) return norm;
    }
    // Fallback: return first shape anyway
    return normalize([[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]]);
  }

  function cubesForLevel(level) {
    if (level <= 3) return 4;
    if (level <= 8) return 5;
    if (level <= 12) return 6;
    return 7;
  }

  /* ═══ ISOMETRIC RENDERER ═══ */
  function renderVoxelSVG(voxels, options) {
    const opts = options || {};
    const W = 22;                // half-width of top diamond
    const Hh = W / 2;            // half-height of top diamond
    const V = 24;                // cube side height on screen
    const pad = 30;

    // Compute bounds by projecting all cube corners
    let minSx = Infinity, maxSx = -Infinity;
    let minSy = Infinity, maxSy = -Infinity;

    voxels.forEach(([x, y, z]) => {
      const cx = (x - z) * W;
      const cy = (x + z) * Hh - y * V;
      const corners = [
        [cx - W, cy + Hh + V],  // bottom-left-bottom
        [cx + W, cy + Hh + V],  // bottom-right-bottom
        [cx - W, cy - Hh],      // top-left-top
        [cx + W, cy - Hh],      // top-right-top
        [cx, cy - Hh - V],      // apex-top
        [cx, cy + Hh + V]       // bottom-center
      ];
      corners.forEach(([px, py]) => {
        if (px < minSx) minSx = px;
        if (px > maxSx) maxSx = px;
        if (py < minSy) minSy = py;
        if (py > maxSy) maxSy = py;
      });
    });

    const width = (maxSx - minSx) + pad * 2;
    const height = (maxSy - minSy) + pad * 2;
    const offsetX = -minSx + pad;
    const offsetY = -minSy + pad;

    // Sort by painter's algorithm (furthest first)
    // Depth = x + z + y * 0.5 approximately
    const sorted = voxels.slice().sort((a, b) => {
      const dA = a[0] + a[2] + a[1] * 0.5;
      const dB = b[0] + b[2] + b[1] * 0.5;
      if (dA !== dB) return dA - dB;
      return a[1] - b[1];
    });

    const colors = opts.colors || {
      top:   '#7D7BFF',
      left:  '#4E4CBA',
      right: '#3A3888',
      stroke: 'rgba(0,0,0,.35)'
    };

    let svgParts = '';

    sorted.forEach(([x, y, z]) => {
      const cx = (x - z) * W + offsetX;
      const cy = (x + z) * Hh - y * V + offsetY;

      // Top diamond
      const topPts = [
        [cx, cy - Hh],
        [cx + W, cy],
        [cx, cy + Hh],
        [cx - W, cy]
      ];
      // Left face (from top-left down)
      const leftPts = [
        [cx - W, cy],
        [cx, cy + Hh],
        [cx, cy + Hh + V],
        [cx - W, cy + V]
      ];
      // Right face
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

  /* ═══ PUZZLE GENERATION ═══ */
  function applyRandomRotation(voxels, steps) {
    let v = voxels;
    for (let i = 0; i < steps; i++) {
      const axis = randInt(0, 2);
      if (axis === 0) v = rotX(v, 1);
      else if (axis === 1) v = rotY(v, 1);
      else v = rotZ(v, 1);
      v = normalize(v);
    }
    return v;
  }

  function generatePuzzle(level) {
    const numCubes = cubesForLevel(level);
    const base = generateVoxelShape(numCubes);

    const isSame = Math.random() < CONFIG.sameProbability;
    let shapeB;

    if (isSame) {
      // Same shape, rotated
      shapeB = applyRandomRotation(base, randInt(3, 8));
    } else {
      // Different: mirror + rotate
      const mirrored = mirrorX(base);
      shapeB = applyRandomRotation(mirrored, randInt(0, 4));
    }

    return {
      shapeA: base,
      shapeB,
      isSame,
      correctIdx: isSame ? 0 : 1,
      numCubes,
      explanation: isSame
        ? 'Shape B is the same 3D object as A, just rotated in space.'
        : 'Shape B is the MIRROR image of A — no rotation can turn one into the other.'
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
    sameCorrect: 0, sameTotal: 0,
    differentCorrect: 0, differentTotal: 0,
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
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
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
    ex.innerHTML = `<div class="explanation-title">Why</div><div class="explanation-text">${puzzle.explanation}</div>`;
    elContent.appendChild(ex);
  }
  function renderTrial(puzzle) {
    return `
      <div class="voxel-stage">
        <div class="voxel-panel" data-label="SHAPE A">${renderVoxelSVG(puzzle.shapeA)}</div>
        <div class="voxel-panel" data-label="SHAPE B">${renderVoxelSVG(puzzle.shapeB)}</div>
      </div>
      <p class="phase-hint" style="margin-bottom:14px;">Is B the same object as A, or a mirror?</p>
      <div class="answer-row">
        <button class="answer-btn same-btn" data-index="0" data-key="1">
          <span class="ab-icon">🟢</span>
          SAME
        </button>
        <button class="answer-btn different-btn" data-index="1" data-key="2">
          <span class="ab-icon">🔴</span>
          DIFFERENT
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
    const pbSame = pb.bestSameAccuracy > 0 ? pb.bestSameAccuracy + '%' : '—';
    const pbDiff = pb.bestDifferentAccuracy > 0 ? pb.bestDifferentAccuracy + '%' : '—';

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
      <div class="phase-title">Spatial Domain · Mental Rotation</div>
      <h1 class="phase-headline grd">Mental Rotation</h1>
      <p class="phase-sub">
        Shepard & Metzler (1971). Two 3D shapes appear.
        Decide: is B the <strong style="color:#00FF96">same object</strong> (rotated)
        or a <strong style="color:#FF4D6D">mirror image</strong>?
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(660px,94vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">ACC</div><div class="stat-value" style="font-size:15px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value" style="font-size:15px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">SAME</div><div class="stat-value" style="font-size:15px">${pbSame}</div></div>
          <div class="stat-card"><div class="stat-label">DIFF</div><div class="stat-value" style="font-size:15px">${pbDiff}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔄</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 10 trials each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.MentalRotationExtraModes ? window.MentalRotationExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>1</kbd> SAME · <kbd>2</kbd> DIFFERENT · <kbd>Space</kbd> to start
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

    if (window.MentalRotationExtraModes && window.MRAPI) {
      window.MentalRotationExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.MentalRotationExtraModes.start(m.id, window.MRAPI, S, H);
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
    state.sameCorrect = 0; state.sameTotal = 0;
    state.differentCorrect = 0; state.differentTotal = 0;

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
    showCountdown(3, 'Level ' + state.level, 'Rotate in your mind', nextTrial);
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
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
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

    if (state.currentPuzzle.isSame) {
      state.sameTotal++;
      if (isCorrect) state.sameCorrect++;
    } else {
      state.differentTotal++;
      if (isCorrect) state.differentCorrect++;
    }

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
      push(() => nextTrial(), 2000);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2600);
      else push(() => nextTrial(), 2600);
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

    if (state.lives <= 0) push(() => completeGame(), 2400);
    else push(() => nextTrial(), 2400);
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

    const sameAcc = state.sameTotal > 0 ? Math.round((state.sameCorrect / state.sameTotal) * 100) : 0;
    const diffAcc = state.differentTotal > 0 ? Math.round((state.differentCorrect / state.differentTotal) * 100) : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      sameAccuracy: sameAcc,
      differentAccuracy: diffAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional spatial reasoning (top 10% Gv)';
    else if (accuracy >= 65) interpretation = 'Strong mental rotation ability';
    else if (accuracy >= 50) interpretation = 'Average — normal spatial range';
    else interpretation = 'Spatial reasoning needs practice';

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
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
      </div>

      <div class="spatial-box">
        <strong>Spatial Reasoning Profile (Gv)</strong>
        <br>
        Same trials: <strong>${sameAcc}%</strong> · Different trials: <strong>${diffAcc}%</strong>
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
        sameAccuracy: sameAcc, differentAccuracy: diffAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'mental-rotation', domain: 'spatial', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      sameAccuracy: sameAcc,
      differentAccuracy: diffAcc,
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
    state.sameCorrect = 0; state.sameTotal = 0;
    state.differentCorrect = 0; state.differentTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[MentalRotation] Container not found'); return; }

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
          const btn = elContent.querySelector('.same-btn');
          if (btn && !btn.disabled) btn.click();
        }
        if (e.key === '2') {
          e.preventDefault();
          const btn = elContent.querySelector('.different-btn');
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
  window.MRAPI = {
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
    generatePuzzle,
    generateVoxelShape,
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

  window.MentalRotationGame = {
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