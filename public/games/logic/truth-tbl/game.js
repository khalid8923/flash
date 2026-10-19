/* ═══════════════════════════════════════════════════════════
   FLASH — Truth Tables (fully integrated)
   Boolean logic deduction. Wason 1966.
   ═══════════════════════════════════════════════════════════ */
(function () {
'use strict';

const H = window.TruthTblHelpers;
const Snd = window.TruthTblSounds;
const ST = window.TruthTblStages;
const Modes = window.TruthTblExtraModes;
const FlashStages = window.FlashStages;
const FS = window.FlashSettings;

if (!H) { console.error('[TruthTbl] Helpers not loaded'); return; }

const $ = id => document.getElementById(id);
const T = k => H.T(k);
const N = (x, d) => H.N(x, d);

if (FlashStages && ST) {
  FlashStages.init('truth-tbl', ST.list, {
    onStageComplete: (stage) => {
      setTimeout(() => FlashStages.showToast(stage), 800);
      if (Snd) Snd.badge();
    }
  });
}

const CONFIG = { id: 'truth-tbl', domain: 'logic', modes: {} };
if (Modes) Modes.install({ CONFIG });

const state = {
  mode: 'classic',
  level: 1,
  maxLevel: 1,
  lives: 0,
  phase: 'idle',
  trials: [],
  streak: 0,
  maxStreak: 0,
  totalScore: 0,
  timeoutIds: [],
  seed: null,
  ticket: null,
  rng: null,
  current: null,
  trialStart: 0
};

let elStage, elLevel, elStreak, elLives, elContent, elHintBar;

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

/* ═══ Expression generator ═══ */
/* Difficulty scales by:
     varCount: 1 → 4
     ops: NOT, AND, OR, XOR, NAND, NOR
     length: 1 → 5 operations
*/

const OPS = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];

function evalOp(op, a, b) {
  if (op === 'AND') return a && b;
  if (op === 'OR') return a || b;
  if (op === 'XOR') return a !== b;
  if (op === 'NAND') return !(a && b);
  if (op === 'NOR') return !(a || b);
  return false;
}

function varLabel(i) {
  return String.fromCharCode(65 + i);   // A, B, C, D
}

/* Generate expression tree */
function genTree(depth, varCount) {
  const rand = state.rng || Math.random;

  /* At depth 0 or with low probability: leaf */
  if (depth <= 0 || rand() < 0.25) {
    const vi = Math.floor(rand() * varCount);
    /* Small chance of NOT on var */
    if (rand() < 0.25) {
      return { type: 'not', child: { type: 'var', idx: vi } };
    }
    return { type: 'var', idx: vi };
  }

  /* Internal node — op */
  const opIdx = Math.floor(rand() * OPS.length);
  const op = OPS[opIdx];
  /* Bias toward simpler ops at low depth */
  const useComplex = depth > 1 && rand() < 0.5;
  const finalOp = useComplex ? op : (rand() < 0.5 ? 'AND' : 'OR');

  const left = genTree(depth - 1, varCount);
  const right = genTree(depth - 1, varCount);

  return { type: 'op', op: finalOp, left, right };
}

/* Evaluate tree with values array */
function evalTree(node, values) {
  if (node.type === 'var') return values[node.idx];
  if (node.type === 'not') return !evalTree(node.child, values);
  if (node.type === 'op') {
    return evalOp(node.op, evalTree(node.left, values), evalTree(node.right, values));
  }
  return false;
}

/* Render tree as string */
function renderTree(node) {
  if (node.type === 'var') return `<span class="var">${varLabel(node.idx)}</span>`;
  if (node.type === 'not') return `¬${renderTree(node.child)}`;
  if (node.type === 'op') {
    return `(${renderTree(node.left)}<span class="op">${node.op}</span>${renderTree(node.right)})`;
  }
  return '';
}

/* Generate trial based on level */
function generateTrial(level) {
  const rand = state.rng || Math.random;

  let varCount, depth;
  if (level <= 2) { varCount = 1; depth = 1; }
  else if (level <= 4) { varCount = 2; depth = 1; }
  else if (level <= 7) { varCount = 2; depth = 2; }
  else if (level <= 10) { varCount = 3; depth = 2; }
  else if (level <= 12) { varCount = 3; depth = 3; }
  else { varCount = 4; depth = 3; }

  const tree = genTree(depth, varCount);
  const values = [];
  for (let i = 0; i < varCount; i++) values.push(rand() < 0.5);
  const result = evalTree(tree, values);

  return {
    tree,
    values,
    varCount,
    expression: renderTree(tree),
    result,
    level
  };
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
  state.trials = [];
  state.streak = 0;
  state.maxStreak = 0;
  state.totalScore = 0;

  elLevel.textContent = '1';
  elStreak.textContent = '0';
  elLives.textContent = state.lives ? String(state.lives) : '—';

  const t = await H.net('/plays', { game_id: CONFIG.id, mode: modeId });
  state.seed = (t && t.seed) || (m.daily ? 'daily-' + H.today() : H.localSeed());
  state.ticket = (t && t.ticket_id) || null;
  state.rng = mkRng(state.seed);
  if (state.ticket) await H.net('/plays/consume', { ticket_id: state.ticket });

  nextTrial();
}

function nextTrial() {
  clearAllTimeouts();
  const m = CONFIG.modes[state.mode];
  const level = m.lvl ? m.lvl(state.trials.length) : state.level;

  state.level = level;
  state.maxLevel = Math.max(state.maxLevel, level);
  elLevel.textContent = String(level);

  const trial = generateTrial(level);
  state.current = trial;
  state.trialStart = performance.now();

  renderTrial(trial, m);
}

function renderTrial(trial, m) {
  setPhase('input');
  setProgress(0);

  const varsHTML = trial.values.map((v, i) =>
    `<div class="expr-var" data-v="${v}">
      <span class="k">${varLabel(i)} =</span>
      <span class="v">${v ? 'T' : 'F'}</span>
    </div>`
  ).join('');

  const timerHTML = m.timeLimitMs
    ? `<div class="timer-display" id="timer-display">${(m.timeLimitMs / 1000).toFixed(1)}s</div>`
    : '';

  render(`
    <div class="phase-title">${T('level')} ${trial.level} · ${H.isAr() ? 'قيّم' : 'Evaluate'}</div>
    <h2 class="phase-headline">${H.isAr() ? 'ما نتيجة التعبير؟' : 'What is the result?'}</h2>

    <div class="expr-wrap">
      <div class="expr-vars">${varsHTML}</div>
      <div class="expr-body">${trial.expression} = ?</div>
      ${timerHTML}
      <div class="answer-row">
        <button class="answer-btn" data-answer="true">${T('true')}</button>
        <button class="answer-btn" data-answer="false">${T('false')}</button>
      </div>
    </div>
  `);

  elContent.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.answer === 'true';
      answer(choice, btn);
    });
  });

  if (m.timeLimitMs) startTimer(m.timeLimitMs);
}

