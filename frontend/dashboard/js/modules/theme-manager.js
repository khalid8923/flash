/* ============================================================
   FLASH - Theme Manager
   Handles: accent color + theme mode (light/dark/auto) + density
   ============================================================ */
(function () {
  'use strict';

  const STORE_KEY = 'flash.theme.v2';

  const ACCENTS = {
    rose:    { light: '#DB2777', dark: '#EC4899' },
    emerald: { light: '#059669', dark: '#10B981' },
    ocean:   { light: '#2563EB', dark: '#3B82F6' },
    violet:  { light: '#7C3AED', dark: '#A78BFA' },
    amber:   { light: '#D97706', dark: '#FBBF24' },
    crimson: { light: '#DC2626', dark: '#F87171' }
  };

  const state = {
    mode: 'auto',      /* light | dark | auto */
    accent: 'rose',    /* rose | emerald | ocean | violet | amber | crimson */
    density: 'comfortable'
  };

  /* ─── Load / Save ─── */
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (_) {}
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  /* ─── Compute effective theme ─── */
  function effectiveTheme() {
    if (state.mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.mode;
  }

  /* ─── Apply ─── */
  function apply() {
    const theme = effectiveTheme();
    const root = document.documentElement;
    const accent = ACCENTS[state.accent] || ACCENTS.rose;

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', state.accent);
    root.style.setProperty('--ac', theme === 'dark' ? accent.dark : accent.light);
    root.style.setProperty('--ac-hover', theme === 'dark' ? accent.light : accent.dark);
    root.style.setProperty('--ac-soft', hexToRgba(theme === 'dark' ? accent.dark : accent.light, 0.12));
    root.style.setProperty('--ac-ring', hexToRgba(theme === 'dark' ? accent.dark : accent.light, 0.30));

    document.body.setAttribute('data-density', state.density);

    window.dispatchEvent(new CustomEvent('flash:theme-changed', { detail: { ...state, effective: theme } }));
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /* ─── Public API ─── */
  const API = {
    get: () => ({ ...state, effective: effectiveTheme() }),
    getAccents: () => Object.keys(ACCENTS),
    setMode: (mode) => { state.mode = mode; save(); apply(); },
    setAccent: (accent) => { if (ACCENTS[accent]) { state.accent = accent; save(); apply(); } },
    setDensity: (d) => { state.density = d; save(); apply(); },
    cycle: () => {
      const order = ['light', 'dark', 'auto'];
      const i = order.indexOf(state.mode);
      state.mode = order[(i + 1) % order.length];
      save();
      apply();
    },
    version: '1.0.0'
  };

  /* ─── System theme change listener (auto mode) ─── */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.mode === 'auto') apply();
  });

  /* ─── Boot ─── */
  load();
  apply();

  window.FLASH_THEME = API;
  console.info('[THEME_MANAGER] ready — mode:', state.mode, 'accent:', state.accent, 'density:', state.density);
})();