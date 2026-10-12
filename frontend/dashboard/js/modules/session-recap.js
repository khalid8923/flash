/* ============================================================
   FLASH - Session Recap
   After game-complete + save success, fetch AI recap and show modal
   ============================================================ */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) { console.warn('[recap] safe-fetch missing'); return; }

  var MAX_PER_SESSION = 30 * 60 * 1000;
  var lastShown = 0;

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function fetchRecentSession() {
    try {
      var res = await SF(API_BASE + '/sessions?limit=1', { method: 'GET', timeoutMs: 8000, silent: true });
      if (!res || !res.ok) return null;
      var data = await res.json();
      var list = (data && (data.sessions || data.items)) || [];
      return list[0] || null;
    } catch (e) { return null; }
  }

  async function fetchRecap(sessionId) {
    try {
      var res = await SF(API_BASE + '/ai/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, language: lang() }),
        timeoutMs: 30000,
        silent: true
      });
      if (!res || !res.ok) return null;
      var data = await res.json();
      return data.recap || null;
    } catch (e) { return null; }
  }

  function showModal(recapText, session) {
    var backdrop = document.createElement('div');
    backdrop.className = 'recap-backdrop';

    var gameName = (session && (session.game_id || session.gameId)) || 'Session';
    var accuracy = (session && session.accuracy) ? Math.round(session.accuracy) + '%' : '';

    backdrop.innerHTML =
      '<div class="recap-modal">' +
        '<div class="recap-head">' +
          '<div class="recap-icon"><svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><circle cx="12" cy="10" r="1.5"/></svg></div>' +
          '<div>' +
            '<div class="recap-title">' + esc(t('Session Recap', 'تحليل الجلسة')) + '</div>' +
            '<div class="recap-sub">' + esc(gameName) + (accuracy ? ' · ' + esc(accuracy) : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="recap-body">' + (recapText ? esc(recapText) : '<span class="loading">' + esc(t('Analyzing…', 'جاري التحليل…')) + '</span>') + '</div>' +
        '<div class="recap-actions">' +
          '<button type="button" class="recap-btn secondary" data-action="chat">' + esc(t('Ask Dr. Flash', 'اسأل د. فلاش')) + '</button>' +
          '<button type="button" class="recap-btn primary" data-action="close">' + esc(t('Got it', 'تمام')) + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) backdrop.remove();
    });
    backdrop.querySelector('[data-action="close"]').addEventListener('click', function () {
      backdrop.remove();
    });
    backdrop.querySelector('[data-action="chat"]').addEventListener('click', function () {
      backdrop.remove();
      if (window.FLASH_AI_CHAT && window.FLASH_AI_CHAT.open) {
        window.FLASH_AI_CHAT.open();
        setTimeout(function () {
          if (window.FLASH_AI_CHAT && window.FLASH_AI_CHAT.send) {
            window.FLASH_AI_CHAT.send(t('Explain my last session in detail.', 'اشرحلي آخر جلسة بالتفصيل.'));
          }
        }, 600);
      }
    });
  }

  async function runRecap() {
    var now = Date.now();
    if (now - lastShown < MAX_PER_SESSION) return;

    var session = await fetchRecentSession();
    if (!session) return;

    var sessionId = session.id || session.session_id;
    if (!sessionId) return;

    /* Show modal with loading */
    showModal(null, session);

    var recap = await fetchRecap(sessionId);
    lastShown = now;

    /* Replace body */
    var body = document.querySelector('.recap-body');
    if (body) {
      body.classList.remove('loading');
      body.textContent = recap || t(
        'Great session. Keep your pace steady next time.',
        'جلسة كويسة. حافظ على إيقاعك الجاي.'
      );
    }
  }

  /* Trigger on save-status event (when queue flushes successfully) */
  var pendingTimer = null;
  window.addEventListener('flash:save-status', function (e) {
    var pending = (e.detail && e.detail.pending) || 0;
    if (pending === 0) {
      /* Wait a bit for backend to process, then recap */
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(runRecap, 1500);
    }
  });

  /* Fallback: also trigger on game-complete after delay */
  window.addEventListener('flash:game-complete', function () {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(runRecap, 3500);
  });

  window.FLASH_RECAP = { run: runRecap, version: '1.0.0' };
})();