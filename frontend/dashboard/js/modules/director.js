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
      var res = await SF(API_BASE + path, Object.assign({ timeoutMs: 30000, silent: true }, opts || {}));
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  function inject() {
    var today = document.querySelector('[data-panel="today"]');
    if (!today) return false;
    if (today.querySelector('.dir-block')) return true;

    var block = document.createElement('div');
    block.className = 'dir-block';
    block.innerHTML =
      '<div class="dir-head">' +
        '<span class="dir-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg></span>' +
        '<div>' +
          '<div class="dir-title">' + esc(t('AI-Guided Session', 'جلسة بقيادة الذكاء')) + '</div>' +
          '<div class="dir-sub">' + esc(t('4-6 rounds picked for you', '4-6 جولات مختارة ليك')) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dir-body">' + esc(t('AI will plan, watch, and adjust your session in real time.', 'الذكاء الاصطناعي هيخطط ويتابع ويعدّل جلستك لحظيًا.')) + '</div>' +
      '<button type="button" class="dir-cta" id="dir-start">' + esc(t('Start guided session', 'ابدأ الجلسة')) + '</button>';
    today.appendChild(block);

    block.querySelector('#dir-start').addEventListener('click', start);
    return true;
  }

  async function start() {
    var btn = document.getElementById('dir-start');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = t('Planning…', 'جاري التخطيط…');

    var data = await api('/ai/director/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang() })
    });

    if (!data || !data.script) {
      btn.disabled = false;
      btn.textContent = t('Start guided session', 'ابدأ الجلسة');
      alert(t('Could not start guided session. Try again.', 'مش قادر أبدأ الجلسة. حاول تاني.'));
      return;
    }

    showModal(data);
  }

  function showModal(data) {
    var backdrop = document.createElement('div');
    backdrop.className = 'dir-modal';
    var rounds = (data.script && data.script.rounds) || [];
    var roundsHtml = rounds.map(function (r, i) {
      return '<div class="dir-round">' +
        '<div class="dir-round-num">' + esc(t('Round', 'جولة')) + ' ' + (i + 1) + ' · ' + esc(r.mode || 'classic') + '</div>' +
        '<div class="dir-round-title">' + esc(r.game_name || r.game_id || 'Game') + '</div>' +
        (r.reason ? '<div class="dir-round-desc">' + esc(r.reason) + '</div>' : '') +
      '</div>';
    }).join('');
    backdrop.innerHTML =
      '<div class="dir-modal-inner">' +
        '<h2 class="dir-modal-h">' + esc(t('Your guided session', 'جلستك الموجّهة')) + '</h2>' +
        '<p class="dir-modal-sub">' + esc(data.script.rationale || '') + '</p>' +
        '<div id="dir-rounds">' + roundsHtml + '</div>' +
        '<div class="dir-actions">' +
          '<button type="button" class="dir-btn secondary" id="dir-cancel">' + esc(t('Cancel', 'إلغاء')) + '</button>' +
          '<button type="button" class="dir-btn primary" id="dir-begin">' + esc(t('Begin', 'ابدأ')) + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    backdrop.querySelector('#dir-cancel').addEventListener('click', function () { backdrop.remove(); });
    backdrop.querySelector('#dir-begin').addEventListener('click', function () {
      backdrop.remove();
      if (data.session_id) {
        localStorage.setItem('flash.directorSession', data.session_id);
        window.dispatchEvent(new CustomEvent('flash:director-start', { detail: data }));
      }
      window.location.href = 'index.html';
    });
  }

  function boot() {
    var attempts = 0;
    (function tryInject() {
      attempts++;
      if (inject() || attempts > 20) return;
      setTimeout(tryInject, 500);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 2000); });
  } else {
    setTimeout(boot, 2000);
  }

  window.FLASH_DIRECTOR = { start: start, version: '1.0.0' };
})();