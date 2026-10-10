/* ═══════════════════════════════════════════════════════════
   MODULE — 3D Anatomical Brain
   A cortical mesh that reads as a human brain:
     • Two hemispheres split by the longitudinal fissure
     • Frontal lobe bulge (front)
     • Occipital flattening (back)
     • Cerebellum (back-bottom)
     • Brainstem (bottom)
     • Gyri wrinkles (multi-octave)
   Runs on canvas 2D with perspective projection.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const F = window.FLASH;
const TAU = Math.PI * 2;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Surface point of the brain, given (u,v) ─── */
/* u: 0..1 around the vertical axis (0 = right side)  */
/* v: 0..1 from top (0) to bottom (1)                  */
function surfacePoint(u, v){
  const θ = u * TAU;
  const φ = v * Math.PI;                   // 0 → π

  const sinφ = Math.sin(φ);
  const cosφ = Math.cos(φ);

  /* Base ellipsoid: front-back X, top-bottom Y, left-right Z */
  let x = sinφ * Math.cos(θ) * 1.30;
  let y = cosφ * 0.88;
  let z = sinφ * Math.sin(θ) * 1.05;

  /* Multi-octave gyri wrinkles */
  const wrinkle =
      0.055 * Math.sin(6  * θ + 1.2 * v)
    + 0.035 * Math.sin(11 * θ - 2.0 * v)
    + 0.020 * Math.sin(18 * θ + 3.0 * v)
    + 0.012 * Math.sin(27 * θ - 4.0 * v);

  const r = 1 + wrinkle;
  x *= r; y *= r; z *= r;

  /* Longitudinal fissure (top 40% only) */
  const cleftZone   = Math.max(0, 1 - v * 2.5);
  const cleftAmount = Math.exp(-(z * z) * 120) * cleftZone;
  y -= cleftAmount * 0.10;
  z *= 1 - cleftAmount * 0.45;

  /* Frontal lobe — bulges forward (negative X) */
  if (x < -0.30){
    const front = (-x - 0.30) * 1.15;
    y += front * 0.09 * (1 - v * 0.55);
    z *= 1 + front * 0.05;
  }

  /* Occipital lobe — slightly flattens the back */
  if (x > 0.60){
    const back = (x - 0.60) * 1.5;
    x -= back * 0.10;
  }

  /* Cerebellum — bulge at back-bottom */
  if (v > 0.55 && x > 0){
    const cb = (v - 0.55) * 3.2;
    const s  = cb * Math.max(0, x);
    z *= 1 + s * 0.35;
    y += s * 0.12;
  }

  /* Brainstem — extension at the very bottom */
  if (v > 0.85){
    const t = (v - 0.85) / 0.15;
    const stemMask = Math.exp(-(x * x + z * z) * 8);
    y += t * 0.35 * stemMask;
  }

  return { x, y, z };
}

/* ─── Build the mesh (once) ─── */
function buildMesh(){
  const GRID_U = 40;   // points around
  const GRID_V = 30;   // points top→bottom
  const verts = [];
  const edges = [];

  for (let v = 0; v <= GRID_V; v++){
    for (let u = 0; u < GRID_U; u++){
      const p = surfacePoint(u / GRID_U, v / GRID_V);
      verts.push(p);
    }
  }

  /* Horizontal edges (each ring) */
  for (let v = 0; v <= GRID_V; v++){
    for (let u = 0; u < GRID_U; u++){
      const i = v * GRID_U + u;
      const j = v * GRID_U + ((u + 1) % GRID_U);
      edges.push([i, j]);
    }
  }
  /* Vertical edges — every 2nd U to keep it sparse */
  for (let v = 0; v < GRID_V; v++){
    for (let u = 0; u < GRID_U; u += 2){
      const i = v * GRID_U + u;
      const j = (v + 1) * GRID_U + u;
      edges.push([i, j]);
    }
  }

  return { verts, edges, GRID_U, GRID_V };
}

/* ─── Runtime state ─── */
let canvas, ctx, W, H, DPR, model;
let rotY = 0, rotX = 0.15;
let raf = null, running = false;
let lastFrame = 0;
const FRAME = 1000 / 32;        // 32 FPS — smooth but light
const ROT_SPEED = 0.075;        // rad/s ≈ 84 s per revolution

/* ─── Colors (theme aware) ─── */
function palette(){
  const dark = document.documentElement.dataset.theme === 'dark';
  const base = dark
    ? { r: 57, g: 255, b: 20,  alphaBoost: 1.0 }
    : { r: 190, g: 24,  b: 93,  alphaBoost: 0.85 };

  const S = window.FLASH_MODULES && window.FLASH_MODULES.brainState;
  if (S){
    const st = S.get();
    // Brightness scales alphaBoost; saturation desaturates toward gray
    base.alphaBoost *= st.brightness;
    if (st.saturation < 1){
      const grey = (base.r + base.g + base.b) / 3;
      base.r = Math.round(base.r * st.saturation + grey * (1 - st.saturation));
      base.g = Math.round(base.g * st.saturation + grey * (1 - st.saturation));
      base.b = Math.round(base.b * st.saturation + grey * (1 - st.saturation));
    }
  }
  return base;
}

/* ─── Project a 3D point → screen ─── */
function project(p){
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  /* Rotate Y */
  let x1 = p.x * cosY - p.z * sinY;
  let z1 = p.x * sinY + p.z * cosY;
  let y1 = p.y;

  /* Rotate X (small tilt) */
  let y2 = y1 * cosX - z1 * sinX;
  let z2 = y1 * sinX + z1 * cosX;

  /* Perspective */
  const f = 2.6;
  const depth = z2 + 3.2;
  const k = f / depth;

  return {
    x: W / 2 + x1 * k * 130,
    y: H / 2 + y2 * k * 130,
    z: depth,
    k: k,
    visible: depth > 0.1
  };
}

