/* ═══════════════════════════════════════════════════════════
   FLASH — Hanoi Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.HanoiAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 puzzles · Faster planning',        meta: '→ 40s per puzzle' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One illegal move = game over',        meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '10 puzzles · No rush · Max accuracy',  meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '15 puzzles · Fixed protocol',         meta: '→ Once per day' }
    ];
  }

  /* ═══ Shared board renderer ═══ */
  function renderBoard(pegs, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="hanoi-board">
        ${pegs.map((peg, i) => {
          const disksHTML = peg.map((disk, j) => {
            const w = 34 + disk * 8;
            const colors = ['#FF4D6D', '#FF9F1C', '#FFD60A', '#00FF96', '#00EEFF', '#9D4EDD', '#FF0077'];
            const color = colors[(disk - 1) % colors.length];
            return `<div class="disk" style="width:${w}px;background:${color}"><span class="disk-label">${disk}</span></div>`;
          }).join('');
          return `
            <div class="peg-col" data-peg="${i}">
              ${disksHTML}
              <div class="peg-col-label">${['A','B','C'][i]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderMoveInfo(moves, optimal, minMoves, timeRemaining) {
    const moveClass = moves === optimal ? 'good' : (moves > minMoves * 1.8 ? 'bad' : 'warn');
    return `
      <div class="move-info">
        <span class="mv">MOVES <span class="mv-num ${moveClass}">${moves}</span></span>
        <span class="mv">OPTIMAL <span class="mv-num good">${optimal}</span></span>
        ${timeRemaining != null ? `<span class="mv">TIME <span class="mv-num">${Math.ceil(timeRemaining / 1000)}s</span></span>` : ''}
      </div>
    `;
  }

  function wirePegs(handler) {
    API.getElContent().querySelectorAll('.peg-col').forEach(peg => {
      peg.addEventListener('click', () => handler(parseInt(peg.dataset.peg, 10)));
    });
  }

  /* ═══════════════════════════════════════════════════════
     CORE GAME LOOP — shared across modes
     ═══════════════════════════════════════════════════════ */
  function setupHanoi(numDisks) {
    const pegs = [[], [], []];
    for (let i = numDisks; i >= 1; i--) pegs[0].push(i);
    return pegs;
  }

  function isWin(pegs, numDisks) {
    return pegs[2].length === numDisks;
  }

  function canMove(pegs, from, to) {
    if (from === to) return false;
    const fp = pegs[from], tp = pegs[to];
    if (fp.length === 0) return false;
    if (tp.length === 0) return true;
    return fp[fp.length - 1] < tp[tp.length - 1];
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 10 puzzles · 40s each
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    const TOTAL = 10, TIME_LIMIT = 40000;
    M = {
      mode: 'speed', puzzle: 0, total: TOTAL, correct: 0, rtList: [],
      pegs: null, numDisks: 0, moves: 0, selectedPeg: -1,
      ended: false, solved: false, timerId: null, endTime: 0
    };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 puzzles · 40s each', () => nextSpeedPuzzle(TIME_LIMIT));
  }

  function nextSpeedPuzzle(TIME_LIMIT) {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endSpeed(); return; }

    M.numDisks = Math.min(5, 3 + Math.floor(M.puzzle / 3));
    M.pegs = setupHanoi(M.numDisks);
    M.moves = 0;
    M.selectedPeg = -1;
    M.solved = false;
    M.puzzle++;
    M.startTime = performance.now();
    M.endTime = performance.now() + TIME_LIMIT;

    API.setPhase('trial');
    renderSpeedBoard();
    startSpeedTimer(TIME_LIMIT);
  }

  function renderSpeedBoard() {
    const timeRemaining = Math.max(0, M.endTime - performance.now());
    API.render(renderBoard(M.pegs,
      `<div class="practice-badge">SPEED · ${M.puzzle} / ${M.total}</div>`,
      renderMoveInfo(M.moves, Math.pow(2, M.numDisks) - 1, Math.pow(2, M.numDisks) - 1, timeRemaining)
    ));
    wirePegs(handleSpeedPeg);
  }

  function startSpeedTimer(TIME_LIMIT) {
    if (M.timerId) clearInterval(M.timerId);
    M.timerId = setInterval(() => {
      if (M.ended || M.solved) { clearInterval(M.timerId); return; }
      const remaining = Math.max(0, M.endTime - performance.now());
      const pct = (remaining / TIME_LIMIT) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');

      // Update time display
      const timeEl = API.getElContent().querySelector('.move-info .mv:last-child .mv-num');
      if (timeEl && timeEl.textContent !== '—') {
        timeEl.textContent = Math.ceil(remaining / 1000) + 's';
      }

      if (remaining <= 0) {
        clearInterval(M.timerId);
        M.timerId = null;
        if (!M.solved) {
          // Timeout — mark as failed
          M.puzzle++;
          push(() => nextSpeedPuzzle(TIME_LIMIT), 800);
        }
      }
    }, 60);
    timeouts.push(M.timerId);
  }

  function handleSpeedPeg(pegIdx) {
    if (M.ended || M.solved) return;

    if (M.selectedPeg === -1) {
      if (M.pegs[pegIdx].length > 0) {
        M.selectedPeg = pegIdx;
        if (S) S.diskPick();
        highlightPeg(pegIdx);
      }
    } else {
      if (M.selectedPeg === pegIdx) {
        M.selectedPeg = -1;
        unhighlightAll();
        return;
      }
      if (canMove(M.pegs, M.selectedPeg, pegIdx)) {
        const disk = M.pegs[M.selectedPeg].pop();
        M.pegs[pegIdx].push(disk);
        M.moves++;
        M.selectedPeg = -1;
        if (S) S.diskPlace();
        renderSpeedBoard();

        if (isWin(M.pegs, M.numDisks)) {
          M.solved = true;
          const rt = performance.now() - M.startTime;
          if (rt >= 100 && rt <= TIME_LIMIT) M.rtList.push(rt);
          M.correct++;
          if (S) S.hit();
          API.showFeedbackFlash(true);
          clearInterval(M.timerId);
          M.timerId = null;
          push(() => nextSpeedPuzzle(TIME_LIMIT), 1000);
        }
      } else {
        // Illegal move
        if (S) S.miss();
        unhighlightAll();
        const el = API.getElContent().querySelector(`[data-peg="${pegIdx}"]`);
        if (el) {
          el.classList.add('placed-wrong');
          push(() => el.classList.remove('placed-wrong'), 400);
        }
        M.selectedPeg = -1;
      }
    }
  }

  function highlightPeg(idx) {
    unhighlightAll();
    const el = API.getElContent().querySelector(`[data-peg="${idx}"]`);
    if (el) el.classList.add('selected');
  }

  function unhighlightAll() {
    API.getElContent().querySelectorAll('.peg-col').forEach(p => p.classList.remove('selected'));
  }

  function endSpeed() {
    M.ended = true; clearAll(); API.setPhase('gameover');
    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${M.correct}/${M.total}</h1>
      <p class="phase-sub">${accuracy}% solved</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.correct}/${M.total}</div></div>
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
    API.emit({ gameId: 'hanoi', domain: 'problem', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One illegal move = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = {
      mode: 'endless', level: 1, totalCorrect: 0,
      pegs: null, numDisks: 3, moves: 0, selectedPeg: -1,
      ended: false, solved: false
    };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One illegal move ends the run', nextEndlessPuzzle);
  }

  function nextEndlessPuzzle() {
    if (M.ended) return;
    M.numDisks = Math.min(7, 3 + Math.floor(M.totalCorrect / 2));
    M.pegs = setupHanoi(M.numDisks);
    M.moves = 0;
    M.selectedPeg = -1;
    M.solved = false;
    M.startTime = performance.now();

    API.setPhase('trial');
    API.render(renderBoard(M.pegs, null, `
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">SOLVED</div></div>
        <div class="hud-item"><div class="hud-val">${M.numDisks}</div><div class="hud-lbl">DISKS</div></div>
      </div>
    `));
    wirePegs(handleEndlessPeg);
    API.setTimer(100);
  }

  function handleEndlessPeg(pegIdx) {
    if (M.ended || M.solved) return;

    if (M.selectedPeg === -1) {
      if (M.pegs[pegIdx].length > 0) {
        M.selectedPeg = pegIdx;
        if (S) S.diskPick();
        highlightPeg(pegIdx);
      }
    } else {
      if (M.selectedPeg === pegIdx) {
        M.selectedPeg = -1;
        unhighlightAll();
        return;
      }
      if (canMove(M.pegs, M.selectedPeg, pegIdx)) {
        const disk = M.pegs[M.selectedPeg].pop();
        M.pegs[pegIdx].push(disk);
        M.moves++;
        M.selectedPeg = -1;
        if (S) S.diskPlace();

        API.render(renderBoard(M.pegs, null, `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">SOLVED</div></div>
            <div class="hud-item"><div class="hud-val">${M.numDisks}</div><div class="hud-lbl">DISKS</div></div>
          </div>
        `));
        wirePegs(handleEndlessPeg);

        if (isWin(M.pegs, M.numDisks)) {
          M.solved = true;
          M.totalCorrect++;
          M.level++;
          API.showLevelUpFlash(`LEVEL ${M.level}!`);
          if (S) S.levelUp();
          push(nextEndlessPuzzle, 900);
        }
      } else {
        if (S) S.miss();
        unhighlightAll();
        push(() => endEndless('illegal'), 700);
      }
    }
  }

  function endEndless() {
    M.ended = true; clearAll(); API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">Illegal move — the run ends here.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.totalCorrect}</div></div>
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
    API.emit({ gameId: 'hanoi', domain: 'problem', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 10 puzzles · No rush
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision', puzzle: 0, total: 10, correct: 0, rtList: [],
      pegs: null, numDisks: 0, moves: 0, selectedPeg: -1,
      ended: false, solved: false, optimalCount: 0
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '10 puzzles · Accuracy only', nextPrecisionPuzzle);
  }

  function nextPrecisionPuzzle() {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endPrecision(); return; }

    M.numDisks = Math.min(6, 4 + Math.floor(M.puzzle / 4));
    M.pegs = setupHanoi(M.numDisks);
    M.moves = 0;
    M.selectedPeg = -1;
    M.solved = false;
    M.puzzle++;
    M.startTime = performance.now();

    API.setPhase('trial');
    API.render(renderBoard(M.pegs,
      `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.puzzle} / ${M.total}</div>`,
      renderMoveInfo(M.moves, Math.pow(2, M.numDisks) - 1, Math.pow(2, M.numDisks) - 1, null)
    ));
    wirePegs(handlePrecisionPeg);
    API.setTimer(100);
  }

  function handlePrecisionPeg(pegIdx) {
    if (M.ended || M.solved) return;

    if (M.selectedPeg === -1) {
      if (M.pegs[pegIdx].length > 0) {
        M.selectedPeg = pegIdx;
        if (S) S.diskPick();
        highlightPeg(pegIdx);
      }
    } else {
      if (M.selectedPeg === pegIdx) {
        M.selectedPeg = -1;
        unhighlightAll();
        return;
      }
      if (canMove(M.pegs, M.selectedPeg, pegIdx)) {
        const disk = M.pegs[M.selectedPeg].pop();
        M.pegs[pegIdx].push(disk);
        M.moves++;
        M.selectedPeg = -1;
        if (S) S.diskPlace();
        API.render(renderBoard(M.pegs,
          `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.puzzle} / ${M.total}</div>`,
          renderMoveInfo(M.moves, Math.pow(2, M.numDisks) - 1, Math.pow(2, M.numDisks) - 1, null)
        ));
        wirePegs(handlePrecisionPeg);

        if (isWin(M.pegs, M.numDisks)) {
          M.solved = true;
          const optimal = Math.pow(2, M.numDisks) - 1;
          const wasOptimal = M.moves === optimal;
          if (wasOptimal) M.optimalCount++;
          M.correct++;
          const rt = performance.now() - M.startTime;
          if (rt >= 100 && rt <= 120000) M.rtList.push(rt);
          if (S) S.hit();
          API.showFeedbackFlash(true);
          push(() => nextPrecisionPuzzle(), 1000);
        }
      } else {
        if (S) S.miss();
        unhighlightAll();
        push(() => endPrecision(), 800);
      }
    }
  }

  function endPrecision() {
    M.ended = true; clearAll(); API.setPhase('gameover');
    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} solved · ${M.optimalCount} optimal</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${M.optimalCount}</div></div>
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
    API.emit({ gameId: 'hanoi', domain: 'problem', mode: 'precision', accuracy, medianRT, totalTrials: M.total, optimalCount: M.optimalCount });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 15 puzzles · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily', puzzle: 0, total: 15, correct: 0, rtList: [],
      pegs: null, numDisks: 0, moves: 0, selectedPeg: -1,
      ended: false, solved: false
    };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '15 puzzles · Fixed protocol', nextDailyPuzzle);
  }

  function nextDailyPuzzle() {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endDaily(); return; }

    M.numDisks = Math.min(6, 3 + Math.floor(M.puzzle / 5));
    M.pegs = setupHanoi(M.numDisks);
    M.moves = 0;
    M.selectedPeg = -1;
    M.solved = false;
    M.puzzle++;
    M.startTime = performance.now();

    API.setPhase('trial');
    API.render(renderBoard(M.pegs,
      `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.puzzle} / ${M.total}</div>`,
      renderMoveInfo(M.moves, Math.pow(2, M.numDisks) - 1, Math.pow(2, M.numDisks) - 1, null)
    ));
    wirePegs(handleDailyPeg);
    API.setTimer(100);
  }

  function handleDailyPeg(pegIdx) {
    if (M.ended || M.solved) return;

    if (M.selectedPeg === -1) {
      if (M.pegs[pegIdx].length > 0) {
        M.selectedPeg = pegIdx;
        if (S) S.diskPick();
        highlightPeg(pegIdx);
      }
    } else {
      if (M.selectedPeg === pegIdx) {
        M.selectedPeg = -1;
        unhighlightAll();
        return;
      }
      if (canMove(M.pegs, M.selectedPeg, pegIdx)) {
        const disk = M.pegs[M.selectedPeg].pop();
        M.pegs[pegIdx].push(disk);
        M.moves++;
        M.selectedPeg = -1;
        if (S) S.diskPlace();
        API.render(renderBoard(M.pegs,
          `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.puzzle} / ${M.total}</div>`,
          renderMoveInfo(M.moves, Math.pow(2, M.numDisks) - 1, Math.pow(2, M.numDisks) - 1, null)
        ));
        wirePegs(handleDailyPeg);

        if (isWin(M.pegs, M.numDisks)) {
          M.solved = true;
          M.correct++;
          const rt = performance.now() - M.startTime;
          if (rt >= 100 && rt <= 120000) M.rtList.push(rt);
          if (S) S.hit();
          API.showFeedbackFlash(true);
          push(() => nextDailyPuzzle(), 800);
        }
      } else {
        if (S) S.miss();
        unhighlightAll();
        push(() => nextDailyPuzzle(), 700);
      }
    }
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
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'hanoi', domain: 'problem', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.HanoiExtraModes = { getModeDefinitions, start };
})();