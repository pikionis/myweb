import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { centers, symbolBox, wordBox, type LoopKey } from '../data/logo';

/*
 * The opening intro, "One Continuous Line": three loops, one point where they meet.
 *
 *   0–1.6s   scatter   each loop draws itself somewhere on the screen, slightly turned, scaled and out of
 *                      focus, while its word is written beside it (Design, Build, Automate)
 *   1.6–2.6  converge  the words drift off; the loops fly together on an arc and lock into the symbol
 *   2.55–3   lock      the blue arc draws in to the tip, the symbol pulses, a cobalt bloom where they meet
 *   2.95–3.4 shine     one band of light crosses the symbol
 *   3.0–4.35 wordmark  o n e h u b rise in, one letter at a time
 *   4.0–4.5  line      the motto and its tail under the logo
 *   4.75+    hand-off  the logo and its motto fly into the header (top left) while the intro's ground lifts off
 *                      the page
 *
 * It plays on the hero's own dark ground, in the header's colours there, so the page it hands over to is the same
 * ground (and a phone that waits for the script waits on the site's own colour, not a blank one).
 *
 * The head script in Base.astro picks the mode before the first paint (html[data-intro]): `full` once per
 * session, `still` with reduced motion (the logo and its line for a moment, then a fade), `quick` on later
 * loads (only the header logo fades in, in CSS). A click, a key, the wheel or a touch skips straight to the end.
 */

/** Session key, shared with the head script in Base.astro. */
const SEEN = 'ohl-intro';
const STILL_HOLD = 600;

type Scatter = { x: number; y: number; r: number; s: number };
// where each loop draws itself: its centre as a share of the viewport from the middle, a turn and a scale
// (the larger a loop, the nearer it seems, so the more out of focus it starts)
const WIDE: Record<LoopKey, Scatter> = {
  top: { x: -0.24, y: -0.17, r: -14, s: 1.55 },
  left: { x: -0.05, y: 0.21, r: 10, s: 1.12 },
  right: { x: 0.21, y: -0.06, r: -8, s: 1.32 },
};
// on a narrow screen they stay closer together and their words sit below them
const NARROW: Record<LoopKey, Scatter> = {
  top: { x: -0.17, y: -0.26, r: -12, s: 1.55 },
  left: { x: 0.18, y: -0.05, r: 9, s: 1.3 },
  right: { x: -0.13, y: 0.17, r: -7, s: 1.42 },
};
const KEYS: LoopKey[] = ['top', 'left', 'right'];
const SCROLL_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);

export type IntroHandle = {
  /** resolves when the page starts to show (the hand-off, a skip, or no intro at all) */
  handoff: Promise<void>;
  /** resolves when the overlay is gone */
  done: Promise<void>;
  /** whether an intro covers the page now (full or still) */
  playing: boolean;
};

const settled: IntroHandle = { handoff: Promise.resolve(), done: Promise.resolve(), playing: false };

export function logoIntro(): IntroHandle {
  const html = document.documentElement;
  const mode = html.dataset.intro;
  // tells the head script's failsafe that the intro has been picked up
  (window as Window & { __ohl?: boolean }).__ohl = true;
  const el = document.getElementById('ohl');
  if (!el || (mode !== 'full' && mode !== 'still')) {
    el?.remove();
    return settled;
  }
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* storage blocked: it may play again next time */ }

  let markHandoff = () => {};
  let markDone = () => {};
  const handoff = new Promise<void>((r) => (markHandoff = r));
  const done = new Promise<void>((r) => (markDone = r));
  el.classList.add('live');

  let released = false;
  /** Gives the page back: scrolling, and whatever waits for the hand-off. */
  const release = () => {
    if (released) return;
    released = true;
    html.classList.remove('ohl-lock');
    markHandoff();
  };
  // any click, key, wheel or touch skips to the end
  let stopListening = () => {};
  const finish = () => {
    stopListening();
    release();
    html.dataset.intro = 'done';
    el.remove();
    markDone();
  };
  const listen = (skip: () => void) => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // the key that skips should not also scroll the page it reveals
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
      skip();
    };
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', skip, opts);
    window.addEventListener('keydown', key, { capture: true });
    window.addEventListener('wheel', skip, opts);
    window.addEventListener('touchmove', skip, opts);
    stopListening = () => {
      window.removeEventListener('pointerdown', skip, opts);
      window.removeEventListener('keydown', key, { capture: true });
      window.removeEventListener('wheel', skip, opts);
      window.removeEventListener('touchmove', skip, opts);
    };
  };

  /** Fades the overlay away over a page that is already in its final state. */
  const fadeOut = (duration: number) => {
    stopListening();
    release();
    html.dataset.intro = 'done';
    gsap.to(el, { autoAlpha: 0, duration, ease: 'power1.out', overwrite: true, onComplete: finish });
  };

  if (mode === 'still') {
    // reduced motion: the logo and its line hold for a moment, then the overlay fades
    const t = window.setTimeout(() => fadeOut(0.3), STILL_HOLD);
    listen(() => { clearTimeout(t); fadeOut(0.2); });
    return { handoff, done, playing: true };
  }

  // its words and line are set in the site's face at 500: laid out in the stand-in face the line wraps differently,
  // and everything would move when the face arrived, so it is measured once the face is in (a second at most)
  const face = document.fonts?.load('500 1em "Space Grotesk"').catch(() => []) ?? Promise.resolve([]);
  // (and after the page's first picture: setting up never holds that back)
  Promise.all([Promise.race([face, new Promise((r) => window.setTimeout(r, 1000))]), painted()])
    .then(() => play(el, release, finish, listen, fadeOut))
    .catch((err) => {
      // whatever went wrong, the page must not stay covered
      finish();
      console.error(err);
    });
  return { handoff, done, playing: true };
}

