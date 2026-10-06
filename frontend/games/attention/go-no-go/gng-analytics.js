/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Analytics Dashboard
   Baseline · Trends · d' over time · Fatigue tracking
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const H = window.GNGHelpers;
  if (!H) { console.error('[GNGAnalytics] Helpers missing'); return; }

  const KEYS = {
    BASELINE: 'flash:gng:baseline',
    TRENDS:   'flash:gng:trends'
  };

  function safeGet(k, d) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } }
  function safeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  /* ═══ BASELINE ═══ */
  function getBaseline() {
    return safeGet(KEYS.BASELINE, {
      samples: [],
      medianRT: null,
      accuracy: null,
      dPrime: null,
      commissionRate: null,
      updatedAt: null,
      status: 'building'   // 'building' | 'established'
    });
  }

  function updateBaseline(session) {
    const b = getBaseline();
    b.samples.push({
      date: new Date().toISOString(),
      medianRT: session.medianRT,
      accuracy: session.accuracy,
      dPrime: session.dPrime,
      commissionRate: session.commissionRate
    });
    // Keep last 10
    while (b.samples.length > 10) b.samples.shift();

    if (b.samples.length >= 5) {
      // Compute median of samples
      const mRT = H.median(b.samples.map(s => s.medianRT).filter(v => v > 0));
      const acc = Math.round(b.samples.map(s => s.accuracy).reduce((a, c) => a + c, 0) / b.samples.length);
      const dP  = parseFloat((b.samples.map(s => s.dPrime).reduce((a, c) => a + c, 0) / b.samples.length).toFixed(2));
      const cR  = parseFloat((b.samples.map(s => s.commissionRate).reduce((a, c) => a + c, 0) / b.samples.length).toFixed(3));

      b.medianRT = mRT;
      b.accuracy = acc;
      b.dPrime = dP;
      b.commissionRate = cR;
      b.status = 'established';
    }
    b.updatedAt = new Date().toISOString();
    safeSet(KEYS.BASELINE, b);
    return b;
  }

  function resetBaseline() {
    safeSet(KEYS.BASELINE, {
      samples: [], medianRT: null, accuracy: null,
      dPrime: null, commissionRate: null, updatedAt: null, status: 'building'
    });
  }

  /* ═══ TRENDS ═══ */
  function getTrends() {
    return safeGet(KEYS.TRENDS, {
      lastRTs: [],
      lastAccuracies: [],
      lastDPs: [],
      direction: 'stable',   // 'improving' | 'declining' | 'stable'
      lastUpdate: null
    });
  }

  function updateTrends(session) {
    const t = getTrends();
    if (session.medianRT > 0) t.lastRTs.push(session.medianRT);
    if (session.accuracy > 0) t.lastAccuracies.push(session.accuracy);
    if (session.dPrime > 0) t.lastDPs.push(session.dPrime);

    while (t.lastRTs.length > 10) t.lastRTs.shift();
    while (t.lastAccuracies.length > 10) t.lastAccuracies.shift();
    while (t.lastDPs.length > 10) t.lastDPs.shift();

    // Direction based on last 5
    if (t.lastDPs.length >= 5) {
      const recent = t.lastDPs.slice(-5);
      const first3 = recent.slice(0, 3).reduce((a, c) => a + c, 0) / 3;
      const last2 = recent.slice(-2).reduce((a, c) => a + c, 0) / 2;
      if (last2 > first3 + 0.3) t.direction = 'improving';
      else if (last2 < first3 - 0.3) t.direction = 'declining';
      else t.direction = 'stable';
    }

    t.lastUpdate = new Date().toISOString();
    safeSet(KEYS.TRENDS, t);
    return t;
  }

  /* ═══ FATIGUE DETECTION ═══ */
  function detectFatigue(session) {
    // Based on RT variability + accuracy drop
    if (session.rtv > 200 && session.accuracy < 80) return 'high';
    if (session.rtv > 150 && session.accuracy < 85) return 'moderate';
    return 'low';
  }

  /* ═══ RENDER DASHBOARD ═══ */
  function renderDashboard(container, currentSession) {
    if (!container) return;
    const b = getBaseline();
    const t = getTrends();

    // Update first
    updateBaseline(currentSession);
    updateTrends(currentSession);

    const b2 = getBaseline();
    const fatigue = detectFatigue(currentSession);

    // Comparison with baseline
    let comparisonHTML = '';
    if (b2.status === 'established' && b2.medianRT) {
      const rtDelta = currentSession.medianRT - b2.medianRT;
      const accDelta = currentSession.accuracy - b2.accuracy;
      const dDelta = currentSession.dPrime - b2.dPrime;

      comparisonHTML = `
        <div class="sec-lbl" style="margin-top:20px;">vs. Your Baseline</div>
        <div class="baseline-grid">
          <div class="baseline-item ${rtDelta < 0 ? 'good' : rtDelta > 30 ? 'warn' : ''}">
            <div class="baseline-label">Median RT</div>
            <div class="baseline-val">${rtDelta >= 0 ? '+' : ''}${rtDelta}ms</div>
            <div class="baseline-sub">Baseline: ${b2.medianRT}ms</div>
          </div>
          <div class="baseline-item ${accDelta > 0 ? 'good' : accDelta < -5 ? 'warn' : ''}">
            <div class="baseline-label">Accuracy</div>
            <div class="baseline-val">${accDelta >= 0 ? '+' : ''}${accDelta}%</div>
            <div class="baseline-sub">Baseline: ${b2.accuracy}%</div>
          </div>
          <div class="baseline-item ${dDelta > 0 ? 'good' : dDelta < -0.3 ? 'warn' : ''}">
            <div class="baseline-label">d' (sensitivity)</div>
            <div class="baseline-val">${dDelta >= 0 ? '+' : ''}${dDelta.toFixed(2)}</div>
            <div class="baseline-sub">Baseline: ${b2.dPrime}</div>
          </div>
        </div>
      `;
    } else {
      comparisonHTML = `
        <div class="sec-lbl" style="margin-top:20px;">Building Your Baseline</div>
        <div class="baseline-building">
          Play ${5 - b2.samples.length} more session${5 - b2.samples.length === 1 ? '' : 's'} to establish your personal baseline.
          <div class="baseline-progress"><div class="baseline-progress-fill" style="width:${(b2.samples.length / 5) * 100}%"></div></div>
        </div>
      `;
    }

    // Trend indicator
    const trendIcon = t.direction === 'improving' ? '📈'
                    : t.direction === 'declining' ? '📉'
                    : '➡️';
    const trendColor = t.direction === 'improving' ? 'var(--green)'
                     : t.direction === 'declining' ? 'var(--pink)'
                     : 'var(--t2)';

    // Fatigue
    const fatigueHTML = fatigue !== 'low' ? `
      <div class="fatigue-warning fatigue-${fatigue}">
        ⚠ ${fatigue === 'high'
          ? 'Performance dropped noticeably — consider a shorter session next time.'
          : 'Slight variation in performance — normal after many trials.'}
      </div>
    ` : '';

    container.innerHTML = `
      <div class="analytics-header">
        <div class="analytics-title">Analytics Dashboard</div>
        <div class="analytics-trend" style="color:${trendColor};">${trendIcon} ${t.direction}</div>
      </div>

      ${comparisonHTML}
      ${fatigueHTML}

      <div class="sec-lbl" style="margin-top:20px;">d' Over Time</div>
      <div class="history-chart" id="dprime-chart"></div>
    `;

    // Render d' chart
    setTimeout(() => {
      const chartEl = container.querySelector('#dprime-chart');
      if (chartEl) H.renderChart(chartEl, H.getRecentSessions(15), 'dPrime');
    }, 80);
  }

  /* ═══ PUBLIC API ═══ */
  window.GNGAnalytics = {
    getBaseline,
    updateBaseline,
    resetBaseline,
    getTrends,
    updateTrends,
    detectFatigue,
    renderDashboard
  };
})();