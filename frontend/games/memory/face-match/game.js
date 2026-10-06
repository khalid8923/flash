/* ═══════════════════════════════════════════════════════════
   FLASH — Face Match v1.0
   Naveh-Benjamin (2000) · Associative Memory (face-name)
   Modes: Classic · Speed · Endless · Precision · Daily
   Features: Procedural SVG faces · Uniqueness validation ·
             40-name pool · Encode/Recall phases · Settings ·
             i18n · Stages · postMessage
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.FaceMatchHelpers;
  const S = window.FaceMatchSounds;
  const STAGES = window.FaceMatchStages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k, setLang: () => {}, getLang: () => 'en' };

  if (!H) { console.error('[FaceMatch] Helpers not loaded'); return; }

  /* ═══ INIT STAGES ═══ */
  if (FlashStages && STAGES) {
    FlashStages.init('face-match', STAGES, {
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
    roundsPerLevel: 3,
    startFaces: 3,
    maxFaces: 8,
    baseEncodeTime: 1400,
    minEncodeTime: 700,
    correctBase: 100,
    streakBonus: 40,
    faceBonus: 20,
    rtMin: 200,
    rtMax: 120000
  };

  /* ═══ NAME POOL (40 names — Arabic, English, Japanese mix) ═══ */
  const NAMES = [
    // Arabic
    'Ahmed', 'Fatima', 'Karim', 'Layla', 'Omar', 'Yasmin', 'Hassan', 'Nour',
    // English
    'James', 'Emma', 'Oliver', 'Sophia', 'Liam', 'Mia', 'Noah', 'Ava',
    'Ethan', 'Isabella', 'Lucas', 'Charlotte',
    // Japanese
    'Kenji', 'Yuki', 'Hiro', 'Sakura', 'Takeshi', 'Aiko', 'Ren', 'Hana',
    // European
    'Luca', 'Elena', 'Marco', 'Sofia', 'Pierre', 'Camille', 'Lars', 'Ingrid',
    // Diverse
    'Zara', 'Nadia', 'Priya', 'Ravi'
  ];

  /* ═══ FACE FEATURE POOLS ═══ */
  const BG_COLORS = [
    '#1a2c4e', '#2c1a4e', '#4e1a2c', '#1a4e2c',
    '#4e3d1a', '#1a3d4e', '#3d1a4e', '#4e1a3d'
  ];
  const SKIN_TONES = [
    '#F5CBA7', '#E8B89D', '#D4A574', '#B8865C',
    '#8B6F47', '#6B4F37', '#FFDBAC', '#C68642'
  ];
  const HAIR_COLORS = [
    '#2C1810', '#4A2C1A', '#6B4423', '#8B6914',
    '#D4AF37', '#FF6B35', '#1A1A1A', '#F4E4D4',
    '#8B4513', '#B22222'
  ];
  const HAIR_STYLES = ['short', 'long', 'bald', 'ponytail', 'bun', 'curly'];
  const EYE_STYLES = ['dot', 'almond', 'wide'];
  const MOUTH_STYLES = ['smile', 'neutral', 'open'];
  const ACCESSORIES = ['none', 'glasses', 'beard', 'glasses-beard'];

  /* ═══ SVG FACE RENDERER ═══ */
  function renderFace(face) {
    const W = 200, H = 200;
    const cx = W / 2, cy = H / 2;
    const faceR = 78;
    const eyeY = cy - 12;
    const eyeXOffset = 32;

    const skin = face.skin;
    const hairColor = face.hairColor;
    const hairStyle = face.hairStyle;
    const eyeStyle = face.eyeStyle;
    const mouthStyle = face.mouthStyle;
    const accessory = face.accessory;

    let parts = '';

    // Background circle
    parts += `<circle cx="${cx}" cy="${cy}" r="${faceR + 8}" fill="${face.bg}" opacity="0.35"/>`;

    // Face base
    parts += `<ellipse cx="${cx}" cy="${cy}" rx="${faceR}" ry="${faceR * 1.05}" fill="${skin}" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>`;

    // Hair (behind face for long, above for short)
    if (hairStyle === 'long') {
      parts += `<path d="M ${cx - faceR - 4} ${cy - 20} Q ${cx - faceR - 8} ${cy + faceR} ${cx - faceR + 10} ${cy + faceR * 1.1} L ${cx + faceR - 10} ${cy + faceR * 1.1} Q ${cx + faceR + 8} ${cy + faceR} ${cx + faceR + 4} ${cy - 20} Q ${cx} ${cy - faceR - 12} ${cx - faceR - 4} ${cy - 20} Z" fill="${hairColor}"/>`;
    }

    // Hair top
    if (hairStyle !== 'bald') {
      if (hairStyle === 'curly') {
        // Multiple circles
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI - Math.PI;
          const hx = cx + Math.cos(angle) * (faceR * 0.85);
          const hy = cy - faceR * 0.55 + Math.sin(angle) * 15;
          parts += `<circle cx="${hx}" cy="${hy}" r="22" fill="${hairColor}"/>`;
        }
      } else if (hairStyle === 'ponytail') {
        // Top + side tail
        parts += `<path d="M ${cx - faceR} ${cy - 18} Q ${cx - faceR + 8} ${cy - faceR - 12} ${cx} ${cy - faceR - 6} Q ${cx + faceR - 8} ${cy - faceR - 12} ${cx + faceR} ${cy - 18} Q ${cx + faceR} ${cy - faceR * 0.4} ${cx + faceR - 4} ${cy - 8} L ${cx - faceR + 4} ${cy - 8} Z" fill="${hairColor}"/>`;
        parts += `<ellipse cx="${cx + faceR + 6}" cy="${cy - 20}" rx="14" ry="32" fill="${hairColor}"/>`;
      } else if (hairStyle === 'bun') {
        parts += `<path d="M ${cx - faceR} ${cy - 20} Q ${cx} ${cy - faceR - 16} ${cx + faceR} ${cy - 20} Q ${cx + faceR - 6} ${cy - faceR * 0.3} ${cx + faceR - 4} ${cy - 8} L ${cx - faceR + 4} ${cy - 8} Z" fill="${hairColor}"/>`;
        parts += `<circle cx="${cx}" cy="${cy - faceR - 14}" r="20" fill="${hairColor}"/>`;
      } else {
        // short / long (long already added behind)
        parts += `<path d="M ${cx - faceR} ${cy - 20} Q ${cx - faceR + 6} ${cy - faceR - 10} ${cx} ${cy - faceR - 4} Q ${cx + faceR - 6} ${cy - faceR - 10} ${cx + faceR} ${cy - 20} Q ${cx + faceR - 4} ${cy - faceR * 0.2} ${cx + faceR - 4} ${cy - 8} L ${cx - faceR + 4} ${cy - 8} Q ${cx - faceR + 4} ${cy - faceR * 0.2} ${cx - faceR} ${cy - 20} Z" fill="${hairColor}"/>`;
      }
    }

    // Eyes
    const eyeRxBase = 10, eyeRyBase = 12;
    const eyeRx = eyeStyle === 'wide' ? eyeRxBase * 1.25 : eyeStyle === 'almond' ? eyeRxBase * 0.95 : eyeRxBase;
    const eyeRy = eyeStyle === 'wide' ? eyeRyBase * 1.15 : eyeStyle === 'almond' ? eyeRyBase * 0.75 : eyeRyBase;

    parts += `<ellipse cx="${cx - eyeXOffset}" cy="${eyeY}" rx="${eyeRx + 3}" ry="${eyeRy + 2}" fill="#FFFFFF"/>`;
    parts += `<ellipse cx="${cx + eyeXOffset}" cy="${eyeY}" rx="${eyeRx + 3}" ry="${eyeRy + 2}" fill="#FFFFFF"/>`;

    if (eyeStyle === 'dot') {
      parts += `<circle cx="${cx - eyeXOffset}" cy="${eyeY}" r="5" fill="#1A1A1A"/>`;
      parts += `<circle cx="${cx + eyeXOffset}" cy="${eyeY}" r="5" fill="#1A1A1A"/>`;
    } else if (eyeStyle === 'almond') {
      parts += `<ellipse cx="${cx - eyeXOffset}" cy="${eyeY}" rx="4.5" ry="6" fill="#1A1A1A"/>`;
      parts += `<ellipse cx="${cx + eyeXOffset}" cy="${eyeY}" rx="4.5" ry="6" fill="#1A1A1A"/>`;
    } else {
      parts += `<circle cx="${cx - eyeXOffset}" cy="${eyeY}" r="6" fill="#1A1A1A"/>`;
      parts += `<circle cx="${cx + eyeXOffset}" cy="${eyeY}" r="6" fill="#1A1A1A"/>`;
    }

    // Eyebrows
    parts += `<path d="M ${cx - eyeXOffset - 14} ${eyeY - 22} Q ${cx - eyeXOffset} ${eyeY - 26} ${cx - eyeXOffset + 14} ${eyeY - 22}" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    parts += `<path d="M ${cx + eyeXOffset - 14} ${eyeY - 22} Q ${cx + eyeXOffset} ${eyeY - 26} ${cx + eyeXOffset + 14} ${eyeY - 22}" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>`;

    // Nose
    parts += `<path d="M ${cx} ${cy - 4} L ${cx} ${cy + 12} Q ${cx} ${cy + 18} ${cx - 5} ${cy + 15}" stroke="rgba(0,0,0,.28)" stroke-width="2" fill="none" stroke-linecap="round"/>`;

    // Mouth
    const mouthY = cy + 38;
    if (mouthStyle === 'smile') {
      parts += `<path d="M ${cx - 20} ${mouthY - 4} Q ${cx} ${mouthY + 8} ${cx + 20} ${mouthY - 4}" stroke="#8B1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (mouthStyle === 'neutral') {
      parts += `<path d="M ${cx - 18} ${mouthY} L ${cx + 18} ${mouthY}" stroke="#8B1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else {
      parts += `<ellipse cx="${cx}" cy="${mouthY + 2}" rx="14" ry="10" fill="#8B1A1A"/>`;
      parts += `<ellipse cx="${cx}" cy="${mouthY + 4}" rx="8" ry="5" fill="#6B0F0F"/>`;
    }

    // Beard (before glasses so glasses draw on top)
    if (accessory === 'beard' || accessory === 'glasses-beard') {
      parts += `<path d="M ${cx - 40} ${cy + 18} Q ${cx - 34} ${cy + 62} ${cx} ${cy + 74} Q ${cx + 34} ${cy + 62} ${cx + 40} ${cy + 18} Q ${cx + 30} ${cy + 42} ${cx} ${cy + 46} Q ${cx - 30} ${cy + 42} ${cx - 40} ${cy + 18} Z" fill="${hairColor}" opacity="0.9"/>`;
      parts += `<ellipse cx="${cx}" cy="${mouthY + 4}" rx="14" ry="10" fill="${skin}" opacity="0.4"/>`;
    }

    // Glasses
    if (accessory === 'glasses' || accessory === 'glasses-beard') {
      parts += `<circle cx="${cx - eyeXOffset}" cy="${eyeY}" r="${eyeRx + 8}" fill="none" stroke="#1A1A1A" stroke-width="2.5" opacity="0.85"/>`;
      parts += `<circle cx="${cx + eyeXOffset}" cy="${eyeY}" r="${eyeRx + 8}" fill="none" stroke="#1A1A1A" stroke-width="2.5" opacity="0.85"/>`;
      parts += `<line x1="${cx - eyeXOffset + eyeRx + 8}" y1="${eyeY}" x2="${cx + eyeXOffset - eyeRx - 8}" y2="${eyeY}" stroke="#1A1A1A" stroke-width="2.5" opacity="0.85"/>`;
    }

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${parts}</svg>`;
  }

  /* ═══ FACE FEATURE GENERATION ═══ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function randomFaceFeatures() {
    return {
      bg: pickOne(BG_COLORS),
      skin: pickOne(SKIN_TONES),
      hairColor: pickOne(HAIR_COLORS),
      hairStyle: pickOne(HAIR_STYLES),
      eyeStyle: pickOne(EYE_STYLES),
      mouthStyle: pickOne(MOUTH_STYLES),
      accessory: pickOne(ACCESSORIES)
    };
  }

  function featureDistance(a, b) {
    let diff = 0;
    if (a.bg !== b.bg) diff++;
    if (a.skin !== b.skin) diff++;
    if (a.hairColor !== b.hairColor) diff++;
    if (a.hairStyle !== b.hairStyle) diff++;
    if (a.eyeStyle !== b.eyeStyle) diff++;
    if (a.mouthStyle !== b.mouthStyle) diff++;
    if (a.accessory !== b.accessory) diff++;
    return diff;
  }

  function generateUniqueFaces(count) {
    // Pick unique names
    const names = shuffle(NAMES.slice()).slice(0, count);

    const faces = [];
    let guard = 0;
    while (faces.length < count && guard < 500) {
      guard++;
      const feat = randomFaceFeatures();

      // Check that this face is ≥2 features different from ALL existing faces
      let ok = true;
      for (const f of faces) {
        if (featureDistance(feat, f) < 2) { ok = false; break; }
      }
      if (!ok) continue;

      faces.push({
        ...feat,
        name: names[faces.length]
      });
    }

    // Fallback: if not enough unique faces, add with 1-feature distance
    while (faces.length < count) {
      const feat = randomFaceFeatures();
      faces.push({
        ...feat,
        name: names[faces.length] || pickOne(NAMES)
      });
    }

    return faces;
  }

  function pickDistractors(targetFace, allFaces, count) {
    // Pick names from OTHER faces as distractors
    const otherNames = allFaces
      .filter(f => f.name !== targetFace.name)
      .map(f => f.name);

    const distractorPool = shuffle(otherNames);

    // If we don't have enough, pull from the full NAMES pool
    if (distractorPool.length < count) {
      const extraNames = shuffle(NAMES.filter(n => n !== targetFace.name));
      for (const n of extraNames) {
        if (!distractorPool.includes(n)) distractorPool.push(n);
        if (distractorPool.length >= count) break;
      }
    }

    return distractorPool.slice(0, count);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ═══ RENDER HELPERS ═══ */
  function facesForLevel(level) {
    return Math.min(CONFIG.maxFaces, CONFIG.startFaces + Math.floor((level - 1) / 2));
  }

  function encodeDurationForLevel(level) {
    return Math.max(
      CONFIG.minEncodeTime,
      CONFIG.baseEncodeTime - (level - 1) * 45
    );
  }

  function renderEncodePhase(faces, badgeHTML, hudHTML, encodeDur) {
    const cols = faces.length <= 4 ? 2 : 3;
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="encode-grid cols-${cols}">
        ${faces.map(f => `
          <div class="face-card">
            <div class="face-svg-wrap">${renderFace(f)}</div>
            <div class="face-name">${f.name}</div>
          </div>
        `).join('')}
      </div>
      <p class="phase-hint">Memorize each face and name...</p>
    `;
  }

  function renderRecallPhase(face, options, badgeHTML, hudHTML) {
    return `
      ${badgeHTML || ''}
      ${hudHTML || ''}
      <div class="recall-wrap">
        <div class="recall-face">${renderFace(face)}</div>
        <div class="options-grid">
          ${options.map((name, i) => `
            <button class="option-btn" data-name="${name}" data-key="${i + 1}">${name}</button>
          `).join('')}
        </div>
      </div>
      <p class="phase-hint">Which name belongs to this face?</p>
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
    currentRound: null,
    roundIndex: 0,
    levelCorrect: 0,
    levelTotal: 0,
    levelTotalTime: 0,
    results: [],
    totalScore: 0,
    allRTs: [],
    maxFacesReached: 0,
    timeoutIds: [],
    onComplete: null
  };

  const $ = (id) => document.getElementById(id);
  let elStage, elLevel, elStreak, elLives, elContent, elTimerFill;

  /* ═══ UTILITIES ═══ */
  function clearAllTimeouts() {
    state.timeoutIds.forEach(clearTimeout);
    state.timeoutIds = [];
  }
  function push(fn, d) {
    const id = setTimeout(fn, d);
    state.timeoutIds.push(id);
    return id;
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
  function setTimer(pct, level) {
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
  function showExplanation(text) {
    const ex = document.createElement('div');
    ex.className = 'explanation';
    ex.innerHTML = `<div class="explanation-title">Recall</div><div class="explanation-text">${text}</div>`;
    elContent.appendChild(ex);
  }

  /* ═══ IDLE ═══ */
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
    const pbFaces = pb.bestMaxFaces > 0 ? pb.bestMaxFaces : '—';
    const pbRT = pb.bestMedianRT < 99999 ? pb.bestMedianRT + ' ms' : '—';

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
      <div class="phase-title">Memory Domain · Associative Memory</div>
      <h1 class="phase-headline grd">Face Match</h1>
      <p class="phase-sub">
        Faces with names appear. After they hide,
        match each face to its <strong style="color:#00EEFF">correct name</strong>.
        <br>Span grows with each level.
      </p>

      ${hasHistory ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(500px,90vw);margin:14px 0;">
          <div class="stat-card"><div class="stat-label">BEST ACC</div><div class="stat-value" style="font-size:16px">${pbAcc}</div></div>
          <div class="stat-card"><div class="stat-label">MAX FACES</div><div class="stat-value" style="font-size:16px">${pbFaces}</div></div>
          <div class="stat-card"><div class="stat-label">BEST MEDIAN</div><div class="stat-value" style="font-size:16px">${pbRT}</div></div>
        </div>` : ''}

      <div class="stages-card" id="stages-container"></div>

      <div class="missions-card">
        <div class="missions-title">${T.t('todays_missions') || "Today's Missions"}</div>
        ${missionHTML}
      </div>

      <div class="mode-grid-4">
        <div class="mode-card" id="mode-classic">
          <div class="mode-icon">👤</div>
          <div class="mode-name">${T.t('mode_classic') || 'Classic'}</div>
          <div class="mode-desc">15 levels · 3 rounds each · 3 lives</div>
          <div class="mode-meta">→ Standard assessment</div>
        </div>
        ${(window.FaceMatchExtraModes ? window.FaceMatchExtraModes.getModeDefinitions() : []).map(m => `
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

    if (window.FaceMatchExtraModes && window.FMAPI) {
      window.FaceMatchExtraModes.getModeDefinitions().forEach(m => {
        const el = $('mode-' + m.id);
        if (!el) return;
        if (m.id === 'daily' && daily) return;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = snd(); if (s) s.click();
          window.FaceMatchExtraModes.start(m.id, window.FMAPI, S, H);
        });
      });
    }
  }

  /* ═══ CLASSIC ═══ */
  function startClassic() {
    state.mode = 'classic';
    state.level = 1;
    state.lives = CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.totalScore = 0;
    state.allRTs = [];
    state.maxFacesReached = 0;

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
    state.roundIndex = 0;

    elLevel.textContent = String(state.level);
    setPhase('countdown');
    showCountdown(
      3,
      'Level ' + state.level,
      facesForLevel(state.level) + ' faces',
      nextRound
    );
  }

  function nextRound() {
    if (state.roundIndex >= CONFIG.roundsPerLevel) { endLevel(); return; }
    if (state.lives <= 0) { completeGame(); return; }

    state.roundIndex++;
    const count = facesForLevel(state.level);
    state.maxFacesReached = Math.max(state.maxFacesReached, count);

    const faces = generateUniqueFaces(count);
    state.currentRound = {
      faces,
      startTime: performance.now()
    };

    startEncodePhase();
  }

  function startEncodePhase() {
    setPhase('encode');
    const faces = state.currentRound.faces;
    const encodeDur = encodeDurationForLevel(state.level);

    const badge = `<div class="practice-badge">Round ${state.roundIndex} / ${CONFIG.roundsPerLevel}</div>`;
    const hud = `
      <div class="round-info">
        <span class="ri">FACES <span class="ri-val">${faces.length}</span></span>
        <span class="ri">ROUND <span class="ri-val">${state.roundIndex}/${CONFIG.roundsPerLevel}</span></span>
      </div>
    `;

    render(renderEncodePhase(faces, badge, hud, encodeDur));

    let idx = 0;
    function step() {
      if (state.phase !== 'encode') return;
      if (idx >= faces.length) {
        startRecallPhase();
        return;
      }
      if (S && S.faceShow) S.faceShow();
      idx++;
      push(step, encodeDur);
    }

    push(step, 400);
  }

  function startRecallPhase() {
    const faces = state.currentRound.faces;
    const queue = shuffle(faces.slice());
    let userIdx = 0;
    const recallStart = performance.now();

    function nextRecall() {
      if (state.phase !== 'recall' && state.phase !== 'encode') return;
      if (userIdx >= queue.length) {
        // Round success
        handleRoundSuccess(performance.now() - recallStart);
        return;
      }

      const face = queue[userIdx];
      const distractors = pickDistractors(face, faces, 3);
      const options = shuffle([face.name, ...distractors]);

      setPhase('recall');
      const badge = `<div class="practice-badge">Round ${state.roundIndex} / ${CONFIG.roundsPerLevel}</div>`;
      const hud = `
        <div class="round-info">
          <span class="ri">FACE <span class="ri-val">${userIdx + 1}/${queue.length}</span></span>
          <span class="ri">ROUND <span class="ri-val">${state.roundIndex}/${CONFIG.roundsPerLevel}</span></span>
        </div>
      `;

      render(renderRecallPhase(face, options, badge, hud));

      const btns = elContent.querySelectorAll('.option-btn');
      btns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          const chosen = options[i];
          const isCorrect = chosen === face.name;

          btns.forEach((b, j) => {
            b.disabled = true;
            if (options[j] === face.name) b.classList.add('correct');
            else if (b === btn) b.classList.add('wrong');
          });

          showFeedbackFlash(isCorrect);
          haptic(isCorrect ? 'correct' : 'wrong');

          if (!isCorrect) {
            showExplanation(`Correct: <strong>${face.name}</strong>`);
            push(() => handleRoundFail(), 900);
            return;
          }

          userIdx++;
          push(nextRecall, 500);
        });
      });
    }

    nextRecall();
  }

  function handleRoundSuccess(rt) {
    state.levelCorrect++;
    state.levelTotal++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    elStreak.textContent = String(state.streak);

    if (rt >= CONFIG.rtMin && rt <= CONFIG.rtMax) state.allRTs.push(rt);
    state.levelTotalTime += rt;

    const count = state.currentRound.faces.length;
    state.totalScore += CONFIG.correctBase + (state.streak - 1) * CONFIG.streakBonus + count * CONFIG.faceBonus;

    if (S) S.hit();
    haptic('correct');
    setPhase('correct');

    push(() => {
      if (state.roundIndex >= CONFIG.roundsPerLevel) endLevel();
      else nextRound();
    }, 700);
  }

  function handleRoundFail() {
    state.levelTotal++;
    state.streak = 0;
    elStreak.textContent = '0';
    state.lives--;
    elLives.textContent = String(state.lives);

    if (S) S.miss();
    haptic('wrong');
    setPhase('wrong');

    push(() => {
      if (state.lives <= 0) completeGame();
      else if (state.roundIndex >= CONFIG.roundsPerLevel) endLevel();
      else nextRound();
    }, 1200);
  }

  function endLevel() {
    clearAllTimeouts();
    const accuracy = state.levelTotal > 0 ? state.levelCorrect / state.levelTotal : 0;

    state.results.push({
      level: state.level,
      correct: state.levelCorrect,
      total: state.levelTotal,
      passed: accuracy >= 0.6,
      faces: facesForLevel(state.level)
    });

    if (accuracy >= 0.6) {
      const s = snd(); if (s) s.levelUp();
      setPhase('correct');
      render(`
        ${renderProgressDots()}
        <div class="feedback-icon good">✓</div>
        <h2 class="phase-headline grd">Level ${state.level} Passed</h2>
        <p class="phase-sub">${state.levelCorrect}/${state.levelTotal} rounds at ${facesForLevel(state.level)} faces</p>
        <p class="phase-hint">${state.level < CONFIG.maxLevel ? 'Next: ' + facesForLevel(state.level + 1) + ' faces' : 'You reached the top!'}</p>
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

    const sessionPayload = {
      mode: 'classic', accuracy, medianRT, rcs, rtv,
      maxFaces: state.maxFacesReached
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
    if (state.maxFacesReached >= 6) interpretation = 'Exceptional associative memory — top 10%.';
    else if (state.maxFacesReached >= 5) interpretation = 'Strong face-name binding.';
    else if (state.maxFacesReached >= 3) interpretation = 'Average — normal range.';
    else interpretation = 'Associative span below typical range.';

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
        <div class="stat-card"><div class="stat-label">MAX FACES</div><div class="stat-value">${state.maxFacesReached}</div></div>
        <div class="stat-card"><div class="stat-label">ACCURACY</div><div class="stat-value">${accuracy}%</div></div>
        <div class="stat-card"><div class="stat-label">MEDIAN RT</div><div class="stat-value">${medianRT || '—'}</div></div>
      </div>

      <div class="mem-box">
        <strong>Associative Memory Profile</strong>
        <br>
        Maximum faces remembered: <strong>${state.maxFacesReached}</strong>
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
        maxFaces: state.maxFacesReached, isNewPB: hasNewPB
      });
    }

    emitComplete({
      gameId: 'face-match', domain: 'memory', mode: 'classic',
      maxLevel, accuracy, score: state.totalScore,
      medianRT, rtv, rcs,
      maxFaces: state.maxFacesReached,
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
    state.streak = 0;
    state.maxStreak = 0;
    state.results = [];
    state.currentRound = null;
    state.roundIndex = 0;
    state.levelCorrect = 0;
    state.levelTotal = 0;
    state.levelTotalTime = 0;
    state.totalScore = 0;
    state.allRTs = [];
    state.maxFacesReached = 0;
    showIdle();
  }

  /* ═══ MOUNT ═══ */
  function mount(container, options = {}) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) { console.error('[FaceMatch] Container not found'); return; }

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

      if (state.phase === 'recall') {
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
    if (state.phase === 'encode' || state.phase === 'recall' || state.phase === 'countdown') {
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
  window.FMAPI = {
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

    renderFace,
    generateUniqueFaces,
    pickDistractors,
    shuffle,
    renderEncodePhase,
    renderRecallPhase,
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

  window.FaceMatchGame = {
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