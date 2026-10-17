// Small SVG line charts drawn from the original measurements, with a
// progressive "pen" reveal and a hover read-out.
import { MEASURES } from './measures.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
};
const fmt = (v, d = 2) => v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const PALETTE = {
  ion: '#6fd6ff', ion2: '#8f86ff', cl: '#74f2c4', na: '#ffb45e', thrust: '#ff6b3d', dim: '#5d6b88',
};

export const CHARTS = {
  conductivity: () => ({
    x: { label: 'concentration en sel (g/L)', min: 200, max: 410, ticks: [200, 250, 300, 350, 400], unit: 'g/L', d: 0 },
    y: { label: 'conductivité (S/m)', min: 20.6, max: 24.2, ticks: [21, 22, 23, 24], unit: 'S/m', d: 2 },
    series: [{ name: 'Mesures du 20 mars 2015', color: PALETTE.cl, data: MEASURES.conductivity.filter(([x]) => x >= 200), dots: true }],
    notes: [{ x: 228, y: 21.15, text: 'pente ≈ 0,039 S/m par g/L' }, { x: 368, y: 23.95, text: 'saturation' }],
  }),
  extraction: () => ({
    x: { label: 'temps (s)', min: 0, max: 2600, ticks: [0, 500, 1000, 1500, 2000, 2500], unit: 's', d: 0 },
    y: { label: 'conductivité (S/m)', min: 15.5, max: 17.7, ticks: [15.5, 16, 16.5, 17, 17.5], unit: 'S/m', d: 2 },
    series: [{ name: '+5 000 V sur le ménisque, 17 juin 2015', color: PALETTE.ion, data: MEASURES.extraction }],
    notes: [{ x: 1250, y: 15.65, text: 'baisse : des ions Cl⁻ extraits ?' }, { x: 2050, y: 17.55, text: 'remontée inexpliquée' }],
  }),
  friction: () => ({
    x: { label: 'temps (s)', min: 0, max: 190, ticks: [0, 30, 60, 90, 120, 150, 180], unit: 's', d: 1 },
    y: { label: 'fréquence de rotation (tr/s)', min: 0, max: 0.8, ticks: [0, 0.2, 0.4, 0.6, 0.8], unit: 'tr/s', d: 3 },
    series: [
      ...MEASURES.friction.crookes.slice(0, 2).map((d, i) => ({ name: `Crookes ${i + 1}`, color: ['#6fd6ff', '#8f86ff'][i], data: d, dots: true })),
      ...MEASURES.friction.supermag.map((d, i) => ({ name: `Supermag ${i + 1}`, color: ['#ffb45e', '#ff8a4a'][i], data: d, dots: true })),
    ],
  }),
  thrust: () => ({
    x: { label: 'temps (s)', min: 0, max: 200, ticks: [0, 40, 80, 120, 160, 200], unit: 's', d: 1 },
    y: { label: 'fréquence de rotation (tr/s)', min: 0, max: 0.27, ticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25], unit: 'tr/s', d: 3 },
    series: [
      { name: 'Propulseurs allumés (essai 7)', color: PALETTE.thrust, data: MEASURES.thrust.with[1], dots: true },
      { name: 'Propulseurs allumés (essai 3)', color: '#ffb45e', data: MEASURES.thrust.with[0], dots: true },
      { name: 'Propulseurs éteints (essai 5)', color: PALETTE.ion, data: MEASURES.thrust.without[0], dots: true, dash: '5 4' },
      { name: 'Propulseurs éteints (essai 6)', color: '#8f86ff', data: MEASURES.thrust.without[1], dots: true, dash: '5 4' },
    ],
  }),
};

