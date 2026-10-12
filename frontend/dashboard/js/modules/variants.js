/* FLASH - Game Variants (in split-pane) */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) return;
  function lang(){return document.documentElement.lang==='ar'?'ar':'en';}
  function t(en,ar){return lang()==='ar'?ar:en;}
  function esc(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  async function fetchVariants(gameId) {
    try {
      var res = await SF(API_BASE + '/ai/variants/game/' + encodeURIComponent(gameId) + '?language=' + lang(), { timeoutMs: 15000, silent: true });
      if (!res || !res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  function renderInto(container, variants) {
    if (!container) return;
    var old = container.querySelector('.variants-strip');
    if (old) old.remove();

    var strip = document.createElement('div');
    strip.className = 'variants-strip';

    if (!variants || !variants.length) {
      strip.setAttribute('hidden', '');
      container.appendChild(strip);
      return;
    }

    var title = document.createElement('div');
    title.className = 'variants-title';
    title.textContent = t('Variants', 'الأنماط');
    strip.appendChild(title);

    variants.forEach(function (v) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'variant-chip';
      chip.setAttribute('data-variant', v.id || '');
      chip.innerHTML = esc(v.name || v.title || 'Variant') +
        (v.axis ? '<span class="variant-axis">' + esc(v.axis) + '</span>' : '');
      chip.addEventListener('click', function () {
        strip.querySelectorAll('.variant-chip').forEach(function (x) { x.setAttribute('aria-pressed','false'); });
        chip.setAttribute('aria-pressed','true');
        window.dispatchEvent(new CustomEvent('flash:variant-selected', { detail: v }));
      });
      strip.appendChild(chip);
    });

    container.appendChild(strip);
  }

  window.addEventListener('flash:game-selected', async function (e) {
    var gameId = e && e.detail && (e.detail.gameId || e.detail.id);
    if (!gameId) return;

    var pane = document.querySelector('.split-pane') || document.querySelector('.pn-split');
    if (!pane) return;

    var loading = document.createElement('div');
    loading.className = 'variants-loading';
    loading.textContent = t('Loading variants…', 'جاري تحميل الأنماط…');
    pane.appendChild(loading);

    var data = await fetchVariants(gameId);
    loading.remove();

    var list = data && (data.variants || data.items) || [];
    renderInto(pane, list);
  });

  window.FLASH_VARIANTS = { renderInto: renderInto, version: '1.0.0' };
})();