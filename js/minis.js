// Small animated illustrations for the experiment journal: the bell jar
// (battery, boiling water, ionic gel), the voltage cascade and the 7 kV booster.

import { nf, t } from './i18n.js';

const DPR = Math.min(devicePixelRatio || 1, 2);

function whenVisible(el, start, stop) {
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: '60px' }).observe(el);
}

function canvasIn(container) {
  const c = document.createElement('canvas');
  c.className = 'mini';
  container.appendChild(c);
  const g = c.getContext('2d');
  const fit = () => {
    const r = c.getBoundingClientRect();
    c.width = Math.max(1, r.width * DPR);
    c.height = Math.max(1, r.height * DPR);
  };
  fit();
  addEventListener('resize', fit);
  return { c, g, fit };
}

/** Bell jar on its pump: pressure steps down while the content reacts. */
export function jarMini(container, { content, steps }) {
  const { c, g } = canvasIn(container);
  const cap = document.createElement('div');
  cap.className = 'viz-caption';
  container.appendChild(cap);
  const bubbles = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random(), s: Math.random() }));
  let raf = 0, t0 = performance.now();
  const CYCLE = 12;

  const draw = (now) => {
    raf = requestAnimationFrame(draw);
    const time = ((now - t0) / 1000) % CYCLE;
    const W = c.width, H = c.height, u = Math.min(W, H) / 300;
    g.clearRect(0, 0, W, H);
    // Pressure schedule: hold at each step, then let the air back in.
    const k = Math.min(steps.length - 1, Math.floor(time / 1.8));
    const mbar = time > CYCLE - 1.2 ? 1013 : steps[k];
    const vac = 1 - Math.log10(Math.max(mbar, 1)) / Math.log10(1013);
    const cx = W * 0.42, base = H * 0.78, jr = 92 * u, jh = 150 * u;

    // Base plate and hose.
    g.fillStyle = '#151922';
    g.fillRect(cx - jr - 24 * u, base, (jr + 24 * u) * 2, 10 * u);
    g.strokeStyle = '#c8322a'; g.lineWidth = 7 * u; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + jr + 10 * u, base + 5 * u); g.bezierCurveTo(cx + jr + 60 * u, base + 10 * u, W - 40 * u, base - 20 * u, W - 30 * u, base - 70 * u); g.stroke();

    // Content.
    if (content === 'battery') {
      const bw = 42 * u, bh = 70 * u, bx = cx - bw / 2, by = base - bh;
      g.fillStyle = '#20242c'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = '#d9a33c'; g.fillRect(bx, by + bh * 0.55, bw, bh * 0.45);
      g.fillStyle = '#c4c9d1'; g.fillRect(bx + 6 * u, by - 7 * u, 10 * u, 7 * u); g.fillRect(bx + bw - 16 * u, by - 7 * u, 10 * u, 7 * u);
      g.fillStyle = '#fff'; g.font = `${600} ${13 * u}px Inter, sans-serif`; g.textAlign = 'center';
      g.fillText('9V', cx, by + 26 * u);
      // Thermometer read-out: stays flat.
      g.fillStyle = 'rgba(116,242,196,.9)'; g.font = `${11 * u}px JetBrains Mono, monospace`;
      g.fillText(`${nf(21, 1)} °C`, cx, by - 18 * u);
    } else {
      const lw = 110 * u, lh = 56 * u, lx = cx - lw / 2, ly = base - lh;
      g.strokeStyle = 'rgba(200,230,255,.5)'; g.lineWidth = 1.5 * u;
      g.strokeRect(lx - 4 * u, ly - 18 * u, lw + 8 * u, lh + 18 * u);
      const gel = content === 'gel';
      const grad = g.createLinearGradient(0, ly, 0, base);
      grad.addColorStop(0, gel ? 'rgba(116,242,196,.85)' : 'rgba(111,214,255,.55)');
      grad.addColorStop(1, gel ? 'rgba(30,120,100,.9)' : 'rgba(30,80,160,.7)');
      g.fillStyle = grad;
      if (gel) {
        // Lumpy gel surface, perfectly calm.
        g.beginPath(); g.moveTo(lx, base);
        for (let i = 0; i <= 20; i++) g.lineTo(lx + (lw * i) / 20, ly + 4 * u * Math.sin(i * 1.7) + 3 * u);
        g.lineTo(lx + lw, base); g.fill();
      } else {
        g.fillRect(lx, ly, lw, lh);
      }
      if (!gel) {
        // Boiling intensity follows the vacuum, then fades once degassed (first cycle only feel).
        const boil = vac > 0.3 ? Math.min(1, (vac - 0.3) * 2.5) * (1 - Math.max(0, (time - 7) / 3)) : 0;
        bubbles.forEach((b) => {
          if (b.s > boil) return;
          b.y -= (0.004 + b.r * 0.01) * (0.5 + boil);
          if (b.y < 0) { b.y = 1; b.x = Math.random(); }
          g.beginPath();
          g.arc(lx + b.x * lw, ly + b.y * lh, (1 + b.r * 3.5 * boil) * u, 0, Math.PI * 2);
          g.strokeStyle = 'rgba(220,245,255,.8)'; g.lineWidth = 1 * u; g.stroke();
        });
        if (boil > 0.6) {
          g.fillStyle = `rgba(220,240,255,${(boil - 0.6) * 0.5})`;
          g.beginPath(); g.ellipse(cx, ly - 30 * u, 60 * u, 22 * u, 0, 0, Math.PI * 2); g.fill();
        }
      }
    }

    // The jar.
    g.save();
    g.beginPath();
    g.moveTo(cx - jr, base);
    g.lineTo(cx - jr, base - jh + jr * 0.6);
    g.bezierCurveTo(cx - jr, base - jh - jr * 0.35, cx + jr, base - jh - jr * 0.35, cx + jr, base - jh + jr * 0.6);
    g.lineTo(cx + jr, base);
    const jg = g.createLinearGradient(cx - jr, 0, cx + jr, 0);
    jg.addColorStop(0, 'rgba(170,215,255,.22)'); jg.addColorStop(0.2, 'rgba(170,215,255,.04)'); jg.addColorStop(0.8, 'rgba(170,215,255,.04)'); jg.addColorStop(1, 'rgba(170,215,255,.2)');
    g.fillStyle = jg; g.fill();
    g.strokeStyle = 'rgba(190,225,255,.55)'; g.lineWidth = 1.6 * u; g.stroke();
    g.restore();
    g.beginPath(); g.arc(cx, base - jh - jr * 0.05, 9 * u, 0, Math.PI * 2); g.strokeStyle = 'rgba(190,225,255,.55)'; g.stroke();

    // Gauge.
    const gx = W - 52 * u, gy = H * 0.3, gr = 32 * u;
    g.beginPath(); g.arc(gx, gy, gr, 0, Math.PI * 2); g.fillStyle = 'rgba(10,16,30,.9)'; g.fill();
    g.strokeStyle = 'rgba(150,185,255,.35)'; g.lineWidth = 1.5 * u; g.stroke();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, a = a0 + (1 - vac) * (a1 - a0);
    g.beginPath(); g.arc(gx, gy, gr - 6 * u, a0, a1); g.strokeStyle = 'rgba(150,185,255,.15)'; g.lineWidth = 4 * u; g.stroke();
    g.beginPath(); g.arc(gx, gy, gr - 6 * u, a0, a); g.strokeStyle = '#6fd6ff'; g.stroke();
    g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * (gr - 10 * u), gy + Math.sin(a) * (gr - 10 * u)); g.strokeStyle = '#fff'; g.lineWidth = 2 * u; g.stroke();

    const state = content === 'battery' ? t('mini.battery') : content === 'gel' ? t('mini.gel') : mbar < 200 && time < 9 ? t('mini.boiling') : t('mini.degassed');
    cap.innerHTML = `<span>${t('mini.pressure')} <b>${nf(mbar)} mbar</b></span><span>${state}</span>`;
  };
  whenVisible(container, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(draw); } }, () => { cancelAnimationFrame(raf); raf = 0; });
}

