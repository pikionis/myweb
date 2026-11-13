import { symbolBox, wordBox } from '../data/logo';
import { drawReel, drawLockup, REEL, type Landing } from './reel';
import { filmFit, type Frame, type Look } from './film';

/*
 * The opening intro, "Everything meets at one point": the film plays over the whole screen (six seconds: a
 * point, the words on a slab, then a rising line and its baseline that become the two curves of the symbol,
 * spin and lock into it); then the page is given back (the intro's ground lifts off it) and the symbol flies
 * to the top left, where the wordmark rises beside it at twice the header's size before the lockup shrinks
 * into the header's logo. The picture is src/scripts/reel.ts (the film: film.ts), a function of time drawn on
 * one canvas; this file owns the overlay: when it plays, the clock, the skip, the hand-off.
 *
 * It plays on the hero's own dark ground, in the header's colours there, so the page it hands over to is the same
 * ground (and a phone that waits for the script waits on the site's own colour, not a blank one).
 *
 * The head script in Base.astro picks the mode before the first paint (html[data-intro]): `full` once per
 * session, `still` with reduced motion (the lockup for a moment, then a fade), `quick` on later loads (only the
 * header logo fades in, in CSS). Until the hand-off a click, a key, the wheel or a touch skips straight to the
 * end; after it the page is the reader's and the corner plays on (the canvas takes no clicks).
 */

