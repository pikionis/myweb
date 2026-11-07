import { gsap } from 'gsap';
import { type Tl, part, parts, strokes, draw, show, pop, type, loop } from './storydraw';

/*
 * The comic interludes of "My story" (src/components/interludes.ts draws them; MyStory.astro sets them between the
 * scenes): played like a scene as each arrives (src/scripts/mystory.ts). The little man draws himself and his
 * bubbles pop in one after another, each when its moment comes in the picture. With reduced motion each rests as
 * it ends, every bubble shown.
 */

type Scene = (tl: Tl, svg: SVGSVGElement, step: HTMLElement, idle: gsap.core.Animation[]) => void;

/** his bubbles, each at its moment */
const say = (tl: Tl, step: HTMLElement, at: number[]) =>
  step.querySelectorAll<HTMLElement>('[data-say]').forEach((b, i) =>
    tl.fromTo(b, { opacity: 0, y: 12, scale: 0.94, transformOrigin: '0% 100%' }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, at[i] ?? at[at.length - 1] + i * 0.8));

/** a little picture of a grid: drawn, its name shown */
const panel = (tl: Tl, g: Element | null, at: number) => {
  if (!g) return;
  tl.fromTo(g, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, at);
  draw(tl, strokes(g), at, 0.7, 0.012);
  show(tl, [...g.querySelectorAll('.ac-fill, .fill-ink, .face-r, .face-l, .kc-awn, .sea, text')], at + 0.3, true, 0.4);
};

