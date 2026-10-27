import { gsap } from 'gsap';
import { type Tl, part, parts, strokes, draw, drawIn, show, pop, loop } from './storydraw';
import { chapter } from './chapter';

/*
 * The KOAN chapter of "My story" (KoanChapter.astro; the map is src/components/koan.ts): "Opening the skies", run
 * as a chapter (src/scripts/chapter.ts: the sticky screen, a stop at each beat). Two things carry it: the departures
 * board, whose rows flip in place letter by letter to each move (a destination, what was done, its status), and
 * the map, where each beat draws its own picture as it arrives: the runway, the mandate, the fairs, the UK (the map
 * comes in close), the proof, the new routes, the machine behind it (the map steps back), and the line lifting off.
 * With reduced motion the board is set at once and each picture is shown as it ends.
 */

/** the scroll from one beat to the next, in heights of what is free on screen */
const STEPS = [0.75, 0.75, 0.85, 0.85, 0.85, 0.85, 0.75];
/** where the map comes in close, by beat: the point to bring to the middle (320, 260), and how close */
// (for the UK, London stays where the actions fan out round it)
const FOCUS: Record<number, [number, number, number]> = { 1: [500, 372, 1.9], 2: [214, 190, 1.5], 3: [245, 218.75, 1.6] };
const clamp01 = gsap.utils.clamp(0, 1);

type Row = { at: number; dest: string; act: string; status: [number, string][] };
type Beat = (tl: Tl, g: SVGGElement, svg: SVGSVGElement, idle: gsap.core.Animation[]) => void;

const BEATS: Record<number, Beat> = {
  // the opening: the line comes down from the morning and becomes a runway, then the horizon of the Dodecanese
  0(tl, g) {
    draw(tl, strokes(part(g, 'ko-descent')), 0, 0.9);
    draw(tl, strokes(part(g, 'ko-runway')), 0.7, 0.7, 0.05);
    draw(tl, strokes(part(g, 'ko-horizon')), 1.0, 0.8);
    draw(tl, strokes(part(g, 'ko-skyline')), 1.4, 0.8, 0.15);
    show(tl, [...g.querySelectorAll('text')], 1.9, true, 0.4);
  },
  // the mandate: the three islands, a mayor by each, three dotted lines meeting at one figure, the budget
  1(tl, g, svg) {
    const isles = part(svg, 'ko-isles')!;
    drawIn(tl, strokes(isles), 0, 0.8, 0.1);
    show(tl, [...isles.querySelectorAll('text')], 0.6, true, 0.4);
    parts(g, 'ko-mayor-').forEach((m, i) => drawIn(tl, strokes(m), 0.8 + i * 0.2, 0.4));
    parts(g, 'ko-link-').forEach((l, i) => tl.fromTo(l.children, { opacity: 0 }, { opacity: 1, duration: 0.08, stagger: 0.07 }, 1.4 + i * 0.15));
    const me = part(g, 'ko-me')!;
    drawIn(tl, strokes(me), 1.9, 0.5);
    show(tl, me.querySelector('text'), 2.2);
    pop(tl, part(g, 'ko-budget'), 2.5);
  },
  // the fairs: a pavilion of our own at each, and people gathering
  2(tl, g, svg, idle) {
    parts(g, 'ko-fair-').forEach((f, i) => {
      drawIn(tl, strokes(f), 0.1 + i * 0.5, 0.7, 0.03);
      show(tl, [...f.querySelectorAll('text')], 0.5 + i * 0.5, true, 0.3);
    });
    parts(g, 'ko-crowd-').forEach((c, i) => tl.fromTo(c.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.12 }, 1.2 + i * 0.4));
    parts(g, 'ko-visitor-').filter((v) => v.dataset.p!.endsWith('-legs')).forEach((legs, i) =>
      loop(idle, gsap.to(legs, { scaleX: -1, transformOrigin: '50% 0%', duration: 0.4 + (i % 3) * 0.1, ease: 'none', yoyo: true, repeat: -1 })));
  },
  // the strongest market: the map comes in close on the UK, its route draws in ink and a light runs along it; the
  // actions fan out round it
  3(tl, g, svg, idle) {
    const uk = part(svg, 'ko-uk')!;
    draw(tl, strokes(part(svg, 'ko-uk-way')), 0.4, 1.0);
    show(tl, uk.querySelector('text'), 0.3, true, 0.4);
    parts(g, 'ko-card-').forEach((c, i) => tl.fromTo(c, { opacity: 0, x: -24, rotation: -6 + i * 3, transformOrigin: '0% 50%' },
      { opacity: 1, x: 0, rotation: 0, duration: 0.55, ease: 'power3.out' }, 1.1 + i * 0.25));
    loop(idle, gsap.fromTo(part(svg, 'ko-pulse'), { strokeDashoffset: 1.06 }, { strokeDashoffset: 0, duration: 1.8, ease: 'none', repeat: -1 }));
  },
  // the proof: visibility rising; the route splitting, one partnership feeding the next
  4(tl, g) {
    const chart = part(g, 'ko-chart')!;
    draw(tl, strokes(chart).filter((e) => e.getAttribute('data-p') !== 'ko-rise'), 0, 0.5, 0.05);
    show(tl, chart.querySelector('text'), 0.3);
    draw(tl, strokes(part(g, 'ko-rise')), 0.5, 1.2);
    drawIn(tl, strokes(part(g, 'ko-split')), 1.2, 0.5, 0.2);
  },
  // new routes: the airport and its tower, Fraport Greece's marketing, new routes in cobalt reaching out
  5(tl, g, svg, idle) {
    drawIn(tl, strokes(part(g, 'ko-airport')), 0, 0.6, 0.04);
    show(tl, part(g, 'ko-airport')!.querySelector('text'), 0.5);
    drawIn(tl, strokes(part(g, 'ko-fraport')), 0.6, 0.5);
    show(tl, part(g, 'ko-fraport')!.querySelector('text'), 0.9);
    parts(g, 'ko-new-').forEach((n, i) => {
      draw(tl, strokes(n), 1.2 + i * 0.3, 0.7);
      pop(tl, n.querySelector('circle'), 1.8 + i * 0.3);
      loop(idle, gsap.to(n.querySelector('circle'), { scale: 1.6, opacity: 0.5, transformOrigin: '50% 50%', duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.2 }));
    });
  },
  // the machine behind it: the kanban, the team moving a card along, the ring of eight closing round it, ESPA
  6(tl, g) {
    const board = part(g, 'ko-board')!;
    drawIn(tl, strokes(board), 0, 0.6, 0.05);
    show(tl, [...board.querySelectorAll('text')], 0.4, true, 0.3);
    tl.fromTo(parts(g, 'ko-task-'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0.5);
    drawIn(tl, strokes(part(g, 'ko-team')), 0.8, 0.5, 0.05);
    show(tl, [...part(g, 'ko-team')!.querySelectorAll('text')], 1.1, true, 0.3);
    // a card goes from to do to done
    tl.to(part(g, 'ko-task-0'), { x: 110, duration: 0.6, ease: 'power2.inOut' }, 1.5);
    tl.to(part(g, 'ko-task-0'), { x: 220, y: 64, duration: 0.6, ease: 'power2.inOut' }, 2.3);
    pop(tl, [...part(g, 'ko-ring')!.querySelectorAll('.sa-d')].filter((e) => !e.matches('.shade')), 1.6, '50% 50%', 0.1);
    pop(tl, part(g, 'ko-espa'), 2.6);
  },
  // the closing: the line lifts off from Kos
  7(tl, g) {
    draw(tl, strokes(part(g, 'ko-liftoff')), 0.6, 1.4);
  },
};

