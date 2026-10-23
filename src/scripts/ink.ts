/**
 * Ink headline: the curtain title is written in ink that bleeds when stirred and gathers again.
 *
 * Ported from KokonutUI "Ink Background" by @dorianbaffier (MIT) — https://kokonutui.com
 * The stable-fluids solver is the original. Changed for this site: no React/Tailwind, the letters
 * are laid exactly over the real <h1> (which stays in the HTML as the fallback and for screen
 * readers), the accent word gathers in its own channel, and the canvas is transparent so the
 * curtain halves underneath still open on scroll.
 */

// The velocity field is solved on a grid this many cells on its short side; the ink on a finer one.
const SIM = 128;
const DYE = 512;
const PRESSURE_ITERATIONS = 20;
// How fast stirred ink fades away, and how fast velocity calms down.
const DYE_FADE = 0.35;
const VELOCITY_FADE = 1.2;
// Swirl kept in the flow, so stirring curls instead of smearing.
const CURL = 22;
// The headline pulls its ink back at this rate per frame once left alone (after GATHER_AFTER ms,
// reaching full pull over GATHER_RAMP ms). It is the page title, so it comes back fast.
const GATHER = 0.12;
const GATHER_AFTER = 250;
const GATHER_RAMP = 400;
// Pull kept even mid-stir, so the title bleeds but never dissolves.
const GATHER_FLOOR = 0.02;
// The load bloom: the letters fill in over this long (ms).
const BLOOM = 700;
// The loop stops after this long with nothing moving it.
const SLEEP_AFTER = 5000;
const STIR_FORCE = 5200;
const STIR_RADIUS = 0.0018;
const DROP_RADIUS = 0.0035;

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0);
  vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y);
  vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 o;
`;

const SHADERS = {
  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  vec3 s = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`,
  advect: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 simTexel;
uniform float dt;
uniform float fade;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
  o = texture(uSource, coord) / (1.0 + fade * dt);
}`,
  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).x;
  float r = texture(uVelocity, vR).x;
  float t = texture(uVelocity, vT).y;
  float b = texture(uVelocity, vB).y;
  vec2 c = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { l = -c.x; }
  if (vR.x > 1.0) { r = -c.x; }
  if (vT.y > 1.0) { t = -c.y; }
  if (vB.y < 0.0) { b = -c.y; }
  o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`,
  curl: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).y;
  float r = texture(uVelocity, vR).y;
  float t = texture(uVelocity, vT).x;
  float b = texture(uVelocity, vB).x;
  o = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float l = texture(uCurl, vL).x;
  float r = texture(uCurl, vR).x;
  float t = texture(uCurl, vT).x;
  float b = texture(uCurl, vB).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= curl * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(r - l, t - b);
  o = vec4(v, 0.0, 1.0);
}`,
  scale: `${HEAD}
uniform sampler2D uTarget;
uniform float value;
void main() {
  o = value * texture(uTarget, vUv);
}`,
  // Pulls both inks back toward their letters: red is the headline, green the accent word.
  // Ink dropped away from the letters is drawn back to nothing, so the page settles clean.
  gather: `${HEAD}
uniform sampler2D uDye;
uniform sampler2D uMask;
uniform float rate;
void main() {
  vec4 d = texture(uDye, vUv);
  vec4 m = texture(uMask, vUv);
  o = vec4(mix(d.r, m.r, rate), mix(d.g, m.g, rate), 0.0, 1.0);
}`,
  // Premultiplied output on a transparent canvas: ink, then the accent over it.
  display: `${HEAD}