export const INTERLUDES: Record<string, Scene> = {
  // the big deal: in the light, on the winner's step, cap on; the shades drop onto his nose, and glint
  'il-cocky'(tl, svg, step, idle) {
    show(tl, part(svg, 'il-beam'), 0, true, 0.8);
    draw(tl, strokes(part(svg, 'il-ground')), 0, 0.5);
    draw(tl, strokes(part(svg, 'il-step')), 0.1, 0.5);
    show(tl, part(svg, 'il-step')!.querySelector('text'), 0.5);
    const guy = part(svg, 'il-guy')!;
    draw(tl, strokes(guy), 0.3, 0.8, 0.03);
    show(tl, [...guy.querySelectorAll('circle')], 0.8, true, 0.3);
    tl.fromTo(part(svg, 'il-cap'), { opacity: 0, y: -40, rotation: -20, svgOrigin: '280 170' }, { opacity: 1, y: 0, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, 1.0);
    tl.fromTo(part(svg, 'il-shades'), { opacity: 0, y: -120 }, { opacity: 1, y: 0, duration: 0.5, ease: 'bounce.out' }, 1.5);
    pop(tl, part(svg, 'il-glint'), 2.1);
    pop(tl, parts(svg, 'il-spark-'), 2.2, '50% 50%', 0.12);
    say(tl, step, [2.0]);
    // and he stays pleased with himself: a deep breath, the sparkles twinkling
    loop(idle, gsap.to(part(svg, 'il-chest'), { scaleY: 1.03, scaleX: 1.015, transformOrigin: '50% 100%', duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    parts(svg, 'il-spark-').forEach((s, i) => loop(idle, gsap.to(s, { scale: 0.5, opacity: 0.4, transformOrigin: '50% 50%', duration: 0.8 + i * 0.25, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
  },

  // the first job: the terms rain down on him, hands on his head; months go by; they line up, he is at ease
  'il-wtf'(tl, svg, step) {
    draw(tl, strokes(part(svg, 'il-ground')), 0, 0.4);
    const guy = part(svg, 'il-guy')!;
    draw(tl, strokes(guy), 0.1, 0.6, 0.03);
    show(tl, [...guy.querySelectorAll('circle')], 0.5, true, 0.2);
    // panicking first, at ease at the end (as he rests)
    const up = part(svg, 'il-arms-up'), calm = part(svg, 'il-arms-calm'), o = part(svg, 'il-face-o'), smile = part(svg, 'il-face-smile');
    show(tl, [up, o], 0.4, true, 0.2);
    tl.set([calm, smile], { opacity: 0 }, 0);
    const terms = parts(svg, 'il-term-');
    terms.forEach((g, i) => {
      const dx = Number(g.dataset.dx), dy = Number(g.dataset.dy), rot = Number(g.dataset.rot);
      tl.fromTo(g, { x: dx, y: dy - 420, rotation: rot * 2, opacity: 0, svgOrigin: '280 200' },
        { x: dx, y: dy, rotation: rot, opacity: 1, duration: 0.7, ease: 'bounce.out' }, 0.3 + i * 0.12);
    });
    pop(tl, part(svg, 'il-huh'), 1.2);
    show(tl, part(svg, 'il-sweat'), 1.4);
    tl.fromTo(part(svg, 'il-sweat'), { y: 0 }, { y: 16, duration: 0.8, ease: 'power1.in', repeat: 2 }, 1.4);
    say(tl, step, [0.7, 2.0, 5.2]);
    // the months go by
    const cal = part(svg, 'il-cal')!;
    draw(tl, strokes(cal), 3.0, 0.4, 0.02);
    show(tl, [...cal.querySelectorAll('.face-l, .face-t')], 3.0, true, 0.3);
    [0, 1].forEach((k) => tl.to(part(svg, `il-page-${k}`), { scaleY: 0, y: -30, opacity: 0, transformOrigin: '50% 0%', duration: 0.35, ease: 'power2.in' }, 3.5 + k * 0.45));
    // and it all falls into place
    tl.to(terms, { x: 0, y: 0, rotation: 0, duration: 0.7, ease: 'power3.inOut', stagger: 0.06 }, 4.4);
    tl.to([up, o, part(svg, 'il-huh'), part(svg, 'il-sweat')], { opacity: 0, duration: 0.3 }, 4.6);
    tl.to([calm, smile], { opacity: 1, duration: 0.3 }, 4.7);
  },

  // the startup: meetings, sales, code, presentations, one after another
  'il-startup'(tl, svg, step) {
    say(tl, step, [0.2]);
    parts(svg, 'il-panel-').forEach((g, i) => panel(tl, g, 0.5 + i * 0.7));
  },

  // the big league: the contract, the institutions, the destination, the paperwork, its stamp coming down
  'il-league'(tl, svg, step) {
    say(tl, step, [0.2]);
    parts(svg, 'il-panel-').forEach((g, i) => panel(tl, g, 0.5 + i * 0.7));
    // (down, up, down: it ends where it rests)
    tl.fromTo(part(svg, 'il-stamp'), { y: -24 }, { y: 0, duration: 0.25, ease: 'power3.in', yoyo: true, repeat: 2 }, 3.1);
  },

  // the AI lab: he writes, the prompt is typed, the orchestrator sets its agents going and the light runs to each
  'il-lab'(tl, svg, step, idle) {
    say(tl, step, [0.2]);
    draw(tl, strokes(part(svg, 'il-desk')), 0, 0.5);
    draw(tl, strokes(part(svg, 'il-screen')), 0.1, 0.6, 0.02);
    show(tl, [...part(svg, 'il-screen')!.querySelectorAll('circle')], 0.5, true, 0.3);
    draw(tl, strokes(part(svg, 'il-man')), 0.3, 0.6, 0.05);
    // the code, line after line, as if typed
    parts(svg, 'il-code-').forEach((g, i) => draw(tl, strokes(g), 0.8 + i * 0.16, 0.22));
    type(tl, part(svg, 'il-prompt')!.querySelector('text'), 1.0, 1.2);
    show(tl, part(svg, 'il-caret'), 1.0, true, 0.1);
    pop(tl, part(svg, 'il-orch'), 2.2);
    parts(svg, 'il-edge-').forEach((g, i) => draw(tl, strokes(g), 2.5 + i * 0.12, 0.4));
    parts(svg, 'il-agent-').forEach((g, i) => {
      tl.fromTo(g, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.8 + i * 0.18);
      draw(tl, strokes(g), 2.8 + i * 0.18, 0.5);
    });
    tl.fromTo(step.querySelectorAll('[data-chip]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power2.out' }, 1.0);
    // while it is on screen: the work runs from the orchestrator to each agent, and the cursor blinks
    svg.querySelectorAll<SVGPathElement>('.il-pulse').forEach((p, i) => loop(idle, gsap.fromTo(p, { strokeDashoffset: 1, opacity: 1 },
      { strokeDashoffset: -0.05, duration: 1.4, ease: 'power1.inOut', repeat: -1, repeatDelay: 0.6, delay: i * 0.35 })));
    loop(idle, gsap.to(part(svg, 'il-caret'), { opacity: 0, duration: 0.5, ease: 'steps(1)', yoyo: true, repeat: -1 }));
  },
};
