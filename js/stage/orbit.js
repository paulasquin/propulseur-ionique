// Act I — a 2U CubeSat fires its ion thruster above the night side of the Earth.
import * as THREE from 'three';
import { createStars, createPlume, glowTexture, spaceEnvironment, smooth, lerp, clamp01, easeInOut } from './fx.js';

// The sun sits just below the horizon ahead of the camera: an orbital sunrise.
const SUN_DIR = new THREE.Vector3(-0.418, -0.217, -0.882).normalize();
const PLUME_DIR = new THREE.Vector3(-0.95, -0.06, -0.3).normalize();

export function earthMaterial(tex, { sunDir = SUN_DIR, nightBoost = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: tex.day }, uNight: { value: tex.night }, uClouds: { value: tex.clouds },
      uSun: { value: sunDir.clone() }, uTime: { value: 0 }, uNightBoost: { value: nightBoost },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vP;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uDay, uNight, uClouds; uniform vec3 uSun; uniform float uTime, uNightBoost;
      varying vec2 vUv; varying vec3 vN; varying vec3 vP;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vP);
        float ndl = dot(n, uSun);
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float cloud = texture2D(uClouds, vUv + vec2(uTime * 0.0015, 0.0)).r;
        cloud = smoothstep(0.15, 0.9, cloud);
        float lit = smoothstep(-0.12, 0.35, ndl);
        // Day side: diffuse land, ocean glint, lit clouds.
        vec3 dayCol = day * (0.15 + 1.5 * max(ndl, 0.0));
        float ocean = smoothstep(0.02, 0.1, day.b - max(day.r, day.g) * 0.9);
        vec3 h = normalize(uSun + v);
        float spec = pow(max(dot(n, h), 0.0), 70.0) * ocean * (1.0 - cloud);
        dayCol += vec3(1.0, 0.9, 0.75) * spec * 1.8;
        dayCol = mix(dayCol, vec3(1.0) * (0.06 + 1.35 * max(ndl, 0.0)), cloud * 0.85);
        // Night side: city lights dimmed by clouds.
        float nl = dot(night, vec3(0.3, 0.5, 0.2));
        vec3 lights = night * smoothstep(0.17, 0.6, nl) * vec3(1.5, 1.0, 0.55) * 1.5 * uNightBoost;
        vec3 nightCol = lights * (1.0 - cloud * 0.85) + vec3(0.004, 0.008, 0.016) + cloud * vec3(0.012, 0.016, 0.028);
        vec3 col = mix(nightCol, dayCol, lit);
        // Terminator warmth and atmospheric rim.
        float term = exp(-pow(ndl * 6.0, 2.0));
        col += vec3(1.0, 0.38, 0.12) * term * 0.05 * (1.0 - cloud * 0.5);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);
        vec3 atm = mix(vec3(0.25, 0.5, 1.0), vec3(1.0, 0.5, 0.2), pow(max(dot(-v, uSun), 0.0), 14.0));
        col += atm * fres * (0.12 + smoothstep(-0.15, 0.3, ndl)) * 0.8;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

export function atmosphere(radius, sunDir = SUN_DIR) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir.clone() } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vP;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun; varying vec3 vN; varying vec3 vP;
      void main() {
        vec3 v = normalize(cameraPosition - vP);
        vec3 n = normalize(vN);
        float rim = pow(clamp(1.0 + dot(v, n) * 1.0, 0.0, 1.0), 5.0);
        float ndl = dot(n, uSun);
        float day = smoothstep(-0.25, 0.4, ndl);
        float forward = pow(max(dot(-v, uSun), 0.0), 8.0);
        float sunrise = pow(max(dot(-v, uSun), 0.0), 14.0);
        vec3 col = mix(vec3(0.18, 0.42, 1.0), vec3(1.0, 0.55, 0.22), clamp(sunrise * 1.4, 0.0, 1.0));
        float a = rim * (0.35 + day * 0.9 + forward * 1.6 + sunrise * 0.6) * 0.75;
        gl_FragColor = vec4(col * a, a);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 64), mat);
}

