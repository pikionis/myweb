/**
 * Liquid glass carousel: an endless row of project cards seen through a liquid-glass lens (chromatic
 * rim, shimmering ring), with water ripples that follow the pointer across the cards.
 *
 * Ported from Componentry "Liquid Glass Carousel" and "Image Ripple Effect" by Harsh Jadhav (MIT) —
 * https://componentry.fun. The lens shader, the ripple brush, the row layout and the drag/snap feel
 * are theirs. This version drops React and three.js for plain WebGL2, folds the ripple into the lens
 * pass, and hands "open this project" to the page instead of zooming the card.
 */
import { gsap } from 'gsap';

export type GlassItem = {
  title: string;
  /** A canvas or loaded image, or a URL to load. */
  source: TexImageSource | string;
  /** Width / height. */
  aspect: number;
  /** Flat colour shown until the image arrives. */
  base: [number, number, number];
};

export type GlassApi = {
  /** Brings this item to the lens. */
  select(index: number): void;
  next(): void;
  previous(): void;
  /** The item under the lens now. */
  current(): number;
  /** Call after the canvas box changes size. */
  resize(): void;
  destroy(): void;
};

type Options = {
  background: [number, number, number];
  /** A label that follows the pointer while it is over a card. */
  cursor?: HTMLElement | null;
  onActive(index: number): void;
  onOpen(index: number): void;
};

const LENS = {
  sizeX: 0.565, sizeY: 1, rotation: 65,
  // the original's white glow was tuned for a white page; on the warm paper it reads as a blank blob
  dispersion: 11, glow: 4.2, whiteGlow: 0.05, novaSize: 12,
  blueRing: 6, ringRadius: 0.49, ringWidth: 0.014,
  shimmerFreq: 12, shimmerSpeed: 3.5, shimmerDepth: 0.12,
  rimStart: 0.578, rimTangential: 0.6, rimFreq1: 2, rimFreq2: 1,
  // the ring takes the site's accent instead of the original cyan
  ringColor: [0x4d / 255, 0x7c / 255, 0xff / 255],
  rimLine: 1.4, rimLinePos: 0.488, rimLineWidth: 0.003,
  samples: 16,
};
const RIPPLE = { strength: 0.075, count: 100, size: 60, spin: 0.025, fade: 0.95, growth: 0.155, threshold: 0.1 };
const PANEL = { height: 450, gap: 12 };
const ENTRY = { delay: 0.3, rise: 1.0, stagger: 0.07, from: 0.9, bloom: 1.4 };
const REPEATS = 4;
const CLICK_SLOP = 6;
const TOUCH_CLICK_SLOP = 12;
const FLICK_IDLE_MS = 90;

const QUAD_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0); }`;

// cards and ripple stamps: a quad placed in CSS pixels, origin at the canvas centre, y up
const RECT_VS = `#version 300 es
in vec2 aPos;
uniform vec4 uRect;
uniform vec2 uHalf;
uniform float uRot;
out vec2 vUv;
void main() {
  vUv = aPos;
  vec2 p = (aPos - 0.5) * uRect.zw;
  float c = cos(uRot), s = sin(uRot);
  p = mat2(c, s, -s, c) * p;
  gl_Position = vec4((uRect.xy + p) / uHalf, 0.0, 1.0);
}`;

const CARD_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform float uReady;
uniform vec3 uBase;
void main() { o = vec4(uReady > 0.5 ? texture(uTex, vUv).rgb : uBase, 1.0); }`;

