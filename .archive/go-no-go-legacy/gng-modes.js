/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Extra Modes
   Reversed · Cued · Rule-Switching
   Loaded BEFORE game.js
   Uses window.GNGAPI at runtime
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

  /* ═══════════════════════════════════════════════════════
     MODE DEFINITIONS
     ═══════════════════════════════════════════════════════ */
  function getModeDefinitions() {
    return [
      { id: 'reversed',       name: 'Reversed',       icon: '🔄', desc: 'Click on NO-GO shapes — ignore GO',        meta: '→ 30 trials · Mind flip' },
      { id: 'cued',           name: 'Cued',           icon: '🎴', desc: 'A cue previews the next stimulus type',    meta: '→ 40 trials · Proactive control' },
      { id: 'rule-switching', name: 'Rule Switch',    icon: '🔀', desc: 'Rules flip mid-session — stay sharp',      meta: '→ 3 flips · Cognitive flexibility' }
    ];
  }

  /* ═══════════════════════════════════════════════════════
     REVERSED — Click NO-GO, ignore GO
     ═══════════════════════════════════════════════════════ */
  function startReversed() {
    const TOTAL = 30;
    M = {
      mode: 'reversed',
      trial: 0,
      total: TOTAL,
      correct: 0,
      rtList: [],
      answered: false,
      ended: false,
      current: null,
      goShapes: ['blueCircle', 'greenTriangle'],
      noGoShapes: ['redSquare', 'yellowDiamond']
    };

    API.setPhase('countdown');
    API.showCountdown(3, '🔄 REVERSED', 'Click NO-GO · Ignore GO — opposite of normal!', () => {
      nextRevTrial();
    });
  }

  function revHUD() {
    return `
      <div class="practice-badge" style="background:rgba(255,0,119,.15);border-color:rgba(255,0,119,.5);color:var(--pink);">
        🔄 REVERSED · ${M.trial + 1}/${M.total}
      </div>
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val">${M.total - M.trial}</div><div class="hud-lbl">LEFT</div></div>
      </div>
    `;
  }

  function nextRevTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endReversed(); return; }

    // 70% no-go (target to click), 30% go (avoid)
    const isTarget = Math.random() < 0.7;
    const shapeId = isTarget
      ? pickOne(M.noGoShapes)
      : pickOne(M.goShapes);

    M.current = {
      shapeId,
      isTarget,   // click-worthy
      isGo: !isTarget, // semantic: GO = avoid
      startTime: 0,
      answered: false
    };
    M.answered = false;

    API.setPhase('trial');
    API.render(revHUD() + `<div class="stimulus-wrap" id="stimulus-wrap"></div>`);
    push(showRevStimulus, 250);
  }

  function showRevStimulus() {
    if (M.ended) return;
    const t = M.current;
    t.startTime = performance.now();

    API.render(`
      ${revHUD()}
      <div class="rule-banner" style="background:rgba(255,0,119,.08);border-color:rgba(255,0,119,.4);">
        <span style="color:var(--pink);">CLICK: NO-GO shapes</span>
        <span style="color:var(--t3)">|</span>
        <span>AVOID: GO shapes</span>
      </div>
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${API.shapeClass(t.shapeId)}">
          ${API.renderShape(t.shapeId)}
        </div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
    `);
    API.$('response-btn').addEventListener('click', handleRevClick);
    API.startTrialTimer(1000, handleRevTimeout);
  }

  function handleRevClick() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    const rt = performance.now() - t.startTime;
    const isCorrect = t.isTarget;  // clicked on target = correct

    const wrap = API.$('stimulus-wrap');
    if (wrap) wrap.classList.add(isCorrect ? 'correct' : 'wrong');

    API.showFeedbackFlash(isCorrect ? 'hit' : 'commission');
    API.haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 3000) M.rtList.push(rt);
    }

    M.trial++;
    push(nextRevTrial, 700);
  }

  function handleRevTimeout() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    const isCorrect = !t.isTarget;  // didn't click + wasn't target = correct

    API.showFeedbackFlash(isCorrect ? 'hit' : 'miss');
    if (isCorrect) M.correct++;
    M.trial++;
    push(nextRevTrial, 500);
  }

  function endReversed() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = M.total > 0 ? Math.round((M.correct / M.total) * 100) : 0;
    const medianRT = H.median(M.rtList);
    const won = accuracy >= 90;

    const newBadges = H.checkAndUnlockBadges('reversed', { won, accuracy });
    if (newBadges.length && S) S.badge();

    API.render(`
      <div class="endless-gameover-icon">${won ? '🔄' : '💥'}</div>
      <div class="phase-title">${won ? 'Reversed Mastered' : 'Reversed Complete'}</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">
        ${M.correct}/${M.total} correct · Median RT: ${medianRT || '—'} ms
        <br>
        <span style="color:var(--t2);font-size:12px;">Flipping the prepotent response is hard work.</span>
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startReversed(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    API.emit({ mode: 'reversed', accuracy, medianRT, correct: M.correct, total: M.total, won });
  }

  /* ═══════════════════════════════════════════════════════
     CUED — A cue previews next stimulus (proactive control)
     ═══════════════════════════════════════════════════════ */
  function startCued() {
    const TOTAL = 40;
    M = {
      mode: 'cued',
      trial: 0,
      total: TOTAL,
      correct: 0,
      goHits: 0,
      goMisses: 0,
      noGoCorrect: 0,
      commissionErrors: 0,
      rtList: [],
      answered: false,
      ended: false,
      current: null,
      cueText: '',
      cueColor: '#00EEFF'
    };
    API.setPhase('countdown');
    API.showCountdown(3, '🎴 CUED', 'A cue previews the next signal — prepare!', nextCueTrial);
  }

  function cueHUD() {
    return `
      <div class="practice-badge" style="background:rgba(0,238,255,.1);border-color:rgba(0,238,255,.4);color:var(--cyan);">
        🎴 CUED · ${M.trial + 1}/${M.total}
      </div>
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.goHits}</div><div class="hud-lbl">HITS</div></div>
        <div class="hud-item"><div class="hud-val">${M.commissionErrors}</div><div class="hud-lbl">IMPL.</div></div>
        <div class="hud-item"><div class="hud-val">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
      </div>
    `;
  }

  function nextCueTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endCued(); return; }

    const isGo = Math.random() < 0.65;  // 65% Go
    const shapeId = isGo ? pickOne(['blueCircle', 'greenTriangle']) : pickOne(['redSquare', 'yellowDiamond']);

    M.current = { shapeId, isGo, startTime: 0 };
    M.answered = false;

    // 80% valid cue, 20% invalid (to prevent reliance)
    const cueValid = Math.random() < 0.8;
    const cueIsGo = cueValid ? isGo : !isGo;
    M.cueText = cueIsGo ? '🟢 GO INCOMING' : '🔴 STOP INCOMING';
    M.cueColor = cueIsGo ? '#00FF96' : '#FF4D4D';

    API.setPhase('trial');
    API.render(`
      ${cueHUD()}
      <div class="cue-banner" style="border-color:${M.cueColor};color:${M.cueColor};background:${M.cueColor}15;">
        ${M.cueText}
      </div>
      <div class="stimulus-wrap" style="opacity:0.15;min-height:200px;"></div>
    `);

    push(showCuedStimulus, 400);
  }

  function showCuedStimulus() {
    if (M.ended) return;
    const t = M.current;
    t.startTime = performance.now();

    API.render(`
      ${cueHUD()}
      <div class="cue-banner" style="border-color:${M.cueColor};color:${M.cueColor};background:${M.cueColor}15;opacity:.5;">
        ${M.cueText}
      </div>
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${API.shapeClass(t.shapeId)}">
          ${API.renderShape(t.shapeId)}
        </div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
    `);
    API.$('response-btn').addEventListener('click', handleCuedClick);
    API.startTrialTimer(700, handleCuedTimeout);
  }

  function handleCuedClick() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    const rt = performance.now() - t.startTime;
    const wrap = API.$('stimulus-wrap');

    if (t.isGo) {
      M.goHits++;
      M.correct++;
      if (rt >= 100 && rt <= 3000) M.rtList.push(rt);
      if (wrap) wrap.classList.add('correct');
      API.showFeedbackFlash('hit');
      API.haptic('correct');
    } else {
      M.commissionErrors++;
      if (wrap) wrap.classList.add('wrong');
      API.showFeedbackFlash('commission');
      API.haptic('wrong');
    }

    M.trial++;
    push(nextCueTrial, 700);
  }

  function handleCuedTimeout() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    if (t.isGo) {
      M.goMisses++;
      API.showFeedbackFlash('miss');
    } else {
      M.noGoCorrect++;
      M.correct++;
    }
    M.trial++;
    push(nextCueTrial, 500);
  }

  function endCued() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = M.total > 0 ? Math.round((M.correct / M.total) * 100) : 0;
    const medianRT = H.median(M.rtList);
    const dPrime = H.computeDPrime(M.goHits, M.goMisses, M.commissionErrors, M.noGoCorrect);

    const newBadges = H.checkAndUnlockBadges('cued', { trials: M.total, dPrime });
    if (newBadges.length && S) S.badge();

    API.render(`
      <div class="endless-gameover-icon">🎴</div>
      <div class="phase-title">Cued Complete</div>
      <h1 class="phase-headline grd">d' = ${dPrime}</h1>
      <p class="phase-sub">
        ${M.correct}/${M.total} correct · ${accuracy}% accuracy
        <br>${M.commissionErrors} impulsions · Median RT ${medianRT || '—'} ms
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card"><div class="stat-label">d'</div><div class="stat-value">${dPrime}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">COMMISSIONS</div><div class="stat-value bad">${M.commissionErrors}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startCued(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'cued', accuracy, dPrime, trials: M.total });
    }

    API.emit({ mode: 'cued', accuracy, medianRT, dPrime, trials: M.total });
  }

  /* ═══════════════════════════════════════════════════════
     RULE-SWITCHING — Rules flip mid-session
     ═══════════════════════════════════════════════════════ */
  function startRuleSwitching() {
    const TOTAL = 60;
    const FLIPS = [20, 40];  // flip after trial 20 and 40
    M = {
      mode: 'rule-switching',
      trial: 0,
      total: TOTAL,
      correct: 0,
      flips: 0,
      flipsRemaining: [...FLIPS],
      rtList: [],
      rtAfterFlip: [],
      rtBeforeFlip: [],
      answered: false,
      ended: false,
      current: null,
      ruleName: 'COLOR',
      goShapes: [],
      noGoShapes: [],
      justFlipped: false
    };
    applyRule('COLOR');

    API.setPhase('countdown');
    API.showCountdown(3, '🔀 RULE SWITCH', 'Rules will flip mid-session — stay sharp!', nextRSTrial);
  }

  function applyRule(ruleName) {
    if (ruleName === 'COLOR') {
      // GO = blue or green, NO-GO = red or yellow
      M.goShapes = ['blueCircle', 'greenTriangle'];
      M.noGoShapes = ['redSquare', 'yellowDiamond'];
      M.ruleName = 'COLOR';
    } else if (ruleName === 'SHAPE') {
      // GO = circle or triangle, NO-GO = square or diamond
      M.goShapes = ['blueCircle', 'greenTriangle'];
      M.noGoShapes = ['redSquare', 'yellowDiamond'];
      M.ruleName = 'SHAPE';
    }
  }

  function rsHUD() {
    return `
      <div class="practice-badge" style="background:rgba(157,78,221,.12);border-color:rgba(157,78,221,.4);color:var(--purple);">
        🔀 RULE SWITCH · ${M.trial + 1}/${M.total}
      </div>
      <div class="endless-hud">
        <div class="hud-item"><div class="hud-val">${M.correct}</div><div class="hud-lbl">CORRECT</div></div>
        <div class="hud-item"><div class="hud-val">${M.flips}</div><div class="hud-lbl">FLIPS</div></div>
      </div>
      <div class="rule-banner" style="background:rgba(157,78,221,.08);border-color:rgba(157,78,221,.4);">
        Rule: ${M.ruleName}
      </div>
    `;
  }

  function nextRSTrial() {
    if (M.ended) return;
    if (M.trial >= M.total) { endRuleSwitching(); return; }

    // Check for flip
    if (M.flipsRemaining.length > 0 && M.trial === M.flipsRemaining[0]) {
      M.flipsRemaining.shift();
      M.flips++;
      M.justFlipped = true;
      // Alternate rule
      applyRule(M.ruleName === 'COLOR' ? 'SHAPE' : 'COLOR');
      if (S) S.levelUpSignature();
      API.showLevelUpFlash('🔀 RULE FLIP!');
    }

    const isGo = Math.random() < 0.7;
    const shapeId = isGo ? pickOne(M.goShapes) : pickOne(M.noGoShapes);

    M.current = { shapeId, isGo, startTime: 0 };
    M.answered = false;

    API.setPhase('trial');
    API.render(rsHUD() + `<div class="stimulus-wrap" id="stimulus-wrap"></div>`);
    push(showRSStimulus, 350);
  }

  function showRSStimulus() {
    if (M.ended) return;
    const t = M.current;
    t.startTime = performance.now();

    API.render(`
      ${rsHUD()}
      <div class="stimulus-wrap" id="stimulus-wrap">
        <div class="stimulus-shape ${API.shapeClass(t.shapeId)}">
          ${API.renderShape(t.shapeId)}
        </div>
      </div>
      <button class="response-btn" id="response-btn">RESPOND</button>
    `);
    API.$('response-btn').addEventListener('click', handleRSClick);
    API.startTrialTimer(700, handleRSTimeout);
  }

  function handleRSClick() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    const rt = performance.now() - t.startTime;
    const wrap = API.$('stimulus-wrap');
    const isCorrect = t.isGo;

    if (isCorrect) {
      M.correct++;
      if (rt >= 100 && rt <= 3000) M.rtList.push(rt);
      if (M.justFlipped) M.rtAfterFlip.push(rt); else M.rtBeforeFlip.push(rt);
      if (wrap) wrap.classList.add('correct');
      API.showFeedbackFlash('hit');
      API.haptic('correct');
    } else {
      if (wrap) wrap.classList.add('wrong');
      API.showFeedbackFlash('commission');
      API.haptic('wrong');
    }
    M.justFlipped = false;

    M.trial++;
    push(nextRSTrial, 600);
  }

  function handleRSTimeout() {
    if (M.answered || M.ended || !M.current) return;
    M.answered = true;
    const t = M.current;
    if (!t.isGo) { M.correct++; API.showFeedbackFlash('hit'); }
    else API.showFeedbackFlash('miss');
    M.justFlipped = false;
    M.trial++;
    push(nextRSTrial, 450);
  }

  function endRuleSwitching() {
    M.ended = true;
    clearAll();
    API.setPhase('gameover');

    const accuracy = M.total > 0 ? Math.round((M.correct / M.total) * 100) : 0;
    const medianRT = H.median(M.rtList);
    const beforeAvg = M.rtBeforeFlip.length ? Math.round(M.rtBeforeFlip.reduce((a,b)=>a+b,0)/M.rtBeforeFlip.length) : 0;
    const afterAvg = M.rtAfterFlip.length ? Math.round(M.rtAfterFlip.reduce((a,b)=>a+b,0)/M.rtAfterFlip.length) : 0;
    const switchCost = afterAvg && beforeAvg ? afterAvg - beforeAvg : 0;

    const newBadges = H.checkAndUnlockBadges('rule-switching', { won: true, flips: M.flips });
    if (newBadges.length && S) S.badge();

    API.render(`
      <div class="endless-gameover-icon">🔀</div>
      <div class="phase-title">Rule Switch Complete</div>
      <h1 class="phase-headline grd">${accuracy}%</h1>
      <p class="phase-sub">
        ${M.correct}/${M.total} correct · ${M.flips} rule flips survived
      </p>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-label">CORRECT</div><div class="stat-value">${M.correct}/${M.total}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">SWITCH COST</div><div class="stat-value">${switchCost > 0 ? '+' : ''}${switchCost}ms</div></div>
      </div>

      ${switchCost > 0 ? `
        <div class="insights-card">
          <div class="insights-title">Switch Analysis</div>
          <div class="insight-item">RT before flip: <strong>${beforeAvg}ms</strong></div>
          <div class="insight-item">RT after flip: <strong>${afterAvg}ms</strong></div>
          <div class="insight-item">Switch cost: <strong>+${switchCost}ms</strong> — normal cognitive load</div>
        </div>
      ` : ''}

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="retry-btn">Try Again</button>
        <button class="big-btn" id="back-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    API.$('retry-btn').addEventListener('click', (e) => { e.stopPropagation(); startRuleSwitching(); });
    API.$('back-btn').addEventListener('click', (e) => { e.stopPropagation(); API.exitToMenu(); });

    if (window.FlashStages) {
      window.FlashStages.checkSession({ mode: 'rule-switching', accuracy, flips: M.flips });
    }

    API.emit({ mode: 'rule-switching', accuracy, medianRT, flips: M.flips, switchCost });
  }

  /* ═══════════════════════════════════════════════════════
     PUBLIC INTERFACE
     ═══════════════════════════════════════════════════════ */
  function start(modeId, apiRef, sRef, hRef) {
    API = apiRef;
    S = sRef;
    H = hRef;
    clearAll();
    if (modeId === 'reversed') startReversed();
    else if (modeId === 'cued') startCued();
    else if (modeId === 'rule-switching') startRuleSwitching();
  }

  window.GNGModes = { getModeDefinitions, start };
})();