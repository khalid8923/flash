/* ============================================================
   FLASH - Micro Lessons card
   ============================================================ */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) { console.warn('[micro-lessons] safe-fetch missing'); return; }

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }
  function escape(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function fetchLesson() {
    try {
      var res = await SF(API_BASE + '/ai/lessons?language=' + lang(), {
        method: 'GET', timeoutMs: 15000, silent: true
      });
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  function findTodayPanel() {
    var candidates = ['[data-panel="today"]', '.col-today', '.today'];
    for (var i = 0; i < candidates.length; i++) {
      var el = document.querySelector(candidates[i]);
      if (el) return el;
    }
    
    return null;
  }

  function renderInto(container, lesson) {
    if (!container) return;
    var old = container.querySelector('.ml-block');
    if (old) old.remove();

    var block = document.createElement('div');
    block.className = 'ml-block';
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', t('Micro lesson', 'درس قصير'));

    if (!lesson || (!lesson.title && !lesson.topic)) {
      block.innerHTML =
        '<div class="ml-head">' +
          '<span class="ml-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>' +
          '<span class="ml-title">' + escape(t('Micro Lesson', 'درس قصير')) + '</span>' +
        '</div>' +
        '<div class="ml-empty">' + escape(t('Play a session to unlock a lesson.', 'العب جلسة لفتح درس.')) + '</div>';
      container.appendChild(block);
      return;
    }

    var topicLabel = lesson.topic_label || lesson.topic || '';
    var title = lesson.title || topicLabel;
    var body = lesson.body || lesson.content || lesson.text || '';
    var citation = lesson.citation || '';

    block.innerHTML =
      '<div class="ml-head">' +
        '<span class="ml-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>' +
        '<span class="ml-title">' + escape(t('Micro Lesson · 60s', 'درس قصير · 60 ثانية')) + '</span>' +
      '</div>' +
      (title ? '<div class="ml-topic">' + escape(title) + '</div>' : '') +
      (body ? '<div class="ml-body">' + escape(body) + '</div>' : '') +
      (citation ? '<div class="ml-cite">' + escape(citation) + '</div>' : '');

    container.appendChild(block);
  }

  async function boot() {
    var container = findTodayPanel();
    if (!container) { setTimeout(boot, 800); return; }
    var lesson = await fetchLesson();
    renderInto(container, lesson);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 2200); });
  } else {
    setTimeout(boot, 2200);
  }

  window.FLASH_MICRO_LESSONS = { refresh: boot, version: '1.0.0' };
})();