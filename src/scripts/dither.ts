/**
 * Dithered wordmark: the big surname at the foot of every page, rebuilt as an error-diffusion dither
 * of square dots that shy away from the pointer and ripple out from a click.
 *
 * Ported from Componentry "Dithered Logo" by Harsh Jadhav (MIT) — https://componentry.fun.
 * The Floyd–Steinberg dither, the cursor push and the click ripples are theirs. Here the source is the
 * live text of the wordmark, drawn where the browser set it (so the real text stays for layout and
 * as the fallback), with a soft fade toward the cropped bottom edge.
 */

const RIPPLE_SPEED = 225;
const RIPPLE_WIDTH = 37;
const RIPPLE_FORCE = 20;
const RIPPLE_DURATION = 675;
const CURSOR_RADIUS = 100;
const CURSOR_FORCE = 40;
const LERP = 0.12;
const SNAP = 0.01;
const THRESHOLD = 180;
// dot pitch in CSS px, and how much of it each dot fills
const CELL = (w: number) => (w < 640 ? 4 : 6);
const DOT = 0.8;

type Ripple = { x: number; y: number; start: number };

/** Floyd–Steinberg with a serpentine scan, only inside the letters; returns the lit cells as x, y pairs. */
function dither(gray: Float32Array, alpha: Uint8ClampedArray, w: number, h: number) {
  const out: number[] = [];
  for (let y = 0; y < h; y++) {
    const ltr = y % 2 === 0;
    const step = ltr ? 1 : -1;
    for (let x = ltr ? 0 : w - 1; x !== (ltr ? w : -1); x += step) {
      const i = y * w + x;
      if (alpha[i] < 128) continue;
      const old = gray[i];
      const lit = old > THRESHOLD ? 255 : 0;
      const err = old - lit;
      if (lit) out.push(x, y);
      const spread = (nx: number, ny: number, k: number) => {
        if (nx < 0 || nx >= w || ny >= h) return;
        const ni = ny * w + nx;
        if (alpha[ni] >= 128) gray[ni] += err * k;
      };
      spread(x + step, y, 7 / 16);
      spread(x - step, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + step, y + 1, 1 / 16);
    }
  }
  return out;
}

