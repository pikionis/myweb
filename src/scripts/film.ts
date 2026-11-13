import { bean, tear, type Pt } from '../data/logo-curves';
import { stroke as LINE } from '../data/logo';

/*
 * The film that opens the intro: twelve seconds at 120 BPM (a beat every 0.5 s), a pure function of time drawn
 * on a canvas. No state is kept between frames, so any frame can be drawn at any moment.
 *
 *   0.0 – 4.5   a point becomes a line, the line a slab, and the slab says the words (the second one over the
 *               whole screen), then closes into a disc
 *   4.5 – 6.0   the disc becomes a triangle, then three circles through one point, then three rings
 *   6.0 – 7.0   the rings turn in space into a gyroscope
 *   7.0 – 8.5   the gyroscope becomes a globe, and the globe unwraps into a grid
 *   8.5 – 12.0  the grid is a dashboard: bars rise and sort themselves, a counter runs to 100%, a line is drawn
 *               over them; the grid goes, the line and its baseline become the symbol's two curves, turned away
 *               in space, and spin to a stop as the symbol, large in the middle (FILM.lock)
 *
 * Everything is drawn around the scene's middle, (960, 540), as reel.ts draws. `frame` is how much of the scene
 * shows, in scene units. A frame taller than it is wide gets the vertical composition (words on two lines, a
 * taller dashboard, larger shapes); filmFit() says how much of the scene each composition needs on screen.
 */

/** The moment the two curves stop as the symbol, in seconds: where the film ends and reel.ts takes over. */
export const FILM = { lock: 12 };

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
function path(c: CanvasRenderingContext2D, p: Pt[], close = false) {
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  if (close) c.closePath();
}
function line(c: CanvasRenderingContext2D, p: Pt[], colour: string, width: number, close = false) {
  if (width <= 0.01 || p.length < 2) return;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = colour; c.lineWidth = width;
  path(c, p, close);
  c.stroke();
}
/** Tracking, where the browser's canvas has it (without it the words are a little wider, and the slabs with them). */
const track = (c: CanvasRenderingContext2D, px: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = px + 'px'; };

/* ---------- the composition for a frame: every size and place that differs between wide and tall ---------- */

type Stop = { t: number; word: string; lines: string[]; cobalt: boolean; w: number; h: number; r: number; fs: number };
type Layout = {
  key: string; fw: number; fh: number; tall: boolean;
  /** how much larger the shapes of 4.5 – 8 s are drawn */
  z: number;
  stops: Stop[]; start: Stop;
  /** the dashboard: a column's width, a row's height, its left edge, top and baseline; the counter's size */
  gx: number; gy: number; x0: number; y0: number; y1: number; counter: number;
  rise: Pt[]; base: Pt[];
  /** the symbol large in the middle: scene units per symbol unit */
  big: number;
};

const VALUES = [2, 3.2, 1.6, 4, 2.6, 4.8, 3.4, 5.4, 2.2, 4.4, 3, 5.8];        // the dashboard's twelve bars
const SORTED = [...VALUES].sort((a, b) => a - b), RANK = VALUES.map((h) => SORTED.indexOf(h));
const THIRDS = [-90, 30, 150].map((d) => (d * Math.PI) / 180);               // where the three circles sit
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
  const tall = fh > fw, z = tall ? 1.35 : 1, W = [...look.words, '', '', '', '', '', ''].slice(0, 6);
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
    { t: 4, w: 360 * z, h: 360 * z, r: 180 * z, cobalt: true },
  ] : [
    { t: 0, w: 1500, h: 6, r: 3, cobalt: true },
    { t: 0.5, h: 300, word: W[0], cobalt: true },
    { t: 1, h: 300, word: W[1], cobalt: true },
    { t: 1.5, w: cover.w, h: cover.h, fs: 330, word: W[1], cobalt: true },
    { t: 2, h: 260, word: W[2], cobalt: true },
    { t: 2.5, h: 320, word: W[3], cobalt: false },
    { t: 3, h: 220, word: W[4], cobalt: true },
    { t: 3.5, h: 280, word: W[5], cobalt: false },
    { t: 4, w: 360, h: 360, r: 180, cobalt: true },
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
  const gx = tall ? 75 : 100, gy = tall ? 150 : 100, x0 = MX - 6 * gx, y0 = MY - 3 * gy, y1 = MY + 3 * gy;
  return (cache = {
    key, fw, fh, tall, z, stops,
    start: { t: 0, word: '', lines: [''], cobalt: true, w: 28, h: 28, r: 14, fs: 10 },   // the point
    gx, gy, x0, y0, y1, counter: tall ? 1.3 : 1,
    rise: resample(SORTED.map((h, s): Pt => [x0 + gx / 2 + gx * s, y1 - h * gy]), N),
    base: resample([[x0, y1], [x0 + 12 * gx, y1]], N),
    big: symbolScale(frame),
  });
}

