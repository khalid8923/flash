/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Helpers Module v2.2
   Storage · PB · History · Insights · Daily · Settings
   Challenge Progress · Endless Best · Mastery Badges
   Loaded BEFORE game.js
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const KEYS = {
    PB:        'flash:flanker:pb',
    HISTORY:   'flash:flanker:history',
    DAILY:     'flash:flanker:daily',
    SETTINGS:  'flash:flanker:settings',
    CHALLENGE: 'flash:flanker:challenge',
    ENDLESS:   'flash:flanker:endless',
    BADGES:    'flash:flanker:badges'
  };

  const HISTORY_MAX = 30;
  const DAILY_MAX   = 90;

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[FlankerHelpers] read failed:', key, e);
      return fallback;
    }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('[FlankerHelpers] write failed:', key, e); return false; }
  }

  /* ═══ PERSONAL BEST ═══ */
  function getPB() {
    return safeGet(KEYS.PB, {
      bestAccuracy: 0, bestMedianRT: 9999, bestRCS: 0,
      bestFlankerEffect: 9999, updatedAt: null
    });
  }
  function checkAndUpdatePB(session) {
    const pb = getPB();
    const newRecords = {};
    if (session.accuracy > pb.bestAccuracy) {
      newRecords.accuracy = { old: pb.bestAccuracy, new: session.accuracy };
      pb.bestAccuracy = session.accuracy;
    }
    if (session.medianRT > 0 && session.medianRT < pb.bestMedianRT) {
      newRecords.medianRT = { old: pb.bestMedianRT, new: session.medianRT };
      pb.bestMedianRT = session.medianRT;
    }
    if (session.rcs > pb.bestRCS) {
      newRecords.rcs = { old: pb.bestRCS, new: session.rcs };
      pb.bestRCS = session.rcs;
    }
    if (session.flankerEffect !== null && session.flankerEffect < pb.bestFlankerEffect) {
      newRecords.flankerEffect = { old: pb.bestFlankerEffect, new: session.flankerEffect };
      pb.bestFlankerEffect = session.flankerEffect;
    }
    if (Object.keys(newRecords).length > 0) {
      pb.updatedAt = new Date().toISOString();
      safeSet(KEYS.PB, pb);
    }
    return newRecords;
  }

  /* ═══ HISTORY ═══ */
  function getHistory() { return safeGet(KEYS.HISTORY, []); }
  function addToHistory(session) {
    const history = getHistory();
    history.push({
      date: new Date().toISOString(),
      mode: session.mode || 'classic',
      medianRT: session.medianRT,
      accuracy: session.accuracy,
      rcs: session.rcs,
      flankerEffect: session.flankerEffect
    });
    while (history.length > HISTORY_MAX) history.shift();
    safeSet(KEYS.HISTORY, history);
    return history;
  }
  function getRecentSessions(n) { return getHistory().slice(-n); }

  /* ═══ DAILY ═══ */
  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function getDailyLog() { return safeGet(KEYS.DAILY, {}); }
  function isTodayDone() { return !!getDailyLog()[getTodayKey()]; }
  function markTodayDone(result) {
    const log = getDailyLog();
    log[getTodayKey()] = {
      done: true, rcs: result.rcs, medianRT: result.medianRT,
      accuracy: result.accuracy, completedAt: new Date().toISOString()
    };
    const keys = Object.keys(log).sort();
    while (keys.length > DAILY_MAX) delete log[keys.shift()];
    safeSet(KEYS.DAILY, log);
  }

  /* ═══ SETTINGS ═══ */
  const DEFAULT_SETTINGS = {
    reducedMotion: false, highContrast: false,
    inputMode: 'both', haptics: true, skipPractice: false,
    soundEnabled: true
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

  /* ═══ CHALLENGE PROGRESS ═══ */
  function getChallengeProgress() {
    return safeGet(KEYS.CHALLENGE, { highestUnlocked: 1, completed: {} });
  }
  function markChallengeComplete(n) {
    const p = getChallengeProgress();
    p.completed[n] = { date: new Date().toISOString() };
    if (n + 1 > p.highestUnlocked) p.highestUnlocked = n + 1;
    safeSet(KEYS.CHALLENGE, p);
    return p;
  }
  function isChallengeUnlocked(n) {
    return n <= getChallengeProgress().highestUnlocked;
  }
  function isChallengeComplete(n) {
    return !!getChallengeProgress().completed[n];
  }

  /* ═══ ENDLESS BEST ═══ */
  function getEndlessBest() {
    return safeGet(KEYS.ENDLESS, { bestLevel: 0, bestCorrect: 0, bestStreak: 0, updatedAt: null });
  }
  function updateEndlessBest(level, correct, streak) {
    const b = getEndlessBest();
    let updated = false;
    if (level > b.bestLevel) { b.bestLevel = level; updated = true; }
    if (correct > b.bestCorrect) { b.bestCorrect = correct; updated = true; }
    if (streak > b.bestStreak) { b.bestStreak = streak; updated = true; }
    if (updated) { b.updatedAt = new Date().toISOString(); safeSet(KEYS.ENDLESS, b); }
    return { best: b, isNew: updated };
  }

  /* ═══ MASTERY BADGES ═══ */
  const BADGE_DEFS = {
    classic: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Reach Level 5',   check: (s) => (s.maxLevel || 0) >= 5 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach Level 10',  check: (s) => (s.maxLevel || 0) >= 10 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach Level 15',  check: (s) => (s.maxLevel || 0) >= 15 }
    ],
    endless: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Reach Level 5',   check: (s) => (s.levelReached || 0) >= 5 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Reach Level 10',  check: (s) => (s.levelReached || 0) >= 10 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Reach Level 20',  check: (s) => (s.levelReached || 0) >= 20 }
    ],
    challenge: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete Challenge 3',  check: null },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Complete Challenge 6',  check: null },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Complete Challenge 10', check: null }
    ],
    'time-attack': [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Score 20 correct', check: (s) => (s.totalCorrect || 0) >= 20 },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Score 30 correct', check: (s) => (s.totalCorrect || 0) >= 30 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Score 40 correct', check: (s) => (s.totalCorrect || 0) >= 40 }
    ],
    boss: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Defeat the boss',        check: (s) => s.won === true },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Win without missing',     check: (s) => s.won === true },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Win with avg RT < 900ms', check: (s) => s.won === true && (s.medianRT || 9999) < 900 }
    ],
    reverse: [
      { tier: 'bronze', label: 'Bronze', icon: '🥉', desc: 'Complete the flip',       check: (s) => s.won === true },
      { tier: 'silver', label: 'Silver', icon: '🥈', desc: 'Complete with 2+ lives',  check: (s) => s.won === true && (s.reached || 0) >= 20 },
      { tier: 'gold',   label: 'Gold',   icon: '🥇', desc: 'Complete with accuracy',  check: (s) => s.won === true && (s.correct || 0) >= 18 }
    ]
  };

  function getBadges() {
    return safeGet(KEYS.BADGES, {});
  }

  function checkAndUnlockBadges(mode, sessionData) {
    const unlocked = getBadges();
    const defs = BADGE_DEFS[mode];
    if (!defs) return [];

    const newlyUnlocked = [];
    const modeData = unlocked[mode] || {};

    defs.forEach(def => {
      if (modeData[def.tier]) return;
      let passed = false;

      if (mode === 'challenge') {
        const p = getChallengeProgress();
        const completed = Object.keys(p.completed).length;
        passed = (def.tier === 'bronze' && completed >= 3)
              || (def.tier === 'silver' && completed >= 6)
              || (def.tier === 'gold'   && completed >= 10);
      } else if (def.check) {
        passed = def.check(sessionData || {});
      }

      if (passed) {
        modeData[def.tier] = { unlockedAt: new Date().toISOString() };
        newlyUnlocked.push(def);
      }
    });

    if (newlyUnlocked.length > 0) {
      unlocked[mode] = modeData;
      safeSet(KEYS.BADGES, unlocked);
    }
    return newlyUnlocked;
  }

  function getBadgeDefs(mode) {
    return BADGE_DEFS[mode] || [];
  }

  function getModeBadges(mode) {
    const unlocked = getBadges();
    return BADGE_DEFS[mode] ? BADGE_DEFS[mode].map(d => ({
      ...d,
      unlocked: !!(unlocked[mode] && unlocked[mode][d.tier])
    })) : [];
  }

  function resetBadges() {
    safeSet(KEYS.BADGES, {});
  }

  /* ═══ RESET ALL ═══ */
  function resetAll() {
    safeSet(KEYS.PB, {
      bestAccuracy: 0, bestMedianRT: 9999, bestRCS: 0,
      bestFlankerEffect: 9999, updatedAt: null
    });
    safeSet(KEYS.HISTORY, []);
    safeSet(KEYS.DAILY, {});
    safeSet(KEYS.CHALLENGE, { highestUnlocked: 1, completed: {} });
    safeSet(KEYS.ENDLESS, { bestLevel: 0, bestCorrect: 0, bestStreak: 0, updatedAt: null });
    safeSet(KEYS.BADGES, {});
  }

  /* ═══ STATISTICS ═══ */
  function median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid-1] + sorted[mid]) / 2);
  }
  function stdDev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return Math.round(Math.sqrt(variance));
  }
  function rcs(correctCount, rtsArray) {
    const sumMs = rtsArray.reduce((a, b) => a + b, 0);
    if (sumMs === 0) return 0;
    return parseFloat((correctCount / (sumMs / 1000)).toFixed(2));
  }

  /* ═══ INSIGHTS ═══ */
  function generateInsights(session) {
    const insights = [];
    if (session.congruentAccuracy !== null && session.incongruentAccuracy !== null) {
      const gap = session.congruentAccuracy - session.incongruentAccuracy;
      if (gap >= 20) insights.push('Large accuracy gap between congruent and incongruent trials — conflict handling is the main focus area.');
      else if (gap <= 5 && session.incongruentAccuracy >= 85) insights.push('Consistent accuracy across both conditions — strong conflict control.');
    }
    if (session.rtv > 200) insights.push('Reaction times varied widely — focus was inconsistent this session.');
    else if (session.rtv > 0 && session.rtv < 80) insights.push('Reaction times were remarkably consistent — excellent focus stability.');
    if (session.medianRT > 0 && session.medianRT < 400 && session.accuracy >= 95) insights.push('Elite zone: fast AND accurate.');
    else if (session.medianRT > 800) insights.push('Speed could improve — try Endless mode.');
    if (session.flankerEffect !== null) {
      if (session.flankerEffect < 30) insights.push('Very low flanker effect — distractors barely affected you.');
      else if (session.flankerEffect > 150) insights.push('High flanker effect — distractors had a strong impact.');
    }
    if (session.isNewPB) insights.push('New personal best set this session!');
    return insights.slice(0, 3);
  }

  /* ═══ HISTORY CHART ═══ */
  function renderHistoryChart(container, sessions, metric) {
    if (!container) return;
    if (!sessions || sessions.length < 2) {
      container.innerHTML = '<div style="color:var(--t3);font-family:var(--f-m);font-size:11px;text-align:center;padding:30px 0;">Play 2+ sessions to see progress</div>';
      return;
    }
    const W = 600, H = 100, PAD = 10;
    const values = sessions.map(s => s[metric]).filter(v => v != null && v > 0);
    if (values.length < 2) { container.innerHTML = ''; return; }
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return [x, y];
    });
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const dots = points.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="#00EEFF"/>`).join('');
    const color = metric === 'medianRT' ? '#2EC4B6' : metric === 'accuracy' ? '#00FF96' : '#FFD60A';
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
  }

  /* ═══ EXPORT — SINGLE, CLEAN ═══ */
  window.FlankerHelpers = {
    getPB, checkAndUpdatePB,
    getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone,
    getSettings, saveSettings, applySettingsToDOM,
    getChallengeProgress, markChallengeComplete,
    isChallengeUnlocked, isChallengeComplete,
    getEndlessBest, updateEndlessBest,
    getBadges, checkAndUnlockBadges, getBadgeDefs, getModeBadges, resetBadges,
    resetAll,
    median, stdDev, rcs,
    generateInsights, renderHistoryChart
  };
})();