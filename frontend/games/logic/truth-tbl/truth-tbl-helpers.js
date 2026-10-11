/* truth-tbl-helpers.js — Storage, PB, History, Badges, Missions, i18n */
(function () {
  'use strict';
  const ID = 'truth-tbl', DOMAIN = 'logic', P = 'flash:';
  const K = {
    stages: P + 'stages:' + ID,
    pb: P + ID + ':pb',
    history: P + ID + ':history',
    daily: P + ID + ':daily',
    badges: P + ID + ':badges',
    missions: P + ID + ':missions'
  };
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  const settings = () => { try { return (window.FlashSettings && FlashSettings.get()) || {}; } catch (e) { return {}; } };
  const onSettings = (f) => { try { window.FlashSettings && FlashSettings.onChange && FlashSettings.onChange(f); } catch (e) {} };
  const openPanel = () => { try { window.FlashSettings && FlashSettings.openPanel && FlashSettings.openPanel(); } catch (e) {} };
  const FS = (f) => { const s = window.FlashStages; return s && typeof s[f] === 'function' ? s[f].bind(s) : null; };

  const STR = {
    en: {
      title: 'Truth Tables', cite: 'Boolean Logic · Wason 1966',
      rule: 'Evaluate the boolean expression with the given values. Pick TRUE or FALSE.',
      classic: 'Classic', classic_d: '15 levels, 3 lives',
      speed: 'Speed', speed_d: 'Short time limit',
      endless: 'Endless', endless_d: 'One mistake ends it',
      precision: 'Precision', precision_d: 'No rush, max accuracy',
      daily: 'Daily', daily_d: 'Once per day',
      done: 'Done today', best: 'Best', level: 'Level',
      settings: 'Settings', menu: 'Menu', again: 'Again',
      newpb: 'New personal best', stage: 'Stage', badge: 'Badge',
      maxlevel: 'Max Level', passed: 'Passed', accuracy: 'Accuracy',
      true: 'TRUE', false: 'FALSE',
      evaluate: 'Evaluate',
      m_play: 'Play 3 sessions', m_lvl5: 'Reach level 5', m_perfect: 'Perfect round',
      b_first: 'First record', b_lvl7: 'Level 7+', b_pure: 'Zero mistakes', b_streak: '5-streak'
    },
    ar: {
      title: 'جداول الحقيقة', cite: 'المنطق البولياني · واسون 1966',
      rule: 'قيّم التعبير المنطقي بالقيم المعطاة. اختر صواب أو خطأ.',
      classic: 'كلاسيكي', classic_d: '١٥ مستوى، ٣ فرص',
      speed: 'سرعة', speed_d: 'حد زمني قصير',
      endless: 'بلا نهاية', endless_d: 'خطأ واحد ينتهي',
      precision: 'دقة', precision_d: 'بلا ضغط، أقصى دقة',
      daily: 'يومي', daily_d: 'مرة كل يوم',
      done: 'أُنجز اليوم', best: 'الأفضل', level: 'المستوى',
      settings: 'الإعدادات', menu: 'القائمة', again: 'مرة أخرى',
      newpb: 'رقم شخصي جديد', stage: 'المرحلة', badge: 'وسام',
      maxlevel: 'أعلى مستوى', passed: 'نجح', accuracy: 'الدقة',
      true: 'صواب', false: 'خطأ',
      evaluate: 'احسب',
      m_play: 'العب 3 جلسات', m_lvl5: 'بلوغ المستوى 5', m_perfect: 'جولة كاملة',
      b_first: 'أول تسجيل', b_lvl7: 'المستوى 7+', b_pure: 'بلا أخطاء', b_streak: '5 متتالية'
    }
  };
  const qs = new URLSearchParams(location.search);
  const isAr = () => String(qs.get('lang') || settings().lang || document.documentElement.lang || 'en').slice(0, 2) === 'ar';
  const T = (k) => { try { const v = window.FLASH_I18N && FLASH_I18N.t('tt.' + k); if (v && v !== 'tt.' + k) return v; } catch (e) {} return STR[isAr() ? 'ar' : 'en'][k] || STR.en[k] || k; };
  const N = (x, d = 0) => new Intl.NumberFormat(isAr() ? 'ar-EG' : 'en', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);
  const stageName = (id) => { const s = window.TruthTblStages && window.TruthTblStages.list.find(x => x.id === id); return s ? s.n[isAr() ? 1 : 0] : id; };

  const pbAll = () => get(K.pb, {});
  const pbCheck = (mode, score, level, acc) => { const p = pbAll(); const was = p[mode] ? p[mode].score : 0; if (score > was) { p[mode] = { score, level, acc, date: today() }; set(K.pb, p); return true; } return false; };
  const history = () => get(K.history, []);
  const addHistory = (r) => set(K.history, history().concat([r]).slice(-30));
  const dailyLog = () => get(K.daily, {});
  const dailyDone = () => !!dailyLog()[today()];
  const dailyAdd = (r) => { const l = dailyLog(); l[today()] = r; Object.keys(l).sort().slice(0, -90).forEach(k => { delete l[k]; }); set(K.daily, l); };

  const stageCheck = (s) => { const u = get(K.stages, {}); const f = []; (window.TruthTblStages ? window.TruthTblStages.list : []).forEach(x => { if (!u[x.id] && x.test(s)) { u[x.id] = Date.now(); f.push(x.id); } }); if (f.length) set(K.stages, u); return f; };

  const BAD = [
    { id: 'first', t: s => s.n > 0 },
    { id: 'lvl7', t: s => s.maxLevel >= 7 },
    { id: 'pure', t: s => s.accuracy === 100 && s.n >= 5 },
    { id: 'streak', t: s => s.maxStreak >= 5 }
  ];
  const unlockBadges = (s) => { const u = get(K.badges, {}); const f = []; BAD.forEach(b => { if (!u[b.id] && b.t(s)) { u[b.id] = Date.now(); f.push(b.id); } }); if (f.length) set(K.badges, f); return f; };

  const MIS = [
    { id: 'play', n: 3, f: () => 1 },
    { id: 'lvl5', n: 1, f: s => s.maxLevel >= 5 ? 1 : 0 },
    { id: 'perfect', n: 1, f: s => s.accuracy === 100 ? 1 : 0 }
  ];
  function missions() { let m = get(K.missions, null); if (!m || m.date !== today()) { m = { date: today(), p: { play: 0, lvl5: 0, perfect: 0 } }; set(K.missions, m); } return m; }
  const updateMissions = (s) => { const m = missions(); MIS.forEach(x => { m.p[x.id] = Math.min(x.n, (m.p[x.id] || 0) + x.f(s)); }); set(K.missions, m); };

  const row = (el, a) => { if (!el) return; el.innerHTML = a.map(x => '<span>' + x + '</span>').join(''); };
  const pbRow = (el) => { const p = pbAll().classic; row(el, p ? [T('best') + ' ' + N(p.score), T('level') + ' ' + N(p.level), T('accuracy') + ' ' + N(p.acc) + '%'] : []); };
  const missionRow = (el) => { const m = missions(); row(el, MIS.map(x => (m.p[x.id] >= x.n ? '■ ' : '□ ') + T('m_' + x.id))); };
  function drawStrip(el) { if (!el) return; const u = get(K.stages, {}); const i = isAr() ? 1 : 0; const list = window.TruthTblStages ? window.TruthTblStages.list : []; el.innerHTML = list.map(s => '<span class="stg' + (u[s.id] ? ' on' : '') + '" title="' + s.d[i] + '">' + s.n[i] + '</span>').join(''); }
  function drawLog(svg) {
    if (!svg) return;
    const h = history().slice(-15);
    const st = 280 / 14;
    const ar = isAr();
    const X = i => ar ? 290 - i * st : 10 + i * st;
    const Y = l => 65 - Math.max(0, Math.min(15, l)) * 4.2;
    svg.innerHTML = '<line class="ref" x1="10" x2="290" y1="' + Y(7) + '" y2="' + Y(7) + '"/>'
      + (h.length > 1 ? '<polyline class="trace" points="' + h.map((r, i) => X(i) + ',' + Y(r.level || 0)).join(' ') + '"/>' : '')
      + h.map((r, i) => '<circle class="' + (r.mode === 'classic' ? '' : 'alt') + '" cx="' + X(i) + '" cy="' + Y(r.level || 0) + '" r="2.6"/>').join('');
  }

  const base = () => window.FLASH_API_BASE || '';
  async function net(path, body) {
    if (location.protocol === 'file:' && !base()) return null;
    const c = new AbortController(), t = setTimeout(() => c.abort(), 2500);
    try { const r = await fetch(base() + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body ? JSON.stringify(body) : undefined, signal: c.signal }); return r.ok ? await r.json() : null; }
    catch (e) { return null; } finally { clearTimeout(t); }
  }
  const localSeed = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

  window.TruthTblHelpers = {
    ID, DOMAIN, K, get, set, today, settings, onSettings, openPanel, FS, T, N, isAr, stageName,
    pbAll, pbCheck, history, addHistory, dailyDone, dailyAdd,
    stageCheck, unlockBadges, updateMissions, pbRow, missionRow, drawStrip, drawLog,
    net, localSeed
  };
})();