import { bean, tear, type Pt } from '../data/logo-curves';
import { stroke as LINE } from '../data/logo';

/*
 * The film that opens the intro: six seconds at 120 BPM (a beat every 0.5 s), a pure function of time drawn on
 * a canvas. No state is kept between frames, so any frame can be drawn at any moment.
 *
 *   0.0 – 4.0   a point becomes a line, the line a slab, and the slab says the words, one on each beat (the
 *               second over the whole screen)
 *   4.0 – 4.5   the last word leaves and its slab closes onto a rising line, like the smallest chart, while the
 *               line it stands on draws itself under it
 *   4.5 – 5.5   the rising line becomes the bean (the two side loops and the line between them), then the
 *               baseline becomes the teardrop (the top loop and the arc), each turned away in space
 *   5.5 – 6.0   both spin, faster and faster, and stop dead as the symbol, large in the middle (FILM.lock)
 *
 * Everything is drawn around the scene's middle, (960, 540), as reel.ts draws. `frame` is how much of the scene
 * shows, in scene units. A frame taller than it is wide gets the vertical composition (words on two lines, a
 * narrower chart, a larger symbol); filmFit() says how much of the scene each composition needs on screen.
 */

/** The moment the two curves stop as the symbol, in seconds: where the film ends and reel.ts takes over. */
export const FILM = { lock: 6 };

export type Frame = { w: number; h: number };
/** The colours, the typeface and the words: ink on cobalt and ground on ink, as the header's logo has them. */
export type Look = {
  ink: string; cobalt: string; ground: string;
  /** a canvas font family (a stack is fine), loaded before the first frame, and the weight of the words */
  font: string; weight: number;
  /** six, in capitals: the first two, then one for each beat from 2 s on. A space breaks a word in two lines on a tall frame */
  words: string[];
};

