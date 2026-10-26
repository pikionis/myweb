import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

/*
 * "My story" on /about (src/components/MyStory.astro). Every scene is a screen: one scroll brings the next one
 * (the page settles on it), and it plays by itself, its picture drawing itself (MyStoryArt.astro, authored as it
 * ends) while its words arrive; some keep a small motion of their own while on screen (the sea, the light, the
 * fireworks). The timeline on the left (on a phone, the strip at the top) follows: the career line fills, the
 * cobalt line of client work beside it, the current scene lit; the client-work scene brings that line forward.
 * With reduced motion every scene is shown as it ends, one after another, and simply fades in as it arrives.
 */

gsap.registerPlugin(ScrollTrigger, TextPlugin);

type Tl = gsap.core.Timeline;
type El = Element | null;
const part = (root: Element, p: string) => root.querySelector<SVGGraphicsElement>(`[data-p="${p}"]`);
const parts = (root: Element, prefix: string) => [...root.querySelectorAll<SVGGraphicsElement>(`[data-p^="${prefix}"]`)];
/** the strokes of a part that draw on (itself, if it is one) */
const strokes = (el: El): Element[] => (!el ? [] : el.matches('.sa-d') ? [el] : [...el.querySelectorAll('.sa-d')]);
const all = (...els: El[]) => els.flatMap(strokes);

/** the soft shadows of the solid shapes among these strokes (each sits just before its shape) */
const shades = (els: Element[]) => els.map((e) => e.previousElementSibling).filter((e): e is Element => !!e?.matches('.shade'));
const draw = (tl: Tl, els: Element[], at: number, duration = 0.6, stagger = 0.03) => {
  if (!els.length) return;
  tl.fromTo(els, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration, ease: 'power1.inOut', stagger }, at);
  const sh = shades(els);
  if (sh.length) tl.fromTo(sh, { opacity: 0 }, { opacity: 1, duration: duration * 0.8, ease: 'power1.out' }, at + duration * 0.4);
};
const undraw = (tl: Tl, els: Element[], at: number, duration = 0.4) => {
  if (!els.length) return;
  tl.to(els, { strokeDashoffset: 1.01, duration, ease: 'power1.in' }, at);
  const sh = shades(els);
  if (sh.length) tl.to(sh, { opacity: 0, duration: duration * 0.6 }, at);
};
/** a block's faces fill in once its edges are drawn */
const faces = (tl: Tl, root: Element, prefix: string, at: number, stagger = 0.1) =>
  void tl.fromTo(root.querySelectorAll(`[data-p^="${prefix}"][data-p$="-faces"]`), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger, ease: 'power1.out' }, at);
/** a part that rests hidden shows (set up in advance), or one that rests shown leaves (at its moment) */
const show = (tl: Tl, el: El | El[], at: number, on = true, duration = 0.25) =>
  void tl.fromTo(el, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0, duration, ease: 'power1.out', immediateRender: on }, at);
