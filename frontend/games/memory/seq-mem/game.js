/* ═══════════════════════════════════════════════════════════
   FLASH — Seq-Mem v1.0
   Miller, G. A. (1956). Psychol. Rev., 63(2), 81-97.
   Forward Digit Span · Working Memory
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.SeqMemHelpers;
  const S = window.SeqMemSounds;
  const STAGES = window.SeqMemStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[SeqMem] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('seq-mem', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══ CONFIG ═══ */
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    trialsPerLevel: 3,
    startSpan: 3,
    maxSpanCap: 12,
    digitShowDuration: 950,
    digitGapDuration: 280,
    passRatio: 0.67,          // 2 of 3 = 67%
    correctBase: 100,
    spanBonus: 50,
    streakBonus: 30,
    rtMin: 200,
    rtMax: 20000
  };

  /* ═══ SPAN FOR LEVEL ═══ */
  function spanForLevel(level) {
    return Math.min(
      CONFIG.maxSpanCap,
      CONFIG.startSpan + Math.floor((level - 1) / 2)
    );
  }

  /* ═══ SEQUENCE GENERATOR ═══ */
  function generateSequence(length) {
    const arr = [];
    for (let i = 0; i < length; i++) arr.push(randInt(0, 9));
    return arr;
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    maxSpanReached: CONFIG.startSpan,
    phase: 'idle',
    mode: 'idle',
    // Per-level
    sequences: [],
    trialIdx: 0,
    currentSeq: [],
    userInput: [],
    inputStartTime: 0,
    levelCorrect: 0,
    levelTotal: 0,
    // Cumulative
    results: [],
    totalScore: 0,
    rtList: [],
    invalidRTs: 0,
    timeoutIds: [],
    inputLocked: false,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elSpan, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
  }

  /* ═══ SETTINGS ═══ */
  function wireSettings() {
    const btn = $('settings-btn');
    if (btn && FS) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = snd(); if (s) s.click();
        FS.openPanel();
      });
    }
    if (FS) {
      FS.applyToDOM();
      FS.onChange('reducedMotion', () => FS.applyToDOM());
      FS.onChange('highContrast',  () => FS.applyToDOM());
      FS.onChange('soundEnabled', (v) => { if (S) S.setEnabled(v); });
    }
  }
  function haptic(type) {
    if (FS && FS.get('haptics') === false) return;
    if (!('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }
  function snd() {
    if (!S) return null;
    if (FS && FS.get('soundEnabled') === false) return null;
    return S;
  }

  /* ═══ UI HELPERS ═══ */
  function setPhase(p) {
    state.phase = p;
    elStage.dataset.phase = p;
    const btn = $('back-btn');
    if (btn) {
      if (p === 'idle' && state.mode === 'idle') btn.classList.add('hidden');
      else btn.classList.remove('hidden');
    }
  }
  function render(html) { elContent.innerHTML = html; }
  function setTimer(pct, level) {
    if (!elTimerFill) return;
    elTimerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    elTimerFill.classList.remove('warning', 'danger');
    if (level === 'warning') elTimerFill.classList.add('warning');
    if (level === 'danger')  elTimerFill.classList.add('danger');
  }
  function renderProgressDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      let cls = '';
      if (i < state.level) {
        const r = state.results.find(x => x.level === i);
        cls = r && r.passed ? 'done' : 'fail';
      } else if (i === state.level && state.phase !== 'gameover') cls = 'current';
      dots += '<span class="p-dot ' + cls + '"></span>';
    }
    return '<div class="progress-dots">' + dots + '</div>';
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = 'feedback-flash ' + (hit ? 'hit' : 'miss');
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 450);
    const s = snd();
    if (s) { hit ? s.hit() : s.miss(); }
  }
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash'; el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function showCountdown(from, title, subtitle, onDone) {
    let c = from;
    const tick = () => {
      if (c > 0) {
        const s = snd(); if (s) s.tick();
        render('<div class="phase-title">' + title + '</div>' +
               '<div class="countdown-num">' + c + '</div>' +
               '<p class="phase-sub" style="margin-top:16px;">' + subtitle + '</p>');
        c--; push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }

  /* ═══ DIGIT PHASE RENDERING ═══ */
  function renderDigit(digit, idx, total) {
    const dots = Array.from({ length: total }, (_, i) => {
      let cls = 'digit-dot';
      if (i < idx) cls += ' done';
      else if (i === idx) cls += ' active';
      return '<span class="' + cls + '"></span>';
    }).join('');

    return '' +
      '<div class="span-indicator">' +
        '<span class="span-val">' + total + '</span>' +
        '<span class="span-label">DIGITS</span>' +
      '</div>' +
      '<div class="seq-progress">' + dots + '</div>' +
      '<div class="digit-display">' +
        '<div class="digit-big">' + digit + '</div>' +
      '</div>';
  }

  /* ═══ INPUT PHASE RENDERING ═══ */
  function renderInput() {
    const total = state.currentSeq.length;
    const userInput = state.userInput;

    const dots = Array.from({ length: total }, (_, i) => {
      const cls = 'digit-dot done';
      return '<span class="' + cls + '"></span>';
    }).join('');

    const slots = Array.from({ length: total }, (_, i) => {
      const filled = i < userInput.length;
      return '<span class="response-slot ' + (filled ? 'filled' : '') + '">' +
             (filled ? userInput[i] : '') +
             '</span>';
    }).join('');

    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
    const keypad = keys.map(k => {
      let cls = 'keypad-btn';
      if (k === '⌫') cls += ' backspace';
      if (k === '✓') cls += ' submit';
      return '<button class="' + cls + '" data-key="' + k + '">' + k + '</button>';
    }).join('');

    return '' +
      renderProgressDots() +
      '<div class="seq-progress">' + dots + '</div>' +
      '<div class="seq-prompt">Enter the digits in order</div>' +
      '<div class="response-display">' + slots + '</div>' +
      '<div class="keypad">' + keypad + '</div>';
  }

  function wireKeypad() {
    const content = elContent;
    content.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.inputLocked) return;
        handleKey(btn.dataset.key);
      });
    });
  }

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    // Abort any running extra mode
    if (window.SeqMemExtraModes && window.SeqMemExtraModes.abort) {
      try { window.SeqMemExtraModes.abort(); } catch (e) {}
    }
    setPhase('idle');
    setTimer(100);
    state.mode = 'idle';
    state.inputLocked = false;

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc   = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT    = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbSpan  = pb.bestMaxSpan > 0 ? pb.bestMaxSpan + ' digits' : '—';
    const pbRCS   = pb.bestRCS > 0 ? pb.bestRCS : '—';

    const missionHTML = missions.missions.map(m => {
      const pct = Math.min(100, Math.round(((m.progress || 0) / m.target) * 100));
      return '' +
        '<div class="mission-item ' + (m.done ? 'done' : '') + '">' +
          '<div class="mission-check">' + (m.done ? '✓' : '') + '</div>' +
          '<div class="mission-body">' +
            '<div class="mission-text">' + m.text + '</div>' +
            '<div class="mission-prog"><div class="mission-prog-fill" style="width:' + pct + '%"></div></div>' +
          '</div>' +
          '<div class="mission-count">' + (m.progress || 0) + '/' + m.target + '</div>' +
        '</div>';
    }).join('');

    render('' +
      '<div class="phase-title">Memory Domain · Working Memory</div>' +
      '<h1 class="phase-headline grd">Seq-Mem</h1>' +
      '<p class="phase-sub">' +
        'Digits appear one by one. Recall them ' +
        '<strong style="color:#00EEFF">in the exact same order</strong>. ' +
        'The classic 7±2 span test (Miller 1956).' +
      '</p>' +

      (hasHistory ? '' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(660px,94vw);margin:14px 0;">' +
          '<div class="stat-card"><div class="stat-label">ACC</div><div class="stat-value" style="font-size:15px">' + pbAcc + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value" style="font-size:15px">' + pbRT + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">BEST SPAN</div><div class="stat-value" style="font-size:15px">' + pbSpan + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value" style="font-size:15px">' + pbRCS + '</div></div>' +
        '</div>' : '') +

      '<div class="stages-card" id="stages-container"></div>' +

      '<div class="missions-card">' +
        '<div class="missions-title">Today\'s Missions</div>' +
        missionHTML +
      '</div>' +

      '<div class="mode-grid-4">' +
        '<div class="mode-card" id="mode-classic">' +
          '<div class="mode-icon">🔢</div>' +
          '<div class="mode-name">Classic</div>' +
          '<div class="mode-desc">15 levels · 3 trials each · 3 lives</div>' +
          '<div class="mode-meta">→ Adaptive span (3→10 digits)</div>' +
        '</div>' +
        (window.SeqMemExtraModes ? window.SeqMemExtraModes.getModeDefinitions().map(m => {
          const isDaily = m.id === 'daily';
          const disabled = isDaily && daily;
          return '' +
            '<div class="mode-card ' + (disabled ? 'disabled' : 'tier-hard') + '" id="mode-' + m.id + '">' +
              (disabled ? '<div class="mode-badge green">✓ DONE</div>' : '') +
              '<div class="mode-icon">' + m.icon + '</div>' +
              '<div class="mode-name">' + m.name + '</div>' +
              '<div class="mode-desc">' + (disabled ? 'Completed today' : m.desc) + '</div>' +
              '<div class="mode-meta">' + (disabled ? '→ Come back tomorrow' : m.meta) + '</div>' +
            '</div>';
        }).join('') : '') +
      '</div>' +

      '<p class="phase-hint" style="margin-top:6px;">' +
        '<kbd>0-9</kbd> to enter · <kbd>Backspace</kbd> · <kbd>Enter</kbd> to submit' +
      '</p>'
    );

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    // Classic mode
    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    // Extra modes
    if (window.SeqMemExtraModes && window.SeqMemAPI) {
      window.SeqMemExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.SeqMemExtraModes.start(m.id, window.SeqMemAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.maxSpanReached = CONFIG.startSpan;
    state.results = [];
    state.totalScore = 0;
    state.rtList = [];
    state.invalidRTs = 0;

    elLevel.textContent = '1';
    elSpan.textContent = String(spanForLevel(1));
    elLives.textContent = String(CONFIG.maxLives);

    startLevel();
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.trialIdx = 0;
    state.inputLocked = false;

    const span = spanForLevel(state.level);
    state.maxSpanReached = Math.max(state.maxSpanReached, span);

    // Generate sequences for this level
    state.sequences = [];
    for (let i = 0; i < CONFIG.trialsPerLevel; i++) {
      state.sequences.push(generateSequence(span));
    }

    elLevel.textContent = String(state.level);
    elSpan.textContent = String(span);

    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, span + ' digits · ' + CONFIG.trialsPerLevel + ' trials', nextTrial);
  }

  function nextTrial() {
    if (state.lives <= 0) { completeGame(); return; }
    if (state.trialIdx >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIdx++;
    state.currentSeq = state.sequences[state.trialIdx - 1];
    state.userInput = [];
    state.inputLocked = false;

    // Show first digit
    displayDigit(0);
  }

  function displayDigit(idx) {
    if (state.phase === 'gameover') return;
    if (idx >= state.currentSeq.length) {
      // All digits shown — go to input phase
      push(showInputPhase, CONFIG.digitGapDuration);
      return;
    }

    setPhase('stimulus');
    render(renderDigit(state.currentSeq[idx], idx, state.currentSeq.length));
    if (S && S.digitFlash) S.digitFlash(state.currentSeq[idx]);

    // Show digit for digitShowDuration, then gap, then next
    push(() => displayDigit(idx + 1), CONFIG.digitShowDuration + CONFIG.digitGapDuration);
  }

  function showInputPhase() {
    if (state.phase === 'gameover') return;
    setPhase('trial');
    state.userInput = [];
    state.inputStartTime = performance.now();
    state.inputLocked = false;
    render(renderInput());
    wireKeypad();
  }

  /* ═══ KEY HANDLING ═══ */
  function handleKey(key) {
    if (state.mode !== 'classic') return;
    if (state.phase !== 'trial') return;
    if (state.inputLocked) return;

    // Backspace
    if (key === '⌫') {
      if (state.userInput.length > 0) {
        state.userInput.pop();
        if (S && S.keyDelete) S.keyDelete();
        render(renderInput());
        wireKeypad();
      }
      return;
    }

    // Manual submit
    if (key === '✓') {
      if (state.userInput.length === state.currentSeq.length) {
        submitResponse();
      }
      return;
    }

    // Digit input
    if (/^[0-9]$/.test(key)) {
      if (state.userInput.length >= state.currentSeq.length) return;
      state.userInput.push(parseInt(key, 10));
      if (S && S.keyPress) S.keyPress();
      render(renderInput());
      wireKeypad();

      // Auto-submit when full
      if (state.userInput.length === state.currentSeq.length) {
        state.inputLocked = true;
        push(submitResponse, 320);
      }
    }
  }

  function submitResponse() {
    if (state.phase !== 'trial') return;
    if (state.inputLocked && state.userInput.length !== state.currentSeq.length) return;
    state.inputLocked = true;

    const rt = performance.now() - state.inputStartTime;
    const isValid = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    const isCorrect =
      state.userInput.length === state.currentSeq.length &&
      state.userInput.every((d, i) => d === state.currentSeq[i]);

    state.levelTotal++;

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      if (isValid) state.rtList.push(rt);

      const spanBonus = state.currentSeq.length * CONFIG.spanBonus;
      const streakBonus = (state.streak - 1) * CONFIG.streakBonus;
      state.totalScore += CONFIG.correctBase + spanBonus + streakBonus;

      if (S && S.sequenceComplete) S.sequenceComplete();
      showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 600);
    } else {
      state.streak = 0;

      showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');
      push(nextTrial, 1000);
    }
  }

  /* ═══ END LEVEL ═══ */
  function endLevel() {
    clearAllTimeouts();

    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;
    const passed = accuracy >= CONFIG.passRatio;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      span: spanForLevel(state.level),
      passed
    });

    if (passed) {
      if (S) S.levelUp();
      setPhase('correct');
      render('' +
        renderProgressDots() +
        '<div class="feedback-icon good">✓</div>' +
        '<h2 class="phase-headline grd">Level ' + state.level + ' Passed</h2>' +
        '<p class="phase-sub">' +
          state.levelCorrect + '/' + state.levelTotal + ' sequences recalled · ' +
          'Span ' + spanForLevel(state.level) + ' digits' +
        '</p>' +
        '<p class="phase-hint">' +
          (state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting…' : 'You reached the top!') +
        '</p>'
      );

      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else {
          completeGame();
        }
      }, 1500);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      if (S) S.gameOver();
      setPhase('wrong');
      render('' +
        renderProgressDots() +
        '<div class="feedback-icon bad">✕</div>' +
        '<h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>' +
        '<p class="phase-sub">' +
          state.levelCorrect + '/' + state.levelTotal + ' sequences recalled — need ' +
          Math.ceil(CONFIG.trialsPerLevel * CONFIG.passRatio) + ' correct.' +
          '<br><strong>' + state.lives + '</strong> ' +
          (state.lives === 1 ? 'life' : 'lives') + ' remaining.' +
        '</p>'
      );

      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1900);
    }
  }

  /* ═══ COMPLETE GAME ═══ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials  = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const medianRT = H.median(state.rtList);
    const rtv = H.stdDev(state.rtList);
    const rcs = H.rcs(totalCorrect, state.rtList);

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      maxSpan: state.maxSpanReached,
      maxStreak: state.maxStreak,
      maxLevel
    };

    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', {
      maxSpan: state.maxSpanReached,
      accuracy,
      maxLevel
    });
    if (newBadges.length && S) S.badge();
    const modeBadges = H.getModeBadges('classic');
    const badgeHTML = modeBadges.length ? '' +
      '<div class="badges-row">' +
        modeBadges.map(b =>
          '<span class="badge-icon ' + (b.unlocked ? 'unlocked' : 'locked') + '" title="' + b.desc + '">' + b.icon + '</span>'
        ).join('') +
      '</div>' : '';

    H.addToHistory(sessionPayload);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(sessionPayload);

    // Missions
    H.updateMissionProgress('sessions', 1);
    H.updateMissionProgress('accuracy', accuracy);
    H.updateMissionProgress('streak', state.maxStreak);
    H.updateMissionProgress('maxSpan', state.maxSpanReached);
    if (hasNewPB) H.updateMissionProgress('pb', 1);

    const pbBanner = hasNewPB ? '<div class="pb-banner">★ NEW PERSONAL BEST ★</div>' : '';

    let interpretation = '';
    if (state.maxSpanReached >= 9)      interpretation = 'Exceptional digit span — top 2% (Miller 1956 avg 7±2).';
    else if (state.maxSpanReached >= 7) interpretation = 'Strong digit span — above the classic average.';
    else if (state.maxSpanReached >= 5) interpretation = 'Normal range (7±2). Keep training to expand.';
    else                                interpretation = 'Working memory is loading up — steady progress.';

    const insightsHTML = insights.length > 0 ? '' +
      '<div class="insights-card">' +
        '<div class="insights-title">Performance Insights</div>' +
        insights.map(i => '<div class="insight-item">' + i + '</div>').join('') +
      '</div>' : '';

    if (S) S.victory();

    render('' +
      '<div class="phase-title">Test Complete</div>' +
      '<h1 class="phase-headline grd">Your Score</h1>' +
      badgeHTML +
      pbBanner +

      '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">' + maxLevel + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">MAX SPAN</div><div class="stat-value">' + state.maxSpanReached + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +

      '<div class="mem-box">' +
        '<strong>Working Memory Profile</strong><br>' +
        'Max span: <strong>' + state.maxSpanReached + ' digits</strong> · ' +
        'Max streak: <strong>' + state.maxStreak + '</strong><br>' +
        interpretation +
      '</div>' +

      insightsHTML +

      '<div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">' +
        '<div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Median RT</div>' +
        '<div class="history-chart" id="history-chart"></div>' +
      '</div>' +

      '<div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">' +
        '<button class="big-btn" id="restart-btn">Try Again</button>' +
        '<button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>' +
      '</div>'
    );

    push(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'medianRT');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic',
        maxLevel,
        accuracy,
        medianRT,
        maxSpan: state.maxSpanReached,
        maxStreak: state.maxStreak,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'seq-mem',
      domain: 'memory',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      isNewPB: hasNewPB,
      maxSpan: state.maxSpanReached,
      maxStreak: state.maxStreak
    });
  }

  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
    }
  }

  /* ═══ RESET ═══ */
  function resetGame() {
    clearAllTimeouts();
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.maxSpanReached = CONFIG.startSpan;
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.totalScore = 0;
    state.sequences = [];
    state.trialIdx = 0;
    state.currentSeq = [];
    state.userInput = [];
    state.rtList = [];
    state.invalidRTs = 0;
    state.inputLocked = false;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[SeqMem] Container not found'); return; }

    root.innerHTML = '' +
      '<div id="game-root">' +
        '<header class="g-header">' +
          '<div class="g-header-left">' +
            '<button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>' +
            '<div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>' +
          '</div>' +
          '<div class="g-meta">' +
            '<span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>' +
            '<span class="g-meta-item"><span class="g-meta-label">SPAN</span><span class="g-meta-value" id="span-display">3</span></span>' +
            '<span class="g-meta-item"><span class="g-meta-label">LIVES</span><span class="g-meta-value" id="lives-display">3</span></span>' +
          '</div>' +
          '<button class="g-settings-btn" id="settings-btn" title="Settings">⚙</button>' +
        '</header>' +
        '<main id="stage" class="stage" data-phase="idle">' +
          '<div class="stage-inner"><div id="phase-content"></div></div>' +
        '</main>' +
        '<footer class="g-footer">' +
          '<div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>' +
        '</footer>' +
      '</div>';

    wireRefs();
    bindGlobalKeys();
    wireSettings();
    wireBackButton();

    if (typeof options.onComplete === 'function') state.onComplete = options.onComplete;
    showIdle();
  }

  function wireRefs() {
    elStage     = $('stage');
    elLevel     = $('level-display');
    elSpan      = $('span-display');
    elLives     = $('lives-display');
    elContent   = $('phase-content');
    elTimerFill = $('timer-fill');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      const k = e.key;

      // Idle: SPACE starts classic
      if (state.phase === 'idle' && state.mode === 'idle') {
        if (e.code === 'Space') {
          e.preventDefault();
          startClassic();
        }
        return;
      }

      // Gameover: SPACE restarts
      if (state.phase === 'gameover') {
        if (e.code === 'Space') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      // Only classic mode handles digits here
      if (state.mode !== 'classic') return;
      if (state.phase !== 'trial') return;
      if (state.inputLocked) return;

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
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'stimulus' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    if (window.SeqMemExtraModes && window.SeqMemExtraModes.abort) {
      try { window.SeqMemExtraModes.abort(); } catch (e) {}
    }
    showIdle();
  }

  function wireBackButton() {
    const btn = $('back-btn');
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBackClick();
    });
  }

  function autoInit() {
    if (!document.getElementById('game-root')) return;
    if (!document.getElementById('phase-content')) return;
    wireRefs();
    bindGlobalKeys();
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══ EXPOSE API for extra modes ═══ */
  window.SeqMemAPI = {
    CONFIG,
    state,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateSequence,
    spanForLevel,
    clearAllTimeouts,

    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $,
    getElContent: () => elContent
  };

  window.SeqMemGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();