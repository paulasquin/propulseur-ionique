// Act III — the real prototype #2.1, loaded from the original SolidWorks STL
// exports: 3D-print reveal, anatomy, exploded view, needle pivot, ignition,
// bell jar and a replay of the measured rotation.
import * as THREE from 'three';
import { createPlume, studioEnvironment, smooth, lerp, clamp01, easeInOut, glowTexture, frameOpposite } from './fx.js';
import { MEASURES } from '../measures.js';
import { t as tr } from '../i18n.js';

const MM = 0.1; // scene unit = 1 cm
const P = 1 / 7; // one panel of the act
const LAYER = 0.2; // mm

// Vertical stack (cm): socle, brass weight, needle, watch glass in the dome.
const PIED_H = 2.0, BRASS_H = 1.85, BRASS_R = 2.7, NEEDLE_L = 5.9, GLASS_Y = 3.1;
const CROIX_Y = PIED_H + BRASS_H + NEEDLE_L - GLASS_Y;

function printable(material) {
  material.userData.uPrint = { value: 1000 };
  material.userData.uGlow = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPrint = material.userData.uPrint;
    shader.uniforms.uGlow = material.userData.uGlow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLocalY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalY = position.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLocalY;\nuniform float uPrint;\nuniform float uGlow;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vLocalY > uPrint) discard;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.975 + 0.025 * sin(vLocalY * 12.566);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float band = smoothstep(1.6, 0.0, uPrint - vLocalY) * uGlow;
        totalEmissiveRadiance += mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.85, 0.6), band) * band * 2.2;`);
  };
  return material;
}

export class PrototypeAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
    this.look = { bloom: 0.5, bloomRadius: 0.4, threshold: 0.95, exposure: 0.85, fade: 0, vignette: 1 };
    this.progress = 0;
    this.labels = labels;
    this.ready = false;
    this.angle = 0;
    this.onMeasure = null;
    this.onPrint = null;
    this.onPressure = null;

    const s = this.scene;
    s.background = new THREE.Color('#04060c');
    s.fog = new THREE.Fog('#04060c', 70, 160);

    // Floor with a soft spotlight pool.
    const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          vec3 col = mix(vec3(0.05, 0.075, 0.12), vec3(0.012, 0.016, 0.03), smoothstep(0.0, 0.5, d));
          float ring = smoothstep(0.004, 0.0, abs(d - 0.2)) * 0.25 + smoothstep(0.003, 0.0, abs(d - 0.32)) * 0.12;
          col += vec3(0.25, 0.6, 1.0) * ring * 0.4;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    s.add(floor);
    const shadowCatcher = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.ShadowMaterial({ opacity: 0.45 }));
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = -0.01;
    shadowCatcher.receiveShadow = true;
    s.add(shadowCatcher);

    s.add(new THREE.HemisphereLight('#bcd4ff', '#0b0f19', 0.3));
    const key = new THREE.DirectionalLight('#fff5ea', 1.7);
    key.position.set(18, 34, 22);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -20;
    key.shadow.camera.right = key.shadow.camera.top = 20;
    key.shadow.camera.near = 10; key.shadow.camera.far = 90;
    key.shadow.bias = -0.0005;
    key.shadow.radius = 4;
    s.add(key);
    const rim = new THREE.DirectionalLight('#7fc8ff', 1.1);
    rim.position.set(-20, 12, -18);
    s.add(rim);

    this.root = new THREE.Group();
    s.add(this.root);

    // Print bed and nozzle (panel 1).
    const bed = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 26), new THREE.MeshStandardMaterial({ color: '#0d1219', metalness: 0.3, roughness: 0.55, envMapIntensity: 0.25 }));
    plate.position.y = -0.2;
    plate.receiveShadow = true;
    bed.add(plate);
    const bedGrid = new THREE.GridHelper(26, 26, '#2c4e7a', '#1a2c45');
    bedGrid.position.y = 0.01;
    bed.add(bedGrid);
    this.bed = bed;
    this.root.add(bed);
    const nozzle = new THREE.Group();
    const block = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.8), new THREE.MeshStandardMaterial({ color: '#8a9099', metalness: 1, roughness: 0.35 }));
    block.position.y = 1.9;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 24), new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 1, roughness: 0.25 }));
    tip.rotation.x = Math.PI;
    tip.position.y = 0.75;
    const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3, 24), new THREE.MeshStandardMaterial({ color: '#3a3f47', metalness: 0.8, roughness: 0.4 }));
    sink.position.y = 4.1;
    const hot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,240,210,1)'], [0.3, 'rgba(255,140,60,.5)'], [1, 'rgba(255,90,30,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    hot.scale.setScalar(1.6);
    hot.position.y = 0.25;
    nozzle.add(block, tip, sink, hot);
    nozzle.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.nozzle = nozzle;
    this.root.add(nozzle);

    // Procedural parts: watch glass, needle, brass weight.
    this.glass = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 64, 16, 0, Math.PI * 2, 0, Math.asin(3.0 / 5.2)),
      new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.35, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2 }),
    );
    this.glassH = 5.2 - Math.sqrt(5.2 * 5.2 - 9);
    this.glass.renderOrder = 3;
    this.root.add(this.glass);
    const steel = new THREE.MeshStandardMaterial({ color: '#c7ccd4', metalness: 1, roughness: 0.18, envMapIntensity: 3 });
    const needle = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, NEEDLE_L - 0.45, 20), steel);
    shaft.position.y = (NEEDLE_L - 0.45) / 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.45, 20), steel);
    point.position.y = NEEDLE_L - 0.225;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.25, 20), steel);
    collar.position.y = 0.12;
    needle.add(shaft, point, collar);
    needle.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.needle = needle;
    this.root.add(needle);
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(BRASS_R, BRASS_R, BRASS_H, 64), new THREE.MeshStandardMaterial({ color: '#d9ad5f', metalness: 0.75, roughness: 0.32, envMapIntensity: 3 }));
    brass.geometry.translate(0, BRASS_H / 2, 0);
    brass.castShadow = true;
    this.brass = brass;
    this.root.add(brass);

    // Bell jar, its rubber base and the pump hose.
    const prof = [];
    const Rj = 11.5, Hj = 27;
    prof.push(new THREE.Vector2(Rj + 0.6, 0), new THREE.Vector2(Rj + 0.6, 0.6), new THREE.Vector2(Rj, 0.8));
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 0.5;
      prof.push(new THREE.Vector2(Rj * Math.cos(a), Hj - 8 + Math.sin(a) * 8 + (i === 0 ? 0 : 0)));
    }
    prof.splice(3, 0, new THREE.Vector2(Rj, Hj - 8));
    const jarGeo = new THREE.LatheGeometry(prof.map((v) => new THREE.Vector2(Math.max(0.01, v.x), v.y)), 96);
    this.jarMat = new THREE.MeshPhysicalMaterial({ color: '#e4f3ff', metalness: 0, roughness: 0.03, transparent: true, opacity: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.8 });
    this.jar = new THREE.Group();
    const jarMesh = new THREE.Mesh(jarGeo, this.jarMat);
    jarMesh.renderOrder = 4;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 16), this.jarMat);
    knob.position.y = Hj + 0.8;
    knob.renderOrder = 4;
    this.jar.add(jarMesh, knob);
    this.jar.position.y = 0;
    this.root.add(this.jar);
    this.jarBase = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.4, 1.2, 64), new THREE.MeshStandardMaterial({ color: '#15171c', roughness: 0.85, metalness: 0 }));
    this.jarBase.position.y = -0.59;
    this.jarBase.receiveShadow = true;
    this.root.add(this.jarBase);
    const hoseCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(12, -0.4, 4), new THREE.Vector3(20, -0.5, 9), new THREE.Vector3(30, -0.5, 4), new THREE.Vector3(42, -0.5, -8)]);
    this.hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 64, 0.7, 16), new THREE.MeshStandardMaterial({ color: '#c8322a', roughness: 0.45, metalness: 0, transparent: true, opacity: 0 }));
    this.root.add(this.hose);

    this.tmp = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  init(renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.environment = studioEnvironment(renderer);
    this.scene.environmentIntensity = 0.32;
  }

  /** Attach the GLB meshes once loaded. */
  setModels({ croix, pied }) {
    const ivory = () => printable(new THREE.MeshPhysicalMaterial({ color: '#d8cfbc', roughness: 0.55, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.3, sheenColor: new THREE.Color('#fff4e0'), side: THREE.DoubleSide }));
    this.croixMat = ivory();
    this.croixMesh = croix;
    croix.material = this.croixMat;
    croix.castShadow = true;
    croix.receiveShadow = true;
    croix.scale.setScalar(MM);
    this.croix = new THREE.Group();
    this.croix.add(croix);
    this.root.add(this.croix);

    pied.material = new THREE.MeshPhysicalMaterial({ color: '#d2cab8', roughness: 0.62, clearcoat: 0.1 });
    pied.scale.setScalar(MM);
    pied.castShadow = true;
    pied.receiveShadow = true;
    this.pied = pied;
    this.root.add(pied);

    // Four ion plumes, tangential, at the grid face of each propulsion unit.
    this.plumes = [];
    this.arrows = [];
    const amat = new THREE.MeshStandardMaterial({ color: '#ff6b3d', emissive: '#ff4a1a', emissiveIntensity: 1.8 });
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const r = 6.5, yy = 1.5;
      const pos = new THREE.Vector3(Math.cos(a) * r, yy, Math.sin(a) * r);
      const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const plume = createPlume({ length: 18, radius: 0.85, spread: 0.1, count: 700, speed: 0.45, size: 55, color: '#7fd6ff', glow: 0.22 });
      plume.position.copy(pos).addScaledVector(tangent, -1.55);
      plume.lookAt(plume.position.clone().addScaledVector(tangent, -1));
      this.croix.add(plume);
      this.plumes.push(plume);
      const arrow = new THREE.Group();
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 16), amat);
      sh.position.y = 1.5;
      const hd = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1, 24), amat);
      hd.position.y = 3.4;
      arrow.add(sh, hd);
      arrow.position.copy(pos).addScaledVector(tangent, 1.7);
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      arrow.scale.setScalar(0.001);
      this.croix.add(arrow);
      this.arrows.push(arrow);
    }

    // Labels anchored on the model (millimetres in the mesh frame).
    const L = this.labels;
    this.lab = {
      unit: L.add(tr('l.unit'), new THREE.Vector3(68, 18, -10), { object: croix }),
      pile: L.add(tr('l.pile'), new THREE.Vector3(-44, 22, 44), { object: croix, side: 'left' }),
      boost: L.add(tr('l.boost'), new THREE.Vector3(44, 22, 44), { object: croix }),
      dome: L.add(tr('l.handle'), new THREE.Vector3(0, 84, 0), { object: croix }),
      sign: L.add(tr('l.sign'), new THREE.Vector3(-26, 70, -10), { object: croix, side: 'left' }),
      glass: L.add(tr('l.glass'), new THREE.Vector3(3, 4.3, 0), { object: this.glass }),
      needle: L.add(tr('l.needle'), new THREE.Vector3(0.1, NEEDLE_L * 0.6, 0), { object: this.needle }),
      brass: L.add(tr('l.brass'), new THREE.Vector3(BRASS_R, BRASS_H * 0.6, 0), { object: this.brass }),
      pied: L.add(tr('l.base'), new THREE.Vector3(58, 12, 0), { object: pied }),
      contact: L.add(tr('l.contact'), new THREE.Vector3(0.12, NEEDLE_L, 0), { object: this.needle, side: 'left' }),
      thrust: L.add(tr('l.thrust'), new THREE.Vector3(68, 18, 40), { object: croix, warm: true }),
    };
    this.ready = true;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 48 : 32;
    this.camera.updateProjectionMatrix();
    this.portrait = w < h;
    this.w = w; this.h = h;
  }

  setProgress(p) { this.progress = p; }
  leave() { this.labels.hideAll(); }

  update(dt, t) {
    if (!this.ready) return;
    const p = this.progress;
    const ph = (i) => clamp01((p - i * P) / P); // local progress in panel i

    // 1 · print: the layers rise during the first panel.
    const printT = smooth(0.02, 0.85, ph(0));
    const printY = printT * 84;
    this.croixMat.userData.uPrint.value = p < P ? printY + 0.001 : 1000;
    this.croixMat.userData.uGlow.value = p < P ? (printT < 1 ? 1 : 0) : 0;
    const bedOn = 1 - smooth(0.85, 1, ph(0)) - smooth(0, 0.3, ph(1));
    this.bed.visible = bedOn > 0.01;
    this.bed.position.y = -0.4 * (1 - bedOn);
    this.nozzle.visible = p < P * 0.92 && printT < 1;
    if (this.nozzle.visible) {
      const k = t * 2.4;
      this.nozzle.position.set(Math.sin(k) * 6.5 * Math.cos(k * 0.37), CROIX_Y * 0 + printY * MM + 0.02, Math.cos(k * 1.3) * 6.5);
    }
    this.onPrint?.(Math.round((printT * 84) / LAYER));

    // Croix position: on the bed during printing, then up on its pivot.
    const explode = smooth(0.1, 0.7, ph(2)) * (1 - smooth(0.05, 0.75, ph(3)));
    const assembled = p >= 2 * P;
    const lift = smooth(0.0, 0.6, ph(2));
    const baseY = lerp(0, CROIX_Y, lift);
    const others = smooth(0.05, 0.5, ph(2));
    this.croix.position.y = baseY + explode * 9;
    this.glass.position.y = this.croix.position.y + GLASS_Y - 5.2 - explode * 5.2;
    this.needle.position.y = PIED_H + BRASS_H + explode * 2.4;
    this.brass.position.y = PIED_H + explode * 0.9;
    this.pied.position.y = 0;
    [this.glass, this.needle, this.brass, this.pied].forEach((o) => { o.visible = others > 0.01; });
    this.glass.material.opacity = 0.35 * others;
    const scl = lerp(0.6, 1, others);
    this.pied.scale.setScalar(MM * scl);

    // Spin: slow presentation turn, then thrust-driven rotation and the measured replay.
    const ignite = smooth(0.1, 0.5, ph(4));
    let omega = 0.18 * (1 - smooth(0.3, 0.9, ph(4)));
    const meas = smooth(0.05, 0.95, ph(6));
    if (p > 4 * P) omega += ignite * 0.55;
    if (p > 6 * P) {
      // Replay of run V7 (with thrusters): frequency in turns per second, time-lapse ×5.
      const run = MEASURES.thrust.with[1];
      const tt = meas * run[run.length - 1][0];
      let f = run[0][1];
      for (let i = 1; i < run.length; i++) if (run[i][0] >= tt) { const a = run[i - 1], b = run[i]; f = lerp(a[1], b[1], (tt - a[0]) / (b[0] - a[0] || 1)); break; }
      omega = f * Math.PI * 2 * 5 * 0.5;
      this.onMeasure?.(meas, f);
    }
    this.angle -= omega * dt;
    this.croix.rotation.y = this.angle;
    this.plumes.forEach((pl) => { pl.userData.setIntensity(ignite * (1.9 + 0.2 * Math.sin(t * 17))); pl.userData.update(t); });
    this.arrows.forEach((ar) => ar.scale.setScalar(Math.max(0.001, smooth(0.25, 0.6, ph(4)) * (1 - smooth(0.2, 0.6, ph(5))))));

    // Bell jar descends and the pump pulls the pressure down.
    const jar = smooth(0.05, 0.55, ph(5)) + (p >= 6 * P ? 1 : 0);
    const jarT = Math.min(1, jar);
    this.jar.position.y = (1 - easeInOut(jarT)) * 22;
    this.jarMat.opacity = 0.1 * Math.min(1, jarT * 3);
    this.jar.visible = jarT > 0.001;
    this.jarBase.visible = p > 4.6 * P;
    this.hose.material.opacity = smooth(0.4, 0.8, ph(5)) + (p >= 6 * P ? 1 : 0);
    this.hose.visible = this.hose.material.opacity > 0.01;
    const pump = smooth(0.5, 1, ph(5));
    const mbar = p >= 6 * P ? 2 : Math.round(1013 * Math.pow(1 - pump, 2.2) + 2 * pump);
    this.onPressure?.(p > 5 * P ? mbar : 1013);

    // Camera choreography.
    const shots = [
      { pos: [24, 18, 30], at: [0, 4, 0] },
      { pos: [22, 19, 27], at: [0, 4.5, 0] },
      { pos: [30, 20, 36], at: [0, 10, 0] },
      { pos: [-22, 14, 34], at: [0, 8, 0] },
      { pos: [12, 34, 26], at: [0, 9, 0] },
      { pos: [30, 18, 44], at: [0, 11, 0] },
      { pos: [-4, 15, 46], at: [0, 10, 0] },
    ];
    const seg = Math.min(shots.length - 1.0001, p * shots.length - 0.5);
    const i = Math.max(0, Math.floor(seg));
    const j = Math.min(shots.length - 1, i + 1);
    const f = easeInOut(clamp01(seg - i));
    const A = shots[i], B = shots[j];
    this.tmp.set(lerp(A.pos[0], B.pos[0], f), lerp(A.pos[1], B.pos[1], f), lerp(A.pos[2], B.pos[2], f));
    this.target.set(lerp(A.at[0], B.at[0], f), lerp(A.at[1], B.at[1], f), lerp(A.at[2], B.at[2], f));
    if (p < P) this.target.y = lerp(3, 5, printT);
    if (this.portrait) { this.tmp.multiplyScalar(1.25); this.target.x = 0; }
    const sway = Math.sin(t * 0.2) * 0.04;
    this.tmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), sway);
    this.camera.position.copy(this.tmp);
    this.camera.lookAt(this.target);
    frameOpposite(this.camera, p, [-1, 1, -1, 1, -1, 1, -1], this.w, this.h, 0.16);

    // Labels.
    const show = (k, on) => this.labels.show(this.lab[k], on);
    const anat = p > P * 1.15 && p < P * 1.95;
    ['unit', 'pile', 'boost', 'dome', 'sign'].forEach((k) => show(k, anat));
    const exp = p > P * 2.35 && p < P * 2.95;
    ['glass', 'needle', 'brass', 'pied'].forEach((k) => show(k, exp));
    show('contact', p > P * 3.4 && p < P * 3.95);
    show('thrust', p > P * 4.3 && p < P * 4.95);
    this.labels.update(this.camera, innerWidth, innerHeight);
  }
}
