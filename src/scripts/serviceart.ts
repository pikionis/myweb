import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

/*
 * The drawings on the /services cards (src/components/ServiceArt.astro) play as short stories when a card
 * opens: each is authored as it ends, and its timeline starts from nothing. The guest and the bot talk until
 * the guest is delighted; the website builds itself and gets ready for AI; five tools fold into one system that
 * answers in plain words; a product is written, translated and kept in sync with the marketplaces; an AI
 * answers with your business first. Once told, a drawing keeps a small motion of its own (`.idle`).
 */

gsap.registerPlugin(TextPlugin, MotionPathPlugin);

type Scene = (tl: gsap.core.Timeline, svg: SVGSVGElement, loops: gsap.core.Tween[]) => void;

const part = (svg: Element, p: string) => svg.querySelector<SVGGraphicsElement>(`[data-p="${p}"]`)!;
const parts = (svg: Element, p: string) => [...svg.querySelectorAll<SVGGraphicsElement>(`[data-p="${p}"]`)];
/** the strokes of a part that draw on (itself, if it is one) */
const strokes = (el: Element) => (el.matches('.sa-d') ? [el] : [...el.querySelectorAll('.sa-d')]);

/** strokes draw themselves on */
const draw = (tl: gsap.core.Timeline, els: Element[], at: number, duration = 0.7, stagger = 0.06) =>
  els.length && tl.fromTo(els, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration, ease: 'power1.inOut', stagger }, at);
/** a part comes up from a point of its own */
const pop = (tl: gsap.core.Timeline, el: Element | Element[], at: number, origin = '50% 50%', stagger = 0) =>
  tl.fromTo(el, { opacity: 0, scale: 0.6, transformOrigin: origin }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', stagger }, at);
/** a part that rests hidden shows, or one that rests shown leaves */
const show = (tl: gsap.core.Timeline, el: Element | Element[], at: number, on = true, duration = 0.25) =>
  // only a showing is set up in advance (hidden until then); a leaving waits for its moment
  tl.fromTo(el, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0, duration, ease: 'power1.out', immediateRender: on }, at);
/** words are written in */
const type = (tl: gsap.core.Timeline, el: Element, at: number, duration: number) =>
  tl.fromTo(el, { text: '' }, { text: el.textContent ?? '', duration, ease: 'none' }, at);
/** three dots hop in turn: someone is typing */
const typing = (tl: gsap.core.Timeline, el: Element, at: number, duration: number) => {
  show(tl, el, at);
  tl.fromTo(el.querySelectorAll('circle'), { y: 0 }, { y: -4, duration: 0.22, ease: 'power1.inOut', yoyo: true, repeat: Math.max(1, Math.round(duration / 0.44) * 2 - 1), stagger: 0.12 }, at);
  show(tl, el, at + duration, false, 0.15);
};

