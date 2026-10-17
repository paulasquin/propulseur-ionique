// English version of the editorial content (same order and ids as content.js).

export const EXPERIMENTS_EN = {
  pile: {
    date: '6 March 2015', year: 'Year 1',
    title: 'A 9 V battery in a vacuum',
    question: 'Can an ordinary battery power the thruster under a bell jar without swelling or heating up?',
    body: [
      'The thrust of an ion thruster is so weak, and air such a good insulator, that everything has to happen under a vacuum bell jar. An external power supply would have required stiff cables that would have braked the structure: the energy source had to be on board.',
      'Unable to find any record of a battery tested in a vacuum, I tried it myself: the battery alone under the bell jar, with the rotary vane pump bringing the pressure down in steps — 800, 600, 300 mbar, then just a few millibars. After each step I checked its temperature, since any heating would have revealed an abnormal chemical reaction.',
    ],
    result: 'No swelling, no heating: the battery remained perfectly stable. The on-board power source was validated.',
    limit: 'Voltage and behaviour under load were not measured during this quick first test.',
    captions: ['The 9 V battery alone under the bell jar'],
  },
  cascade: {
    date: '6 March 2015', year: 'Year 1',
    title: 'The cascade voltage multiplier',
    question: 'How do you get from a few volts to the high voltage needed to extract and accelerate ions?',
    body: [
      'A Greinacher (or Cockcroft-Walton) multiplier with n stages multiplies an AC input voltage by 2n. Starting from four 9 V batteries (36 V), reaching 1,000 V would have taken 14 stages: 28 capacitors and 28 diodes.',
      'I first studied a voltage quadrupler (2 stages): four 220 nF capacitors, four 5.6 V Zener diodes and a function generator delivering a ±0.5 V square wave. An on-board chopper would indeed produce a square wave more easily than a sine wave.',
    ],
    result: 'Above 500 Hz, the output reaches 2 V (1.7 V on the multimeter) for a ±0.5 V input. At 20 Hz the circuit collapses: 0.8 V and an unstable signal.',
    limit: 'Lesson learned: a high switching frequency is essential.',
    captions: ['Two-stage multiplier schematic (Wikipedia)', 'Square-wave generator and oscilloscope: 2 V at the output', 'The quadrupler on a breadboard', 'At 20 Hz, the mean voltage drops to 0.8 V'],
  },
  conductivite: {
    date: '20 March 2015', year: 'Year 1',
    title: 'The conductivity of salt water',
    question: 'Can the ejected ions be weighed using the conductivity of the solution alone?',
    body: [
      'To estimate the mass of salt ejected, the idea was to measure the conductivity of the salt water before and after running the thruster. That first required knowing how conductivity relates to concentration.',
      'Dissolving 20.001 g of salt in 50 mL of distilled water gives a saturated solution. I then added distilled water from a burette, recording the conductivity at 25 °C with a calibrated conductivity meter.',
    ],
    result: 'A saturation plateau, unstable readings between 350 and 250 g/L, then an almost linear trend: 0.039 S/m per g/L. Concentrations would have to stay below 250 g/L.',
    captions: [],
  },
  ebullition: {
    date: '24 March 2015', year: 'Year 1',
    title: 'A solution in a vacuum',
    question: 'What happens to the ionic liquid when the pressure collapses?',
    body: [
      'The capillary tubes that carry the liquid up to the grids cannot tolerate bubbles. Yet a liquid placed in a vacuum starts to boil, and its dissolved gas escapes.',
      'As soon as the pump starts, the water boils: first a few fine bubbles, then larger and larger ones, until a genuine cloud of vapour forms. The effect subsides after a few tens of seconds and the water temperature drops. On a second pump-down, not a single bubble appears.',
    ],
    result: 'The propellant must be degassed under the bell jar before being loaded into the structure.',
    captions: [],
  },
  elevateur: {
    date: '4 May 2015', year: 'Year 1',
    title: 'A 3 V to 7 kV voltage booster',
    question: 'Can the module from an electric fly swatter supply the high voltage?',
    body: [
      'On the advice of two friends, I bought three 3 V to 7 kV boost step-up modules (under €10 on eBay): enough to test several ways of alternating the polarity, and to survive a handling mistake.',
      'Since the laboratory voltmeters could not handle more than 1,000 V, the measurement went through a voltage divider. The larger the resistors relative to the internal resistance of the module, the closer the reading came to theory (630 to 636 V expected, depending on the setup).',
    ],
    result: 'No heating throughout the test and a stable output voltage: this is the solution I kept.',
    captions: ['The 3 V to 7 kV boost step-up module', 'The voltage divider', 'Setup for test no. 2'],
  },
  plateforme: {
    date: '20 May 2015', year: 'Year 1',
    title: '3D printing: the test platform',
    question: 'How do you hold a needle, a probe and a stirrer in the cramped space of a bell jar?',
    body: [
      'No off-the-shelf part met the requirements: immerse the needle so that only its tip protrudes (maximising capillary rise, whatever its diameter), accommodate a conductivity probe and a magnetic stirrer, hold the needle against the current, and fit under the bell jar.',
      'Designed in SolidWorks, the part fits within a 40 mm cube. Grooves let the solution flow into the needle to keep its concentration uniform. Printing took 1 h 40, filmed as a time-lapse with a GoPro (one frame every 5 seconds).',
    ],
    result: 'My first 3D-printed test bench. Rotate it and switch to X-ray mode: an inscription is hidden on its back face.',
    captions: ['SolidWorks rendering of the platform', 'Top view: the probe port on the left, the needle on the right', 'The needle clamp and its grooves', 'The printed part with the needle in place'],
  },
  extraction: {
    date: '17 June 2015', year: 'Year 1',
    title: 'Extracting the ions',
    question: 'Can ions really be torn away from the meniscus?',
    body: [
      'The first major experiment: apply +5,000 V to the salt-water meniscus at the tip of the needle for 30 minutes. Without alternating the polarity, only chloride ions (Cl⁻) could be extracted.',
      'The conductivity first decreased, as if a few milligrams of ions had left the solution… before shooting back up. Either the conductivity meter lacked precision, or the solution, charged by the extraction of ions of a single sign, skewed the measurement. Repeated a few days later, the experiment gave equally inconsistent values.',
    ],
    result: 'No conclusive result, but valuable lessons: the solution reabsorbs gas as soon as the bell jar is opened, degassing sprays salt water everywhere, and the bell jar is too narrow for a support stand.',
    captions: ['The setup on the base of the bell jar'],
  },
  gel: {
    date: '23 September 2015', year: 'Year 2',
    title: 'The ionic gel',
    question: 'How do you stop a liquid from boiling in a vacuum?',
    body: [
      'The answer came from a memory of the Fête de la Science in Lyon: the super-absorbent crystals found in disposable nappies. This sodium polyacrylate is also used to retain water around the roots of plants.',
      'As my school had none in stock, I extracted it directly from nappies. It absorbs salt water less well than pure water, but more than enough. And the powder can be recovered much like baking meringues: in an oven at 50 °C with the door ajar.',
    ],
    result: 'In a vacuum, the gel stays moist and perfectly calm: no boiling at all. It lets the salt water seep to the surface, where the ions can be accelerated.',
    captions: ['Opened nappy: separating the cotton from the polyacrylate', 'Sodium polyacrylate', 'Water + polyacrylate = moist gel', 'Salt-water gel', 'In a vacuum: no reaction, no boiling'],
  },
  propulseur: {
    date: 'September — October 2015', year: 'Year 2',
    title: '3D printing: thruster #2.1',
    question: 'A single part to carry everything, and turn with almost no friction.',
    body: [
      'The requirements: house the ionic gel and the acceleration grids, carry the batteries and voltage boosters, and offer several low-friction pivots — a glass-on-needle contact inspired by the Crookes radiometer, a thread suspension, or a chain of magnetic balls in the style of a Supermag spinning top.',
      'To make the structure balance by itself, its centre of gravity sits below the contact point. Finally, a base deflects the airflow inside the bell jar and holds the mast and needle in a circular groove.',
    ],
    result: 'The original 3D model, exactly as I drew it in SolidWorks.',
    captions: ['Thruster #2.1', 'See-through view', 'View from below', 'The base', 'Printed, wired, batteries in place', 'The needle on its brass weight'],
  },
  frottements: {
    date: '14 October 2015', year: 'Year 2',
    title: 'Rotational dynamics: Crookes versus Supermag',
    question: 'Which pivot slows the structure down the least?',
    body: [
      'To characterise friction, I spin the structure and time every revolution. The decay of the rotation frequency, combined with the moment of inertia given by SolidWorks, yields the friction torque; the readings are then processed with a Python program.',
      'In a vacuum, the result is puzzling: friction appears dry at high speed and viscous at low speed. Then, with the thrusters running for 52 minutes, the camera records a rotation of 4°… in the wrong direction, most likely due to vibrations. The thrust is too weak to overcome static friction.',
    ],
    result: 'The Supermag pivot has a third of the friction, but I kept the glass-on-needle contact: same order of magnitude, and far more compact, since the bell jar is too small for a support stand.',
    captions: ['The Supermag pivot: steel balls and a neodymium magnet', 'Supermag pivot (SolidWorks)', 'Glass-on-needle pivot (SolidWorks)', 'The prototype under the bell jar'],
  },
  poussee: {
    date: 'March 2016', year: 'Year 2',
    title: 'Measuring the thrust',
    question: 'How do you measure a force weaker than static friction?',
    body: [
      'The trick: never let the structure come to rest. I spin it up under the bell jar with the thrusters disconnected, and a webcam records how its rotation decays. Then I repeat the run with the thrusters connected.',
      'The difference between the two decelerations, together with the moment of inertia and the lever arm, gives the force of the four thruster units, divided by four for a single unit. Several runs are averaged, and an uncertainty analysis completes the result.',
    ],
    result: 'F = 6.7 µN ± 2.3 µN per thruster unit.',
    captions: ['Rotating in a vacuum', 'A thruster unit: the acceleration grid', 'The wired prototype, seen from above'],
  },
};

