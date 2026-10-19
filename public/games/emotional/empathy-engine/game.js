/* ═══════════════════════════════════════════════════════════
   FLASH — Empathy Engine v2.0 (Full Rewrite)
   Ickes (1993) · Empathic Accuracy · Theory of Mind
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.EmpathyEngineHelpers;
  const S = window.EmpathyEngineSounds;
  const STAGES = window.EmpathyEngineStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[EmpathyEngine] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('empathy-engine', STAGES, {
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
    trialsPerLevel: 5,
    baseTime: 22000,
    minTime: 11000,
    timeStepPerLevel: 700,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 60000
  };

  /* ═══ SCENARIO DATABASE ═══ */
  const SCENARIOS = {
    EASY: [
      { scenario: 'A child is quiet and withdrawn at their own birthday party.',
        question: 'What is the child most likely feeling?',
        answer: 'Overwhelmed by attention',
        distractors: ['Angry at the guests', 'Bored with the gifts', 'Planning a prank'],
        explanation: 'Withdrawal at the center of attention often signals overwhelm, not displeasure.',
        deep: false },
      { scenario: 'Your friend has cancelled plans three times this week with vague excuses.',
        question: 'What is your friend most likely experiencing?',
        answer: 'Emotional exhaustion or depression',
        distractors: ['New busy schedule', 'Dislike of you', 'Forgetfulness'],
        explanation: 'Repeated last-minute cancellations with vague reasons often signal low mood.',
        deep: false },
      { scenario: 'A colleague over-prepares a short 5-minute update for the team.',
        question: 'What is the colleague most likely feeling?',
        answer: 'Anxiety about being judged',
        distractors: ['Ambition', 'Confusion', 'Excitement'],
        explanation: 'Excessive preparation for low-stakes tasks usually reflects fear of judgment.',
        deep: false },
      { scenario: 'Your partner talks non-stop about a small win they had at work.',
        question: 'What does your partner most need from you?',
        answer: 'Acknowledgement and validation',
        distractors: ['Silence and space', 'Critique of details', 'A change of topic'],
        explanation: 'Repeated sharing of small wins often signals a need for recognition.',
        deep: false },
      { scenario: 'A student submits work that is far below their usual quality.',
        question: 'What is the most likely reason?',
        answer: 'Something is wrong — stress, sleep, or life event',
        distractors: ['Laziness', 'Disinterest in the subject', 'Poor ability'],
        explanation: 'Sudden drops in quality usually reflect a life situation, not a character change.',
        deep: false },
      { scenario: 'Your coworker laughs at your joke, but it is not very funny.',
        question: 'What is your coworker most likely trying to do?',
        answer: 'Make you feel good',
        distractors: ['Mock you', 'Hide confusion', 'Distract the room'],
        explanation: 'Laughing politely at a weak joke is a form of social generosity.',
        deep: false },
      { scenario: 'A friend keeps changing the subject to you every time you ask about them.',
        question: 'What is your friend most likely trying to avoid?',
        answer: 'Burdening you with their problems',
        distractors: ['Boring you', 'Showing off', 'Hiding a secret'],
        explanation: 'Deflection back to you often protects the relationship from their own pain.',
        deep: false },
      { scenario: 'Your parent calls you "just to check in" three times in one week.',
        question: 'What is your parent most likely feeling?',
        answer: 'Worried or missing you',
        distractors: ['Angry at you', 'Planning a surprise', 'Controlling you'],
        explanation: 'Unexpected extra contact often signals worry or loneliness.',
        deep: false }
    ],

    MEDIUM: [
      { scenario: 'A person receives a gift they visibly do not like, but thanks you warmly.',
        question: 'What are they most likely thinking?',
        answer: 'The meaning matters more than the object',
        distractors: ['They love the gift', 'They will return it', 'They are lying to be polite'],
        explanation: 'Warm thanks for a poor gift often means valuing the relationship over the object.',
        deep: true },
      { scenario: 'A mentor is unusually critical of your work today — more than usual.',
        question: 'What is the mentor most likely feeling?',
        answer: 'Concerned about your future, pushing you harder',
        distractors: ['Personal dislike', 'Bad mood', 'Trying to reject you'],
        explanation: 'Extra criticism from a normally supportive mentor often reflects investment.',
        deep: true },
      { scenario: 'A friend nods and agrees with everything you say in a conversation.',
        question: 'What is your friend most likely doing?',
        answer: 'Avoiding deeper engagement or disagreement',
        distractors: ['Genuinely agreeing', 'Being very attentive', 'Feeling bored'],
        explanation: 'Excessive agreement can signal withdrawal from the exchange.',
        deep: true },
      { scenario: 'A colleague says "It\'s fine, really" after you apologize for a small mistake.',
        question: 'What are they most likely feeling?',
        answer: 'Slightly hurt but not wanting to escalate',
        distractors: ['Truly fine and unbothered', 'Angry and hiding it', 'Indifferent to you'],
        explanation: 'Reassurance phrases often cover minor unresolved feelings.',
        deep: true },
      { scenario: 'Your sibling brags about their accomplishments every time you meet.',
        question: 'What is your sibling most likely feeling?',
        answer: 'Insecure and seeking validation',
        distractors: ['Proud and confident', 'Competitive with you', 'Showing off for fun'],
        explanation: 'Repeated bragging usually stems from an inner need for reassurance.',
        deep: true },
      { scenario: 'A friend gives an overly detailed answer to a simple question.',
        question: 'What is your friend most likely feeling?',
        answer: 'Anxious about being misunderstood',
        distractors: ['Being thorough', 'Loving to talk', 'Not listening'],
        explanation: 'Over-explaining often signals a fear of being misjudged.',
        deep: true },
      { scenario: 'Your partner asks "Are you okay?" three times tonight.',
        question: 'What is your partner most likely picking up on?',
        answer: 'Something subtle in your mood you have not named',
        distractors: ['Wanting attention', 'Being paranoid', 'Picking a fight'],
        explanation: 'Repeated checks usually come from a real perception of a shift in you.',
        deep: true },
      { scenario: 'A usually talkative friend suddenly goes silent at a group dinner.',
        question: 'What is your friend most likely feeling?',
        answer: 'Left out or emotionally somewhere else',
        distractors: ['Tired from the day', 'Listening carefully', 'Being polite'],
        explanation: 'A sudden change from a familiar behavior pattern usually signals distress.',
        deep: true }
    ],

    HARD: [
      { scenario: 'A person gives you a gift that seems very strange to you — no obvious use.',
        question: 'What were they most likely thinking?',
        answer: 'They gave something meaningful to them, not to you',
        distractors: ['They were careless', 'They wanted to offend you', 'They wanted to be original'],
        explanation: 'Gifts that reflect the giver\'s interests often carry personal significance.',
        deep: true },
      { scenario: 'A colleague you barely know goes out of their way to help you today.',
        question: 'What is the colleague most likely doing?',
        answer: 'Building a future favor or ally',
        distractors: ['Just being kind', 'Trying to date you', 'Testing your competence'],
        explanation: 'Unexpected help from distant colleagues often has a relational motivation.',
        deep: true },
      { scenario: 'A friend says "I hope you\'re happy" with a flat tone after your good news.',
        question: 'What is your friend most likely feeling?',
        answer: 'Happy for you, but also grieving their own situation',
        distractors: ['Sarcastic', 'Indifferent', 'Angry at you'],
        explanation: 'The flat tone reveals the joy is genuine but overshadowed by personal pain.',
        deep: true },
      { scenario: 'Your boss asks you to "remind them" what you said yesterday — word for word.',
        question: 'What is your boss most likely doing?',
        answer: 'Asserting dominance through feigned forgetfulness',
        distractors: ['Having a memory issue', 'Testing your honesty', 'Preparing for a meeting'],
        explanation: 'Deliberate memory feigning is a common subtle power move.',
        deep: true },
      { scenario: 'A friend tells a story in which they were "mistakenly blamed" for something.',
        question: 'What is your friend most likely doing?',
        answer: 'Testing whether you will take their side without asking',
        distractors: ['Venting', 'Revealing a secret', 'Asking for advice'],
        explanation: 'Framing themselves as victim asks for unconditional support without context.',
        deep: true },
      { scenario: 'Someone praises your work publicly in a way that highlights every small detail you did.',
        question: 'What are they most likely doing?',
        answer: 'Framing you as junior or needing oversight',
        distractors: ['Genuine praise', 'Valuing thoroughness', 'Promoting you'],
        explanation: 'Praising overly specific actions can position you as someone to be monitored.',
        deep: true },
      { scenario: 'A family member repeats an old disagreement "innocently" at every reunion.',
        question: 'What is your family member most likely doing?',
        answer: 'Keeping unresolved power settled in their favor',
        distractors: ['Poor memory', 'Wanting to reconnect', 'Sincere curiosity'],
        explanation: 'Patterned re-mentioning of past conflicts reasserts dominance subtly.',
        deep: true },
      { scenario: 'A close friend responds to every message within seconds, day or night, lately.',
        question: 'What is your friend most likely feeling?',
        answer: 'Anxious about the relationship or their own life',
        distractors: ['Just being available', 'Devoted to you', 'Bored and online'],
        explanation: 'A sudden shift to constant availability often signals inner anxiety.',
        deep: true }
    ]
  };

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
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    deepCorrect: 0,
    deepTotal: 0,
    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function poolForLevel(level) {
    if (level <= 4) return SCENARIOS.EASY;
    if (level <= 9) return SCENARIOS.MEDIUM;
    return SCENARIOS.HARD;
  }

  function generateQuestion(level) {
    const pool = poolForLevel(level);
    const entry = pickOne(pool);
    const options = shuffle([
      { text: entry.answer, correct: true },
      ...entry.distractors.map(d => ({ text: d, correct: false }))
    ]);
    return {
      scenario: entry.scenario,
      question: entry.question,
      options,
      correctIdx: options.findIndex(o => o.correct),
      explanation: entry.explanation,
      deep: entry.deep
    };
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
  function setTimer(pct, level = 'normal') {
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
        c--; push(tick, 700);
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
    ex.innerHTML = `<div class="explanation-title">Empathic Read</div><div class="explanation-text">${q.explanation}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ IDLE SCREEN ═══ */
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
    const pbDeep = pb.bestDeepRead > 0 ? pb.bestDeepRead + '%' : '—';

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
      <div class="phase-title">Emotional Domain · Empathic Accuracy</div>
      <h1 class="phase-headline grd">Empathy Engine</h1>
      <p class="phase-sub">
        A scenario appears. Choose the person's most likely
        <strong style="color:#FF4D6D">internal state</strong> —
        what they really feel, not what they literally said.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">DEEP READS</div><div class="stat-value" style="font-size:16px">${pbDeep}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🫂</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 5 scenarios each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.EmpathyEngineExtraModes ? window.EmpathyEngineExtraModes.getModeDefinitions() : []).map(m => `
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

    if (window.EmpathyEngineExtraModes && window.EEAPI) {
      window.EmpathyEngineExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.EmpathyEngineExtraModes.start(m.id, window.EEAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC MODE ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.deepCorrect = 0;
    state.deepTotal = 0;

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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Read between the lines', nextQuestion);
  }

  function nextQuestion() {
    if (state.questionIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('question');
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
        Scenario <span class="current">${state.questionIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="scenario-card">
        <div class="scenario-text">${q.scenario}</div>
      </div>

      <div class="question-prompt">${q.question}</div>

      <div class="options-grid">
        ${q.options.map((o, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i + 1}">${o.text}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

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
    }, 50);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'question' || !state.currentQuestion || state.currentQuestion.answered) return;
    state.currentQuestion.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenIdx = parseInt(btn.dataset.index, 10);
    const correctIdx = state.currentQuestion.correctIdx;
    const elapsed = performance.now() - state.currentQuestion.startTime;
    const isCorrect = chosenIdx === correctIdx;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    if (state.currentQuestion.deep) {
      state.deepTotal++;
      if (isCorrect) state.deepCorrect++;
    }

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
      push(() => nextQuestion(), 2200);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2800);
      else push(() => nextQuestion(), 2800);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'question' || !state.currentQuestion) return;
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

    if (state.lives <= 0) push(() => completeGame(), 2600);
    else push(() => nextQuestion(), 2600);
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
      }, 1400);
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
    const deepAcc = state.deepTotal > 0 ? Math.round((state.deepCorrect / state.deepTotal) * 100) : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      deepRead: deepAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional empathic accuracy (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong perspective-taking ability';
    else if (accuracy >= 50) interpretation = 'Average — normal empathic range';
    else interpretation = 'Surface reading — practice perspective-taking';

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
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">DEEP READS</div><div class="stat-value">${deepAcc}%</div></div>
      </div>

      <div class="emo-box">
        <strong>Empathic Accuracy Profile</strong>
        <br>
        Deep reads (masked emotions): <strong>${deepAcc}%</strong> correct
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
        mode: 'classic', maxLevel, accuracy, medianRT,
        deepReadAccuracy: deepAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'empathy-engine', domain: 'emotional', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      deepReadAccuracy: deepAcc,
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
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.levelCorrect = 0; state.levelTotal = 0; state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentQuestion = null;
    state.questionIndex = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.deepCorrect = 0;
    state.deepTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[EmpathyEngine] Container not found'); return; }

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

      if (state.phase === 'question') {
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
    if (state.phase === 'question' || state.phase === 'countdown') {
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
  window.EEAPI = {
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

  window.EmpathyEngineGame = {
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