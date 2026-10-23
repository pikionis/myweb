/**
 * Flip stack: full-width cards in a pile; as you scroll, each one folds up and away to reveal the
 * next, which settles forward into place.
 *
 * Ported from Componentry "Case Study Flip Stack" by Harsh Jadhav (MIT) — https://componentry.fun.
 * The timings and offsets are theirs; framer-motion's scroll springs are swapped for a scrubbed GSAP
 * ScrollTrigger timeline, and the markup lives in pages/services.astro.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function flipStack(root: HTMLElement) {
  // reduced motion: the cards simply follow one another down the page (see the page's styles)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const n = cards.length;
  if (!n) return;
  // a folded card keeps a sliver above the next, so the pile reads as a stack
  const stackedGap = Math.min(24, 72 / Math.max(n - 1, 1));

  // one screen of scroll per fold (the page sets the height); the scrub lag stands in for the original's spring
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
  cards.forEach((card, i) => {
    const inner = card.querySelector<HTMLElement>('[data-inner]');
    if (i > 0 && inner) {
      // waiting cards sit a little lower and smaller, and come forward while the one above leaves
      gsap.set(inner, { y: Math.min(i * 12, 34), scale: 1 - Math.min(i * 0.012, 0.035), transformOrigin: '50% 100%' });
      tl.to(inner, { y: 0, scale: 1, ease: 'none', duration: 0.7 }, i - 1);
    }
    // the last card stays and leaves with the page, so no empty screen follows the pile
    if (i < n - 1) tl.to(card, { yPercent: -118, y: i * stackedGap, rotateX: 22, ease: 'none', duration: 1 }, i);
  });
}
