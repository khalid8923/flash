/* ============================================================
   FLASH - Brain Alternative Panel Injector
   Adds the switcher + mounts the canvas
   ============================================================ */
(function () {
  'use strict';

  const MODES = [
    { id: 'lattice', label: 'Lattice' },
    { id: 'fib',     label: 'Sphere'  },
    { id: 'slices',  label: 'Slices'  }
  ];

  function inject() {
    /* Skip if already there */
    if (document.querySelector('.brain-alt')) return;

    const todayPanel = document.querySelector('[data-panel="today"]')
                    || document.querySelector('.col-today')
                    || document.querySelector('.today');

    if (!todayPanel) {
      console.info('[Brain Alt] No today panel found — skipping');
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'brain-alt';
    wrap.setAttribute('aria-hidden', 'true');

    /* Switcher */
    const switcher = document.createElement('div');
    switcher.className = 'brain-switch';
    switcher.setAttribute('role', 'tablist');

    MODES.forEach((m, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = m.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.dataset.mode = m.id;
      switcher.appendChild(btn);
    });

    /* Canvas */
    const canvas = document.createElement('canvas');
    canvas.id = 'brain-alt-canvas';

    wrap.appendChild(switcher);
    wrap.appendChild(canvas);

    /* Insert at top of today panel */
    todayPanel.insertBefore(wrap, todayPanel.firstChild);

    /* Init engine */
    if (!window.FLASH_BRAIN_ALT) {
      console.warn('[Brain Alt] Engine not loaded');
      return;
    }

    const ok = window.FLASH_BRAIN_ALT.init(canvas);
    if (!ok) {
      console.warn('[Brain Alt] Init failed');
      wrap.remove();
      return;
    }

    /* Wire switcher */
    switcher.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        window.FLASH_BRAIN_ALT.setMode(mode);
        switcher.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      });
    });

    /* Listen for external mode changes to keep UI synced */
    window.addEventListener('flash:brain-mode', (e) => {
      const mode = e.detail && e.detail.mode;
      if (!mode) return;
      switcher.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
      });
    });

    console.log('[Brain Alt] Mounted · mode = ' + window.FLASH_BRAIN_ALT.getMode());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(inject, 100));
  } else {
    setTimeout(inject, 100);
  }
})();