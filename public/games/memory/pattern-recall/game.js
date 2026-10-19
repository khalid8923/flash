/* ═══════════════════════════════════════════════════════════
   FLASH — Pattern Recall v2.0 (Full Rewrite)
   Memory Domain · Simon-Says Sequential Recall
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.PatternRecallHelpers;
  const S = window.PatternRecallSounds;
  const STAGES = window.PatternRecallStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[PatternRecall] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('pattern-recall', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══ CONFIG ═══ */
  const CONFIG = {
    gridSize: 4,
    maxLives: 3,
    maxLevel: 15,
    baseFlashDuration: 620,
    minFlashDuration: 320,
    gapDuration: 180,
    inputTimeout: 6000,
    replayFlashDuration: 500,
    rtMin: 100,
    rtMax: 30000
  };

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    sequence: [],
    userIndex: 0,
    userAttempts: [],
    results: [],
    levelResponseTime: 0,
    levelCellRTs: [],
    totalScore: 0,
    allRTs: [],
    totalClicks: 0,
    totalCorrectClicks: 0,
    lastClickTime: 0,
    timeoutIds: [],
    inputTimeoutId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elSeq, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.inputTimeoutId) {
      clearTimeout(state.inputTimeoutId);
      state.inputTimeoutId = null;
    }
  }

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      state.timeoutIds.push(id);
    });
  }

  function totalCells() { return CONFIG.gridSize * CONFIG.gridSize; }

  function sequenceLengthForLevel(level) { return 3 + level; }

  function flashDurationForLevel(level) {
    const d = CONFIG.baseFlashDuration - (level - 1) * 30;
    return Math.max(CONFIG.minFlashDuration, d);
  }

  function allowRepeatForLevel(level) { return level > 5; }

  function generateSequence(level) {
    const length = sequenceLengthForLevel(level);
    const allowRepeats = allowRepeatForLevel(level);
    const seq = [];

    for (let i = 0; i < length; i++) {
      if (allowRepeats) {
        const exclude = i > 0 ? seq[i - 1] : -1;
        let cell;
        do { cell = Math.floor(Math.random() * totalCells()); } while (cell === exclude);
        seq.push(cell);
      } else {
        const used = new Set(seq);
        let cell, attempts = 0;
        do {
          cell = Math.floor(Math.random() * totalCells());
          attempts++;
        } while (used.has(cell) && attempts < 200);
        seq.push(cell);
      }
    }
    return seq;
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

  function setProgress(pct) {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }
  const setTimer = setProgress;

  function renderProgressDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      const r = state.results.find(x => x.level === i);
      let cls = '';
      if (r) cls = r.passed ? 'done' : 'fail';
      else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
  }

  function renderGrid() {
    let cells = '';
    for (let i = 0; i < totalCells(); i++) {
      cells += `<div class="cell" data-idx="${i}"></div>`;
    }
    return `<div class="grid-wrap">${cells}</div>`;
  }

  function getCell(idx) {
    return elContent.querySelector(`.cell[data-idx="${idx}"]`);
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
        const id = setTimeout(tick, 500);
        state.timeoutIds.push(id);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     IDLE SCREEN
     ═══════════════════════════════════════════════════════════ */
  function showIdle() {
    clearAllTimeouts();
    setPhase('idle');
    setProgress(0);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbSeq = pb.bestMaxSequence > 0 ? pb.bestMaxSequence : '—';

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

    const extraModesHTML = (window.PatternRecallExtraModes
      ? window.PatternRecallExtraModes.getModeDefinitions() : []
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
      <div class="phase-title">Memory Domain · Sequential Recall</div>
      <h1 class="phase-headline grd">Pattern Recall</h1>
      <p class="phase-sub">
        Watch the sequence. When it ends, click the tiles
        <strong style="color:#00EEFF">in the exact same order</strong>.
        <br>Each level adds one more step.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">MAX SEQUENCE</div><div class="stat-value" style="font-size:16px">${pbSeq}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔷</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 lives · Progressive</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${extraModesHTML}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>Space</kbd> to start classic
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

    if (window.PatternRecallExtraModes && window.PRAPI) {
      window.PatternRecallExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.PatternRecallExtraModes.start(m.id, window.PRAPI, S, H);
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
    state.totalClicks = 0;
    state.totalCorrectClicks = 0;

    elLevel.textContent = '1';
    elLives.textContent = String(CONFIG.maxLives);

    startLevel();
  }

  async function startLevel() {
    clearAllTimeouts();
    state.userIndex = 0;
    state.userAttempts = [];
    state.levelResponseTime = 0;
    state.levelCellRTs = [];
    state.sequence = generateSequence(state.level);

    elSeq.textContent = String(state.sequence.length);
    elLevel.textContent = String(state.level);

    await showSequence();

    if (state.phase !== 'gameover' && state.sequence.length > 0) {
      startInputPhase();
    }
  }

  async function showSequence() {
    setPhase('showing');
    setProgress(0);

    const flashDur = flashDurationForLevel(state.level);
    const seqLen = state.sequence.length;

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Watch Carefully</div>
      <h2 class="phase-headline">Memorize the order</h2>
      <p class="phase-sub">${seqLen} steps in this sequence</p>
      ${renderGrid()}
    `);

    await wait(700);

    for (let i = 0; i < seqLen; i++) {
      if (state.phase === 'gameover') return;
      const cell = getCell(state.sequence[i]);
      if (!cell) continue;

      cell.classList.add('lit');
      const s = snd(); if (s && s.cellFlash) s.cellFlash();
      setProgress(((i + 1) / seqLen) * 100);
      await wait(flashDur);
      cell.classList.remove('lit');
      await wait(CONFIG.gapDuration);
    }

    await wait(500);
    setProgress(0);
  }

  function startInputPhase() {
    setPhase('input');
    state.userIndex = 0;
    state.lastClickTime = performance.now();

    render(`
      ${renderProgressDots()}
      <div class="phase-title">Level ${state.level} · Your Turn</div>
      <h2 class="phase-headline">Repeat the sequence</h2>
      <p class="phase-sub" id="input-status">
        Step <strong>1</strong> of <strong>${state.sequence.length}</strong>
      </p>
      ${renderGrid()}
    `);

    elContent.querySelectorAll('.cell').forEach(cell => {
      cell.addEventListener('click', () => onCellClick(cell));
    });

    resetInputTimeout();
  }

  function resetInputTimeout() {
    if (state.inputTimeoutId) clearTimeout(state.inputTimeoutId);
    state.inputTimeoutId = setTimeout(() => {
      handleMiss('timeout');
    }, CONFIG.inputTimeout);
  }

  function onCellClick(cell) {
    if (state.phase !== 'input') return;
    if (cell.classList.contains('correct') || cell.classList.contains('wrong')) return;

    clearTimeout(state.inputTimeoutId);
    state.inputTimeoutId = null;

    const idx = parseInt(cell.dataset.idx, 10);
    const expected = state.sequence[state.userIndex];
    const isCorrect = idx === expected;

    state.totalClicks++;
    state.userAttempts.push(idx);

    if (isCorrect) {
      const now = performance.now();
      const cellRT = now - state.lastClickTime;
      state.lastClickTime = now;

      if (cellRT >= CONFIG.rtMin && cellRT <= CONFIG.rtMax) {
        state.levelResponseTime += cellRT;
        state.levelCellRTs.push(cellRT);
        state.allRTs.push(cellRT);
      }

      state.totalCorrectClicks++;

      cell.classList.add('correct');
      const s = snd(); if (s && s.cellTap) s.cellTap();
      setTimeout(() => cell.classList.remove('correct'), 260);

      state.userIndex++;

      const status = $('input-status');
      if (status) {
        if (state.userIndex >= state.sequence.length) {
          status.innerHTML = 'Sequence complete!';
        } else {
          status.innerHTML = `Step <strong>${state.userIndex + 1}</strong> of <strong>${state.sequence.length}</strong>`;
        }
      }

      setProgress((state.userIndex / state.sequence.length) * 100);

      if (state.userIndex >= state.sequence.length) {
        handleSuccess();
      } else {
        resetInputTimeout();
      }
    } else {
      cell.classList.add('wrong');
      handleMiss('wrong-click');
    }
  }

  function handleSuccess() {
    state.results.push({
      level: state.level,
      length: state.sequence.length,
      passed: true,
      clicks: state.userAttempts.length
    });

    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    const avgTime = state.levelCellRTs.length > 0
      ? Math.round(state.levelResponseTime / state.levelCellRTs.length)
      : 0;

    const timeBonus = Math.max(0, 500 - avgTime);
    const streakBonus = state.streak > 1 ? (state.streak - 1) * 20 : 0;
    state.totalScore += 100 + Math.floor(timeBonus / 10) + streakBonus;

    setPhase('feedback');
    showFeedbackFlash(true);
    haptic('correct');

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Perfect</h2>
      <p class="phase-sub">You recalled all ${state.sequence.length} steps correctly.</p>
      <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
    `);

    setTimeout(() => {
      if (state.level < CONFIG.maxLevel) {
        state.level++;
        startLevel();
      } else {
        completeGame();
      }
    }, 1400);
  }

  async function handleMiss(reason) {
    state.results.push({
      level: state.level,
      length: state.sequence.length,
      passed: false,
      clicks: state.userAttempts.length,
      failedAt: state.userIndex,
      reason
    });

    state.lives--;
    state.streak = 0;
    elLives.textContent = String(state.lives);

    setPhase('feedback');
    setProgress(0);
    showFeedbackFlash(false);
    haptic('wrong');

    elContent.querySelectorAll('.cell').forEach(c => c.classList.add('dimmed'));

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF0077">Sequence Failed</h2>
      <p class="phase-sub">
        ${reason === 'timeout' ? 'You ran out of time.' : 'Wrong tile at step ' + (state.userIndex + 1) + '.'}
        <br>
        <strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
      </p>
      <p class="phase-hint">Watching the correct sequence...</p>
      ${renderGrid()}
    `);

    await wait(900);
    const flashDur = CONFIG.replayFlashDuration;
    for (let i = 0; i < state.sequence.length; i++) {
      const cell = getCell(state.sequence[i]);
      if (!cell) continue;
      cell.classList.remove('dimmed');
      cell.classList.add('lit');
      const s = snd(); if (s && s.cellFlash) s.cellFlash();
      setProgress(((i + 1) / state.sequence.length) * 100);
      await wait(flashDur);
      cell.classList.remove('lit');
      await wait(120);
    }

    await wait(700);

    if (state.lives > 0) {
      startLevel();
    } else {
      completeGame();
    }
  }

  /* ═══════════════════════════════════════════════════════════
     COMPLETE GAME
     ═══════════════════════════════════════════════════════════ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setProgress(0);

    const passed = state.results.filter(r => r.passed);
    const maxLength = passed.length > 0
      ? Math.max.apply(null, passed.map(r => r.length))
      : 0;
    const passedLevels = passed.length;
    const maxLevel = state.results.length;

    const accuracy = state.totalClicks > 0
      ? Math.round((state.totalCorrectClicks / state.totalClicks) * 100)
      : 0;

    const medianRT = H.median(state.allRTs);
    const rtv = H.stdDev(state.allRTs);
    const rcs = H.rcs(state.totalCorrectClicks, state.allRTs);

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      maxSequence: maxLength
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
        <div class="stat-card"><div class="stat-label">MAX SEQUENCE</div><div class="stat-value">${maxLength}</div></div>
        <div class="stat-card"><div class="stat-label">PASSED</div><div class="stat-value">${passedLevels}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
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

    setTimeout(() => {
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
        maxSequence: maxLength,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'pattern-recall',
      domain: 'memory',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      maxSequence: maxLength,
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
    state.sequence = [];
    state.userIndex = 0;
    state.userAttempts = [];
    state.levelResponseTime = 0;
    state.levelCellRTs = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.totalClicks = 0;
    state.totalCorrectClicks = 0;

    elLevel.textContent = '1';
    elSeq.textContent = '0';
    elLives.textContent = String(CONFIG.maxLives);

    showIdle();
  }

  /* ═══════════════════════════════════════════════════════════
     MOUNT
     ═══════════════════════════════════════════════════════════ */
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!root) { console.error('[PatternRecall] Container not found'); return; }

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
            <span class="g-meta-item">
              <span class="g-meta-label">LEVEL</span>
              <span class="g-meta-value" id="level-display">1</span>
            </span>
            <span class="g-meta-item">
              <span class="g-meta-label">SEQUENCE</span>
              <span class="g-meta-value" id="seq-display">0</span>
            </span>
            <span class="g-meta-item">
              <span class="g-meta-label">LIVES</span>
              <span class="g-meta-value" id="lives-display">3</span>
            </span>
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
    elSeq       = $('seq-display');
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
    if (state.phase === 'input' || state.phase === 'showing' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    if (window.PatternRecallExtraModes && window.PatternRecallExtraModes.abort) {
      window.PatternRecallExtraModes.abort();
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
  window.PRAPI = {
    CONFIG,
    state,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setProgress,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    renderGrid,
    getCell,
    generateSequence,
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

  window.PatternRecallGame = {
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