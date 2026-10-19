/* ═══════════════════════════════════════════════════════════
   FLASH — Corsi Blocks Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.CBAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 sequences · Fast flash',         meta: '→ 400ms per block' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',            meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 sequences · Slow · Max accuracy', meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 sequences · Fixed protocol',      meta: '→ Once per day' }
    ];
  }

  /* ═══ Render board ═══ */
  function renderBoard(blockLit, blockStatus, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="corsi-board">
        ${Array.from({ length: 9 }, (_, i) => {
          const pos = API.BLOCK_POSITIONS[i];
          const lit = blockLit.includes(i) ? ' lit' : '';
          const stat = blockStatus[i] === 'correct' ? ' selected-correct'
                     : blockStatus[i] === 'wrong' ? ' selected-wrong'
                     : '';
          return `<div class="corsi-block${lit}${stat}" data-block="${i}" style="left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;height:${pos.h}%;"></div>`;
        }).join('')}
      </div>
    `;
  }

  /* ═══ Run a single sequence ═══ */
  function runSequence(span, config, onResult) {
    const sequence = API.generateSequence(span);

    const meta = {
      sequence,
      userIdx: 0,
      errors: 0,
      startTime: performance.now(),
      responded: false,
      ended: false
    };

    // Show phase
    API.setPhase('show');
    API.render(renderBoard([], {}, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));

    let flashIdx = 0;
    function flashNext() {
      if (meta.ended) return;
      if (flashIdx >= sequence.length) {
        // End of show phase → input phase
        push(showInput, 400);
        return;
      }
      const blockIdx = sequence[flashIdx];

      API.render(renderBoard([blockIdx], {}, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));
      if (S && S.blockLight) S.blockLight();

      push(() => {
        if (meta.ended) return;
        flashIdx++;
        API.render(renderBoard([], {}, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));
        push(flashNext, config.gapDuration);
      }, config.flashDuration);
    }

    function showInput() {
      if (meta.ended) return;
      API.setPhase('input');
      meta.startTime = performance.now();

      const status = {};
      API.render(renderBoard([], status, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));
      wireBlocks(handleBlockClick);

      function handleBlockClick(idx) {
        if (meta.responded || meta.ended) return;

        const expected = meta.sequence[meta.userIdx];
        if (idx === expected) {
          status[idx] = 'correct';
          meta.userIdx++;
          if (S && S.blockTap) S.blockTap();

          API.render(renderBoard([], status, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));
          wireBlocks(handleBlockClick);

          if (meta.userIdx >= meta.sequence.length) {
            // Success
            meta.responded = true;
            const rt = performance.now() - meta.startTime;
            API.showFeedbackFlash(true);
            if (S) S.hit();
            push(() => onResult({ success: true, rt, span }), 500);
          }
        } else {
          // Wrong
          status[idx] = 'wrong';
          meta.responded = true;
          if (S) S.miss();
          API.showFeedbackFlash(false);
          API.render(renderBoard([], status, config.badgeHTML, config.hudHTML ? config.hudHTML() : ''));
          push(() => onResult({ success: false, rt: 0, span }), 700);
        }
      }
    }

    function wireBlocks(handler) {
      API.getElContent().querySelectorAll('.corsi-block').forEach(b => {
        b.addEventListener('click', () => handler(parseInt(b.dataset.block, 10)));
      });
    }

    // Kick off
    push(flashNext, 400);

    return meta;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 15 sequences · 400ms flash · 180ms gap
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', seq: 0, total: 15, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 sequences · Fast flash', nextSpeedSeq);
  }

  function nextSpeedSeq() {
    if (M.ended) return;
    if (M.seq >= M.total) { endSpeed(); return; }

    // Span varies: 3-6
    const span = 3 + Math.floor(M.seq / 4);
    M.seq++;

    runSequence(span, {
      flashDuration: 400,
      gapDuration: 180,
      badgeHTML: `<div class="practice-badge">SPEED · ${M.seq} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="span-indicator">
          <span class="si-val">${span}</span>
          <span class="si-label">BLOCKS</span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);
      }
      push(nextSpeedSeq, 500);
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
      <p class="phase-sub">${accuracy}% sequences correct</p>
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
    API.emit({ gameId: 'corsi-blocks', domain: 'spatial', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, span: 3, totalCorrect: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', nextEndlessSeq);
  }

  function nextEndlessSeq() {
    if (M.ended) return;

    const span = M.span;

    runSequence(span, {
      flashDuration: Math.max(300, 650 - M.level * 25),
      gapDuration: 200,
      hudHTML: () => `
        <div class="endless-hud">
          <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
          <div class="hud-item"><div class="hud-val">${M.span}</div><div class="hud-lbl">SPAN</div></div>
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

      // Level up every 2 correct → span +1
      if (M.totalCorrect % 2 === 0 && M.span < 9) {
        M.level++;
        M.span++;
        API.showLevelUpFlash(`SPAN ${M.span}!`);
        if (S) S.levelUp();
      } else {
        M.level++;
      }
      push(nextEndlessSeq, 700);
    });
  }

  function endEndless() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Span ${M.span}</h1>
      <p class="phase-sub">You missed a block.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">MAX SPAN</div><div class="stat-value">${M.span}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.totalCorrect}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('endless', { levelReached: M.span });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.span, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'corsi-blocks', domain: 'spatial', mode: 'endless', levelReached: M.span, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 sequences · 900ms flash
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', seq: 0, total: 15, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 sequences · Slow flash', nextPrecisionSeq);
  }

  function nextPrecisionSeq() {
    if (M.ended) return;
    if (M.seq >= M.total) { endPrecision(); return; }

    const span = 3 + Math.floor(M.seq / 4);
    M.seq++;

    runSequence(span, {
      flashDuration: 900,
      gapDuration: 400,
      badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.seq} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="span-indicator">
          <span class="si-val">${span}</span>
          <span class="si-label">BLOCKS</span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 120000) M.rtList.push(result.rt);
      }
      push(nextPrecisionSeq, 600);
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
      <p class="phase-sub">${M.correct}/${M.total} sequences correct</p>
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
    API.emit({ gameId: 'corsi-blocks', domain: 'spatial', mode: 'precision', accuracy, medianRT, totalTrials: M.total, totalCorrect: M.correct });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 sequences · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', seq: 0, total: 20, correct: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 sequences · Fixed protocol', nextDailySeq);
  }

  function nextDailySeq() {
    if (M.ended) return;
    if (M.seq >= M.total) { endDaily(); return; }

    const span = 3 + Math.floor(M.seq / 5);
    M.seq++;

    runSequence(span, {
      flashDuration: 600,
      gapDuration: 250,
      badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.seq} / ${M.total}</div>`,
      hudHTML: () => `
        <div class="span-indicator">
          <span class="si-val">${span}</span>
          <span class="si-label">BLOCKS</span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);
      }
      push(nextDailySeq, 450);
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
    API.emit({ gameId: 'corsi-blocks', domain: 'spatial', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.CorsiBlocksExtraModes = { getModeDefinitions, start };
})();