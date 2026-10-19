/* ═══════════════════════════════════════════════════════════
   FLASH — Map Memory v1.0
   Postma & De Haan (1996) · Topographical Memory
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: 14×12 grid · Encode/Recall phases · Landmark
             placement · Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.MapMemoryHelpers;
  const S = window.MapMemorySounds;
  const STAGES = window.MapMemoryStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[MapMemory] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('map-memory', STAGES, {
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
    roundsPerLevel: 3,
    startLandmarks: 3,
    maxLandmarks: 12,
    gridCols: 14,
    gridRows: 12,
    baseEncodeDuration: 1200,
    minEncodeDuration: 500,
    edgeMargin: 2,
    correctBase: 100,
    streakBonus: 40,
    landmarkBonus: 25,
    rtMin: 200,
    rtMax: 180000
  };

  /* ═══ LANDMARK POOL ═══ */
  const LANDMARKS = [
    { id: 'home',     name: 'Home',      icon: '🏠' },
    { id: 'school',   name: 'School',    icon: '🏫' },
    { id: 'hospital', name: 'Hospital',  icon: '🏥' },
    { id: 'store',    name: 'Store',     icon: '🏪' },
    { id: 'bank',     name: 'Bank',      icon: '🏦' },
    { id: 'fountain', name: 'Fountain',  icon: '⛲' },
    { id: 'tree',     name: 'Tree',      icon: '🌳' },
    { id: 'tower',    name: 'Tower',     icon: '🗼' },
    { id: 'church',   name: 'Church',    icon: '⛪' },
    { id: 'castle',   name: 'Castle',    icon: '🏰' },
    { id: 'theater',  name: 'Theater',   icon: '🎭' },
    { id: 'museum',   name: 'Museum',    icon: '🏛️' },
    { id: 'station',  name: 'Station',   icon: '🚉' },
    { id: 'harbor',   name: 'Harbor',    icon: '⚓' },
    { id: 'bridge',   name: 'Bridge',    icon: '🌉' },
    { id: 'stadium',  name: 'Stadium',   icon: '🏟️' }
  ];

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentRound: null,
    roundIndex: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    maxLandmarksReached: 0,
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
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ═══ LANDMARK / POSITION PICKING ═══ */
  function pickLandmarks(count) {
    return shuffle(LANDMARKS).slice(0, count).map(lm =>
      Object.assign({}, lm)
    );
  }

  function pickPositions(count) {
    const positions = [];
    const total = CONFIG.gridCols * CONFIG.gridRows;
    const margin = CONFIG.edgeMargin;

    while (positions.length < count) {
      const col = randInt(margin, CONFIG.gridCols - 1 - margin);
      const row = randInt(margin, CONFIG.gridRows - 1 - margin);
      const idx = row * CONFIG.gridCols + col;

      let tooClose = false;
      for (const p of positions) {
        const pCol = p % CONFIG.gridCols;
        const pRow = Math.floor(p / CONFIG.gridCols);
        if (Math.abs(pCol - col) < 2 && Math.abs(pRow - row) < 2) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) positions.push(idx);
    }
    return positions;
  }

  function landmarksForLevel(level) {
    return Math.min(CONFIG.maxLandmarks, CONFIG.startLandmarks + (level - 1));
  }

  function encodeDurationForLevel(level) {
    return Math.max(
      CONFIG.minEncodeDuration,
      CONFIG.baseEncodeDuration - (level - 1) * 40
    );
  }

  function manhattanDistance(a, b) {
    const aCol = a % CONFIG.gridCols, aRow = Math.floor(a / CONFIG.gridCols);
    const bCol = b % CONFIG.gridCols, bRow = Math.floor(b / CONFIG.gridCols);
    return Math.abs(aCol - bCol) + Math.abs(aRow - bRow);
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

  /* ═══ RENDER BOARD ═══ */
  function renderBoard(landmarkMap, status, badgeHTML, hudHTML, queueHTML) {
    const cells = [];
    for (let i = 0; i < CONFIG.gridCols * CONFIG.gridRows; i++) {
      const lm = landmarkMap[i];
      const stat = status ? status[i] : null;
      let cls = 'map-cell';
      let content = '';

      if (lm) {
        cls += ' landmark';
        content = `<span class="landmark-icon">${lm.icon}</span>`;
        if (lm.showLabel) {
          content += `<span class="landmark-label">${lm.name}</span>`;
        }
      }
      if (stat === 'correct') cls += ' placed-correct';
      if (stat === 'wrong') cls += ' placed-wrong';

      cells.push(`<div class="${cls}" data-cell="${i}">${content}</div>`);
    }

    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      ${queueHTML || ''}
      <div class="map-wrap">
        <div class="map-grid">${cells.join('')}</div>
      </div>
    `;
  }

  function renderQueue(landmarks, currentIdx) {
    return `
      <div class="landmark-queue">
        ${landmarks.map((lm, i) => {
          let cls = 'landmark-chip';
          if (i < currentIdx) cls += ' done';
          else if (i === currentIdx) cls += ' active';
          return `<div class="${cls}"><span class="chip-icon">${lm.icon}</span>${lm.name}</div>`;
        }).join('')}
      </div>
    `;
  }

  function wireCells(handler) {
    elContent.querySelectorAll('.map-cell').forEach(c => {
      c.addEventListener('click', () => handler(parseInt(c.dataset.cell, 10)));
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
    const pbSpan = pb.bestSpan > 0 ? pb.bestSpan : '—';
    const pbRT = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';

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
      <div class="phase-title">Spatial Domain · Topographical Memory</div>
      <h1 class="phase-headline grd">Map Memory</h1>
      <p class="phase-sub">
        Landmarks appear on a grid with names.
        <br>After they hide, place each landmark in its
        <strong style="color:#00EEFF">correct location</strong>.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST SPAN</div><div class="stat-value" style="font-size:16px">${pbSpan}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
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
          <div class="mode-desc">15 levels · 3 rounds each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.MapMemoryExtraModes ? window.MapMemoryExtraModes.getModeDefinitions() : []).map(m => `
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
        Click cells to place · <kbd>Space</kbd> to start classic
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

    if (window.MapMemoryExtraModes && window.MMAPI) {
      window.MapMemoryExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.MapMemoryExtraModes.start(m.id, window.MMAPI, S, H);
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
    state.maxLandmarksReached = 0;

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
    state.roundIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(
      3,
      'Level ' + state.level,
      landmarksForLevel(state.level) + ' landmarks',
      nextRound
    );
  }

  function nextRound() {
    if (state.roundIndex >= CONFIG.roundsPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    state.roundIndex++;
    const count = landmarksForLevel(state.level);
    state.maxLandmarksReached = Math.max(state.maxLandmarksReached, count);

    const landmarks = pickLandmarks(count);
    const positions = pickPositions(count);

    const landmarkMap = {};
    landmarks.forEach((lm, i) => {
      const pos = positions[i];
      landmarkMap[pos] = { ...lm, correctPos: pos, showLabel: true };
    });

    state.currentRound = {
      landmarks,
      positions,
      landmarkMap,
      startTime: performance.now()
    };

    startEncodePhase();
  }

  function startEncodePhase() {
    setPhase('encode');
    const count = state.currentRound.landmarks.length;
    const encodeDur = encodeDurationForLevel(state.level);

    const badge = `<div class="practice-badge">Round ${state.roundIndex} / ${CONFIG.roundsPerLevel}</div>`;
    const hud = `
      <div class="round-info">
        <span class="ri">LANDMARKS <span class="ri-val">${count}</span></span>
        <span class="ri">ROUND <span class="ri-val">${state.roundIndex}/${CONFIG.roundsPerLevel}</span></span>
      </div>
    `;

    // Show all landmarks with labels
    render(renderBoard(state.currentRound.landmarkMap, {}, badge, hud, ''));

    // Flash each landmark once (visual cue)
    let idx = 0;
    function flashNext() {
      if (state.phase !== 'encode') return;
      if (idx >= state.currentRound.landmarks.length) {
        startRecallPhase();
        return;
      }
      const pos = state.currentRound.positions[idx];
      if (S && S.landmarkShow) S.landmarkShow();
      idx++;
      push(flashNext, encodeDur);
    }

    push(flashNext, 400);
  }

  function startRecallPhase() {
    // Hide labels
    Object.keys(state.currentRound.landmarkMap).forEach(k => {
      state.currentRound.landmarkMap[k].showLabel = false;
    });

    const status = {};
    let userIdx = 0;
    const placementErrors = [];

    function renderNow() {
      setPhase('recall');
      const badge = `<div class="practice-badge">Round ${state.roundIndex} / ${CONFIG.roundsPerLevel}</div>`;
      const hud = `
        <div class="round-info">
          <span class="ri">LANDMARKS <span class="ri-val">${state.currentRound.landmarks.length}</span></span>
          <span class="ri">PLACED <span class="ri-val good">${userIdx}</span></span>
        </div>
      `;
      render(renderBoard(
        state.currentRound.landmarkMap,
        status,
        badge,
        hud,
        renderQueue(state.currentRound.landmarks, userIdx)
      ));
      wireCells(handleClick);
    }

    function handleClick(cellIdx) {
      if (state.phase !== 'recall') return;
      if (userIdx >= state.currentRound.landmarks.length) return;

      const current = state.currentRound.landmarks[userIdx];
      const correctPos = current.correctPos;

      if (cellIdx === correctPos) {
        status[cellIdx] = 'correct';
        if (S && S.landmarkPlace) S.landmarkPlace();
        API_showFeedbackFlash(true);

        // Place the landmark in the map so the user sees it
        state.currentRound.landmarkMap[cellIdx] = {
          ...current,
          showLabel: false
        };
        userIdx++;

        if (userIdx >= state.currentRound.landmarks.length) {
          // Round success
          handleRoundSuccess();
        } else {
          renderNow();
        }
      } else {
        status[cellIdx] = 'wrong';
        if (S) S.miss();
        API_showFeedbackFlash(false);
        placementErrors.push(manhattanDistance(cellIdx, correctPos));
        renderNow();

        // Wrong — lose life after brief delay
        push(() => handleRoundFail(placementErrors), 800);
      }
    }

    // First render
    setPhase('recall');
    render(renderBoard(
      state.currentRound.landmarkMap,
      status,
      `<div class="practice-badge">Round ${state.roundIndex} / ${CONFIG.roundsPerLevel}</div>`,
      `
        <div class="round-info">
          <span class="ri">LANDMARKS <span class="ri-val">${state.currentRound.landmarks.length}</span></span>
          <span class="ri">PLACED <span class="ri-val good">0</span></span>
        </div>
      `,
      renderQueue(state.currentRound.landmarks, 0)
    ));
    wireCells(handleClick);
  }

  /* Use local wrapper to keep handleResponse safe from outer scope */
  function API_showFeedbackFlash(hit) {
    showFeedbackFlash(hit);
  }

  function handleRoundSuccess() {
    const rt = performance.now() - state.currentRound.startTime;
    state.levelCorrect++;
    state.levelTotal++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    if (rt >= CONFIG.rtMin && rt <= CONFIG.rtMax) state.allRTs.push(rt);
    state.levelTotalTime += rt;

    const count = state.currentRound.landmarks.length;
    state.totalScore += CONFIG.correctBase + (state.streak - 1) * CONFIG.streakBonus + count * CONFIG.landmarkBonus;

    if (S) S.hit();
    haptic('correct');
    setPhase('correct');

    push(() => {
      if (state.roundIndex >= CONFIG.roundsPerLevel) endLevel();
      else nextRound();
    }, 700);
  }

  function handleRoundFail(errors) {
    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    if (S) S.miss();
    haptic('wrong');
    setPhase('wrong');

    push(() => {
      if (state.lives <= 0) completeGame();
      else if (state.roundIndex >= CONFIG.roundsPerLevel) endLevel();
      else nextRound();
    }, 1200);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.6,
      landmarks: landmarksForLevel(state.level)
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} rounds at ${landmarksForLevel(state.level)} landmarks</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Next: ' + landmarksForLevel(state.level + 1) + ' landmarks' : 'You reached the top!'}</p>
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

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      maxLandmarks: state.maxLandmarksReached
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
    if (state.maxLandmarksReached >= 8) interpretation = 'Exceptional topographical memory — top 10%.';
    else if (state.maxLandmarksReached >= 6) interpretation = 'Strong topographical span.';
    else if (state.maxLandmarksReached >= 4) interpretation = 'Average — normal range.';
    else interpretation = 'Topographical span below typical range.';

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
        <div class="stat-card"><div class="stat-label">MAX LANDMARKS</div><div class="stat-value">${state.maxLandmarksReached}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="spatial-box">
        <strong>Topographical Memory Profile</strong>
        <br>
        Maximum landmarks placed: <strong>${state.maxLandmarksReached}</strong>
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
        maxLandmarks: state.maxLandmarksReached, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'map-memory', domain: 'spatial', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      maxLandmarks: state.maxLandmarksReached,
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
    state.currentRound = null;
    state.roundIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.maxLandmarksReached = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[MapMemory] Container not found'); return; }

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
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'encode' || state.phase === 'recall' || state.phase === 'countdown') {
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
  window.MMAPI = {
    CONFIG,
    state,
    LANDMARKS,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    pickLandmarks,
    pickPositions,
    landmarksForLevel,
    encodeDurationForLevel,
    manhattanDistance,
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

  window.MapMemoryGame = {
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