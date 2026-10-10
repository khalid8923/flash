/* ═══════════════════════════════════════════════════════════
   FLASH — Shared Logo Component
   Usage:
     <link rel="stylesheet" href="shared/logo.css">
     <script src="shared/logo.js"></script>
     <div id="logo"></div>
     <script>FLASH_LOGO.mount('#logo', { size: 200, theme: 'dark' });</script>
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══ Inject CSS (once) ═══ */
  var CSS_ID = 'flash-logo-css';
  if (!document.getElementById(CSS_ID)) {
    var style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = [
      '.flash-logo{position:relative;display:inline-grid;place-items:center;width:var(--logo-size,200px);height:var(--logo-size,200px);}',
      '.flash-logo svg{width:100%;height:100%;overflow:visible;animation:flashLogoBreathe 3.6s ease-in-out infinite;animation-play-state:paused;}',
      '.flash-logo.awake svg{animation-play-state:running;}',
      '@keyframes flashLogoBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.025);}}',
      '.flash-logo .ring-outer{fill:none;stroke:url(#flashLogoGold);stroke-width:5;stroke-linecap:round;filter:url(#flashLogoGlowGold);opacity:0;}',
      '.flash-logo.awake .ring-outer{animation:flashLogoRingDraw 1.4s cubic-bezier(.4,0,.1,1) forwards;}',
      '@keyframes flashLogoRingDraw{0%{stroke-dashoffset:1400;opacity:0;}20%{opacity:1;}100%{stroke-dashoffset:0;opacity:1;}}',
      '.flash-logo .ring-inner{fill:none;stroke:url(#flashLogoSilver);stroke-width:1.5;stroke-dasharray:4 8;opacity:0;transform-origin:250px 250px;}',
      '.flash-logo.awake .ring-inner{animation:flashLogoRingFade 1s 0.8s ease-out forwards, flashLogoRingRotate 90s linear 0.8s infinite;}',
      '@keyframes flashLogoRingFade{to{opacity:.6;}}',
      '@keyframes flashLogoRingRotate{to{transform:rotate(360deg);}}',
      '.flash-logo .bolt{fill:url(#flashLogoGold);filter:url(#flashLogoGlowGold);opacity:0;transform-origin:140px 250px;}',
      '.flash-logo.awake .bolt{animation:flashLogoBoltAppear .8s .4s cubic-bezier(.2,0,0,1) forwards, flashLogoBoltCharge 4s 2s ease-in-out infinite;}',
      '@keyframes flashLogoBoltAppear{0%{opacity:0;transform:scale(.7);}60%{opacity:1;transform:scale(1.08);}100%{opacity:1;transform:scale(1);}}',
      '@keyframes flashLogoBoltCharge{0%,85%,100%{filter:url(#flashLogoGlowGold);transform:scale(1);}92%{filter:url(#flashLogoGlowGoldStrong);transform:scale(1.04);}}',
      '.flash-logo .brain{opacity:0;transform-origin:320px 200px;}',
      '.flash-logo.awake .brain{animation:flashLogoBrainAppear 1s .9s ease-out forwards;}',
      '@keyframes flashLogoBrainAppear{0%{opacity:0;transform:scale(.85) translateY(-10px);}100%{opacity:1;transform:scale(1) translateY(0);}}',
      '.flash-logo .brain-left{fill:url(#flashLogoGold);filter:url(#flashLogoGlowGoldSoft);}',
      '.flash-logo .brain-right{fill:url(#flashLogoSilver);filter:url(#flashLogoGlowSilver);}',
      '.flash-logo .gyri{fill:none;stroke:var(--flash-logo-ink,#1E2230);stroke-width:1.8;stroke-linecap:round;opacity:.5;}',
      '.flash-logo .neuron{fill:var(--flash-logo-gold,#F48FB1);opacity:0;filter:url(#flashLogoGlowGoldSoft);}',
      '.flash-logo.awake .neuron{animation:flashLogoNeuronFire 2.4s ease-in-out infinite;}',
      '@keyframes flashLogoNeuronFire{0%,100%{opacity:0;}50%{opacity:1;}}',
      '.flash-logo .synapse{stroke:var(--flash-logo-gold,#F48FB1);stroke-width:.8;fill:none;opacity:0;stroke-linecap:round;}',
      '.flash-logo.awake .synapse{animation:flashLogoSynapseFlash 3s ease-out infinite;}',
      '@keyframes flashLogoSynapseFlash{0%{opacity:0;stroke-dashoffset:30;}20%{opacity:.8;}60%{opacity:.4;stroke-dashoffset:0;}100%{opacity:0;stroke-dashoffset:-30;}}',
      '.flash-logo .wordmark{font-family:"Helvetica Neue","Arial Black",sans-serif;font-weight:900;fill:url(#flashLogoGold);opacity:0;letter-spacing:4px;filter:url(#flashLogoGlowGoldSoft);}',
      '.flash-logo.awake .wordmark{animation:flashLogoTextAppear .8s 1.4s ease-out forwards;}',
      '@keyframes flashLogoTextAppear{0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);}}',
      '.flash-logo .tagline{font-family:"SF Mono","JetBrains Mono",monospace;font-weight:500;fill:var(--flash-logo-silver,#C8C8C8);opacity:0;letter-spacing:3px;font-size:11px;}',
      '.flash-logo.awake .tagline{animation:flashLogoTextAppear .8s 1.8s ease-out forwards;}',
      '.flash-logo .divider{stroke:url(#flashLogoGold);stroke-width:1.5;stroke-linecap:round;opacity:0;}',
      '.flash-logo.awake .divider{animation:flashLogoDividerDraw .8s 1.6s ease-out forwards;}',
      '@keyframes flashLogoDividerDraw{0%{stroke-dashoffset:300;opacity:0;}100%{stroke-dashoffset:0;opacity:.8;}}',
      '.flash-logo .badge-hex{fill:none;stroke:url(#flashLogoGold);stroke-width:1.5;opacity:0;}',
      '.flash-logo.awake .badge-hex{animation:flashLogoBadgeFade .6s 2.2s ease-out forwards;}',
      '@keyframes flashLogoBadgeFade{to{opacity:.8;}}',
      '.flash-logo .badge-icon{fill:url(#flashLogoGold);opacity:0;}',
      '.flash-logo.awake .badge-icon{animation:flashLogoBadgeFade .6s 2.4s ease-out forwards;}',
      '.flash-logo .badge-icon-silver{fill:url(#flashLogoSilver);opacity:0;}',
      '.flash-logo.awake .badge-icon-silver{animation:flashLogoBadgeFade .6s 2.6s ease-out forwards;}',
      '@media(prefers-reduced-motion:reduce){.flash-logo svg,.flash-logo .ring-outer,.flash-logo .ring-inner,.flash-logo .bolt,.flash-logo .brain,.flash-logo .wordmark,.flash-logo .tagline,.flash-logo .divider,.flash-logo .badge-hex,.flash-logo .badge-icon,.flash-logo .badge-icon-silver,.flash-logo .neuron,.flash-logo .synapse{animation-duration:.01ms!important;animation-iteration-count:1!important;opacity:1!important;}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ═══ SVG Markup ═══ */
  var uid = 0;
  function svgMarkup() {
    var id = 'flashLogo' + (++uid);
    return {
      id: id,
      svg: '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" aria-label="FLASH">'
        + '<defs>'
        + '<linearGradient id="' + id + '_gold" x1="0%" y1="0%" x2="100%" y2="100%">'
        + '<stop offset="0%" stop-color="var(--flash-logo-gold,#F48FB1)"/>'
        + '<stop offset="50%" stop-color="var(--flash-logo-gold-mid,#E91E63)"/>'
        + '<stop offset="100%" stop-color="var(--flash-logo-gold-deep,#AD1457)"/>'
        + '</linearGradient>'
        + '<linearGradient id="' + id + '_silver" x1="0%" y1="0%" x2="100%" y2="100%">'
        + '<stop offset="0%" stop-color="#E8E8E8"/>'
        + '<stop offset="50%" stop-color="#FFFFFF"/>'
        + '<stop offset="100%" stop-color="#A8A8A8"/>'
        + '</linearGradient>'
        + '<filter id="' + id + '_glowGold" x="-50%" y="-50%" width="200%" height="200%">'
        + '<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<filter id="' + id + '_glowGoldStrong" x="-50%" y="-50%" width="200%" height="200%">'
        + '<feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<filter id="' + id + '_glowGoldSoft" x="-50%" y="-50%" width="200%" height="200%">'
        + '<feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<filter id="' + id + '_glowSilver" x="-50%" y="-50%" width="200%" height="200%">'
        + '<feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '</defs>'
        + '<circle class="ring-outer" cx="250" cy="250" r="215" stroke-dasharray="1350 50" stroke-dashoffset="1350" transform="rotate(-90 250 250)" style="stroke:url(#' + id + '_gold);filter:url(#' + id + '_glowGold);"/>'
        + '<circle class="ring-inner" cx="250" cy="250" r="195" style="stroke:url(#' + id + '_silver);"/>'
        + '<g class="bolt" style="fill:url(#' + id + '_gold);filter:url(#' + id + '_glowGold);">'
        + '<path d="M 155 130 L 200 130 L 175 215 L 210 215 L 145 320 L 165 240 L 125 240 Z"/></g>'
        + '<g class="brain">'
        + '<path class="brain-left" style="fill:url(#' + id + '_gold);filter:url(#' + id + '_glowGoldSoft);" d="M 305 155 C 290 145, 275 148, 268 160 C 258 158, 250 165, 252 175 C 245 178, 245 190, 254 195 C 250 205, 258 215, 268 212 C 275 220, 288 220, 295 210 C 305 212, 310 200, 306 192 C 310 182, 308 168, 305 155 Z"/>'
        + '<path class="brain-right" style="fill:url(#' + id + '_silver);filter:url(#' + id + '_glowSilver);" d="M 320 155 C 335 145, 350 148, 357 160 C 367 158, 375 165, 373 175 C 380 178, 380 190, 371 195 C 375 205, 367 215, 357 212 C 350 220, 337 220, 330 210 C 320 212, 315 200, 319 192 C 315 182, 317 168, 320 155 Z"/>'
        + '<path class="gyri" d="M 275 165 Q 285 175 280 190"/><path class="gyri" d="M 262 175 Q 270 185 265 200"/>'
        + '<path class="gyri" d="M 295 168 Q 305 178 300 195"/><path class="gyri" d="M 340 165 Q 330 175 335 190"/>'
        + '<path class="gyri" d="M 355 175 Q 347 185 352 200"/><path class="gyri" d="M 325 168 Q 315 178 320 195"/>'
        + '<circle class="neuron" cx="272" cy="172" r="2" style="animation-delay:0s;"/><circle class="neuron" cx="292" cy="185" r="2" style="animation-delay:.3s;"/>'
        + '<circle class="neuron" cx="262" cy="195" r="2" style="animation-delay:.6s;"/><circle class="neuron" cx="298" cy="200" r="2" style="animation-delay:.9s;"/>'
        + '<circle class="neuron" cx="342" cy="172" r="2" style="animation-delay:.15s;"/><circle class="neuron" cx="325" cy="185" r="2" style="animation-delay:.45s;"/>'
        + '<circle class="neuron" cx="355" cy="195" r="2" style="animation-delay:.75s;"/><circle class="neuron" cx="318" cy="200" r="2" style="animation-delay:1.05s;"/>'
        + '<path class="synapse" d="M 272 172 Q 285 178 292 185" stroke-dasharray="30" stroke-dashoffset="30" style="animation-delay:.5s;"/>'
        + '<path class="synapse" d="M 262 195 Q 275 200 298 200" stroke-dasharray="30" stroke-dashoffset="30" style="animation-delay:1.2s;"/>'
        + '<path class="synapse" d="M 342 172 Q 330 178 325 185" stroke-dasharray="30" stroke-dashoffset="30" style="animation-delay:1.8s;"/>'
        + '<path class="synapse" d="M 355 195 Q 340 200 318 200" stroke-dasharray="30" stroke-dashoffset="30" style="animation-delay:2.4s;"/>'
        + '</g>'
        + '<text class="wordmark" x="250" y="315" text-anchor="middle" font-size="82">FLASH</text>'
        + '<line class="divider" x1="130" y1="345" x2="370" y2="345" stroke-dasharray="240" stroke-dashoffset="240"/>'
        + '<text class="tagline" x="250" y="378" text-anchor="middle">THINK DEEPER. WIN SMARTER.</text>'
        + '<g transform="translate(250 425)">'
        + '<g transform="translate(-55 0)"><polygon class="badge-hex" points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11"/><path class="badge-icon" d="M -3,-10 L -1,-12 L 1,-10 L 3,-12 L 5,-9 L 3,-6 L 5,-3 L -5,-3 L -3,-6 L -5,-9 Z M -5,-3 L 5,-3 L 6,2 L -6,2 Z M -7,2 L 7,2 L 7,5 L -7,5 Z"/></g>'
        + '<g transform="translate(0 0)"><polygon class="badge-hex" points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"/><path class="badge-icon-silver" d="M 0,-14 L 10,-8 L 10,4 L 0,10 L -10,4 L -10,-8 Z M 0,-11 L -7,-7 L 0,-3 L 7,-7 Z M 0,-1 L -7,-5 L -7,1 L 0,5 L 7,1 L 7,-5 Z"/></g>'
        + '<g transform="translate(55 0)"><polygon class="badge-hex" points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11"/><path class="badge-icon" d="M -7,-12 L -5,-9 L -2,-9 L 0,-12 L 2,-9 L 5,-9 L 7,-12 L 7,-7 L -7,-7 Z M -5,-7 L -3,-2 L 3,-2 L 5,-7 Z M -6,-2 L 6,-2 L 6,3 L -6,3 Z M -7,3 L 7,3 L 7,7 L -7,7 Z"/></g>'
        + '</g>'
        + '</svg>'
    };
  }

  /* ═══ Mount API ═══ */
  function mount(selector, opts) {
    opts = opts || {};
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { console.warn('[FLASH_LOGO] element not found:', selector); return null; }

    var markup = svgMarkup();

    /* Apply CSS variables */
    if (opts.size)  el.style.setProperty('--logo-size', typeof opts.size === 'number' ? opts.size + 'px' : opts.size);
    if (opts.gold)  el.style.setProperty('--flash-logo-gold', opts.gold);
    if (opts.goldMid) el.style.setProperty('--flash-logo-gold-mid', opts.goldMid);
    if (opts.goldDeep) el.style.setProperty('--flash-logo-gold-deep', opts.goldDeep);
    if (opts.ink)   el.style.setProperty('--flash-logo-ink', opts.ink);
    if (opts.silver) el.style.setProperty('--flash-logo-silver', opts.silver);

    el.classList.add('flash-logo');
    el.innerHTML = markup.svg;

    /* Awake after delay (or immediately) */
    var delay = typeof opts.delay === 'number' ? opts.delay : 300;
    if (opts.animated === false) {
      el.classList.add('awake');
    } else {
      setTimeout(function () { el.classList.add('awake'); }, delay);
    }

    return {
      el: el,
      replay: function () {
        el.classList.remove('awake');
        setTimeout(function () { el.classList.add('awake'); }, 200);
      }
    };
  }

  /* ═══ Expose ═══ */
  window.FLASH_LOGO = {
    mount: mount,
    themes: {
      pink:   { gold: '#F48FB1', goldMid: '#E91E63', goldDeep: '#AD1457' },
      gold:   { gold: '#F5C842', goldMid: '#FFD86B', goldDeep: '#D4A617' },
      cyan:   { gold: '#00E5FF', goldMid: '#7DF9FF', goldDeep: '#00B8CC' },
      purple: { gold: '#B388FF', goldMid: '#9D4EDD', goldDeep: '#6A1B9A' }
    }
  };
})();