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
 *   2.6       hand-off: the page is given back and the symbol flies to the top left, onto the header's logo
 *             shown larger (up to REEL.zoom times), anchored at its top left corner (intro.ts gives the place
 *             and how large it fits beside what else is in the bar)
 *   3.3–4.7   there, o n e h u b rise beside it, a letter every 0.22 s
 *   5.3–6.1   the lockup shrinks into the header's logo
 *
 * Everything is drawn in a 1920 × 1080 scene around (960, 540); intro.ts fits that to the screen. No state is
 * kept between frames, so a frame can be drawn at any time. The still version (reduced motion) is drawLockup().
 */

/** The moments, in seconds; `zoom` = at most how much larger than the header's logo the corner shows it. */
export const REEL = { handoff: 2.6, fly: 0.9, letters: 3.3, shrink: 5.3, end: 6.1, zoom: 2.2 };

/** Where the header's logo is, in scene units (each box's top left corner and the size of one of its units), and
 * how much larger the corner shows it. */
export type Landing = { sym: Box; word: Box | null; zoom: number };
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
// the symbol large in the middle (BIG scene units per symbol unit); the still lockup (SMALL), whose top left is LOCK
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

/** The symbol, its top left corner at (b.x, b.y), b.k scene units per symbol unit; `arc` = how far the top loop
 * is struck over the cobalt. */
function symbol(c: CanvasRenderingContext2D, b: Box, arc: number, ink: string, cobalt: string) {
  const at = (p: Pt): Pt => [b.x + p[0] * b.k, b.y + p[1] * b.k];
  const drop = tear.map(at);
  line(c, drop, cobalt, stroke * b.k);
  line(c, partial(drop.slice(archFrom, archTo + 1), arc), ink, stroke * b.k);
  line(c, bean.map(at), ink, stroke * b.k);
}
/** The wordmark in box b, each letter risen by its share in `rise` (0 = under its baseline, 1 = in place). */
function word(c: CanvasRenderingContext2D, b: Box, rise: (i: number) => number, ink: string) {
  glyphs ??= letters.map((l) => new Path2D(l.d));
  c.fillStyle = ink;
  glyphs.forEach((g, i) => {
    const r = rise(i);
    if (r <= 0) return;
    c.save();
    c.translate(b.x, b.y); c.scale(b.k, b.k);
    c.beginPath(); c.rect(letterSpans[i][0] - 6, -6, letterSpans[i][1] - letterSpans[i][0] + 12, 404); c.clip();
    c.translate(0, (1 - r) * 410);
    c.fill(g, 'evenodd');
    c.restore();
  });
}
const lerp = (a: Box, b: Box, q: number): Box => ({ x: mix(a.x, b.x, q), y: mix(a.y, b.y, q), k: mix(a.k, b.k, q) });

/** The frame at time t. `landing` (the header's logo) is null until the hand-off; `ink` is the logo's colour. */
export function drawReel(c: CanvasRenderingContext2D, t: number, ink: string, cobalt: string, landing: Landing | null = null) {
  if (t < 0.5) {
    line(c, partial(BASE, eo(t / 0.4)), cobalt, 10);
    line(c, partial(RISE, eo((t - 0.08) / 0.4)), ink, 8);
    return;
  }
  if (t < 2) {
    const k1 = eo((t - 0.5) / 0.45), k2 = eo((t - 1) / 0.45);
    // turned away, drifting, then spun through to flat with all the speed at the end
    const a = mix(1 - 0.15 * (t - 0.5), 2 * Math.PI, Math.pow(cl((t - 1.5) / 0.5), 3));
    line(c, BASE.map((p, i) => between(p, turned(tear[i], -a), k2)), cobalt, mix(10, stroke * BIG, k2));
    line(c, RISE.map((p, i) => between(p, turned(bean[i], a), k1)), ink, mix(8, stroke * BIG, k1));
    return;
  }
  // the symbol, large in the middle with a little swell as it locks; after the hand-off it flies to the top left
  const swell = 1 + 0.05 * Math.exp(-(t - 2) * 9);
  let sym: Box = { x: 960 - CX * BIG * swell, y: 540 - CY * BIG * swell, k: BIG * swell };
  let box: Box | null = null;
  if (landing) {
    // the corner: the header's logo `zoom` times as large about its top left, shrinking to its own size at the end
    const z = mix(landing.zoom, 1, eio((t - REEL.shrink) / (REEL.end - REEL.shrink)));
    const s = landing.sym, w = landing.word;
    sym = lerp(sym, { x: s.x, y: s.y, k: s.k * z }, eio((t - REEL.handoff) / REEL.fly));
    if (w) box = { x: s.x + (w.x - s.x) * z, y: s.y + (w.y - s.y) * z, k: w.k * z };
  }
  symbol(c, sym, eo((t - 2) / 0.35), ink, cobalt);
  if (box) word(c, box, (i) => eo((t - REEL.letters - 0.22 * i) / 0.32), ink);
}

/** The still version (reduced motion): the lockup in the middle of the scene, whole. */
export function drawLockup(c: CanvasRenderingContext2D, ink: string, cobalt: string) {
  symbol(c, { x: LOCK.x, y: LOCK.y, k: SMALL }, 1, ink, cobalt);
  word(c, { x: LOCK.x + WORD.x * SMALL, y: LOCK.y + WORD.y * SMALL, k: SMALL * WORD.k }, () => 1, ink);
}