/** Two-stage Cockcroft-Walton multiplier with charge pulses and output bar. */
export function cascadeMini(container) {
  container.classList.add('cascade');
  container.innerHTML = `
  <svg viewBox="0 0 480 300" role="img" aria-label="${t('mini.cascadeAria')}">
    <defs>
      <linearGradient id="cw-bar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3c4bd8"/><stop offset="1" stop-color="#d4f6ff"/></linearGradient>
      <filter id="cw-glow"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>
    <g fill="none" stroke="#5d6b88" stroke-width="1.6">
      <path d="M60 80 H116 M124 80 H256 M264 80 H340" />
      <path d="M60 230 H176 M184 230 H336 M344 230 H420" />
      <path d="M60 80 V138 M60 172 V230" />
      <path id="d1" d="M100 230 L180 80" /><path id="d2" d="M180 80 L260 230" /><path id="d3" d="M260 230 L340 80" /><path id="d4" d="M340 80 L420 230" />
      <path d="M48 244 H72 M53 250 H67 M58 256 H62" />
    </g>
    <path d="M116 66 V94 M124 66 V94" stroke="#b4bfd3" stroke-width="3"/><path d="M256 66 V94 M264 66 V94" stroke="#b4bfd3" stroke-width="3"/><path d="M176 216 V244 M184 216 V244" stroke="#b4bfd3" stroke-width="3"/><path d="M336 216 V244 M344 216 V244" stroke="#b4bfd3" stroke-width="3"/>
    <g transform="translate(140.0 155.0) rotate(-61.9)"><path d="M-8 -8 L-8 8 L6 0 Z" fill="#74f2c4"/><path d="M6 -8 V8" stroke="#74f2c4" stroke-width="2.2"/></g><g transform="translate(220.0 155.0) rotate(61.9)"><path d="M-8 -8 L-8 8 L6 0 Z" fill="#74f2c4"/><path d="M6 -8 V8" stroke="#74f2c4" stroke-width="2.2"/></g><g transform="translate(300.0 155.0) rotate(-61.9)"><path d="M-8 -8 L-8 8 L6 0 Z" fill="#74f2c4"/><path d="M6 -8 V8" stroke="#74f2c4" stroke-width="2.2"/></g><g transform="translate(380.0 155.0) rotate(61.9)"><path d="M-8 -8 L-8 8 L6 0 Z" fill="#74f2c4"/><path d="M6 -8 V8" stroke="#74f2c4" stroke-width="2.2"/></g>
    <g fill="#d4f6ff"><circle cx="100" cy="230" r="3"/><circle cx="180" cy="80" r="3"/><circle cx="260" cy="230" r="3"/><circle cx="340" cy="80" r="3"/><circle cx="420" cy="230" r="4"/></g>
    <circle cx="60" cy="155" r="16" fill="#060a15" stroke="#6fd6ff" stroke-width="1.6"/>
    <path id="cw-wave" d="M50 160 V150 H60 V160 H70 V150" fill="none" stroke="#6fd6ff" stroke-width="1.6"/>
    <g font-family="JetBrains Mono, monospace" font-size="11" fill="#7c88a1">
      <text x="14" y="122">±${nf(0.5, 1)} V</text><text x="112" y="56">C1</text><text x="252" y="56">C3</text><text x="172" y="268">C2</text><text x="332" y="268">C4</text>
      <text x="392" y="256">${t('mini.out')}</text>
    </g>
    <g class="cw-dots"></g>
    <rect x="448" y="70" width="18" height="160" rx="5" fill="rgba(255,255,255,.05)" stroke="#2a3550"/>
    <rect id="cw-fill" x="448" y="230" width="18" height="0" rx="5" fill="url(#cw-bar)"/>
    <text id="cw-out" x="457" y="60" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#d4f6ff">0 V</text>
  </svg>
  <div class="seg cw-freq" role="radiogroup" aria-label="${t('mini.freqAria')}"><button class="on" data-f="hi">&gt; 500 Hz</button><button data-f="lo">20 Hz</button></div>`;
  const seg = container.querySelector('.cw-freq');
  seg.style.cssText = 'position:absolute;left:16px;bottom:12px;';
  const paths = ['d1', 'd2', 'd3', 'd4'].map((id) => container.querySelector(`#${id}`));
  const dotsG = container.querySelector('.cw-dots');
  const fill = container.querySelector('#cw-fill');
  const out = container.querySelector('#cw-out');
  const wave = container.querySelector('#cw-wave');
  let hi = true, raf = 0, v = 0, last = performance.now(), phase = 0, phaseT = 0;
  const dots = [];
  seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    hi = b.dataset.f === 'hi';
    seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  const spawn = (k) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', 3.2);
    c.setAttribute('fill', '#d4f6ff');
    c.setAttribute('filter', 'url(#cw-glow)');
    dotsG.appendChild(c);
    dots.push({ c, p: paths[k], t: 0 });
  };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const half = hi ? 0.5 : 1.6;
    phaseT += dt;
    if (phaseT > half) {
      phaseT = 0;
      phase ^= 1;
      wave.setAttribute('d', phase ? 'M50 150 V160 H60 V150 H70 V160' : 'M50 160 V150 H60 V160 H70 V150');
      if (phase) { spawn(0); spawn(2); } else { spawn(1); spawn(3); }
    }
    // Output: charges towards 2 V at high frequency; at 20 Hz the capacitors
    // discharge between pulses and the output sags around 0,8 V.
    const target = hi ? 2.0 : 0.8 + 0.35 * Math.sin(now / 260) * Math.sin(now / 590);
    v += (target - v) * dt * (hi ? 0.9 : 2.5);
    const hgt = Math.max(0, Math.min(1, v / 2.2)) * 160;
    fill.setAttribute('height', hgt);
    fill.setAttribute('y', 230 - hgt);
    out.textContent = `${nf(v, 2)} V`;
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.t += dt / (half * 0.9);
      const L = d.p.getTotalLength();
      const pt = d.p.getPointAtLength(Math.min(1, d.t) * L);
      d.c.setAttribute('cx', pt.x);
      d.c.setAttribute('cy', pt.y);
      d.c.setAttribute('opacity', 1 - Math.max(0, d.t - 0.8) * 5);
      if (d.t >= 1) { d.c.remove(); dots.splice(i, 1); }
    }
  };
  whenVisible(container, () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }, () => { cancelAnimationFrame(raf); raf = 0; });
}

