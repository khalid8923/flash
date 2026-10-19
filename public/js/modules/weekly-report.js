/* ============================================================
   FLASH - Weekly Report Card
   Aggregates last 7 days into a shareable card with a grade.
   Trigger: auto once per week + button in header (W key)
   ============================================================ */
(function () {
  'use strict';

  const F = window.FLASH;
  const API = window.FLASH_API;
  const TM = window.FLASH_THEME;

  const STORAGE_KEY = 'flash.weekly-report.last-seen';
  let el = null;

  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtNum(n) {
    return F && F.N ? F.N(Math.round(n)) : String(Math.round(n));
  }

  /* ─── Aggregation ─── */
  async function collect() {
    const sessionsResp = await (API.sessions ? API.sessions(100) : Promise.resolve(null));
    const sessions = (sessionsResp && sessionsResp.sessions) || [];

    const now = Date.now();
    const week = 7 * 24 * 3600 * 1000;
    const thisWeek = sessions.filter((s) => {
      const t = new Date(s.ended_at || s.started_at).getTime();
      return !isNaN(t) && now - t < week;
    });
    const prevWeek = sessions.filter((s) => {
      const t = new Date(s.ended_at || s.started_at).getTime();
      return !isNaN(t) && now - t >= week && now - t < week * 2;
    });

    /* Aggregate */
    const agg = (list) => {
      if (!list.length) return { count: 0, acc: 0, rt: 0, byDomain: {} };
      let acc = 0, rt = 0, n = 0;
      const byDomain = {};
      for (const s of list) {
        if (typeof s.accuracy === 'number') { acc += s.accuracy; n++; }
        if (typeof s.median_rt_ms === 'number') rt += s.median_rt_ms;
        const d = s.domain_id || 'unknown';
        if (!byDomain[d]) byDomain[d] = { count: 0, acc: 0, rt: 0 };
        byDomain[d].count++;
        byDomain[d].acc += s.accuracy || 0;
        byDomain[d].rt += s.median_rt_ms || 0;
      }
      return {
        count: list.length,
        acc: n ? acc / n : 0,
        rt: list.length ? rt / list.length : 0,
        byDomain,
      };
    };

    const a = agg(thisWeek);
    const b = agg(prevWeek);

    /* Best/worst domain */
    let best = null, worst = null;
    for (const [d, v] of Object.entries(a.byDomain)) {
      const avg = v.acc / v.count;
      if (!best || avg > best.acc) best = { id: d, acc: avg };
      if (!worst || avg < worst.acc) worst = { id: d, acc: avg };
    }

    /* Streak */
    let streak = 0;
    try {
      const st = await API.streak();
      streak = st && st.current_streak ? st.current_streak : 0;
    } catch (_) {}

    /* Grade */
    let score = 0;
    if (a.count >= 7) score += 3;
    else if (a.count >= 4) score += 2;
    else if (a.count >= 1) score += 1;

    if (a.acc >= 90) score += 4;
    else if (a.acc >= 80) score += 3;
    else if (a.acc >= 70) score += 2;
    else if (a.acc >= 60) score += 1;

    if (streak >= 7) score += 3;
    else if (streak >= 3) score += 2;
    else if (streak >= 1) score += 1;

    let grade = 'D';
    if (score >= 9) grade = 'A';
    else if (score >= 6) grade = 'B';
    else if (score >= 3) grade = 'C';

    /* Delta */
    const accDelta = b.count ? a.acc - b.acc : 0;
    const rtDelta = b.count ? b.rt - a.rt : 0;

    /* Tip */
    let tip = '';
    if (a.count === 0) tip = 'Start with one session this week — even 3 minutes counts.';
    else if (worst && worst.acc < 70) tip = 'Focus on <strong>' + escape(worst.id) + '</strong> this week. Try Precision mode.';
    else if (a.count < 4) tip = 'Aim for 4 sessions this week — consistency beats intensity.';
    else if (a.acc >= 85) tip = 'Great streak. Bump difficulty — try <strong>Stretch</strong> mode.';
    else tip = 'Keep going — steady progress is the goal.';

    return {
      sessions: a.count,
      prevSessions: b.count,
      accuracy: a.acc,
      prevAccuracy: b.acc,
      medianRt: a.rt,
      prevMedianRt: b.rt,
      best,
      worst,
      streak,
      grade,
      score,
      accDelta,
      rtDelta,
      tip,
    };
  }

  /* ─── Render ─── */
  function render(data) {
    const period = (() => {
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86400000);
      const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return fmt(start) + ' → ' + fmt(now);
    })();

    const sign = (v) => (v >= 0 ? '+' : '') + v.toFixed(1);
    const cls = (v, good) => {
      if (v === 0) return '';
      const positive = v > 0;
      const isGood = good ? positive : !positive;
      return isGood ? 'good' : 'bad';
    };

    const deltaSessions = data.sessions - data.prevSessions;

    return `
      <div class="wrc-card" role="dialog" aria-modal="true" aria-labelledby="wrc-title">
        <div class="wrc-head">
          <div class="wrc-grade" data-grade="${data.grade}">${data.grade}</div>
          <div class="wrc-title">
            <div class="wrc-kicker">Weekly Report</div>
            <h2 id="wrc-title">${data.sessions} sessions</h2>
            <div class="wrc-period">${period}</div>
          </div>
          <button class="wrc-close" type="button" aria-label="Close">×</button>
        </div>

        <div class="wrc-body">
          <div class="wrc-stats">
            <div class="wrc-stat">
              <span class="num">${data.sessions}</span>
              <span class="lbl">Sessions</span>
              <span class="delta ${deltaSessions > 0 ? 'up' : deltaSessions < 0 ? 'down' : ''}">${deltaSessions === 0 ? '—' : sign(deltaSessions)}</span>
            </div>
            <div class="wrc-stat">
              <span class="num">${Math.round(data.accuracy)}%</span>
              <span class="lbl">Accuracy</span>
              <span class="delta ${data.accDelta > 0 ? 'up' : data.accDelta < 0 ? 'down' : ''}">${data.accDelta === 0 ? '—' : sign(data.accDelta) + '%'}</span>
            </div>
            <div class="wrc-stat">
              <span class="num">${data.medianRt ? fmtNum(data.medianRt) : '—'}</span>
              <span class="lbl">Median RT (ms)</span>
              <span class="delta ${data.rtDelta > 0 ? 'up' : data.rtDelta < 0 ? 'down' : ''}">${data.rtDelta === 0 ? '—' : sign(data.rtDelta)}</span>
            </div>
          </div>

          ${data.best || data.worst ? `
            <div class="wrc-section">
              <h3>Domains</h3>
              ${data.best ? `
                <div class="wrc-row">
                  <span class="label"><span class="dot" style="--dc: var(--d-${escape(data.best.id)})"></span>Best: ${escape(data.best.id)}</span>
                  <span class="value good">${Math.round(data.best.acc)}%</span>
                </div>
              ` : ''}
              ${data.worst && data.worst.id !== (data.best && data.best.id) ? `
                <div class="wrc-row">
                  <span class="label"><span class="dot" style="--dc: var(--d-${escape(data.worst.id)})"></span>Focus: ${escape(data.worst.id)}</span>
                  <span class="value warn">${Math.round(data.worst.acc)}%</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${data.streak > 0 ? `
            <div class="wrc-section">
              <h3>Consistency</h3>
              <div class="wrc-row">
                <span class="label">🔥 Current streak</span>
                <span class="value good">${data.streak} day${data.streak === 1 ? '' : 's'}</span>
              </div>
            </div>
          ` : ''}

          <div class="wrc-tip">${data.tip}</div>

          <div class="wrc-actions">
            <button class="wrc-btn primary" data-wrc-play type="button">Start next session</button>
            <button class="wrc-btn secondary" data-wrc-close type="button">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Modal ─── */
  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'wrc-overlay';
    el.setAttribute('data-open', '0');
    document.body.appendChild(el);

    el.addEventListener('click', (e) => {
      if (e.target === el) close();
      if (e.target.closest('[data-wrc-close]')) close();
      if (e.target.closest('.wrc-close')) close();
      if (e.target.closest('[data-wrc-play]')) {
        close();
        /* Dispatch a render to let other modules re-render */
        window.dispatchEvent(new Event('flash:render'));
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.getAttribute('data-open') === '1') close();
    });

    return el;
  }

  async function open(force) {
    build();
    el.innerHTML = '<div class="wrc-card"><div class="wrc-empty">Loading…</div></div>';
    el.setAttribute('data-open', '1');
    try {
      const data = await collect();
      el.innerHTML = render(data);
      markSeen();
      if (!force && window.FLASH_TOAST) {
        window.FLASH_TOAST.info('Weekly report ready', 'Review');
      }
    } catch (err) {
      el.innerHTML = '<div class="wrc-card"><div class="wrc-empty">Could not load report. Try again later.</div></div>';
    }
  }

  function close() {
    if (el) el.setAttribute('data-open', '0');
  }

  function markSeen() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
  }

  function shouldAutoShow() {
    try {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      /* Auto-show only if last shown > 7 days ago */
      return !last || Date.now() - last > 7 * 24 * 3600 * 1000;
    } catch (_) { return false; }
  }

  /* ─── Wire header button ─── */
  function wireButton() {
    const tools = document.querySelector('.hdr .tools');
    if (!tools) return;
    if (tools.querySelector('.wrc-btn-header')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wrc-btn-header';
    btn.setAttribute('aria-label', 'Weekly report');
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      border: 1px solid var(--ln);
      border-radius: var(--r-2);
      background: var(--pn);
      color: var(--tx);
      font: 500 11px/1 var(--font-ui);
      cursor: pointer;
      transition: all var(--t-fast) var(--e-std);
    `;
    btn.innerHTML = '<span style="font-size:13px">📊</span><span>Report</span>';
    btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--pn-hover)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'var(--pn)'; });
    btn.addEventListener('click', () => open(true));

    const invite = tools.querySelector('.invite-btn');
    if (invite) tools.insertBefore(btn, invite);
    else tools.insertBefore(btn, tools.firstChild);
  }

  /* ─── Keyboard shortcut W ─── */
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'w' || e.key === 'W') {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      if (el && el.getAttribute('data-open') === '1') close();
      else open(true);
    }
  });

  /* ─── Boot ─── */
  if (F && F.onReady) {
    F.onReady(() => {
      setTimeout(wireButton, 1100);
      /* Auto-show after 3s, once per week */
      setTimeout(() => {
        if (shouldAutoShow()) {
          open(false);
        }
      }, 3000);
    });
  }

  window.FLASH_WEEKLY_REPORT = {
    open: () => open(true),
    close,
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} },
    version: '1.0.0',
  };

  console.info('[WEEKLY_REPORT] loaded — press W or click Report');
})();