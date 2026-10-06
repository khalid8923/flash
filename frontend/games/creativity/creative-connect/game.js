/* ═══════════════════════════════════════════════════════════
   FLASH — Creative Connect v2.0 (Full Rewrite)
   Mednick (1962) · Remote Associates Test
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Hint System · Skip · Practice · Difficulty Badge ·
             Streak Flame · Fast Pulse · Stages · Missions ·
             Badges · Sounds · i18n · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.CreativeConnectHelpers;
  const S = window.CreativeConnectSounds;
  const STAGES = window.CreativeConnectStages;
  const FlashStages = window.FlashStages;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[CreativeConnect] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('creative-connect', STAGES, {
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
    baseTime: 30000,
    minTime: 15000,
    timeStepPerLevel: 1000,
    correctBase: 120,
    streakBonus: 50,
    timeBonusMax: 120,
    rtMin: 100,
    rtMax: 60000,
    // Hints
    hint1Penalty: 0.25,   // reveal first letter — 25% score cut
    hint2Penalty: 0.50,   // reveal type — 50% score cut
    // Practice
    practicePuzzles: 5
  };

  /* ═══ PUZZLE DATABASE ═══ */
  const PUZZLES = {
    EASY: [
      { triad: ['cottage', 'swiss', 'cake'], answer: 'cheese',
        distractors: ['cream', 'butter', 'bread'],
        solution: 'cottage cheese · Swiss cheese · cheesecake',
        type: 'compound' },
      { triad: ['cream', 'skate', 'water'], answer: 'ice',
        distractors: ['milk', 'cold', 'snow'],
        solution: 'ice cream · ice skate · ice water',
        type: 'compound' },
      { triad: ['falling', 'actor', 'dust'], answer: 'star',
        distractors: ['sky', 'space', 'night'],
        solution: 'falling star · movie star · stardust',
        type: 'compound' },
      { triad: ['light', 'birthday', 'stick'], answer: 'candle',
        distractors: ['wax', 'match', 'flame'],
        solution: 'candlelight · birthday candle · candlestick',
        type: 'compound' },
      { triad: ['flower', 'friend', 'scout'], answer: 'girl',
        distractors: ['boy', 'petal', 'buddy'],
        solution: 'flower girl · girlfriend · Girl Scout',
        type: 'compound' },
      { triad: ['board', 'magic', 'death'], answer: 'black',
        distractors: ['white', 'dark', 'night'],
        solution: 'blackboard · black magic · Black Death',
        type: 'compound' }
    ],

    MEDIUM: [
      { triad: ['man', 'glue', 'star'], answer: 'super',
        distractors: ['hero', 'strong', 'stick'],
        solution: 'superman · superglue · superstar',
        type: 'prefix' },
      { triad: ['cracker', 'fly', 'fighter'], answer: 'fire',
        distractors: ['flame', 'spark', 'match'],
        solution: 'firecracker · firefly · firefighter',
        type: 'prefix' },
      { triad: ['cross', 'rain', 'tie'], answer: 'bow',
        distractors: ['arrow', 'wrap', 'knot'],
        solution: 'crossbow · rainbow · bowtie',
        type: 'suffix' },
      { triad: ['time', 'hair', 'stretch'], answer: 'long',
        distractors: ['short', 'wide', 'thin'],
        solution: 'longtime · long hair · long stretch',
        type: 'prefix' },
      { triad: ['case', 'shelf', 'mark'], answer: 'book',
        distractors: ['page', 'read', 'paper'],
        solution: 'bookcase · bookshelf · bookmark',
        type: 'prefix' },
      { triad: ['water', 'fall', 'down'], answer: 'fall',
        distractors: ['drop', 'rain', 'splash'],
        solution: 'waterfall · fall down · fall (autumn)',
        type: 'multi' },
      { triad: ['head', 'board', 'band'], answer: 'head',
        distractors: ['face', 'hair', 'neck'],
        solution: 'headboard · headband · head (leader)',
        type: 'multi' },
      { triad: ['work', 'shop', 'out'], answer: 'work',
        distractors: ['gym', 'office', 'home'],
        solution: 'workshop · workout · work (job)',
        type: 'multi' },
      { triad: ['rain', 'bow', 'coat'], answer: 'rain',
        distractors: ['snow', 'storm', 'wind'],
        solution: 'rainbow · raincoat · rain',
        type: 'multi' },
      { triad: ['fire', 'man', 'proof'], answer: 'fire',
        distractors: ['flame', 'heat', 'smoke'],
        solution: 'fireman · fireproof · fire',
        type: 'multi' }
    ],

    HARD: [
      { triad: ['key', 'board', 'hole'], answer: 'key',
        distractors: ['lock', 'door', 'chain'],
        solution: 'keyboard · keyhole · key (essential)',
        type: 'multi' },
      { triad: ['life', 'guard', 'time'], answer: 'life',
        distractors: ['long', 'short', 'death'],
        solution: 'lifeguard · lifetime · life',
        type: 'multi' },
      { triad: ['day', 'light', 'time'], answer: 'day',
        distractors: ['sun', 'night', 'hour'],
        solution: 'daylight · daytime · day',
        type: 'multi' },
      { triad: ['sun', 'rise', 'flower'], answer: 'sun',
        distractors: ['moon', 'sky', 'star'],
        solution: 'sunrise · sunflower · sun',
        type: 'multi' },
      { triad: ['tree', 'house', 'top'], answer: 'tree',
        distractors: ['roof', 'wood', 'leaf'],
        solution: 'treehouse · treetop · tree',
        type: 'multi' },
      { triad: ['water', 'melon', 'proof'], answer: 'water',
        distractors: ['juice', 'wet', 'rain'],
        solution: 'watermelon · waterproof · water',
        type: 'multi' },
      { triad: ['paper', 'back', 'weight'], answer: 'paper',
        distractors: ['book', 'light', 'heavy'],
        solution: 'paperback · paperweight · paper',
        type: 'multi' },
      { triad: ['snow', 'ball', 'man'], answer: 'snow',
        distractors: ['cold', 'white', 'ice'],
        solution: 'snowball · snowman · snow',
        type: 'multi' }
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
    hardPuzzlesSolved: 0,
    hintsUsed: 0,
    skipsUsed: 0,
    hintRevealed: 0,  // 0 = none, 1 = first letter, 2 = type
    timeoutIds: [],
    timerIntervalId: null,
    onComplete: null,
    settings: null
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
    if (level <= 3) return PUZZLES.EASY;
    if (level <= 9) return PUZZLES.MEDIUM;
    return PUZZLES.HARD;
  }

  function difficultyForLevel(level) {
    if (level <= 3) return 'easy';
    if (level <= 9) return 'medium';
    return 'hard';
  }

  function generateQuestion(level) {
    const pool = poolForLevel(level);
    const entry = pickOne(pool);
    const options = shuffle([
      { text: entry.answer, correct: true },
      ...entry.distractors.map(d => ({ text: d, correct: false }))
    ]);
    return {
      triad: entry.triad,
      answer: entry.answer,
      options,
      correctIdx: options.findIndex(o => o.correct),
      solution: entry.solution,
      type: entry.type || 'compound',
      isHard: level > 9,
      difficulty: difficultyForLevel(level)
    };
  }

  /* ═══ SETTINGS ═══ */
  function loadSettings() {
    state.settings = H.getSettings();
    H.applySettingsToDOM(state.settings);
    if (S) S.setEnabled(state.settings.soundEnabled !== false);
  }
  function openSettings() {
    const d = $('settings-drawer'); if (!d) return;
    $('opt-reduced-motion').checked = state.settings.reducedMotion;
    $('opt-high-contrast').checked  = state.settings.highContrast;
    $('opt-input-mode').value       = state.settings.inputMode;
    $('opt-sound').checked          = state.settings.soundEnabled;
    $('opt-haptics').checked        = state.settings.haptics;
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() {
    const d = $('settings-drawer'); if (!d) return;
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
  }
  function wireSettings() {
    const d = $('settings-drawer'); if (!d) return;
    const btn = $('settings-btn');
    if (btn) btn.addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    d.addEventListener('click', (e) => { if (e.target === d) closeSettings(); });

    $('opt-reduced-motion').addEventListener('change', e => { state.settings.reducedMotion = e.target.checked; H.saveSettings(state.settings); H.applySettingsToDOM(state.settings); });
    $('opt-high-contrast').addEventListener('change', e => { state.settings.highContrast = e.target.checked; H.saveSettings(state.settings); H.applySettingsToDOM(state.settings); });
    $('opt-input-mode').addEventListener('change', e => { state.settings.inputMode = e.target.value; H.saveSettings(state.settings); });
    $('opt-sound').addEventListener('change', e => { state.settings.soundEnabled = e.target.checked; H.saveSettings(state.settings); if (S) S.setEnabled(e.target.checked); });
    $('opt-haptics').addEventListener('change', e => { state.settings.haptics = e.target.checked; H.saveSettings(state.settings); });
    $('opt-reset-data').addEventListener('click', () => {
      if (confirm(T.t('reset_confirm') || 'Reset ALL progress?')) {
        H.resetAll();
        if (FlashStages) FlashStages.reset();
        closeSettings();
        showIdle();
      }
    });
  }
  function haptic(type) {
    if (!state.settings.haptics || !('vibrate' in navigator)) return;
    if (type === 'correct') navigator.vibrate(10);
    else if (type === 'wrong') navigator.vibrate([20, 40, 20]);
  }
  function snd() {
    return (S && state.settings.soundEnabled !== false) ? S : null;
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
  function showPracticeBanner(text, color) {
    return `<div class="practice-badge" style="background:${color}15;border-color:${color}55;color:${color};">${text}</div>`;
  }
  function difficultyDot(diff) {
    const colors = { easy: '#00FF96', medium: '#FFD60A', hard: '#FF0077' };
    return `<span class="difficulty-dot" style="background:${colors[diff]};" title="${diff}"></span>`;
  }

  /* ═══ HINT SYSTEM ═══ */
  function renderHintButton() {
    if (state.hintRevealed >= 2) return '';
    const label = state.hintRevealed === 0
      ? '💡 ' + (T.t('hint') || 'Hint') + ' (−25%)'
      : '💡 ' + (T.t('hint_more') || 'More hint') + ' (−25%)';
    return `<button class="hint-btn" id="hint-btn">${label}</button>`;
  }

  function revealHint() {
    if (state.hintRevealed >= 2) return;
    const s = snd(); if (s) s.click();
    state.hintRevealed++;
    state.hintsUsed++;
    haptic('correct');

    if (state.hintRevealed === 1) {
      // Reveal first letter
      const first = state.currentQuestion.answer[0];
      const blanked = first + '_'.repeat(state.currentQuestion.answer.length - 1);
      const wrap = elContent.querySelector('.triad-question');
      if (wrap) {
        const hint = document.createElement('div');
        hint.className = 'hint-display';
        hint.innerHTML = `<strong>${T.t('hint_first_letter') || 'First letter'}:</strong> <code>${blanked}</code>`;
        wrap.parentNode.insertBefore(hint, wrap.nextSibling);
      }
    } else if (state.hintRevealed === 2) {
      // Reveal type
      const typeNames = {
        compound: 'Compound word',
        prefix: 'Common prefix',
        suffix: 'Common suffix',
        multi: 'Multiple forms'
      };
      const wrap = elContent.querySelector('.triad-question');
      if (wrap) {
        const hint = document.createElement('div');
        hint.className = 'hint-display';
        hint.innerHTML = `<strong>${T.t('hint_type') || 'Connection type'}:</strong> ${typeNames[state.currentQuestion.type] || state.currentQuestion.type}`;
        wrap.parentNode.insertBefore(hint, wrap.nextSibling);
      }
    }

    const btn = $('hint-btn');
    if (btn) {
      if (state.hintRevealed >= 2) btn.remove();
      else btn.innerHTML = '💡 ' + (T.t('hint_more') || 'More hint') + ' (−25%)';
    }
  }

  /* ═══ SKIP SYSTEM ═══ */
  function skipPuzzle() {
    if (state.phase !== 'question' || !state.currentQuestion) return;
    if (!confirm(T.t('skip_confirm') || 'Skip this puzzle? Costs 1 life.')) return;

    const s = snd(); if (s) s.click();
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
    state.currentQuestion.answered = true;
    state.skipsUsed++;
    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    // Show answer
    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === state.currentQuestion.correctIdx) b.classList.add('correct');
    });
    showExplanation(state.currentQuestion);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 2200);
    else push(() => nextQuestion(), 2200);
  }

  /* ═══ EXPLANATION ═══ */
  function showExplanation(q) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `
      <div class="explanation-title">${T.t('the_connection') || 'The Connection'}</div>
      <div class="explanation-text"><strong>${q.answer}</strong> · ${q.solution}</div>
    `;
    elContent.appendChild(ex);
  }

  /* ═══════════════════════════════════════════════════════════
     IDLE SCREEN
     ═══════════════════════════════════════════════════════════ */
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
    const pbHP  = pb.bestHardPuzzles > 0 ? pb.bestHardPuzzles : '—';

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
      <div class="phase-title">Creativity Domain · Remote Associates</div>
      <h1 class="phase-headline grd">Creative Connect</h1>
      <p class="phase-sub">
        Three words appear. Find the <strong style="color:#FFD60A">one word that connects them all</strong>
        by forming a compound word or common phrase with each.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">HARD SOLVED</div><div class="stat-value" style="font-size:16px">${pbHP}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🎯</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 4 puzzles each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        <div class="mode-card" id="mode-practice">
          <div class="mode-icon">🎓</div>
          <div class="mode-name">${T.t('mode_practice') || 'Practice'}</div>
          <div class="mode-desc">5 easy puzzles · No pressure · Not scored</div>
          <div class="mode-meta">→ Great for onboarding</div>
        </div>
        ${(window.CreativeConnectExtraModes ? window.CreativeConnectExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
            ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${T.t('mode_' + m.id) || m.name}</div>
            <div class="mode-desc">${m.id === 'daily' && daily ? T.t('desc_completed') || 'Completed today' : m.desc}</div>
            <div class="mode-meta">${m.id === 'daily' && daily ? '→ ' + (T.t('desc_come_back') || 'Come back tomorrow') : m.meta}</div>
          </div>
        `).join('')}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>1</kbd>–<kbd>4</kbd> · <kbd>H</kbd> for hint · <kbd>S</kbd> to skip · <kbd>Space</kbd> to start
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

    $('mode-practice').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startPractice();
    });

    if (window.CreativeConnectExtraModes && window.CCAPI) {
      window.CreativeConnectExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.CreativeConnectExtraModes.start(m.id, window.CCAPI, S, H);
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PRACTICE MODE — 5 easy puzzles, no pressure
     ═══════════════════════════════════════════════════════════ */
  function startPractice() {
    state.mode = 'practice';
    state.level = 1;
    state.questionIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.practiceQueue = [];
    for (let i = 0; i < CONFIG.practicePuzzles; i++) {
      state.practiceQueue.push(generateQuestion(1));
    }

    elLevel.textContent = '🎓';
    elLives.textContent = '∞';
    elStreak.textContent = '0';

    setPhase('countdown');
    showCountdown(3, '🎓 PRACTICE', '5 easy puzzles · Learn the rules', nextPracticePuzzle);
  }

  function nextPracticePuzzle() {
    if (state.questionIndex >= CONFIG.practicePuzzles) { endPractice(); return; }

    setPhase('question');
    state.questionIndex++;
    state.hintRevealed = 0;

    const q = state.practiceQueue[state.questionIndex - 1];
    state.currentQuestion = { ...q, startTime: performance.now(), timeLimit: 60000 };

    render(`
      ${showPracticeBanner('PRACTICE · ' + state.questionIndex + ' / ' + CONFIG.practicePuzzles, '#FFD60A')}
      <div class="triad-wrap">
        <div class="triad-word">${q.triad[0]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[1]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[2]}</div>
      </div>
      <div class="triad-question">Which word connects all three?</div>
      <div class="options-grid">
        ${q.options.map((o, i) => `<button class="option-btn" data-index="${i}" data-key="${i+1}">${o.text}</button>`).join('')}
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handlePracticeAnswer(btn));
    });
  }

  function handlePracticeAnswer(btn) {
    if (state.phase !== 'question' || !state.currentQuestion || state.currentQuestion.answered) return;
    state.currentQuestion.answered = true;

    const chosen = parseInt(btn.dataset.index, 10);
    const correct = state.currentQuestion.correctIdx;
    const isCorrect = chosen === correct;

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    showExplanation(state.currentQuestion);
    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) state.levelCorrect++;
    state.levelTotal++;

    push(nextPracticePuzzle, isCorrect ? 1800 : 2800);
  }

  function endPractice() {
    clearAllTimeouts();
    setPhase('gameover');
    if (S) S.victory();

    const accuracy = Math.round((state.levelCorrect / CONFIG.practicePuzzles) * 100);

    render(`
      <div class="phase-title">Practice Complete</div>
      <h1 class="phase-headline grd">🎓 Ready!</h1>
      <p class="phase-sub">You got ${state.levelCorrect}/${CONFIG.practicePuzzles} correct (${accuracy}%)</p>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
        <button class="big-btn" id="start-real">Start Classic</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);
    $('start-real').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });
  }

  /* ═══════════════════════════════════════════════════════════
     CLASSIC MODE
     ═══════════════════════════════════════════════════════════ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.hardPuzzlesSolved = 0;
    state.hintsUsed = 0;
    state.skipsUsed = 0;

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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Find the connecting word', nextQuestion);
  }

  function nextQuestion() {
    if (state.questionIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('question');
    state.questionIndex++;
    state.hintRevealed = 0;

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
        ${difficultyDot(q.difficulty)}
      </div>

      <div class="triad-wrap">
        <div class="triad-word">${q.triad[0]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[1]}</div>
        <div class="triad-plus">+</div>
        <div class="triad-word">${q.triad[2]}</div>
      </div>

      <div class="triad-question">Which word connects all three?</div>

      <div class="options-grid">
        ${q.options.map((o, i) => `
          <button class="option-btn" data-index="${i}" data-key="${i + 1}">${o.text}</button>
        `).join('')}
      </div>

      <div class="hint-row">
        ${renderHintButton()}
        <button class="skip-btn" id="skip-btn">⏭ ${T.t('skip') || 'Skip'}</button>
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });
    const hintBtn = $('hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', revealHint);
    const skipBtn = $('skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', skipPuzzle);

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
    if (isCorrect && state.currentQuestion.isHard) state.hardPuzzlesSolved++;

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    const hintBtn = $('hint-btn'); if (hintBtn) hintBtn.remove();
    const skipBtn = $('skip-btn'); if (skipBtn) skipBtn.remove();

    showExplanation(state.currentQuestion);
    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    // Fast pulse if answered in under half time
    if (isCorrect && isValid && elapsed < state.currentQuestion.timeLimit * 0.5) {
      elContent.classList.add('fast-pulse');
      setTimeout(() => elContent.classList.remove('fast-pulse'), 700);
    }

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      let timeBonus = isValid ? Math.round((1 - elapsed / state.currentQuestion.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      let basePoints = CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      // Apply hint penalty
      if (state.hintRevealed === 1) basePoints = Math.round(basePoints * (1 - CONFIG.hint1Penalty));
      else if (state.hintRevealed === 2) basePoints = Math.round(basePoints * (1 - CONFIG.hint2Penalty));

      state.totalScore += basePoints;

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
    const hintBtn = $('hint-btn'); if (hintBtn) hintBtn.remove();
    const skipBtn = $('skip-btn'); if (skipBtn) skipBtn.remove();

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
      avgTime: state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0,
      passed: accuracy >= 0.6
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct
          · Avg: ${state.levelTotal > 0 ? Math.round(state.levelTotalTime / state.levelTotal) : 0} ms
        </p>
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

  /* ═══════════════════════════════════════════════════════════
     COMPLETE GAME
     ═══════════════════════════════════════════════════════════ */
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
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      hardPuzzles: state.hardPuzzlesSolved
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

    const pbBanner = hasNewPB ? `<div class="pb-banner">★ ${T.t('new_personal_best') || 'NEW PERSONAL BEST'} ★</div>` : '';

    let interpretation = '';
    if (accuracy >= 80) interpretation = 'Exceptional associative creativity (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong remote association ability';
    else if (accuracy >= 50) interpretation = 'Average — normal associative range';
    else interpretation = 'Local thinking bias — practice remote links';

    const insightsHTML = insights.length > 0
      ? `<div class="insights-card"><div class="insights-title">${T.t('performance_insights') || 'Performance Insights'}</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>`
      : '';

    const statsHTML = `
      <div class="creativity-box">
        <strong>${T.t('associative_profile') || 'Associative Creativity Profile'}</strong>
        <br>
        Hard puzzles solved: <strong>${state.hardPuzzlesSolved}</strong>
        <br>
        Hints used: <strong>${state.hintsUsed}</strong> · Skips: <strong>${state.skipsUsed}</strong>
        <br>
        <span style="color:var(--cyan)">${interpretation}</span>
      </div>`;

    if (S) S.victory();

    render(`
      <div class="phase-title">${T.t('test_complete') || 'Test Complete'}</div>
      <h1 class="phase-headline grd">${T.t('your_score') || 'Your Score'}</h1>
      ${badgeHTML}
      ${pbBanner}

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">${T.t('max_level') || 'MAX LEVEL'}</div><div class="stat-value">${maxLevel}</div></div>
        <div class="stat-card"><div class="stat-label">${T.t('accuracy') || 'ACCURACY'}</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">${T.t('median_rt') || 'MEDIAN RT'}</div><div class="stat-value">${medianRT || '—'}</div></div>
        <div class="stat-card"><div class="stat-label">RCS</div><div class="stat-value">${rcs}</div></div>
      </div>

      ${statsHTML}
      ${insightsHTML}

      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">${T.t('recent_sessions') || 'Recent Sessions'} · Median RT</div>
        <div class="history-chart" id="history-chart"></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">${T.t('try_again') || 'Try Again'}</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">${T.t('back_to_menu') || 'Back to Menu'}</button>
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
        mode: 'classic', maxLevel, accuracy, medianRT, hardPuzzles: state.hardPuzzlesSolved, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'creative-connect', domain: 'creativity', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      hardPuzzles: state.hardPuzzlesSolved,
      hintsUsed: state.hintsUsed,
      skipsUsed: state.skipsUsed,
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
    state.hardPuzzlesSolved = 0;
    state.hintsUsed = 0;
    state.skipsUsed = 0;
    state.hintRevealed = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[CreativeConnect] Container not found'); return; }

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
    loadSettings();
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
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          revealHint();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          skipPuzzle();
          return;
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'question' || state.phase === 'countdown') {
      if (!confirm(T.t('exit_confirm') || 'Exit current session and return to menu?')) return;
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
    loadSettings();
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══════════════════════════════════════════════════════════
     EXPOSE API for extra modes
     ═══════════════════════════════════════════════════════════ */
  window.CCAPI = {
    CONFIG,
    state,
    settings: () => state.settings,

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

  window.CreativeConnectGame = {
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