/* ─── Render one frame ─── */
function draw(t){
  if (!canvas) return;

  if (t - lastFrame < FRAME){
    raf = requestAnimationFrame(draw);
    return;
  }
  const dt = (t - lastFrame) / 1000;
  lastFrame = t;

  if (!prefersReduced()){
    let s = ROT_SPEED;
    const S = window.FLASH_MODULES && window.FLASH_MODULES.brainState;
    if (S) s *= S.get().rotSpeed;
    rotY += s * dt;
  }

  ctx.clearRect(0, 0, W, H);
  const C = palette();

  /* Project all vertices */
  const pv = model.verts.map(p => project(p));

  /* Sort edges by average depth (farther first) */
  const edges = model.edges.map(([i, j]) => {
    const a = pv[i], b = pv[j];
    return { i, j, a, b, z: (a.z + b.z) / 2 };
  }).sort((p, q) => q.z - p.z);

  /* Draw edges */
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.9;
  edges.forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    /* Map depth 2.2..4.2 → alpha 0.75..0.06 */
    const dNorm = (e.z - 2.2) / 2.0;
    const alpha = Math.max(0.05, Math.min(0.75, 0.75 - dNorm * 0.70)) * C.alphaBoost;
    ctx.strokeStyle = `rgba(${C.r},${C.g},${C.b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(e.a.x, e.a.y);
    ctx.lineTo(e.b.x, e.b.y);
    ctx.stroke();
  });

  /* Draw a few bright surface dots (front-most only) */
  const pulse = 0.6 + 0.4 * Math.sin(t / 900);
  edges.slice(-60).forEach(e => {
    const n = e.a;
    if (!n.visible) return;
    const dNorm = (n.z - 2.2) / 2.0;
    const a = Math.max(0.10, 1 - dNorm) * 0.75 * C.alphaBoost * pulse;
    const rad = 1.0 + 0.9 * (1 - dNorm);
    ctx.fillStyle = `rgba(${C.r},${C.g},${C.b},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, rad, 0, TAU);
    ctx.fill();
  });

  /* ─── XP wave ─── */
  const S = window.FLASH_MODULES && window.FLASH_MODULES.brainState;
  if (S){
    const wt = S.tickWave(dt);
    if (wt >= 0){
      const bandWidth = 0.35;
      const centerZ = -1.2 + wt * 2.6;
      ctx.save();
      edges.forEach(e => {
        const zAvg = (e.a.z - 3.2 + e.b.z - 3.2) / 2;
        const dist = Math.abs(zAvg - centerZ);
        if (dist > bandWidth) return;
        const strength = (1 - dist / bandWidth) * (1 - wt);
        const a = strength * 0.9;
        ctx.strokeStyle = `rgba(${C.r},${C.g},${C.b},${a.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  raf = requestAnimationFrame(draw);
}

/* ─── Size management ─── */
function resize(){
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width;
  H = r.height;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function start(){
  if (running) return;
  running = true;
  lastFrame = 0;
  raf = requestAnimationFrame(draw);
}
function stop(){
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}

/* ─── Reduced motion: one static frame ─── */
function drawStatic(){
  if (!canvas) return;
  ctx.clearRect(0, 0, W, H);
  const C = palette();
  const pv = model.verts.map(p => project(p));
  const edges = model.edges.map(([i, j]) => {
    const a = pv[i], b = pv[j];
    return { i, j, a, b, z: (a.z + b.z) / 2 };
  }).sort((p, q) => q.z - p.z);

  ctx.lineWidth = 0.9;
  edges.forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    const dNorm = (e.z - 2.2) / 2.0;
    const alpha = Math.max(0.05, Math.min(0.70, 0.70 - dNorm * 0.65)) * C.alphaBoost;
    ctx.strokeStyle = `rgba(${C.r},${C.g},${C.b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(e.a.x, e.a.y);
    ctx.lineTo(e.b.x, e.b.y);
    ctx.stroke();
  });
}

/* ─── Mount ─── */
function mount(){
  const wrap = document.querySelector('.brain-wrap');
  if (!wrap) return;

  if (wrap.querySelector('#brain')){
    resize();
    if (prefersReduced()){ drawStatic(); } else { start(); }
    return;
  }

  canvas = document.createElement('canvas');
  canvas.id = 'brain';
  wrap.appendChild(canvas);
  ctx = canvas.getContext('2d');

  if (!model) model = buildMesh();
  resize();

  if (prefersReduced()){
    /* Set a nice viewing angle, then one static frame */
    rotY = -0.55;
    rotX = 0.18;
    drawStatic();
  } else {
    rotY = -0.55;
    rotX = 0.18;
    start();
  }

  /* Pause when tab hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReduced()) start();
  });

  window.addEventListener('resize', () => {
    resize();
    if (prefersReduced()) drawStatic();
  });

  window.addEventListener('flash:render', () => {
    resize();
    if (prefersReduced()) drawStatic();
  });
}

F.onReady(() => {
  setTimeout(mount, 200);
  window.addEventListener('flash:render', () => setTimeout(mount, 100));
});

window.FLASH_MODULES = window.FLASH_MODULES || {};
window.FLASH_MODULES.brain = { mount, start, stop, resize };
})();