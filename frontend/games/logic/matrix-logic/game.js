/* ═══════════════════════════════════════════════════════════
   FLASH — Matrix Logic v1.0
   Raven (1938) · Progressive Matrices · Abstract Reasoning (Gf)
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: SVG rendering · 6 features · Rule system ·
             Distractor perturbations · Settings · i18n ·
             Stages · Missions · Badges · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.MatrixLogicHelpers;
  const S = window.MatrixLogicSounds;
  const STAGES = window.MatrixLogicStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[MatrixLogic] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('matrix-logic', STAGES, {
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
    baseTime: 25000,
    minTime: 12000,
    timeStepPerLevel: 900,
    correctBase: 100,
    streakBonus: 50,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000
  };

  /* ═══ FEATURES ═══ */
  const SHAPES    = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'star'];
  const COLORS    = ['#00EEFF', '#FF0077', '#00FF96', '#FFD60A', '#9D4EDD'];
  const SIZES     = [0.60, 0.78, 0.95];
  const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];
  const COUNTS    = [1, 2, 3, 4];

  /* ═══ SVG SHAPE RENDERER ═══ */
  function renderShape(shape, cx, cy, r, rotation, hollow, color) {
    const fill = hollow ? 'none' : color;
    const strokeAttr = hollow ? `stroke="${color}" stroke-width="2.5" stroke-linejoin="round"` : '';
    const transform = rotation ? ` transform="rotate(${rotation} ${cx} ${cy})"` : '';
    const common = `fill="${fill}" ${strokeAttr}${transform}`;

    switch (shape) {
      case 'circle':
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" ${common}/>`;

      case 'square': {
        const h = r * 0.9;
        return `<rect x="${(cx - h).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(h * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" rx="${(h * 0.1).toFixed(1)}" ${common}/>`;
      }

      case 'triangle': {
        const h = r * 1.15;
        const pts = `${cx.toFixed(1)},${(cy - h).toFixed(1)} ${(cx - h * 0.9).toFixed(1)},${(cy + h * 0.7).toFixed(1)} ${(cx + h * 0.9).toFixed(1)},${(cy + h * 0.7).toFixed(1)}`;
        return `<polygon points="${pts}" ${common}/>`;
      }

      case 'hexagon': {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * 60 - 90) * Math.PI / 180;
          pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(' ')}" ${common}/>`;
      }

      case 'diamond': {
        const d = r * 1.1;
        const pts = `${cx.toFixed(1)},${(cy - d).toFixed(1)} ${(cx + d).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + d).toFixed(1)} ${(cx - d).toFixed(1)},${cy.toFixed(1)}`;
        return `<polygon points="${pts}" ${common}/>`;
      }

      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = (i * 36 - 90) * Math.PI / 180;
          const rr = i % 2 === 0 ? r * 1.1 : r * 0.5;
          pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(' ')}" ${common}/>`;
      }

      default:
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" ${common}/>`;
    }
  }

  function getPositions(count, s) {
    const c = s / 2;
    const d = s * 0.22;
    switch (count) {
      case 1: return [[c, c]];
      case 2: return [[c - d, c], [c + d, c]];
      case 3: return [[c, c - d], [c - d, c + d * 0.6], [c + d, c + d * 0.6]];
      case 4: return [[c - d, c - d], [c + d, c - d], [c - d, c + d], [c + d, c + d]];
      default: return [[c, c]];
    }
  }

  function renderCellSVG(cell, cellSize) {
    const s = cellSize || 100;
    const shape    = SHAPES[cell.shape];
    const color    = COLORS[cell.color];
    const sizeVal  = SIZES[cell.size];
    const rotation = ROTATIONS[cell.rotation];
    const count    = COUNTS[cell.count];
    const hollow   = cell.hollow === 1;

    const cellBaseR = s * 0.34;
    const countScale = 1 / Math.sqrt(count);
    const baseR = cellBaseR * sizeVal * countScale;

    const positions = getPositions(count, s);
    let shapesHTML = '';
    positions.forEach(([px, py]) => {
      shapesHTML += renderShape(shape, px, py, baseR, rotation, hollow, color);
    });

    return `<svg viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${shapesHTML}</svg>`;
  }

  /* ═══ RULE SYSTEM ═══ */
  function featureMax(f) {
    switch (f) {
      case 'shape':    return SHAPES.length;
      case 'color':    return COLORS.length;
      case 'size':     return SIZES.length;
      case 'rotation': return ROTATIONS.length;
      case 'count':    return COUNTS.length;
      case 'hollow':   return 2;
    }
    return 1;
  }

  function computeValue(rule, row, col, maxVal) {
    if (rule.kind === 'const') return rule.value;
    if (rule.kind === 'row')   return ((rule.base + row * rule.step) % maxVal + maxVal) % maxVal;
    if (rule.kind === 'col')   return ((rule.base + col * rule.step) % maxVal + maxVal) % maxVal;
    return rule.value;
  }

  function cellFromRules(rules, row, col) {
    return {
      shape:    computeValue(rules.shape,    row, col, SHAPES.length),
      color:    computeValue(rules.color,    row, col, COLORS.length),
      size:     computeValue(rules.size,     row, col, SIZES.length),
      rotation: computeValue(rules.rotation, row, col, ROTATIONS.length),
      count:    computeValue(rules.count,    row, col, COUNTS.length),
      hollow:   computeValue(rules.hollow,   row, col, 2)
    };
  }

  function generateRules(level, varyingCount) {
    const rules = {
      shape:    { kind: 'const', value: randInt(0, SHAPES.length - 1) },
      color:    { kind: 'const', value: randInt(0, COLORS.length - 1) },
      size:     { kind: 'const', value: randInt(0, SIZES.length - 1) },
      rotation: { kind: 'const', value: randInt(0, ROTATIONS.length - 1) },
      count:    { kind: 'const', value: randInt(0, COUNTS.length - 1) },
      hollow:   { kind: 'const', value: randInt(0, 1) }
    };

    const keys = ['shape', 'color', 'size', 'rotation', 'count', 'hollow'];
    const shuffled = shuffle(keys);
    const varying = shuffled.slice(0, varyingCount);

    varying.forEach(f => {
      const maxVal = featureMax(f);
      const axis = Math.random() < 0.5 ? 'row' : 'col';
      const base = randInt(0, maxVal - 1);

      let step;
      if (maxVal === 2) step = 1;
      else if (maxVal === 3) step = 1;
      else step = 1;

      rules[f] = { kind: axis, base, step, max: maxVal };
    });

    // Ensure at least one row-varying rule exists (otherwise rows are identical)
    const hasRow = varying.some(f => rules[f].kind === 'row');
    if (!hasRow && varying.length > 0) {
      const f = varying[0];
      rules[f].kind = 'row';
    }

    return { rules, varying };
  }

  /* ═══ DISTRACTOR GENERATION ═══ */
  function perturbFeature(cell, feature, steps) {
    const out = { ...cell };
    switch (feature) {
      case 'shape':    out.shape    = (out.shape + steps) % SHAPES.length; break;
      case 'color':    out.color    = (out.color + steps) % COLORS.length; break;
      case 'size':     out.size     = (out.size + steps) % SIZES.length; break;
      case 'rotation': out.rotation = (out.rotation + steps) % ROTATIONS.length; break;
      case 'count':    out.count    = (out.count + steps) % COUNTS.length; break;
      case 'hollow':   out.hollow   = out.hollow === 1 ? 0 : 1; break;
    }
    return out;
  }

  function cellEquals(a, b) {
    return a.shape === b.shape && a.color === b.color &&
           a.size === b.size && a.rotation === b.rotation &&
           a.count === b.count && a.hollow === b.hollow;
  }

  function generateOptions(answer) {
    const distractors = [];
    const seen = [answer];

    function tryAdd(candidate) {
      if (seen.some(s => cellEquals(s, candidate))) return false;
      seen.push(candidate);
      distractors.push(candidate);
      return true;
    }

    // 1. Wrong shape
    tryAdd(perturbFeature(answer, 'shape', 1));

    // 2. Wrong color
    tryAdd(perturbFeature(answer, 'color', 1));

    // 3. Wrong rotation
    tryAdd(perturbFeature(answer, 'rotation', 1));

    // 4. Wrong size
    tryAdd(perturbFeature(answer, 'size', 1));

    // 5. Wrong count
    tryAdd(perturbFeature(answer, 'count', 1));

    // 6. Wrong hollow
    tryAdd(perturbFeature(answer, 'hollow', 1));

    // 7. Multi-perturbation (2 features)
    const keys = ['shape', 'color', 'size', 'rotation', 'count', 'hollow'];
    const shuffled = shuffle(keys);
    let d7 = perturbFeature(answer, shuffled[0], 2);
    d7 = perturbFeature(d7, shuffled[1], 1);
    tryAdd(d7);

    // If we don't have 7 distractors, add random ones
    while (distractors.length < 7) {
      const f = keys[randInt(0, keys.length - 1)];
      const candidate = perturbFeature(answer, f, randInt(1, 2));
      if (!tryAdd(candidate)) continue;
    }

    const all = shuffle([
      { cell: answer, correct: true },
      ...distractors.slice(0, 7).map(d => ({ cell: d, correct: false }))
    ]);

    return {
      options: all.map(o => o.cell),
      correctIdx: all.findIndex(o => o.correct)
    };
  }

  function buildExplanation(varying, rules) {
    const featureNames = {
      shape: 'Shape', color: 'Color', size: 'Size',
      rotation: 'Rotation', count: 'Count', hollow: 'Fill'
    };
    return varying.map(f => {
      const r = rules[f];
      const dir = r.kind === 'row' ? 'down the rows' :
                  r.kind === 'col' ? 'across the columns' : 'constant';
      return `${featureNames[f]} changes ${dir}`;
    }).join(' · ');
  }

  /* ═══ PUZZLE GENERATION ═══ */
  function complexityForLevel(level) {
    if (level <= 3)  return 1;
    if (level <= 9)  return 2;
    return 3;
  }

  function generatePuzzle(level) {
    const varyingCount = complexityForLevel(level);
    const { rules, varying } = generateRules(level, varyingCount);

    const cells = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        cells.push(cellFromRules(rules, row, col));
      }
    }

    const answer = cells[8];
    const { options, correctIdx } = generateOptions(answer);

    return {
      cells,
      answer,
      options,
      correctIdx,
      explanation: buildExplanation(varying, rules),
      complexity: varyingCount,
      rules
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
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    maxComplexitySolved: 0,
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
    ex.innerHTML = `<div class="explanation-title">Pattern</div><div class="explanation-text">${puzzle.explanation}</div>`;
    elContent.appendChild(ex);
  }
  function renderMatrix(puzzle) {
    return `
      <div class="matrix-wrap">
        <div class="matrix-grid">
          ${puzzle.cells.map((cell, i) => {
            if (i === 8) {
              return `<div class="matrix-cell missing">?</div>`;
            }
            return `<div class="matrix-cell">${renderCellSVG(cell)}</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }
  function renderOptions(puzzle) {
    return `
      <div class="options-grid">
        ${puzzle.options.map((opt, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i + 1}">
            ${renderCellSVG(opt, 80)}
          </button>
        `).join('')}
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
    const pbCpx = pb.bestMaxComplexity > 0 ? pb.bestMaxComplexity + ' feat' : '—';

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
      <div class="phase-title">Logic Domain · Abstract Reasoning</div>
      <h1 class="phase-headline grd">Matrix Logic</h1>
      <p class="phase-sub">
        Raven's Progressive Matrices — the classic test of
        <strong style="color:#00EEFF">abstract reasoning (Gf)</strong>.
        <br>Study the 3×3 pattern and find the missing cell.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST COMPLEXITY</div><div class="stat-value" style="font-size:16px">${pbCpx}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔲</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.MatrixLogicExtraModes ? window.MatrixLogicExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>1</kbd>–<kbd>8</kbd> to answer · <kbd>Space</kbd> to start classic
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

    if (window.MatrixLogicExtraModes && window.MLAPI) {
      window.MatrixLogicExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.MatrixLogicExtraModes.start(m.id, window.MLAPI, S, H);
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
    state.maxComplexitySolved = 0;

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
    showCountdown(3, 'Level ' + state.level, 'Study the pattern carefully', nextPuzzle);
  }

  function nextPuzzle() {
    if (state.puzzleIndex >= CONFIG.puzzlesPerLevel) { endLevel(); return; }

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
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level} · ${puzzle.complexity} feature${puzzle.complexity > 1 ? 's' : ''}</span>
      </div>
      ${renderMatrix(puzzle)}
      <p class="phase-hint" style="margin-bottom:14px;">Find the missing cell</p>
      ${renderOptions(puzzle)}
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
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

    if (isCorrect && state.currentPuzzle.complexity > state.maxComplexitySolved) {
      state.maxComplexitySolved = state.currentPuzzle.complexity;
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
      push(() => nextPuzzle(), 2400);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 3000);
      else push(() => nextPuzzle(), 3000);
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

    if (state.lives <= 0) push(() => completeGame(), 2800);
    else push(() => nextPuzzle(), 2800);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.67
    });

    if (accuracy >= 0.67) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} puzzles solved</p>
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
          ${state.levelCorrect}/${state.levelTotal} solved — need 67% to pass.
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

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      maxComplexity: state.maxComplexitySolved
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
    if (accuracy >= 80) interpretation = 'Exceptional abstract reasoning (top 10% Gf)';
    else if (accuracy >= 65) interpretation = 'Strong fluid intelligence';
    else if (accuracy >= 50) interpretation = 'Average — normal range';
    else interpretation = 'Abstract reasoning needs practice';

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
        <div class="stat-card"><div class="stat-label">MAX COMPLEXITY</div><div class="stat-value">${state.maxComplexitySolved}</div></div>
      </div>

      <div class="logic-box">
        <strong>Abstract Reasoning Profile (Gf)</strong>
        <br>
        Max feature count solved: <strong>${state.maxComplexitySolved}</strong>
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
        maxComplexity: state.maxComplexitySolved, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'matrix-logic', domain: 'logic', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      maxComplexity: state.maxComplexitySolved,
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
    state.puzzleIndex = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.maxComplexitySolved = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[MatrixLogic] Container not found'); return; }

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
        if (n >= 1 && n <= 8) {
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
  window.MLAPI = {
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

    renderCellSVG,
    renderShape,
    generatePuzzle,
    generateOptions,
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

  window.MatrixLogicGame = {
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