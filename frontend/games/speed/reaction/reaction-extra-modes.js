/* ═══════════════════════════════════════════════════════════
   FLASH — Reaction Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.RXAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let M = {};
  let timeouts = [];

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (M.goTimeout) { clearTimeout(M.goTimeout); M.goTimeout = null; }
  }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      timeouts.push(id);
    });
  }

  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 rounds · Fast response',   meta: '→ Quick reaction' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'Faster each round · One miss = over', meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 rounds · Consistency focus', meta: '→ Low RTV' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '8 rounds · Fixed protocol',   meta: '→ Once per day' }
    ];
  }

  /* ═══ SHARED: RUN ONE TRIAL ═══ */
  function runTrial(minDelay, maxDelay) {
    return new Promise(resolve => {
      const delay = randInt(minDelay, maxDelay);
      let settled = false;
      let goTime = 0;
      let falseStart = false;

      // Phase 1: Waiting (red)
      API.setPhase('waiting');
      API.render(API.renderWaitingState(M.headerHTML || ''));

      // Click during waiting = false start
      const stageEl = API.$('stage');
      function onEarlyClick(e) {
        if (settled) return;
        if (e.target.closest('.g-header') || e.target.closest('.g-footer')) return;
        if (e.target.closest('button')) return;
        falseStart = true;
        settled = true;
        stageEl.removeEventListener('click', onEarlyClick);
        if (M.goTimeout) { clearTimeout(M.goTimeout); M.goTimeout = null; }
        if (S && S.falseStart) S.falseStart();
        if (API.haptic) API.haptic('wrong');
        API.showFeedbackFlash(false);
        resolve({ rt: 0, falseStart: true });
      }
      stageEl.addEventListener('click', onEarlyClick);

      // Phase 2: Go (green) — after random delay
      M.goTimeout = setTimeout(() => {
        if (settled) return;
        stageEl.removeEventListener('click', onEarlyClick);

        API.setPhase('go');
        API.render(API.renderGoState(M.headerHTML || ''));
        if (S && S.goSignal) S.goSignal();

        goTime = performance.now();

        function onRealClick(e) {
          if (settled) return;
          if (e.target.closest('.g-header') || e.target.closest('.g-footer')) return;
          if (e.target.closest('button')) return;
          settled = true;
          stageEl.removeEventListener('click', onRealClick);
          const rt = performance.now() - goTime;
          resolve({ rt, falseStart: false });
        }
        stageEl.addEventListener('click', onRealClick);
      }, delay);
      timeouts.push(M.goTimeout);
    });
  }

  /* ═══ SHARED: HANDLE RESULT ═══ */
  function handleResult(result, state) {
    if (result.falseStart) {
      state.falseStarts++;
      state.history.push({ rt: 0, falseStart: true });
      API.showFeedbackFlash(false);
      return false;
    }
    const rt = Math.round(result.rt);
    state.rtList.push(rt);
    state.history.push({ rt, falseStart: false });
    if (state.fastestRT === 0 || rt < state.fastestRT) state.fastestRT = rt;
    if (rt > state.slowestRT) state.slowestRT = rt;

    if (rt < 200) state.eliteCount++;
    else if (rt < 300) state.goodCount++;

    if (S) {
      if (rt < 200 && S.fastHit) S.fastHit();
      else S.hit();
    }
    API.showFeedbackFlash(true);
    if (API.haptic) API.haptic('correct');
    return true;
  }

  function newState() {
    return {
      rtList: [],
      history: [],
      falseStarts: 0,
      fastestRT: 0,
      slowestRT: 0,
      eliteCount: 0,
      goodCount: 0,
      ended: false,
      headerHTML: ''
    };
  }

  function renderHistory(state) {
    if (!state.history.length) return '';
    const items = state.history.map(h => {
      if (h.falseStart) return `<div class="rx-hist-dot foul">FOUL</div>`;
      let cls = 'slow';
      if (h.rt < 200) cls = 'elite';
      else if (h.rt < 300) cls = 'good';
      else if (h.rt < 400) cls = 'avg';
      return `<div class="rx-hist-dot ${cls}">${h.rt}ms</div>`;
    }).join('');
    return `<div class="rx-history-row">${items}</div>`;
  }

  /* ═══════════════════════════════════════════
     SPEED MODE — 10 rounds · Fast
     ═══════════════════════════════════════════ */
  async function startSpeed() {
    M = newState();
    M.mode = 'speed';
    M.totalRounds = 10;

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 rounds · Fast response', async () => {
      for (let i = 1; i <= M.totalRounds; i++) {
        if (M.ended) return;
        M.headerHTML = `
          <div class="practice-badge">SPEED · ${i} / ${M.totalRounds}</div>
          ${renderHistory(M)}
        `;
        // Speed mode: shorter delays (1.2 - 3s)
        const result = await runTrial(1200, 3000);
        if (M.ended) return;

        handleResult(result, M);

        // Show result briefly
        if (!result.falseStart) {
          API.setPhase('result');
          API.render(API.renderResultState(Math.round(result.rt), M.headerHTML));
          await wait(900);
        } else {
          await wait(1200);
        }
      }
      endSpeed();
    });
  }

  function endSpeed() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const medianRT = H.median(M.rtList);
    const rtv = H.stdDev(M.rtList);
    const accuracy = Math.round((M.rtList.length / (M.rtList.length + M.falseStarts)) * 100);

    if (S) S.victory();

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${medianRT || 0}<span style="font-size:20px;color:var(--t2)">ms</span></h1>
      <p class="phase-sub">Median reaction time · ${M.rtList.length} valid rounds</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value">${M.fastestRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('speed', { medianRT });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', medianRT, rtv, accuracy, fastestRT: M.fastestRT });
    API.emit({ gameId: 'reaction', domain: 'speed', mode: 'speed', medianRT, rtv, accuracy, fastestRT: M.fastestRT, slowestRT: M.slowestRT, totalTrials: M.rtList.length });
  }

  /* ═══════════════════════════════════════════
     ENDLESS — Faster each round · One miss = over
     ═══════════════════════════════════════════ */
  async function startEndless() {
    M = newState();
    M.mode = 'endless';
    M.level = 1;

    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'Faster each round · No false starts', async () => {
      let minDelay = 1500;
      let maxDelay = 4000;

      while (!M.ended) {
        M.headerHTML = `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">ROUND</div></div>
            <div class="hud-item"><div class="hud-val">${M.rtList.length}</div><div class="hud-lbl">HITS</div></div>
          </div>
          ${renderHistory(M)}
        `;

        const result = await runTrial(minDelay, maxDelay);
        if (M.ended) return;

        const ok = handleResult(result, M);

        if (result.falseStart) {
          API.setPhase('result');
          API.render(API.renderFalseStartState(M.headerHTML));
          await wait(1500);
          endEndless();
          return;
        }

        API.setPhase('result');
        API.render(API.renderResultState(Math.round(result.rt), M.headerHTML));
        await wait(800);

        M.level++;
        // Speed up (faster appearance, not faster RT required)
        minDelay = Math.max(600, minDelay - 100);
        maxDelay = Math.max(1200, maxDelay - 200);

        if (M.level > 25) {
          endEndless();
          return;
        }
      }
    });
  }

  function endEndless() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    const medianRT = H.median(M.rtList);
    const rtv = H.stdDev(M.rtList);

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Round ${M.level}</h1>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">ROUNDS</div><div class="stat-value">${M.rtList.length}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value">${M.fastestRT || '—'}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, medianRT, rtv, fastestRT: M.fastestRT });
    API.emit({ gameId: 'reaction', domain: 'speed', mode: 'endless', levelReached: M.level, medianRT, rtv, fastestRT: M.fastestRT, totalTrials: M.rtList.length });
  }

  /* ═══════════════════════════════════════════
     PRECISION — 15 rounds · Consistency focus
     ═══════════════════════════════════════════ */
  async function startPrecision() {
    M = newState();
    M.mode = 'precision';
    M.totalRounds = 15;

    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 rounds · Consistency focus', async () => {
      for (let i = 1; i <= M.totalRounds; i++) {
        if (M.ended) return;
        M.headerHTML = `
          <div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${i} / ${M.totalRounds}</div>
          ${renderHistory(M)}
        `;
        // Long, calm delays
        const result = await runTrial(2500, 5500);
        if (M.ended) return;

        handleResult(result, M);

        if (!result.falseStart) {
          API.setPhase('result');
          API.render(API.renderResultState(Math.round(result.rt), M.headerHTML));
          await wait(900);
        } else {
          await wait(1200);
        }
      }
      endPrecision();
    });
  }

  function endPrecision() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const medianRT = H.median(M.rtList);
    const rtv = H.stdDev(M.rtList);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">🎯 ${medianRT || 0}<span style="font-size:20px;color:var(--t2)">ms</span></h1>
      <p class="phase-sub">Median RT · RTV: ${rtv}ms</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value">${M.fastestRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RTV</div><div class="stat-value">${rtv}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('precision', { accuracy: 100 });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', medianRT, rtv, fastestRT: M.fastestRT });
    API.emit({ gameId: 'reaction', domain: 'speed', mode: 'precision', medianRT, rtv, fastestRT: M.fastestRT, totalTrials: M.rtList.length });
  }

  /* ═══════════════════════════════════════════
     DAILY — 8 rounds · Fixed protocol
     ═══════════════════════════════════════════ */
  async function startDaily() {
    M = newState();
    M.mode = 'daily';
    M.totalRounds = 8;

    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '8 rounds · Fixed protocol', async () => {
      for (let i = 1; i <= M.totalRounds; i++) {
        if (M.ended) return;
        M.headerHTML = `
          <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${i} / ${M.totalRounds}</div>
          ${renderHistory(M)}
        `;
        const result = await runTrial(1500, 4000);
        if (M.ended) return;

        handleResult(result, M);

        if (!result.falseStart) {
          API.setPhase('result');
          API.render(API.renderResultState(Math.round(result.rt), M.headerHTML));
          await wait(900);
        } else {
          await wait(1200);
        }
      }
      endDaily();
    });
  }

  function endDaily() {
    M.ended = true;
    clearAll();

    const medianRT = H.median(M.rtList);
    const rtv = H.stdDev(M.rtList);
    const accuracy = Math.round((M.rtList.length / M.totalRounds) * 100);

    H.markTodayDone({ medianRT, accuracy, rcs: 0 });

    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${medianRT || 0}<span style="font-size:20px;color:var(--t2)">ms</span></h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">FASTEST</div><div class="stat-value">${M.fastestRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', medianRT, rtv, accuracy, fastestRT: M.fastestRT });
    API.emit({ gameId: 'reaction', domain: 'speed', mode: 'daily', medianRT, rtv, accuracy, fastestRT: M.fastestRT });
  }

  /* ═══ PUBLIC ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef;
    S = sRef;
    H = hRef;
    clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  function abort() {
    M.ended = true;
    clearAll();
  }

  window.ReactionExtraModes = { getModeDefinitions, start, abort };
})();