export function createChart(container, key) {
  const cfg = CHARTS[key]();
  const box = container.getBoundingClientRect();
  const W = 640, H = Math.round(W * (box.height && box.width ? box.height / box.width : 9 / 16));
  const m = { l: 52, r: 18, t: 18, b: 44 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const sx = (x) => m.l + ((x - cfg.x.min) / (cfg.x.max - cfg.x.min)) * iw;
  const sy = (y) => m.t + (1 - (y - cfg.y.min) / (cfg.y.max - cfg.y.min)) * ih;

  container.innerHTML = '';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.series.map((s) => s.name).join(', ') }, container);
  const grid = el('g', { class: 'grid' }, svg);
  const axis = el('g', { class: 'axis' }, svg);
  cfg.y.ticks.forEach((v) => {
    el('line', { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v) }, grid);
    el('text', { x: m.l - 8, y: sy(v) + 3, 'text-anchor': 'end' }, axis).textContent = fmt(v, v % 1 ? (String(v).split('.')[1].length) : 0);
  });
  cfg.x.ticks.forEach((v) => {
    el('line', { x1: sx(v), x2: sx(v), y1: m.t, y2: H - m.b }, grid);
    el('text', { x: sx(v), y: H - m.b + 16, 'text-anchor': 'middle' }, axis).textContent = v.toLocaleString('fr-FR');
  });
  el('text', { class: 'axis-label', x: m.l + iw, y: H - 6, 'text-anchor': 'end' }, svg).textContent = cfg.x.label;
  el('text', { class: 'axis-label', x: 12, y: m.t + ih / 2, transform: `rotate(-90 12 ${m.t + ih / 2})`, 'text-anchor': 'middle' }, svg).textContent = cfg.y.label;

  const clipId = `clip-${key}-${Math.random().toString(36).slice(2, 7)}`;
  const clip = el('clipPath', { id: clipId }, el('defs', {}, svg));
  const clipRect = el('rect', { x: m.l - 6, y: 0, width: 0, height: H }, clip);
  const plot = el('g', { 'clip-path': `url(#${clipId})` }, svg);

  cfg.series.forEach((s) => {
    const d = s.data.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
    const glow = el('path', { d, class: 'series', stroke: s.color, 'stroke-width': 6, opacity: 0.12 }, plot);
    el('path', { d, class: 'series', stroke: s.color, ...(s.dash ? { 'stroke-dasharray': s.dash } : {}) }, plot);
    if (s.dots) {
      const g = el('g', { class: 'dots' }, plot);
      s.data.forEach(([x, y]) => el('circle', { cx: sx(x), cy: sy(y), r: 2.6, fill: s.color }, g));
    }
    glow.style.filter = 'blur(2px)';
  });
  (cfg.notes || []).forEach((n) => {
    el('text', { x: sx(n.x), y: sy(n.y), fill: '#b4bfd3', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace', 'text-anchor': 'middle' }, plot).textContent = n.text;
  });

  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = cfg.series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
  container.appendChild(legend);

  // Hover read-out.
  const tip = document.createElement('div');
  tip.className = 'tip';
  container.appendChild(tip);
  const cursor = el('line', { class: 'cursor', y1: m.t, y2: H - m.b, x1: -10, x2: -10 }, svg);
  const marker = el('circle', { r: 5, fill: 'none', stroke: '#fff', 'stroke-width': 1.5, cx: -10, cy: -10, opacity: 0 }, svg);
  let reveal = 0;
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    let best = null;
    cfg.series.forEach((s) => s.data.forEach(([x, y]) => {
      const dx = sx(x) - px, dy = sy(y) - py, d = dx * dx + dy * dy * 0.6;
      if (sx(x) <= m.l + iw * reveal + 1 && (!best || d < best.d)) best = { d, x, y, s };
    }));
    if (!best || best.d > 2500) { tip.style.opacity = 0; marker.setAttribute('opacity', 0); cursor.setAttribute('x1', -10); cursor.setAttribute('x2', -10); return; }
    marker.setAttribute('opacity', 1);
    cursor.setAttribute('x1', sx(best.x)); cursor.setAttribute('x2', sx(best.x));
    marker.setAttribute('cx', sx(best.x)); marker.setAttribute('cy', sy(best.y));
    marker.setAttribute('stroke', best.s.color);
    tip.innerHTML = `${best.s.name}<br><b>${fmt(best.y, cfg.y.d)} ${cfg.y.unit}</b> · ${fmt(best.x, cfg.x.d)} ${cfg.x.unit}`;
    tip.style.left = `${(sx(best.x) / W) * 100}%`;
    tip.style.top = `${(sy(best.y) / H) * 100}%`;
    tip.style.opacity = 1;
  });
  svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; marker.setAttribute('opacity', 0); });

  const api = {
    setReveal(f) {
      reveal = Math.max(0, Math.min(1, f));
      clipRect.setAttribute('width', (iw + 12) * reveal + 6);
    },
    play(duration = 2.2) {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / (duration * 1000));
        api.setReveal(1 - Math.pow(1 - k, 3));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  };
  api.setReveal(0);
  return api;
}
