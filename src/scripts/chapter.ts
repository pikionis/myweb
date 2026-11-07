import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Tl } from './storydraw';

/*
 * A chapter of "My story" (Chapter.astro; Kalimera, KOAN, DeinDeal): a scene told in beats. Its screen is sticky
 * while the page scrolls through the chapter, filling what is free: under the bar on a wide screen; on a phone
 * under the timeline strip and above the floating menu, where the camera comes in on each beat's picture
 * (`phoneCamera`). The story's snap stops at
 * the opening and at each beat (`points`). The scroll drives the chapter's progress `d` (0 at the opening, one
 * more per beat), scrubbed, for what moves with it; the beat on screen is the nearest one: its words come in, its
 * own picture plays from nothing (the one before fades) and its idle motions run. With reduced motion `d` steps
 * from beat to beat and each picture is shown as it ends.
 */

export type Beat = {
  /** what fades in with the beat and out after it */
  group?: Element | null;
  /** its picture, played from nothing as the beat arrives */
  tl?: Tl | null;
  /** motions that run while it is on screen */
  idle?: gsap.core.Animation[];
  /** builds its picture (`tl`, `idle`) later than the chapter: in the page's spare moments after it opens, or as
   *  the beat arrives if that comes first. A chapter holds a lot of drawing, and preparing all of it as the page
   *  opens would freeze a phone */
  make?: (tl: Tl, idle: gsap.core.Animation[]) => void;
};

export type ChapterOptions = {
  still: boolean;
  /** the scroll from one beat to the next, in heights of what is free on screen */
  steps: number[];
  /** the opening (0), then each beat */
  beats: Beat[];
  /** the chapter's progress as the page scrolls (0 to steps.length; whole numbers with reduced motion) */
  render?: (d: number) => void;
  /** the beat on screen changed (`was` is -1 the first time) */
  onBeat?: (k: number, was: number) => void;
  /** the chapter comes in, from either side */
  onEnter?: () => void;
};

/** A beat with its picture built (see `make`). */
export function ready(b: Beat | undefined) {
  if (b?.make && !b.tl) { b.tl = gsap.timeline({ paused: true }); b.idle = []; b.make(b.tl, b.idle); }
  return b;
}

/** the time to read these words, unhurried (about 210 words a minute, and a moment to look) */
export const readTime = (text: string) => 1.6 + text.trim().split(/\s+/).filter(Boolean).length * 0.28;

/** a box: in a drawing's units, or on screen */
export type Box = { l: number; t: number; r: number; b: number };
/** px on screen per unit of a drawing: below LEGIBLE its words stop reading on a phone (12 units → 11 px); the
 *  camera never comes in closer than CLOSEST */
const LEGIBLE = 0.92, CLOSEST = 1.5;

/** A box grown round its middle to at least w × h (a small picture is shown with what is around it). */
export const atLeast = (b: Box, w: number, h: number): Box => {
  const cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2, hw = Math.max(w, b.r - b.l) / 2, hh = Math.max(h, b.b - b.t) / 2;
  return { l: cx - hw, r: cx + hw, t: cy - hh, b: cy + hh };
};

/** The room under a beat's words, on screen: where a phone shows the beat's picture when the drawing fills the
 *  whole screen behind the words (`overlay` in Chapter.astro). */
export function underWords(root: HTMLElement, k: number): Box | null {
  const stage = root.querySelector('.ch-stage')?.getBoundingClientRect();
  const say = root.querySelector<HTMLElement>('.ch-say');
  const li = root.querySelectorAll<HTMLElement>('[data-beat]')[k];
  if (!stage || !say || !li) return null;
  // (every beat's words sit at the top of the same place, so the beat's own height is where its words end)
  return { l: stage.left + 8, r: stage.right - 8, t: say.getBoundingClientRect().top + li.offsetHeight + 18, b: stage.bottom - 14 };
}

/** The camera of a chapter on a phone. There its drawing is the width of the screen, a third of its size on a
 *  desktop, so the camera comes in on each beat's picture (`box`, in the drawing's units) in the room it has on
 *  screen (`room`): as close as that room allows, and at least close enough for its words to read. A picture then
 *  wider than the room is followed from its left to its right while it draws itself (the beats draw from left to
 *  right). With reduced motion the whole picture fits the room instead. `cam` is the group the camera moves, set as
 *  a plain transform (moved, then scaled) by `look`. */
