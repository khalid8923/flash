/* ═══════════════════════════════════════════════════════════
   FLASH — Vigilance Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.VigilanceAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '20 targets · Fast stream',           meta: '→ 500ms each' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One miss = game over',               meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '20 targets · Slow stream · Accuracy', meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '40 targets · Fixed protocol',         meta: '→ Once per day' }
    ];
  }

  /* ═══ Shared trial runner ═══ */
  function runTrial(config, onEnd) {
    const letters = config.letters;
    const targets = config.targets;
    const targetRate = config.targetRate;
    const stimDur = config.stimDur;
    const isi = config.isi;
    const totalTrials = config.totalTrials;

    M = {
      trialIdx: 0,
      totalTrials,
      sequence: [],
      currentIdx: 0,
      answered: false,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      hitRTs: [],
      startTime: 0,
      stimStartTime: 0,
      ended: false,
      mode: config.mode
    };

    // Generate sequence
    for (let i = 0; i < totalTrials; i++) {
      const isTarget = Math.random() < targetRate;
      if (isTarget) {
        M.sequence.push(targets[0]);
      } else {
        const pool = letters.filter(l => !targets.includes(l));
        M.sequence.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    nextTrial();

    function nextTrial() {
      if (M.ended) return;
      if (M.currentIdx >= M.totalTrials) { onEnd(); return; }

      const letter = M.sequence[M.currentIdx];
      const isTarget = targets.includes(letter);
      M.currentLetter = { letter, isTarget };
      M.answered = false;
      M.currentIdx++;

      // Show blank ISI
      API.setPhase('trial');
      API.render(`
        ${renderHUD()}
        <div class="letter-stage">
          <div class="letter-display idle-symbol">•</div>
        </div>
        ${renderResponseRow(false)}
      `);
      wireResponseButton();

      // After ISI, show letter
      push(() => {
        if (M.ended) return;
        API.setPhase('stimulus');
        M.stimStartTime = performance.now();
        API.render(`
          ${renderHUD()}
          <div class="letter-stage">
            <div class="letter-display ${isTarget ? 'target' : ''}">${letter}</div>
          </div>
          ${renderResponseRow(true)}
        `);
        wireResponseButton();

        // After stimDur, hide letter (if no response)
        push(() => {
          if (M.ended || M.answered) return;
          evaluateNoResponse();
        }, stimDur);

      }, isi);
    }

    function evaluateNoResponse() {
      if (M.answered) return;
      M.answered = true;
      const isTarget = M.currentLetter.isTarget;
      if (isTarget) {
        M.misses++;
        if (S) S.miss();
        API.showFeedbackFlash(false);
      } else {
        M.correctRejections++;
      }
      // Next trial
      push(nextTrial, isi);
    }

    function handleResponse() {
      if (M.answered) return;
      if (!M.currentLetter) return;
      M.answered = true;

      const rt = performance.now() - M.stimStartTime;
      const isTarget = M.currentLetter.isTarget;

      if (isTarget) {
        M.hits++;
        M.hitRTs.push(rt);
        if (S) S.hit();
        API.showFeedbackFlash(true);
      } else {
        M.falseAlarms++;
        if (S) S.miss();
        API.showFeedbackFlash(false);
      }

      push(nextTrial, isi);
    }

    function renderHUD() {
      return `
        <div class="block-info">
          <span class="bi">TRIAL <span class="bi-val">${M.currentIdx}/${M.totalTrials}</span></span>
          <span class="bi">HITS <span class="bi-val good">${M.hits}</span></span>
          <span class="bi">MISS <span class="bi-val bad">${M.misses}</span></span>
          <span class="bi">FA <span class="bi-val warn">${M.falseAlarms}</span></span>
        </div>
      `;
    }

    function renderResponseRow(armed) {
      return `
        <div class="response-row">
          <button class="response-btn ${armed ? 'armed' : ''}" id="response-btn" ${armed ? '' : 'disabled'}>
            <span class="rb-icon">🎯</span>
            PRESS FOR TARGET
          </button>
        </div>
      `;
    }

    function wireResponseButton() {
      const btn = API.$('response-btn');
      if (btn && !btn.disabled) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleResponse();
        });
      }
    }

    // Expose handler for SPACE key
    M.handleResponse = handleResponse;
  }

  function endResults() {
    const accuracy = (M.hits + M.correctRejections) > 0
      ? Math.round(((M.hits + M.correctRejections) / M.totalTrials) * 100)
      : 0;

    const dPrime = H.dPrime(M.hits, M.misses, M.falseAlarms, M.correctRejections);
    const medianRT = H.median(M.hitRTs);

    return { accuracy, dPrime, medianRT, hits: M.hits, misses: M.misses,
             falseAlarms: M.falseAlarms, correctRejections: M.correctRejections };
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 20 targets · Fast stream
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    const config = {
      mode: 'speed',
      letters: ['A','B','C','D','E','F','H','J','K','L','M','N','P','R','S','T','U','V','W','Y'],
      targets: ['X'],
      targetRate: 0.3,
      stimDur: 500,
      isi: 500,
      totalTrials: 60
    };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '60 letters · 500ms each', () => {
      runTrial(config, () => endSpeed());
    });
  }

  function endSpeed() {
    if (M.ended) return;
    M.ended = true;
    clearAll();
    const r = endResults();
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${r.accuracy}%</h1>
      <p class="phase-sub">${r.hits} hits · ${r.falseAlarms} false alarms</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${r.hits}</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${r.dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${r.medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    const nb = H.checkAndUnlockBadges('speed', { totalHits: r.hits, accuracy: r.accuracy, medianRT: r.medianRT });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalHits: r.hits, accuracy: r.accuracy, medianRT: r.medianRT, dPrime: r.dPrime });
    API.emit({ gameId: 'vigilance', domain: 'attention', mode: 'speed',
               totalHits: r.hits, accuracy: r.accuracy, medianRT: r.medianRT, dPrime: r.dPrime,
               falseAlarms: r.falseAlarms });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One miss = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, totalHits: 0, totalCorrect: 0, ended: false, rtList: [] };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One miss ends the run', runEndlessLevel);
  }

  function runEndlessLevel() {
    if (M.ended) return;

    const config = {
      mode: 'endless',
      letters: ['A','B','C','D','E','F','H','J','K','L','M','N','P','R','S','T','U','V','W','Y'],
      targets: ['X'],
      targetRate: 0.25 + Math.min(0.15, M.level * 0.02),
      stimDur: Math.max(350, 900 - M.level * 40),
      isi: Math.max(350, 800 - M.level * 30),
      totalTrials: 20
    };

    const subM = {};
    let idx = 0;
    let hits = 0, misses = 0, fa = 0, cr = 0, answered = false;

    function nextOne() {
      if (M.ended) return;
      if (idx >= config.totalTrials) {
        // Level passed
        M.totalCorrect += hits;
        M.level++;
        API.showLevelUpFlash(`LEVEL ${M.level}!`);
        if (S) S.levelUp();
        push(runEndlessLevel, 1200);
        return;
      }

      const isTarget = Math.random() < config.targetRate;
      const letter = isTarget ? 'X'
        : config.letters[Math.floor(Math.random() * config.letters.length)];
      idx++;
      answered = false;

      API.setPhase('trial');
      API.render(`
        <div class="endless-hud">
          <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
          <div class="hud-item"><div class="hud-val">${M.totalHits + hits}</div><div class="hud-lbl">HITS</div></div>
          <div class="hud-item"><div class="hud-val">${idx}/${config.totalTrials}</div><div class="hud-lbl">TRIAL</div></div>
        </div>
        <div class="letter-stage"><div class="letter-display idle-symbol">•</div></div>
        <div class="response-row">
          <button class="response-btn" id="response-btn" disabled>
            <span class="rb-icon">🎯</span>PRESS FOR TARGET
          </button>
        </div>
      `);

      push(() => {
        if (M.ended) return;
        API.setPhase('stimulus');
        const t0 = performance.now();
        API.render(`
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.totalHits + hits}</div><div class="hud-lbl">HITS</div></div>
            <div class="hud-item"><div class="hud-val">${idx}/${config.totalTrials}</div><div class="hud-lbl">TRIAL</div></div>
          </div>
          <div class="letter-stage"><div class="letter-display ${isTarget ? 'target' : ''}">${letter}</div></div>
          <div class="response-row">
            <button class="response-btn armed" id="response-btn">
              <span class="rb-icon">🎯</span>PRESS FOR TARGET
            </button>
          </div>
        `);
        const btn = API.$('response-btn');
        if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); doAnswer(); });
        M.endlessAnswer = doAnswer;

        function doAnswer() {
          if (answered) return;
          answered = true;
          const rt = performance.now() - t0;

          if (isTarget) {
            hits++;
            M.totalHits++;
            if (rt >= 100) M.rtList.push(rt);
            if (S) S.hit();
            API.showFeedbackFlash(true);
            push(nextOne, config.isi);
          } else {
            fa++;
            if (S) S.miss();
            API.showFeedbackFlash(false);
            push(() => endEndless(), 800);
          }
        }

        push(() => {
          if (answered) return;
          answered = true;
          if (isTarget) {
            misses++;
            if (S) S.miss();
            API.showFeedbackFlash(false);
            push(() => endEndless(), 800);
          } else {
            cr++;
            push(nextOne, config.isi);
          }
        }, config.stimDur);

      }, config.isi);
    }

    nextOne();
  }

  function endEndless() {
    if (M.ended) return;
    M.ended = true;
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">Vigilance broke — you missed or false-alarmed.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${M.totalHits}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalHits: M.totalHits });
    API.emit({ gameId: 'vigilance', domain: 'attention', mode: 'endless', levelReached: M.level, totalHits: M.totalHits });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 20 targets · Slow stream
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    const config = {
      mode: 'precision',
      letters: ['A','B','C','D','E','F','H','J','K','L','M','N','P','R','S','T','U','V','W','Y'],
      targets: ['X'],
      targetRate: 0.35,
      stimDur: 1500,
      isi: 1200,
      totalTrials: 40
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '40 letters · Slow stream', () => {
      runTrial(config, () => endPrecision());
    });
  }

  function endPrecision() {
    if (M.ended) return;
    M.ended = true;
    clearAll();
    const r = endResults();
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${r.accuracy}%</h1>
      <p class="phase-sub">${r.hits} hits · ${r.falseAlarms} false alarms</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">HITS</div><div class="stat-value">${r.hits}</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${r.dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${r.medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    const nb = H.checkAndUnlockBadges('precision', { accuracy: r.accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy: r.accuracy, medianRT: r.medianRT, dPrime: r.dPrime });
    API.emit({ gameId: 'vigilance', domain: 'attention', mode: 'precision',
               accuracy: r.accuracy, medianRT: r.medianRT, dPrime: r.dPrime,
               totalHits: r.hits, totalTrials: 40 });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 40 targets · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    const config = {
      mode: 'daily',
      letters: ['A','B','C','D','E','F','H','J','K','L','M','N','P','R','S','T','U','V','W','Y'],
      targets: ['X'],
      targetRate: 0.3,
      stimDur: 800,
      isi: 900,
      totalTrials: 50
    };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '50 letters · Fixed protocol', () => {
      runTrial(config, () => endDaily());
    });
  }

  function endDaily() {
    if (M.ended) return;
    M.ended = true;
    clearAll();
    const r = endResults();
    const rcs = H.rcs(r.hits + r.correctRejections, M.hitRTs);
    H.markTodayDone({ rcs, accuracy: r.accuracy });
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${r.accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${r.accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${r.dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${r.medianRT || '—'}</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy: r.accuracy, rcs, dPrime: r.dPrime });
    API.emit({ gameId: 'vigilance', domain: 'attention', mode: 'daily', accuracy: r.accuracy, rcs, dPrime: r.dPrime });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.VigilanceExtraModes = { getModeDefinitions, start };
})();