function solarCellTexture(cols = 2, rows = 4) {
  const W = 512, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ccd2';
  g.fillRect(0, 0, W, H);
  const pad = 14, cw = (W - pad * (cols + 1)) / cols, ch = (H - pad * (rows + 1)) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = pad + i * (cw + pad), y = pad + j * (ch + pad), k = 16;
    const grad = g.createLinearGradient(x, y, x + cw, y + ch);
    grad.addColorStop(0, '#16213f'); grad.addColorStop(0.5, '#1d2c58'); grad.addColorStop(1, '#101833');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x + k, y); g.lineTo(x + cw - k, y); g.lineTo(x + cw, y + k); g.lineTo(x + cw, y + ch - k);
    g.lineTo(x + cw - k, y + ch); g.lineTo(x + k, y + ch); g.lineTo(x, y + ch - k); g.lineTo(x, y + k); g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(190,200,220,.55)'; g.lineWidth = 1.2;
    for (let l = 1; l < 14; l++) { g.beginPath(); g.moveTo(x + 4, y + (ch * l) / 14); g.lineTo(x + cw - 4, y + (ch * l) / 14); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = 'rgba(210,215,230,.8)';
    [0.33, 0.66].forEach((f) => { g.beginPath(); g.moveTo(x + cw * f, y + 3); g.lineTo(x + cw * f, y + ch - 3); g.stroke(); });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function buildCubeSat() {
  // Units: 1 = 10 cm. 2U body: 1 × 1 × 2.27, thruster on -Z.
  const sat = new THREE.Group();
  const alu = new THREE.MeshStandardMaterial({ color: '#b9bec8', metalness: 1, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1a1d24', metalness: 0.6, roughness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d7a440', metalness: 1, roughness: 0.28 });
  const cells = solarCellTexture();
  const cellMat = new THREE.MeshPhysicalMaterial({ map: cells, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const back = new THREE.MeshStandardMaterial({ color: '#10141b', metalness: 0.2, roughness: 0.7, envMapIntensity: 0.3 });
  const L = 2.27;

  // Rails and frame.
  const rail = new THREE.BoxGeometry(0.085, 0.085, L);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => {
    const m = new THREE.Mesh(rail, alu);
    m.position.set(x * 0.4575, y * 0.4575, 0);
    sat.add(m);
  });
  [-L / 2, 0, L / 2].forEach((z) => {
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.96, 0.04), alu);
    ring.position.z = z;
    ring.scale.set(1, 1, 1);
    sat.add(ring);
  });
  // Body panels with cells on the four long faces.
  const faceGeo = new THREE.PlaneGeometry(0.83, L - 0.08);
  faceGeo.rotateX(-Math.PI / 2);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const m = new THREE.Mesh(faceGeo, cellMat);
    m.position.set(Math.cos(a) * 0.462, Math.sin(a) * 0.462, 0);
    m.rotation.z = a - Math.PI / 2;
    sat.add(m);
  }
  // Top: gold MLI and a camera lens; bottom: the thruster.
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.03), gold);
  top.position.z = L / 2 + 0.03;
  sat.add(top);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 32), dark);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0.18, 0.18, L / 2 + 0.1);
  sat.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.09, 32), new THREE.MeshPhysicalMaterial({ color: '#0b1a3a', metalness: 0, roughness: 0.02, clearcoat: 1 }));
  glass.position.set(0.18, 0.18, L / 2 + 0.162);
  sat.add(glass);
  // UHF antennas (tape measures) on the top face.
  const antMat = new THREE.MeshStandardMaterial({ color: '#d9d4c4', metalness: 0.7, roughness: 0.3 });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    const ant = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.035, 0.006), antMat);
    ant.position.set(Math.cos(a) * 1.25, Math.sin(a) * 1.25, L / 2 + 0.05);
    ant.rotation.z = a;
    sat.add(ant);
  }

  const thruster = new THREE.Group();
  thruster.position.z = -L / 2 - 0.02;
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 48), dark);
  housing.rotation.x = Math.PI / 2;
  housing.position.z = -0.08;
  thruster.add(housing);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 12, 48), alu);
  lip.position.z = -0.16;
  thruster.add(lip);
  // Accelerator grid: emissive disc with a hole pattern.
  const gc = document.createElement('canvas');
  gc.width = gc.height = 256;
  const g = gc.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
    const px = 128 + (x + (y % 2 ? 0.5 : 0)) * 18, py = 128 + y * 15.6;
    if (Math.hypot(px - 128, py - 128) > 112) continue;
    const r = g.createRadialGradient(px, py, 0, px, py, 7);
    r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(120,200,255,0)');
    g.fillStyle = r; g.beginPath(); g.arc(px, py, 7, 0, Math.PI * 2); g.fill();
  }
  const gridTex = new THREE.CanvasTexture(gc);
  gridTex.colorSpace = THREE.SRGBColorSpace;
  const gridMat = new THREE.MeshStandardMaterial({ color: '#2a2f38', metalness: 0.9, roughness: 0.35, emissive: new THREE.Color('#7fdcff'), emissiveMap: gridTex, emissiveIntensity: 0 });
  const grid = new THREE.Mesh(new THREE.CircleGeometry(0.29, 48), gridMat);
  grid.position.z = -0.165;
  grid.rotation.y = Math.PI;
  thruster.add(grid);
  sat.add(thruster);

  // Four deployable wings hinged on the bottom edges, unfolding outwards.
  const wings = [];
  const wingGeo = new THREE.BoxGeometry(0.86, L - 0.06, 0.02);
  wingGeo.translate(0, (L - 0.06) / 2, 0);
  const wingMats = [back, back, back, back, cellMat, back];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const hinge = new THREE.Group();
    hinge.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, -L / 2 + 0.02);
    hinge.rotation.z = a - Math.PI / 2;
    const fold = new THREE.Group();
    hinge.add(fold);
    const wing = new THREE.Mesh(wingGeo, wingMats);
    wing.rotation.x = Math.PI / 2; // lies along +Z (folded against the body)
    wing.position.z = 0.012;
    fold.add(wing);
    sat.add(hinge);
    wings.push(fold);
  }

  return { sat, thruster, grid, gridMat, wings, L };
}

