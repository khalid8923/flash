/* ============================================================
   FLASH - Brain Alternative Metaphors
   3 rendering engines on one canvas:
     - lattice   : 42 games + 10 hubs (semantic graph)
     - fib       : Fibonacci sphere (dense golden-angle dots)
     - slices    : 24 stacked MRI-style outlines
   User can switch via window.FLASH_BRAIN_ALT.setMode('lattice')
   ============================================================ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     SHARED CONFIG
     ═══════════════════════════════════════════════════════════ */
  const CFG = {
    FPS_CAP: 30,
    DPR_CAP: 2,
    FOV: 2.4,
    YAW_SPEED: 0.045,
    PITCH_AMP: 0.06,
    PITCH_PERIOD: 28,
    DEPTH_FADE: 0.85
  };

  const DOMAINS = [
    { id: 'attention',  color: [45, 212, 224] },
    { id: 'spatial',    color: [61, 220, 151] },
    { id: 'speed',      color: [255, 217, 61] },
    { id: 'memory',     color: [155, 123, 255] },
    { id: 'logic',      color: [77, 141, 255] },
    { id: 'language',   color: [255, 159, 67] },
    { id: 'creativity', color: [255, 110, 199] },
    { id: 'emotional',  color: [255, 90, 95] },
    { id: 'problem',    color: [90, 169, 255] },
    { id: 'numerical',  color: [182, 240, 74] }
  ];

  const GAMES_PER_DOMAIN = {
    attention: 4, spatial: 4, speed: 4, memory: 5,
    logic: 5, language: 4, creativity: 4, emotional: 4,
    problem: 4, numerical: 4
  };

  /* ═══════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════ */
  const state = {
    canvas: null,
    ctx: null,
    w: 0, h: 0,
    dpr: 1,
    mode: 'lattice',
    yaw: 0,
    pitch: 0,
    lastT: 0,
    raf: null,
    running: false,
    reducedMotion: false,
    theme: 'light',
    streak: 0
  };

  /* ═══════════════════════════════════════════════════════════
     MATH
     ═══════════════════════════════════════════════════════════ */
  function rotateY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
  }

  function rotateX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  function project(p, w, h) {
    const persp = 1 / (1 + p.z * 0.55);
    const scale = Math.min(w, h) * 0.48;
    return {
      x: w / 2 + p.x * scale * persp,
      y: h / 2 + p.y * scale * persp,
      z: p.z,
      persp
    };
  }

  function fibSphere(i, n, radius) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  /* ═══════════════════════════════════════════════════════════
     LATTICE GEOMETRY
     ═══════════════════════════════════════════════════════════ */
  let latticeCache = null;

  function buildLattice() {
    if (latticeCache) return latticeCache;

    const hubs = [];
    const games = [];
    const edges = [];

    /* 10 hubs on a Fibonacci sphere */
    DOMAINS.forEach((d, i) => {
      const p = fibSphere(i, DOMAINS.length, 0.62);
      hubs.push({
        id: d.id,
        kind: 'hub',
        color: d.color,
        x: p.x, y: p.y, z: p.z,
        r: 4.2,
        phase: Math.random() * Math.PI * 2
      });
    });

    /* Games orbit their hub */
    let gameIdx = 0;
    DOMAINS.forEach((d, di) => {
      const hub = hubs[di];
      const count = GAMES_PER_DOMAIN[d.id] || 4;
      for (let k = 0; k < count; k++) {
        const p = fibSphere(k, count, 0.18);
        games.push({
          id: d.id + '-' + k,
          kind: 'game',
          domain: d.id,
          color: d.color,
          x: hub.x + p.x + (Math.random() - 0.5) * 0.05,
          y: hub.y + p.y + (Math.random() - 0.5) * 0.05,
          z: hub.z + p.z + (Math.random() - 0.5) * 0.05,
          r: 1.8,
          phase: Math.random() * Math.PI * 2
        });
        /* Edge game → hub */
        edges.push({ a: gameIdx + DOMAINS.length, b: di, kind: 'spoke' });
        gameIdx++;
      }
    });

    /* Inter-hub edges (cross-domain) */
    hubs.forEach((a, i) => {
      hubs.forEach((b, j) => {
        if (i >= j) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        if (dist < 0.85 && Math.random() < 0.55) {
          edges.push({ a: i, b: j, kind: 'bridge' });
        }
      });
    });

    latticeCache = { hubs, games, edges, all: hubs.concat(games) };
    return latticeCache;
  }

  /* ═══════════════════════════════════════════════════════════
     FIBONACCI SPHERE GEOMETRY
     ═══════════════════════════════════════════════════════════ */
  let fibCache = null;

  function buildFibSphere() {
    if (fibCache) return fibCache;
    const N = 1800;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const p = fibSphere(i, N, 0.92);
      const near = Math.abs(p.z);
      pts.push({
        x: p.x, y: p.y, z: p.z,
        r: 0.7 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        glow: Math.random() < 0.15
      });
    }
    fibCache = { points: pts };
    return fibCache;
  }

  /* ═══════════════════════════════════════════════════════════
     SCAN SLICES GEOMETRY
     ═══════════════════════════════════════════════════════════ */
  let sliceCache = null;

  function buildSlices() {
    if (sliceCache) return sliceCache;
    const N = 24;
    const slices = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const y = -0.85 + t * 1.7;
      /* Width narrows toward top/bottom — like a brain */
      const widthFactor = Math.sin(t * Math.PI);
      const rx = 0.55 * widthFactor + 0.15;
      const rz = 0.42 * widthFactor + 0.12;
      const pts = 24;
      const outline = [];
      for (let k = 0; k < pts; k++) {
        const a = (k / pts) * Math.PI * 2;
        /* Slight asymmetry for organic feel */
        const wobble = 1 + Math.sin(a * 3 + i * 0.4) * 0.06;
        outline.push({
          x: Math.cos(a) * rx * wobble,
          y: 0,
          z: Math.sin(a) * rz * wobble
        });
      }
      slices.push({ y, outline });
    }
    sliceCache = { slices };
    return sliceCache;
  }

  /* ═══════════════════════════════════════════════════════════
     SIZE
     ═══════════════════════════════════════════════════════════ */
  function resize() {
    if (!state.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, CFG.DPR_CAP);
    const rect = state.canvas.getBoundingClientRect();
    state.dpr = dpr;
    state.w = rect.width;
    state.h = rect.height;
    state.canvas.width = rect.width * dpr;
    state.canvas.height = rect.height * dpr;
    if (state.ctx) state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ═══════════════════════════════════════════════════════════
     RENDERERS
     ═══════════════════════════════════════════════════════════ */
  function renderLattice(t) {
    const ctx = state.ctx;
    const { all, edges, hubs } = buildLattice();
    const isDark = state.theme === 'dark';
    const alphaBoost = 0.35 + state.streak * 0.65;

    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

    /* Project all nodes */
    const proj = new Array(all.length);
    for (let i = 0; i < all.length; i++) {
      let p = rotateY(all[i], state.yaw);
      p = rotateX(p, state.pitch);
      proj[i] = project(p, state.w, state.h);
    }

    /* Draw edges back-to-front */
    const sorted = edges
      .map((e) => ({ e, z: (proj[e.a].z + proj[e.b].z) * 0.5 }))
      .sort((a, b) => a.z - b.z);

    for (let i = 0; i < sorted.length; i++) {
      const { e } = sorted[i];
      const A = proj[e.a], B = proj[e.b];
      const depth = (A.z + B.z) * 0.5;
      const depthAlpha = 1 - Math.max(0, depth) * CFG.DEPTH_FADE;
      const baseAlpha = e.kind === 'spoke' ? 0.22 : 0.30;
      const alpha = baseAlpha * depthAlpha * alphaBoost;
      const c = all[e.a].color;
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = e.kind === 'bridge' ? 1.0 : 0.7;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    /* Draw nodes back-to-front */
    const nodeOrder = all
      .map((n, i) => ({ n, i, z: proj[i].z }))
      .sort((a, b) => a.z - b.z);

    const pulseBase = t / 1000;
    for (let k = 0; k < nodeOrder.length; k++) {
      const { n, i } = nodeOrder[k];
      const p = proj[i];
      const depthBoost = 1 - Math.max(0, p.z) * 0.5;
      const pulse = 0.5 + 0.5 * Math.sin(pulseBase * 2 + n.phase);
      const r = n.r * (0.9 + pulse * 0.25) * depthBoost * p.persp;
      const alpha = (0.5 + pulse * 0.4) * depthBoost * alphaBoost;
      const c = n.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha.toFixed(3) + ')';
      ctx.fill();

      if (n.kind === 'hub' && isDark && p.z < 0.3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.15).toFixed(3) + ')';
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function renderFib(t) {
    const ctx = state.ctx;
    const { points } = buildFibSphere();
    const isDark = state.theme === 'dark';

    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

    const proj = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
      let p = rotateY(points[i], state.yaw);
      p = rotateX(p, state.pitch);
      proj[i] = project(p, state.w, state.h);
    }

    const order = points
      .map((p, i) => ({ p, i, z: proj[i].z }))
      .sort((a, b) => a.z - b.z);

    const pulseBase = t / 1000;

    for (let k = 0; k < order.length; k++) {
      const { p: pt, i } = order[k];
      const proj2 = proj[i];
      const depthBoost = 1 - Math.max(0, proj2.z) * 0.85;
      const pulse = 0.5 + 0.5 * Math.sin(pulseBase * 1.6 + pt.phase);
      const r = pt.r * depthBoost * proj2.persp * (0.85 + pulse * 0.3);
      const baseAlpha = pt.glow ? 0.5 : 0.28;
      const alpha = baseAlpha * depthBoost * (0.5 + state.streak * 0.5);

      /* Front dots get accent color, back dots muted */
      let c = [220, 220, 230];
      if (proj2.z < -0.2) c = [255, 217, 61];
      if (isDark && proj2.z < -0.5) c = [255, 255, 255];

      ctx.beginPath();
      ctx.arc(proj2.x, proj2.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function renderSlices(t) {
    const ctx = state.ctx;
    const { slices } = buildSlices();
    const isDark = state.theme === 'dark';
    const alphaBoost = 0.35 + state.streak * 0.65;

    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

    /* Sort slices by their rotated y (back first) */
    const order = slices.map((s, i) => {
      let p = rotateY({ x: 0, y: s.y, z: 0 }, state.yaw);
      p = rotateX(p, state.pitch);
      return { s, i, depth: p.z, y: p.y };
    }).sort((a, b) => a.depth - b.depth);

    /* Use first hub color as tint */
    const tint = [200, 220, 255];
    if (isDark) tint[0] = tint[1] = tint[2] = 220;

    for (let k = 0; k < order.length; k++) {
      const { s, depth } = order[k];
      const alpha = (1 - Math.max(0, depth) * CFG.DEPTH_FADE) * 0.35 * alphaBoost;

      const projected = [];
      for (let i = 0; i < s.outline.length; i++) {
        const o = s.outline[i];
        const pt = { x: o.x, y: s.y, z: o.z };
        let p = rotateY(pt, state.yaw);
        p = rotateX(p, state.pitch);
        projected.push(project(p, state.w, state.h));
      }

      ctx.strokeStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    /* Add accent glow on the middle slices */
    if (isDark) {
      const mid = slices[(slices.length / 2) | 0];
      if (mid) {
        const projected = [];
        for (let i = 0; i < mid.outline.length; i++) {
          const o = mid.outline[i];
          const pt = { x: o.x, y: mid.y, z: o.z };
          let p = rotateY(pt, state.yaw);
          p = rotateX(p, state.pitch);
          projected.push(project(p, state.w, state.h));
        }
        ctx.strokeStyle = 'rgba(255,217,61,' + (0.4 * alphaBoost).toFixed(3) + ')';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN LOOP
     ═══════════════════════════════════════════════════════════ */
  function render(t) {
    if (!state.running) return;
    const ctx = state.ctx;
    if (!ctx) return;

    const dt = state.lastT ? Math.min((t - state.lastT) / 1000, 0.1) : 0;
    state.lastT = t;

    const minFrame = 1000 / CFG.FPS_CAP;
    if (state.__lastFrame && (t - state.__lastFrame) < minFrame) {
      state.raf = requestAnimationFrame(render);
      return;
    }
    state.__lastFrame = t;

    if (!state.reducedMotion) {
      const yawSpeed = CFG.YAW_SPEED * (0.6 + state.streak * 0.8);
      state.yaw += yawSpeed * dt;
      state.pitch = Math.sin(t / 1000 * (2 * Math.PI / CFG.PITCH_PERIOD)) * CFG.PITCH_AMP;
    }

    ctx.clearRect(0, 0, state.w, state.h);

    if (state.mode === 'lattice') renderLattice(t);
    else if (state.mode === 'fib') renderFib(t);
    else if (state.mode === 'slices') renderSlices(t);

    if (state.reducedMotion) {
      state.running = false;
      return;
    }

    state.raf = requestAnimationFrame(render);
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  function init(canvasEl) {
    if (!canvasEl) return false;
    state.canvas = canvasEl;
    state.ctx = canvasEl.getContext('2d', { alpha: true });
    if (!state.ctx) return false;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.reducedMotion = mq.matches;
    mq.addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
      if (state.reducedMotion) {
        state.running = false;
        if (state.raf) cancelAnimationFrame(state.raf);
      } else if (!state.running) {
        start();
      }
    });

    state.theme = document.documentElement.dataset.theme || 'light';
    new MutationObserver(() => {
      state.theme = document.documentElement.dataset.theme || 'light';
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* Streak */
    const syncStreak = () => {
      const s = parseFloat(document.documentElement.dataset.flashStreak || '0');
      state.streak = Math.max(0, Math.min(1, isFinite(s) ? s : 0));
    };
    syncStreak();
    window.addEventListener('flash:streak', syncStreak);

    start();
    return true;
  }

  function start() {
    if (state.running) return;
    state.running = true;
    state.lastT = 0;
    state.__lastFrame = 0;
    state.raf = requestAnimationFrame(render);
  }

  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
  }

  function setMode(mode) {
    if (mode !== 'lattice' && mode !== 'fib' && mode !== 'slices') return;
    state.mode = mode;
    /* Reset yaw a bit for a nice transition feel */
    state.yaw = 0;
    if (state.reducedMotion) {
      /* Render single frame */
      render(performance.now());
    }
    window.dispatchEvent(new CustomEvent('flash:brain-mode', { detail: { mode } }));
  }

  function setStreak(v) {
    state.streak = Math.max(0, Math.min(1, v || 0));
  }

  function setTheme(t) {
    state.theme = t === 'dark' ? 'dark' : 'light';
  }

  /* ═══════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════ */
  window.FLASH_BRAIN_ALT = {
    init, start, stop, setMode, setStreak, setTheme,
    getMode: () => state.mode,
    version: '1.0.0'
  };
})();