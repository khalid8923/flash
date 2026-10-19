/* ═══════════════════════════════════════════════════════════
   FLASH — Word Scramble Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.WordScrambleAPI at runtime
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
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 words · 15s each',           meta: '→ Fast solving' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',        meta: '→ Word grows' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 words · No time pressure',    meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 words · Fixed protocol',      meta: '→ Once per day' }
    ];
  }

  /* ═══ RENDER HELPERS ═══ */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderQuestion(q, userInput, badgeHTML, hudHTML, hintUsed, hintCount) {
    const slots = Array.from({ length: q.word.length }, (_, i) => {
      const filled = i < userInput.length;
      const isHinted = i === 0 && hintUsed;
      let cls = 'slot';
      if (filled) cls += ' filled';
      if (isHinted && !filled) cls += ' hinted';
      return '<span class="' + cls + '">' + (filled ? escapeHTML(userInput[i]) : (isHinted ? escapeHTML(q.word[0]) : '')) + '</span>';
    }).join('');

    const tiles = q.letters.map((l, i) => {
      const used = q.usedTiles && q.usedTiles[i];
      let cls = 'letter-tile';
      if (used) cls += ' used';
      return '<button class="' + cls + '" data-idx="' + i + '" data-letter="' + escapeHTML(l) + '">' + escapeHTML(l.toUpperCase()) + '</button>';
    }).join('');

    const hintDisabled = hintUsed || hintCount <= 0;
    const clearDisabled = userInput.length === 0;

    return '' +
      (badgeHTML || '') +
      (hudHTML || '') +
      '<div class="hint-card">' +
        '<div class="hint-label">Hint</div>' +
        '<div class="hint-text">' + escapeHTML(q.hint) + '</div>' +
      '</div>' +
      '<div class="slots-row">' + slots + '</div>' +
      '<div class="letters-row">' + tiles + '</div>' +
      '<div class="controls-row">' +
        '<button class="ctrl-btn hint-btn" id="hint-btn" ' + (hintDisabled ? 'disabled' : '') + '>' +
          '<span class="cb-icon">💡</span>Hint' +
          '<span class="hint-badge">' + hintCount + '</span>' +
        '</button>' +
        '<button class="ctrl-btn shuffle-btn" id="shuffle-btn">' +
          '<span class="cb-icon">🔀</span>Shuffle' +
        '</button>' +
        '<button class="ctrl-btn clear-btn" id="clear-btn" ' + (clearDisabled ? 'disabled' : '') + '>' +
          '<span class="cb-icon">✕</span>Clear' +
        '</button>' +
      '</div>';
  }

  /* ═══════════════════════════════════════════════════════
     GENERIC RUNNER
     ═══════════════════════════════════════════════════════ */
  function runScrambleLoop(config, onEnd) {
    const state = {
      trialIdx: 0,
      total: config.totalTrials,
      correct: 0,
      rts: [],
      ended: false,
      current: null,
      userInput: [],
      usedTiles: [],
      answered: false,
      hintUsed: false,
      trialStartTime: 0,
      timerInterval: null,
      level: config.level || 1,
      longestWord: 0
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
      state.userInput = [];
      state.usedTiles = [];
      state.hintUsed = false;

      const q = API.generateQuestion(state.level);
      // Shuffle letters
      q.letters = API.shuffleArray(q.word.split(''));
      // Make sure scrambled ≠ original
      let guard = 0;
      while (q.letters.join('') === q.word && guard < 10) {
        q.letters = API.shuffleArray(q.word.split(''));
        guard++;
      }
      q.usedTiles = new Array(q.word.length).fill(false);
      state.current = q;

      API.setPhase('trial');
      renderTrial();

      if (S && S.letterPick) S.letterPick();
      state.trialStartTime = performance.now();

      if (config.timeLimit) {
        startTimer(config.timeLimit);
      }
    }

    function renderTrial() {
      const q = state.current;
      q.usedTiles = state.usedTiles;
      const badge = config.badgeHTML || '';
      const hud = config.hudHTML ? config.hudHTML(state) : '';
      const hintCount = config.hintsPerTrial || 1;
      API.render(renderQuestion(q, state.userInput, badge, hud, state.hintUsed, hintCount));
      wireTiles();
      wireControls();
    }

    function wireTiles() {
      const content = API.getElContent();
      content.querySelectorAll('.letter-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.answered || state.ended) return;
          const idx = parseInt(tile.dataset.idx, 10);
          if (state.usedTiles[idx]) return;
          if (state.userInput.length >= state.current.word.length) return;

          state.usedTiles[idx] = true;
          state.userInput.push(tile.dataset.letter);
          if (S && S.letterPick) S.letterPick();
          renderTrial();

          if (state.userInput.length === state.current.word.length) {
            state.answered = true;
            push(submitAnswer, 300);
          }
        });
      });
    }

    function wireControls() {
      const hintBtn = API.$('hint-btn');
      const shuffleBtn = API.$('shuffle-btn');
      const clearBtn = API.$('clear-btn');

      if (hintBtn && !hintBtn.disabled) {
        hintBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.hintUsed || state.ended) return;
          state.hintUsed = true;
          if (S && S.hintReveal) S.hintReveal();

          // Auto-place the first letter
          const firstLetter = state.current.word[0].toLowerCase();
          // Find unused tile with this letter
          for (let i = 0; i < state.current.letters.length; i++) {
            if (!state.usedTiles[i] && state.current.letters[i].toLowerCase() === firstLetter) {
              state.usedTiles[i] = true;
              state.userInput.push(state.current.letters[i]);
              break;
            }
          }
          renderTrial();
        });
      }

      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.answered || state.ended) return;
          // Reshuffle unused tiles only
          const unusedIndices = [];
          const unusedLetters = [];
          for (let i = 0; i < state.current.letters.length; i++) {
            if (!state.usedTiles[i]) {
              unusedIndices.push(i);
              unusedLetters.push(state.current.letters[i]);
            }
          }
          API.shuffleArrayInPlace(unusedLetters);
          unusedIndices.forEach((idx, k) => {
            state.current.letters[idx] = unusedLetters[k];
          });
          if (S && S.shuffle) S.shuffle();
          renderTrial();
        });
      }

      if (clearBtn && !clearBtn.disabled) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.answered || state.ended) return;
          // Reset used tiles
          state.usedTiles = new Array(state.current.word.length).fill(false);
          state.userInput = [];
          state.hintUsed = false;
          if (S && S.letterRemove) S.letterRemove();
          renderTrial();
        });
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
      cleanup();
      API.showFeedbackFlash(false);
      if (S) S.miss();
      API.haptic && API.haptic('wrong');

      // Highlight slots with correct letters
      const content = API.getElContent();
      const slots = content.querySelectorAll('.slot');
      slots.forEach((slot, i) => {
        slot.classList.add('wrong');
      });

      if (config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 900);
        return;
      }

      push(nextTrial, 1400);
    }

    function submitAnswer() {
      if (state.ended) return;

      const rt = performance.now() - state.trialStartTime;
      const userWord = state.userInput.join('').toLowerCase();
      const correctWord = state.current.word.toLowerCase();
      const isCorrect = userWord === correctWord;

      if (isCorrect) {
        state.correct++;
        state.rts.push(rt);
        if (state.current.word.length > state.longestWord) {
          state.longestWord = state.current.word.length;
        }
      }

      // Highlight slots
      const content = API.getElContent();
      const slots = content.querySelectorAll('.slot');
      slots.forEach((slot, i) => {
        slot.classList.add(isCorrect ? 'correct' : 'wrong');
      });

      API.showFeedbackFlash(isCorrect);
      if (S) {
        if (isCorrect && S.wordSolved) S.wordSolved();
        else if (!isCorrect && S.miss) S.miss();
      }
      API.haptic && API.haptic(isCorrect ? 'correct' : 'wrong');

      if (!isCorrect && config.failOnWrong) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 1100);
        return;
      }

      push(nextTrial, isCorrect ? 800 : 1400);
    }

    state.cleanup = cleanup;
    currentRunner = state;

    nextTrial();
    return state;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED — 15 words · 15s each
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '15 words · 15s each', () => {
      runScrambleLoop({
        totalTrials: 15,
        timeLimit: 15000,
        level: 2,
        hintsPerTrial: 0,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">SPEED · 15s / WORD</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">SOLVED</div></div>' +
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
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' words unscrambled</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
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
    API.emit({ gameId: 'word-scramble', domain: 'language', mode: 'speed', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — one mistake = game over · word grows
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    clearAll();
    const M = { level: 1, totalCorrect: 0, longestWord: 0 };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', runEndlessRound);

    function runEndlessRound() {
      if (M.ended) return;

      const level = Math.min(5, M.level);
      runScrambleLoop({
        totalTrials: 3,
        timeLimit: 0,
        level: level,
        hintsPerTrial: 0,
        failOnWrong: true,
        badgeHTML: '<div class="practice-badge" style="background:rgba(157,78,221,.16);border-color:rgba(157,78,221,.5);color:#C77DFF;">ENDLESS · LEVEL ' + M.level + '</div>',
        hudHTML: () => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + M.level + '</div><div class="hud-lbl">LEVEL</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + M.totalCorrect + '</div><div class="hud-lbl">SOLVED</div></div>' +
          '</div>'
      }, (state) => {
        if (state.correct < state.total) {
          endEndless(M);
        } else {
          M.totalCorrect += state.correct;
          M.level++;
          if (state.longestWord > M.longestWord) M.longestWord = state.longestWord;
          API.showLevelUpFlash && API.showLevelUpFlash('LEVEL ' + M.level + '!');
          if (S) S.levelUp();
          push(runEndlessRound, 1200);
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
      '<p class="phase-sub">You couldn\'t unscramble the word — the run is over.</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">' +
        '<div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">' + M.level + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">' + M.totalCorrect + '</div></div>' +
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
    API.emit({ gameId: 'word-scramble', domain: 'language', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect, longestWord: M.longestWord });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 words · no time pressure · 3 hints
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 words · No pressure', () => {
      runScrambleLoop({
        totalTrials: 15,
        timeLimit: 0,
        level: 3,
        hintsPerTrial: 3,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · MAX ACCURACY</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">SOLVED</div></div>' +
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
      '<p class="phase-sub">' + state.correct + ' / ' + state.total + ' words unscrambled</p>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
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
    API.emit({ gameId: 'word-scramble', domain: 'language', mode: 'precision', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 words · fixed protocol · 2 hints
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 words · Fixed protocol', () => {
      runScrambleLoop({
        totalTrials: 20,
        timeLimit: 20000,
        level: 3,
        hintsPerTrial: 2,
        failOnWrong: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(199,125,255,.14);border-color:rgba(199,125,255,.5);color:#C77DFF;">DAILY · FIXED PROTOCOL</div>',
        hudHTML: (st) => '' +
          '<div class="endless-hud">' +
            '<div class="hud-item"><div class="hud-val">' + st.trialIdx + '/' + st.total + '</div><div class="hud-lbl">WORD</div></div>' +
            '<div class="hud-item"><div class="hud-val">' + st.correct + '</div><div class="hud-lbl">SOLVED</div></div>' +
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
        '<div class="stat-card"><div class="stat-label">SOLVED</div><div class="stat-value">' + state.correct + '/' + state.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
      '</div>' +
      '<button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>'
    );
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    API.emit({ gameId: 'word-scramble', domain: 'language', mode: 'daily', totalCorrect: state.correct, accuracy, rcs });
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

  window.WordScrambleExtraModes = { getModeDefinitions, start, abort };
})();