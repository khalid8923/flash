/* ═══════════════════════════════════════════════════════════
   FLASH — Argument Analyzer v1.0
   Abrami, P. C., et al. (2015). Rev. Educ. Res.
   Critical Thinking · Fallacy Detection
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.ArgumentAnalyzerHelpers;
  const S = window.ArgumentAnalyzerSounds;
  const STAGES = window.ArgumentAnalyzerStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k };

  if (!H) { console.error('[ArgAna] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('argument-analyzer', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     FALLACY DEFINITIONS
     ═══════════════════════════════════════════════════════ */
  const FALLACIES = [
    { id: 'ad-hominem',       icon: '👤', name: 'Ad Hominem',          desc: 'Attacks the person, not the argument' },
    { id: 'straw-man',        icon: '🥷', name: 'Straw Man',            desc: 'Misrepresents the opponent\'s position' },
    { id: 'false-dilemma',    icon: '⚖️', name: 'False Dilemma',        desc: 'Presents only two options when more exist' },
    { id: 'slippery-slope',   icon: '⛷️', name: 'Slippery Slope',       desc: 'Claims one step leads to extreme results' },
    { id: 'appeal-authority', icon: '👔', name: 'Appeal to Authority',  desc: 'Uses authority instead of evidence' },
    { id: 'circular',         icon: '🔄', name: 'Circular Reasoning',   desc: 'The conclusion is hidden in the premise' }
  ];

  /* ═══════════════════════════════════════════════════════
     QUESTION BANK — 72 arguments (12 per fallacy)
     difficulty: 1 = easy · 2 = medium · 3 = hard
     ═══════════════════════════════════════════════════════ */
  const QUESTION_BANK = [
    /* ═══ AD HOMINEM (12) ═══ */
    { text: 'You can\'t trust his economic policy — he\'s been divorced twice.', fallacy: 'ad-hominem', difficulty: 1 },
    { text: 'Why should we listen to her about climate change? She flies on private jets.', fallacy: 'ad-hominem', difficulty: 1 },
    { text: 'Of course he supports the tax cut — he\'s rich. What did you expect?', fallacy: 'ad-hominem', difficulty: 1 },
    { text: 'Don\'t take his medical advice — look at him, he\'s overweight.', fallacy: 'ad-hominem', difficulty: 1 },
    { text: 'Her argument about education reform is worthless — she never went to college.', fallacy: 'ad-hominem', difficulty: 2 },
    { text: 'He\'s a hypocrite, so his opinion on environmentalism doesn\'t matter.', fallacy: 'ad-hominem', difficulty: 2 },
    { text: 'You\'re too young to understand politics, so your view on the voting age doesn\'t count.', fallacy: 'ad-hominem', difficulty: 2 },
    { text: 'That senator\'s speech about family values means nothing — he had an affair.', fallacy: 'ad-hominem', difficulty: 2 },
    { text: 'We can\'t take his word on immigration — his ancestors were immigrants.', fallacy: 'ad-hominem', difficulty: 3 },
    { text: 'Ignore what she says about nutrition — she\'s not even a professional athlete.', fallacy: 'ad-hominem', difficulty: 3 },
    { text: 'His book on parenting is worthless — he doesn\'t even have children.', fallacy: 'ad-hominem', difficulty: 3 },
    { text: 'Don\'t trust his financial advice — he\'s been bankrupt before.', fallacy: 'ad-hominem', difficulty: 3 },

    /* ═══ STRAW MAN (12) ═══ */
    { text: 'My opponent wants to reduce military spending. He clearly wants our country to be defenseless.', fallacy: 'straw-man', difficulty: 1 },
    { text: 'You want to regulate sugary drinks? So you want to ban all food?', fallacy: 'straw-man', difficulty: 1 },
    { text: 'She said we need more discussion before the vote. So she wants to delay it forever.', fallacy: 'straw-man', difficulty: 1 },
    { text: 'He wants to legalize some drugs. He must want everyone to become addicts.', fallacy: 'straw-man', difficulty: 1 },
    { text: 'You think we should recycle more? So you want to live in a zero-waste cave?', fallacy: 'straw-man', difficulty: 2 },
    { text: 'She supports public healthcare. She wants to abolish all private doctors.', fallacy: 'straw-man', difficulty: 2 },
    { text: 'He criticized the new policy. So he must be against progress in general.', fallacy: 'straw-man', difficulty: 2 },
    { text: 'You want to reduce the budget by 5%. You want to eliminate all funding.', fallacy: 'straw-man', difficulty: 2 },
    { text: 'She said the study had limitations. So she thinks the entire field is garbage.', fallacy: 'straw-man', difficulty: 3 },
    { text: 'He\'s against capital punishment. He thinks murderers should go free.', fallacy: 'straw-man', difficulty: 3 },
    { text: 'She wants more art programs in schools. So she thinks math and science don\'t matter.', fallacy: 'straw-man', difficulty: 3 },
    { text: 'He proposes student loan forgiveness. So he wants the government to pay for everything.', fallacy: 'straw-man', difficulty: 3 },

    /* ═══ FALSE DILEMMA (12) ═══ */
    { text: 'Either you support this bill, or you don\'t care about children.', fallacy: 'false-dilemma', difficulty: 1 },
    { text: 'You\'re either with us, or you\'re against us.', fallacy: 'false-dilemma', difficulty: 1 },
    { text: 'Either we cut taxes, or the economy will collapse.', fallacy: 'false-dilemma', difficulty: 1 },
    { text: 'You can either buy our product, or stay unhealthy forever.', fallacy: 'false-dilemma', difficulty: 1 },
    { text: 'Either we go to war now, or we\'ll face enemies on our soil.', fallacy: 'false-dilemma', difficulty: 2 },
    { text: 'You either love your country, or you criticize it — pick one.', fallacy: 'false-dilemma', difficulty: 2 },
    { text: 'Choose: work hard and be rich, or be lazy and poor.', fallacy: 'false-dilemma', difficulty: 2 },
    { text: 'Either we ban all cars in the city, or we accept pollution forever.', fallacy: 'false-dilemma', difficulty: 2 },
    { text: 'You either agree with me completely, or you\'re my enemy.', fallacy: 'false-dilemma', difficulty: 3 },
    { text: 'Either give up sugar entirely, or accept getting diabetes.', fallacy: 'false-dilemma', difficulty: 3 },
    { text: 'Either you buy insurance now, or you\'ll regret it forever.', fallacy: 'false-dilemma', difficulty: 3 },
    { text: 'You either support our troops unconditionally, or you\'re unpatriotic.', fallacy: 'false-dilemma', difficulty: 3 },

    /* ═══ SLIPPERY SLOPE (12) ═══ */
    { text: 'If we allow same-sex marriage, next people will marry their dogs.', fallacy: 'slippery-slope', difficulty: 1 },
    { text: 'If we legalize marijuana, soon all hard drugs will be legal.', fallacy: 'slippery-slope', difficulty: 1 },
    { text: 'Allow students to chew gum in class, and before you know it there\'ll be chaos.', fallacy: 'slippery-slope', difficulty: 1 },
    { text: 'If we permit one exception, then everyone will demand exceptions, and the whole system collapses.', fallacy: 'slippery-slope', difficulty: 1 },
    { text: 'Let teenagers vote in local elections, and soon they\'ll be running the country.', fallacy: 'slippery-slope', difficulty: 2 },
    { text: 'If we ban assault rifles, the government will eventually confiscate all firearms.', fallacy: 'slippery-slope', difficulty: 2 },
    { text: 'If we let people work from home one day a week, soon no one will show up at the office.', fallacy: 'slippery-slope', difficulty: 2 },
    { text: 'Give workers a minimum wage increase, and businesses will all shut down.', fallacy: 'slippery-slope', difficulty: 2 },
    { text: 'If we allow AI in classrooms, teachers will be replaced completely within a year.', fallacy: 'slippery-slope', difficulty: 3 },
    { text: 'Permit one protest without a permit, and the entire legal order crumbles.', fallacy: 'slippery-slope', difficulty: 3 },
    { text: 'If we allow remote work, cities will become ghost towns.', fallacy: 'slippery-slope', difficulty: 3 },
    { text: 'Once we allow one referendum, every minor issue will demand a national vote.', fallacy: 'slippery-slope', difficulty: 3 },

    /* ═══ APPEAL TO AUTHORITY (12) ═══ */
    { text: 'This actor endorses this vitamin, so it must work.', fallacy: 'appeal-authority', difficulty: 1 },
    { text: 'A famous scientist said this diet is best, so it\'s true.', fallacy: 'appeal-authority', difficulty: 1 },
    { text: 'The CEO of a tech company says AI will replace all jobs, so we should believe him.', fallacy: 'appeal-authority', difficulty: 1 },
    { text: 'Aristotle said heavier objects fall faster, so they must.', fallacy: 'appeal-authority', difficulty: 1 },
    { text: 'A Nobel laureate in literature supports this economic theory, so it\'s credible.', fallacy: 'appeal-authority', difficulty: 2 },
    { text: 'Oprah recommended this book, so it must be life-changing.', fallacy: 'appeal-authority', difficulty: 2 },
    { text: 'My doctor said so, so no further research is needed.', fallacy: 'appeal-authority', difficulty: 2 },
    { text: 'A billionaire investor says the market will crash, so it definitely will.', fallacy: 'appeal-authority', difficulty: 2 },
    { text: 'The coach recommends this sports drink, so it must boost performance.', fallacy: 'appeal-authority', difficulty: 3 },
    { text: 'A leading philosopher said this about quantum physics, so it must be true.', fallacy: 'appeal-authority', difficulty: 3 },
    { text: 'A famous chef says this kitchen gadget is essential, so everyone must buy it.', fallacy: 'appeal-authority', difficulty: 3 },
    { text: 'A prominent economist predicts a recession, so we should prepare for the worst.', fallacy: 'appeal-authority', difficulty: 3 },

    /* ═══ CIRCULAR REASONING (12) ═══ */
    { text: 'This book is true because it says so on the cover.', fallacy: 'circular', difficulty: 1 },
    { text: 'God exists because the Bible says so, and the Bible is the word of God.', fallacy: 'circular', difficulty: 1 },
    { text: 'He\'s the best candidate because he\'s the most qualified, and the most qualified person is the best.', fallacy: 'circular', difficulty: 1 },
    { text: 'The law is just because it\'s legal.', fallacy: 'circular', difficulty: 1 },
    { text: 'Freedom of speech is important because it\'s a fundamental right to speak freely.', fallacy: 'circular', difficulty: 2 },
    { text: 'This medicine works because it has healing properties.', fallacy: 'circular', difficulty: 2 },
    { text: 'That\'s the truth because I never lie.', fallacy: 'circular', difficulty: 2 },
    { text: 'She\'s trustworthy because she always tells the truth, and she said she\'s trustworthy.', fallacy: 'circular', difficulty: 2 },
    { text: 'The team will win because they have the winning spirit.', fallacy: 'circular', difficulty: 3 },
    { text: 'The painting is beautiful because it has beauty in it.', fallacy: 'circular', difficulty: 3 },
    { text: 'The newspaper is reliable because its editor claims it\'s the most trusted source.', fallacy: 'circular', difficulty: 3 },
    { text: 'This policy is fair because it\'s the fairest policy available.', fallacy: 'circular', difficulty: 3 }
  ];

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
    baseTime: 30000,
    minTime: 12000,
    timeStepPerLevel: 1200
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
    // Level stats
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    // Cumulative
    results: [],
    totalScore: 0,
    rtList: [],
    invalidRTs: 0,
    fallacyErrors: {},
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
  function getFallacyById(id) { return FALLACIES.find(f => f.id === id); }

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

  /* ═══ QUESTION GENERATION ═══ */
  function generateQuestion(level) {
    // Option count: 4 for levels 1-7, 6 for levels 8-15
    const optsCount = level <= 7 ? 4 : 6;

    // Difficulty range
    let dMin = 1, dMax = 2;
    if (level <= 3)      { dMin = 1; dMax = 1; }
    else if (level <= 6) { dMin = 1; dMax = 2; }
    else if (level <= 9) { dMin = 2; dMax = 3; }
    else                 { dMin = 3; dMax = 3; }

    const pool = QUESTION_BANK.filter(q => q.difficulty >= dMin && q.difficulty <= dMax);
    const picked = pool[randInt(0, pool.length - 1)];

    const correctFallacy = getFallacyById(picked.fallacy);
    const distractors = FALLACIES.filter(f => f.id !== picked.fallacy);
    const pickedDistractors = shuffle(distractors).slice(0, optsCount - 1);

    const options = shuffle([correctFallacy, ...pickedDistractors]);

    return {
      text: picked.text,
      correctFallacy: picked.fallacy,
      fallacyName: correctFallacy.name,
      options: options
    };
  }

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    if (window.ArgumentAnalyzerExtraModes && window.ArgumentAnalyzerExtraModes.abort) {
      try { window.ArgumentAnalyzerExtraModes.abort(); } catch (e) {}
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
      '<div class="phase-title">Logic Domain · Critical Thinking</div>' +
      '<h1 class="phase-headline grd">Argument Analyzer</h1>' +
      '<p class="phase-sub">' +
        'Read each argument. Identify the ' +
        '<strong style="color:#3A86FF">logical fallacy</strong> hidden inside. ' +
        'Based on Abrami et al. (2015) — Critical Thinking Framework.' +
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
          '<div class="mode-icon">⚖️</div>' +
          '<div class="mode-name">Classic</div>' +
          '<div class="mode-desc">15 levels · 5 arguments each · 3 lives</div>' +
          '<div class="mode-meta">→ Fallacy detection</div>' +
        '</div>' +
        (window.ArgumentAnalyzerExtraModes ? window.ArgumentAnalyzerExtraModes.getModeDefinitions().map(m => {
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

    if (window.ArgumentAnalyzerExtraModes && window.ArgAnaAPI) {
      window.ArgumentAnalyzerExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.ArgumentAnalyzerExtraModes.start(m.id, window.ArgAnaAPI, S, H);
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
    state.fallacyErrors = {};

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
    showCountdown(3, 'Level ' + state.level, CONFIG.trialsPerLevel + ' arguments', nextTrial);
  }

  function timeLimitForLevel(level) {
    return Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (level - 1) * CONFIG.timeStepPerLevel
    );
  }

  function nextTrial() {
    if (state.lives <= 0) { completeGame(); return; }
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    setPhase('trial');

    const timeLimit = timeLimitForLevel(state.level);
    const trial = generateQuestion(state.level);
    state.currentTrial = { ...trial, startTime: 0, timeLimit, answered: false };

    showStimulus(timeLimit);
  }

  function showStimulus(timeLimit) {
    const trial = state.currentTrial;
    trial.startTime = performance.now();

    const optionsHTML = trial.options.map((opt, i) => {
      return '' +
        '<button class="answer-btn" data-fallacy="' + opt.id + '" data-key="' + (i + 1) + '">' +
          '<span class="ab-icon">' + opt.icon + '</span>' +
          '<span class="ab-body">' +
            '<span class="ab-name">' + opt.name + '</span>' +
            '<span class="ab-desc">' + opt.desc + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    const trialInfoHTML = '' +
      '<div class="trial-info">' +
        '<span class="ti">TRIAL <span class="ti-val">' + state.trialIndex + '/' + CONFIG.trialsPerLevel + '</span></span>' +
        '<span class="ti">STREAK <span class="ti-val good">' + state.streak + '</span></span>' +
        '<span class="ti">CORRECT <span class="ti-val">' + state.levelCorrect + '</span></span>' +
      '</div>';

    render('' +
      renderProgressDots() +
      trialInfoHTML +
      '<div class="argument-card">' +
        '<div class="argument-label">Argument</div>' +
        '<div class="argument-text">' + trial.text + '</div>' +
      '</div>' +
      '<div class="answer-prompt">Identify the fallacy</div>' +
      '<div class="answer-grid">' + optionsHTML + '</div>'
    );

    if (S && S.clueReveal) S.clueReveal();

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

    const chosen = btn.dataset.fallacy;
    const correct = state.currentTrial.correctFallacy;
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
      if (b.dataset.fallacy === correct) b.classList.add('correct');
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

      if (S && S.verdict) S.verdict(); else showFeedbackFlash(true);
      haptic('correct');
      setPhase('correct');
      push(nextTrial, 900);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);

      // Track which fallacy was missed
      state.fallacyErrors[correct] = (state.fallacyErrors[correct] || 0) + 1;

      showFeedbackFlash(false);
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

    // Highlight correct
    const correct = state.currentTrial.correctFallacy;
    elContent.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.fallacy === correct) b.classList.add('correct');
    });

    state.fallacyErrors[correct] = (state.fallacyErrors[correct] || 0) + 1;

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
          state.levelCorrect + '/' + state.levelTotal + ' fallacies identified' +
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

    // Interpretation
    let interpretation = '';
    if (accuracy >= 95)      interpretation = 'Elite fallacy detection — top-tier critical thinking.';
    else if (accuracy >= 80) interpretation = 'Strong reasoning — you spot most logical errors.';
    else if (accuracy >= 60) interpretation = 'Average detection — practice refines the skill.';
    else                     interpretation = 'Review fallacy definitions — they take time to internalize.';

    // Weakest fallacy
    const weakEntries = Object.entries(state.fallacyErrors).sort((a, b) => b[1] - a[1]);
    let weakMsg = '';
    if (weakEntries.length > 0) {
      const weakId = weakEntries[0][0];
      const weakFallacy = getFallacyById(weakId);
      if (weakFallacy) {
        weakMsg = '<br><span style="color:#FFD60A">Weakest: ' + weakFallacy.name + '</span> (' + weakEntries[0][1] + ' missed)';
      }
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
        '<strong>Critical Thinking Profile</strong><br>' +
        'Arguments analyzed: <strong>' + totalTrials + '</strong> · ' +
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
        '<button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#00EEFF,#3A86FF);">Back to Menu</button>' +
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
      gameId: 'argument-analyzer',
      domain: 'logic',
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
    state.fallacyErrors = {};
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[ArgAna] Container not found'); return; }

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
        if (/^[1-6]$/.test(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = elContent.querySelectorAll('.answer-btn');
          if (btns[idx]) {
            btns[idx].click();
          }
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
    if (window.ArgumentAnalyzerExtraModes && window.ArgumentAnalyzerExtraModes.abort) {
      try { window.ArgumentAnalyzerExtraModes.abort(); } catch (e) {}
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
  window.ArgAnaAPI = {
    CONFIG,
    state,
    FALLACIES,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    haptic,

    generateQuestion,
    getFallacyById,
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

  window.ArgumentAnalyzerGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    fallacies: FALLACIES,
    questionBank: QUESTION_BANK
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();