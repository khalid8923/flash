/* ============================================================
   FLASH - Daily Challenge Widget
   Card in the Season panel showing today's shared challenge
   ============================================================ */
(function () {
  'use strict';

  const F = window.FLASH;
  const API = window.FLASH_API;

  let state = {
    challenge: null,
    leaderboard: [],
    loading: false,
    error: null,
    userId: null
  };

  function t(key) { return F && F.t ? F.t(key) : key; }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      const lang = (F && F.state && F.state.lang) || 'en';
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
        weekday: 'short', day: '2-digit', month: 'short'
      }).format(d);
    } catch (_) { return iso; }
  }

  function renderCard() {
    if (state.loading) {
      return '<div class="dc-card"><div class="dc-game">Loading…</div></div>';
    }

    if (state.error || !state.challenge) {
      return '';
    }

    const ch = state.challenge;
    const gameName = ch.game_id
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const top3 = state.leaderboard.slice(0, 3).map((row, i) => {
      const isMe = row.user_id === state.userId;
      return `
        <div class="row ${isMe ? 'me' : ''}">
          <span class="rank">#${i + 1}</span>
          <span class="player">${isMe ? 'You' : 'Player ' + String(row.user_id).slice(0, 6)}</span>
          <span class="score">${row.score}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="dc-card" data-dc-id="${escapeHtml(ch.id)}">
        <div class="dc-head">
          <div class="dc-title">
            <span class="dc-icon">🏆</span>
            <span>Daily Challenge</span>
          </div>
          <span class="dc-date">${formatDate(ch.challenge_date)}</span>
        </div>

        <div class="dc-game">${escapeHtml(gameName)}</div>

        <div class="dc-meta">
          <span><b>${escapeHtml(ch.mode)}</b></span>
          <span>3 min</span>
        </div>

        <div class="dc-actions">
          <button class="dc-btn primary" data-dc-play>Play Now</button>
          <button class="dc-btn secondary" data-dc-lb>Leaderboard</button>
        </div>

        ${top3 ? `<div class="dc-leader">${top3}</div>` : ''}
      </div>
    `;
  }

  function mount() {
    const season = document.querySelector('[data-panel="season"]');
    if (!season) return;

    /* Remove old instance */
    const old = season.querySelector('.dc-card');
    if (old) old.remove();

    /* Insert at top of season */
    const html = renderCard();
    if (!html) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const card = wrap.firstElementChild;
    season.insertBefore(card, season.firstChild);

    /* Wire buttons */
    const playBtn = card.querySelector('[data-dc-play]');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const gameId = state.challenge && state.challenge.game_id;
        if (gameId) {
          window.location.href = '../games/' + guessDomain(gameId) + '/' + gameId + '/game.html';
        }
      });
    }

    const lbBtn = card.querySelector('[data-dc-lb]');
    if (lbBtn) {
      lbBtn.addEventListener('click', () => {
        window.location.href = 'sessions.html#daily-challenge';
      });
    }
  }

  function guessDomain(gameId) {
    /* Best-effort mapping. Falls back to 'memory'. */
    const map = {
      'flanker': 'attention', 'go-no-go': 'attention', 'task-switching': 'attention', 'vigilance': 'attention',
      'mental-rotation': 'spatial', 'corsi-blocks': 'spatial', 'map-memory': 'spatial', 'block-counter': 'spatial',
      'reaction': 'speed', 'color-match': 'speed', 'symbol-sprint': 'speed', 'rapid-fire': 'speed',
      'n-back': 'memory', 'face-match': 'memory', 'pattern-recall': 'memory', 'seq-mem': 'memory',
      'matrix-logic': 'logic', 'syllogisms': 'logic', 'deduction': 'logic', 'argument-analyzer': 'logic',
      'lexical-decision': 'language', 'vocabulary-elite': 'language', 'verbal-analogies': 'language', 'word-scramble': 'language',
      'alternative-uses': 'creativity', 'creative-connect': 'creativity', 'story-spark': 'creativity', 'idea-flow': 'creativity',
      'micro-expressions': 'emotional', 'tone-detector': 'emotional', 'empathy-engine': 'emotional', 'social-read': 'emotional',
      'hanoi': 'problem', 'river-crossing': 'problem', 'gear-logic': 'problem', 'path-finder': 'problem'
    };
    return map[gameId] || 'memory';
  }

  async function load() {
    if (!API || !API.dailyChallenge) return;
    state.loading = true;
    mount();

    try {
      const ch = await API.dailyChallenge();
      state.challenge = ch;
      state.error = null;

      /* Try leaderboard */
      try {
        const lb = await API.dailyChallengeLeaderboard();
        state.leaderboard = (lb && lb.leaderboard) || [];
      } catch (_) {
        state.leaderboard = [];
      }
    } catch (err) {
      state.error = err && err.message ? err.message : 'load_failed';
    } finally {
      state.loading = false;
      mount();
    }
  }

  /* ─── Boot ─── */
  if (F && F.onReady) {
    F.onReady(() => {
      /* Wait for tag-panels to run first */
      setTimeout(() => {
        load();
      }, 1200);

      window.addEventListener('flash:render', () => setTimeout(load, 600));
    });
  }

  window.FLASH_DAILY_CHALLENGE = {
    refresh: load,
    getState: () => ({ ...state }),
    version: '1.0.0'
  };

  console.info('[DAILY_CHALLENGE] loaded');
})();