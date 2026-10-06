/* ═══════════════════════════════════════════════════════════
   FLASH — Vocabulary Elite Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.VocabEliteAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '20 words · 6s each',            meta: '→ Fast synonyms' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',        meta: '→ Level ramps' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '20 words · No time pressure',    meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '25 words · Fixed protocol',      meta: '→ Once per day' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     RENDER HELPERS
     ═══════════════════════════════════════════════════════ */
  function renderQuestion(q, badgeHTML, hudHTML) {
    const optionsHTML = q.options.map((opt, i) => {
      return '' +
        '<button class="answer-btn" data-word="' + escapeAttr(opt) + '">' +
          '<span class="ab-key">' + (i + 1) + '</span>' +
          '<span class="ab-body">' +
            '<span class="ab-word">' + escapeHTML(opt) + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    return '' +
      (badgeHTML || '') +
      (hudHTML || '') +
      '<div class="word-card">' +
        '<div class="word-label">Word</div>' +
        '<div class="word-target">' + escapeHTML(q.word) + '</div>' +
        '<div class="word-meta">' + (q.meta || 'Choose the closest synonym') + '</div>' +
      '</div>' +
      '<div class="answer-prompt">Identify the synonym</div>' +
      '<div class="answer-grid">' + optionsHTML + '</div>';
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
     GENERIC RUNNER
     ═══════════════════════════════════════════════════════ */
  function runVocabLoop(config, onEnd) {
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

      if (S && S.wordReveal) S.wordReveal();

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

      // Show correct
      const correct = state.current.correct;
      const content = API.getElContent();
      content.querySelectorAll('.answer-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.word === correct) b.classList.add('correct');
      });

      if (config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 700);
        return;
      }

      push(nextTrial, 1000);
    }

    function handleAnswer(btn) {
      if (state.answered || state.ended) return;
      state.answered = true;
      cleanup();

      const chosen = btn.dataset.word;
      const correct = state.current.correct;
      const isCorrect = chosen === correct;
      const rt = performance.now() - state.trialStartTime;

      if (isCorrect) {
        state.correct++;
        state.rts.push(rt);
      }

      // Highlight all
      const content = API.getElContent();
      content.querySelectorAll('.answer-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.word === correct) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      API.showFeedbackFlash(isCorrect);
      if (S) {
        if (isCorrect && S.correctWord) S.correctWord();
        else if (!isCorrect && S.wrongWord) S.wrongWord();
        else isCorrect ? S.hit() : S.miss();
      }
      API.haptic && API.haptic(isCorrect ? 'correct' : 'wrong');

      if (!isCorrect && config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 900);
        return;
      }

      push(nextTrial, isCorrect ? 600 : 1100);
    }

    state.cleanup = cleanup;
    state.forceAnswer = handleAnswer;
    currentRunner = state;

    nextTrial();
    return state;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 20 words · 6s each
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '20 words · 6s each', () => {
      runVocabLoop({
        totalTrials: 20,
        timeLimit: 6000,
        level: 2,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">SPEED · 6s / WORD</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
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
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' words matched correctly</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#C77DFF,#9D4EDD);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('speed', { totalCorrect: state.correct, accuracy, medianRT });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: state.correct, accuracy, medianRT });
    API.emit({ gameId: 'vocabulary-elite', domain: 'language', mode: 'speed', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — one mistake = game over · level ramps
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    clearAll();
    const M = { level: 1, totalCorrect: 0 };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', runEndlessRound);

    function runEndlessRound() {
      if (M.ended) return;

      runVocabLoop({
        totalTrials: 5,
        timeLimit: 10000,
        level: Math.min(5, M.level),
        failOnWrong: true,
        badgeHTML: '<div class="practice-badge" style="background:rgba(157,78,221,.16);border-color:rgba(157,78,221,.5);color:#C77DFF;">ENDLESS · LEVEL ' + M.level + '</div>',
        hudHTML: () => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + M.level + '</div><div class="hud-lbl">LEVEL</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + M.totalCorrect + '</div><div class="hud-lbl">CORRECT</div></div>' +
          '</div>'
      }, (state) => {
        if (state.correct < state.total) {
          endEndless(M);
        } else {
          M.totalCorrect += state.correct;
          M.level++;
          API.showLevelUpFlash && API.showLevelUpFlash('LEVEL ' + M.level + '!');
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
      '<p class="phase-sub">You missed a synonym — the run is over.</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">' +
        '<div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">' + M.level + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + M.totalCorrect + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#C77DFF,#9D4EDD);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'vocabulary-elite', domain: 'language', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 20 words · no time pressure
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '20 words · No pressure', () => {
      runVocabLoop({
        totalTrials: 20,
        timeLimit: 0,
        level: 3,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · MAX ACCURACY</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
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
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' words matched correctly</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="big-btn" id="retry-btn">Try Again</button>' +
        '<button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#C77DFF,#9D4EDD);">Back to Menu</button>' +
      '</div>'
    );
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('precision', { accuracy });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, rcs });
    API.emit({ gameId: 'vocabulary-elite', domain: 'language', mode: 'precision', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 25 words · fixed protocol · once per day
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '25 words · Fixed protocol', () => {
      runVocabLoop({
        totalTrials: 25,
        timeLimit: 10000,
        level: 4,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(199,125,255,.14);border-color:rgba(199,125,255,.5);color:#C77DFF;">DAILY · FIXED PROTOCOL</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
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
    API.emit({ gameId: 'vocabulary-elite', domain: 'language', mode: 'daily', totalCorrect: state.correct, accuracy, rcs });
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

  window.VocabEliteExtraModes = { getModeDefinitions, start, abort };
})();