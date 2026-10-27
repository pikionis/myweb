import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type Tl, part, parts, strokes, draw, drawIn, show, pop, count, loop } from './storydraw';
import { chapter } from './chapter';

/*
 * The Kalimera chapter of "My story" (KalimeraChapter.astro; the drawing is src/components/kalimera.ts): one
 * morning, run as a chapter (src/scripts/chapter.ts: the sticky screen, a stop at each beat). The scroll drives the
 * day: the sun along its way (it bends at the pivot), the sky from dawn to daylight, the landscape drifting by on a
 * wide screen, the windmills turning. Each beat, as it arrives, draws its own picture by
 * itself and its words come in (the beat before fades); the clock moves on; from the pivot the horizon is Athens,
 * and at the end the view pulls back. With reduced motion the day goes beat by beat, its pictures shown drawn.
 */

gsap.registerPlugin(ScrollTrigger);

/** the scroll from one beat to the next, in heights of the screen: the pivot (beat 4 to 5) holds longer */
const STEPS = [0.75, 0.75, 0.75, 0.85, 1.3, 0.75, 0.75];
const clamp01 = gsap.utils.clamp(0, 1);


/** Each beat's picture, played from nothing as the beat arrives (index 1 to 7), and its idle motions. */
type Beat = (tl: Tl, g: SVGGElement, svg: SVGSVGElement, idle: gsap.core.Animation[]) => void;
const BEATS: Record<number, Beat> = {
  // dawn: wireframes that become the app; the business model, block by block
  1(tl, g, svg) {
    const wfs = parts(g, 'kc-wf-');
    wfs.forEach((w, i) => drawIn(tl, strokes(w), 0.1 + i * 0.25, 0.6, 0.02));
    draw(tl, strokes(part(g, 'kc-flow')), 0.7, 0.4);
    // the wireframes fold into the phone
    wfs.forEach((w, i) => tl.to(w, { x: 260 - (190 + i * 78), y: 10, scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.in' }, 1.5));
    tl.to(part(g, 'kc-flow'), { opacity: 0, duration: 0.3 }, 1.5);
    const ph = part(g, 'kc-phone1')!;
    drawIn(tl, strokes(ph), 1.8, 0.6, 0.02);
    show(tl, [...ph.querySelectorAll('.ac-fill, .kc-inv, text')], 2.2, true, 0.4);
    canvasIn(tl, part(g, 'kc-c1')!, 0.4);
  },
  // first light: the app comes to Kos, one shop after another takes it on, eighty sales
  2(tl, g, svg) {
    const ph = part(g, 'kc-phone2')!;
    tl.fromTo(ph, { x: 236, y: 262, scale: 1 }, { x: 618, y: 238, scale: 0.3, duration: 1.1, ease: 'power2.inOut' }, 0.5);
    const map = [...g.children].filter((e) => !e.matches('[data-p^="kc-"], text'));
    drawIn(tl, map.flatMap(strokes), 0, 1.1, 0.01);
    show(tl, [...g.querySelectorAll(':scope > text:not([data-count])')], 0.8);
    pop(tl, part(g, 'kc-mvp'), 0.9);
    const shops = parts(g, 'kc-shop-');
    shops.forEach((s, i) => {
      const at = 1.6 + i * 0.22;
      draw(tl, strokes(s).filter((e) => !e.closest('[data-p^="kc-tick-"]')), at, 0.3);
      show(tl, s.querySelector('.kc-awn'), at, true, 0.2);
      show(tl, part(s, `kc-lit-${i}`), at + 0.25, true, 0.2);
      pop(tl, part(s, `kc-tick-${i}`), at + 0.3);
    });
    count(tl, g.querySelector('[data-count]'), 1.6, 0.22 * shops.length + 0.4, Number(g.querySelector('[data-count]')?.textContent), (v) => String(Math.round(v)));
  },
  // clouds: feedback drifts in front of the sun, the notebook takes it down; some clouds clear, some stay
  3(tl, g, svg, idle) {
    const clouds = parts(g, 'kc-cloud-');
    clouds.forEach((c, i) => tl.fromTo(c, { x: -240 - i * 30, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'power2.out' }, i * 0.25));
    const book = [...g.children].filter((e) => !e.matches('[data-p^="kc-cloud-"], [data-p^="kc-note-"]'));
    drawIn(tl, book.flatMap(strokes), 0.6, 0.8, 0.01);
    parts(g, 'kc-note-').forEach((n, i) => {
      show(tl, n, 1.6 + i * 0.5, true, 0.1);
      draw(tl, strokes(n), 1.6 + i * 0.5, 0.5, 0.05);
    });
    [clouds[0], clouds[3]].forEach((c, i) => c && tl.to(c, { y: -50, opacity: 0, duration: 0.9, ease: 'power1.in' }, 3.8 + i * 0.3));
    // (the ones that stay keep drifting)
    [clouds[1], clouds[2]].forEach((c, i) => c && loop(idle, gsap.to(c, { y: 5, duration: 1.6 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
  },
  // the pivot: the way it was heading, and the new one; the light over the idea platform; the team; the business
  // model shuffles into a new one, its rewritten blocks in cobalt
  4(tl, g, svg, idle) {
    draw(tl, strokes(part(g, 'kc-ghost')), 0.2, 0.5);
    tl.to(part(g, 'kc-ghost'), { opacity: 0.35, duration: 0.6 }, 1.2);
    draw(tl, strokes(part(g, 'kc-newway')), 1.1, 0.8);
    const board = [...g.children].filter((e) => !e.matches('[data-p^="kc-"]'));
    drawIn(tl, board.flatMap(strokes), 0.1, 0.6, 0.02);
    show(tl, [...g.querySelectorAll(':scope > text'), ...parts(g, 'kc-sticky-')], 0.5, true, 0.3);
    drawIn(tl, strokes(part(g, 'kc-bulb')), 0.5, 0.5);
    pop(tl, part(g, 'kc-glow'), 0.9);
    drawIn(tl, strokes(part(g, 'kc-team')), 0.7, 0.5, 0.03);
    loop(idle, gsap.to(part(g, 'kc-glow'), { opacity: 0.5, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the canvas from the dawn, then its blocks change places, and the ones rewritten light up
    const c = part(g, 'kc-c4')!;
    show(tl, c, 0.2, true, 0.4);
    const hi = [...c.querySelectorAll('[data-p*="-hi-"], [data-p*="-line-"]')];
    gsap.set(hi, { opacity: 0 });
    const box = (k: number) => part(c, `kc-c4-box-${k}`);
    const moves: [number, gsap.TweenVars][] = [[0, { x: 336 }], [6, { x: -336 }], [4, { y: 80 }], [5, { y: -80 }], [7, { x: 210 }], [8, { x: -210 }]];
    moves.forEach(([k, v], i) => tl.to(box(k), { ...v, duration: 0.7, ease: 'power3.inOut' }, 1.7 + (i >> 1) * 0.25));
    tl.fromTo(hi, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.08 }, 2.6);
  },
  // on stage: the pitch of the new model, the prize, and the door to the accelerator in Athens opening
  5(tl, g) {
    const stage = [...g.children].filter((e) => !e.matches('[data-p^="kc-"], text'));
    drawIn(tl, stage.flatMap(strokes), 0, 0.7, 0.02);
    show(tl, [...g.querySelectorAll(':scope > .ac-fill')], 0.7, true, 0.4);
    drawIn(tl, strokes(part(g, 'kc-pitcher')), 0.5, 0.5);
    drawIn(tl, strokes(part(g, 'kc-audience')), 0.8, 0.5, 0.03);
    drawIn(tl, strokes(part(g, 'kc-trophy')), 1.5, 0.6, 0.05);
    pop(tl, part(g, 'kc-trophy')!.querySelector('text'), 2.0);
    show(tl, part(g, 'kc-prize'), 2.2, true, 0.4);
    const doorway = part(g, 'kc-doorway')!;
    show(tl, doorway.querySelector('.kc-view'), 2.4, true, 0.3);
    draw(tl, strokes(doorway), 2.4, 0.5, 0.05);
    drawIn(tl, strokes(part(g, 'kc-door')), 2.4, 0.4);
    show(tl, [...g.querySelectorAll(':scope > text')], 2.6, true, 0.4);
    tl.fromTo(part(g, 'kc-door'), { scaleX: 1 }, { scaleX: 0.16, transformOrigin: '0% 50%', duration: 0.7, ease: 'power2.inOut' }, 3.0);
    draw(tl, strokes(part(g, 'kc-spill')), 3.4, 0.5, 0.1);
  },
  // full daylight: four rays from the noon sun, each ending in what the accelerator gave
  6(tl, g) {
    parts(g, 'kc-card-').forEach((c, i) => {
      draw(tl, strokes(part(g, `kc-ray-${i}`)), 0.2 + i * 0.4, 0.4);
      drawIn(tl, strokes(c), 0.5 + i * 0.4, 0.5, 0.01);
      show(tl, [...c.querySelectorAll('text, .note')], 0.7 + i * 0.4, true, 0.3);
    });
    tl.fromTo(parts(g, 'kc-month-'), { opacity: 0 }, { opacity: 1, duration: 0.25, stagger: 0.22 }, 2.2);
    draw(tl, strokes(part(g, 'kc-ray-n')), 0.2, 0.8);
    parts(g, 'kc-row-').forEach((r, i) => {
      drawIn(tl, strokes(r), 0.6 + i * 0.35, 0.5, 0.01);
      show(tl, [...r.querySelectorAll('text')], 0.8 + i * 0.35, true, 0.3);
    });
  },
  // the map: everything the morning held, joined, with what flows between; the sun's line flows on
  7(tl, g, svg, idle) {
    pop(tl, part(g, 'kc-centre'), 0);
    pop(tl, parts(g, 'kc-node-'), 0.3, '50% 50%', 0.12);
    draw(tl, strokes(part(g, 'kc-links')), 0.4, 0.6);
    const flows = part(g, 'kc-flows')!;
    draw(tl, strokes(flows), 1.2, 0.6, 0.15);
    show(tl, [...flows.querySelectorAll('text')], 1.6, true, 0.3);
    const tags = parts(g, 'kc-tag-');
    tl.fromTo(tags, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.14, ease: 'power2.out' }, 2.0);
    tags.forEach((t, i) => loop(idle, gsap.to(t, { y: i % 2 ? 4 : -4, duration: 1.8 + (i % 3) * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    draw(tl, strokes(part(g, 'kc-onward')), 3.0, 1.2);
  },
};

/** the Business Model Canvas drawing itself: its easel and board, then one block after another */
function canvasIn(tl: Tl, c: SVGGElement, at: number) {
  const hi = [...c.querySelectorAll('[data-p*="-hi-"], [data-p*="-line-"]')];
  gsap.set(hi, { opacity: 0 });
  const boxes = parts(c, `${c.dataset.p}-box-`);
  drawIn(tl, [...c.children].filter((e) => !boxes.includes(e as SVGGElement)).flatMap(strokes), at, 0.6, 0.05);
  show(tl, c.querySelector(':scope > text'), at, true, 0.3);
  boxes.forEach((b, i) => {
    draw(tl, strokes(b).filter((e) => !hi.includes(e)), at + 0.5 + i * 0.14, 0.35);
    show(tl, [...b.querySelectorAll('text')], at + 0.7 + i * 0.14, true, 0.2);
  });
}

export function kalimeraChapter(step: HTMLElement, still: boolean) {
  const root = step.querySelector<HTMLElement>('[data-chapter]');
  const svg = root?.querySelector<SVGSVGElement>('svg.ms-svg');
  if (!root || !svg) return null;
  const sky = root.querySelector<HTMLElement>('.ch-sky')!;
  const clockEl = root.querySelector<HTMLElement>('[data-clock]'), clock = root.querySelector<HTMLElement>('[data-clock-now]');
  const times = (clockEl?.dataset.clock ?? '').split(',');
  const phone = window.matchMedia('(max-width: 860px)');
  const cam = part(svg, 'kc-cam')!, land = part(svg, 'kc-land')!, sun = part(svg, 'kc-sun')!, dot = part(svg, 'kc-dot')!;
  const ray0 = part(svg, 'kc-ray0')!, rays = part(svg, 'kc-rays')!, horizon = part(svg, 'kc-horizon')!;
  const trail = part(svg, 'kc-trail') as SVGPathElement;
  const sails = parts(svg, 'kc-mill-').filter((m) => m.dataset.p!.endsWith('-sails'));

  // ---- the sun's way: where each beat's point lies along it
  const SUN = (svg.dataset.sun ?? '').split(',').map(Number);
  const L = trail.getTotalLength(), N = Math.ceil(L / 2);
  const pts = Array.from({ length: N + 1 }, (_, i) => trail.getPointAtLength((i / N) * L));
  const stops: number[] = [];
  let from = 0;
  for (let k = 0; k < SUN.length / 2; k++) {
    let best = from, bd = Infinity;
    for (let i = from; i <= N; i++) {
      const dd = Math.hypot(pts[i].x - SUN[k * 2], pts[i].y - SUN[k * 2 + 1]);
      if (dd < bd) { bd = dd; best = i; }
    }
    stops.push((best / N) * L);
    from = best;
  }
  trail.style.strokeDasharray = `${L} ${L}`;

  // ---- the beats' pictures, each ready to play from nothing
  const beats = [{}, ...[1, 2, 3, 4, 5, 6, 7].map((k) => {
    const group = part(svg, `kc-b${k}`)!, tl = gsap.timeline({ paused: true }), idle: gsap.core.Animation[] = [];
    BEATS[k](tl, group, svg, idle);
    return { group, tl, idle };
  })];
  // the horizon from the pivot on: Kos undraws, Athens draws in
  const kos = part(svg, 'kc-kos')!, athens = part(svg, 'kc-athens')!;
  const morph = gsap.timeline({ paused: true });
  gsap.set(kos, { opacity: 1 });
  morph.fromTo(strokes(kos), { strokeDashoffset: 0 }, { strokeDashoffset: 1.01, duration: 0.6, ease: 'power1.in', stagger: 0.01 }, 0);
  morph.fromTo([...kos.querySelectorAll('.solid, .shade')], { opacity: 1 }, { opacity: 0, duration: 0.4 }, 0.3);
  morph.fromTo(kos, { opacity: 1 }, { opacity: 0, duration: 0.01 }, 0.8);
  morph.fromTo(strokes(athens), { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut', stagger: 0.01 }, 0.7);
  morph.fromTo([...athens.querySelectorAll('.solid, .shade')], { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.0);
  morph.progress(0);
  // the opening: the horizon draws itself across as the chapter comes in
  const open = gsap.timeline({ paused: true });
  draw(open, [horizon], 0, 1.2);

  const ch = chapter(root, {
    still, steps: STEPS, beats,
    // the clock moves on; Kos until the pivot, Athens from it; at the end the view pulls back and the landscape
    // steps behind the map
    onBeat: (k, was) => {
      if (clock && times[k]) {
        clock.textContent = times[k];
        clockEl?.classList.remove('tick');
        void clockEl?.offsetWidth;
        clockEl?.classList.add('tick');
      }
      const jump = still || was < 0;
      if (jump) morph.progress(k >= 4 ? 1 : 0);
      else if (k >= 4) morph.play(); else morph.reverse();
      const view = { scale: k === 7 ? 0.94 : 1, svgOrigin: '450 480' };
      if (jump) { gsap.set(cam, view); gsap.set(land, { opacity: k === 7 ? 0.45 : 1 }); }
      else {
        gsap.to(cam, { ...view, duration: 1.4, ease: 'power2.inOut', overwrite: true });
        gsap.to(land, { opacity: k === 7 ? 0.45 : 1, duration: 0.8, overwrite: true });
      }
    },
    onEnter: () => (still ? open.progress(1) : open.restart()),
    // the day: d runs from 0 (05:30) to 7 (noon)
    render: (d) => {
      // the sun along its way, the way it has come behind it
      const k = Math.min(stops.length - 2, Math.floor(d)), u = d - k;
      const len = stops[k] + (stops[k + 1] - stops[k]) * u;
      const q = trail.getPointAtLength(len);
      sun.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
      trail.style.strokeDashoffset = String(L - len);
      // under the horizon a dot; then its first ray; then the rest
      dot.style.opacity = String(clamp01(1 - d * 1.4));
      ray0.style.opacity = String(clamp01((d - 0.4) * 2));
      rays.style.opacity = String(clamp01((d - 1.4) * 2));
      // the sky: dawn, a warm morning, then the light of day
      sky.style.setProperty('--dusk', clamp01(1 - d / 1.6).toFixed(3));
      sky.style.setProperty('--warm', (d < 3 ? clamp01((d - 0.6) / 1.6) : clamp01(1 - (d - 3) / 2.6)).toFixed(3));
      sky.style.setProperty('--wash', clamp01((d - 3.6) / 3).toFixed(3));
      // the landscape drifts by on a wide screen; the windmills turn
      land.setAttribute('transform', phone.matches ? 'translate(0 0)' : `translate(${(-d * 18).toFixed(1)} 0)`);
      sails.forEach((s) => s.setAttribute('transform', `rotate(${(d * 140).toFixed(1)} ${s.dataset.cx} ${s.dataset.cy})`));
    },
  });
  return { points: ch.points, kill: () => { ch.kill(); morph.kill(); open.kill(); } };
}
