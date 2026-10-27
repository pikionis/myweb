import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * "My story" on /about (src/components/MyStory.astro). Every scene is a screen: one scroll brings the next one
 * (the page settles on it), and it plays by itself, its picture drawing itself (MyStoryArt.astro, authored as it
 * ends) while its words arrive; some keep a small motion of their own while on screen (the sea, the light, the
 * fireworks). The timeline on the left (on a phone, the strip at the top) follows: the career line fills, the
 * cobalt line of client work beside it, the current scene lit; the client-work scene brings that line forward.
 * With reduced motion every scene is shown as it ends, one after another, and simply fades in as it arrives.
 */

gsap.registerPlugin(ScrollTrigger);

import { type Tl, type El, part, parts, strokes, all, draw, faces, show, pop, type, write, count, loop } from './storydraw';
import { kalimeraChapter } from './kalimera';
import { koanChapter } from './koan';

/** the scenes told as chapters of their own, in beats */
const CHAPTERS: Record<string, (step: HTMLElement, still: boolean) => { points: () => number[]; kill: () => void } | null> = {
  kalimera: kalimeraChapter,
  koan: koanChapter,
};

/** a scene's timeline, its svg, its step, and its idle motions (loops that run while it is on screen) */
type Scene = (tl: Tl, svg: SVGSVGElement, step: HTMLElement, idle: gsap.core.Animation[]) => void;