const MX = 960, MY = 540, FOCAL = 1600, LINE_HEIGHT = 0.92;
// the moments: the slab closes onto the line, the line and the baseline become the curves, they spin
const CLOSE = 4, CURVES = 4.5, SPIN = 5.5;
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** exponential out */
const eo = (x: number) => { x = cl(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
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
function path(c: CanvasRenderingContext2D, p: Pt[], close = false) {
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  if (close) c.closePath();
}
function line(c: CanvasRenderingContext2D, p: Pt[], colour: string, width: number) {
  if (width <= 0.01 || p.length < 2) return;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = colour; c.lineWidth = width;
  path(c, p);
  c.stroke();
}
/** Tracking, where the browser's canvas has it (without it the words are a little wider, and the slabs with them). */
const track = (c: CanvasRenderingContext2D, px: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = px + 'px'; };

/* ---------- the composition for a frame: every size and place that differs between wide and tall ---------- */

type Stop = { t: number; word: string; lines: string[]; cobalt: boolean; w: number; h: number; r: number; fs: number };
type Layout = {
  key: string; fw: number; fh: number;
  stops: Stop[]; start: Stop;
  /** the smallest chart: the rising line and the line it stands on, as points */
  rise: Pt[]; base: Pt[];
  /** the symbol large in the middle: scene units per symbol unit */
  big: number;
};

// the chart the symbol is made from: twelve rising values
const VALUES = [1.6, 2, 2.2, 2.6, 3, 3.2, 3.4, 4, 4.4, 4.8, 5.4, 5.8];
const N = bean.length - 1;

/** How much of the scene, around its middle, the film needs on a screen: wide, or tall when the screen is taller than wide. */
export const filmFit = (vw: number, vh: number): Frame => (vh > vw ? { w: 1080, h: 1300 } : { w: 1640, h: 900 });
/** How large the symbol stands in the middle when the film ends: scene units per symbol unit. */
export const symbolScale = (frame: Frame) => (frame.h > frame.w ? 0.95 : 0.72);

let cache: Layout | null = null;
function layout(c: CanvasRenderingContext2D, frame: Frame, look: Look): Layout {
  const fw = Math.round(frame.w), fh = Math.round(frame.h);
  const key = [fw, fh, look.font, look.weight, look.words.join('|')].join('/');
  if (cache && cache.key === key) return cache;
  const tall = fh > fw, W = [...look.words, '', '', '', '', '', ''].slice(0, 6);
  const widest = (lines: string[], fs: number) => {
    c.font = `${look.weight} ${fs}px ${look.font}`; track(c, -fs * 0.02);
    return Math.max(...lines.map((s) => c.measureText(s).width));
  };
  // A stop gives `h` (one line: the type is 0.72 of it and the slab is as wide as the word plus 0.75 h), or `fit`
  // (the slab's width: the largest type that fits it, on one line or two), or its own width, height and type size.
  type Spec = { t: number; word?: string; cobalt: boolean; w?: number; h?: number; r?: number; fs?: number; fit?: number; fsFit?: number };
  const cover = { w: Math.max(2100, fw + 180), h: Math.max(1300, fh + 220) };  // the slab over the whole frame
  const two = (s: string) => (tall ? s.replace(' ', '\n') : s);
  const specs: Spec[] = tall ? [
    { t: 0, w: 860, h: 6, r: 3, cobalt: true },
    { t: 0.5, fit: 900, word: W[0], cobalt: true },
    { t: 1, fit: 940, word: two(W[1]), cobalt: true },
    { t: 1.5, w: cover.w, h: cover.h, fsFit: 960, word: two(W[1]), cobalt: true },
    { t: 2, fit: 940, word: two(W[2]), cobalt: true },
    { t: 2.5, fit: 900, word: two(W[3]), cobalt: false },
    { t: 3, fit: 960, word: two(W[4]), cobalt: true },
    { t: 3.5, fit: 940, word: two(W[5]), cobalt: false },
  ] : [
    { t: 0, w: 1500, h: 6, r: 3, cobalt: true },
    { t: 0.5, h: 300, word: W[0], cobalt: true },
    { t: 1, h: 300, word: W[1], cobalt: true },
    { t: 1.5, w: cover.w, h: cover.h, fs: 330, word: W[1], cobalt: true },
    { t: 2, h: 260, word: W[2], cobalt: true },
    { t: 2.5, h: 320, word: W[3], cobalt: false },
    { t: 3, h: 220, word: W[4], cobalt: true },
    { t: 3.5, h: 280, word: W[5], cobalt: false },
  ];
  const stops = specs.map((k): Stop => {
    const word = k.word ?? '', lines = word.split('\n'), n = lines.length;
    const per = word ? widest(lines, 100) / 100 : 0;                           // the widest line, in type sizes
    let { w = 0, h = 0, fs = 0 } = k;
    if (k.fit) { fs = k.fit / (per + 0.75 / 0.72); h = (n - 1) * LINE_HEIGHT * fs + fs / 0.72; w = k.fit; }
    else if (k.fsFit) fs = k.fsFit / per;
    else { fs = fs || h * 0.72; if (!w) w = widest(lines, fs) + h * 0.75; }
    // a word never wider than the frame, whatever the typeface and the words
    const most = Math.min(w, fw - 60) - (k.fit || !k.w ? 0.75 * (fs / 0.72) : 0);
    if (word && per * fs > most && most > 0) fs = most / per;
    return { t: k.t, word, lines, cobalt: k.cobalt, w, h, r: k.r ?? 0, fs };
  });
  track(c, 0);
  // the chart: twelve columns, its baseline under the middle; narrower on a tall frame
  const gx = tall ? 75 : 100, gy = tall ? 90 : 100, x0 = MX - 6 * gx, y1 = MY + 3 * gy;
  return (cache = {
    key, fw, fh, stops,
    start: { t: 0, word: '', lines: [''], cobalt: true, w: 28, h: 28, r: 14, fs: 10 },   // the point
    rise: resample(VALUES.map((h, s): Pt => [x0 + gx / 2 + gx * s, y1 - h * gy]), N),
    base: resample([[x0, y1], [x0 + 12 * gx, y1]], N),
    big: symbolScale(frame),
  });
}

/** A slab's word or words, in the middle of the scene, moved down by dy. */
function words(c: CanvasRenderingContext2D, look: Look, lines: string[], fs: number, dy: number, colour: string) {
  c.font = `${look.weight} ${fs}px ${look.font}`; track(c, -fs * 0.02); c.textAlign = 'center'; c.fillStyle = colour;
  lines.forEach((s, j) => c.fillText(s, MX, MY + fs * 0.364 + (j - (lines.length - 1) / 2) * LINE_HEIGHT * fs + dy));
}
/** How far a word travels to leave a slab h high. */
const leave = (q: Stop, h: number) => h / 2 + q.fs * 0.55 + ((q.lines.length - 1) * LINE_HEIGHT * q.fs) / 2;

/* ---------- 0 – 4: the ticker (point, line, slab, words) ---------- */
function ticker(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const S = lay.stops;
  let i = 0;
  while (i + 1 < S.length && S[i + 1].t <= t) i++;
  const a = i ? S[i - 1] : lay.start, b = S[i], k = eo((t - b.t) / 0.42);
  const w = mix(a.w, b.w, k), h = mix(a.h, b.h, k), r = Math.min(mix(a.r, b.r, k), w / 2, h / 2), x = MX - w / 2, y = MY - h / 2;
  const fill = (q: Stop) => (q.cobalt ? look.cobalt : look.ink), on = (q: Stop) => (q.cobalt ? look.ink : look.ground);
  c.save();
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = fill(a); c.fillRect(x, y, w, h);
  // a new colour wipes across, from the left and from the right in turn
  if (b.cobalt !== a.cobalt) { c.fillStyle = fill(b); const ww = w * k; if (i % 2) c.fillRect(x, y, ww, h); else c.fillRect(x + w - ww, y, ww, h); }
  if (a.word === b.word) { if (b.word) words(c, look, b.lines, mix(a.fs, b.fs, k), 0, on(b)); }
  else {
    if (a.word) words(c, look, a.lines, a.fs, -k * leave(a, h), on(a));        // the old word leaves upwards
    if (b.word) words(c, look, b.lines, b.fs, (1 - k) * leave(b, h), on(b));   // the new one comes up from below
  }
  c.restore();
  track(c, 0);
}

/* ---------- 4 – 4.5: the last slab closes onto the rising line; its baseline draws itself ---------- */
function close(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const a = lay.stops[lay.stops.length - 1], k = eo((t - CLOSE) / 0.42);
  line(c, partial(lay.base, eo((t - CLOSE - 0.05) / 0.4)), look.cobalt, 10);
  // the slab's upper and lower edge, each point on its way to its point of the line
  const x = (i: number) => MX - a.w / 2 + (a.w * i) / N;
  const top = lay.rise.map((p, i) => between([x(i), MY - a.h / 2], p, k));
  const bottom = lay.rise.map((p, i) => between([x(i), MY + a.h / 2], p, k));
  const fill = a.cobalt ? look.cobalt : look.ink;
  c.save();
  path(c, [...top, ...bottom.reverse()], true);
  c.fillStyle = fill; c.fill();
  c.clip();
  if (a.word) words(c, look, a.lines, a.fs, -k * leave(a, a.h), a.cobalt ? look.ink : look.ground);   // the word leaves upwards
  c.restore();
  track(c, 0);
  // the line itself, inside the slab until the slab has closed onto it
  const inset = (i: number) => MX - a.w / 2 + 4 + ((a.w - 8) * i) / N;
  line(c, lay.rise.map((p, i) => between([inset(i), MY], p, k)), fill, 8);
}

/* ---------- 4.5 – 6: the line and its baseline become the symbol's two curves ---------- */
function curves(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const big = lay.big, k1 = eo((t - CURVES) / 0.45), k2 = eo((t - CURVES - 0.5) / 0.45);
  // a symbol point, large in the middle and turned by `a` about the upright axis
  const turned = (p: Pt, a: number): Pt => {
    const X = (p[0] - 443) * big, x = X * Math.cos(a), z = X * Math.sin(a), s = FOCAL / (FOCAL + (z * 0.72) / big);
    return [MX + x * s, MY + (p[1] - 398) * big * s];
  };
  // turned away and drifting, then spun through to flat with all the speed at the end
  const a = mix(1 - 0.15 * (t - CURVES), 2 * Math.PI, Math.pow(cl((t - SPIN) / (FILM.lock - SPIN)), 3));
  // the baseline becomes the teardrop (the top loop and the arc)
  line(c, lay.base.map((p, i) => between(p, turned(tear[i], -a), k2)), look.cobalt, mix(10, LINE * big, k2));
  // the rising line becomes the bean (the two side loops and the line between them)
  line(c, lay.rise.map((p, i) => between(p, turned(bean[i], a), k1)), look.ink, mix(8, LINE * big, k1));
}

/**
 * The film's frame at time t (0 to FILM.lock), over the canvas's current transform: (960, 540) is the middle.
 * Nothing is painted under it: the ground is whatever the canvas lies on.
 */
export function drawFilm(c: CanvasRenderingContext2D, t: number, frame: Frame, look: Look) {
  t = cl(t, 0, FILM.lock - 1e-6);
  const lay = layout(c, frame, look);
  c.save();
  // the whole picture breathes: 2% larger in the middle of the film, back to its size as it ends
  const s = 1 + (0.02 * (1 - Math.cos((2 * Math.PI * t) / FILM.lock))) / 2;
  c.translate(MX, MY); c.scale(s, s); c.translate(-MX, -MY);
  if (t < CLOSE) ticker(c, t, lay, look);
  else if (t < CURVES) close(c, t, lay, look);
  else curves(c, t, lay, look);
  c.restore();
}
