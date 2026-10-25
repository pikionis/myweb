import { gsap } from 'gsap';
import { artPlayer, type ArtPlayer } from './serviceart';

/*
 * The /services cards open (src/components/ServiceSheets.astro). A card's button, or a click anywhere on the
 * card but a link, opens its sheet: the card grows out of its own outline over the page, its drawing plays as a
 * short story (serviceart.ts), and everything the service includes is there to read. Close, Esc or a click
 * beside it folds it back into the card; the page underneath never moves. Each sheet has an address
 * (#service-bots …) that opens it. With reduced motion it simply appears, its drawing at rest.
 */
export function serviceSheets(root: HTMLElement, ready: Promise<void>) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const backdrop = root.querySelector<HTMLElement>('[data-sheets-backdrop]')!;
  const sheets = new Map([...root.querySelectorAll<HTMLElement>('[data-sheet]')].map((el) => [el.dataset.sheet!, el]));
  const opens = [...document.querySelectorAll<HTMLButtonElement>('[data-open]')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-card]')];
  const players = new Map<HTMLElement, ArtPlayer>();
  const playerOf = (sheet: HTMLElement) => {
    let p = players.get(sheet);
    if (!p) players.set(sheet, (p = artPlayer(sheet.querySelector<SVGSVGElement>('svg.sv')!)));
    return p;
  };
  const bodyOf = (sheet: HTMLElement) => sheet.querySelector<HTMLElement>('[data-sheet-body]')!;
  let active: string | null = null;

  // one change at a time; a sheet asked for meanwhile opens as soon as it is done
  let busy = false;
  let queued: string | null = null;
  const settle = () => {
    busy = false;
    const next = queued;
    queued = null;
    if (next && next !== active) open(next);
  };

  /** While a sheet is open the page steps aside: no focus, no clicks, and it does not scroll. */
  let inerted: Element[] = [];
  const holdPage = (on: boolean) => {
    if (on) {
      inerted = [...document.body.children].filter((el) => el !== root && !(el instanceof HTMLScriptElement));
      inerted.forEach((el) => el.setAttribute('inert', ''));
    } else {
      inerted.forEach((el) => el.removeAttribute('inert'));
      inerted = [];
    }
  };

  const mark = () => {
    sheets.forEach((s, key) => s.classList.toggle('open', key === active));
    root.classList.toggle('open', !!active);
    opens.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.open === active)));
    const sheet = active ? sheets.get(active) : null;
    history.replaceState(history.state, '', sheet ? `#${sheet.id}` : window.location.pathname + window.location.search);
  };

  // the wheel or a finger must not scroll the page underneath; only the sheet's own body scrolls
  const guard = (e: Event) => {
    const body = active ? bodyOf(sheets.get(active)!) : null;
    const scrolls = body && body.scrollHeight > body.clientHeight;
    if (active && !(scrolls && body.contains(e.target as Node))) e.preventDefault();
  };
  root.addEventListener('wheel', guard, { passive: false });
  root.addEventListener('touchmove', guard, { passive: false });

  const radius = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24;
  /** The card's outline, as a clip on the sheet (none if the card is not on screen). */
  const cardClip = (sheet: HTMLElement, key: string) => {
    const inner = cards.find((c) => c.dataset.card === key)?.querySelector('[data-inner]');
    const r = inner?.getBoundingClientRect();
    if (!inner || !r || !r.width || r.bottom < 0 || r.top > window.innerHeight) return null;
    const box = sheet.getBoundingClientRect();
    return `inset(${r.top - box.top}px ${box.right - r.right}px ${box.bottom - r.bottom}px ${r.left - box.left}px round ${radius(inner)}px)`;
  };
  const whole = (sheet: HTMLElement) => `inset(0px 0px 0px 0px round ${radius(sheet)}px)`;
  const contents = (sheet: HTMLElement) => sheet.querySelectorAll<HTMLElement>('.sheet-top > *, .sheet-art, .sheet-text > *');

  const open = (key: string) => {
    const sheet = sheets.get(key);
    if (!sheet || key === active) return;
    if (busy) { queued = key; return; }
    busy = true;
    const previous = active ? sheets.get(active) : null;
    if (previous) playerOf(previous).stop();
    active = key;
    mark();
    if (!previous) holdPage(true);
    const art = playerOf(sheet);
    const body = bodyOf(sheet);
    body.scrollTop = 0;
    // focus goes into the sheet, so Esc and the keys work at once
    body.focus({ preventScroll: true });
    if (reduce) { settle(); return; }
    art.ready();
    if (previous) {
      gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' });
      art.play();
      settle();
      return;
    }
    // the card grows out of its own outline; then its drawing tells its story
    const clip = cardClip(sheet, key);
    const tl = gsap.timeline({ onComplete: () => { art.play(); settle(); } });
    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0);
    if (clip) tl.fromTo(sheet, { clipPath: clip }, { clipPath: whole(sheet), duration: 0.75, ease: 'expo.out', clearProps: 'clipPath' }, 0);
    else tl.fromTo(sheet, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', clearProps: 'opacity,transform' }, 0);
    tl.from(contents(sheet), { opacity: 0, y: 14, duration: 0.45, stagger: 0.04, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.2);
  };

  const close = () => {
    if (!active || busy) return;
    busy = true;
    const key = active;
    const sheet = sheets.get(key)!;
    playerOf(sheet).stop();
    const back = opens.find((b) => b.dataset.open === key);
    const finish = () => {
      gsap.set(sheet, { clearProps: 'clipPath,opacity,transform' });
      gsap.set(contents(sheet), { clearProps: 'opacity' });
      gsap.set(backdrop, { clearProps: 'opacity' });
      active = null;
      mark();
      holdPage(false);
      // the page has not moved: focus goes back to the card's button
      back?.focus({ preventScroll: true });
      settle();
    };
    if (reduce) { finish(); return; }
    // the sheet folds back into its card
    const clip = cardClip(sheet, key);
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(contents(sheet), { opacity: 0, duration: 0.16, ease: 'power1.in' }, 0);
    if (clip) tl.fromTo(sheet, { clipPath: whole(sheet) }, { clipPath: clip, duration: 0.5, ease: 'power3.inOut' }, 0.06);
    else tl.to(sheet, { opacity: 0, y: 24, duration: 0.3, ease: 'power2.in' }, 0);
    tl.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.2);
  };

  opens.forEach((b) => b.addEventListener('click', () => open(b.dataset.open!)));
  // a click anywhere on a card opens it too, but a link keeps its own job
  cards.forEach((c) => c.querySelector('[data-inner]')?.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('a, button')) open(c.dataset.card!);
  }));
  root.querySelectorAll('[data-sheet-close]').forEach((b) => b.addEventListener('click', close));
  root.querySelectorAll<HTMLElement>('[data-replay]').forEach((b) =>
    b.addEventListener('click', () => playerOf(b.closest<HTMLElement>('[data-sheet]')!).play()));
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (active && e.key === 'Escape') close(); });

  // an address names a sheet: open it (on arrival once the intro has handed over, or when a link changes it)
  const fromHash = () => [...sheets].find(([, s]) => `#${s.id}` === window.location.hash)?.[0];
  window.addEventListener('hashchange', () => {
    const key = fromHash();
    if (key) open(key);
    else if (active) close();
  });
  ready.then(() => {
    const key = fromHash();
    if (key) open(key);
  });
}
