import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { StackApi } from './workstack';

/*
 * The service stories on the home page (src/components/Stories.astro). A sheet's "Read more" folds the
 * stack of service sheets into a bar at the top of the section, with that service lit, and its story
 * unfolds below; the bar switches stories with a crossfade, and Close (or Esc) brings the sheets back at
 * the same service. Each story has an address (#story-web …) that opens it directly.
 *
 * A story's scenes come to life the first time it opens: each picture draws itself on as its scene
 * scrolls by and its words light up, then the picture keeps a small idle motion while it is on screen.
 * With reduced motion the pictures are already drawn and the words simply there.
 */

const BAR_FADE = 0.2;
// (transitions here move opacity only, never visibility: a hidden element would drop the keyboard focus)

export function serviceStories(section: HTMLElement, stack: StackApi | null, ready: Promise<void>) {
  const wrap = section.querySelector<HTMLElement>('[data-stories]');
  const bar = wrap?.querySelector<HTMLElement>('[data-story-bar]');
  if (!wrap || !bar) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stackEl = section.querySelector<HTMLElement>('[data-stack]');
  const sheets = [...section.querySelectorAll<HTMLElement>('[data-sheet]')];
  const panels = new Map([...wrap.querySelectorAll<HTMLElement>('[data-story]')].map((p) => [p.dataset.story!, p]));
  const readMores = [...section.querySelectorAll<HTMLButtonElement>('[data-read-more]')];
  const tabs = [...bar.querySelectorAll<HTMLButtonElement>('[data-story-tab]')];
  const closeBtn = bar.querySelector<HTMLButtonElement>('[data-story-close]');
  let active: string | null = null;
  // one change at a time; a story asked for meanwhile (a link, a quick click) opens as soon as it is done
  let busy = false;
  let queued: string | null = null;
  const settle = () => {
    busy = false;
    const next = queued;
    queued = null;
    if (next && next !== active) open(next);
  };

  const header = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
  const pageTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  // `instant` overrides the page's smooth scrolling where the layout itself has just changed
  const jump = (y: number) => window.scrollTo({ top: Math.max(0, y), behavior: 'instant' as ScrollBehavior });
  const glide = (y: number) => window.scrollTo({ top: Math.max(0, y), behavior: reduce ? ('instant' as ScrollBehavior) : 'smooth' });
  /** where a story begins: its title just under the bar */
  const storyStart = (panel: HTMLElement) => pageTop(panel) - header() - bar.offsetHeight;

  /** Puts the section's state on the page: which story is open, what each button says it controls. */
  const mark = () => {
    section.classList.toggle('story-open', !!active);
    panels.forEach((p, key) => p.classList.toggle('open', key === active));
    readMores.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.readMore === active)));
    tabs.forEach((t) => {
      const on = t.dataset.storyTab === active;
      t.classList.toggle('on', on);
      t.setAttribute('aria-expanded', String(on));
      // on a phone the bar scrolls sideways: the lit tab comes into view
      const row = t.parentElement;
      if (on && row && row.scrollWidth > row.clientWidth) row.scrollLeft = t.offsetLeft - (row.clientWidth - t.offsetWidth) / 2;
    });
    const panel = active ? panels.get(active) : null;
    history.replaceState(history.state, '', panel ? `#${panel.id}` : window.location.pathname + window.location.search);
    // the page below has moved: every scroll position is measured again
    ScrollTrigger.refresh();
  };

  const focusTitle = (panel: HTMLElement) => panel.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });

  const open = (key: string, from?: HTMLElement) => {
    const panel = panels.get(key);
    if (!panel) return;
    if (busy) { queued = key; return; }
    if (key === active) { glide(storyStart(panel)); return; }
    busy = true;

    // the bar is already up: one story crossfades into the next
    if (active) {
      const prev = panels.get(active)!;
      const swap = () => {
        gsap.set(prev, { clearProps: 'opacity' });
        active = key;
        mark();
        scenes(panel);
        jump(storyStart(panel));
        if (!reduce) gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' });
        focusTitle(panel);
        settle();
      };
      if (reduce) swap(); else gsap.to(prev, { opacity: 0, duration: BAR_FADE, ease: 'power1.in', onComplete: swap });
      return;
    }

    // the sheets fold into the bar: the sheet's title shrinks into its tab, the rest of the bar follows
    const title = from?.closest('[data-sheet]')?.querySelector('h3')?.getBoundingClientRect();
    const unfold = () => {
      if (stackEl) gsap.set(stackEl, { clearProps: 'opacity' });
      active = key;
      mark();
      scenes(panel);
      jump(pageTop(section) - header());
      focusTitle(panel);
      if (reduce) { jump(storyStart(panel)); settle(); return; }
      const tab = tabs.find((t) => t.dataset.storyTab === key);
      const tl = gsap.timeline({ onComplete: () => { glide(storyStart(panel)); settle(); } });
      if (tab && title) {
        const to = tab.getBoundingClientRect();
        tl.from(tab, {
          x: title.left - to.left, y: title.top - to.top, scaleX: title.width / to.width, scaleY: title.height / to.height,
          transformOrigin: '0 0', duration: 0.55, ease: 'expo.out', clearProps: 'transform',
        }, 0);
      }
      tl.from(tabs.filter((t) => t !== tab), { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }, 0.1)
        .from(closeBtn, { autoAlpha: 0, duration: 0.3, clearProps: 'all' }, 0.2)
        .from(panel.querySelector('.story-head'), { opacity: 0, y: 24, duration: 0.5, ease: 'power3.out', clearProps: 'all' }, 0.15);
    };
    if (reduce || !stackEl) unfold();
    else gsap.to(stackEl, { opacity: 0, scale: 0.98, transformOrigin: '50% 0', duration: BAR_FADE, ease: 'power1.in', onComplete: () => { gsap.set(stackEl, { clearProps: 'opacity,scale,transform,transformOrigin' }); unfold(); } });
  };

  const close = () => {
    if (!active || busy) return;
    busy = true;
    const key = active;
    const finish = () => {
      gsap.set(wrap, { clearProps: 'opacity' });
      active = null;
      mark();
      stack?.recheck();
      // back where the reader was: the sheet of the story they closed
      const i = sheets.findIndex((s) => s.querySelector(`[data-read-more="${key}"]`));
      jump(stack && i >= 0 ? stack.sheetTop(i) : pageTop(section) - header());
      readMores.find((b) => b.dataset.readMore === key)?.focus({ preventScroll: true });
      if (!reduce && stackEl) gsap.from(stackEl, { opacity: 0, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' });
      settle();
    };
    if (reduce) finish(); else gsap.to(wrap, { opacity: 0, duration: BAR_FADE, ease: 'power1.in', onComplete: finish });
  };

  readMores.forEach((b) => b.addEventListener('click', () => open(b.dataset.readMore!, b)));
  tabs.forEach((t) => t.addEventListener('click', () => open(t.dataset.storyTab!)));
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !active) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    close();
  });

  // an address names a story: open it (on arrival once the intro has handed over, or when a link changes it)
  const fromHash = () => [...panels].find(([, p]) => `#${p.id}` === window.location.hash)?.[0];
  window.addEventListener('hashchange', () => { const key = fromHash(); if (key) open(key); });
  ready.then(() => {
    const key = fromHash();
    if (key) openDirect(key);
  });
  /** Opens straight onto the story, without the fold: the reader came for it. */
  const openDirect = (key: string) => {
    const panel = panels.get(key)!;
    active = key;
    mark();
    scenes(panel);
    jump(storyStart(panel));
    focusTitle(panel);
  };

  const alive = new WeakSet<HTMLElement>();
  /** A story's scenes come to life the first time it opens (nothing runs for stories never read). */
  const scenes = (panel: HTMLElement) => {
    if (alive.has(panel) || reduce) return;
    alive.add(panel);
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('inview', e.isIntersecting)));
    const wide = () => window.innerWidth >= 900;
    panel.querySelectorAll<HTMLElement>('[data-scene]').forEach((scene) => {
      const range = {
        trigger: scene,
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
    ScrollTrigger.refresh();
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
