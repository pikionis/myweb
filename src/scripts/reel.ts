import { bean, tear, archFrom, archTo, letterSpans, type Pt } from '../data/logo-curves';
import { letters, stroke } from '../data/logo';
import { drawFilm, symbolScale, FILM, type Frame, type Look } from './film';

/*
 * The opening intro's picture, "Everything meets at one point": a pure function of time, drawn on a canvas.
 *
 *   0–6s       the film (film.ts), over the whole screen: a point, a line, a slab that says the words; the
 *              slab closes onto a rising line whose baseline draws itself under it; the rising line becomes the
 *              bean and the baseline the teardrop, each turned away in space; both spin, faster and faster, and
 *              stop dead as the symbol
 *   6.0        lock: the top loop is struck ivory over the cobalt, the symbol swells a little and settles
 *   6.6        hand-off: the page is given back and the symbol flies to the top left, onto the header's logo
 *              shown larger (up to REEL.zoom times), anchored at its top left corner (intro.ts gives the place
 *              and how large it fits beside what else is in the bar)
 *   7.3–8.7    there, o n e h u b rise beside it, a letter every 0.22 s
 *   9.3–10.1   the lockup shrinks into the header's logo
 *
 * Everything is drawn in a scene around (960, 540); intro.ts fits it to the screen and says how much of it
 * shows (`frame`): a screen taller than wide gets the film's vertical composition. No state is kept between
 * frames, so a frame can be drawn at any time. The still version (reduced motion) is drawLockup().
 */

/** The moments, in seconds, counted from the film's end; `zoom` = at most how much larger than the header's logo
 * the corner shows it. */
const T = FILM.lock;
export const REEL = { lock: T, handoff: T + 0.6, fly: 0.9, letters: T + 1.3, shrink: T + 3.3, end: T + 4.1, zoom: 2.2 };

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

// the still lockup (SMALL scene units per symbol unit), whose top left is LOCK
const SMALL = 1100 / 2698.3, LOCK = { x: 410, y: 347.7 };
// the wordmark's box in the horizontal lockup, in symbol units
const WORD = { x: 1087.4, y: 211.5, k: 0.94648 };
const CX = 443, CY = 398;

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

/**
 * The frame at time t. `frame` is how much of the scene shows; `look` gives the film its colours, typeface and
 * words; `landing` (the header's logo) is null until the hand-off; `ink` is the logo's colour from the lock on.
 */
export function drawReel(c: CanvasRenderingContext2D, t: number, frame: Frame, look: Look, ink: string, landing: Landing | null = null) {
  if (t < REEL.lock) { drawFilm(c, t, frame, look); return; }
  const cobalt = look.cobalt;
  // the symbol, as large in the middle as the film left it, with a little swell as it locks; after the hand-off
  // it flies to the top left
  const big = symbolScale(frame), swell = 1 + 0.05 * Math.exp(-(t - REEL.lock) * 9);
  let sym: Box = { x: 960 - CX * big * swell, y: 540 - CY * big * swell, k: big * swell };
  let box: Box | null = null;
  if (landing) {
    // the corner: the header's logo `zoom` times as large about its top left, shrinking to its own size at the end
    const z = mix(landing.zoom, 1, eio((t - REEL.shrink) / (REEL.end - REEL.shrink)));
    const s = landing.sym, w = landing.word;
    sym = lerp(sym, { x: s.x, y: s.y, k: s.k * z }, eio((t - REEL.handoff) / REEL.fly));
    if (w) box = { x: s.x + (w.x - s.x) * z, y: s.y + (w.y - s.y) * z, k: w.k * z };
  }
  symbol(c, sym, eo((t - REEL.lock) / 0.35), ink, cobalt);
  if (box) word(c, box, (i) => eo((t - REEL.letters - 0.22 * i) / 0.32), ink);
}

/** The still version (reduced motion): the lockup in the middle of the scene, whole. */
export function drawLockup(c: CanvasRenderingContext2D, ink: string, cobalt: string) {
  symbol(c, { x: LOCK.x, y: LOCK.y, k: SMALL }, 1, ink, cobalt);
  word(c, { x: LOCK.x + WORD.x * SMALL, y: LOCK.y + WORD.y * SMALL, k: SMALL * WORD.k }, () => 1, ink);
}
