/* ============================================================
   FLASH - Daily Plan
   Fetches /ai/daily-plan and renders into Today panel
   ============================================================ */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) { console.warn('[daily-plan] safe-fetch missing'); return; }

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }

  function escape(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function fetchPlan() {
    try {
      var res = await SF(API_BASE + '/ai/daily-plan?language=' + lang(), {
        method: 'GET', timeoutMs: 15000, silent: true
      });
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  function findTodayPanel() {
    /* STRICT: only match a real panel — never fallback to arbitrary .col */
    var el = document.querySelector('[data-panel="today"]');
    if (el) return el;
    
    el = document.querySelector('#pn-today');
    if (el) return el;
    return null;
  }

  function renderInto(container, plan) {
    if (!container) return;

    /* Remove any previous */
    var old = container.querySelector('.dp-block');
    if (old) old.remove();

    var block = document.createElement('div');
    block.className = 'dp-block';
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', t('Daily plan', 'خطة اليوم'));

    var items = (plan && Array.isArray(plan.plan)) ? plan.plan : [];
    var summary = (plan && plan.summary) ? plan.summary : '';

    var head = '' +
      '<div class="dp-head">' +
        '<span class="dp-title">' + escape(t('Today\'s Plan', 'خطة اليوم')) + '</span>' +
        '<span class="dp-count">' + items.length + ' ' + escape(t('sessions', 'جلسات')) + '</span>' +
      '</div>';

    if (!items.length) {
      block.innerHTML = head + '<div class="dp-empty">' + escape(t('Plan will appear after a few sessions.', 'الخطة هتظهر بعد أول جلسات.')) + '</div>';
      container.appendChild(block);
      return;
    }

    var list = items.slice(0, 5).map(function (item, i) {
      var name = item.game_name || item.game_id || 'Game';
      var minutes = item.minutes || 3;
      var reason = item.reason || '';
      var gameId = item.game_id || '';
      return '<button type="button" class="dp-item" data-game="' + escape(gameId) + '">' +
        '<span class="dp-num">' + (i + 1) + '</span>' +
        '<span class="dp-info">' +
          '<span class="dp-name">' + escape(name) + '</span>' +
          (reason ? '<span class="dp-reason">' + escape(reason) + '</span>' : '') +
        '</span>' +
        '<span class="dp-min">' + minutes + 'm</span>' +
      '</button>';
    }).join('');

    block.innerHTML = head + list;
    container.appendChild(block);

    /* Wire clicks */
    block.querySelectorAll('.dp-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var gameId = btn.getAttribute('data-game');
        if (gameId) {
          /* Try dashboard's game loader */
          if (typeof window.FLASH_LOAD_GAME === 'function') {
            window.FLASH_LOAD_GAME(gameId);
          } else {
            window.dispatchEvent(new CustomEvent('flash:play', { detail: { gameId: gameId } }));
          }
        }
      });
    });
  }

  async function boot() {
    var container = findTodayPanel();
    if (!container) {
      setTimeout(boot, 800);
      return;
    }

    /* Loading placeholder */
    var old = container.querySelector('.dp-block');
    if (!old) {
      var ph = document.createElement('div');
      ph.className = 'dp-block';
      ph.innerHTML = '<div class="dp-head"><span class="dp-title">' + escape(t('Today\'s Plan', 'خطة اليوم')) + '</span></div>' +
        '<div class="dp-loading">' + escape(t('Loading plan…', 'جاري تحميل الخطة…')) + '</div>';
      container.appendChild(ph);
    }

    var plan = await fetchPlan();
    renderInto(container, plan);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 1600); });
  } else {
    setTimeout(boot, 1600);
  }

  window.addEventListener('flash:game-complete', function () {
    setTimeout(function () {
      var c = findTodayPanel();
      if (c) fetchPlan().then(function (p) { renderInto(c, p); });
    }, 1200);
  });

  window.FLASH_DAILY_PLAN = { refresh: boot, version: '1.0.0' };
})();