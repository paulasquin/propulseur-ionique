// Language handling. The inline script in <head> picks the language (?lang=,
// saved choice, then browser languages) and sets <html lang>. French lives in
// the HTML as the default text; English replaces it at boot.

export const LANG = document.documentElement.lang === 'fr' ? 'fr' : 'en';
export const LOCALE = LANG === 'fr' ? 'fr-FR' : 'en-US';
export const nf = (v, d = 0) => Number(v).toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

/** Strings used by the scripts (charts, 3D labels, viewers, journal…). */
const UI = {
  fr: {
    'journal.result': 'Résultat',
    'journal.videos': "Vidéos de l'expérience :",
    'journal.video': 'vidéo',
    'isp.scale': ['100 s', '1 000 s', '10 000 s', 'échelle logarithmique'],
    'slide.alt': 'Diapositive {n} : {title}',
    'slide.thumb': 'Diapositive {n}',
    'pol.plus': '+22 kV · éjection de Cl⁻',
    'pol.minus': '−22 kV · éjection de Na⁺',
    'viewer.croix': 'Modèle 3D du propulseur #2.1',
    'viewer.plateforme': 'Modèle 3D de la plateforme de test',
    'viewer.modes': "Mode d'affichage",
    'viewer.solid': 'Plein', 'viewer.xray': 'Rayons X', 'viewer.cut': 'Coupe',
    'viewer.hint': 'glisser pour tourner',
    // Charts
    'ch.concentration': 'concentration en sel (g/L)',
    'ch.conductivity': 'conductivité (S/m)',
    'ch.time': 'temps (s)',
    'ch.freq': 'fréquence de rotation (tr/s)',
    'ch.turns': 'tr/s',
    'ch.condSeries': 'Mesures du 20 mars 2015',
    'ch.slope': 'pente ≈ 0,039 S/m par g/L',
    'ch.saturation': 'saturation',
    'ch.extrSeries': '+5 000 V sur le ménisque, 17 juin 2015',
    'ch.extrDrop': 'baisse : des ions Cl⁻ extraits ?',
    'ch.extrRise': 'remontée inexpliquée',
    'ch.with': 'Propulseurs allumés (essai {n})',
    'ch.without': 'Propulseurs éteints (essai {n})',
    // Journal minis
    'mini.pressure': 'pression',
    'mini.battery': 'pile : stable',
    'mini.gel': 'gel : aucune ébullition',
    'mini.boiling': 'ébullition, dégazage',
    'mini.degassed': 'solution dégazée',
    'mini.in': 'entrée', 'mini.out': 'sortie',
    'mini.divider': 'diviseur : <b>630 – 636 V</b> attendus',
    'mini.cascadeAria': 'Multiplicateur de tension à deux étages',
    'mini.freqAria': 'Fréquence du signal',
    // 3D labels
    'l.gel': 'Gel ionique · eau salée + polyacrylate',
    'l.needles': 'Aiguilles capillaires',
    'l.cone': 'Cône de Taylor',
    'l.extract': "Grille d'extraction",
    'l.accel': "Grille d'accélération · {sign}{kv} kV",
    'l.beam': 'Faisceau de {ion} · {v} km/s',
    'l.reaction': 'Poussée : réaction',
    'l.unit': 'Unité de propulsion · gel + grilles',
    'l.pile': 'Logement de la pile 9 V',
    'l.boost': 'Élévateur de tension',
    'l.handle': 'Anse : suspension par fil ou chaîne aimantée',
    'l.sign': '« Propulseur ionique #2.1 · Paul Asquin 2015 »',
    'l.glass': 'Verre de montre',
    'l.needle': 'Aiguille',
    'l.brass': 'Masse en laiton',
    'l.base': 'Socle',
    'l.contact': 'Contact verre-aiguille',
    'l.thrust': 'Poussée tangentielle × 4',
    'l.leo': 'Orbite basse',
    'l.geo': 'Orbite haute',
    'l.burn1': 'Poussée n° 1',
    'l.burn2': 'Poussée n° 2',
    'l.spiral': 'Poussée ionique continue',
    'hud.ignition': 'ALLUMAGE',
  },
  en: {
    'journal.result': 'Result',
    'journal.videos': 'Experiment videos:',
    'journal.video': 'video',
    'isp.scale': ['100 s', '1,000 s', '10,000 s', 'logarithmic scale'],
    'slide.alt': 'Slide {n}: {title}',
    'slide.thumb': 'Slide {n}',
    'pol.plus': '+22 kV · ejecting Cl⁻',
    'pol.minus': '−22 kV · ejecting Na⁺',
    'viewer.croix': '3D model of thruster #2.1',
    'viewer.plateforme': '3D model of the test platform',
    'viewer.modes': 'Display mode',
    'viewer.solid': 'Solid', 'viewer.xray': 'X-ray', 'viewer.cut': 'Section',
    'viewer.hint': 'drag to rotate',
    'ch.concentration': 'salt concentration (g/L)',
    'ch.conductivity': 'conductivity (S/m)',
    'ch.time': 'time (s)',
    'ch.freq': 'rotation frequency (rev/s)',
    'ch.turns': 'rev/s',
    'ch.condSeries': 'Measurements, 20 March 2015',
    'ch.slope': 'slope ≈ 0.039 S/m per g/L',
    'ch.saturation': 'saturation',
    'ch.extrSeries': '+5,000 V on the meniscus, 17 June 2015',
    'ch.extrDrop': 'drop: Cl⁻ ions extracted?',
    'ch.extrRise': 'unexplained rise',
    'ch.with': 'Thrusters on (run {n})',
    'ch.without': 'Thrusters off (run {n})',
    'mini.pressure': 'pressure',
    'mini.battery': 'battery: stable',
    'mini.gel': 'gel: no boiling',
    'mini.boiling': 'boiling, degassing',
    'mini.degassed': 'solution degassed',
    'mini.in': 'input', 'mini.out': 'output',
    'mini.divider': 'divider: <b>630 – 636 V</b> expected',
    'mini.cascadeAria': 'Two-stage voltage multiplier',
    'mini.freqAria': 'Signal frequency',
    'l.gel': 'Ionic gel · salt water + polyacrylate',
    'l.needles': 'Capillary needles',
    'l.cone': 'Taylor cone',
    'l.extract': 'Extraction grid',
    'l.accel': 'Acceleration grid · {sign}{kv} kV',
    'l.beam': '{ion} beam · {v} km/s',
    'l.reaction': 'Thrust: the reaction',
    'l.unit': 'Thruster unit · gel + grids',
    'l.pile': '9 V battery bay',
    'l.boost': 'Voltage booster',
    'l.handle': 'Handle: thread or magnetic-chain suspension',
    'l.sign': '“Propulseur ionique #2.1 · Paul Asquin 2015”',
    'l.glass': 'Watch glass',
    'l.needle': 'Needle',
    'l.brass': 'Brass weight',
    'l.base': 'Base',
    'l.contact': 'Glass-on-needle contact',
    'l.thrust': 'Tangential thrust × 4',
    'l.leo': 'Low orbit',
    'l.geo': 'High orbit',
    'l.burn1': 'Burn 1',
    'l.burn2': 'Burn 2',
    'l.spiral': 'Continuous ion thrust',
    'hud.ignition': 'IGNITION',
  },
};