/* ---------- 0 – 4.5: the ticker (point, line, slab, words, disc) ---------- */
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
  const text = (lines: string[], fs: number, dy: number, colour: string) => {
    c.font = `${look.weight} ${fs}px ${look.font}`; track(c, -fs * 0.02); c.textAlign = 'center'; c.fillStyle = colour;
    lines.forEach((s, j) => c.fillText(s, MX, MY + fs * 0.364 + (j - (lines.length - 1) / 2) * LINE_HEIGHT * fs + dy));
  };
  // how far a word travels to leave the slab
  const out = (q: Stop) => h / 2 + q.fs * 0.55 + ((q.lines.length - 1) * LINE_HEIGHT * q.fs) / 2;
  if (a.word === b.word) { if (b.word) text(b.lines, mix(a.fs, b.fs, k), 0, on(b)); }
  else {
    if (a.word) text(a.lines, a.fs, -k * out(a), on(a));        // the old word leaves upwards
    if (b.word) text(b.lines, b.fs, (1 - k) * out(b), on(b));   // the new one comes up from below
  }
  c.restore();
  track(c, 0);
}

/* ---------- 4.5 – 6: disc, triangle, three circles through one point, three rings ---------- */
function morph(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const z = lay.z, rho = 170 * z;
  const k1 = eo((t - 4.5) / 0.42), k2 = eo((t - 5) / 0.42), g = eo((t - 5.5) / 0.42) * 380 * z, pts: Pt[] = [];
  // one outline in polar form: its radius at each degree goes from the disc's to the triangle's to the three circles'
  for (let d = 0; d < 360; d++) {
    const th = ((d - 90) * Math.PI) / 180, m = ((d % 120) + 120) % 120, rt = (150 * z) / Math.cos(((m - 60) * Math.PI) / 180);
    let ru = 0;
    THIRDS.forEach((q) => { ru = Math.max(ru, 2 * rho * Math.cos(th - q)); });
    const r = mix(mix(180 * z, rt, k1), ru, k2);
    pts.push([MX + r * Math.cos(th), MY + r * Math.sin(th)]);
  }
  // the filled shape, outside a growing round window...
  c.save();
  c.beginPath();
  c.rect(MX - lay.fw / 2 - 60, MY - lay.fh / 2 - 60, lay.fw + 120, lay.fh + 120);
  c.moveTo(MX + g, MY); c.arc(MX, MY, g, 0, 2 * Math.PI, true); c.closePath();
  c.clip('evenodd');
  path(c, pts, true); c.fillStyle = look.cobalt; c.fill();
  c.restore();
  // ...and inside the window, the same three circles as rings
  if (g > 0) {
    c.save();
    c.beginPath(); c.arc(MX, MY, g, 0, 7); c.clip();
    c.strokeStyle = look.cobalt; c.lineWidth = 14 * z;
    THIRDS.forEach((q) => { c.beginPath(); c.arc(MX + rho * Math.cos(q), MY + rho * Math.sin(q), rho - 7 * z, 0, 7); c.stroke(); });
    c.restore();
  }
}

