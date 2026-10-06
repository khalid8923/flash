/* ═══════════════════════════════════════════════════════════
   FLASH — Global Settings System
   Theme · Sound · Music · Haptics · Input Mode · Accessibility
   Includes: Settings Panel UI + Ambient Music Generator
   Storage Key: flash:settings
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'flash:settings';
  const SCHEMA_VERSION = 1;

  const DEFAULT = {
    theme: 'dark',
    reducedMotion: false,
    highContrast: false,
    soundEnabled: true,
    soundVolume: 0.7,
    musicEnabled: false,
    musicVolume: 0.4,
    haptics: true,
    inputMode: 'both',
    autoSaveProgress: true,
    showPostGameInsights: true
  };

  let _state = { ...DEFAULT };
  let _listeners = {};
  let _anyListeners = [];
  let _panelInjected = false;

  /* ═══ STORAGE ═══ */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed._v === SCHEMA_VERSION && parsed.data) {
        _state = { ...DEFAULT, ...parsed.data };
      } else if (parsed && typeof parsed === 'object') {
        // Legacy: no schema wrapper
        _state = { ...DEFAULT, ...parsed };
      }
    } catch (e) {
      console.warn('[FlashSettings] load failed:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        _v: SCHEMA_VERSION,
        data: _state
      }));
    } catch (e) {
      console.warn('[FlashSettings] save failed:', e);
    }
  }

  /* ═══ API ═══ */
  function get(key) {
    if (key === undefined) return { ..._state };
    return _state[key];
  }

  function set(key, value) {
    if (_state[key] === value) return; // no-op
    _state[key] = value;
    save();
    applyToDOM();

    // Fire specific listener
    if (_listeners[key]) {
      _listeners[key].forEach(cb => {
        try { cb(value); } catch (e) {}
      });
    }
    // Fire any listeners
    _anyListeners.forEach(cb => {
      try { cb(key, value); } catch (e) {}
    });

    // Custom DOM event
    try {
      window.dispatchEvent(new CustomEvent('flash:settings-changed', {
        detail: { key, value, all: { ..._state } }
      }));
    } catch (e) {}

    // Music side effect
    if (key === 'musicEnabled') {
      if (value) music.play();
      else music.pause();
    }
    if (key === 'musicVolume') {
      music.setVolume(value);
    }
    if (key === 'soundEnabled' && window.FlankerSounds) {
      window.FlankerSounds.setEnabled(value);
    }
  }

  function setAll(obj) {
    Object.keys(obj).forEach(k => {
      if (_state[k] !== obj[k]) _state[k] = obj[k];
    });
    save();
    applyToDOM();
    _anyListeners.forEach(cb => { try { cb('*', _state); } catch (e) {} });
  }

  function reset() {
    _state = { ...DEFAULT };
    save();
    applyToDOM();
    syncPanelInputs();
  }

  function resetAllProgress() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('flash:')) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    location.reload();
  }

  function onChange(key, cb) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(cb);
  }

  function onAnyChange(cb) {
    _anyListeners.push(cb);
  }

  /* ═══ DOM APPLICATION ═══ */
  function applyToDOM() {
    const html = document.documentElement;

    // Theme
    html.setAttribute('data-theme', _state.theme);

    // Motion
    if (_state.reducedMotion) html.setAttribute('data-motion', 'reduced');
    else html.removeAttribute('data-motion');

    // Contrast
    if (_state.highContrast) html.setAttribute('data-contrast', 'high');
    else html.removeAttribute('data-contrast');
  }

  /* ═══ MUSIC MODULE — Ambient Pad ═══ */
  const music = (function () {
    let ctx = null;
    let masterGain = null;
    let oscillators = [];
    let lfo = null;
    let lfoGain = null;
    let _playing = false;

    function init() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      return ctx;
    }

    function buildPad() {
      const notes = [
        { freq: 110, gain: 0.35, detune: -4 },  // A2
        { freq: 165, gain: 0.25, detune: 3 },   // E3
        { freq: 220, gain: 0.20, detune: -2 },  // A3
        { freq: 330, gain: 0.12, detune: 5 }    // E4
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = n.freq;
        osc.detune.value = n.detune;
        g.gain.value = n.gain;
        osc.connect(g).connect(masterGain);
        osc.start();
        oscillators.push(osc);
      });

      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain).connect(masterGain.gain);
      lfo.start();
    }

    function play() {
      const c = init();
      if (!c || _playing) return;
      _playing = true;
      buildPad();

      const vol = _state.musicVolume * 0.6;
      masterGain.gain.cancelScheduledValues(c.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, c.currentTime);
      masterGain.gain.linearRampToValueAtTime(vol, c.currentTime + 2);
    }

    function pause() {
      if (!ctx || !masterGain || !_playing) return;
      _playing = false;
      const t = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0, t + 0.8);

      setTimeout(() => {
        oscillators.forEach(o => { try { o.stop(); } catch (e) {} });
        oscillators = [];
        if (lfo) { try { lfo.stop(); } catch (e) {} lfo = null; }
      }, 900);
    }

    function toggle() {
      if (_playing) pause();
      else play();
    }

    function setVolume(v) {
      if (!ctx || !masterGain || !_playing) return;
      const vol = v * 0.6;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
    }

    function isPlaying() { return _playing; }

    return { play, pause, toggle, setVolume, isPlaying };
  })();

  /* ═══ SETTINGS PANEL UI ═══ */
  function injectPanel() {
    if (_panelInjected) return;
    _panelInjected = true;

    const overlay = document.createElement('div');
    overlay.id = 'fs-overlay';
    overlay.className = 'fs-overlay';
    overlay.innerHTML = `
      <div class="fs-panel" role="dialog" aria-modal="true" aria-labelledby="fs-title">
        <div class="fs-panel-hd">
          <span class="fs-title" id="fs-title">⚙ Settings</span>
          <button class="fs-close" id="fs-close" aria-label="Close">✕</button>
        </div>
        <div class="fs-body">

          <div class="fs-group">
            <div class="fs-group-title">Appearance</div>
            <label class="fs-row">
              <span>Dark Theme</span>
              <input type="checkbox" id="fs-theme" data-key="theme" data-type="bool-invert">
            </label>
            <label class="fs-row">
              <span>Reduced Motion</span>
              <input type="checkbox" id="fs-reducedMotion" data-key="reducedMotion" data-type="bool">
            </label>
            <label class="fs-row">
              <span>High Contrast</span>
              <input type="checkbox" id="fs-highContrast" data-key="highContrast" data-type="bool">
            </label>
          </div>

          <div class="fs-group">
            <div class="fs-group-title">Audio</div>
            <label class="fs-row">
              <span>Sound Effects</span>
              <input type="checkbox" id="fs-soundEnabled" data-key="soundEnabled" data-type="bool">
            </label>
            <label class="fs-row fs-row-slider">
              <span>SFX Volume <span class="fs-val" id="fs-soundVolume-val">70%</span></span>
              <input type="range" id="fs-soundVolume" data-key="soundVolume" data-type="range" min="0" max="100" step="5">
            </label>
            <label class="fs-row">
              <span>Background Music</span>
              <input type="checkbox" id="fs-musicEnabled" data-key="musicEnabled" data-type="bool">
            </label>
            <label class="fs-row fs-row-slider">
              <span>Music Volume <span class="fs-val" id="fs-musicVolume-val">40%</span></span>
              <input type="range" id="fs-musicVolume" data-key="musicVolume" data-type="range" min="0" max="100" step="5">
            </label>
          </div>

          <div class="fs-group">
            <div class="fs-group-title">Input</div>
            <label class="fs-row">
              <span>Haptic Feedback</span>
              <input type="checkbox" id="fs-haptics" data-key="haptics" data-type="bool">
            </label>
            <label class="fs-row">
              <span>Input Mode</span>
              <select id="fs-inputMode" data-key="inputMode">
                <option value="both">Keyboard + Touch</option>
                <option value="keyboard">Keyboard only</option>
                <option value="touch">Touch only</option>
              </select>
            </label>
          </div>

          <div class="fs-group">
            <div class="fs-group-title">System</div>
            <label class="fs-row">
              <span>Auto-save Progress</span>
              <input type="checkbox" id="fs-autoSaveProgress" data-key="autoSaveProgress" data-type="bool">
            </label>
            <label class="fs-row">
              <span>Post-Game Insights</span>
              <input type="checkbox" id="fs-showPostGameInsights" data-key="showPostGameInsights" data-type="bool">
            </label>
            <button class="fs-reset" id="fs-reset">Reset Settings</button>
            <button class="fs-reset" id="fs-reset-all">Reset ALL Progress</button>
          </div>

          <div class="fs-version">FLASH v1.0 · Settings v${SCHEMA_VERSION}</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Wire inputs
    overlay.querySelectorAll('[data-key]').forEach(input => {
      const key = input.dataset.key;
      const type = input.dataset.type;

      input.addEventListener('change', () => {
        let value;
        if (type === 'bool') value = input.checked;
        else if (type === 'bool-invert') value = !input.checked;
        else if (type === 'range') {
          value = parseInt(input.value, 10) / 100;
          const valEl = document.getElementById('fs-' + key + '-val');
          if (valEl) valEl.textContent = Math.round(value * 100) + '%';
        }
        else value = input.value;

        set(key, value);
      });
    });

    // Close
    overlay.querySelector('#fs-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePanel();
    });

    // Reset
    overlay.querySelector('#fs-reset').addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) reset();
    });
    overlay.querySelector('#fs-reset-all').addEventListener('click', () => {
      if (!confirm('This will erase ALL progress across ALL games. Continue?')) return;
      if (!confirm('Are you ABSOLUTELY sure?')) return;
      resetAllProgress();
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closePanel();
    });
  }

  function syncPanelInputs() {
    const overlay = document.getElementById('fs-overlay');
    if (!overlay) return;

    overlay.querySelectorAll('[data-key]').forEach(input => {
      const key = input.dataset.key;
      const type = input.dataset.type;
      const val = _state[key];

      if (type === 'bool') input.checked = !!val;
      else if (type === 'bool-invert') input.checked = !val;
      else if (type === 'range') {
        input.value = Math.round((val || 0) * 100);
        const valEl = document.getElementById('fs-' + key + '-val');
        if (valEl) valEl.textContent = Math.round((val || 0) * 100) + '%';
      }
      else input.value = val;
    });
  }

  function openPanel() {
    injectPanel();
    syncPanelInputs();
    const overlay = document.getElementById('fs-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function closePanel() {
    const overlay = document.getElementById('fs-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  /* ═══ AUTO BEHAVIORS ═══ */

  // Tab visibility — pause music when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && music.isPlaying()) {
      music.pause();
      music._resumeOnVisible = true;
    } else if (!document.hidden && music._resumeOnVisible && _state.musicEnabled) {
      music._resumeOnVisible = false;
      music.play();
    }
  });

  // Autoplay: wait for first user gesture to start music
  function scheduleAutoplay() {
    if (!_state.musicEnabled) return;
    const once = () => {
      if (_state.musicEnabled) music.play();
      document.removeEventListener('click', once);
      document.removeEventListener('keydown', once);
      document.removeEventListener('touchstart', once);
    };
    document.addEventListener('click', once, { once: true });
    document.addEventListener('keydown', once, { once: true });
    document.addEventListener('touchstart', once, { once: true });
  }

  /* ═══ INIT ═══ */
  load();
  applyToDOM();
  scheduleAutoplay();

  /* ═══ EXPOSE ═══ */
  window.FlashSettings = {
    get,
    set,
    setAll,
    reset,
    resetAllProgress,
    onChange,
    onAnyChange,
    applyToDOM,
    openPanel,
    closePanel,
    music,
    DEFAULTS: { ...DEFAULT }
  };
})();