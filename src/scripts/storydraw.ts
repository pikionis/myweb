import { gsap } from 'gsap';

// The pen of "My story" (src/scripts/mystory.ts, src/scripts/kalimera.ts): how the line drawings draw themselves.
// Strokes are `sa-d` paths of pathLength 1 (src/components/lineart.ts); parts are named by data-p.

export type Tl = gsap.core.Timeline;
export type El = Element | null;
export const part = (root: Element, p: string) => root.querySelector<SVGGraphicsElement>(`[data-p="${p}"]`);
export const parts = (root: Element, prefix: string) => [...root.querySelectorAll<SVGGraphicsElement>(`[data-p^="${prefix}"]`)];
/** the strokes of a part that draw on (itself, if it is one) */
export const strokes = (el: El): Element[] => (!el ? [] : el.matches('.sa-d') ? [el] : [...el.querySelectorAll('.sa-d')]);
export const all = (...els: El[]) => els.flatMap(strokes);

/** the soft shadows of the solid shapes among these strokes (each sits just before its shape) */
export const shades = (els: Element[]) => els.map((e) => e.previousElementSibling).filter((e): e is Element => !!e?.matches('.shade'));
export const draw = (tl: Tl, els: Element[], at: number, duration = 0.6, stagger = 0.03) => {
  if (!els.length) return;
  tl.fromTo(els, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration, ease: 'power1.inOut', stagger }, at);
  const sh = shades(els);
  if (sh.length) tl.fromTo(sh, { opacity: 0 }, { opacity: 1, duration: duration * 0.8, ease: 'power1.out' }, at + duration * 0.4);
};
export const undraw = (tl: Tl, els: Element[], at: number, duration = 0.4) => {
  if (!els.length) return;
  tl.to(els, { strokeDashoffset: 1.01, duration, ease: 'power1.in' }, at);
  const sh = shades(els);
  if (sh.length) tl.to(sh, { opacity: 0, duration: duration * 0.6 }, at);
};
/** a block's faces fill in once its edges are drawn */
export const faces = (tl: Tl, root: Element, prefix: string, at: number, stagger = 0.1) =>
  void tl.fromTo(root.querySelectorAll(`[data-p^="${prefix}"][data-p$="-faces"]`), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger, ease: 'power1.out' }, at);
/** a part that rests hidden shows (set up in advance), or one that rests shown leaves (at its moment) */
export const show = (tl: Tl, el: El | El[], at: number, on = true, duration = 0.25) =>
  void tl.fromTo(el, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0, duration, ease: 'power1.out', immediateRender: on }, at);
export const pop = (tl: Tl, el: El | El[], at: number, origin = '50% 50%', stagger = 0) =>
  void tl.fromTo(el, { opacity: 0, scale: 0.6, transformOrigin: origin }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', stagger }, at);
/** words are written in, a letter at a time (as plain text: code such as <iostream> stays as it is). Hidden until
 *  their moment, so a scene starting over shows them blank again */
export const type = (tl: Tl, el: El, at: number, duration: number) => {
  if (!el) return;
  const full = el.textContent ?? '';
  const o = { n: 0 };
  show(tl, el, at, true, 0.01);
  tl.fromTo(o, { n: 0 }, { n: full.length, duration, ease: 'none', onUpdate: () => { el.textContent = full.slice(0, Math.round(o.n)); } }, at);
};
/** words that write themselves (`written` in MyStoryArt): the rect that clips them widens from nothing */
export const write = (tl: Tl, svg: Element, p: string, at: number, duration: number) => {
  const pen = part(svg, `${p}-pen`);
  if (!pen) return;
  tl.fromTo(pen, { attr: { width: 0 } }, { attr: { width: Number(pen.getAttribute('width')) }, duration, ease: 'power1.inOut' }, at);
};
/** a number counts up to what the picture says */
export const count = (tl: Tl, el: El, at: number, duration: number, to: number, format: (v: number) => string) => {
  if (!el) return;
  const o = { v: 0 };
  el.textContent = format(0);
  tl.fromTo(o, { v: 0 }, { v: to, duration, ease: 'power1.out', onUpdate: () => { el.textContent = format(o.v); } }, at);
};

/** a motion that runs on its own while its scene is on screen */
export const loop = (idle: gsap.core.Animation[], a: gsap.core.Animation) => { a.pause(); idle.push(a); };

/** strokes drawing themselves, and the solid shapes among them filling in as they do (on the tinted sky an
 *  empty shape would show its paper before its line) */
export const drawIn = (tl: Tl, els: Element[], at: number, duration = 0.6, stagger = 0.03) => {
  draw(tl, els, at, duration, stagger);
  const solids = els.filter((e) => e.classList.contains('solid'));
  if (solids.length) tl.fromTo(solids, { fillOpacity: 0 }, { fillOpacity: 1, duration: duration * 0.8, stagger, ease: 'power1.out' }, at + duration * 0.3);
};

/** A path's points at even steps along it (N + 1 of them, the first and last on its ends), worked out from its data
 *  alone: absolute M, H, V, L and C, all the coaster's track and the sun's way in Kalimera use. Asking the browser costs a walk along the whole
 *  path for every point, thousands of them on this one (seconds on a phone). */
export function sampled(d: string, step: number) {
  const pts: number[][] = [];
  let x = 0, y = 0;
  for (const [, cmd, args] of d.matchAll(/([MHVLC])([^MHVLC]*)/g)) {
    const a = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M' || cmd === 'L') for (let i = 0; i + 1 < a.length; i += 2) { x = a[i]; y = a[i + 1]; pts.push([x, y]); }
    else if (cmd === 'H') for (const v of a) { x = v; pts.push([x, y]); }
    else if (cmd === 'V') for (const v of a) { y = v; pts.push([x, y]); }
    else for (let i = 0; i + 5 < a.length; i += 6) {
      const [x1, y1, x2, y2, x3, y3] = a.slice(i, i + 6);
      for (let k = 1; k <= 48; k++) {
        const t = k / 48, u = 1 - t;
        pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
      }
      x = x3; y = y3;
    }
  }
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = lens[lens.length - 1], N = Math.max(1, Math.ceil(L / step));
  const xs: number[] = [], ys: number[] = [];
  let j = 1;
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * L;
    while (j < pts.length - 1 && lens[j] < s) j++;
    const seg = lens[j] - lens[j - 1], f = seg ? (s - lens[j - 1]) / seg : 0;
    xs.push(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f);
    ys.push(pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f);
  }
  return { xs, ys, L, N };
}
