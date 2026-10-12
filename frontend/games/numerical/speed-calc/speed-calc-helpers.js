/* ============================================================
   FLASH — Speed Calc · Helpers
   ============================================================ */
(function () {
  'use strict';

  const GAME_ID = 'speed-calc';
  const K = {
    pb: 'flash:' + GAME_ID + ':pb',
    history: 'flash:' + GAME_ID + ':history',
    daily: 'flash:' + GAME_ID + ':daily',
    badges: 'flash:' + GAME_ID + ':badges',
    missions: 'flash:' + GAME_ID + ':missions'
  };
  const HISTORY_MAX = 30, DAILY_DAYS = 90;

  const read = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch (_) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  function getPB() { return read(K.pb, { bestAccuracy: 0, bestMedianRT: Infinity, bestLevel: 0, bestRCS: 0, updatedAt: null }); }

  function checkAndUpdatePB(s) {
    const pb = getPB(), records = [];
    const acc = s.accuracy || 0, rt = s.medianRT || Infinity, lv = s.maxLevel || 0, rcs = s.rcs || 0;
    if (acc > pb.bestAccuracy) { records.push({ key: 'bestAccuracy', to: acc }); pb.bestAccuracy = acc; }
    if (rt > 0 && rt < pb.bestMedianRT) { records.push({ key: 'bestMedianRT', to: rt }); pb.bestMedianRT = rt; }
    if (lv > pb.bestLevel) { records.push({ key: 'bestLevel', to: lv }); pb.bestLevel = lv; }
    if (rcs > pb.bestRCS) { records.push({ key: 'bestRCS', to: rcs }); pb.bestRCS = rcs; }
    if (records.length) { pb.updatedAt = new Date().toISOString(); write(K.pb, pb); }
    return { newRecords: records, isNewPB: records.length > 0 };
  }

  function getHistory() { return read(K.history, []); }

  function addToHistory(s) {
    const h = getHistory();
    h.unshift({ date: new Date().toISOString(), mode: s.mode || 'classic', accuracy: s.accuracy || 0, medianRT: s.medianRT || 0, rcs: s.rcs || 0, maxLevel: s.maxLevel || 0, score: s.score || 0 });
    while (h.length > HISTORY_MAX) h.pop();
    write(K.history, h); return h;
  }

  function getRecentSessions(n) { return getHistory().slice(0, n || 5); }

  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function isTodayDone() { const d = read(K.daily, {}); return !!(d[getTodayKey()] && d[getTodayKey()].done); }

  function markTodayDone(r) {
    const d = read(K.daily, {});
    d[getTodayKey()] = { done: true, at: new Date().toISOString(), accuracy: r.accuracy || 0, rcs: r.rcs || 0 };
    const cutoff = Date.now() - DAILY_DAYS * 86400000;
    for (const k in d) if (new Date(d[k].at || 0).getTime() < cutoff) delete d[k];
    write(K.daily, d);
  }

  function getTodayMissions() {
    const date = getTodayKey();
    const saved = read(K.missions, null);
    if (saved && saved.date === date) return saved;
    const seed = date.split('-').join('') | 0;
    const rng = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;
    const pool = [
      { id: 'acc-90', desc: 'Score 90%+ accuracy', type: 'accuracy', target: 90, done: false },
      { id: 'rt-1500', desc: 'Median RT under 1.5s', type: 'medianRT', target: 1500, done: false },
      { id: 'rt-1000', desc: 'Median RT under 1.0s', type: 'medianRT', target: 1000, done: false },
      { id: 'level-8', desc: 'Reach Level 8', type: 'level', target: 8, done: false },
      { id: 'streak-10', desc: '10 correct in a row', type: 'streak', target: 10, done: false }
    ];
    const missions = pool.slice().sort(() => rng(1) - 0.5).slice(0, 3);
    const data = { date, missions };
    write(K.missions, data);
    return data;
  }

  function updateMissionProgress(type, value) {
    const m = getTodayMissions(); let changed = false;
    m.missions.forEach((ms) => {
      if (ms.done || ms.type !== type) return;
      if (type === 'medianRT') { if (value > 0 && value <= ms.target) { ms.done = true; changed = true; } }
      else if (value >= ms.target) { ms.done = true; changed = true; }
    });
    if (changed) write(K.missions, m);
    return m;
  }

  function getBadges() { return read(K.badges, {}); }

  function checkAndUnlockBadges(mode, data) {
    const badges = getBadges(), unlocked = [];
    const acc = data.accuracy || 0;
    ['bronze', 'silver', 'gold'].forEach((tier) => {
      const min = tier === 'bronze' ? 60 : tier === 'silver' ? 80 : 95;
      const id = mode + '-' + tier;
      if (acc >= min && !badges[id]) { badges[id] = { at: new Date().toISOString(), accuracy: acc }; unlocked.push(id); }
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

  function generateInsights(s) {
    const out = [];
    const acc = s.accuracy || 0, rt = s.medianRT || 0;
    if (acc >= 95) out.push('Elite arithmetic precision.');
    else if (acc >= 80) out.push('Strong accuracy — speed is the next target.');
    else if (acc < 60) out.push('Accuracy below target — verify before submitting.');
    if (rt && rt < 900) out.push('Excellent mental calculation speed.');
    else if (rt && rt > 2500) out.push('Slow responses — practice basic operations.');
    return out.slice(0, 3);
  }

  function renderChart(container, sessions, metric) {
    if (!container || !sessions || !sessions.length) { if (container) container.innerHTML = ''; return; }
    const m = metric || 'accuracy';
    const values = sessions.map((s) => s[m] || 0).reverse();
    const W = 240, H = 60, p = 4;
    const max = Math.max(...values, 1), min = Math.min(...values, 0), range = (max - min) || 1;
    const points = values.map((v, i) => {
      const x = p + (i / Math.max(values.length - 1, 1)) * (W - p * 2);
      const y = H - p - ((v - min) / range) * (H - p * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" aria-hidden="true" style="display:block"><polyline fill="none" stroke="var(--ac)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" points="' + points + '"/></svg>';
  }

  function resetAll() { Object.values(K).forEach((k) => { try { localStorage.removeItem(k); } catch (_) {} }); }

  window.SpeedCalcHelpers = {
    getPB, checkAndUpdatePB, getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone, getTodayMissions, updateMissionProgress,
    getBadges, checkAndUnlockBadges, getModeBadges,
    median, stdDev, rcs, generateInsights, renderChart, resetAll,
    GAME_ID
  };
})();