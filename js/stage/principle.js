// Act II — how a gridded electrostatic thruster works: gel, capillary needles,
// Taylor cones, extraction and acceleration grids, ion beamlets and thrust.
import * as THREE from 'three';
import { createPlume, studioEnvironment, glowTexture, smooth, lerp, QUALITY, rand, frameOpposite } from './fx.js';

const ION = {
  cl: { name: 'Cl⁻', mass: 35.45, sign: -1, color: new THREE.Color('#74f2c4') },
  na: { name: 'Na⁺', mass: 22.99, sign: 1, color: new THREE.Color('#ffb45e') },
  xe: { name: 'Xe⁺', mass: 131.29, sign: 1, color: new THREE.Color('#b7a6ff') },
};
const E = 1.602176634e-19, U = 1.66053907e-27;
export const exhaustVelocity = (kV, ion) => Math.sqrt((2 * E * kV * 1000) / (ION[ion].mass * U));

const Y_EXTRACT = 0.45, Y_ACCEL = 1.15, Y_END = 10;

// Camera keyframes per panel: [position, target].
const SHOTS = [
  [new THREE.Vector3(6.5, 2.2, 8.5), new THREE.Vector3(0, -0.6, 0)],
  [new THREE.Vector3(3.4, -1.6, 4.6), new THREE.Vector3(0, -2.9, 0)],
  [new THREE.Vector3(2.7, -0.35, 3.7), new THREE.Vector3(0, 0.15, 0)],
  [new THREE.Vector3(-3.6, 2.6, 4.6), new THREE.Vector3(0, 1.0, 0)],
  [new THREE.Vector3(-4.6, 0.2, 13.2), new THREE.Vector3(0, -1.5, 0)],
];

function gridGeometry(radius, holeR, holes, thickness = 0.06) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  holes.forEach(([x, z]) => {
    const h = new THREE.Path();
    h.absarc(x, -z, holeR, 0, Math.PI * 2, true);
    shape.holes.push(h);
  });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 48 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);
  return geo;
}

