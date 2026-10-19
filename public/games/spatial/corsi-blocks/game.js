/* ═══════════════════════════════════════════════════════════
   FLASH — Corsi Blocks v1.0
   Corsi (1972) · Visuospatial Working Memory Span
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: 9-block fixed layout · Sequence flash ·
             Span tracking · Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.CorsiBlocksHelpers;
  const S = window.CorsiBlocksSounds;
  const STAGES = window.CorsiBlocksStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[CorsiBlocks] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('corsi-blocks', STAGES, {
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
    sequencesPerLevel: 3,
    startSpan: 3,
    maxSpan: 14,
    baseFlashDuration: 650,
    minFlashDuration: 300,
    baseGapDuration: 220,
    correctBase: 100,
    streakBonus: 50,
    spanBonus: 30,
    rtMin: 200,
    rtMax: 120000
  };

  /* ═══ BLOCK LAYOUT (normalized percentages) ═══ */
  const BLOCK_POSITIONS = [
    { x: 8,  y: 8,  w: 24, h: 24 },   // 0 — top-left
    { x: 38, y: 6,  w: 24, h: 22 },   // 1 — top-mid
    { x: 68, y: 8,  w: 24, h: 24 },   // 2 — top-right
    { x: 6,  y: 38, w: 22, h: 24 },   // 3 — mid-left
    { x: 39, y: 38, w: 22, h: 24 },   // 4 — center
    { x: 72, y: 38, w: 22, h: 24 },   // 5 — mid-right
    { x: 8,  y: 70, w: 24, h: 22 },   // 6 — bot-left
    { x: 38, y: 72, w: 24, h: 22 },   // 7 — bot-mid
    { x: 68, y: 70, w: 24, h: 22 }    // 8 — bot-right
  ];

  /* ═══ SEQUENCE GENERATOR ═══ */
  function generateSequence(span) {
    const seq = [];
    const used = new Set();
    const allowRepeats = span > 5;

    while (seq.length < span) {
      const idx = randInt(0, 8);
      // Before span 5: all unique blocks
      if (!allowRepeats) {
        if (used.has(idx)) continue;
        used.add(idx);
        seq.push(idx);
      } else {
        // After span 5: allow repeats but no consecutive duplicates
        if (seq.length > 0 && seq[seq.length - 1] === idx) continue;
        seq.push(idx);
      }
    }
    return seq;
  }

  function spanForLevel(level) {
    return Math.min(CONFIG.maxSpan, CONFIG.startSpan + (level - 1));
  }

  function flashDurationForLevel(level) {
    return Math.max(
      CONFIG.minFlashDuration,
      CONFIG.baseFlashDuration - (level - 1) * 25
    );
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentSpan: 3,
    currentSequence: [],
    userIdx: 0,
    userStatus: {},
    sequenceStartTime: 0,
    sequencesThisLevel: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    maxSpanReached: 3,
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
    ex.innerHTML = `<div class="explanation-title">Analysis</div><div class="explanation-text">${text}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ RENDER BOARD ═══ */
  function renderBoard(litIdx, status, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="corsi-board">
        ${Array.from({ length: 9 }, (_, i) => {
          const pos = BLOCK_POSITIONS[i];
          const lit = litIdx.includes(i) ? ' lit' : '';
          const stat = status[i] === 'correct' ? ' selected-correct'
                     : status[i] === 'wrong' ? ' selected-wrong'
                     : '';
          return `<div class="corsi-block${lit}${stat}" data-block="${i}" style="left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;height:${pos.h}%;"></div>`;
        }).join('')}
      </div>
    `;
  }

  function renderSequenceProgress(current, total) {
    let dots = '';
    for (let i = 0; i < total; i++) {
      let cls = 'seq-dot ';
      if (i < current) cls += 'done';
      else if (i === current) cls += 'active';
      else cls += 'pending';
      dots += `<span class="${cls}"></span>`;
    }
    return `<div class="sequence-progress">${dots}</div>`;
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
      <div class="phase-title">Spatial Domain · Visuospatial Span</div>
      <h1 class="phase-headline grd">Corsi Blocks</h1>
      <p class="phase-sub">
        9 blocks. Some light up in sequence.
        <br>Click them in the <strong style="color:#00EEFF">same order</strong>.
        <br>Span grows with each level.
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
          <div class="mode-icon">🧱</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 sequences each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.CorsiBlocksExtraModes ? window.CorsiBlocksExtraModes.getModeDefinitions() : []).map(m => `
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
        Click blocks in order · <kbd>Space</kbd> to start classic
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

    if (window.CorsiBlocksExtraModes && window.CBAPI) {
      window.CorsiBlocksExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.CorsiBlocksExtraModes.start(m.id, window.CBAPI, S, H);
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
    state.maxSpanReached = CONFIG.startSpan;

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
    state.sequencesThisLevel = 0;
    state.currentSpan = spanForLevel(state.level);
    state.maxSpanReached = Math.max(state.maxSpanReached, state.currentSpan);

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, 'Span: ' + state.currentSpan + ' blocks', nextSequence);
  }

  function nextSequence() {
    if (state.sequencesThisLevel >= CONFIG.sequencesPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    state.sequencesThisLevel++;
    state.currentSequence = generateSequence(state.currentSpan);
    state.userIdx = 0;
    state.userStatus = {};

    showSequence();
  }

  function showSequence() {
    setPhase('show');

    const badge = `<div class="practice-badge">Sequence ${state.sequencesThisLevel} / ${CONFIG.sequencesPerLevel}</div>`;
    const hud = `
      <div class="span-indicator">
        <span class="si-val">${state.currentSpan}</span>
        <span class="si-label">BLOCKS</span>
      </div>
    `;

    render(renderBoard([], {}, badge, hud));

    let flashIdx = 0;
    const flashDur = flashDurationForLevel(state.level);
    const gapDur = CONFIG.baseGapDuration;

    function flashNext() {
      if (state.phase !== 'show' && state.phase !== 'countdown') return;
      if (flashIdx >= state.currentSequence.length) {
        push(showInput, 400);
        return;
      }

      const blockIdx = state.currentSequence[flashIdx];

      render(renderBoard([blockIdx], {}, badge, hud));
      if (S && S.blockLight) S.blockLight();

      push(() => {
        if (state.phase !== 'show') return;
        render(renderBoard([], {}, badge, hud));
        flashIdx++;
        push(flashNext, gapDur);
      }, flashDur);
    }

    push(flashNext, 500);
  }

  function showInput() {
    setPhase('input');
    state.sequenceStartTime = performance.now();

    const badge = `<div class="practice-badge">Sequence ${state.sequencesThisLevel} / ${CONFIG.sequencesPerLevel}</div>`;
    const hud = `
      <div class="span-indicator">
        <span class="si-val">${state.currentSpan}</span>
        <span class="si-label">BLOCKS</span>
      </div>
      ${renderSequenceProgress(0, state.currentSequence.length)}
    `;

    render(renderBoard([], {}, badge, hud));
    wireBlocks();
  }

  function wireBlocks() {
    elContent.querySelectorAll('.corsi-block').forEach(b => {
      b.addEventListener('click', () => handleBlockClick(parseInt(b.dataset.block, 10)));
    });
  }

  function handleBlockClick(idx) {
    if (state.phase !== 'input') return;

    const expected = state.currentSequence[state.userIdx];
    const badge = `<div class="practice-badge">Sequence ${state.sequencesThisLevel} / ${CONFIG.sequencesPerLevel}</div>`;
    const hud = `
      <div class="span-indicator">
        <span class="si-val">${state.currentSpan}</span>
        <span class="si-label">BLOCKS</span>
      </div>
      ${renderSequenceProgress(state.userIdx, state.currentSequence.length)}
    `;

    if (idx === expected) {
      state.userStatus[idx] = 'correct';
      state.userIdx++;

      if (S && S.blockTap) S.blockTap();

      render(renderBoard([], state.userStatus, badge, hud));
      wireBlocks();

      if (state.userIdx >= state.currentSequence.length) {
        // Success
        handleSequenceSuccess();
      }
    } else {
      // Wrong
      state.userStatus[idx] = 'wrong';
      if (S) S.miss();
      showFeedbackFlash(false);
      haptic('wrong');
      render(renderBoard([], state.userStatus, badge, hud));
      handleSequenceFail();
    }
  }

  function handleSequenceSuccess() {
    const rt = performance.now() - state.sequenceStartTime;

    state.levelCorrect++;
    state.levelTotal++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    if (rt >= CONFIG.rtMin && rt <= CONFIG.rtMax) state.allRTs.push(rt);
    state.levelTotalTime += rt;

    state.totalScore += CONFIG.correctBase + (state.streak - 1) * CONFIG.streakBonus;
    state.totalScore += state.currentSpan * CONFIG.spanBonus;

    if (S) S.hit();
    showFeedbackFlash(true);
    haptic('correct');
    setPhase('correct');

    push(() => {
      if (state.sequencesThisLevel >= CONFIG.sequencesPerLevel) endLevel();
      else nextSequence();
    }, 600);
  }

  function handleSequenceFail() {
    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    setPhase('wrong');

    push(() => {
      if (state.lives <= 0) completeGame();
      else if (state.sequencesThisLevel >= CONFIG.sequencesPerLevel) endLevel();
      else nextSequence();
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
      span: state.currentSpan
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} sequences correct at span ${state.currentSpan}</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Next span: ' + spanForLevel(state.level + 1) + ' blocks' : 'You reached the top!'}</p>
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
      maxSpan: state.maxSpanReached
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
    if (state.maxSpanReached >= 7) interpretation = 'Exceptional visuospatial span — top 10% of adults.';
    else if (state.maxSpanReached >= 5) interpretation = 'Strong visuospatial span.';
    else if (state.maxSpanReached >= 3) interpretation = 'Average — normal range.';
    else interpretation = 'Visuospatial span below typical range.';

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
        <div class="stat-card"><div class="stat-label">MAX SPAN</div><div class="stat-value">${state.maxSpanReached}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="spatial-box">
        <strong>Visuospatial Working Memory Profile</strong>
        <br>
        Maximum span reached: <strong>${state.maxSpanReached}</strong> blocks
        <br>
        <span style="color:var(--cyan)">${interpretation}</span>
      </div>

      ${insightsHTML}

      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Max Span</div>
        <div class="history-chart" id="history-chart"></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">Try Again</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    push(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'maxSpan');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, medianRT,
        maxSpan: state.maxSpanReached, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'corsi-blocks', domain: 'spatial', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      maxSpan: state.maxSpanReached,
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
    state.currentSpan = CONFIG.startSpan;
    state.currentSequence = [];
    state.userIdx = 0;
    state.userStatus = {};
    state.sequencesThisLevel = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.maxSpanReached = CONFIG.startSpan;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[CorsiBlocks] Container not found'); return; }

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
    if (state.phase === 'show' || state.phase === 'input' || state.phase === 'countdown') {
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
  window.CBAPI = {
    CONFIG,
    state,
    BLOCK_POSITIONS,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateSequence,
    spanForLevel,
    flashDurationForLevel,
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

  window.CorsiBlocksGame = {
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