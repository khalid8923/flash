/* ============================================================
   FLASH - Referral Modal + Invite Button
   Adds a "Invite" button in the header + a modal for codes
   ============================================================ */
(function () {
  'use strict';

  const F = window.FLASH;
  const API = window.FLASH_API;

  let modalEl = null;
  let inviteBtn = null;
  let state = { code: null, stats: null, loading: false };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildInviteButton() {
    if (inviteBtn) return inviteBtn;
    const tools = document.querySelector('.hdr .tools');
    if (!tools) return null;

    inviteBtn = document.createElement('button');
    inviteBtn.type = 'button';
    inviteBtn.className = 'invite-btn';
    inviteBtn.setAttribute('aria-label', 'Invite friends');
    inviteBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      border: 1px solid var(--ln);
      border-radius: var(--r-2);
      background: var(--pn);
      color: var(--tx);
      font: 500 11px/1 var(--font-ui);
      cursor: pointer;
      transition: all var(--t-fast) var(--e-std);
    `;
    inviteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v20M2 12h20" />
      </svg>
      <span>Invite</span>
    `;
    inviteBtn.addEventListener('mouseenter', () => {
      inviteBtn.style.background = 'var(--pn-hover)';
      inviteBtn.style.borderColor = 'var(--ln-strong)';
    });
    inviteBtn.addEventListener('mouseleave', () => {
      inviteBtn.style.background = 'var(--pn)';
      inviteBtn.style.borderColor = 'var(--ln)';
    });
    inviteBtn.addEventListener('click', openModal);

    /* Insert before lang switcher */
    const lang = tools.querySelector('.lg');
    if (lang) tools.insertBefore(inviteBtn, lang);
    else tools.appendChild(inviteBtn);

    return inviteBtn;
  }

  function buildModal() {
    if (modalEl) return modalEl;
    const el = document.createElement('div');
    el.className = 'ref-modal';
    el.setAttribute('data-open', '0');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Invite friends');

    el.innerHTML = `
      <div class="ref-panel">
        <button class="ref-close" aria-label="Close" type="button">×</button>
        <h2>Invite friends</h2>
        <p>Share your code. They get 100 XP, you get 200 XP when they join.</p>

        <div class="ref-code-box">
          <span class="ref-code" data-ref-code>——</span>
          <button class="ref-copy" data-ref-copy type="button">Copy</button>
        </div>

        <div class="ref-stats">
          <div class="ref-stat">
            <span class="num" data-ref-total>0</span>
            <span class="lbl">Invited</span>
          </div>
          <div class="ref-stat">
            <span class="num" data-ref-xp>0</span>
            <span class="lbl">XP Earned</span>
          </div>
        </div>

        <div style="border-top: 1px solid var(--ln); padding-top: 14px; margin-top: 4px;">
          <p style="margin-bottom: 10px;">Or redeem a friend's code:</p>
          <div class="ref-input-row">
            <input type="text" placeholder="CODE" maxlength="12" data-ref-input />
            <button class="ref-copy" data-ref-redeem type="button">Redeem</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    el.querySelector('.ref-close').addEventListener('click', closeModal);
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal();
    });

    el.querySelector('[data-ref-copy]').addEventListener('click', async () => {
      if (!state.code) return;
      try {
        await navigator.clipboard.writeText(state.code);
        const btn = el.querySelector('[data-ref-copy]');
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      } catch (_) {}
    });

    el.querySelector('[data-ref-redeem]').addEventListener('click', async () => {
      const input = el.querySelector('[data-ref-input]');
      const code = (input.value || '').trim().toUpperCase();
      if (!code) return;
      if (!API || !API.redeemReferral) return;
      try {
        await API.redeemReferral(code);
        input.value = '';
        alert('Success! You earned 100 XP.');
        closeModal();
      } catch (err) {
        alert('Could not redeem: ' + (err && err.message ? err.message : 'unknown_error'));
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.getAttribute('data-open') === '1') closeModal();
    });

    return el;
  }

  async function loadData() {
    if (!API || !API.referralCode) return;
    state.loading = true;
    try {
      const codeRes = await API.referralCode();
      state.code = codeRes && codeRes.code;
      try {
        const statsRes = await API.referralStats();
        state.stats = statsRes;
      } catch (_) {}
    } catch (_) {
      state.code = null;
    } finally {
      state.loading = false;
    }
  }

  function renderData() {
    if (!modalEl) return;
    const codeEl = modalEl.querySelector('[data-ref-code]');
    const totalEl = modalEl.querySelector('[data-ref-total]');
    const xpEl = modalEl.querySelector('[data-ref-xp]');
    if (codeEl) codeEl.textContent = state.code || (state.loading ? '…' : '——');
    if (totalEl) totalEl.textContent = state.stats ? state.stats.total : '0';
    if (xpEl) xpEl.textContent = state.stats ? state.stats.xp_earned : '0';
  }

  async function openModal() {
    buildModal();
    modalEl.setAttribute('data-open', '1');
    await loadData();
    renderData();
  }

  function closeModal() {
    if (modalEl) modalEl.setAttribute('data-open', '0');
  }

  /* ─── Boot ─── */
  if (F && F.onReady) {
    F.onReady(() => {
      setTimeout(buildInviteButton, 900);
    });
  }

  window.FLASH_REFERRAL = {
    open: openModal,
    close: closeModal,
    version: '1.0.0'
  };

  console.info('[REFERRAL] loaded');
})();