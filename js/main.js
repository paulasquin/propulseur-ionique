// Page orchestration: smooth scroll, content rendering, the 3D stage and its
// acts, charts, viewers, lightbox and slides.
import * as THREE from 'three';
import { EXPERIMENTS, TIMELINE, RESULTS, ISP, MISSIONS, SLIDES, VIDEOS_PUBLIC } from './content.js';
import { createChart } from './charts.js';
import { exhaustVelocity } from './stage/principle.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nf = (v, d = 0) => v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });
document.body.classList.add('is-loading');

/* ---------------- smooth scroll ---------------- */
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.6, offset: 0 }) : $(target)?.scrollIntoView({ behavior: 'smooth' }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2 || !$(id)) return;
  e.preventDefault();
  $('.topnav').classList.remove('open');
  scrollTo(id);
}));

/* ---------------- content ---------------- */
function renderTimeline() {
  $('#timeline').innerHTML = TIMELINE.map((t) => `
    <li class="reveal"><div class="tl-date">${t.date}</div><div class="tl-title">${t.title}</div><p class="tl-text">${t.text}</p></li>`).join('');
}

function renderJournal() {
  $('#journal-list').innerHTML = EXPERIMENTS.map((e) => {
    const media = e.media.map((m, i) => `
      <figure data-lightbox="${e.id}" data-i="${i}">
        <div class="thumb ${m.contain ? 'contain' : ''}"><img src="${m.src.replace(/(assets\/photos\/[^.]+)\.webp$/, '$1-s.webp')}" data-full="${m.src}" alt="${m.caption}" loading="lazy"></div>
        <figcaption>${m.caption}</figcaption>
      </figure>`).join('');
    const videos = VIDEOS_PUBLIC && e.videos ? `<div class="entry-videos">Vidéos de l'expérience : ${e.videos.map((v, i) => `<a href="https://www.youtube.com/watch?v=${v}" target="_blank" rel="noopener">▶ vidéo ${i + 1}</a>`).join('')}</div>` : '';
    return `
    <article class="entry ${e.num === 'I3D' ? 'print' : ''}" id="exp-${e.id}">
      <div class="entry-mark">
        <div class="entry-num">${e.num}</div>
        <div class="entry-date">${e.date}</div>
        <div class="entry-year">${e.year}</div>
      </div>
      <div class="entry-body reveal">
        <h3>${e.title}</h3>
        <p class="entry-q">${e.question}</p>
        <div class="entry-grid">
          <div class="entry-text">
            ${e.body.map((p) => `<p>${p}</p>`).join('')}
            <div class="entry-result"><b>Résultat</b>${e.result}</div>
            ${e.limit ? `<p class="entry-limit">${e.limit}</p>` : ''}
          </div>
          <div class="entry-viz" data-viz='${JSON.stringify(e.viz)}'></div>
        </div>
        ${media ? `<div class="entry-media">${media}</div>` : ''}
        ${videos}
      </div>
    </article>`;
  }).join('');
}

function renderResults() {
  $('#results-grid').innerHTML = RESULTS.map((r) => `
    <div class="result ${r.accent ? 'accent' : ''} reveal">
      <div class="result-value"><span data-count="${r.value}" data-decimals="${r.decimals}">0</span><small>${r.unit}</small></div>
      <p class="result-label">${r.label}</p>
      <p class="result-note">${r.note}</p>
    </div>`).join('');
  // Log scale from 100 s to 50 000 s.
  const lg = (v) => (Math.log10(v) - 2) / (Math.log10(50000) - 2);
  $('#isp-chart').innerHTML = ISP.map((r) => `
    <div class="isp-row ${r.kind}">
      <div class="isp-head"><span><b>${r.name}</b><small>${r.detail}</small></span><span class="isp-val">${nf(r.isp)} s</span></div>
      <div class="isp-bar"><i style="--w:${(lg(r.isp) * 100).toFixed(1)}%"></i></div>
    </div>`).join('') + '<div class="isp-scale"><span>100 s</span><span>1 000 s</span><span>10 000 s</span><span>échelle logarithmique</span></div>';
}

