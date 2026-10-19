/* ═══════════════════════════════════════════════════════════
   FLASH — Seq-Mem Extra Modes
   Speed · Endless · Precision · Daily
   Loaded BEFORE game.js — uses window.SeqMemAPI at runtime
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
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  /* ═══ Digit sequence generator ═══ */
  function generateDigits(length) {
    const arr = [];
    for (let i = 0; i < length; i++) arr.push(randInt(0, 9));
    return arr;
  }

  /* ═══ MODE DEFINITIONS ═══ */
  function getModeDefinitions() {
    return [
      { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '12 sequences · 550ms digits',   meta: '→ Fast recall' },
      { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'One mistake = game over',        meta: '→ Span grows' },
      { id: 'precision', name: 'Precision', icon: '🎯', desc: '15 sequences · 1400ms digits',   meta: '→ Max accuracy' },
      { id: 'daily',     name: 'Daily',     icon: '★',  desc: '20 sequences · Fixed protocol',  meta: '→ Once per day' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     RENDER HELPERS (identical to game.js rendering)
     ═══════════════════════════════════════════════════════ */

  function renderDigitPhase(digit, idx, total) {
    const dots = Array.from({ length: total }, (_, i) => {
      let cls = 'digit-dot';
      if (i < idx) cls += ' done';
      else if (i === idx) cls += ' active';
      return `<span class="${cls}"></span>`;
    }).join('');

    return `
      <div class="seq-progress">${dots}</div>
      <div class="digit-display">
        <div class="digit-big">${digit}</div>
      </div>
    `;
  }

  function renderInputPhase(total, userInput, badgeHTML) {
    const slots = Array.from({ length: total }, (_, i) => {
      const filled = i < userInput.length;
      return `<span class="response-slot ${filled ? 'filled' : ''}">${filled ? userInput[i] : ''}</span>`;
    }).join('');

    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
    const keypad = keys.map(k => {
      let cls = 'keypad-btn';
      if (k === '⌫') cls += ' backspace';
      if (k === '✓') cls += ' submit';
      return `<button class="${cls}" data-key="${k}">${k}</button>`;
    }).join('');

    return `
      ${badgeHTML || ''}
      <div class="seq-prompt">Enter the digits in order</div>
      <div class="response-display">${slots}</div>
      <div class="keypad">${keypad}</div>
    `;
  }

  /* ═══════════════════════════════════════════════════════
     GENERIC SEQUENCE RUNNER — used by all extra modes
     config: {
       totalSequences, digitsFor(seqIdx), digitShowDuration,
       digitGapDuration, failOnError, badgeHTML, hudHTML(state)
     }
     ═══════════════════════════════════════════════════════ */
  function runSeqLoop(config, onEnd) {
    const state = {
      seqIdx: 0,
      total: config.totalSequences,
      correct: 0,
      misses: 0,
      rts: [],
      ended: false,
      currentSeq: [],
      userInput: [],
      inputStartTime: 0,
      isInputLocked: false
    };

    function cleanup() {
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (state.ended) return;
      if (API.state && API.state.phase !== 'trial') return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        e.preventDefault();
        handleKey(k);
      } else if (k === 'Backspace') {
        e.preventDefault();
        handleKey('⌫');
      } else if (k === 'Enter') {
        e.preventDefault();
        handleKey('✓');
      }
    }

    function nextSequence() {
      if (state.ended) return;
      if (state.seqIdx >= state.total) {
        state.ended = true;
        clearAll();
        onEnd(state);
        return;
      }
      state.seqIdx++;
      const len = config.digitsFor(state.seqIdx);
      state.currentSeq = generateDigits(len);
      state.userInput = [];
      state.isInputLocked = false;
      displaySequence(0);
    }

    function displaySequence(i) {
      if (state.ended) return;
      const digits = state.currentSeq;
      if (i >= digits.length) {
        push(showInput, config.digitGapDuration);
        return;
      }
      API.setPhase('stimulus');
      API.render(renderDigitPhase(digits[i], i, digits.length));
      if (S && S.digitFlash) S.digitFlash(digits[i]);
      push(() => displaySequence(i + 1), config.digitShowDuration + config.digitGapDuration);
    }

    function showInput() {
      if (state.ended) return;
      API.setPhase('trial');
      state.userInput = [];
      state.inputStartTime = performance.now();
      state.isInputLocked = false;
      renderInput();
      wireKeypad();
    }

    function renderInput() {
      const badge = config.badgeHTML || '';
      const hud = config.hudHTML ? config.hudHTML(state) : '';
      API.render(renderInputPhase(state.currentSeq.length, state.userInput, badge + hud));
    }

    function wireKeypad() {
      const content = API.getElContent();
      content.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.isInputLocked) return;
          handleKey(btn.dataset.key);
        });
      });
    }

    function handleKey(key) {
      if (state.ended || state.isInputLocked) return;

      if (key === '⌫') {
        if (state.userInput.length > 0) {
          state.userInput.pop();
          if (S && S.keyDelete) S.keyDelete();
          renderInput();
          wireKeypad();
        }
        return;
      }

      if (key === '✓') {
        if (state.userInput.length === state.currentSeq.length) {
          submitResponse();
        }
        return;
      }

      if (/^[0-9]$/.test(key)) {
        if (state.userInput.length >= state.currentSeq.length) return;
        state.userInput.push(parseInt(key, 10));
        if (S && S.keyPress) S.keyPress();
        renderInput();
        wireKeypad();

        if (state.userInput.length === state.currentSeq.length) {
          state.isInputLocked = true;
          push(submitResponse, 320);
        }
      }
    }

    function submitResponse() {
      if (state.ended) return;
      state.isInputLocked = true;

      const rt = performance.now() - state.inputStartTime;
      const isCorrect = state.userInput.length === state.currentSeq.length &&
        state.userInput.every((d, i) => d === state.currentSeq[i]);

      if (isCorrect) {
        state.correct++;
        state.rts.push(rt);
      } else {
        state.misses++;
      }

      API.showFeedbackFlash(isCorrect);
      if (S) { isCorrect ? S.hit() : S.miss(); }

      if (!isCorrect && config.failOnError) {
        state.ended = true;
        clearAll();
        push(() => onEnd(state), 700);
        return;
      }

      push(nextSequence, isCorrect ? 550 : 950);
    }

    // Attach keyboard listener
    document.addEventListener('keydown', onKeyDown);

    // Wire state helpers for external access
    state.cleanup = cleanup;
    state.forceSubmit = submitResponse;
    currentRunner = state;

    nextSequence();
    return state;
  }

  /* ═══════════════════════════════════════════════════════
     SPEED MODE — 12 sequences, 550ms digits, 100ms gap
     ═══════════════════════════════════════════════════════ */
  function startSpeed() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ SPEED', '12 sequences · Fast digits', () => {
      runSeqLoop({
        totalSequences: 12,
        digitsFor: (i) => Math.min(8, 3 + Math.floor((i - 1) / 2)),
        digitShowDuration: 550,
        digitGapDuration: 100,
        failOnError: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(255,214,10,.12);border-color:rgba(255,214,10,.4);color:#FFD60A;">SPEED · FAST RECALL</div>',
        hudHTML: (st) => `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${st.seqIdx}/${st.total}</div><div class="hud-lbl">SEQ</div></div>
            <div class="hud-item"><div class="hud-val">${st.correct}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `
      }, endSpeed);
    });
  }

  function endSpeed(state) {
    clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const total = state.total;
    const accuracy = Math.round((state.correct / total) * 100);
    const medianRT = H.median(state.rts);

    API.render(`
      <div class="phase-title">Speed Complete</div>
      <h1 class="phase-headline grd">⏱️ ${accuracy}%</h1>
      <p class="phase-sub">${state.correct} / ${total} sequences recalled correctly</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${state.correct}/${total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startSpeed(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('speed', { totalCorrect: state.correct, accuracy, medianRT });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'speed', totalCorrect: state.correct, accuracy, medianRT });
    API.emit({ gameId: 'seq-mem', domain: 'memory', mode: 'speed', totalCorrect: state.correct, accuracy, medianRT });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS MODE — one mistake = game over, span grows
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    clearAll();
    const M = { level: 1, totalCorrect: 0 };
    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run', runEndlessLevel);

    function runEndlessLevel() {
      const len = Math.min(10, 2 + M.level); // starts at 3 digits
      runSeqLoop({
        totalSequences: 3, // 3 sequences per level; fail any = game over
        digitsFor: () => len,
        digitShowDuration: 950,
        digitGapDuration: 280,
        failOnError: true,
        badgeHTML: `<div class="practice-badge" style="background:rgba(0,238,255,.12);border-color:rgba(0,238,255,.4);color:#00EEFF;">ENDLESS · LEVEL ${M.level} · ${len} DIGITS</div>`,
        hudHTML: (st) => `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
            <div class="hud-item"><div class="hud-val">${len}</div><div class="hud-lbl">SPAN</div></div>
            <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">RECALLED</div></div>
          </div>
        `
      }, (state) => {
        // If loop ended: either 3-correct (level cleared) or failed
        if (state.misses > 0) {
          endEndless(M);
        } else {
          // Level cleared — advance
          M.totalCorrect += state.correct;
          M.level++;
          API.showLevelUpFlash(`LEVEL ${M.level}!`);
          if (S) S.levelUp();
          push(runEndlessLevel, 1100);
        }
      });
    }
  }

  function endEndless(M) {
    clearAll();
    API.setPhase('gameover');
    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">💥</div>
      <div class="phase-title">Endless Over</div>
      <h1 class="phase-headline grd">Level ${M.level}</h1>
      <p class="phase-sub">You missed a digit — the run is over.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">RECALLED</div><div class="stat-value">${M.totalCorrect}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
    API.emit({ gameId: 'seq-mem', domain: 'memory', mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 15 sequences, 1400ms digits, no pressure
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '15 sequences · Slow digits · Max accuracy', () => {
      runSeqLoop({
        totalSequences: 15,
        digitsFor: (i) => Math.min(9, 3 + Math.floor((i - 1) / 2)),
        digitShowDuration: 1400,
        digitGapDuration: 350,
        failOnError: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:#00FF96;">PRECISION · MAX ACCURACY</div>',
        hudHTML: (st) => `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${st.seqIdx}/${st.total}</div><div class="hud-lbl">SEQ</div></div>
            <div class="hud-item"><div class="hud-val">${st.correct}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `
      }, endPrecision);
    });
  }

  function endPrecision(state) {
    clearAll();
    API.setPhase('gameover');
    if (S) S.victory();

    const total = state.total;
    const accuracy = Math.round((state.correct / total) * 100);
    const medianRT = H.median(state.rts);
    const rcs = H.rcs(state.correct, state.rts);

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${state.correct} / ${total} sequences recalled correctly</p>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${state.correct}/${total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    H.checkAndUnlockBadges('precision', { accuracy });
    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'precision', accuracy, medianRT, rcs });
    API.emit({ gameId: 'seq-mem', domain: 'memory', mode: 'precision', totalCorrect: state.correct, accuracy, medianRT, rcs });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 20 sequences, fixed protocol, once per day
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    clearAll();
    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY', '20 sequences · Fixed protocol', () => {
      runSeqLoop({
        totalSequences: 20,
        digitsFor: (i) => Math.min(8, 3 + Math.floor((i - 1) / 3)),
        digitShowDuration: 950,
        digitGapDuration: 280,
        failOnError: false,
        badgeHTML: '<div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:#9D4EDD;">DAILY · FIXED SPAN</div>',
        hudHTML: (st) => `
          <div class="endless-hud">
            <div class="hud-item"><div class="hud-val">${st.seqIdx}/${st.total}</div><div class="hud-lbl">SEQ</div></div>
            <div class="hud-item"><div class="hud-val">${st.correct}</div><div class="hud-lbl">CORRECT</div></div>
          </div>
        `
      }, endDaily);
    });
  }

  function endDaily(state) {
    clearAll();
    const total = state.total;
    const accuracy = Math.round((state.correct / total) * 100);
    const rcs = H.rcs(state.correct, state.rts);
    const maxSpan = Math.min(8, 3 + Math.floor((total - 1) / 3));

    H.markTodayDone({ rcs, accuracy, maxSpan });

    API.setPhase('gameover');
    if (S) S.victory();

    API.render(`
      <div class="phase-title">Daily Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">Come back tomorrow for a new challenge.</p>
      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${state.correct}/${total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs, maxSpan });
    API.emit({ gameId: 'seq-mem', domain: 'memory', mode: 'daily', totalCorrect: state.correct, accuracy, rcs });
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef; S = sRef; H = hRef;
    clearAll();
    if (modeId === 'speed') startSpeed();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  function abort() { clearAll(); }

  window.SeqMemExtraModes = { getModeDefinitions, start, abort };
})();