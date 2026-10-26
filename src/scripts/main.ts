import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { inkHeadline } from './ink';
import { activityTerrain } from './terrain';
import { splitNav } from './splitnav';
import { briefForm } from './brief';
import { workStack } from './workstack';
import { liveSite, livePreview } from './livesites';
import { serviceStories } from './stories';
import { serviceSheets } from './servicesheets';
import { letterCascade } from './cascade';
import { ditheredText } from './dither';
import { logoIntro } from './intro';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
const cssVar = (el: Element, name: string, fallback: string) =>
  getComputedStyle(el).getPropertyValue(name).trim() || fallback;

/* ---------- hero background bubbles ---------- */
function heroBubbles() {
  const cv = document.getElementById('bubbles') as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext('2d')!;
  let W = 0, H = 0, raf = 0;
  let parts: { x: number; y: number; r: number; vy: number; a: number }[] = [];
  const size = () => { const d = dpr(); W = cv.width = cv.offsetWidth * d; H = cv.height = cv.offsetHeight * d; };
  const make = () => {
    const d = dpr(); const n = Math.min(26, Math.round(cv.offsetWidth / 45));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: (8 + Math.random() * 34) * d,
      vy: (0.12 + Math.random() * 0.4) * d, a: 0.03 + Math.random() * 0.07,
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const c = cssVar(document.body, '--accent', '#4d7cff');
    for (const p of parts) {
      if (!reduce) { p.y -= p.vy; if (p.y + p.r < 0) { p.y = H + p.r; p.x = Math.random() * W; } }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.globalAlpha = p.a; ctx.fill();
      ctx.globalAlpha = p.a * 1.6; ctx.lineWidth = dpr(); ctx.strokeStyle = c; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(draw);
  };
  size(); make(); draw();
  // pause when the hero is off screen
  new IntersectionObserver(([e]) => {
    if (reduce) return;
    if (e.isIntersecting) { if (!raf) draw(); } else { cancelAnimationFrame(raf); raf = 0; }
  }).observe(cv);
  window.addEventListener('resize', () => { size(); make(); if (reduce) draw(); });
}

/* ---------- on the home page, browser chrome and overscroll follow the light sheet once it covers
   the hero; on every page the wordmark turns light over a dark field (the hero, the contact block) ---------- */
function lightZone() {
  const sheet = document.querySelector('.sheet');
  const meta = document.querySelector('meta[name="theme-color"]');
  const bar = document.querySelector('.topbar');
  const contact = document.getElementById('contact');
  const check = () => {
    // pages without the hero open on the light ground already
    const covered = !sheet || sheet.getBoundingClientRect().top <= 0;
    if (sheet && document.body.classList.contains('light') !== covered) {
      document.body.classList.toggle('light', covered);
      meta?.setAttribute('content', covered ? '#f4f3ef' : '#0a0b0a');
    }
    bar?.classList.toggle('on-dark', !covered || (!!contact && contact.getBoundingClientRect().top <= 40));
  };
  check();
  window.addEventListener('scroll', check, { passive: true });
}

/* ---------- copy e-mail ---------- */
function copyEmail() {
  const btn = document.getElementById('emailBtn'); const hint = document.getElementById('copyHint');
  if (!btn || !hint) return;
  btn.addEventListener('click', async () => {
    const mail = btn.dataset.mail || '';
    try { await navigator.clipboard.writeText(mail); hint.textContent = 'Copied to your clipboard'; }
    catch { window.location.href = `mailto:${mail}`; return; }
    setTimeout(() => (hint.textContent = 'Click to copy'), 1800);
  });
}

/* ---------- split hero copy into words (the words stay the paragraph's own text, read as one) ---------- */
function splitWords(): HTMLSpanElement[] {
  const out: HTMLSpanElement[] = [];
  document.querySelectorAll<HTMLElement>('.js-words').forEach((el) => {
    const keys = (el.dataset.keywords || '').toLowerCase().split(',').filter(Boolean);
    const words = (el.textContent || '').trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      if (keys.includes(w.toLowerCase().replace(/[^a-z-]/g, ''))) s.classList.add('key');
      s.textContent = w; el.append(s);
      if (i < words.length - 1) el.append(' ');
      out.push(s);
    });
  });
  return out;
}