/** A new task: the page is handed back for a moment, so setting the intro up never holds a phone for long. */
const turn = () => new Promise<void>((r) => window.setTimeout(r, 0));

let firstPicture: Promise<void> | null = null;
/** Resolves once the page's first picture is on screen (a task after the frame that drew it). */
export const painted = () =>
  (firstPicture ??= new Promise<void>((r) => requestAnimationFrame(() => window.setTimeout(r, 0))));

async function play(
  el: HTMLElement,
  release: () => void,
  finish: () => void,
  listen: (skip: () => void) => void,
  fadeOut: (duration: number) => void,
) {
  gsap.registerPlugin(CustomEase);
  const base = CustomEase.create('ohl', '0.65,0,0.35,1');
  const $ = <T extends Element>(s: string) => el.querySelector<T>(s)!;
  const stage = $<HTMLElement>('.ohl-stage');
  const sym = $<HTMLElement>('.ohl-sym');
  const word = $<SVGSVGElement>('.ohl-word');
  const line = $<HTMLElement>('.ohl-line');
  const motto = $<HTMLElement>('.ohl-motto');
  const tail = $<HTMLElement>('.ohl-tail');
  const skipBtn = $<HTMLElement>('.ohl-skip');
  const glow = $<HTMLElement>('.ohl-glow');
  const shine = $<SVGSVGElement>('.ohl-shine');
  const sweep = $<SVGLinearGradientElement>('#ohl-sweep');
  const arc = $<SVGSVGElement>('.ohl-arc');
  const arcPens = [...arc.querySelectorAll<SVGPathElement>('.ohl-pen')];
  const layers = KEYS.map((k) => $<SVGSVGElement>(`[data-loop="${k}"]`));
  const pens = layers.map((l) => l.querySelector<SVGPathElement>('.ohl-pen')!);
  const says = KEYS.map((k) => $<HTMLElement>(`[data-say="${k}"]`));
  says.forEach((say) => say.replaceChildren(...[...(say.dataset.word ?? '')].map((c) => {
    const s = document.createElement('span');
    s.textContent = c;
    return s;
  })));
  const letters = [...word.querySelectorAll('use')];

  // ---- measure the master lockup: every read before any write, so the page is laid out once ----
  const vw = window.innerWidth, vh = window.innerHeight;
  const narrow = vw < 760;
  const S = narrow ? NARROW : WIDE;
  const box = sym.getBoundingClientRect();
  const u = box.width / symbolBox.w;
  const wu = word.getBoundingClientRect().width / wordBox.w;
  const drawn = [...pens, ...arcPens];
  const lengths = drawn.map((p) => p.getTotalLength());
  // the words' letters rise by 0.4em, given in px (in em, each letter would be measured on its own)
  const em = parseFloat(getComputedStyle(says[0]).fontSize) || 16;
  const sizes = says.map((say) => say.getBoundingClientRect());
  const sayLetters = says.flatMap((say) => [...say.children]);
  // what GSAP moves has its transform read now too (it reads each one the first time it touches it)
  [...layers, ...says, ...sayLetters, ...letters, sym, word, motto, line, glow].forEach((t) => gsap.getProperty(t, 'x'));

  // where each loop scatters and each word goes (beside its loop on a wide screen, under it on a narrow one)
  const spots = KEYS.map((k) => {
    const c = centers[k], s = S[k];
    const cx = vw / 2 + s.x * vw + (c.bx + c.bw / 2 - c.x) * u * s.s;
    const cy = vh / 2 + s.y * vh + (c.by + c.bh / 2 - c.y) * u * s.s;
    return {
      // the loop's centre moves from its place in the symbol to its scatter point
      x: vw / 2 + s.x * vw - (box.left + c.x * u),
      y: vh / 2 + s.y * vh - (box.top + c.y * u),
      left: narrow ? cx : cx + (c.bw * u * s.s) / 2 + 22,
      top: narrow ? cy + (c.bh * u * s.s) / 2 + 14 : cy,
    };
  });
  await turn();

  // ---- the first frame: writes only ----
  drawn.forEach((p, i) => gsap.set(p, { strokeDasharray: `${lengths[i]} ${lengths[i]}`, strokeDashoffset: lengths[i] }));
  KEYS.forEach((k, i) => {
    const s = S[k], spot = spots[i];
    gsap.set(layers[i], { x: spot.x, y: spot.y, rotation: s.r - 6, scale: s.s * 0.9, autoAlpha: 0, filter: `blur(${Math.round(s.s * 7)}px)` });
    gsap.set(says[i], narrow ? { left: spot.left, top: spot.top, xPercent: -50 } : { left: spot.left, top: spot.top, yPercent: -50 });
  });
  gsap.set(sayLetters, { autoAlpha: 0, y: 0.4 * em, filter: 'blur(4px)' });
  gsap.set([arc, shine, glow, line, ...letters], { autoAlpha: 0 });
  el.classList.add('run');
  await turn();

  // ---- the timeline ----
  const tl = gsap.timeline({ defaults: { ease: base } });

  // scatter: the loops arrive a quarter second apart, each drawing itself while its word is written
  KEYS.forEach((k, i) => {
    const t0 = 0.1 + i * 0.25, s = S[k], L = layers[i];
    tl.to(L, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, t0)
      .to(L, { filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, t0)
      .to(L, { rotation: s.r, scale: s.s, duration: 1.1, ease: 'power3.out' }, t0)
      .to(pens[i], { strokeDashoffset: 0, duration: 0.85 }, t0)
      .to(says[i].children, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.35, stagger: 0.06, ease: 'power2.out' }, t0 + 0.15);
  });

  // once drawn, a part shows whole: the pens only ever approximate the line, so the masks go
  const unmask = (svgs: SVGSVGElement[]) => () => svgs.forEach((s) => s.querySelector('use')?.removeAttribute('mask'));

  // converge: the words drift away from the middle as the loops fly home on an arc
  const C = 1.6;
  tl.call(unmask(layers), [], C);
  says.forEach((say, i) => {
    // its centre, from where it was put (centred on its left on a narrow screen, on its top on a wide one)
    const { width: w, height: h } = sizes[i];
    const dx = spots[i].left + (narrow ? 0 : w / 2) - vw / 2, dy = spots[i].top + (narrow ? h / 2 : 0) - vh / 2;
    const d = Math.hypot(dx, dy) || 1;
    tl.to(say, { x: (dx / d) * 28, y: (dy / d) * 28, autoAlpha: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.inOut' }, C + i * 0.04);
  });
  layers.forEach((L, i) => {
    const at = C + 0.02 + i * 0.04;
    // x and y on different curves bend the flight into an arc
    tl.to(L, { x: 0, duration: 0.95, ease: 'expo.inOut' }, at)
      .to(L, { y: 0, duration: 0.95, ease: 'power3.inOut' }, at)
      .to(L, { rotation: 0, scale: 1, duration: 0.95, ease: 'expo.inOut' }, at)
      .to(L, { keyframes: [{ filter: 'blur(1.4px)', duration: 0.45, ease: 'power2.in' }, { filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }] }, at);
  });

  // lock: the arc draws in from both crossings and lands on the tip, which is the beat
  const K = 2.55;
  tl.set(arc, { autoAlpha: 1 }, K)
    .to(arcPens, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.in' }, K)
    .call(unmask([arc]), [], K + 0.32)
    .fromTo(arc, { filter: 'drop-shadow(0 0 0px rgb(45 73 173 / 0))' },
      { keyframes: [{ filter: 'drop-shadow(0 0 7px rgb(45 73 173 / 0.85))', duration: 0.18, ease: 'power2.out' },
        { filter: 'drop-shadow(0 0 0px rgb(45 73 173 / 0))', duration: 0.5, ease: 'power2.inOut' }] }, K + 0.28)
    .to(sym, { scale: 1.04, duration: 0.16, ease: 'power2.out' }, K + 0.28)
    .to(sym, { scale: 1, duration: 0.34 }, K + 0.44)
    .fromTo(glow, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, K + 0.26)
    .to(glow, { autoAlpha: 0, scale: 1.5, duration: 0.45, ease: 'power2.out' }, K + 0.46);

  // shine: one diagonal band of light across the symbol
  const band = { t: 0 };
  const moveBand = () => {
    const t = band.t * 2 - 1;
    sweep.setAttribute('gradientTransform', `translate(${t * symbolBox.w * 0.7} ${t * symbolBox.h * 0.7})`);
  };
  moveBand();
  tl.set(shine, { autoAlpha: 1 }, 2.93)
    .to(band, { t: 1, duration: 0.45, ease: 'power1.inOut', onUpdate: moveBand }, 2.95)
    .set(shine, { autoAlpha: 0 }, 3.42);

  // wordmark, letter by letter and unhurried, then the line under it (letters are SVG, so their rise is in
  // wordmark units)
  tl.fromTo(letters, { autoAlpha: 0, y: 18 / wu }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, 3.0)
    .fromTo(line, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 4.0);

  // hand-off
  let out: gsap.core.Timeline | null = null;
  tl.call(() => {
    release();
    const head = document.querySelector<SVGSVGElement>('.brand-sym');
    const headWord = document.querySelector<SVGSVGElement>('.brand-word');
    const headMotto = document.querySelector<HTMLElement>('.brand-motto');
    out = gsap.timeline({ onComplete: () => { if (!over) { over = true; finish(); } } });
    // the end of the line bows out as the logo leaves (on a phone it sits on a line of its own, under the
    // motto, so riding up with the ground would cross it)
    out.to([skipBtn, tail], { autoAlpha: 0, duration: 0.2, ease: 'power1.out' }, 0)
      .to(el.querySelector('.ohl-bg'), { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.06);
    // the motto goes with the logo: it lands under the wordmark in the header, so the message stays
    const m = motto.getBoundingClientRect(), hm = headMotto?.getBoundingClientRect();
    if (hm && hm.width > 0) {
      out.to(motto, { x: hm.left - m.left, y: hm.top - m.top, scale: hm.width / m.width, transformOrigin: '0 0', duration: 0.85, ease: 'expo.inOut' }, 0.04);
    } else {
      out.to(motto, { y: -window.innerHeight, duration: 0.8, ease: 'expo.inOut' }, 0.06);
    }
    if (head) {
      // FLIP: from where the logo is to where the header's logo is
      const a = sym.getBoundingClientRect(), b = head.getBoundingClientRect();
      // the ground lifts the same way the logo flies; at the end of its flight the logo takes the header's colour
      // (the same ivory on the hero)
      out.to(sym, { x: b.left - a.left, y: b.top - a.top, scale: b.width / a.width, transformOrigin: '0 0', duration: 0.85, ease: 'expo.inOut' }, 0)
        .to(stage, { color: getComputedStyle(head).color, duration: 0.2, ease: 'power1.inOut' }, 0.5);
    }
    const w = word.getBoundingClientRect(), hw = headWord?.getBoundingClientRect();
    if (hw && hw.width > 0) {
      out.to(word, { x: hw.left - w.left, y: hw.top - w.top, scale: hw.width / w.width, transformOrigin: '0 0', duration: 0.85, ease: 'expo.inOut' }, 0.02);
    } else {
      // the header shows only the symbol here: the wordmark bows out
      out.to(word, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' }, 0);
    }
  }, [], 4.75);

  let over = false;
  listen(() => {
    if (over) return;
    over = true;
    tl.kill();
    (out as gsap.core.Timeline | null)?.kill();
    fadeOut(0.25);
  });
}
