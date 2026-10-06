/* ═══════════════════════════════════════════════════════════
   FLASH — Lexical Decision v1.0
   Language Domain · Meyer & Schvaneveldt (1971) Semantic Priming
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.LexicalDecisionHelpers;
  const S = window.LexicalDecisionSounds;
  const STAGES = window.LexicalDecisionStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[LexicalDecision] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('lexical-decision', STAGES, {
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
    trialsPerLevel: 12,
    basePrimeDuration: 500,
    minPrimeDuration: 250,
    primeDurationStep: 15,
    baseGapDuration: 280,
    minGapDuration: 120,
    gapDurationStep: 8,
    baseResponseTime: 9000,
    minResponseTime: 2000,
    responseTimeStep: 400,
    nonWordProbability: 0.35,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 30000,
    passThreshold: 0.7
  };

  /* ═══════════════════════════════════════════════════════════
     WORD DATABASE — Semantic pairs (Meyer & Schvaneveldt)
     ═══════════════════════════════════════════════════════════ */
  const WORD_PAIRS = [
    { prime: 'bread',   target: 'butter'   },
    { prime: 'doctor',  target: 'nurse'    },
    { prime: 'cat',     target: 'dog'      },
    { prime: 'table',   target: 'chair'    },
    { prime: 'sun',     target: 'moon'     },
    { prime: 'hot',     target: 'cold'     },
    { prime: 'king',    target: 'queen'    },
    { prime: 'fork',    target: 'knife'    },
    { prime: 'salt',    target: 'pepper'   },
    { prime: 'pen',     target: 'paper'    },
    { prime: 'shoe',    target: 'sock'     },
    { prime: 'cup',     target: 'saucer'   },
    { prime: 'coffee',  target: 'sugar'    },
    { prime: 'boy',     target: 'girl'     },
    { prime: 'day',     target: 'night'    },
    { prime: 'black',   target: 'white'    },
    { prime: 'up',      target: 'down'     },
    { prime: 'left',    target: 'right'    },
    { prime: 'mother',  target: 'father'   },
    { prime: 'brother', target: 'sister'   },
    { prime: 'apple',   target: 'orange'   },
    { prime: 'red',     target: 'blue'     },
    { prime: 'hand',    target: 'foot'     },
    { prime: 'head',    target: 'shoulder' },
    { prime: 'eye',     target: 'ear'      },
    { prime: 'car',     target: 'road'     },
    { prime: 'book',    target: 'page'     },
    { prime: 'tree',    target: 'leaf'     },
    { prime: 'river',   target: 'bridge'   },
    { prime: 'school',  target: 'teacher'  },
    { prime: 'ocean',   target: 'wave'     },
    { prime: 'mountain',target: 'valley'   },
    { prime: 'piano',   target: 'guitar'   },
    { prime: 'cheese',  target: 'wine'     },
    { prime: 'soup',    target: 'spoon'    },
    { prime: 'rain',    target: 'cloud'    },
    { prime: 'fire',    target: 'smoke'    },
    { prime: 'winter',  target: 'summer'   },
    { prime: 'morning', target: 'evening'  },
    { prime: 'north',   target: 'south'    }
  ];

  /* ═══ NON-WORD GENERATOR — 3 mutation strategies ═══ */
  const VOWELS = 'aeiou';

  function makeNonWord(word) {
    if (!word || word.length < 3) return word + 'x';
    const strategies = ['vowel', 'swap', 'double'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];

    // Strategy 1: Vowel substitution
    if (strategy === 'vowel') {
      const vowelPositions = [];
      for (let i = 0; i < word.length; i++) {
        if (VOWELS.includes(word[i].toLowerCase())) vowelPositions.push(i);
      }
      if (vowelPositions.length) {
        const pos = vowelPositions[Math.floor(Math.random() * vowelPositions.length)];
        let newVowel;
        let attempts = 0;
        do {
          newVowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
          attempts++;
        } while (newVowel === word[pos].toLowerCase() && attempts < 20);
        return word.slice(0, pos) + newVowel + word.slice(pos + 1);
      }
    }

    // Strategy 2: Letter transposition (adjacent, not first letter)
    if (strategy === 'swap' && word.length >= 4) {
      const pos = 1 + Math.floor(Math.random() * (word.length - 2));
      return word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
    }

    // Strategy 3: Consonant doubling
    if (strategy === 'double' && word.length >= 3) {
      const consonantPositions = [];
      for (let i = 1; i < word.length - 1; i++) {
        if (!VOWELS.includes(word[i].toLowerCase())) consonantPositions.push(i);
      }
      if (consonantPositions.length) {
        const pos = consonantPositions[Math.floor(Math.random() * consonantPositions.length)];
        return word.slice(0, pos + 1) + word[pos] + word.slice(pos + 1);
      }
    }

    // Fallback: append 'x'
    return word + 'x';
  }

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentTrial: null,
    trialIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    relatedRTs: [],
    unrelatedRTs: [],
    realTotal: 0,
    realCorrect: 0,
    nonTotal: 0,
    nonCorrect: 0,
    timeoutIds: [],
    primeTimerId: null,
    gapTimerId: null,
    targetTimerId: null,
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.primeTimerId)  { clearTimeout(state.primeTimerId);  state.primeTimerId = null; }
    if (state.gapTimerId)    { clearTimeout(state.gapTimerId);    state.gapTimerId = null; }
    if (state.targetTimerId) { clearTimeout(state.targetTimerId); state.targetTimerId = null; }
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

  function primeDurationForLevel(level) {
    return Math.max(CONFIG.minPrimeDuration,
      CONFIG.basePrimeDuration - (level - 1) * CONFIG.primeDurationStep);
  }
  function gapDurationForLevel(level) {
    return Math.max(CONFIG.minGapDuration,
      CONFIG.baseGapDuration - (level - 1) * CONFIG.gapDurationStep);
  }
  function responseTimeForLevel(level) {
    return Math.max(CONFIG.minResponseTime,
      CONFIG.baseResponseTime - (level - 1) * CONFIG.responseTimeStep);
  }

  /* ═══ TRIAL GENERATION ═══ */
  function generateTrial(level) {
    const isNonWord = Math.random() < CONFIG.nonWordProbability;
    const isRelated = Math.random() < 0.5;

    if (!isNonWord) {
      // Real word trial
      if (isRelated) {
        const pair = pickOne(WORD_PAIRS);
        return {
          prime: pair.prime,
          target: pair.target,
          isReal: true,
          related: true
        };
      } else {
        // Prime from one pair, target from another
        const pairA = pickOne(WORD_PAIRS);
        let pairB = pickOne(WORD_PAIRS);
        let guard = 0;
        while (pairB.target === pairA.target && guard < 20) {
          pairB = pickOne(WORD_PAIRS);
          guard++;
        }
        return {
          prime: pairA.prime,
          target: pairB.target,
          isReal: true,
          related: false
        };
      }
    } else {
      // Non-word trial
      const pair = pickOne(WORD_PAIRS);
      const nonWord = makeNonWord(pair.target);
      return {
        prime: pair.prime,
        target: nonWord,
        isReal: false,
        related: isRelated
      };
    }
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
      FS.onChange('soundEnabled',  (v) => { if (S) S.setEnabled(v); });
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
    if (level === 'danger')  elTimerFill.classList.add('danger');
  }
  function renderProgressDots() {
    let dots = '';
    for (let i = 1; i <= CONFIG.maxLevel; i++) {
      let cls = '';
      if (i < state.level) {
        const r = state.results.find(x => x.level === i);
        cls = r && r.passed ? 'done' : 'fail';
      } else if (i === state.level && state.phase !== 'gameover') {
        cls = 'current';
      }
      dots += `<span class="p-dot ${cls}"></span>`;
    }
    return `<div class="progress-dots">${dots}</div>`;
  }
  function showFeedbackFlash(hit) {
    const el = document.createElement('div');
    el.className = 'feedback-flash ' + (hit ? 'hit' : 'miss');
    el.textContent = hit ? '✓' : '✕';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 450);
  }
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function showCountdown(from, title, subtitle, onDone) {
    let c = from;
    const tick = () => {
      if (c > 0) {
        const s = snd(); if (s) s.tick();
        render(`<div class="phase-title">${title}</div><div class="countdown-num">${c}</div><p class="phase-sub" style="margin-top:16px;">${subtitle}</p>`);
        c--;
        push(tick, 500);
      } else {
        const s = snd(); if (s) s.go();
        onDone();
      }
    };
    tick();
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
    const pbNon = pb.bestNonWordAccuracy > 0 ? pb.bestNonWordAccuracy + '%' : '—';

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

    const extraModesHTML = (window.LexicalDecisionExtraModes
      ? window.LexicalDecisionExtraModes.getModeDefinitions() : []
    ).map(m => `
      <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
        ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
        <div class="mode-icon">${m.icon}</div>
        <div class="mode-name">${T.t('mode_' + m.id) || m.name}</div>
        <div class="mode-desc">${m.id === 'daily' && daily ? 'Completed today' : m.desc}</div>
        <div class="mode-meta">${m.id === 'daily' && daily ? '→ Come back tomorrow' : m.meta}</div>
      </div>
    `).join('');

    render(`
      <div class="phase-title">Language Domain · Semantic Priming</div>
      <h1 class="phase-headline grd">Lexical Decision</h1>
      <p class="phase-sub">
        A <strong style="color:#00EEFF">prime word</strong> flashes briefly,
        then a <strong style="color:#9D4EDD">target</strong> appears.
        <br>Decide if the target is a <strong>real word</strong> or a <strong>non-word</strong>.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">NON-WORD ACC</div><div class="stat-value" style="font-size:16px">${pbNon}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">📖</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 12 trials each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${extraModesHTML}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>1</kbd> Real · <kbd>2</kbd> Non-word · <kbd>Space</kbd> to start
      </p>
    `);

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    const classicBtn = $('mode-classic');
    if (classicBtn) {
      classicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = snd(); if (s) s.click();
        startClassic();
      });
    }

    if (window.LexicalDecisionExtraModes && window.LDAPI) {
      window.LexicalDecisionExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.LexicalDecisionExtraModes.start(m.id, window.LDAPI, S, H);
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CLASSIC MODE
     ═══════════════════════════════════════════════════════════ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.relatedRTs = [];
    state.unrelatedRTs = [];
    state.realTotal = 0;
    state.realCorrect = 0;
    state.nonTotal = 0;
    state.nonCorrect = 0;

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
    state.trialIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, `Level ${state.level} · Get Ready`, 'Watch the prime word', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    const trial = generateTrial(state.level);
    state.currentTrial = { ...trial, startTime: 0, answered: false, timeLimit: 0 };
    runTrialStages();
  }

  function runTrialStages() {
    const trial = state.currentTrial;
    const primeDur = primeDurationForLevel(state.level);
    const gapDur = gapDurationForLevel(state.level);

    // 1. Prime
    setPhase('prime');
    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      <div class="word-stage">
        <div class="word-prime">${trial.prime}</div>
      </div>
    `);
    const s1 = snd(); if (s1 && s1.primeShow) s1.primeShow();

    // 2. Gap
    state.primeTimerId = setTimeout(() => {
      if (state.phase !== 'prime') return;
      setPhase('gap');
      render(`
        ${renderProgressDots()}
        <div class="trial-counter">
          Trial <span class="current">${state.trialIndex}</span>
          <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        </div>
        <div class="word-stage">
          <div class="word-blank">···</div>
        </div>
      `);

      // 3. Target
      state.gapTimerId = setTimeout(() => {
        if (state.phase !== 'gap') return;
        showTargetPhase();
      }, gapDur);
    }, primeDur);
  }

  function showTargetPhase() {
    setPhase('target');
    const trial = state.currentTrial;
    const timeLimit = responseTimeForLevel(state.level);

    state.currentTrial.startTime = performance.now();
    state.currentTrial.timeLimit = timeLimit;

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      <div class="word-stage">
        <div class="word-target">${trial.target}</div>
      </div>
      <div class="answer-row">
        <button class="answer-btn real-word" data-answer="real" data-key="1">
          <span class="btn-icon">✓</span>
          <span>Real Word</span>
          <span class="key-hint">[1]</span>
        </button>
        <button class="answer-btn non-word" data-answer="non" data-key="2">
          <span class="btn-icon">✕</span>
          <span>Non-Word</span>
          <span class="key-hint">[2]</span>
        </button>
      </div>
    `);
    const s2 = snd(); if (s2 && s2.targetShow) s2.targetShow();

    elContent.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    startTargetTimer(timeLimit);
  }

  function startTargetTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      if (state.phase !== 'target' || !state.currentTrial) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        return;
      }
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
    }, 40);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'target' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosen = btn.dataset.answer;
    const trial = state.currentTrial;
    const correctAnswer = trial.isReal ? 'real' : 'non';
    const isCorrect = chosen === correctAnswer;
    const elapsed = performance.now() - trial.startTime;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    recordTrial(trial, isCorrect, elapsed, isValid);

    // Visual lock
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correctAnswer) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showFeedbackFlash(isCorrect);
    const s = snd(); if (s) { isCorrect ? s.hit() : s.miss(); }
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / trial.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('feedback');
      push(nextTrial, 700);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
      if (state.lives <= 0) push(completeGame, 1400);
      else push(nextTrial, 1400);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'target' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    const trial = state.currentTrial;
    const correctAnswer = trial.isReal ? 'real' : 'non';

    recordTrial(trial, false, trial.timeLimit, false);

    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correctAnswer) b.classList.add('correct');
    });

    showFeedbackFlash(false);
    const s = snd(); if (s) s.miss();
    haptic('wrong');
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);
    setPhase('feedback');
    if (state.lives <= 0) push(completeGame, 1400);
    else push(nextTrial, 1400);
  }

  function recordTrial(trial, isCorrect, rt, isValidRT) {
    state.levelTotal++;
    if (isValidRT) state.levelTotalTime += rt;
    if (isValidRT && isCorrect) state.allRTs.push(rt);

    if (trial.isReal) {
      state.realTotal++;
      if (isCorrect) state.realCorrect++;
    } else {
      state.nonTotal++;
      if (isCorrect) state.nonCorrect++;
    }

    if (trial.related) {
      if (isCorrect && isValidRT) state.relatedRTs.push(rt);
    } else {
      if (isCorrect && isValidRT) state.unrelatedRTs.push(rt);
    }
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed: accuracy >= CONFIG.passThreshold
    });

    if (accuracy >= CONFIG.passThreshold) {
      const s = snd(); if (s) s.levelUp();
      setPhase('feedback');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} correct · Avg: ${Math.round(state.levelTotalTime / Math.max(1, state.levelTotal))} ms</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting...' : 'You reached the top!'}</p>
      `);
      push(() => {
        if (state.level < CONFIG.maxLevel) {
          state.level++;
          elLevel.textContent = String(state.level);
          startLevel();
        } else {
          completeGame();
        }
      }, 1400);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
      const s = snd(); if (s) s.gameOver();
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct — need 70% to pass.
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
  function computePrimingEffect() {
    const relMed = H.median(state.relatedRTs);
    const unrelMed = H.median(state.unrelatedRTs);
    if (!relMed || !unrelMed) return 0;
    return Math.max(0, Math.round(unrelMed - relMed));
  }

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

    const nonWordAccuracy = state.nonTotal > 0
      ? Math.round((state.nonCorrect / state.nonTotal) * 100)
      : 0;
    const realWordAccuracy = state.realTotal > 0
      ? Math.round((state.realCorrect / state.realTotal) * 100)
      : 0;

    const primingEffect = computePrimingEffect();

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      primingEffect,
      nonWordAccuracy,
      realWordAccuracy
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

    let primingInterpretation = '';
    if (primingEffect >= 50) primingInterpretation = 'Strong semantic network activation';
    else if (primingEffect >= 20) primingInterpretation = 'Normal priming — typical range';
    else if (primingEffect > 0) primingInterpretation = 'Weak priming — context barely helped';
    else primingInterpretation = 'No priming detected — independent processing';

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
        <div class="stat-card"><div class="stat-label">PRIMING</div><div class="stat-value">${primingEffect}<span style="font-size:11px;color:var(--t2)">ms</span></div></div>
      </div>

      <div class="priming-box">
        <strong>Semantic Network Profile</strong>
        <br>
        Priming effect: <strong>${primingEffect} ms</strong> — ${primingInterpretation}
        <br>
        Real word accuracy: <strong>${realWordAccuracy}%</strong> · Non-word accuracy: <strong>${nonWordAccuracy}%</strong>
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
        mode: 'classic',
        maxLevel,
        accuracy,
        medianRT,
        primingEffect,
        nonWordAccuracy,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'lexical-decision',
      domain: 'language',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      primingEffect,
      nonWordAccuracy,
      realWordAccuracy,
      isNewPB: hasNewPB
    });
  }

  function emitComplete(payload) {
    if (typeof state.onComplete === 'function') state.onComplete(payload);
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*');
      } catch (e) {}
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
    state.currentTrial = null;
    state.trialIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.relatedRTs = [];
    state.unrelatedRTs = [];
    state.realTotal = 0;
    state.realCorrect = 0;
    state.nonTotal = 0;
    state.nonCorrect = 0;

    elLevel.textContent = '1';
    elStreak.textContent = '0';
    elLives.textContent = String(CONFIG.maxLives);

    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!root) { console.error('[LexicalDecision] Container not found'); return; }

    root.innerHTML = `
      <div id="game-root">
        <header class="g-header">
          <div class="g-header-left">
            <button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>
            <div class="g-logo">
              <span class="g-logo-icon">⚡</span>
              <span class="g-logo-text">FLASH</span>
            </div>
          </div>
          <div class="g-meta">
            <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
            <span class="g-meta-item"><span class="g-meta-label">STREAK</span><span class="g-meta-value" id="streak-display">0</span></span>
            <span class="g-meta-item"><span class="g-meta-label">LIVES</span><span class="g-meta-value" id="lives-display">3</span></span>
          </div>
          <button class="g-settings-btn" id="settings-btn" title="Settings" aria-label="Settings">⚙</button>
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

      if (state.phase === 'target') {
        if (e.key === '1') {
          e.preventDefault();
          const b = elContent.querySelector('.answer-btn[data-answer="real"]');
          if (b && !b.disabled) b.click();
        } else if (e.key === '2') {
          e.preventDefault();
          const b = elContent.querySelector('.answer-btn[data-answer="non"]');
          if (b && !b.disabled) b.click();
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'target' || state.phase === 'prime' || state.phase === 'gap' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    if (window.LexicalDecisionExtraModes && window.LexicalDecisionExtraModes.abort) {
      window.LexicalDecisionExtraModes.abort();
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
  window.LDAPI = {
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

    generateTrial,
    makeNonWord,
    clearAllTimeouts,

    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*');
        } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $,
    getElContent: () => elContent
  };

  window.LexicalDecisionGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    generateTrial,
    makeNonWord
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();