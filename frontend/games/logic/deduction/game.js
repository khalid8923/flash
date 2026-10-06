/* ═══════════════════════════════════════════════════════════
   FLASH — Deduction Engine v1.0
   Evans (2008) · Multi-Premise Inference
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: 6 scenario generators · Distractor engine ·
             Explanation engine · Settings · i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.DeductionHelpers;
  const S = window.DeductionSounds;
  const STAGES = window.DeductionStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[Deduction] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('deduction', STAGES, {
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
    trialsPerLevel: 4,
    baseTime: 35000,
    minTime: 18000,
    timeStepPerLevel: 1200,
    correctBase: 100,
    streakBonus: 50,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000
  };

  /* ═══ NAME POOLS ═══ */
  const PEOPLE = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank',
    'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Liam',
    'Maya', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Ruby',
    'Sam', 'Tara'
  ];

  const CITIES = [
    'Paris', 'London', 'Tokyo', 'Berlin', 'Rome', 'Madrid',
    'Cairo', 'Sydney', 'Toronto', 'Oslo', 'Athens', 'Vienna'
  ];

  const ANIMALS = [
    'cats', 'dogs', 'birds', 'fish', 'horses', 'rabbits',
    'tigers', 'lions', 'bears', 'wolves', 'eagles', 'sharks'
  ];

  const ITEMS = [
    'books', 'pens', 'apples', 'oranges', 'cups', 'plates',
    'keys', 'cards', 'bottles', 'phones', 'watches', 'rings'
  ];

  /* ═══ UTILITIES ═══ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pickN(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  /* ═══ GENERATOR 1: ORDERING (Transitivity) ═══ */
  function genOrdering(level) {
    const [a, b, c, d] = pickN(PEOPLE, 4);
    const metric = pickOne(['taller', 'older', 'faster', 'wealthier']);
    const opposite = {
      taller: 'shorter', older: 'younger', faster: 'slower', wealthier: 'poorer'
    }[metric];

    const premises = [
      `<em>${a}</em> is ${metric} than <em>${b}</em>.`,
      `<em>${b}</em> is ${metric} than <em>${c}</em>.`,
      `<em>${c}</em> is ${metric} than <em>${d}</em>.`
    ];

    const correct = `<em>${a}</em> is ${metric} than <em>${d}</em>.`;
    const distractors = [
      `<em>${d}</em> is ${metric} than <em>${a}</em>.`,
      `<em>${b}</em> is ${metric} than <em>${a}</em>.`,
      `<em>${d}</em> is ${metric} than <em>${c}</em>.`
    ];

    return {
      scenarioName: 'Ordering · Transitivity',
      premises,
      question: `Which conclusion follows?`,
      correct,
      distractors,
      explanation: `By transitivity: ${a} → ${b} → ${c} → ${d}. So ${a} is ${metric} than ${d}.`
    };
  }

  /* ═══ GENERATOR 2: CONDITIONAL (Modus Ponens/Tollens) ═══ */
  function genConditional(level) {
    const [a, b] = pickN(PEOPLE, 2);
    const [p, q] = pickN(['reading', 'thinking', 'spelling', 'painting', 'cooking'], 2);

    const variant = randInt(1, 2);

    if (variant === 1) {
      // Modus Ponens: If P then Q. P. Therefore Q.
      const premises = [
        `If <em>${a}</em> is ${p}, then <em>${a}</em> is ${q}.`,
        `<em>${a}</em> is ${p}.`
      ];
      const correct = `<em>${a}</em> is ${q}.`;
      const distractors = [
        `<em>${a}</em> is not ${q}.`,
        `<em>${b}</em> is ${q}.`,
        `<em>${b}</em> is ${p}.`
      ];
      return {
        scenarioName: 'Conditional · Modus Ponens',
        premises,
        question: `Which conclusion follows?`,
        correct,
        distractors,
        explanation: `Modus Ponens: P ⇒ Q and P gives Q.`
      };
    } else {
      // Modus Tollens: If P then Q. Not Q. Therefore Not P.
      const premises = [
        `If <em>${a}</em> is ${p}, then <em>${a}</em> is ${q}.`,
        `<em>${a}</em> is not ${q}.`
      ];
      const correct = `<em>${a}</em> is not ${p}.`;
      const distractors = [
        `<em>${a}</em> is ${p}.`,
        `<em>${b}</em> is not ${q}.`,
        `<em>${b}</em> is not ${p}.`
      ];
      return {
        scenarioName: 'Conditional · Modus Tollens',
        premises,
        question: `Which conclusion follows?`,
        correct,
        distractors,
        explanation: `Modus Tollens: If P ⇒ Q and ¬Q, then ¬P.`
      };
    }
  }

  /* ═══ GENERATOR 3: GROUPING (Set Membership) ═══ */
  function genGrouping(level) {
    const [a, b, c] = pickN(PEOPLE, 3);
    const [group1, group2] = pickN(['the chess club', 'the debate team', 'the choir', 'the book club', 'the science fair'], 2);

    const premises = [
      `All members of <em>${group1}</em> are members of <em>${group2}</em>.`,
      `<em>${a}</em> is a member of <em>${group1}</em>.`,
      `<em>${b}</em> is not a member of <em>${group2}</em>.`
    ];

    const correct = `<em>${a}</em> is a member of <em>${group2}</em>.`;
    const distractors = [
      `<em>${b}</em> is a member of <em>${group1}</em>.`,
      `<em>${a}</em> is not a member of <em>${group2}</em>.`,
      `All members of <em>${group2}</em> are members of <em>${group1}</em>.`
    ];

    return {
      scenarioName: 'Grouping · Subset Logic',
      premises,
      question: `Which conclusion follows?`,
      correct,
      distractors,
      explanation: `${group1} ⊆ ${group2}. Since ${a} ∈ ${group1}, then ${a} ∈ ${group2}.`
    };
  }

  /* ═══ GENERATOR 4: COMPARISONS (Height/Age chains) ═══ */
  function genComparisons(level) {
    const [a, b, c] = pickN(PEOPLE, 3);
    const metric = pickOne(['tall', 'old', 'heavy', 'fast']);
    const cm = pickOne(['taller', 'older', 'heavier', 'faster']);

    const premises = [
      `<em>${a}</em> is ${cm} than <em>${b}</em>.`,
      `<em>${b}</em> is ${cm} than <em>${c}</em>.`
    ];

    const correct = `<em>${a}</em> is ${cm} than <em>${c}</em>.`;
    const distractors = [
      `<em>${c}</em> is ${cm} than <em>${a}</em>.`,
      `<em>${b}</em> is ${cm} than <em>${a}</em>.`,
      `<em>${a}</em> and <em>${c}</em> are the same.`
    ];

    return {
      scenarioName: 'Comparisons · Chain',
      premises,
      question: `Which conclusion follows?`,
      correct,
      distractors,
      explanation: `${a} > ${b} > ${c}, therefore ${a} > ${c}.`
    };
  }

  /* ═══ GENERATOR 5: DISJUNCTION (Disjunctive Syllogism) ═══ */
  function genDisjunction(level) {
    const [a, b] = pickN(PEOPLE, 2);
    const [x, y] = pickN(['went to the park', 'took the bus', 'bought a coffee', 'read a book', 'called home'], 2);

    const premises = [
      `Either <em>${a}</em> ${x} or <em>${a}</em> ${y}.`,
      `<em>${a}</em> did not ${x}.`
    ];

    const correct = `<em>${a}</em> ${y}.`;
    const distractors = [
      `<em>${a}</em> did not ${y}.`,
      `<em>${b}</em> ${y}.`,
      `<em>${b}</em> ${x}.`
    ];

    return {
      scenarioName: 'Disjunction · Syllogism',
      premises,
      question: `Which conclusion follows?`,
      correct,
      distractors,
      explanation: `If either X or Y is true, and X is false, then Y must be true.`
    };
  }

  /* ═══ GENERATOR 6: SET MEMBERSHIP (All/Some/None) ═══ */
  function genSetMembership(level) {
    const [animal1, animal2, animal3] = pickN(ANIMALS, 3);
    const [item1, item2] = pickN(ITEMS, 2);

    const variant = randInt(1, 3);

    if (variant === 1) {
      // All A are B, Some C are A ⇒ Some C are B
      const premises = [
        `All <em>${animal1}</em> are <em>${animal2}</em>.`,
        `Some <em>${animal3}</em> are <em>${animal1}</em>.`
      ];
      const correct = `Some <em>${animal3}</em> are <em>${animal2}</em>.`;
      const distractors = [
        `All <em>${animal3}</em> are <em>${animal2}</em>.`,
        `No <em>${animal3}</em> are <em>${animal2}</em>.`,
        `All <em>${animal2}</em> are <em>${animal1}</em>.`
      ];
      return {
        scenarioName: 'Set Membership · Some',
        premises,
        question: `Which conclusion follows?`,
        correct,
        distractors,
        explanation: `Some ${animal3} are ${animal1}, and all ${animal1} are ${animal2}, so some ${animal3} are ${animal2}.`
      };
    } else if (variant === 2) {
      // All A are B, No B are C ⇒ No A are C
      const premises = [
        `All <em>${animal1}</em> are <em>${animal2}</em>.`,
        `No <em>${animal2}</em> are <em>${animal3}</em>.`
      ];
      const correct = `No <em>${animal1}</em> are <em>${animal3}</em>.`;
      const distractors = [
        `All <em>${animal1}</em> are <em>${animal3}</em>.`,
        `Some <em>${animal1}</em> are <em>${animal3}</em>.`,
        `No <em>${animal3}</em> are <em>${animal2}</em>.`
      ];
      return {
        scenarioName: 'Set Membership · None',
        premises,
        question: `Which conclusion follows?`,
        correct,
        distractors,
        explanation: `${animal1} ⊆ ${animal2}, and ${animal2} ∩ ${animal3} = ∅, so ${animal1} ∩ ${animal3} = ∅.`
      };
    } else {
      // Some A are B, Some B are C ⇒ ? (no valid conclusion — but we provide a valid one)
      // Better: All A are B, All B are C ⇒ All A are C
      const premises = [
        `All <em>${item1}</em> are <em>${item2}</em>.`,
        `All <em>${item2}</em> are <em>${animal3}</em>.`
      ];
      const correct = `All <em>${item1}</em> are <em>${animal3}</em>.`;
      const distractors = [
        `All <em>${animal3}</em> are <em>${item1}</em>.`,
        `Some <em>${item1}</em> are not <em>${animal3}</em>.`,
        `No <em>${item1}</em> are <em>${animal3}</em>.`
      ];
      return {
        scenarioName: 'Set Membership · All',
        premises,
        question: `Which conclusion follows?`,
        correct,
        distractors,
        explanation: `${item1} ⊆ ${item2} ⊆ ${animal3}, so ${item1} ⊆ ${animal3}.`
      };
    }
  }

  const GENERATORS = [
    genOrdering,
    genConditional,
    genGrouping,
    genComparisons,
    genDisjunction,
    genSetMembership
  ];

  /* ═══ QUESTION GENERATION ═══ */
  function generateQuestion(level) {
    const generator = pickOne(GENERATORS);
    const q = generator(level);

    const options = shuffle([
      { text: q.correct, correct: true },
      ...q.distractors.map(d => ({ text: d, correct: false }))
    ]);

    return {
      scenarioName: q.scenarioName,
      premises: q.premises,
      question: q.question,
      options,
      correctIdx: options.findIndex(o => o.correct),
      explanation: q.explanation
    };
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentQuestion: null,
    questionIndex: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ CLEAR TIMEOUTS ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
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
      FS.onChange('highContrast', () => FS.applyToDOM());
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
    if (level === 'danger') elTimerFill.classList.add('danger');
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
        render('<div class="phase-title">' + title + '</div><div class="countdown-num">' + c + '</div><p class="phase-sub" style="margin-top:16px;">' + subtitle + '</p>');
        c--; push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
  }
  function showExplanation(q) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">Why</div><div class="explanation-text">${q.explanation}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ RENDER QUESTION ═══ */
  function renderQuestion(q, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="scenario-badge">${q.scenarioName}</div>
      <div class="premises-wrap">
        ${q.premises.map((p, i) => `
          <div class="premise-line">
            <span class="p-num">${i + 1}</span>
            <span>${p}</span>
          </div>
        `).join('')}
      </div>
      <div class="question-prompt">${q.question}</div>
      <div class="options-grid">
        ${q.options.map((o, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i + 1}">${o.text}</button>
        `).join('')}
      </div>
    `;
  }

  function wireAnswerButtons(handler) {
    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handler(btn));
    });
  }

  /* ═══ IDLE ═══ */
  function showIdle() {
    clearAllTimeouts();
    setPhase('idle');
    setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT  = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbRCS = pb.bestRCS > 0 ? pb.bestRCS : '—';

    const missionHTML = missions.missions.map(m => {
      const pct = Math.min(100, Math.round(((m.progress || 0) / m.target) * 100));
      return `
        <div class="mission-item ${m.done ? 'done' : ''}">
          <div class="mission-check">${m.done ? '✓' : ''}</div>
          <div class="mission-body">
            <div class="mission-text">${m.text}</div>
            <div class="mission-prog"><div class="mission-prog-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="mission-count">${m.progress || 0}/${m.target}</div>
        </div>`;
    }).join('');

    render(`
      <div class="phase-title">Logic Domain · Multi-Premise Inference</div>
      <h1 class="phase-headline grd">Deduction Engine</h1>
      <p class="phase-sub">
        3–4 facts. One conclusion follows.
        <br>Find the <strong style="color:#00EEFF">logically valid</strong> inference.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST RCS</div><div class="stat-value" style="font-size:16px">${pbRCS}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔍</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 4 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.DeductionExtraModes ? window.DeductionExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
            ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${T.t('mode_' + m.id) || m.name}</div>
            <div class="mode-desc">${m.id === 'daily' && daily ? 'Completed today' : m.desc}</div>
            <div class="mode-meta">${m.id === 'daily' && daily ? '→ Come back tomorrow' : m.meta}</div>
          </div>
        `).join('')}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>1</kbd>–<kbd>4</kbd> to answer · <kbd>Space</kbd> to start classic
      </p>
    `);

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    if (window.DeductionExtraModes && window.DDAPI) {
      window.DeductionExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.DeductionExtraModes.start(m.id, window.DDAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];

    elLevel.textContent = '1';
    elLives.textContent = String(CONFIG.maxLives);
    elStreak.textContent = '0';
    startLevel();
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.questionIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, 'Decide the valid conclusion', nextQuestion);
  }

  function nextQuestion() {
    if (state.questionIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    setPhase('trial');
    state.questionIndex++;

    const timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    const q = generateQuestion(state.level);
    state.currentQuestion = {
      ...q,
      startTime: performance.now(),
      timeLimit,
      answered: false
    };

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Puzzle <span class="current">${state.questionIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      ${renderQuestion(q)}
    `);

    wireAnswerButtons(handleAnswer);

    state.currentQuestion.startTime = performance.now();
    startTimer(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal';
      if (pct < 50) lvl = 'warning';
      if (pct < 20) lvl = 'danger';
      setTimer(pct, lvl);

      if (remaining <= 0) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        handleTimeout();
      }
    }, 60);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentQuestion || state.currentQuestion.answered) return;
    state.currentQuestion.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenIdx = parseInt(btn.dataset.index, 10);
    const correctIdx = state.currentQuestion.correctIdx;
    const elapsed = performance.now() - state.currentQuestion.startTime;
    const isCorrect = chosenIdx === correctIdx;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showExplanation(state.currentQuestion);
    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentQuestion.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');
      push(() => nextQuestion(), 2600);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 3200);
      else push(() => nextQuestion(), 3200);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentQuestion || state.currentQuestion.answered) return;
    state.currentQuestion.answered = true;
    state.levelTotal++;
    state.levelTotalTime += state.currentQuestion.timeLimit;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === state.currentQuestion.correctIdx) b.classList.add('correct');
    });

    showExplanation(state.currentQuestion);
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 3000);
    else push(() => nextQuestion(), 3000);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.6
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);
      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else completeGame();
      }, 1500);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      const s = snd(); if (s) s.gameOver();
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct — need 60% to pass.
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
        </p>
      `);
      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1800);
    }
  }

  /* ═══ COMPLETE GAME ═══ */
  function completeGame() {
    clearAllTimeouts();
    setPhase('gameover');
    setTimer(0);

    const totalCorrect = state.results.reduce((a, r) => a + r.correct, 0);
    const totalTrials = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
    const maxLevel = state.results.length;

    const medianRT = H.median(state.allRTs);
    const rtv = H.stdDev(state.allRTs);
    const rcs = H.rcs(totalCorrect, state.allRTs);

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv
    };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy });
    if (newBadges.length && S) S.badge();
    const modeBadges = H.getModeBadges('classic');
    const badgeHTML = modeBadges.length ? `
      <div class="badges-row">
        ${modeBadges.map(b => `<span class="badge-icon ${b.unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">${b.icon}</span>`).join('')}
      </div>` : '';

    H.addToHistory(sessionPayload);
    const history = H.getRecentSessions(15);
    const insights = H.generateInsights(sessionPayload);

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ NEW PERSONAL BEST ★</div>` : '';

    let interpretation = '';
    if (accuracy >= 80) interpretation = 'Exceptional multi-premise reasoning (top 10%).';
    else if (accuracy >= 65) interpretation = 'Strong deductive reasoning.';
    else if (accuracy >= 50) interpretation = 'Average — normal range.';
    else interpretation = 'Deductive reasoning needs practice.';

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">Performance Insights</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    if (S) S.victory();

    render(`
      <div class="phase-title">Test Complete</div>
      <h1 class="phase-headline grd">Your Score</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MAX STREAK</div><div class="stat-value">${state.maxStreak}</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="logic-box">
        <strong>Deduction Profile</strong>
        <br>
        Correct: <strong>${totalCorrect}</strong> / ${totalTrials}
        <br>
        <span style="color:var(--cyan)">${interpretation}</span>
      </div>

      ${insightsHTML}

      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Median RT</div>
        <div class="history-chart" id="history-chart"></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">Try Again</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    push(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'medianRT');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, medianRT, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'deduction', domain: 'logic', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      isNewPB: hasNewPB
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
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentQuestion = null;
    state.questionIndex = 0;
    state.allRTs = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[Deduction] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>
            <div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>
          </div>
          <div class="g-meta">
            <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">STREAK</span><span class="g-meta-value" id="streak-display">0</span></span>
            <span class="g-meta-item"><span class="g-meta-label">LIVES</span><span class="g-meta-value" id="lives-display">3</span></span>
          </div>
          <button class="g-settings-btn" id="settings-btn" title="Settings">⚙</button>
        </header>
        <main id="stage" class="stage" data-phase="idle">
          <div class="stage-inner"><div id="phase-content"></div></div>
        </main>
        <footer class="g-footer">
          <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
        </footer>
      </div>
    `;

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
    elStreak    = $('streak-display');
    elLives     = $('lives-display');
    elContent   = $('phase-content');
    elTimerFill = $('timer-fill');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.phase === 'idle' && state.mode === 'idle') { startClassic(); return; }
        if (state.phase === 'gameover') { resetGame(); return; }
        return;
      }

      if (state.phase === 'trial') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) {
          e.preventDefault();
          const btns = elContent.querySelectorAll('.option-btn');
          if (btns[n - 1] && !btns[n - 1].disabled) btns[n - 1].click();
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
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
  window.DDAPI = {
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

    generateQuestion,
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

  window.DeductionGame = {
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