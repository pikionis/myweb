import { bean, tear, archFrom, archTo, letterSpans, type Pt } from '../data/logo-curves';
import { letters, stroke } from '../data/logo';

/*
 * The opening intro's picture, "Everything meets at one point": a pure function of time, drawn on a canvas.
 *
 *   0–0.5s    a rising line (ivory) and its baseline (cobalt) draw themselves, like the smallest chart
 *   0.5–1.5   the rising line becomes the bean (the two side loops and the line between them), then the
 *             baseline becomes the teardrop (the top loop and the arc), each turned away in space
 *   1.5–2.0   both spin, faster and faster, and stop dead as the symbol
 *   2.0       lock: the top loop is struck ivory over the cobalt, the symbol swells a little and settles
 *   2.5–4.3   the symbol steps left and o n e h u b rise beside it, a letter every quarter second
 *   4.4+      hand-off: the lockup flies onto the header's logo (intro.ts gives the place)
 *
 * Everything is drawn in a 1920 × 1080 scene around (960, 540); intro.ts fits that to the screen. No state is
 * kept between frames, so a frame can be drawn at any time (the still version draws the last one).
 */

export const REEL = { handoff: 4.4, fly: 0.85 };

/** Where the header's logo is, in scene units: each box's top left corner and the size of one of its units. */
export type Landing = { sym: Box; word: Box | null };
type Box = { x: number; y: number; k: number };

const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** exponential out */
const eo = (x: number) => { x = cl(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
/** exponential in-out */
const eio = (x: number) => {
  x = cl(x);
  return x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
const between = (a: Pt, b: Pt, k: number): Pt => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

/** n + 1 points evenly spaced along a polyline. */
function resample(p: Pt[], n: number): Pt[] {
  const d = [0];
  for (let i = 1; i < p.length; i++) d.push(d[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (d[d.length - 1] * i) / n;
    while (j < p.length - 2 && d[j + 1] < s) j++;
    out.push(between(p[j], p[j + 1], cl((s - d[j]) / (d[j + 1] - d[j] || 1))));
  }
  return out;
}
/** The first share k of a polyline. */
function partial(p: Pt[], k: number): Pt[] {
  const n = (p.length - 1) * cl(k), i = Math.floor(n), out = p.slice(0, i + 1);
  if (i < p.length - 1) out.push(between(p[i], p[i + 1], n - i));
  return out;
}
function line(c: CanvasRenderingContext2D, p: Pt[], colour: string, width: number) {
  if (width <= 0.01 || p.length < 2) return;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = colour; c.lineWidth = width;
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  c.stroke();
}

const N = bean.length - 1;
// the chart the symbol is made from: twelve rising values and the line they stand on
const RISE: Pt[] = resample([1.6, 2, 2.2, 2.6, 3, 3.2, 3.4, 4, 4.4, 4.8, 5.4, 5.8].map((h, i): Pt => [410 + 100 * i, 840 - h * 100]), N);
const BASE: Pt[] = resample([[360, 840], [1560, 840]], N);
// the symbol large in the middle (BIG scene units per symbol unit), then in the lockup (SMALL), whose top left is LOCK
const BIG = 0.72, SMALL = 1100 / 2698.3, LOCK = { x: 410, y: 347.7 };
// the wordmark's box in the horizontal lockup, in symbol units
const WORD = { x: 1087.4, y: 211.5, k: 0.94648 };
const CX = 443, CY = 398, FOCAL = 1600;

/** A symbol point, large in the middle of the scene and turned by `a` about the upright axis. */
function turned(p: Pt, a: number): Pt {
  const X = (p[0] - CX) * BIG, x = X * Math.cos(a), z = X * Math.sin(a), s = FOCAL / (FOCAL + z);
  return [960 + x * s, 540 + (p[1] - CY) * BIG * s];
}

let glyphs: Path2D[] | null = null;

export function drawReel(c: CanvasRenderingContext2D, t: number, ivory: string, cobalt: string, landing: Landing | null = null) {
  if (t < 0.5) {
    line(c, partial(BASE, eo(t / 0.4)), cobalt, 10);
    line(c, partial(RISE, eo((t - 0.08) / 0.4)), ivory, 8);
    return;
  }
  if (t < 2) {
    const k1 = eo((t - 0.5) / 0.45), k2 = eo((t - 1) / 0.45);
    // turned away, drifting, then spun through to flat with all the speed at the end
    const a = mix(1 - 0.15 * (t - 0.5), 2 * Math.PI, Math.pow(cl((t - 1.5) / 0.5), 3));
    line(c, BASE.map((p, i) => between(p, turned(tear[i], -a), k2)), cobalt, mix(10, stroke * BIG, k2));
    line(c, RISE.map((p, i) => between(p, turned(bean[i], a), k1)), ivory, mix(8, stroke * BIG, k1));
    return;
  }
  // the symbol: large, then in the lockup, then onto the header's
  const m = eo((t - 2.5) / 0.4), q = landing ? eio((t - REEL.handoff) / REEL.fly) : 0;
  let k = mix(BIG, SMALL, m) * (1 + 0.05 * Math.exp(-(t - 2) * 9));
  let x = mix(960, LOCK.x + CX * SMALL, m) - CX * k, y = mix(540, LOCK.y + CY * SMALL, m) - CY * k;
  if (landing) { x = mix(x, landing.sym.x, q); y = mix(y, landing.sym.y, q); k = mix(k, landing.sym.k, q); }
  const at = (p: Pt): Pt => [x + p[0] * k, y + p[1] * k];
  const drop = tear.map(at);
  line(c, drop, cobalt, stroke * k);
  line(c, partial(drop.slice(archFrom, archTo + 1), eo((t - 2) / 0.35)), ivory, stroke * k);
  line(c, bean.map(at), ivory, stroke * k);

  // the wordmark: each letter rises from under its own baseline
  let wx = LOCK.x + WORD.x * SMALL, wy = LOCK.y + WORD.y * SMALL, wk = SMALL * WORD.k, sink = 0;
  if (landing?.word) { wx = mix(wx, landing.word.x, q); wy = mix(wy, landing.word.y, q); wk = mix(wk, landing.word.k, q); }
  else if (landing) sink = q; // a header that shows only the symbol: the letters go back down
  glyphs ??= letters.map((l) => new Path2D(l.d));
  c.fillStyle = ivory;
  glyphs.forEach((g, i) => {
    const rise = eo((t - 2.75 - 0.25 * i) / 0.32);
    if (rise <= 0 || sink >= 1) return;
    c.save();
    c.translate(wx, wy); c.scale(wk, wk);
    c.beginPath(); c.rect(letterSpans[i][0] - 6, -6, letterSpans[i][1] - letterSpans[i][0] + 12, 404); c.clip();
    c.translate(0, (1 - rise) * 410 + sink * 410);
    c.fill(g, 'evenodd');
    c.restore();
  });
}
