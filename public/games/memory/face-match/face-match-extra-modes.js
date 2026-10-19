/* ═══════════════════════════════════════════════════════════
   FLASH — Face Match Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.FMAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 rounds · Fast encode',           meta: '→ 800ms per face' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',            meta: '→ Faces ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 rounds · Slow · Max accuracy',    meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 rounds · Fixed protocol',         meta: '→ Once per day' }
    ];
  }

  /* ═══ Generic round runner ═══ */
  function runRound(config, onComplete) {
    const count = config.count;
    const faces = API.generateUniqueFaces(count);

    // Encode phase
    const encodeBadge = config.badgeHTML || '';
    const encodeHud = config.hudHTML ? config.hudHTML() : '';

    API.setPhase('encode');
    API.render(API.renderEncodePhase(faces, encodeBadge, encodeHud, config.encodeDurationPerFace));

    let idx = 0;
    function encodeStep() {
      if (M.ended) return;
      if (idx >= faces.length) {
        push(startRecall, 400);
        return;
      }
      if (S && S.faceShow) S.faceShow();
      idx++;
      push(encodeStep, config.encodeDurationPerFace);
    }

    push(encodeStep, config.encodeDurationPerFace);

    function startRecall() {
      const recallQueue = API.shuffle(faces.slice());
      let userIdx = 0;
      const roundStartTime = performance.now();

      function nextRecall() {
        if (M.ended) return;
        if (userIdx >= recallQueue.length) {
          const rt = performance.now() - roundStartTime;
          onComplete({ success: true, rt, faces: count });
          return;
        }

        const face = recallQueue[userIdx];
        const distractors = API.pickDistractors(face, faces, 3);
        const options = API.shuffle([face.name, ...distractors]);

        API.setPhase('recall');
        API.render(API.renderRecallPhase(face, options, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));

        const btns = API.getElContent().querySelectorAll('.option-btn');
        const startTime = performance.now();

        btns.forEach((btn, i) => {
          btn.addEventListener('click', () => {
            const chosen = options[i];
            const isCorrect = chosen === face.name;

            btns.forEach((b, j) => {
              b.disabled = true;
              if (options[j] === face.name) b.classList.add('correct');
              else if (b === btn) b.classList.add('wrong');
            });

            API.showFeedbackFlash(isCorrect);
            if (S) { isCorrect ? S.hit() : S.miss(); }

            if (!isCorrect) {
              push(() => onComplete({ success: false, rt: 0, faces: count }), 800);
              return;
            }
            userIdx++;
            push(nextRecall, 500);
          });
        });
      }

      nextRecall();
    }
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 15 rounds · 800ms per face
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', round: 0, total: 15, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 rounds · Fast encode', nextSpeedRound);
  }

  function nextSpeedRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endSpeed(); return; }

    const count = 3 + Math.floor(M.round / 5);
    M.round++;

    runRound({
      count,
      encodeDurationPerFace: 800,
      badgeHTML: `<div class="practice-badge">SPEED · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">FACES <span class="ri-val">${count}</span></span>
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
    API.emit({ gameId: 'face-match', domain: 'memory', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
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
      encodeDurationPerFace: Math.max(500, 900 - M.level * 40),
      hudHTML: () => `
        <div class="endless-hud">
          <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
          <div class="hud-item"><div class="hud-val">${count}</div><div class="hud-lbl">FACES</div></div>
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

      if (M.totalCorrect % 2 === 0 && M.count < 8) {
        M.count++;
        API.showLevelUpFlash(`${M.count} FACES!`);
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
      <h1 class="phase-headline grd">${M.count} Faces</h1>
      <p class="phase-sub">You mis-matched a name.</p>
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
    API.emit({ gameId: 'face-match', domain: 'memory', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 rounds · Slow encode
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', round: 0, total: 15, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 rounds · Slow encode', nextPrecisionRound);
  }

  function nextPrecisionRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endPrecision(); return; }

    const count = 4 + Math.floor(M.round / 5);
    M.round++;

    runRound({
      count,
      encodeDurationPerFace: 1500,
      badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">FACES <span class="ri-val">${count}</span></span>
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
    API.emit({ gameId: 'face-match', domain: 'memory', mode: 'precision', accuracy, medianRT, totalTrials: M.total });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 rounds · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', round: 0, total: 20, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 rounds · Fixed protocol', nextDailyRound);
  }

  function nextDailyRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endDaily(); return; }

    const count = 3 + Math.floor(M.round / 7);
    M.round++;

    runRound({
      count,
      encodeDurationPerFace: 1100,
      badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.round} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="round-info">
          <span class="ri">FACES <span class="ri-val">${count}</span></span>
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
    API.emit({ gameId: 'face-match', domain: 'memory', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.FaceMatchExtraModes = { getModeDefinitions, start };
})();