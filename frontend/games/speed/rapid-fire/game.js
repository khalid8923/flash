/* ═══════════════════════════════════════════════════════════
   FLASH — Rapid Fire v1.0
   Speed Domain · Monsell (2003) Task-Switching Paradigm
   10 rules · Switch Cost · Speed pressure
   Modes: Classic · Speed · Endless · Precision · Daily
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.RapidFireHelpers;
  const S = window.RapidFireSounds;
  const STAGES = window.RapidFireStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[RapidFire] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('rapid-fire', STAGES, {
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
    trialsPerLevel: 14,
    baseTime: 3500,
    minTime: 1000,
    timeStepPerLevel: 160,
    cueDuration: 500,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 3000,
    passThreshold: 0.7
  };

  /* ═══════════════════════════════════════════════════════════
     THE 10 RULES
     Each rule has:
       - key: unique id
       - name: display name (EN)
       - nameAR: display name (AR)
       - generate(level): returns { stimulusHTML, correctAnswer, options }
     ═══════════════════════════════════════════════════════════ */
  const RULES = [

    /* ─── 1. ODD / EVEN ─── */
    {
      key: 'odd-even',
      name: 'ODD or EVEN?',
      nameAR: 'فردي أم زوجي؟',
      generate: function (level) {
        const n = randInt(1, level < 5 ? 20 : 99);
        const isOdd = n % 2 === 1;
        return {
          stimulusHTML: `<div class="rf-stim-text">${n}</div>`,
          correctAnswer: isOdd ? 0 : 1,
          options: [
            { label: 'ODD',  labelAR: 'فردي',  value: 0, icon: '1️⃣' },
            { label: 'EVEN', labelAR: 'زوجي',  value: 1, icon: '2️⃣' }
          ]
        };
      }
    },

    /* ─── 2. ABOVE / BELOW 50 ─── */
    {
      key: 'above-below-50',
      name: 'ABOVE or BELOW 50?',
      nameAR: 'أعلى أم أقل من 50؟',
      generate: function (level) {
        const n = randInt(1, 99);
        const isAbove = n > 50;
        return {
          stimulusHTML: `<div class="rf-stim-text">${n}</div>`,
          correctAnswer: isAbove ? 0 : 1,
          options: [
            { label: 'ABOVE 50', labelAR: 'أعلى',  value: 0, icon: '⬆️' },
            { label: 'BELOW 50', labelAR: 'أقل',   value: 1, icon: '⬇️' }
          ]
        };
      }
    },

    /* ─── 3. HIGHER / LOWER (compare 2 numbers) ─── */
    {
      key: 'higher-lower',
      name: 'Which is HIGHER?',
      nameAR: 'أيهما الأعلى؟',
      generate: function (level) {
        let a = randInt(1, 50);
        let b = randInt(1, 50);
        let guard = 0;
        while (a === b && guard < 20) { b = randInt(1, 50); guard++; }
        if (a === b) b = a + 1;
        const leftHigher = a > b;
        return {
          stimulusHTML: `
            <div class="rf-stim-pair">
              <div class="rf-stim-text">${a}</div>
              <div class="rf-stim-text" style="color:var(--t3);font-size:40px;">vs</div>
              <div class="rf-stim-text">${b}</div>
            </div>`,
          correctAnswer: leftHigher ? 0 : 1,
          options: [
            { label: 'LEFT',  labelAR: 'اليسار',  value: 0, icon: '⬅️' },
            { label: 'RIGHT', labelAR: 'اليمين',  value: 1, icon: '➡️' }
          ]
        };
      }
    },

    /* ─── 4. PRIME / COMPOSITE ─── */
    {
      key: 'prime-composite',
      name: 'PRIME or COMPOSITE?',
      nameAR: 'أولي أم مركب؟',
      generate: function (level) {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
        const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30];
        const isPrime = Math.random() < 0.5;
        const n = isPrime ? pickOne(primes) : pickOne(composites);
        return {
          stimulusHTML: `<div class="rf-stim-text">${n}</div>`,
          correctAnswer: isPrime ? 0 : 1,
          options: [
            { label: 'PRIME',     labelAR: 'أولي',  value: 0, icon: '🔷' },
            { label: 'COMPOSITE', labelAR: 'مركب',  value: 1, icon: '🔶' }
          ]
        };
      }
    },

    /* ─── 5. DIVISIBLE BY 3? ─── */
    {
      key: 'divisible-3',
      name: 'DIVISIBLE BY 3?',
      nameAR: 'يقبل القسمة على 3؟',
      generate: function (level) {
        const isDivisible = Math.random() < 0.5;
        let n;
        if (isDivisible) {
          n = randInt(1, 30) * 3;
        } else {
          do { n = randInt(1, 99); } while (n % 3 === 0);
        }
        return {
          stimulusHTML: `<div class="rf-stim-text">${n}</div>`,
          correctAnswer: isDivisible ? 0 : 1,
          options: [
            { label: 'YES', labelAR: 'نعم',  value: 0, icon: '✓' },
            { label: 'NO',  labelAR: 'لا',   value: 1, icon: '✕' }
          ]
        };
      }
    },

    /* ─── 6. SINGLE / DOUBLE DIGIT ─── */
    {
      key: 'single-double-digit',
      name: 'SINGLE or DOUBLE digit?',
      nameAR: 'خانة أم خانتين؟',
      generate: function (level) {
        const isSingle = Math.random() < 0.5;
        const n = isSingle ? randInt(1, 9) : randInt(10, 99);
        return {
          stimulusHTML: `<div class="rf-stim-text">${n}</div>`,
          correctAnswer: isSingle ? 0 : 1,
          options: [
            { label: '1-DIGIT', labelAR: 'خانة',   value: 0, icon: '1️⃣' },
            { label: '2-DIGIT', labelAR: 'خانتين', value: 1, icon: '2️⃣' }
          ]
        };
      }
    },

    /* ─── 7. VOWEL / CONSONANT ─── */
    {
      key: 'vowel-consonant',
      name: 'VOWEL or CONSONANT?',
      nameAR: 'متحرك أم ساكن؟',
      generate: function (level) {
        const vowels = 'AEIOU';
        const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
        const isVowel = Math.random() < 0.5;
        const letter = isVowel
          ? vowels[randInt(0, vowels.length - 1)]
          : consonants[randInt(0, consonants.length - 1)];
        return {
          stimulusHTML: `<div class="rf-stim-text">${letter}</div>`,
          correctAnswer: isVowel ? 0 : 1,
          options: [
            { label: 'VOWEL',     labelAR: 'متحرك',  value: 0, icon: '🅰️' },
            { label: 'CONSONANT', labelAR: 'ساكن',   value: 1, icon: '🅱️' }
          ]
        };
      }
    },

    /* ─── 8. RED / BLUE COLOR ─── */
    {
      key: 'color-red-blue',
      name: 'RED or BLUE?',
      nameAR: 'أحمر أم أزرق؟',
      generate: function (level) {
        const isRed = Math.random() < 0.5;
        const color = isRed ? '#FF3355' : '#3A86FF';
        return {
          stimulusHTML: `<div class="rf-stim-circle" style="background:${color};color:${color};"></div>`,
          correctAnswer: isRed ? 0 : 1,
          options: [
            { label: 'RED',  labelAR: 'أحمر',  value: 0, icon: '🔴' },
            { label: 'BLUE', labelAR: 'أزرق',  value: 1, icon: '🔵' }
          ]
        };
      }
    },

    /* ─── 9. SAME / DIFFERENT (two letters) ─── */
    {
      key: 'same-different',
      name: 'SAME or DIFFERENT?',
      nameAR: 'متشابه أم مختلف؟',
      generate: function (level) {
        const letters = 'ABCDEFGH';
        const a = letters[randInt(0, letters.length - 1)];
        let b;
        const same = Math.random() < 0.5;
        if (same) {
          b = a;
        } else {
          do { b = letters[randInt(0, letters.length - 1)]; } while (b === a);
        }
        return {
          stimulusHTML: `
            <div class="rf-stim-pair">
              <div class="rf-stim-text" style="color:var(--cyan);">${a}</div>
              <div class="rf-stim-text" style="color:var(--t3);font-size:40px;">·</div>
              <div class="rf-stim-text" style="color:var(--pink);">${b}</div>
            </div>`,
          correctAnswer: same ? 0 : 1,
          options: [
            { label: 'SAME',      labelAR: 'متشابه', value: 0, icon: '=' },
            { label: 'DIFFERENT', labelAR: 'مختلف',  value: 1, icon: '≠' }
          ]
        };
      }
    },

    /* ─── 10. UP / DOWN ARROW ─── */
    {
      key: 'arrow-direction',
      name: 'UP or DOWN?',
      nameAR: 'أعلى أم أسفل؟',
      generate: function (level) {
        const isUp = Math.random() < 0.5;
        const arrow = isUp ? '↑' : '↓';
        const color = isUp ? '#00FF96' : '#FF6B35';
        return {
          stimulusHTML: `<div class="rf-stim-arrow" style="color:${color};">${arrow}</div>`,
          correctAnswer: isUp ? 0 : 1,
          options: [
            { label: 'UP',   labelAR: 'أعلى',  value: 0, icon: '⬆️' },
            { label: 'DOWN', labelAR: 'أسفل',  value: 1, icon: '⬇️' }
          ]
        };
      }
    }
  ];

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentTrial: null,
    lastRuleKey: null,
    trialIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    totalScore: 0,
    allRTs: [],
    invalidRTs: 0,
    switchRTs: [],
    repeatRTs: [],
    switchTotal: 0,
    repeatTotal: 0,
    timeoutIds: [],
    cueTimerId: null,
    timerIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.cueTimerId) { clearTimeout(state.cueTimerId); state.cueTimerId = null; }
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function push(fn, d) { const id = setTimeout(fn, d); state.timeoutIds.push(id); return id; }

  function responseTimeForLevel(level) {
    return Math.max(CONFIG.minTime, CONFIG.baseTime - (level - 1) * CONFIG.timeStepPerLevel);
  }

  /* ═══ TRIAL GENERATOR (used by classic + extra modes) ═══ */
  function generateTrial(level, lastRuleKey) {
    // Pick a rule (avoid same as last if possible)
    let rule;
    let attempts = 0;
    do {
      rule = pickOne(RULES);
      attempts++;
    } while (rule.key === lastRuleKey && attempts < 10);

    const isSwitch = lastRuleKey !== null && rule.key !== lastRuleKey;
    const gen = rule.generate(level);

    return {
      ruleKey: rule.key,
      ruleName: rule.name,
      ruleNameAR: rule.nameAR,
      stimulusHTML: gen.stimulusHTML,
      correctAnswer: gen.correctAnswer,
      options: gen.options,
      isSwitch: isSwitch
    };
  }

  /* ═══ RENDER TRIAL (used by classic + extra modes) ═══ */
  function renderTrial(trial, headerHTML) {
    const isRTL = T.getLang && T.getLang() === 'ar';
    const ruleDisplay = isRTL ? trial.ruleNameAR : trial.ruleName;
    const switchBadge = trial.isSwitch
      ? `<span class="rf-cue-badge switch">SWITCH</span>`
      : `<span class="rf-cue-badge">REPEAT</span>`;
    const cueClass = trial.isSwitch ? 'switch' : 'repeat';

    return `
      <div class="rf-cue ${cueClass}">${ruleDisplay} ${switchBadge}</div>
      ${headerHTML || ''}
      <div class="rf-stimulus">${trial.stimulusHTML}</div>
      <div class="rf-answer-row">
        ${trial.options.map((opt, i) => {
          const label = isRTL && opt.labelAR ? opt.labelAR : opt.label;
          return `
            <button class="rf-btn" data-value="${opt.value}">
              <span class="rf-btn-icon">${opt.icon}</span>
              <span>${label}</span>
              <span class="rf-key-hint">[${i + 1}]</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
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
    const pbSwitch = pb.bestSwitchCost > 0 ? pb.bestSwitchCost + ' ms' : '—';

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

    const extraModesHTML = (window.RapidFireExtraModes
      ? window.RapidFireExtraModes.getModeDefinitions() : []
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
      <div class="phase-title">Speed Domain · Task-Switching</div>
      <h1 class="phase-headline grd">Rapid Fire</h1>
      <p class="phase-sub">
        A rule appears — <strong style="color:#FF6B35">apply it fast</strong>.
        The rule <strong style="color:#FFD60A">changes often</strong>.
        <br>10 different rules · 3 lives · 14 trials per level.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">SWITCH COST</div><div class="stat-value" style="font-size:16px">${pbSwitch}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🔥</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 14 trials · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${extraModesHTML}
      </div>

      <p class="phase-hint" style="margin-top:6px;">
        <kbd>1</kbd> Left · <kbd>2</kbd> Right · <kbd>Space</kbd> to start
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

    if (window.RapidFireExtraModes && window.RFAPI) {
      window.RapidFireExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.RapidFireExtraModes.start(m.id, window.RFAPI, S, H);
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
    state.switchRTs = [];
    state.repeatRTs = [];
    state.switchTotal = 0;
    state.repeatTotal = 0;
    state.lastRuleKey = null;

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
    showCountdown(3, `Level ${state.level} · Get Ready`, 'Apply the rule fast', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    state.trialIndex++;
    const trial = generateTrial(state.level, state.lastRuleKey);
    state.lastRuleKey = trial.ruleKey;
    state.currentTrial = { ...trial, startTime: 0, answered: false, timeLimit: 0 };

    showTrial();
  }

  function showTrial() {
    const trial = state.currentTrial;
    const timeLimit = responseTimeForLevel(state.level);
    trial.timeLimit = timeLimit;

    setPhase('trial');
    const headerHTML = `
      ${renderProgressDots()}
      <div class="trial-counter">
        Trial <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
    `;
    render(renderTrial(trial, headerHTML));

    if (trial.isSwitch) {
      const s = snd(); if (s && s.ruleChange) s.ruleChange();
    } else {
      const s = snd(); if (s && s.stimulusAppear) s.stimulusAppear();
    }

    elContent.querySelectorAll('.rf-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

    trial.startTime = performance.now();
    startResponseTimer(timeLimit);
  }

  function startResponseTimer(timeLimit) {
    const start = performance.now();
    setTimer(100);

    state.timerIntervalId = setInterval(() => {
      if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        return;
      }
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct = (remaining / timeLimit) * 100;
      let lvl = 'normal';
      if (pct < 50) lvl = 'warning';
      if (pct < 20) {
        lvl = 'danger';
        const s = snd(); if (s && s.timeWarning && Math.random() < 0.15) s.timeWarning();
      }
      setTimer(pct, lvl);

      if (remaining <= 0) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
        handleTimeout();
      }
    }, 30);
  }

  function handleAnswer(btn) {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosen = parseInt(btn.dataset.value, 10);
    const trial = state.currentTrial;
    const isCorrect = chosen === trial.correctAnswer;
    const elapsed = performance.now() - trial.startTime;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    recordTrial(trial, isCorrect, elapsed, isValid);

    elContent.querySelectorAll('.rf-btn').forEach(b => {
      b.disabled = true;
      const v = parseInt(b.dataset.value, 10);
      if (v === trial.correctAnswer) b.classList.add('correct');
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
      push(nextTrial, 400);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
      if (state.lives <= 0) push(completeGame, 1000);
      else push(nextTrial, 1000);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'trial' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    const trial = state.currentTrial;

    recordTrial(trial, false, trial.timeLimit, false);

    elContent.querySelectorAll('.rf-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.value, 10) === trial.correctAnswer) b.classList.add('correct');
    });

    showFeedbackFlash(false);
    const s = snd(); if (s) s.miss();
    haptic('wrong');
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);
    setPhase('feedback');
    if (state.lives <= 0) push(completeGame, 1000);
    else push(nextTrial, 1000);
  }

  function recordTrial(trial, isCorrect, rt, isValidRT) {
    state.levelTotal++;
    if (isValidRT) state.levelTotalTime += rt;
    if (isValidRT && isCorrect) state.allRTs.push(rt);

    if (trial.isSwitch) {
      state.switchTotal++;
      if (isCorrect && isValidRT) state.switchRTs.push(rt);
    } else {
      state.repeatTotal++;
      if (isCorrect && isValidRT) state.repeatRTs.push(rt);
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
      }, 1200);
    } else {
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('feedback');
      const s = snd(); if (s) s.gameOver();
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon bad">✕</div>
        <h2 class="phase-headline" style="color:#FF3355">Level Failed</h2>
        <p class="phase-sub">
          ${state.levelCorrect}/${state.levelTotal} correct — need 70% to pass.
          <br><strong>${state.lives}</strong> ${state.lives === 1 ? 'life' : 'lives'} remaining.
        </p>
      `);
      push(() => {
        if (state.lives > 0) startLevel();
        else completeGame();
      }, 1600);
    }
  }

  /* ═══ COMPLETE GAME ═══ */
  function computeSwitchCost() {
    const rMed = H.median(state.repeatRTs);
    const sMed = H.median(state.switchRTs);
    if (!rMed || !sMed) return 0;
    return Math.max(0, Math.round(sMed - rMed));
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
    const switchCost = computeSwitchCost();

    const repeatRT = H.median(state.repeatRTs);
    const switchRT = H.median(state.switchRTs);

    const sessionPayload = {
      mode: 'classic',
      accuracy,
      medianRT,
      rtv,
      rcs,
      switchCost,
      repeatRT,
      switchRT,
      maxStreak: state.maxStreak
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

    let switchInterpretation = '';
    if (switchCost >= 200) switchInterpretation = 'High switch cost — you lose time when rules change.';
    else if (switchCost >= 80) switchInterpretation = 'Moderate switch cost — typical range.';
    else if (switchCost > 0) switchInterpretation = 'Very low switch cost — elite flexibility!';
    else switchInterpretation = 'Insufficient data to compute switch cost.';

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
        <div class="stat-card"><div class="stat-label">SWITCH COST</div><div class="stat-value">${switchCost}<span style="font-size:11px;color:var(--t2)">ms</span></div></div>
      </div>

      <div class="switch-box">
        <strong>Task-Switching Profile</strong>
        <br>
        Switch cost: <strong>${switchCost} ms</strong> — ${switchInterpretation}
        <br>
        Repeat RT: <strong>${repeatRT || '—'} ms</strong> · Switch RT: <strong>${switchRT || '—'} ms</strong>
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
        switchCost,
        maxStreak: state.maxStreak,
        isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'rapid-fire',
      domain: 'speed',
      mode: 'classic',
      maxLevel,
      accuracy,
      score: state.totalScore,
      medianRT,
      rtv,
      rcs,
      switchCost,
      repeatRT,
      switchRT,
      maxStreak: state.maxStreak,
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
    state.lastRuleKey = null;
    state.trialIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.switchRTs = [];
    state.repeatRTs = [];
    state.switchTotal = 0;
    state.repeatTotal = 0;

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
    if (!root) { console.error('[RapidFire] Container not found'); return; }

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

      if (state.phase === 'trial') {
        if (e.key === '1' || e.key === '2') {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = elContent.querySelectorAll('.rf-btn');
          if (btns[idx] && !btns[idx].disabled) btns[idx].click();
        }
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'trial' || state.phase === 'countdown') {
      if (!confirm('Exit current session and return to menu?')) return;
    }
    const s = snd(); if (s) s.click();
    clearAllTimeouts();
    if (window.RapidFireExtraModes && window.RapidFireExtraModes.abort) {
      window.RapidFireExtraModes.abort();
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
  window.RFAPI = {
    CONFIG,
    state,
    RULES,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    generateTrial,
    renderTrial,
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

  window.RapidFireGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    generateTrial,
    renderTrial,
    RULES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();