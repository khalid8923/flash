/* ============================================================
   FLASH — Neural Network Panel Injector
   Mounts a <canvas class="brain-v3"> inside the Today panel,
   above the KPIs, replacing/adding to the existing brain view.
   ============================================================ */
(function () {
  'use strict';

  function mount() {
    /* Look for the existing brain-wrap or today panel */
    const brainWrap = document.querySelector('.brain-wrap');
    const todayPanel = document.querySelector('[data-panel="today"]')
                    || document.querySelector('.col-today')
                    || document.querySelector('.today');

    /* Create container */
    const wrap = document.createElement('div');
    wrap.className = 'brain-v3';
    wrap.id = 'brain-v3';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('role', 'presentation');

    const canvas = document.createElement('canvas');
    canvas.id = 'brain-v3-canvas';
    wrap.appendChild(canvas);

    /* Insert — prefer replacing an old brain element */
    if (brainWrap && brainWrap.parentNode) {
      brainWrap.parentNode.insertBefore(wrap, brainWrap);
      brainWrap.style.display = 'none'; /* keep DOM, hide visual */
    } else if (todayPanel) {
      todayPanel.insertBefore(wrap, todayPanel.firstChild);
    } else {
      /* Fallback — top of body */
      document.body.insertBefore(wrap, document.body.firstChild);
    }

    /* Init the engine */
    if (window.FLASH_BRAIN_V3) {
      const ok = window.FLASH_BRAIN_V3.init(canvas);
      if (ok) {
        /* Wire to streak updates */
        document.addEventListener('flash:streak', (e) => {
          const v = (e.detail && e.detail.value) || 0;
          window.FLASH_BRAIN_V3.setStreak(v);
        });

        /* Boot log */
        const stats = window.FLASH_BRAIN_V3.stats();
        console.log(
          '[Brain v3] mounted ·',
          stats.nodes + ' nodes ·',
          stats.edges + ' edges ·',
          stats.packets + ' packets'
        );
      } else {
        console.warn('[Brain v3] init failed — falling back to Brain v2');
        wrap.remove();
        if (brainWrap) brainWrap.style.display = '';
      }
    } else {
      console.warn('[Brain v3] module not loaded');
      wrap.remove();
      if (brainWrap) brainWrap.style.display = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 50));
  } else {
    setTimeout(mount, 50);
  }
})();