/* =========================================================
   MODULE - Domain Games
   Renders the games grid inside the split-pane inspector.
   Auto-hooks into splitPane.open() so opening a domain
   automatically shows its games.
   ========================================================= */
(function(){
'use strict';
const F = window.FLASH;

function render(domainId){
  const body = document.getElementById('sp-body');
  if (!body) return;

  const domain = F.M.domains.find(d => d.id === domainId);
  if (!domain) return;

  const games = (F.M.games && F.M.games[domainId]) || [];
  if (!games.length) return;

  const ar = F.state.lang === 'ar';
  const dc = domain.c;

  // Build games section
  const gamesHTML = games.map(g => {
    const name = ar ? g.n_ar : g.n_en;
    const desc = ar ? g.d_ar : g.d_en;
    const status = g.status || 'ready';
    const href = `../games/${domainId}/${g.id}/game.html`;
    const disabled = status === 'wip' ? 'data-status="wip"' : '';

    return `
      <a class="sp-game" href="${href}" data-game-id="${g.id}" ${disabled} style="--dc:${dc}">
        <span class="sp-game-icon">${g.ic}</span>
        <span class="sp-game-body">
          <span class="sp-game-name">${name}</span>
          <span class="sp-game-desc">${desc}</span>
        </span>
        <span class="sp-game-play">→</span>
        ${status === 'wip' ? '<span class="sp-game-badge wip">WIP</span>' : ''}
      </a>
    `;
  }).join('');

  // Remove old games section
  const old = body.querySelector('.sp-games-section');
  if (old) old.remove();

  // Create new section
  const section = document.createElement('div');
  section.className = 'sp-section sp-games-section';
  section.innerHTML = `
    <span class="sp-label">${ar ? 'الألعاب' : 'Games'} · ${games.length}</span>
    <div class="sp-games">${gamesHTML}</div>
  `;

  // Insert after progress, before recent sessions
  const recent = body.querySelector('.sp-section:last-of-type');
  if (recent) {
    body.insertBefore(section, recent);
  } else {
    body.appendChild(section);
  }

  // Wire game clicks to open in new tab (since split-pane is a modal)
  section.querySelectorAll('.sp-game').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const gameId = a.dataset.gameId;
      const url = a.getAttribute('href');
      // Open the game in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      // Optional: play a click sound
      if (window.FLASH_MODULES && window.FLASH_MODULES.sound){
        window.FLASH_MODULES.sound.click();
      }
    });
  });
}

/* Hook into splitPane.open */
F.onReady(() => {
  setTimeout(() => {
    const SP = window.FLASH_MODULES && window.FLASH_MODULES.splitPane;
    if (!SP) return;
    const origOpen = SP.open;
    SP.open = function(id){
      const r = origOpen.call(SP, id);
      setTimeout(() => render(id), 60);
      return r;
    };
  }, 500);

  // Re-render on language/theme change
  window.addEventListener('flash:render', () => {
    const isOpen = document.body.classList.contains('split-open');
    if (!isOpen) return;
    // Find which domain is open via title text
    const title = document.getElementById('sp-title');
    if (!title) return;
    const name = title.textContent.trim();
    const domain = F.M.domains.find(d => {
      const n_en = d.name_en;
      const n_ar = d.name_ar;
      return name.indexOf(n_en) !== -1 || name.indexOf(n_ar) !== -1;
    });
    if (domain) render(domain.id);
  });
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.domainGames = { render };
})();