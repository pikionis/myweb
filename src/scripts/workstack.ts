import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * "What I build" on the home page: the service sheets stack over a held screen, and inside each
 * sheet its projects stack the same way — a stack within a stack. Each scroll step brings in one
 * thing: the next project of the current service, or, when a service is done, the next service.
 * A sheet that sets its projects' own texts beside them shows the text of the
 * project on top, or of the one under the pointer. Project videos play only while their card is on screen.
 */

// the stack can hold on a screen at least this big; elsewhere (a phone, a short screen, reduced motion, no
// script) the sheets and their projects simply follow one another
const PINNED = '(min-width: 861px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)';
/** Breathing room kept under a held sheet's words, in px. */
const ROOM = 12;

export function workStack(root: HTMLElement) {
  watchVideos(root);
  gsap.registerPlugin(ScrollTrigger);
  const sheets = [...root.querySelectorAll<HTMLElement>('[data-sheet]')];
  const texts = sheets.map(projectTexts);

  /** Whether every sheet's words fit beside its projects while held (measured in the held layout). */
  const fits = () => {
    const held = root.classList.contains('on');
    root.classList.add('on');
    const ok = sheets.every((sheet) => {
      const copy = sheet.querySelector<HTMLElement>('.copy');
      return !copy || copy.offsetTop + copy.offsetHeight <= sheet.clientHeight - ROOM;
    });
    if (!held) root.classList.remove('on');
    return ok;
  };

  // the stack holds only where the words fit, so longer copy falls back to the flow instead of being cut;
  // a resize can change that either way
  let mm: gsap.MatchMedia | null = null;
  let holding = false;
  const setup = () => {
    mm?.revert();
    mm = gsap.matchMedia();
    mm.add(PINNED, () => (fits() ? hold() : undefined));
  };
  const recheck = () => {
    if (window.matchMedia(PINNED).matches && fits() !== holding) { setup(); ScrollTrigger.refresh(); }
  };
  let wait = 0;
  window.addEventListener('resize', () => {
    clearTimeout(wait);
    wait = window.setTimeout(recheck, 200);
  });

  const hold = () => {
    holding = true;
    root.classList.add('on');
    // when each card has slid halfway in, by sheet
    const arrivals: { sheet: number; card: number; at: number }[] = [];
    const follow = () => {
      const t = tl.time();
      texts.forEach((show, i) => {
        if (!show) return;
        let top = 0;
        for (const a of arrivals) if (a.sheet === i && t >= a.at) top = a.card;
        show(top);
      });
    };
    const tl = gsap.timeline({
      onUpdate: follow,
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
    });
    let at = 0;
    sheets.forEach((sheet, i) => {
      if (i > 0) {
        // the next service rises from below the screen into its place in the stack
        tl.fromTo(sheet, { y: () => window.innerHeight }, { y: 0, ease: 'none', duration: 1 }, at);
        at += 1;
      }
      [...sheet.querySelectorAll<HTMLElement>('[data-pcard]')].forEach((card, j) => {
        if (j === 0) return;
        // inside the sheet, the next project rises from below the sheet over the one before
        tl.fromTo(card, { y: () => sheet.clientHeight }, { y: 0, ease: 'none', duration: 1 }, at);
        arrivals.push({ sheet: i, card: j, at: at + 0.5 });
        at += 1;
      });
    });
    // a short hold, so the last project is read before the stack lets go
    tl.to({}, { duration: 0.5 });
    return () => {
      holding = false;
      root.classList.remove('on');
      texts.forEach((show) => show?.(0));
    };
  };
  setup();
}

/** A sheet's project texts: one shows at a time, the hovered or focused project's, else the one on top. */
function projectTexts(sheet: HTMLElement) {
  const items = [...sheet.querySelectorAll<HTMLElement>('[data-blurb]')];
  if (!items.length) return null;
  const cards = [...sheet.querySelectorAll<HTMLElement>('[data-pcard]')];
  let onTop = 0;
  let pointed = -1;
  const render = () => {
    const i = pointed >= 0 ? pointed : onTop;
    items.forEach((b, k) => b.classList.toggle('on', k === i));
  };
  cards.forEach((card, i) => {
    if (i >= items.length) return;
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { pointed = i; render(); } });
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && pointed === i) { pointed = -1; render(); } });
    card.addEventListener('focusin', () => { pointed = i; render(); });
    card.addEventListener('focusout', () => { if (pointed === i) { pointed = -1; render(); } });
  });
  return (i: number) => {
    if (i === onTop) return;
    onTop = i;
    render();
  };
}

/** Loads a project's video when its card first comes near, and plays it only while it is in view. */
function watchVideos(root: HTMLElement) {
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video[data-src]')];
  if (!videos.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => { /* autoplay can be refused; the poster stays */ });
      } else {
        v.pause();
      }
    }
  }, { threshold: 0.35 });
  videos.forEach((v) => io.observe(v));
}
