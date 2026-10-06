/* ═══════════════════════════════════════════════════════════
   FLASH — Argument Analyzer Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.ArgAnaAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null, S = null, H = null;
  let timeouts = [];
  let currentRunner = null;

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (currentRunner && currentRunner.cleanup) {
      try { currentRunner.cleanup(); } catch (e) {}
      currentRunner = null;
    }
  }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    timeouts.push(id);
    return id;
  }

  /* ═══ MODE DEFINITIONS ═══ */
  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 arguments · 8s each',         meta: '→ Fast verdicts' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',         meta: '→ Level ramps' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 arguments · No pressure',      meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 arguments · Fixed protocol',   meta: '→ Once per day' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     RENDER HELPERS
     ═══════════════════════════════════════════════════════ */
  function renderQuestion(q, badgeHTML, hudHTML) {
    const optionsHTML = q.options.map(opt => {
      return '' +
        '<button class="answer-btn" data-fallacy="' + opt.id + '">' +
          '<span class="ab-icon">' + opt.icon + '</span>' +
          '<span class="ab-body">' +
            '<span class="ab-name">' + opt.name + '</span>' +
            '<span class="ab-desc">' + opt.desc + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    return '' +
      (badgeHTML || '') +
      (hudHTML || '') +
      '<div class="argument-card">' +
        '<div class="argument-label">Argument</div>' +
        '<div class="argument-text">' + q.text + '</div>' +
      '</div>' +
      '<div class="answer-prompt">Identify the fallacy</div>' +
      '<div class="answer-grid">' + optionsHTML + '</div>';
  }

  function wireAnswerButtons(handler) {
    const content = API.getElContent();
    content.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handler(btn);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     GENERIC RUNNER — used by Speed / Precision / Daily
     ═══════════════════════════════════════════════════════ */
  function runArgLoop(config, onEnd) {
    const state = {
      trialIdx: 0,
      total: config.totalTrials,
      correct: 0,
      rts: [],
      ended: false,
      current: null,
      answered: false,
      trialStartTime: 0,
      timerInterval: null,
      level: config.level || 1
    };

    function cleanup() {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
    }

    function nextTrial() {
      if (state.ended) return;
      if (state.trialIdx >= state.total) {
        state.ended = true;
        clearAll();
        onEnd(state);
        return;
      }

      state.trialIdx++;
      state.answered = false;

      const q = API.generateQuestion(state.level);
      state.current = q;

      API.setPhase('trial');
      const badge = config.badgeHTML || '';
      const hud = config.hudHTML ? config.hudHTML(state) : '';
      API.render(renderQuestion(q, badge, hud));
      wireAnswerButtons(handleAnswer);

      state.trialStartTime = performance.now();

      if (config.timeLimit) {
        startTimer(config.timeLimit);
      }
    }

    function startTimer(limit) {
      cleanup();
      const start = performance.now();
      API.setTimer(100);
      state.timerInterval = setInterval(() => {
        if (state.ended || state.answered) return;
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, limit - elapsed);
        const pct = (remaining / limit) * 100;
        let lvl = 'normal';
        if (pct < 50) lvl = 'warning';
        if (pct < 20) lvl = 'danger';
        API.setTimer(pct, lvl);
        if (remaining <= 0) {
          cleanup();
          handleTimeout();
        }
      }, 40);
      timeouts.push(state.timerInterval);
    }

    function handleTimeout() {
      if (state.answered || state.ended) return;
      state.answered = true;
      API.showFeedbackFlash(false);
      if (S) S.miss();
      API.haptic && API.haptic('wrong');

      if (config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 700);
        return;
      }

      push(nextTrial, 900);
    }

    function handleAnswer(btn) {
      if (state.answered || state.ended) return;
      state.answered = true;
      cleanup();

      const chosen = btn.dataset.fallacy;
      const correct = state.current.correctFallacy;
      const isCorrect = chosen === correct;
      const rt = performance.now() - state.trialStartTime;

      if (isCorrect) {
        state.correct++;
        state.rts.push(rt);
      }

      // Highlight all buttons
      const content = API.getElContent();
      content.querySelectorAll('.answer-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.fallacy === correct) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      API.showFeedbackFlash(isCorrect);
      if (S) { isCorrect ? S.hit() : S.miss(); }
      API.haptic && API.haptic(isCorrect ? 'correct' : 'wrong');

      if (!isCorrect && config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 800);
        return;
      }

      push(nextTrial, isCorrect ? 550 : 1000);
    }

    state.cleanup = cleanup;
    state.forceAnswer = handleAnswer;
    currentRunner = state;

    nextTrial();
    return state;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 15 arguments · 8s per trial
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 arguments · 8s each', () => {
      runArgLoop({
        totalTrials: 15,
        timeLimit: 8000,
        level: 2,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">SPEED · 8s / ARG</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">ARG</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">CORRECT</div></div>' +
          '</div>'
      }, endSpeed);
    });
  }

  function endSpeed(state) {
    clearAll();
    API.setPhase('gameover');
    API.setTimer(0);
    if (S) S.victory();

    const accuracy = Math.round((state.correct / state.total) * 100);
    const medianRT = H.median(state.rts);
    const rcs = H.rcs(state.correct, state.rts);

    API.render('' +
      '<div class="phase-title">Speed Complete</div>' +
      '<h1 class="phase-headline grd">⏱️ ' + accuracy + '%</h1>' +
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' fallacies identified</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#00EEFF,#3A86FF);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('speed', { totalCorrect: state.correct, accuracy, medianRT });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: state.correct, accuracy, medianRT });
    API.emit({ gameId: 'argument-analyzer', domain: 'logic', mode: 'speed', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — one mistake = game over · level ramps up
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    clearAll();
    const M = { level: 1, totalCorrect: 0 };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', runEndlessRound);

    function runEndlessRound() {
      if (M.ended) return;

      runArgLoop({
        totalTrials: 5,
        timeLimit: 12000,
        level: Math.min(5, M.level),
        failOnWrong: true,
        badgeHTML: '<div class="practice-badge" style="background:rgba(58,134,255,.14);border-color:rgba(58,134,255,.45);color:#3A86FF;">ENDLESS · LEVEL ' + M.level + '</div>',
        hudHTML: () => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + M.level + '</div><div class="hud-lbl">LEVEL</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + M.totalCorrect + '</div><div class="hud-lbl">CORRECT</div></div>' +
          '</div>'
      }, (state) => {
        if (state.correct < state.total) {
          // Failed one → game over
          endEndless(M);
        } else {
          // Cleared all 5 → level up
          M.totalCorrect += state.correct;
          M.level++;
          API.showLevelUpFlash('LEVEL ' + M.level + '!');
          if (S) S.levelUp();
          push(runEndlessRound, 1100);
        }
      });
    }
  }

  function endEndless(M) {
    clearAll();
    API.setPhase('gameover');
    API.setTimer(0);
    if (S) S.gameOver();

    API.render('' +
      '<div class="endless-gameover-icon">💥</div>' +
      '<div class="phase-title">Endless Over</div>' +
      '<h1 class="phase-headline grd">Level ' + M.level + '</h1>' +
      '<p class="phase-sub">You missed a fallacy — the run is over.</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">' +
        '<div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">' + M.level + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + M.totalCorrect + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#00EEFF,#3A86FF);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'argument-analyzer', domain: 'logic', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 arguments · no time pressure
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 arguments · No pressure', () => {
      runArgLoop({
        totalTrials: 15,
        timeLimit: 0,
        level: 2,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · MAX ACCURACY</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">ARG</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">CORRECT</div></div>' +
          '</div>'
      }, endPrecision);
    });
  }

  function endPrecision(state) {
    clearAll();
    API.setPhase('gameover');
    API.setTimer(0);
    if (S) S.victory();

    const accuracy = Math.round((state.correct / state.total) * 100);
    const medianRT = H.median(state.rts);
    const rcs = H.rcs(state.correct, state.rts);

    API.render('' +
      '<div class="phase-title">Precision Complete</div>' +
      '<h1 class="phase-headline grd">' + accuracy + '%</h1>' +
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' fallacies identified</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#00EEFF,#3A86FF);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('precision', { accuracy });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, rcs });
    API.emit({ gameId: 'argument-analyzer', domain: 'logic', mode: 'precision', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 arguments · fixed protocol · once per day
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 arguments · Fixed protocol', () => {
      runArgLoop({
        totalTrials: 20,
        timeLimit: 10000,
        level: 3,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · FIXED PROTOCOL</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">ARG</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">CORRECT</div></div>' +
          '</div>'
      }, endDaily);
    });
  }

  function endDaily(state) {
    clearAll();
    const accuracy = Math.round((state.correct / state.total) * 100);
    const medianRT = H.median(state.rts);
    const rcs = H.rcs(state.correct, state.rts);

    H.markTodayDone({ rcs, accuracy });

    API.setPhase('gameover');
    API.setTimer(0);
    if (S) S.victory();

    API.render('' +
      '<div class="phase-title">Daily Complete</div>' +
      '<h1 class="phase-headline grd">' + accuracy + '%</h1>' +
      '<p class="phase-sub">Come back tomorrow for a new challenge.</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
      '</div>' +
      '<button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>'
    );
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'argument-analyzer', domain: 'logic', mode: 'daily', totalCorrect: state.correct, accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef;
    clearAll();
    if (modeId === 'speed')          startSpeed();
    else if (modeId === 'endless')   startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily')     startDaily();
  }

  function abort() { clearAll(); }

  window.ArgumentAnalyzerExtraModes = { getModeDefinitions, start, abort };
})();