/** English replacements for the static French text of index.html (keyed by data-i18n). */
const STATIC_EN = {
  'meta.title': 'Ion thruster — Paul Asquin · Engineering-school project, 2014-2016',
  'meta.description': 'Designing, 3D-printing and measuring a gridded electrostatic ion thruster for CubeSats: the journal of my preparatory-class research project (2014-2016).',
  loader: 'Pumping down the bell jar…',
  'nav.aria': 'Main navigation',
  brand: 'Ion thruster',
  'nav.principle': 'Principle', 'nav.project': 'Project', 'nav.prototype': 'Prototype', 'nav.journal': 'Experiments',
  'nav.results': 'Results', 'nav.space': 'Space', 'nav.defense': 'Defence',
  'hero.eyebrow': 'Preparatory-class research project · 2014 — 2016',
  'hero.t1': 'Ion',
  'hero.t2': 'thruster',
  'hero.sub': 'Designing, 3D-printing and measuring a gridded electrostatic thruster for nanosatellites — under a high-school vacuum bell jar.',
  'hero.k1': 'measured thrust', 'hero.k2': 'voltage', 'hero.k3': 'specific impulse',
  'hero.cta1': 'How it works', 'hero.cta2': 'The prototype in 3D',
  'hero.scroll': 'Scroll', 'hero.hudThrust': 'THRUST', 'hero.hudVel': '7.66 km/s',
  'o1.k': 'The principle in one sentence',
  'o1.h': 'In space, nothing slows you down.',
  'o1.p1': 'An ion thruster pulls charged particles out of a propellant, accelerates them in an intense electric field and ejects them at hundreds of kilometres per second. By action and reaction, the satellite moves forward.',
  'o1.p2': 'The thrust is tiny — in the micronewton range — but it can last for months, even years.',
  'o2.k': 'Why a CubeSat',
  'o2.h': 'Satellites the size of a milk carton.',
  'o2.p': 'Thanks to miniaturisation, nanosatellites 10 cm across now carry out missions once reserved for spacecraft weighing several tonnes. They need propulsion that is compact and frugal with propellant: that is precisely what this project is about.',
  'p1.k': 'Principle · 01',
  'p1.h': 'A gridded electrostatic thruster',
  'p1.p': 'My design draws on the MIT micro-thrusters: no pump, no pressurised tank. The propellant rises to the grids on its own, by capillary action.',
  'p1.note': 'Propellant: gelled salt water — Na⁺ and Cl⁻ ions',
  'p2.k': 'Principle · 02',
  'p2.h': 'The ionic gel',
  'p2.p': 'Each cell holds salt water trapped in sodium polyacrylate. The gel does not boil in a vacuum, and lets the solution seep up to the needle.',
  'p3.k': 'Principle · 03',
  'p3.h': 'The meniscus and the Taylor cone',
  'p3.p': 'At the tip of the needle, the electric field stretches the meniscus into a sharp cone. At its apex, the field becomes so intense that it tears the ions away one by one.',
  'p4.k': 'Principle · 04',
  'p4.h': 'Extraction grid, acceleration grid',
  'p4.p': 'The acceleration grid alternates between <b class="t-plus">+22 kV</b> and <b class="t-minus">−22 kV</b>. Cl⁻ and Na⁺ ions are ejected in turn, so the satellite stays electrically neutral.',
  'p5.k': 'Principle · 05 — Interactive simulation',
  'p5.h': 'Action, reaction',
  'p5.p': 'Electrical energy becomes kinetic energy: <span class="formula">v<sub>e</sub> = √(2qV/m)</span>. The faster the ions, the less propellant is needed for the same thrust.',
  'lab.volt': 'Acceleration voltage', 'lab.voltAria': 'Acceleration voltage in kilovolts',
  'lab.ion': 'Ejected ion',
  'lab.ve': 'exhaust velocity', 'lab.isp': 'specific impulse', 'lab.f': 'thrust at 3.78 W*',
  'lab.foot': '* Ideal thrust F = 2P/v<sub>e</sub> (100 % efficiency). Commercial thrusters accelerate xenon at 1 to 2 kV: a lower exhaust velocity, but far more thrust per watt.',
  'proj.k': 'The project',
  'proj.h': 'One project, two years,<br><em>one bell jar.</em>',
  'proj.lead': 'In France, the TIPE — a supervised personal research project — is the project assessment of the engineering-school entrance exams. Mine began in autumn 2014 at the Lycée La Martinière Monplaisir in Lyon, with a simple question: with the resources of a high-school laboratory, can one build an ion thruster that actually produces thrust?',
  'proj.p': 'This site is based on the online journal I kept at the time to share my results, record every experiment and gather advice from knowledgeable readers. The 3D models are the ones I drew in SolidWorks, and the charts are plotted from my original measurements.',
  'ph1.alt': 'The wired prototype with its 9 V batteries', 'ph1.c': 'October 2015: prototype #2.1, wired up',
  'ph2.alt': 'The bell jar and its rotary vane pump', 'ph2.c': "The laboratory's bell jar and its rotary vane pump",
  'ph3.alt': 'The physics laboratory', 'ph3.c': 'The physics laboratory at La Martinière Monplaisir',
  't1.k': 'The prototype · 01',
  't1.h': 'Drawn in SolidWorks, printed layer by layer',
  't1.p': 'Thruster #2.1 is a single part, 160 mm across and 84 mm high. This is the original model, loaded here from my 2015 files.',
  't1.layer': 'layer',
  't2.k': 'The prototype · 02',
  't2.h': 'Anatomy',
  't2.p': 'At the end of each of the four arms sits a thruster unit: the ionic gel and its grids. Between them are the bays for the 9 V batteries and the voltage boosters. Everything is carried on board.',
  't3.k': 'The prototype · 03',
  't3.h': 'Exploded view',
  't3.p': 'The structure, a watch glass seated under the dome, a needle set in a brass weight, and the base that deflects the airflow from the pump.',
  't4.k': 'The prototype · 04',
  't4.h': 'A radiometer pivot',
  't4.p': 'The structure rests on the tip of the needle through its watch glass, like the vanes of a Crookes radiometer. With the centre of gravity below the contact point, it balances by itself.',
  't5.k': 'The prototype · 05',
  't5.h': 'Ignition',
  't5.p': 'The four units push tangentially, all in the same direction. The structure starts to turn — very, very slowly.',
  't6.k': 'The prototype · 06',
  't6.h': 'Under the bell jar',
  't6.p': 'To eliminate air friction and let the ions fly freely, everything happens under a bell jar connected to a rotary vane pump: just a few millibars.',
  't6.pressure': 'pressure',
  't7.k': 'The prototype · 07 — The measurement',
  't7.h': 'With and without thrusters',
  't7.p': 'The thrust is too weak to overcome static friction, so I spin the structure up and compare its deceleration with the thrusters off and on. Original lap-by-lap readings:',
  't7.e1': 'J·θ̈<sub>off</sub> = M<sub>fric</sub>',
  't7.e2': 'J·θ̈<sub>on</sub> = M<sub>fric</sub> + M<sub>thr</sub>',
  't7.e3': 'F<sub>unit</sub> = 6.7 µN ± 2.3 µN',
  'jn.k': 'Experiment journal',
  'jn.h': 'Ten experiments,<br><em>two 3D prints.</em>',
  'jn.lead': 'From March 2015 to March 2016, every step began with a question — and sometimes with a failure. The data are those recorded at the time.',
  'res.k': 'Results',
  'res.h': 'The weight of a quarter<br><em>of a mosquito.</em>',
  'res.lead': '6.7 µN is the weight of a 0.7 mg mass. Negligible on Earth; but in space, with nothing to slow it down, such a thrust eventually adds up.',
  'isp.k': 'Specific impulse',
  'isp.h': 'For how long can a kilogram of propellant produce a thrust equal to its own weight?',
  'isp.p': 'Specific impulse measures how efficiently an engine uses its propellant: the higher it is, the less it consumes. The theoretical value of my thruster is spectacular because its ions are accelerated through a very high voltage — at the cost of far lower thrust per watt.',
  'isp.note': '<b>2026 note.</b> In my model, I had written P = F·v<sub>e</sub>. The power of a jet is in fact ½·F·v<sub>e</sub>: the theoretical thrust would be 22 µN rather than 11 µN, and the estimated efficiency of my prototype about 30 % rather than 60 %.',
  's1.k': 'Ion propulsion in space · 01',
  's1.h': 'Two ways to raise an orbit',
  's1.p': 'To move from a low orbit to a high one, a chemical engine delivers two short, powerful impulses. An ion engine pushes gently and never stops.',
  's2.k': '02 · Chemical',
  's2.h': 'The Hohmann transfer',
  's2.p': 'One burn at perigee, half an ellipse, a second burn at apogee: a few hours are enough. But the propellant, ejected at barely 3 km/s, makes up most of the initial mass.',
  's3.k': '03 · Ion',
  's3.h': 'The spiral',
  's3.p': 'A tiny but continuous thrust: the satellite drifts outwards orbit after orbit, for weeks or months. Because its ions travel ten times faster, it carries more than fifteen times less propellant for the same payload.',
  's4.k': '04 · The rocket equation',
  's4.h': 'What you need to carry',
  's4.p': 'Share of the initial mass taken up by propellant, for the same velocity gain of 4 km/s:',
  's4.chem': 'chemical', 's4.ion': 'ion', 's4.ionIsp': 'I<sub>sp</sub> = 3,000 s',
  'mis.k': 'Already flying',
  'mis.h': 'From Deep Space 1<br><em>to constellations.</em>',
  'mis.lead': 'First used as the main propulsion of a probe in 1998, electric propulsion now equips thousands of satellites. In 2016, I closed my presentation with the missions it could enable; ten years later, they have become reality.',
  'mit.k': 'The inspiration',
  'mit.h': 'The MIT micro-thrusters',
  'mit.p': "My test bench borrowed an idea from MIT's Space Propulsion Laboratory: ionic-liquid electrospray thrusters mounted on a rotating structure whose speed is observed. Theirs floated on magnetic levitation; mine rested on a needle.",
  'mit.play': 'Play the MIT video',
  'mit.cap': 'MIT iEPS thrusters on a rotating rig · video by F. Mier-Hicks',
  'def.k': '29 June 2016 · IUT Paris Descartes',
  'def.h': 'Ten minutes<br><em>for two years.</em>',
  'def.lead': 'The oral exam of the Banque PT entrance competition: 10 minutes of presentation, 10 minutes of questions. The jury had read my summary sheet just before I walked in. My talk lasted 9 min 53 s.',
  'def.prev': 'Previous slide', 'def.next': 'Next slide',
  'def.note': 'The slides are shown in French, as presented in 2016.',
  'syn.k': 'Summary sheet · excerpt',
  'syn.q': '“The economic model of space exploration is undergoing profound change. Budget cuts have encouraged the rise of more frugal technologies. Thanks to the widespread miniaturisation of technology, CubeSat nanosatellites are able to carry out the missions of their larger predecessors.”',
  'syn.obj': '<b>Objective:</b> design and study an ion thruster model suited to the needs of a CubeSat.',
  'syn.k2': 'Looking back',
  'syn.p1': 'This project showed me how hard it is to analyse experimental results, and how important it is to always compare practical work with a theoretical model. Above all, it deepened my interest in space propulsion and my taste for research.',
  'syn.p2': 'In September 2016, I joined École Centrale de Nantes.',
  'thx.k': 'Thank you',
  'thx.h': 'To everyone who helped me',
  'thx.1': '<b>Gregory Emsellem</b>, founder and CEO of The Elwing Company',
  'thx.2': '<b>Nicolas Arcis</b>, head of satellite propulsion and pyrotechnics at CNES',
  'thx.4': '<b>M. Gamelon, Mme Lechuga, Mme C. Aynié</b> and the whole physics laboratory team at La Martinière Monplaisir',
  'src.2': 'Science Museum, London',
  'src.3': '<i>CNES Mag</i> no. 63, October 2014, article by Nicolas Arcis',
  'src.4': 'Wikipedia: voltage multiplier, Crookes radiometer',
  'src.blog': 'The original blog (2015, in French)',
  'foot.1': 'Paul Asquin · Ion thruster · Research project 2014-2016',
  'foot.2': 'Earth textures: NASA Visible Earth (Blue Marble, Black Marble). 3D models, photos and measurements: Paul Asquin.',
  'lb.aria': 'Enlarged photo', 'lb.close': 'Close', 'lb.prev': 'Previous photo', 'lb.next': 'Next photo',
};