function startTimer(limitMs) {
  const el = $('timer-display');
  if (!el) return;
  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    const remain = Math.max(0, limitMs - elapsed);
    const sec = (remain / 1000).toFixed(1);
    el.textContent = sec + 's';
    el.classList.toggle('low', remain < 1000);
    if (remain <= 0) { answer(null, null); return; }
    if (state.phase === 'input') requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function answer(choice, btn) {
  if (state.phase !== 'input') return;
  setPhase('feedback');

  const trial = state.current;
  const m = CONFIG.modes[state.mode];
  const correct = choice === trial.result;
  const rt = Math.round(performance.now() - state.trialStart);

  /* Record trial */
  state.trials.push({
    index: state.trials.length,
    stimulus: { expression: trial.expression, values: trial.values, varCount: trial.varCount },
    response: { answer: choice },
    rt_ms: choice === null ? null : rt,
    correct: correct,
    is_practice: false
  });

  if (btn) {
    btn.classList.add(correct ? 'correct' : 'wrong');
  }

  if (correct) {
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.totalScore += 100 + (state.streak - 1) * 40;
    elStreak.textContent = String(state.streak);
    snd('hit');
  } else {
    state.streak = 0;
    elStreak.textContent = '0';
    snd('miss');
    if (m.lives) { state.lives--; elLives.textContent = String(state.lives); }
  }

  const dead = m.lives && state.lives <= 0;
  const reachedMax = state.trials.length >= (m.maxLevels || 15) && m.maxLevels !== Infinity;

  setTimeout(() => {
    if (dead) completeGame('lives');
    else if (reachedMax) completeGame('done');
    else nextTrial();
  }, correct ? 700 : 1400);
}

/* ═══ COMPLETE ═══ */
function completeGame(reason) {
  clearAllTimeouts();
  setPhase('complete');
  setProgress(0);

  const m = CONFIG.modes[state.mode];
  const valid = state.trials.filter(t => t.rt_ms !== null);
  const correctCount = valid.filter(t => t.correct).length;
  const accuracy = valid.length ? Math.round(correctCount / valid.length * 100) : 0;
  const rts = valid.map(t => t.rt_ms).sort((a, b) => a - b);
  const medianRT = rts.length ? rts[Math.floor(rts.length / 2)] : 0;

  const prevPB = (H.pbAll()[state.mode] || {}).score || 0;
  const isNewPB = H.pbCheck(state.mode, state.totalScore, state.maxLevel, accuracy);

  const summary = {
    mode: state.mode, n: valid.length, maxLevel: state.maxLevel,
    accuracy, medianRT, totalScore: state.totalScore,
    maxStreak: state.maxStreak, isNewPB, prevPB
  };

  H.addHistory({ t: Date.now(), mode: state.mode, level: state.maxLevel, acc: accuracy, score: state.totalScore });

  const fresh = H.stageCheck(summary);
  H.unlockBadges(summary);
  H.updateMissions(summary);

  const cs = H.FS('checkSession'), ts = H.FS('showToast');
  try { if (cs) cs(summary); if (ts) fresh.forEach(id => ts(H.stageName(id))); } catch (e) {}

  H.net('/sessions', { game_id: CONFIG.id, ticket_id: state.ticket, seed: state.seed, mode: state.mode, trials: state.trials });

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'flash:game-complete',
        gameId: CONFIG.id, domain: CONFIG.domain, mode: state.mode,
        maxLevel: state.maxLevel, accuracy, score: state.totalScore,
        medianRT, rtv: 0, rcs: 0, isNewPB
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
      <div class="stat-card"><div class="stat-label">${T('accuracy')}</div><div class="stat-value">${N(accuracy)}%</div></div>
      <div class="stat-card"><div class="stat-label">RT</div><div class="stat-value">${N(medianRT)} ms</div></div>
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
  elStreak = $('streak-display');
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

window.TruthTblGame = { reset: () => showIdle(), state, config: CONFIG };
})();