export function phoneCamera(o: {
  cam: SVGGraphicsElement; view: { x: number; y: number; z: number }; look: () => void;
  box: (k: number) => Box | null; room: (k: number) => Box | null; beats: Beat[]; still: boolean;
  /** a beat whose picture is not followed but held: at its left (where its words are), its middle, or whole (a
   *  picture that must be seen all at once) */
  hold?: Record<number, 'left' | 'centre' | 'fit'>;
}) {
  let run: gsap.core.Timeline | null = null;
  const shot = (k: number) => {
    const b = o.box(k), r = o.room(k);
    const m = (o.cam.parentNode as SVGGraphicsElement | null)?.getScreenCTM?.();
    if (!b || !r || !m || !m.a || r.r <= r.l || r.b <= r.t) return null;
    const s = m.a, bw = b.r - b.l, bh = b.b - b.t, rw = r.r - r.l, rh = r.b - r.t;
    const fit = Math.min(rw / (s * bw), rh / (s * bh)), tall = rh / (s * bh);
    const z = o.still || o.hold?.[k] === 'fit' ? Math.min(fit, CLOSEST / s) : Math.min(tall, CLOSEST / s, Math.max(fit, LEGIBLE / s));
    // where the camera puts a point of the drawing (p) on screen (at X, Y)
    const tx = (X: number, p: number) => (X - m.e) / s - z * p, ty = (Y: number, p: number) => (Y - m.f) / s - z * p;
    const y = ty((r.t + r.b) / 2, (b.t + b.b) / 2);
    const middle = { x: tx((r.l + r.r) / 2, (b.l + b.r) / 2), y, z }, left = { x: tx(r.l, b.l), y, z };
    const hold = o.hold?.[k];
    if (z * s * bw <= rw + 1 || hold === 'centre') return { from: middle, to: null };
    if (hold === 'left') return { from: left, to: null };
    return { from: left, to: { x: tx(r.r, b.r), y, z } };
  };
  return {
    /** the camera on beat k: moved there (at once when `jump`), then along the picture as it draws */
    aim(k: number, jump: boolean) {
      run?.kill();
      const s = shot(k);
      if (!s) return;
      if (jump) { Object.assign(o.view, s.from); o.look(); }
      run = gsap.timeline({ onUpdate: o.look });
      if (!jump) run.to(o.view, { ...s.from, duration: 1, ease: 'power2.inOut' });
      if (s.to) run.to(o.view, { ...s.to, duration: Math.max(2.2, (o.beats[k]?.tl?.duration() ?? 3) - 0.8), ease: 'sine.inOut' });
    },
    stop: () => run?.kill(),
  };
}

// the top bar's height (the --topbar-h token, the same at every size), read once: reading it works the whole page's
// styles out again, and this page is long
let topbar = 0;
const barHeight = () => (topbar ||= parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72);

