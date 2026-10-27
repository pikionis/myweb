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
