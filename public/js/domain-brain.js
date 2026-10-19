/* =========================================================
   MODULE - Domain Brain
   A mini brain canvas for the domain.html hero.
   Reuses the same anatomical mesh logic as index.html,
   scaled down and tinted with the domain color.
   ========================================================= */
(function(){
'use strict';
const TAU = Math.PI * 2;
const SVG = null;

function mulberry32(seed){
  let a = seed;
  return function(){
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function surfacePoint(u, v){
  const θ = u * TAU;
  const φ = v * Math.PI;
  const sinφ = Math.sin(φ);
  const cosφ = Math.cos(φ);

  let x = sinφ * Math.cos(θ) * 1.30;
  let y = cosφ * 0.88;
  let z = sinφ * Math.sin(θ) * 1.05;

  const wrinkle =
      0.055 * Math.sin(6  * θ + 1.2 * v)
    + 0.035 * Math.sin(11 * θ - 2.0 * v)
    + 0.020 * Math.sin(18 * θ + 3.0 * v)
    + 0.012 * Math.sin(27 * θ - 4.0 * v);

  const r = 1 + wrinkle;
  x *= r; y *= r; z *= r;

  const cleftZone = Math.max(0, 1 - v * 2.5);
  const cleftAmount = Math.exp(-(z * z) * 120) * cleftZone;
  y -= cleftAmount * 0.10;
  z *= 1 - cleftAmount * 0.45;

  if (x < -0.30){
    const front = (-x - 0.30) * 1.15;
    y += front * 0.09 * (1 - v * 0.55);
    z *= 1 + front * 0.05;
  }
  if (x > 0.60){
    const back = (x - 0.60) * 1.5;
    x -= back * 0.10;
  }
  if (v > 0.55 && x > 0){
    const cb = (v - 0.55) * 3.2;
    const s = cb * Math.max(0, x);
    z *= 1 + s * 0.35;
    y += s * 0.12;
  }
  if (v > 0.85){
    const t = (v - 0.85) / 0.15;
    const mask = Math.exp(-(x * x + z * z) * 8);
    y += t * 0.35 * mask;
  }

  return { x, y, z };
}

function buildMesh(){
  const GRID_U = 28;
  const GRID_V = 22;
  const verts = [];
  const edges = [];

  for (let v = 0; v <= GRID_V; v++){
    for (let u = 0; u < GRID_U; u++){
      const p = surfacePoint(u / GRID_U, v / GRID_V);
      verts.push(p);
    }
  }
  for (let v = 0; v <= GRID_V; v++){
    for (let u = 0; u < GRID_U; u++){
      const i = v * GRID_U + u;
      const j = v * GRID_U + ((u + 1) % GRID_U);
      edges.push([i, j]);
    }
  }
  for (let v = 0; v < GRID_V; v++){
    for (let u = 0; u < GRID_U; u += 2){
      const i = v * GRID_U + u;
      const j = (v + 1) * GRID_U + u;
      edges.push([i, j]);
    }
  }
  return { verts, edges };
}

let canvas, ctx, W, H, DPR, model;
let rotY = -0.55, rotX = 0.18;
let raf = null, running = false;
let lastFrame = 0;
let hue = { r: 190, g: 24, b: 93 };
const FRAME = 1000 / 30;
const ROT = 0.06;

function readHue(){
  // Try to read --dc from hero
  const dc = getComputedStyle(document.documentElement).getPropertyValue('--dc').trim();
  if (dc.startsWith('#')){
    const hex = dc.replace('#','');
    if (hex.length === 6){
      hue = {
        r: parseInt(hex.slice(0,2),16),
        g: parseInt(hex.slice(2,4),16),
        b: parseInt(hex.slice(4,6),16)
      };
    }
  }
}

function project(p){
  const cX = Math.cos(rotX), sX = Math.sin(rotX);
  const cY = Math.cos(rotY), sY = Math.sin(rotY);

  let x1 = p.x * cY - p.z * sY;
  let z1 = p.x * sY + p.z * cY;
  let y1 = p.y;

  let y2 = y1 * cX - z1 * sX;
  let z2 = y1 * sX + z1 * cX;

  const f = 2.6;
  const depth = z2 + 3.2;
  const k = f / depth;

  return {
    x: W / 2 + x1 * k * 130,
    y: H / 2 + y2 * k * 130,
    z: depth,
    k,
    visible: depth > 0.1
  };
}

function draw(t){
  if (!canvas) return;
  if (t - lastFrame < FRAME){ raf = requestAnimationFrame(draw); return; }
  const dt = (t - lastFrame) / 1000;
  lastFrame = t;

  if (!prefersReduced()) rotY += ROT * dt;

  ctx.clearRect(0, 0, W, H);

  const pv = model.verts.map(p => project(p));
  const edges = model.edges.map(([i, j]) => {
    const a = pv[i], b = pv[j];
    return { i, j, a, b, z: (a.z + b.z) / 2 };
  }).sort((p, q) => q.z - p.z);

  ctx.lineCap = 'round';
  ctx.lineWidth = 0.8;
  const { r, g, b } = hue;

  edges.forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    const dN = (e.z - 2.2) / 2.0;
    const alpha = Math.max(0.05, Math.min(0.75, 0.75 - dN * 0.70));
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(e.a.x, e.a.y);
    ctx.lineTo(e.b.x, e.b.y);
    ctx.stroke();
  });

  const pulse = 0.6 + 0.4 * Math.sin(t / 900);
  edges.slice(-50).forEach(e => {
    const n = e.a;
    if (!n.visible) return;
    const dN = (n.z - 2.2) / 2.0;
    const a = Math.max(0.10, 1 - dN) * 0.7 * pulse;
    const rad = 1.0 + 0.8 * (1 - dN);
    ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, rad, 0, TAU);
    ctx.fill();
  });

  raf = requestAnimationFrame(draw);
}

function resize(){
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = rect.width;
  H = rect.height;
  canvas.width = W * DPR;
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

function mount(){
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Remove old canvas if any
  const old = document.getElementById('domain-brain');
  if (old){ old.remove(); stop(); }

  // Insert canvas behind the hero info
  canvas = document.createElement('canvas');
  canvas.id = 'domain-brain';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:.55;pointer-events:none;';
  hero.insertBefore(canvas, hero.firstChild);

  ctx = canvas.getContext('2d');
  if (!model) model = buildMesh();

  readHue();
  resize();
  if (prefersReduced()){
    rotY = -0.55;
    // one static frame
    if (raf) cancelAnimationFrame(raf);
    draw(999999);
    stop();
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReduced()) start();
  });

  window.addEventListener('resize', resize);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 200));
} else {
  setTimeout(mount, 200);
}

window.FLASH_DOMAIN_BRAIN = { mount, start, stop };
})();