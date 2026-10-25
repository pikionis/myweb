import { gsap } from 'gsap';

/*
 * The service stories on the home page (src/components/Stories.astro). A sheet's "Read more" opens its
 * story as a "thought": three small rounds rise from the button and a rounded box grows out of the last
 * one, over the page, titled with the service. Close, Esc or a click beside the box shrinks it back into
 * the button; the page underneath never moves. Each story has an address (#story-web …) that opens it.
 *
 * Inside, the story plays by itself (see storyPlayer): scene by scene, each picture draws itself while its
 * words light up, holds long enough to be read, and gives way to the next; bars show where you are, and the
 * buttons, the bars, a tap on the scene, ← → and Space take over. When the last scene is done, the pictures
 * shrink and settle side by side, the whole story at once, with the call to start a project. With reduced
 * motion the story does not play: it opens on all its scenes, drawn, words and all.
 */

const R_FALLBACK = 32;

export function serviceStories(bubble: HTMLElement, ready: Promise<void>) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const backdrop = bubble.querySelector<HTMLElement>('[data-bubble-backdrop]')!;
  const dots = [...bubble.querySelectorAll<HTMLElement>('[data-bubble-dot]')];
  const panels = new Map([...bubble.querySelectorAll<HTMLElement>('[data-story]')].map((p) => [p.dataset.story!, p]));
  const readMores = [...document.querySelectorAll<HTMLButtonElement>('[data-read-more]')];
  const players = new Map<HTMLElement, Player>();
  const playerOf = (panel: HTMLElement) => {
    let p = players.get(panel);
    if (!p) players.set(panel, (p = storyPlayer(panel, reduce)));
    return p;
  };
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

  // the wheel or a finger must not scroll the page underneath; only the story's grid of scenes, once it is
  // there and taller than the box, scrolls
  const guard = (e: Event) => {
    const panel = active ? panels.get(active) : null;
    const body = panel?.classList.contains('all') ? panel.querySelector('[data-story-body]') : null;
    const scrolls = body && body.scrollHeight > body.clientHeight;
    if (active && !(scrolls && body.contains(e.target as Node))) e.preventDefault();
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
    const previous = active ? panels.get(active) : null;
    if (previous) playerOf(previous).stop();
    else opener = from ?? null;
    active = key;
    mark();
    if (!previous) holdPage(true);
    const player = playerOf(panel);
    player.ready();
    // focus goes into the story, so its keys work at once; the buttons come next
    panel.querySelector<HTMLElement>('[data-story-body]')?.focus({ preventScroll: true });
    if (reduce || previous) {
      if (!reduce) gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' });
      player.start();
      settle();
      return;
    }

    // the thought: rounds rise from the button, then the box grows out of the last one; the story starts once
    // the box is open
    const box = panel.getBoundingClientRect();
    const r = radius(panel);
    const tl = gsap.timeline({ onComplete: () => { gsap.set(dots, { autoAlpha: 0 }); player.start(); settle(); } });
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
      .from(panel.querySelectorAll('.story-top > *, .story-bars, .story-controls'),
        { opacity: 0, y: 14, duration: 0.45, stagger: 0.06, ease: 'power3.out', clearProps: 'opacity,transform' }, grow + 0.25);
  };

  const close = () => {
    if (!active || busy) return;
    busy = true;
    const panel = panels.get(active)!;
    playerOf(panel).stop();
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
    if (!active) return;
    if (e.key === 'Escape') close();
    else playerOf(panels.get(active)!).key(e);
  });
  document.addEventListener('visibilitychange', () => {
    if (active) playerOf(panels.get(active)!).hidden(document.hidden);
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
}

type Player = {
  /** puts the story at its first scene, not yet drawn, ready to play */
  ready(): void;
  /** plays from the first scene (with reduced motion: shows all the scenes at once) */
  start(): void;
  stop(): void;
  key(e: KeyboardEvent): void;
  /** the tab went out of sight, or came back */
  hidden(away: boolean): void;
};

// the pace of a scene: its picture draws in DRAW seconds; its words light up and then hold, by their count
const DRAW = 1.9;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One story in its box: plays scene by scene, then sets every picture side by side. */
function storyPlayer(panel: HTMLElement, reduce: boolean): Player {
  const body = panel.querySelector<HTMLElement>('[data-story-body]')!;
  const scenes = [...panel.querySelectorAll<HTMLElement>('[data-scene]')];
  const bars = [...panel.querySelectorAll<HTMLButtonElement>('[data-bar]')];
  const fills = bars.map((b) => b.querySelector<HTMLElement>('.bar-fill')!);
  const arts = scenes.map((s) => s.querySelector<SVGSVGElement>('svg.sa')!);
  const toggle = panel.querySelector<HTMLButtonElement>('[data-toggle]')!;
  const texts = panel.querySelectorAll<HTMLElement>('.scene-text');
  const calls = [...panel.querySelector('.story-cta')!.children];
  // with reduced motion the words are never lit one by one, so they stay whole
  const words = scenes.map((s) => (reduce ? [] : splitWords(s.querySelector<HTMLElement>('[data-words]'))));
  let at = 0;
  let tl: gsap.core.Timeline | null = null;
  let paused = false;
  let away = false;

  const strokes = (art: SVGSVGElement) => art.querySelectorAll<SVGElement>('.sa-d');
  const fades = (art: SVGSVGElement) => art.querySelectorAll<SVGElement>('.sa-f');
  const lifts = (art: SVGSVGElement) => art.querySelectorAll<SVGElement>('[data-lift]');
  const turns = (art: SVGSVGElement) => art.querySelectorAll<SVGElement>('[data-turn-from]');
  /** a picture as its scene ends: every stroke drawn, every part where it is drawn */
  const drawn = (art: SVGSVGElement) => {
    gsap.set(strokes(art), { strokeDashoffset: 0 });
    gsap.set(fades(art), { autoAlpha: 1 });
    lifts(art).forEach((el) => gsap.set(el, { y: -Number(el.dataset.lift) }));
    turns(art).forEach((el) => gsap.set(el, { rotation: 0, svgOrigin: el.dataset.origin }));
  };
  /** a picture before its scene: nothing drawn yet */
  const blank = (art: SVGSVGElement) => {
    gsap.set(strokes(art), { strokeDashoffset: 1.01 });
    gsap.set(fades(art), { autoAlpha: 0 });
    lifts(art).forEach((el) => gsap.set(el, { y: 0 }));
    turns(art).forEach((el) => gsap.set(el, { rotation: Number(el.dataset.turnFrom), svgOrigin: el.dataset.origin }));
  };
  const light = (k: number, share: number) => {
    const w = words[k];
    const lit = Math.ceil(share * w.length);
    w.forEach((x, i) => x.classList.toggle('lit', i < lit));
  };
  const setPaused = (on: boolean) => {
    paused = on;
    toggle.classList.toggle('paused', on);
    toggle.setAttribute('aria-label', (on ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? '');
    if (on || away) tl?.pause(); else tl?.resume();
  };

  /** Back from the pictures side by side to the playing stage. */
  const leaveAll = () => {
    if (!panel.classList.contains('all')) return;
    panel.classList.remove('all');
    gsap.set([...arts, ...texts, ...calls], { clearProps: 'transform,opacity' });
    body.scrollTop = 0;
  };

  /** Scene k plays: its picture draws itself, its words light up, it holds to be read, then the next one. */
  const play = (k: number) => {
    tl?.kill();
    leaveAll();
    at = k;
    scenes.forEach((s, n) => s.classList.toggle('current', n === k));
    arts.forEach((a) => a.classList.remove('idle', 'inview'));
    bars.forEach((b, n) => b.classList.toggle('done', n < k));
    fills.forEach((f, n) => gsap.set(f, { scaleX: n < k ? 1 : 0 }));
    const art = arts[k];
    blank(art);
    light(k, 0);

    const parts = [...art.querySelectorAll<SVGElement>('.sa-d, .sa-f')];
    const step = parts.length > 1 ? (DRAW - 0.6) / (parts.length - 1) : 0;
    const count = words[k].length;
    const reveal = clamp(count * 0.07, 1.1, 2.6);
    const hold = clamp(count * 0.17, 2.4, 6.5);
    const t = (tl = gsap.timeline({ onComplete: next }));
    t.fromTo(scenes[k], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0);
    parts.forEach((el, i) => {
      if (el.classList.contains('sa-f')) t.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.3 + i * step);
      else t.fromTo(el, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, 0.3 + i * step);
    });
    const done = 0.3 + DRAW;
    lifts(art).forEach((el) => t.fromTo(el, { y: 0 }, { y: -Number(el.dataset.lift), duration: 0.7, ease: 'power2.out' }, done - 0.2));
    turns(art).forEach((el) => t.fromTo(el, { rotation: Number(el.dataset.turnFrom), svgOrigin: el.dataset.origin },
      { rotation: 0, svgOrigin: el.dataset.origin, duration: 1.1, ease: 'power2.out' }, done - 0.4));
    // once drawn, the picture keeps a small motion of its own while the words are read
    t.call(() => art.classList.add('idle', 'inview'), [], done + 0.5);
    const share = { v: 0 };
    t.to(share, { v: 1, duration: reveal, ease: 'none', onUpdate: () => light(k, share.v) }, 0.5);
    const end = Math.max(done + 0.5, 0.5 + reveal) + hold;
    t.fromTo(fills[k], { scaleX: 0 }, { scaleX: 1, duration: end, ease: 'none' }, 0);
    if (paused || away) t.pause();
  };

  /** The story is told: every picture shrinks into its place, side by side, and the call comes up. */
  const together = (animate = true) => {
    tl?.kill();
    const f = drawing(arts[at]);
    arts.forEach((a) => { drawn(a); a.classList.remove('idle', 'inview'); });
    words.forEach((w) => w.forEach((x) => x.classList.add('lit')));
    gsap.set(scenes, { clearProps: 'opacity' });
    scenes.forEach((s) => s.classList.remove('current'));
    // the bars and the buttons go away: focus that was on them stays in the story
    if ((document.activeElement as HTMLElement | null)?.closest('.story-bars, .story-controls')) body.focus({ preventScroll: true });
    panel.classList.add('all');
    body.scrollTop = 0;
    if (!animate) return;
    const lasts = arts.map(drawing);
    // each picture leaves the stage where the last one stood and settles in its place; the one on stage
    // shrinks into its own, the others (drawn on top of each other there) only show once they part
    const t = (tl = gsap.timeline());
    arts.forEach((a, n) => {
      const l = lasts[n];
      t.fromTo(a, { x: f.left - l.left, y: f.top - l.top, scale: f.width / l.width, transformOrigin: `${l.ox}px ${l.oy}px` },
        { x: 0, y: 0, scale: 1, duration: 0.95, ease: 'expo.inOut', clearProps: 'transform' }, n * 0.06);
      if (n !== at) t.fromTo(a, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0.45 + n * 0.06);
    });
    t.from(texts, { opacity: 0, y: 10, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'opacity,transform' }, 0.7)
      .from(calls, { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.9);
  };

  const next = () => (at < scenes.length - 1 ? play(at + 1) : together());
  const previous = () => play(Math.max(0, at - 1));

  bars.forEach((b, n) => b.addEventListener('click', () => play(n)));
  panel.querySelector('[data-prev]')?.addEventListener('click', previous);
  panel.querySelector('[data-next]')?.addEventListener('click', next);
  toggle.addEventListener('click', () => setPaused(!paused));
  panel.querySelector('[data-again]')?.addEventListener('click', () => { setPaused(false); play(0); body.focus({ preventScroll: true }); });
  // a tap on the scene moves the story on, as a story does
  panel.querySelector('[data-stage]')?.addEventListener('click', (e) => {
    if (panel.classList.contains('all') || (e.target as HTMLElement).closest('a, button')) return;
    next();
  });

  return {
    ready() {
      tl?.kill();
      leaveAll();
      panel.classList.remove('with-text');
      setPaused(false);
      if (reduce) return;
      at = 0;
      scenes.forEach((s, n) => s.classList.toggle('current', n === 0));
      gsap.set(scenes[0], { opacity: 0 });
      bars.forEach((b) => b.classList.remove('done'));
      gsap.set(fills, { scaleX: 0 });
      blank(arts[0]);
      light(0, 0);
    },
    start() {
      if (reduce) {
        // reduced motion: no playing; the whole story at once, words and all
        panel.classList.add('with-text');
        together(false);
        return;
      }
      play(0);
    },
    stop() {
      tl?.kill();
      tl = null;
    },
    key(e) {
      if (panel.classList.contains('all') || e.ctrlKey || e.metaKey || e.altKey) return;
      const onButton = (e.target as HTMLElement).closest('button, a');
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
      else if (e.key === ' ' && !onButton) { e.preventDefault(); setPaused(!paused); }
    },
    hidden(gone) {
      away = gone;
      if (gone) tl?.pause(); else if (!paused) tl?.resume();
    },
  };
}

/** Where a picture is drawn on screen: its box, less the margins its viewBox leaves when the box has
 *  another shape (the picture keeps its proportions and sits in the middle). */
function drawing(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const s = Math.min(r.width / vb.width, r.height / vb.height);
  const ox = (r.width - vb.width * s) / 2, oy = (r.height - vb.height * s) / 2;
  return { left: r.left + ox, top: r.top + oy, width: vb.width * s, ox, oy };
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
