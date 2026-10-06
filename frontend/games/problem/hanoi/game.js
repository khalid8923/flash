/* ═══════════════════════════════════════════════════════════
   FLASH — Tower of Hanoi v1.0
   Simon (1975) · Recursive Planning · Problem Solving
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Pegs + Disks · Move validation · Optimal solver ·
             Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.HanoiHelpers;
  const S = window.HanoiSounds;
  const STAGES = window.HanoiStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[Hanoi] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('hanoi', STAGES, {
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
    puzzlesPerLevel: 2,
    baseTime: 90000,
    minTime: 40000,
    timeStepPerLevel: 3000,
    correctBase: 200,
    streakBonus: 60,
    timeBonusMax: 150,
    movePenalty: 15,
    rtMin: 500,
    rtMax: 600000,
    diskColors: [
      '#FF4D6D', '#FF9F1C', '#FFD60A',
      '#00FF96', '#00EEFF', '#9D4EDD', '#FF0077'
    ]
  };

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    pegs: [[], [], []],
    numDisks: 3,
    moves: 0,
    selectedPeg: -1,
    optimalMoves: 0,
    puzzleStartTime: 0,
    puzzleIndex: 0,
    timeLimit: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidMoves: 0,
    optimalCount: 0,
    totalSolved: 0,
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

  /* ═══ HANOI LOGIC ═══ */
  function setupPegs(numDisks) {
    const pegs = [[], [], []];
    for (let i = numDisks; i >= 1; i--) pegs[0].push(i);
    return pegs;
  }

  function disksForLevel(level) {
    if (level <= 2) return 3;
    if (level <= 4) return 4;
    if (level <= 7) return 5;
    if (level <= 11) return 6;
    return 7;
  }

  function canMove(pegs, from, to) {
    if (from === to) return false;
    if (from < 0 || from > 2 || to < 0 || to > 2) return false;
    const fp = pegs[from], tp = pegs[to];
    if (fp.length === 0) return false;
    if (tp.length === 0) return true;
    return fp[fp.length - 1] < tp[tp.length - 1];
  }

  function isWin(pegs, numDisks) {
    return pegs[2].length === numDisks;
  }

  function countOptimalMoves(numDisks) {
    return Math.pow(2, numDisks) - 1;
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
    ex.innerHTML = `<div class="explanation-title">Analysis</div><div class="explanation-text">${puzzle.explanation}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ RENDER BOARD ═══ */
  function renderBoard() {
    const optimal = state.optimalMoves;
    const moves = state.moves;
    const moveClass = moves === optimal ? 'good' : (moves > optimal * 1.8 ? 'bad' : 'warn');

    return `
      ${renderProgressDots()}
      <div class="trial-counter">
        Puzzle <span class="current">${state.puzzleIndex}</span>
        <span class="total"> / ${CONFIG.puzzlesPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level} · ${state.numDisks} disks</span>
      </div>

      <div class="move-info">
        <span class="mv">MOVES <span class="mv-num ${moveClass}">${moves}</span></span>
        <span class="mv">OPTIMAL <span class="mv-num good">${optimal}</span></span>
      </div>

      <div class="hanoi-board">
        ${state.pegs.map((peg, i) => {
          const disksHTML = peg.map((disk) => {
            const w = 34 + disk * 8;
            const color = CONFIG.diskColors[(disk - 1) % CONFIG.diskColors.length];
            return `<div class="disk" style="width:${w}px;background:${color}"><span class="disk-label">${disk}</span></div>`;
          }).join('');
          const selCls = state.selectedPeg === i ? ' selected' : '';
          return `
            <div class="peg-col${selCls}" data-peg="${i}">
              ${disksHTML}
              <div class="peg-col-label">${['A','B','C'][i]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function wirePegs() {
    elContent.querySelectorAll('.peg-col').forEach(peg => {
      peg.addEventListener('click', () => handlePegClick(parseInt(peg.dataset.peg, 10)));
    });
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
      <div class="phase-title">Problem Solving · Recursive Planning</div>
      <h1 class="phase-headline grd">Tower of Hanoi</h1>
      <p class="phase-sub">
        Move all disks from peg <strong style="color:#0FD9B4">A</strong> to peg
        <strong style="color:#0FD9B4">C</strong>.
        <br>Rules: one disk at a time · only top disk · never larger on smaller.
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
          <div class="mode-icon">🗼</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 2 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.HanoiExtraModes ? window.HanoiExtraModes.getModeDefinitions() : []).map(m => `
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
        Click a peg to select / move · <kbd>Space</kbd> to start classic
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

    if (window.HanoiExtraModes && window.HanoiAPI) {
      window.HanoiExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.HanoiExtraModes.start(m.id, window.HanoiAPI, S, H);
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
    state.invalidMoves = 0;
    state.optimalCount = 0;
    state.totalSolved = 0;

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
    showCountdown(3, 'Level ' + state.level, 'Plan your moves carefully', nextPuzzle);
  }

  function nextPuzzle() {
    if (state.puzzleIndex >= CONFIG.puzzlesPerLevel) { endLevel(); return; }

    setPhase('trial');
    state.puzzleIndex++;

    state.numDisks = disksForLevel(state.level);
    state.pegs = setupPegs(state.numDisks);
    state.moves = 0;
    state.selectedPeg = -1;
    state.optimalMoves = countOptimalMoves(state.numDisks);
    state.timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    render(renderBoard());
    wirePegs();

    state.puzzleStartTime = performance.now();
    startTimer(state.timeLimit);
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

  function handlePegClick(pegIdx) {
    if (state.phase !== 'trial') return;

    if (state.selectedPeg === -1) {
      // Nothing selected — try to select
      if (state.pegs[pegIdx].length > 0) {
        state.selectedPeg = pegIdx;
        const s = snd(); if (s && s.diskPick) s.diskPick();
        render(renderBoard());
        wirePegs();
      }
    } else if (state.selectedPeg === pegIdx) {
      // Deselect
      state.selectedPeg = -1;
      render(renderBoard());
      wirePegs();
    } else {
      // Try to move
      if (canMove(state.pegs, state.selectedPeg, pegIdx)) {
        const disk = state.pegs[state.selectedPeg].pop();
        state.pegs[pegIdx].push(disk);
        state.moves++;
        state.selectedPeg = -1;
        const s = snd(); if (s && s.diskPlace) s.diskPlace();
        haptic('correct');

        render(renderBoard());
        wirePegs();

        if (isWin(state.pegs, state.numDisks)) {
          handleWin();
        }
      } else {
        // Illegal move
        state.invalidMoves++;
        const s = snd(); if (s) s.miss();
        haptic('wrong');

        const el = elContent.querySelector(`[data-peg="${pegIdx}"]`);
        if (el) {
          el.classList.add('placed-wrong');
          setTimeout(() => el.classList.remove('placed-wrong'), 400);
        }

        state.selectedPeg = -1;
        render(renderBoard());
        wirePegs();
      }
    }
  }

  function handleWin() {
    clearAllTimeouts();
    const elapsed = performance.now() - state.puzzleStartTime;
    state.levelTotal++;
    state.levelCorrect++;
    state.totalSolved++;

    const validRT = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (validRT) state.allRTs.push(elapsed);

    const isOptimal = state.moves === state.optimalMoves;
    if (isOptimal) state.optimalCount++;

    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    // Score
    const baseScore = CONFIG.correctBase;
    const timeBonus = validRT ? Math.round((1 - elapsed / state.timeLimit) * CONFIG.timeBonusMax) : 0;
    const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
    const movePenalty = Math.max(0, (state.moves - state.optimalMoves)) * CONFIG.movePenalty;
    const optimalBonus = isOptimal ? 100 : 0;
    state.totalScore += baseScore + Math.max(0, timeBonus) + streakBonus + optimalBonus - movePenalty;

    const s = snd(); if (s) s.hit();
    showFeedbackFlash(true);

    setPhase('correct');
    const optimalMsg = isOptimal
      ? '<span style="color:#00FF96">Perfect — optimal moves!</span>'
      : `Solved in <strong>${state.moves}</strong> moves (optimal: ${state.optimalMoves})`;

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Solved!</h2>
      <p class="phase-sub">${optimalMsg}</p>
      <p class="phase-hint">${state.puzzleIndex < CONFIG.puzzlesPerLevel ? 'Next puzzle...' : 'Level complete'}</p>
    `);

    push(() => {
      if (state.puzzleIndex >= CONFIG.puzzlesPerLevel) endLevel();
      else nextPuzzle();
    }, 1400);
  }

  function handleTimeout() {
    if (state.phase !== 'trial') return;

    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    const s = snd(); if (s) s.miss();
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    render(`
      ${renderProgressDots()}
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF0077">Time's Up</h2>
      <p class="phase-sub">
        You didn't finish in time.
        <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
      </p>
    `);

    push(() => {
      if (state.lives <= 0) completeGame();
      else if (state.puzzleIndex >= CONFIG.puzzlesPerLevel) endLevel();
      else nextPuzzle();
    }, 1800);
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
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      optimalRate
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
    if (accuracy >= 80) interpretation = 'Exceptional planning — top 10% recursive reasoning.';
    else if (accuracy >= 65) interpretation = 'Strong recursive planning ability.';
    else if (accuracy >= 50) interpretation = 'Average — normal range.';
    else interpretation = 'Planning skills need more practice.';

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
        <strong>Problem-Solving Profile</strong>
        <br>
        Optimal solves: <strong>${state.optimalCount}</strong> / ${totalCorrect}
        <br>
        Invalid moves: <strong>${state.invalidMoves}</strong>
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
      gameId: 'hanoi', domain: 'problem', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      optimalRate,
      optimalCount: state.optimalCount,
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
    state.pegs = [[], [], []];
    state.numDisks = 3;
    state.moves = 0;
    state.selectedPeg = -1;
    state.puzzleIndex = 0;
    state.allRTs = [];
    state.invalidMoves = 0;
    state.optimalCount = 0;
    state.totalSolved = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[Hanoi] Container not found'); return; }

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

      // Keys 1/2/3 → pegs A/B/C
      if (state.phase === 'trial') {
        if (e.key === '1') { e.preventDefault(); handlePegClick(0); }
        if (e.key === '2') { e.preventDefault(); handlePegClick(1); }
        if (e.key === '3') { e.preventDefault(); handlePegClick(2); }
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
  window.HanoiAPI = {
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

    setupPegs,
    canMove,
    isWin,
    countOptimalMoves,
    disksForLevel,
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

  window.HanoiGame = {
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