const pop = (tl: Tl, el: El | El[], at: number, origin = '50% 50%', stagger = 0) =>
  void tl.fromTo(el, { opacity: 0, scale: 0.6, transformOrigin: origin }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', stagger }, at);
/** words are written in */
const type = (tl: Tl, el: El, at: number, duration: number) =>
  void (el && tl.fromTo(el, { text: '' }, { text: el.textContent ?? '', duration, ease: 'none' }, at));
/** a number counts up to what the picture says */
const count = (tl: Tl, el: El, at: number, duration: number, to: number, format: (v: number) => string) => {
  if (!el) return;
  const o = { v: 0 };
  gsap.set(el, { text: format(0) });
  tl.fromTo(o, { v: 0 }, { v: to, duration, ease: 'power1.out', onUpdate: () => { el.textContent = format(o.v); } }, at);
};

/** a scene's timeline, its svg, its step, and its idle motions (loops that run while it is on screen) */
type Scene = (tl: Tl, svg: SVGSVGElement, step: HTMLElement, idle: gsap.core.Animation[]) => void;
/** a motion that runs on its own while its scene is on screen */
const loop = (idle: gsap.core.Animation[], a: gsap.core.Animation) => { a.pause(); idle.push(a); };

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
    const harbour = part(svg, 'harbour')!, campus = part(svg, 'campus')!;
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, strokes(part(svg, 'sun')), 0.05, 0.5, 0.02);
    // the harbour, its houses rising off the page, the lighthouse, the sea coming in
    draw(tl, strokes(harbour).filter((e) => !e.closest('[data-p="sun"], [data-p^="wave-"], [data-p="boat"]')), 0.15, 0.6, 0.012);
    faces(tl, harbour, 'house-', 0.7); faces(tl, harbour, 'mosque', 0.8); faces(tl, harbour, 'lh-base', 0.9);
    const waves = parts(svg, 'wave-');
    draw(tl, waves.flatMap(strokes), 0.3, 0.8, 0.12);
    draw(tl, strokes(part(svg, 'boat')), 0.9, 0.4);
    show(tl, part(svg, 'boat')!.querySelector('.ac-fill'), 1.1);
    show(tl, [part(svg, 'beam-r'), part(svg, 'beam-l')], 1.1, true, 0.3);
    // the sea moves, the boat rocks, the lighthouse turns its light
    waves.forEach((w, i) => loop(idle, gsap.to(w, { x: i % 2 ? Number(w.dataset.per) : -Number(w.dataset.per), duration: 3.2 + i * 0.7, ease: 'none', repeat: -1 })));
    loop(idle, gsap.to(part(svg, 'boat'), { y: 5, rotation: 3, svgOrigin: '470 390', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    loop(idle, gsap.timeline({ repeat: -1 }).to(part(svg, 'beam-r'), { opacity: 0.15, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 })
      .to(part(svg, 'beam-l'), { opacity: 0.15, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 }));
    // then the harbour gives way to the university, and its students
    tl.to(harbour, { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 2.6);
    tl.fromTo(campus, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: true }, 3.0);
    draw(tl, strokes(campus), 3.0, 0.7, 0.015);
    faces(tl, campus, 'uni-', 3.5, 0.12);
    show(tl, campus.querySelector('text'), 3.8);
    const students = parts(svg, 'student-').filter((e) => !e.dataset.p!.endsWith('-legs'));
    tl.fromTo(students, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.12 }, 3.8);
    students.forEach((st, i) => {
      loop(idle, gsap.to(st, { x: i % 2 ? -26 : 26, duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      loop(idle, gsap.to(st.querySelector('[data-p$="-legs"]'), { scaleX: -1, transformOrigin: '50% 0%', duration: 0.35, ease: 'none', yoyo: true, repeat: -1 }));
    });
  },

  firstyear(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, strokes(part(svg, 'board')), 0.05, 0.5, 0.05);
    [...svg.querySelectorAll('[data-line]')].forEach((line, i) => type(tl, line, 0.4 + i * 0.35, 0.3));
    // C++, then Java
    const cpp = part(svg, 'cpp')!, java = part(svg, 'java')!;
    draw(tl, strokes(cpp), 0.5, 0.4);
    show(tl, [...cpp.querySelectorAll('circle'), cpp.querySelector('.muted')], 0.7);
    [...cpp.querySelectorAll('[data-type]')].forEach((line, i) => type(tl, line, 0.8 + i * 0.18, 0.16));
    draw(tl, strokes(java), 1.9, 0.4);
    show(tl, [...java.querySelectorAll('circle, .ac-fill'), java.querySelector('.muted')], 2.1);
    [...java.querySelectorAll('[data-type]')].forEach((line, i) => type(tl, line, 2.2 + i * 0.2, 0.18));
    // and their student
    draw(tl, strokes(part(svg, 'desk')), 0.2, 0.4);
    draw(tl, strokes(part(svg, 'student')), 0.4, 0.5);
    show(tl, [part(svg, 'arms'), part(svg, 'cheer')], 3.1, true, 0.05);
    draw(tl, all(part(svg, 'arms'), part(svg, 'cheer')), 3.1, 0.3, 0.05);
    tl.to(part(svg, 'student'), { keyframes: [{ y: -10, duration: 0.15 }, { y: 0, duration: 0.15 }] }, 3.15);
  },

  postgres(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    const er = part(svg, 'er');
    draw(tl, all(...parts(svg, 'ent-')), 0.1, 0.6, 0.02);
    draw(tl, strokes(er), 0.6, 0.4, 0.05);
    show(tl, [...er!.querySelectorAll('text')], 0.7);
    // one wide, messy table...
    const segs = parts(svg, 'seg-');
    gsap.set(segs[1], { x: -55 });
    gsap.set(segs[2], { x: -110 });
    draw(tl, all(...segs), 1.1, 0.5, 0.01);
    show(tl, part(svg, 'messy'), 1.5);
    // ...splits through the normal forms
    const nf = [...svg.querySelectorAll('[data-nf]')];
    gsap.set(nf, { opacity: 0 });
    nf.forEach((n, i) => {
      tl.to(n, { opacity: 1, duration: 0.15 }, 1.9 + i * 0.45);
      if (i < nf.length - 1) tl.to(n, { opacity: 0, duration: 0.15 }, 2.3 + i * 0.45);
    });
    tl.to(segs, { x: 0, duration: 0.9, ease: 'power2.inOut' }, 2.2);
    show(tl, part(svg, 'messy'), 2.2, false, 0.4);
    // and join again
    draw(tl, strokes(part(svg, 'join')), 3.5, 0.4, 0.1);
    show(tl, part(svg, 'join')!.querySelector('text'), 3.6);
    pop(tl, parts(svg, 'tag-'), 3.9, '50% 50%', 0.09);
  },

  courses(tl, _svg, step) {
    const ride = coaster(step);
    if (!ride) return;
    tl.fromTo(ride.state, { p: 0 }, { p: 1, duration: 7, ease: 'power1.inOut', onUpdate: ride.place }, 0.3);
    show(tl, ride.station, 6.6, true, 0.3);
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
    // 2019: campaigns against the clock
    show(tl, browsers, 3.1, false, 0.3);
    const campaign = part(svg, 'campaign');
    show(tl, campaign, 3.2, true, 0.1);
    draw(tl, strokes(campaign), 3.25, 0.6, 0.03);
    tl.fromTo(part(svg, 'hand'), { rotation: 0, svgOrigin: '130 150' }, { rotation: 720, svgOrigin: '130 150', duration: 1.4, ease: 'none' }, 3.8);
    const clock = svg.querySelector('[data-clock]');
    const left = { s: 59 };
    tl.fromTo(left, { s: 59 }, { s: 0, duration: 1.4, ease: 'none', onUpdate: () => { if (clock) clock.textContent = `23:59:${String(Math.round(left.s)).padStart(2, '0')}`; } }, 3.8);
  },

  kalimera(tl, svg, step) {
    const notes = [...step.querySelectorAll('[data-note]')];
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, strokes(part(svg, 'phone')), 0.1, 0.5);
    // a sun rises on the screen: good morning
    tl.fromTo(part(svg, 'sun'), { y: 80 }, { y: 0, duration: 0.6, ease: 'power2.out' }, 0.6);
    draw(tl, strokes(part(svg, 'sun')), 0.6, 0.5);
    draw(tl, strokes(part(svg, 'horizon')), 0.6, 0.3);
    show(tl, notes[0], 1.0);
    // the team, and the businesses on it
    parts(svg, 'team-').forEach((m, i) => draw(tl, strokes(m), 1.3 + i * 0.1, 0.3));
    count(tl, part(svg, 'count')?.querySelector('[data-count]') ?? null, 1.6, 0.9, 80, (v) => `${Math.round(v)}${v >= 79.5 ? '+' : ''}`);
    // the pitch, the prize, the door, and what it taught
    const pitch = part(svg, 'pitch'), trophy = part(svg, 'trophy'), door = part(svg, 'door'), board = part(svg, 'board');
    gsap.set(board, { opacity: 0 });
    show(tl, pitch, 2.6, true, 0.1); draw(tl, strokes(pitch), 2.6, 0.5, 0.03);
    show(tl, pitch, 3.3, false, 0.2);
    show(tl, trophy, 3.4, true, 0.1); draw(tl, strokes(trophy), 3.4, 0.5, 0.05); show(tl, notes[1], 3.6);
    show(tl, trophy, 4.2, false, 0.2);
    show(tl, door, 4.3, true, 0.1); draw(tl, strokes(door), 4.3, 0.4, 0.04);
    tl.fromTo(part(svg, 'panel'), { scaleX: 1, transformOrigin: '0% 50%' }, { scaleX: 0.22, transformOrigin: '0% 50%', duration: 0.5, ease: 'power2.inOut' }, 4.8);
    show(tl, notes[2], 4.9);
    show(tl, door, 5.5, false, 0.2);
    tl.to(board, { opacity: 1, duration: 0.2 }, 5.6);
    draw(tl, strokes(board).slice(0, 3), 5.6, 0.4);
    tl.fromTo(parts(svg, 'word-'), { y: -220, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.in', stagger: 0.14 }, 5.9);
  },

  koan(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    parts(svg, 'isle-').forEach((isle, i) => {
      draw(tl, strokes(isle), 0.1 + i * 0.3, 0.6);
      show(tl, isle.querySelector('text'), 0.5 + i * 0.3);
    });
    show(tl, part(svg, 'net'), 1.3, true, 0.4);
    const jira = part(svg, 'jira');
    show(tl, jira, 1.8, true, 0.1); draw(tl, strokes(jira), 1.8, 0.5, 0.03);
    parts(svg, 'role-').forEach((r, i) => { draw(tl, strokes(r), 2.3 + i * 0.15, 0.4); show(tl, r.querySelector('text'), 2.5 + i * 0.15); });
    pop(tl, part(svg, 'budget'), 2.9);
    // the consortium: eight around the fund
    show(tl, jira, 3.4, false, 0.3);
    draw(tl, strokes(part(svg, 'ring')), 3.5, 0.6, 0.06);
    show(tl, [...part(svg, 'ring')!.querySelectorAll('text')], 3.9);
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

  deindeal(tl, svg) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, strokes(part(svg, 'zurich')), 0.1, 0.6, 0.1);
    show(tl, part(svg, 'zurich')!.querySelector('text'), 0.6);
    // the files tumble in, and down the funnel
    const files = parts(svg, 'file-');
    files.forEach((f, i) => tl.fromTo(f, { opacity: 0, y: -90, rotation: (i % 2 ? 1 : -1) * 30, transformOrigin: '50% 50%' },
      { opacity: 1, y: 0, rotation: (i % 2 ? -1 : 1) * 12, duration: 0.4, ease: 'power2.out' }, 0.7 + i * 0.12));
    draw(tl, strokes(part(svg, 'funnel')), 1.2, 0.4);
    files.forEach((f, i) => {
      const b = f.getBBox();
      tl.to(f, { x: 480 - (b.x + b.width / 2), y: 220 - (b.y + b.height / 2), rotation: 0, scale: 0.3, opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.7 + i * 0.12);
    });
    tl.fromTo(parts(svg, 'stage-'), { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.2 }, 2.0);
    // clean products come out, and keep coming
    tl.fromTo(parts(svg, 'card-'), { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.12 }, 2.8);
    count(tl, part(svg, 'count')?.querySelector('[data-count]') ?? null, 2.9, 1, 800000, (v) => `${Math.round(v).toLocaleString('en-US')}+`);
    draw(tl, strokes(part(svg, 'refresh')), 3.6, 0.4, 0.1);
    show(tl, part(svg, 'refresh')!.querySelector('text'), 3.8);
    tl.fromTo(part(svg, 'refresh'), { rotation: 0, svgOrigin: '150 330' }, { rotation: -360, svgOrigin: '150 330', duration: 0.8, ease: 'none' }, 4.0);
  },

  side(tl, svg, step) {
    draw(tl, strokes(part(svg, 'lead')), 0, 0.2);
    draw(tl, [part(svg, 'line')!], 0.1, 1);
    const notes = [...step.querySelectorAll('[data-note]')];
    [0, 1, 2].forEach((i) => {
      pop(tl, part(svg, `sdot-${i}`), 0.5 + i * 0.25);
      pop(tl, part(svg, `scard-${i}`), 1.2 + i * 0.5, i === 1 ? '50% 0%' : '50% 100%');
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

/** The rollercoaster on show (along on a wide screen, down on a phone): its cart rides the track, the camera
 *  keeps it in the middle, each course lights as the cart passes. */
function coaster(step: HTMLElement) {
  const svg = [...step.querySelectorAll<SVGSVGElement>('.ms-coaster svg')].find((s) => s.getClientRects().length);
  if (!svg) return null;
  const track = svg.querySelector<SVGPathElement>('[data-p="track"]')!;
  const world = svg.querySelector<SVGGElement>('[data-p="world"]')!;
  const cart = svg.querySelector<SVGGElement>('[data-p="cart"]')!;
  const station = svg.querySelector<SVGGElement>('[data-p="station"]')!;
  const peak = svg.querySelector<SVGPathElement>('[data-p="peak"]')!;
  const stops = [...svg.querySelectorAll<SVGCircleElement>('[data-p="stop"]')];
  const vertical = cart.hasAttribute('data-vertical');
  const vb = svg.viewBox.baseVal;
  const L = track.getTotalLength();
  // where along the track each course sits
  const samples = Array.from({ length: 900 }, (_, i) => { const l = (i / 899) * L; const p = track.getPointAtLength(l); return [l, p.x, p.y]; });
  const at = stops.map((s) => {
    const x = Number(s.getAttribute('cx')), y = Number(s.getAttribute('cy'));
    return samples.reduce((best, [l, px, py]) => ((px - x) ** 2 + (py - y) ** 2 < best[1] ? [l, (px - x) ** 2 + (py - y) ** 2] : best), [0, Infinity])[0];
  });
  const names = [...step.querySelectorAll('.ms-course-list li')].map((li) => li.textContent ?? '');
  const nameEl = step.querySelector('[data-course-name]');
  const nEl = step.querySelector('[data-course-n]');
  const yearEl = step.querySelector('[data-course-year]');
  const total = Number(step.querySelector<HTMLElement>('[data-course]')?.dataset.total ?? names.length);
  const [y0, y1] = (step.querySelector<HTMLElement>('[data-course]')?.dataset.years ?? '2009,2016').split(',').map(Number);
  // the moments of those years: each shows as the cart nears its stop
  const momentAt = (svg.dataset.moments ?? '').split(',').filter(Boolean).map(Number);
  const moments = momentAt.map((_, i) => svg.querySelector<SVGGElement>(`[data-p="moment-${i}"]`));
  let counted = -1;
  const peakFrom = at[Math.max(0, stops.findIndex((s) => s.classList.contains('ac-fill')) - 1)];
  let shown = -1;
  const state = { p: 0 };
  const place = () => {
    const len = state.p * L;
    const pt = track.getPointAtLength(len), ahead = track.getPointAtLength(Math.min(L, len + 3)), behind = track.getPointAtLength(Math.max(0, len - 3));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    cart.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${angle})`);
    world.setAttribute('transform', vertical ? `translate(0 ${vb.height / 2 - pt.y})` : `translate(${vb.width / 2 - pt.x} 0)`);
    // the track lays itself a little ahead of the cart; the cobalt peak once the cart nears it
    track.style.strokeDashoffset = String(Math.max(0, 1 - Math.min(1, state.p + 0.05)));
    peak.style.opacity = len >= peakFrom ? '1' : '0';
    let k = 0;
    at.forEach((l, i) => { if (len >= l - 2) k = i; stops[i].classList.toggle('passed', len >= l - 2); });
    moments.forEach((m, i) => m?.classList.toggle('seen', len >= at[Math.max(0, momentAt[i] - 1)] - 2));
    if (k !== shown) {
      shown = k;
      if (nameEl) nameEl.textContent = names[k];
    }
    // all 49 courses go by, from 2009 to 2016; the named ones are some of them
    const n = Math.max(1, Math.round(state.p * total));
    if (n !== counted) {
      counted = n;
      if (nEl) nEl.textContent = `${n} / ${total}`;
      if (yearEl) yearEl.textContent = String(Math.min(y1, y0 + Math.floor(state.p * (y1 - y0 + 1))));
    }
  };
  place();
  return { state, place, station };
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
      const courses = steps.find((s) => s.dataset.scene === 'courses');
      const ride = courses ? coaster(courses) : null;
      if (ride) { ride.state.p = 1; ride.place(); }
      const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('seen')), { threshold: 0.15 });
      steps.forEach((s) => io.observe(s));
      return () => io.disconnect();
    }
    root.classList.add('on');
    const plays = steps.map((step) => {
      const svg = step.querySelector<SVGSVGElement>('.ms-art svg');
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
      ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 40%', onEnter: go, onEnterBack: go, onLeave: rest, onLeaveBack: rest });
    });
    // one scroll, one scene: within the story the page settles on the next scene in the direction it moved
    const track = root.querySelector<HTMLElement>('.ms-steps')!;
    const points: number[] = [];
    // it takes hold as the story comes up the screen, so the first scene is the first stop; the start itself is a
    // stop too, so a scroll up from the first scene leaves the story
    const snap = ScrollTrigger.create({
      trigger: track, start: 'top 60%', end: 'bottom bottom',
      onRefresh: (self) => {
        points.length = 0;
        points.push(0);
        steps.forEach((s) => points.push(Math.min(1, (s.getBoundingClientRect().top + window.scrollY - self.start) / Math.max(1, self.end - self.start))));
      },
      snap: {
        snapTo: (value: number, self?: ScrollTrigger) => ScrollTrigger.snapDirectional(points)(value, self?.direction),
        duration: { min: 0.25, max: 0.6 }, delay: 0.04, ease: 'power2.inOut', inertia: false,
      },
    });
    ScrollTrigger.refresh();
    return () => { root.classList.remove('on'); snap.kill(); plays.forEach((p) => p?.tl.kill()); };
  });
}
