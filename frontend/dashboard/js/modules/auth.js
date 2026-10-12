/* ============================================================
   FLASH — Auth UI Logic
   Handles: Email → OTP → Verify · EN/AR · Theme · Guest mode
   ============================================================ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     1. TRANSLATIONS (self-contained)
     ═══════════════════════════════════════════════════════════ */
  const I18N = {
    en: {
      'auth.tagline': 'A cognitive training instrument. Measure, adapt, improve.',
      'auth.point1': '42 science-backed games across 10 domains',
      'auth.point2': 'Adaptive difficulty tuned to your pace',
      'auth.point3': 'Every session analyzed, no clinical claims',
      'auth.meta': 'Free · Open source · $0 infrastructure',
      'auth.signin': 'Sign in to FLASH',
      'auth.sub': "We'll send a 6-digit code to your email.",
      'auth.email': 'Email',
      'auth.continue': 'Continue',
      'auth.or': 'or',
      'auth.guest': 'Continue as guest',
      'auth.checkEmail': 'Check your email',
      'auth.sentTo': 'Code sent to',
      'auth.verify': 'Verify',
      'auth.changeEmail': 'Change email',
      'auth.resend': 'Resend',
      'auth.resendIn': ' in {s}s',
      'auth.working': 'Working…',
      'auth.errEmail': 'Please enter a valid email.',
      'auth.errCode': 'Enter all 6 digits.',
      'auth.errNetwork': 'Network error. Check your connection.',
      'auth.errRate': 'Too many attempts. Try again in a minute.',
      'auth.errInvalid': 'Invalid code. Try again.',
      'auth.errExpired': 'Code expired. Request a new one.',
      'auth.guestReady': 'Continuing as guest…',
      'auth.welcome': 'Welcome back.'
    },
    ar: {
      'auth.tagline': 'أداة تدريب معرفي. قِس، تكيّف، تطور.',
      'auth.point1': '٤٢ لعبة مبنية على أبحاث علمية عبر ١٠ مجالات',
      'auth.point2': 'صعوبة تكيفية تتوافق مع إيقاعك',
      'auth.point3': 'كل جلسة محللة، بلا ادعاءات طبية',
      'auth.meta': 'مجاني · مفتوح المصدر · بنية بـ $٠',
      'auth.signin': 'تسجيل الدخول إلى FLASH',
      'auth.sub': 'سنرسل رمزاً مكوناً من ٦ أرقام إلى بريدك.',
      'auth.email': 'البريد الإلكتروني',
      'auth.continue': 'متابعة',
      'auth.or': 'أو',
      'auth.guest': 'المتابعة كزائر',
      'auth.checkEmail': 'تفقد بريدك',
      'auth.sentTo': 'تم إرسال الرمز إلى',
      'auth.verify': 'تحقق',
      'auth.changeEmail': 'تغيير البريد',
      'auth.resend': 'إعادة الإرسال',
      'auth.resendIn': ' بعد {s} ث',
      'auth.working': 'جارٍ…',
      'auth.errEmail': 'الرجاء إدخال بريد إلكتروني صحيح.',
      'auth.errCode': 'أدخل الأرقام الستة كاملة.',
      'auth.errNetwork': 'خطأ في الشبكة. تحقق من الاتصال.',
      'auth.errRate': 'محاولات كثيرة. حاول بعد دقيقة.',
      'auth.errInvalid': 'رمز غير صحيح. حاول مجدداً.',
      'auth.errExpired': 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
      'auth.guestReady': 'جارٍ الدخول كزائر…',
      'auth.welcome': 'مرحباً بعودتك.'
    }
  };

  /* ═══════════════════════════════════════════════════════════
     2. CONFIG
     ═══════════════════════════════════════════════════════════ */
  const API_BASE =
    (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) ||
    'http://localhost:3000';

  const STORAGE_KEYS = {
    theme: 'flash.theme',
    lang:  'flash.lang',
    token: 'flash.session',
    email: 'flash.pendingEmail',
    guest: 'flash.guest'
  };

  const RESEND_COOLDOWN_S = 60;

  /* ═══════════════════════════════════════════════════════════
     3. STATE
     ═══════════════════════════════════════════════════════════ */
  const state = {
    lang: 'en',
    step: 'email', // 'email' | 'otp'
    email: '',
    resendInterval: null,
    resendRemaining: 0,
    submitting: false
  };

  /* ═══════════════════════════════════════════════════════════
     4. HELPERS
     ═══════════════════════════════════════════════════════════ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function t(key, params) {
    const dict = I18N[state.lang] || I18N.en;
    let str = dict[key] || I18N.en[key] || key;
    if (params) {
      for (const k in params) {
        str = str.replace('{' + k + '}', params[k]);
      }
    }
    return str;
  }

  function applyI18n() {
    $$('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'ar') lang = 'en';
    state.lang = lang;
    localStorage.setItem(STORAGE_KEYS.lang, lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    $$('.auth-lang button').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });

    applyI18n();
    updateResendLabel();
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function showBanner(msg) {
    const banner = $('#auth-banner');
    if (!banner) return;
    banner.textContent = msg;
    banner.hidden = false;
  }

  function hideBanner() {
    const banner = $('#auth-banner');
    if (!banner) return;
    banner.hidden = true;
    banner.textContent = '';
  }

  function setEmailError(msg) {
    const err = $('#auth-email-error');
    const input = $('#auth-email');
    if (!err || !input) return;
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      err.hidden = true;
      err.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  function setOtpError(msg) {
    const err = $('#auth-otp-error');
    if (!err) return;
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
    } else {
      err.hidden = true;
      err.textContent = '';
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  /* ═══════════════════════════════════════════════════════════
     5. STEP SWITCHING
     ═══════════════════════════════════════════════════════════ */
  function goToStep(step) {
    state.step = step;
    $$('.auth-step').forEach((el) => {
      el.hidden = el.dataset.step !== step;
    });

    if (step === 'otp') {
      const first = $('#auth-otp-grid input');
      if (first) setTimeout(() => first.focus(), 80);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     6. API CALLS
     ═══════════════════════════════════════════════════════════ */
  async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
  }

  async function requestOTP(email) {
    try {
      const { ok, status, data } = await apiPost('/auth/otp/request', { email });
      if (ok) return { ok: true };
      if (status === 429) return { ok: false, reason: 'rate' };
      if (status === 400) return { ok: false, reason: 'email', msg: data.message };
      return { ok: false, reason: 'network' };
    } catch (_) {
      return { ok: false, reason: 'network' };
    }
  }

  async function verifyOTP(email, code) {
    try {
      const { ok, status, data } = await apiPost('/auth/otp/verify', { email, code });
      if (ok && data.token) return { ok: true, token: data.token, user: data.user };
      if (status === 400) return { ok: false, reason: 'invalid' };
      if (status === 410) return { ok: false, reason: 'expired' };
      if (status === 429) return { ok: false, reason: 'rate' };
      return { ok: false, reason: 'invalid' };
    } catch (_) {
      return { ok: false, reason: 'network' };
    }
  }

  /* ═══════════════════════════════════════════════════════════
     7. RESEND TIMER
     ═══════════════════════════════════════════════════════════ */
  function startResendTimer() {
    stopResendTimer();
    state.resendRemaining = RESEND_COOLDOWN_S;
    const btn = $('#auth-resend');
    if (btn) btn.disabled = true;
    updateResendLabel();

    state.resendInterval = setInterval(() => {
      state.resendRemaining -= 1;
      if (state.resendRemaining <= 0) {
        stopResendTimer();
        if (btn) btn.disabled = false;
      } else {
        updateResendLabel();
      }
    }, 1000);
  }

  function stopResendTimer() {
    if (state.resendInterval) {
      clearInterval(state.resendInterval);
      state.resendInterval = null;
    }
    state.resendRemaining = 0;
  }

  function updateResendLabel() {
    const timer = $('#auth-resend-timer');
    if (!timer) return;
    if (state.resendRemaining > 0) {
      timer.textContent = t('auth.resendIn', { s: state.resendRemaining });
    } else {
      timer.textContent = '';
    }
  }

  /* ═══════════════════════════════════════════════════════════
     8. EMAIL FORM
     ═══════════════════════════════════════════════════════════ */
  async function onEmailSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;

    hideBanner();
    setEmailError('');

    const input = $('#auth-email');
    const email = String(input && input.value || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      setEmailError(t('auth.errEmail'));
      if (input) input.focus();
      return;
    }

    state.submitting = true;
    const btn = $('#auth-email-submit');
    const label = btn && btn.querySelector('span');
    const original = label ? label.textContent : '';
    if (label) label.textContent = t('auth.working');
    if (btn) btn.disabled = true;

    const result = await requestOTP(email);

    state.submitting = false;
    if (btn) btn.disabled = false;
    if (label) label.textContent = original;

    if (!result.ok) {
      if (result.reason === 'email') setEmailError(result.msg || t('auth.errEmail'));
      else if (result.reason === 'rate') showBanner(t('auth.errRate'));
      else showBanner(t('auth.errNetwork'));
      return;
    }

    state.email = email;
    localStorage.setItem(STORAGE_KEYS.email, email);

    const display = $('#auth-email-display');
    if (display) display.textContent = email;

    clearOtpInputs();
    goToStep('otp');
    startResendTimer();
  }

  /* ═══════════════════════════════════════════════════════════
     9. OTP INPUTS
     ═══════════════════════════════════════════════════════════ */
  function clearOtpInputs() {
    $$('#auth-otp-grid input').forEach((inp) => {
      inp.value = '';
    });
    setOtpError('');
  }

  function getOtpValue() {
    return $$('#auth-otp-grid input').map((i) => i.value).join('');
  }

  function wireOtpInputs() {
    const inputs = $$('#auth-otp-grid input');

    inputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 1);
        e.target.value = v;

        if (v && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }

        if (getOtpValue().length === 6) {
          setTimeout(() => onOtpSubmit(new Event('submit')), 80);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          inputs[idx - 1].focus();
        }
        if (e.key === 'ArrowLeft' && idx > 0) {
          inputs[idx - 1].focus();
        }
        if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const digits = String(pasted).replace(/\D/g, '').slice(0, 6);
        if (!digits) return;

        digits.split('').forEach((d, i) => {
          if (inputs[i]) inputs[i].value = d;
        });

        const nextEmpty = digits.length < 6 ? inputs[digits.length] : inputs[5];
        if (nextEmpty) nextEmpty.focus();

        if (digits.length === 6) {
          setTimeout(() => onOtpSubmit(new Event('submit')), 80);
        }
      });

      input.addEventListener('focus', (e) => e.target.select());
    });
  }

  /* ═══════════════════════════════════════════════════════════
     10. OTP SUBMIT
     ═══════════════════════════════════════════════════════════ */
  async function onOtpSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (state.submitting) return;

    hideBanner();
    setOtpError('');

    const code = getOtpValue();
    if (code.length !== 6) {
      setOtpError(t('auth.errCode'));
      return;
    }

    state.submitting = true;
    const btn = $('#auth-otp-submit');
    const label = btn && btn.querySelector('span');
    const original = label ? label.textContent : '';
    if (label) label.textContent = t('auth.working');
    if (btn) btn.disabled = true;

    const result = await verifyOTP(state.email, code);

    state.submitting = false;
    if (btn) btn.disabled = false;
    if (label) label.textContent = original;

    if (!result.ok) {
      if (result.reason === 'invalid') setOtpError(t('auth.errInvalid'));
      else if (result.reason === 'expired') showBanner(t('auth.errExpired'));
      else if (result.reason === 'rate') showBanner(t('auth.errRate'));
      else showBanner(t('auth.errNetwork'));
      clearOtpInputs();
      const first = $('#auth-otp-grid input');
      if (first) first.focus();
      return;
    }

    /* Success */
    localStorage.setItem(STORAGE_KEYS.token, result.token);
    localStorage.removeItem(STORAGE_KEYS.email);
    localStorage.removeItem(STORAGE_KEYS.guest);

    if (result.user) {
      try { localStorage.setItem('flash.user', JSON.stringify(result.user)); } catch (_) {}
    }

    showBanner(t('auth.welcome'));
    setTimeout(() => { window.location.href = 'index.html'; }, 400);
  }

  /* ═══════════════════════════════════════════════════════════
     11. GUEST MODE
     ═══════════════════════════════════════════════════════════ */
  function onGuest() {
    localStorage.setItem(STORAGE_KEYS.guest, '1');
    localStorage.removeItem(STORAGE_KEYS.token);
    showBanner(t('auth.guestReady'));
    setTimeout(() => { window.location.href = 'index.html'; }, 400);
  }

  /* ═══════════════════════════════════════════════════════════
     12. RESEND
     ═══════════════════════════════════════════════════════════ */
  async function onResend() {
    if (state.resendRemaining > 0) return;
    if (!state.email) return;

    hideBanner();
    setOtpError('');

    const btn = $('#auth-resend');
    if (btn) btn.disabled = true;

    const result = await requestOTP(state.email);

    if (!result.ok) {
      if (result.reason === 'rate') showBanner(t('auth.errRate'));
      else showBanner(t('auth.errNetwork'));
      if (btn) btn.disabled = false;
      return;
    }

    clearOtpInputs();
    startResendTimer();
    const first = $('#auth-otp-grid input');
    if (first) first.focus();
  }

  /* ═══════════════════════════════════════════════════════════
     13. BACK TO EMAIL
     ═══════════════════════════════════════════════════════════ */
  function onBack() {
    stopResendTimer();
    clearOtpInputs();
    hideBanner();
    goToStep('email');
    const input = $('#auth-email');
    if (input) setTimeout(() => input.focus(), 80);
  }

  /* ═══════════════════════════════════════════════════════════
     14. WIRE UP
     ═══════════════════════════════════════════════════════════ */
  function init() {
    /* Language */
    const savedLang = localStorage.getItem(STORAGE_KEYS.lang) || 'en';
    setLang(savedLang);

    /* Theme */
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    setTheme(savedTheme);

    /* Lang buttons */
    $$('.auth-lang button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    /* Theme button */
    const themeBtn = $('#auth-theme');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    /* Email form */
    const emailForm = $('#auth-email-form');
    if (emailForm) emailForm.addEventListener('submit', onEmailSubmit);

    /* OTP form */
    const otpForm = $('#auth-otp-form');
    if (otpForm) otpForm.addEventListener('submit', onOtpSubmit);
    wireOtpInputs();

    /* Guest */
    const guestBtn = $('#auth-guest');
    if (guestBtn) guestBtn.addEventListener('click', onGuest);

    /* Back */
    const backBtn = $('#auth-back');
    if (backBtn) backBtn.addEventListener('click', onBack);

    /* Resend */
    const resendBtn = $('#auth-resend');
    if (resendBtn) resendBtn.addEventListener('click', onResend);

    /* Prefill email if user was here before */
    const pending = localStorage.getItem(STORAGE_KEYS.email);
    const emailInput = $('#auth-email');
    if (pending && emailInput && isValidEmail(pending)) {
      emailInput.value = pending;
    }

    /* Focus email on load */
    if (emailInput) setTimeout(() => emailInput.focus(), 120);
  }

  /* ═══════════════════════════════════════════════════════════
     15. BOOT
     ═══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();