uniform sampler2D uDye;
uniform vec3 ink;
uniform vec3 accent;
void main() {
  vec4 d = texture(uDye, vUv);
  // A soft knee, so thin washes stay pale and dense ink goes solid.
  float a = smoothstep(0.02, 0.85, d.r);
  float b = smoothstep(0.02, 0.85, d.g) * 0.92;
  o = vec4(ink * a * (1.0 - b) + accent * b, a + b - a * b);
}`,
};

type ProgramName = keyof typeof SHADERS;
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type Double = { read: Target; write: Target; swap: () => void };
type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
  return shader;
}

function link(gl: WebGL2RenderingContext, vertex: WebGLShader, source: string): Program | null {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (!(fragment && program)) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const uniforms: Program['uniforms'] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/** Parses any CSS colour by painting it into one pixel. */
function toRgb(color: string, probe: CanvasRenderingContext2D) {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/**
 * A small stable-fluids solver (semi-Lagrangian advection, vorticity confinement, Jacobi
 * pressure), in the spirit of Jos Stam's paper and Pavel Dobryakov's WebGL port.
 * Returns null where half-float render targets aren't available.
 */
function createFluid(gl: WebGL2RenderingContext) {
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  if (!vertex) return null;
  const programs = {} as Record<ProgramName, Program>;
  for (const name of Object.keys(SHADERS) as ProgramName[]) {
    const made = link(gl, vertex, SHADERS[name]);
    if (!made) return null;
    programs[name] = made;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const textures: WebGLTexture[] = [];
  const framebuffers: WebGLFramebuffer[] = [];
  const params = () => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  const target = (w: number, h: number, internal: number, format: number): Target => {
    const tex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    params();
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    textures.push(tex); framebuffers.push(fbo);
    return { tex, fbo, w, h };
  };
  const double = (w: number, h: number, internal: number, format: number): Double => {
    const pair = {
      read: target(w, h, internal, format),
      write: target(w, h, internal, format),
      swap: () => { const t = pair.read; pair.read = pair.write; pair.write = t; },
    };
    return pair;
  };

  let velocity: Double, dye: Double, pressure: Double, divergence: Target, curl: Target;
  let aspect = 1;
  const mask = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, mask);
  params();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

  const free = () => {
    for (const t of textures) gl.deleteTexture(t);
    for (const f of framebuffers) gl.deleteFramebuffer(f);
    textures.length = 0; framebuffers.length = 0;
  };
  const sizeFor = (short: number) =>
    aspect >= 1 ? [Math.round(short * aspect), short] : [short, Math.round(short / aspect)];

  // Binds a program, its textures and its output, and draws the quad.
  let unit = 0;
  const run = (name: ProgramName, texel: [number, number]) => {
    const p = programs[name];
    gl.useProgram(p.program);
    gl.uniform2f(p.uniforms.texel, texel[0], texel[1]);
    unit = 0;
    return p;
  };
  const bind = (p: Program, uniform: string, tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.uniforms[uniform], unit);
    unit++;
  };
  const blit = (out: Target | null, w = 1, h = 1) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
    gl.viewport(0, 0, out ? out.w : w, out ? out.h : h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  let inkColor = [1, 1, 1], accentColor = [1, 1, 1];
  let canvasW = 1, canvasH = 1;

  return {
    resize(w: number, h: number) {
      canvasW = w; canvasH = h; aspect = w / h;
      free();
      const [sw, sh] = sizeFor(SIM);
      const [dw, dh] = sizeFor(DYE);
      velocity = double(sw, sh, gl.RG16F, gl.RG);
      pressure = double(sw, sh, gl.R16F, gl.RED);
      divergence = target(sw, sh, gl.R16F, gl.RED);
      curl = target(sw, sh, gl.R16F, gl.RED);
      dye = double(dw, dh, gl.RGBA16F, gl.RGBA);
    },
    setMask(source: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    },
    setColors(ink: number[], accent: number[]) { inkColor = ink; accentColor = accent; },
    splat(x: number, y: number, vx: number, vy: number, ink: number[], radius: number) {
      const r = radius * (aspect > 1 ? aspect : 1);
      let p = run('splat', [1 / velocity.read.w, 1 / velocity.read.h]);
      bind(p, 'uTarget', velocity.read.tex);
      gl.uniform1f(p.uniforms.aspect, aspect);
      gl.uniform2f(p.uniforms.point, x, y);
      gl.uniform3f(p.uniforms.color, vx, vy, 0);
      gl.uniform1f(p.uniforms.radius, r);
      blit(velocity.write); velocity.swap();
      if (ink[0] || ink[1]) {
        p = run('splat', [1 / dye.read.w, 1 / dye.read.h]);
        bind(p, 'uTarget', dye.read.tex);
        gl.uniform1f(p.uniforms.aspect, aspect);
        gl.uniform2f(p.uniforms.point, x, y);
        gl.uniform3f(p.uniforms.color, ink[0], ink[1], 0);
        gl.uniform1f(p.uniforms.radius, r);
        blit(dye.write); dye.swap();
      }
    },
    step(dt: number, gather: number) {
      const sim: [number, number] = [1 / velocity.read.w, 1 / velocity.read.h];
      let p = run('curl', sim);
      bind(p, 'uVelocity', velocity.read.tex);
      blit(curl);

      p = run('vorticity', sim);
      bind(p, 'uVelocity', velocity.read.tex);
      bind(p, 'uCurl', curl.tex);
      gl.uniform1f(p.uniforms.curl, CURL);
      gl.uniform1f(p.uniforms.dt, dt);
      blit(velocity.write); velocity.swap();

      p = run('divergence', sim);
      bind(p, 'uVelocity', velocity.read.tex);
      blit(divergence);

      p = run('scale', sim);
      bind(p, 'uTarget', pressure.read.tex);
      gl.uniform1f(p.uniforms.value, 0.8);
      blit(pressure.write); pressure.swap();

      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        p = run('pressure', sim);
        bind(p, 'uPressure', pressure.read.tex);
        bind(p, 'uDivergence', divergence.tex);
        blit(pressure.write); pressure.swap();
      }

      p = run('gradient', sim);
      bind(p, 'uPressure', pressure.read.tex);
      bind(p, 'uVelocity', velocity.read.tex);
      blit(velocity.write); velocity.swap();

      p = run('advect', sim);
      bind(p, 'uVelocity', velocity.read.tex);
      bind(p, 'uSource', velocity.read.tex);
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1]);
      gl.uniform1f(p.uniforms.dt, dt);
      gl.uniform1f(p.uniforms.fade, VELOCITY_FADE);
      blit(velocity.write); velocity.swap();

      p = run('advect', [1 / dye.read.w, 1 / dye.read.h]);
      bind(p, 'uVelocity', velocity.read.tex);
      bind(p, 'uSource', dye.read.tex);
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1]);
      gl.uniform1f(p.uniforms.dt, dt);
      gl.uniform1f(p.uniforms.fade, DYE_FADE);
      blit(dye.write); dye.swap();

      if (gather > 0) {
        // Calm the water as the letters gather, so they settle crisp.
        p = run('scale', sim);
        bind(p, 'uTarget', velocity.read.tex);
        gl.uniform1f(p.uniforms.value, 1 - gather);
        blit(velocity.write); velocity.swap();

        p = run('gather', [1 / dye.read.w, 1 / dye.read.h]);
        bind(p, 'uDye', dye.read.tex);
        bind(p, 'uMask', mask);
        gl.uniform1f(p.uniforms.rate, gather);
        blit(dye.write); dye.swap();
      }
    },
    draw() {
      const p = run('display', [1 / dye.read.w, 1 / dye.read.h]);
      bind(p, 'uDye', dye.read.tex);
      gl.uniform3fv(p.uniforms.ink, inkColor);
      gl.uniform3fv(p.uniforms.accent, accentColor);
      blit(null, canvasW, canvasH);
    },
  };
}

type Word = { text: string; x: number; y: number; h: number; accent: boolean };

/** Every word of the real headline, where the browser laid it out, relative to the root. */
function measureWords(h1: HTMLElement, root: DOMRect): Word[] {
  const words: Word[] = [];
  const walk = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const accent = !!node.parentElement?.closest('.a');
    for (const m of (node.textContent || '').matchAll(/\S+/g)) {
      range.setStart(node, m.index!);
      range.setEnd(node, m.index! + m[0].length);
      const r = range.getBoundingClientRect();
      words.push({ text: m[0], x: r.left - root.left, y: r.top - root.top, h: r.height, accent });
    }
  }
  return words;
}

/** Writes the headline into a canvas: ink letters in red, accent letters in green, on black. */
function drawMask(canvas: HTMLCanvasElement, h1: HTMLElement, words: Word[], width: number, height: number) {
  const scale = DYE / Math.min(width, height);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cs = getComputedStyle(h1);
  const size = parseFloat(cs.fontSize);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // A little blur gives the letters a wet, feathered edge to bleed from.
  ctx.filter = `blur(${Math.max(1, size * 0.012)}px)`;
  for (const w of words) {
    const text = cs.textTransform === 'uppercase' ? w.text.toUpperCase() : w.text;
    const m = ctx.measureText(text);
    // the range box is the font's content area, so its top plus the ascent is the baseline
    const ascent = m.fontBoundingBoxAscent ?? size * 0.8;
    const descent = m.fontBoundingBoxDescent ?? size * 0.2;
    ctx.fillStyle = w.accent ? '#00ff00' : '#ff0000';
    ctx.fillText(text, w.x, w.y + (w.h - ascent - descent) / 2 + ascent);
  }
}

export function inkHeadline(root: HTMLElement, canvas: HTMLCanvasElement, h1: HTMLElement) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const fluid = gl && probe ? createFluid(gl) : null;
  // No WebGL2 or half-float targets: the real <h1> stays as it is.
  if (!fluid || !probe) return;

  const maskCanvas = document.createElement('canvas');
  const cs = getComputedStyle(root);
  fluid.setColors(toRgb(cs.getPropertyValue('--fg') || '#fff', probe), toRgb(cs.getPropertyValue('--accent') || '#4d7cff', probe));

  let width = 0, height = 0, raf = 0, last = 0;
  // Time of the last stir, and of the last thing that moved the fluid.
  let touched = -Infinity;
  let active = performance.now();
  const born = performance.now();
  const hand = { x: 0, y: 0, on: false, down: false, moved: 0 };
  const shown = () => canvas.style.visibility !== 'hidden' && document.visibilityState === 'visible';

  const build = () => {
    const rect = root.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (width < 2 || height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    fluid.resize(canvas.width, canvas.height);
    drawMask(maskCanvas, h1, measureWords(h1, rect), width, height);
    fluid.setMask(maskCanvas);
    fluid.step(1 / 60, 0);
    fluid.draw();
  };

  // Ink drops land over the headline and the letters pull them in.
  const bloom = () => {
    const r = h1.getBoundingClientRect(), o = root.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const x = (r.left - o.left + r.width * ((i + Math.random() * 0.6) / 12)) / width;
      const y = 1 - (r.top - o.top + r.height * Math.random()) / height;
      fluid.splat(x, y, (Math.random() - 0.5) * 320, (Math.random() - 0.5) * 320, [0.45, 0], DROP_RADIUS * (0.6 + Math.random()));
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (!shown()) return;
    const dt = Math.min((now - (last || now - 16)) / 1000, 1 / 30);
    last = now;
    if (hand.down || hand.moved > now - 100) active = now;
    // Ease off while someone is stirring (never fully), then pull the letters back quickly.
    const idle = now - touched;
    let gather = GATHER_FLOOR;
    if (idle > GATHER_AFTER) gather = Math.max(gather, GATHER * Math.min(1, (idle - GATHER_AFTER) / GATHER_RAMP));
    // The bloom on load: the letters fill in fast.
    const age = now - born;
    if (age < BLOOM) gather = Math.max(gather, 0.03 + (age / BLOOM) * GATHER);
    fluid.step(dt, gather);
    fluid.draw();
    if (now - active < SLEEP_AFTER || age < 4000) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && shown()) { last = 0; raf = requestAnimationFrame(frame); }
  };

  build();
  root.classList.add('inked');
  bloom();
  start();

  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      const rect = root.getBoundingClientRect();
      if (Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1) {
        build(); active = performance.now(); touched = -Infinity; start();
      }
    }, 150);
  }).observe(root);
  document.addEventListener('visibilitychange', start);

  const local = (e: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
  };
  root.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (hand.on) {
      const dx = p.x - hand.x, dy = p.y - hand.y;
      if (dx || dy) {
        // Hovering stirs the water; dragging also lays down accent ink.
        fluid.splat(p.x, p.y, dx * STIR_FORCE, dy * STIR_FORCE, hand.down ? [0, 0.08] : [0, 0], STIR_RADIUS);
        touched = performance.now();
        hand.moved = touched;
      }
    }
    hand.x = p.x; hand.y = p.y; hand.on = true;
    start();
  });
  root.addEventListener('pointerleave', () => { hand.on = false; hand.down = false; });
  root.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const p = local(e);
    hand.down = true; hand.on = true; hand.x = p.x; hand.y = p.y;
    // A drop: a dab of accent ink pushed out in a ring.
    fluid.splat(p.x, p.y, 0, 0, [0, 0.65], DROP_RADIUS);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      fluid.splat(p.x + Math.cos(a) * 0.012 * (height / width), p.y + Math.sin(a) * 0.012,
        Math.cos(a) * 420, Math.sin(a) * 420, [0, 0], STIR_RADIUS * 0.6);
    }
    touched = performance.now(); active = touched;
    start();
  });
  const up = () => { hand.down = false; };
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
}
