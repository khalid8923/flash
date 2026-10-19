/* ═══════════════════════════════════════════════════════════
   FLASH — Social Read v2.0 (Full Rewrite)
   Burgoon (1994) · Kenny (1994) · Group Dynamics Decoding
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.SocialReadHelpers;
  const S = window.SocialReadSounds;
  const STAGES = window.SocialReadStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[SocialRead] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('social-read', STAGES, {
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
    baseTime: 24000,
    minTime: 12000,
    timeStepPerLevel: 750,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 120000
  };

  /* ═══ SCENES DATABASE ═══ */
  const SCENES = {
    EASY: [
      { scene: 'During a meeting, <strong>Alex</strong> is speaking. <strong>Blake</strong> interrupts twice, laughs at Alex\'s suggestions, and looks at <strong>Chris</strong> for approval each time.',
        question: 'What is the most likely social dynamic?',
        answer: 'Blake is undermining Alex while seeking Chris\'s alliance',
        distractors: ['Blake and Chris are both opposing Alex equally', 'Chris is mediating the discussion', 'Alex and Blake are old friends joking around'],
        explanation: 'The repeated approval-seeking look at Chris reveals that Blake is not alone — they are forming a coalition.',
        subtle: false },

      { scene: 'At dinner, <strong>Sam</strong> tells every story. Whenever <strong>Riley</strong> starts to speak, Sam adds a longer version of the same story. <strong>Jordan</strong> laughs at Sam\'s jokes and stops looking at Riley.',
        question: 'What is happening in the group?',
        answer: 'Sam is monopolizing status, and Jordan is following',
        distractors: ['Sam and Jordan are ganging up on Riley', 'Riley is bored of the conversation', 'They are all equals sharing stories'],
        explanation: 'Story-monopolizing plus one follower signals a dominance hierarchy forming around Sam.',
        subtle: false },

      { scene: 'Two coworkers walk into a room. <strong>Taylor</strong> sits at the head of the table. <strong>Morgan</strong> immediately moves a chair to sit diagonally from Taylor, not beside them.',
        question: 'What social positioning is Morgan using?',
        answer: 'Morgan is signaling independence, not submission',
        distractors: ['Morgan is trying to be closer to Taylor', 'Morgan is avoiding Taylor', 'Morgan is unaware of seating dynamics'],
        explanation: 'Diagonal seating in this context signals a peer relationship, not a subordinate one.',
        subtle: false },

      { scene: 'In a group chat, <strong>Casey</strong> posts an idea. <strong>Drew</strong> replies "interesting." Then <strong>Pat</strong> replies "I like it." <strong>Quinn</strong> suddenly replies "I had the same idea — Pat, remember?"',
        question: 'What is Quinn trying to do?',
        answer: 'Steal credit by inventing a prior conversation',
        distractors: ['Genuinely remembering an earlier conversation', 'Supporting Casey', 'Adding context'],
        explanation: 'Sudden "I had it too" after others approve is a common credit-stealing pattern.',
        subtle: false },

      { scene: 'At a party, <strong>Lee</strong> keeps pulling <strong>Kim</strong> aside for private conversations. Whenever <strong>Joe</strong> approaches, Lee finds a reason to move Kim elsewhere.',
        question: 'What social move is Lee making?',
        answer: 'Claiming exclusive access to Kim',
        distractors: ['Protecting Kim from Joe', 'Being shy', 'Making Joe jealous'],
        explanation: 'Repeated physical separation signals possessive alliance-building.',
        subtle: false },

      { scene: 'In a small class, the teacher always calls on <strong>Avery</strong>. When Avery answers, the teacher nods and repeats it to the class. Other hands go down.',
        question: 'What is the group becoming?',
        answer: 'Hierarchical — with Avery as the sanctioned voice',
        distractors: ['More participatory', 'More difficult for the teacher', 'Independent and critical'],
        explanation: 'Elevated one voice + everyone else withdrawing = a hierarchy forming.',
        subtle: false },

      { scene: 'A new member joins a team. <strong>Sam</strong> jokes at their expense on day one. Everyone laughs. Sam jokes again on day two. <strong>Jordan</strong> quietly does not laugh on day two.',
        question: 'What is Jordan signaling?',
        answer: 'Discomfort with the group\'s bullying direction',
        distractors: ['Boredom', 'Envy of Sam', 'Loyalty to Sam'],
        explanation: 'Quiet non-participation in repeated jokes is a common low-risk dissent.',
        subtle: false },

      { scene: 'During a group photo, <strong>Alex</strong> stands in the center. When someone asks to join, <strong>Alex</strong> shifts slightly, blocking that person\'s placement.',
        question: 'What is Alex communicating non-verbally?',
        answer: 'A subtle claim to the center role',
        distractors: ['Random positioning', 'Hostility to the newcomer', 'Nervousness'],
        explanation: 'Small blocking moves in photographs are a well-known status claim.',
        subtle: false }
    ],

    MEDIUM: [
      { scene: 'A group has two leaders, <strong>Sam</strong> and <strong>Robin</strong>, who are cordial but never agree in public. When Sam speaks, Robin writes notes. When Robin speaks, Sam checks the phone.',
        question: 'What is the most accurate description?',
        answer: 'A cold rivalry that is being carefully maintained in public',
        distractors: ['Close collaboration', 'Boredom on both sides', 'Fear of the other'],
        explanation: 'Polite disagreement + selective disengagement = rivalry kept below the surface.',
        subtle: true },

      { scene: 'A new manager joins. In the first meeting, <strong>three long-term employees</strong> answer every question between themselves, without addressing the manager. The manager listens.',
        question: 'What is the group doing?',
        answer: 'Testing the new manager by excluding them from dialogue',
        distractors: ['Showing teamwork', 'Deferring to the manager', 'Being nervous'],
        explanation: 'Peer-to-peer Q&A that ignores a leader is a classic test of authority.',
        subtle: true },

      { scene: 'Two friends invite a third to lunch. Throughout lunch, they share inside jokes. The third laughs, checks phone more often, and slowly stops initiating stories.',
        question: 'What is the third person most likely feeling?',
        answer: 'Progressively excluded',
        distractors: ['Entertained', 'Tired', 'Being polite'],
        explanation: 'Reduced initiation + phone-checking = withdrawal from a coalition they are not part of.',
        subtle: true },

      { scene: 'In a project team, <strong>Pat</strong> always agrees with the last person who speaks. <strong>Quinn</strong> asks Pat\'s opinion before meetings, then repeats it as their own.',
        question: 'What pattern is forming?',
        answer: 'Quinn is using Pat as a mouthpiece',
        distractors: ['Quinn respects Pat\'s opinions', 'Pat is the actual leader', 'Mutual collaboration'],
        explanation: 'Pre-meeting opinion-gathering plus public repetition is a subtle influence pattern.',
        subtle: true },

      { scene: 'A friend group is deciding dinner. <strong>Alex</strong> names a place. <strong>Sam</strong> says nothing. <strong>Blake</strong> suggests another. <strong>Sam</strong> immediately says "yes, good idea."',
        question: 'What is Sam doing socially?',
        answer: 'Reinforcing the Blake-Alex counter-move',
        distractors: ['Just preferring Blake\'s option', 'Being polite', 'Staying neutral'],
        explanation: 'Silence + instant support for the challenger = indirect opposition to Alex.',
        subtle: true },

      { scene: 'On a shared group project, everyone is present. <strong>Jordan</strong> quietly does most of the work. In the presentation, <strong>Sam</strong> presents all sections as "our" work and does not mention Jordan.',
        question: 'What is happening?',
        answer: 'Sam is performing leadership by absorbing collective credit',
        distractors: ['Sam is unaware of Jordan\'s effort', 'Jordan refused the credit', 'Everyone contributed equally'],
        explanation: 'Absorbing team credit through first-person plural is a subtle status move.',
        subtle: true },

      { scene: 'Two families share a picnic. All adults chat. The only child sits between the two families, facing outward. Adults keep talking over the child, occasionally patting them, never asking them anything.',
        question: 'What is the child likely experiencing?',
        answer: 'Present but not really included',
        distractors: ['Center of attention', 'Being cared for', 'Enjoying the day'],
        explanation: 'Physical touch without conversation is care without inclusion.',
        subtle: true },

      { scene: 'In a meeting, <strong>Robin</strong> proposes an idea. Everyone nods. <strong>Sam</strong> waits a beat, then restates the same idea in slightly different words. Everyone nods again and praises Sam\'s clarity.',
        question: 'What dynamic is in play?',
        answer: 'The group is treating Sam\'s version as more authoritative than Robin\'s',
        distractors: ['Robin\'s idea was unclear', 'Sam disagreed with Robin', 'The group is impartial'],
        explanation: 'Rephrasing an already-accepted idea and re-receiving credit reflects rank, not clarity.',
        subtle: true }
    ],

    HARD: [
      { scene: 'A team is celebrating a launch. <strong>Sam</strong>, the loudest in normal meetings, is silent. <strong>Robin</strong>, normally quiet, leads the toast. <strong>Pat</strong> watches Robin the entire time without drinking.',
        question: 'What is the most accurate social read?',
        answer: 'A power shift is in progress, and Pat is tracking it',
        distractors: ['Sam is just tired', 'Robin is celebrating a personal win', 'Pat is being antisocial'],
        explanation: 'Inversion of normal roles + one observer not participating = a quiet transition being read by someone else.',
        subtle: true },

      { scene: 'In a political discussion, <strong>Alex</strong> holds a strong view. <strong>Blake</strong> keeps saying "I see both sides." <strong>Chris</strong> says "I agree with Alex" but watches Blake, not Alex, while saying it.',
        question: 'What is Chris actually doing?',
        answer: 'Performing agreement while managing Blake\'s reaction',
        distractors: ['Genuinely agreeing with Alex', 'Siding with Blake', 'Staying neutral'],
        explanation: 'Eye direction during agreement reveals whose approval is actually being managed.',
        subtle: true },

      { scene: 'A couple walks in. <strong>One</strong> smiles widely at everyone in the room. <strong>The other</strong> smiles only at their partner, then immediately scans the room with a flat expression.',
        question: 'What is the most likely dynamic?',
        answer: 'One is performing public warmth; the other is guarding against threat',
        distractors: ['Both are friendly', 'One is shy, the other outgoing', 'They disagree about the party'],
        explanation: 'Public warmth + private scanning reflects two different strategies: image management vs safety monitoring.',
        subtle: true },

      { scene: 'Two colleagues are discussing a project. <strong>A</strong> uses "I" and "my team." <strong>B</strong> uses "we" and "our team." B has a more senior title.',
        question: 'What is the most accurate interpretation?',
        answer: 'A is asserting ownership while B is claiming relational power over A',
        distractors: ['A is arrogant and B is humble', 'B has no real authority', 'They disagree on the project'],
        explanation: 'Pronoun choice often tracks status strategy: personal ownership vs collective claim.',
        subtle: true },

      { scene: 'Three friends meet after years apart. <strong>X</strong> and <strong>Y</strong> immediately hug. <strong>Z</strong> shakes hands. Later, X and Y sit on one couch, Z on another. All laugh at the same jokes.',
        question: 'What is the underlying dynamic?',
        answer: 'X and Y have a stronger past bond; Z is close but structurally outside it',
        distractors: ['Z is uncomfortable with everyone', 'X and Y are excluding Z deliberately', 'Z prefers independence'],
        explanation: 'Touch rituals + seating gravity reveal a deeper history between two of the three.',
        subtle: true },

      { scene: 'At a memorial, a family gathers. <strong>One sibling</strong> stays next to the mother at all times, holding her arm. <strong>Another sibling</strong> stays ten feet away, greeting guests. <strong>The mother</strong> only looks at the second sibling when they approach.',
        question: 'What is the most accurate reading?',
        answer: 'The first sibling is fulfilling a role; the mother\'s attention is reserved for the second',
        distractors: ['The first sibling is favored', 'The second sibling is cold', 'The mother is ambivalent'],
        explanation: 'Proximity does not equal favor; gaze preference does.',
        subtle: true },

      { scene: 'A boss calls a team meeting. <strong>One employee</strong> arrives early, sits at the far end. <strong>Another employee</strong> arrives last, sits at the middle. When the boss speaks, only the middle one takes notes.',
        question: 'What is happening socially?',
        answer: 'The early-arriver is signaling disengagement; the last-arriver is performing commitment',
        distractors: ['The early one is more prepared', 'The middle one is nervous', 'Random seating patterns'],
        explanation: 'Seating + note-taking together encode positioning relative to the boss.',
        subtle: true },

      { scene: 'Two old friends and a new friend spend a weekend together. By Sunday, the two old friends are finishing each other\'s sentences; the new friend is helping with chores and taking photos.',
        question: 'What is the most accurate social read?',
        answer: 'The new friend is running for membership — not yet inside',
        distractors: ['All three are close', 'The new friend is more useful', 'The old friends are excluding the third'],
        explanation: 'Service without intimacy is the classic behavior of someone seeking inclusion.',
        subtle: true }
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
    if (level <= 4) return SCENES.EASY;
    if (level <= 9) return SCENES.MEDIUM;
    return SCENES.HARD;
  }

  function generateQuestion(level) {
    const pool = poolForLevel(level);
    const entry = pickOne(pool);
    const options = shuffle([
      { text: entry.answer, correct: true },
      ...entry.distractors.map(d => ({ text: d, correct: false }))
    ]);
    return {
      scene: entry.scene,
      question: entry.question,
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
    ex.innerHTML = `<div class="explanation-title">Social Read</div><div class="explanation-text">${q.explanation}</div>`;
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
    const pbSub = pb.bestSubtleDynamics > 0 ? pb.bestSubtleDynamics + '%' : '—';

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
      <div class="phase-title">Emotional Domain · Social Relations</div>
      <h1 class="phase-headline grd">Social Read</h1>
      <p class="phase-sub">
        A scene with multiple people appears. Identify the
        <strong style="color:#FF4D6D">underlying social dynamic</strong> —
        who is gaining power, who is excluded, who is aligned with whom.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">SUBTLE DYNAMICS</div><div class="stat-value" style="font-size:16px">${pbSub}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">👥</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 5 scenes each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.SocialReadExtraModes ? window.SocialReadExtraModes.getModeDefinitions() : []).map(m => `
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

    if (window.SocialReadExtraModes && window.SRAPI) {
      window.SocialReadExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.SocialReadExtraModes.start(m.id, window.SRAPI, S, H);
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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Read the group', nextQuestion);
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
        Scene <span class="current">${state.questionIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="scene-card">
        <div class="scene-text">${q.scene}</div>
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
      push(() => nextQuestion(), 2400);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 3000);
      else push(() => nextQuestion(), 3000);
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

    if (state.lives <= 0) push(() => completeGame(), 2800);
    else push(() => nextQuestion(), 2800);
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
      subtleDynamics: subtleAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional social intelligence (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong group dynamics intuition';
    else if (accuracy >= 50) interpretation = 'Average — normal social range';
    else interpretation = 'Surface reader — practice reading groups';

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
        <div class="stat-card"><div class="stat-label">SUBTLE DYNAMICS</div><div class="stat-value">${subtleAcc}%</div></div>
      </div>

      <div class="emo-box">
        <strong>Social Intelligence Profile</strong>
        <br>
        Subtle dynamics (coalitions, power shifts): <strong>${subtleAcc}%</strong> correct
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
        subtleDynamicsAccuracy: subtleAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'social-read', domain: 'emotional', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      subtleDynamicsAccuracy: subtleAcc,
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
    if (!root) { console.error('[SocialRead] Container not found'); return; }

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
  window.SRAPI = {
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

  window.SocialReadGame = {
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