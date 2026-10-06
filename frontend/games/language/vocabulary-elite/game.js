/* ═══════════════════════════════════════════════════════════
   FLASH — Vocabulary Elite v1.0
   Wechsler, D. (2008). WAIS-IV — Vocabulary subtest
   Word → Synonym matching
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.VocabEliteHelpers;
  const S = window.VocabEliteSounds;
  const STAGES = window.VocabEliteStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k };

  if (!H) { console.error('[VocabElite] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('vocabulary-elite', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     WORD BANK — 30 words × 3 tiers
     ═══════════════════════════════════════════════════════ */
  const WORD_BANK = [
    /* ═══ TIER 1 — EASY (10) ═══ */
    { word: 'happy',     correct: 'joyful',    distractors: ['sad', 'angry', 'tired'],       tier: 1 },
    { word: 'big',       correct: 'large',     distractors: ['tiny', 'thin', 'soft'],        tier: 1 },
    { word: 'fast',      correct: 'quick',     distractors: ['slow', 'heavy', 'bright'],     tier: 1 },
    { word: 'cold',      correct: 'chilly',    distractors: ['warm', 'wet', 'loud'],         tier: 1 },
    { word: 'smart',     correct: 'clever',    distractors: ['dull', 'kind', 'tall'],        tier: 1 },
    { word: 'brave',     correct: 'bold',      distractors: ['scared', 'quiet', 'weak'],     tier: 1 },
    { word: 'angry',     correct: 'furious',   distractors: ['calm', 'tired', 'hungry'],     tier: 1 },
    { word: 'beautiful', correct: 'lovely',    distractors: ['ugly', 'plain', 'rough'],      tier: 1 },
    { word: 'tired',     correct: 'weary',     distractors: ['awake', 'fresh', 'strong'],    tier: 1 },
    { word: 'difficult', correct: 'hard',      distractors: ['simple', 'light', 'smooth'],   tier: 1 },

    /* ═══ TIER 2 — MEDIUM (10) ═══ */
    { word: 'ambiguous', correct: 'unclear',   distractors: ['certain', 'obvious', 'direct'],    tier: 2 },
    { word: 'lucid',     correct: 'clear',     distractors: ['fuzzy', 'dark', 'dense'],         tier: 2 },
    { word: 'candid',    correct: 'frank',     distractors: ['shy', 'polite', 'vague'],         tier: 2 },
    { word: 'ample',     correct: 'plentiful', distractors: ['scarce', 'modest', 'narrow'],     tier: 2 },
    { word: 'tedious',   correct: 'boring',    distractors: ['lively', 'brief', 'pleasant'],    tier: 2 },
    { word: 'pragmatic', correct: 'practical', distractors: ['idealistic', 'careless', 'fancy'],tier: 2 },
    { word: 'subtle',    correct: 'faint',     distractors: ['obvious', 'loud', 'crude'],       tier: 2 },
    { word: 'resilient', correct: 'tough',     distractors: ['fragile', 'weak', 'delicate'],    tier: 2 },
    { word: 'meticulous',correct: 'precise',   distractors: ['sloppy', 'quick', 'rough'],       tier: 2 },
    { word: 'vivid',     correct: 'bright',    distractors: ['dull', 'faint', 'gray'],          tier: 2 },

    /* ═══ TIER 3 — HARD (10) ═══ */
    { word: 'obfuscate', correct: 'confuse',   distractors: ['clarify', 'explain', 'reveal'],   tier: 3 },
    { word: 'ubiquitous',correct: 'pervasive', distractors: ['rare', 'hidden', 'local'],        tier: 3 },
    { word: 'ephemeral', correct: 'fleeting',  distractors: ['lasting', 'eternal', 'solid'],    tier: 3 },
    { word: 'esoteric',  correct: 'obscure',   distractors: ['common', 'simple', 'plain'],      tier: 3 },
    { word: 'sagacious', correct: 'wise',      distractors: ['foolish', 'young', 'lazy'],       tier: 3 },
    { word: 'quixotic',  correct: 'idealistic',distractors: ['pragmatic', 'ordinary', 'dull'],  tier: 3 },
    { word: 'soporific', correct: 'sleepy',    distractors: ['alert', 'active', 'lively'],      tier: 3 },
    { word: 'penchant',  correct: 'fondness',  distractors: ['dislike', 'disgust', 'fear'],     tier: 3 },
    { word: 'reticent',  correct: 'reserved',  distractors: ['talkative', 'bold', 'open'],      tier: 3 },
    { word: 'garrulous', correct: 'talkative', distractors: ['silent', 'shy', 'calm'],          tier: 3 }
  ];

  const TIER_NAMES = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

  /* ═══ CONFIG ═══ */
  const CONFIG = {
    maxLives: 3,
    maxLevel: 15,
    trialsPerLevel: 5,
    passRatio: 0.6,
    correctBase: 100,
    streakBonus: 20,
    rtMin: 200,
    rtMax: 30000,
    baseTime: 20000,
    minTime: 8000,
    timeStepPerLevel: 800
  };

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
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    rtList: [],
    invalidRTs: 0,
    missedWords: {},
    recentWords: [],
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
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ═══ DIFFICULTY MAPPING ═══ */
  function difficultyForLevel(level) {
    if (level <= 3)  return 1;
    if (level <= 6)  return 2;
    if (level <= 9)  return 3;
    if (level <= 12) return 4;
    return 5;
  }
  function tiersForDifficulty(diff) {
    if (diff <= 1) return [1];
    if (diff === 2) return [1, 2];
    if (diff === 3) return [2];
    if (diff === 4) return [2, 3];
    return [3];
  }
  function timeLimitForLevel(level) {
    return Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (level - 1) * CONFIG.timeStepPerLevel
    );
  }

  /* ═══ QUESTION GENERATION ═══ */
  function generateQuestion(difficulty) {
    const tiers = tiersForDifficulty(difficulty);
    const pool = WORD_BANK.filter(w => tiers.includes(w.tier));

    // Avoid recent words
    let available = pool.filter(w => !state.recentWords.includes(w.word));
    if (available.length === 0) {
      state.recentWords = [];
      available = pool;
    }

    const picked = available[randInt(0, available.length - 1)];

    // Track recent
    state.recentWords.push(picked.word);
    if (state.recentWords.length > 15) state.recentWords.shift();

    const options = shuffle([picked.correct, ...picked.distractors]);

    return {
      word: picked.word,
      correct: picked.correct,
      options: options,
      tier: picked.tier,
      meta: TIER_NAMES[picked.tier] + ' · Synonym'
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
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    if (window.VocabEliteExtraModes && window.VocabEliteExtraModes.abort) {
      try { window.VocabEliteExtraModes.abort(); } catch (e) {}
    }
    setPhase('idle');
    setTimer(100);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbRT  = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';
    const pbLv  = pb.bestMaxLevel > 0 ? 'Lv ' + pb.bestMaxLevel : '—';
    const pbRCS = pb.bestRCS > 0 ? pb.bestRCS : '—';

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
      '<div class="phase-title">Language Domain · Vocabulary</div>' +
      '<h1 class="phase-headline grd">Vocabulary Elite</h1>' +
      '<p class="phase-sub">' +
        'A word appears. Pick the ' +
        '<strong style="color:#C77DFF">closest synonym</strong>. ' +
        'Based on WAIS-IV Vocabulary subtest (Wechsler 2008).' +
      '</p>' +

      (hasHistory ? '' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(660px,94vw);margin:14px 0;">' +
          '<div class="stat-card"><div class="stat-label">ACC</div><div class="stat-value" style="font-size:15px">' + pbAcc + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value" style="font-size:15px">' + pbRT + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">BEST LV</div><div class="stat-value" style="font-size:15px">' + pbLv + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value" style="font-size:15px">' + pbRCS + '</div></div>' +
        '</div>' : '') +

      '<div class="stages-card" id="stages-container"></div>' +

      '<div class="missions-card">' +
        '<div class="missions-title">Today\'s Missions</div>' +
        missionHTML +
      '</div>' +

      '<div class="mode-grid-4">' +
        '<div class="mode-card" id="mode-classic">' +
          '<div class="mode-icon">📖</div>' +
          '<div class="mode-name">Classic</div>' +
          '<div class="mode-desc">15 levels · 5 words each · 3 lives</div>' +
          '<div class="mode-meta">→ Easy → Hard words</div>' +
        '</div>' +
        (window.VocabEliteExtraModes ? window.VocabEliteExtraModes.getModeDefinitions().map(m => {
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
        'Click an answer or press <kbd>1</kbd>-<kbd>4</kbd> to select' +
      '</p>'
    );

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    if (window.VocabEliteExtraModes && window.VocabEliteAPI) {
      window.VocabEliteExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.VocabEliteExtraModes.start(m.id, window.VocabEliteAPI, S, H);
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
    state.results = [];
    state.totalScore = 0;
    state.rtList = [];
    state.invalidRTs = 0;
    state.missedWords = {};
    state.recentWords = [];

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
    showCountdown(3, 'Level ' + state.level, CONFIG.trialsPerLevel + ' words', nextTrial);
  }

  function nextTrial() {
    if (state.lives <= 0) { completeGame(); return; }
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    setPhase('trial');

    const timeLimit = timeLimitForLevel(state.level);
    const difficulty = difficultyForLevel(state.level);
    const trial = generateQuestion(difficulty);
    state.currentTrial = { ...trial, startTime: 0, timeLimit, answered: false };

    showStimulus(timeLimit);
  }

  function showStimulus(timeLimit) {
    const trial = state.currentTrial;
    trial.startTime = performance.now();

    const optionsHTML = trial.options.map((opt, i) => {
      return '' +
        '<button class="answer-btn" data-word="' + escapeHTML(opt) + '">' +
          '<span class="ab-key">' + (i + 1) + '</span>' +
          '<span class="ab-body">' +
            '<span class="ab-word">' + escapeHTML(opt) + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    const trialInfoHTML = '' +
      '<div class="trial-info">' +
        '<span class="ti">WORD <span class="ti-val">' + state.trialIndex + '/' + CONFIG.trialsPerLevel + '</span></span>' +
        '<span class="ti">STREAK <span class="ti-val good">' + state.streak + '</span></span>' +
        '<span class="ti">CORRECT <span class="ti-val">' + state.levelCorrect + '</span></span>' +
      '</div>';

    render('' +
      renderProgressDots() +
      trialInfoHTML +
      '<div class="word-card">' +
        '<div class="word-label">Word</div>' +
        '<div class="word-target">' + escapeHTML(trial.word) + '</div>' +
        '<div class="word-meta">' + trial.meta + '</div>' +
      '</div>' +
      '<div class="answer-prompt">Identify the synonym</div>' +
      '<div class="answer-grid">' + optionsHTML + '</div>'
    );

    if (S && S.wordReveal) S.wordReveal();

    elContent.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAnswer(btn);
      });
    });

    startTimer(timeLimit);
  }

  function startTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
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

  /* ═══ ANSWER HANDLING ═══ */
  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;

    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosen = btn.dataset.word;
    const correct = state.currentTrial.correct;
    const isCorrect = chosen === correct;
    const elapsed = performance.now() - state.currentTrial.startTime;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;

    if (!isValid) state.invalidRTs++;
    if (isCorrect && isValid) state.rtList.push(elapsed);

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;

    // Highlight all buttons
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.word === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      elStreak.textContent = String(state.streak);

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentTrial.timeLimit) * 50) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      if (S && S.correctWord) S.correctWord();
      else showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 700);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);

      // Track missed word
      const word = state.currentTrial.word;
      state.missedWords[word] = (state.missedWords[word] || 0) + 1;

      if (S && S.wrongWord) S.wrongWord();
      else showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');
      if (state.lives <= 0) push(completeGame, 1400);
      else push(nextTrial, 1400);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;

    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    const correct = state.currentTrial.correct;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.word === correct) b.classList.add('correct');
    });

    const word = state.currentTrial.word;
    state.missedWords[word] = (state.missedWords[word] || 0) + 1;

    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');
    if (state.lives <= 0) push(completeGame, 1200);
    else push(nextTrial, 1200);
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
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed
    });

    if (passed) {
      setPhase('correct');
      if (S) S.levelUp();
      render('' +
        renderProgressDots() +
        '<div class="feedback-icon good">✓</div>' +
        '<h2 class="phase-headline grd">Level ' + state.level + ' Passed</h2>' +
        '<p class="phase-sub">' +
          state.levelCorrect + '/' + state.levelTotal + ' words matched correctly' +
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
      setPhase('wrong');
      if (S) S.gameOver();

      const needed = Math.ceil(CONFIG.trialsPerLevel * CONFIG.passRatio);
      render('' +
        renderProgressDots() +
        '<div class="feedback-icon bad">✕</div>' +
        '<h2 class="phase-headline" style="color:#FF0077">Level Failed</h2>' +
        '<p class="phase-sub">' +
          state.levelCorrect + '/' + state.levelTotal + ' correct — need ' + needed + '.' +
          '<br><strong>' + state.lives + '</strong> ' +
          (state.lives === 1 ? 'life' : 'lives') + ' remaining.' +
        '</p>'
      );

      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 2000);
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
      maxLevel,
      maxStreak: state.maxStreak
    };

    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy });
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
    H.updateMissionProgress('maxLevel', maxLevel);
    if (hasNewPB) H.updateMissionProgress('pb', 1);

    const pbBanner = hasNewPB ? '<div class="pb-banner">★ NEW PERSONAL BEST ★</div>' : '';

    let interpretation = '';
    if (accuracy >= 95)      interpretation = 'Elite lexical knowledge — near-perfect synonym matching.';
    else if (accuracy >= 80) interpretation = 'Strong vocabulary — well above average.';
    else if (accuracy >= 60) interpretation = 'Solid range — bigger words will come with exposure.';
    else                     interpretation = 'Vocabulary is expanding — every session adds new words.';

    // Weakest words
    const weakEntries = Object.entries(state.missedWords).sort((a, b) => b[1] - a[1]);
    let weakMsg = '';
    if (weakEntries.length > 0) {
      const top3 = weakEntries.slice(0, 3).map(e => e[0]).join(', ');
      weakMsg = '<br><span style="color:#FFD60A">Words to review: ' + escapeHTML(top3) + '</span>';
    }

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
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">' + rcs + '</div></div>' +
      '</div>' +

      '<div class="mem-box">' +
        '<strong>Lexical Profile</strong><br>' +
        'Words seen: <strong>' + totalTrials + '</strong> · ' +
        'Correct: <strong>' + totalCorrect + '</strong><br>' +
        interpretation + weakMsg +
      '</div>' +

      insightsHTML +

      '<div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">' +
        '<div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Median RT</div>' +
        '<div class="history-chart" id="history-chart"></div>' +
      '</div>' +

      '<div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">' +
        '<button class="big-btn" id="restart-btn">Try Again</button>' +
        '<button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#C77DFF,#9D4EDD);">Back to Menu</button>' +
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
        maxStreak: state.maxStreak,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'vocabulary-elite',
      domain: 'language',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      isNewPB: hasNewPB,
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
    state.results = [];
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.currentTrial = null;
    state.trialIndex = 0;
    state.rtList = [];
    state.invalidRTs = 0;
    state.missedWords = {};
    state.recentWords = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[VocabElite] Container not found'); return; }

    root.innerHTML = '' +
      '<div id="game-root">' +
        '<header class="g-header">' +
          '<div class="g-header-left">' +
            '<button class="g-back-btn hidden" id="back-btn" title="Back to Menu" aria-label="Back to Menu">←</button>' +
            '<div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>' +
          '</div>' +
          '<div class="g-meta">' +
            '<span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>' +
            '<span class="g-meta-item"><span class="g-meta-label">STREAK</span><span class="g-meta-value" id="streak-display">0</span></span>' +
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
    elStreak    = $('streak-display');
    elLives     = $('lives-display');
    elContent   = $('phase-content');
    elTimerFill = $('timer-fill');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      // Idle: SPACE starts classic
      if (state.phase === 'idle' && state.mode === 'idle') {
        if (e.code === 'Space') { e.preventDefault(); startClassic(); }
        return;
      }

      // Gameover: SPACE restarts
      if (state.phase === 'gameover') {
        if (e.code === 'Space') { e.preventDefault(); resetGame(); }
        return;
      }

      // Trial: number keys select answer
      if (state.phase === 'trial' && state.currentTrial && !state.currentTrial.answered) {
        if (/^[1-4]$/.test(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = elContent.querySelectorAll('.answer-btn');
          if (btns[idx]) btns[idx].click();
        }
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
    if (window.VocabEliteExtraModes && window.VocabEliteExtraModes.abort) {
      try { window.VocabEliteExtraModes.abort(); } catch (e) {}
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
  window.VocabEliteAPI = {
    CONFIG,
    state,
    WORD_BANK,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash: (txt) => {
      const el = document.createElement('div');
      el.className = 'levelup-flash'; el.textContent = txt;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    },
    haptic,

    generateQuestion,
    difficultyForLevel,
    timeLimitForLevel,
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

  window.VocabEliteGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    wordBank: WORD_BANK
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();