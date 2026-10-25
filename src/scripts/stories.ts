import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * The service stories on the home page (src/components/Stories.astro). A sheet's "Read more" opens its
 * story as a "thought": three small rounds rise from the button and a rounded box grows out of the last
 * one, over the page, titled with the service. The story plays out as it scrolls inside the box; Close,
 * Esc or a click beside the box shrinks it back into the button. The page underneath never moves. Each
 * story has an address (#story-web …) that opens it directly.
 *
 * A story's scenes come to life the first time it opens: each picture draws itself on as its scene
 * scrolls by inside the box and its words light up, then the picture keeps a small idle motion while it
 * is in view. With reduced motion the box simply appears, the pictures are already drawn and the words
 * simply there.
 */

const R_FALLBACK = 32;

export function serviceStories(bubble: HTMLElement, ready: Promise<void>) {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const backdrop = bubble.querySelector<HTMLElement>('[data-bubble-backdrop]')!;
  const dots = [...bubble.querySelectorAll<HTMLElement>('[data-bubble-dot]')];
  const panels = new Map([...bubble.querySelectorAll<HTMLElement>('[data-story]')].map((p) => [p.dataset.story!, p]));
  const readMores = [...document.querySelectorAll<HTMLButtonElement>('[data-read-more]')];
  let active: string | null = null;
  let opener: HTMLElement | null = null;

  // one change at a time; a story asked for meanwhile (a link, a quick click) opens as soon as it is done
  let busy = false;
  let queued: string | null = null;
  const settle = () => {
    busy = false;
    const next = queued;
    queued = null;
    if (next && next !== active) open(next);
  };

  /** While a story is open the page steps aside: no focus, no clicks, and it does not scroll (the page's
   *  own overflow is left alone, so its layout never shifts underneath). */
  let inerted: Element[] = [];
  const holdPage = (on: boolean) => {
    if (on) {
      inerted = [...document.body.children].filter((el) => el !== bubble && !(el instanceof HTMLScriptElement));
      inerted.forEach((el) => el.setAttribute('inert', ''));
    } else {
      inerted.forEach((el) => el.removeAttribute('inert'));
      inerted = [];
    }
  };

  /** Puts the state on the page: which story is open, what each button says, the address. */
  const mark = () => {
    panels.forEach((p, key) => p.classList.toggle('open', key === active));
    bubble.classList.toggle('open', !!active);
    readMores.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.readMore === active)));
    const panel = active ? panels.get(active) : null;
    history.replaceState(history.state, '', panel ? `#${panel.id}` : window.location.pathname + window.location.search);
  };

  // the wheel or a finger anywhere but on the story itself must not scroll the page underneath (the story's
  // own scroller keeps its scrolling to itself: overscroll-behavior: contain)
  const guard = (e: Event) => {
    const scroller = active ? panels.get(active)?.querySelector('[data-story-scroll]') : null;
    if (active && !(scroller && scroller.contains(e.target as Node))) e.preventDefault();
  };
  bubble.addEventListener('wheel', guard, { passive: false });
  bubble.addEventListener('touchmove', guard, { passive: false });

  const radius = (panel: HTMLElement) => parseFloat(getComputedStyle(panel).borderTopLeftRadius) || R_FALLBACK;
  const centre = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  const open = (key: string, from?: HTMLElement) => {
    const panel = panels.get(key);
    if (!panel || key === active) return;
    if (busy) { queued = key; return; }
    busy = true;
    const switching = !!active;
    if (!switching) opener = from ?? null;
    active = key;
    mark();
    if (!switching) holdPage(true);
    const scroller = panel.querySelector<HTMLElement>('[data-story-scroll]')!;
    scroller.scrollTop = 0;
    scenes(panel);
    ScrollTrigger.refresh();
    // focus goes into the story, so the keys scroll it; Close is the next stop
    scroller.focus({ preventScroll: true });
    if (reduce || switching) {
      if (!reduce) gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' });
      settle();
      return;
    }

    // the thought: rounds rise from the button, then the box grows out of the last one
    const box = panel.getBoundingClientRect();
    const r = radius(panel);
    const tl = gsap.timeline({ onComplete: () => { gsap.set(dots, { autoAlpha: 0 }); settle(); } });
    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0);
    let origin = '50% 50%';
    let grow = 0;
    if (opener) {
      const s = centre(opener), t = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const trail = [0.06, 0.15, 0.26].map((f, i) => ({ x: s.x + (t.x - s.x) * f, y: s.y + (t.y - s.y) * f, scale: [0.55, 0.9, 1.35][i] }));
      dots.forEach((d, i) => tl.fromTo(d, { x: trail[i].x, y: trail[i].y, scale: 0, autoAlpha: 1 },
        { scale: trail[i].scale, duration: 0.24, ease: 'power3.out' }, i * 0.08));
      const last = trail[trail.length - 1];
      origin = `${last.x - box.left}px ${last.y - box.top}px`;
      grow = 0.26;
    }
    tl.fromTo(panel,
      { scale: 0.05, opacity: 0.5, borderRadius: Math.min(box.width, box.height) / 2, transformOrigin: origin },
      { scale: 1, opacity: 1, borderRadius: r, duration: 0.7, ease: 'expo.out', clearProps: 'transform,opacity,borderRadius,transformOrigin' }, grow)
      .to(dots, { autoAlpha: 0, scale: 0.4, duration: 0.25, stagger: 0.05, ease: 'power1.in' }, grow + 0.2)
      .from(panel.querySelectorAll('.story-top > *, .scene:first-child > *'),
        { opacity: 0, y: 18, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'opacity,transform' }, grow + 0.25);
  };

  const close = () => {
    if (!active || busy) return;
    busy = true;
    const panel = panels.get(active)!;
    const back = opener ?? readMores.find((b) => b.dataset.readMore === active) ?? null;
    const finish = () => {
      gsap.set([panel, backdrop], { clearProps: 'all' });
      active = null;
      mark();
      holdPage(false);
      // the page has not moved: focus goes back to the button that opened the story
      back?.focus({ preventScroll: true });
      opener = null;
      settle();
    };
    if (reduce) { finish(); return; }
    // the thought folds back into its button
    const box = panel.getBoundingClientRect();
    const to = back && back.getClientRects().length ? centre(back) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    gsap.timeline({ onComplete: finish })
      .to(panel, {
        scale: 0.05, opacity: 0, borderRadius: Math.min(box.width, box.height) / 2,
        transformOrigin: `${to.x - box.left}px ${to.y - box.top}px`, duration: 0.45, ease: 'power3.in',
      }, 0)
      .to(backdrop, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.12);
  };

  readMores.forEach((b) => b.addEventListener('click', () => open(b.dataset.readMore!, b)));
  bubble.querySelectorAll('[data-story-close]').forEach((b) => b.addEventListener('click', close));
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && active) close();
  });

  // an address names a story: open it (on arrival once the intro has handed over, or when a link changes it)
  const fromHash = () => [...panels].find(([, p]) => `#${p.id}` === window.location.hash)?.[0];
  window.addEventListener('hashchange', () => {
    const key = fromHash();
    if (key) open(key);
    else if (active) close();
  });
  ready.then(() => {
    const key = fromHash();
    if (key) open(key);
  });

  const alive = new WeakSet<HTMLElement>();
  /** A story's scenes come to life the first time it opens (nothing runs for stories never read). */
  const scenes = (panel: HTMLElement) => {
    if (alive.has(panel) || reduce) return;
    alive.add(panel);
    const scroller = panel.querySelector<HTMLElement>('[data-story-scroll]')!;
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('inview', e.isIntersecting)), { root: scroller });
    const wide = () => window.innerWidth >= 900;
    panel.querySelectorAll<HTMLElement>('[data-scene]').forEach((scene) => {
      const range = {
        trigger: scene,
        scroller,
        start: () => (wide() ? 'top 62%' : 'top 85%'),
        end: () => (wide() ? 'center 52%' : 'top 25%'),
        invalidateOnRefresh: true,
      };
      const art = scene.querySelector<SVGSVGElement>('svg.sa');
      if (art) {
        seen.observe(art);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { ...range, scrub: 0.5 },
          onUpdate() { art.classList.toggle('idle', this.progress() > 0.995); },
        });
        // every stroke draws in reading order, overlapping a little; dots fade in where they come
        art.querySelectorAll<SVGElement>('.sa-d, .sa-f').forEach((el, i) => {
          if (el.classList.contains('sa-f')) tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, i * 0.35);
          else tl.fromTo(el, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 1 }, i * 0.35);
        });
        // the moves that end a scene, into the place each part is drawn at: the chosen design lifts by
        // `data-lift`, the needle swings in from `data-turn-from` degrees
        art.querySelectorAll<SVGElement>('[data-lift]').forEach((el) =>
          tl.fromTo(el, { y: 0 }, { y: -Number(el.dataset.lift), duration: 0.8, ease: 'power2.out' }));
        art.querySelectorAll<SVGElement>('[data-turn-from]').forEach((el) =>
          tl.fromTo(el, { rotation: Number(el.dataset.turnFrom), svgOrigin: el.dataset.origin }, { rotation: 0, svgOrigin: el.dataset.origin, duration: 1.4, ease: 'power2.out' }));
      }
      const words = splitWords(scene.querySelector<HTMLElement>('[data-words]'));
      if (words.length) {
        ScrollTrigger.create({
          ...range,
          onUpdate: (self) => {
            const lit = Math.round(self.progress * words.length * 1.15);
            words.forEach((w, i) => w.classList.toggle('lit', i < lit));
          },
        });
      }
    });
  };
}

/** Splits a paragraph into word spans (its text stays the same, read as one), for lighting up in turn. */
function splitWords(el: HTMLElement | null): HTMLSpanElement[] {
  if (!el) return [];
  const words = (el.textContent || '').trim().split(/\s+/);
  el.textContent = '';
  return words.map((w, i) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = w;
    el.append(s);
    if (i < words.length - 1) el.append(' ');
    return s;
  });
}
