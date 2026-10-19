/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Extra Modes
   Time Attack · Boss Fight · Reverse
   ─────────────────────────────────────────────────────────
   Loaded BEFORE game.js
   Uses window.FlankerAPI (exposed by game.js at runtime)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null;
  let timeouts = [];
  let timerId = null;
  let S = {};   // extra-mode state

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  function push(fn, delay) { const id = setTimeout(fn, delay); timeouts.push(id); return id; }
  function safeRT(rt) { return rt >= 150 && rt <= 3000; }

  /* ═══════════════════════════════════════════════════════
     MODE DEFINITIONS
     ═══════════════════════════════════════════════════════ */
  function getModeDefinitions() {
    return [
      {
        id: 'time-attack',
        name: 'Time Attack',
        icon: '⏱️',
        desc: '60 seconds · Answer as many as you can',
        meta: '→ Wrong = -3s penalty'
      },
      {
        id: 'boss',
        name: 'Boss Fight',
        icon: '👹',
        desc: '5 brutal trials · All conflicting',
        meta: '→ One mistake = fail'
      },
      {
        id: 'reverse',
        name: 'Reverse',
        icon: '🔄',
        desc: '20 trials · Rule flips mid-game',
        meta: '→ Flip at trial 10'
      }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     ⏱️ TIME ATTACK — 60s, max correct, wrong = penalty
     ═══════════════════════════════════════════════════════ */
  function startTimeAttack() {
    const TOTAL_MS = 60000;
    const PENALTY_MS = 3000;

    S = {
      endTime: 0,
      correct: 0,
      total: 0,
      streak: 0,
      maxStreak: 0,
      rtList: [],
      answered: false,
      currentTrial: null,
      ended: false
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ Time Attack', '60 seconds · Answer as many as you can', () => {
      S.endTime = performance.now() + TOTAL_MS;
      runGlobalTimer(TOTAL_MS, PENALTY_MS);
      nextTATrial(TOTAL_MS, PENALTY_MS);
    });
  }

  function runGlobalTimer(TOTAL_MS, PENALTY_MS) {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      const remaining = Math.max(0, S.endTime - performance.now());
      const pct = (remaining / TOTAL_MS) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      const timeEl = API.$('ta-time');
      if (timeEl) timeEl.textContent = Math.ceil(remaining / 1000);
      if (remaining <= 0 && !S.ended) {
        clearInterval(timerId); timerId = null;
        endTimeAttack();
      }
    }, 50);
  }

  function taHud() {
    return `
      <div class="endless-hud">
        <div class="hud-item">
          <div class="hud-val" id="ta-score">${S.correct}</div>
          <div class="hud-lbl">CORRECT</div>
        </div>
        <div class="hud-item">
          <div class="hud-val" id="ta-time">${Math.ceil(Math.max(0, S.endTime - performance.now()) / 1000)}</div>
          <div class="hud-lbl">SECONDS</div>
        </div>
        <div class="hud-item">
          <div class="hud-val" style="color:${S.streak >= 5 ? '#FFD60A' : 'var(--cyan)'}">${S.streak}</div>
          <div class="hud-lbl">STREAK</div>
        </div>
      </div>
    `;
  }

  function nextTATrial(TOTAL_MS, PENALTY_MS) {
    if (S.ended) return;
    if (performance.now() >= S.endTime) { endTimeAttack(); return; }

    const trial = API.generateTrial(1, 'endless');
    S.currentTrial = { ...trial, startTime: 0, answered: false };
    S.answered = false;

    API.setPhase('trial');
    API.render(taHud() + API.renderFixation());

    push(() => showTAStimulus(TOTAL_MS, PENALTY_MS),
         API.settings().reducedMotion ? 80 : 300);
  }

  function showTAStimulus(TOTAL_MS, PENALTY_MS) {
    if (S.ended || performance.now() >= S.endTime) { endTimeAttack(); return; }

    S.currentTrial.startTime = performance.now();
    API.render(`
      ${taHud()}
      <div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);
    API.getElContent().querySelectorAll('.answer-btn').forEach(b =>
      b.addEventListener('click', () => handleTAAnswer(b, TOTAL_MS, PENALTY_MS)));
  }

  function handleTAAnswer(btn, TOTAL_MS, PENALTY_MS) {
    if (S.answered || S.ended) return;
    if (performance.now() >= S.endTime) { endTimeAttack(); return; }
    S.answered = true;

    const chosen = btn.dataset.side;
    const correct = S.currentTrial.centerDir;
    const isCorrect = chosen === correct;
    const rt = performance.now() - S.currentTrial.startTime;

    S.total++;
    if (isCorrect) {
      S.correct++;
      S.streak++;
      if (S.streak > S.maxStreak) S.maxStreak = S.streak;
      if (safeRT(rt)) S.rtList.push(rt);
    } else {
      S.streak = 0;
      S.endTime -= PENALTY_MS;
    }

    API.getElContent().querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = API.getElContent().querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, true, isCorrect)}</div>`;

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');

    push(() => nextTATrial(TOTAL_MS, PENALTY_MS), isCorrect ? 250 : 500);
  }

  function endTimeAttack() {
    if (S.ended) return;
    S.ended = true;
    clearAll();

    API.setPhase('gameover');
    API.setTimer(0);

    const accuracy = S.total > 0 ? Math.round((S.correct / S.total) * 100) : 0;
    const medianRT = window.FlankerHelpers.median(S.rtList);
    const rtv = window.FlankerHelpers.stdDev(S.rtList);

    API.render(`
      <div class="phase-title">Time Attack Complete</div>
      <h1 class="phase-headline grd">⏱️ Time's Up</h1>
      <p class="phase-sub">You got <strong>${S.correct}</strong> correct in 60 seconds.</p>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${S.correct}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">BEST STREAK</div><div class="stat-value">${S.maxStreak}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startTimeAttack(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    API.onSessionComplete({
      gameId: 'flanker', domain: 'attention', mode: 'time-attack',
      totalCorrect: S.correct, totalTrials: S.total,
      accuracy, medianRT, rtv, maxStreak: S.maxStreak
    });
  }

  /* ═══════════════════════════════════════════════════════
     👹 BOSS FIGHT — 5 incongruent trials, tight timing
     ═══════════════════════════════════════════════════════ */
  function startBoss() {
    const TIMES = [1400, 1200, 1000, 850, 700];

    S = { trial: 0, rtList: [], answered: false, currentTrial: null };

    API.setPhase('countdown');
    API.showCountdown(3, '👹 BOSS FIGHT', '5 trials · All conflicting · No mercy', () => {
      nextBossTrial(TIMES);
    });
  }

  function bossHud(timeLimit) {
    return `
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${S.trial + 1}/5</div><div class="hud-lbl">TRIAL</div></div>
        <div class="hud-item"><div class="hud-val" style="color:#FF0077">${timeLimit}</div><div class="hud-lbl">MS LIMIT</div></div>
        <div class="hud-item"><div class="hud-val">👹</div><div class="hud-lbl">BOSS</div></div>
      </div>
    `;
  }

  function nextBossTrial(TIMES) {
    if (S.trial >= TIMES.length) { endBoss(true); return; }

    const timeLimit = TIMES[S.trial];
    // Force incongruent
    const centerDir = Math.random() < 0.5 ? 'left' : 'right';
    const centerGlyph = centerDir === 'left' ? '←' : '→';
    const flankerGlyph = centerDir === 'left' ? '→' : '←';
    const row = [
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: centerGlyph,  side: 'center'  },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' }
    ];

    S.currentTrial = { type: 'incongruent', centerDir, centerGlyph, flankerGlyph, row, startTime: 0 };
    S.answered = false;

    API.setPhase('trial');
    API.render(bossHud(timeLimit) + API.renderFixation());

    push(() => showBossStimulus(TIMES, timeLimit),
         API.settings().reducedMotion ? 80 : 350);
  }

  function showBossStimulus(TIMES, timeLimit) {
    S.currentTrial.startTime = performance.now();

    API.render(`
      ${bossHud(timeLimit)}
      <div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);

    API.getElContent().querySelectorAll('.answer-btn').forEach(b =>
      b.addEventListener('click', () => handleBossAnswer(b, TIMES)));

    const start = performance.now();
    API.setTimer(100);
    timerId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (remaining <= 0) {
        clearInterval(timerId); timerId = null;
        handleBossAnswer({ dataset: { side: 'timeout' } }, TIMES);
      }
    }, 30);
  }

  function handleBossAnswer(btn, TIMES) {
    if (S.answered) return;
    S.answered = true;
    if (timerId) { clearInterval(timerId); timerId = null; }

    const chosen = btn.dataset.side;
    const correct = S.currentTrial.centerDir;
    const isCorrect = chosen === correct;
    const rt = performance.now() - S.currentTrial.startTime;
    if (safeRT(rt) && isCorrect) S.rtList.push(rt);

    API.getElContent().querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = API.getElContent().querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, true, isCorrect)}</div>`;

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      push(() => endBoss(false, S.trial + 1), 1000);
      return;
    }
    S.trial++;
    push(() => nextBossTrial(TIMES), 500);
  }

  function endBoss(won, failedAt) {
    clearAll();
    API.setPhase(won ? 'correct' : 'wrong');
    API.setTimer(0);

    const medianRT = window.FlankerHelpers.median(S.rtList);

    API.render(`
      <div class="endless-gameover-icon">${won ? '🏆' : '💀'}</div>
      <div class="phase-title">${won ? 'BOSS DEFEATED' : 'BOSS WINS'}</div>
      <h1 class="phase-headline grd">${won ? 'You Won!' : 'Defeated'}</h1>
      <p class="phase-sub">
        ${won ? 'All 5 conflicting trials conquered.' : `Failed at trial ${failedAt}/5.`}
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">TRIALS WON</div><div class="stat-value">${won ? 5 : failedAt - 1}/5</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Fight Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startBoss(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'boss', won });
    }

    API.onSessionComplete({
      gameId: 'flanker', domain: 'attention', mode: 'boss',
      won, trialsWon: won ? 5 : failedAt - 1, medianRT
    });
  }

  /* ═══════════════════════════════════════════════════════
     🔄 REVERSE — answer flips at trial 10
     ═══════════════════════════════════════════════════════ */
  function startReverse() {
    const TOTAL = 20, FLIP_AT = 10, TIME_LIMIT = 1800;

    S = {
      trial: 0, reversed: false, correct: 0, lives: 3,
      rtList: [], answered: false, currentTrial: null
    };

    API.setPhase('countdown');
    API.showCountdown(3, '🔄 REVERSE', 'Rule flips mid-game — stay sharp', () => {
      nextReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT);
    });
  }

  function revBanner() {
    return S.reversed
      ? `<div class="practice-badge" style="background:rgba(255,0,119,.15);border-color:rgba(255,0,119,.5);color:var(--pink);">🔄 REVERSE MODE</div>`
      : `<div class="practice-badge" style="background:rgba(0,238,255,.1);border-color:rgba(0,238,255,.4);color:var(--cyan);">NORMAL MODE</div>`;
  }

  function revHud() {
    return `
      ${revBanner()}
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${S.trial + 1}/20</div><div class="hud-lbl">TRIAL</div></div>
        <div class="hud-item"><div class="hud-val">${S.lives}</div><div class="hud-lbl">LIVES</div></div>
        <div class="hud-item"><div class="hud-val">${S.correct}</div><div class="hud-lbl">CORRECT</div></div>
      </div>
    `;
  }

  function nextReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT) {
    if (S.lives <= 0) { endReverse(false); return; }
    if (S.trial >= TOTAL) { endReverse(true); return; }

    if (S.trial === FLIP_AT && !S.reversed) {
      S.reversed = true;
      API.showLevelUpFlash('🔄 REVERSE!');
      push(() => continueReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT), 1200);
      return;
    }
    continueReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT);
  }

  function continueReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT) {
    const trial = API.generateTrial(1, 'endless');
    S.currentTrial = { ...trial, startTime: 0, answered: false };
    S.answered = false;

    API.setPhase('trial');
    API.render(revHud() + API.renderFixation());

    push(() => showReverseStimulus(TOTAL, FLIP_AT, TIME_LIMIT),
         API.settings().reducedMotion ? 80 : 350);
  }

  function showReverseStimulus(TOTAL, FLIP_AT, TIME_LIMIT) {
    S.currentTrial.startTime = performance.now();

    API.render(`
      ${revHud()}
      <div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, false, false)}</div>
      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←"><span class="arrow-icon">←</span>LEFT</button>
        <button class="answer-btn right-btn" data-side="right" data-key="→"><span class="arrow-icon">→</span>RIGHT</button>
      </div>
    `);

    API.getElContent().querySelectorAll('.answer-btn').forEach(b =>
      b.addEventListener('click', () => handleReverseAnswer(b, TOTAL, FLIP_AT, TIME_LIMIT)));

    const start = performance.now();
    API.setTimer(100);
    timerId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      const pct = (remaining / TIME_LIMIT) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (remaining <= 0) {
        clearInterval(timerId); timerId = null;
        handleReverseAnswer({ dataset: { side: 'timeout' } }, TOTAL, FLIP_AT, TIME_LIMIT);
      }
    }, 30);
  }

  function handleReverseAnswer(btn, TOTAL, FLIP_AT, TIME_LIMIT) {
    if (S.answered) return;
    S.answered = true;
    if (timerId) { clearInterval(timerId); timerId = null; }

    const chosen = btn.dataset.side;
    const centerDir = S.currentTrial.centerDir;
    // In reverse, correct = OPPOSITE of center
    const correct = S.reversed
      ? (centerDir === 'left' ? 'right' : 'left')
      : centerDir;
    const isCorrect = chosen === correct;
    const rt = performance.now() - S.currentTrial.startTime;
    if (safeRT(rt) && isCorrect) S.rtList.push(rt);

    API.getElContent().querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const row = API.getElContent().querySelector('.flanker-row');
    if (row) row.outerHTML = `<div class="flanker-wrap">${API.renderFlankerRow(S.currentTrial.row, true, isCorrect)}</div>`;

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) S.correct++;
    else S.lives--;

    S.trial++;

    if (S.lives <= 0) push(() => endReverse(false), 1000);
    else push(() => nextReverseTrial(TOTAL, FLIP_AT, TIME_LIMIT), isCorrect ? 350 : 700);
  }

  function endReverse(won) {
    clearAll();
    API.setPhase(won ? 'correct' : 'wrong');
    API.setTimer(0);

    const medianRT = window.FlankerHelpers.median(S.rtList);

    API.render(`
      <div class="endless-gameover-icon">${won ? '🔄' : '💥'}</div>
      <div class="phase-title">${won ? 'Reverse Complete' : 'Reverse Over'}</div>
      <h1 class="phase-headline grd">${won ? 'Survived!' : 'Flipped Out'}</h1>
      <p class="phase-sub">
        ${won ? 'You handled the rule reversal like a pro.' : `Reached trial ${S.trial}/20.`}
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${S.correct}</div></div>
        <div class="stat-card"><div class="stat-label">REACHED</div><div class="stat-value">${S.trial}/20</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startReverse(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({
        mode: 'reverse', won, correct: S.correct, reached: S.trial
      });
    }

    API.onSessionComplete({
      gameId: 'flanker', domain: 'attention', mode: 'reverse',
      won, correct: S.correct, reached: S.trial, medianRT
    });
  }

  /* ═══════════════════════════════════════════════════════
     PUBLIC INTERFACE
     ═══════════════════════════════════════════════════════ */
  function start(modeId, apiRef) {
    API = apiRef;
    clearAll();
    if (modeId === 'time-attack') startTimeAttack();
    else if (modeId === 'boss') startBoss();
    else if (modeId === 'reverse') startReverse();
  }

  window.FlankerExtraModes = { getModeDefinitions, start };
})();