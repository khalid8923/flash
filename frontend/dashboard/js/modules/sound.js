/* ═══════════════════════════════════════════════════════════
   MODULE — Sound Design
   Subtle Web Audio UI feedback. No audio files.
   Respects FlashSettings.soundEnabled.
   Public API:
     FLASH_MODULES.sound.click()   — soft click
     FLASH_MODULES.sound.hover()   — very soft tick
     FLASH_MODULES.sound.success() — ascending two-note
     FLASH_MODULES.sound.toggle()  — theme/language flip
     FLASH_MODULES.sound.error()   — low tone
     FLASH_MODULES.sound.enabled() — is audio allowed?
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

let ctx = null;
let unlocked = false;
let muted = false;

/* Check if user settings permit sound */
function allowed(){
  if (muted) return false;
  try {
    const s = window.FlashSettings;
    if (s && s.get){
      const settings = s.get();
      if (settings && settings.soundEnabled === false) return false;
    }
  } catch(e){}
  return true;
}

/* Lazy AudioContext creation on first user gesture */
function ensureCtx(){
  if (!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* Low-level tone */
function tone(freq, dur, opts){
  if (!allowed()) return;
  const c = ensureCtx();
  if (!c) return;

  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + (opts.delay || 0);

  o.type = opts.type || 'sine';
  o.frequency.setValueAtTime(freq, t);

  const vol = (opts.gain || 0.06);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/* Public sounds */
const sound = {
  click(){
    tone(880, 0.045, { type: 'sine', gain: 0.05 });
    tone(1320, 0.035, { type: 'sine', gain: 0.03, delay: 0.012 });
  },
  hover(){
    tone(660, 0.025, { type: 'sine', gain: 0.018 });
  },
  success(){
    tone(659, 0.09, { type: 'sine', gain: 0.055 });
    tone(880, 0.13, { type: 'sine', gain: 0.05, delay: 0.08 });
  },
  toggle(){
    tone(523, 0.06, { type: 'triangle', gain: 0.045 });
    tone(784, 0.09, { type: 'triangle', gain: 0.04, delay: 0.05 });
  },
  error(){
    tone(196, 0.16, { type: 'sawtooth', gain: 0.05 });
  },
  unlocked(){ unlocked = true; },
  muted(v){ muted = !!v; },
  enabled(){ return allowed(); }
};

/* ─── Auto-wire common interactions ─── */
let lastHoverTarget = null;
let hoverLock = 0;

function bindGlobalSounds(){
  document.addEventListener('click', function(e){
    const t = e.target.closest('button, a, .lane, .cta, .gc, .notch');
    if (!t) return;
    // Differentiate success vs click
    if (t.classList.contains('cta') || t.classList.contains('gc')){
      sound.success();
    } else {
      sound.click();
    }
  }, true);

  document.addEventListener('mouseover', function(e){
    const t = e.target.closest('.lane, .cta, .gc');
    if (!t || t === lastHoverTarget) return;
    const now = performance.now();
    if (now - hoverLock < 60) return;
    hoverLock = now;
    lastHoverTarget = t;
    sound.hover();
  }, true);
}

/* ─── Init ─── */
F.onReady(() => {
  setTimeout(bindGlobalSounds, 300);

  // Unlock AudioContext on first user gesture
  const unlock = () => {
    ensureCtx();
    sound.unlocked();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });

  // Sync mute with FlashSettings
  try {
    const s = window.FlashSettings;
    if (s && s.onChange){
      s.onChange('soundEnabled', v => sound.muted(!v));
    }
  } catch(e){}
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.sound = sound;
})();