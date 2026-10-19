/* ═══════════════════════════════════════════════════════════
   FLASH — Path Finder Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.PFAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 mazes · Faster planning',         meta: '→ 60s per maze' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',             meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '10 mazes · No rush · Optimal only',   meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '15 mazes · Fixed protocol',           meta: '→ Once per day' }
    ];
  }

  /* ═══ Generic maze runner ═══ */
  function runMaze(size, config, onComplete) {
    const maze = API.generateMaze(size);
    const optimalPath = API.solveMaze(maze);
    const optimalSteps = optimalPath.length - 1;

    let playerPos = maze.start;
    let steps = 0;
    const visited = new Set();
    visited.add(playerPos.row + ',' + playerPos.col);

    const startTime = performance.now();
    let timeLimit = config.timeLimit || 0;
    let timerId = null;
    let ended = false;

    function renderNow() {
      API.setPhase('trial');
      API.render(API.renderMaze(
        maze, playerPos, visited,
        config.badgeHTML,
        config.hudHTML(steps, optimalSteps, timeLimit)
      ));
      wireDPad();
    }

    function wireDPad() {
      API.getElContent().querySelectorAll('.d-btn[data-dir]').forEach(btn => {
        btn.addEventListener('click', () => tryMove(btn.dataset.dir));
      });
    }

    function tryMove(dir) {
      if (ended) return;
      const next = API.movePlayer(maze, playerPos, dir);
      if (!next) {
        if (S && S.wallBump) S.wallBump();
        return;
      }
      playerPos = next;
      steps++;
      visited.add(playerPos.row + ',' + playerPos.col);
      if (S && S.step) S.step();

      if (API.isGoal(maze, playerPos)) {
        ended = true;
        if (timerId) { clearInterval(timerId); timerId = null; }
        const rt = performance.now() - startTime;
        API.showFeedbackFlash(true);
        if (S && S.goalReached) S.goalReached();
        push(() => onComplete({
          success: true,
          steps,
          optimalSteps,
          isOptimal: steps === optimalSteps,
          rt
        }), 700);
        return;
      }

      renderNow();
    }

    // Expose for keyboard
    M.tryMove = tryMove;

    renderNow();

    if (timeLimit > 0) {
      const tStart = performance.now();
      timerId = setInterval(() => {
        if (ended) { clearInterval(timerId); return; }
        const elapsed = performance.now() - tStart;
        const remaining = Math.max(0, timeLimit - elapsed);
        const pct = (remaining / timeLimit) * 100;
        API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
        const timeEl = API.getElContent().querySelector('.mv-time-val');
        if (timeEl) timeEl.textContent = Math.ceil(remaining / 1000) + 's';
        if (remaining <= 0) {
          clearInterval(timerId);
          timerId = null;
          ended = true;
          if (S) S.miss();
          API.showFeedbackFlash(false);
          push(() => onComplete({
            success: false,
            steps,
            optimalSteps,
            isOptimal: false,
            rt: 0
          }), 700);
        }
      }, 100);
      timeouts.push(timerId);
    }
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 10 mazes · 60s each
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', round: 0, total: 10, correct: 0, rtList: [], ended: false, tryMove: null };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 mazes · 60s each', nextSpeedRound);
  }

  function nextSpeedRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endSpeed(); return; }

    const size = 9 + M.round * 2;
    M.round++;

    runMaze(size, {
      timeLimit: 60000,
      badgeHTML: `<div class="practice-badge">SPEED · ${M.round} / ${M.total}</div>`,
      hudHTML: (steps, optimal, tl) => `
        <div class="move-info">
          <span class="mv"><span>MOVES</span><span class="mv-num">${steps}</span></span>
          <span class="mv"><span>OPTIMAL</span><span class="mv-num good">${optimal}</span></span>
          <span class="mv"><span>TIME</span><span class="mv-num mv-time-val">${Math.ceil(tl/1000)}s</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.rt >= 100 && result.rt <= 60000) M.rtList.push(result.rt);
      }
      push(nextSpeedRound, 700);
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
    API.emit({ gameId: 'path-finder', domain: 'problem', mode: 'speed', totalCorrect: M.correct, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake (non-optimal) = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, totalCorrect: 0, ended: false, tryMove: null };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One extra move ends the run', nextEndlessMaze);
  }

  function nextEndlessMaze() {
    if (M.ended) return;

    const size = 7 + M.level * 2;

    runMaze(size, {
      hudHTML: (steps, optimal) => `
        <div class="move-info">
          <span class="mv"><span>LEVEL</span><span class="mv-num">${M.level}</span></span>
          <span class="mv"><span>MOVES</span><span class="mv-num">${steps}</span></span>
          <span class="mv"><span>OPTIMAL</span><span class="mv-num good">${optimal}</span></span>
        </div>
      `
    }, (result) => {
      if (!result.success || !result.isOptimal) {
        push(endEndless, 700);
        return;
      }
      M.totalCorrect++;
      M.level++;
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
      push(nextEndlessMaze, 800);
    });
  }

  function endEndless() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">Non-optimal move — the run ends here.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${M.totalCorrect}</div></div>
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
    API.emit({ gameId: 'path-finder', domain: 'problem', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 10 mazes · No timer · Optimal only
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', round: 0, total: 10, optimalCount: 0, rtList: [], ended: false, tryMove: null };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '10 mazes · Optimal moves only', nextPrecisionRound);
  }

  function nextPrecisionRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endPrecision(); return; }

    const size = 11 + M.round * 1.5;
    M.round++;

    runMaze(size, {
      badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.round} / ${M.total}</div>`,
      hudHTML: (steps, optimal) => `
        <div class="move-info">
          <span class="mv"><span>MOVES</span><span class="mv-num">${steps}</span></span>
          <span class="mv"><span>OPTIMAL</span><span class="mv-num good">${optimal}</span></span>
          <span class="mv"><span>OPTIMAL SOLVES</span><span class="mv-num good">${M.optimalCount}</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        if (result.isOptimal) M.optimalCount++;
        if (result.rt >= 100 && result.rt <= 300000) M.rtList.push(result.rt);
      }
      push(nextPrecisionRound, 700);
    });
  }

  function endPrecision() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const rate = Math.round((M.optimalCount / M.total) * 100);
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${rate}%</h1>
      <p class="phase-sub">${M.optimalCount}/${M.total} solved optimally</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${M.optimalCount}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('precision', { accuracy: rate });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy: rate, medianRT });
    API.emit({ gameId: 'path-finder', domain: 'problem', mode: 'precision', accuracy: rate, medianRT, totalTrials: M.total, optimalCount: M.optimalCount });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 15 mazes · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', round: 0, total: 15, correct: 0, optimalCount: 0, rtList: [], ended: false, tryMove: null };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '15 mazes · Fixed protocol', nextDailyRound);
  }

  function nextDailyRound() {
    if (M.ended) return;
    if (M.round >= M.total) { endDaily(); return; }

    const size = 9 + Math.floor(M.round / 2) * 2;
    M.round++;

    runMaze(size, {
      badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.round} / ${M.total}</div>`,
      hudHTML: (steps, optimal) => `
        <div class="move-info">
          <span class="mv"><span>MOVES</span><span class="mv-num">${steps}</span></span>
          <span class="mv"><span>OPTIMAL</span><span class="mv-num good">${optimal}</span></span>
        </div>
      `
    }, (result) => {
      if (result.success) {
        M.correct++;
        if (result.isOptimal) M.optimalCount++;
        if (result.rt >= 100 && result.rt <= 300000) M.rtList.push(result.rt);
      }
      push(nextDailyRound, 600);
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
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">OPTIMAL</div><div class="stat-value">${M.optimalCount}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'path-finder', domain: 'problem', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.PathFinderExtraModes = { getModeDefinitions, start };
})();