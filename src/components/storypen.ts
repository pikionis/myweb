// The pen of "My story"'s drawings (MyStoryArt.astro, the Kalimera chapter): build-time helpers on top of
// lineart.ts that write SVG as strings: solid shapes with their soft shadow, parts the script moves (data-p),
// words, people, clouds, buildings.
import { r1, C, R, P as pen, cls } from './lineart';

export type N = number;
/** a stroke that draws itself; a solid shape (a panel, a card) also casts a soft offset shadow that lifts it off
 *  the paper (the script brings the shadow in with its shape) */
export const P = (d: string, extra = '', attrs = '') =>
  (extra.split(' ').includes('solid') ? `<path class="shade" d="${d}" transform="translate(6 7)"/>` : '') + pen(d, extra, attrs);
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** a part the script moves */
export const G = (p: string, inner: string, attrs = '') => `<g data-p="${p}"${attrs ? ` ${attrs}` : ''}>${inner}</g>`;
/** a filled shape (it does not draw on) */
export const F = (d: string, extra: string, attrs = '') => `<path class="${extra}" d="${d}"${attrs ? ` ${attrs}` : ''}/>`;
/** words */
export const X = (x: N, y: N, text: string, size: N, extra = '', attrs = '') =>
  `<text class="${cls('t', extra)}" x="${x}" y="${y}" font-size="${size}"${attrs ? ` ${attrs}` : ''}>${esc(text)}</text>`;
export const width = (text: string, size: N) => Math.round(text.length * size * 0.56);
/** words that write themselves: uncovered from left to right, as if written (the script widens the rect that clips
 *  them, `<p>-pen`, from nothing); 'script' sets them by hand, in Great Vibes */
export const written = (p: string, x: N, y: N, text: string, size: N, extra = '') => {
  // (with room around them for a script's swashes)
  const w = width(text, size) + size * 1.6, x0 = extra.split(' ').includes('mid') ? x - w / 2 : x - size * 0.9;
  return `<clipPath id="ms-${p}"><rect data-p="${p}-pen" x="${r1(x0)}" y="${r1(y - size * 1.3)}" width="${r1(w)}" height="${r1(size * 1.9)}"/></clipPath>` +
    `<g clip-path="url(#ms-${p})">${X(x, y, text, size, extra, `data-p="${p}"`)}</g>`;
};
/** a small label in a pill */
export const pill = (x: N, y: N, text: string, size: N, extra = '') => {
  const w = width(text, size) + 22;
  return P(R(x, y, w, size + 14, (size + 14) / 2), cls('solid', extra)) + X(x + w / 2, y + size + 2, text, size, extra.includes('ac') ? 't-ac mid' : 'mid');
};
/** a person: head and shoulders, the head at (x, y) */
export const person = (x: N, y: N, s = 1, extra = '') =>
  P(C(x, y, r1(12 * s)), extra) +
  P(`M${r1(x - 22 * s)} ${r1(y + 58 * s)}C${r1(x - 22 * s)} ${r1(y + 30 * s)} ${r1(x - 11 * s)} ${r1(y + 18 * s)} ${x} ${r1(y + 18 * s)}C${r1(x + 11 * s)} ${r1(y + 18 * s)} ${r1(x + 22 * s)} ${r1(y + 30 * s)} ${r1(x + 22 * s)} ${r1(y + 58 * s)}`, extra);
/** a document with a few lines */
export const doc = (x: N, y: N, w: N, h: N) =>
  P(R(x, y, w, h, 6), 'solid') + P(`M${x + 12} ${y + 18}H${x + w - 14}M${x + 12} ${y + 30}H${x + w - 24}M${x + 12} ${y + 42}H${x + w - 18}`);
export const poly = (pts: N[][]) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z';
/** an isometric block: its front corner on the ground at (x, y), w to the right, d to the left, h tall. Its three
 *  faces take three tints of the paper (they fade in once its edges are drawn), so it stands up off the page */
