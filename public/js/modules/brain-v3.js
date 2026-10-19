/* ============================================================
   FLASH — Brain v3 (Neural Network)
   120 nodes · ~360 edges · traveling packets · 3D projection
   ============================================================ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════════════════ */
  const CFG = {
    NODES_PER_DOMAIN: 12,      // 10 domains × 12 = 120 nodes
    INTRA_EDGES: 3,            // edges per node within cluster
    INTER_PROB: 0.35,          // probability of cross-cluster edge
    RADIUS: 0.78,              // sphere radius (normalized 0..1)
    CLUSTER_SPREAD: 0.28,      // cluster center dispersion
    NODE_SIZE_MIN: 1.4,
    NODE_SIZE_MAX: 3.2,
    EDGE_ALPHA_MIN: 0.05,
    EDGE_ALPHA_MAX: 0.32,
    PACKET_COUNT: 18,
    PACKET_SPEED_MIN: 0.25,
    PACKET_SPEED_MAX: 0.55,
    YAW_SPEED_BASE: 0.05,      // rad/s → ~125s per revolution
    PITCH_AMPLITUDE: 0.08,     // rad
    PITCH_PERIOD: 32,          // seconds
    FPS_CAP: 30,
    DPR_CAP: 2,
    FOV: 2.4,                  // perspective factor
    DEPTH_FADE: 0.85,          // how much depth darkens edges
    PULSE_PERIOD: 2.8          // seconds — node pulse
  };

  /* Domain colors (matched to tokens/data) */
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

  /* ═══════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════ */
  const state = {
    canvas: null,
    ctx: null,
    dpr: 1,
    w: 0, h: 0,
    nodes: [],
    edges: [],
    packets: [],
    yaw: 0,
    pitch: 0,
    lastT: 0,
    raf: null,
    streak: 0,        // 0..1
    xp: 0,            // 0..1
    theme: 'light',
    reducedMotion: false,
    running: false
  };

  /* ═══════════════════════════════════════════════════════════
     GEOMETRY BUILDERS
     ═══════════════════════════════════════════════════════════ */

  /* Fibonacci sphere for even distribution */
  function fibonacciSphere(i, n, radius) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  /* Build cluster centers — 10 domains spread on smaller sphere */
  function buildClusters() {
    return DOMAINS.map((d, i) => {
      const p = fibonacciSphere(i, DOMAINS.length, CFG.CLUSTER_SPREAD);
      return {
        id: d.id,
        color: d.color,
        cx: p.x,
        cy: p.y,
        cz: p.z
      };
    });
  }

  /* Build nodes — each cluster gets N points around its center */
  function buildNodes() {
    const clusters = buildClusters();
    const nodes = [];
    let idx = 0;

    clusters.forEach((cl) => {
      for (let k = 0; k < CFG.NODES_PER_DOMAIN; k++) {
        const p = fibonacciSphere(k, CFG.NODES_PER_DOMAIN, 0.18);
        /* small random jitter */
        const j = () => (Math.random() - 0.5) * 0.04;

        nodes.push({
          id: idx++,
          domain: cl.id,
          color: cl.color,
          x: cl.cx + p.x + j(),
          y: cl.cy + p.y + j(),
          z: cl.cz + p.z + j(),
          baseSize: CFG.NODE_SIZE_MIN +
                    Math.random() * (CFG.NODE_SIZE_MAX - CFG.NODE_SIZE_MIN),
          phase: Math.random() * Math.PI * 2,
          activeUntil: 0
        });
      }
    });

    return nodes;
  }

  /* Build edges — intra-cluster + random inter-cluster */
  function buildEdges(nodes) {
    const edges = [];
    const seen = new Set();
    const byDomain = {};

    nodes.forEach((n) => {
      if (!byDomain[n.domain]) byDomain[n.domain] = [];
      byDomain[n.domain].push(n);
    });

    /* Intra-cluster edges */
    Object.keys(byDomain).forEach((dom) => {
      const group = byDomain[dom];
      group.forEach((a, i) => {
        for (let k = 1; k <= CFG.INTRA_EDGES; k++) {
          const b = group[(i + k) % group.length];
          if (!b || b.id === a.id) continue;
          const key = a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id;
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push({ a: a.id, b: b.id, kind: 'intra' });
        }
      });
    });

    /* Inter-cluster edges */
    const domainKeys = Object.keys(byDomain);
    nodes.forEach((a) => {
      if (Math.random() > CFG.INTER_PROB) return;
      const other = domainKeys.filter((d) => d !== a.domain);
      if (!other.length) return;
      const pick = other[(Math.random() * other.length) | 0];
      const group = byDomain[pick];
      const b = group[(Math.random() * group.length) | 0];
      if (!b || b.id === a.id) return;
      const key = a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: a.id, b: b.id, kind: 'inter' });
    });

    return edges;
  }

  /* ═══════════════════════════════════════════════════════════
     PROJECTION
     ═══════════════════════════════════════════════════════════ */
  function rotateY(p, yaw) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
  }

  function rotateX(p, pitch) {
    const c = Math.cos(pitch), s = Math.sin(pitch);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  function project(p, w, h) {
    const f = CFG.FOV;
    const persp = 1 / (1 + p.z * 0.55);
    const scale = Math.min(w, h) * 0.48;
    return {
      x: w / 2 + p.x * scale * persp,
      y: h / 2 + p.y * scale * persp,
      z: p.z,
      persp
    };
  }

  /* ═══════════════════════════════════════════════════════════
     PACKETS — travel along random edges
     ═══════════════════════════════════════════════════════════ */
  function spawnPacket() {
    if (!state.edges.length) return null;
    const e = state.edges[(Math.random() * state.edges.length) | 0];
    const a = state.nodes[e.a];
    const b = state.nodes[e.b];
    if (!a || !b) return null;

    return {
      aId: e.a,
      bId: e.b,
      t: 0,
      speed: CFG.PACKET_SPEED_MIN +
             Math.random() * (CFG.PACKET_SPEED_MAX - CFG.PACKET_SPEED_MIN),
      color: Math.random() < 0.5 ? a.color : b.color,
      fade: 0
    };
  }

  function initPackets() {
    state.packets = [];
    for (let i = 0; i < CFG.PACKET_COUNT; i++) {
      const p = spawnPacket();
      if (p) {
        p.t = Math.random(); // start at random progress
        state.packets.push(p);
      }
    }
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
     RENDER
     ═══════════════════════════════════════════════════════════ */
  function render(t) {
    if (!state.running) return;

    const ctx = state.ctx;
    if (!ctx) return;

    const dt = state.lastT ? Math.min((t - state.lastT) / 1000, 0.1) : 0;
    state.lastT = t;

    /* FPS cap */
    const minFrame = 1000 / CFG.FPS_CAP;
    if (state.__lastFrame && (t - state.__lastFrame) < minFrame) {
      state.raf = requestAnimationFrame(render);
      return;
    }
    state.__lastFrame = t;

    /* Update rotation */
    if (!state.reducedMotion) {
      const yawSpeed = CFG.YAW_SPEED_BASE * (0.6 + state.streak * 0.8);
      state.yaw += yawSpeed * dt;
      state.pitch = Math.sin(t / 1000 * (2 * Math.PI / CFG.PITCH_PERIOD))
                    * CFG.PITCH_AMPLITUDE;
    }

    /* Clear */
    ctx.clearRect(0, 0, state.w, state.h);

    const isDark = state.theme === 'dark';
    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

    /* ═══ Project all nodes ═══ */
    const proj = new Array(state.nodes.length);
    for (let i = 0; i < state.nodes.length; i++) {
      const n = state.nodes[i];
      let p = { x: n.x, y: n.y, z: n.z };
      p = rotateY(p, state.yaw);
      p = rotateX(p, state.pitch);
      proj[i] = project(p, state.w, state.h);
    }

    /* ═══ Draw edges (sorted back-to-front by avg z) ═══ */
    const edgesSorted = state.edges
      .map((e) => ({ e, z: (proj[e.a].z + proj[e.b].z) * 0.5 }))
      .sort((A, B) => A.z - B.z);

    const streakAlpha = 0.35 + state.streak * 0.65;

    for (let i = 0; i < edgesSorted.length; i++) {
      const { e } = edgesSorted[i];
      const A = proj[e.a];
      const B = proj[e.b];

      /* Depth-based alpha */
      const depth = (A.z + B.z) * 0.5; // -1..1
      const depthAlpha = 1 - Math.max(0, depth) * CFG.DEPTH_FADE;

      const isInter = e.kind === 'inter';
      let alpha = isInter
        ? CFG.EDGE_ALPHA_MIN * 0.9
        : CFG.EDGE_ALPHA_MAX * 0.7;
      alpha *= depthAlpha * streakAlpha;

      /* Color: use first node's domain color */
      const color = state.nodes[e.a].color;
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
      ctx.lineWidth = isInter ? 0.6 : 0.9;

      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    /* ═══ Update + draw packets ═══ */
    for (let i = 0; i < state.packets.length; i++) {
      const pk = state.packets[i];
      pk.t += pk.speed * dt * 0.6;

      if (pk.t >= 1) {
        /* Respawn */
        const np = spawnPacket();
        if (np) state.packets[i] = np;
        continue;
      }

      const A = proj[pk.aId];
      const B = proj[pk.bId];
      if (!A || !B) continue;

      const x = A.x + (B.x - A.x) * pk.t;
      const y = A.y + (B.y - A.y) * pk.t;

      /* Fade in/out at endpoints */
      const fade = Math.sin(pk.t * Math.PI);
      const r = 1.6 + fade * 1.2;
      const alpha = fade * 0.85 * streakAlpha;

      const c = pk.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
      ctx.fill();

      /* Soft halo */
      if (isDark) {
        ctx.beginPath();
        ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.12).toFixed(3)})`;
        ctx.fill();
      }
    }

    /* ═══ Draw nodes (front-most last) ═══ */
    const nodeOrder = state.nodes
      .map((n, i) => ({ n, i, z: proj[i].z }))
      .sort((A, B) => A.z - B.z);

    const pulseT = t / 1000;
    for (let k = 0; k < nodeOrder.length; k++) {
      const { n, i } = nodeOrder[k];
      const p = proj[i];

      const pulse = 0.5 + 0.5 * Math.sin(pulseT * (2 * Math.PI / CFG.PULSE_PERIOD) + n.phase);
      const depthBoost = 1 - Math.max(0, p.z) * 0.5;

      const r = n.baseSize * (0.9 + pulse * 0.3) * depthBoost * p.persp;
      const alpha = (0.35 + pulse * 0.5) * streakAlpha * depthBoost;

      const c = n.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
      ctx.fill();

      /* Glow on front-most + dark theme */
      if (isDark && p.z < 0.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.18).toFixed(3)})`;
        ctx.fill();
      }
    }

    /* ═══ Reset composite op ═══ */
    ctx.globalCompositeOperation = 'source-over';

    /* ═══ Reduced motion — single frame ═══ */
    if (state.reducedMotion) {
      state.running = false;
      return;
    }

    state.raf = requestAnimationFrame(render);
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  function init(canvasEl, opts) {
    if (!canvasEl) return false;
    opts = opts || {};

    state.canvas = canvasEl;
    state.ctx = canvasEl.getContext('2d', { alpha: true });
    if (!state.ctx) return false;

    /* Reduced motion */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.reducedMotion = mq.matches;
    mq.addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
      if (state.reducedMotion) {
        state.running = false;
        if (state.raf) cancelAnimationFrame(state.raf);
        /* Render one static frame */
        state.running = true;
        render(performance.now());
      } else if (!state.running) {
        start();
      }
    });

    /* Build geometry */
    state.nodes = buildNodes();
    state.edges = buildEdges(state.nodes);
    initPackets();

    /* Theme */
    state.theme = document.documentElement.dataset.theme || 'light';
    const themeObs = new MutationObserver(() => {
      state.theme = document.documentElement.dataset.theme || 'light';
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    /* Resize */
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* Streak-driven state — read from a data attribute */
    const syncStreak = () => {
      const s = parseFloat(document.documentElement.dataset.flashStreak || '0');
      state.streak = Math.max(0, Math.min(1, isFinite(s) ? s : 0));
    };
    syncStreak();
    window.addEventListener('flash:streak', syncStreak);

    /* Start */
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

  function setStreak(v) {
    state.streak = Math.max(0, Math.min(1, v || 0));
  }

  function setTheme(t) {
    state.theme = t === 'dark' ? 'dark' : 'light';
  }

  /* ═══════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════ */
  window.FLASH_BRAIN_V3 = {
    init, start, stop, setStreak, setTheme,
    version: '3.0.0',
    stats: () => ({
      nodes: state.nodes.length,
      edges: state.edges.length,
      packets: state.packets.length
    })
  };

})();