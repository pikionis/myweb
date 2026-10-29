import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type Tl, part, parts, strokes, draw, drawIn, show, pop, write, loop } from './storydraw';
import { chapter, ready, type Beat as ChapterBeat } from './chapter';

/*
 * The DeinDeal chapter of "My story" (DeinDealChapter.astro; the drawing is src/components/deindeal.ts): "Swiss
 * precision", run as a chapter (src/scripts/chapter.ts: the sticky screen, a stop at each beat). Zurich, where the
 * flight from KOAN lands; the other side of the counter; the integrations; the flood of 800,000+ products; the
 * movement whose gears filter, fix, translate and validate (turning faster the further the page goes, driven by
 * the AI at the centre); clean cards on the marketplace's shelves; the Translate gear leaving to become Feedgenix;
 * Feedgenix rolling onto the line of client work. On a phone the drawing comes in close on each beat.
 * With reduced motion every picture is shown as it ends and the gears stand still.
 */

/** the scroll from one beat to the next, in heights of what is free on screen: the movement holds longer */
const STEPS = [0.75, 0.75, 0.8, 0.85, 1.3, 0.8, 0.85];
const clamp01 = gsap.utils.clamp(0, 1);
/** on a phone, where the drawing comes in close for each beat: the point for the middle (480, 270), and how close */
const FOCUS: Record<number, [number, number, number]> = { 1: [470, 310, 1.2], 2: [380, 290, 1.25], 3: [700, 300, 1.3], 4: [480, 252, 1.45], 5: [600, 262, 1.3], 6: [762, 300, 1.35] };
/** the Translate gear: at home in the movement, as Feedgenix's mark on its dashboard, and rolled onto the line */
const HOME = { x: 550, y: 250, s: 1 }, MARK = { x: 640, y: 152, s: 0.42 }, LINE = { x: 760, y: 524, s: 0.1 };