export const TIMELINE_EN = [
  { date: 'Autumn 2014', title: 'First ideas', text: 'Why not an ion thruster? The first sketches even predate the official theme.' },
  { date: 'February 2015', title: 'The theme is announced', text: '“Structures: organisation, complexity, dynamics” — a perfect fit for the project.' },
  { date: 'March — June 2015', title: 'Feasibility study', text: 'First year: battery, high voltage, salt water, vacuum. And the launch of this journal.' },
  { date: 'September 2015', title: 'The ionic gel', text: 'Second year: polyacrylate from nappies solves the vacuum problem.' },
  { date: 'October 2015', title: 'Prototype #2.1', text: 'Printed in 3D, it carries everything: gel, grids, batteries, boosters.' },
  { date: 'March 2016', title: 'The measurement', text: '6.7 µN per thruster unit, to within 2.3 µN.' },
  { date: '29 June 2016', title: 'The defence', text: 'Banque PT entrance exam, IUT Paris Descartes: ten minutes to tell the whole story.' },
  { date: 'September 2016', title: 'Centrale Nantes', text: 'The project turned out to be “the best subject of my preparatory years”.' },
];

export const RESULTS_EN = [
  { label: 'measured thrust per unit', note: '± 2.3 µN' },
  { label: 'acceleration voltage', note: '9 V boosted to 22,225 V' },
  { label: 'exhaust velocity of Cl⁻ ions', note: 'theoretical' },
  { label: 'specific impulse', note: 'theoretical' },
  { label: 'electrical power', note: 'a single 9 V battery' },
  { label: 'years of thrust from 10 g of salt', note: 'mass flow 1.2·10⁻¹¹ kg/s' },
];

