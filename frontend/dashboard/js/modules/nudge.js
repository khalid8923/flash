(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) return;
  function lang(){return document.documentElement.lang==='ar'?'ar':'en';}
  function esc(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  var state = { recent: [], lastNudge: 0, cooldown: 60000 };

  async function requestNudge(trigger, payload) {
    var now = Date.now();
    if (now - state.lastNudge < state.cooldown) return null;
    try {
      var res = await SF(API_BASE + '/ai/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ trigger: trigger, language: lang() }, payload || {})),
        timeoutMs: 8000,
        silent: true
      });
      if (!res || !res.ok) return null;
      var data = await res.json();
      if (data && data.message) {
        state.lastNudge = now;
        return data.message;
      }
    } catch (e) { return null; }
  }

  function showNudge(message) {
    if (!message) return;
    var old = document.querySelector('.nudge-toast');
    if (old) old.remove();

    var el = document.createElement('div');
    el.className = 'nudge-toast';
    el.innerHTML = '<svg class="nudge-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg><span>' + esc(message) + '</span>';
    document.body.appendChild(el);
    setTimeout(function () {
      el.dataset.leaving = '1';
      setTimeout(function () { el.remove(); }, 240);
    }, 5000);
  }

  /* Listen for trial events from games */
  window.addEventListener('flash:game-trial', function (e) {
    if (!e || !e.detail) return;
    var t = e.detail;
    state.recent.push({ correct: !!t.correct, rt: t.rt || 0, at: Date.now() });
    if (state.recent.length > 10) state.recent.shift();

    if (state.recent.length < 3) return;

    /* Trigger detection */
    var last3 = state.recent.slice(-3);
    var allCorrect = last3.every(function (x) { return x.correct; });
    var allWrong = last3.every(function (x) { return !x.correct; });

    var trigger = null;
    if (allWrong) trigger = 'focus';
    else if (allCorrect) trigger = 'great_run';
    else if (state.recent.length >= 8) {
      var avgRT = state.recent.reduce(function (a, b) { return a + b.rt; }, 0) / state.recent.length;
      if (avgRT > 3000) trigger = 'slow_down';
    }

    if (!trigger) return;

    requestNudge(trigger, {
      game_id: t.gameId || 'unknown',
      recent_accuracy: Math.round((state.recent.filter(function (x) { return x.correct; }).length / state.recent.length) * 100),
      recent_median_rt_ms: Math.round(state.recent.reduce(function (a, b) { return a + b.rt; }, 0) / state.recent.length),
      consecutive_mistakes: allWrong ? 3 : 0,
      session_duration_ms: 0,
      trials_count: state.recent.length
    }).then(function (msg) { if (msg) showNudge(msg); });
  });

  window.addEventListener('flash:game-complete', function () {
    state.recent = [];
    state.lastNudge = 0;
  });

  window.FLASH_NUDGE = { show: showNudge, request: requestNudge, version: '1.0.0' };
})();