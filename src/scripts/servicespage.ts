import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { artTimeline, artIdle } from './serviceart';
import { faqChat } from './faqchat';
import { startForm } from './startform';

/*
 * /services (src/pages/services.astro): the FAQ chat and the closing form always; with motion, the drawings.
 * The hero's bulb draws itself once the page is handed over by the intro; the picker's icons draw in turn as the
 * list arrives (and again under the pointer); each service's drawing follows the scroll, beside its words on a
 * wide screen and as it crosses the screen on a phone; the chips pop in; "How we work" draws its line and each
 * step's picture in turn; the timelines fill to their weeks; the envelope opens as the form arrives. Everything
 * below the first screen is set up only as it comes near, so the page starts light.
 */

/** Resolves when the opening intro gives the page back (at once when there is none). */
const handedOver = () => new Promise<void>((resolve) => {
  const html = document.documentElement;
  if (!html.classList.contains('ohl-lock')) return resolve();
  const mo = new MutationObserver(() => {
    if (html.classList.contains('ohl-lock')) return;
    mo.disconnect();
    resolve();
  });
  mo.observe(html, { attributes: true, attributeFilter: ['class'] });
});

/** Runs `build` once, when the element comes within about a screen of view; returns a way to call it off. */
function soon(el: Element, build: () => void) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    build();
  }, { rootMargin: '110% 0px 110% 0px' });
  io.observe(el);
  return () => io.disconnect();
}

/** Runs a drawing's idle motion only while it is drawn and on screen. */
function idleWhenSeen(svg: SVGSVGElement, drawn: () => boolean) {
  const idle = artIdle(svg);
  if (!idle) return () => {};
  let seen = false;
  const sync = () => (seen && drawn() ? idle.play() : idle.pause());
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(svg);
  return sync;
}

export function servicesPage(root: HTMLElement) {
  const faq = root.querySelector<HTMLElement>('[data-faq]');
  if (faq) faqChat(faq);
  const start = root.querySelector<HTMLElement>('[data-start]');
  if (start) startForm(start);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  // the hero: the bulb lights and unrolls into the four services
  const hero = root.querySelector<SVGSVGElement>('[data-hero-art] svg');
  if (hero) {
    const tl = artTimeline(hero);
    root.querySelector('[data-hero-art]')?.classList.add('ready');
    const sync = idleWhenSeen(hero, () => tl.progress() === 1);
    tl.eventCallback('onComplete', sync);
    handedOver().then(() => tl.play());
  }

  // the picker: each icon draws in turn as the list arrives, and again under the pointer
  const picks = [...root.querySelectorAll<HTMLElement>('[data-pick]')];
  const list = root.querySelector('[data-picks]');
  if (list) {
    let icons: (gsap.core.Timeline | null)[] = [];
    soon(list, () => {
      icons = picks.map((p) => {
        const svg = p.querySelector<SVGSVGElement>('svg[data-art]');
        return svg ? artTimeline(svg) : null;
      });
    });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      icons.forEach((tl, i) => tl && gsap.delayedCall(i * 0.16, () => tl.play()));
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(list);
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      picks.forEach((p, i) => {
        const again = () => { if (icons[i]?.progress() === 1) icons[i]?.restart(); };
        p.addEventListener('pointerenter', again);
        p.addEventListener('focus', again);
      });
    }
  }

  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (ctx) => {
    const wide = !!ctx.conditions?.wide;
    const stops: (() => void)[] = [];
    const near = (el: Element, build: () => void) => stops.push(soon(el, () => ctx.add(build)));

    // each service's drawing follows the scroll: beside the words, it is told while the section arrives and
    // settles; on a phone, while the drawing itself crosses the screen
    root.querySelectorAll<HTMLElement>('[data-svc]').forEach((section) => {
      const box = section.querySelector<HTMLElement>('[data-draw]');
      const svg = box?.querySelector<SVGSVGElement>('svg');
      if (!box || !svg) return;
      near(section, () => {
        const tl = artTimeline(svg);
        const sync = idleWhenSeen(svg, () => tl.progress() > 0.999);
        ScrollTrigger.create({
          trigger: wide ? section : box,
          start: wide ? 'top 75%' : 'top 88%',
          end: wide ? 'top -20%' : 'bottom 42%',
          animation: tl, scrub: 0.6, onUpdate: sync, onRefresh: sync,
        });
      });
    });

    // the envelope opens as the form arrives
    const env = root.querySelector<HTMLElement>('[data-start] [data-draw]');
    const envSvg = env?.querySelector<SVGSVGElement>('svg');
    if (env && envSvg) {
      near(env, () => ScrollTrigger.create({ trigger: env, start: 'top 85%', end: wide ? 'bottom 60%' : 'bottom 50%', animation: artTimeline(envSvg), scrub: 0.6 }));
    }

    // How we work: the line runs through the steps and each one's picture draws as the line reaches it
    const how = root.querySelector<HTMLElement>('[data-how]');
    if (how) near(how, () => {
      const steps = [...how.querySelectorAll<HTMLElement>('[data-step]')];
      const rail = how.querySelector<HTMLElement>('[data-rail]');
      const tl = gsap.timeline({ scrollTrigger: { trigger: how, start: wide ? 'top 90%' : 'top 78%', end: wide ? 'bottom 80%' : 'bottom 70%', scrub: 0.6 } });
      if (rail) tl.fromTo(rail, { '--p': 0 }, { '--p': 1, duration: steps.length, ease: 'none' }, 0);
      steps.forEach((step, i) => {
        const node = step.querySelector('[data-node]');
        if (node) tl.fromTo(node, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'expo.out' }, i);
        const art = step.querySelector<SVGSVGElement>('svg.sa');
        if (art) tl.add(artTimeline(art).paused(false), i + 0.05);
        const words = step.querySelectorAll('[data-say]');
        tl.fromTo(words, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, i + 0.2);
      });
    });

    // the timelines fill to their weeks
    root.querySelectorAll<HTMLElement>('[data-range]').forEach((bar) => near(bar, () => {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none none' },
      });
    }));

    return () => stops.forEach((stop) => stop());
  });

  // the chips pop in, once
  root.querySelectorAll<HTMLElement>('[data-chips]').forEach((ul) => soon(ul, () => {
    const lis = ul.querySelectorAll('li');
    gsap.set(lis, { opacity: 0, scale: 0.86, y: 8 });
    ScrollTrigger.create({
      trigger: ul, start: 'top 88%', once: true,
      onEnter: () => gsap.to(lis, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.035 }),
    });
  }));
}