function renderMissions() {
  $('#missions-list').innerHTML = MISSIONS.map((m) => `
    <article class="mission reveal ${m.name === 'LISA Pathfinder' ? 'highlight' : ''}">
      <div class="mission-year">${m.year}</div>
      <div class="mission-name">${m.name}</div>
      <div class="mission-agency">${m.agency}</div>
      <p>${m.text}</p>
    </article>`).join('');
}

function setupSlides() {
  let n = 0;
  const thumbs = $('#slide-thumbs');
  thumbs.innerHTML = SLIDES.map((s, i) => `<button aria-label="Diapositive ${s.n}" data-i="${i}"><img src="assets/slides/diapo-${String(s.n).padStart(2, '0')}.webp" alt="" loading="lazy"></button>`).join('');
  const img = $('#slide-img');
  const show = (i) => {
    n = (i + SLIDES.length) % SLIDES.length;
    const s = SLIDES[n];
    gsap.to(img, { opacity: 0, duration: 0.18, onComplete: () => {
      img.src = `assets/slides/diapo-${String(s.n).padStart(2, '0')}.webp`;
      img.alt = `Diapositive ${s.n} : ${s.title}`;
      img.onload = () => gsap.to(img, { opacity: 1, duration: 0.3 });
    } });
    $('#slide-n').textContent = String(s.n).padStart(2, '0');
    $('#slide-title').textContent = s.title;
    $('#slide-text').textContent = s.text;
    $$('button', thumbs).forEach((b, k) => b.classList.toggle('on', k === n));
  };
  thumbs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  $('.slides-nav.prev').addEventListener('click', () => show(n - 1));
  $('.slides-nav.next').addEventListener('click', () => show(n + 1));
  addEventListener('keydown', (e) => {
    const r = $('#slides').getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0 || !$('#lightbox').hidden) return;
    if (e.key === 'ArrowRight') show(n + 1);
    if (e.key === 'ArrowLeft') show(n - 1);
  });
  show(0);
}

function setupLightbox() {
  const lb = $('#lightbox');
  const img = $('img', lb), cap = $('figcaption', lb);
  let group = [], idx = 0;
  const open = (g, i) => {
    group = g; idx = i;
    const f = group[idx];
    const im = $('img', f);
    img.src = im.dataset.full || im.src;
    img.alt = im.alt;
    cap.textContent = $('figcaption', f)?.textContent || im.alt;
    lb.hidden = false;
    lenis?.stop();
  };
  const close = () => { lb.hidden = true; lenis?.start(); };
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-lightbox]');
    if (!f) return;
    const g = $$(`[data-lightbox="${f.dataset.lightbox}"]`);
    open(g, g.indexOf(f));
  });
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-prev', lb).addEventListener('click', () => open(group, (idx - 1 + group.length) % group.length));
  $('.lb-next', lb).addEventListener('click', () => open(group, (idx + 1) % group.length));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') open(group, (idx + 1) % group.length);
    if (e.key === 'ArrowLeft') open(group, (idx - 1 + group.length) % group.length);
  });
}