/* ---------- split the headline into letters; words stay unbreakable, the heading keeps its name ---------- */
function splitChars(el: HTMLElement): HTMLSpanElement[] {
  const out: HTMLSpanElement[] = [];
  const words = (el.textContent || '').trim().split(/\s+/);
  el.setAttribute('aria-label', words.join(' '));
  el.textContent = '';
  words.forEach((w, i) => {
    const word = document.createElement('span');
    word.className = 'word';
    for (const c of w) {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; word.append(s);
      out.push(s);
    }
    el.append(word);
    if (i < words.length - 1) el.append(' ');
  });
  return out;
}

export function init() {
  // the opening intro goes first; what plays on load waits for it to hand the page over
  const intro = logoIntro();
  heroBubbles();
  lightZone();
  copyEmail();
  document.querySelectorAll<HTMLElement>('[data-terrain]').forEach(activityTerrain);
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitNav);
  document.querySelectorAll<HTMLFormElement>('form[data-brief]').forEach(briefForm);
  // the services on the home page: the stack of sheets, and the stories that open from them
  document.querySelectorAll<HTMLElement>('[data-stack]').forEach(workStack);
  // projects whose card shows their live site
  document.querySelectorAll<HTMLElement>('[data-live]').forEach(liveSite);
  const preview = document.querySelector<HTMLElement>('[data-lp]');
  if (preview) livePreview(preview);
  const bubble = document.querySelector<HTMLElement>('[data-bubble]');
  if (bubble) serviceStories(bubble, intro.handoff);
  // the /services cards, opened
  const sheets = document.querySelector<HTMLElement>('[data-sheets]');
  if (sheets) serviceSheets(sheets, intro.handoff);
  document.querySelectorAll<HTMLElement>('[data-dither]').forEach(ditheredText);
  // titles ripple letter by letter on hover; a project's name answers a hover anywhere on its card
  document.querySelectorAll<HTMLElement>('[data-cascade]').forEach((el) =>
    letterCascade(el, el.closest<HTMLElement>('[data-pcard]') ?? el));

  if (reduce) {
    document.querySelectorAll<HTMLElement>('.curtain').forEach((c) => (c.style.display = 'none'));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (document.querySelector('.intro-scroll')) hero(intro.handoff);
  // sections already in view rise in as the intro lifts off them, not underneath it
  intro.handoff.then(entrances);
}

