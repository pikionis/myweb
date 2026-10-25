import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { centers, symbolBox, wordBox, type LoopKey } from '../data/logo';

/*
 * The opening intro, "One Continuous Line": three loops, one point where they meet.
 *
 *   0–1.6s   scatter   each loop draws itself somewhere on the screen, slightly turned, scaled and out of
 *                      focus, while its word is written beside it (Design, Build, Automate)
 *   1.6–2.6  converge  the words drift off; the loops fly together on an arc and lock into the symbol
 *   2.6–3.1  lock      the blue arc draws in to the tip, the symbol pulses, a cobalt bloom where they meet
 *   3.1–3.5  shine     one band of light crosses the symbol
 *   3.3–3.9  wordmark  o n e h u b rise in
 *   3.8–4.3  line      the line under the logo
 *   4.3+     hand-off  the logo flies into the header while the ivory lifts off the page
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
};

const settled: IntroHandle = { handoff: Promise.resolve(), done: Promise.resolve() };

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
    return { handoff, done };
  }

  try {
    play(el, release, finish, listen, fadeOut);
  } catch (err) {
    // whatever went wrong, the page must not stay covered
    finish();
    console.error(err);
  }
  return { handoff, done };
}

function play(
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

  // ---- measure the master lockup and lay out the first frame ----
  const vw = window.innerWidth, vh = window.innerHeight;
  const narrow = vw < 760;
  const S = narrow ? NARROW : WIDE;
  const box = sym.getBoundingClientRect();
  const u = box.width / symbolBox.w;
  const wu = word.getBoundingClientRect().width / wordBox.w;

  const penLength = (p: SVGPathElement) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len });
    return len;
  };
  pens.forEach(penLength);
  arcPens.forEach(penLength);

  KEYS.forEach((k, i) => {
    const c = centers[k], s = S[k];
    // move the loop's centre from its place in the symbol to its scatter point
    const x = vw / 2 + s.x * vw - (box.left + c.x * u);
    const y = vh / 2 + s.y * vh - (box.top + c.y * u);
    gsap.set(layers[i], { x, y, rotation: s.r - 6, scale: s.s * 0.9, autoAlpha: 0, filter: `blur(${Math.round(s.s * 7)}px)` });
    // the word goes beside the loop (wide) or under it (narrow), from the loop's scattered bounds
    const cx = vw / 2 + s.x * vw + (c.bx + c.bw / 2 - c.x) * u * s.s;
    const cy = vh / 2 + s.y * vh + (c.by + c.bh / 2 - c.y) * u * s.s;
    gsap.set(says[i], narrow
      ? { left: cx, top: cy + (c.bh * u * s.s) / 2 + 14, xPercent: -50 }
      : { left: cx + (c.bw * u * s.s) / 2 + 22, top: cy, yPercent: -50 });
    gsap.set(says[i].children, { autoAlpha: 0, y: '0.4em', filter: 'blur(4px)' });
  });
  gsap.set([arc, shine, glow, line, ...letters], { autoAlpha: 0 });
  el.classList.add('run');

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
    const r = say.getBoundingClientRect();
    const dx = r.left + r.width / 2 - vw / 2, dy = r.top + r.height / 2 - vh / 2;
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
  const K = 2.62;
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
  tl.set(shine, { autoAlpha: 1 }, 3.08)
    .to(band, { t: 1, duration: 0.45, ease: 'power1.inOut', onUpdate: moveBand }, 3.1)
    .set(shine, { autoAlpha: 0 }, 3.56);

  // wordmark, then the line under it (letters are SVG, so their rise is in wordmark units)
  tl.fromTo(letters, { autoAlpha: 0, y: 12 / wu }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.05, ease: 'power3.out' }, 3.3)
    .fromTo(line, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 3.8);

  // hand-off
  let out: gsap.core.Timeline | null = null;
  tl.call(() => {
    release();
    const head = document.querySelector<SVGSVGElement>('.brand-sym');
    const headWord = document.querySelector<SVGSVGElement>('.brand-word');
    out = gsap.timeline({ onComplete: () => { if (!over) { over = true; finish(); } } });
    out.to([line, skipBtn], { autoAlpha: 0, duration: 0.2, ease: 'power1.out' }, 0)
      .to(el.querySelector('.ohl-bg'), { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.06);
    if (head) {
      // FLIP: from where the logo is to where the header's logo is
      const a = sym.getBoundingClientRect(), b = head.getBoundingClientRect();
      // the ivory lifts the same way the logo flies, so the logo only reaches the page's own ground at the
      // very end of its flight: that is when it takes the header's colour
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
  }, [], 4.3);

  let over = false;
  listen(() => {
    if (over) return;
    over = true;
    tl.kill();
    (out as gsap.core.Timeline | null)?.kill();
    fadeOut(0.25);
  });
}
