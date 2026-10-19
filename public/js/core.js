/* ═══════════════════════════════════════════════════════════
   FLASH Dashboard — Core
   State · Render · Theme · Language
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const $ = s => document.querySelector(s);
const root = document.documentElement;
const M = window.FLASH_DATA;
const DB = window.FLASH_I18N_DB;

const state = {
  lang: 'en',
  theme: 'light'
};

/* ─── Storage ─── */
function loadPrefs(){
  try {
    const t = localStorage.getItem('flash.theme');
    if (t === 'dark' || t === 'light') state.theme = t;
    const l = localStorage.getItem('flash.lang');
    if (l === 'ar' || l === 'en') state.lang = l;
  } catch(e){}
}
function savePref(k, v){
  try { localStorage.setItem('flash.' + k, v); } catch(e){}
}

/* ─── i18n ─── */
function t(k){ return (DB[state.lang] || DB.en)[k] || k; }

/* ─── Helpers ─── */
const loc = () => state.lang === 'ar' ? 'ar-EG' : 'en-GB';
const N   = x => new Intl.NumberFormat(loc()).format(x);
const N1  = x => new Intl.NumberFormat(loc(), { minimumFractionDigits:1, maximumFractionDigits:1 }).format(x);
const DF  = d => new Intl.DateTimeFormat(loc(), { day:'2-digit', month:'short', timeZone:'UTC' }).format(new Date(d));
const P   = () => state.lang === 'ar' ? '٪' : '%';
const pc  = x => N(x) + P();

const g  = (o, k) => o[k + '_' + state.lang];
const ai = s => String(s).replace(/[0-9٠-٩]+/g, '<span class="nm">$&</span>');

/* ─── Theme ─── */
function applyTheme(){
  root.dataset.theme = state.theme;
  const btn = $('#th');
  if (btn){
    btn.setAttribute('aria-label', state.theme === 'dark' ? t('toLight') : t('toDark'));
  }
}

/* ─── Language ─── */
function applyLang(){
  root.lang = state.lang;
  root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lg button').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.l === state.lang ? 'true' : 'false');
  });
}

/* ─── Public API ─── */
window.FLASH = {
  state,
  t, N, N1, DF, pc, P, g, ai,
  setTheme(v){ state.theme = v; savePref('theme', v); applyTheme(); },
  setLang(v){ state.lang = v; savePref('lang', v); applyLang(); },
  toggleTheme(){ this.setTheme(state.theme === 'dark' ? 'light' : 'dark'); },
  onReady(fn){ document.addEventListener('DOMContentLoaded', fn); },
  $, root, M
};

/* ─── Init ─── */
loadPrefs();
applyTheme();
applyLang();

})();