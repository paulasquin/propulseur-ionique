// The stage: one fixed WebGL canvas shared by every "act" of the page.
// Each act owns a scene and a camera; scroll position decides which one plays.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { QUALITY } from './fx.js';

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 0 }, uFadeColor: { value: new THREE.Color('#000') },
    uVignette: { value: 0.9 }, uAberration: { value: 0.0015 }, uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uFade, uVignette, uAberration; uniform vec3 uFadeColor; uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float d = dot(c, c);
      vec2 off = c * uAberration * (1.0 + d * 4.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= mix(1.0, smoothstep(0.85, 0.15, d * 1.6), uVignette);
      col += (hash(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.018;
      col = mix(col, uFadeColor, uFade);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.acts = new Map();
    this.active = null;
    this.visible = false;
    this.last = performance.now();
    this.time = 0;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    renderer.setPixelRatio(this.pixelRatio());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor('#000000', 1);
    this.renderer = renderer;

    const size = this.size();
    const rt = new THREE.WebGLRenderTarget(size.w, size.h, { type: THREE.HalfFloatType, samples: QUALITY.tier >= 1.5 ? 4 : 0 });
    this.composer = new EffectComposer(renderer, rt);
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.w, size.h), 0.9, 0.6, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);

    this.resize();
    addEventListener('resize', () => {
      // Ignore the mobile URL bar showing or hiding: only real size changes reallocate buffers.
      const { w, h } = this.size();
      if (w === this.lastW && Math.abs(h - this.lastH) < 150) return;
      this.resize();
    });
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  pixelRatio() {
    const cap = QUALITY.tier >= 2 ? 1.75 : QUALITY.tier >= 1.5 ? 1.5 : QUALITY.tier >= 1 ? 1.25 : 0.75;
    return Math.min(devicePixelRatio || 1, cap);
  }

  size() { return { w: innerWidth, h: innerHeight }; }

  resize() {
    const { w, h } = this.size();
    this.lastW = w; this.lastH = h;
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pixelRatio());
    this.composer.setSize(w, h);
    const bloomScale = QUALITY.tier >= 1.5 ? 0.5 : 0.35;
    this.bloom.setSize(w * bloomScale, h * bloomScale);
    this.finish.uniforms.uRes.value.set(w, h);
    for (const act of this.acts.values()) act.resize?.(w, h);
  }

  add(name, act) {
    this.acts.set(name, act);
    act.stage = this;
    const { w, h } = this.size();
    act.resize?.(w, h);
  }

  /** Called by the scroll director: which act is on screen, with its progress (0-1). */
  setActive(name) {
    const next = name ? this.acts.get(name) : null;
    if (next === this.active) return;
    this.active?.leave?.();
    this.active = next;
    next?.enter?.();
    this.visible = !!next;
    this.canvas.classList.toggle('on', this.visible);
  }

  setProgress(name, p) { this.acts.get(name)?.setProgress?.(p); }

  loop() {
    requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (!this.active || document.hidden) return;
    this.time += dt;
    const act = this.active;
    act.update(dt, this.time);
    this.renderPass.scene = act.scene;
    this.renderPass.camera = act.camera;
    const look = act.look || {};
    this.bloom.strength = look.bloom ?? 0.9;
    this.bloom.radius = look.bloomRadius ?? 0.6;
    this.bloom.threshold = look.threshold ?? 0.82;
    this.renderer.toneMappingExposure = look.exposure ?? 1;
    const f = this.finish.uniforms;
    f.uTime.value = this.time;
    f.uFade.value = look.fade ?? 0;
    f.uFadeColor.value.set(look.fadeColor ?? '#000000');
    f.uVignette.value = look.vignette ?? 0.9;
    this.composer.render(dt);
    act.afterRender?.();
  }
}