/* ---------- the home page hero: curtain, ink title, letter and word reveal, the light sheet ---------- */
function hero(handoff: Promise<void>) {
  // the curtain title is written in ink (needs the real font to lay the letters over the h1); it blooms as
  // the intro hands the page over, so it is not spent underneath the overlay
  const curtain = document.querySelector<HTMLElement>('.curtain');
  const inkCanvas = document.getElementById('ink') as HTMLCanvasElement | null;
  const curtainTitle = curtain?.querySelector('h1');
  if (curtain && inkCanvas && curtainTitle) {
    Promise.all([document.fonts?.ready, handoff]).then(() => inkHeadline(curtain, inkCanvas, curtainTitle));
  }

  const head = document.getElementById('headlineText');
  const chars = head ? splitChars(head) : [];
  const words = splitWords();

  // the reveal plays over the first 2.2 screens; the last screen of the intro belongs to the sheet
  const reveal = { trigger: '.intro-scroll', start: 'top top', end: '+=220%' };

  // 1) the curtain opens, and the headline arrives letter by letter through the gap. The portrait follows
  // the reading order: beside the headline on a wide screen it comes after it; on a phone it sits above the
  // headline, so it comes first, as the curtain opens, and the copy waits for its headline. Either way the
  // timeline keeps its length, so the scroll has the same pace.
  // What arrives later is set out of sight first and brought in with to(), not from(): a ScrollTrigger refresh
  // (the services stack makes one on load) undoes a from()'s start before its turn, so the part showed, then
  // blinked out when its turn came.
  gsap.matchMedia().add({ phone: '(max-width: 820px)', wide: '(min-width: 821px)' }, (ctx) => {
    const phone = ctx.conditions?.phone;
    gsap.set(chars, { yPercent: 60, autoAlpha: 0 });
    gsap.set('.hero-fig', { autoAlpha: 0, y: phone ? 24 : 30 });
    gsap.set('.corner', { autoAlpha: 0, y: 30 });
    if (phone) gsap.set('.hero-copy .js-words', { autoAlpha: 0 });
    const tl = gsap.timeline({ scrollTrigger: { ...reveal, scrub: 0.6 } })
      .to('.curtain .half.top', { yPercent: -100, ease: 'power2.inOut', duration: 1 }, 0)
      .to('.curtain .half.bot', { yPercent: 100, ease: 'power2.inOut', duration: 1 }, 0)
      .to('.curtain .center', { autoAlpha: 0, filter: 'blur(8px)', duration: 0.4 }, 0)
      .to('#ink', { autoAlpha: 0, duration: 0.4 }, 0)
      // once open, the empty curtain stops catching the pointer (the headline tilt lives underneath)
      .set('.curtain', { pointerEvents: 'none' }, 0.4)
      .to(chars, { yPercent: 0, autoAlpha: 1, ease: 'power3.out', duration: 0.3, stagger: 0.018 }, 0.45);
    if (phone) {
      tl.to('.hero-fig', { autoAlpha: 1, y: 0, ease: 'power3.out', duration: 0.6 }, 0.25)
        .to('.hero-copy .js-words', { autoAlpha: 1, ease: 'power1.out', duration: 0.3 }, 0.75)
        .to('.corner', { autoAlpha: 1, y: 0, stagger: 0.06, ease: 'power3.out', duration: 0.8 }, 0.8);
    } else {
      tl.to('.hero-fig, .corner', { autoAlpha: 1, y: 0, stagger: 0.06, ease: 'power3.out', duration: 0.8 }, 0.8);
    }
  });

  // 2) once the headline has landed (~0.67), the copy below lights up word by word
  ScrollTrigger.create({
    ...reveal,
    onUpdate: (self) => {
      const lit = Math.floor(((self.progress - 0.62) / 0.33) * words.length);
      words.forEach((s, i) => s.classList.toggle('lit', i < lit));
    },
  });

  // 3) the light sheet slides up over the pinned hero, which sinks back and dims
  gsap.to('.intro-stage', {
    scale: 0.92, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.sheet', start: 'top bottom', end: 'top top', scrub: true },
  });

  // headline leans toward the pointer (desktop only)
  const stage = document.querySelector<HTMLElement>('.hero-rev');
  if (head && stage && window.matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      gsap.to(head, { rotationX: ((e.clientY - r.top) / r.height - 0.5) * -8, rotationY: ((e.clientX - r.left) / r.width - 0.5) * 8,
        duration: 0.6, ease: 'power2.out', transformPerspective: 700 });
    });
    stage.addEventListener('mouseleave', () => gsap.to(head, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'power2.out' }));
  }
}

/* ---------- every page: parts rise in as they arrive ---------- */
function entrances() {
  // each section's parts rise in once, in reading order: heading, text, then the rest
  const rise = (parts: Element[], trigger: Element, start = 'top 80%') =>
    parts.length && gsap.from(parts, {
      scrollTrigger: { trigger, start, once: true },
      y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07,
    });
  document.querySelectorAll('.sec-head, .close .top, [data-rise]').forEach((el) =>
    rise([...el.querySelectorAll(':scope > *, :scope > .invite > *')].filter((c) => !c.matches('.invite')), el));

  // the closing surname rises out of the bottom edge
  gsap.from('.close .mark', {
    scrollTrigger: { trigger: '.close', start: 'top 60%', once: true },
    yPercent: 60, duration: 1.2, ease: 'power3.out',
  });
}
