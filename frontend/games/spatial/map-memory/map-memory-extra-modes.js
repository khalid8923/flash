/* ═══════════════════════════════════════════════════════════
   FLASH — Map Memory Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.MMAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 rounds · Fast encode',           meta: '→ 800ms per landmark' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',            meta: '→ Landmarks ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '10 rounds · Slow · Max accuracy',    meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '15 rounds · Fixed protocol',         meta: '→ Once per day' }
    ];
  }

  /* ═══ Render map board ═══ */
  function renderMap(landmarkMap, status, badgeHTML, hudHTML, queueHTML) {
    const cells = [];
    for (let i = 0; i < 168; i++) {
      const lm = landmarkMap[i];
      const stat = status[i] || '';
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
    API.getElContent().querySelectorAll('.map-cell').forEach(c => {
      c.addEventListener('click', () => handler(parseInt(c.dataset.cell, 10)));
    });
  }

  /* ═══════════════════════════════════════════════════════
     Core round runner — shared by all modes
     ═══════════════════════════════════════════════════════ */
  function runRound(config, onComplete) {
    const landmarks = API.pickLandmarks(config.count);
    const positions = API.pickPositions(config.count);

    const landmarkMap = {};
    landmarks.forEach((lm, i) => {
      const pos = positions[i];
      landmarkMap[pos] = { ...lm, correctPos: pos, showLabel: true };
    });

    const badge = config.badgeHTML || '';
    const hud = config.hudHTML ? config.hudHTML() : '';

    // Encode phase
    API.setPhase('encode');
    API.render(renderMap(landmarkMap, {}, badge, hud, ''));

    let idx = 0;
    function flashNext() {
      if (M.ended) return;
      if (idx >= landmarks.length) {
        // End encode phase → recall
        push(startRecall, 500);
        return;
      }
      const pos = positions[idx];
      if (S && S.landmarkShow) S.landmarkShow();
      idx++;
      push(flashNext, config.encodeDurationPerLandmark);
    }

    push(flashNext, config.encodeDurationPerLandmark);

    function startRecall() {
      // Hide labels
      Object.keys(landmarkMap).forEach(k => {
        landmarkMap[k].showLabel = false;
      });

      const status = {};
      let userIdx = 0;
      const startTime = performance.now();
      let placementErrors = [];

      function renderNow() {
        API.setPhase('recall');
        API.render(renderMap(
          landmarkMap, status, badge,
          config.hudHTML ? config.hudHTML() : '',
          renderQueue(landmarks, userIdx)
        ));
        wireCells(handleClick);
      }

      function handleClick(cellIdx) {
        if (userIdx >= landmarks.length) return;

        const current = landmarks[userIdx];
        const correctPos = current.correctPos;

        if (cellIdx === correctPos) {
          // Correct
          status[cellIdx] = 'correct';
          if (S && S.landmarkPlace) S.landmarkPlace();
          API.showFeedbackFlash(true);
          userIdx++;
          if (userIdx >= landmarks.length) {
            // Round complete
            const rt = performance.now() - startTime;
            const avgErr = 0;
            push(() => onComplete({
              success: true,
              rt,
              span: landmarks.length,
              avgPlacementError: avgErr
            }), 500);
          } else {
            renderNow();
          }
        } else {
          // Wrong placement
          status[cellIdx] = 'wrong';
          if (S) S.miss();
          API.showFeedbackFlash(false);
          const manhattan = API.manhattanDistance(cellIdx, correctPos);
          placementErrors.push(manhattan);
          renderNow();
          push(() => {
            onComplete({
              success: false,
              rt: 0,
              span: landmarks.length,
              avgPlacementError: placementErrors.reduce((a,b)=>a+b,0) / placementErrors.length
            });
          }, 700);
        }
      }

      renderNow();
    }
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 10 rounds · 800ms per landmark
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', round: 0, total: 10, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 rounds · Fast encode', nextSpeedRound);
  }

  function nextSpeedRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endSpeed(); return; }

    const count = 3 + Math.floor(M.round / 3);
    M.round++;

    runRound({
      count,
      encodeDurationPerLandmark: 800,
      badgeHTML: `<div class="practice-badge">SPEED · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">LANDMARKS <span class="ri-val">${count}</span></span>
          <span class="ri">CORRECT <span class="ri-val good">${M.correct}</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);
      }
      push(nextSpeedRound, 600);
    });
  }

  function endSpeed() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${M.correct}/${M.total}</h1>
      <p class="phase-sub">${accuracy}% rounds correct</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('speed', { totalCorrect: M.correct, medianRT, accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.correct, accuracy, medianRT });
    API.emit({ gameId: 'map-memory', domain: 'spatial', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, count: 3, totalCorrect: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', nextEndlessRound);
  }

  function nextEndlessRound() {
    if (M.ended) return;

    const count = M.count;

    runRound({
      count,
      encodeDurationPerLandmark: Math.max(500, 900 - M.level * 30),
      hudHTML: () => `
        <div class="endless-hud">
          <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
          <div class="hud-item"><div class="hud-val">${count}</div><div class="hud-lbl">LANDMARKS</div></div>
          <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
        </div>
      `
    }, (result) => {
      if (!result.success) {
        push(endEndless, 700);
        return;
      }
      M.totalCorrect++;
      if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);

      if (M.totalCorrect % 2 === 0 && M.count < 12) {
        M.count++;
        API.showLevelUpFlash(`${M.count} LANDMARKS!`);
        if (S) S.levelUp();
      }
      M.level++;
      push(nextEndlessRound, 700);
    });
  }

  function endEndless() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">${M.count} Landmarks</h1>
      <p class="phase-sub">You mis-placed a landmark.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">MAX COUNT</div><div class="stat-value">${M.count}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.totalCorrect}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'map-memory', domain: 'spatial', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 10 rounds · Slow encode
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', round: 0, total: 10, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '10 rounds · Slow encode', nextPrecisionRound);
  }

  function nextPrecisionRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endPrecision(); return; }

    const count = 4 + Math.floor(M.round / 4);
    M.round++;

    runRound({
      count,
      encodeDurationPerLandmark: 1600,
      badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">LANDMARKS <span class="ri-val">${count}</span></span>
          <span class="ri">CORRECT <span class="ri-val good">${M.correct}</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 120000) M.rtList.push(result.rt);
      }
      push(nextPrecisionRound, 700);
    });
  }

  function endPrecision() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} rounds correct</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT });
    API.emit({ gameId: 'map-memory', domain: 'spatial', mode: 'precision', accuracy, medianRT, totalTrials: M.total, totalCorrect: M.correct });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 15 rounds · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', round: 0, total: 15, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '15 rounds · Fixed protocol', nextDailyRound);
  }

  function nextDailyRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endDaily(); return; }

    const count = 3 + Math.floor(M.round / 5);
    M.round++;

    runRound({
      count,
      encodeDurationPerLandmark: 1100,
      badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">LANDMARKS <span class="ri-val">${count}</span></span>
          <span class="ri">CORRECT <span class="ri-val good">${M.correct}</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);
      }
      push(nextDailyRound, 550);
    });
  }

  function endDaily() {
    M.ended = true; clearAll();
    const accuracy = Math.round((M.correct / M.total) * 100);
    const rcs = H.rcs(M.correct, M.rtList);
    H.markTodayDone({ rcs, accuracy });
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'map-memory', domain: 'spatial', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.MapMemoryExtraModes = { getModeDefinitions, start };
})();