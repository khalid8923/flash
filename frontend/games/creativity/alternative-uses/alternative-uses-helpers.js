/* ═══════════════════════════════════════════════════════════
   FLASH — Alternative Uses Helpers
   Storage · PB · History · Insights · Daily · Badges · Missions
   Tracks: Accuracy · Median RT · RCS · Novelty Selection Rate
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const GAME_ID = 'alternative-uses';
  const KEYS = {
    PB:       'flash:' + GAME_ID + ':pb',
    HISTORY:  'flash:' + GAME_ID + ':history',
    DAILY:    'flash:' + GAME_ID + ':daily',
    SETTINGS: 'flash:' + GAME_ID + ':settings',
    BADGES:   'flash:' + GAME_ID + ':badges',
    MISSIONS: 'flash:' + GAME_ID + ':missions'
  };

  const HISTORY_MAX = 30;
  const DAILY_MAX   = 90;

  function safeGet(k, d) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; }
    catch (e) { return d; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }

  /* ═══ PB ═══ */
  function getPB() {
    return safeGet(KEYS.PB, {
      bestAccuracy: 0,
      bestMedianRT: 9999,
      bestRCS: 0,
      bestNoveltyRate: 0,
      updatedAt: null
    });
  }
  function checkAndUpdatePB(session) {
    const pb = getPB();
    const rec = {};
    if (session.accuracy > pb.bestAccuracy) {
      rec.accuracy = { old: pb.bestAccuracy, new: session.accuracy };
      pb.bestAccuracy = session.accuracy;
    }
    if (session.medianRT > 0 && session.medianRT < pb.bestMedianRT) {
      rec.medianRT = { old: pb.bestMedianRT, new: session.medianRT };
      pb.bestMedianRT = session.medianRT;
    }
    if (session.rcs > pb.bestRCS) {
      rec.rcs = { old: pb.bestRCS, new: session.rcs };
      pb.bestRCS = session.rcs;
    }
    if (session.noveltyRate > pb.bestNoveltyRate) {
      rec.noveltyRate = { old: pb.bestNoveltyRate, new: session.noveltyRate };
      pb.bestNoveltyRate = session.noveltyRate;
    }
    if (Object.keys(rec).length) { pb.updatedAt = new Date().toISOString(); safeSet(KEYS.PB, pb); }
    return rec;
  }

  /* ═══ HISTORY ═══ */
  function getHistory() { return safeGet(KEYS.HISTORY, []); }
  function addToHistory(s) {
    const h = getHistory();
    h.push({
      date: new Date().toISOString(),
      mode: s.mode || 'classic',
      medianRT: s.medianRT,
      accuracy: s.accuracy,
      rcs: s.rcs,
      noveltyRate: s.noveltyRate
    });
    while (h.length > HISTORY_MAX) h.shift();
    safeSet(KEYS.HISTORY, h);
    return h;
  }
  function getRecentSessions(n) { return getHistory().slice(-n); }

  /* ═══ DAILY ═══ */
  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function getDailyLog() { return safeGet(KEYS.DAILY, {}); }
  function isTodayDone() { return !!getDailyLog()[getTodayKey()]; }
  function markTodayDone(r) {
    const log = getDailyLog();
    log[getTodayKey()] = {
      done: true, rcs: r.rcs, accuracy: r.accuracy,
      noveltyRate: r.noveltyRate, completedAt: new Date().toISOString()
    };
    const keys = Object.keys(log).sort();
    while (keys.length > DAILY_MAX) delete log[keys.shift()];
    safeSet(KEYS.DAILY, log);
  }

  /* ═══ MISSIONS ═══ */
  const MISSION_POOL = [
    { id: 'play-2',    text: 'Play 2 sessions',                  target: 2,    type: 'sessions' },
    { id: 'play-4',    text: 'Play 4 sessions',                  target: 4,    type: 'sessions' },
    { id: 'acc-70',    text: 'Reach 70% accuracy',               target: 70,   type: 'accuracy' },
    { id: 'acc-85',    text: 'Reach 85% accuracy',               target: 85,   type: 'accuracy' },
    { id: 'pb',        text: 'Beat a personal best',             target: 1,    type: 'pb' },
    { id: 'novel-80',  text: 'Reach 80% novelty selection rate', target: 80,   type: 'noveltyRate' },
    { id: 'streak-5',  text: 'Reach a 5-streak',                 target: 5,    type: 'streak' }
  ];

  function seedRand(seed) {
    let x = seed;
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  }
  function getTodayMissions() {
    const today = getTodayKey();
    const cur = safeGet(KEYS.MISSIONS, null);
    if (cur && cur.date === today) return cur;
    const seed = today.split('-').reduce((a, b) => a + parseInt(b, 10), 0);
    const rand = seedRand(seed);
    const shuffled = MISSION_POOL.slice().sort(() => rand() - 0.5);
    const picked = shuffled.slice(0, 3).map(m => Object.assign({}, m, { progress: 0, done: false }));
    const fresh = { date: today, missions: picked };
    safeSet(KEYS.MISSIONS, fresh);
    return fresh;
  }
  function updateMissionProgress(type, value) {
    const d = getTodayMissions();
    let changed = false;
    d.missions.forEach(m => {
      if (m.done || m.type !== type) return;
      if (type === 'sessions') m.progress = Math.min(m.target, (m.progress || 0) + value);
      else m.progress = Math.max(m.progress || 0, value);
      if (m.progress >= m.target) m.done = true;
      changed = true;
    });
    if (changed) safeSet(KEYS.MISSIONS, d);
    return d;
  }

  /* ═══ SETTINGS ═══ */
  const DEFAULT_SETTINGS = {
    reducedMotion: false, highContrast: false,
    inputMode: 'both', haptics: true, soundEnabled: true
  };
  function getSettings() {
    const saved = safeGet(KEYS.SETTINGS, {});
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  }
  function saveSettings(s) { safeSet(KEYS.SETTINGS, s); }
  function applySettingsToDOM(s) {
    const html = document.documentElement;
    if (s.reducedMotion) html.setAttribute('data-motion', 'reduced');
    else html.removeAttribute('data-motion');
    if (s.highContrast) html.setAttribute('data-contrast', 'high');
    else html.removeAttribute('data-contrast');
  }

  /* ═══ BADGES ═══ */
  const BADGE_DEFS = {
    classic: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Reach Level 5',   check: s => (s.maxLevel || 0) >= 5 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach Level 10',  check: s => (s.maxLevel || 0) >= 10 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach Level 15',  check: s => (s.maxLevel || 0) >= 15 }
    ],
    speed: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete 20 fast trials',   check: s => (s.trials || 0) >= 20 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Median RT < 4s',            check: s => (s.medianRT || 9999) < 4000 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Median RT < 2.5s · 80%+',   check: s => (s.medianRT || 9999) < 2500 && (s.accuracy || 0) >= 80 }
    ],
    endless: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Reach Level 3',   check: s => (s.levelReached || 0) >= 3 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach Level 6',   check: s => (s.levelReached || 0) >= 6 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach Level 10',  check: s => (s.levelReached || 0) >= 10 }
    ],
    precision: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Achieve 80% accuracy',   check: s => (s.accuracy || 0) >= 80 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Achieve 90% accuracy',   check: s => (s.accuracy || 0) >= 90 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Achieve 100% accuracy',  check: s => (s.accuracy || 0) >= 100 }
    ]
  };
  function getBadges() { return safeGet(KEYS.BADGES, {}); }
  function checkAndUnlockBadges(mode, data) {
    const unlocked = getBadges();
    const defs = BADGE_DEFS[mode];
    if (!defs) return [];
    const newly = [];
    const md = unlocked[mode] || {};
    defs.forEach(def => {
      if (md[def.tier]) return;
      if (def.check && def.check(data || {})) {
        md[def.tier] = { unlockedAt: new Date().toISOString() };
        newly.push(def);
      }
    });
    if (newly.length) { unlocked[mode] = md; safeSet(KEYS.BADGES, unlocked); }
    return newly;
  }
  function getModeBadges(mode) {
    const unlocked = getBadges();
    return BADGE_DEFS[mode] ? BADGE_DEFS[mode].map(d =>
      Object.assign({}, d, { unlocked: !!(unlocked[mode] && unlocked[mode][d.tier]) })
    ) : [];
  }

  /* ═══ STATS ═══ */
  function median(arr) {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m-1] + s[m]) / 2);
  }
  function stdDev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const v = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
    return Math.round(Math.sqrt(v));
  }
  function rcs(correct, rts) {
    const sum = rts.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;
    return parseFloat((correct / (sum / 1000)).toFixed(2));
  }

  /* ═══ INSIGHTS ═══ */
  function generateInsights(s) {
    const out = [];

    if (s.noveltyRate !== undefined) {
      if (s.noveltyRate >= 85) out.push('Exceptional creative recognition — you spot novel uses easily.');
      else if (s.noveltyRate <= 50) out.push('Practical bias detected — try to look for unconventional uses.');
    }

    if (s.rtv > 5000) out.push('Decision times varied widely — uncertainty on some items.');
    else if (s.rtv > 0 && s.rtv < 1500 && s.accuracy >= 80) out.push('Very consistent decision-making speed.');

    if (s.medianRT > 0 && s.medianRT < 3000 && s.accuracy >= 85) out.push('Elite zone: fast AND accurate creative recognition.');
    else if (s.medianRT > 12000) out.push('Slower pace — trust your first instinct more.');

    if (s.isNewPB) out.push('New personal best this session!');
    return out.slice(0, 3);
  }

  /* ═══ CHART ═══ */
  function renderChart(container, sessions, metric) {
    if (!container) return;
    if (!sessions || sessions.length < 2) {
      container.innerHTML = '<div style="color:var(--t3);font-family:var(--f-m);font-size:11px;text-align:center;padding:30px 0;">Play 2+ sessions to see progress</div>';
      return;
    }
    const W = 600, H = 100, PAD = 10;
    const vals = sessions.map(s => s[metric]).filter(v => v != null && v > 0);
    if (vals.length < 2) { container.innerHTML = ''; return; }
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => [
      PAD + (i / (vals.length - 1)) * (W - PAD * 2),
      H - PAD - ((v - min) / range) * (H - PAD * 2)
    ]);
    const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const dots = pts.map(p => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5" fill="#FFD60A"/>').join('');
    const color = metric === 'medianRT' ? '#2EC4B6'
                : metric === 'accuracy' ? '#00FF96'
                : metric === 'noveltyRate' ? '#FFD60A'
                : '#FF0077';
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots + '</svg>';
  }

  /* ═══ RESET ═══ */
  function resetAll() {
    safeSet(KEYS.PB, { bestAccuracy: 0, bestMedianRT: 9999, bestRCS: 0, bestNoveltyRate: 0, updatedAt: null });
    safeSet(KEYS.HISTORY, []);
    safeSet(KEYS.DAILY, {});
    safeSet(KEYS.BADGES, {});
    safeSet(KEYS.MISSIONS, null);
  }

  window.AlternativeUsesHelpers = {
    getPB: getPB, checkAndUpdatePB: checkAndUpdatePB,
    getHistory: getHistory, addToHistory: addToHistory, getRecentSessions: getRecentSessions,
    getTodayKey: getTodayKey, isTodayDone: isTodayDone, markTodayDone: markTodayDone,
    getTodayMissions: getTodayMissions, updateMissionProgress: updateMissionProgress,
    getSettings: getSettings, saveSettings: saveSettings, applySettingsToDOM: applySettingsToDOM,
    getBadges: getBadges, checkAndUnlockBadges: checkAndUnlockBadges, getModeBadges: getModeBadges,
    resetAll: resetAll,
    median: median, stdDev: stdDev, rcs: rcs,
    generateInsights: generateInsights, renderChart: renderChart
  };
})();