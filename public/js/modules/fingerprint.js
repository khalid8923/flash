/* ============================================================
   FLASH - Fingerprint page runtime
   ============================================================ */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  var main = document.getElementById('fp-main');

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }
  function escape(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function fetchFingerprint() {
    if (!SF) return null;
    try {
      var res = await SF(API_BASE + '/ai/fingerprint?language=' + lang(), {
        method: 'GET', timeoutMs: 20000, silent: true
      });
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  function renderInsufficient(msg) {
    main.innerHTML =
      '<div class="fp-insufficient">' +
        '<h2>' + escape(t('Not enough data yet', 'لسه فيه بيانات كفاية')) + '</h2>' +
        '<p>' + escape(msg || t('Play at least 5 sessions to unlock your cognitive fingerprint.', 'العب 5 جلسات على الأقل لفتح البصمة المعرفية.')) + '</p>' +
        '<a href="index.html">' + escape(t('Back to dashboard', 'العودة للوحة')) + '</a>' +
      '</div>';
  }

  function render(data) {
    if (!data || !data.archetype) { renderInsufficient(); return; }

    var traits = data.traits || {};
    var traitRows = [
      { k: t('Avg Accuracy', 'متوسط الدقة'), v: traits.avg_accuracy, suf: '%' },
      { k: t('Median RT', 'وسيط زمن الرد'), v: traits.median_rt_ms, suf: 'ms' },
      { k: t('RT Variability', 'تذبذب الرد'), v: traits.rt_std_ms, suf: 'ms' },
      { k: t('Accuracy Slope', 'ميل التحسن'), v: traits.accuracy_slope, suf: '' },
      { k: t('Top Domain', 'أقوى مجال'), v: traits.top_domain, suf: '' },
      { k: t('Weakest', 'أضعف مجال'), v: traits.weakest_domain, suf: '' },
      { k: t('Games Played', 'ألعاب اتلعبت'), v: traits.unique_games_played, suf: '' },
      { k: t('Domains Touched', 'مجالات'), v: traits.domains_touched, suf: '' }
    ].filter(function (x) { return x.v != null && x.v !== ''; });

    var traitHtml = traitRows.map(function (x) {
      var display = (typeof x.v === 'number' && x.v % 1 !== 0) ? x.v.toFixed(1) : x.v;
      return '<div class="fp-trait">' +
        '<div class="fp-trait-k">' + escape(x.k) + '</div>' +
        '<div class="fp-trait-v">' + escape(String(display)) + (x.suf ? '<small>' + escape(x.suf) + '</small>' : '') + '</div>' +
      '</div>';
    }).join('');

    var mods = Array.isArray(data.modifier_labels) && data.modifier_labels.length
      ? data.modifier_labels
      : (Array.isArray(data.modifiers) ? data.modifiers : []);

    var modHtml = mods.length
      ? '<div class="fp-modifiers">' + mods.map(function (m) {
          return '<span class="fp-mod">' + escape(m) + '</span>';
        }).join('') + '</div>'
      : '';

    var confPct = typeof data.confidence === 'number' ? Math.round(data.confidence * 100) + '%' : '—';
    var tier = data.evidence_tier || 'calibrating';

    main.innerHTML =
      '<div class="fp-hero">' +
        '<div class="fp-archetype-label">' + escape(t('Your cognitive archetype', 'نمطك المعرفي')) + '</div>' +
        '<h1 class="fp-archetype">' + escape(data.archetype_label || data.archetype) + '</h1>' +
        (data.summary ? '<p class="fp-summary">' + escape(data.summary) + '</p>' : '') +
        modHtml +
      '</div>' +

      '<div class="fp-section-title">' + escape(t('Traits', 'السمات')) + '</div>' +
      '<div class="fp-traits">' + traitHtml + '</div>' +

      '<div class="fp-section-title">' + escape(t('Evidence', 'الأدلة')) + '</div>' +
      '<div class="fp-confidence">' +
        '<span class="fp-confidence-tier" data-tier="' + escape(tier) + '">' + escape(tier) + '</span>' +
        '<span>' + escape(t('Confidence', 'الثقة')) + ': <strong>' + escape(confPct) + '</strong></span>' +
        '<span>' + escape(t('Sessions used', 'جلسات مستخدمة')) + ': <strong>' + (data.sessions_used || 0) + '</strong></span>' +
      '</div>';
  }

  async function boot() {
    var data = await fetchFingerprint();
    if (!data) {
      renderInsufficient(t('Could not load fingerprint. Try again later.', 'مش قادر أحمّل البصمة. حاول بعدين.'));
      return;
    }
    if (data.source === 'insufficient_data' || data.source === 'no_data') {
      renderInsufficient(data.summary || data.message);
      return;
    }
    render(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();