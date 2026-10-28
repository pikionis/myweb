import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Tl } from './storydraw';

/*
 * A chapter of "My story" (Chapter.astro; Kalimera and KOAN): a scene told in beats. Its screen is sticky while the
 * page scrolls through the chapter: under the bar on a wide screen, filling what is free; on a phone (under the
 * timeline strip, above the floating menu) as tall as it needs, in the middle of that. The story's snap stops at
 * the opening and at each beat (`points`). The scroll drives the chapter's progress `d` (0 at the opening, one
 * more per beat), scrubbed, for what moves with it; the beat on screen is the nearest one: its words come in, its
 * own picture plays from nothing (the one before fades) and its idle motions run. With reduced motion `d` steps
 * from beat to beat and each picture is shown as it ends.
 */

gsap.registerPlugin(ScrollTrigger);

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

export function chapter(root: HTMLElement, o: ChapterOptions) {
  const { still, steps, beats } = o;
  const stage = root.querySelector<HTMLElement>('.ch-stage')!;
  const says = [...root.querySelectorAll<HTMLElement>('[data-beat]')];
  const phone = window.matchMedia('(max-width: 860px)');
  root.classList.add('ch-on');
  beats.forEach((b) => b.group && gsap.set(b.group, { opacity: 0 }));

  // ---- the beat on screen (its picture built when the page has a spare moment, or when it is needed)
  let active = -1;
  const go = (k: number) => {
    if (k === active) return;
    const was = active;
    active = k;
    says.forEach((s, i) => s.classList.toggle('on', i === k));
    const before = beats[was], now = ready(beats[k]);
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
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72;
    const strip = phone.matches ? (document.querySelector<HTMLElement>('.ms-rail')?.offsetHeight ?? 0) : 0;
    const free = window.innerHeight - bar - strip - (phone.matches ? 96 : 16);
    root.classList.toggle('phone', phone.matches);
    let stageH = free;
    if (phone.matches) {
      root.classList.add('ch-measure');
      stageH = Math.min(free, stage.offsetHeight);
      root.classList.remove('ch-measure');
    }
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

  // the beats' pictures, one per spare moment, in order: each starts blank, so the chapter is ready before it is reached
  let killed = false;
  const later = (fn: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 30));
  const prepare = (k: number) => {
    if (killed || k >= beats.length) return;
    later(() => { if (!killed) { ready(beats[k]); prepare(k + 1); } });
  };
  prepare(0);

  return {
    /** where the page stops for the opening and each beat (from the top of the document) */
    points: () => {
      const y = root.getBoundingClientRect().top + window.scrollY - top;
      return offsets.map((off) => y + off);
    },
    phone: () => phone.matches,
    kill: () => {
      killed = true;
      ScrollTrigger.removeEventListener('refreshInit', size);
      scrub.scrollTrigger?.kill(); scrub.kill(); enter.kill();
      beats.forEach((b) => b.tl?.kill());
      root.classList.remove('ch-on', 'phone');
    },
  };
}
