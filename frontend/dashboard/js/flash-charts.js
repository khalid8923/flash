/* ═══════════════════════════════════════════════════════════
   FLASH Dashboard — Charts (Canvas)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const DOMAINS = window.FLASH_DATA.DOMAINS;
  let _nodes = [], _raf = null;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  /* ═══════════ RADAR ═══════════ */
  function drawRadar() {
    const cv  = document.getElementById('radar-cv');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const sz  = 252;
    cv.width  = sz * dpr; cv.height = sz * dpr;
    cv.style.width  = sz + 'px';
    cv.style.height = sz + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const cx = sz / 2, cy = sz / 2, R = 88, n = DOMAINS.length;
    const dark   = getTheme() === 'dark';
    const gridC  = dark ? 'rgba(237,240,255,.05)' : 'rgba(7,7,15,.05)';
    const labelC = dark ? 'rgba(237,240,255,.36)' : 'rgba(7,7,15,.36)';

    ctx.clearRect(0, 0, sz, sz);

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI / n) - Math.PI / 2;
        const r = (ring / 4) * R;
        i ? ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
          : ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.strokeStyle = gridC; ctx.lineWidth = 1; ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.strokeStyle = gridC; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.beginPath();
    DOMAINS.forEach((d, i) => {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2;
      const r = (d.score / 100) * R;
      i ? ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
        : ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
    grad.addColorStop(0, 'rgba(0,238,255,.26)');
    grad.addColorStop(1, 'rgba(255,0,119,.26)');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(0,238,255,.7)';
    ctx.lineWidth = 1.5; ctx.stroke();

    DOMAINS.forEach((d, i) => {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2;
      const r = (d.score / 100) * R;
      const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
      ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = d.color; ctx.fill();

      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = labelC;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.icon, cx + (R + 15) * Math.cos(a), cy + (R + 15) * Math.sin(a));
    });
  }

  /* ═══════════ NEURAL BG ═══════════ */
  function drawNeural() {
    const cv = document.getElementById('neural-bg');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const scale = 0.5;
    cv.width  = Math.floor(window.innerWidth  * scale);
    cv.height = Math.floor(window.innerHeight * scale);
    cv.style.width  = '100%';
    cv.style.height = '100%';

    if (_raf) cancelAnimationFrame(_raf);

    _nodes = Array.from({ length: 30 }, () => ({
      x: Math.random() * cv.width,
      y: Math.random() * cv.height,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      r:  1.2 + Math.random() * 1.8,
      p:  Math.random() * Math.PI * 2,
    }));

    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30;
    let paused = document.hidden;

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused && !_raf) _raf = requestAnimationFrame(frame);
    });

    const frame = (now) => {
      if (paused) { _raf = null; return; }
      _raf = requestAnimationFrame(frame);

      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      ctx.clearRect(0, 0, cv.width, cv.height);
      const dark = getTheme() === 'dark';
      const lA = dark ? .09 : .042;
      const nA = dark ? .55 : .18;

      _nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.p += .014;
        if (n.x < 0 || n.x > cv.width)  n.vx *= -1;
        if (n.y < 0 || n.y > cv.height) n.vy *= -1;
      });

      const MAX_DIST_SQ = 125 * 125;
      for (let i = 0; i < _nodes.length; i++) {
        for (let j = i + 1; j < _nodes.length; j++) {
          const dx = _nodes[i].x - _nodes[j].x;
          const dy = _nodes[i].y - _nodes[j].y;
          const dSq = dx * dx + dy * dy;
          if (dSq < MAX_DIST_SQ) {
            const d = Math.sqrt(dSq);
            ctx.beginPath();
            ctx.moveTo(_nodes[i].x, _nodes[i].y);
            ctx.lineTo(_nodes[j].x, _nodes[j].y);
            ctx.strokeStyle = `rgba(0,238,255,${(1 - d / 125) * lA})`;
            ctx.lineWidth = .55;
            ctx.stroke();
          }
        }
      }

      _nodes.forEach(n => {
        const pv = (Math.sin(n.p) + 1) / 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (.8 + .4 * pv), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,238,255,${nA * (.5 + .5 * pv)})`;
        ctx.fill();
      });
    };

    _raf = requestAnimationFrame(frame);
  }

  /* ═══════════ LEVEL RING ═══════════ */
  function animateRing() {
    const arc = document.getElementById('lvl-arc');
    if (!arc) return;
    const circ = 2 * Math.PI * 32;
    arc.style.strokeDasharray  = circ;
    arc.style.strokeDashoffset = circ;
    setTimeout(() => { arc.style.strokeDashoffset = circ * (1 - 0.834); }, 420);
  }

  window.FLASH_CHARTS = { drawRadar, drawNeural, animateRing };
})();