/* ═══════════════════════════════════════════════════════════
   MODULE — XP Gain Animation
   Public API:  FLASH_MODULES.xpGain.play(amount)
   - Counts the XP number up over 900ms ease-out
   - Sprays 10-14 linear particles from the bar leading edge
   - Flashes the bar's leading 40px once (240ms)
   Particles: 60° cone, drift 24-40px, fade over 700ms.
   No gravity. No confetti. Domain accent color only.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Count-up */
function countUp(el, from, to, duration){
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(2, -10 * p);   // ease-out expo
    const value = Math.round(from + (to - from) * eased);
    el.textContent = F.N(value);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = F.N(to);
  };
  requestAnimationFrame(step);
}

/* Particle spray */
function spray(originX, originY, count){
  const layer = document.createElement('div');
  layer.className = 'xp-particles';
  layer.style.left = originX + 'px';
  layer.style.top  = originY + 'px';
  layer.style.width = '0';
  layer.style.height = '0';
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++){
    const dot = document.createElement('span');
    dot.className = 'xp-particle';
    layer.appendChild(dot);

    // 60° cone pointing up
    const angle = -Math.PI/2 + (Math.random() - 0.5) * (Math.PI / 3);
    const distance = 24 + Math.random() * 16;   // 24-40 px
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const dur = 600 + Math.random() * 200;      // 600-800ms
    const delay = Math.random() * 120;

    dot.style.opacity = '1';
    requestAnimationFrame(() => {
      dot.style.transition =
        `transform ${dur}ms cubic-bezier(0, 0, 0.2, 1) ${delay}ms,` +
        `opacity  ${dur}ms linear ${delay}ms`;
      dot.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      dot.style.opacity = '0';
    });
  }

  setTimeout(() => layer.remove(), 1100);
}

/* Flash the bar */
function flashBar(barEl){
  barEl.classList.add('xp-bar-flash');
  setTimeout(() => barEl.classList.remove('xp-bar-flash'), 300);
}

/* ─── Public: play XP gain ─── */
function play(amount){
  amount = amount || 40;

  const wrap = document.querySelector('.stat-xp');
  if (!wrap) return;
  const numEl = wrap.querySelector('b');
  const svg   = wrap.querySelector('svg');
  const fill  = svg && svg.querySelector('.xp-fill');
  if (!numEl) return;

  const from = F.M.user.xp;
  const to = Math.min(F.M.user.xpNext, from + amount);

  // Reduced motion: instant
  if (prefersReduced()){
    numEl.textContent = F.N(to);
    if (fill){
      const pct = (to / F.M.user.xpNext * 100).toFixed(1);
      fill.setAttribute('width', pct);
    }
    return;
  }

  // Count up
  const existingCount = numEl.querySelector('span');
  // numEl contains "1,240" text + <small>
  const small = numEl.querySelector('small');
  const textNode = Array.from(numEl.childNodes).find(n => n.nodeType === 3);
  if (textNode){
    const tmpSpan = document.createElement('span');
    tmpSpan.textContent = textNode.textContent;
    numEl.replaceChild(tmpSpan, textNode);
    countUp(tmpSpan, from, to, 900);
  } else {
    // fallback
    countUp(numEl, from, to, 900);
  }

  // Animate bar fill
  if (fill){
    const fromPct = from / F.M.user.xpNext * 100;
    const toPct = to / F.M.user.xpNext * 100;
    fill.style.transition = 'none';
    fill.setAttribute('width', fromPct.toFixed(1));
    requestAnimationFrame(() => {
      fill.style.transition = 'width 900ms cubic-bezier(0.16, 1, 0.3, 1)';
      fill.setAttribute('width', toPct.toFixed(1));
      setTimeout(() => { fill.style.transition = ''; }, 1000);
    });
    // Flash
    flashBar(svg);
  }

  // Particles from bar's leading edge
  if (svg){
    const r = svg.getBoundingClientRect();
    const pct = from / F.M.user.xpNext;
    const ox = r.left + r.width * pct;
    const oy = r.top + r.height / 2;
    setTimeout(() => spray(ox, oy, 12), 20);
  }
}

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.xpGain = { play };
})();