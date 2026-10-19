/* ═══════════════════════════════════════════════════════════
   MODULE — Streak Break + XP Proximity
   • FLASH_MODULES.streakBreak.play()   — demonstrate streak break
   • FLASH_MODULES.streakBreak.heal()   — freeze-token heal
   • XP proximity glow is auto-applied when xp/xpNext ≥ 0.85
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Break the streak ─── */
function play(){
  const wrap = document.querySelector('.streak-wrap');
  if (!wrap || wrap.classList.contains('breaking')) return;

  const numEl = wrap.querySelector('.streak-ring-num');
  if (!numEl) return;

  const currentText = numEl.textContent.trim();
  const currentNum = parseInt(currentText, 10) || 0;
  if (currentNum === 0) return;

  wrap.classList.add('breaking');

  if (prefersReduced()){
    numEl.textContent = '0';
    return;
  }

  // Create two halves that split apart
  const createHalf = (clipPath, delay) => {
    const h = document.createElement('span');
    h.className = 'streak-half';
    h.textContent = currentText;
    h.style.clipPath = clipPath;
    h.style.transition = `transform 260ms cubic-bezier(0.2, 0, 0, 1) ${delay}ms,
                          opacity    600ms linear ${delay + 200}ms`;
    return h;
  };

  // Top half (clip from 0 to 50%)
  const top = createHalf('polygon(0 0, 100% 0, 100% 48%, 68% 52%, 42% 46%, 0 54%)', 0);
  // Bottom half
  const bot = createHalf('polygon(0 54%, 42% 46%, 68% 52%, 100% 48%, 100% 100%, 0 100%)', 20);

  numEl.textContent = '';
  numEl.appendChild(top);
  numEl.appendChild(bot);

  requestAnimationFrame(() => {
    top.style.transform = 'translateY(-6px) rotate(-2deg)';
    top.style.opacity = '0';
    bot.style.transform = 'translateY(6px) rotate(2deg)';
    bot.style.opacity = '0';
  });

  // Show "0" after the split
  setTimeout(() => {
    numEl.textContent = '0';
    wrap.classList.remove('breaking');
    // Update the JS state too
    F.M.user.streak = 0;
  }, 800);
}

/* ─── Heal the streak (freeze token) ─── */
function heal(){
  const wrap = document.querySelector('.streak-wrap');
  if (!wrap) return;
  wrap.classList.add('healing');
  setTimeout(() => wrap.classList.remove('healing'), 460);
  // Restore the number (visual demo)
  const numEl = wrap.querySelector('.streak-ring-num');
  if (numEl) numEl.textContent = String(F.M.user.streak || 1);
}

/* ─── XP proximity glow ─── */
function applyXpProximity(){
  const u = F.M.user;
  const ratio = u.xp / u.xpNext;
  document.documentElement.dataset.xpNear = ratio >= 0.85 ? 'true' : 'false';
}

/* ─── Init ─── */
F.onReady(() => {
  setTimeout(applyXpProximity, 200);
  window.addEventListener('flash:render', () => setTimeout(applyXpProximity, 100));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.streakBreak = { play, heal, applyXpProximity };
})();