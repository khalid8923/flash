/* ═══════════════════════════════════════════════════════════
   FLASH — Micro Expressions v2.0 (Full Rewrite)
   Ekman & Friesen (1969) · Micro-Expression Recognition
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.MicroExpressionsHelpers;
  const S = window.MicroExpressionsSounds;
  const STAGES = window.MicroExpressionsStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[MicroExpressions] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('micro-expressions', STAGES, {
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
    trialsPerLevel: 6,
    baseStimDuration: 1200,
    minStimDuration: 350,
    baseTime: 12000,
    minTime: 6000,
    timeStepPerLevel: 400,
    correctBase: 100,
    streakBonus: 40,
    timeBonusMax: 100,
    rtMin: 100,
    rtMax: 30000
  };

  /* ═══ EMOTIONS ═══ */
  const EMOTIONS = {
    HAPPY: {
      label: 'Happy', icon: '😊',
      browY: -4, browAngle: 0,
      eyeOpen: 0.85, eyeNarrow: 0.7,
      mouthCurve: 1, mouthOpen: 0.35,
      cheekRaise: -6
    },
    SAD: {
      label: 'Sad', icon: '😢',
      browY: -8, browAngle: -12,
      eyeOpen: 0.75, eyeNarrow: 0.9,
      mouthCurve: -1, mouthOpen: 0.05,
      cheekRaise: 0
    },
    ANGRY: {
      label: 'Angry', icon: '😠',
      browY: 4, browAngle: 15,
      eyeOpen: 0.6, eyeNarrow: 1.1,
      mouthCurve: -0.6, mouthOpen: 0.15,
      cheekRaise: 0
    },
    SURPRISED: {
      label: 'Surprised', icon: '😲',
      browY: -12, browAngle: 0,
      eyeOpen: 1.3, eyeNarrow: 1.3,
      mouthCurve: 0, mouthOpen: 1,
      cheekRaise: 0
    },
    FEARFUL: {
      label: 'Fearful', icon: '😨',
      browY: -10, browAngle: -8,
      eyeOpen: 1.25, eyeNarrow: 1.1,
      mouthCurve: -0.3, mouthOpen: 0.5,
      cheekRaise: 0
    },
    DISGUSTED: {
      label: 'Disgusted', icon: '🤢',
      browY: 3, browAngle: -8,
      eyeOpen: 0.7, eyeNarrow: 1.15,
      mouthCurve: -0.5, mouthOpen: 0.2,
      cheekRaise: 6
    }
  };

  const EMOTION_KEYS = Object.keys(EMOTIONS);
  const HARD_EMOTIONS = ['FEARFUL', 'DISGUSTED', 'SAD'];

  /* ═══ SVG FACE RENDERER ═══ */
  function renderFace(emotionKey, skinTone = '#F5CBA7') {
    const e = EMOTIONS[emotionKey];
    const W = 200, H = 200;
    const cx = W / 2, cy = H / 2;
    const faceR = 78;
    const eyeY = cy - 12;
    const eyeXOffset = 32;
    const eyeRx = 10 * e.eyeOpen;
    const eyeRy = 12 * e.eyeOpen;
    const browY = eyeY - 22 + e.browY;
    const browLeftStart = cx - eyeXOffset - 18;
    const browLeftEnd   = cx - eyeXOffset + 18;
    const browRightStart = cx + eyeXOffset - 18;
    const browRightEnd   = cx + eyeXOffset + 18;
    const browAngleLeft = -e.browAngle;
    const browAngleRight = e.browAngle;

    function browPath(sx, ex, y, angle) {
      const dx = ex - sx;
      const dy = (dx / 2) * Math.tan(angle * Math.PI / 180);
      const my = y + dy;
      return `M ${sx} ${y} Q ${(sx + ex) / 2} ${my} ${ex} ${y}`;
    }

    const mouthY = cy + 38;
    const mouthW = 44;
    const mouthCurveY = mouthY + (e.mouthCurve * 12);
    const mouthOpenH = 8 + e.mouthOpen * 22;
    const noseY = cy + 10;

    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="faceGrad${emotionKey}" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="${skinTone}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${skinTone}" stop-opacity="0.85"/>
          </radialGradient>
        </defs>

        <ellipse cx="${cx}" cy="${cy}" rx="${faceR}" ry="${faceR}" fill="url(#faceGrad${emotionKey})" stroke="rgba(0,0,0,.15)" stroke-width="2"/>

        ${e.cheekRaise !== 0 ? `
          <circle cx="${cx - 45}" cy="${cy + 15}" r="12" fill="#FFB3A0" opacity="0.4"/>
          <circle cx="${cx + 45}" cy="${cy + 15}" r="12" fill="#FFB3A0" opacity="0.4"/>
        ` : ''}

        <path d="${browPath(browLeftStart, browLeftEnd, browY, browAngleLeft)}" stroke="#4A3A2E" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="${browPath(browRightStart, browRightEnd, browY, browAngleRight)}" stroke="#4A3A2E" stroke-width="5" fill="none" stroke-linecap="round"/>

        <ellipse cx="${cx - eyeXOffset}" cy="${eyeY}" rx="${eyeRx + 4}" ry="${eyeRy + 2}" fill="#FFFFFF"/>
        <ellipse cx="${cx + eyeXOffset}" cy="${eyeY}" rx="${eyeRx + 4}" ry="${eyeRy + 2}" fill="#FFFFFF"/>

        <ellipse cx="${cx - eyeXOffset}" cy="${eyeY}" rx="${4 * e.eyeNarrow}" ry="${6 * e.eyeNarrow}" fill="#1A1A1A"/>
        <ellipse cx="${cx + eyeXOffset}" cy="${eyeY}" rx="${4 * e.eyeNarrow}" ry="${6 * e.eyeNarrow}" fill="#1A1A1A"/>

        ${e.eyeNarrow > 1 ? `
          <ellipse cx="${cx - eyeXOffset}" cy="${eyeY - eyeRy - 2}" rx="${eyeRx + 4}" ry="3" fill="${skinTone}"/>
          <ellipse cx="${cx + eyeXOffset}" cy="${eyeY - eyeRy - 2}" rx="${eyeRx + 4}" ry="3" fill="${skinTone}"/>
        ` : ''}

        <path d="M ${cx} ${noseY - 8} L ${cx} ${noseY + 6} Q ${cx} ${noseY + 10} ${cx - 4} ${noseY + 8}" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none" stroke-linecap="round"/>

        ${e.mouthOpen < 0.05 ? `
          <path d="M ${cx - mouthW/2} ${mouthY} Q ${cx} ${mouthCurveY} ${cx + mouthW/2} ${mouthY}" stroke="#8B1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        ` : `
          <ellipse cx="${cx}" cy="${(mouthY + mouthCurveY) / 2}" rx="${mouthW / 2}" ry="${mouthOpenH / 2}" fill="#8B1A1A"/>
          ${e.mouthOpen > 0.4 ? `<ellipse cx="${cx}" cy="${(mouthY + mouthCurveY) / 2 + 2}" rx="${mouthW / 3}" ry="${mouthOpenH / 4}" fill="#6B0F0F"/>` : ''}
        `}
      </svg>
    `;
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
    hardEmotionCorrect: 0,
    hardEmotionTotal: 0,
    timeoutIds: [],
    timerIntervalId: null,
    stimulusTimerId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }
    if (state.stimulusTimerId) { clearTimeout(state.stimulusTimerId); state.stimulusTimerId = null; }
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

  function stimDurationForLevel(level) {
    const d = CONFIG.baseStimDuration - (level - 1) * 60;
    return Math.max(CONFIG.minStimDuration, d);
  }

  function generateQuestion(level) {
    const emotionKey = pickOne(EMOTION_KEYS);
    const isHard = HARD_EMOTIONS.includes(emotionKey) && level > 6;

    const others = EMOTION_KEYS.filter(k => k !== emotionKey);
    const distractors = shuffle(others).slice(0, 3);

    const options = shuffle([
      { key: emotionKey, correct: true },
      ...distractors.map(k => ({ key: k, correct: false }))
    ]);

    return {
      emotionKey,
      options,
      correctIdx: options.findIndex(o => o.correct),
      isHard
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
  function revealFace(q) {
    const optionsGrid = elContent.querySelector('.options-grid');
    if (optionsGrid) {
      optionsGrid.insertAdjacentHTML('beforebegin',
        `<div class="face-display">${renderFace(q.emotionKey)}</div>`);
    }
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
    const pbHard = pb.bestHardEmotion > 0 ? pb.bestHardEmotion + '%' : '—';

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
      <div class="phase-title">Emotional Domain · Micro-Expression Recognition</div>
      <h1 class="phase-headline grd">Micro Expressions</h1>
      <p class="phase-sub">
        A face will flash briefly. Identify the
        <strong style="color:#FF4D6D">emotion</strong> it showed.
        <br>Stimulus duration shrinks as levels increase.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
          <div class="stat-card"><div class="stat-label">HARD EMOTIONS</div><div class="stat-value" style="font-size:16px">${pbHard}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">😮</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 6 faces each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.MicroExpressionsExtraModes ? window.MicroExpressionsExtraModes.getModeDefinitions() : []).map(m => `
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

    if (window.MicroExpressionsExtraModes && window.MEAPI) {
      window.MicroExpressionsExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.MicroExpressionsExtraModes.start(m.id, window.MEAPI, S, H);
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
    state.hardEmotionCorrect = 0;
    state.hardEmotionTotal = 0;

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
    showCountdown(3, 'Level ' + state.level + ' · Get Ready', 'Watch carefully', nextTrial);
  }

  function nextTrial() {
    if (state.trialIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('ready');
    state.trialIndex++;

    const q = generateQuestion(state.level);
    state.currentTrial = { ...q, startTime: 0, answered: false };

    const stimDur = stimDurationForLevel(state.level);

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Face <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      <div class="stimulus-blank">⌛</div>
      <p class="phase-hint" style="margin-top:10px;">Face appearing...</p>
    `);

    push(() => {
      setPhase('stimulus');
      render(`
        ${renderProgressDots()}
        <div class="trial-counter">
          Face <span class="current">${state.trialIndex}</span>
          <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        </div>
        <div class="face-display">${renderFace(q.emotionKey)}</div>
      `);

      state.stimulusTimerId = setTimeout(() => {
        showAnswerOptions(q);
      }, stimDur);
    }, 350);
  }

  function showAnswerOptions(q) {
    setPhase('question');

    const timeLimit = Math.max(
      CONFIG.minTime,
      CONFIG.baseTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    state.currentTrial.startTime = performance.now();
    state.currentTrial.timeLimit = timeLimit;

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Face <span class="current">${state.trialIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>
      <p class="phase-sub" style="margin-bottom:16px;">What emotion did you see?</p>
      <div class="options-grid">
        ${q.options.map((o, i) => {
          const e = EMOTIONS[o.key];
          return `
            <button class="option-btn" data-index="${i}" data-key="${i + 1}">
              <span class="em-icon">${e.icon}</span>
              ${e.label}
            </button>
          `;
        }).join('')}
      </div>
    `);

    elContent.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn));
    });

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
    if (state.phase !== 'question' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    if (state.timerIntervalId) { clearInterval(state.timerIntervalId); state.timerIntervalId = null; }

    const chosenIdx = parseInt(btn.dataset.index, 10);
    const correctIdx = state.currentTrial.correctIdx;
    const elapsed = performance.now() - state.currentTrial.startTime;
    const isCorrect = chosenIdx === correctIdx;
    const isValid = elapsed >= CONFIG.rtMin && elapsed <= CONFIG.rtMax;
    if (!isValid) state.invalidRTs++;

    state.levelTotal++;
    if (isValid) state.levelTotalTime += elapsed;
    if (isValid) state.allRTs.push(elapsed);

    if (state.currentTrial.isHard) {
      state.hardEmotionTotal++;
      if (isCorrect) state.hardEmotionCorrect++;
    }

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.index, 10);
      if (idx === correctIdx) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    revealFace(state.currentTrial);
    showFeedbackFlash(isCorrect);
    haptic(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      state.levelCorrect++;
      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      const timeBonus = isValid ? Math.round((1 - elapsed / state.currentTrial.timeLimit) * CONFIG.timeBonusMax) : 0;
      const streakBonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
      state.totalScore += CONFIG.correctBase + Math.max(0, timeBonus) + streakBonus;

      elStreak.textContent = String(state.streak);
      setPhase('correct');
      push(() => nextTrial(), 1400);
    } else {
      state.streak = 0;
      elStreak.textContent = '0';
      state.lives--;
      elLives.textContent = String(state.lives);
      setPhase('wrong');
      if (state.lives <= 0) push(() => completeGame(), 2000);
      else push(() => nextTrial(), 2000);
    }
  }

  function handleTimeout() {
    if (state.phase !== 'question' || !state.currentTrial || state.currentTrial.answered) return;
    state.currentTrial.answered = true;
    state.levelTotal++;
    state.levelTotalTime += state.currentTrial.timeLimit;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    elContent.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.index, 10) === state.currentTrial.correctIdx) b.classList.add('correct');
    });

    revealFace(state.currentTrial);
    showFeedbackFlash(false);
    haptic('wrong');
    setPhase('wrong');

    if (state.lives <= 0) push(() => completeGame(), 1800);
    else push(() => nextTrial(), 1800);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      avgTime: Math.round(state.levelTotalTime / Math.max(1, state.levelTotal)),
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
          · Avg: ${Math.round(state.levelTotalTime / Math.max(1, state.levelTotal))} ms
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
    const hardAcc = state.hardEmotionTotal > 0
      ? Math.round((state.hardEmotionCorrect / state.hardEmotionTotal) * 100)
      : 0;

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      hardEmotion: hardAcc
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
    if (accuracy >= 80) interpretation = 'Exceptional emotional sensitivity';
    else if (accuracy >= 65) interpretation = 'Strong emotion recognition';
    else if (accuracy >= 50) interpretation = 'Average — normal range';
    else interpretation = 'Low sensitivity — practice recommended';

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
        <div class="stat-card"><div class="stat-label">HARD EMOTIONS</div><div class="stat-value">${hardAcc}%</div></div>
      </div>

      <div class="emo-box">
        <strong>Emotional Sensitivity Profile</strong>
        <br>
        Hard emotions (fear, disgust, sadness): <strong>${hardAcc}%</strong> correct
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
        hardEmotionAccuracy: hardAcc, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'micro-expressions', domain: 'emotional', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      hardEmotionAccuracy: hardAcc,
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
    state.currentTrial = null;
    state.trialIndex = 0;
    state.allRTs = [];
    state.invalidRTs = 0;
    state.hardEmotionCorrect = 0;
    state.hardEmotionTotal = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[MicroExpressions] Container not found'); return; }

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
    if (state.phase === 'question' || state.phase === 'countdown' || state.phase === 'stimulus' || state.phase === 'ready') {
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
  window.MEAPI = {
    CONFIG,
    state,
    EMOTIONS,
    EMOTION_KEYS,
    HARD_EMOTIONS,

    settings: () => FS ? FS.get() : {},

    render,
    setPhase,
    setTimer,
    showFeedbackFlash,
    showCountdown,
    showLevelUpFlash,
    haptic,

    renderFace,
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

  window.MicroExpressionsGame = {
    mount,
    reset: resetGame,
    state,
    config: CONFIG,
    renderFace
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();