// the ripple brush: solid at the centre, 0.55 at 65%, gone at the edge
const WAVE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform float uAlpha;
void main() {
  float r = length(vUv * 2.0 - 1.0);
  float a = r < 0.65 ? mix(1.0, 0.55, r / 0.65) : mix(0.55, 0.0, clamp((r - 0.65) / 0.35, 0.0, 1.0));
  o = vec4(vec3(1.0), a * uAlpha);
}`;

const LENS_FS = `#version 300 es
#define PI 3.14159265
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform sampler2D uDisp;
uniform float uStrength;
uniform vec2 uCenter;
uniform float uSizeX;
uniform float uSizeY;
uniform float uAspect;
uniform float uDispersion;
uniform float uGlow;
uniform float uWhiteGlow;
uniform float uNovaSize;
uniform float uBlueRing;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uShimmer;
uniform float uShimmerFreq;
uniform float uShimmerSpeed;
uniform float uShimmerDepth;
uniform float uTime;
uniform float uRimStart;
uniform float uRimTangential;
uniform float uRimFreq1;
uniform float uRimFreq2;
uniform vec3 uBlueColor;
uniform float uRimLine;
uniform float uRimLinePos;
uniform float uRimLineWidth;
uniform float uRotation;
uniform int uSamples;

const int MAX_SAMPLES = 16;
vec2 gRip;

// a gaussian bump; pow(x, 2.0) is undefined for negative x in GLSL and turns white on some GPUs
float bell(float x) { return exp(-x * x); }

// every read of the row is pushed by the ripple under this pixel
vec3 scene(vec2 uv) { return texture(uTex, uv + gRip).rgb; }

vec3 discLens(vec2 center, float aspectCorrect, out float outA) {
  vec2 p = vUv - center;
  p.x *= aspectCorrect;
  float ca = cos(uRotation), sa = sin(uRotation);
  p = mat2(ca, -sa, sa, ca) * p;
  vec2 halfSize = vec2(uSizeX, uSizeY);
  float dist = length(p / halfSize);
  outA = 0.0;
  float maskND = dist;
  if (maskND > 1.0) return vec3(0.0);

  float shapeND = clamp(maskND, 0.0, 1.0);
  float nd = clamp(dist, 0.0, 1.0);
  vec2 offset = vUv - center;
  vec2 radialDir = normalize(offset + 1e-6);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
  float angle = atan(p.y, p.x);

  float rimStrength = smoothstep(uRimStart, 1.0, nd);
  float fluidWave = sin(angle * uRimFreq1) * 0.55 + sin(angle * uRimFreq2) * 0.25;
  float rScreen = (uSizeX + uSizeY) * 0.5;
  vec2 rimOff = tangentDir * fluidWave * rimStrength * rScreen * uRimTangential;
  vec2 baseUV = center + offset + rimOff;

  // chromatic dispersion near the rim: red, green and blue read from slightly different places
  float rimMask = smoothstep(0.55, 1.0, nd);
  vec2 dispDir = offset * uDispersion * 0.004 * rimMask;
  int N = clamp(uSamples, 2, MAX_SAMPLES);
  vec3 col = vec3(0.0);
  vec3 caW = vec3(0.0);
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= N) break;
    float t = float(i) / float(N - 1);
    vec3 s = scene(baseUV + dispDir * (t - 0.5));
    vec3 w = vec3(bell(t / 0.38), bell((t - 0.5) / 0.38), bell((t - 1.0) / 0.38));
    col += s * w;
    caW += w;
  }
  col /= max(caW, vec3(0.001));
  col *= mix(0.97, 1.0, smoothstep(0.0, 0.38, shapeND));

  float r2 = shapeND * shapeND * 0.25;
  float gs = max(uNovaSize * uGlow * 0.003, 0.004);
  float nova = exp(-r2 / gs) + exp(-r2 / (gs * 7.0)) * 0.18;
  vec3 glow = vec3(nova * uWhiteGlow * (uGlow / 17.0) * 1.15);

  float dC = shapeND * 0.5;
  float tR = clamp(uRingRadius, 0.1, 0.49);
  float rW = max(uRingWidth, 0.003);
  float ring = bell((dC - tR) / rW) * uBlueRing * (uGlow / 17.0) * 1.8;
  if (uShimmer > 0.5) ring *= sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth + (1.0 - uShimmerDepth);
  float ringAura = bell((dC - tR) / (rW * 6.0)) * 0.28 * uBlueRing * (uGlow / 17.0);
  glow += uBlueColor * (ring + ringAura);
  glow += vec3(bell((dC - uRimLinePos) / max(uRimLineWidth, 0.0001)) * uRimLine);

  // the glows were tuned on a white page, where they vanish over the ground and only light the
  // images; on the warm paper they would paint a white band, so they light what is darker than it
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col += glow * mix(0.12, 1.0, 1.0 - smoothstep(0.7, 0.93, luma));

  outA = smoothstep(1.0, 0.93, maskND);
  return col;
}