/** the rows on the board at beat k: each from its beat on, until the last one clears the board for itself */
const rowsAt = (rows: Row[], k: number) => {
  const end = rows[rows.length - 1].at;
  return rows.filter((r) => r.at <= k && (k < end || r.at === end));
};
const statusAt = (r: Row, k: number) => r.status.reduce((s, [at, v]) => (at <= k ? v : s), '');

/** The departures board: what it shows at a beat, its rows flipping in place to it, letter by letter (each letter
 *  runs through a few others before it lands; what the move was types itself in under them) */
function departures(el: HTMLElement, still: boolean) {
  const rows: Row[] = JSON.parse(el.dataset.rows ?? '[]');
  const [D, S] = (el.dataset.letters ?? '14,12').split(',').map(Number);
  const slots = [...el.querySelectorAll<HTMLElement>('[data-slot]')].map((s) => ({
    dest: [...s.querySelectorAll<HTMLElement>('.fl-dest .fl-c')],
    status: [...s.querySelectorAll<HTMLElement>('.fl-status .fl-c')],
    act: s.querySelector<HTMLElement>('[data-act]')!,
  }));
  const POOL = 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789';
  const rand = () => POOL[Math.floor(Math.random() * POOL.length)];
  const blank = ' ';
  const letters = (text: string, n: number) => text.toUpperCase().padEnd(n).slice(0, n).split('').map((c) => (c === ' ' ? blank : c));
  type Flip = { el: HTMLElement; to: string; start: number; end: number; step: number };
  let run: gsap.core.Tween | null = null;
  return (k: number, shown: number) => {
    // (whatever was flipping lands first)
    run?.progress(1);
    const want = rowsAt(rows, k).slice(-shown);
    const flips: Flip[] = [], types: Flip[] = [];
    slots.forEach((s, i) => {
      const r = want[i], at = i * 0.14;
      ([[s.dest, letters(r?.dest ?? '', D)], [s.status, letters(r ? statusAt(r, k) : '', S)]] as [HTMLElement[], string[]][]).forEach(([cells, to], side) =>
        cells.forEach((c, j) => {
          if (c.textContent === to[j]) return;
          const start = at + side * 0.12 + j * 0.028;
          flips.push({ el: c, to: to[j], start, end: start + 0.3 + Math.random() * 0.35, step: -1 });
        }));
      const act = r?.act ?? blank;
      if (s.act.textContent !== act) types.push({ el: s.act, to: act, start: at + 0.1, end: at + 0.1 + 0.5, step: -1 });
    });
    const land = () => [...flips, ...types].forEach((f) => (f.el.textContent = f.to));
    if (still || !(flips.length + types.length)) { land(); return; }
    const total = Math.max(...flips.map((f) => f.end), ...types.map((f) => f.end));
    const clock = { t: 0 };
    run = gsap.to(clock, {
      t: total, duration: total, ease: 'none', onComplete: land,
      onUpdate: () => {
        const t = clock.t;
        flips.forEach((f) => {
          if (t < f.start || f.step === -2) return;
          if (t >= f.end) { f.el.textContent = f.to; f.step = -2; return; }
          const step = Math.floor((t - f.start) / 0.06);
          if (step !== f.step) { f.step = step; f.el.textContent = rand(); }
        });
        types.forEach((f) => {
          if (t < f.start) return;
          const n = Math.round(clamp01((t - f.start) / (f.end - f.start)) * f.to.length);
          f.el.textContent = n >= f.to.length ? f.to : f.to.slice(0, n) + rand() + rand();
        });
      },
    });
  };
}

