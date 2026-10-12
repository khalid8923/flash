/* ============================================================
   FLASH - Settings Drawer v2
   UI for theme-manager (accent + mode + density)
   ============================================================ */
(function () {
  'use strict';

  const TM = window.FLASH_THEME;
  const F = window.FLASH;
  let overlayEl = null;
  let drawerEl = null;

  function build() {
    if (drawerEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'settings-v2-overlay';
    overlayEl.setAttribute('data-open', '0');
    overlayEl.addEventListener('click', close);

    drawerEl = document.createElement('aside');
    drawerEl.className = 'settings-v2';
    drawerEl.setAttribute('data-open', '0');
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'true');
    drawerEl.setAttribute('aria-label', 'Settings');

    drawerEl.innerHTML = `
      <div class="sv2-head">
        <h2>Settings</h2>
        <button class="sv2-close" aria-label="Close" type="button">✕</button>
      </div>
      <div class="sv2-body">

        <section class="sv2-section">
          <h3>Theme</h3>
          <div class="sv2-modes">
            <button class="sv2-mode" data-mode="light" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
              </svg>
              <span>Light</span>
            </button>
            <button class="sv2-mode" data-mode="dark" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>
              </svg>
              <span>Dark</span>
            </button>
            <button class="sv2-mode" data-mode="auto" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="14" rx="2"/>
                <path d="M8 21h8M12 18v3"/>
              </svg>
              <span>Auto</span>
            </button>
          </div>
        </section>

        <section class="sv2-section">
          <h3>Accent Color</h3>
          <div class="sv2-accents" data-accents></div>
        </section>

        <section class="sv2-section">
          <h3>Density</h3>
          <div class="sv2-density">
            <button data-density="compact" type="button">Compact</button>
            <button data-density="comfortable" type="button">Comfortable</button>
            <button data-density="roomy" type="button">Roomy</button>
          </div>
        </section>

        <section class="sv2-section">
          <h3>Accessibility</h3>
          <label class="sv2-row">
            <span>Reduced motion</span>
            <input type="checkbox" data-a11y="reducedMotion">
          </label>
          <label class="sv2-row">
            <span>High contrast</span>
            <input type="checkbox" data-a11y="highContrast">
          </label>
        </section>

      </div>
    `;

    document.body.appendChild(overlayEl);
    document.body.appendChild(drawerEl);

    /* Close button */
    drawerEl.querySelector('.sv2-close').addEventListener('click', close);

    /* Mode buttons */
    drawerEl.querySelectorAll('.sv2-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        TM.setMode(btn.dataset.mode);
        renderState();
      });
    });

    /* Accent swatches */
    const swatchColors = {
      rose:    '#EC4899',
      emerald: '#10B981',
      ocean:   '#3B82F6',
      violet:  '#A78BFA',
      amber:   '#FBBF24',
      crimson: '#F87171'
    };
    const accentsBox = drawerEl.querySelector('[data-accents]');
    TM.getAccents().forEach(key => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'sv2-accent';
      swatch.dataset.accent = key;
      swatch.setAttribute('aria-label', key);
      swatch.style.background = swatchColors[key];
      swatch.addEventListener('click', () => {
        TM.setAccent(key);
        renderState();
      });
      accentsBox.appendChild(swatch);
    });

    /* Density */
    drawerEl.querySelectorAll('[data-density]').forEach(btn => {
      btn.addEventListener('click', () => {
        TM.setDensity(btn.dataset.density);
        renderState();
      });
    });

    /* A11y toggles */
    drawerEl.querySelectorAll('[data-a11y]').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.a11y;
        if (F && F.state) F.state[key] = cb.checked;
        document.documentElement.setAttribute('data-' + key.toLowerCase(), cb.checked ? '1' : '0');
        try {
          const s = JSON.parse(localStorage.getItem('flash.settings.v2') || '{}');
          s[key] = cb.checked;
          localStorage.setItem('flash.settings.v2', JSON.stringify(s));
        } catch (_) {}
      });
      /* Load current */
      try {
        const s = JSON.parse(localStorage.getItem('flash.settings.v2') || '{}');
        if (s[cb.dataset.a11y]) cb.checked = true;
      } catch (_) {}
    });
  }

  function renderState() {
    if (!drawerEl) return;
    const state = TM.get();

    drawerEl.querySelectorAll('.sv2-mode').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.mode === state.mode ? 'true' : 'false');
    });

    drawerEl.querySelectorAll('.sv2-accent').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.accent === state.accent ? 'true' : 'false');
    });

    drawerEl.querySelectorAll('[data-density]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.density === state.density ? 'true' : 'false');
    });
  }

  function open() {
    build();
    renderState();
    overlayEl.setAttribute('data-open', '1');
    drawerEl.setAttribute('data-open', '1');
  }

  function close() {
    if (overlayEl) overlayEl.setAttribute('data-open', '0');
    if (drawerEl) drawerEl.setAttribute('data-open', '0');
  }

  function toggle() {
    if (!drawerEl) return open();
    if (drawerEl.getAttribute('data-open') === '1') close();
    else open();
  }

  /* ─── Wire settings button ─── */
  function wire() {
    /* Replace existing settings button behavior */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#fs-settings-btn, [data-open-settings-v2], .settings-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    });

    /* Ctrl+, shortcut */
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggle();
      }
    });

    /* ESC */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerEl && drawerEl.getAttribute('data-open') === '1') {
        close();
      }
    });
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(wire, 500));
  } else {
    setTimeout(wire, 500);
  }

  window.FLASH_SETTINGS_V2 = { open, close, toggle, version: '1.0.0' };
  console.info('[SETTINGS_V2] loaded — open via Ctrl+, or the ⚙ button');
})();