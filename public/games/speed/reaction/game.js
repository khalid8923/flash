/* ═══════════════════════════════════════════════════════════
   FLASH — Reaction v1.0
   Speed Domain · Simple Reaction Time
   Click the moment the screen turns green.
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.ReactionHelpers;
  const S = window.ReactionSounds;
  const STAGES = window.ReactionStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[Reaction] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('reaction', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══ CONFIG ═══ */
  const CONFIG = {
    roundsPerSession: 5,
    minDelay: 1500,
    maxDelay: 4500,
    delayStepPerRound: 250,
    rtMin: 50,
    rtMax: 3000,
    ranks: {
      elite:   200,
      good:    280,
      average: 400
    }
  };

  /* ═══ STATE ═══ */
  const state = {
    phase: 'idle',
    mode: 'idle',
    round: 0,
    currentRound: null,
    rtList: [],
    history: [],
    falseStarts: 0,
    fastestRT: 0,
    slowestRT: 0,
    allRTs: [],
    timeoutIds: [],
    goTimeoutId: null,
    earlyClickHandler: null,
    realClickHandler: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elRound, elLast, elBest, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.goTimeoutId) { clearTimeout(state.goTimeoutId); state.goTimeoutId = null; }
    if (state.earlyClickHandler && elStage) {
      elStage.removeEventListener('click', state.earlyClickHandler);
      state.earlyClickHandler = null;
    }
    if (state.realClickHandler && elStage) {
      elStage.removeEventListener('click', state.realClickHandler);
      state.realClickHandler = null;
    }
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

  function rankFor(rt) {
    if (rt <= 0) return null;
    if (rt < CONFIG.ranks.elite)   return 'elite';
    if (rt < CONFIG.ranks.good)    return 'good';
    if (rt < CONFIG.ranks.average) return 'average';
    return 'slow';
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
      FS.onChange('highContrast',  () => FS.applyToDOM());
      FS.onChange('soundEnabled',  (v) => { if (S) S.setEnabled(v); });
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
    if (elStage) elStage.dataset.phase = p;
    const btn = $('back-btn');
    if (btn) {
      if (p === 'idle' && state.mode === 'idle') btn.classList.add('hidden');
      else btn.classList.remove('hidden');
    }
  }
  function render(html) { if (elContent) elContent.innerHTML = html; }
  function setTimer(pct, level = 'normal') {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTimerFill.classList.remove('warning', 'danger');
    if (level === 'warning') elTimerFill.classList.add('warning');
    if (level === 'danger')  elTimerFill.classList.add('danger');
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = 'feedback-flash ' + (hit ? 'hit' : 'miss');
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 450);
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
        push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER STATES (used by classic + extra modes)
     ═══════════════════════════════════════════════════════════ */

  /* WAITING (red) */
  function renderWaitingState(headerHTML) {
    return `
      ${headerHTML || ''}
      <div class="rx-signal rx-wait">
        <div class="rx-signal-icon">⏳</div>
        <div class="rx-signal-text">WAIT…</div>
      </div>
      <p class="phase-hint">Wait for <strong style="color:#00FF96">GREEN</strong>. Click early = penalty.</p>
    `;
  }

  /* GO (green) */
  function renderGoState(headerHTML) {
    return `
      ${headerHTML || ''}
      <div class="rx-signal rx-go">
        <div class="rx-signal-icon">⚡</div>
        <div class="rx-signal-text">CLICK!</div>
      </div>
    `;
  }

  /* RESULT (after each round) */
  function renderResultState(rt, headerHTML) {
    const rank = rankFor(rt);
    const rankLabel = rank ? rank.toUpperCase() : '—';
    return `
      ${headerHTML || ''}
      <div class="phase-title">Reaction Time</div>
      <div class="rx-rt-big">${rt}<span class="rx-rt-unit">ms</span></div>
      <div class="rx-rank ${rank || 'slow'}">${rankLabel}</div>
    `;
  }

  /* FALSE START */
  function renderFalseStartState(headerHTML) {
    return `
      ${headerHTML || ''}
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF3355">FALSE START</h2>
      <p class="phase-sub">You clicked before the screen turned green.</p>
      <div class="rx-rank slow">PENALTY</div>
    `;
  }

  /* History rendering */
  function renderHistory() {
    if (!state.history.length) return '';
    const items = state.history.map(h => {
      if (h.falseStart) return `<div class="rx-hist-dot foul">FOUL</div>`;
      const rank = rankFor(h.rt);
      let cls = 'slow';
      if (rank === 'elite') cls = 'elite';
      else if (rank === 'good') cls = 'good';
      else if (rank === 'average') cls = 'avg';
      return `<div class="rx-hist-dot ${cls}">${h.rt}ms</div>`;
    }).join('');
    return `<div class="rx-history-row">${items}</div>`;
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

    const pbMedian = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbFastest = pb.bestFastestRT < 99999 ? pb.bestFastestRT + ' ms' : '—';
    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';

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

    const extraModesHTML = (window.ReactionExtraModes
      ? window.ReactionExtraModes.getModeDefinitions() : []
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
      <div class="phase-title">Speed Domain · Simple Reaction Time</div>
      <h1 class="phase-headline grd">Reaction</h1>
      <p class="phase-sub">
        The screen turns <strong style="color:#FF3355">red</strong>,
        then <strong style="color:#00FF96">green</strong>.
        <br>Click <strong>the instant</strong> it turns green.
        <br>Elite: under <strong style="color:#FFD60A">200ms</strong>.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbMedian}</div></div>
          <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value" style="font-size:16px">${pbFastest}</div></div>
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">⚡</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">5 rounds · Measure simple RT</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${extraModesHTML}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        Click anywhere on green · <kbd>Space</kbd> to start
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

    if (window.ReactionExtraModes && window.RXAPI) {
      window.ReactionExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.ReactionExtraModes.start(m.id, window.RXAPI, S, H);
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CLASSIC MODE
     ═══════════════════════════════════════════════════════════ */
  function startClassic() {
    state.mode = 'classic';
    state.round = 0;
    state.rtList = [];
    state.history = [];
    state.falseStarts = 0;
    state.fastestRT = 0;
    state.slowestRT = 0;
    state.allRTs = [];

    elRound.textContent = '1';
    elLast.textContent = '—';
    elBest.textContent = '—';

    setPhase('countdown');
    showCountdown(3, 'Get Ready', 'Wait for GREEN then click', startRound);
  }

  function startRound() {
    if (state.round >= CONFIG.roundsPerSession) { completeGame(); return; }

    state.round++;
    elRound.textContent = String(state.round);

    const minDelay = CONFIG.minDelay;
    const maxDelay = CONFIG.maxDelay;
    const delay = randInt(minDelay, maxDelay);

    state.currentRound = {
      delay,
      startTime: 0,
      goTime: 0,
      settled: false,
      falseStart: false
    };

    // Phase 1: WAITING (red)
    setPhase('waiting');
    render(renderWaitingState(buildHeader()));

    if (S && S.readyBeep) S.readyBeep();

    // Register early-click handler
    state.earlyClickHandler = (e) => {
      if (state.currentRound.settled) return;
      if (e.target.closest('.g-header')) return;
      if (e.target.closest('.g-footer')) return;
      if (e.target.closest('button')) return;

      // FALSE START
      state.currentRound.settled = true;
      state.currentRound.falseStart = true;
      if (state.goTimeoutId) { clearTimeout(state.goTimeoutId); state.goTimeoutId = null; }
      if (state.earlyClickHandler) {
        elStage.removeEventListener('click', state.earlyClickHandler);
        state.earlyClickHandler = null;
      }
      if (S && S.falseStart) S.falseStart();
      haptic('wrong');
      showFeedbackFlash(false);

      state.falseStarts++;
      state.history.push({ rt: 0, falseStart: true });

      setPhase('result');
      render(renderFalseStartState(buildHeader()));

      push(startRound, 1500);
    };
    elStage.addEventListener('click', state.earlyClickHandler);

    // Phase 2: GO (green) after random delay
    state.goTimeoutId = setTimeout(() => {
      if (state.currentRound.settled) return;
      if (state.earlyClickHandler) {
        elStage.removeEventListener('click', state.earlyClickHandler);
        state.earlyClickHandler = null;
      }

      state.currentRound.goTime = performance.now();
      setPhase('go');
      render(renderGoState(buildHeader()));
      if (S && S.goSignal) S.goSignal();

      // Register real-click handler
      state.realClickHandler = (e) => {
        if (state.currentRound.settled) return;
        if (e.target.closest('.g-header')) return;
        if (e.target.closest('.g-footer')) return;
        if (e.target.closest('button')) return;

        state.currentRound.settled = true;
        const rt = Math.round(performance.now() - state.currentRound.goTime);

        if (state.realClickHandler) {
          elStage.removeEventListener('click', state.realClickHandler);
          state.realClickHandler = null;
        }

        // Validate RT (anti-cheat)
        const isValid = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;
        if (!isValid) {
          // Invalid — treat as false start
          state.falseStarts++;
          state.history.push({ rt: 0, falseStart: true });
          if (S && S.falseStart) S.falseStart();
          haptic('wrong');
          showFeedbackFlash(false);
          setPhase('result');
          render(renderFalseStartState(buildHeader()));
          push(startRound, 1500);
          return;
        }

        // Valid RT
        state.rtList.push(rt);
        state.allRTs.push(rt);
        state.history.push({ rt, falseStart: false });

        if (state.fastestRT === 0 || rt < state.fastestRT) state.fastestRT = rt;
        if (rt > state.slowestRT) state.slowestRT = rt;

        elLast.textContent = rt + 'ms';
        if (state.fastestRT > 0) elBest.textContent = state.fastestRT + 'ms';

        // Sound
        if (S) {
          if (rt < 200 && S.fastHit) S.fastHit();
          else S.hit();
        }
        haptic('correct');
        showFeedbackFlash(true);

        setPhase('result');
        render(renderResultState(rt, buildHeader()));

        push(startRound, 1200);
      };
      elStage.addEventListener('click', state.realClickHandler);
    }, delay);
    state.timeoutIds.push(state.goTimeoutId);
  }

  function buildHeader() {
    return `
      <div class="trial-counter">
        Round <span class="current">${state.round}</span>
        <span class="total"> / ${CONFIG.roundsPerSession}</span>
      </div>
      ${renderHistory()}
    `;
  }

  /* ═══ COMPLETE GAME ═══ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const validRounds = state.rtList.length;
    const totalRounds = CONFIG.roundsPerSession;
    const accuracy = Math.round((validRounds / totalRounds) * 100);

    const medianRT = H.median(state.rtList);
    const rtv = H.stdDev(state.rtList);
    const rcs = H.rcs(validRounds, state.rtList);

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      fastestRT: state.fastestRT,
      slowestRT: state.slowestRT
    };

    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', { medianRT, accuracy });
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

    // Rank classification
    const overallRank = rankFor(medianRT);
    let rankText = '';
    if (overallRank === 'elite')   rankText = 'ELITE — Top-tier reflex';
    else if (overallRank === 'good')    rankText = 'GOOD — Well above average';
    else if (overallRank === 'average') rankText = 'AVERAGE — Normal range';
    else if (overallRank === 'slow')    rankText = 'SLOW — Practice can improve';
    else rankText = 'No valid rounds';

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    if (S) S.victory();

    render(`
      <div class="phase-title">Session Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value">${state.fastestRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>

      <div class="rt-profile-box">
        <strong>Reaction Time Profile</strong>
        <br>
        Overall rank: <strong>${rankText}</strong>
        <br>
        Slowest round: <strong>${state.slowestRT || '—'} ms</strong> · Valid rounds: <strong>${validRounds}/${totalRounds}</strong>
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
        mode: 'classic',
        medianRT,
        accuracy,
        rtv,
        fastestRT: state.fastestRT,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'reaction',
      domain: 'speed',
      mode: 'classic',
      accuracy,
      score: validRounds * 100,
      medianRT,
      rtv,
      rcs,
      fastestRT: state.fastestRT,
      slowestRT: state.slowestRT,
      totalTrials: validRounds,
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
    state.round = 0;
    state.rtList = [];
    state.history = [];
    state.falseStarts = 0;
    state.fastestRT = 0;
    state.slowestRT = 0;
    state.allRTs = [];
    state.currentRound = null;

    if (elRound) elRound.textContent = '1';
    if (elLast)  elLast.textContent = '—';
    if (elBest)  elBest.textContent = '—';

    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!root) { console.error('[Reaction] Container not found'); return; }

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
            <span class="g-meta-item"><span class="g-meta-label">ROUND</span><span class="g-meta-value" id="round-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">LAST</span><span class="g-meta-value" id="last-display">—</span></span>
            <span class="g-meta-item"><span class="g-meta-label">BEST</span><span class="g-meta-value" id="best-display">—</span></span>
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
    elRound     = $('round-display');
    elLast      = $('last-display');
    elBest      = $('best-display');
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
        // During waiting / go / result — Space acts as a click
        if (state.phase === 'waiting' || state.phase === 'go') {
          if (elStage) elStage.click();
        }
        return;
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'waiting' || state.phase === 'go' || state.phase === 'countdown' || state.phase === 'result') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    if (window.ReactionExtraModes && window.ReactionExtraModes.abort) {
      window.ReactionExtraModes.abort();
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
  window.RXAPI = {
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

    renderWaitingState,
    renderGoState,
    renderResultState,
    renderFalseStartState,

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

  window.ReactionGame = {
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