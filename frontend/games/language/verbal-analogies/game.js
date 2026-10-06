/* ═══════════════════════════════════════════════════════════
   FLASH — Verbal Analogies v1.0
   Sternberg, R. J. (1977). Psychol. Rev.
   Analogical Reasoning · A → B :: C → ?
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.VerbalAnalogiesHelpers;
  const S = window.VerbalAnalogiesSounds;
  const STAGES = window.VerbalAnalogiesStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k };

  if (!H) { console.error('[VerbalAnalogies] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('verbal-analogies', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     ANALOGY BANK — 60 analogies · 12 relation types
     ═══════════════════════════════════════════════════════ */
  const ANALOGY_BANK = [
    /* ═══ ANTONYM (5) ═══ */
    { a: 'hot',     b: 'cold',  c: 'day',    correct: 'night',    distractors: ['sun', 'bright', 'warm'],     relation: 'antonym',       tier: 1 },
    { a: 'up',      b: 'down',  c: 'left',   correct: 'right',    distractors: ['forward', 'sideways', 'north'], relation: 'antonym',    tier: 1 },
    { a: 'begin',   b: 'end',   c: 'open',   correct: 'close',    distractors: ['wide', 'door', 'silent'],    relation: 'antonym',       tier: 1 },
    { a: 'ancient', b: 'modern',c: 'rare',   correct: 'common',   distractors: ['old', 'unique', 'frequent'], relation: 'antonym',       tier: 2 },
    { a: 'expand',  b: 'contract', c: 'inflate', correct: 'deflate', distractors: ['blow', 'gas', 'burst'],  relation: 'antonym',       tier: 3 },

    /* ═══ SYNONYM (5) ═══ */
    { a: 'big',     b: 'large',   c: 'small',    correct: 'tiny',     distractors: ['thin', 'short', 'old'],     relation: 'synonym', tier: 1 },
    { a: 'happy',   b: 'joyful',  c: 'sad',      correct: 'sorrowful',distractors: ['angry', 'tired', 'quiet'],  relation: 'synonym', tier: 1 },
    { a: 'fast',    b: 'quick',   c: 'slow',     correct: 'sluggish', distractors: ['heavy', 'calm', 'dull'],    relation: 'synonym', tier: 2 },
    { a: 'smart',   b: 'intelligent', c: 'brave', correct: 'courageous', distractors: ['strong', 'tall', 'loud'], relation: 'synonym', tier: 2 },
    { a: 'lucid',   b: 'clear',   c: 'obscure',  correct: 'vague',    distractors: ['dark', 'hidden', 'deep'],   relation: 'synonym', tier: 3 },

    /* ═══ PART-WHOLE (5) ═══ */
    { a: 'finger',  b: 'hand',    c: 'toe',      correct: 'foot',     distractors: ['leg', 'nail', 'shoe'],       relation: 'part-whole', tier: 1 },
    { a: 'page',    b: 'book',    c: 'brick',    correct: 'wall',     distractors: ['house', 'cement', 'mason'],  relation: 'part-whole', tier: 1 },
    { a: 'leaf',    b: 'tree',    c: 'petal',    correct: 'flower',   distractors: ['garden', 'stem', 'rose'],    relation: 'part-whole', tier: 1 },
    { a: 'chapter', b: 'novel',   c: 'scene',    correct: 'play',     distractors: ['actor', 'stage', 'curtain'], relation: 'part-whole', tier: 2 },
    { a: 'neuron',  b: 'brain',   c: 'pixel',    correct: 'image',    distractors: ['screen', 'camera', 'light'], relation: 'part-whole', tier: 3 },

    /* ═══ CATEGORY (5) ═══ */
    { a: 'apple',   b: 'fruit',   c: 'carrot',   correct: 'vegetable',distractors: ['orange', 'plant', 'root'],   relation: 'category', tier: 1 },
    { a: 'dog',     b: 'animal',  c: 'rose',     correct: 'flower',   distractors: ['garden', 'red', 'petal'],    relation: 'category', tier: 1 },
    { a: 'guitar',  b: 'instrument', c: 'hammer',correct: 'tool',     distractors: ['wood', 'metal', 'nail'],     relation: 'category', tier: 1 },
    { a: 'Tokyo',   b: 'city',    c: 'France',   correct: 'country',  distractors: ['Europe', 'Paris', 'euro'],   relation: 'category', tier: 2 },
    { a: 'sonnet',  b: 'poem',    c: 'sonata',   correct: 'music',    distractors: ['piano', 'note', 'symphony'], relation: 'category', tier: 3 },

    /* ═══ FUNCTION (5) ═══ */
    { a: 'pen',     b: 'write',   c: 'knife',    correct: 'cut',      distractors: ['sharp', 'steel', 'food'],    relation: 'function', tier: 1 },
    { a: 'eye',     b: 'see',     c: 'ear',      correct: 'hear',     distractors: ['sound', 'music', 'lobe'],    relation: 'function', tier: 1 },
    { a: 'car',     b: 'transport', c: 'phone',  correct: 'communicate', distractors: ['ring', 'call', 'text'],   relation: 'function', tier: 2 },
    { a: 'key',     b: 'open',    c: 'password', correct: 'access',   distractors: ['hide', 'secure', 'login'],   relation: 'function', tier: 2 },
    { a: 'telescope', b: 'magnify', c: 'microscope', correct: 'examine', distractors: ['glass', 'lens', 'small'], relation: 'function', tier: 3 },

    /* ═══ CAUSE-EFFECT (5) ═══ */
    { a: 'rain',    b: 'flood',   c: 'drought',  correct: 'famine',   distractors: ['hunger', 'dry', 'field'],    relation: 'cause-effect', tier: 1 },
    { a: 'fire',    b: 'smoke',   c: 'ice',      correct: 'meltwater',distractors: ['cold', 'water', 'ocean'],    relation: 'cause-effect', tier: 2 },
    { a: 'virus',   b: 'illness', c: 'exercise', correct: 'fitness',  distractors: ['sweat', 'gym', 'strong'],    relation: 'cause-effect', tier: 2 },
    { a: 'deforestation', b: 'erosion', c: 'pollution', correct: 'disease', distractors: ['factory', 'gas', 'health'], relation: 'cause-effect', tier: 3 },
    { a: 'friction',b: 'heat',    c: 'pressure', correct: 'deformation', distractors: ['force', 'solid', 'mass'], relation: 'cause-effect', tier: 3 },

    /* ═══ DEGREE (5) ═══ */
    { a: 'warm',    b: 'hot',     c: 'cool',     correct: 'cold',     distractors: ['chilly', 'mild', 'ice'],     relation: 'degree',   tier: 1 },
    { a: 'breeze',  b: 'gale',    c: 'drizzle',  correct: 'downpour', distractors: ['rain', 'cloud', 'wet'],      relation: 'degree',   tier: 2 },
    { a: 'like',    b: 'love',    c: 'dislike',  correct: 'hate',     distractors: ['tolerate', 'ignore', 'fear'],relation: 'degree',   tier: 2 },
    { a: 'mist',    b: 'fog',     c: 'spark',    correct: 'blaze',    distractors: ['fire', 'ash', 'wood'],       relation: 'degree',   tier: 3 },
    { a: 'whisper', b: 'scream',  c: 'murmur',   correct: 'shout',    distractors: ['speak', 'yell', 'loud'],     relation: 'degree',   tier: 3 },

    /* ═══ PRODUCER (5) ═══ */
    { a: 'bee',     b: 'honey',   c: 'cow',      correct: 'milk',     distractors: ['cheese', 'farm', 'beef'],    relation: 'producer', tier: 1 },
    { a: 'spider',  b: 'web',     c: 'bird',     correct: 'nest',     distractors: ['fly', 'egg', 'tree'],        relation: 'producer', tier: 1 },
    { a: 'hen',     b: 'egg',     c: 'tree',     correct: 'fruit',    distractors: ['leaf', 'bark', 'branch'],    relation: 'producer', tier: 1 },
    { a: 'silkworm',b: 'silk',    c: 'sheep',    correct: 'wool',     distractors: ['farm', 'coat', 'soft'],      relation: 'producer', tier: 2 },
    { a: 'volcano', b: 'lava',    c: 'cloud',    correct: 'rain',     distractors: ['sky', 'wind', 'storm'],      relation: 'producer', tier: 2 },

    /* ═══ LOCATION (5) ═══ */
    { a: 'fish',    b: 'water',   c: 'bird',     correct: 'sky',      distractors: ['tree', 'wing', 'cloud'],     relation: 'location', tier: 1 },
    { a: 'star',    b: 'sky',     c: 'whale',    correct: 'ocean',    distractors: ['sea', 'deep', 'blue'],       relation: 'location', tier: 1 },
    { a: 'lion',    b: 'savanna', c: 'penguin',  correct: 'Antarctica', distractors: ['zoo', 'ice', 'cold'],      relation: 'location', tier: 2 },
    { a: 'book',    b: 'library', c: 'painting', correct: 'museum',   distractors: ['frame', 'artist', 'canvas'], relation: 'location', tier: 2 },
    { a: 'monk',    b: 'monastery', c: 'soldier',correct: 'barracks', distractors: ['war', 'gun', 'field'],       relation: 'location', tier: 3 },

    /* ═══ CHARACTERISTIC (5) ═══ */
    { a: 'ice',     b: 'cold',    c: 'fire',     correct: 'hot',      distractors: ['flame', 'burn', 'wood'],     relation: 'characteristic', tier: 1 },
    { a: 'lion',    b: 'fierce',  c: 'lamb',     correct: 'gentle',   distractors: ['wool', 'young', 'white'],    relation: 'characteristic', tier: 1 },
    { a: 'diamond', b: 'hard',    c: 'rubber',   correct: 'elastic',  distractors: ['soft', 'black', 'tire'],     relation: 'characteristic', tier: 2 },
    { a: 'cactus',  b: 'prickly', c: 'rose',     correct: 'thorny',   distractors: ['red', 'flower', 'garden'],   relation: 'characteristic', tier: 2 },
    { a: 'steel',   b: 'strong',  c: 'glass',    correct: 'fragile',  distractors: ['clear', 'break', 'mirror'],  relation: 'characteristic', tier: 3 },

    /* ═══ INSTRUMENT (5) ═══ */
    { a: 'pencil',  b: 'draw',    c: 'scissors', correct: 'cut',      distractors: ['sharp', 'paper', 'metal'],   relation: 'instrument', tier: 1 },
    { a: 'shovel',  b: 'dig',     c: 'hammer',   correct: 'nail',     distractors: ['wood', 'tool', 'steel'],     relation: 'instrument', tier: 1 },
    { a: 'needle',  b: 'sew',     c: 'brush',    correct: 'paint',    distractors: ['canvas', 'color', 'art'],    relation: 'instrument', tier: 2 },
    { a: 'telescope', b: 'observe', c: 'stethoscope', correct: 'listen', distractors: ['doctor', 'heart', 'tube'], relation: 'instrument', tier: 3 },
    { a: 'compass', b: 'navigate',c: 'scale',    correct: 'weigh',    distractors: ['heavy', 'measure', 'balance'], relation: 'instrument', tier: 3 },

    /* ═══ WORKER (5) ═══ */
    { a: 'doctor',  b: 'patient', c: 'teacher',  correct: 'student',  distractors: ['school', 'book', 'learn'],   relation: 'worker',   tier: 1 },
    { a: 'chef',    b: 'kitchen', c: 'pilot',    correct: 'cockpit',  distractors: ['plane', 'sky', 'airport'],   relation: 'worker',   tier: 2 },
    { a: 'farmer',  b: 'field',   c: 'miner',    correct: 'mine',     distractors: ['coal', 'dark', 'tunnel'],    relation: 'worker',   tier: 2 },
    { a: 'lawyer',  b: 'court',   c: 'surgeon',  correct: 'operating room', distractors: ['hospital', 'patient', 'knife'], relation: 'worker', tier: 3 },
    { a: 'blacksmith', b: 'forge', c: 'potter',  correct: 'kiln',     distractors: ['clay', 'pot', 'wheel'],      relation: 'worker',   tier: 3 }
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
    rtMin: 300,
    rtMax: 60000,
    baseTime: 25000,
    minTime: 10000,
    timeStepPerLevel: 1000
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
    missedRelations: {},
    recentKeys: [],
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
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function analogyKey(item) {
    return item.a + '|' + item.b + '|' + item.c;
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
    if (diff <= 1)  return [1];
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
    const pool = ANALOGY_BANK.filter(x => tiers.includes(x.tier));

    let available = pool.filter(x => !state.recentKeys.includes(analogyKey(x)));
    if (available.length === 0) {
      state.recentKeys = [];
      available = pool;
    }

    const picked = available[randInt(0, available.length - 1)];

    state.recentKeys.push(analogyKey(picked));
    if (state.recentKeys.length > 20) state.recentKeys.shift();

    const options = shuffle([picked.correct, ...picked.distractors]);

    return {
      a: picked.a,
      b: picked.b,
      c: picked.c,
      correct: picked.correct,
      options: options,
      relation: picked.relation,
      tier: picked.tier,
      meta: TIER_NAMES[picked.tier] + ' · Analogy'
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
  function showLevelUpFlash(text) {
    const el = document.createElement('div');
    el.className = 'levelup-flash'; el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  /* ═══ ANALOGY RENDERING ═══ */
  function renderAnalogyCard(trial) {
    return '' +
      '<div class="analogy-card">' +
        '<div class="analogy-label">Analogy</div>' +
        '<div class="analogy-row">' +
          '<span class="analogy-word source">' + escapeHTML(trial.a) + '</span>' +
          '<span class="analogy-arrow">→</span>' +
          '<span class="analogy-word source">' + escapeHTML(trial.b) + '</span>' +
          '<span class="analogy-divider">::</span>' +
          '<span class="analogy-word target">' + escapeHTML(trial.c) + '</span>' +
          '<span class="analogy-arrow">→</span>' +
          '<span class="analogy-word unknown">?</span>' +
        '</div>' +
        '<div class="analogy-meta">' + escapeHTML(trial.meta) + '</div>' +
      '</div>';
  }

  function renderOptions(trial) {
    const optionsHTML = trial.options.map((opt, i) => {
      return '' +
        '<button class="answer-btn" data-word="' + escapeHTML(opt) + '">' +
          '<span class="ab-key">' + (i + 1) + '</span>' +
          '<span class="ab-body">' +
            '<span class="ab-word">' + escapeHTML(opt) + '</span>' +
          '</span>' +
        '</button>';
    }).join('');
    return '<div class="answer-grid">' + optionsHTML + '</div>';
  }

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    if (window.VerbalAnalogiesExtraModes && window.VerbalAnalogiesExtraModes.abort) {
      try { window.VerbalAnalogiesExtraModes.abort(); } catch (e) {}
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
      '<div class="phase-title">Language Domain · Reasoning</div>' +
      '<h1 class="phase-headline grd">Verbal Analogies</h1>' +
      '<p class="phase-sub">' +
        'A relationship between two words is shown. Apply the ' +
        '<strong style="color:#C77DFF">same relationship</strong> to the second pair. ' +
        'Based on Sternberg (1977) — Analogical Reasoning.' +
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
          '<div class="mode-icon">🔗</div>' +
          '<div class="mode-name">Classic</div>' +
          '<div class="mode-desc">15 levels · 5 analogies each · 3 lives</div>' +
          '<div class="mode-meta">→ Easy → Hard relations</div>' +
        '</div>' +
        (window.VerbalAnalogiesExtraModes ? window.VerbalAnalogiesExtraModes.getModeDefinitions().map(m => {
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

    if (window.VerbalAnalogiesExtraModes && window.VerbalAnalogiesAPI) {
      window.VerbalAnalogiesExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.VerbalAnalogiesExtraModes.start(m.id, window.VerbalAnalogiesAPI, S, H);
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
    state.missedRelations = {};
    state.recentKeys = [];

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
    showCountdown(3, 'Level ' + state.level, CONFIG.trialsPerLevel + ' analogies', nextTrial);
  }

  function nextTrial() {
    if (state.lives <= 0) { completeGame(); return; }
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    setPhase('trial');

    const timeLimit = timeLimitForLevel(state.level);
    const difficulty = difficultyForLevel(state.level);
    const trial = generateQuestion(difficulty);
    state.currentTrial = Object.assign({}, trial, { startTime: 0, timeLimit: timeLimit, answered: false });

    showStimulus(timeLimit);
  }

  function showStimulus(timeLimit) {
    const trial = state.currentTrial;
    trial.startTime = performance.now();

    const trialInfoHTML = '' +
      '<div class="trial-info">' +
        '<span class="ti">ANALOGY <span class="ti-val">' + state.trialIndex + '/' + CONFIG.trialsPerLevel + '</span></span>' +
        '<span class="ti">STREAK <span class="ti-val good">' + state.streak + '</span></span>' +
        '<span class="ti">CORRECT <span class="ti-val">' + state.levelCorrect + '</span></span>' +
      '</div>';

    render('' +
      renderProgressDots() +
      trialInfoHTML +
      renderAnalogyCard(trial) +
      '<div class="answer-prompt">Complete the analogy</div>' +
      renderOptions(trial)
    );

    if (S && S.analogyReveal) S.analogyReveal();

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

      if (S && S.relationMatch) S.relationMatch();
      else showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 700);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);

      const rel = state.currentTrial.relation;
      state.missedRelations[rel] = (state.missedRelations[rel] || 0) + 1;

      if (S && S.relationMiss) S.relationMiss();
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

    const rel = state.currentTrial.relation;
    state.missedRelations[rel] = (state.missedRelations[rel] || 0) + 1;

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
      passed: passed
    });

    if (passed) {
      setPhase('correct');
      if (S) S.levelUp();
      render('' +
        renderProgressDots() +
        '<div class="feedback-icon good">✓</div>' +
        '<h2 class="phase-headline grd">Level ' + state.level + ' Passed</h2>' +
        '<p class="phase-sub">' +
          state.levelCorrect + '/' + state.levelTotal + ' analogies solved correctly' +
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
      accuracy: accuracy,
      medianRT: medianRT,
      rtv: rtv,
      rcs: rcs,
      maxLevel: maxLevel,
      maxStreak: state.maxStreak
    };

    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel: maxLevel, accuracy: accuracy });
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

    H.updateMissionProgress('sessions', 1);
    H.updateMissionProgress('accuracy', accuracy);
    H.updateMissionProgress('streak', state.maxStreak);
    H.updateMissionProgress('maxLevel', maxLevel);
    if (hasNewPB) H.updateMissionProgress('pb', 1);

    const pbBanner = hasNewPB ? '<div class="pb-banner">★ NEW PERSONAL BEST ★</div>' : '';

    let interpretation = '';
    if (accuracy >= 95)      interpretation = 'Elite analogical reasoning — you see relations instantly.';
    else if (accuracy >= 80) interpretation = 'Strong analogical reasoning — well above average.';
    else if (accuracy >= 60) interpretation = 'Solid — larger relation vocabulary builds with practice.';
    else                     interpretation = 'Analogical skills are sharpening — practice the relation types.';

    const relKeys = Object.keys(state.missedRelations).sort((a, b) => state.missedRelations[b] - state.missedRelations[a]);
    let weakMsg = '';
    if (relKeys.length > 0) {
      const top3 = relKeys.slice(0, 3).map(k => k.replace(/-/g, ' ')).join(', ');
      weakMsg = '<br><span style="color:#FFD60A">Relations to review: ' + escapeHTML(top3) + '</span>';
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
        '<strong>Analogical Reasoning Profile</strong><br>' +
        'Analogies solved: <strong>' + totalTrials + '</strong> · ' +
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
        '<button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#00EEFF,#9D4EDD);">Back to Menu</button>' +
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
        maxLevel: maxLevel,
        accuracy: accuracy,
        medianRT: medianRT,
        maxStreak: state.maxStreak,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'verbal-analogies',
      domain: 'language',
      mode: 'classic',
      maxLevel: maxLevel,
      accuracy: accuracy,
      score: state.totalScore,
      medianRT: medianRT,
      rtv: rtv,
      rcs: rcs,
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
    state.missedRelations = {};
    state.recentKeys = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[VerbalAnalogies] Container not found'); return; }

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

      if (state.phase === 'idle' && state.mode === 'idle') {
        if (e.code === 'Space') { e.preventDefault(); startClassic(); }
        return;
      }

      if (state.phase === 'gameover') {
        if (e.code === 'Space') { e.preventDefault(); resetGame(); }
        return;
      }

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
    if (window.VerbalAnalogiesExtraModes && window.VerbalAnalogiesExtraModes.abort) {
      try { window.VerbalAnalogiesExtraModes.abort(); } catch (e) {}
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
  window.VerbalAnalogiesAPI = {
    CONFIG: CONFIG,
    state: state,
    ANALOGY_BANK: ANALOGY_BANK,

    settings: () => FS ? FS.get() : {},

    render: render,
    setPhase: setPhase,
    setTimer: setTimer,
    showFeedbackFlash: showFeedbackFlash,
    showCountdown: showCountdown,
    showLevelUpFlash: showLevelUpFlash,
    haptic: haptic,

    generateQuestion: generateQuestion,
    difficultyForLevel: difficultyForLevel,
    timeLimitForLevel: timeLimitForLevel,
    clearAllTimeouts: clearAllTimeouts,

    emit: (payload) => {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $: $,
    getElContent: () => elContent
  };

  window.VerbalAnalogiesGame = {
    mount: mount,
    reset: resetGame,
    state: state,
    config: CONFIG,
    analogyBank: ANALOGY_BANK
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();