/* ═══════════════════════════════════════════════════════════
   FLASH — Flash Cards (fully integrated)
   Grid-based visual memory task. Naveh-Benjamin 2000.
   ═══════════════════════════════════════════════════════════ */
(function () {
'use strict';

const H = window.FlashCardsHelpers;
const Snd = window.FlashCardsSounds;
const ST = window.FlashCardsStages;
const Modes = window.FlashCardsExtraModes;
const FlashStages = window.FlashStages;
const FS = window.FlashSettings;

if (!H) { console.error('[FlashCards] Helpers not loaded'); return; }

const $ = id => document.getElementById(id);
const T = k => H.T(k);
const N = (x, d) => H.N(x, d);

if (FlashStages && ST) {
  FlashStages.init('flash-cards', ST.list, {
    onStageComplete: (stage) => {
      setTimeout(() => FlashStages.showToast(stage), 800);
      if (Snd) Snd.badge();
    }
  });
}

const CONFIG = {
  id: 'flash-cards',
  domain: 'memory',
  gridSize: 4,
  modes: {}
};

if (Modes) Modes.install({ CONFIG });

const state = {
  mode: 'classic',
  level: 1,
  maxLevel: 1,
  maxTiles: 0,
  lives: 0,
  phase: 'idle',
  targetCells: [],
  selectedCells: [],
  results: [],
  streak: 0,
  maxStreak: 0,
  totalScore: 0,
  timeoutIds: [],
  seed: null,
  ticket: null,
  rng: null
};

let elStage, elLevel, elTiles, elLives, elContent, elHintBar;

function clearAllTimeouts() { state.timeoutIds.forEach(clearTimeout); state.timeoutIds = []; }
function wait(ms) { return new Promise(r => { const id = setTimeout(r, ms); state.timeoutIds.push(id); }); }
function setPhase(p) { state.phase = p; if (elStage) elStage.dataset.phase = p; }
function render(html) { if (elContent) elContent.innerHTML = html; }
function setProgress(pct) { if (elHintBar) elHintBar.style.width = Math.max(0, Math.min(100, pct)) + '%'; }
function snd(k) { try { if (Snd && Snd[k]) Snd[k](); } catch (e) {} }

function applyI18n() {
  const ar = H.isAr();
  document.documentElement.lang = ar ? 'ar' : 'en';
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
}

function mkRng(seed) {
  if (typeof window.seedrandom === 'function') return window.seedrandom(seed);
  let a = 0; for (const c of seed) a = Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function pickCells(count) {
  const total = CONFIG.gridSize * CONFIG.gridSize;
  const rand = state.rng || Math.random;
  const pool = Array.from({ length: total }, (_, i) => i);
  const picked = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

function tilesForLevel(level, m) {
  return (m.startTiles || 3) + (level - 1) * (m.tilesPerLevel || 1);
}

function renderGrid(interactive) {
  const total = CONFIG.gridSize * CONFIG.gridSize;
  let cells = '';
  for (let i = 0; i < total; i++) {
    cells += `<div class="cell" data-idx="${i}"></div>`;
  }
  render(`<div class="grid-wrap">${cells}</div>`);
  if (interactive) {
    elContent.querySelectorAll('.cell').forEach(cell => cell.addEventListener('click', () => onCellClick(cell)));
  }
}

/* ═══ IDLE ═══ */
function showIdle() {
  setPhase('idle');
  applyI18n();
  setProgress(0);

  const modeIds = ['classic', 'speed', 'endless', 'precision', 'daily'];
  const modeHTML = modeIds.map(id => {
    const m = CONFIG.modes[id];
    if (!m) return '';
    const locked = m.locked && m.locked();
    const name = H.isAr() ? (m.name_ar || m.name) : m.name;
    const desc = H.isAr() ? (m.desc_ar || m.desc) : m.desc;
    return `<button class="mode-notch" data-mode="${id}" ${locked ? 'aria-disabled="true"' : ''}>
      <b>${name}</b><small>${locked ? T('done') : desc}</small>
    </button>`;
  }).join('');

  render(`
    <div class="phase-title">${T('cite')}</div>
    <h1 class="phase-headline grd">${T('title')}</h1>
    <p class="phase-sub">${T('rule')}</p>
    <nav class="mode-ledger" id="mode-ledger">${modeHTML}</nav>
    <p class="pb-row" id="pb-row"></p>
    <p class="mission-row" id="mission-row"></p>
    <div class="stage-strip" id="stage-strip"></div>
  `);

  H.pbRow($('pb-row'));
  H.missionRow($('mission-row'));

  const stagesEl = $('stage-strip');
  if (FlashStages && stagesEl) {
    try { FlashStages.renderStrip(stagesEl); } catch (e) { H.drawStrip(stagesEl); }
  } else if (stagesEl) { H.drawStrip(stagesEl); }

  const ledger = $('mode-ledger');
  if (ledger) {
    ledger.addEventListener('click', e => {
      const b = e.target.closest('.mode-notch');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      snd('click');
      startGame(b.dataset.mode);
    });
  }
}

/* ═══ START ═══ */
async function startGame(modeId) {
  if (state.phase !== 'idle') return;
  const m = CONFIG.modes[modeId];
  if (!m || (m.locked && m.locked())) return;

  snd('unlock');
  state.mode = modeId;
  state.level = 1;
  state.maxLevel = 1;
  state.maxTiles = 0;
  state.lives = m.lives || 0;
  state.results = [];
  state.streak = 0;
  state.maxStreak = 0;
  state.totalScore = 0;

  elLevel.textContent = '1';
  elTiles.textContent = '0';
  elLives.textContent = state.lives ? String(state.lives) : '—';

  const t = await H.net('/plays', { game_id: CONFIG.id, mode: modeId });
  state.seed = (t && t.seed) || (m.daily ? 'daily-' + H.today() : H.localSeed());
  state.ticket = (t && t.ticket_id) || null;
  state.rng = mkRng(state.seed);
  if (state.ticket) await H.net('/plays/consume', { ticket_id: state.ticket });

  startLevel();
}

async function startLevel() {
  clearAllTimeouts();
  setPhase('showing');

  const m = CONFIG.modes[state.mode];
  const count = tilesForLevel(state.level, m);
  state.targetCells = pickCells(count);
  state.selectedCells = [];

  elLevel.textContent = String(state.level);
  elTiles.textContent = String(count);
  elLives.textContent = state.lives ? String(state.lives) : '—';

  render(`
    <div class="phase-title">${T('level')} ${state.level}</div>
    <h2 class="phase-headline">${H.isAr() ? 'احفظ' : 'Memorize'} ${count} ${T('tiles')}</h2>
    <p class="phase-sub" style="margin-bottom:20px;">${H.isAr() ? 'انتبه جيداً...' : 'Watch carefully...'}</p>
    <div class="grid-wrap">
      ${Array.from({ length: CONFIG.gridSize * CONFIG.gridSize }, (_, i) => `<div class="cell" data-idx="${i}"></div>`).join('')}
    </div>
  `);

  await wait(600);

  for (const idx of state.targetCells) {
    const cell = elContent.querySelector(`.cell[data-idx="${idx}"]`);
    if (cell) cell.classList.add('lit');
    snd('tile');
    await wait(m.gapMs || 200);
  }

  await wait(m.flashMs || 1400);
  elContent.querySelectorAll('.cell.lit').forEach(c => c.classList.remove('lit'));
  await wait(400);

  startInputPhase();
}

function startInputPhase() {
  setPhase('input');
  const count = state.targetCells.length;

  render(`
    <div class="phase-title">${T('level')} ${state.level}</div>
    <h2 class="phase-headline">${H.isAr() ? 'اضغط على' : 'Click'} ${count} ${T('tiles')}</h2>
    <p class="phase-sub" style="margin-bottom:20px;">${H.isAr() ? 'اختر البلاطات التي رأيتها' : 'Select the tiles you saw'}</p>
    <div class="grid-wrap">
      ${Array.from({ length: CONFIG.gridSize * CONFIG.gridSize }, (_, i) => `<div class="cell" data-idx="${i}"></div>`).join('')}
    </div>
  `);

  elContent.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => onCellClick(cell));
  });
}

function onCellClick(cell) {
  if (state.phase !== 'input') return;
  if (cell.classList.contains('correct') || cell.classList.contains('wrong')) return;

  const idx = parseInt(cell.dataset.idx, 10);
  const isCorrect = state.targetCells.includes(idx);

  if (isCorrect) {
    cell.classList.add('correct');
    state.selectedCells.push(idx);
    snd('hit');
  } else {
    cell.classList.add('wrong');
    state.selectedCells.push(idx);
    snd('miss');
  }

  const found = state.selectedCells.filter(i => state.targetCells.includes(i)).length;
  const wrong = state.selectedCells.length - found;

  if (wrong > 0) { endLevel(false); return; }
  if (found === state.targetCells.length) { endLevel(true); }
}

function endLevel(passed) {
  const m = CONFIG.modes[state.mode];
  state.results.push({
    level: state.level,
    correct: passed,
    target: state.targetCells.length,
    wrong: state.selectedCells.length - state.targetCells.length
  });

  if (passed) {
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.maxLevel = Math.max(state.maxLevel, state.level);
    state.maxTiles = Math.max(state.maxTiles, state.targetCells.length);
    state.totalScore += 100 + (state.streak - 1) * 40;
    snd('level');
    setPhase('feedback');

    render(`
      <div class="feedback-icon good">✓</div>
      <h2 class="phase-headline grd">${H.isAr() ? 'صحيح' : 'Level'} ${state.level}</h2>
      <p class="phase-sub">${state.targetCells.length} ${T('tiles')}</p>
    `);

    setTimeout(() => {
      if (state.level < (m.maxLevels || 10)) {
        state.level++;
        startLevel();
      } else {
        completeGame('done');
      }
    }, 1400);
  } else {
    state.streak = 0;
    if (m.lives) { state.lives--; elLives.textContent = String(state.lives); }
    snd('miss');
    setPhase('feedback');

    render(`
      <div class="feedback-icon bad">✕</div>
      <h2 class="phase-headline" style="color:#FF0077">${H.isAr() ? 'خطأ' : 'Missed'}</h2>
      <p class="phase-sub">${m.lives ? state.lives + ' ' + (H.isAr() ? 'فرص' : 'lives') : ''}</p>
    `);

    const dead = m.lives && state.lives <= 0;
    setTimeout(() => { if (!dead) startLevel(); else completeGame('lives'); }, 1500);
  }
}

function completeGame(reason) {
  clearAllTimeouts();
  setPhase('complete');
  setProgress(0);

  const m = CONFIG.modes[state.mode];
  const passed = state.results.filter(r => r.correct).length;
  const total = state.results.length || 1;
  const accuracy = Math.round(passed / total * 100);

  const prevPB = (H.pbAll()[state.mode] || {}).score || 0;
  const isNewPB = H.pbCheck(state.mode, state.totalScore, state.maxLevel, accuracy);

  const summary = {
    mode: state.mode, n: state.results.length, maxLevel: state.maxLevel,
    maxTiles: state.maxTiles, accuracy, totalScore: state.totalScore,
    maxStreak: state.maxStreak, isNewPB, prevPB
  };

  H.addHistory({ t: Date.now(), mode: state.mode, level: state.maxLevel, acc: accuracy, score: state.totalScore });

  const fresh = H.stageCheck(summary);
  const badges = H.unlockBadges(summary);
  H.updateMissions(summary);

  const cs = H.FS('checkSession'), ts = H.FS('showToast');
  try { if (cs) cs(summary); if (ts) fresh.forEach(id => ts(H.stageName(id))); } catch (e) {}

  H.net('/sessions', { game_id: CONFIG.id, ticket_id: state.ticket, seed: state.seed, mode: state.mode, trials: state.results });

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'flash:game-complete',
        gameId: CONFIG.id, domain: CONFIG.domain, mode: state.mode,
        maxLevel: state.maxLevel, accuracy, score: state.totalScore,
        medianRT: 0, rtv: 0, rcs: 0, isNewPB,
        maxTiles: state.maxTiles, passedLevels: passed
      }, '*');
    }
  } catch (e) {}

  if (isNewPB) snd('personalBest'); else snd('gameOver');
  if (m.onEnd) m.onEnd(summary);

  render(`
    <div class="phase-title">${T('cite')}</div>
    <h1 class="phase-headline grd">${T('maxlevel')}</h1>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">${T('maxlevel')}</div><div class="stat-value">${N(state.maxLevel)}</div></div>
      <div class="stat-card"><div class="stat-label">${T('tiles')}</div><div class="stat-value">${N(state.maxTiles)}</div></div>
      <div class="stat-card"><div class="stat-label">${T('accuracy')}</div><div class="stat-value">${N(accuracy)}%</div></div>
    </div>
    ${isNewPB ? `<p class="pbm">${T('newpb')}</p>` : ''}
    ${fresh.length ? `<p class="stage-tag">${T('stage')}: ${fresh.map(id => H.stageName(id)).join(', ')}</p>` : ''}
    <button class="big-btn" id="again-btn">${T('again')}</button>
  `);

  $('again-btn').addEventListener('click', () => showIdle());
}

function wireRefs() {
  elStage = $('stage');
  elLevel = $('level-display');
  elTiles = $('tiles-display');
  elLives = $('lives-display');
  elContent = $('phase-content');
  elHintBar = $('hint-progress');
}

function init() {
  wireRefs();
  const setBtn = $('settings-btn');
  if (setBtn) setBtn.addEventListener('click', () => H.openPanel());
  if (FS && FS.onChange) FS.onChange(() => { if (Snd) Snd.mute(H.settings().soundEnabled === false); if (state.phase === 'idle') showIdle(); });
  if (Snd) Snd.mute(H.settings().soundEnabled === false);
  showIdle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else { init(); }

window.FlashCardsGame = { reset: () => showIdle(), state, config: CONFIG };
})();