export class OrbitAct {
  constructor({ textures, labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.05, 2000);
    this.look = { bloom: 0.7, bloomRadius: 0.35, threshold: 0.85, exposure: 1.0, fade: 1, fadeColor: '#000000', vignette: 1 };
    this.progress = 0;
    this.intro = 0;
    this.labels = labels;
    this.textures = textures;

    const s = this.scene;
    s.background = new THREE.Color('#000000');
    this.stars = createStars(5000, 600);
    s.add(this.stars);

    // Earth.
    const R = 60;
    this.R = R;
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 96), earthMaterial(textures));
    this.earth.position.set(-10, -R - 6, -28);
    // Turn the globe so that Lyon (45.7° N, 4.8° E) sits near the dawn terminator.
    const lat = THREE.MathUtils.degToRad(45.7), lon = THREE.MathUtils.degToRad(4.8);
    const lyon = new THREE.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), -Math.sin(lon) * Math.cos(lat));
    const facing = new THREE.Vector3(0.05, 0.9, 0.44).normalize();
    this.earth.quaternion.setFromUnitVectors(lyon, facing);
    s.add(this.earth);
    this.atmo = atmosphere(R * 1.028);
    this.atmo.position.copy(this.earth.position);
    s.add(this.atmo);

    // Sun.
    this.sunPos = SUN_DIR.clone().multiplyScalar(900);
    const sunTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.05, 'rgba(255,252,240,1)'], [0.12, 'rgba(255,230,200,.45)'], [0.4, 'rgba(255,200,150,.07)'], [1, 'rgba(255,170,90,0)']], 256);
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.sun.position.copy(this.sunPos);
    this.sun.scale.setScalar(110);
    s.add(this.sun);
    const streakTex = glowTexture([[0, 'rgba(200,225,255,.9)'], [0.4, 'rgba(120,170,255,.15)'], [1, 'rgba(120,170,255,0)']], 128);
    this.streak = new THREE.Sprite(new THREE.SpriteMaterial({ map: streakTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
    this.streak.position.copy(this.sunPos);
    this.streak.scale.set(900, 9, 1);
    s.add(this.streak);
    this.flares = [0.35, 0.6, 0.85, 1.25].map((k, i) => {
      const f = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture([[0, 'rgba(255,255,255,0)'], [0.75, `rgba(${i % 2 ? '140,190,255' : '255,190,140'},.22)`], [0.85, 'rgba(255,255,255,.05)'], [1, 'rgba(255,255,255,0)']]),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, depthTest: false,
      }));
      f.userData.k = k;
      f.renderOrder = 20;
      s.add(f);
      return f;
    });

    // Lights.
    this.sunLight = new THREE.DirectionalLight('#fff3e2', 3.2);
    this.sunLight.position.copy(SUN_DIR).multiplyScalar(50);
    s.add(this.sunLight);
    const earthshine = new THREE.HemisphereLight('#0b1020', '#1c3a6e', 0.55);
    s.add(earthshine);
    // Soft fill from the viewer's side so the solar cells read against the night.
    this.fill = new THREE.DirectionalLight('#9fc4ff', 0.55);
    s.add(this.fill);
    s.add(this.fill.target);

    // CubeSat.
    const cs = buildCubeSat();
    this.cs = cs;
    this.satPivot = new THREE.Group();
    this.satPivot.position.set(1.0, 0.1, 0);
    this.satPivot.add(cs.sat);
    cs.sat.scale.setScalar(0.42);
    // Point the thruster (local -Z) along PLUME_DIR, then roll a little.
    this.satBase = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), PLUME_DIR);
    this.satBase.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.5));
    this.wobble = new THREE.Quaternion();
    this.euler = new THREE.Euler();
    s.add(this.satPivot);
    this.plume = createPlume({ length: 10, radius: 0.27, spread: 0.16, count: 2600, speed: 0.5, size: 13, intensity: 0, glow: 0.3 });
    this.plume.rotation.y = Math.PI; // emit along -Z of the satellite
    this.plume.position.z = -0.17;
    cs.thruster.add(this.plume);
    this.thrLight = new THREE.PointLight('#7fd8ff', 0, 2.5, 2);
    this.thrLight.position.z = -0.6;
    cs.thruster.add(this.thrLight);

    // Camera path driven by scroll.
    this.camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 0.75, 7.2),
      new THREE.Vector3(-2.2, 0.6, 4.8),
      new THREE.Vector3(-2.9, 0.25, 0.55),
      new THREE.Vector3(-0.55, 0.02, -0.45),
    ]);
    this.lookPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, -0.5, -0.5),
      new THREE.Vector3(0.2, -0.1, -0.6),
      new THREE.Vector3(0.6, 0.06, -0.15),
      new THREE.Vector3(0.37, 0.06, -0.2),
    ]);
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.mouse = new THREE.Vector2();
    this.mouseS = new THREE.Vector2();
    addEventListener('pointermove', (e) => this.mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
  }

  init(renderer) {
    this.scene.environment = spaceEnvironment(renderer, SUN_DIR, this.earth.position.clone().normalize());
    this.scene.environmentIntensity = 0.9;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 50 : 36;
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.entered = true; }

  update(dt, t) {
    // Wall-clock intro, so slow devices do not stretch it.
    this.t0 ??= performance.now();
    this.intro = Math.min(1, (performance.now() - this.t0) / 6000);
    const it = this.intro;
    const p = this.progress;

    // Intro: fade in, unfold the wings, ignite.
    const fadeIn = 1 - smooth(0, 0.35, it);
    const fadeOut = smooth(0.92, 1, p);
    this.look.fade = Math.max(fadeIn, fadeOut);
    this.look.fadeColor = fadeOut > fadeIn ? '#cfefff' : '#000000';
    const unfold = easeInOut(smooth(0.15, 0.55, it));
    this.cs.wings.forEach((w, i) => { w.rotation.x = -unfold * (Math.PI / 2 + 0.02) * (1 - i * 0.002); });
    const ign = smooth(0.62, 0.8, it);
    const flicker = ign < 1 ? (Math.sin(t * 60) > 0.2 ? 1 : 0.35) : 1;
    const thrust = ign * flicker * (0.92 + 0.08 * Math.sin(t * 13));
    this.plume.userData.setIntensity(thrust * (1.7 + p * 0.3));
    this.plume.userData.update(t);
    this.cs.gridMat.emissiveIntensity = thrust * 2.2;
    this.thrLight.intensity = thrust * 1.2;

    // Satellite drift.
    this.euler.set(Math.sin(t * 0.21) * 0.04, Math.sin(t * 0.13) * 0.05, t * 0.03);
    this.wobble.setFromEuler(this.euler);
    this.cs.sat.quaternion.copy(this.satBase).multiply(this.wobble);
    this.satPivot.position.y = 0.15 + Math.sin(t * 0.4) * 0.05;

    this.earth.rotateY(dt * 0.006);
    this.earth.material.uniforms.uTime.value = t;
    this.stars.userData.update(t);

    // Camera along the scroll path, with a touch of parallax.
    this.mouseS.lerp(this.mouse, 0.04);
    const cp = easeInOut(clamp01(p * 1.02));
    const intro = 1 - easeInOut(smooth(0, 0.5, it));
    this.camPath.getPoint(cp, this.tmp);
    this.tmp.z += intro * 3.5;
    this.tmp.y += intro * 0.6;
    this.tmp.x += this.mouseS.x * 0.35 * (1 - p);
    this.tmp.y -= this.mouseS.y * 0.2 * (1 - p);
    this.camera.position.copy(this.tmp);
    this.lookPath.getPoint(cp, this.tmp2);
    this.camera.lookAt(this.tmp2);
    this.camera.rotateZ(-0.05 + p * 0.12);
    this.fill.position.copy(this.camera.position).add(new THREE.Vector3(0, 2, 0));
    this.fill.target.position.copy(this.satPivot.position);

    this.updateSun();
    this.hud ??= document.getElementById('hud-thr');
    const label = thrust > 0.5 ? 'ON · 22 kV' : 'IGNITION';
    if (this.hud && this.hud.textContent !== label) this.hud.textContent = label;
  }

  updateSun() {
    // Occlusion by the Earth (soft) for the sun glow and lens flares.
    const cam = this.camera.position;
    const dir = this.tmp.copy(this.sunPos).sub(cam).normalize();
    const oc = this.tmp2.copy(this.earth.position).sub(cam);
    const proj = oc.dot(dir);
    const closest = Math.sqrt(Math.max(0, oc.lengthSq() - proj * proj));
    const vis = proj < 0 ? 1 : smooth(this.R * 0.995, this.R * 1.06, closest);
    this.sun.material.opacity = vis;
    this.streak.material.opacity = 0.3 * vis;
    const sp = this.tmp.copy(this.sunPos).project(this.camera);
    const onScreen = sp.z < 1 && Math.abs(sp.x) < 1.4 && Math.abs(sp.y) < 1.4;
    this.flares.forEach((f) => {
      const k = f.userData.k;
      const ndc = new THREE.Vector3(sp.x * (1 - k * 2), sp.y * (1 - k * 2), 0.5).unproject(this.camera);
      f.position.copy(ndc);
      const dist = ndc.distanceTo(cam);
      f.scale.setScalar(dist * (0.08 + k * 0.05));
      f.material.opacity = onScreen ? vis * 0.12 : 0;
    });
  }
}
