import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * "What I build" on the home page: the service sheets stack over a held screen, and inside each
 * sheet its projects stack the same way — a stack within a stack. Each scroll step brings in one
 * thing: the next project of the current service, or, when a service is done, the next service.
 * Project videos play only while their card is on screen.
 */
export function workStack(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  watchVideos(root);
  // reduced motion (or no script) keeps the plain flow: sheets and projects one after another
  if (reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('on');

  const sheets = [...root.querySelectorAll<HTMLElement>('[data-sheet]')];
  const tl = gsap.timeline({
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
      at += 1;
    });
  });
  // a short hold, so the last project is read before the stack lets go
  tl.to({}, { duration: 0.5 });
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
