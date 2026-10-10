/* ═══════════════════════════════════════════════════════════
   FLASH — Digit Span (with full integration)
   Backward Digit Span · WAIS-IV · Working Memory
   ═══════════════════════════════════════════════════════════ */
(function () {
'use strict';

const H = window.DigitSpanHelpers;
const Snd = window.DigitSpanSounds;
const ST = window.DigitSpanStages;
const Modes = window.DigitSpanExtraModes;
const FlashStages = window.FlashStages;
const FS = window.FlashSettings;

if (!H) { console.error('[DigitSpan] Helpers not loaded'); return; }

const $ = id => document.getElementById(id);
const T = k => H.T(k);
const N = (x, d) => H.N(x, d);

if (FlashStages && ST) {
  FlashStages.init('digit-span', ST.list, {
    onStageComplete: (stage) => {
      setTimeout(() => FlashStages.showToast(stage), 800);
      if (Snd) Snd.badge();
    }
  });
}

const CONFIG = {
  id: 'digit-span',
  domain: 'numerical',
  maxLevel: 12,
  startDigits: 3,
  maxInputLength: 15,
  correctBase: 100,
  streakBonus: 40,
  modes: {}
};

if (Modes) Modes.install({ CONFIG });

const state = {
  mode: 'classic',
  level: 1,
  maxLevel: 1,
  lives: 0,
  phase: 'idle',
  sequence: [],
  expected: [],
  userInput: [],
  results: [],
  streak: 0,
  maxStreak: 0,
  totalScore: 0,
  timeoutIds: [],
  seed: null,
  ticket: null,
  rng: null
};

let elStage, elLevel, elSpan, elLives, elContent, elHintBar;

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

function digitsForLevel(level) { return CONFIG.startDigits + (level - 1); }

function generateSequence(length) {
  const rand = state.rng || Math.random;
  const seq = [];
  for (let i = 0; i < length; i++) {
    let d, last = i > 0 ? seq[i - 1] : -1, attempts = 0;
    do { d = Math.floor(rand() * 10); attempts++; } while (d === last && attempts < 20);
    seq.push(d);
  }
  return seq;
}

function renderProgressDots() {
  let dots = '';
  for (let i = 1; i <= CONFIG.maxLevel; i++) {
    const r = state.results.find(x => x.level === i);
    let cls = '';
    if (r) cls = r.passed ? 'done' : 'fail';
    else if (i === state.level && state.phase !== 'gameover') cls = 'current';
    dots += `<span class="p-dot ${cls}"></span>`;
  }
  return `<div class="progress-dots">${dots}</div>`;
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
  state.lives = m.lives || 0;
  state.results = [];
  state.streak = 0;
  state.maxStreak = 0;
  state.totalScore = 0;
  state.userInput = [];

  elLevel.textContent = '1';
  elSpan.textContent = '0';
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
  state.userInput = [];

  const m = CONFIG.modes[state.mode];
  const length = digitsForLevel(m.lvl ? m.lvl(state.results.length) : state.level);

  state.sequence = generateSequence(length);
  state.expected = [...state.sequence].reverse();

  elLevel.textContent = String(state.level);
  elSpan.textContent = String(length);
  elLives.textContent = state.lives ? String(state.lives) : '—';

  await showCountdown();
  await showSequence(m);
  startInputPhase();
}

async function showCountdown() {
  setPhase('countdown');
  setProgress(0);
  for (let i = 3; i > 0; i--) {
    render(`<div class="phase-title">${T('level')} ${state.level} · ${state.sequence.length}</div><div class="countdown-num">${i}</div>`);
    snd('tick');
    await wait(650);
  }
}

async function showSequence(m) {
  setPhase('showing');
  setProgress(0);

  render(`
    ${renderProgressDots()}
    <div class="phase-title">${T('level')} ${state.level}</div>
    <h2 class="phase-headline">${H.isAr() ? 'احفظ الأرقام' : 'Memorize the digits'}</h2>
    <div class="digit-display" id="digit-display">
      <div class="digit-value" id="digit-value"></div>
    </div>
    <p class="phase-hint">${state.sequence.length} digits</p>
  `);

  const display = $('digit-display');
  const value = $('digit-value');
  if (!display || !value) return;

  await wait(500);

  const showMs = m.digitShow || 950;
  const gapMs = m.digitGap || 280;

  for (let i = 0; i < state.sequence.length; i++) {
    value.textContent = String(state.sequence[i]);
    display.classList.add('active');
    snd('show');
    setProgress(((i + 1) / state.sequence.length) * 100);
    await wait(showMs);
    display.classList.remove('active');
    snd('hide');
    await wait(gapMs);
  }

  setProgress(0);
  await wait(400);
}

function startInputPhase() {
  setPhase('input');
  state.userInput = [];
  const expectedLen = state.expected.length;

  render(`
    ${renderProgressDots()}
    <div class="phase-title">${T('level')} ${state.level}</div>
    <h2 class="phase-headline">${H.isAr() ? 'أدخل بالترتيب العكسي' : 'Enter in REVERSE'}</h2>
    <div class="input-display" id="input-display">
      <span class="input-placeholder">${H.isAr() ? 'اكتب ' + expectedLen + ' أرقام بالعكس' : 'TYPE ' + expectedLen + ' DIGITS'}</span>
    </div>
    <div class="keypad" id="keypad">
      ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="key" data-digit="${n}">${n}</button>`).join('')}
      <button class="key action" data-action="back">⌫</button>
      <button class="key" data-digit="0">0</button>
      <button class="key action submit" data-action="submit">✓</button>
    </div>
  `);

  $('keypad').addEventListener('click', e => {
    const b = e.target.closest('.key');
    if (!b) return;
    snd('click');
    if (b.dataset.digit !== undefined) addDigit(parseInt(b.dataset.digit, 10));
    else if (b.dataset.action === 'back') removeDigit();
    else if (b.dataset.action === 'submit') submitAnswer();
  });
}

function addDigit(d) {
  if (state.phase !== 'input') return;
  if (state.userInput.length >= CONFIG.maxInputLength) return;
  state.userInput.push(d);
  updateInputDisplay();
  if (state.userInput.length === state.expected.length) {
    setTimeout(() => { if (state.phase === 'input') submitAnswer(); }, 350);
  }
}

function removeDigit() {
  if (state.phase !== 'input' || state.userInput.length === 0) return;
  state.userInput.pop();
  updateInputDisplay();
}

function updateInputDisplay() {
  const el = $('input-display');
  if (!el) return;
  el.classList.remove('correct', 'wrong');
  if (state.userInput.length === 0) {
    el.innerHTML = `<span class="input-placeholder">${H.isAr() ? 'اكتب ' + state.expected.length + ' أرقام' : 'TYPE ' + state.expected.length + ' DIGITS'}</span>`;
    return;
  }
  el.innerHTML = state.userInput.map(d => `<span class="input-digit">${d}</span>`).join('');
}

function submitAnswer() {
  if (state.phase !== 'input' || state.userInput.length === 0) return;
  const isCorrect = state.userInput.length === state.expected.length && state.userInput.every((d, i) => d === state.expected[i]);
  const correctDigits = state.userInput.reduce((a, d, i) => a + (state.expected[i] === d ? 1 : 0), 0);

  state.results.push({ level: state.level, span: state.expected.length, passed: isCorrect, correctDigits, totalDigits: state.expected.length });

  const el = $('input-display');
  if (el) el.classList.add(isCorrect ? 'correct' : 'wrong');

  setPhase('feedback');
  setTimeout(() => isCorrect ? handleSuccess() : handleMiss(correctDigits), 500);
}

function handleSuccess() {
  state.streak++;
  state.maxStreak = Math.max(state.maxStreak, state.streak);
  const bonus = state.streak > 1 ? (state.streak - 1) * CONFIG.streakBonus : 0;
  state.totalScore += CONFIG.correctBase + bonus;
  state.maxLevel = Math.max(state.maxLevel, state.level);
  snd('hit');
  setProgress(0);

  render(`
    ${renderProgressDots()}
    <div class="feedback-icon good">✓</div>
    <h2 class="phase-headline grd">${H.isAr() ? 'صحيح' : 'Correct'}</h2>
    <p class="phase-sub">${state.expected.length} ${H.isAr() ? 'أرقام' : 'digits'}</p>
  `);

  setTimeout(() => {
    if (state.level < CONFIG.maxLevel) { state.level++; startLevel(); }
    else completeGame('done');
  }, 1400);
}

function handleMiss(correctDigits) {
  state.streak = 0;
  const m = CONFIG.modes[state.mode];
  if (m.lives) { state.lives--; elLives.textContent = String(state.lives); }

  snd('miss');
  setProgress(0);

  const expected = state.expected;
  const user = state.userInput;
  const maxLen = Math.max(expected.length, user.length);

  const expectedCells = expected.map(d => `<span class="match">${d}</span>`).join('');
  const userCells = [];
  for (let i = 0; i < maxLen; i++) {
    const u = user[i], e = expected[i];
    if (u === undefined) userCells.push(`<span class="dim">·</span>`);
    else if (u === e) userCells.push(`<span class="match">${u}</span>`);
    else userCells.push(`<span class="miss">${u}</span>`);
  }

  render(`
    ${renderProgressDots()}
    <div class="feedback-icon bad">✕</div>
    <h2 class="phase-headline" style="color:#FF0077">${H.isAr() ? 'خطأ' : 'Incorrect'}</h2>
    <p class="phase-sub">${correctDigits}/${expected.length} ${H.isAr() ? 'صحيح' : 'correct'}${m.lives ? ' · ' + state.lives + ' ' + (H.isAr() ? 'فرص' : 'lives') : ''}</p>
    <div class="answer-grid">
      <div class="answer-row"><div class="answer-label">SEEN</div><div class="answer-digits">${state.sequence.map(d => `<span class="dim">${d}</span>`).join('')}</div></div>
      <div class="answer-row"><div class="answer-label">EXPECTED</div><div class="answer-digits">${expectedCells}</div></div>
      <div class="answer-row"><div class="answer-label">YOURS</div><div class="answer-digits">${userCells.join('')}</div></div>
    </div>
  `);

  const dead = m.lives && state.lives <= 0;
  setTimeout(() => { if (!dead) startLevel(); else completeGame('lives'); }, 2500);
}

function completeGame(reason) {
  clearAllTimeouts();
  setPhase('gameover');
  setProgress(0);

  const m = CONFIG.modes[state.mode];
  const passedLevels = state.results.filter(r => r.passed).length;
  const totalCorrect = state.results.reduce((a, r) => a + r.correctDigits, 0);
  const totalDigits = state.results.reduce((a, r) => a + r.totalDigits, 0);
  const accuracy = totalDigits > 0 ? Math.round((totalCorrect / totalDigits) * 100) : 0;
  const maxSpan = Math.max.apply(null, state.results.filter(r => r.passed).map(r => r.span).concat([0]));

  const prevPB = (H.pbAll()[state.mode] || {}).score || 0;
  const isNewPB = H.pbCheck(state.mode, state.totalScore, maxSpan, accuracy);

  const summary = {
    mode: state.mode, n: state.results.length, maxLevel: state.maxLevel,
    maxSpan, accuracy, totalScore: state.totalScore, maxStreak: state.maxStreak,
    isNewPB, prevPB
  };

  H.addHistory({ t: Date.now(), mode: state.mode, level: state.maxLevel, span: maxSpan, acc: accuracy, score: state.totalScore, d: 0 });

  const fresh = H.stageCheck(summary);
  const badges = H.unlockBadges(summary);
  H.updateMissions(summary);

  const cs = H.FS('checkSession'), ts = H.FS('showToast');
  try {
    if (cs) cs(summary);
    if (ts) fresh.forEach(id => ts(H.stageName(id)));
  } catch (e) {}

  H.net('/sessions', { game_id: CONFIG.id, ticket_id: state.ticket, seed: state.seed, mode: state.mode, trials: state.results });

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'flash:game-complete',
        gameId: CONFIG.id, domain: CONFIG.domain, mode: state.mode,
        maxLevel: state.maxLevel, accuracy, score: state.totalScore,
        medianRT: 0, rtv: 0, rcs: 0, isNewPB,
        maxSpan, passedLevels
      }, '*');
    }
  } catch (e) {}

  if (isNewPB) snd('personalBest'); else snd('gameOver');
  if (m.onEnd) m.onEnd(summary);

  render(`
    <div class="phase-title">${T('cite')}</div>
    <h1 class="phase-headline grd">${T('maxspan')}</h1>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">${T('maxspan')}</div><div class="stat-value">${N(maxSpan)}</div></div>
      <div class="stat-card"><div class="stat-label">${T('passed')}</div><div class="stat-value">${N(passedLevels)}</div></div>
      <div class="stat-card"><div class="stat-label">${T('accuracy')}</div><div class="stat-value">${N(accuracy)}%</div></div>
    </div>
    ${isNewPB ? `<p class="pbm">${T('newpb')}</p>` : ''}
    ${fresh.length ? `<p class="stage-tag">${T('stage')}: ${fresh.map(id => H.stageName(id)).join(', ')}</p>` : ''}
    <button class="big-btn" id="again-btn">${T('again')}</button>
  `);

  $('again-btn').addEventListener('click', () => { showIdle(); });
}

function resetGame() {
  clearAllTimeouts();
  state.level = 1;
  state.maxLevel = 1;
  state.lives = CONFIG.modes[state.mode].lives || 0;
  state.results = [];
  state.streak = 0;
  state.maxStreak = 0;
  state.totalScore = 0;
  state.sequence = [];
  state.expected = [];
  state.userInput = [];
  elLevel.textContent = '1';
  elSpan.textContent = '0';
  elLives.textContent = state.lives ? String(state.lives) : '—';
  showIdle();
}

function wireRefs() {
  elStage = $('stage');
  elLevel = $('level-display');
  elSpan = $('span-display');
  elLives = $('lives-display');
  elContent = $('phase-content');
  elHintBar = $('hint-progress');
}

function bindKeys() {
  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && state.phase !== 'idle') { e.preventDefault(); resetGame(); return; }
    if (state.phase === 'input' && /^[0-9]$/.test(e.key)) { e.preventDefault(); addDigit(parseInt(e.key, 10)); return; }
    if (state.phase === 'input' && e.key === 'Backspace') { e.preventDefault(); removeDigit(); return; }
    if (state.phase === 'input' && e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
  });
}

function init() {
  wireRefs();
  bindKeys();

  const setBtn = $('settings-btn');
  if (setBtn) setBtn.addEventListener('click', () => H.openPanel());

  if (FS && FS.onChange) {
    FS.onChange(() => { if (Snd) Snd.mute(H.settings().soundEnabled === false); if (state.phase === 'idle') showIdle(); });
  }
  if (Snd) Snd.mute(H.settings().soundEnabled === false);

  showIdle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.DigitSpanGame = { mount: init, reset: resetGame, state, config: CONFIG };
})();