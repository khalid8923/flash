/* ============================================================
   FLASH - Ambient Pack v2 Runtime
   Wires the 5 remaining ambient motions from the analysis
   ============================================================ */
(function () {
  'use strict';

  /* ═══ 1.7 Background Depth Field ═══ */
  function mountDepthField() {
    if (document.querySelector('.depth-field')) return;
    const el = document.createElement('div');
    el.className = 'depth-field';
    el.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(el, document.body.firstChild);
  }

  /* ═══ 1.8 Session Arrival Wash ═══ */
  function watchNewSessions() {
    const recent = document.querySelector('[data-panel="recent"] table tbody');
    if (!recent) return;

    let lastCount = recent.children.length;

    const obs = new MutationObserver(() => {
      const now = recent.children.length;
      if (now > lastCount) {
        const first = recent.firstElementChild;
        if (first) {
          first.classList.add('session-arrival');
          setTimeout(() => first.classList.remove('session-arrival'), 1200);
        }
      }
      lastCount = now;
    });

    obs.observe(recent, { childList: true });
  }

  /* ═══ 1.10 Time-of-Day Gradient ═══ */
  function applyTimeOfDay() {
    document.body.classList.add('time-gradient');
    const h = new Date().getHours();
    let period = 'time-night';
    if (h >= 5 && h < 12) period = 'time-morning';
    else if (h >= 12 && h < 18) period = 'time-day';
    else if (h >= 18 && h < 22) period = 'time-evening';
    document.body.classList.add(period);
  }

  /* ═══ 1.11 Footer Insight Morph ═══ */
  function initInsightMorph() {
    const ft = document.querySelector('.ft');
    if (!ft) return;
    const target = ft.querySelector('.ai') || ft.querySelector('[data-insight]');
    if (!target) return;

    if (!target.classList.contains('insight-morph')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'insight-morph';
      const inner = document.createElement('span');
      inner.textContent = target.textContent;
      target.textContent = '';
      wrapper.appendChild(inner);
      target.appendChild(wrapper);
    }

    const wrapper = target.querySelector('.insight-morph');
    if (!wrapper) return;

    const pool = [
      'Consistency beats intensity.',
      'Accuracy first, speed follows.',
      'Short sessions, done often.',
      'Rest is part of training.',
      'Track. Adjust. Repeat.',
      'Focus on the pattern, not the score.'
    ];

    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % pool.length;
      wrapper.classList.add('morphing');
      setTimeout(() => {
        const s = wrapper.querySelector('span');
        if (s) s.textContent = pool[idx];
        wrapper.classList.remove('morphing');
        wrapper.classList.add('morphing-in');
        requestAnimationFrame(() => {
          wrapper.classList.remove('morphing-in');
        });
      }, 420);
    }, 30000);
  }

  /* ═══ 1.12 Idle Calibration Cycle ═══ */
  function initIdleCycle() {
    if (document.querySelector('.idle-ring')) return;
    const el = document.createElement('div');
    el.className = 'idle-ring';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<svg viewBox="0 0 32 32">' +
      '<circle class="bg" cx="16" cy="16" r="14"/>' +
      '<circle class="fg" cx="16" cy="16" r="14"/>' +
      '</svg>';
    document.body.appendChild(el);

    let idleTimer = null;
    const IDLE_MS = 15000;

    function reset() {
      el.classList.remove('active');
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        el.classList.add('active');
      }, IDLE_MS);
    }

    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach((ev) => {
      window.addEventListener(ev, reset, { passive: true });
    });

    reset();
  }

  /* ═══ 1.14 Focus Handoff ═══ */
  function initFocusHandoff() {
    if (document.querySelector('.focus-handoff')) return;
    const bar = document.createElement('div');
    bar.className = 'focus-handoff';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let active = false;

    function moveTo(target) {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      bar.style.top = (rect.top + window.scrollY) + 'px';
      bar.style.left = rect.left + 'px';
      bar.style.width = rect.width + 'px';
      bar.classList.add('active');
      active = true;
      clearTimeout(bar._t);
      bar._t = setTimeout(() => {
        bar.classList.remove('active');
        active = false;
      }, 800);
    }

    document.addEventListener('focusin', (e) => {
      if (e.target.matches('.pn, .col, .lane, [tabindex]')) {
        moveTo(e.target.closest('.pn') || e.target);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') return;
      if (e.key === 'Escape') {
        bar.classList.remove('active');
        active = false;
      }
    });
  }

  /* ═══ 1.15 Statistical Recalibration ═══ */
  function initRecalibration() {
    const nums = document.querySelectorAll('[data-recal]');
    if (!nums.length) return;

    nums.forEach((el) => {
      const target = parseFloat(el.dataset.recal) || 0;
      const start = parseFloat(el.textContent) || 0;
      if (Math.abs(target - start) < 0.01) return;

      el.classList.add('recal-num', target > start ? 'up' : 'down');
      const dur = 480;
      const t0 = performance.now();

      function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = start + (target - start) * eased;
        el.textContent = v.toFixed(1);
        if (p < 1) requestAnimationFrame(step);
        else {
          setTimeout(() => el.classList.remove('up', 'down'), 400);
        }
      }
      requestAnimationFrame(step);
    });
  }

  /* ═══ Boot ═══ */
  function boot() {
    mountDepthField();
    applyTimeOfDay();
    setTimeout(watchNewSessions, 200);
    setTimeout(initInsightMorph, 300);
    setTimeout(initIdleCycle, 400);
    setTimeout(initFocusHandoff, 500);
    setTimeout(initRecalibration, 600);
    console.log('[Ambient Pack v2] Loaded — 6 motions wired');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();