const SCENES: Record<string, Scene> = {
  intro(tl, svg, step) {
    const words = splitWords(step.querySelector<HTMLElement>('[data-words]'));
    pop(tl, part(svg, 'dot'), 0);
    draw(tl, strokes(part(svg, 'under')), 0.1, 1.2, 0);
    const lit = { v: 0 };
    tl.fromTo(lit, { v: 0 }, { v: 1, duration: 1.3, ease: 'none', onUpdate: () => words.forEach((w, i) => w.classList.toggle('lit', i < Math.ceil(lit.v * words.length))) }, 0);
    draw(tl, strokes(part(svg, 'drop')), 1.4, 0.6);
  },

  chania(tl, svg, _step, idle) {
    const harbour = part(svg, 'harbour')!, campus = part(svg, 'campus')!, crowd = part(svg, 'crowd')!;
    const waves = parts(svg, 'wave-');
    const later = '[data-p^="wave-"], [data-p="sail"], [data-p="dinghies"], [data-p^="walker-"], [data-p^="cloud-"]';
    draw(tl, strokes(part(svg, 'lead')), 0, 0.15);
    draw(tl, parts(svg, 'cloud-').flatMap(strokes), 0, 0.6, 0.1);
    // the quay, the Venetian building and its roof, the lighthouse on its fort
    draw(tl, strokes(harbour).filter((e) => !e.closest(later)), 0.1, 0.6, 0.008);
    faces(tl, harbour, 'venetian', 0.7); faces(tl, harbour, 'fort', 0.8);
    show(tl, [...harbour.querySelectorAll('.roof, [data-p="roof"] .face-r, [data-p="flag"] .ac-fill, [data-p="lighthouse"] > .face-r')], 0.8, true, 0.4);
    // the sea coming in, the boats, the people on the quay
    show(tl, part(svg, 'sea'), 0.3, true, 0.8);
    draw(tl, waves.flatMap(strokes), 0.3, 0.8, 0.06);
    write(tl, svg, 'chania-name', 0.8, 1.2);
    draw(tl, all(part(svg, 'sail'), part(svg, 'dinghies')), 0.9, 0.4, 0.06);
    draw(tl, parts(svg, 'walker-').flatMap(strokes), 1.0, 0.4, 0.04);
    show(tl, [part(svg, 'beam-r'), part(svg, 'beam-l')], 1.2, true, 0.3);
    // and it all moves: the sea, the boats, the passers-by, the clouds, the lighthouse's light
    waves.forEach((w, i) => loop(idle, gsap.to(w, { x: (i % 2 ? 1 : -1) * Number(w.dataset.per), duration: 2.6 + i * 0.5, ease: 'none', repeat: -1 })));
    loop(idle, gsap.to(part(svg, 'sail'), { y: 3, rotation: 2, svgOrigin: '472 236', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    loop(idle, gsap.to(part(svg, 'dinghies'), { x: 18, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    parts(svg, 'cloud-').forEach((c, i) => loop(idle, gsap.to(c, { x: 30 + i * 10, duration: 9 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    parts(svg, 'walker-').filter((w) => !w.dataset.p!.endsWith('-legs')).forEach((w, i) => {
      loop(idle, gsap.to(w, { x: i % 2 ? -22 : 22, y: i % 2 ? 12 : -12, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      loop(idle, gsap.to(w.querySelector('[data-p$="-legs"]'), { scaleX: -1, transformOrigin: '50% 0%', duration: 0.35, ease: 'none', yoyo: true, repeat: -1 }));
    });
    // (the light pulses inside its group, so the group can still leave with the harbour)
    loop(idle, gsap.timeline({ repeat: -1 }).to(part(svg, 'beam-r')!.firstElementChild, { opacity: 0.3, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 })
      .to(part(svg, 'beam-l')!.firstElementChild, { opacity: 0.3, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 }));
    // then the harbour gives way to the university: its round courtyard, and its students cheering
    tl.to([harbour, part(svg, 'beam-r'), part(svg, 'beam-l')], { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 3.0);
    tl.fromTo(campus, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: true }, 3.4);
    show(tl, [...campus.querySelectorAll('.stone')], 3.4, true, 0.6);
    draw(tl, strokes(campus), 3.4, 0.8, 0.012);
    show(tl, [...campus.querySelectorAll('.slit, .pane')], 3.8, true, 0.5);
    tl.fromTo(crowd, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: true }, 4.0);
    const fans = parts(svg, 'fan-').filter((f) => !f.dataset.p!.endsWith('-arms'));
    tl.fromTo(fans, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.04 }, 4.0);
    write(tl, svg, 'campus-name', 4.4, 1.1);
    parts(svg, 'fan-').filter((f) => f.dataset.p!.endsWith('-arms')).forEach((arms, i) =>
      loop(idle, gsap.to(arms, { y: -3, rotation: i % 2 ? 8 : -8, transformOrigin: '50% 100%', duration: 0.45 + (i % 3) * 0.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.05 })));
    parts(svg, 'ccloud-').forEach((c, i) => loop(idle, gsap.to(c, { x: 24 + i * 10, duration: 8 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
  },

  studies(tl, svg, step, idle) {
    const ride = journey(step);
    if (!ride) return;
    const near = part(svg, 'near')!, train = part(svg, 'train')!;
    // the world draws itself: the clouds, the far hills, the track and its stations, the train
    draw(tl, parts(svg, 'jcloud-').flatMap(strokes), 0, 0.6, 0.05);
    draw(tl, strokes(part(svg, 'far')), 0.05, 0.8);
    draw(tl, strokes(near).filter((e) => !e.closest('[data-p="train"], [data-p^="moment-"]')), 0.1, 0.7, 0.002);
    show(tl, [...near.querySelectorAll('.ties, .rail, [data-p^="stop-"] .ac-fill')], 0.2, true, 0.5);
    show(tl, [...near.querySelectorAll(':scope > text')], 0.6);
    draw(tl, strokes(train).filter((e) => !e.closest('[data-p^="crate-"]')), 0.3, 0.7, 0.006);
    show(tl, [...train.querySelectorAll('.face-l, .fill-ink, [data-p="car-0"] .ac-fill, .rod')], 0.8, true, 0.3);
    // the first skills are on board from the start
    tl.fromTo(svg.querySelectorAll('[data-at="0"]'), { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'bounce.out', stagger: 0.18 }, 1.0);
    // then the journey, slowly: from station to station, a stop at each to load one more skill
    let at = 2.0;
    const legs = ride.stops.slice(1);
    legs.forEach((q, k) => {
      const leg = { p: q, duration: 2, ease: 'sine.inOut', onUpdate: ride.place };
      if (k === 0) tl.fromTo(ride.state, { p: 0 }, leg, at); else tl.to(ride.state, leg, at);
      at += 2 + (k < legs.length - 1 ? 1.1 : 0);
    });
    show(tl, ride.station, at - 0.6, true, 0.4);
    // while it is on screen, the engine smokes, the lab bubbles, the house glows, the rocket waits to launch
    parts(svg, 'puff-').forEach((pf, i) => loop(idle, gsap.fromTo(pf, { opacity: 0.9, x: 0, y: 0, scale: 0.6, transformOrigin: '50% 50%' },
      { opacity: 0, x: -36 - i * 6, y: -48 - i * 8, scale: 1.6, duration: 1.6, ease: 'power1.out', repeat: -1, delay: i * 0.4 })));
    parts(svg, 'bubble').forEach((b, i) => loop(idle, gsap.fromTo(b, { y: 0, opacity: 1 }, { y: -40, opacity: 0, duration: 1.4, ease: 'power1.in', repeat: -1, delay: i * 0.45 })));
    parts(svg, 'glow').forEach((g) => loop(idle, gsap.to(g, { opacity: 0.55, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    parts(svg, 'rocket').forEach((r) => loop(idle, gsap.to(r, { y: -8, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    parts(svg, 'sweat').forEach((d) => loop(idle, gsap.fromTo(d, { y: 0, opacity: 1 }, { y: 14, opacity: 0, duration: 1.3, ease: 'power1.in', repeat: -1 })));
    parts(svg, 'hand').forEach((h) => { const b = (h as SVGGraphicsElement).getBBox(); loop(idle, gsap.to(h, { rotation: 360, svgOrigin: `${b.x + b.width / 2} ${b.y + b.height}`, duration: 4, ease: 'none', repeat: -1 })); });
    byHand(tl, step, ride, at + 0.2);
  },

  graduation(tl, svg, _step, idle) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    const tablet = part(svg, 'tablet')!;
    draw(tl, strokes(tablet), 0.1, 0.6, 0.02);
    show(tl, [...tablet.querySelectorAll('.face-r, .ac-fill:not([data-p^="star-"])')], 0.5, true, 0.3);
    show(tl, [...tablet.querySelectorAll('text')], 0.6);
    pop(tl, parts(svg, 'star-'), 0.8, '50% 50%', 0.1);
    show(tl, part(svg, 'app'), 1.2);
    // the graduate, the cap in the air, and fireworks
    draw(tl, strokes(part(svg, 'grad')), 1.3, 0.6, 0.04);
    show(tl, part(svg, 'grad')!.querySelector('.ac-fill'), 1.7);
    show(tl, part(svg, 'cap'), 1.4, true, 0.2);
    tl.to(part(svg, 'cap'), { keyframes: [{ y: -150, rotation: -200, duration: 0.6, ease: 'power2.out' }, { y: 0, rotation: -360, duration: 0.6, ease: 'power2.in' }], svgOrigin: '590 240' }, 2.0);
    const fws = parts(svg, 'fw-');
    fws.forEach((fw, i) => {
      tl.fromTo(fw, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }, 2.2 + i * 0.25);
      // they keep bursting while the scene is on screen
      loop(idle, gsap.timeline({ repeat: -1, delay: i * 0.7 })
        .fromTo(fw, { opacity: 1, scale: 0.2, transformOrigin: '50% 50%' }, { scale: 1.08, duration: 0.7, ease: 'expo.out' })
        .to(fw, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.5));
    });
    tl.fromTo(part(svg, 'confetti')!.children, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out' }, 2.4);
    write(tl, svg, 'grad-name', 2.6, 1.1);
    show(tl, part(svg, 'degree'), 3.4, true, 0.4);
    loop(idle, gsap.to(part(svg, 'confetti')!.children, { y: 14, rotation: 40, duration: 1.4, ease: 'sine.inOut', stagger: 0.12, yoyo: true, repeat: -1 }));
  },

  reach(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    const browsers = parts(svg, 'browser-');
    browsers.forEach((b, i) => {
      show(tl, b, 0.1 + i * 0.35, true, 0.1);
      draw(tl, strokes(b), 0.1 + i * 0.35, 0.4, 0.02);
    });
    draw(tl, strokes(part(svg, 'cart')), 1.2, 0.4);
    tl.fromTo(parts(svg, 'product-'), { y: -140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.in', stagger: 0.15 }, 1.5);
    pop(tl, parts(svg, 'market-'), 2.0, '50% 50%', 0.12);
    draw(tl, all(...parts(svg, 'feed-')), 2.3, 0.4, 0.12);
    show(tl, part(svg, 'xml'), 2.5);
  },

  ai(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, strokes(part(svg, 'desk')), 0.1, 0.5, 0.05);
    draw(tl, strokes(part(svg, 'reader')), 0.3, 0.5);
    show(tl, part(svg, 'laptop'), 0.7, true, 0.3);
    // the cobalt peak of the courses comes back
    tl.fromTo(part(svg, 'peak'), { x: -420, y: 160, opacity: 0, scale: 0.5, transformOrigin: '50% 100%' }, { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 1.0);
    pop(tl, parts(svg, 'ai-'), 1.8, '50% 50%', 0.15);
  },

  deindeal(tl, svg, _step, idle) {
    // Zurich, opened out over the whole picture, draws itself: the sky, the towers and the guild houses, the river,
    // the bridge (the line coming in from the timeline is its balustrade), the boat
    const zurich = part(svg, 'zurich')!, boat = part(svg, 'boat')!, waves = parts(svg, 'zwave-');
    tl.fromTo(zurich, { x: 0, y: 0, scale: 1, svgOrigin: '0 0' }, { x: 0, y: 0, scale: 1, svgOrigin: '0 0', duration: 0.01 }, 0);
    show(tl, part(svg, 'zframe'), 3.5, true, 0.3);
    draw(tl, strokes(part(svg, 'lead')), 0, 0.3);
    draw(tl, parts(svg, 'zcloud-').flatMap(strokes), 0, 0.6, 0.1);
    write(tl, svg, 'zurich-name', 0.4, 1.1);
    draw(tl, strokes(part(svg, 'city')), 0.1, 0.8, 0.006);
    show(tl, [...zurich.querySelectorAll('.face-r, .face-l, .ac-fill')], 0.7, true, 0.5);
    draw(tl, waves.flatMap(strokes), 0.4, 0.8, 0.06);
    draw(tl, strokes(part(svg, 'bridge')).filter((e) => !e.closest('[data-p="lead"]')), 0.3, 0.6, 0.01);
    draw(tl, strokes(boat), 0.8, 0.5, 0.02);
    // the river flows, the boat glides downstream, the flag flies
    waves.forEach((w, i) => loop(idle, gsap.to(w, { x: (i % 2 ? 1 : -1) * Number(w.dataset.per), duration: 2.6 + i * 0.5, ease: 'none', repeat: -1 })));
    tl.fromTo(boat, { x: -110 }, { x: 0, duration: 4.4, ease: 'sine.out' }, 0.6);
    loop(idle, gsap.to(boat, { y: 2, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    loop(idle, gsap.to(part(svg, 'zflag'), { skewY: 5, scaleX: 0.92, svgOrigin: '712 173', duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    parts(svg, 'zcloud-').forEach((c, i) => loop(idle, gsap.to(c, { x: 24 + i * 10, duration: 9 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    // then it folds into a postcard in the corner, and the work starts
    tl.to(zurich, { x: 30, y: 10, scale: 0.32, svgOrigin: '0 0', duration: 0.8, ease: 'power3.inOut' }, 3.0);
    const W = 3.2;
    // the files tumble in, and down the funnel
    const files = parts(svg, 'file-');
    files.forEach((f, i) => tl.fromTo(f, { opacity: 0, y: -90, rotation: (i % 2 ? 1 : -1) * 30, transformOrigin: '50% 50%' },
      { opacity: 1, y: 0, rotation: (i % 2 ? -1 : 1) * 12, duration: 0.4, ease: 'power2.out' }, W + 0.7 + i * 0.12));
    show(tl, part(svg, 'funnel'), W + 1.2, true, 0.01);
    draw(tl, strokes(part(svg, 'funnel')), W + 1.2, 0.4);
    files.forEach((f, i) => {
      const b = f.getBBox();
      tl.to(f, { x: 480 - (b.x + b.width / 2), y: 220 - (b.y + b.height / 2), rotation: 0, scale: 0.3, opacity: 0, duration: 0.5, ease: 'power2.in' }, W + 1.7 + i * 0.12);
    });
    tl.fromTo(parts(svg, 'stage-'), { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.2 }, W + 2.0);
    // clean products come out, and keep coming
    tl.fromTo(parts(svg, 'card-'), { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.12 }, W + 2.8);
    show(tl, part(svg, 'count'), W + 2.9, true, 0.2);
    count(tl, part(svg, 'count')?.querySelector('[data-count]') ?? null, W + 2.9, 1, 800000, (v) => `${Math.round(v).toLocaleString('en-US')}+`);
    draw(tl, strokes(part(svg, 'refresh')), W + 3.6, 0.4, 0.1);
    show(tl, part(svg, 'refresh')!.querySelector('text'), W + 3.8);
    tl.fromTo(part(svg, 'refresh'), { rotation: 0, svgOrigin: '150 330' }, { rotation: -360, svgOrigin: '150 330', duration: 0.8, ease: 'none' }, W + 4.0);
  },

  side(tl, svg, step) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, [part(svg, 'line')!], 0.1, 1);
    const notes = [...step.querySelectorAll('[data-note]')];
    notes.forEach((_, i) => {
      pop(tl, part(svg, `sdot-${i}`), 0.5 + i * 0.25);
      pop(tl, part(svg, `scard-${i}`), 1.2 + i * 0.5, i === 0 ? '50% 100%' : '50% 0%');
      tl.fromTo(notes[i], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.3 + i * 0.5);
    });
  },

  today(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.5, 0);
    draw(tl, strokes(part(svg, 'one')), 0.5, 0.2);
    draw(tl, strokes(part(svg, 'code')), 0.7, 0.4, 0.1);
    draw(tl, strokes(part(svg, 'link-1')), 1.1, 0.15);
    draw(tl, strokes(part(svg, 'team')), 1.25, 0.4, 0.05);
    draw(tl, strokes(part(svg, 'link-2')), 1.65, 0.1);
    draw(tl, strokes(part(svg, 'maze')), 1.75, 0.4, 0.04);
    draw(tl, strokes(part(svg, 'way')), 2.2, 0.5);
    tl.fromTo(parts(svg, 'role-'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.5 }, 1.1);
  },
};

/** The journey, taken by hand: dragged sideways (left goes on, right goes back, as if pulling the track), or
 *  sent all the way back, and on again, by its button. Taking it over stops it riding by itself. */
function byHand(tl: Tl, step: HTMLElement, ride: NonNullable<ReturnType<typeof journey>>, ends: number) {
  const box = step.querySelector<HTMLElement>('.ms-coaster');
  const button = step.querySelector<HTMLButtonElement>('[data-ride]');
  if (!box || !button || box.dataset.byHand) return;
  box.dataset.byHand = '1';
  let going: gsap.core.Tween | null = null;
  const label = () => {
    const back = ride.state.p > 0.5;
    button.dataset.dir = back ? 'back' : 'on';
    button.querySelector('[data-ride-label]')!.textContent = back ? button.dataset.back! : button.dataset.again!;
  };
  const takeOver = () => {
    if (tl.isActive()) tl.pause();
    going?.kill();
    gsap.set(ride.station, { opacity: 1 });
  };
  // the scene starting again lets go of the ride
  tl.call(() => { going?.kill(); ride.state.max = 0; }, [], 0.01);
  tl.call(label, [], ends);
  button.addEventListener('click', () => {
    takeOver();
    const to = ride.state.p > 0.5 ? 0 : 1;
    going = gsap.to(ride.state, { p: to, duration: 1.2 + 4.8 * Math.abs(to - ride.state.p), ease: 'power1.inOut', onUpdate: ride.place, onComplete: label });
  });
  let x0 = 0, p0 = 0, dragging = false;
  box.addEventListener('pointerdown', (e) => {
    takeOver();
    dragging = true; x0 = e.clientX; p0 = ride.state.p;
    box.setPointerCapture(e.pointerId);
    box.classList.add('dragging');
  });
  box.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    ride.state.p = gsap.utils.clamp(0, 1, p0 - (e.clientX - x0) / (box.clientWidth * 2.2));
    ride.place();
  });
  const end = () => { if (!dragging) return; dragging = false; box.classList.remove('dragging'); label(); };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
}

/** The journey on show (the wide drawing or the narrow one): the train rides the rollercoaster from station to
 *  station, every car set on the track and turned with it, its wheels turning and its rod driving; a camera follows
 *  it (the hills and the clouds slower, for depth), but never past either end; each station's skill drops into its
 *  wagon as the train reaches it; the year, the course count and a course's name follow, the moments of those years
 *  appear as the train nears them, and the lines beside it are read one after another. */
function journey(step: HTMLElement) {
  const svg = [...step.querySelectorAll<SVGSVGElement>('.ms-coaster svg')].find((v) => v.getClientRects().length);
  if (!svg) return null;
  const W = svg.viewBox.baseVal.width, world = Number(svg.dataset.world);
  const near = part(svg, 'near')!, far = part(svg, 'far')!, clouds = part(svg, 'clouds')!;
  const track = part(svg, 'track') as SVGPathElement, station = part(svg, 'station')!, rod = part(svg, 'rod');
  const L = track.getTotalLength();
  const cars = [0, 1, 2, 3].map((k) => part(svg, `car-${k}`)!).map((el) => ({ el, len: Number(el.dataset.len) }));
  const wheels = parts(svg, 'wheel-').map((w) => ({ el: w, cx: Number(w.dataset.cx), cy: Number(w.dataset.cy), r: Number(w.dataset.r) }));
  const drivers = wheels.filter((w) => w.r === 18);
  const crates = [...svg.querySelectorAll<SVGGElement>('[data-at]')].map((c) => ({ el: c, at: Number(c.dataset.at) }));
  const moments = parts(svg, 'moment-').map((m) => ({ el: m, x: Number(m.dataset.x) }));
  const lines = [...step.querySelectorAll<HTMLElement>('[data-line-at]')].map((l) => ({ el: l, at: Number(l.dataset.lineAt) }));
  const names = [...step.querySelectorAll('.ms-course-list li')].map((li) => li.textContent ?? '');
  const nameEl = step.querySelector('[data-course-name]');
  const nEl = step.querySelector('[data-course-n]');
  const yearEl = step.querySelector('[data-course-year]');
  const total = Number(step.querySelector<HTMLElement>('[data-course]')?.dataset.total ?? names.length);
  const [y0, y1] = (step.querySelector<HTMLElement>('[data-course]')?.dataset.years ?? '2009,2016').split(',').map(Number);
  // the track, sampled once: where each station's stop is along it, and a camera that only moves forward with it
  // (in the loop the train turns back for a moment; the camera waits for it)
  const N = Math.ceil(L / 4);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i <= N; i++) { const q = track.getPointAtLength((i / N) * L); xs.push(q.x); ys.push(q.y); }
  const camX: number[] = [];
  xs.forEach((x, i) => camX.push(Math.max(x, camX[i - 1] ?? x)));
  const ground = ys[0];
  const stopS: number[] = [];
  const stopX = parts(svg, 'stop-').map((st) => Number(st.dataset.x));
  let from = 0;
  stopX.forEach((x) => {
    let i = from;
    while (i < N && !(Math.abs(xs[i] - x) < 3 && Math.abs(ys[i] - ground) < 1)) i++;
    stopS.push((i / N) * L);
    from = i;
  });
  const s0 = stopS[0], s1 = stopS[stopS.length - 1];
  const stops = stopS.map((v) => (v - s0) / (s1 - s0));
  const TRAIN = cars.reduce((n, c) => n + c.len + 12, -12);
  const at = (d: number) => track.getPointAtLength(gsap.utils.clamp(0, L, d));
  // how much of the world the window takes in as the train goes: at first the engine and the skills it set off
  // with; at every station, all it carries by then; at the end of the line, the whole train and the station. It
  // only grows, so the more the train has on board, the smaller it looks
  // (ahead of the engine: room for the station's sign)
  const AHEAD = 130, BEHIND = 40, TOP = 96, BOTTOM = ground + 48;
  const carried: { at: number; d: number }[] = [];
  let along = 0;
  cars.forEach((c) => {
    c.el.querySelectorAll<SVGGElement>('[data-at]').forEach((g) => carried.push({ at: Number(g.dataset.at), d: along + c.len / 2 - g.getBBox().x }));
    along += c.len + 12;
  });
  const need = (j: number) => Math.max(0, ...carried.filter((c) => c.at <= j).map((c) => c.d)) + AHEAD + BEHIND;
  const end = station.getBBox();
  const first = need(0), last = TRAIN + end.x + end.width - stopX[stopX.length - 1] + 2 * BEHIND;
  const reaches: number[] = [];
  stops.forEach((q, j) => reaches.push(Math.max(first + (last - first) * q, need(j), j ? reaches[j - 1] + 30 : 0)));
  const reach = (p: number) => {
    let j = 1;
    while (j < stops.length - 1 && p > stops[j]) j++;
    return gsap.utils.interpolate(reaches[j - 1], reaches[j], gsap.utils.clamp(0, 1, (p - stops[j - 1]) / (stops[j] - stops[j - 1])));
  };
  // the window: the part of the drawing its box shows (the drawing is cut to fill the box), measured as it resizes
  const H = svg.viewBox.baseVal.height;
  const view = { x: 0, y: 0, w: W, h: H };
  const measure = () => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const k = Math.max(r.width / W, r.height / H);
    Object.assign(view, { w: r.width / k, h: r.height / k, x: (W - r.width / k) / 2, y: (H - r.height / k) / 2 });
  };
  measure();
  let counted = -1, named = -1, read = -1, lineW = 0;
  // p: where the train is (0 to 1); max: how far it has been
  const state = { p: 0, max: 0 };
  const place = () => {
    const p = state.p;
    state.max = Math.max(state.max, p);
    const s = s0 + p * (s1 - s0);
    // every car on the track, turned with it
    let back = 0;
    cars.forEach((c) => {
      const d = s - back - c.len / 2;
      back += c.len + 12;
      const q = at(d), a = at(d - 4), b = at(d + 4);
      c.el.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI).toFixed(2)})`);
    });
    // the camera pulls back as the train goes (see reach), the picture kept in the middle of the window: the whole
    // train in it once it fits, with the way ahead (until then, the engine and what it carries)
    const fx = camX[Math.round((gsap.utils.clamp(0, L, s) / L) * N)];
    const z = Math.min(1, view.w / reach(p), view.h / (BOTTOM - TOP)), span = view.w / z;
    const left = gsap.utils.clamp(0, world - span, Math.max(fx - TRAIN - BEHIND, fx + AHEAD - span));
    // the hills behind pull back less, and slower; the clouds stay up in the sky
    const look = (g: Element, depth: number, pull: number, sky = false) => {
      const k = 1 - (1 - z) * pull;
      const y = sky ? view.y : view.y + (view.h - k * (TOP + BOTTOM)) / 2;
      g.setAttribute('transform', `translate(${(view.x - k * left * depth).toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(4)})`);
    };
    look(near, 1, 1);
    look(far, 0.35, 0.55);
    look(clouds, 0.15, 0.3, true);
    // the lines thin less than the drawing shrinks, so they still read
    const sw = Math.round(20 / Math.sqrt(z)) / 20;
    if (sw !== lineW) { lineW = sw; svg.style.setProperty('--sw', String(sw)); }
    // the wheels turn with the distance; the rod rides the drivers' cranks
    const run = s - s0;
    wheels.forEach((w) => w.el.setAttribute('transform', `rotate(${(((run / w.r) * 180) / Math.PI).toFixed(1)} ${w.cx} ${w.cy})`));
    if (rod && drivers.length === 2) {
      const a = run / drivers[0].r, c = 9;
      const [d0, d1] = drivers;
      rod.setAttribute('d', `M${(d0.cx + c * Math.cos(a)).toFixed(1)} ${(d0.cy + c * Math.sin(a)).toFixed(1)}L${(d1.cx + c * Math.cos(a)).toFixed(1)} ${(d1.cy + c * Math.sin(a)).toFixed(1)}`);
    }
    // a station's skill comes on board once the train has reached it
    crates.forEach((c) => { if (c.at > 0) c.el.classList.toggle('loaded', s >= stopS[c.at] - 2); });
    moments.forEach((m) => m.el.classList.toggle('seen', fx > m.x - 520));
    // 49 courses, 2009 to 2016; the named ones are some of the most serious
    const n = Math.max(1, Math.round(p * total));
    if (n !== counted) {
      counted = n;
      if (nEl) nEl.textContent = `${n} / ${total}`;
      if (yearEl) yearEl.textContent = String(Math.min(y1, y0 + Math.floor(p * (y1 - y0 + 1))));
    }
    const k = Math.min(names.length - 1, Math.floor(p * names.length));
    if (k !== named) { named = k; if (nameEl) nameEl.textContent = names[k]; }
    // the line being read: the last one reached
    let li = 0;
    lines.forEach((l, i) => { if (p >= l.at) li = i; });
    if (li !== read) { read = li; lines.forEach((l, i) => l.el.classList.toggle('on', i === li)); }
  };
  place();
  new ResizeObserver(() => { measure(); place(); }).observe(svg);
  return { state, place, station, stops };
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

export function myStory(root: HTMLElement) {
  const steps = [...root.querySelectorAll<HTMLElement>('[data-scene]')];
  const rail = root.querySelector<HTMLElement>('.ms-rail');
  const items = [...(rail?.querySelectorAll<HTMLElement>('[data-rail]') ?? [])];
  const now = rail?.querySelector<HTMLElement>('[data-rail-now]');
  const fills = [...(rail?.querySelectorAll<HTMLElement>('[data-rail-ink], [data-rail-cob]') ?? [])];

  // the timeline follows the story: the scene on screen lit, the ones before it passed, the lines filled to it
  const active = (i: number) => {
    items.forEach((li, k) => { li.classList.toggle('past', k < i); li.classList.toggle('now', k === i); });
    if (now) now.textContent = items[i]?.querySelector('.ms-year')?.textContent ?? '';
    rail?.classList.toggle('side-on', steps[i]?.dataset.scene === 'side');
  };
  steps.forEach((step, i) => ScrollTrigger.create({ trigger: step, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && active(i) }));
  ScrollTrigger.create({
    trigger: root.querySelector('.ms-steps'), start: 'top 50%', end: 'bottom 50%',
    onUpdate: (s) => fills.forEach((f) => f.style.setProperty('--fill', s.progress.toFixed(4))),
  });

  gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    if (ctx.conditions?.still) {
      // reduced motion: each scene as it ends, fading in as it arrives; the cart waits at its station
      const studies = steps.find((s) => s.dataset.scene === 'studies');
      const ride = studies ? journey(studies) : null;
      if (ride) { ride.state.p = 1; ride.place(); }
      // the chapters go beat by beat, each picture shown drawn
      const chapters = steps.map((s) => CHAPTERS[s.dataset.scene ?? '']?.(s, true) ?? null);
      const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('seen')), { threshold: 0.15 });
      steps.forEach((s) => io.observe(s));
      return () => { io.disconnect(); chapters.forEach((c) => c?.kill()); };
    }
    root.classList.add('on');
    // the chapters: told in beats, with a stop for each (src/scripts/chapter.ts)
    const chapters = steps.map((s) => CHAPTERS[s.dataset.scene ?? '']?.(s, false) ?? null);
    const plays = steps.map((step) => {
      // the picture on show (the journey is drawn twice, wide and narrow)
      const svg = [...step.querySelectorAll<SVGSVGElement>('.ms-art svg')].find((v) => v.getClientRects().length) ?? null;
      const scene = SCENES[step.dataset.scene ?? ''];
      if (!svg || !scene) return null;
      const tl = gsap.timeline({ paused: true });
      const idle: gsap.core.Animation[] = [];
      // the words arrive first: the label, the title, the line
      tl.fromTo(step.querySelectorAll('[data-t]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, 0);
      scene(tl, svg, step, idle);
      return { tl, idle };
    });
    // a scene plays as it arrives, from either side, and rests once it has gone
    steps.forEach((step, i) => {
      const play = plays[i];
      if (!play) return;
      const go = () => { play.tl.restart(); play.idle.forEach((a) => a.play()); };
      const rest = () => { play.tl.pause(); play.idle.forEach((a) => a.pause()); };
      ScrollTrigger.create({ trigger: step, start: 'top 75%', end: 'bottom 25%', onEnter: go, onEnterBack: go, onLeave: rest, onLeaveBack: rest });
    });
    // one scroll, one scene: within the story the page settles on the next scene in the direction it moved
    const track = root.querySelector<HTMLElement>('.ms-steps')!;
    const points: number[] = [];
    // each scene is as tall as it needs, so they sit close together: the page settles with the scene in the middle
    // of what is free of the bar (and, on a phone, of the timeline strip and the floating menu). It takes hold as
    // the story comes up the screen, so the first scene is the first stop; the start and the end are stops too,
    // so a scroll past the first or the last scene leaves the story
    const phone = window.matchMedia('(max-width: 860px)');
    const snap = ScrollTrigger.create({
      trigger: track, start: 'top 60%', end: 'bottom center',
      onRefresh: (self) => {
        const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72;
        const top = bar + (phone.matches ? (rail?.offsetHeight ?? 0) : 0);
        const bottom = window.innerHeight - (phone.matches ? 90 : 0);
        points.length = 0;
        points.push(0);
        steps.forEach((s) => {
          const ch = chapters[steps.indexOf(s)];
          if (ch) { ch.points().forEach((y) => points.push(gsap.utils.clamp(0, 1, (y - self.start) / Math.max(1, self.end - self.start)))); return; }
          const y = s.getBoundingClientRect().top + window.scrollY, h = s.offsetHeight;
          // in the middle of the free space; a scene taller than it starts at its top
          const at = h > bottom - top ? y - top : y + h / 2 - (top + bottom) / 2;
          points.push(gsap.utils.clamp(0, 1, (at - self.start) / Math.max(1, self.end - self.start)));
        });
        points.push(1);
      },
      snap: {
        snapTo: (value: number, self?: ScrollTrigger) => ScrollTrigger.snapDirectional(points)(value, self?.direction),
        duration: { min: 0.25, max: 0.6 }, delay: 0.04, ease: 'power2.inOut', inertia: false,
      },
    });
    ScrollTrigger.refresh();
    return () => { root.classList.remove('on'); snap.kill(); plays.forEach((p) => p?.tl.kill()); chapters.forEach((c) => c?.kill()); };
  });
}
