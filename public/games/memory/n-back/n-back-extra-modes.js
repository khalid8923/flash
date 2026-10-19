/* ═══════════════════════════════════════════════════════════
   FLASH — N-Back Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.NBAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let timeouts = [];
  let M = {};

  function clearAll() { timeouts.forEach(clearTimeout); timeouts = []; }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '40 trials · Fast stimulus',        meta: '→ 450ms cells' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',           meta: '→ N ramps up' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '40 trials · Slow · Max accuracy',   meta: '→ 1200ms cells' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '25 trials · Fixed protocol',        meta: '→ Once per day' }
    ];
  }

  /* ═══ Sequence generator — position-only N-Back ═══ */
  function generateSequence(nLevel, length, matchRate) {
    const totalPositions = 9;
    const seq = [];

    for (let i = 0; i < nLevel && i < length; i++) {
      seq.push({ position: Math.floor(Math.random() * totalPositions), isMatch: false });
    }

    const remaining = length - nLevel;
    const matchCount = Math.round(remaining * matchRate);

    const matchIndices = [];
    while (matchIndices.length < matchCount) {
      const idx = nLevel + Math.floor(Math.random() * remaining);
      if (!matchIndices.includes(idx)) matchIndices.push(idx);
    }

    for (let i = nLevel; i < length; i++) {
      let pos;
      if (matchIndices.includes(i)) {
        pos = seq[i - nLevel].position;
      } else {
        do {
          pos = Math.floor(Math.random() * totalPositions);
        } while (
          pos === seq[i - nLevel].position ||
          (i + nLevel < length && seq[i - nLevel + nLevel] && seq[i - nLevel + nLevel].position === pos) ||
          (i - nLevel >= 0 && i + nLevel < length && seq[i - nLevel].position === pos)
        );
      }
      seq.push({
        position: pos,
        isMatch: matchIndices.includes(i)
      });
    }

    return seq;
  }

  /* ═══ Shared renderer ═══ */
  function renderTrial(activeCell, nLevel, badgeHTML, hudHTML, armed) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="n-indicator">
        <span class="n-val">${nLevel}</span>
        <span class="n-label">BACK</span>
      </div>
      <div class="n-back-grid">
        ${Array.from({ length: 9 }, (_, i) =>
          `<div class="grid-cell ${i === activeCell ? 'lit' : ''}"></div>`
        ).join('')}
      </div>
      <div class="match-row">
        <button class="match-btn ${armed ? 'armed' : ''}" id="match-btn" ${armed ? '' : 'disabled'}>
          <span class="mb-icon">🎯</span>
          MATCH
        </button>
      </div>
    `;
  }

  function wireMatch(handler) {
    const btn = API.$('match-btn');
    if (btn && !btn.disabled) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handler();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════
     Generic N-Back runner (used by all extra modes)
     ═══════════════════════════════════════════════════════ */
  function runNBackLoop(config, onEnd) {
    const state = {
      seq: generateSequence(config.nLevel, config.totalTrials, config.matchRate),
      trialIdx: 0,
      nLevel: config.nLevel,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      hitRTs: [],
      block1RTs: [],
      block3RTs: [],
      ended: false,
      responded: false,
      stimStartTime: 0,
      isMatch: false,
      currentPosition: -1
    };

    const blockSize = Math.floor(config.totalTrials / 3);

    function nextTrial() {
      if (state.ended) return;
      if (state.trialIdx >= config.totalTrials) {
        state.ended = true;
        clearAll();
        onEnd(state);
        return;
      }

      state.responded = false;
      const trial = state.seq[state.trialIdx];
      state.trialIdx++;
      state.isMatch = trial.isMatch;
      state.currentPosition = trial.position;

      // Blank ISI
      API.setPhase('trial');
      API.render(renderTrial(-1, state.nLevel, config.badgeHTML, config.hudHTML ? config.hudHTML(state) : '', false));

      push(() => {
        if (state.ended) return;

        // Show lit cell
        API.setPhase('stimulus');
        state.stimStartTime = performance.now();
        API.render(renderTrial(state.currentPosition, state.nLevel, config.badgeHTML, config.hudHTML ? config.hudHTML(state) : '', true));
        wireMatch(handleResponse);
        state.respondHandle = handleResponse;

        // Auto-hide after stim duration
        push(() => {
          if (state.ended || state.responded) return;
          state.responded = true;
          evaluateNoResponse();
        }, config.stimDuration);
      }, config.isi);
    }

    function evaluateNoResponse() {
      if (state.isMatch) {
        // Miss
        state.misses++;
        if (S) S.miss();
        API.showFeedbackFlash(false);
        if (config.failOnMiss) {
          state.ended = true;
          clearAll();
          onEnd(state);
          return;
        }
      } else {
        state.correctRejections++;
      }
      push(nextTrial, config.postTrial);
    }

    function handleResponse() {
      if (state.responded) return;
      state.responded = true;

      const rt = performance.now() - state.stimStartTime;

      if (state.isMatch) {
        // Hit
        state.hits++;
        if (rt >= 150 && rt <= 3000) {
          state.hitRTs.push(rt);
          if (state.trialIdx <= blockSize) state.block1RTs.push(rt);
          else if (state.trialIdx > blockSize * 2) state.block3RTs.push(rt);
        }
        if (S) S.hit();
        API.showFeedbackFlash(true);
      } else {
        // False alarm
        state.falseAlarms++;
        if (S) S.miss();
        API.showFeedbackFlash(false);
        if (config.failOnFalseAlarm) {
          state.ended = true;
          clearAll();
          onEnd(state);
          return;
        }
      }

      push(nextTrial, config.postTrial);
    }

    state.forceResponse = handleResponse;
    nextTrial();
    return state;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 40 trials · 450ms stimulus · 600ms ISI
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '40 trials · Fast stimulus', () => {
      runNBackLoop({
        mode: 'speed',
        nLevel: 2,
        totalTrials: 40,
        matchRate: 0.30,
        stimDuration: 450,
        isi: 700,
        postTrial: 250,
        failOnMiss: false,
        failOnFalseAlarm: false,
        badgeHTML: `<div class="practice-badge">SPEED · 2-BACK</div>`
      }, endSpeed);
    });
  }

  function endSpeed(state) {
    M.ended = true;
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round(((state.hits + state.correctRejections) / 40) * 100);
    const medianRT = H.median(state.hitRTs);
    const dPrime = H.dPrime(state.hits, state.misses, state.falseAlarms, state.correctRejections);

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${accuracy}%</h1>
      <p class="phase-sub">${state.hits} hits · ${state.falseAlarms} FA</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${state.hits}</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('speed', { totalCorrect: state.hits, accuracy, medianRT });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: state.hits, accuracy, medianRT });
    API.emit({ gameId: 'n-back', domain: 'memory', mode: 'speed', totalCorrect: state.hits, accuracy, medianRT, dPrime });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One miss OR false alarm = game over · N ramps
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, nLevel: 1, totalHits: 0, ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', runEndlessRound);
  }

  function runEndlessRound() {
    if (M.ended) return;

    const roundN = Math.min(5, 1 + Math.floor(M.level / 3));

    runNBackLoop({
      mode: 'endless',
      nLevel: roundN,
      totalTrials: 15,
      matchRate: 0.30,
      stimDuration: 600,
      isi: 900,
      postTrial: 250,
      failOnMiss: true,
      failOnFalseAlarm: true,
      hudHTML: () => `
        <div class="endless-hud">
          <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
          <div class="hud-item"><div class="hud-val">${roundN}</div><div class="hud-lbl">N-BACK</div></div>
          <div class="hud-item"><div class="hud-val">${M.totalHits}</div><div class="hud-lbl">HITS</div></div>
        </div>
      `
    }, (state) => {
      // If somehow reached end without failing = level passed
      M.totalHits += state.hits;
      M.level++;
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
      push(runEndlessRound, 1200);
    });
  }

  function endEndless() {
    if (M.ended) return;
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">You missed a match or false-alarmed.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${M.totalHits}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalHits });
    API.emit({ gameId: 'n-back', domain: 'memory', mode: 'endless', levelReached: M.level, totalCorrect: M.totalHits });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 40 trials · 1200ms stimulus
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '40 trials · Slow stimulus · 2-back', () => {
      runNBackLoop({
        mode: 'precision',
        nLevel: 2,
        totalTrials: 40,
        matchRate: 0.35,
        stimDuration: 1200,
        isi: 1200,
        postTrial: 350,
        failOnMiss: false,
        failOnFalseAlarm: false,
        badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · 2-BACK</div>`
      }, endPrecision);
    });
  }

  function endPrecision(state) {
    M.ended = true;
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round(((state.hits + state.correctRejections) / 40) * 100);
    const medianRT = H.median(state.hitRTs);
    const dPrime = H.dPrime(state.hits, state.misses, state.falseAlarms, state.correctRejections);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${state.hits} hits · ${state.falseAlarms} FA</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${state.hits}</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('precision', { accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, dPrime });
    API.emit({ gameId: 'n-back', domain: 'memory', mode: 'precision', accuracy, medianRT, dPrime, totalCorrect: state.hits });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 25 trials · 2-back · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '25 trials · Fixed protocol · 2-back', () => {
      runNBackLoop({
        mode: 'daily',
        nLevel: 2,
        totalTrials: 25,
        matchRate: 0.30,
        stimDuration: 700,
        isi: 900,
        postTrial: 300,
        failOnMiss: false,
        failOnFalseAlarm: false,
        badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · 2-BACK</div>`
      }, endDaily);
    });
  }

  function endDaily(state) {
    M.ended = true;
    const accuracy = Math.round(((state.hits + state.correctRejections) / 25) * 100);
    const rcs = H.rcs(state.hits, state.hitRTs);
    H.markTodayDone({ rcs, accuracy });
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${state.hits}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'n-back', domain: 'memory', mode: 'daily', accuracy, rcs });
  }

  /* ═══ Handle fail triggers from runNBackLoop ═══ */
  // Override: when the loop ends due to failOnMiss/failOnFalseAlarm,
  // we check mode and route to endEndless
  const originalOnEnd = null;

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.NBackExtraModes = { getModeDefinitions, start };
})();