/* ---------- 6 – 8.5: rings in space, gyroscope, globe, the globe unwrapped into a grid ---------- */
type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], unit = (a: V3) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const mix3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
type View = { cp: number; sp: number; ct: number; st: number };
/** The camera: it turns about the upright axis, faster at first, and tilts a little. */
function view(t: number): View {
  const s = t - 6, psi = 1.25 * (s - (1 - Math.exp(-3 * s)) / 3), tau = 0.42 * eo((t - 6.5) / 0.42);
  return { cp: Math.cos(psi), sp: Math.sin(psi), ct: Math.cos(tau), st: Math.sin(tau) };
}
function project(p: V3, v: View, focal: number): Pt {
  const x = p[0] * v.cp + p[2] * v.sp, z = -p[0] * v.sp + p[2] * v.cp, y = p[1] * v.ct - z * v.st, z2 = p[1] * v.st + z * v.ct, s = focal / (focal + z2);
  return [MX + x * s, MY + y * s];
}
const PLANES: [V3, V3][] = [[[0, -1, 0], [1, 0, 0]], [[0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, 1]]];   // the gyroscope's three
function rings(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const z = lay.z, rho = 170 * z, v = view(t), al = eo((t - 6) / 0.42) * 1.15, k = eo((t - 6.5) / 0.42), R = mix(rho - 7 * z, 300 * z, k);
  THIRDS.forEach((q, i) => {
    const d: V3 = [Math.cos(q), Math.sin(q), 0], e: V3 = [-Math.sin(q), Math.cos(q), 0];
    let u = mix3(d, PLANES[i][0], k), w = mix3(add(mul(e, Math.cos(al)), [0, 0, Math.sin(al)]), PLANES[i][1], k);
    u = unit(u); w = unit(add(w, mul(u, -dot(w, u))));
    const centre = mul(d, rho * (1 - k)), pts: Pt[] = [];
    for (let a = 0; a <= 120; a++) { const f = (a / 120) * 2 * Math.PI; pts.push(project(add(centre, add(mul(u, R * Math.cos(f)), mul(w, R * Math.sin(f)))), v, FOCAL * z)); }
    line(c, pts, look.cobalt, 14 * z, true);
  });
}
function globe(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const z = lay.z, v = view(t), k14 = eo((t - 7) / 0.42), k15 = eo((t - 7.5) / 0.42), k16 = eo((t - 8) / 0.45);
  const lw = mix(mix(14 * z, 5, k14), 5, k16), flat = t >= 8;
  const sphere = (lon: number, lat: number): V3 => {
    const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
    return [300 * z * Math.cos(b) * Math.cos(a), -300 * z * Math.sin(b), 300 * z * Math.cos(b) * Math.sin(a)];
  };
  // a point of the globe, on its way to its place in the flat grid once the globe unwraps
  const at = (lon: number, lat: number, tl: number, tb: number): Pt => {
    const s = project(sphere(lon, lat), v, FOCAL * z);
    return flat ? between(s, [MX + (tl / 180) * 6 * lay.gx, MY - (tb / 90) * 3 * lay.gy], k16) : s;
  };
  for (let j = 0; j < (flat ? 13 : 12); j++) {
    const tl = -180 + 30 * j, lon = mix(Math.round(tl / 90) * 90, tl, k14), p: Pt[] = [];
    for (let b = -90; b <= 90; b += 3) p.push(at(lon, b, tl, b));
    line(c, p, look.cobalt, lw);
  }
  (flat ? [-90, -60, -30, 0, 30, 60, 90] : [-60, -30, 0, 30, 60]).forEach((tb) => {
    const lat = tb * k15, p: Pt[] = [];
    for (let a = -180; a <= 180; a += 3) p.push(at(a, lat, a, tb));
    line(c, p, look.cobalt, lw);
  });
}