export const block = (p: string, x: N, y: N, w: N, d: N, h: N, rows = 0, cols = 0) => {
  const c = 0.866, sn = 0.5;
  const fr = [x, y], rt = [x + w * c, y - w * sn], lf = [x - d * c, y - d * sn], bk = [x + w * c - d * c, y - w * sn - d * sn];
  const up = (q: N[]) => [q[0], q[1] - h];
  const left = poly([lf, fr, up(fr), up(lf)]), right = poly([fr, rt, up(rt), up(fr)]), top = poly([up(fr), up(rt), up(bk), up(lf)]);
  // windows on the right face, in rows and columns
  let win = '';
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const u = (w / cols) * (k + 0.3), v = (h / rows) * (r + 0.3), ww = (w / cols) * 0.42, wh = (h / rows) * 0.45;
    const o = [x + u * c, y - u * sn - v];
    win += `M${r1(o[0])} ${r1(o[1])}l${r1(ww * c)} ${r1(-ww * sn)}v${r1(-wh)}l${r1(-ww * c)} ${r1(ww * sn)}Z`;
  }
  return G(p, G(`${p}-faces`, F(left, 'face-l') + F(right, 'face-r') + F(top, 'face-t')) + pen(left) + pen(right) + pen(top) + (win ? pen(win, 'thin') : ''));
};
/** a whole figure, walking: head, body, arms and legs, its feet on the ground at (x, y) */
export const walker = (p: string, x: N, y: N, s = 1, extra = '') => G(p,
  pen(C(x, y - 62 * s, 7 * s), extra) + pen(`M${x} ${r1(y - 54 * s)}V${r1(y - 26 * s)}`, extra) +
  G(`${p}-legs`, pen(`M${x} ${r1(y - 26 * s)}L${r1(x - 9 * s)} ${y}M${x} ${r1(y - 26 * s)}L${r1(x + 9 * s)} ${y}`, extra)) +
  pen(`M${r1(x - 10 * s)} ${r1(y - 34 * s)}L${x} ${r1(y - 46 * s)}L${r1(x + 10 * s)} ${r1(y - 34 * s)}`, extra));
/** a figure cheering, both arms up, its feet on the ground at (x, y) */
export const cheer = (p: string, x: N, y: N, s = 1, extra = '') => G(p,
  pen(C(x, r1(y - 40 * s), r1(5.5 * s)), extra) + pen(`M${x} ${r1(y - 34 * s)}V${r1(y - 15 * s)}M${x} ${r1(y - 15 * s)}L${r1(x - 6 * s)} ${y}M${x} ${r1(y - 15 * s)}L${r1(x + 6 * s)} ${y}`, extra) +
  G(`${p}-arms`, pen(`M${r1(x - 11 * s)} ${r1(y - 48 * s)}L${x} ${r1(y - 30 * s)}L${r1(x + 11 * s)} ${r1(y - 48 * s)}`, extra)));
/** a cloud's outline */
export const cloud = (p: string, x: N, y: N, s = 1) => G(p, pen(`M${x} ${y}h${r1(70 * s)}a${r1(14 * s)} ${r1(14 * s)} 0 0 0 ${r1(-10 * s)} ${r1(-22 * s)}a${r1(20 * s)} ${r1(20 * s)} 0 0 0 ${r1(-34 * s)} ${r1(-10 * s)}a${r1(16 * s)} ${r1(16 * s)} 0 0 0 ${r1(-26 * s)} ${r1(12 * s)}a${r1(11 * s)} ${r1(11 * s)} 0 0 0 0 ${r1(20 * s)}Z`, 'faint'));
/** a firework: rays round a centre, ink and cobalt in turn */
export const burst = (p: string, x: N, y: N, r: N) => G(p, Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, r0 = r * 0.35;
  return pen(`M${r1(x + Math.cos(a) * r0)} ${r1(y + Math.sin(a) * r0)}L${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}`, i % 2 ? 'ac' : '');
}).join('') + `<circle class="ac-fill" cx="${x}" cy="${y}" r="4"/>`);
/** a closed line through these points, smooth (a Catmull-Rom spline, as Bézier curves) */
export const smooth = (pts: N[][]) => {
  const n = pts.length;
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    d += `C${r1(b[0] + (c[0] - a[0]) / 6)} ${r1(b[1] + (c[1] - a[1]) / 6)} ${r1(c[0] - (e[0] - b[0]) / 6)} ${r1(c[1] - (e[1] - b[1]) / 6)} ${r1(c[0])} ${r1(c[1])}`;
  }
  return d + 'Z';
};
/** Kos as a map outline: long, broad in the east (the town at its tip), a narrow neck, the peninsula of Kefalos
 *  turning south-west (460 wide, from (204, 298)) */
export const KOS: N[][] = [
  [652, 298], [614, 302], [570, 312], [520, 322], [470, 330], [420, 338], [372, 350], [330, 362], [300, 372], [276, 376],
  [254, 372], [226, 374], [204, 388], [206, 408], [226, 424], [250, 420], [268, 404], [288, 392], [320, 390], [370, 388],
  [420, 384], [470, 376], [520, 364], [570, 350], [616, 338], [650, 330], [664, 314],
];
/** points moved and scaled: from (x0, y0), by s, to (x, y) */
export const place = (pts: N[][], x0: N, y0: N, s: N, x: N, y: N) => pts.map(([a, b]) => [x + (a - x0) * s, y + (b - y0) * s]);