export const ISP_EN = [
  { name: 'Chemical rocket engine', detail: 'liquid oxygen / liquid hydrogen' },
  { name: 'Hall-effect thruster', detail: 'PPS-1350, SMART-1 probe' },
  { name: 'Gridded ion engine', detail: 'NSTAR, Deep Space 1 and Dawn' },
  { name: 'Gridded ion engine', detail: 'NEXT-C, DART mission' },
  { name: 'My thruster (theoretical)', detail: 'Cl⁻ ions accelerated through 22 kV' },
];

export const MISSIONS_EN = [
  'First gridded ion engine used as the main propulsion of a probe (NSTAR, running on xenon).',
  'Reached the Moon using a French Hall-effect thruster, the PPS-1350.',
  'Microwave ion engines, and samples returned from asteroid Itokawa in 2010.',
  'First spacecraft to orbit two extraterrestrial bodies: Vesta, then Ceres.',
  'An ion engine continuously compensated for atmospheric drag at very low altitude.',
  'Colloid micro-thrusters producing a few micronewtons: the same order of magnitude as my prototype.',
  'Four T6 ion engines to reach Mercury.',
  'Thousands of satellites fitted with Hall-effect thrusters running on krypton, then argon.',
  'First iodine-fuelled ion thruster tested in orbit, on a CubeSat — designed by a French start-up.',
  'Hall-effect thrusters on their way to the metal-rich asteroid Psyche.',
];