export function ditheredText(el: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'dither';
  canvas.setAttribute('aria-hidden', 'true');
  el.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  let W = 0, H = 0, dpr = 1, size = 4;
  let baseX = new Float32Array(0), baseY = new Float32Array(0);
  let offX = new Float32Array(0), offY = new Float32Array(0);
  const cursor = { x: 0, y: 0, on: false };
  const ripples: Ripple[] = [];
  let raf = 0;

  const build = () => {
    W = el.offsetWidth;
    H = el.offsetHeight;
    if (W < 2 || H < 2) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const cell = CELL(W);
    size = cell * DOT;
    const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);

    // the text, drawn into the dither grid exactly where the browser laid it out
    const cs = getComputedStyle(el);
    const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const tr = range.getBoundingClientRect(), er = el.getBoundingClientRect();
    const text = cs.textTransform === 'uppercase' ? node.textContent!.trim().toUpperCase() : node.textContent!.trim();
    const fontPx = parseFloat(cs.fontSize) / cell;
    const paint = (g: CanvasRenderingContext2D, fill: string | CanvasGradient, blur: number) => {
      g.clearRect(0, 0, gw, gh);
      g.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
      if ('letterSpacing' in g) g.letterSpacing = `${parseFloat(cs.letterSpacing) / cell || 0}px`;
      g.textBaseline = 'alphabetic';
      g.filter = blur ? `blur(${blur}px)` : 'none';
      g.fillStyle = fill;
      const m = g.measureText(text);
      const ascent = m.fontBoundingBoxAscent ?? fontPx * 0.8, descent = m.fontBoundingBoxDescent ?? fontPx * 0.2;
      const top = (tr.top - er.top) / cell, boxH = tr.height / cell;
      g.fillText(text, (tr.left - er.left) / cell, top + (boxH - ascent - descent) / 2 + ascent);
    };
    const shape = Object.assign(document.createElement('canvas'), { width: gw, height: gh }).getContext('2d', { willReadFrequently: true })!;
    paint(shape, '#fff', 0);
    const alpha = new Uint8ClampedArray(gw * gh);
    const a = shape.getImageData(0, 0, gw, gh).data;
    for (let i = 0; i < alpha.length; i++) alpha[i] = a[i * 4 + 3];

    // a soft blur and a fade toward the cropped bottom give the dither its grain
    const tone = Object.assign(document.createElement('canvas'), { width: gw, height: gh }).getContext('2d', { willReadFrequently: true })!;
    const fade = tone.createLinearGradient(0, 0, 0, gh);
    // the bottom of the word is cut by the page edge, so the thinning starts high enough to be seen
    fade.addColorStop(0, '#fff');
    fade.addColorStop(0.22, '#e6e6e6');
    fade.addColorStop(0.68, '#8c8c8c');
    fade.addColorStop(1, '#454545');
    paint(tone, fade, 0.6);
    const px = tone.getImageData(0, 0, gw, gh).data;
    const gray = new Float32Array(gw * gh);
    for (let i = 0; i < gray.length; i++) {
      const al = px[i * 4 + 3] / 255;
      gray[i] = al > 0.01 ? (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / al : 0;
    }

    const pts = dither(gray, alpha, gw, gh);
    const n = pts.length / 2;
    baseX = new Float32Array(n); baseY = new Float32Array(n);
    offX = new Float32Array(n); offY = new Float32Array(n);
    for (let i = 0; i < n; i++) { baseX[i] = pts[i * 2] * cell; baseY[i] = pts[i * 2 + 1] * cell; }
    el.classList.add('dithered');
    draw();
  };

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(canvas).color;
    const s = size * dpr;
    for (let i = 0; i < baseX.length; i++) ctx.fillRect((baseX[i] + offX[i]) * dpr, (baseY[i] + offY[i]) * dpr, s, s);
  };

  /** Moves every dot toward where the pointer and the ripples push it; true while anything still moves. */
  const step = (now: number) => {
    for (let k = ripples.length - 1; k >= 0; k--) if (now - ripples[k].start >= RIPPLE_DURATION) ripples.splice(k, 1);
    const rippleMul = ripples.length ? 1 + 0.5 * (ripples.length - 1) : 0;
    let moving = false;
    for (let i = 0; i < baseX.length; i++) {
      let fx = 0, fy = 0;
      if (cursor.on) {
        const vx = baseX[i] + offX[i] - cursor.x, vy = baseY[i] + offY[i] - cursor.y;
        const d2 = vx * vx + vy * vy;
        if (d2 > 0.1 && d2 < CURSOR_RADIUS * CURSOR_RADIUS) {
          const d = Math.sqrt(d2);
          const f = (1 - d / CURSOR_RADIUS) ** 3 * CURSOR_FORCE;
          fx += (vx / d) * f;
          fy += (vy / d) * f;
        }
      }
      for (const r of ripples) {
        const t = now - r.start;
        const radius = (t / 1000) * RIPPLE_SPEED;
        const sx = baseX[i] - r.x, sy = baseY[i] - r.y;
        const d = Math.sqrt(sx * sx + sy * sy);
        if (d < 0.1) continue;
        const band = Math.abs(d - radius);
        if (band < RIPPLE_WIDTH) {
          const wf = (1 - band / RIPPLE_WIDTH) * (1 - t / RIPPLE_DURATION) * RIPPLE_FORCE * rippleMul;
          fx += (sx / d) * wf;
          fy += (sy / d) * wf;
        }
      }
      offX[i] += (fx - offX[i]) * LERP;
      offY[i] += (fy - offY[i]) * LERP;
      if (Math.abs(offX[i]) < SNAP) offX[i] = 0;
      if (Math.abs(offY[i]) < SNAP) offY[i] = 0;
      if (offX[i] || offY[i]) moving = true;
    }
    return moving || ripples.length > 0 || cursor.on;
  };

  const tick = (now: number) => {
    raf = 0;
    const more = step(now);
    draw();
    if (more) raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  if (!reduce) {
    canvas.addEventListener('pointermove', (e) => { Object.assign(cursor, local(e), { on: true }); start(); });
    canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { cursor.on = false; start(); } });
    canvas.addEventListener('pointercancel', () => { cursor.on = false; start(); });
    canvas.addEventListener('pointerup', (e) => {
      ripples.push({ ...local(e), start: performance.now() });
      if (e.pointerType !== 'mouse') cursor.on = false;
      start();
    });
  }

  let rt = 0, lastW = 0;
  new ResizeObserver(() => {
    if (Math.abs(el.offsetWidth - lastW) < 2) return;
    lastW = el.offsetWidth;
    clearTimeout(rt);
    rt = window.setTimeout(build, 150);
  }).observe(el);
  (document.fonts?.ready ?? Promise.resolve()).then(() => { lastW = el.offsetWidth; build(); });
}
