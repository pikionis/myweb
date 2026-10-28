import { gsap } from 'gsap';
import { part, parts, strokes, draw, show, pop, type, count, type Tl } from './storydraw';

/*
 * The drawings of /services (src/components/ServiceArt.astro) told from nothing: `artTimeline` builds a paused
 * timeline that starts blank and ends on the drawing as authored, so it can play by itself (the hero, the tick)
 * or follow the scroll (the sections, the envelope). The bulb lights and unrolls into the four services; the
 * website's wireframe fills in; the idea goes from bulb to napkin to laptop and phone to a chart that lights up;
 * products drop into the bag and out to the marketplaces while the languages circle a card; your card rises to
 * the top of the search, the AI names you and the speed sweeps to 100; a line becomes an envelope that opens.
 * The story pictures that "How we work" borrows (StoryArt.astro) draw the same way, stroke after stroke.
 * `artIdle` is the small motion a drawing keeps once it is drawn (run only while it is on screen).
 */

type Build = (tl: Tl, svg: SVGSVGElement) => void;
const texts = (el: Element | null) => (el ? [...el.querySelectorAll('text')] : []);
const dots = (el: Element | null) => (el ? [...el.querySelectorAll('.sa-f')] : []);
/** a part drawn in: its strokes, then its dots and words */
const drawPart = (tl: Tl, el: Element | null, at: number, duration = 0.6, stagger = 0.04) => {
  if (!el) return;
  draw(tl, strokes(el), at, duration, stagger);
  const fades = [...dots(el), ...texts(el)];
  if (fades.length) show(tl, fades, at + duration * 0.6, true, 0.3);
};

/** the languages circling the product card: their places come from two turns, the story's and the idle one */
const orbits = new WeakMap<SVGSVGElement, { story: number; idle: number; place: () => void }>();
const orbit = (svg: SVGSVGElement) => {
  let o = orbits.get(svg);
  if (o) return o;
  const codes = parts(svg, 'lang-');
  const state = { story: 0, idle: 0, place: () => {} };
  state.place = () => codes.forEach((c, i) => {
    const a = ((i * 60 + 30 + state.story + state.idle) * Math.PI) / 180;
    c.setAttribute('x', (236 + Math.cos(a) * 128).toFixed(1));
    c.setAttribute('y', (99 + Math.sin(a) * 74).toFixed(1));
  });
  orbits.set(svg, (o = state));
  return o;
};

