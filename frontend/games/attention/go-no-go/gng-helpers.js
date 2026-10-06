/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Helpers
   Storage · PB · History · Daily · Badges · d' · Insights · Trends
   Loaded BEFORE game.js
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const KEYS = {
    PB:       'flash:gng:pb',
    HISTORY:  'flash:gng:history',
    DAILY:    'flash:gng:daily',
    SETTINGS: 'flash:gng:settings',
    BADGES:   'flash:gng:badges',
    MISSIONS: 'flash:gng:missions'
  };

  const HISTORY_MAX = 40;
  const DAILY_MAX   = 90;

  function safeGet(k, d) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; }
    catch (e) { return d; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }

  /* ═══ PERSONAL BEST ═══ */
  function getPB() {
    return safeGet(KEYS.PB, {
      bestAccuracy: 0, bestMedianRT: 9999, bestRCS: 0,
      bestDPrime: 0, bestCommissionRate: 999, updatedAt: null
    });
  }
  function checkAndUpdatePB(session) {
    const pb = getPB();
    const rec = {};

    if (session.accuracy > pb.bestAccuracy) { rec.accuracy = { old: pb.bestAccuracy, new: session.accuracy }; pb.bestAccuracy = session.accuracy; }
    if (session.medianRT > 0 && session.medianRT < pb.bestMedianRT) { rec.medianRT = { old: pb.bestMedianRT, new: session.medianRT }; pb.bestMedianRT = session.medianRT; }
    if (session.rcs > pb.bestRCS) { rec.rcs = { old: pb.bestRCS, new: session.rcs }; pb.bestRCS = session.rcs; }
    if (session.dPrime > pb.bestDPrime) { rec.dPrime = { old: pb.bestDPrime, new: session.dPrime }; pb.bestDPrime = session.dPrime; }
    if (session.commissionRate < pb.bestCommissionRate && session.commissionRate >= 0) {
      rec.commissionRate = { old: pb.bestCommissionRate, new: session.commissionRate };
      pb.bestCommissionRate = session.commissionRate;
    }

    if (Object.keys(rec).length > 0) {
      pb.updatedAt = new Date().toISOString();
      safeSet(KEYS.PB, pb);
    }
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
      dPrime: s.dPrime,
      commissionRate: s.commissionRate
    });
    while (h.length > HISTORY_MAX) h.shift();
    safeSet(KEYS.HISTORY, h);
    return h;
  }
  function getRecentSessions(n) { return getHistory().slice(-n); }

  /* ═══ DAILY ═══ */
  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function getDailyLog() { return safeGet(KEYS.DAILY, {}); }
  function isTodayDone() { return !!getDailyLog()[getTodayKey()]; }
  function markTodayDone(r) {
    const log = getDailyLog();
    log[getTodayKey()] = { done: true, rcs: r.rcs, accuracy: r.accuracy, completedAt: new Date().toISOString() };
    const keys = Object.keys(log).sort();
    while (keys.length > DAILY_MAX) delete log[keys.shift()];
    safeSet(KEYS.DAILY, log);
  }

  /* ═══ DAILY MISSIONS ═══ */
  const MISSION_POOL = [
    { id: 'play-2',     text: 'Play 2 sessions',            target: 2,    type: 'sessions' },
    { id: 'play-4',     text: 'Play 4 sessions',            target: 4,    type: 'sessions' },
    { id: 'acc-85',     text: 'Reach 85% accuracy',         target: 85,   type: 'accuracy' },
    { id: 'acc-95',     text: 'Reach 95% accuracy',         target: 95,   type: 'accuracy' },
    { id: 'dprime-2',   text: 'Achieve d\' ≥ 2.0',          target: 20,   type: 'dPrimeX10' },
    { id: 'dprime-3',   text: 'Achieve d\' ≥ 3.0',          target: 30,   type: 'dPrimeX10' },
    { id: 'pb',         text: 'Beat a personal best',       target: 1,    type: 'pb' },
    { id: 'lowcomm',    text: 'Keep commission rate < 10%', target: 10,   type: 'lowCommission' }
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
    const shuffled = [...MISSION_POOL].sort(() => rand() - 0.5);
    const picked = shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, done: false }));
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
      else if (type === 'lowCommission') m.progress = value < m.target ? m.target : 0;
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
    inputMode: 'both', haptics: true, soundEnabled: true,
    distractors: false, adaptive: true
  };
  function getSettings() { return { ...DEFAULT_SETTINGS, ...safeGet(KEYS.SETTINGS, {}) }; }
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
    sart: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete 20 trials',   check: s => (s.trials || 0) >= 20 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach d\' ≥ 2.0',       check: s => (s.dPrime || 0) >= 2.0 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach d\' ≥ 3.0',       check: s => (s.dPrime || 0) >= 3.0 }
    ],
    reversed: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete Reversed',      check: s => s.won === true },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Complete with 90%+',      check: s => s.won && (s.accuracy || 0) >= 90 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Complete with 95%+',      check: s => s.won && (s.accuracy || 0) >= 95 }
    ],
    cued: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete 30 trials',   check: s => (s.trials || 0) >= 30 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach d\' ≥ 2.5',       check: s => (s.dPrime || 0) >= 2.5 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach d\' ≥ 3.5',       check: s => (s.dPrime || 0) >= 3.5 }
    ],
    'rule-switching': [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete 1 flip',   check: s => s.won === true },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Complete 2 flips',  check: s => (s.flips || 0) >= 2 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Complete 3 flips',  check: s => (s.flips || 0) >= 3 }
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
    if (newly.length > 0) { unlocked[mode] = md; safeSet(KEYS.BADGES, unlocked); }
    return newly;
  }
  function getModeBadges(mode) {
    const unlocked = getBadges();
    return BADGE_DEFS[mode] ? BADGE_DEFS[mode].map(d => ({
      ...d, unlocked: !!(unlocked[mode] && unlocked[mode][d.tier])
    })) : [];
  }

  /* ═══ STATISTICS ═══ */
  function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m-1] + s[m]) / 2);
  }
  function stdDev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const v = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return Math.round(Math.sqrt(v));
  }
  function rcs(correct, rts) {
    const sum = rts.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;
    return parseFloat((correct / (sum / 1000)).toFixed(2));
  }

  /* ═══ d' (Signal Detection Theory) ═══ */
  function zScore(p) {
    if (p <= 0) return -5;
    if (p >= 1) return 5;
    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    let t, z;
    if (p < 0.5) {
      t = Math.sqrt(-2 * Math.log(p));
      z = -(t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t));
    } else {
      t = Math.sqrt(-2 * Math.log(1 - p));
      z = (t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t));
    }
    return z;
  }

  function computeDPrime(hits, misses, falseAlarms, correctRejections) {
    const hr = Math.max(0.01, Math.min(0.99, hits / Math.max(1, hits + misses)));
    const fa = Math.max(0.01, Math.min(0.99, falseAlarms / Math.max(1, falseAlarms + correctRejections)));
    return parseFloat((zScore(hr) - zScore(fa)).toFixed(2));
  }

  function computeBias(hits, misses, falseAlarms, correctRejections) {
    const hr = Math.max(0.01, Math.min(0.99, hits / Math.max(1, hits + misses)));
    const fa = Math.max(0.01, Math.min(0.99, falseAlarms / Math.max(1, falseAlarms + correctRejections)));
    return parseFloat((-0.5 * (zScore(hr) + zScore(fa))).toFixed(2));
  }

  /* ═══ INSIGHTS ═══ */
  function generateInsights(s) {
    const out = [];
    if (s.commissionRate >= 25) out.push('High impulse rate — you clicked on many No-Go signals.');
    else if (s.commissionRate <= 8 && s.accuracy >= 90) out.push('Excellent impulse control — very few No-Go mistakes.');

    if (s.rtv > 200) out.push('Reaction times varied widely — focus was inconsistent.');
    else if (s.rtv > 0 && s.rtv < 80 && s.accuracy >= 90) out.push('Very stable reaction times — strong sustained attention.');

    if (s.medianRT > 0 && s.medianRT < 400 && s.accuracy >= 95) out.push('Elite zone: fast AND accurate.');
    else if (s.medianRT > 800) out.push('Speed could improve — try SART mode.');

    if (s.dPrime >= 3) out.push('High sensitivity (d\' ≥ 3) — excellent signal detection.');
    else if (s.dPrime > 0 && s.dPrime < 1) out.push('Low d\' — task discrimination is challenging.');

    if (s.isNewPB) out.push('New personal best this session!');
    return out.slice(0, 3);
  }

  /* ═══ RESET ═══ */
  function resetAll() {
    safeSet(KEYS.PB, { bestAccuracy: 0, bestMedianRT: 9999, bestRCS: 0, bestDPrime: 0, bestCommissionRate: 999, updatedAt: null });
    safeSet(KEYS.HISTORY, []);
    safeSet(KEYS.DAILY, {});
    safeSet(KEYS.BADGES, {});
    safeSet(KEYS.MISSIONS, null);
  }

  /* ═══ HISTORY CHART ═══ */
  function renderChart(container, sessions, metric) {
    if (!container) return;
    if (!sessions || sessions.length < 2) {
      container.innerHTML = '<div style="color:var(--t3);font-family:var(--f-m);font-size:11px;text-align:center;padding:30px 0;">Play 2+ sessions to see progress</div>';
      return;
    }
    const W = 600, H = 100, PAD = 10;
    const vals = sessions.map(s => s[metric]).filter(v => v != null && v > 0);
    if (vals.length < 2) { container.innerHTML = ''; return; }
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => [
      PAD + (i / (vals.length - 1)) * (W - PAD * 2),
      H - PAD - ((v - min) / range) * (H - PAD * 2)
    ]);
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const dots = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="#00EEFF"/>`).join('');
    const color = metric === 'medianRT' ? '#2EC4B6' : metric === 'accuracy' ? '#00FF96' : metric === 'dPrime' ? '#FFD60A' : '#FF0077';
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
  }

  window.GNGHelpers = {
    getPB, checkAndUpdatePB,
    getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone,
    getTodayMissions, updateMissionProgress,
    getSettings, saveSettings, applySettingsToDOM,
    getBadges, checkAndUnlockBadges, getModeBadges,
    resetAll,
    median, stdDev, rcs,
    zScore, computeDPrime, computeBias,
    generateInsights, renderChart
  };
})();