/** The fly-swatter booster: a crackling arc and the voltage-divider read-out. */
export function boostMini(container) {
  const { c, g } = canvasIn(container);
  const cap = document.createElement('div');
  cap.className = 'viz-caption';
  cap.innerHTML = `<span>${t('mini.in')} <b>3 V</b></span><span>${t('mini.out')} <b>≈ 7 kV</b></span><span>${t('mini.divider')}</span>`;
  container.appendChild(cap);
  let raf = 0;
  const bolt = (x1, y1, x2, y2, depth, spread) => {
    if (depth === 0) { g.lineTo(x2, y2); return; }
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread, my = (y1 + y2) / 2 + (Math.random() - 0.5) * spread;
    bolt(x1, y1, mx, my, depth - 1, spread / 2);
    bolt(mx, my, x2, y2, depth - 1, spread / 2);
  };
  const draw = (now) => {
    raf = requestAnimationFrame(draw);
    const W = c.width, H = c.height, u = Math.min(W, H) / 260;
    g.fillStyle = 'rgba(2,4,10,.35)';
    g.fillRect(0, 0, W, H);
    const y = H * 0.44, x1 = W * 0.3, x2 = W * 0.7;
    // Electrodes.
    g.fillStyle = '#9aa3b2';
    g.beginPath(); g.arc(x1, y, 12 * u, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x2, y, 12 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a3f47';
    g.fillRect(x1 - 4 * u, y + 12 * u, 8 * u, 60 * u);
    g.fillRect(x2 - 4 * u, y + 12 * u, 8 * u, 60 * u);
    // Arc.
    if (Math.random() < 0.85) {
      for (let k = 0; k < 2; k++) {
        g.beginPath(); g.moveTo(x1 + 10 * u, y);
        bolt(x1 + 10 * u, y, x2 - 10 * u, y, 6, 70 * u);
        g.strokeStyle = k ? 'rgba(255,255,255,.95)' : 'rgba(140,170,255,.5)';
        g.lineWidth = (k ? 1.4 : 6) * u;
        g.shadowColor = '#8f86ff'; g.shadowBlur = 18 * u;
        g.stroke();
        g.shadowBlur = 0;
      }
    }
    g.fillStyle = '#e8eef8'; g.font = `${500} ${15 * u}px Unbounded, sans-serif`; g.textAlign = 'center';
    g.fillText(`3 V  →  ${nf(7000)} V`, W / 2, H * 0.2);
  };
  whenVisible(container, () => { if (!raf) raf = requestAnimationFrame(draw); }, () => { cancelAnimationFrame(raf); raf = 0; });
}