function setupVideo() {
  $$('.video[data-yt]').forEach((v) => {
    $('.video-play', v).addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0`;
      f.title = v.dataset.title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      v.appendChild(f);
      v.classList.add('playing');
    });
  });
}

/* ---------------- lazy visualisations in the journal ---------------- */
async function setupViz() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(async (en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target;
      const viz = JSON.parse(el.dataset.viz);
      if (viz.type === 'chart') {
        const box = document.createElement('div');
        box.className = 'chart';
        el.appendChild(box);
        const ch = createChart(box, viz.chart);
        ch.play(2.4);
      } else if (viz.type === 'viewer') {
        const { createViewer } = await import('./viewer.js');
        const box = document.createElement('div');
        el.appendChild(box);
        const models = viz.model === 'croix' ? [{ name: 'croix', y: 46 }, { name: 'pied', y: 0 }] : [{ name: 'plateforme' }];
        createViewer(box, { models, label: viz.model === 'croix' ? 'Modèle 3D du propulseur #2.1' : 'Modèle 3D de la plateforme de test' });
      } else {
        const minis = await import('./minis.js');
        if (viz.type === 'jar') minis.jarMini(el, viz);
        if (viz.type === 'cascade') minis.cascadeMini(el);
        if (viz.type === 'boost') minis.boostMini(el);
      }
    });
  }, { rootMargin: '200px' });
  $$('.entry-viz').forEach((el) => io.observe(el));
}

/* ---------------- reveal & counters ---------------- */
function setupReveals() {
  $$('.reveal').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('[data-count]').forEach((el) => {
    const v = parseFloat(el.dataset.count), d = +(el.dataset.decimals || 0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(o, { v, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = nf(o.v, d); } }),
    });
  });
  ScrollTrigger.create({ trigger: '#isp-chart', start: 'top 80%', once: true, onEnter: () => $('#isp-chart').classList.add('in') });
  ScrollTrigger.create({ trigger: '.tanks', start: 'top 85%', onEnter: () => $('.tanks').classList.add('in'), onLeaveBack: () => $('.tanks').classList.remove('in') });
  gsap.to('#timeline', { '--tl': 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 85%', end: 'bottom 50%', scrub: true } });
  $$('.photo-strip .ph').forEach((ph, i) => gsap.fromTo(ph, { y: 60 + i * 30 }, { y: -20 - i * 20, ease: 'none', scrollTrigger: { trigger: '.photo-strip', start: 'top bottom', end: 'bottom top', scrub: true } }));
}

/* ---------------- nav ---------------- */
function setupNav() {
  const nav = $('.topnav');
  const bar = $('.scroll-progress span');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; nav.classList.toggle('scrolled', s.scroll() > 40); } });
  $('.nav-toggle').addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    $('.nav-toggle').setAttribute('aria-expanded', open);
  });
  const links = $$('.nav-links a');
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => { if (s.isActive) links.forEach((l) => l.classList.toggle('active', l === a)); } });
  });
}

/* ---------------- 3D stage ---------------- */
function webglOK() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

async function setupStage(onProgress) {
  const { Stage } = await import('./stage/stage.js');
  const { Labels } = await import('./stage/fx.js');
  const { OrbitAct } = await import('./stage/orbit.js');
  const { PrincipleAct } = await import('./stage/principle.js');
  const { PrototypeAct } = await import('./stage/prototype.js');
  const { SpaceAct } = await import('./stage/space.js');
  const { loadModel } = await import('./models.js');

  const stage = new Stage($('#stage'));
  const labelsFor = () => {
    const d = document.createElement('div');
    $('#stage-labels').appendChild(d);
    return new Labels(d);
  };

  // Assets.
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_, loaded, total) => onProgress(loaded / total);
  const tl = new THREE.TextureLoader(manager);
  const tex = (url, srgb = true) => new Promise((res) => tl.load(url, (t) => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
    res(t);
  }, undefined, () => res(new THREE.Texture())));
  const [day, night, clouds, croix, pied] = await Promise.all([
    tex('assets/tex/earth-day.jpg'), tex('assets/tex/earth-night.jpg'), tex('assets/tex/earth-clouds.jpg', false),
    loadModel('croix', manager), loadModel('pied', manager),
  ]);
  const textures = { day, night, clouds };

  const acts = {
    orbit: new OrbitAct({ textures, labels: labelsFor() }),
    principle: new PrincipleAct({ labels: labelsFor() }),
    prototype: new PrototypeAct({ labels: labelsFor() }),
    space: new SpaceAct({ textures, labels: labelsFor() }),
  };
  acts.prototype.setModels({ croix, pied });
  for (const [name, act] of Object.entries(acts)) {
    act.init?.(stage.renderer);
    stage.add(name, act);
  }
  // Compile shaders up front to avoid hitches when an act first appears.
  for (const act of Object.values(acts)) stage.renderer.compile(act.scene, act.camera);
  return { stage, acts };
}

function bindActs({ stage, acts }) {
  // The act whose section covers the middle of the viewport owns the stage.
  $$('section.act').forEach((sec) => {
    const name = sec.dataset.act;
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: (s) => {
        if (s.isActive) stage.setActive(name);
        else if (stage.active === acts[name]) stage.setActive(null);
      },
    });
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => stage.setProgress(name, s.progress),
      onRefresh: (s) => stage.setProgress(name, s.progress),
    });
  });

  // Principle lab.
  const pr = acts.principle;
  const volt = $('#lab-volt');
  let ion = 'cl';
  const updateLab = () => {
    const kV = parseFloat(volt.value);
    volt.style.setProperty('--p', `${((kV - 0.5) / 29.5) * 100}%`);
    $('#lab-volt-out').textContent = `${nf(kV, 1)} kV`;
    const ve = exhaustVelocity(kV, ion);
    $('#lab-ve').textContent = `${nf(Math.round(ve / 1000))} km/s`;
    $('#lab-isp').textContent = `${nf(Math.round(ve / 9.80665 / 100) * 100)} s`;
    $('#lab-f').textContent = `${nf((2 * 3.78) / ve * 1e6, 0)} µN`;
    pr.setVoltage(kV);
    pr.setIon(ion);
  };
  volt.addEventListener('input', updateLab);
  $$('.lab-ions button').forEach((b) => b.addEventListener('click', () => {
    ion = b.dataset.ion;
    $$('.lab-ions button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    updateLab();
  }));
  updateLab();
  pr.onPolarity = (pol) => {
    $('.polarity').classList.toggle('neg', pol < 0);
    $('#pol-label').textContent = pol > 0 ? '+22 kV · éjection de Cl⁻' : '−22 kV · éjection de Na⁺';
  };

  // Prototype read-outs and the synchronised measurement chart.
  const pt = acts.prototype;
  const chart = protoChart;
  pt.onPrint = (layer) => { $('#print-layer').textContent = layer; };
  pt.onPressure = (mbar) => { $('#jar-mbar').textContent = nf(mbar); };
  pt.onMeasure = (m) => chart.setReveal(m * 1.05);
}

let protoChart = null;

/* ---------------- act panels ---------------- */
function setupPanels() {
  $$('.act .panel').forEach((panel) => {
    const card = $('.card, .hero-content', panel);
    if (!card) return;
    const hero = panel.classList.contains('panel-hero');
    const sticky = panel.classList.contains('panel-lab') || panel.classList.contains('panel-measure');
    const tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (hero) {
      tl.to(card, { opacity: 1, duration: 0.5 }).to(card, { opacity: 0, y: -80, duration: 0.5, ease: 'power1.in' });
      tl.to('.scroll-cue, .hud-orbit', { opacity: 0, duration: 0.2 }, 0.45);
    } else {
      tl.fromTo(card, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' })
        .to(card, { opacity: 1, duration: sticky ? 0.6 : 0.44 })
        .to(card, { opacity: 0, y: -60, duration: sticky ? 0.12 : 0.28, ease: 'power2.in' });
    }
  });
}

function heroIntro() {
  const split = new SplitText('.ht-word:not(.ht-glow)', { type: 'chars' });
  gsap.from(split.chars, { yPercent: 110, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.035, delay: 0.3 });
  gsap.from('.ht-glow', { yPercent: 110, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.75 });
  gsap.from('.eyebrow, .hero-sub, .hero-kpis, .hero-cta, .scroll-cue, .hud-orbit', { opacity: 0, y: 24, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.9 });
}

/* ---------------- boot ---------------- */
async function boot() {
  renderTimeline();
  renderJournal();
  renderResults();
  renderMissions();
  setupSlides();
  setupLightbox();
  setupVideo();
  setupNav();
  setupViz();

  const arc = $('#loader-arc'), mbar = $('#loader-mbar');
  const onProgress = (f) => {
    arc.style.strokeDashoffset = 326.7 * (1 - f);
    mbar.textContent = nf(Math.max(1, Math.round(1013 * Math.pow(1 - f, 2.4))));
  };

  let stageBundle = null;
  if (webglOK()) {
    try { stageBundle = await setupStage(onProgress); } catch (e) { console.error('3D stage disabled:', e); }
  }
  protoChart = createChart($('#chart-proto'), 'thrust');
  if (!stageBundle) {
    document.body.classList.add('no-webgl');
    ScrollTrigger.create({ trigger: '#chart-proto', start: 'top 80%', once: true, onEnter: () => protoChart.play() });
  }

  onProgress(1);
  setupPanels();
  setupReveals();
  if (stageBundle) bindActs(stageBundle);
  if (location.search.includes('debug')) window.__ionic = stageBundle;
  ScrollTrigger.refresh();

  await new Promise((r) => setTimeout(r, 350));
  $('#loader').classList.add('done');
  document.body.classList.remove('is-loading');
  lenis?.start();
  heroIntro();
}

boot();
