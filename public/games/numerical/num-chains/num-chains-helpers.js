/* ============================================================
   FLASH — Num Chains · Helpers (storage · PB · history · badges)
   ============================================================ */
(function () {
  'use strict';

  const GAME_ID = 'num-chains';
  const K = {
    pb: 'flash:' + GAME_ID + ':pb',
    history: 'flash:' + GAME_ID + ':history',
    daily: 'flash:' + GAME_ID + ':daily',
    badges: 'flash:' + GAME_ID + ':badges',
    missions: 'flash:' + GAME_ID + ':missions'
  };
  const HISTORY_MAX = 30;
  const DAILY_DAYS = 90;

  const read = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch (_) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  function getPB() {
    return read(K.pb, { bestAccuracy: 0, bestMedianRT: Infinity, bestLevel: 0, bestRCS: 0, updatedAt: null });
  }

  function checkAndUpdatePB(session) {
    const pb = getPB();
    const records = [];
    const acc = session.accuracy || 0;
    const rt = session.medianRT || Infinity;
    const lv = session.maxLevel || 0;
    const rcs = session.rcs || 0;

    if (acc > pb.bestAccuracy) { records.push({ key: 'bestAccuracy', to: acc }); pb.bestAccuracy = acc; }
    if (rt > 0 && rt < pb.bestMedianRT) { records.push({ key: 'bestMedianRT', to: rt }); pb.bestMedianRT = rt; }
    if (lv > pb.bestLevel) { records.push({ key: 'bestLevel', to: lv }); pb.bestLevel = lv; }
    if (rcs > pb.bestRCS) { records.push({ key: 'bestRCS', to: rcs }); pb.bestRCS = rcs; }

    if (records.length) { pb.updatedAt = new Date().toISOString(); write(K.pb, pb); }
    return { newRecords: records, isNewPB: records.length > 0 };
  }

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

  function getRecentSessions(n) { return getHistory().slice(0, n || 5); }

  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function isTodayDone() {
    const d = read(K.daily, {});
    return !!(d[getTodayKey()] && d[getTodayKey()].done);
  }

  function markTodayDone(result) {
    const d = read(K.daily, {});
    d[getTodayKey()] = { done: true, at: new Date().toISOString(), accuracy: result.accuracy || 0, rcs: result.rcs || 0 };
    const cutoff = Date.now() - DAILY_DAYS * 86400000;
    for (const k in d) {
      if (new Date(d[k].at || 0).getTime() < cutoff) delete d[k];
    }
    write(K.daily, d);
  }

  function getTodayMissions() {
    const date = getTodayKey();
    const saved = read(K.missions, null);
    if (saved && saved.date === date) return saved;
    const seed = date.split('-').join('') | 0;
    const rng = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;
    const pool = [
      { id: 'acc-90', desc: 'Score 90%+ accuracy in Classic', type: 'accuracy', target: 90, done: false },
      { id: 'level-8', desc: 'Reach Level 8', type: 'level', target: 8, done: false },
      { id: 'chain-5', desc: 'Solve 5 chains in a row', type: 'streak', target: 5, done: false },
      { id: 'rt-2500', desc: 'Median RT under 2.5s', type: 'medianRT', target: 2500, done: false },
      { id: 'perfect', desc: '100% accuracy any mode', type: 'perfect', target: 1, done: false }
    ];
    const missions = pool.slice().sort(() => rng(1) - 0.5).slice(0, 3);
    const data = { date, missions };
    write(K.missions, data);
    return data;
  }

  function updateMissionProgress(type, value) {
    const m = getTodayMissions();
    let changed = false;
    m.missions.forEach((ms) => {
      if (ms.done || ms.type !== type) return;
      if (type === 'medianRT') {
        if (value > 0 && value <= ms.target) { ms.done = true; changed = true; }
      } else if (value >= ms.target) { ms.done = true; changed = true; }
    });
    if (changed) write(K.missions, m);
    return m;
  }

  function getBadges() { return read(K.badges, {}); }

  function checkAndUnlockBadges(mode, data) {
    const badges = getBadges();
    const unlocked = [];
    const acc = data.accuracy || 0;
    ['bronze', 'silver', 'gold'].forEach((tier) => {
      const min = tier === 'bronze' ? 60 : tier === 'silver' ? 80 : 95;
      const id = mode + '-' + tier;
      if (acc >= min && !badges[id]) {
        badges[id] = { at: new Date().toISOString(), accuracy: acc };
        unlocked.push(id);
      }
    });
    if (unlocked.length) write(K.badges, badges);
    return unlocked;
  }

  function getModeBadges(mode) {
    const b = getBadges();
    return ['bronze', 'silver', 'gold'].map((t) => ({ id: mode + '-' + t, tier: t, unlocked: !!b[mode + '-' + t] }));
  }

  function median(arr) {
    if (!arr || !arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function stdDev(arr) {
    if (!arr || arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  }

  function rcs(correct, rtsMs) {
    if (!rtsMs || !rtsMs.length) return 0;
    const sec = rtsMs.reduce((a, b) => a + b, 0) / 1000;
    return sec > 0 ? (correct / sec) : 0;
  }

  function generateInsights(session) {
    const out = [];
    const acc = session.accuracy || 0;
    const rt = session.medianRT || 0;
    if (acc >= 95) out.push('Strong chain-building accuracy.');
    else if (acc >= 80) out.push('Solid accuracy — push for higher levels.');
    else if (acc < 60) out.push('Accuracy below target — slow down.');
    if (rt && rt < 1800) out.push('Fast chain solving — good working memory.');
    else if (rt && rt > 4000) out.push('Slow chains — practice intermediate steps.');
    return out.slice(0, 3);
  }

  function renderChart(container, sessions, metric) {
    if (!container || !sessions || !sessions.length) { if (container) container.innerHTML = ''; return; }
    const m = metric || 'accuracy';
    const values = sessions.map((s) => s[m] || 0).reverse();
    const W = 240, H = 60, p = 4;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = (max - min) || 1;
    const points = values.map((v, i) => {
      const x = p + (i / Math.max(values.length - 1, 1)) * (W - p * 2);
      const y = H - p - ((v - min) / range) * (H - p * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" aria-hidden="true" style="display:block"><polyline fill="none" stroke="var(--ac)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" points="' + points + '"/></svg>';
  }

  function resetAll() {
    Object.values(K).forEach((k) => { try { localStorage.removeItem(k); } catch (_) {} });
  }

  window.NumChainsHelpers = {
    getPB, checkAndUpdatePB,
    getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone,
    getTodayMissions, updateMissionProgress,
    getBadges, checkAndUnlockBadges, getModeBadges,
    median, stdDev, rcs,
    generateInsights, renderChart, resetAll,
    GAME_ID
  };
})();