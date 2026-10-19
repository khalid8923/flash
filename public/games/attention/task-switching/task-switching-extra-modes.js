/* ═══════════════════════════════════════════════════════════
   FLASH — Task Switching Extra Modes
   Rule Rush · Endless · Precision · Daily
   Loaded BEFORE game.js
   Uses window.TSAPI at runtime
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null;
  let S = null;
  let H = null;
  let timeouts = [];
  let M = {};

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ═══ MODE DEFINITIONS ═══ */
  function getModeDefinitions() {
    return [
      { id: 'rule-rush',  name: 'Rule Rush',  icon: '⏱️', desc: '60 seconds · Switch rules as fast as possible', meta: '→ Score max correct' },
      { id: 'endless',    name: 'Endless',    icon: '⚡', desc: 'One mistake = game over · Speed increases',    meta: '→ Level ∞' },
      { id: 'precision',  name: 'Precision',  icon: '🎯', desc: '20 trials · Max accuracy · No rush',           meta: '→ 98%+ for Gold' },
      { id: 'daily',      name: 'Daily',      icon: '★',  desc: 'Fixed protocol · Once per day',                meta: '→ 30 trials' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     RULE RUSH — 60s · Max correct answers
     ═══════════════════════════════════════════════════════ */
  function startRuleRush() {
    const TOTAL_MS = 60000;
    const PENALTY_MS = 2500;

    M = {
      mode: 'rule-rush',
      endTime: 0,
      correct: 0,
      total: 0,
      streak: 0,
      maxStreak: 0,
      rtList: [],
      switchRTs: [],
      repeatRTs: [],
      answered: false,
      current: null,
      previousRule: null,
      ended: false
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⏱️ RULE RUSH', '60 seconds · Wrong = -2.5s penalty', () => {
      M.endTime = performance.now() + TOTAL_MS;
      runGlobalTimer(TOTAL_MS, PENALTY_MS);
      nextRRTrial(TOTAL_MS, PENALTY_MS);
    });
  }

  function runGlobalTimer(TOTAL_MS, PENALTY_MS) {
    const tid = setInterval(() => {
      if (M.ended) { clearInterval(tid); return; }
      const remaining = Math.max(0, M.endTime - performance.now());
      const pct = (remaining / TOTAL_MS) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      const el = API.$('rr-time');
      if (el) el.textContent = Math.ceil(remaining / 1000);
      if (remaining <= 0) { clearInterval(tid); endRuleRush(); }
    }, 50);
    timeouts.push(tid);
  }

  function rrHUD() {
    return `
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val" id="rr-score">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val" id="rr-time">${Math.ceil(Math.max(0, M.endTime - performance.now()) / 1000)}</div><div class="hud-lbl">SECONDS</div></div>
        <div class="hud-item"><div class="hud-val" style="color:${M.streak >= 5 ? '#FFD60A' : 'var(--cyan)'}">${M.streak}</div><div class="hud-lbl">STREAK</div></div>
      </div>
    `;
  }

  function nextRRTrial(TOTAL_MS, PENALTY_MS) {
    if (M.ended) return;
    if (performance.now() >= M.endTime) { endRuleRush(); return; }

    const stim = API.generateStimulus();
    const rules = API.rulesForStimulus(stim);

    // Force switch every 3 trials for intensity
    const forceSwitch = M.total > 0 && M.total % 3 === 0;
    let rule, didSwitch = false;

    if (forceSwitch && M.previousRule) {
      const otherDim = stim.type === 'number' ? API.LETTER_RULES : API.NUMBER_RULES;
      rule = pickOne(otherDim);
      didSwitch = true;
    } else if (M.previousRule && M.previousRule.dimension === stim.type) {
      rule = M.previousRule;
    } else {
      rule = pickOne(rules);
      didSwitch = !!M.previousRule;
    }
    M.previousRule = rule;

    M.current = { stim, rule, didSwitch, startTime: 0 };
    M.answered = false;

    API.setPhase('trial');
    API.render(rrHUD() + `
      <div class="rule-banner ${stim.type === 'number' ? 'number-rule' : 'letter-rule'} ${didSwitch ? 'switched' : ''}">
        <span class="rule-icon">⚡</span>
        <span>${rule.prompt}</span>
      </div>
      <div class="stimulus-wrap">
        <div class="stimulus-char ${stim.type}">${stim.display}</div>
      </div>
      <div class="options-grid">
        <button class="option-btn" data-side="left" data-key="1">${rule.options[0]}</button>
        <button class="option-btn" data-side="right" data-key="2">${rule.options[1]}</button>
      </div>
    `);

    API.$('response-wrap') && API.$('response-wrap').remove();
    API.getElContent().querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRRAnswer(btn, TOTAL_MS, PENALTY_MS));
    });

    M.current.startTime = performance.now();
  }

  function handleRRAnswer(btn, TOTAL_MS, PENALTY_MS) {
    if (M.answered || M.ended || !M.current) return;
    if (performance.now() >= M.endTime) { endRuleRush(); return; }
    M.answered = true;

    const chosen = btn.dataset.side;
    const correct = M.current.rule.classify(M.current.stim);
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    M.total++;
    if (isCorrect) {
      M.correct++;
      M.streak++;
      if (M.streak > M.maxStreak) M.maxStreak = M.streak;
      if (rt >= 100 && rt <= 3000) {
        M.rtList.push(rt);
        if (M.current.didSwitch) M.switchRTs.push(rt);
        else M.repeatRTs.push(rt);
      }
    } else {
      M.streak = 0;
      M.endTime -= PENALTY_MS;
    }

    API.getElContent().querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');
    if (S && isCorrect) S.hit();
    else if (S) S.miss();

    push(() => nextRRTrial(TOTAL_MS, PENALTY_MS), isCorrect ? 200 : 450);
  }

  function endRuleRush() {
    if (M.ended) return;
    M.ended = true;
    clearAll();

    API.setPhase('gameover');
    API.setTimer(0);

    const accuracy = M.total > 0 ? Math.round((M.correct / M.total) * 100) : 0;
    const medianRT = H.median(M.rtList);
    const switchCost = computeSwitchCost(M.switchRTs, M.repeatRTs);

    if (S) S.victory();

    API.render(`
      <div class="phase-title">Rule Rush Complete</div>
      <h1 class="phase-headline grd">⏱️ Time's Up</h1>
      <p class="phase-sub">You nailed <strong>${M.correct}</strong> answers in 60 seconds.</p>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">BEST STREAK</div><div class="stat-value">${M.maxStreak}</div></div>
      </div>

      ${switchCost !== null ? `
        <div class="switch-box">
          <strong>Switch Cost:</strong> ${switchCost >= 0 ? '+' : ''}${switchCost} ms
        </div>
      ` : ''}

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startRuleRush(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({
        mode: 'rule-rush', totalCorrect: M.correct, accuracy, switchCost
      });
    }

    const newBadges = H.checkAndUnlockBadges('rule-rush', { trials: M.total, accuracy, switchCost });
    if (newBadges.length && S) S.badge();

    API.emit({
      gameId: 'task-switching', domain: 'attention', mode: 'rule-rush',
      totalCorrect: M.correct, totalTrials: M.total, accuracy,
      medianRT, switchCost, maxStreak: M.maxStreak
    });
  }

  /* ═══════════════════════════════════════════════════════
     ENDLESS — One mistake = game over · Speed increases
     ═══════════════════════════════════════════════════════ */
  function startEndless() {
    M = {
      mode: 'endless',
      level: 1,
      levelProgress: 0,
      totalCorrect: 0,
      streak: 0,
      maxStreak: 0,
      current: null,
      previousRule: null,
      answered: false,
      ended: false,
      timeLimit: 2800,
      rtList: [],
      switchRTs: [],
      repeatRTs: []
    };

    API.setPhase('countdown');
    API.showCountdown(3, '⚡ ENDLESS', 'One mistake ends the run. Speed increases!', nextEndlessTrial);
  }

  function nextEndlessTrial() {
    if (M.ended) return;

    const stim = API.generateStimulus();
    const rules = API.rulesForStimulus(stim);

    // 40% switch chance
    const shouldSwitch = Math.random() < 0.4;
    let rule, didSwitch = false;

    if (!M.previousRule) {
      rule = pickOne(rules);
    } else if (shouldSwitch && M.previousRule.dimension === stim.type) {
      const sameDim = rules.filter(r => r.id !== M.previousRule.id);
      rule = sameDim.length ? pickOne(sameDim) : M.previousRule;
      didSwitch = true;
    } else if (M.previousRule.dimension === stim.type) {
      rule = M.previousRule;
    } else {
      rule = pickOne(rules);
      didSwitch = true;
    }
    M.previousRule = rule;

    M.current = { stim, rule, didSwitch, startTime: performance.now() };
    M.answered = false;

    const progPct = (M.levelProgress / 5) * 100;

    API.setPhase('trial');
    API.render(`
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.level}</div><div class="hud-lbl">LEVEL</div></div>
        <div class="hud-item"><div class="hud-val">${M.totalCorrect}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val" style="color:${M.streak >= 5 ? '#FFD60A' : 'var(--cyan)'}">${M.streak}</div><div class="hud-lbl">STREAK</div></div>
      </div>
      <div class="endless-progress"><div class="endless-progress-fill" style="width:${progPct}%"></div></div>

      <div class="rule-banner ${stim.type === 'number' ? 'number-rule' : 'letter-rule'} ${didSwitch ? 'switched' : ''}">
        <span class="rule-icon">⚡</span>
        <span>${rule.prompt}</span>
      </div>
      <div class="stimulus-wrap">
        <div class="stimulus-char ${stim.type}">${stim.display}</div>
      </div>
      <div class="options-grid">
        <button class="option-btn" data-side="left" data-key="1">${rule.options[0]}</button>
        <button class="option-btn" data-side="right" data-key="2">${rule.options[1]}</button>
      </div>
    `);

    API.getElContent().querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEndlessAnswer(btn));
    });

    // Timer
    const start = performance.now();
    API.setTimer(100);
    const tid = setInterval(() => {
      if (M.ended) { clearInterval(tid); return; }
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, M.timeLimit - elapsed);
      const pct = (remaining / M.timeLimit) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (remaining <= 0) {
        clearInterval(tid);
        if (!M.answered) { M.answered = true; endEndless('timeout'); }
      }
    }, 40);
    timeouts.push(tid);
  }

  function handleEndlessAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = btn.dataset.side;
    const correct = M.current.rule.classify(M.current.stim);
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    API.getElContent().querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');
    if (S) { isCorrect ? S.hit() : S.miss(); }

    if (!isCorrect) {
      push(() => endEndless('wrong'), 700);
      return;
    }

    M.totalCorrect++;
    M.streak++;
    if (M.streak > M.maxStreak) M.maxStreak = M.streak;
    if (rt >= 100 && rt <= 3000) {
      M.rtList.push(rt);
      if (M.current.didSwitch) M.switchRTs.push(rt);
      else M.repeatRTs.push(rt);
    }
    M.levelProgress++;

    // Level up every 5 correct
    if (M.levelProgress >= 5) {
      M.level++;
      M.levelProgress = 0;
      M.timeLimit = Math.max(800, M.timeLimit - 200);
      API.showLevelUpFlash(`LEVEL ${M.level}!`);
      if (S) S.levelUp();
    }

    push(nextEndlessTrial, 300);
  }

  function endEndless(reason) {
    if (M.ended) return;
    M.ended = true;
    clearAll();

    API.setPhase('gameover');
    API.setTimer(0);

    const medianRT = H.median(M.rtList);
    const switchCost = computeSwitchCost(M.switchRTs, M.repeatRTs);

    if (S) S.gameOver();

    API.render(`
      <div class="endless-gameover-icon">${reason === 'timeout' ? '⏱' : '💥'}</div>
      <div class="phase-title">${reason === 'timeout' ? 'Time Ran Out' : 'Mistake Made'}</div>
      <h1 class="phase-headline grd">Endless Over</h1>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">LEVEL</div><div class="stat-value">${M.level}</div></div>
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.totalCorrect}</div></div>
        <div class="stat-card"><div class="stat-label">BEST STREAK</div><div class="stat-value">${M.maxStreak}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      ${switchCost !== null ? `
        <div class="switch-box"><strong>Switch Cost:</strong> ${switchCost >= 0 ? '+' : ''}${switchCost} ms</div>
      ` : ''}

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startEndless(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({
        mode: 'endless', levelReached: M.level, totalCorrect: M.totalCorrect
      });
    }

    const newBadges = H.checkAndUnlockBadges('endless', { levelReached: M.level });
    if (newBadges.length && S) S.badge();

    API.emit({
      gameId: 'task-switching', domain: 'attention', mode: 'endless',
      levelReached: M.level, totalCorrect: M.totalCorrect,
      maxStreak: M.maxStreak, medianRT, switchCost
    });
  }

  /* ═══════════════════════════════════════════════════════
     PRECISION — 20 trials · No rush · Max accuracy
     ═══════════════════════════════════════════════════════ */
  function startPrecision() {
    M = {
      mode: 'precision',
      total: 20,
      trial: 0,
      correct: 0,
      rtList: [],
      switchRTs: [],
      repeatRTs: [],
      current: null,
      previousRule: null,
      answered: false,
      ended: false
    };

    API.setPhase('countdown');
    API.showCountdown(3, '🎯 PRECISION', '20 trials · Focus on accuracy, not speed', nextPrecisionTrial);
  }

  function nextPrecisionTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endPrecision(); return; }

    const stim = API.generateStimulus();
    const rules = API.rulesForStimulus(stim);

    // 50% switch for training cognitive flexibility
    const shouldSwitch = Math.random() < 0.5;
    let rule, didSwitch = false;

    if (!M.previousRule) {
      rule = pickOne(rules);
    } else if (shouldSwitch && M.previousRule.dimension === stim.type) {
      const sameDim = rules.filter(r => r.id !== M.previousRule.id);
      rule = sameDim.length ? pickOne(sameDim) : M.previousRule;
      didSwitch = true;
    } else if (M.previousRule.dimension === stim.type) {
      rule = M.previousRule;
    } else {
      rule = pickOne(rules);
      didSwitch = true;
    }
    M.previousRule = rule;

    M.current = { stim, rule, didSwitch, startTime: performance.now() };
    M.answered = false;

    API.setPhase('trial');
    API.render(`
      <div class="practice-badge" style="background:rgba(0,255,150,.1);border-color:rgba(0,255,150,.4);color:var(--green);">
        PRECISION · ${M.trial + 1} / ${M.total}
      </div>
      <div class="rule-banner ${stim.type === 'number' ? 'number-rule' : 'letter-rule'} ${didSwitch ? 'switched' : ''}">
        <span class="rule-icon">🎯</span>
        <span>${rule.prompt}</span>
      </div>
      <div class="stimulus-wrap">
        <div class="stimulus-char ${stim.type}">${stim.display}</div>
      </div>
      <div class="options-grid">
        <button class="option-btn" data-side="left" data-key="1">${rule.options[0]}</button>
        <button class="option-btn" data-side="right" data-key="2">${rule.options[1]}</button>
      </div>
    `);

    API.getElContent().querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handlePrecisionAnswer(btn));
    });

    API.setTimer(100);
  }

  function handlePrecisionAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = btn.dataset.side;
    const correct = M.current.rule.classify(M.current.stim);
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 3000) {
        M.rtList.push(rt);
        if (M.current.didSwitch) M.switchRTs.push(rt);
        else M.repeatRTs.push(rt);
      }
    }

    API.getElContent().querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextPrecisionTrial, isCorrect ? 350 : 600);
  }

  function endPrecision() {
    M.ended = true;
    clearAll();

    API.setPhase('gameover');
    API.setTimer(0);

    const accuracy = Math.round((M.correct / M.total) * 100);
    const medianRT = H.median(M.rtList);
    const switchCost = computeSwitchCost(M.switchRTs, M.repeatRTs);

    if (S) S.victory();

    API.render(`
      <div class="phase-title">Precision Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">${M.correct}/${M.total} correct</p>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">SWITCH COST</div><div class="stat-value">${switchCost !== null ? (switchCost >= 0 ? '+' : '') + switchCost + 'ms' : '—'}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn-menu" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startPrecision(); });
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    const newBadges = H.checkAndUnlockBadges('precision', { accuracy });
    if (newBadges.length && S) S.badge();

    API.emit({
      gameId: 'task-switching', domain: 'attention', mode: 'precision',
      accuracy, medianRT, switchCost, totalTrials: M.total
    });
  }

  /* ═══════════════════════════════════════════════════════
     DAILY — 30 trials · Fixed protocol
     ═══════════════════════════════════════════════════════ */
  function startDaily() {
    M = {
      mode: 'daily',
      total: 30,
      trial: 0,
      correct: 0,
      rtList: [],
      current: null,
      previousRule: null,
      answered: false,
      ended: false
    };

    API.setPhase('countdown');
    API.showCountdown(3, '★ DAILY CHALLENGE', '30 trials · Fixed protocol', nextDailyTrial);
  }

  function nextDailyTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endDaily(); return; }

    const stim = API.generateStimulus();
    const rules = API.rulesForStimulus(stim);

    const shouldSwitch = Math.random() < 0.35;
    let rule, didSwitch = false;

    if (!M.previousRule) {
      rule = pickOne(rules);
    } else if (shouldSwitch && M.previousRule.dimension === stim.type) {
      const sameDim = rules.filter(r => r.id !== M.previousRule.id);
      rule = sameDim.length ? pickOne(sameDim) : M.previousRule;
      didSwitch = true;
    } else if (M.previousRule.dimension === stim.type) {
      rule = M.previousRule;
    } else {
      rule = pickOne(rules);
      didSwitch = true;
    }
    M.previousRule = rule;

    M.current = { stim, rule, didSwitch, startTime: performance.now() };
    M.answered = false;

    API.setPhase('trial');
    API.render(`
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        DAILY · ${M.trial + 1} / ${M.total}
      </div>
      <div class="rule-banner ${stim.type === 'number' ? 'number-rule' : 'letter-rule'} ${didSwitch ? 'switched' : ''}">
        <span class="rule-icon">★</span>
        <span>${rule.prompt}</span>
      </div>
      <div class="stimulus-wrap">
        <div class="stimulus-char ${stim.type}">${stim.display}</div>
      </div>
      <div class="options-grid">
        <button class="option-btn" data-side="left" data-key="1">${rule.options[0]}</button>
        <button class="option-btn" data-side="right" data-key="2">${rule.options[1]}</button>
      </div>
    `);

    API.getElContent().querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDailyAnswer(btn));
    });

    // 4s window per daily trial
    const start = performance.now();
    API.setTimer(100);
    const tid = setInterval(() => {
      if (M.ended) { clearInterval(tid); return; }
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, 4000 - elapsed);
      const pct = (remaining / 4000) * 100;
      API.setTimer(pct, pct < 20 ? 'danger' : pct < 50 ? 'warning' : 'normal');
      if (remaining <= 0) {
        clearInterval(tid);
        if (!M.answered) { M.answered = true; M.trial++; push(nextDailyTrial, 300); }
      }
    }, 40);
    timeouts.push(tid);
  }

  function handleDailyAnswer(btn) {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;

    const chosen = btn.dataset.side;
    const correct = M.current.rule.classify(M.current.stim);
    const isCorrect = chosen === correct;
    const rt = performance.now() - M.current.startTime;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 3000) M.rtList.push(rt);
    }

    API.getElContent().querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    API.haptic(isCorrect ? 'correct' : 'wrong');
    if (S) { isCorrect ? S.hit() : S.miss(); }

    M.trial++;
    push(nextDailyTrial, isCorrect ? 300 : 500);
  }

  function endDaily() {
    M.ended = true;
    clearAll();

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
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
      </div>
      <button class="big-btn" id="back-btn-menu" style="margin-top:20px">Back to Menu</button>
    `);
    API.$('back-btn-menu').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'daily', accuracy, rcs });
    }

    API.emit({ gameId: 'task-switching', domain: 'attention', mode: 'daily', accuracy, rcs });
  }

  /* ═══ HELPERS ═══ */
  function computeSwitchCost(switchRTs, repeatRTs) {
    if (!switchRTs.length || !repeatRTs.length) return null;
    const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return avg(switchRTs) - avg(repeatRTs);
  }

  /* ═══ PUBLIC INTERFACE ═══ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef;
    S = sRef;
    H = hRef;
    clearAll();
    if (modeId === 'rule-rush') startRuleRush();
    else if (modeId === 'endless') startEndless();
    else if (modeId === 'precision') startPrecision();
    else if (modeId === 'daily') startDaily();
  }

  window.TaskSwitchingExtraModes = { getModeDefinitions, start };
})();