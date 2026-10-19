/* ============================================================
   FLASH — Mental Math · Helpers
   Storage · PB · History · Badges · Missions · Insights · Chart
   ============================================================ */
(function () {
  'use strict';

  const GAME_ID = 'mental-math';
  const K = {
    pb:      'flash:' + GAME_ID + ':pb',
    history: 'flash:' + GAME_ID + ':history',
    daily:   'flash:' + GAME_ID + ':daily',
    badges:  'flash:' + GAME_ID + ':badges',
    missions:'flash:' + GAME_ID + ':missions'
  };
  const HISTORY_MAX = 30;
  const DAILY_DAYS = 90;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  /* ═══ PB ═══ */
  function getPB() {
    return read(K.pb, {
      bestAccuracy: 0,
      bestMedianRT: Infinity,
      bestLevel: 0,
      bestRCS: 0,
      updatedAt: null
    });
  }

  function checkAndUpdatePB(session) {
    const pb = getPB();
    const records = [];

    const acc = session.accuracy || 0;
    if (acc > pb.bestAccuracy) {
      records.push({ key: 'bestAccuracy', from: pb.bestAccuracy, to: acc });
      pb.bestAccuracy = acc;
    }

    const rt = session.medianRT || Infinity;
    if (rt > 0 && rt < pb.bestMedianRT) {
      records.push({ key: 'bestMedianRT', from: pb.bestMedianRT, to: rt });
      pb.bestMedianRT = rt;
    }

    const lv = session.maxLevel || 0;
    if (lv > pb.bestLevel) {
      records.push({ key: 'bestLevel', from: pb.bestLevel, to: lv });
      pb.bestLevel = lv;
    }

    const rcs = session.rcs || 0;
    if (rcs > pb.bestRCS) {
      records.push({ key: 'bestRCS', from: pb.bestRCS, to: rcs });
      pb.bestRCS = rcs;
    }

    if (records.length) {
      pb.updatedAt = new Date().toISOString();
      write(K.pb, pb);
    }
    return { newRecords: records, isNewPB: records.length > 0 };
  }

  /* ═══ History ═══ */
  function getHistory() { return read(K.history, []); }

  function addToHistory(session) {
    const h = getHistory();
    h.unshift({
      date: new Date().toISOString(),
      mode: session.mode || 'classic',
      accuracy: session.accuracy || 0,
      medianRT: session.medianRT || 0,
      rcs: session.rcs || 0,
      maxLevel: session.maxLevel || 0,
      score: session.score || 0
    });
    while (h.length > HISTORY_MAX) h.pop();
    write(K.history, h);
    return h;
  }

  function getRecentSessions(n) {
    return getHistory().slice(0, n || 5);
  }

  /* ═══ Daily ═══ */
  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function isTodayDone() {
    const d = read(K.daily, {});
    return !!(d[getTodayKey()] && d[getTodayKey()].done);
  }

  function markTodayDone(result) {
    const d = read(K.daily, {});
    const key = getTodayKey();
    d[key] = {
      done: true,
      at: new Date().toISOString(),
      accuracy: result.accuracy || 0,
      rcs: result.rcs || 0
    };
    /* Prune old */
    const cutoff = Date.now() - DAILY_DAYS * 86400000;
    for (const k in d) {
      const at = new Date(d[k].at || 0).getTime();
      if (at < cutoff) delete d[k];
    }
    write(K.daily, d);
  }

  /* ═══ Missions ═══ */
  function getTodayMissions() {
    const date = getTodayKey();
    const saved = read(K.missions, null);
    if (saved && saved.date === date) return saved;

    /* Deterministic missions from date */
    const seed = date.split('-').join('') | 0;
    const rng = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

    const pool = [
      { id: 'acc-90',   desc: 'Score 90%+ accuracy in Classic',  type: 'accuracy',  target: 90,  done: false },
      { id: 'level-8',  desc: 'Reach Level 8',                    type: 'level',     target: 8,   done: false },
      { id: 'speed-80', desc: 'Score 80%+ in Speed mode',         type: 'speed',     target: 80,  done: false },
      { id: 'rt-1500',  desc: 'Median RT under 1.5s',             type: 'medianRT',  target: 1500, done: false },
      { id: 'perfect',  desc: 'Get 100% accuracy in any mode',    type: 'perfect',   target: 1,   done: false },
      { id: 'chain-5',  desc: 'Answer 5 in a row correctly',      type: 'streak',    target: 5,   done: false }
    ];

    const shuffled = pool.slice().sort(() => rng(1) - 0.5);
    const missions = shuffled.slice(0, 3);

    const data = { date, missions };
    write(K.missions, data);
    return data;
  }

  function updateMissionProgress(type, value) {
    const m = getTodayMissions();
    let changed = false;
    m.missions.forEach((ms) => {
      if (ms.done) return;
      if (ms.type !== type) return;
      if (type === 'medianRT') {
        if (value > 0 && value <= ms.target) { ms.done = true; changed = true; }
      } else if (value >= ms.target) {
        ms.done = true; changed = true;
      }
    });
    if (changed) write(K.missions, m);
    return m;
  }

  /* ═══ Badges ═══ */
  function getBadges() {
    return read(K.badges, {});
  }

  function checkAndUnlockBadges(mode, data) {
    const badges = getBadges();
    const unlocked = [];
    const acc = data.accuracy || 0;

    const tiers = [
      { id: mode + '-bronze', min: 60 },
      { id: mode + '-silver', min: 80 },
      { id: mode + '-gold',   min: 95 }
    ];

    tiers.forEach((t) => {
      if (acc >= t.min && !badges[t.id]) {
        badges[t.id] = { at: new Date().toISOString(), accuracy: acc };
        unlocked.push(t.id);
      }
    });

    if (unlocked.length) write(K.badges, badges);
    return unlocked;
  }

  function getModeBadges(mode) {
    const badges = getBadges();
    return ['bronze', 'silver', 'gold']
      .map((tier) => ({
        id: mode + '-' + tier,
        tier,
        unlocked: !!badges[mode + '-' + tier]
      }));
  }

  /* ═══ Stats ═══ */
  function median(arr) {
    if (!arr || !arr.length) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function stdDev(arr) {
    if (!arr || arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }

  function rcs(correct, rtsMs) {
    if (!rtsMs || !rtsMs.length) return 0;
    const totalSec = rtsMs.reduce((a, b) => a + b, 0) / 1000;
    return totalSec > 0 ? (correct / totalSec) : 0;
  }

  /* ═══ Insights ═══ */
  function generateInsights(session) {
    const out = [];
    const acc = session.accuracy || 0;
    const rt = session.medianRT || 0;

    if (acc >= 95) out.push('Accuracy at the top — ready for harder levels.');
    else if (acc >= 80) out.push('Strong accuracy — stay consistent.');
    else if (acc < 60) out.push('Accuracy below target — slow down and focus.');

    if (rt && rt < 1200) out.push('Fast median RT — strong processing speed.');
    else if (rt && rt > 3000) out.push('Slow median RT — accuracy may be too costly.');

    if (session.maxLevel >= 10) out.push('Reached high difficulty — real progress.');

    return out.slice(0, 3);
  }

  /* ═══ Chart ═══ */
  function renderChart(container, sessions, metric) {
    if (!container) return;
    if (!sessions || !sessions.length) { container.innerHTML = ''; return; }

    const m = metric || 'accuracy';
    const values = sessions.map((s) => s[m] || 0).reverse();
    const W = 240, H = 60, pad = 4;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = (max - min) || 1;

    const points = values.map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');

    const svg =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" ' +
      'preserveAspectRatio="none" aria-hidden="true" ' +
      'style="display:block">' +
      '<polyline fill="none" stroke="var(--ac)" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" points="' + points + '"/>' +
      '</svg>';

    container.innerHTML = svg;
  }

  /* ═══ Reset ═══ */
  function resetAll() {
    Object.values(K).forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  }

  /* ═══ Export ═══ */
  window.MentalMathHelpers = {
    getPB, checkAndUpdatePB,
    getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone,
    getTodayMissions, updateMissionProgress,
    getBadges, checkAndUnlockBadges, getModeBadges,
    median, stdDev, rcs,
    generateInsights,
    renderChart,
    resetAll,
    GAME_ID
  };

})();