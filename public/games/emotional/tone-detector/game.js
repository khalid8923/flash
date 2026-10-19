/* ═══════════════════════════════════════════════════════════
   FLASH — Tone Detector v2.0 (Full Rewrite)
   MSCEIT-style emotional tone interpretation
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.ToneDetectorHelpers;
  const S = window.ToneDetectorSounds;
  const STAGES = window.ToneDetectorStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[ToneDetector] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('tone-detector', STAGES, {
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
    baseTime: 20000,
    minTime: 10000,
    timeStepPerLevel: 650,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000
  };

  /* ═══ TONE DATABASE ═══ */
  const TONES = {
    EASY: [
      { context: 'Your friend just came back from a vacation.',
        utterance: '"Oh, I missed you so much!"',
        answer: 'Sincere affection',
        distractors: ['Sarcasm', 'Boredom', 'Anger'],
        explanation: 'Given the reunion context, the loud tone indicates genuine warmth.',
        subtle: false },

      { context: 'You dropped your phone and the screen cracked.',
        utterance: '"Well, that\'s just perfect."',
        answer: 'Sarcasm',
        distractors: ['Sincere joy', 'Genuine surprise', 'Gratitude'],
        explanation: 'The positive words contradict the bad situation — classic sarcasm.',
        subtle: false },

      { context: 'Your colleague is explaining a topic you already know well.',
        utterance: '"Yes, yes, I understand. Please continue."',
        answer: 'Polite impatience',
        distractors: ['Enthusiastic agreement', 'Confusion', 'Fear'],
        explanation: 'The repetition "yes, yes" signals a wish for the speaker to speed up.',
        subtle: false },

      { context: 'Your teammate missed an obvious deadline.',
        utterance: '"I\'m sure you did your best."',
        answer: 'Condescension',
        distractors: ['Genuine encouragement', 'Admiration', 'Apology'],
        explanation: 'In a failure context, "I\'m sure you did your best" implies doubt — condescending.',
        subtle: false },

      { context: 'A friend is telling you about their recent breakup.',
        utterance: '"That must have been incredibly hard for you."',
        answer: 'Empathy',
        distractors: ['Curiosity', 'Blame', 'Indifference'],
        explanation: 'Naming the other person\'s difficulty = empathy.',
        subtle: false },

      { context: 'You ask a colleague how their weekend was.',
        utterance: '"Don\'t even ask."',
        answer: 'Frustration',
        distractors: ['Happiness', 'Excitement', 'Pride'],
        explanation: '"Don\'t even ask" is a common idiom of frustration.',
        subtle: false },

      { context: 'Your boss sees you for the first time after a promotion.',
        utterance: '"Well, look at you!"',
        answer: 'Approval',
        distractors: ['Disgust', 'Confusion', 'Fear'],
        explanation: 'The idiom conveys pride or approval.',
        subtle: false },

      { context: 'You arrive late for the third time this week.',
        utterance: '"Oh, look who finally decided to join us."',
        answer: 'Passive aggression',
        distractors: ['Genuine welcome', 'Neutral greeting', 'Joy'],
        explanation: 'The wording is neutral but the pattern implies irritation.',
        subtle: false }
    ],

    MEDIUM: [
      { context: 'A friend shares exciting news about their new job.',
        utterance: '"That\'s nice. Very nice."',
        answer: 'Restrained envy',
        distractors: ['Genuine joy', 'Boredom', 'Fear'],
        explanation: 'Repeated "nice" is used to mask lack of enthusiasm — restrained envy.',
        subtle: true },

      { context: 'A coworker brings up an old mistake of yours in front of the team.',
        utterance: '"I\'m just saying — for the record."',
        answer: 'Defensive gossip',
        distractors: ['Neutral clarification', 'Apology', 'Support'],
        explanation: '"For the record" disguises personal attack as objectivity.',
        subtle: true },

      { context: 'You ask for a raise and your manager answers immediately.',
        utterance: '"We\'ll see what we can do."',
        answer: 'Noncommittal deflection',
        distractors: ['Genuine commitment', 'Excitement', 'Threat'],
        explanation: 'Corporate phrase used to avoid saying yes or no.',
        subtle: true },

      { context: 'Someone you barely know is praising your expensive watch.',
        utterance: '"Wow, you must work very hard."',
        answer: 'Sarcastic insinuation',
        distractors: ['Genuine admiration', 'Concern', 'Envy-free compliment'],
        explanation: 'The tone implies the watch was not earned by work.',
        subtle: true },

      { context: 'Your partner asks how the surprise party went.',
        utterance: '"You really outdid yourself this time."',
        answer: 'Deep appreciation',
        distractors: ['Sarcasm', 'Anger', 'Indifference'],
        explanation: 'Past tense "outdid yourself" with warm tone = sincere praise.',
        subtle: true },

      { context: 'A friend tells you about their new diet.',
        utterance: '"That\'s quite the commitment."',
        answer: 'Skeptical admiration',
        distractors: ['Total support', 'Mockery', 'Indifference'],
        explanation: '"Quite the" distances the speaker — admiration with reservation.',
        subtle: true },

      { context: 'You share a personal struggle with a colleague.',
        utterance: '"That\'s rough. Anyway, about the meeting..."',
        answer: 'Dismissive change of subject',
        distractors: ['Empathy', 'Deep concern', 'Curiosity'],
        explanation: 'The pivot "anyway" signals the acknowledgment was perfunctory.',
        subtle: true },

      { context: 'Your teen shows you a drawing they made.',
        utterance: '"Interesting choice of colors."',
        answer: 'Hedged criticism',
        distractors: ['Genuine praise', 'Curiosity', 'Indifference'],
        explanation: '"Interesting" as a compliment is often a way to avoid a negative remark.',
        subtle: true }
    ],

    HARD: [
      { context: 'A colleague you disagree with just finished a long presentation.',
        utterance: '"You clearly put a lot of thought into this."',
        answer: 'Backhanded compliment',
        distractors: ['Sincere admiration', 'Envy', 'Total dismissal'],
        explanation: 'Praise for effort (not content) implies doubt about the message.',
        subtle: true },

      { context: 'Your partner says nothing all evening, then quietly:',
        utterance: '"It\'s fine. Really."',
        answer: 'Suppressed hurt',
        distractors: ['Genuine calm', 'Relief', 'Excitement'],
        explanation: 'The double "really" signals it is not actually fine.',
        subtle: true },

      { context: 'A friend borrowed your car and returned it without gas.',
        utterance: '"No worries, I\'m sure you were in a rush."',
        answer: 'Polite accusation',
        distractors: ['Genuine understanding', 'Happiness', 'Fear'],
        explanation: 'Naming the excuse means the speaker is not actually fine with it.',
        subtle: true },

      { context: 'Your colleague helped you with a task but took credit.',
        utterance: '"Couldn\'t have done it without you — well, obviously."',
        answer: 'Masked resentment',
        distractors: ['Genuine thanks', 'Playful joke only', 'Admiration'],
        explanation: 'The reversal "well, obviously" reasserts the true hierarchy.',
        subtle: true },

      { context: 'Your boss asks about a project update you gave yesterday.',
        utterance: '"Remind me again what you said — I want to be very clear."',
        answer: 'Threat via feigned confusion',
        distractors: ['Memory lapse', 'Curiosity', 'Care'],
        explanation: 'Feigning memory loss to force re-explanation is a power move.',
        subtle: true },

      { context: 'A parent looks at your career choice for the first time.',
        utterance: '"As long as you\'re happy. That\'s what matters."',
        answer: 'Conditional acceptance',
        distractors: ['Unconditional support', 'Pride', 'Indifference'],
        explanation: 'The conditional "as long as" reveals reservation.',
        subtle: true },

      { context: 'You share a poem you wrote with a friend.',
        utterance: '"Did you write this yourself? I mean, really?"',
        answer: 'Disbelief with undercurrent of doubt',
        distractors: ['Flattery', 'Admiration', 'Curiosity'],
        explanation: 'Repeated questioning implies suspicion of authorship, not praise.',
        subtle: true },

      { context: 'After a tense meeting, a colleague says to you:',
        utterance: '"Well, that went well."',
        answer: 'Sarcastic understatement',
        distractors: ['Genuine relief', 'Happiness', 'Neutral assessment'],
        explanation: 'Standard post-disaster idiom — the opposite is meant.',
        subtle: false }
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
    subtleCorrect: 0,
    subtleTotal: 0,
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
    if (level <= 4) return TONES.EASY;
    if (level <= 9) return TONES.MEDIUM;
    return TONES.HARD;
  }

  function generateQuestion(level) {
    const pool = poolForLevel(level);
    const entry = pickOne(pool);
    const options = shuffle([
      { text: entry.answer, correct: true },
      ...entry.distractors.map(d => ({ text: d, correct: false }))
    ]);
    return {
      context: entry.context,
      utterance: entry.utterance,
      options,
      correctIdx: options.findIndex(o => o.correct),
      explanation: entry.explanation,
      subtle: entry.subtle
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
    const pbSub = pb.bestSubtleTone > 0 ? pb.bestSubtleTone + '%' : '—';

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
      <div class="phase-title">Emotional Domain · Social Cognition</div>
      <h1 class="phase-headline grd">Tone Detector</h1>
      <p class="phase-sub">
        A <strong>context</strong> and an <strong>utterance</strong> appear.
        Identify the <strong style="color:#FF4D6D">emotional tone</strong> behind
        the words — what the speaker really means.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">SUBTLE TONES</div><div class="stat-value" style="font-size:16px">${pbSub}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎵</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 5 tones each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.ToneDetectorExtraModes ? window.ToneDetectorExtraModes.getModeDefinitions() : []).map(m => `
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

    if (window.ToneDetectorExtraModes && window.TDAPI) {
      window.ToneDetectorExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.ToneDetectorExtraModes.start(m.id, window.TDAPI, S, H);
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
    state.subtleCorrect = 0;
    state.subtleTotal = 0;

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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Read the tone, not just the words', nextQuestion);
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
        Item <span class="current">${state.questionIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="context-box">
        <div class="context-label">Context</div>
        <div class="context-text">${q.context}</div>
      </div>

      <div class="utterance-box">
        <div class="utterance-text">${q.utterance}</div>
      </div>

      <p class="phase-hint" style="margin-bottom:12px;">What is the speaker's tone?</p>

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

    if (state.currentQuestion.subtle) {
      state.subtleTotal++;
      if (isCorrect) state.subtleCorrect++;
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
    if (state.phase !== 'question' || !state.currentQuestion || state.currentQuestion.answered) return;
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
    const subtleAcc = state.subtleTotal > 0
      ? Math.round((state.subtleCorrect / state.subtleTotal) * 100)
      : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      subtleTone: subtleAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional social cognition (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong emotional inference';
    else if (accuracy >= 50) interpretation = 'Average — normal social range';
    else interpretation = 'Literal thinking bias — practice subtext';

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
        <div class="stat-card"><div class="stat-label">SUBTLE TONES</div><div class="stat-value">${subtleAcc}%</div></div>
      </div>

      <div class="emo-box">
        <strong>Social Cognition Profile</strong>
        <br>
        Subtle tones (sarcasm, backhanded, subtext): <strong>${subtleAcc}%</strong> correct
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
        subtleToneAccuracy: subtleAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'tone-detector', domain: 'emotional', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      subtleToneAccuracy: subtleAcc,
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
    state.subtleCorrect = 0;
    state.subtleTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[ToneDetector] Container not found'); return; }

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
  window.TDAPI = {
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

  window.ToneDetectorGame = {
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