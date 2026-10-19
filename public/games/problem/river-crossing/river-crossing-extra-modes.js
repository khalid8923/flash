/* ═══════════════════════════════════════════════════════════
   FLASH — River Crossing Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.RCAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '10 puzzles · Faster planning',        meta: '→ 90s per puzzle' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One illegal move = game over',        meta: '→ Level ∞' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '10 puzzles · No rush · Max accuracy',  meta: '→ 100% for Gold' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '15 puzzles · Fixed protocol',         meta: '→ Once per day' }
    ];
  }

  function renderScene(puzzle, bank, boatSide, selectedItems, badgeHTML, hudHTML) {
    const leftItems = puzzle.items.filter(it => bank[it.id] === 'left');
    const rightItems = puzzle.items.filter(it => bank[it.id] === 'right');

    function renderTile(it, disabled) {
      const sel = selectedItems.includes(it.id);
      return `
        <div class="item-tile ${sel ? 'selected' : ''} ${disabled ? 'disabled' : ''}" data-item="${it.id}">
          <span class="tile-icon">${it.icon}</span>
          <span class="tile-name">${it.name}</span>
        </div>
      `;
    }

    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="river-scene">
        <div class="bank left-bank" data-label="LEFT BANK">
          <div class="bank-slots">
            ${leftItems.map(it => renderTile(it, false)).join('') || '<div style="color:var(--t3);font-size:11px;">— empty —</div>'}
          </div>
        </div>
        <div class="river-strip">
          <div class="boat ${boatSide === 'left' ? 'on-left' : 'on-right'}">🚣</div>
        </div>
        <div class="bank right-bank" data-label="RIGHT BANK">
          <div class="bank-slots">
            ${rightItems.map(it => renderTile(it, true)).join('') || '<div style="color:var(--t3);font-size:11px;">— empty —</div>'}
          </div>
        </div>
      </div>
      <div class="river-controls">
        <button class="ctrl-btn" id="sail-btn">SAIL →</button>
        <button class="ctrl-btn secondary" id="clear-btn">Clear Selection</button>
      </div>
    `;
  }

  function wireTiles(handler) {
    API.getElContent().querySelectorAll('.item-tile:not(.disabled)').forEach(t => {
      t.addEventListener('click', () => handler(t.dataset.item));
    });
  }

  /* ═══════════════════════════════════════════════════════
     Generic puzzle loop — shared across modes
     ═══════════════════════════════════════════════════════ */
  function runPuzzle(puzzle, onSolved, onFailed, opts) {
    opts = opts || {};
    const bank = {};
    puzzle.items.forEach(it => bank[it.id] = 'left');
    let boatSide = 'left';
    let selected = [];
    let moves = 0;
    let solved = false;
    let ended = false;

    const optimalMoves = puzzle.optimalMoves;

    function getHud() {
      return `
        <div class="move-info">
          <span class="mv">MOVES <span class="mv-num">${moves}</span></span>
          <span class="mv">OPTIMAL <span class="mv-num good">${optimalMoves}</span></span>
          ${opts.timeRemaining != null ? `<span class="mv">TIME <span class="mv-num">${Math.ceil(opts.timeRemaining()/1000)}s</span></span>` : ''}
        </div>
      `;
    }

    function renderSceneNow() {
      API.setPhase('trial');
      API.render(renderScene(puzzle, bank, boatSide, selected, opts.badgeHTML, getHud()));
      wireTiles(handleTile);
      const sailBtn = API.$('sail-btn');
      if (sailBtn) sailBtn.addEventListener('click', handleSail);
      const clearBtn = API.$('clear-btn');
      if (clearBtn) clearBtn.addEventListener('click', () => {
        selected = [];
        renderSceneNow();
      });
    }

    function handleTile(itemId) {
      if (ended) return;
      // Only allow selecting items on the boat's side
      if (bank[itemId] !== boatSide) return;
      if (selected.includes(itemId)) {
        selected = selected.filter(x => x !== itemId);
      } else {
        if (selected.length >= puzzle.boatCapacity) {
          // Replace oldest
          selected.shift();
        }
        selected.push(itemId);
      }
      if (S && S.itemPick) S.itemPick();
      renderSceneNow();
    }

    function handleSail() {
      if (ended) return;
      if (selected.length === 0 && !opts.allowEmptySail) {
        // Empty sail not allowed — shake
        return;
      }
      // Move selected items to the other side
      selected.forEach(id => bank[id] = boatSide === 'left' ? 'right' : 'left');
      boatSide = boatSide === 'left' ? 'right' : 'left';
      moves++;
      selected = [];
      if (S && S.sail) S.sail();

      // Check danger
      const danger = puzzle.detectDanger(bank, boatSide);
      if (danger) {
        ended = true;
        API.showFeedbackFlash(false);
        onFailed(moves, danger);
        return;
      }

      // Check win
      const allRight = puzzle.items.every(it => bank[it.id] === 'right');
      if (allRight) {
        ended = true;
        solved = true;
        API.showFeedbackFlash(true);
        onSolved(moves, optimalMoves);
        return;
      }

      renderSceneNow();
    }

    renderSceneNow();

    return { isSolved: () => solved, isEnded: () => ended, getMoves: () => moves };
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 10 puzzles · 90s each
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    M = { mode: 'speed', puzzle: 0, total: 10, solved: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '10 puzzles · 90s each', () => nextSpeedPuzzle());
  }

  function nextSpeedPuzzle() {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endSpeed(); return; }

    const puzzle = API.getPuzzle((M.puzzle % 4) + 1);
    M.puzzle++;
    const t0 = performance.now();
    const TIME_LIMIT = 90000;
    let timerId = null;

    timerId = setInterval(() => {
      const elapsed = performance.now() - t0;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      const pct = (remaining / TIME_LIMIT) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      const timeEl = API.getElContent().querySelector('.move-info .mv:last-child .mv-num');
      if (timeEl && timeEl.textContent !== '—') {
        timeEl.textContent = Math.ceil(remaining / 1000) + 's';
      }
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        // Timeout = fail
        if (S) S.miss();
        M.puzzle++;
        push(() => nextSpeedPuzzle(), 700);
      }
    }, 60);
    timeouts.push(timerId);

    runPuzzle(
      puzzle,
      (moves) => {
        if (timerId) { clearInterval(timerId); timerId = null; }
        const rt = performance.now() - t0;
        if (rt >= 100 && rt <= TIME_LIMIT) M.rtList.push(rt);
        M.solved++;
        if (S) S.hit();
        push(() => nextSpeedPuzzle(), 900);
      },
      () => {
        if (timerId) { clearInterval(timerId); timerId = null; }
        push(() => nextSpeedPuzzle(), 900);
      },
      {
        badgeHTML: `<div class="practice-badge">SPEED · ${M.puzzle} / ${M.total}</div>`,
        timeRemaining: () => 0
      }
    );
  }

  function endSpeed() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.victory();
    const medianRT = H.median(M.rtList);
    const accuracy = Math.round((M.solved / M.total) * 100);

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${M.solved}/${M.total}</h1>
      <p class="phase-sub">${accuracy}% solved</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.solved}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const nb = H.checkAndUnlockBadges('speed', { totalCorrect: M.solved, medianRT, accuracy });
    if (nb.length && S) S.badge();
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: M.solved, accuracy, medianRT });
    API.emit({ gameId: 'river-crossing', domain: 'problem', mode: 'speed', totalCorrect: M.solved, totalTrials: M.total, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One illegal move = game over
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = { mode: 'endless', level: 1, totalSolved: 0, ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One illegal move ends the run', nextEndlessPuzzle);
  }

  function nextEndlessPuzzle() {
    if (M.ended) return;
    const puzzleId = ((M.level - 1) % 4) + 1;
    const puzzle = API.getPuzzle(puzzleId);

    runPuzzle(
      puzzle,
      () => {
        M.totalSolved++;
        M.level++;
        API.showLevelUpFlash(`LEVEL ${M.level}!`);
        if (S) S.levelUp();
        push(nextEndlessPuzzle, 1000);
      },
      () => {
        push(endEndless, 900);
      },
      {
        allowEmptySail: false,
        hudHTML: `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${M.totalSolved}</div><div class="hud-lbl">SOLVED</div></div>
          </div>
        `
      }
    );
  }

  function endEndless() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">Illegal move — the run ends here.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.totalSolved}</div></div>
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
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalSolved });
    API.emit({ gameId: 'river-crossing', domain: 'problem', mode: 'endless', levelReached: M.level, totalCorrect: M.totalSolved });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 10 puzzles · No rush
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = { mode: 'precision', puzzle: 0, total: 10, solved: 0, rtList: [], optimalCount: 0, ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '10 puzzles · Accuracy only', nextPrecisionPuzzle);
  }

  function nextPrecisionPuzzle() {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endPrecision(); return; }

    const puzzle = API.getPuzzle((M.puzzle % 4) + 1);
    M.puzzle++;
    const t0 = performance.now();

    runPuzzle(
      puzzle,
      (moves, optimal) => {
        const rt = performance.now() - t0;
        if (rt >= 100 && rt <= 300000) M.rtList.push(rt);
        M.solved++;
        if (moves === optimal) M.optimalCount++;
        if (S) S.hit();
        push(nextPrecisionPuzzle, 1000);
      },
      () => {
        push(endPrecision, 900);
      },
      {
        allowEmptySail: false,
        badgeHTML: `<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · ${M.puzzle} / ${M.total}</div>`
      }
    );
  }

  function endPrecision() {
    M.ended = true; clearAll();
    API.setPhase('gameover');
    if (S) S.victory();
    const accuracy = Math.round((M.solved / M.total) * 100);
    const medianRT = H.median(M.rtList);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.solved}/${M.total} solved · ${M.optimalCount} optimal</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.solved}/${M.total}</div></div>
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
    API.emit({ gameId: 'river-crossing', domain: 'problem', mode: 'precision', accuracy, medianRT, totalTrials: M.total, optimalCount: M.optimalCount });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 15 puzzles · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = { mode: 'daily', puzzle: 0, total: 15, solved: 0, rtList: [], ended: false };
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '15 puzzles · Fixed protocol', nextDailyPuzzle);
  }

  function nextDailyPuzzle() {
    if (M.ended) return;
    if (M.puzzle >= M.total) { endDaily(); return; }

    const puzzle = API.getPuzzle((M.puzzle % 4) + 1);
    M.puzzle++;
    const t0 = performance.now();

    runPuzzle(
      puzzle,
      () => {
        const rt = performance.now() - t0;
        if (rt >= 100 && rt <= 300000) M.rtList.push(rt);
        M.solved++;
        if (S) S.hit();
        push(nextDailyPuzzle, 800);
      },
      () => {
        push(nextDailyPuzzle, 700);
      },
      {
        allowEmptySail: false,
        badgeHTML: `<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · ${M.puzzle} / ${M.total}</div>`
      }
    );
  }

  function endDaily() {
    M.ended = true; clearAll();
    const accuracy = Math.round((M.solved / M.total) * 100);
    const rcs = H.rcs(M.solved, M.rtList);
    H.markTodayDone({ rcs, accuracy });
    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">${M.solved}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'river-crossing', domain: 'problem', mode: 'daily', accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef; clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.RiverCrossingExtraModes = { getModeDefinitions, start };
})();