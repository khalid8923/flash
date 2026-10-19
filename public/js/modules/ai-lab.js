(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) return;
  function lang(){return document.documentElement.lang==='ar'?'ar':'en';}
  function t(en,ar){return lang()==='ar'?ar:en;}
  function esc(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  async function api(path, opts) {
    try {
      var res = await SF(API_BASE + path, Object.assign({ timeoutMs: 20000, silent: true }, opts || {}));
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }
  var body = document.getElementById('lab-body');
  var selected = null;

  async function loadSuggestions() {
    body.innerHTML = '<div class="lab-loading">' + esc(t('Loading experiments…','جاري تحميل التجارب…')) + '</div>';
    var data = await api('/ai/lab/suggestions?language=' + lang());
    var list = (data && (data.suggestions || data.templates)) || [];
    if (!list.length) {
      body.innerHTML = '<div class="lab-loading">' + esc(t('No experiments available yet.','مفيش تجارب متاحة دلوقتي.')) + '</div>';
      return;
    }
    var html = '<div class="lab-grid">';
    list.forEach(function (s) {
      var id = s.id || s.template_id || '';
      var title = s.title || s.name || id;
      var desc = s.description || s.desc || '';
      var days = s.duration_days || s.days || '—';
      var sess = s.session_count || s.sessions || '—';
      html += '<button type="button" class="lab-card" data-id="' + esc(id) + '" aria-pressed="false">' +
        '<h3 class="lab-card-title">' + esc(title) + '</h3>' +
        '<p class="lab-card-desc">' + esc(desc) + '</p>' +
        '<div class="lab-card-meta"><span>' + esc(String(days)) + ' ' + esc(t('days','يوم')) + '</span>' +
        '<span>' + esc(String(sess)) + ' ' + esc(t('sessions','جلسات')) + '</span></div>' +
      '</button>';
    });
    html += '</div>' +
      '<div class="lab-actions">' +
        '<button type="button" class="lab-btn secondary" id="lab-cancel">' + esc(t('Cancel','إلغاء')) + '</button>' +
        '<button type="button" class="lab-btn primary" id="lab-start" disabled>' + esc(t('Start experiment','ابدأ التجربة')) + '</button>' +
      '</div>';
    body.innerHTML = html;

    body.querySelectorAll('.lab-card').forEach(function (c) {
      c.addEventListener('click', function () {
        body.querySelectorAll('.lab-card').forEach(function (x) { x.setAttribute('aria-pressed','false'); });
        c.setAttribute('aria-pressed','true');
        selected = c.getAttribute('data-id');
        var btn = document.getElementById('lab-start');
        if (btn) btn.disabled = false;
      });
    });
    document.getElementById('lab-cancel').addEventListener('click', function () {
      window.location.href = 'index.html';
    });
    document.getElementById('lab-start').addEventListener('click', startExperiment);
  }

  async function startExperiment() {
    if (!selected) return;
    var data = await api('/ai/lab/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: selected, language: lang() })
    });
    if (!data) {
      alert(t('Could not start experiment. Try again.','مش قادر أبدأ التجربة. حاول تاني.'));
      return;
    }
    body.innerHTML =
      '<div class="lab-active">' +
        '<div class="lab-active-h">' +
          '<div class="lab-active-title">' + esc(data.title || t('Active experiment','تجربة نشطة')) + '</div>' +
        '</div>' +
        '<div class="lab-active-body">' + esc(data.instructions || data.description || t('Follow the plan for the next days.','اتبع الخطة في الأيام الجاية.')) + '</div>' +
        '<div class="lab-progress"><div class="lab-progress-bar" style="width:' + ((data.progress || 0) * 100) + '%"></div></div>' +
        '<div class="lab-actions">' +
          '<button type="button" class="lab-btn secondary" id="lab-back-home">' + esc(t('Back to dashboard','العودة للوحة')) + '</button>' +
        '</div>' +
      '</div>';
    document.getElementById('lab-back-home').addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }

  loadSuggestions();
})();