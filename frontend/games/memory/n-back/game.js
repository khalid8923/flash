/* ═══════════════════════════════════════════════════════════
   FLASH — N-Back v1.0
   Jaeggi et al. (2008) · PNAS · Working Memory Span
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: 3×3 grid · Position N-Back · d' (Signal Detection) ·
             Adaptive N level · Block analysis · SPACE key ·
             Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.NBackHelpers;
  const S = window.NBackSounds;
  const STAGES = window.NBackStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[NBack] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('n-back', STAGES, {
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
    trialsPerLevel: 25,
    matchRate: 0.28,
    baseStimDuration: 600,
    minStimDuration: 400,
    baseISI: 2200,
    minISI: 1500,
    passHits: 3,
    passFalseAlarms: 2,
    correctBase: 60,
    streakBonus: 20,
    hitBonus: 40,
    correctRejectionBonus: 15,
    falseAlarmPenalty: 50,
    missPenalty: 40,
    rtMin: 150,
    rtMax: 2500,
    maxNLevel: 5
  };

  /* ═══ SEQUENCE GENERATOR ═══ */
  function generateSequence(nLevel, length, matchRate) {
    const totalPositions = 9;
    const seq = [];

    // First N trials — no match possible
    for (let i = 0; i < nLevel && i < length; i++) {
      seq.push({
        position: randInt(0, totalPositions - 1),
        isMatch: false
      });
    }

    const remaining = length - nLevel;
    const matchCount = Math.round(remaining * matchRate);

    // Pick unique match indices
    const matchIndices = [];
    let guard = 0;
    while (matchIndices.length < matchCount && guard < 1000) {
      guard++;
      const idx = nLevel + randInt(0, remaining - 1);
      if (!matchIndices.includes(idx)) matchIndices.push(idx);
    }

    for (let i = nLevel; i < length; i++) {
      let pos;
      if (matchIndices.includes(i)) {
        pos = seq[i - nLevel].position;
      } else {
        // Avoid accidental n-back match; also try to avoid n+1-back match
        let attempts = 0;
        do {
          pos = randInt(0, totalPositions - 1);
          attempts++;
        } while (attempts < 50 && (
          pos === seq[i - nLevel].position ||
          (i + 1 < length && i - nLevel + 1 >= 0 && seq[i - nLevel + 1] && seq[i - nLevel + 1].position === pos) ||
          (i - nLevel + nLevel < length && seq[i - nLevel + nLevel] && seq[i - nLevel + nLevel].position === pos)
        ));
      }
      seq.push({
        position: pos,
        isMatch: matchIndices.includes(i)
      });
    }

    return seq;
  }

  function stimDurationForLevel(level) {
    return Math.max(
      CONFIG.minStimDuration,
      CONFIG.baseStimDuration - (level - 1) * 15
    );
  }

  function isiForLevel(level) {
    return Math.max(
      CONFIG.minISI,
      CONFIG.baseISI - (level - 1) * 50
    );
  }

  function nLevelForSession(level, currentN) {
    // N starts at 1, increases based on successful levels
    if (level <= 2) return 1;
    if (level <= 5) return Math.max(1, currentN);
    return Math.max(1, currentN);
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    nLevel: 1,
    maxNLevelReached: 1,
    sequence: [],
    trialIdx: 0,
    currentTrial: null,
    responded: false,
    stimStartTime: 0,
    // Counters per level
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    hitRTs: [],
    // Block RTs (for analysis)
    block1RTs: [],
    block3RTs: [],
    // Level stats
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    // Cumulative
    results: [],
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    timeoutIds: [],
    stimTimeoutId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.stimTimeoutId) { clearTimeout(state.stimTimeoutId); state.stimTimeoutId = null; }
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

  /* ═══ GRID RENDER ═══ */
  function renderGrid(activePos, badgeHTML, hudHTML, armed) {
    const cells = Array.from({ length: 9 }, (_, i) => {
      const lit = i === activePos ? ' lit' : '';
      return `<div class="grid-cell${lit}"></div>`;
    }).join('');

    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="n-indicator">
        <span class="n-val">${state.nLevel}</span>
        <span class="n-label">BACK</span>
      </div>
      <div class="n-back-grid">${cells}</div>
      <div class="match-row">
        <button class="match-btn ${armed ? 'armed' : ''}" id="match-btn" ${armed ? '' : 'disabled'}>
          <span class="mb-icon">🎯</span>
          MATCH
        </button>
      </div>
    `;
  }

  function wireMatchButton() {
    const btn = $('match-btn');
    if (btn && !btn.disabled) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleResponse();
      });
    }
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
    const pbN   = pb.bestNLevel > 0 ? pb.bestNLevel + '-back' : '—';
    const pbDP  = pb.bestDPrime > 0 ? pb.bestDPrime : '—';

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
      <div class="phase-title">Memory Domain · Working Memory</div>
      <h1 class="phase-headline grd">N-Back</h1>
      <p class="phase-sub">
        A cell lights up. Press <strong style="color:#00EEFF">MATCH</strong>
        if the current position equals the position from
        <strong style="color:#00EEFF">N steps back</strong>.
        <br>N grows as you succeed.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(660px,94vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">ACC</div><div class="stat-value" style="font-size:15px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value" style="font-size:15px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">N-LEVEL</div><div class="stat-value" style="font-size:15px">${pbN}</div></div>
          <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value" style="font-size:15px">${pbDP}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🧠</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 25 trials each · 3 lives</div>
          <div class="mode-meta">→ Adaptive N-back</div>
        </div>
        ${(window.NBackExtraModes ? window.NBackExtraModes.getModeDefinitions() : []).map(m => `
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
        <kbd>SPACE</kbd> for match · <kbd>Space</kbd> in idle starts classic
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

    if (window.NBackExtraModes && window.NBAPI) {
      window.NBackExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.NBackExtraModes.start(m.id, window.NBAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.nLevel = 1;
    state.maxNLevelReached = 1;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;

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
    state.trialIdx = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.hitRTs = [];
    state.block1RTs = [];
    state.block3RTs = [];

    state.sequence = generateSequence(
      state.nLevel,
      CONFIG.trialsPerLevel,
      CONFIG.matchRate
    );

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(
      3,
      'Level ' + state.level,
      state.nLevel + '-Back · 25 trials',
      nextTrial
    );
  }

  function nextTrial() {
    if (state.trialIdx >= CONFIG.trialsPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    state.trialIdx++;
    state.responded = false;

    const trial = state.sequence[state.trialIdx - 1];
    state.currentTrial = trial;

    const isi = isiForLevel(state.level);
    const stimDur = stimDurationForLevel(state.level);

    // Show blank grid during ISI
    setPhase('trial');
    render(renderGrid(-1, renderProgressDots(), `
      <div class="trial-info">
        <span class="ti">TRIAL <span class="ti-val">${state.trialIdx}/${CONFIG.trialsPerLevel}</span></span>
        <span class="ti">HITS <span class="ti-val good">${state.hits}</span></span>
        <span class="ti">MISS <span class="ti-val bad">${state.misses}</span></span>
        <span class="ti">FA <span class="ti-val warn">${state.falseAlarms}</span></span>
      </div>
    `, false));

    push(() => {
      // Show lit cell
      setPhase('stimulus');
      state.stimStartTime = performance.now();
      render(renderGrid(trial.position, renderProgressDots(), `
        <div class="trial-info">
          <span class="ti">TRIAL <span class="ti-val">${state.trialIdx}/${CONFIG.trialsPerLevel}</span></span>
          <span class="ti">HITS <span class="ti-val good">${state.hits}</span></span>
          <span class="ti">MISS <span class="ti-val bad">${state.misses}</span></span>
          <span class="ti">FA <span class="ti-val warn">${state.falseAlarms}</span></span>
        </div>
      `, true));
      wireMatchButton();

      if (S && S.cellLight) S.cellLight();

      // Auto-hide after stim duration
      state.stimTimeoutId = setTimeout(() => {
        state.stimTimeoutId = null;
        if (state.responded) return;
        evaluateNoResponse();
      }, stimDur);
    }, isi);
  }

  function evaluateNoResponse() {
    if (state.responded) return;
    state.responded = true;

    const isMatch = state.currentTrial.isMatch;

    if (isMatch) {
      // Miss
      state.misses++;
      state.levelTotal++;
      state.streak = 0;
      elStreak.textContent = '0';
      showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');
      push(nextTrial, 400);
    } else {
      // Correct rejection
      state.correctRejections++;
      state.levelTotal++;
      state.levelCorrect++;
      state.totalScore += CONFIG.correctRejectionBonus;
      push(nextTrial, 250);
    }
  }

  function handleResponse() {
    if (state.phase !== 'stimulus') return;
    if (state.responded) return;
    if (!state.currentTrial) return;
    state.responded = true;

    if (state.stimTimeoutId) { clearTimeout(state.stimTimeoutId); state.stimTimeoutId = null; }

    const rt = performance.now() - state.stimStartTime;
    const isMatch = state.currentTrial.isMatch;
    const isValid = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;

    if (isMatch) {
      // Hit
      state.hits++;
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      elStreak.textContent = String(state.streak);

      if (isValid) {
        state.hitRTs.push(rt);
        state.allRTs.push(rt);
        // Block tracking
        const blockSize = Math.floor(CONFIG.trialsPerLevel / 3);
        if (state.trialIdx <= blockSize) state.block1RTs.push(rt);
        else if (state.trialIdx > blockSize * 2) state.block3RTs.push(rt);
      }

      state.levelTotalTime += rt;
      const bonus = CONFIG.hitBonus + (state.streak - 1) * CONFIG.streakBonus;
      state.totalScore += CONFIG.correctBase + bonus;

      showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 350);
    } else {
      // False alarm
      state.falseAlarms++;
      state.streak = 0;
      elStreak.textContent = '0';
      state.totalScore = Math.max(0, state.totalScore - CONFIG.falseAlarmPenalty);
      showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');
      push(nextTrial, 400);
    }
  }

  function endLevel() {
    clearAllTimeouts();
    const totalTrials = CONFIG.trialsPerLevel;
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    // Pass criterion (Jaeggi-style): hits >= 3 AND falseAlarms <= 2
    const passed = state.hits >= CONFIG.passHits && state.falseAlarms <= CONFIG.passFalseAlarms;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed,
      hits: state.hits,
      falseAlarms: state.falseAlarms,
      nLevel: state.nLevel
    });

    if (passed) {
      // Advance N if hits were strong
      let advanced = false;
      if (state.hits >= 4 && state.falseAlarms <= 2 && state.nLevel < CONFIG.maxNLevel) {
        state.nLevel++;
        state.maxNLevelReached = Math.max(state.maxNLevelReached, state.nLevel);
        advanced = true;
      }

      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      const advanceMsg = advanced
        ? `<span style="color:#00FF96">N increased to ${state.nLevel}-back!</span>`
        : `Staying at ${state.nLevel}-back`;

      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.hits} hits · ${state.falseAlarms} FA
          <br>${advanceMsg}
        </p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);

      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else completeGame();
      }, 1800);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      const s = snd(); if (s) s.gameOver();

      // Drop N if struggling
      let dropped = false;
      if (state.hits < 2 && state.nLevel > 1) {
        state.nLevel--;
        dropped = true;
      }

      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">
          ${state.hits} hits · ${state.falseAlarms} FA
          <br>Need ${CONFIG.passHits} hits AND ≤ ${CONFIG.passFalseAlarms} FA.
          ${dropped ? `<br><span style="color:#FFD60A">N reduced to ${state.nLevel}-back</span>` : ''}
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
        </p>
      `);

      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 2200);
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
    const dPrime = H.dPrime(state.hits, state.misses, state.falseAlarms, state.correctRejections);

    // Vigilance/decay metric: block3 median - block1 median
    let decay = null;
    if (state.block1RTs.length >= 2 && state.block3RTs.length >= 2) {
      decay = H.median(state.block3RTs) - H.median(state.block1RTs);
    }

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      dPrime, maxNLevel: state.maxNLevelReached
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
    if (dPrime >= 3) interpretation = 'Exceptional working memory — elite span.';
    else if (dPrime >= 2) interpretation = 'Strong working memory.';
    else if (dPrime >= 1) interpretation = 'Average — normal range.';
    else interpretation = 'Working memory load is exceeding capacity.';

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    let decayMsg = '';
    if (decay !== null) {
      if (decay > 200) decayMsg = '<br><span style="color:#FF0077">Memory trace faded by end of session.</span>';
      else if (decay < 50) decayMsg = '<br><span style="color:#00FF96">Stable performance across the session.</span>';
    }

    if (S) S.victory();

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">MAX N</div><div class="stat-value">${state.maxNLevelReached}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
      </div>

      <div class="mem-box">
        <strong>Working Memory Profile</strong>
        <br>
        Hits: <strong>${state.hits}</strong> · Misses: <strong>${state.misses}</strong>
        · False Alarms: <strong>${state.falseAlarms}</strong>
        <br>
        ${interpretation}${decayMsg}
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
        dPrime, maxNLevel: state.maxNLevelReached, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'n-back', domain: 'memory', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, dPrime,
      maxNLevel: state.maxNLevelReached,
      hits: state.hits, misses: state.misses, falseAlarms: state.falseAlarms,
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
    state.nLevel = 1;
    state.maxNLevelReached = 1;
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.sequence = [];
    state.trialIdx = 0;
    state.currentTrial = null;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.hitRTs = [];
    state.block1RTs = [];
    state.block3RTs = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[NBack] Container not found'); return; }

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

      if (e.code === 'Space') {
        e.preventDefault();

        if (state.phase === 'idle' && state.mode === 'idle') {
          startClassic();
          return;
        }
        if (state.phase === 'gameover') {
          resetGame();
          return;
        }
        if (state.phase === 'stimulus') {
          handleResponse();
          return;
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'stimulus' || state.phase === 'countdown') {
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
  window.NBAPI = {
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

    generateSequence,
    stimDurationForLevel,
    isiForLevel,
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

  window.NBackGame = {
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