/* ---------- 8.5 – 12: the dashboard, then its line and its baseline become the symbol's two curves ---------- */
function dashboard(c: CanvasRenderingContext2D, t: number, lay: Layout, look: Look) {
  const { gx, gy, x0, y0, y1, big } = lay;
  const k17 = eo((t - 8.5) / 0.4), k19 = eio((t - 9.5) / 0.45), k20 = eo((t - 10) / 0.42), k21 = eo((t - 10.5) / 0.45), k22 = eo((t - 11) / 0.45);
  // the grid, drawn back into its left edge and its baseline when it goes
  const glw = mix(5, 2.5, k17);
  c.strokeStyle = look.cobalt; c.lineWidth = glw; c.lineCap = 'round';
  if (k20 < 1) {
    for (let j = 0; j < 13; j++) { c.beginPath(); c.moveTo(x0 + gx * j, y1); c.lineTo(x0 + gx * j, y1 - 6 * gy * (1 - k20)); c.stroke(); }
    for (let m = 0; m < 6; m++) { c.beginPath(); c.moveTo(x0, y0 + gy * m); c.lineTo(x0 + 12 * gx * (1 - k20), y0 + gy * m); c.stroke(); }
    // the bars rise one after another, then sort themselves
    c.fillStyle = look.cobalt;
    VALUES.forEach((h, j) => {
      const x = mix(x0 + gx / 2 + gx * j, x0 + gx / 2 + gx * RANK[j], k19), hh = h * gy * eo((t - 8.5 - 0.012 * j) / 0.4) * (1 - k20);
      c.fillRect(x - 0.32 * gx, y1 - hh, 0.64 * gx, hh);
    });
  }
  // the counter: 64%, then 100% once the bars are in order
  if (t >= 9 && k20 < 1) {
    const kin = eo((t - 9) / 0.4), cs = lay.counter;
    c.save();
    c.beginPath(); c.rect(x0 - 20, y0 - 28 - 122 * cs, 800 * cs, 122 * cs); c.clip();
    c.font = `${look.weight} ${112 * cs}px ${look.font}`; c.textAlign = 'left'; c.fillStyle = look.ink;
    c.fillText(Math.round(64 * eo((t - 9) / 0.45) + 36 * eo((t - 9.5) / 0.45)) + '%', x0 - 4, y0 - 35 + (1 - kin) * 130 * cs + k20 * 130 * cs);
    c.restore();
  }
  // a symbol point, large in the middle and turned by `a` about the upright axis
  const turned = (p: Pt, a: number): Pt => {
    const X = (p[0] - 443) * big, x = X * Math.cos(a), zz = X * Math.sin(a), s = FOCAL / (FOCAL + (zz * 0.72) / big);
    return [MX + x * s, MY + (p[1] - 398) * big * s];
  };
  // turned away and drifting, then spun through to flat with all the speed at the end
  const a = mix(1 - 0.15 * (t - 10.5), 2 * Math.PI, Math.pow(cl((t - 11.5) / 0.5), 3));
  // the baseline becomes the teardrop (the top loop and the arc)
  line(c, lay.base.map((p, i) => between(p, turned(tear[i], -a), k22)), look.cobalt, mix(mix(glw, 10, k20), LINE * big, k22));
  // the line over the bars becomes the bean (the two side loops and the line between them)
  if (t >= 9) {
    const rise = t < 10.5
      ? partial(VALUES.map((h, s): Pt => [x0 + gx / 2 + gx * s, y1 - mix(h, SORTED[s], k19) * gy]), eo((t - 9) / 0.42))
      : lay.rise.map((p, i) => between(p, turned(bean[i], a), k21));
    line(c, rise, look.ink, mix(8, LINE * big, k21));
  }
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
  if (t < 4.5) ticker(c, t, lay, look);
  else if (t < 6) morph(c, t, lay, look);
  else if (t < 7) rings(c, t, lay, look);
  else if (t < 8.5) globe(c, t, lay, look);
  else dashboard(c, t, lay, look);
  c.restore();
}