/** Translate a script string, with {placeholders}. */
export function t(key, vars) {
  let s = UI[LANG][key] ?? UI.fr[key] ?? key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}

/** Apply English to the static page and wire the language switch. */
export function applyStatic() {
  document.querySelectorAll('.lang-switch button').forEach((b) => {
    b.classList.toggle('on', b.dataset.lang === LANG);
    b.setAttribute('aria-pressed', b.dataset.lang === LANG);
    b.addEventListener('click', () => {
      if (b.dataset.lang === LANG) return;
      try {
        localStorage.setItem('lang', b.dataset.lang);
        sessionStorage.setItem('scrollY', String(scrollY));
      } catch (e) { /* private mode */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', b.dataset.lang);
      location.replace(url);
    });
  });
  if (LANG !== 'en') return;
  document.title = STATIC_EN['meta.title'];
  document.querySelector('meta[name="description"]')?.setAttribute('content', STATIC_EN['meta.description']);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = STATIC_EN[el.dataset.i18n];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const v = STATIC_EN[el.dataset.i18nAria];
    if (v !== undefined) el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const v = STATIC_EN[el.dataset.i18nAlt];
    if (v !== undefined) el.setAttribute('alt', v);
  });
  // In English the glowing word comes first: "Ion thruster".
  const words = document.querySelectorAll('[data-i18n-title] .ht-word');
  if (words.length === 2) { words[0].classList.add('ht-glow'); words[1].classList.remove('ht-glow'); }
}