export const SLIDES_EN = [
  { title: 'The subject', text: 'Applications (trajectory correction, CubeSats), how a gridded electrostatic thruster works, and its strengths: efficiency, cost, endurance.' },
  { title: 'The approach', text: 'Feasibility study, theoretical model and prototype developed in parallel, then compared. Two thruster units at the ends of the arms of a structure guided in rotation.' },
  { title: 'The structure', text: 'A 3D-printed prototype: four thruster units, bays for the batteries and the voltage booster, and shapes designed to test several rotary guides.' },
  { title: 'The components', text: 'The voltage booster, a step-up chopper taken from an electric fly swatter, and the propellant: Na⁺ and Cl⁻ ions in salt water gelled with sodium polyacrylate.' },
  { title: 'Supermag pivot', text: 'Magnetised steel balls in series. The decay of the rotation and the moment of inertia give the friction torque.' },
  { title: 'Crookes pivot', text: 'Glass-on-needle contact: three times the friction of Supermag, but the same order of magnitude and far less bulky. This is the solution I kept.' },
  { title: 'The thrust', text: 'Decelerations compared with and without thrusters: 6.7 µN per unit, with an uncertainty of 2.3 µN.' },
  { title: 'The theoretical model', text: 'Energy chain and kinetic energy theorem applied to chloride ions: an exhaust velocity of 347 km/s and a theoretical thrust of 11 µN.' },
  { title: 'Performance', text: 'Mass flow rate, a specific impulse of 36,000 s, and a comparison: for 500 N, a liquid-propellant engine would burn 0.18 kg/s, an ion thruster 0.0014 kg/s.' },
  { title: 'Possible missions', text: 'Virtually unlimited electrical endurance thanks to solar power, and 27 years of thrust from 10 g of salt: deep-space exploration, trajectory correction, constellations.' },
  { title: 'Appendix: uncertainties', text: 'Propagation of the uncertainties on the angular accelerations, the lever arm and the moment of inertia.' },
  { title: 'Appendix: the chopper', text: 'The two phases of the step-up chopper and the duty cycle α = 0.9996 that takes 9 V up to 22 kV.' },
  { title: 'Appendix: early prototypes', text: 'First printed parts, the conductivity of salt water and the first extraction attempt.' },
  { title: 'Appendix: rotary guide', text: 'Integration under the bell jar and balance of the rotary guide.' },
  { title: 'Appendix: dimensions', text: 'Dimensional check of the exhaust velocity and specific impulse formulas.' },
];
