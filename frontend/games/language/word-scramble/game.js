/* ═══════════════════════════════════════════════════════════
   FLASH — Word Scramble v1.0
   Lexical Access · Letter Rearranging
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.WordScrambleHelpers;
  const S = window.WordScrambleSounds;
  const STAGES = window.WordScrambleStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k };

  if (!H) { console.error('[WordScramble] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('word-scramble', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     WORD BANK — 60 words · 3 tiers
     tier 1: 3-4 letters · tier 2: 6-7 letters · tier 3: 8-9 letters
     ═══════════════════════════════════════════════════════ */
  const WORD_BANK = [
    /* ═══ TIER 1 — EASY (3-4 letters) · 20 words ═══ */
    { word: 'cat',   hint: 'A small domestic feline that purrs.' },
    { word: 'dog',   hint: 'A loyal four-legged pet that barks.' },
    { word: 'sun',   hint: 'The star at the center of our solar system.' },
    { word: 'moon',  hint: 'Earth\'s natural satellite that glows at night.' },
    { word: 'star',  hint: 'A luminous point in the night sky.' },
    { word: 'tree',  hint: 'A tall plant with a trunk and branches.' },
    { word: 'book',  hint: 'Pages bound together with words on them.' },
    { word: 'fish',  hint: 'An aquatic animal that swims with fins.' },
    { word: 'bird',  hint: 'A feathered animal that usually flies.' },
    { word: 'rain',  hint: 'Water droplets falling from the clouds.' },
    { word: 'fire',  hint: 'Hot glowing combustion giving off heat.' },
    { word: 'snow',  hint: 'Frozen white flakes falling in winter.' },
    { word: 'road',  hint: 'A paved path for vehicles to travel on.' },
    { word: 'hand',  hint: 'The body part at the end of your arm.' },
    { word: 'door',  hint: 'A hinged barrier you walk through.' },
    { word: 'gold',  hint: 'A precious yellow metallic element.' },
    { word: 'king',  hint: 'A male ruler of a country.' },
    { word: 'ship',  hint: 'A large vessel that sails on water.' },
    { word: 'leaf',  hint: 'A flat green part growing on a plant.' },
    { word: 'coin',  hint: 'A flat round piece of money.' },

    /* ═══ TIER 2 — MEDIUM (6-7 letters) · 20 words ═══ */
    { word: 'flower',  hint: 'A colorful blooming part of a plant.' },
    { word: 'bridge',  hint: 'A structure that spans over water or a road.' },
    { word: 'castle',  hint: 'A large fortified building with towers.' },
    { word: 'garden',  hint: 'A plot of land where plants are cultivated.' },
    { word: 'window',  hint: 'A glass opening in a wall for light.' },
    { word: 'orange',  hint: 'A round citrus fruit with a thick peel.' },
    { word: 'silver',  hint: 'A shiny grey precious metal.' },
    { word: 'dragon',  hint: 'A mythical fire-breathing reptile.' },
    { word: 'forest',  hint: 'A large area covered with trees.' },
    { word: 'guitar',  hint: 'A stringed musical instrument with a neck.' },
    { word: 'rabbit',  hint: 'A small furry animal with long ears.' },
    { word: 'cheese',  hint: 'A dairy product made from milk.' },
    { word: 'winter',  hint: 'The coldest season of the year.' },
    { word: 'summer',  hint: 'The warmest season of the year.' },
    { word: 'doctor',  hint: 'A medical professional who treats patients.' },
    { word: 'planet',  hint: 'A large celestial body orbiting a star.' },
    { word: 'engine',  hint: 'A machine that converts energy into motion.' },
    { word: 'island',  hint: 'A piece of land surrounded by water.' },
    { word: 'camera',  hint: 'A device for capturing photographs.' },
    { word: 'market',  hint: 'A place where goods are bought and sold.' },

    /* ═══ TIER 3 — HARD (8-9 letters) · 20 words ═══ */
    { word: 'elephant',  hint: 'A large grey mammal with a long trunk.' },
    { word: 'mountain',  hint: 'A very tall natural elevation of land.' },
    { word: 'umbrella',  hint: 'A portable device that shields from rain.' },
    { word: 'hospital',  hint: 'A place where sick people receive care.' },
    { word: 'butterfly', hint: 'An insect with large colorful wings.' },
    { word: 'adventure', hint: 'An exciting and unusual experience.' },
    { word: 'chocolate', hint: 'A sweet brown treat made from cocoa.' },
    { word: 'dangerous', hint: 'Likely to cause harm or injury.' },
    { word: 'knowledge', hint: 'Information and skills acquired through learning.' },
    { word: 'wonderful', hint: 'Inspiring delight or admiration.' },
    { word: 'important', hint: 'Of great significance or value.' },
    { word: 'beautiful', hint: 'Pleasing to the senses, especially sight.' },
    { word: 'celebrate', hint: 'To mark a happy occasion with joy.' },
    { word: 'telephone', hint: 'A device for voice communication at a distance.' },
    { word: 'yesterday', hint: 'The day before today.' },
    { word: 'different', hint: 'Not the same as another thing.' },
    { word: 'discovery', hint: 'The act of finding something for the first time.' },
    { word: 'magazine',  hint: 'A periodical publication with articles.' },
    { word: 'together',  hint: 'With another person or group.' },
    { word: 'remember',  hint: 'To recall information from memory.' }
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
    lengthBonus: 15,
    rtMin: 300,
    rtMax: 120000,
    baseTime: 30000,
    minTime: 15000,
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
    userInput: [],
    usedTiles: [],
    hintUsed: false,
    answered: false,
    trialStartTime: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    rtList: [],
    invalidRTs: 0,
    longestWord: 0,
    missedWords: [],
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
  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function shuffleArrayInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    // No time limit in classic — the timer bar just shows elapsed as a soft guide
    return Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (level - 1) * CONFIG.timeStepPerLevel
    );
  }
  function hintsForLevel(level) {
    // Classic gives 1 hint per trial at lower levels, 0 at higher levels
    if (level <= 3)  return 1;
    if (level <= 8)  return 1;
    return 0;
  }

  /* ═══ QUESTION GENERATION ═══ */
  function generateQuestion(difficulty) {
    const tiers = tiersForDifficulty(difficulty);
    const pool = WORD_BANK.filter(w => tiers.includes(w.word.length <= 4 ? 1 : w.word.length <= 7 ? 2 : 3));

    let available = pool.filter(w => state.recentWords.indexOf(w.word) === -1);
    if (available.length === 0) {
      state.recentWords = [];
      available = pool;
    }

    const picked = available[randInt(0, available.length - 1)];

    state.recentWords.push(picked.word);
    if (state.recentWords.length > 20) state.recentWords.shift();

    // Shuffle letters, ensure != original
    let letters = shuffleArray(picked.word.split(''));
    let guard = 0;
    while (letters.join('').toLowerCase() === picked.word.toLowerCase() && guard < 15) {
      letters = shuffleArray(picked.word.split(''));
      guard++;
    }

    const tier = picked.word.length <= 4 ? 1 : picked.word.length <= 7 ? 2 : 3;

    return {
      word: picked.word,
      hint: picked.hint,
      letters: letters,
      tier: tier,
      meta: TIER_NAMES[tier] + ' · ' + picked.word.length + ' letters'
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

  /* ═══ TRIAL RENDERING ═══ */
  function renderTrial() {
    const trial = state.currentTrial;
    const hintsAvail = hintsForLevel(state.level);
    const hintCountRemaining = state.hintUsed ? 0 : hintsAvail;

    const slots = Array.from({ length: trial.word.length }, function (_, i) {
      const filled = i < state.userInput.length;
      const isHinted = i === 0 && state.hintUsed;
      let cls = 'slot';
      if (filled) cls += ' filled';
      if (isHinted && !filled) cls += ' hinted';
      return '<span class="' + cls + '">' + (filled ? escapeHTML(state.userInput[i]) : (isHinted ? escapeHTML(trial.word[0]) : '')) + '</span>';
    }).join('');

    const tiles = trial.letters.map(function (l, i) {
      const used = state.usedTiles[i];
      let cls = 'letter-tile';
      if (used) cls += ' used';
      return '<button class="' + cls + '" data-idx="' + i + '" data-letter="' + escapeHTML(l) + '">' + escapeHTML(l.toUpperCase()) + '</button>';
    }).join('');

    const trialInfoHTML = '' +
      '<div class="trial-info">' +
        '<span class="ti">WORD <span class="ti-val">' + state.trialIndex + '/' + CONFIG.trialsPerLevel + '</span></span>' +
        '<span class="ti">STREAK <span class="ti-val good">' + state.streak + '</span></span>' +
        '<span class="ti">CORRECT <span class="ti-val">' + state.levelCorrect + '</span></span>' +
      '</div>';

    const hintDisabled = state.hintUsed || hintsAvail === 0;
    const clearDisabled = state.userInput.length === 0;

    render('' +
      renderProgressDots() +
      trialInfoHTML +
      '<div class="hint-card">' +
        '<div class="hint-label">Hint</div>' +
        '<div class="hint-text">' + escapeHTML(trial.hint) + '</div>' +
      '</div>' +
      '<div class="slots-row">' + slots + '</div>' +
      '<div class="letters-row">' + tiles + '</div>' +
      '<div class="controls-row">' +
        '<button class="ctrl-btn hint-btn" id="hint-btn" ' + (hintDisabled ? 'disabled' : '') + '>' +
          '<span class="cb-icon">💡</span>Hint' +
          '<span class="hint-badge">' + hintCountRemaining + '</span>' +
        '</button>' +
        '<button class="ctrl-btn shuffle-btn" id="shuffle-btn">' +
          '<span class="cb-icon">🔀</span>Shuffle' +
        '</button>' +
        '<button class="ctrl-btn clear-btn" id="clear-btn" ' + (clearDisabled ? 'disabled' : '') + '>' +
          '<span class="cb-icon">✕</span>Clear' +
        '</button>' +
      '</div>'
    );

    wireTiles();
    wireControls();
  }

  function wireTiles() {
    elContent.querySelectorAll('.letter-tile').forEach(function (tile) {
      tile.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.answered || state.phase !== 'trial') return;
        const idx = parseInt(tile.dataset.idx, 10);
        if (state.usedTiles[idx]) return;
        if (state.userInput.length >= state.currentTrial.word.length) return;

        state.usedTiles[idx] = true;
        state.userInput.push(tile.dataset.letter);

        if (S && S.letterPick) S.letterPick();

        renderTrial();

        if (state.userInput.length === state.currentTrial.word.length) {
          state.answered = true;
          push(submitAnswer, 300);
        }
      });
    });
  }

  function wireControls() {
    const hintBtn = $('hint-btn');
    const shuffleBtn = $('shuffle-btn');
    const clearBtn = $('clear-btn');

    if (hintBtn && !hintBtn.disabled) {
      hintBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.hintUsed || state.answered) return;
        state.hintUsed = true;

        if (S && S.hintReveal) S.hintReveal();

        // Auto-place first letter
        const firstLetter = state.currentTrial.word[0].toLowerCase();
        for (let i = 0; i < state.currentTrial.letters.length; i++) {
          if (!state.usedTiles[i] && state.currentTrial.letters[i].toLowerCase() === firstLetter) {
            state.usedTiles[i] = true;
            state.userInput.push(state.currentTrial.letters[i]);
            break;
          }
        }
        renderTrial();

        if (state.userInput.length === state.currentTrial.word.length) {
          state.answered = true;
          push(submitAnswer, 300);
        }
      });
    }

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.answered) return;

        // Shuffle only unused tiles
        const unusedIdx = [];
        const unusedLetters = [];
        for (let i = 0; i < state.currentTrial.letters.length; i++) {
          if (!state.usedTiles[i]) {
            unusedIdx.push(i);
            unusedLetters.push(state.currentTrial.letters[i]);
          }
        }
        shuffleArrayInPlace(unusedLetters);
        for (let k = 0; k < unusedIdx.length; k++) {
          state.currentTrial.letters[unusedIdx[k]] = unusedLetters[k];
        }

        if (S && S.shuffle) S.shuffle();
        renderTrial();
      });
    }

    if (clearBtn && !clearBtn.disabled) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.answered) return;
        state.usedTiles = new Array(state.currentTrial.word.length).fill(false);
        state.userInput = [];
        state.hintUsed = false;
        if (S && S.letterRemove) S.letterRemove();
        renderTrial();
      });
    }
  }

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    if (window.WordScrambleExtraModes && window.WordScrambleExtraModes.abort) {
      try { window.WordScrambleExtraModes.abort(); } catch (e) {}
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
    const pbLW  = pb.bestLongestWord > 0 ? pb.bestLongestWord + ' letters' : '—';

    const missionHTML = missions.missions.map(function (m) {
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
      '<h1 class="phase-headline grd">Word Scramble</h1>' +
      '<p class="phase-sub">' +
        'Letters are scrambled. Click them in the ' +
        '<strong style="color:#C77DFF">correct order</strong> ' +
        'to form the word that matches the hint.' +
      '</p>' +

      (hasHistory ? '' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(660px,94vw);margin:14px 0;">' +
          '<div class="stat-card"><div class="stat-label">ACC</div><div class="stat-value" style="font-size:15px">' + pbAcc + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">MEDIAN</div><div class="stat-value" style="font-size:15px">' + pbRT + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">BEST LV</div><div class="stat-value" style="font-size:15px">' + pbLv + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">LONGEST</div><div class="stat-value" style="font-size:13px">' + pbLW + '</div></div>' +
        '</div>' : '') +

      '<div class="stages-card" id="stages-container"></div>' +

      '<div class="missions-card">' +
        '<div class="missions-title">Today\'s Missions</div>' +
        missionHTML +
      '</div>' +

      '<div class="mode-grid-4">' +
        '<div class="mode-card" id="mode-classic">' +
          '<div class="mode-icon">🔤</div>' +
          '<div class="mode-name">Classic</div>' +
          '<div class="mode-desc">15 levels · 5 words each · 3 lives</div>' +
          '<div class="mode-meta">→ Letters grow 3 → 9</div>' +
        '</div>' +
        (window.WordScrambleExtraModes ? window.WordScrambleExtraModes.getModeDefinitions().map(function (m) {
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
        'Click letters or type them · <kbd>Backspace</kbd> removes last · <kbd>Enter</kbd> submits' +
      '</p>'
    );

    if (FlashStages) {
      const st = document.getElementById('stages-container');
      if (st) FlashStages.renderStrip(st);
    }

    $('mode-classic').addEventListener('click', function (e) {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    if (window.WordScrambleExtraModes && window.WordScrambleAPI) {
      window.WordScrambleExtraModes.getModeDefinitions().forEach(function (m) {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.WordScrambleExtraModes.start(m.id, window.WordScrambleAPI, S, H);
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
    state.longestWord = 0;
    state.missedWords = [];
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
    state.userInput = [];
    state.usedTiles = [];
    state.hintUsed = false;
    state.answered = false;
    setPhase('trial');

    const difficulty = difficultyForLevel(state.level);
    const trial = generateQuestion(difficulty);
    state.currentTrial = trial;
    state.usedTiles = new Array(trial.word.length).fill(false);

    renderTrial();
    if (S && S.letterPick) S.letterPick();

    state.trialStartTime = performance.now();
    startTimer(timeLimitForLevel(state.level));
  }

  function startTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(function () {
      if (state.phase !== 'trial' || state.answered) return;
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
  function submitAnswer() {
    if (state.phase !== 'trial' || state.answered === false) return;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const rt = performance.now() - state.trialStartTime;
    const isValid = rt >= CONFIG.rtMin && rt <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    const userWord = state.userInput.join('').toLowerCase();
    const correctWord = state.currentTrial.word.toLowerCase();
    const isCorrect = userWord === correctWord;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += rt;

    const slots = elContent.querySelectorAll('.slot');
    slots.forEach(function (slot) {
      slot.classList.add(isCorrect ? 'correct' : 'wrong');
    });

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      elStreak.textContent = String(state.streak);

      if (state.currentTrial.word.length > state.longestWord) {
        state.longestWord = state.currentTrial.word.length;
      }

      if (isValid) state.rtList.push(rt);

      const timeBonus = isValid ? Math.round((1 - rt / timeLimitForLevel(state.level)) * 50) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      const lengthBonus = state.currentTrial.word.length * CONFIG.lengthBonus;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus + lengthBonus;

      if (S && S.wordSolved) S.wordSolved();
      else showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 800);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);

      if (state.missedWords.indexOf(state.currentTrial.word) === -1) {
        state.missedWords.push(state.currentTrial.word);
      }

      if (S && S.miss) S.miss();
      else showFeedbackFlash(false);
      haptic('wrong');
      setPhase('wrong');
      if (state.lives <= 0) push(completeGame, 1400);
      else push(nextTrial, 1400);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || state.answered) return;
    state.answered = true;

    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    if (state.missedWords.indexOf(state.currentTrial.word) === -1) {
      state.missedWords.push(state.currentTrial.word);
    }

    const slots = elContent.querySelectorAll('.slot');
    slots.forEach(function (slot) { slot.classList.add('wrong'); });

    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');
    if (state.lives <= 0) push(completeGame, 1200);
    else push(nextTrial, 1200);
  }

  /* ═══ KEYBOARD INPUT ═══ */
  function handleKeyInput(key) {
    if (state.phase !== 'trial' || state.answered) return;

    // Backspace — remove last letter
    if (key === 'Backspace') {
      if (state.userInput.length > 0) {
        // Find the tile index that was used last
        const lastLetter = state.userInput[state.userInput.length - 1];
        // Find last used tile with matching letter
        for (let i = state.usedTiles.length - 1; i >= 0; i--) {
          if (state.usedTiles[i] && state.currentTrial.letters[i] === lastLetter) {
            state.usedTiles[i] = false;
            break;
          }
        }
        state.userInput.pop();
        if (S && S.letterRemove) S.letterRemove();
        renderTrial();
      }
      return;
    }

    // Enter — submit if complete
    if (key === 'Enter') {
      if (state.userInput.length === state.currentTrial.word.length) {
        state.answered = true;
        submitAnswer();
      }
      return;
    }

    // Letter key — find first unused tile with that letter
    if (/^[a-zA-Z]$/.test(key)) {
      if (state.userInput.length >= state.currentTrial.word.length) return;
      const targetLetter = key.toLowerCase();
      for (let i = 0; i < state.currentTrial.letters.length; i++) {
        if (!state.usedTiles[i] && state.currentTrial.letters[i].toLowerCase() === targetLetter) {
          state.usedTiles[i] = true;
          state.userInput.push(state.currentTrial.letters[i]);
          if (S && S.letterPick) S.letterPick();
          renderTrial();

          if (state.userInput.length === state.currentTrial.word.length) {
            state.answered = true;
            push(submitAnswer, 300);
          }
          return;
        }
      }
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
          state.levelCorrect + '/' + state.levelTotal + ' words unscrambled' +
        '</p>' +
        '<p class="phase-hint">' +
          (state.level < CONFIG.maxLevel ? 'Level ' + (state.level + 1) + ' starting…' : 'You reached the top!') +
        '</p>'
      );

      push(function () {
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

      push(function () {
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

    const totalCorrect = state.results.reduce(function (a, r) { return a + r.correct; }, 0);
    const totalTrials  = state.results.reduce(function (a, r) { return a + r.total; }, 0);
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
      maxStreak: state.maxStreak,
      longestWord: state.longestWord
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
        modeBadges.map(function (b) {
          return '<span class="badge-icon ' + (b.unlocked ? 'unlocked' : 'locked') + '" title="' + b.desc + '">' + b.icon + '</span>';
        }).join('') +
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
    if (accuracy >= 95)      interpretation = 'Elite lexical access — words unlock instantly.';
    else if (accuracy >= 80) interpretation = 'Strong word recognition — well above average.';
    else if (accuracy >= 60) interpretation = 'Solid performance — vocabulary is expanding.';
    else                     interpretation = 'Words are tricky — every scramble builds fluency.';

    let missedMsg = '';
    if (state.missedWords.length > 0) {
      const top3 = state.missedWords.slice(0, 3).join(', ');
      missedMsg = '<br><span style="color:#FFD60A">Words to review: ' + escapeHTML(top3) + '</span>';
    }

    const insightsHTML = insights.length > 0 ? '' +
      '<div class="insights-card">' +
        '<div class="insights-title">Performance Insights</div>' +
        insights.map(function (i) { return '<div class="insight-item">' + i + '</div>'; }).join('') +
      '</div>' : '';

    if (S) S.victory();

    render('' +
      '<div class="phase-title">Test Complete</div>' +
      '<h1 class="phase-headline grd">Your Score</h1>' +
      badgeHTML +
      pbBanner +

      '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-label">MAX LEVEL</div><div class="stat-value">' + maxLevel + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">LONGEST</div><div class="stat-value">' + state.longestWord + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">' + accuracy + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">' + (medianRT || '—') + '</div></div>' +
      '</div>' +

      '<div class="mem-box">' +
        '<strong>Lexical Profile</strong><br>' +
        'Words attempted: <strong>' + totalTrials + '</strong> · ' +
        'Solved: <strong>' + totalCorrect + '</strong> · ' +
        'Longest: <strong>' + state.longestWord + ' letters</strong><br>' +
        interpretation + missedMsg +
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

    push(function () {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'medianRT');
    }, 100);

    $('restart-btn').addEventListener('click', function (e) { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', function (e) { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic',
        maxLevel: maxLevel,
        accuracy: accuracy,
        medianRT: medianRT,
        maxStreak: state.maxStreak,
        longestWord: state.longestWord,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'word-scramble',
      domain: 'language',
      mode: 'classic',
      maxLevel: maxLevel,
      accuracy: accuracy,
      score: state.totalScore,
      medianRT: medianRT,
      rtv: rtv,
      rcs: rcs,
      isNewPB: hasNewPB,
      maxStreak: state.maxStreak,
      longestWord: state.longestWord
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
    state.userInput = [];
    state.usedTiles = [];
    state.hintUsed = false;
    state.answered = false;
    state.trialIndex = 0;
    state.rtList = [];
    state.invalidRTs = 0;
    state.longestWord = 0;
    state.missedWords = [];
    state.recentWords = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options) {
    options = options || {};
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[WordScramble] Container not found'); return; }

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
    document.addEventListener('keydown', function (e) {
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

      // Trial phase — pass to handler
      if (state.phase === 'trial' && state.mode === 'classic' && !state.answered) {
        if (e.key === 'Backspace') {
          e.preventDefault();
          handleKeyInput('Backspace');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleKeyInput('Enter');
        } else if (/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          handleKeyInput(e.key);
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
    if (window.WordScrambleExtraModes && window.WordScrambleExtraModes.abort) {
      try { window.WordScrambleExtraModes.abort(); } catch (e) {}
    }
    showIdle();
  }

  function wireBackButton() {
    const btn = $('back-btn');
    if (btn) btn.addEventListener('click', function (e) {
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
  window.WordScrambleAPI = {
    CONFIG: CONFIG,
    state: state,
    WORD_BANK: WORD_BANK,

    settings: function () { return FS ? FS.get() : {}; },

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
    shuffleArray: shuffleArray,
    shuffleArrayInPlace: shuffleArrayInPlace,
    clearAllTimeouts: clearAllTimeouts,

    emit: function (payload) {
      if (typeof state.onComplete === 'function') state.onComplete(payload);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*'); } catch (e) {}
      }
    },
    exitToMenu: showIdle,

    $: $,
    getElContent: function () { return elContent; }
  };

  window.WordScrambleGame = {
    mount: mount,
    reset: resetGame,
    state: state,
    config: CONFIG,
    wordBank: WORD_BANK
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();