export function koanChapter(step: HTMLElement, still: boolean) {
  const root = step.querySelector<HTMLElement>('[data-chapter]');
  const svg = root?.querySelector<SVGSVGElement>('svg.ms-svg');
  const boardEl = root?.querySelector<HTMLElement>('[data-board]');
  if (!root || !svg || !boardEl) return null;
  const cam = part(svg, 'ko-cam')!, base = part(svg, 'ko-base')!, uk = part(svg, 'ko-uk')!, pulse = part(svg, 'ko-pulse')!;
  const isles = part(svg, 'ko-isles')!, ukWay = part(svg, 'ko-uk-way')!;
  const setBoard = departures(boardEl, still);
  const phone = window.matchMedia('(max-width: 860px)');
  // the camera over the map: set as a plain transform (moved, then scaled), its lines thinning less than it grows
  const view = { x: 0, y: 0, z: 1 };
  const look = () => {
    cam.setAttribute('transform', `translate(${view.x.toFixed(1)} ${view.y.toFixed(1)}) scale(${view.z.toFixed(4)})`);
    svg.style.setProperty('--sw', (1 / Math.sqrt(view.z)).toFixed(3));
  };

  const beats = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const group = part(svg, `ko-b${k}`)!, tl = gsap.timeline({ paused: true }), idle: gsap.core.Animation[] = [];
    BEATS[k](tl, group, svg, idle);
    return { group, tl, idle };
  });

  const ch = chapter(root, {
    still, steps: STEPS, beats,
    onBeat: (k, was) => {
      setBoard(k, phone.matches ? 3 : 6);
      // the map: from the mandate on; the route from the UK from the strongest market on; both step back behind the
      // machine of beat 6
      const jump = still || was < 0;
      const to = (el: Element, vars: gsap.TweenVars) => (jump ? gsap.set(el, vars) : gsap.to(el, { ...vars, duration: 0.6, overwrite: 'auto' }));
      to(base, { opacity: k === 0 ? 0 : k === 6 ? 0.15 : 1 });
      to(uk, { opacity: k < 3 ? 0 : k === 6 ? 0.15 : 1 });
      to(pulse, { opacity: k === 3 ? 1 : 0 });
      // close in where the beat happens
      const [fx, fy, z] = FOCUS[k] ?? [320, 260, 1];
      const at = { x: 320 - fx * z, y: 260 - fy * z, z };
      if (jump) { Object.assign(view, at); look(); }
      else gsap.to(view, { ...at, duration: 1.2, ease: 'power2.inOut', overwrite: true, onUpdate: look });
      // what an earlier beat drew stays drawn, however quickly the page went past it
      if (k !== 1) {
        gsap.set(strokes(isles), { strokeDashoffset: 0, fillOpacity: 1 });
        gsap.set([...isles.querySelectorAll('text')], { opacity: 1 });
      }
      if (k > 3) {
        gsap.set(strokes(ukWay), { strokeDashoffset: 0 });
        gsap.set(uk.querySelector('text'), { opacity: 1 });
      }
    },
  });
  return ch;
}
