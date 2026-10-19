/* ============================================================
   FLASH - AI Panels Live Data
   Fetches real data from AI endpoints and updates Wide Panels.
   Runs AFTER wide-panels.js builds the skeleton.
   ============================================================ */
(function () {
  'use strict';

  const API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  const SF = window.FLASH_SAFE_FETCH;
  const ERR = window.FLASH_ERRORS;

  if (!SF) { console.warn('[ai-panels-live] safe-fetch missing'); return; }

  function lang() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  }

  function t(en, ar) {
    return lang() === 'ar' ? ar : en;
  }

  async function get(path) {
    try {
      const res = await SF(API_BASE + path, {
        method: 'GET',
        timeoutMs: 10000,
        silent: true
      });
      if (!res || !res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) {
      if (ERR) ERR.log('AI_SERVICE', { message: 'ai-panel fetch failed', operation: path });
      return null;
    }
  }

  /* ============================================================
     ERROR PATTERNS panel
     ============================================================ */
  async function updateErrorPanel() {
    const panel = document.querySelector('[data-panel="errors"] .wp-body');
    if (!panel) return;

    const data = await get('/ai/error-patterns?language=' + lang());

    if (!data || data.source === 'insufficient_data' || data.source === 'no_data') {
      panel.innerHTML = '<div class="wp-empty">' + 
        t('Not enough sessions yet.', 'لسه مفيش جلسات كفاية.') + '</div>';
      return;
    }

    const patterns = Array.isArray(data.patterns) ? data.patterns : [];
    if (!patterns.length) {
      panel.innerHTML = '<div class="wp-empty">' +
        t('No significant patterns.', 'مفيش أنماط واضحة.') + '</div>';
      return;
    }

    const rows = patterns.slice(0, 3).map((p) => {
      const label = p.label || p.type || 'Pattern';
      const count = p.count != null ? p.count : (p.occurrences != null ? p.occurrences : '—');
      const severity = p.severity || 'medium';
      return '<div class="wp-error-row" data-severity="' + severity + '">' +
        '<div class="wp-error-label">' + escape(label) + '</div>' +
        '<span class="wp-error-count">×' + escape(String(count)) + '</span>' +
      '</div>';
    }).join('');

    panel.innerHTML = rows;
  }

  /* ============================================================
     TRANSFER panel
     ============================================================ */
  async function updateTransferPanel() {
    const panel = document.querySelector('[data-panel="transfer"] .wp-body');
    if (!panel) return;

    const data = await get('/ai/transfer-tracker?language=' + lang());

    if (!data || data.source === 'insufficient_data' || data.source === 'no_data') {
      panel.innerHTML = '<div class="wp-empty">' +
        t('Need 5+ days of data.', 'محتاج 5 أيام على الأقل.') + '</div>';
      return;
    }

    const pairs = Array.isArray(data.correlations) ? data.correlations : [];
    if (!pairs.length) {
      panel.innerHTML = '<div class="wp-empty">' +
        t('No correlations found.', 'مفيش ارتباطات.') + '</div>';
      return;
    }

    /* Show top correlations as mini list */
    const top = pairs
      .filter((c) => c && typeof c.r === 'number')
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
      .slice(0, 3);

    if (!top.length) {
      panel.innerHTML = '<div class="wp-empty">' + t('Not enough data.', 'مفيش بيانات كفاية.') + '</div>';
      return;
    }

    const rows = top.map((c) => {
      const r = c.r || 0;
      const sign = r > 0 ? '+' : '';
      const cls = r > 0.4 ? 'up' : (r < -0.4 ? 'down' : 'flat');
      const a = c.domain_a || c.a || '?';
      const b = c.domain_b || c.b || '?';
      return '<div class="wp-delta">' +
        '<div class="wp-delta-domain">' +
          '<span class="wp-delta-name">' + escape(a) + ' ↔ ' + escape(b) + '</span>' +
        '</div>' +
        '<span class="wp-delta-value ' + cls + '">' + sign + r.toFixed(2) + '</span>' +
      '</div>';
    }).join('');

    panel.innerHTML = rows;
  }

  /* ============================================================
     PREDICTIONS + INSIGHTS — footer strip
     ============================================================ */
  async function updateFooter() {
    /* Find the footer strips by their current content patterns */
    const footer = document.querySelector('.ft') || document.querySelector('.col-main .ft');
    if (!footer) return;

    /* The footer in this build lives in the "Next prediction / Weekly insight" strip */
    const strip = document.querySelector('.strip') || document.querySelector('[data-strip]');
    /* Fallback: search by text */
    const allDivs = document.querySelectorAll('div');
    let predBlock = null;
    let insightBlock = null;

    allDivs.forEach((d) => {
      const txt = (d.textContent || '').trim();
      if (/^Next prediction/i.test(txt) && !predBlock) predBlock = d;
      if (/^Weekly insight/i.test(txt) && !insightBlock) insightBlock = d;
    });

    /* --- Predictions --- */
    const predData = await get('/ai/predictions?language=' + lang());
    if (predBlock && predData && predData.horizons) {
      const nh = predData.horizons.next_session || predData.horizons.next || null;
      if (nh) {
        const val = nh.accuracy_range
          ? (nh.accuracy_range[0] + '-' + nh.accuracy_range[1] + '%')
          : (nh.predicted_accuracy ? nh.predicted_accuracy + '%' : '—');
        const conf = nh.confidence ? Math.round(nh.confidence * 100) + '%' : '—';
        predBlock.innerHTML = '<span class="ft-k">' + t('Next prediction', 'التوقع القادم') + '</span>' +
          '<span class="ft-v">' + escape(val) + ' • ' + conf + ' ' + t('confidence', 'ثقة') + '</span>';
      }
    } else if (predBlock) {
      predBlock.innerHTML = '<span class="ft-k">' + t('Next prediction', 'التوقع القادم') + '</span>' +
        '<span class="ft-v">' + t('Need 5 sessions', 'محتاج 5 جلسات') + '</span>';
    }

    /* --- Insights --- */
    const insightData = await get('/ai/insights?language=' + lang());
    if (insightBlock) {
      if (insightData && insightData.insight) {
        insightBlock.innerHTML = '<span class="ft-k">' + t('Weekly insight', 'ملخص الأسبوع') + '</span>' +
          '<span class="ft-v">' + escape(insightData.insight) + '</span>';
      } else if (insightData && insightData.source === 'no_data') {
        insightBlock.innerHTML = '<span class="ft-k">' + t('Weekly insight', 'ملخص الأسبوع') + '</span>' +
          '<span class="ft-v">' + t('Play a session to see insights.', 'العب جلسة لعرض الملخص.') + '</span>';
      }
    }
  }

  /* ============================================================
     Safe DOM text
     ============================================================ */
  function escape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
     BOOT — wait for wide-panels to finish
     ============================================================ */
  async function refreshAll() {
    await Promise.all([
      updateErrorPanel(),
      updateTransferPanel()
    ]);
    await updateFooter();
    console.info('[ai-panels-live] refreshed');
  }

  function boot() {
    /* wide-panels.js mounts at +400ms, so we give it time */
    setTimeout(() => {
      refreshAll().catch(() => {});
    }, 1500);

    /* Refresh every 60s */
    setInterval(() => {
      if (!document.hidden) refreshAll().catch(() => {});
    }, 60000);

    /* Refresh when AI events fire */
    window.addEventListener('flash:game-complete', () => {
      setTimeout(() => refreshAll().catch(() => {}), 800);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FLASH_AI_PANELS = { refresh: refreshAll, version: '1.0.0' };
})();