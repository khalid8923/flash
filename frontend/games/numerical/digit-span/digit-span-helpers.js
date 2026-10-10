/* digit-span-helpers.js — Storage, PB, History, Badges, Missions, i18n, network */
(function () {
  'use strict';
  const ID = 'digit-span', DOMAIN = 'numerical', P = 'flash:';
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
      title: 'Digit Span', cite: 'WAIS-IV · Backward Digit Span',
      rule: 'Digits appear one at a time. Enter them in REVERSE order.',
      classic: 'Classic', classic_d: '12 levels, 3 lives',
      speed: 'Speed', speed_d: 'Faster show, tighter gap',
      endless: 'Endless', endless_d: 'One mistake ends it',
      precision: 'Precision', precision_d: 'No rush, max accuracy',
      daily: 'Daily', daily_d: 'Once per day',
      done: 'Done today', best: 'Best', level: 'Level', span: 'Span',
      settings: 'Settings', menu: 'Menu', again: 'Again',
      newpb: 'New personal best', stage: 'Stage', badge: 'Badge',
      maxspan: 'Max Span', passed: 'Passed', accuracy: 'Accuracy',
      m_play: 'Play 3 sessions', m_span5: 'Reach span 5', m_perfect: 'Perfect round',
      b_first: 'First record', b_span6: 'Span 6+', b_back4: 'Backward 4', b_streak: '5-streak'
    },
    ar: {
      title: 'مدى الأرقام', cite: 'WAIS-IV · مدى الأرقام العكسي',
      rule: 'تظهر الأرقام واحداً واحداً. أدخلها بترتيب عكسي.',
      classic: 'كلاسيكي', classic_d: '12 مستوى، 3 فرص',
      speed: 'سرعة', speed_d: 'عرض أسرع، فجوة أقصر',
      endless: 'بلا نهاية', endless_d: 'خطأ واحد ينتهي',
      precision: 'دقة', precision_d: 'بلا ضغط، أقصى دقة',
      daily: 'يومي', daily_d: 'مرة كل يوم',
      done: 'أُنجز اليوم', best: 'الأفضل', level: 'المستوى', span: 'المدى',
      settings: 'الإعدادات', menu: 'القائمة', again: 'مرة أخرى',
      newpb: 'رقم شخصي جديد', stage: 'المرحلة', badge: 'وسام',
      maxspan: 'أقصى مدى', passed: 'نجح', accuracy: 'الدقة',
      m_play: 'العب 3 جلسات', m_span5: 'بلوغ المدى 5', m_perfect: 'جولة كاملة',
      b_first: 'أول تسجيل', b_span6: 'مدى 6+', b_back4: 'عكسي 4', b_streak: '5 متتالية'
    }
  };
  const qs = new URLSearchParams(location.search);
  const isAr = () => String(qs.get('lang') || settings().lang || document.documentElement.lang || 'en').slice(0, 2) === 'ar';
  const T = (k) => { try { const v = window.FLASH_I18N && FLASH_I18N.t('ds.' + k); if (v && v !== 'ds.' + k) return v; } catch (e) {} return STR[isAr() ? 'ar' : 'en'][k] || STR.en[k] || k; };
  const N = (x, d = 0) => new Intl.NumberFormat(isAr() ? 'ar-EG' : 'en', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);
  const stageName = (id) => { const s = window.DigitSpanStages && window.DigitSpanStages.list.find(x => x.id === id); return s ? s.n[isAr() ? 1 : 0] : id; };

  const pbAll = () => get(K.pb, {});
  const pbCheck = (mode, score, span, acc) => { const p = pbAll(); const was = p[mode] ? p[mode].score : 0; if (score > was) { p[mode] = { score, span, acc, date: today() }; set(K.pb, p); return true; } return false; };
  const history = () => get(K.history, []);
  const addHistory = (r) => set(K.history, history().concat([r]).slice(-30));
  const dailyLog = () => get(K.daily, {});
  const dailyDone = () => !!dailyLog()[today()];
  const dailyAdd = (r) => { const l = dailyLog(); l[today()] = r; Object.keys(l).sort().slice(0, -90).forEach(k => { delete l[k]; }); set(K.daily, l); };

  const stageCheck = (s) => { const u = get(K.stages, {}); const f = []; (window.DigitSpanStages ? window.DigitSpanStages.list : []).forEach(x => { if (!u[x.id] && x.test(s)) { u[x.id] = Date.now(); f.push(x.id); } }); if (f.length) set(K.stages, u); return f; };

  const BAD = [
    { id: 'first', t: s => s.n > 0 },
    { id: 'span6', t: s => s.maxSpan >= 6 },
    { id: 'back4', t: s => s.maxSpan >= 4 && s.mode === 'classic' },
    { id: 'streak', t: s => s.maxStreak >= 5 }
  ];
  const unlockBadges = (s) => { const u = get(K.badges, {}); const f = []; BAD.forEach(b => { if (!u[b.id] && b.t(s)) { u[b.id] = Date.now(); f.push(b.id); } }); if (f.length) set(K.badges, f); return f; };

  const MIS = [
    { id: 'play', n: 3, f: () => 1 },
    { id: 'span5', n: 1, f: s => s.maxSpan >= 5 ? 1 : 0 },
    { id: 'perfect', n: 1, f: s => s.accuracy === 100 ? 1 : 0 }
  ];
  function missions() { let m = get(K.missions, null); if (!m || m.date !== today()) { m = { date: today(), p: { play: 0, span5: 0, perfect: 0 } }; set(K.missions, m); } return m; }
  const updateMissions = (s) => { const m = missions(); MIS.forEach(x => { m.p[x.id] = Math.min(x.n, (m.p[x.id] || 0) + x.f(s)); }); set(K.missions, m); };

  const row = (el, a) => { if (!el) return; el.innerHTML = a.map(x => '<span>' + x + '</span>').join(''); };
  const pbRow = (el) => { const p = pbAll().classic; row(el, p ? [T('best') + ' ' + N(p.score), T('span') + ' ' + N(p.span), T('accuracy') + ' ' + N(p.acc) + '%'] : []); };
  const missionRow = (el) => { const m = missions(); row(el, MIS.map(x => (m.p[x.id] >= x.n ? '■ ' : '□ ') + T('m_' + x.id))); };
  function drawStrip(el) { if (!el) return; const u = get(K.stages, {}); const i = isAr() ? 1 : 0; const list = window.DigitSpanStages ? window.DigitSpanStages.list : []; el.innerHTML = list.map(s => '<span class="stg' + (u[s.id] ? ' on' : '') + '" title="' + s.d[i] + '">' + s.n[i] + '</span>').join(''); }
  function drawLog(svg) {
    if (!svg) return;
    const h = history().slice(-15);
    const st = 280 / 14;
    const ar = isAr();
    const X = i => ar ? 290 - i * st : 10 + i * st;
    const Y = s => 65 - Math.max(0, Math.min(12, s)) * 4.5;
    svg.innerHTML = '<line class="ref" x1="10" x2="290" y1="' + Y(6) + '" y2="' + Y(6) + '"/>'
      + (h.length > 1 ? '<polyline class="trace" points="' + h.map((r, i) => X(i) + ',' + Y(r.span || r.level || 0)).join(' ') + '"/>' : '')
      + h.map((r, i) => '<circle class="' + (r.mode === 'classic' ? '' : 'alt') + '" cx="' + X(i) + '" cy="' + Y(r.span || r.level || 0) + '" r="2.6"/>').join('');
  }

  const base = () => window.FLASH_API_BASE || '';
  async function net(path, body) {
    if (location.protocol === 'file:' && !base()) return null;
    const c = new AbortController(), t = setTimeout(() => c.abort(), 2500);
    try { const r = await fetch(base() + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body ? JSON.stringify(body) : undefined, signal: c.signal }); return r.ok ? await r.json() : null; }
    catch (e) { return null; } finally { clearTimeout(t); }
  }
  const localSeed = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

  window.DigitSpanHelpers = {
    ID, DOMAIN, K, get, set, today, settings, onSettings, openPanel, FS, T, N, isAr, stageName,
    pbAll, pbCheck, history, addHistory, dailyDone, dailyAdd,
    stageCheck, unlockBadges, updateMissions, pbRow, missionRow, drawStrip, drawLog,
    net, localSeed
  };
})();