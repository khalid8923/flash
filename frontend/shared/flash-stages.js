/* ═══════════════════════════════════════════════════════════
   FLASH — Universal Stages System
   Shared across ALL games
   Each game defines its own stages and passes them via FlashStages.init()
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';


  /* ═══ THEME SYNC ═══
     Ensures game <html> reflects dashboard theme.
     Runs on load + on every flash:settings-changed event. */
  function syncTheme() {
    try {
      var s = (window.FlashSettings && window.FlashSettings.get && window.FlashSettings.get()) || {};
      var theme = s.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      var lang = (window.FLASH_I18N && window.FLASH_I18N.getLang && window.FLASH_I18N.getLang()) || 'en';
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    } catch (e) {}
  }
  syncTheme();
  window.addEventListener('flash:settings-changed', syncTheme);
  window.addEventListener('flash:lang-changed', syncTheme);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncTheme);
  }
  let GAME_ID = null;
  let STAGES = [];
  let STORAGE_KEY = null;
  let onStageComplete = null;

  function safeGet(k, d) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } }
  function safeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  /* ═══ INIT ═══ */
  function init(gameId, stages, opts) {
    GAME_ID = gameId;
    STAGES = stages || [];
    STORAGE_KEY = `flash:stages:${gameId}`;
    onStageComplete = (opts && opts.onStageComplete) || null;
    return getProgress();
  }

  /* ═══ PROGRESS ═══ */
  function getProgress() {
    const saved = safeGet(STORAGE_KEY, { completed: [] });
    const completed = saved.completed || [];
    const currentIdx = STAGES.findIndex(s => !completed.includes(s.id));
    return {
      completed: completed,
      total: STAGES.length,
      currentIndex: currentIdx === -1 ? STAGES.length - 1 : currentIdx,
      currentStage: currentIdx === -1 ? null : STAGES[currentIdx],
      allDone: completed.length >= STAGES.length,
      completedCount: completed.length
    };
  }

  /* ═══ CHECK SESSION ═══ */
  function checkSession(payload) {
    const saved = safeGet(STORAGE_KEY, { completed: [] });
    const completed = saved.completed || [];
    const newlyCompleted = [];

    // Only check the current (first not-yet-completed) stage
    // This keeps progression linear and prevents skipping
    const nextStage = STAGES.find(s => !completed.includes(s.id));
    if (!nextStage) return { newlyCompleted: [], advanced: false, progress: getProgress() };

    let passed = false;
    try {
      passed = nextStage.check(payload || {});
    } catch (e) {
      console.warn('[FlashStages] check error:', e);
    }

    if (passed) {
      completed.push(nextStage.id);
      saved.completed = completed;
      saved.updatedAt = new Date().toISOString();
      safeSet(STORAGE_KEY, saved);
      newlyCompleted.push(nextStage);

      // Notify caller
      if (onStageComplete) {
        try { onStageComplete(nextStage); } catch (e) {}
      }
    }

    return {
      newlyCompleted,
      advanced: newlyCompleted.length > 0,
      progress: getProgress()
    };
  }

  /* ═══ HELPERS ═══ */
  function isStageDone(stageId) {
    const p = getProgress();
    return p.completed.includes(stageId);
  }

  function getStageAt(idx) {
    return STAGES[idx] || null;
  }

  function reset() {
    safeSet(STORAGE_KEY, { completed: [] });
  }

  /* ═══ RENDER — compact strip for idle screen ═══ */
  function renderStrip(container) {
    if (!container) return;
    const p = getProgress();

    const stagesHTML = STAGES.map((s, i) => {
      const done = p.completed.includes(s.id);
      const isCurrent = !done && i === p.currentIndex;
      let cls = 'stage-dot';
      if (done) cls += ' done';
      else if (isCurrent) cls += ' current';
      else cls += ' locked';
      return `
        <div class="${cls}" data-stage-idx="${i}" title="${s.name}: ${s.desc}">
          <span class="stage-icon">${done ? '✓' : s.icon}</span>
        </div>
      `;
    }).join('');

    const TT = window.FLASH_I18N ? window.FLASH_I18N.t.bind(window.FLASH_I18N) : (k) => k;

    const currentInfo = p.currentStage
      ? `<div class="stage-current-info">
           <div class="stage-current-label">${TT('current_stage')}</div>
           <div class="stage-current-name">${p.currentStage.icon} ${p.currentStage.name}</div>
           <div class="stage-current-desc">${p.currentStage.desc}</div>
         </div>`
      : `<div class="stage-current-info">
           <div class="stage-current-label">${TT('all_stages')}</div>
           <div class="stage-current-name">🏆 ${TT('mastered')}</div>
           <div class="stage-current-desc">${TT('all_stages_done')}</div>
         </div>`;

    const TT2 = window.FLASH_I18N ? window.FLASH_I18N.t.bind(window.FLASH_I18N) : (k) => k;

    container.innerHTML = `
      <div class="stages-header">
        <div class="stages-title">${TT2('stage_progress')}</div>
        <div class="stages-count">${p.completedCount} / ${p.total}</div>
      </div>
      <div class="stages-strip">${stagesHTML}</div>
      ${currentInfo}
    `;

    // Click handlers for tooltips
    container.querySelectorAll('.stage-dot').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.stageIdx, 10);
        const s = STAGES[idx];
        if (!s) return;
        const done = p.completed.includes(s.id);
        alert(`${s.icon} ${s.name}\n\n${s.desc}\n\n${done ? '✓ Completed' : '🔒 Not yet'}`);
      });
    });
  }

  /* ═══ TOAST — when a new stage completes ═══ */
  function showToast(stage) {
    const el = document.createElement('div');
    el.className = 'stage-toast';
    const TT = window.FLASH_I18N ? window.FLASH_I18N.t.bind(window.FLASH_I18N) : (k) => k;
    el.innerHTML = `
      <div class="stage-toast-icon">${stage.icon}</div>
      <div class="stage-toast-body">
        <div class="stage-toast-label">${TT('stage_complete')}</div>
        <div class="stage-toast-name">${stage.name}</div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 50);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 500);
    }, 3200);
  }

  /* ═══ PUBLIC API ═══ */
  window.FlashStages = {
    init,
    getProgress,
    checkSession,
    isStageDone,
    getStageAt,
    renderStrip,
    showToast,
    reset
  };
})();