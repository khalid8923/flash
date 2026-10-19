/* ============================================================
   FLASH - AI Coach Chat
   Floating icon (Dr. Gamer) + slide-in panel
   Context-aware: sends player data to backend on each message
   ============================================================ */
(function () {
  'use strict';

  const ERR = window.FLASH_ERRORS;
  const UI  = window.FLASH_UI;
  const $   = (s, c) => (c || document).querySelector(s);

  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    open: false,
    sending: false,
    conversationId: null,
    messages: [],
    lang: 'en'
  };

  let panelEl = null;
  let fabEl = null;
  let bodyEl = null;
  let inputEl = null;
  let sendBtnEl = null;

  /* ============================================================
     I18N STRINGS
     ============================================================ */
  const I18N = {
    en: {
      fabLabel: 'Ask Dr. Flash',
      title: 'Dr. Flash',
      status: 'Online · Analyzes your data',
      placeholder: 'Ask about your training…',
      send: 'Send',
      close: 'Close',
      suggestionsTitle: 'Try asking:',
      s1: 'How is my memory trending?',
      s2: 'What should I train today?',
      s3: 'Am I improving?',
      s4: 'Which game fits my weakness?',
      s5: 'Explain my recent session.',
      thinking: 'Analyzing your data…',
      error: 'Could not reach the coach. Try again.'
    },
    ar: {
      fabLabel: 'اسأل د. فلاش',
      title: 'د. فلاش',
      status: 'متاح · بيحلل بياناتك',
      placeholder: 'اسألني عن تدريبك…',
      send: 'إرسال',
      close: 'إغلاق',
      suggestionsTitle: 'جرّب تسأل:',
      s1: 'ذاكرتي بتتحسن إزاي؟',
      s2: 'العب إيه النهاردة؟',
      s3: 'أنا بتقدم؟',
      s4: 'أنهي لعبة تناسب ضعفي؟',
      s5: 'اشرحلي آخر جلسة.',
      thinking: 'بحلل بياناتك…',
      error: 'مش قادر أوصل للمدرب. حاول تاني.'
    }
  };

  function t(key) {
    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    state.lang = lang;
    return I18N[lang][key] || I18N.en[key] || key;
  }

  /* ============================================================
     CONTEXT BUILDER — gathers everything we know about the player
     ============================================================ */
  function buildContext() {
    const ctx = {};

    /* Dashboard data (from FLASH_DATA global if available) */
    const M = window.FLASH_DATA || (window.FLASH && window.FLASH.M) || null;

    if (M) {
      /* Domains */
      if (Array.isArray(M.domains)) {
        ctx.domains = M.domains.slice(0, 10).map(d => ({
          id: d.id,
          name: d.name_en || d.id,
          score: d.score || 0,
          sessions: d.sessions || 0
        }));
      }

      /* Recent sessions */
      if (Array.isArray(M.recentSessions)) {
        ctx.recent_sessions = M.recentSessions.slice(0, 10).map(s => ({
          date: s.date,
          game: s.game_en || s.game,
          domain: s.domain,
          accuracy: s.accuracy,
          medianRT: s.medianRT
        }));
      }

      /* Streak, level, xp */
      ctx.streak_days = M.streak || 0;
      ctx.current_level = M.level || 1;
      ctx.xp = M.xp || 0;
    }

    /* User basic info */
    try {
      const user = JSON.parse(localStorage.getItem('flash.user') || 'null');
      if (user) ctx.user = { displayName: user.displayName, role: user.role };
    } catch (_) {}

    /* Language */
    ctx.language = state.lang;

    /* Recent errors from log */
    if (ERR && typeof ERR.getLog === 'function') {
      const log = ERR.getLog();
      ctx.recent_errors = log.slice(-3).map(e => ({
        category: e.category,
        at: e.timestamp
      }));
    }

    return ctx;
  }

  /* ============================================================
     API
     ============================================================ */
  async function sendToBackend(message) {
    const SF = window.FLASH_SAFE_FETCH || window.fetch;

    const payload = {
      message,
      conversation_id: state.conversationId || undefined,
      language: state.lang,
      context: buildContext()
    };

    const res = await SF(API_BASE + '/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs: 30000
    });

    if (!res || !res.ok) {
      throw new Error('chat_failed_' + (res ? res.status : 'network'));
    }

    return await res.json();
  }

  /* ============================================================
     RENDER — FAB
     ============================================================ */
  function buildFab() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-chat-fab';
    btn.setAttribute('aria-label', t('fabLabel'));
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
        <path d="M4 21v-2a4 4 0 0 1 4-4h1"/>
        <path d="M20 21v-2a4 4 0 0 0-4-4h-1"/>
        <circle cx="12" cy="10" r="1.5"/>
        <path d="M12 11.5v3.5"/>
        <path d="M10.5 15h3"/>
      </svg>
    `;

    btn.addEventListener('click', openPanel);
    return btn;
  }

  /* ============================================================
     RENDER — PANEL
     ============================================================ */
  function buildPanel() {
    const el = document.createElement('aside');
    el.className = 'ai-chat-panel';
    el.setAttribute('data-open', '0');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-label', t('title'));

    el.innerHTML = `
      <header class="ai-chat-head">
        <div class="ai-chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
            <path d="M4 21v-2a4 4 0 0 1 4-4h1"/>
            <path d="M20 21v-2a4 4 0 0 0-4-4h-1"/>
            <circle cx="12" cy="10" r="1.5"/>
          </svg>
        </div>
        <div class="ai-chat-title">
          <h2>${t('title')}</h2>
          <p>${t('status')}</p>
        </div>
        <button type="button" class="ai-chat-close" aria-label="${t('close')}">
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="ai-chat-body" id="ai-chat-body"></div>

      <div class="ai-chat-suggestions" id="ai-chat-suggestions"></div>

      <form class="ai-chat-composer" id="ai-chat-form">
        <textarea
          class="ai-chat-input"
          id="ai-chat-input"
          rows="1"
          placeholder="${t('placeholder')}"
          aria-label="${t('placeholder')}"
        ></textarea>
        <button type="submit" class="ai-chat-send" aria-label="${t('send')}" disabled>
          <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </form>
    `;

    el.querySelector('.ai-chat-close').addEventListener('click', closePanel);
    return el;
  }

  function buildBackdrop() {
    const el = document.createElement('div');
    el.className = 'ai-chat-backdrop';
    el.addEventListener('click', closePanel);
    return el;
  }

  /* ============================================================
     MESSAGES
     ============================================================ */
  function pushMessage(role, text) {
    state.messages.push({ role, text, at: Date.now() });
    renderMessages();
  }

  function renderMessages() {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    if (state.messages.length === 0) {
      renderSuggestions();
      return;
    }

    hideSuggestions();

    state.messages.forEach((m) => {
      const msg = document.createElement('div');
      msg.className = 'ai-msg';
      msg.setAttribute('data-role', m.role);

      const avatar = document.createElement('div');
      avatar.className = 'ai-msg-avatar';
      if (m.role === 'assistant') {
        avatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/></svg>';
      } else {
        avatar.textContent = 'You';
      }

      const bubble = document.createElement('div');
      bubble.className = 'ai-msg-bubble';
      bubble.textContent = m.text;

      msg.appendChild(avatar);
      msg.appendChild(bubble);
      bodyEl.appendChild(msg);
    });

    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function showTyping() {
    if (!bodyEl) return;
    const msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg-typing';
    msg.setAttribute('data-role', 'assistant');
    msg.innerHTML = `
      <div class="ai-msg-avatar">
        <svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/></svg>
      </div>
      <div class="ai-msg-bubble">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    `;
    bodyEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    msg.__typing = true;
  }

  function hideTyping() {
    if (!bodyEl) return;
    bodyEl.querySelectorAll('.ai-msg-typing').forEach(el => el.remove());
  }

  /* ============================================================
     SUGGESTIONS
     ============================================================ */
  const SUGGESTION_KEYS = ['s1', 's2', 's3', 's4', 's5'];

  function renderSuggestions() {
    const box = $('#ai-chat-suggestions');
    if (!box) return;
    box.innerHTML = '';
    box.hidden = false;

    SUGGESTION_KEYS.forEach(k => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-suggestion';
      btn.textContent = t(k);
      btn.addEventListener('click', () => {
        const text = t(k);
        hideSuggestions();
        handleSend(text);
      });
      box.appendChild(btn);
    });
  }

  function hideSuggestions() {
    const box = $('#ai-chat-suggestions');
    if (box) box.hidden = true;
  }

  /* ============================================================
     SEND
     ============================================================ */
  async function handleSend(text) {
    if (!text || !text.trim() || state.sending) return;

    state.sending = true;
    if (inputEl) inputEl.value = '';
    updateSendBtn();

    pushMessage('user', text.trim());
    showTyping();

    try {
      const data = await sendToBackend(text.trim());
      hideTyping();

      if (data && data.reply) {
        pushMessage('assistant', data.reply);
        if (data.conversation_id) state.conversationId = data.conversation_id;
      } else if (data && data.source === 'fallback') {
        pushMessage('assistant', t('error'));
      } else {
        pushMessage('assistant', t('error'));
      }
    } catch (err) {
      hideTyping();
      pushMessage('assistant', t('error'));

      if (ERR) {
        ERR.log('AI_SERVICE', {
          message: 'AI chat failed',
          operation: 'ai-chat',
          context: { error: err && err.message }
        });
      }
    } finally {
      state.sending = false;
      updateSendBtn();
      if (inputEl) inputEl.focus();
    }
  }

  /* ============================================================
     COMPOSER
     ============================================================ */
  function updateSendBtn() {
    if (!sendBtnEl || !inputEl) return;
    sendBtnEl.disabled = !inputEl.value.trim() || state.sending;
  }

  function autoResizeInput() {
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  }

  /* ============================================================
     OPEN / CLOSE
     ============================================================ */
  function openPanel() {
    if (state.open) return;
    state.open = true;

    if (panelEl) {
      panelEl.setAttribute('data-open', '1');
    }
    if (fabEl) {
      fabEl.setAttribute('aria-expanded', 'true');
    }

    /* Focus input */
    setTimeout(() => {
      if (inputEl) inputEl.focus();
    }, 400);
  }

  function closePanel() {
    if (!state.open) return;
    state.open = false;

    if (panelEl) {
      panelEl.setAttribute('data-open', '0');
    }
    if (fabEl) {
      fabEl.setAttribute('aria-expanded', 'false');
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    /* Prevent double mount */
    if (document.querySelector('.ai-chat-fab')) return;

    fabEl = buildFab();
    panelEl = buildPanel();
    const backdrop = buildBackdrop();

    document.body.appendChild(fabEl);
    document.body.appendChild(panelEl);
    document.body.appendChild(backdrop);

    bodyEl = $('#ai-chat-body');
    inputEl = $('#ai-chat-input');
    sendBtnEl = $('#ai-chat-send');
    if (!sendBtnEl) sendBtnEl = panelEl.querySelector('.ai-chat-send');

    const form = $('#ai-chat-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSend(inputEl ? inputEl.value : '');
      });
    }

    if (inputEl) {
      inputEl.addEventListener('input', () => {
        autoResizeInput();
        updateSendBtn();
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend(inputEl.value);
        }
      });
    }

    /* ESC closes */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.open) closePanel();
    });

    /* Welcome message */
    setTimeout(() => {
      const welcome = state.lang === 'ar'
        ? 'أهلاً! أنا د. فلاش — بتابع بياناتك وبقدر أساعدك تفهم تقدمك. اسألني أي حاجة.'
        : "Hi! I'm Dr. Flash — I follow your data and can help you understand your progress. Ask me anything.";
      pushMessage('assistant', welcome);
    }, 300);

    console.info('[FLASH_AI_CHAT] ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
  } else {
    setTimeout(boot, 600);
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.FLASH_AI_CHAT = {
    open: openPanel,
    close: closePanel,
    toggle: () => state.open ? closePanel() : openPanel(),
    send: handleSend,
    version: '1.0.0'
  };
})();