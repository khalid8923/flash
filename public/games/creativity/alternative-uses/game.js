/* ═══════════════════════════════════════════════════════════
   FLASH — Alternative Uses v2.0 (Full Rewrite)
   Guilford (1967) · Divergent Thinking
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Stages · Missions · Badges · Sounds · Settings ·
             Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.AlternativeUsesHelpers;
  const S = window.AlternativeUsesSounds;
  const STAGES = window.AlternativeUsesStages;
  const FlashStages = window.FlashStages;

  if (!H) {
    console.error('[AlternativeUses] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('alternative-uses', STAGES, {
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
    timeStepPerLevel: 700,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 60000
  };

  /* ═══ OBJECTS DATABASE ═══ */
  const OBJECTS = {
    EASY: [
      { object: 'Brick', icon: '🧱', uses: [
        { text: 'Build a wall', novel: false },
        { text: 'Hold down a tarp', novel: false },
        { text: 'Use as a doorstop', novel: false },
        { text: 'Carve into a chess piece', novel: true }
      ]},
      { object: 'Paperclip', icon: '📎', uses: [
        { text: 'Hold papers together', novel: false },
        { text: 'Use as a bookmark', novel: false },
        { text: 'Pick a small lock', novel: false },
        { text: 'Bend into a sculpture', novel: true }
      ]},
      { object: 'Spoon', icon: '🥄', uses: [
        { text: 'Eat soup', novel: false },
        { text: 'Stir coffee', novel: false },
        { text: 'Measure ingredients', novel: false },
        { text: 'Use as a mirror', novel: true }
      ]},
      { object: 'Newspaper', icon: '📰', uses: [
        { text: 'Read the news', novel: false },
        { text: 'Wrap a gift', novel: false },
        { text: 'Line a birdcage', novel: false },
        { text: 'Roll into a sculpture', novel: true }
      ]},
      { object: 'Umbrella', icon: '☂️', uses: [
        { text: 'Protect from rain', novel: false },
        { text: 'Shade from sun', novel: false },
        { text: 'Use as a walking cane', novel: false },
        { text: 'Turn into a hanging lamp', novel: true }
      ]},
      { object: 'Pillow', icon: '🛏️', uses: [
        { text: 'Sleep on it', novel: false },
        { text: 'Support your back', novel: false },
        { text: 'Use as a cushion', novel: false },
        { text: 'Build a fort', novel: true }
      ]},
      { object: 'Bucket', icon: '🪣', uses: [
        { text: 'Carry water', novel: false },
        { text: 'Wash a car', novel: false },
        { text: 'Collect trash', novel: false },
        { text: 'Drum on it', novel: true }
      ]},
      { object: 'Bottle', icon: '🍾', uses: [
        { text: 'Store liquid', novel: false },
        { text: 'Recycle it', novel: false },
        { text: 'Use as a vase', novel: false },
        { text: 'Roll as a rolling pin', novel: true }
      ]}
    ],

    MEDIUM: [
      { object: 'Shoe', icon: '👟', uses: [
        { text: 'Wear on your foot', novel: false },
        { text: 'Store small items', novel: false },
        { text: 'Squash a bug', novel: false },
        { text: 'Hang plants from it', novel: true }
      ]},
      { object: 'Egg Carton', icon: '🥚', uses: [
        { text: 'Store eggs', novel: false },
        { text: 'Protect fragile items', novel: false },
        { text: 'Sort coins', novel: false },
        { text: 'Use as a paint palette', novel: true }
      ]},
      { object: 'Ladder', icon: '🪜', uses: [
        { text: 'Reach high shelves', novel: false },
        { text: 'Paint a wall', novel: false },
        { text: 'Fix a roof', novel: false },
        { text: 'Create a bookshelf', novel: true }
      ]},
      { object: 'Balloon', icon: '🎈', uses: [
        { text: 'Party decoration', novel: false },
        { text: 'Float in water', novel: false },
        { text: 'Play volleyball', novel: false },
        { text: 'Make a water-powered rocket', novel: true }
      ]},
      { object: 'Cardboard Box', icon: '📦', uses: [
        { text: 'Store stuff', novel: false },
        { text: 'Ship a package', novel: false },
        { text: 'Move to a new house', novel: false },
        { text: 'Turn into a robot costume', novel: true }
      ]},
      { object: 'Toothbrush', icon: '🪥', uses: [
        { text: 'Brush teeth', novel: false },
        { text: 'Clean grout', novel: false },
        { text: 'Scrub nails', novel: false },
        { text: 'Paint tiny details', novel: true }
      ]},
      { object: 'Rubber Band', icon: '🔗', uses: [
        { text: 'Bundle items', novel: false },
        { text: 'Tie hair', novel: false },
        { text: 'Hold a book closed', novel: false },
        { text: 'Launch as a slingshot', novel: true }
      ]},
      { object: 'Mug', icon: '☕', uses: [
        { text: 'Drink coffee', novel: false },
        { text: 'Store pens', novel: false },
        { text: 'Measure flour', novel: false },
        { text: 'Grow a small plant', novel: true }
      ]},
      { object: 'Towel', icon: '🧺', uses: [
        { text: 'Dry off after shower', novel: false },
        { text: 'Dry dishes', novel: false },
        { text: 'Cover a chair', novel: false },
        { text: 'Fold into a beach ball', novel: true }
      ]},
      { object: 'Glass Jar', icon: '🫙', uses: [
        { text: 'Store jam', novel: false },
        { text: 'Hold pencils', novel: false },
        { text: 'Keep coins', novel: false },
        { text: 'Make a lantern', novel: true }
      ]}
    ],

    HARD: [
      { object: 'CD', icon: '💿', uses: [
        { text: 'Play music', novel: false },
        { text: 'Backup data', novel: false },
        { text: 'Scratch a lottery ticket', novel: false },
        { text: 'Hang as a wind chime', novel: true }
      ]},
      { object: 'Wine Cork', icon: '🍷', uses: [
        { text: 'Seal a bottle', novel: false },
        { text: 'Protect furniture feet', novel: false },
        { text: 'Make a stamp', novel: false },
        { text: 'Grow tiny succulents', novel: true }
      ]},
      { object: 'Old Sock', icon: '🧦', uses: [
        { text: 'Wear it', novel: false },
        { text: 'Clean shoes', novel: false },
        { text: 'Dust a shelf', novel: false },
        { text: 'Turn into a hand puppet', novel: true }
      ]},
      { object: 'Plastic Straw', icon: '🥤', uses: [
        { text: 'Drink a beverage', novel: false },
        { text: 'Stir a cocktail', novel: false },
        { text: 'Blow air into a bag', novel: false },
        { text: 'Build a spaghetti bridge', novel: true }
      ]},
      { object: 'Stapler', icon: '📌', uses: [
        { text: 'Fasten paper', novel: false },
        { text: 'Bind a booklet', novel: false },
        { text: 'Attach tags', novel: false },
        { text: 'Use as a hole punch', novel: true }
      ]},
      { object: 'Mirror', icon: '🪞', uses: [
        { text: 'Check appearance', novel: false },
        { text: 'Reflect light', novel: false },
        { text: 'Decorate a wall', novel: false },
        { text: 'Signal for help', novel: true }
      ]},
      { object: 'Water Bottle', icon: '💧', uses: [
        { text: 'Drink water', novel: false },
        { text: 'Fill with ice', novel: false },
        { text: 'Store juice', novel: false },
        { text: 'Roll out dough', novel: true }
      ]},
      { object: 'Spoon Handle', icon: '🥄', uses: [
        { text: 'Hold the spoon', novel: false },
        { text: 'Stir a drink', novel: false },
        { text: 'Measure medicine', novel: false },
        { text: 'Use as a plant label', novel: true }
      ]},
      { object: 'Old Tire', icon: '🛞', uses: [
        { text: 'Replace a worn tire', novel: false },
        { text: 'Make a swing', novel: false },
        { text: 'Anchor a boat', novel: false },
        { text: 'Design an eco-sculpture', novel: true }
      ]},
      { object: 'Broken Clock', icon: '🕰️', uses: [
        { text: 'Tell the time (broken)', novel: false },
        { text: 'Use as decoration', novel: false },
        { text: 'Sell for parts', novel: false },
        { text: 'Transform into a lamp', novel: true }
      ]}
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
    novelPicks: 0,
    correctNovelPicks: 0,
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
    if (level <= 3) return OBJECTS.EASY;
    if (level <= 9) return OBJECTS.MEDIUM;
    return OBJECTS.HARD;
  }

  function generateQuestion(level) {
    const pool = poolForLevel(level);
    const entry = pickOne(pool);
    const uses = shuffle(entry.uses);
    return {
      object: entry.object,
      icon: entry.icon,
      uses,
      correctIdx: uses.findIndex(u => u.novel),
      explanation: 'The novel use is: "' + uses.find(u => u.novel).text + '". The other three are conventional/functional uses.'
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
      if (confirm('Reset ALL Alternative Uses progress?')) {
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
    const pbRT  = pb.bestMedianRT < 9999 ? pb.bestMedianRT + ' ms' : '—';
    const pbNR  = pb.bestNoveltyRate > 0 ? pb.bestNoveltyRate + '%' : '—';

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
      <div class="phase-title">Creativity Domain · Divergent Thinking</div>
      <h1 class="phase-headline grd">Alternative Uses</h1>
      <p class="phase-sub">
        Choose the <strong style="color:#FFD60A">most creative / novel use</strong>
        — not a conventional functional one.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">BEST NOVELTY</div><div class="stat-value" style="font-size:16px">${pbNR}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">Today's Missions</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">💡</div>
          <div class="mode-name">Classic</div>
          <div class="mode-desc">15 levels · 3 lives · Progressive difficulty</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.AlternativeUsesExtraModes ? window.AlternativeUsesExtraModes.getModeDefinitions() : []).map(m => `
          <div class="mode-card ${m.id === 'daily' ? (daily ? 'disabled' : '') : 'tier-hard'}" id="mode-${m.id}">
            ${m.id === 'daily' && daily ? '<div class="mode-badge green">✓ DONE</div>' : ''}
            <div class="mode-icon">${m.icon}</div>
            <div class="mode-name">${m.name}</div>
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

    // Wire Classic
    $('mode-classic').addEventListener('click', (e) => {
      e.stopPropagation();
      const s = snd(); if (s) s.click();
      startClassic();
    });

    // Wire Extra modes
    if (window.AlternativeUsesExtraModes && window.AUAPI) {
      window.AlternativeUsesExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.AlternativeUsesExtraModes.start(m.id, window.AUAPI, S, H);
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
    state.streak = 0; state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.novelPicks = 0;
    state.correctNovelPicks = 0;

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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Which use is the most creative?', nextQuestion);
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
        Question <span class="current">${state.questionIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="object-card">
        <div class="object-icon">${q.icon}</div>
        <div class="object-info">
          <div class="object-name">${q.object}</div>
          <div class="object-prompt">Which use is the most creative?</div>
        </div>
      </div>

      <div class="uses-grid">
        ${q.uses.map((u, i) => `
          <button class="use-btn" data-index="${i}" data-key="${i + 1}">${u.text}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.use-btn').forEach(btn => {
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
    state.novelPicks++;
    if (isCorrect) state.correctNovelPicks++;

    elContent.querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    // Explanation
    const explanation = document.createElement('div');
    explanation.className = 'explanation';
    explanation.innerHTML = `
      <div class="explanation-title">Why This Is Creative</div>
      <div class="explanation-text">${state.currentQuestion.explanation}</div>
    `;
    elContent.appendChild(explanation);

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
      push(() => nextQuestion(), 2000);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2600);
      else push(() => nextQuestion(), 2600);
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

    const correctIdx = state.currentQuestion.correctIdx;
    elContent.querySelectorAll('.use-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
    });

    const explanation = document.createElement('div');
    explanation.className = 'explanation';
    explanation.innerHTML = `
      <div class="explanation-title">The Creative Use Was</div>
      <div class="explanation-text">${state.currentQuestion.explanation}</div>
    `;
    elContent.appendChild(explanation);

    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 2400);
    else push(() => nextQuestion(), 2400);
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
    const noveltyRate = state.novelPicks > 0 ? Math.round((state.correctNovelPicks / state.novelPicks) * 100) : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, noveltyRate, rtv
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
    if (accuracy >= 85) interpretation = 'Exceptional creative recognition';
    else if (accuracy >= 70) interpretation = 'Strong divergent thinking';
    else if (accuracy >= 55) interpretation = 'Average creative flexibility';
    else interpretation = 'Practical bias — practice divergence';

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
        <div class="stat-card"><div class="stat-label">NOVELTY RATE</div><div class="stat-value">${noveltyRate}%</div></div>
      </div>

      <div class="creativity-box">
        <strong>Creative Recognition Profile</strong>
        <br>
        Novel uses identified: <strong>${totalCorrect}</strong> of ${totalTrials}
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
        mode: 'classic', maxLevel, accuracy, medianRT, noveltyRate, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'alternative-uses', domain: 'creativity', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs, noveltyRate,
      novelPicks: state.novelPicks,
      correctNovelPicks: state.correctNovelPicks,
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
    state.novelPicks = 0;
    state.correctNovelPicks = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[AlternativeUses] Container not found'); return; }

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
          const btns = elContent.querySelectorAll('.use-btn');
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
    loadSettings();
    wireSettings();
    wireBackButton();
    showIdle();
  }

  /* ═══════════════════════════════════════════════════════════
     EXPOSE API for extra modes
     ═══════════════════════════════════════════════════════════ */
  window.AUAPI = {
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

  window.AlternativeUsesGame = {
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