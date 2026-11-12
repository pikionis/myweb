import { symbolBox, wordBox } from '../data/logo';
import { drawReel, REEL, type Landing } from './reel';

/*
 * The opening intro, "Everything meets at one point": a rising line and its baseline become the two curves of
 * the symbol, spin and lock into it; the wordmark rises beside it; the lockup flies into the header (top left)
 * while the intro's ground lifts off the page. The picture is src/scripts/reel.ts, a function of time drawn on
 * one canvas; this file owns the overlay: when it plays, the clock, the skip, the hand-off.
 *
 * It plays on the hero's own dark ground, in the header's colours there, so the page it hands over to is the same
 * ground (and a phone that waits for the script waits on the site's own colour, not a blank one).
 *
 * The head script in Base.astro picks the mode before the first paint (html[data-intro]): `full` once per
 * session, `still` with reduced motion (the lockup for a moment, then a fade), `quick` on later loads (only the
 * header logo fades in, in CSS). A click, a key, the wheel or a touch skips straight to the end.
 */

/** Session key, shared with the head script in Base.astro. */
const SEEN = 'ohl-intro';
const STILL_HOLD = 600;
const SCROLL_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);
// the scene is 1920 × 1080 around its middle; this much of it must always fit the screen
const FIT = { w: 1280, h: 900 };

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
  const canvas = el?.querySelector('canvas');
  const c = canvas?.getContext('2d');
  if (!el || !canvas || !c || (mode !== 'full' && mode !== 'still')) {
    el?.remove();
    if (mode === 'full' || mode === 'still') { html.dataset.intro = 'done'; html.classList.remove('ohl-lock'); }
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
  let frame = 0;
  let over = false;
  let stopListening = () => {};
  const finish = () => {
    over = true;
    cancelAnimationFrame(frame);
    stopListening();
    release();
    html.dataset.intro = 'done';
    el.remove();
    markDone();
  };
  // any click, key, wheel or touch skips to the end
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
    window.addEventListener('resize', fit);
    stopListening = () => {
      window.removeEventListener('pointerdown', skip, opts);
      window.removeEventListener('keydown', key, { capture: true });
      window.removeEventListener('wheel', skip, opts);
      window.removeEventListener('touchmove', skip, opts);
      window.removeEventListener('resize', fit);
    };
  };
  /** Fades the overlay away over a page that is already in its final state. */
  const fadeOut = (ms: number) => {
    if (over) return;
    over = true;
    cancelAnimationFrame(frame);
    stopListening();
    release();
    html.dataset.intro = 'done';
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' }).finished.then(finish, finish);
  };

  // ---- the canvas: the scene's middle on the screen's, as large as fits ----
  const css = getComputedStyle(el);
  const ivory = css.getPropertyValue('--ivory').trim() || '#f8f4e6';
  const cobalt = css.getPropertyValue('--cobalt').trim() || '#2d49ad';
  let vw = 0, vh = 0, scale = 1, now = 0;
  let landing: Landing | null = null;
  function fit() {
    vw = window.innerWidth; vh = window.innerHeight;
    scale = Math.min(vw / FIT.w, vh / FIT.h, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(vw * dpr); canvas!.height = Math.round(vh * dpr);
    if (landing) landing = land();
    paint(now);
  }
  function paint(t: number) {
    now = t;
    const dpr = canvas!.width / vw;
    c!.setTransform(1, 0, 0, 1, 0, 0);
    c!.clearRect(0, 0, canvas!.width, canvas!.height);
    c!.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (vw / 2 - 960 * scale), dpr * (vh / 2 - 540 * scale));
    drawReel(c!, t, ivory, cobalt, landing);
  }
  /** The header's logo, in scene units. */
  function land(): Landing {
    const box = (r: DOMRect, units: number) => ({ x: (r.left - vw / 2) / scale + 960, y: (r.top - vh / 2) / scale + 540, k: r.width / units / scale });
    const sym = document.querySelector('.brand-sym')?.getBoundingClientRect();
    const word = document.querySelector('.brand-word')?.getBoundingClientRect();
    return {
      // no header logo on this page: the lockup stays where it is
      sym: sym && sym.width > 0 ? box(sym, symbolBox.w) : { x: 410, y: 347.7, k: 1100 / 2698.3 },
      word: word && word.width > 0 ? box(word, wordBox.w) : null,
    };
  }

  if (mode === 'still') {
    // reduced motion: the lockup holds for a moment, then the overlay fades
    fit();
    paint(REEL.handoff);
    el.classList.add('run');
    const t = window.setTimeout(() => fadeOut(300), STILL_HOLD);
    listen(() => { clearTimeout(t); fadeOut(200); });
    return { handoff, done, playing: true };
  }

  // it starts after the page's first picture: setting up never holds that back
  painted().then(() => {
    fit();
    paint(0);
    el.classList.add('run');
    listen(() => fadeOut(250));
    const ground = el.querySelector<HTMLElement>('.ohl-bg');
    const skipBtn = el.querySelector<HTMLElement>('.ohl-skip');
    let start = 0;
    const tick = (ms: number) => {
      if (over) return;
      start ||= ms;
      const t = (ms - start) / 1000;
      if (t >= REEL.handoff && !landing) {
        // hand-off: the page is given back, the ground lifts and the lockup flies onto the header's logo
        release();
        landing = land();
        ground?.classList.add('lift');
        skipBtn?.classList.add('gone');
      }
      paint(t);
      if (t >= REEL.handoff + REEL.fly) finish();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }).catch((err) => {
    // whatever went wrong, the page must not stay covered
    finish();
    console.error(err);
  });
  return { handoff, done, playing: true };
}

let firstPicture: Promise<void> | null = null;
/** Resolves once the page's first picture is on screen (a task after the frame that drew it). */
export const painted = () =>
  (firstPicture ??= new Promise<void>((r) => requestAnimationFrame(() => window.setTimeout(r, 0))));
