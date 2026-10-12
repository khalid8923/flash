/* ============================================================
   FLASH — Idea Flow · Helpers
   ============================================================ */
(function () {
  'use strict';

  const GAME_ID = 'idea-flow';
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

  function getPB() { return read(K.pb, { bestFluency: 0, bestNovelty: 0, bestLevel: 0, bestRCS: 0, updatedAt: null }); }

  function checkAndUpdatePB(s) {
    const pb = getPB(), records = [];
    const fl = s.fluency || 0, nv = s.novelty || 0, lv = s.maxLevel || 0, rcs = s.rcs || 0;
    if (fl > pb.bestFluency) { records.push({ key: 'bestFluency', to: fl }); pb.bestFluency = fl; }
    if (nv > pb.bestNovelty) { records.push({ key: 'bestNovelty', to: nv }); pb.bestNovelty = nv; }
    if (lv > pb.bestLevel) { records.push({ key: 'bestLevel', to: lv }); pb.bestLevel = lv; }
    if (rcs > pb.bestRCS) { records.push({ key: 'bestRCS', to: rcs }); pb.bestRCS = rcs; }
    if (records.length) { pb.updatedAt = new Date().toISOString(); write(K.pb, pb); }
    return { newRecords: records, isNewPB: records.length > 0 };
  }

  function getHistory() { return read(K.history, []); }

  function addToHistory(s) {
    const h = getHistory();
    h.unshift({
      date: new Date().toISOString(),
      mode: s.mode || 'classic',
      fluency: s.fluency || 0,
      novelty: s.novelty || 0,
      maxLevel: s.maxLevel || 0,
      score: s.score || 0
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

  function markTodayDone(r) {
    const d = read(K.daily, {});
    d[getTodayKey()] = { done: true, at: new Date().toISOString(), fluency: r.fluency || 0 };
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
      { id: 'fluency-12', desc: 'Generate 12 ideas in one session', type: 'fluency', target: 12, done: false },
      { id: 'fluency-20', desc: 'Generate 20 ideas in one session', type: 'fluency', target: 20, done: false },
      { id: 'novelty-50', desc: 'Achieve 50%+ novelty score', type: 'novelty', target: 50, done: false },
      { id: 'level-8', desc: 'Reach Level 8', type: 'level', target: 8, done: false }
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
      if (value >= ms.target) { ms.done = true; changed = true; }
    });
    if (changed) write(K.missions, m);
    return m;
  }

  function getBadges() { return read(K.badges, {}); }

  function checkAndUnlockBadges(mode, data) {
    const badges = getBadges(), unlocked = [];
    const fl = data.fluency || 0;
    const nv = data.novelty || 0;

    const rules = [
      { id: mode + '-bronze', test: () => fl >= 8 || nv >= 30 },
      { id: mode + '-silver', test: () => fl >= 15 || nv >= 50 },
      { id: mode + '-gold',   test: () => fl >= 25 || nv >= 70 }
    ];

    rules.forEach((r) => {
      if (r.test() && !badges[r.id]) {
        badges[r.id] = { at: new Date().toISOString(), fluency: fl, novelty: nv };
        unlocked.push(r.id);
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

  function generateInsights(s) {
    const out = [];
    const fl = s.fluency || 0, nv = s.novelty || 0;
    if (fl >= 20) out.push('High idea fluency — strong divergent thinking.');
    else if (fl >= 10) out.push('Solid fluency — push for more volume.');
    else out.push('Low fluency — try timed brainstorming.');
    if (nv >= 60) out.push('High novelty — original associations.');
    else if (nv < 30) out.push('Low novelty — explore less obvious paths.');
    return out.slice(0, 3);
  }

  function renderChart(container, sessions, metric) {
    if (!container || !sessions || !sessions.length) { if (container) container.innerHTML = ''; return; }
    const m = metric || 'fluency';
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

  window.IdeaFlowHelpers = {
    getPB, checkAndUpdatePB, getHistory, addToHistory, getRecentSessions,
    getTodayKey, isTodayDone, markTodayDone, getTodayMissions, updateMissionProgress,
    getBadges, checkAndUnlockBadges, getModeBadges,
    median, stdDev, rcs, generateInsights, renderChart, resetAll,
    GAME_ID
  };
})();