/** Session key, shared with the head script in Base.astro. */
const SEEN = 'ohl-intro';
const STILL_HOLD = 600;
const SCROLL_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);
// the scene is drawn around its middle; this much of it must always fit the screen while the still lockup shows
// (the film says how much it needs: filmFit)
const FIT_STILL = { w: 1280, h: 900 };
// how long the film waits for its typeface before it starts with the page's fallback
const FONT_WAIT = 1200;

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
    window.removeEventListener('resize', fit);
    window.removeEventListener('scroll', scrolled);
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
    stopListening = () => {
      window.removeEventListener('pointerdown', skip, opts);
      window.removeEventListener('keydown', key, { capture: true });
      window.removeEventListener('wheel', skip, opts);
      window.removeEventListener('touchmove', skip, opts);
    };
  };
  /** Fades the overlay away over a page that is already in its final state. */
  const fadeOut = (ms: number) => {
    if (over) return;
    over = true;
    cancelAnimationFrame(frame);
    stopListening();
    window.removeEventListener('resize', fit);
    release();
    html.dataset.intro = 'done';
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' }).finished.then(finish, finish);
  };

  // ---- the canvas: the scene's middle on the screen's, as large as fits ----
  const css = getComputedStyle(el);
  const ivory = css.getPropertyValue('--ivory').trim() || '#f8f4e6';
  const cobalt = css.getPropertyValue('--cobalt').trim() || '#2d49ad';
  let vw = 0, vh = 0, scale = 1, now = 0, still = false;
  // how much of the scene shows on this screen, in scene units
  let shown: Frame = { w: 1920, h: 1080 };
  // the film's look: the header's colours on the hero, the page's own typeface at its heaviest, the words the
  // component gives (LogoIntro.astro)
  let words: string[] = [];
  try { words = JSON.parse(el.dataset.words || '[]'); } catch { /* no words: the slabs stay empty */ }
  const groundEl = el.querySelector<HTMLElement>('.ohl-bg');
  const look: Look = {
    ink: ivory, cobalt, words,
    ground: (groundEl && getComputedStyle(groundEl).backgroundColor) || '#0a0b0a',
    font: getComputedStyle(document.body).fontFamily || 'sans-serif', weight: 700,
  };
  let landing: Landing | null = null;
  // after the hand-off the logo takes the header's colour, which turns to ink if the reader scrolls onto the
  // light page while it plays; read only while a scroll is recent (the header's colour change takes 0.3s)
  const brand = document.querySelector<HTMLElement>('.brand-wrap');
  let ink = ivory, lastScroll = -1e9;
  function scrolled() { lastScroll = performance.now(); }
  function fit() {
    vw = window.innerWidth; vh = window.innerHeight;
    const need = still ? FIT_STILL : filmFit(vw, vh);
    scale = Math.min(vw / need.w, vh / need.h, 1);
    shown = { w: vw / scale, h: vh / scale };
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
    if (still) drawLockup(c!, ivory, cobalt);
    else drawReel(c!, t, shown, look, ink, landing);
  }
  /** The header's logo, in scene units, and how large the corner can show it. */
  function land(): Landing {
    const rect = (q: string) => { const r = document.querySelector(q)?.getBoundingClientRect(); return r && r.width > 0 ? r : null; };
    const box = (r: DOMRect, units: number) => ({ x: (r.left - vw / 2) / scale + 960, y: (r.top - vh / 2) / scale + 540, k: r.width / units / scale });
    const sym = rect('.brand-sym'), word = rect('.brand-word');
    // as large as REEL.zoom, as long as it stays clear of what sits beside the logo in the bar (the menu on a
    // desktop, the languages on a phone)
    let zoom = REEL.zoom;
    if (sym && word) {
      const w = word.right - sym.left, h = Math.max(sym.bottom, word.bottom) - sym.top;
      for (const q of ['.topbar .row', '.topbar .top-lang']) {
        const r = rect(q);
        if (r && r.left > word.right && r.top < sym.top + h * zoom) zoom = Math.min(zoom, (r.left - 20 - sym.left) / w);
      }
    }
    return {
      // no header logo on this page: the symbol stays where the lockup would be
      sym: sym ? box(sym, symbolBox.w) : { x: 410, y: 347.7, k: 1100 / 2698.3 },
      word: word ? box(word, wordBox.w) : null,
      zoom: Math.max(1, zoom),
    };
  }

  if (mode === 'still') {
    // reduced motion: the lockup holds for a moment, then the overlay fades
    still = true;
    fit();
    window.addEventListener('resize', fit);
    el.classList.add('run');
    const t = window.setTimeout(() => fadeOut(300), STILL_HOLD);
    listen(() => { clearTimeout(t); fadeOut(200); });
    return { handoff, done, playing: true };
  }

  // it starts after the page's first picture: setting up never holds that back; the film's words wait for their
  // typeface (preloaded, so it is usually there), but not for long
  painted().then(() => Promise.race([
    document.fonts.load(`${look.weight} 100px ${look.font}`, words.join(' ')).catch(() => undefined),
    new Promise((r) => window.setTimeout(r, FONT_WAIT)),
  ])).then(() => {
    if (over) return;
    fit();
    paint(0);
    el.classList.add('run');
    window.addEventListener('resize', fit);
    listen(() => fadeOut(250));
    const ground = groundEl;
    const skipBtn = el.querySelector<HTMLElement>('.ohl-skip');
    let start = 0, last = 0;
    const tick = (ms: number) => {
      if (over) return;
      start ||= ms;
      const t = (ms - start) / 1000;
      if (t >= REEL.handoff && !landing) {
        // hand-off: the page is given back (no more skipping: it is the reader's now, and the canvas takes no
        // clicks), the ground lifts and the symbol flies to the header's logo, where the rest plays
        stopListening();
        release();
        landing = land();
        if (brand) ink = getComputedStyle(brand).color || ivory;
        window.addEventListener('scroll', scrolled, { passive: true });
        el.classList.add('handed');
        ground?.classList.add('lift');
        skipBtn?.classList.add('gone');
      }
      if (brand && landing && ms - lastScroll < 500) ink = getComputedStyle(brand).color || ink;
      // a reader who scrolls on has the page under the corner: the logo comes down to the header's size at once
      // (in 0.4s) and plays on there
      if (landing && landing.zoom > 1 && window.scrollY > 8) landing.zoom = Math.max(1, landing.zoom - ((ms - last) / 1000) * 3);
      last = ms;
      paint(t);
      if (t >= REEL.end) finish();
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
