/* ═══════════════════════════════════════════════════════════
   FLASH Dashboard — Core (i18n-aware)
   State + Render + Game Loading + postMessage + Language
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const { DOMAINS, AI_RECS, ACTIVITY, NEXT_SESSIONS } = window.FLASH_DATA;
  const { drawRadar, drawNeural, animateRing } = window.FLASH_CHARTS;
  const T = window.FLASH_I18N;

  const state = {
    theme: 'dark',
    domain: 'memory',
    activeGame: null
  };

  /* ═══════════ THEME ═══════════ */
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('theme-btn').textContent = state.theme === 'dark' ? '☀️' : '🌙';
    drawRadar();
    drawNeural();
  }

  /* ═══════════ LANGUAGE ═══════════ */
  function toggleLang() {
    const newLang = T.getLang() === 'ar' ? 'en' : 'ar';
    T.setLang(newLang);
    updateLangButton();
    renderAll();
  }

  function updateLangButton() {
    const btn = document.getElementById('lang-btn');
    if (!btn) return;
    btn.textContent = T.getLang() === 'ar' ? 'EN' : 'ع';
    btn.title = T.t('switch_language');
  }

  function renderAll() {
    renderTabs();
    renderGames();
    renderBars();
    renderRecs();
    renderActivity();
    renderNext();
    updateStaticText();
  }

  function updateStaticText() {
    // KPI labels
    const kpiLabels = document.querySelectorAll('.kpi-label');
    const kpiKeys = ['cognitive_iq', 'day_streak', 'sessions_total', 'global_rank'];
    kpiLabels.forEach((el, i) => {
      if (kpiKeys[i]) el.textContent = T.t(kpiKeys[i]);
    });

    // Card titles
    const cardTitles = document.querySelectorAll('.card-title');
    const cardKeys = ['cognitive_profile', 'domain_breakdown', 'ai_adaptive_engine', 'recent_activity', 'level_progression'];
    cardTitles.forEach((el, i) => {
      const dot = el.querySelector('.dot');
      const key = cardKeys[i];
      if (key) {
        el.innerHTML = '';
        if (dot) el.appendChild(dot);
        el.appendChild(document.createTextNode(T.t(key)));
      }
    });

    // Sidebar tag
    const sbTag = document.querySelector('.sb-tag');
    if (sbTag) sbTag.textContent = T.t('training_module');

    // AI live text
    const aiLive = document.querySelector('.ai-live-txt');
    if (aiLive) aiLive.textContent = T.t('live');

    // Overall score label
    const scoreLbl = document.querySelector('.score-lbl');
    if (scoreLbl) scoreLbl.textContent = T.t('overall_domain_score');

    // Section label
    const secLbl = document.querySelector('.sec-lbl');
    if (secLbl) secLbl.textContent = T.t('ai_next_sessions');

    // Game overlay back button
    const backBtn = document.querySelector('.game-back-btn');
    if (backBtn) {
      backBtn.innerHTML = '<span>←</span><span>' + T.t('dashboard') + '</span>';
    }

    // Loading text
    const overlayName = document.getElementById('game-overlay-name');
    if (overlayName && overlayName.textContent === 'Loading…') {
      overlayName.textContent = T.t('loading');
    }
  }

  /* ═══════════ TABS ═══════════ */
  function renderTabs() {
    const tabs = document.getElementById('domain-tabs');
    tabs.innerHTML = DOMAINS.map(d => `
      <button class="d-tab${d.id === state.domain ? ' active' : ''}${d.core ? ' core' : ''}"
              onclick="FLASH.setDomain('${d.id}')">
        <span class="d-tab-ico">${d.icon}</span>${T.t('domain_' + d.id) || d.name}
      </button>
    `).join('');
  }

  function setDomain(id) {
    state.domain = id;
    state.activeGame = null;
    renderTabs();
    renderGames();
  }

  /* ═══════════ GAMES LIST ═══════════ */
  function renderGames() {
    const d = DOMAINS.find(x => x.id === state.domain);
    document.getElementById('sb-name').innerHTML = `${d.icon}&nbsp;${T.t('domain_' + d.id) || d.name}`;

    const badge = document.getElementById('sb-badge');
    badge.textContent = T.t('score') + ' ' + d.score;
    badge.style.cssText = `background:${d.color}1A;color:${d.color};border:1px solid ${d.color}3A;`;

    const list = document.getElementById('games-list');
    list.innerHTML = '';

    d.games.forEach((g, i) => {
      const el = document.createElement('div');
      const isWip = g.status === 'wip';
      el.className = `g-card${state.activeGame === g.id ? ' selected' : ''} slide-in${isWip ? ' is-wip' : ''}`;
      el.style.setProperty('--dc', d.color);
      el.style.animationDelay = `${i * 48}ms`;

      const stars = Array.from({ length: 5 }, (_, j) =>
        `<span class="g-star ${j < g.diff ? 'on' : 'off'}">★</span>`
      ).join('');

      const statusBadge = isWip
        ? `<span class="g-status-badge">${T.t('wip')}</span>`
        : `<span class="g-status-badge ready">${T.t('ready')}</span>`;

      const gameName = T.t('game_' + g.id) || g.name;
      const gameDesc = T.t('game_desc_' + g.id) || g.desc;

      el.innerHTML = `
        <div class="g-card-top">
          <div class="g-icon">${g.icon}</div>
          <div class="g-stars">${stars}</div>
        </div>
        <div class="g-name">${gameName} ${statusBadge}</div>
        <div class="g-desc">${gameDesc}</div>
        <div class="g-prog"><div class="g-prog-fill" style="width:${g.prog}%"></div></div>
        <div class="g-foot">
          <div class="g-score">${T.t('best')}: <span>${(g.best || 0).toLocaleString()}</span></div>
          <button class="g-train" ${isWip ? 'disabled' : ''} onclick="event.stopPropagation();${isWip ? '' : `FLASH.loadGame('${g.id}')`}">${isWip ? T.t('soon') : T.t('play') + ' →'}</button>
        </div>
      `;
      if (!isWip) {
        el.onclick = () => { state.activeGame = g.id; renderGames(); };
      }
      list.appendChild(el);
    });
  }

  /* ═══════════ BARS ═══════════ */
  function renderBars() {
    const el = document.getElementById('d-bars');
    el.innerHTML = DOMAINS.map(d => `
      <div class="d-bar-row">
        <div class="d-bar-meta">
          <div class="d-bar-name"><span>${d.icon}</span>${T.t('domain_' + d.id) || d.name}</div>
          <div class="d-bar-val">${d.score}</div>
        </div>
        <div class="d-bar-track">
          <div class="d-bar-fill"
               style="width:0%;background:linear-gradient(90deg,${d.color}88,${d.color});"
               data-w="${d.score}"></div>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      el.querySelectorAll('.d-bar-fill').forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, i * 65);
      });
    }, 110);
  }

  /* ═══════════ RECS / ACTIVITY / NEXT ═══════════ */
  function renderRecs() {
    document.getElementById('ai-recs').innerHTML = AI_RECS.map(r => `
      <div class="ai-rec">
        <div class="ai-rec-icon" style="background:${r.color}1A">${r.icon}</div>
        <div class="ai-rec-body">
          <div class="ai-rec-name">${r.name}</div>
          <div class="ai-rec-why">${r.why}</div>
        </div>
        <div class="ai-rec-lv">${r.lv}</div>
      </div>
    `).join('');
  }

  function renderActivity() {
    document.getElementById('act-list').innerHTML = ACTIVITY.map(a => `
      <div class="act-row">
        <div class="act-ic" style="background:${a.color}1A">${a.icon}</div>
        <div class="act-info">
          <div class="act-name">${a.name}</div>
          <div class="act-meta"><span>${a.domain}</span><span style="color:var(--cyan)">${a.delta}</span></div>
        </div>
        <div class="act-sc" style="color:${a.color}">${a.score.toLocaleString()}</div>
        <div class="act-time">${a.time}</div>
      </div>
    `).join('');
  }

  function renderNext() {
    document.getElementById('next-grid').innerHTML = NEXT_SESSIONS.map(n => `
      <div class="next-chip">
        <div class="nc-icon">${n.icon}</div>
        <div class="nc-name">${n.name}</div>
        <div class="nc-dom">${n.domain}</div>
      </div>
    `).join('');
  }

  /* ═══════════ LOAD / EXIT GAME ═══════════ */
  function loadGame(gameId) {
    let foundGame = null, foundDomain = null;
    for (const d of DOMAINS) {
      const g = d.games.find(g => g.id === gameId);
      if (g) { foundGame = g; foundDomain = d; break; }
    }
    if (!foundGame || !foundDomain) { console.warn('[FLASH] Game not found:', gameId); return; }

    if (foundGame.status === 'wip') {
      alert(T.t('wip_msg'));
      return;
    }

    document.getElementById('game-overlay-icon').textContent = foundGame.icon;
    document.getElementById('game-overlay-name').textContent = T.t('game_' + foundGame.id) || foundGame.name;
    document.getElementById('game-overlay-domain').textContent = T.t('domain_' + foundDomain.id) || foundDomain.name;

    const iframe = document.getElementById('game-iframe');
    iframe.src = `../games/${foundDomain.id}/${foundGame.id}/game.html`;
    document.getElementById('game-overlay').classList.add('is-open');

    state.activeGame = gameId;
    renderGames();
  }

  function exitGame() {
    const iframe = document.getElementById('game-iframe');
    iframe.src = 'about:blank';
    document.getElementById('game-overlay').classList.remove('is-open');
    state.activeGame = null;
    renderGames();
  }

  /* ═══════════ POSTMESSAGE ═══════════ */
  function handleGameComplete(payload) {
    console.log('[FLASH] Game complete:', payload);

    let updated = false;
    for (const d of DOMAINS) {
      const g = d.games.find(x => x.id === payload.gameId);
      if (!g) continue;

      if (typeof payload.score === 'number' && payload.score > (g.best || 0)) {
        g.best = payload.score;
        updated = true;
      }

      const reportedLevel = payload.maxLevel || payload.maxNLevel || payload.levelReached || 0;
      if (typeof reportedLevel === 'number' && reportedLevel > (g.lv || 0)) {
        g.lv = reportedLevel;
        updated = true;
      }

      if (typeof reportedLevel === 'number' && reportedLevel > 0) {
        g.prog = Math.min(100, Math.round((reportedLevel / 15) * 100));
        updated = true;
      }

      g.lastPlayed = new Date().toISOString();
      g.lastSession = {
        mode: payload.mode || 'classic',
        accuracy: payload.accuracy,
        medianRT: payload.medianRT,
        score: payload.score
      };

      break;
    }

    if (updated) {
      renderGames();
      renderBars();
    }
  }

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'flash:game-complete') return;
    handleGameComplete(e.data);
  });

  /* ═══════════ AI STUB ═══════════ */
  const ai = {
    async getParameters(domain, level) { return { difficulty: level, timeLimit: Math.max(10, 30 - level), itemCount: 4 + level }; },
    async updateModel(result) { console.log('[FLASH AI] updateModel →', result); },
    async getDifficultyRecommendation(userId) { return { nextLevel: 8, domain: 'attention', confidence: 0.74 }; },
    async generateAdaptiveChallenge(profile) { return NEXT_SESSIONS; },
    updateDomainScores(scores) { renderBars(); },
  };

  /* ═══════════ INIT ═══════════ */
  function init() {
    const app = document.getElementById('app');
    app.style.display = 'flex';
    app.classList.add('show');

    updateLangButton();
    renderAll();

    setTimeout(() => {
      drawRadar();
      drawNeural();
      animateRing();
    }, 80);

    window.addEventListener('resize', () => {
      drawNeural();
      drawRadar();
    });

    // Re-render on language change
    window.addEventListener('flash:lang-changed', () => {
      renderAll();
    });

    // Sync with FlashSettings
    if (window.FlashSettings) {
      state.theme = window.FlashSettings.get('theme');
      document.documentElement.setAttribute('data-theme', state.theme);
      document.getElementById('theme-btn').textContent = state.theme === 'dark' ? '☀️' : '🌙';

      window.FlashSettings.onChange('theme', (val) => {
        state.theme = val;
        document.getElementById('theme-btn').textContent = val === 'dark' ? '☀️' : '🌙';
        drawRadar();
        drawNeural();
      });
    }
  }

  /* ═══════════ LOAD TRANSLATIONS FROM DATA ═══════════ */
  if (window.FLASH_DATA.TRANSLATIONS) {
    T.addStrings('en', window.FLASH_DATA.TRANSLATIONS.en);
    T.addStrings('ar', window.FLASH_DATA.TRANSLATIONS.ar);
  }

  init();

  window.FLASH = { setDomain, toggleTheme, toggleLang, loadGame, exitGame, ai, DOMAINS };
})();