void main() {
  vec4 d = texture(uDisp, vUv);
  float theta = d.r * 2.0 * PI;
  gRip = vec2(sin(theta), cos(theta)) * d.r * uStrength;
  float a = 0.0;
  vec3 c = discLens(uCenter, uAspect, a);
  fragColor = vec4(mix(scene(vUv), c, a), 1.0);
}`;

type Program = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };
type Slot = { srcIndex: number; rep: number };
type Rect = { left: number; right: number; top: number; bottom: number; slot: number; srcIndex: number; centerX: number };
type Wave = { x: number; y: number; scale: number; rot: number; alpha: number; on: boolean };

function program(gl: WebGL2RenderingContext, vs: string, fs: string): Program | null {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  const u: Program['u'] = {};
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
    const info = gl.getActiveUniform(p, i);
    if (info) u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

export function glassCarousel(mount: HTMLElement, items: GlassItem[], opts: Options): GlassApi | null {
  if (!items.length) return null;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', touchAction: 'pan-y', userSelect: 'none' });
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) return null;
  const cardProg = program(gl, RECT_VS, CARD_FS);
  const waveProg = program(gl, RECT_VS, WAVE_FS);
  const lensProg = program(gl, QUAD_VS, LENS_FS);
  if (!cardProg || !waveProg || !lensProg) return null;
  mount.append(canvas);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = reduced ? 0.28 : 0.09;
  const SNAP_EASE = reduced ? 0.22 : 0.05;
  const DRAG = 1.6, TOUCH_DRAG = 1, TOUCH_EASE = 0.22, WHEEL = 1.4;
  const FRICTION = 0.865, SNAP_IDLE_MS = 120;
  const SHRINK_MAX = 60, SHRINK_ATTACK = 0.25, SHRINK_DECAY = 0.06;

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  /* ---------- textures ---------- */
  const textures = items.map((item) => {
    const s = { tex: gl.createTexture()!, ready: false };
    const upload = (src: TexImageSource) => {
      gl.bindTexture(gl.TEXTURE_2D, s.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      s.ready = true;
    };
    if (typeof item.source === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => upload(img);
      img.src = item.source;
    } else {
      upload(item.source);
    }
    return s;
  });

  /* ---------- render targets ---------- */
  let W = 1, H = 1, dpr = 1;
  let PANEL_H = 300;
  const target = (): Target => {
    const tex = gl.createTexture()!;
    const fbo = gl.createFramebuffer()!;
    return { tex, fbo };
  };
  const sceneRT = target(), dispRT = target();
  const sizeTarget = (t: Target) => {
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.round(W * dpr), Math.round(H * dpr), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
  };

  /* ---------- the row ---------- */
  const N = items.length;
  const slotWidth = (i: number) => items[i].aspect * PANEL_H + PANEL.gap;
  let offsets: number[] = [];
  let totalWidth = 0;
  const recomputeTotal = () => {
    offsets = [];
    let acc = 0;
    for (let i = 0; i < N; i++) { offsets.push(acc); acc += slotWidth(i); }
    totalWidth = acc;
  };
  const slotCenter = (i: number) => offsets[i] + slotWidth(i) / 2 - PANEL.gap / 2;
  const centerForIndex = (idx: number) => {
    const loop = Math.floor(idx / N), s = ((idx % N) + N) % N;
    return slotCenter(s) + loop * totalWidth;
  };
  const nearest = (value: number, only?: number) => {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      if (only !== undefined && i !== only) continue;
      const k = Math.round((value - slotCenter(i)) / totalWidth);
      const dist = Math.abs(slotCenter(i) + k * totalWidth - value);
      if (dist < bestDist) { bestDist = dist; best = i + k * N; }
    }
    return best;
  };
  const centerIndex = (value: number) => ((nearest(value) % N) + N) % N;

  const slots: Slot[] = [];
  for (let rep = 0; rep < REPEATS; rep++) for (let i = 0; i < N; i++) slots.push({ srcIndex: i, rep });

  let scroll = 0, goal = 0, velocity = 0, prevScroll = 0, scrollEnergy = 0;
  let lastInput = performance.now(), snapped = false;
  let pendingOpen: number | null = null;
  let lastCenter = -1;
  let lensFx = reduced ? 1 : 0;
  const rise = slots.map(() => (reduced ? 1 : 0));
  let entering = !reduced;

  let rects: Rect[] = [];
  let centered: Rect | null = null;
  const draws: { rect: [number, number, number, number]; src: number }[] = [];

  const layout = () => {
    rects = [];
    draws.length = 0;
    centered = null;
    let centeredDist = Infinity;
    const half = W / 2;
    const shrink = 1 - 0.25 * scrollEnergy;
    slots.forEach((slot, si) => {
      const i = slot.srcIndex;
      let x = slotCenter(i) - scroll;
      x = ((x % totalWidth) + totalWidth) % totalWidth;
      x += (slot.rep - Math.floor(REPEATS / 2)) * totalWidth;
      if (x > half + totalWidth) x -= totalWidth * REPEATS;
      if (x < -half - PANEL_H || x > half + PANEL_H) return;
      const h = PANEL_H * shrink, w = items[i].aspect * PANEL_H * shrink;
      // on arrival the cards rise into the row from below
      const below = -H * ENTRY.from;
      const y = below * (1 - rise[si]);
      draws.push({ rect: [x, y, w, h], src: i });
      const r = { left: x + W / 2 - w / 2, right: x + W / 2 + w / 2, top: H / 2 - y - h / 2, bottom: H / 2 - y + h / 2, slot: si, srcIndex: i, centerX: x };
      rects.push(r);
      if (Math.abs(x) < centeredDist) { centeredDist = Math.abs(x); centered = r; }
    });
  };

  /* ---------- ripples ---------- */
  const waves: Wave[] = Array.from({ length: RIPPLE.count }, () => ({ x: 0, y: 0, scale: 1, rot: 0, alpha: 0, on: false }));
  let waveCursor = 0;
  let prevPointer = { x: NaN, y: NaN };
  const spawnWave = (x: number, y: number) => {
    if (reduced) return;
    const px = x - W / 2, py = H / 2 - y;
    if (Number.isFinite(prevPointer.x) && Math.abs(px - prevPointer.x) <= RIPPLE.threshold && Math.abs(py - prevPointer.y) <= RIPPLE.threshold) return;
    prevPointer = { x: px, y: py };
    const w = waves[waveCursor];
    Object.assign(w, { x: px, y: py, scale: 1.75, rot: Math.random() * Math.PI, alpha: 1, on: true });
    waveCursor = (waveCursor + 1) % waves.length;
  };
  const stepWaves = () => {
    for (const w of waves) {
      if (!w.on) continue;
      w.rot += RIPPLE.spin;
      w.scale = 0.98 * w.scale + RIPPLE.growth;
      w.alpha *= RIPPLE.fade;
      if (w.alpha <= 0.01) w.on = false;
    }
  };

  /* ---------- drawing ---------- */
  const time0 = performance.now();
  const draw = () => {
    const fbW = Math.round(W * dpr), fbH = Math.round(H * dpr);
    gl.useProgram(cardProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneRT.fbo);
    gl.viewport(0, 0, fbW, fbH);
    gl.clearColor(...opts.background, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(cardProg.u.uHalf, W / 2, H / 2);
    gl.uniform1f(cardProg.u.uRot, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(cardProg.u.uTex, 0);
    for (const d of draws) {
      const t = textures[d.src];
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.uniform1f(cardProg.u.uReady, t.ready ? 1 : 0);
      gl.uniform3f(cardProg.u.uBase, ...items[d.src].base);
      gl.uniform4f(cardProg.u.uRect, ...d.rect);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.useProgram(waveProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dispRT.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(waveProg.u.uHalf, W / 2, H / 2);
    for (const w of waves) {
      if (!w.on) continue;
      const size = RIPPLE.size * w.scale;
      gl.uniform4f(waveProg.u.uRect, w.x, w.y, size, size);
      gl.uniform1f(waveProg.u.uRot, w.rot);
      gl.uniform1f(waveProg.u.uAlpha, w.alpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable(gl.BLEND);

    gl.useProgram(lensProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const u = lensProg.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneRT.tex);
    gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, dispRT.tex);
    gl.uniform1i(u.uDisp, 1);
    gl.uniform1f(u.uStrength, reduced ? 0 : RIPPLE.strength);
    gl.uniform2f(u.uCenter, 0.5, 0.5);
    gl.uniform1f(u.uSizeX, LENS.sizeX);
    gl.uniform1f(u.uSizeY, LENS.sizeY);
    gl.uniform1f(u.uAspect, W / H);
    gl.uniform1f(u.uRotation, (LENS.rotation * Math.PI) / 180);
    gl.uniform1f(u.uDispersion, LENS.dispersion * lensFx);
    gl.uniform1f(u.uGlow, LENS.glow);
    gl.uniform1f(u.uWhiteGlow, LENS.whiteGlow);
    gl.uniform1f(u.uNovaSize, LENS.novaSize);
    gl.uniform1f(u.uBlueRing, LENS.blueRing * lensFx);
    gl.uniform1f(u.uRingRadius, LENS.ringRadius);
    gl.uniform1f(u.uRingWidth, LENS.ringWidth);
    gl.uniform1f(u.uShimmer, reduced ? 0 : 1);
    gl.uniform1f(u.uShimmerFreq, LENS.shimmerFreq);
    gl.uniform1f(u.uShimmerSpeed, LENS.shimmerSpeed);
    gl.uniform1f(u.uShimmerDepth, LENS.shimmerDepth);
    gl.uniform1f(u.uTime, (performance.now() - time0) / 1000);
    gl.uniform1f(u.uRimStart, LENS.rimStart);
    gl.uniform1f(u.uRimTangential, LENS.rimTangential * lensFx);
    gl.uniform1f(u.uRimFreq1, LENS.rimFreq1);
    gl.uniform1f(u.uRimFreq2, LENS.rimFreq2);
    gl.uniform3f(u.uBlueColor, LENS.ringColor[0], LENS.ringColor[1], LENS.ringColor[2]);
    gl.uniform1f(u.uRimLine, LENS.rimLine * lensFx);
    gl.uniform1f(u.uRimLinePos, LENS.rimLinePos);
    gl.uniform1f(u.uRimLineWidth, LENS.rimLineWidth);
    gl.uniform1i(u.uSamples, LENS.samples);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  /* ---------- input ---------- */
  let dragging = false, dragId: number | null = null, dragType = 'mouse';
  let dragLastX = 0, dragDist = 0, dragVel = 0, dragMoveT = 0, suppressClick = false;
  let pointer = { x: NaN, y: NaN, inside: false, type: 'mouse' };

  // the canvas may be drawn scaled (the page shrinks it when a project opens), so map back to its own pixels
  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / (r.width || 1), y: ((e.clientY - r.top) * H) / (r.height || 1) };
  };
  const hit = (x: number, y: number) => rects.find((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) ?? null;

  const cursor = opts.cursor ?? null;
  const moveX = cursor ? gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
  const moveY = cursor ? gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3.out' }) : null;
  if (cursor) gsap.set(cursor, { xPercent: 20, yPercent: 30, scale: 0, autoAlpha: 0 });
  let cursorOn = false;
  const showCursor = (on: boolean) => {
    on = on && !dragging && !entering;
    canvas.style.cursor = dragging ? 'grabbing' : on ? 'grab' : '';
    if (!cursor || on === cursorOn) return;
    cursorOn = on;
    gsap.to(cursor, { scale: on ? 1 : 0, autoAlpha: on ? 1 : 0, duration: on ? 0.35 : 0.25, ease: on ? 'power3.out' : 'power3.in', overwrite: 'auto' });
  };

  const onWheel = (e: WheelEvent) => {
    // only sideways scrolling moves the row; the page keeps the vertical wheel
    if (entering || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    pendingOpen = null;
    goal += e.deltaX * WHEEL;
    lastInput = performance.now();
    snapped = false;
  };
  const onDown = (e: PointerEvent) => {
    suppressClick = false;
    if (entering || dragging || (e.button !== 0 && e.pointerType === 'mouse')) return;
    dragging = true;
    dragId = e.pointerId;
    dragType = e.pointerType || 'mouse';
    try { canvas.setPointerCapture(e.pointerId); } catch { /* best effort */ }
    const p = local(e);
    dragLastX = p.x;
    dragDist = 0;
    dragVel = 0;
    dragMoveT = performance.now();
    velocity = 0;
    pendingOpen = null;
    snapped = false;
    lastInput = dragMoveT;
    showCursor(false);
  };
  const onMove = (e: PointerEvent) => {
    const p = local(e);
    if (dragging && e.pointerId === dragId) {
      const sens = dragType === 'mouse' ? DRAG : TOUCH_DRAG;
      const dx = p.x - dragLastX;
      dragLastX = p.x;
      dragDist += Math.abs(dx);
      goal -= dx * sens;
      dragVel = dragVel * 0.6 + -dx * sens * 0.4;
      dragMoveT = performance.now();
      lastInput = dragMoveT;
      snapped = false;
    }
    pointer = { x: p.x, y: p.y, inside: true, type: e.pointerType || 'mouse' };
    spawnWave(p.x, p.y);
    if (e.pointerType !== 'mouse') return;
    moveX?.(p.x);
    moveY?.(p.y);
    showCursor(hit(p.x, p.y) !== null);
  };
  const onUp = (e?: PointerEvent) => {
    if (!dragging || (e && dragId !== null && e.pointerId !== dragId)) return;
    dragging = false;
    if (dragId !== null) { try { canvas.releasePointerCapture(dragId); } catch { /* released */ } dragId = null; }
    velocity = performance.now() - dragMoveT > FLICK_IDLE_MS ? 0 : dragVel;
    dragVel = 0;
    lastInput = performance.now();
    snapped = false;
    suppressClick = dragDist > (dragType === 'mouse' ? CLICK_SLOP : TOUCH_CLICK_SLOP);
    if (dragType === 'mouse') showCursor(hit(pointer.x, pointer.y) !== null);
  };
  const onLeave = () => { pointer.inside = false; prevPointer = { x: NaN, y: NaN }; showCursor(false); };
  const onClick = (e: MouseEvent) => {
    if (suppressClick) { suppressClick = false; return; }
    if (entering) return;
    const p = local(e);
    const h = hit(p.x, p.y);
    if (!h) return;
    // the card under the lens opens; any other card slides to the lens first, then opens
    if (centered && h.slot === centered.slot) { opts.onOpen(h.srcIndex); return; }
    velocity = 0;
    goal = centerForIndex(nearest(scroll + h.centerX));
    snapped = true;
    pendingOpen = h.srcIndex;
  };

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  /* ---------- loop ---------- */
  let raf = 0, running = true, visible = true;
  const tick = () => {
    raf = 0;
    if (!running || !visible || document.hidden) return;
    if (!dragging) {
      goal += velocity;
      velocity *= FRICTION;
      if (Math.abs(velocity) < 0.05) velocity = 0;
      if (!snapped && performance.now() - lastInput > SNAP_IDLE_MS) {
        goal = centerForIndex(nearest(scroll));
        snapped = true;
      }
    }
    const follow = dragging && dragType !== 'mouse' ? TOUCH_EASE : snapped && pendingOpen === null ? SNAP_EASE : EASE;
    scroll += (goal - scroll) * follow;

    const ci = centerIndex(scroll);
    if (ci !== lastCenter) { lastCenter = ci; opts.onActive(ci); }

    // the cards narrow a little while the row moves fast
    const norm = Math.min(1, Math.abs(scroll - prevScroll) / SHRINK_MAX);
    prevScroll = scroll;
    scrollEnergy += (norm - scrollEnergy) * (norm > scrollEnergy ? SHRINK_ATTACK : SHRINK_DECAY);

    stepWaves();
    layout();
    if (pendingOpen !== null && Math.abs(goal - scroll) < 0.5) {
      const want = pendingOpen;
      pendingOpen = null;
      if (centered?.srcIndex === want) opts.onOpen(want);
    }
    draw();
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (running && !raf) raf = requestAnimationFrame(tick); };

  const resize = () => {
    W = Math.max(1, mount.clientWidth);
    H = Math.max(1, mount.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    PANEL_H = Math.max(120, Math.min(PANEL.height, Math.round(H * 0.52)));
    const centerItem = lastCenter < 0 ? 0 : lastCenter;
    recomputeTotal();
    sizeTarget(sceneRT);
    sizeTarget(dispRT);
    scroll = goal = centerForIndex(centerItem);
  };
  resize();

  // the cards rise in once the row is on screen, then the lens blooms
  const playEntry = () => {
    if (!entering) return;
    layout();
    const shown = slots.map((_, i) => i).filter((i) => {
      const s = slots[i];
      let x = slotCenter(s.srcIndex) - scroll;
      x = ((x % totalWidth) + totalWidth) % totalWidth + (s.rep - Math.floor(REPEATS / 2)) * totalWidth;
      if (x > W / 2 + totalWidth) x -= totalWidth * REPEATS;
      return x >= -W / 2 - PANEL_H && x <= W / 2 + PANEL_H;
    });
    slots.forEach((_, i) => { if (!shown.includes(i)) rise[i] = 1; });
    const tl = gsap.timeline({ delay: ENTRY.delay, onComplete: () => { entering = false; } });
    const spread = ENTRY.stagger * Math.max(shown.length - 1, 1);
    let end = 0;
    for (const i of shown) {
      const at = Math.random() * spread;
      end = Math.max(end, at + ENTRY.rise);
      tl.to(rise, { [i]: 1, duration: ENTRY.rise, ease: 'power3.out' }, at);
    }
    const fx = { v: 0 };
    tl.to(fx, { v: 1, duration: ENTRY.bloom, ease: 'power2.inOut', onUpdate: () => { lensFx = fx.v; } }, end * 0.6);
  };

  const ro = new ResizeObserver(() => {
    if (Math.abs(mount.clientWidth - W) > 1 || Math.abs(mount.clientHeight - H) > 1) resize();
  });
  ro.observe(mount);
  let played = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      if (!played) { played = true; playEntry(); }
      start();
    }
  });
  io.observe(mount);
  const onVisibility = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVisibility);

  const step = (dir: number) => {
    if (entering) return;
    velocity = 0;
    pendingOpen = null;
    goal = centerForIndex(nearest(scroll) + dir);
    snapped = true;
    lastInput = performance.now();
  };

  return {
    select(index) {
      velocity = 0;
      pendingOpen = null;
      goal = centerForIndex(nearest(scroll, index));
      snapped = true;
      lastInput = performance.now();
      if (entering) { scroll = goal; }
    },
    next: () => step(1),
    previous: () => step(-1),
    current: () => centerIndex(scroll),
    resize,
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    },
  };
}