const SCENES: Record<string, Scene> = {
  // the guest asks, the bot answers and books, the guest is delighted
  bots(tl, svg) {
    const guest = part(svg, 'guest'), robot = part(svg, 'robot');
    const head = part(svg, 'g-head'), arms = part(svg, 'g-arms'), burst = part(svg, 'g-burst');
    const flat = part(svg, 'g-flat'), smile = part(svg, 'g-smile'), eyes = part(svg, 'r-eyes');
    const later = '[data-p="g-arms"], [data-p="g-burst"], [data-p="g-smile"], [data-p="g-flat"]';
    tl.set([arms, burst, smile], { opacity: 0 }, 0).set(flat, { opacity: 1 }, 0);
    draw(tl, [...strokes(guest)].filter((el) => !el.closest(later)), 0, 0.8, 0.05);
    draw(tl, strokes(flat), 0.3);
    draw(tl, strokes(robot), 0.2, 0.8, 0.04);
    show(tl, [...svg.querySelectorAll('.sa-f')], 0.6, true, 0.3);
    const nod = (at: number) => tl.fromTo(head, { rotation: 0, svgOrigin: '88 216' }, { rotation: -7, svgOrigin: '88 216', duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut' }, at);
    const blink = (at: number) => tl.fromTo(eyes, { scaleY: 1, transformOrigin: '50% 50%' }, { scaleY: 0.15, transformOrigin: '50% 50%', duration: 0.1, yoyo: true, repeat: 1 }, at);
    const msg = (i: number) => part(svg, `msg-${i}`);
    tl.set([0, 1, 2, 3].map(msg), { opacity: 0 }, 0);
    nod(1.0); pop(tl, msg(0), 1.05, '0% 100%');
    blink(1.6); typing(tl, part(svg, 'typing-1'), 1.75, 1.0);
    pop(tl, msg(1), 2.8, '100% 100%');
    nod(3.6); pop(tl, msg(2), 3.65, '0% 100%');
    blink(4.2); typing(tl, part(svg, 'typing-3'), 4.35, 1.0);
    pop(tl, msg(3), 5.4, '100% 100%');
    tl.fromTo(part(svg, 'r-light'), { scale: 1 }, { scale: 1.6, transformOrigin: '50% 50%', duration: 0.2, yoyo: true, repeat: 1 }, 5.4);
    // delight: the smile, the arms up, a little jump
    show(tl, flat, 6.0, false, 0.1);
    show(tl, smile, 6.0, true, 0.05); draw(tl, strokes(smile), 6.0, 0.3);
    show(tl, arms, 6.05, true, 0.05); draw(tl, strokes(arms), 6.05, 0.3, 0);
    show(tl, burst, 6.2, true, 0.05); draw(tl, strokes(burst), 6.2, 0.3, 0.07);
    tl.to(guest, { keyframes: [{ y: -16, duration: 0.2, ease: 'power2.out' }, { y: 0, duration: 0.2, ease: 'power2.in' }, { y: -9, duration: 0.16, ease: 'power2.out' }, { y: 0, duration: 0.16, ease: 'power2.in' }] }, 6.05);
  },

  // the site builds itself, gets ready for AI, speaks three languages and opens a chat
  web(tl, svg) {
    const frame = part(svg, 'w-frame');
    draw(tl, strokes(frame), 0, 0.9, 0.05);
    show(tl, [...frame.querySelectorAll('.sa-f')], 0.5, true, 0.2);
    draw(tl, ['w-nav', 'w-hero', 'w-cards'].flatMap((p) => strokes(part(svg, p))), 0.6, 0.55, 0.05);
    draw(tl, strokes(part(svg, 'w-copy')), 1.7, 0.4, 0.1);
    pop(tl, part(svg, 'w-btn'), 1.9, '0% 50%');
    // ready for AI: the structured data and the llms.txt come out from behind the site
    pop(tl, part(svg, 'w-data'), 2.3);
    tl.fromTo(part(svg, 'w-llms'), { x: -56, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 2.5);
    // three languages, and back
    const lang = part(svg, 'w-lang'), words = [...lang.querySelectorAll('text')];
    draw(tl, strokes(lang), 3.0, 0.4);
    show(tl, words[0], 3.2, true, 0.2);
    // EN, EL, DE and back to EN: each word leaves upwards as the next comes up
    [1, 2, 0].forEach((k, n) => {
      const was = words[n];
      tl.to(was, { opacity: 0, y: -6, duration: 0.18, ease: 'power1.in' }, 3.7 + n * 0.5)
        .fromTo(words[k], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', immediateRender: false }, 3.86 + n * 0.5)
        .set(was, { y: 0 }, 3.9 + n * 0.5);
    });
    // the chat on the side says hello
    pop(tl, part(svg, 'w-chat'), 5.3);
    const greet = part(svg, 'w-greet');
    pop(tl, part(svg, 'w-hello'), 5.5, '100% 100%');
    typing(tl, part(svg, 'w-typing'), 5.6, 0.8);
    show(tl, greet, 6.4, true, 0.1);
    type(tl, greet.querySelector('text')!, 6.4, 0.6);
    // and every part of it can be reached from the keyboard
    tl.fromTo(part(svg, 'w-ring'), { opacity: 0, scale: 1.12, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' }, 7.0);
  },

  // five tools float apart, fold into one system, and the data answers in plain words
  apps(tl, svg) {
    const tools = [0, 1, 2, 3, 4].map((i) => part(svg, `tool-${i}`));
    tools.forEach((el, i) => {
      tl.fromTo(el, { x: Number(el.dataset.dx), y: Number(el.dataset.dy), scale: 1.5, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 1, duration: 0.4, ease: 'power1.out' }, i * 0.1);
      draw(tl, strokes(el), i * 0.1, 0.5, 0.03);
    });
    draw(tl, strokes(part(svg, 'a-frame')), 1.0, 0.8, 0.1);
    tl.to(tools, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'expo.inOut', stagger: 0.08 }, 1.4);
    const ask = part(svg, 'a-ask');
    draw(tl, strokes(ask), 2.5, 0.5);
    pop(tl, ask.querySelector('.ac-fill')!, 2.7);
    type(tl, ask.querySelector('text')!, 2.8, 1.3);
    const chart = part(svg, 'a-chart');
    draw(tl, strokes(chart), 4.2, 0.5);
    tl.fromTo(parts(svg, 'bar'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, 4.4);
    show(tl, [...chart.querySelectorAll('text')], 4.6, true, 0.3);
    tl.fromTo(part(svg, 'a-fore'), { opacity: 0, x: -12, y: 14 }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 5.4);
  },

  // the product is written, speaks twenty languages, and stays in sync with the marketplaces
  commerce(tl, svg, loops) {
    draw(tl, strokes(part(svg, 'c-card')), 0, 0.9, 0.08);
    const spark = part(svg, 'c-spark');
    tl.fromTo(spark, { opacity: 0, scale: 0.3, rotation: -90, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'expo.out' }, 0.9);
    draw(tl, strokes(part(svg, 'c-desc')), 1.1, 0.45, 0.3);
    const pills = [0, 1, 2, 3, 4, 5, 6].map((i) => part(svg, `lang-${i}`));
    pop(tl, pills, 2.2, '50% 100%', 0.08);
    const lines = [0, 1, 2].map((i) => part(svg, `c-line-${i}`)), shops = [0, 1, 2].map((i) => part(svg, `shop-${i}`));
    draw(tl, lines.flatMap(strokes), 3.0, 0.7, 0.12);
    shops.forEach((s, i) => draw(tl, strokes(s), 3.3 + i * 0.12, 0.5, 0.04));
    // the packets run both ways along the lines, for good
    const packets = [0, 1, 2].map((i) => part(svg, `packet-${i}`));
    tl.set(packets, { opacity: 0 }, 0);
    tl.call(() => {
      packets.forEach((dot, i) => {
        const path = lines[i].querySelector('path')!;
        gsap.set(dot, { opacity: 1 });
        loops.push(gsap.fromTo(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.6, ease: 'power1.inOut', repeat: -1, yoyo: true, delay: i * 0.35 }));
      });
    }, [], 4.0);
    const mail = part(svg, 'c-mail');
    tl.fromTo(mail, { opacity: 0, x: -20, y: 16 }, { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'expo.out' }, 4.6);
    draw(tl, strokes(mail), 4.6, 0.5, 0.1);
  },

  // asked for a recommendation, the AI answers with your business first
  search(tl, svg) {
    const frame = part(svg, 's-frame');
    draw(tl, strokes(frame), 0, 0.8, 0.1);
    pop(tl, [...frame.querySelectorAll('.ac-fill')], 0.5);
    const q = part(svg, 's-q');
    pop(tl, q, 0.9, '100% 50%');
    type(tl, q.querySelector('text')!, 1.0, 0.8);
    typing(tl, part(svg, 's-typing'), 1.95, 0.9);
    const rows = [0, 1, 2].map((i) => part(svg, `row-${i}`));
    tl.fromTo(rows, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.12 }, 2.95);
    tl.fromTo(part(svg, 's-star'), { opacity: 0, scale: 0, rotation: -40, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'expo.out' }, 3.5);
    const review = part(svg, 's-review');
    draw(tl, strokes(review), 4.1, 0.5, 0.08);
    pop(tl, parts(svg, 'rstar'), 4.3, '50% 50%', 0.08);
    pop(tl, part(svg, 's-reply'), 5.0, '0% 0%');
    const ads = part(svg, 's-ads');
    draw(tl, strokes(ads), 5.6, 0.8, 0.2);
  },
};

export type ArtPlayer = { ready(): void; play(): void; stop(): void };

/** A drawing that plays its scene: `ready` blanks it, `play` tells it from the start, `stop` holds it. */
export function artPlayer(svg: SVGSVGElement): ArtPlayer {
  const scene = SCENES[svg.dataset.art ?? ''];
  let tl: gsap.core.Timeline | null = null;
  const loops: gsap.core.Tween[] = [];
  const quiet = () => { loops.splice(0).forEach((t) => t.kill()); svg.classList.remove('idle'); };
  const build = () => {
    if (tl || !scene) return;
    tl = gsap.timeline({ paused: true });
    scene(tl, svg, loops);
    tl.call(() => svg.classList.add('idle'));
  };
  return {
    ready() { quiet(); build(); tl?.pause(0); },
    play() { quiet(); build(); tl?.restart(); },
    stop() { quiet(); tl?.pause(); },
  };
}