const BUILD: Record<string, Build> = {
  hero(tl, svg) {
    drawPart(tl, part(svg, 'bulb-glass'), 0, 0.9);
    drawPart(tl, part(svg, 'bulb-base'), 0.55, 0.35, 0.08);
    drawPart(tl, part(svg, 'bulb-filament'), 0.95, 0.4, 0.1);
    drawPart(tl, part(svg, 'bulb-rays'), 1.25, 0.4);
    drawPart(tl, part(svg, 'stem'), 1.4, 0.25);
    for (let i = 0; i < 4; i++) drawPart(tl, part(svg, `branch-${i}`), 1.6 + i * 0.07, 0.5);
    for (let i = 0; i < 4; i++) drawPart(tl, part(svg, `icon-${i}`), 2.0 + i * 0.12, 0.6, 0.05);
  },

  web(tl, svg) {
    const frame = part(svg, 'frame');
    drawPart(tl, frame, 0, 0.8, 0.05);
    const wires = [...svg.querySelectorAll('.wire')];
    tl.fromTo(wires, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power1.out' }, 0.7);
    drawPart(tl, part(svg, 'nav'), 1.3, 0.5);
    drawPart(tl, part(svg, 'hero-pic'), 1.5, 0.7, 0.08);
    drawPart(tl, part(svg, 'heading'), 1.9, 0.4, 0.1);
    pop(tl, part(svg, 'button'), 2.2, '0% 50%');
    for (let i = 0; i < 3; i++) drawPart(tl, part(svg, `card-${i}`), 2.3 + i * 0.15, 0.55, 0.05);
    tl.to(wires, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 2.6);
  },

  apps(tl, svg) {
    drawPart(tl, part(svg, 'bulb-glass'), 0, 0.6);
    drawPart(tl, part(svg, 'bulb-base'), 0.35, 0.3, 0.06);
    drawPart(tl, part(svg, 'bulb-filament'), 0.6, 0.3, 0.08);
    drawPart(tl, part(svg, 'bulb-rays'), 0.8, 0.3);
    drawPart(tl, part(svg, 'l1'), 1.0, 0.35);
    drawPart(tl, part(svg, 'napkin'), 1.3, 0.8, 0.07);
    drawPart(tl, part(svg, 'l2'), 2.2, 0.3);
    drawPart(tl, part(svg, 'laptop'), 2.4, 0.7, 0.05);
    drawPart(tl, part(svg, 'phone'), 2.7, 0.6, 0.05);
    drawPart(tl, part(svg, 'l3'), 3.3, 0.3);
    drawPart(tl, part(svg, 'dash'), 3.5, 0.6, 0.06);
    const lit = part(svg, 'lit');
    draw(tl, strokes(lit), 4.1, 0.6);
    pop(tl, dots(lit), 4.2, '50% 50%', 0.07);
  },

  commerce(tl, svg) {
    drawPart(tl, part(svg, 'bag'), 0, 0.6);
    drawPart(tl, part(svg, 'handle'), 0.2, 0.4);
    // the products drop in, already drawn, from above
    ['p-bottle', 'p-jar', 'p-box'].forEach((p, i) => {
      const el = part(svg, p);
      if (!el) return;
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.6 + i * 0.25);
      tl.fromTo(el, { y: -170 }, { y: 0, duration: 0.5, ease: 'power2.in' }, 0.6 + i * 0.25);
    });
    for (let i = 0; i < 3; i++) {
      drawPart(tl, part(svg, `feed-${i}`), 1.55 + i * 0.12, 0.5);
      drawPart(tl, part(svg, `market-${i}`), 1.8 + i * 0.12, 0.5);
    }
    drawPart(tl, part(svg, 'card'), 2.4, 0.6, 0.05);
    const o = orbit(svg);
    show(tl, parts(svg, 'lang-'), 2.7, true, 0.3);
    tl.fromTo(o, { story: -120 }, { story: 0, duration: 1, ease: 'power2.out', onUpdate: o.place }, 2.7);
    const box = part(svg, 'countries');
    drawPart(tl, box, 3.4, 0.5);
    count(tl, part(svg, 'count'), 3.7, 0.6, 5, (v) => String(Math.max(1, Math.round(v))));
  },

  search(tl, svg) {
    drawPart(tl, part(svg, 'bar'), 0, 0.5);
    const q = part(svg, 'bar')?.querySelector('text') ?? null;
    type(tl, q, 0.4, 0.6);
    const lens = part(svg, 'lens');
    draw(tl, strokes(lens), 0.5, 0.4);
    tl.fromTo(lens, { x: -230 }, { x: 0, duration: 0.9, ease: 'power2.inOut' }, 0.5);
    const you = part(svg, 'you'), rows = [part(svg, 'row-1'), part(svg, 'row-2')];
    // your card starts at the bottom of the results and rises to the top as the others step down
    tl.fromTo(you, { y: 128 }, { y: 0, duration: 0.7, ease: 'power3.inOut' }, 2.0);
    tl.fromTo(rows, { y: -64 }, { y: 0, duration: 0.7, ease: 'power3.inOut' }, 2.0);
    [rows[0], rows[1], you].forEach((r, i) => drawPart(tl, r, 1.2 + i * 0.15, 0.5, 0.05));
    const ai = part(svg, 'ai');
    pop(tl, ai, 2.7, '10% 100%');
    show(tl, texts(ai), 2.9, true, 0.3);
    const gauge = part(svg, 'gauge');
    draw(tl, strokes(gauge).filter((e) => !e.closest('[data-p="needle"]') && e.getAttribute('data-p') !== 'sweep'), 3.0, 0.4);
    draw(tl, [part(svg, 'sweep')!].filter(Boolean), 3.3, 0.8, 0);
    draw(tl, strokes(part(svg, 'needle')), 3.1, 0.2);
    show(tl, dots(gauge), 3.1, true, 0.2);
    tl.fromTo(part(svg, 'needle'), { rotation: -180, svgOrigin: '390 344' }, { rotation: 0, svgOrigin: '390 344', duration: 0.8, ease: 'power2.out' }, 3.3);
    show(tl, part(svg, 'score'), 3.3, true, 0.2);
    count(tl, part(svg, 'score'), 3.3, 0.8, 100, (v) => String(Math.round(v)));
  },

  envelope(tl, svg) {
    drawPart(tl, part(svg, 'line'), 0, 0.6);
    drawPart(tl, part(svg, 'back'), 0.5, 0.5);
    const flap = part(svg, 'flap'), open = part(svg, 'flap-open'), letter = part(svg, 'letter');
    // the closed flap rests hidden (the drawing is authored open); its story starts with it there
    tl.fromTo(flap, { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0);
    drawPart(tl, part(svg, 'pocket'), 0.8, 0.5, 0.05);
    drawPart(tl, flap, 1.0, 0.4);
    // the letter is inside, under the closed flap, before it opens
    tl.fromTo(letter, { opacity: 0, y: 60 }, { opacity: 1, duration: 0.01 }, 1.2);
    tl.to(flap, { scaleY: 0, svgOrigin: '200 114', duration: 0.3, ease: 'power2.in' }, 1.6);
    tl.set(flap, { opacity: 0 }, 1.9);
    tl.fromTo(open, { scaleY: 0, opacity: 0, svgOrigin: '200 114' }, { scaleY: 1, opacity: 1, svgOrigin: '200 114', duration: 0.3, ease: 'power2.out' }, 1.9);
    tl.to(letter, { y: 0, duration: 0.6, ease: 'power3.out' }, 2.1);
  },

  check(tl, svg) {
    const [ring, tick] = strokes(svg);
    draw(tl, [ring], 0, 0.5);
    draw(tl, [tick], 0.35, 0.35);
  },
};

/** Any drawing without a story of its own (the picker's icons, the story pictures): stroke after stroke, then its
 *  dots and words, and the parts that move at the end (data-lift, data-turn-from) move. */
const generic: Build = (tl, svg) => {
  const all = [...svg.querySelectorAll<SVGElement>('.sa-d')];
  const step = all.length > 1 ? Math.min(0.08, 1.2 / all.length) : 0;
  draw(tl, all, 0, 0.55, step);
  const end = 0.55 + step * all.length;
  const fades = [...svg.querySelectorAll('.sa-f, text')];
  if (fades.length) show(tl, fades, end * 0.5, true, 0.3);
  svg.querySelectorAll<SVGElement>('[data-lift]').forEach((el) =>
    tl.fromTo(el, { y: 0 }, { y: -Number(el.dataset.lift), duration: 0.5, ease: 'power2.out' }, end - 0.15));
  svg.querySelectorAll<SVGElement>('[data-turn-from]').forEach((el) =>
    tl.fromTo(el, { rotation: Number(el.dataset.turnFrom), svgOrigin: el.dataset.origin }, { rotation: 0, svgOrigin: el.dataset.origin, duration: 0.8, ease: 'power2.out' }, end - 0.3));
};

/** A drawing's story, from nothing to how it is drawn: paused, to be played or scrubbed. */
export function artTimeline(svg: SVGSVGElement) {
  const tl = gsap.timeline({ paused: true });
  const name = svg.dataset.art ?? '';
  (BUILD[name] ?? generic)(tl, svg);
  return tl;
}

/** The small motion a drawn drawing keeps, if it has one: paused, to run while it is on screen. */
export function artIdle(svg: SVGSVGElement): gsap.core.Animation | null {
  switch (svg.dataset.art) {
    case 'hero':
      return gsap.to(part(svg, 'bulb-rays'), { opacity: 0.35, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
    case 'commerce': {
      const o = orbit(svg);
      return gsap.to(o, { idle: '+=360', duration: 48, ease: 'none', repeat: -1, onUpdate: o.place, paused: true });
    }
    case 'search':
      return gsap.to(part(svg, 'ai')?.querySelector('.ac-fill') ?? null, { rotation: 360, svgOrigin: '332 147', duration: 6, ease: 'none', repeat: -1, paused: true });
    default:
      return null;
  }
}
