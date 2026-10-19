/* ═══════════════════════════════════════════════════════════
   FLASH — Idea Flow v2.0 (Full Rewrite)
   Guilford (1967) · Ideational Fluency · Divergent Thinking
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Settings · i18n · Stages · Missions · Badges ·
             Sounds · Back Button · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.IdeaFlowHelpers;
  const S = window.IdeaFlowSounds;
  const STAGES = window.IdeaFlowStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) {
    console.error('[IdeaFlow] Helpers not loaded');
    return;
  }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('idea-flow', STAGES, {
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
    trialsPerLevel: 3,
    baseRoundTime: 12000,
    minRoundTime: 7000,
    timeStepPerLevel: 350,
    itemsPerRound: 12,
    correctBase: 30,
    streakBonus: 20,
    rtMin: 100,
    rtMax: 60000
  };

  /* ═══ CATEGORY DATABASE ═══ */
  const CATEGORIES = [
    { category: 'Things that are round', icon: '⭕',
      valid: ['basketball', 'coin', 'sun', 'orange', 'clock', 'plate', 'balloon', 'wheel', 'donut', 'pizza', 'moon', 'bubble'],
      invalid: ['book', 'pencil', 'ladder', 'door', 'window', 'chair', 'table', 'key', 'phone', 'lamp', 'flag', 'umbrella'] },

    { category: 'Things that are cold', icon: '❄️',
      valid: ['ice', 'snow', 'refrigerator', 'freezer', 'winter', 'penguin', 'Antarctica', 'ice cream', 'hail', 'frost', 'popsicle', 'glacier'],
      invalid: ['sun', 'fire', 'oven', 'summer', 'desert', 'soup', 'coffee', 'sweater', 'hot sauce', 'volcano', 'lava', 'bonfire'] },

    { category: 'Things you can write with', icon: '✏️',
      valid: ['pencil', 'pen', 'marker', 'chalk', 'crayon', 'lipstick', 'finger paint', 'charcoal', 'brush', 'spray paint', 'highlighter', 'stylus'],
      invalid: ['eraser', 'ruler', 'paper', 'table', 'chair', 'calculator', 'glue', 'scissors', 'stapler', 'notebook', 'desk', 'lamp'] },

    { category: 'Things with wheels', icon: '🛞',
      valid: ['car', 'bicycle', 'skateboard', 'wheelchair', 'shopping cart', 'motorcycle', 'bus', 'train', 'scooter', 'stroller', 'truck', 'rollerblade'],
      invalid: ['table', 'chair', 'book', 'phone', 'lamp', 'cup', 'pencil', 'window', 'door', 'mirror', 'clock', 'plant'] },

    { category: 'Things that make noise', icon: '🔊',
      valid: ['bell', 'drum', 'whistle', 'siren', 'thunder', 'baby', 'alarm', 'speaker', 'crackers', 'engine', 'doorbell', 'clock'],
      invalid: ['pillow', 'blanket', 'cloud', 'shadow', 'silence', 'thought', 'ghost', 'dream', 'idea', 'book', 'sky', 'moss'] },

    { category: 'Things found in a kitchen', icon: '🍳',
      valid: ['stove', 'refrigerator', 'knife', 'spatula', 'plate', 'sink', 'oven', 'microwave', 'pan', 'cutting board', 'fork', 'kettle'],
      invalid: ['pillow', 'bed', 'sofa', 'toothbrush', 'shower', 'computer', 'desk', 'lamp', 'garden hose', 'car', 'mattress', 'TV'] },

    { category: 'Things that are soft', icon: '🪶',
      valid: ['pillow', 'cotton', 'feather', 'blanket', 'kitten', 'cloud', 'marshmallow', 'silk', 'fur', 'sponge', 'cushion', 'wool'],
      invalid: ['rock', 'metal', 'glass', 'concrete', 'iron', 'steel', 'bone', 'diamond', 'wood', 'brick', 'stone', 'shovel'] },

    { category: 'Things that are transparent', icon: '🔍',
      valid: ['glass', 'water', 'window', 'air', 'diamond', 'plastic wrap', 'lens', 'cellophane', 'ice', 'clear tape', 'acrylic', 'crystal'],
      invalid: ['wood', 'metal', 'wall', 'book', 'fabric', 'curtain', 'paper', 'rock', 'concrete', 'steel', 'cardboard', 'tile'] },

    { category: 'Things you can sit on', icon: '🪑',
      valid: ['chair', 'bench', 'sofa', 'stool', 'throne', 'couch', 'seat', 'log', 'rock', 'cushion', 'saddle', 'swing'],
      invalid: ['table', 'lamp', 'window', 'cup', 'phone', 'pencil', 'mirror', 'rug', 'fridge', 'TV', 'clock', 'flower'] },

    { category: 'Things that are heavy', icon: '⚖️',
      valid: ['elephant', 'boulder', 'car', 'whale', 'piano', 'washing machine', 'refrigerator', 'tree trunk', 'statue', 'anchor', 'brick', 'anvil'],
      invalid: ['feather', 'paper', 'bubble', 'leaf', 'balloon', 'dust', 'hair', 'smoke', 'thought', 'shadow', 'ant', 'coin'] }
  ];

  /* ═══ STATE ═══ */
  const state = {
    level: 1,
    lives: CONFIG.maxLives,
    streak: 0,
    maxStreak: 0,
    phase: 'idle',
    mode: 'idle',
    currentRound: null,
    roundIndex: 0,
    results: [],
    levelCorrect: 0,
    levelTotal: 0,
    totalScore: 0,
    fluencyTotal: 0,
    allRTs: [],
    timeoutIds: [],
    roundIntervalId: null,
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
    if (state.roundIntervalId) { clearInterval(state.roundIntervalId); state.roundIntervalId = null; }
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

  /* ═══ ROUND GENERATION ═══ */
  function generateRound(level) {
    const entry = pickOne(CATEGORIES);

    const validCount = Math.min(
      entry.valid.length,
      4 + Math.floor(level / 2)
    );
    const invalidCount = CONFIG.itemsPerRound - validCount;

    const validPicks = shuffle(entry.valid).slice(0, validCount);
    const invalidPicks = shuffle(entry.invalid).slice(0, invalidCount);

    const items = shuffle([
      ...validPicks.map(text => ({ text, valid: true })),
      ...invalidPicks.map(text => ({ text, valid: false }))
    ]);

    return {
      category: entry.category,
      icon: entry.icon,
      items,
      validCount,
      totalValid: validPicks.length
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

  /* ═══ IDLE SCREEN ═══ */
  function showIdle() {
    clearAllTimeouts();
    setPhase('idle');
    setTimer(0);
    state.mode = 'idle';

    const pb = H.getPB();
    const daily = H.isTodayDone();
    const missions = H.getTodayMissions();
    const hasHistory = H.getHistory().length > 0;

    const pbAcc = pb.bestAccuracy > 0 ? pb.bestAccuracy + '%' : '—';
    const pbFlu = pb.bestFluency > 0 ? pb.bestFluency : '—';
    const pbStr = pb.bestStreak > 0 ? pb.bestStreak : '—';

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
      <div class="phase-title">Creativity Domain · Ideational Fluency</div>
      <h1 class="phase-headline grd">Idea Flow</h1>
      <p class="phase-sub">
        A category appears. Tap as many
        <strong style="color:#00FF96">valid items</strong> as you can
        before the round timer expires.
        <br>Wrong picks cost a life. Speed matters — fluency is the score.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">BEST FLUENCY</div><div class="stat-value" style="font-size:16px">${pbFlu}</div></div>
          <div class="stat-card"><div class="stat-label">BEST STREAK</div><div class="stat-value" style="font-size:16px">${pbStr}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">🌊</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 categories each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.IdeaFlowExtraModes ? window.IdeaFlowExtraModes.getModeDefinitions() : []).map(m => `
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
        Tap valid items fast · <kbd>Space</kbd> to start classic
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

    if (window.IdeaFlowExtraModes && window.IFAPI) {
      window.IdeaFlowExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.IdeaFlowExtraModes.start(m.id, window.IFAPI, S, H);
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
    state.fluencyTotal = 0;
    state.allRTs = [];

    elLevel.textContent = '1';
    elLives.textContent = String(CONFIG.maxLives);
    elStreak.textContent = '0';
    startLevel();
  }

  function startLevel() {
    clearAllTimeouts();
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.roundIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(3, 'Level ' + state.level, 'Tap valid items fast', startRound);
  }

  function startRound() {
    if (state.roundIndex >= CONFIG.trialsPerLevel) { endLevel(); return; }

    setPhase('round');
    state.roundIndex++;

    const round = generateRound(state.level);
    const roundTime = Math.max(
      CONFIG.minRoundTime,
      CONFIG.baseRoundTime - (state.level - 1) * CONFIG.timeStepPerLevel
    );

    state.currentRound = {
      ...round,
      startTime: performance.now(),
      roundTime,
      correctPicks: 0,
      wrongPicks: 0,
      foundValidIndices: new Set(),
      ended: false
    };

    render(`
      ${renderProgressDots()}
      <div class="trial-counter">
        Category <span class="current">${state.roundIndex}</span>
        <span class="total"> / ${CONFIG.trialsPerLevel}</span>
        <span style="margin-left:14px;color:var(--t3)">Level ${state.level}</span>
      </div>

      <div class="category-card">
        <div class="category-icon">${round.icon}</div>
        <div class="category-text">${round.category}</div>
      </div>

      <div class="round-stats">
        <span class="round-stat">FOUND <span class="v good" id="stat-found">0</span></span>
        <span class="round-stat">MISSED <span class="v" id="stat-missed">${round.validCount}</span></span>
        <span class="round-stat">WRONG <span class="v bad" id="stat-wrong">0</span></span>
      </div>

      <div class="round-timer">
        <div class="round-timer-fill" id="round-timer-fill"></div>
      </div>

      <div class="items-grid" id="items-grid">
        ${round.items.map((item, i) => `
          <button class="item-btn" data-index="${i}">${item.text}</button>
        `).join('')}
      </div>
    `);

    elContent.querySelectorAll('.item-btn').forEach(btn => {
      btn.addEventListener('click', () => handleItemClick(btn));
    });

    startRoundTimer(roundTime);
  }

  function startRoundTimer(roundTime) {
    const start = performance.now();
    const fill = $('round-timer-fill');
    if (fill) fill.style.width = '100%';

    state.roundIntervalId = setInterval(() => {
      if (!state.currentRound || state.currentRound.ended) {
        clearInterval(state.roundIntervalId);
        state.roundIntervalId = null;
        return;
      }
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, roundTime - elapsed);
      const pct = (remaining / roundTime) * 100;

      if (fill) {
        fill.style.width = pct + '%';
        fill.classList.remove('warning', 'danger');
        if (pct < 30) fill.classList.add('danger');
        else if (pct < 60) fill.classList.add('warning');
      }

      setTimer(((state.roundIndex - 1) / CONFIG.trialsPerLevel) * 100 +
               ((roundTime - remaining) / roundTime) * (100 / CONFIG.trialsPerLevel));

      if (remaining <= 0) {
        clearInterval(state.roundIntervalId);
        state.roundIntervalId = null;
        endRound();
      }
    }, 60);
  }

  function handleItemClick(btn) {
    if (state.phase !== 'round') return;
    if (!state.currentRound || state.currentRound.ended) return;
    if (btn.disabled) return;

    const idx = parseInt(btn.dataset.index, 10);
    const item = state.currentRound.items[idx];

    if (state.currentRound.foundValidIndices.has(idx)) return;

    if (item.valid) {
      state.currentRound.foundValidIndices.add(idx);
      state.currentRound.correctPicks++;
      state.fluencyTotal++;

      btn.classList.add('selected-correct');
      btn.disabled = true;

      const foundEl = $('stat-found');
      const missedEl = $('stat-missed');
      if (foundEl) foundEl.textContent = String(state.currentRound.correctPicks);
      if (missedEl) missedEl.textContent = String(Math.max(0, state.currentRound.validCount - state.currentRound.correctPicks));

      state.streak++;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      state.totalScore += CONFIG.correctBase + Math.max(0, state.streak - 1) * CONFIG.streakBonus;
      elStreak.textContent = String(state.streak);

      const s = snd(); if (s && s.sparkSound) s.sparkSound();
      haptic('correct');

      if (state.currentRound.correctPicks >= state.currentRound.validCount) {
        push(() => endRound(), 250);
      }
    } else {
      state.currentRound.wrongPicks++;
      state.streak = 0;
      elStreak.textContent = '0';

      btn.classList.add('selected-wrong');
      btn.disabled = true;

      const wrongEl = $('stat-wrong');
      if (wrongEl) wrongEl.textContent = String(state.currentRound.wrongPicks);

      state.lives--;
      elLives.textContent = String(state.lives);

      const s = snd(); if (s) s.miss();
      haptic('wrong');

      if (state.lives <= 0) {
        push(() => {
          if (state.roundIntervalId) { clearInterval(state.roundIntervalId); state.roundIntervalId = null; }
          if (state.currentRound) state.currentRound.ended = true;
          completeGame();
        }, 700);
      }
    }
  }

  function endRound() {
    if (!state.currentRound || state.currentRound.ended) return;
    state.currentRound.ended = true;
    if (state.roundIntervalId) { clearInterval(state.roundIntervalId); state.roundIntervalId = null; }

    state.levelCorrect += state.currentRound.correctPicks;
    state.levelTotal += state.currentRound.validCount;

    if (state.lives <= 0) {
      push(() => completeGame(), 500);
      return;
    }

    setPhase('correct');
    render(`
      ${renderProgressDots()}
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">Category Complete</h2>
      <p class="phase-sub">
        You found <strong style="color:#00FF96">${state.currentRound.correctPicks}</strong>
        of ${state.currentRound.validCount} valid items.
      </p>
      <p class="phase-hint">${state.roundIndex < CONFIG.trialsPerLevel ? 'Next category...' : 'Level complete'}</p>
    `);

    push(() => {
      if (state.roundIndex >= CONFIG.trialsPerLevel) endLevel();
      else startRound();
    }, 1200);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.55
    });

    if (accuracy >= 0.55) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">
          Fluency: ${state.levelCorrect}/${state.levelTotal} valid items found
          (${Math.round(accuracy * 100)}%)
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
          ${state.levelCorrect}/${state.levelTotal} found — need 55% to pass.
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
    const totalPossible = state.results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
    const maxLevel = state.results.length;

    const fluency = state.fluencyTotal;
    const rcs = H.rcs(fluency, state.allRTs.length ? state.allRTs : [1]);

    const sessionPayload = {
      mode: 'classic', accuracy, fluency, rcs,
      maxStreak: state.maxStreak
    };
    const newRecords = H.checkAndUpdatePB(sessionPayload);
    const hasNewPB = Object.keys(newRecords).length > 0;
    sessionPayload.isNewPB = hasNewPB;
    if (hasNewPB) { const s = snd(); if (s) s.personalBest(); }

    const newBadges = H.checkAndUnlockBadges('classic', { maxLevel, accuracy, fluency });
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
    if (accuracy >= 80) interpretation = 'Exceptional ideational fluency (top 10%)';
    else if (accuracy >= 65) interpretation = 'Strong creative fluency';
    else if (accuracy >= 50) interpretation = 'Average — normal fluency range';
    else interpretation = 'Low fluency — practice divergent generation';

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
        <div class="stat-card"><div class="stat-label">FLUENCY</div><div class="stat-value">${fluency}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">SCORE</div><div class="stat-value">${state.totalScore}</div></div>
      </div>

      <div class="creativity-box">
        <strong>Ideational Fluency Profile</strong>
        <br>
        Total valid items found: <strong>${fluency}</strong> of ${totalPossible}
        <br>
        Max streak: ${state.maxStreak}
        <br>
        <span style="color:var(--cyan)">${interpretation}</span>
      </div>

      ${insightsHTML}

      <div style="width:min(640px,94vw);margin:20px 0 6px;text-align:left;">
        <div style="font-family:var(--f-m);font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Recent Sessions · Fluency</div>
        <div class="history-chart" id="history-chart"></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="big-btn" id="restart-btn">Try Again</button>
        <button class="big-btn" id="back-menu-btn" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    push(() => {
      const c = $('history-chart');
      if (c) H.renderChart(c, history, 'fluency');
    }, 100);

    $('restart-btn').addEventListener('click', (e) => { e.stopPropagation(); startClassic(); });
    $('back-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); showIdle(); });

    if (FlashStages) {
      FlashStages.checkSession({
        mode: 'classic', maxLevel, accuracy, fluency,
        maxStreak: state.maxStreak, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'idea-flow', domain: 'creativity', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      fluency, maxStreak: state.maxStreak,
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
    state.levelCorrect = 0; state.levelTotal = 0;
    state.totalScore = 0;
    state.fluencyTotal = 0;
    state.currentRound = null;
    state.roundIndex = 0;
    state.allRTs = [];
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[IdeaFlow] Container not found'); return; }

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
      }
    });
  }

  function handleBackClick() {
    if (state.phase === 'idle' && state.mode === 'idle') return;
    if (state.phase === 'round' || state.phase === 'countdown') {
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
  window.IFAPI = {
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

    generateRound,
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

  window.IdeaFlowGame = {
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