export class PrincipleAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
    this.look = { bloom: 0.8, bloomRadius: 0.4, threshold: 0.9, exposure: 0.9, fade: 0, fadeColor: '#cfefff', vignette: 1 };
    this.progress = 0;
    this.labels = labels;
    this.kV = 22.2;
    this.ion = 'cl';
    this.mode = 'alternate';
    this.polarity = 1; // +1: grid positive, extracts Cl⁻
    this.polTimer = 0;
    this.onPolarity = null;
    this.enterTime = 0;

    const s = this.scene;
    s.background = new THREE.Color('#02040a');
    s.fog = new THREE.Fog('#02040a', 18, 45);

    // Backdrop: soft radial glow and a blueprint floor.
    const back = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vec2 c = vUv - vec2(0.5, 0.55);
          float g = exp(-dot(c, c) * 9.0);
          vec3 col = mix(vec3(0.002, 0.004, 0.01), vec3(0.015, 0.035, 0.07), g);
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthWrite: false, fog: false,
    }));
    back.position.set(0, 0, -16);
    this.back = back;
    s.add(back);
    const floor = new THREE.GridHelper(40, 80, '#1d3b66', '#0d1d36');
    floor.position.y = -5.2;
    floor.material.transparent = true;
    floor.material.opacity = 0.45;
    s.add(floor);

    // Lights.
    s.add(new THREE.HemisphereLight('#9cc7ff', '#0a0f1c', 0.25));
    const key = new THREE.DirectionalLight('#ffffff', 1.2);
    key.position.set(5, 8, 6);
    s.add(key);
    const rim = new THREE.DirectionalLight('#6fd6ff', 0.45);
    rim.position.set(-6, 2, -5);
    s.add(rim);

    const metal = new THREE.MeshStandardMaterial({ color: '#8a93a3', metalness: 1, roughness: 0.3 });
    const ceramic = new THREE.MeshStandardMaterial({ color: '#39404d', metalness: 0.1, roughness: 0.6 });

    // Emitters: 7 needles in a hexagon.
    this.emitters = [[0, 0]];
    for (let k = 0; k < 6; k++) this.emitters.push([Math.cos((k * Math.PI) / 3) * 1.0, Math.sin((k * Math.PI) / 3) * 1.0]);

    // Reservoir (alvéole) with the ionic gel.
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 2.8, 64, 1, true), new THREE.MeshPhysicalMaterial({
      color: '#bfe6ff', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.1, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
    }));
    cup.position.y = -3.0;
    s.add(cup);
    const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.1, 0.22, 64), ceramic);
    cupBase.position.y = -4.5;
    s.add(cupBase);
    const cupLip = new THREE.Mesh(new THREE.TorusGeometry(1.97, 0.05, 12, 96), ceramic);
    cupLip.rotation.x = Math.PI / 2;
    cupLip.position.y = -1.6;
    s.add(cupLip);
    this.gelMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */`
        uniform float uTime; varying vec3 vN; varying vec3 vP; varying vec3 vW;
        void main() {
          vec3 p = position;
          if (p.y > 0.9) p.y += 0.04 * sin(p.x * 5.0 + uTime * 1.3) * cos(p.z * 4.0 + uTime);
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vW = wp.xyz; vP = p; vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec3 vN; varying vec3 vP; varying vec3 vW;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float noise(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        void main() {
          vec3 v = normalize(cameraPosition - vW);
          float fres = pow(1.0 - abs(dot(normalize(vN), v)), 2.0);
          float n = noise(vP * 3.0 + vec3(0.0, uTime * 0.25, 0.0)) * 0.6 + noise(vP * 9.0 - uTime * 0.4) * 0.4;
          vec3 deep = vec3(0.01, 0.07, 0.08), bright = vec3(0.2, 0.75, 0.62);
          vec3 col = mix(deep, bright, n * 0.45 + fres * 0.5);
          float top = smoothstep(0.85, 1.0, vP.y);
          col += vec3(0.4, 1.0, 0.85) * top * 0.25;
          gl_FragColor = vec4(col, 0.92);
        }`,
      transparent: true,
    });
    const gel = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 2.0, 64, 8), this.gelMat);
    gel.position.y = -3.4;
    s.add(gel);
    this.gel = gel;

    // Insulating plate holding the needles.
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.16, 64), ceramic);
    plate.position.y = -1.45;
    s.add(plate);

    // Needles and Taylor cones.
    const needleGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.6, 16);
    needleGeo.translate(0, -1.3 - 0.1, 0);
    const coneGeo = new THREE.ConeGeometry(0.1, 0.2, 32, 1, true);
    coneGeo.translate(0, 0.0, 0);
    this.coneMat = new THREE.MeshStandardMaterial({ color: '#2f9c86', emissive: '#3fffd0', emissiveIntensity: 0.45, transparent: true, opacity: 0.85, roughness: 0.1 });
    this.tipGlow = [];
    const tipTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(180,255,240,.6)'], [1, 'rgba(100,255,220,0)']]);
    this.emitters.forEach(([x, z]) => {
      const n = new THREE.Mesh(needleGeo, metal);
      n.position.set(x, 0, z);
      s.add(n);
      const c = new THREE.Mesh(coneGeo, this.coneMat);
      c.position.set(x, -0.0, z);
      s.add(c);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: tipTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      g.position.set(x, 0.1, z);
      g.scale.setScalar(0.5);
      s.add(g);
      this.tipGlow.push(g);
    });

    // Grids.
    this.gridMats = [];
    const mkGrid = (y, holeR) => {
      const mat = new THREE.MeshStandardMaterial({ color: '#6d7584', metalness: 1, roughness: 0.48, emissive: new THREE.Color('#ff5a5a'), emissiveIntensity: 0 });
      const m = new THREE.Mesh(gridGeometry(2.3, holeR, this.emitters), mat);
      m.position.y = y;
      s.add(m);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.035, 10, 120), new THREE.MeshBasicMaterial({ color: '#ff5a5a', transparent: true, opacity: 0 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      s.add(ring);
      this.gridMats.push({ mat, ring });
      return m;
    };
    mkGrid(Y_EXTRACT, 0.24);
    mkGrid(Y_ACCEL, 0.2);
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3 + 0.5;
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, Y_ACCEL - Y_EXTRACT, 16), ceramic);
      sp.position.set(Math.cos(a) * 2.05, (Y_ACCEL + Y_EXTRACT) / 2, Math.sin(a) * 2.05);
      s.add(sp);
      const sp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, Y_EXTRACT + 1.4, 16), ceramic);
      sp2.position.set(Math.cos(a) * 2.05, (Y_EXTRACT - 1.4) / 2, Math.sin(a) * 2.05);
      s.add(sp2);
    }

    // Electric field lines from each tip to the grid.
    this.fieldMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#ff7a7a') }, uDir: { value: 1 }, uOpacity: { value: 0 } },
      vertexShader: 'attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */`
        uniform float uTime, uDir, uOpacity; uniform vec3 uColor; varying float vT;
        void main() {
          float dash = smoothstep(0.35, 0.5, fract(vT * 7.0 - uTime * 1.6 * uDir)) * smoothstep(0.85, 0.6, fract(vT * 7.0 - uTime * 1.6 * uDir));
          float a = (0.25 + dash) * uOpacity * (1.0 - vT * 0.4);
          gl_FragColor = vec4(uColor * a, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const fpos = [], ft = [];
    this.emitters.forEach(([x, z]) => {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const t = i / 24;
          const r = Math.sin(t * Math.PI * 0.5) * 0.42;
          const y = 0.1 + t * (Y_ACCEL - 0.1);
          pts.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r, t]);
        }
        for (let i = 0; i < pts.length - 1; i++) {
          fpos.push(...pts[i].slice(0, 3), ...pts[i + 1].slice(0, 3));
          ft.push(pts[i][3], pts[i + 1][3]);
        }
      }
    });
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
    fgeo.setAttribute('aT', new THREE.Float32BufferAttribute(ft, 1));
    s.add(new THREE.LineSegments(fgeo, this.fieldMat));

    // Beamlets above the accelerator grid.
    this.beams = this.emitters.map(([x, z]) => {
      const b = createPlume({ length: Y_END - Y_ACCEL, radius: 0.1, spread: 0.045, count: 120, speed: 0.6, size: 14, color: '#74f2c4', core: '#ecfffa' });
      b.rotation.x = -Math.PI / 2;
      b.position.set(x, Y_ACCEL + 0.05, z);
      s.add(b);
      return b;
    });

    // Individual ions (CPU): extraction, acceleration, focusing through the holes.
    this.N = Math.round(1600 * Math.max(0.4, QUALITY.particles));
    this.p = new Float32Array(this.N * 3);
    this.v = new Float32Array(this.N * 3);
    this.alive = new Uint8Array(this.N);
    this.home = new Uint8Array(this.N);
    this.col = new Float32Array(this.N * 3);
    this.base = new Float32Array(this.N * 3);
    const igeo = new THREE.BufferGeometry();
    igeo.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    igeo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.ionPts = new THREE.Points(igeo, new THREE.PointsMaterial({
      size: 0.075, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    this.ionPts.frustumCulled = false;
    s.add(this.ionPts);
    this.spawnAcc = 0;
    this.cursor = 0;

    // Reaction force arrow.
    const arrow = new THREE.Group();
    const amat = new THREE.MeshStandardMaterial({ color: '#ff6b3d', emissive: '#ff4a1a', emissiveIntensity: 1.6, roughness: 0.4 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 24), amat);
    shaft.position.y = -0.7;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 32), amat);
    head.position.y = -1.7;
    head.rotation.x = Math.PI;
    arrow.add(shaft, head);
    arrow.position.y = -4.9;
    arrow.scale.setScalar(0.001);
    this.arrow = arrow;
    s.add(arrow);

    // Floating dust for depth.
    const dn = 600;
    const dpos = new Float32Array(dn * 3);
    for (let i = 0; i < dn; i++) dpos.set([rand(-14, 14), rand(-6, 10), rand(-12, 8)], i * 3);
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    this.dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ size: 0.03, color: '#7aa6ff', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.add(this.dust);

    // Labels.
    const L = labels;
    this.lab = {
      gel: L.add('Gel ionique · eau salée + polyacrylate', new THREE.Vector3(1.9, -3.0, 0.4)),
      needle: L.add('Aiguilles capillaires', new THREE.Vector3(1.0, -0.9, 0.0)),
      cone: L.add('Cône de Taylor', new THREE.Vector3(0.1, 0.12, 0)),
      extract: L.add("Grille d'extraction", new THREE.Vector3(2.3, Y_EXTRACT, 0), { side: 'left' }),
      accel: L.add("Grille d'accélération · ±22 kV", new THREE.Vector3(2.3, Y_ACCEL, 0)),
      beam: L.add("Faisceau d'ions · 347 km/s", new THREE.Vector3(0.6, 6.5, 0)),
      thrust: L.add('Poussée : réaction', new THREE.Vector3(0.3, -6.4, 0), { warm: true }),
    };

    this.tmpA = new THREE.Vector3();
    this.tmpB = new THREE.Vector3();
  }

  init(renderer) {
    this.scene.environment = studioEnvironment(renderer);
    this.scene.environmentIntensity = 0.35;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 52 : 34;
    this.camera.updateProjectionMatrix();
    this.portrait = w < h;
    this.w = w; this.h = h;
  }

  setProgress(p) { this.progress = p; }
  setVoltage(kV) { this.kV = kV; }
  setIon(ion) { this.ion = ion; }
  enter() { this.enterAt = performance.now(); }
  leave() { this.labels.hideAll(); }

  speciesNow() {
    if (this.mode === 'alternate') return this.polarity > 0 ? 'cl' : 'na';
    return this.ion;
  }

  update(dt, t) {
    const p = this.progress;
    this.enterTime = (performance.now() - (this.enterAt ?? performance.now())) / 1000;
    // Panel 5 is the lab: the visitor picks the ion, no alternation.
    this.mode = p > 0.84 ? 'lab' : 'alternate';

    // Polarity alternation every 2.6 s.
    this.polTimer += dt;
    if (this.polTimer > 2.6) {
      this.polTimer = 0;
      this.polarity *= -1;
      this.onPolarity?.(this.polarity);
    }
    const sp = this.speciesNow();
    const ion = ION[sp];
    const gridPositive = ion.sign < 0;
    const gridCol = gridPositive ? new THREE.Color('#ff6a6a') : new THREE.Color('#6fd6ff');
    const on = smooth(0.08, 0.3, p) * smooth(0, 1.2, this.enterTime);
    this.gridMats.forEach(({ mat, ring }, i) => {
      mat.emissive.lerp(gridCol, 0.12);
      mat.emissiveIntensity = on * (i ? 0.12 : 0.05);
      ring.material.color.lerp(gridCol, 0.12);
      ring.material.opacity = on * (i ? 0.9 : 0.4);
    });
    this.fieldMat.uniforms.uColor.value.lerp(gridCol, 0.1);
    this.fieldMat.uniforms.uDir.value = gridPositive ? 1 : -1;
    this.fieldMat.uniforms.uOpacity.value = on * (1 - smooth(0.85, 1, p) * 0.6);
    this.fieldMat.uniforms.uTime.value = t;
    this.gelMat.uniforms.uTime.value = t;
    this.coneMat.emissive.lerp(ion.color, 0.1);
    this.tipGlow.forEach((g, i) => {
      g.material.color.lerp(ion.color, 0.1);
      g.scale.setScalar((0.22 + 0.08 * Math.sin(t * 9 + i)) * (0.4 + on));
    });

    // Speed scales with the exhaust velocity (sqrt of V/m).
    const ve = exhaustVelocity(this.kV, sp);
    const vis = 4.2 * (ve / 347000) ** 0.75;
    this.beams.forEach((b) => {
      b.userData.uniforms.uColor.value.lerp(ion.color, 0.1);
      b.userData.uniforms.uSpeed.value = 0.25 + vis * 0.12;
      b.userData.setIntensity(on * 0.85 * smooth(0.3, 0.6, p + 0.15));
      b.userData.update(t);
    });
    this.stepIons(dt, vis, ion.color, on);

    // Thrust arrow grows in the last panels.
    const ar = smooth(0.7, 0.85, p);
    this.arrow.scale.setScalar(Math.max(0.001, ar * (0.85 + 0.15 * Math.min(1, vis / 4.2))));

    // Camera between shots.
    const seg = p * (SHOTS.length - 1);
    const i = Math.min(SHOTS.length - 2, Math.floor(seg));
    const f = smooth(0.15, 0.85, seg - i);
    const shots = this.portrait ? SHOTS.map(([a, b]) => [a.clone().multiplyScalar(1.35).setX(a.x * 0.8), b.clone().setX(0)]) : SHOTS;
    this.tmpA.lerpVectors(shots[i][0], shots[i + 1][0], f);
    this.tmpB.lerpVectors(shots[i][1], shots[i + 1][1], f);
    const orbit = Math.sin(t * 0.15) * 0.25;
    this.tmpA.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit * (1 - smooth(0.4, 0.6, p) * 0.7));
    this.camera.position.copy(this.tmpA);
    this.camera.lookAt(this.tmpB);
    frameOpposite(this.camera, p, [-1, 1, -1, 1, -1], this.w, this.h, 0.16);
    this.back.lookAt(this.camera.position);

    // Fade in from the white flash of Act I.
    this.look.fade = 1 - smooth(0, 0.6, this.enterTime);

    // Labels per panel.
    const show = (k, a, b) => this.labels.show(this.lab[k], p >= a && p < b);
    show('gel', 0.17, 0.33);
    show('needle', 0.2, 0.42);
    show('cone', 0.42, 0.58);
    show('extract', 0.62, 0.78);
    show('accel', 0.62, 0.84);
    show('beam', 0.8, 1.01);
    show('thrust', 0.84, 1.01);
    this.labels.update(this.camera, innerWidth, innerHeight);
    this.lab.accel.el.querySelector('.s-text').textContent = `Grille d'accélération · ${gridPositive ? '+' : '−'}${this.kV.toFixed(0)} kV`;
    this.lab.beam.el.querySelector('.s-text').textContent = `Faisceau de ${ion.name} · ${Math.round(ve / 1000)} km/s`;
  }

  stepIons(dt, vis, color, on) {
    const { p, v, alive, home, col, base, N } = this;
    // Emission.
    this.spawnAcc += dt * 650 * on * Math.max(0.4, QUALITY.particles);
    while (this.spawnAcc > 1) {
      this.spawnAcc -= 1;
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % N;
      const e = (Math.random() * this.emitters.length) | 0;
      const [x, z] = this.emitters[e];
      alive[i] = 1;
      home[i] = e;
      p[i * 3] = x + rand(-0.01, 0.01);
      p[i * 3 + 1] = 0.1;
      p[i * 3 + 2] = z + rand(-0.01, 0.01);
      v[i * 3] = rand(-0.5, 0.5);
      v[i * 3 + 1] = rand(0.05, 0.25);
      v[i * 3 + 2] = rand(-0.5, 0.5);
      base[i * 3] = color.r; base[i * 3 + 1] = color.g; base[i * 3 + 2] = color.b;
    }
    const acc = vis * vis * 2.4;
    for (let i = 0; i < N; i++) {
      if (!alive[i]) { p[i * 3 + 1] = -999; continue; }
      const k = i * 3;
      const y = p[k + 1];
      const [hx, hz] = this.emitters[home[i]];
      if (y < Y_ACCEL) {
        v[k + 1] += acc * dt * (y < Y_EXTRACT ? 1.6 : 1.0);
        // Electrostatic focusing towards the hole axis.
        v[k] += (hx - p[k]) * 9 * dt - v[k] * 2.5 * dt;
        v[k + 2] += (hz - p[k + 2]) * 9 * dt - v[k + 2] * 2.5 * dt;
      } else {
        v[k] *= 0.995; v[k + 2] *= 0.995;
      }
      p[k] += v[k] * dt;
      p[k + 1] += v[k + 1] * dt;
      p[k + 2] += v[k + 2] * dt;
      const fade = 1 - Math.min(1, Math.max(0, (p[k + 1] - 6) / 4));
      col[k] = base[k] * fade; col[k + 1] = base[k + 1] * fade; col[k + 2] = base[k + 2] * fade;
      if (p[k + 1] > Y_END) alive[i] = 0;
    }
    this.ionPts.geometry.attributes.position.needsUpdate = true;
    this.ionPts.geometry.attributes.color.needsUpdate = true;
  }
}
