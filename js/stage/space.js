// Act IV — orbit raising: a chemical Hohmann transfer (two impulsive burns)
// against a low-thrust ion spiral.
import * as THREE from 'three';
import { createStars, glowTexture, smooth, lerp, clamp01, easeInOut, frameOpposite } from './fx.js';
import { earthMaterial, atmosphere } from './orbit.js';
import { t as tr } from '../i18n.js';

const R0 = 1.5, R1 = 4.6, TURNS = 6;
const SUN = new THREE.Vector3(1, 0.35, 0.6).normalize();

function trailMaterial(color, head) {
  return new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uColor: { value: new THREE.Color(color) }, uHead: { value: new THREE.Color(head) }, uOpacity: { value: 1 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`
      uniform float uDraw, uOpacity, uTime; uniform vec3 uColor, uHead; varying vec2 vUv;
      void main() {
        float t = vUv.x;
        if (t > uDraw) discard;
        float headGlow = smoothstep(uDraw - 0.04, uDraw, t);
        float a = (0.35 + 0.65 * smoothstep(0.0, 0.25, t / max(uDraw, 0.001))) * uOpacity;
        vec3 col = mix(uColor, uHead, headGlow);
        gl_FragColor = vec4(col * (1.0 + headGlow * 2.0) * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

function ring(r, color, opacity) {
  const pts = [];
  for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity }));
  line.computeLineDistances();
  return line;
}

export class SpaceAct {
  constructor({ textures, labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 2000);
    this.look = { bloom: 1.0, bloomRadius: 0.6, threshold: 0.72, exposure: 1.0, fade: 0, vignette: 1 };
    this.progress = 0;
    this.labels = labels;
    const s = this.scene;
    s.background = new THREE.Color('#000000');
    this.stars = createStars(4500, 500);
    s.add(this.stars);

    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMaterial(textures, { sunDir: SUN, nightBoost: 0.8 }));
    this.earth.rotation.z = 0.41;
    s.add(this.earth);
    const atm = atmosphere(1.03, SUN);
    s.add(atm);

    this.leo = ring(R0, '#9fb6ff', 0.35);
    this.geo = ring(R1, '#9fb6ff', 0.25);
    s.add(this.leo, this.geo);

    // Hohmann half-ellipse: periapsis R0 at angle 0, apoapsis R1 at angle π.
    const a = (R0 + R1) / 2, e = (R1 - R0) / (R1 + R0);
    const hpts = [];
    for (let i = 0; i <= 200; i++) {
      const nu = (i / 200) * Math.PI;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
      hpts.push(new THREE.Vector3(Math.cos(nu) * r, 0, -Math.sin(nu) * r));
    }
    // Then a short arc on the final orbit.
    for (let i = 1; i <= 60; i++) { const nu = Math.PI + (i / 60) * 0.9; hpts.push(new THREE.Vector3(Math.cos(nu) * R1, 0, -Math.sin(nu) * R1)); }
    this.hCurve = new THREE.CatmullRomCurve3(hpts);
    this.hMat = trailMaterial('#ff8a3d', '#ffe2b8');
    this.hohmann = new THREE.Mesh(new THREE.TubeGeometry(this.hCurve, 400, 0.022, 8), this.hMat);
    s.add(this.hohmann);

    // Ion spiral (logarithmic, TURNS turns from R0 to R1).
    const lam = Math.log(R1 / R0) / (Math.PI * 2 * TURNS);
    const spts = [];
    const n = 1400;
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2 * TURNS;
      const r = R0 * Math.exp(lam * th);
      spts.push(new THREE.Vector3(Math.cos(th) * r, 0, -Math.sin(th) * r));
    }
    this.sCurve = new THREE.CatmullRomCurve3(spts);
    this.sMat = trailMaterial('#4fb8ff', '#e8fbff');
    this.spiral = new THREE.Mesh(new THREE.TubeGeometry(this.sCurve, 2400, 0.016, 8), this.sMat);
    s.add(this.spiral);

    // Spacecraft markers and burn flashes.
    const glow = glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.4)'], [1, 'rgba(255,255,255,0)']]);
    const mk = (color, scale) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.scale.setScalar(scale);
      s.add(sp);
      return sp;
    };
    this.hCraft = mk('#ffd2a0', 0.35);
    this.sCraft = mk('#cdf3ff', 0.22);
    this.burns = [mk('#ff9a4a', 1.2), mk('#ff9a4a', 1.2)];
    this.burns[0].position.set(R0, 0, 0);
    this.burns[1].position.set(-R1, 0, 0);
    // A tiny ion exhaust trail behind the spiral craft.
    this.sTrail = [];
    for (let i = 0; i < 14; i++) this.sTrail.push(mk('#6fd6ff', 0.1 * (1 - i / 16)));

    const light = new THREE.DirectionalLight('#ffffff', 2);
    light.position.copy(SUN).multiplyScalar(10);
    s.add(light);

    const L = labels;
    this.lab = {
      leo: L.add(tr('l.leo'), new THREE.Vector3(0, 0, R0)),
      geo: L.add(tr('l.geo'), new THREE.Vector3(-R1 * 0.7, 0, R1 * 0.7), { side: 'left' }),
      b1: L.add(tr('l.burn1'), new THREE.Vector3(R0, 0, 0), { warm: true }),
      b2: L.add(tr('l.burn2'), new THREE.Vector3(-R1, 0, 0), { warm: true, side: 'left' }),
      spiral: L.add(tr('l.spiral'), new THREE.Vector3(0, 0, -R1 * 0.82)),
    };
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 60 : 38;
    this.camera.updateProjectionMatrix();
    this.portrait = w < h;
    this.w = w; this.h = h;
  }

  setProgress(p) { this.progress = p; }
  leave() { this.labels.hideAll(); }

  update(dt, t) {
    const p = this.progress;
    this.stars.userData.update(t);
    this.earth.rotation.y += dt * 0.05;
    this.earth.material.uniforms.uTime.value = t;

    // Hohmann during panel 2, spiral during panel 3.
    const h = smooth(0.24, 0.48, p);
    const sp = smooth(0.5, 0.76, p);
    this.hMat.uniforms.uDraw.value = h;
    this.hMat.uniforms.uOpacity.value = 1 - 0.55 * smooth(0.5, 0.6, p);
    this.sMat.uniforms.uDraw.value = sp;
    this.hohmann.visible = h > 0.001;
    this.spiral.visible = sp > 0.001;

    this.hCurve.getPointAt(Math.max(0.0001, h), this.tmp);
    this.hCraft.position.copy(this.tmp);
    this.hCraft.visible = h > 0.001 && h < 0.999;
    // Burn flashes: at the start and when reaching apoapsis (~68 % of the path length).
    const f1 = h > 0 ? Math.exp(-Math.pow((h - 0.02) / 0.03, 2)) : 0;
    const f2 = Math.exp(-Math.pow((h - 0.68) / 0.03, 2));
    this.burns[0].material.opacity = f1;
    this.burns[1].material.opacity = f2;
    this.burns.forEach((b, i) => b.scale.setScalar(0.6 + (i ? f2 : f1) * 1.2));

    this.sCurve.getPointAt(Math.max(0.0001, sp), this.tmp);
    this.sCraft.position.copy(this.tmp);
    this.sCraft.visible = sp > 0.001;
    this.sTrail.forEach((tr, i) => {
      const u = Math.max(0, sp - (i + 1) * 0.0018);
      this.sCurve.getPointAt(Math.max(0.0001, u), this.tmp2);
      tr.position.copy(this.tmp2);
      tr.visible = sp > 0.001 && sp < 0.999;
      tr.material.opacity = 0.9 * (1 - i / 14) * (0.7 + 0.3 * Math.sin(t * 20 + i));
    });

    // Camera: from overhead to an oblique, slowly orbiting view.
    const tilt = lerp(1.25, 0.55, easeInOut(smooth(0, 0.35, p)));
    const dist = (this.portrait ? 15 : 11.5) - smooth(0.6, 1, p) * 1.2;
    const az = 0.6 + t * 0.03 + p * 0.8;
    this.camera.position.set(Math.cos(az) * Math.cos(tilt) * dist, Math.sin(tilt) * dist, Math.sin(az) * Math.cos(tilt) * dist);
    this.camera.lookAt(0, 0, 0);
    frameOpposite(this.camera, p, [-1, 1, -1, 1], this.w, this.h, 0.2);

    const show = (k, a, b) => this.labels.show(this.lab[k], p >= a && p < b);
    show('leo', 0.05, 0.3);
    show('geo', 0.05, 0.3);
    show('b1', 0.25, 0.5);
    show('b2', 0.4, 0.52);
    show('spiral', 0.62, 0.8);
    this.labels.update(this.camera, innerWidth, innerHeight);
  }
}