type Beat = (tl: Tl, g: SVGGElement, svg: SVGSVGElement, idle: gsap.core.Animation[]) => void;
/** a part set by a plain transform (GSAP's own svgOrigin follows the group's box, which these groups change) */
const place = (el: Element, x: number, y: number, s = 1, rot = 0) =>
  el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})${rot ? ` rotate(${rot.toFixed(1)} 13 11)` : ''}`);
/** product cards flying from a point to where they rest (their data-x / data-y / data-rot), arcing a little */
const fly = (tl: Tl, items: Element[], from: number[], at: number, stagger: number, duration = 0.7) => items.forEach((it, i) => {
  const x = Number((it as SVGElement).dataset.x), y = Number((it as SVGElement).dataset.y), rot = Number((it as SVGElement).dataset.rot);
  const o = { q: 0 };
  tl.fromTo(o, { q: 0 }, {
    q: 1, duration, ease: 'power2.out', immediateRender: true,
    onUpdate: () => {
      const q = o.q, lift = Math.sin(q * Math.PI) * 40;
      place(it, from[0] + (x - from[0]) * q, from[1] + (y - from[1]) * q - lift, 0.4 + 0.6 * q, rot * q);
      (it as SVGElement).style.opacity = String(clamp01(q * 4));
    },
  }, at + i * stagger);
});
/** a part flipping over, like a card turned on the table, about a vertical line at x */
const flip = (tl: Tl, el: Element, x: number, at: number, show: boolean) => {
  const o = { s: 1 };
  tl.fromTo(o, { s: show ? 0 : 1 }, {
    s: show ? 1 : 0, duration: 0.3, ease: show ? 'power2.out' : 'power2.in', immediateRender: false,
    onStart: () => { if (show) (el as SVGElement).style.opacity = '1'; },
    onUpdate: () => el.setAttribute('transform', `translate(${x} 0) scale(${Math.max(o.s, 0.001).toFixed(3)} 1) translate(${-x} 0)`),
    onComplete: () => { if (!show) (el as SVGElement).style.opacity = '0'; },
  }, at);
};

const BEATS: Record<number, Beat> = {
  // the opening: Zurich draws itself, the Alps behind; the flight from KOAN lands
  0(tl, g, svg, idle) {
    const boat = part(g, 'boat')!, waves = parts(g, 'zwave-');
    draw(tl, strokes(part(g, 'dd-landing')), 0, 1.0);
    draw(tl, [...parts(g, 'zcloud-').flatMap(strokes), ...strokes(part(g, 'alps'))], 0.1, 0.7, 0.08);
    write(tl, svg, 'zurich-name', 0.6, 1.1);
    drawIn(tl, strokes(part(g, 'city')), 0.3, 0.8, 0.006);
    show(tl, [...g.querySelectorAll('.face-r, .face-l, [data-p="city"] .ac-fill')], 0.9, true, 0.5);
    draw(tl, waves.flatMap(strokes), 0.6, 0.8, 0.06);
    drawIn(tl, strokes(part(g, 'bridge')), 0.5, 0.6, 0.01);
    drawIn(tl, strokes(boat), 1.0, 0.5, 0.02);
    waves.forEach((w, i) => loop(idle, gsap.to(w, { x: (i % 2 ? 1 : -1) * Number(w.dataset.per), duration: 2.6 + i * 0.5, ease: 'none', repeat: -1 })));
    tl.fromTo(boat, { x: -110 }, { x: 0, duration: 4.4, ease: 'sine.out' }, 0.8);
    loop(idle, gsap.to(boat, { y: 2, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  },
  // the other side of the counter: then, his shop sending to the marketplace; the scene turns over; now, the shops
  // send to him
  1(tl, g) {
    const then = part(g, 'dd-then')!, now = part(g, 'dd-now')!;
    tl.set(then, { opacity: 1, attr: { transform: 'translate(0 0)' } }, 0);
    tl.set(now, { opacity: 0 }, 0);
    drawIn(tl, [...g.children].filter((e) => !e.matches('[data-p]')).flatMap(strokes), 0, 0.5);
    drawIn(tl, strokes(then), 0.1, 1.0, 0.01);
    show(tl, [...then.querySelectorAll('text, .note')], 0.8, true, 0.3);
    flip(tl, then, 480, 2.6, false);
    flip(tl, now, 480, 2.9, true);
    drawIn(tl, strokes(now), 2.9, 0.9, 0.01);
    show(tl, [...now.querySelectorAll('text, .note')], 3.2, true, 0.3);
  },
  // the integrations: the hub, then each partner's pipe in its format, clicking into place
  2(tl, g) {
    const hub = part(g, 'dd-hub')!;
    drawIn(tl, strokes(hub), 0, 0.5);
    show(tl, hub.querySelector('text'), 0.3);
    parts(g, 'dd-pipe-').forEach((p, i) => {
      const at = 0.4 + i * 0.32;
      drawIn(tl, strokes(p).filter((e) => !e.closest('[data-p^="dd-ok-"]')), at, 0.6, 0.02);
      show(tl, p.querySelector('text'), at + 0.3, true, 0.2);
      pop(tl, part(p, `dd-ok-${i}`), at + 0.6);
    });
  },
  // the scale: the cards pour out of the hub and pile up; the count runs to 800,000+ (once, in the page's numbers)
  3(tl, g) {
    fly(tl, parts(g, 'dd-flood-'), [672, 285], 0.1, 0.05, 0.8);
    const n = g.querySelector<SVGTextElement>('[data-count]')!, to = Number(n.dataset.count), fmt = new Intl.NumberFormat(n.dataset.locale ?? 'en-US');
    const o = { v: 0 };
    tl.fromTo(o, { v: 0 }, { v: to, duration: 2.4, ease: 'power2.out', immediateRender: true, onUpdate: () => { n.textContent = `${fmt.format(Math.round(o.v / 1000) * 1000)}+`; } }, 0.3);
    show(tl, part(g, 'dd-count'), 0.2, true, 0.3);
  },
  // the movement: built; the pile pulled into the sieve, rejects falling out; a broken field made whole; a card
  // turning through four languages; a stamp and the person who checked it; what it runs on
  4(tl, g, svg, idle) {
    const move = part(svg, 'dd-move')!;
    drawIn(tl, strokes(move), 0, 0.9, 0.01);
    show(tl, [...move.querySelectorAll('text')], 0.6, true, 0.4);
    drawIn(tl, strokes(part(svg, 'dd-tpos')), 0.2, 0.8, 0.01);
    parts(g, 'dd-pile-').forEach((c, i) => {
      const x = Number(c.dataset.x), y = Number(c.dataset.y), o = { q: 0 };
      place(c, x, y, 1, Number(c.dataset.rot));
      tl.fromTo(o, { q: 0 }, { q: 1, duration: 0.7, ease: 'power2.in', immediateRender: true, onUpdate: () => {
        place(c, x + (300 - x) * o.q, y + (318 - y) * o.q, 1 - 0.5 * o.q, Number(c.dataset.rot) * (1 - o.q));
        (c as SVGElement).style.opacity = String(1 - o.q * o.q);
      } }, 1.0 + i * 0.15);
    });
    drawIn(tl, strokes(part(g, 'dd-sieve')), 0.6, 0.4);
    parts(g, 'dd-reject-').forEach((r, i) => tl.fromTo(r, { y: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.15 }, { y: 70, opacity: 0, duration: 0.7, ease: 'power2.in' }] }, 1.6 + i * 0.25));
    const fix = part(g, 'dd-fix')!;
    drawIn(tl, strokes(fix).filter((e) => !e.matches('[data-p="dd-fixed"]')), 0.8, 0.5, 0.03);
    tl.fromTo(fix.querySelector('.dd-broken'), { opacity: 1 }, { opacity: 0, duration: 0.3 }, 2.2);
    draw(tl, strokes(part(g, 'dd-fixed')), 2.2, 0.4);
    loop(idle, gsap.to(part(g, 'dd-wrench'), { rotation: 18, transformOrigin: '30% 70%', duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    const cardEl = part(g, 'dd-card')!;
    drawIn(tl, strokes(cardEl), 1.0, 0.5);
    show(tl, [...cardEl.querySelectorAll('text, .ac-fill')], 1.3, true, 0.3);
    // the card turns through the languages, over and over while the beat is on screen
    const langs = (cardEl.dataset.langs ?? '').split(';').map((l) => l.split('|'));
    const lang = part(cardEl, 'dd-lang')!, title = part(cardEl, 'dd-title')!;
    let at = 0;
    const turn = gsap.timeline({ repeat: -1 });
    langs.forEach((_, i) => {
      const next = langs[(i + 1) % langs.length];
      turn.to(cardEl, { scaleX: 0, transformOrigin: '50% 50%', duration: 0.18, ease: 'power2.in' }, at + 1.1)
        .call(() => { lang.textContent = next[0]; title.textContent = next[1]; }, [], at + 1.28)
        .to(cardEl, { scaleX: 1, duration: 0.2, ease: 'power2.out' }, at + 1.28);
      at += 1.48;
    });
    loop(idle, turn);
    drawIn(tl, strokes(part(g, 'dd-check')), 1.4, 0.4);
    tl.fromTo(part(g, 'dd-stamp'), { opacity: 0, y: -26, scale: 1.4, transformOrigin: '50% 50%' }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.in' }, 2.6);
    drawIn(tl, strokes(part(g, 'dd-reviewer')), 2.3, 0.4);
    tl.fromTo(parts(g, 'dd-tag-'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: 'power2.out' }, 3.0);
  },
  // clean output: cards out of the movement onto the shelves; a daily refresh round it all
  5(tl, g) {
    draw(tl, strokes(part(g, 'dd-shelves')), 0, 0.5, 0.1);
    fly(tl, parts(g, 'dd-out-'), [680, 250], 0.4, 0.09, 0.6);
    const refresh = part(g, 'dd-refresh')!;
    draw(tl, strokes(refresh), 1.4, 1.0);
    show(tl, refresh.querySelector('text'), 2.0, true, 0.4);
  },
  // the spark: the Translate gear glows and rolls out on its own, and becomes Feedgenix's mark; the product draws
  // round it: a dataset in, the fields ticked, the languages picked, its address written
  6(tl, g, svg) {
    const tpos = part(svg, 'dd-tpos')!, o = { ...HOME };
    tl.call(() => place(tpos, HOME.x, HOME.y, HOME.s), [], 0);
    tl.fromTo(o, { ...HOME }, { ...MARK, duration: 1.1, ease: 'power2.inOut', immediateRender: false, onUpdate: () => place(tpos, o.x, o.y, o.s) }, 0.3);
    tl.fromTo([part(svg, 'dd-tglow'), part(svg, 'dd-tlit')], { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, 0.2);
    const panel = part(g, 'dd-panel')!;
    drawIn(tl, strokes(panel), 1.0, 0.6, 0.03);
    show(tl, [...panel.querySelectorAll('text')], 1.3, true, 0.3);
    parts(g, 'dd-field-').forEach((f, i) => { drawIn(tl, strokes(f), 1.6 + i * 0.2, 0.3); show(tl, f.querySelector('text'), 1.6 + i * 0.2); });
    const langs = part(g, 'dd-langs')!;
    show(tl, langs.querySelector('text'), 2.2);
    tl.fromTo([...langs.querySelectorAll('.ac-fill')], { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, ease: 'power2.out' }, 2.3);
    show(tl, [...langs.querySelectorAll('.t-inv')], 2.4, true, 0.3);
    pop(tl, part(g, 'dd-go'), 2.9);
    write(tl, svg, 'dd-site', 3.1, 0.9);
  },
  // the close: Feedgenix rolls onto the line of client work, and is one of its dots
  7(tl, g, svg) {
    const tpos = part(svg, 'dd-tpos')!, o = { ...MARK };
    tl.fromTo(o, { ...MARK }, { ...LINE, duration: 1.4, ease: 'power2.in', immediateRender: false, onUpdate: () => place(tpos, o.x, o.y, o.s) }, 0.2);
    tl.fromTo(tpos, { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, 1.5);
    pop(tl, part(g, 'dd-dot'), 1.5);
    show(tl, g.querySelector('text'), 1.8, true, 0.3);
  },
};

export function deindealChapter(step: HTMLElement, still: boolean) {
  gsap.registerPlugin(ScrollTrigger);
  const root = step.querySelector<HTMLElement>('[data-chapter]');
  const svg = root?.querySelector<SVGSVGElement>('svg.ms-svg');
  if (!root || !svg) return null;
  const cam = part(svg, 'dd-cam')!, move = part(svg, 'dd-move')!, tpos = part(svg, 'dd-tpos')!;
  const net = part(svg, 'dd-b2')!;
  const gears = [...parts(svg, 'dd-g-'), part(svg, 'dd-core')!].map((el) => ({ el, phase: Number(el.dataset.phase), ratio: Number(el.dataset.ratio) }));
  const phone = window.matchMedia('(max-width: 860px)');
  // the camera (a phone comes in close on each beat), set as a plain transform
  const view = { x: 0, y: 0, z: 1 };
  const look = () => {
    cam.setAttribute('transform', `translate(${view.x.toFixed(1)} ${view.y.toFixed(1)}) scale(${view.z.toFixed(4)})`);
    svg.style.setProperty('--sw', (1 / Math.sqrt(view.z)).toFixed(3));
  };
  // the gears: one angle drives them all (each by its ratio to the core), faster the further the page has gone
  let angle = 0, d = 0, running = false;
  const turn = () => gears.forEach((g) => g.el.setAttribute('transform', `rotate(${(g.phase + g.ratio * angle).toFixed(2)})`));
  const tick = (_t: number, dt: number) => {
    if (!running || d < 3.5) return;
    angle += (24 + 76 * clamp01((d - 4) / 2.5)) * (dt / 1000);
    turn();
  };
  if (!still) gsap.ticker.add(tick);
  const watch = ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: (s) => (running = s.isActive) });

  const beats: ChapterBeat[] = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const group = part(svg, `dd-b${k}`)!;
    return { group, make: (tl: Tl, idle: gsap.core.Animation[]) => BEATS[k](tl, group, svg, idle) };
  });
  gsap.set(move, { opacity: 0 });

  const ch = chapter(root, {
    still, steps: STEPS, beats,
    render: (p) => { d = p; },
    onBeat: (k, was) => {
      const jump = still || was < 0;
      const to = (el: Element, vars: gsap.TweenVars) => (jump ? gsap.set(el, vars) : gsap.to(el, { ...vars, duration: 0.5, overwrite: 'auto' }));
      // the integrations stay faintly behind the flood
      if (k === 3) { ready(beats[2])?.tl?.progress(1); to(net, { opacity: 0.3 }); } else if (k !== 2) to(net, { opacity: 0 });
      // the movement, from the beat it is built; behind Feedgenix and the close, faint
      if (k > 4) ready(beats[4])?.tl?.progress(1);
      to(move, { opacity: k < 4 ? 0 : k > 5 ? 0.15 : 1 });
      // the Translate gear: in the movement, then Feedgenix's mark, then a dot on the line
      to(tpos, { opacity: k < 4 || k > 7 ? 0 : 1 });
      if (k <= 5) {
        to(part(svg, 'dd-tglow')!, { opacity: 0 }); to(part(svg, 'dd-tlit')!, { opacity: 0 });
        if (jump || was < 6) place(tpos, HOME.x, HOME.y, HOME.s);
        else { const o = { ...MARK }; gsap.to(o, { ...HOME, duration: 0.8, ease: 'power2.inOut', onUpdate: () => place(tpos, o.x, o.y, o.s) }); }
      } else if (jump) {
        const at = k === 6 ? MARK : LINE;
        place(tpos, at.x, at.y, at.s);
        gsap.set([part(svg, 'dd-tglow'), part(svg, 'dd-tlit')], { opacity: 1 });
        if (k === 7) gsap.set(tpos, { opacity: 0 });
      }
      // a phone comes in close
      const [fx, fy, z] = (phone.matches && FOCUS[k]) || [480, 270, 1];
      const at = { x: 480 - fx * z, y: 270 - fy * z, z };
      if (jump) { Object.assign(view, at); look(); }
      else gsap.to(view, { ...at, duration: 1.1, ease: 'power2.inOut', overwrite: true, onUpdate: look });
    },
  });
  turn();
  return { points: ch.points, kill: () => { ch.kill(); watch.kill(); gsap.ticker.remove(tick); } };
}