export function chapter(root: HTMLElement, o: ChapterOptions) {
  gsap.registerPlugin(ScrollTrigger);
  const { still, steps, beats } = o;
  const says = [...root.querySelectorAll<HTMLElement>('[data-beat]')];
  const phone = window.matchMedia('(max-width: 860px)');
  root.classList.add('ch-on');
  // (in one go: set one by one, each read of the page came between two writes)
  gsap.set(beats.map((b) => b.group).filter((g): g is Element => !!g), { opacity: 0 });

  // ---- the beat on screen (its picture built when the page has a spare moment, or when it is needed; none is
  // built while the chapter is still far down the page, see `near` below)
  let active = -1;
  let near = false;
  const go = (k: number) => {
    if (k === active) return;
    const was = active;
    active = k;
    says.forEach((s, i) => s.classList.toggle('on', i === k));
    // (on a phone the words take only the room this beat's need, and the body comes up under them; where the drawing
    // fills the screen behind them, what it draws above their end fades out, so they stay clear)
    if (phone.matches && says[k]) {
      root.style.setProperty('--say-h', `${says[k].offsetHeight}px`);
      const stageEl = root.querySelector('.ch-stage'), sayEl = root.querySelector('.ch-say');
      if (stageEl && sayEl) root.style.setProperty('--room-top', `${Math.round(sayEl.getBoundingClientRect().top - stageEl.getBoundingClientRect().top + says[k].offsetHeight + 4)}px`);
    }
    const before = beats[was], now = near ? ready(beats[k]) : beats[k];
    if (before) {
      before.tl?.pause();
      before.idle?.forEach((a) => a.pause());
      if (before.group) gsap.to(before.group, { opacity: 0, duration: still ? 0.2 : 0.35, overwrite: true });
    }
    if (now) {
      if (now.group) gsap.to(now.group, { opacity: 1, duration: 0.2, overwrite: true });
      if (still) now.tl?.progress(1);
      else { now.tl?.restart(); now.idle?.forEach((a) => a.play()); }
    }
    o.onBeat?.(k, was);
  };

  // ---- sizes, and the stops
  let top = 0, unit = 0;
  const offsets: number[] = [];
  const size = () => {
    const bar = barHeight();
    const strip = phone.matches ? (document.querySelector<HTMLElement>('.ms-rail')?.offsetHeight ?? 0) : 0;
    const free = window.innerHeight - bar - strip - (phone.matches ? 96 : 16);
    root.classList.toggle('phone', phone.matches);
    // (a phone gives the chapter all it has: its camera comes in on each beat's picture, see phoneCamera)
    const stageH = free;
    top = bar + strip + (free - stageH) / 2;
    // (shorter on a phone)
    unit = free * (phone.matches ? 0.6 : 0.8);
    offsets.length = 0;
    steps.reduce((sum, s) => { offsets.push(sum); return sum + s * unit; }, 0);
    offsets.push(steps.reduce((sum, s) => sum + s * unit, 0));
    root.style.setProperty('--ch-top', `${top}px`);
    root.style.setProperty('--ch-stage-h', `${stageH}px`);
    root.style.setProperty('--ch-h', `${stageH + offsets[offsets.length - 1]}px`);
  };
  size();
  ScrollTrigger.addEventListener('refreshInit', size);

  // ---- the progress, as the page scrolls
  const p = { d: 0 };
  const render = () => {
    const d = still ? Math.round(p.d) : p.d;
    o.render?.(d);
    go(Math.max(0, Math.min(steps.length, Math.round(d))));
  };
  const scrub = gsap.timeline({
    scrollTrigger: { trigger: root, start: () => `top ${top}px`, end: () => `+=${offsets[offsets.length - 1]}`, scrub: still ? true : 0.9 },
    onUpdate: render,
  });
  steps.forEach((s, k) => scrub.to(p, { d: k + 1, duration: s, ease: 'none' }));
  const enter = ScrollTrigger.create({
    trigger: root, start: 'top 75%', end: 'bottom 25%',
    onToggle: (self) => {
      const b = beats[active];
      if (!self.isActive) { b?.tl?.pause(); b?.idle?.forEach((a) => a.pause()); return; }
      // coming in, from either side: the chapter's opening, and the beat on screen plays again
      o.onEnter?.();
      if (!still && b) { b.tl?.restart(); b.idle?.forEach((a) => a.play()); }
    },
  });
  render();

  // the beats' pictures, one per spare moment, in order, from when the chapter is three screens away (building them
  // is what costs a phone; the page opens without it): each starts blank, so the chapter is ready before it is reached
  let killed = false;
  const later = (fn: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 30));
  const prepare = (k: number) => {
    if (killed || k >= beats.length) return;
    later(() => { if (!killed) { ready(beats[k]); prepare(k + 1); } });
  };
  const approach = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || killed) return;
    approach.disconnect();
    near = true;
    // the beat already showing gets its picture now
    const k = active;
    active = -1;
    go(k);
    prepare(0);
  }, { rootMargin: '300% 0px' });
  approach.observe(root);

  return {
    /** where the page stops for the opening and each beat (from the top of the document) */
    points: () => {
      const y = root.getBoundingClientRect().top + window.scrollY - top;
      return offsets.map((off) => y + off);
    },
    phone: () => phone.matches,
    /** how long the story waits at beat k when it tells itself (mystory.ts): its picture played, its words read */
    hold: (k: number) => {
      const b = ready(beats[k]);
      return Math.max((b?.tl?.duration() ?? 1.2) + 0.8, readTime(says[k]?.textContent ?? ''));
    },
    kill: () => {
      killed = true;
      approach.disconnect();
      ScrollTrigger.removeEventListener('refreshInit', size);
      scrub.scrollTrigger?.kill(); scrub.kill(); enter.kill();
      beats.forEach((b) => b.tl?.kill());
      root.classList.remove('ch-on', 'phone');
    },
  };
}
