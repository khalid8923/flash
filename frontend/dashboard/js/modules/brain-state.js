/* ═══════════════════════════════════════════════════════════
   MODULE — Brain State Mapping
   Wraps the brain renderer:
     • Streak  → global brightness + rotation speed
     • Skips   → desaturate colors
     • XP gain → radial wave from front to back (700ms)
   Public API:
     FLASH_MODULES.brainState.refresh()
     FLASH_MODULES.brainState.pulse()      — trigger XP wave
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const state = {
  brightness: 1.0,      // 0.35 .. 1.0
  rotSpeed:   1.0,      // 0.6 .. 1.4
  saturation: 1.0,      // 0.4 .. 1.0
  waveT:      -1        // -1 = inactive; else 0..1
};

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Map user metrics → brain state */
function refresh(){
  const u = F.M.user;
  const streakRatio = Math.min(1, (u.streak || 0) / 30);       // 0..1

  state.brightness = 0.35 + streakRatio * 0.65;
  state.rotSpeed   = 0.60 + streakRatio * 0.80;

  // Skipped days = our mock has no such field, so simulate:
  // if streakDelta is negative, desaturate. Otherwise full.
  const delta = u.streakDelta || 0;
  state.saturation = delta < 0 ? 0.55 : 1.0;

  applyToDom();
}

/* Emit CSS variables the brain reads */
function applyToDom(){
  const el = document.getElementById('brain');
  if (!el) return;
  el.style.setProperty('--brain-brightness', state.brightness.toFixed(2));
  el.style.setProperty('--brain-saturation', state.saturation.toFixed(2));
}

/* XP wave — expose a value the brain renderer will read each frame */
function pulse(){
  if (prefersReduced()){
    // single flash only
    const el = document.getElementById('brain');
    if (!el) return;
    el.style.transition = 'opacity 240ms linear';
    el.style.opacity = '1';
    setTimeout(() => { el.style.transition = ''; }, 260);
    return;
  }
  state.waveT = 0;
}

/* Advance the wave each frame (called by brain.js) */
function tickWave(dt){
  if (state.waveT < 0) return -1;
  state.waveT += dt / 0.7;   // wave duration 700ms
  if (state.waveT >= 1){ state.waveT = -1; return -1; }
  return state.waveT;
}

/* ─── Init ─── */
F.onReady(() => {
  refresh();
  window.addEventListener('flash:render', refresh);
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.brainState = {
  refresh, pulse, tickWave,
  get: () => state
};
})();