import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { inkHeadline } from './ink';
import { activityTerrain } from './terrain';
import { splitNav } from './splitnav';
import { briefForm } from './brief';
import { workStack } from './workstack';
import { letterCascade } from './cascade';
import { ditheredText } from './dither';
import { logoIntro } from './intro';

type Brand = { name: string; cat: string; desc: string; url: string; video: string };

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

/* ---------- brand bubbles + project panel ---------- */
function brandBubbles() {
  const cv = document.getElementById('brandCanvas') as HTMLCanvasElement | null;
  const dataEl = document.getElementById('brand-data');
  if (!cv || !dataEl) return;
  const BRANDS: Brand[] = JSON.parse(dataEl.textContent || '[]');
  const ctx = cv.getContext('2d')!;
  const field = document.getElementById('brandField')!;
  const modal = document.getElementById('bmodal')!;
  const panel = modal.querySelector('.panel') as HTMLElement;
  const screen = document.getElementById('phoneScreen')!;
  const closeBtn = document.getElementById('bmClose') as HTMLButtonElement;
  let lastFocus: HTMLElement | null = null;

  let W = 0, H = 0, raf = 0, t = 0;
  type Item = { b: Brand; r: number; x: number; y: number; vx: number; vy: number; ph: number };
  let items: Item[] = [];
  const size = () => { const d = dpr(); W = cv.width = cv.offsetWidth * d; H = cv.height = cv.offsetHeight * d; };
  const font = (px: number) => `500 ${px * dpr()}px 'Space Grotesk', sans-serif`;
  const build = () => {
    const d = dpr(); const small = cv.offsetWidth < 600;
    ctx.font = font(small ? 13 : 16);
    items = BRANDS.map((b) => {
      const r = Math.max((small ? 34 : 44) * d, ctx.measureText(b.name).width / 2 + (small ? 14 : 22) * d);
      return { b, r, x: r + Math.random() * Math.max(1, W - 2 * r), y: r + Math.random() * Math.max(1, H - 2 * r),
        vx: (Math.random() - 0.5) * 0.5 * d, vy: (Math.random() - 0.5) * 0.5 * d, ph: Math.random() * Math.PI * 2 };
    });
  };

  const step = () => {
    t += 0.012;
    const d = dpr(); const small = cv.offsetWidth < 600;
    ctx.clearRect(0, 0, W, H);
    const accent = cssVar(cv, '--accent', '#4d7cff');
    const fg = getComputedStyle(cv).color;
    for (const p of items) {
      if (!reduce) { p.x += p.vx; p.y += p.vy + Math.sin(t + p.ph) * 0.25 * d; }
      if (p.x < p.r) { p.x = p.r; p.vx *= -1; } if (p.x > W - p.r) { p.x = W - p.r; p.vx *= -1; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -1; } if (p.y > H - p.r) { p.y = H - p.r; p.vy *= -1; }
    }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j]; const dx = b.x - a.x, dy = b.y - a.y; const dist = Math.hypot(dx, dy), min = a.r + b.r;
      if (dist > 0 && dist < min) {
        const o = (min - dist) / 2, nx = dx / dist, ny = dy / dist;
        a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        a.vx -= nx * 0.02; b.vx += nx * 0.02; a.vy -= ny * 0.02; b.vy += ny * 0.02;
      }
    }
    items.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      if (i % 4 === 0) { ctx.fillStyle = accent; ctx.globalAlpha = 0.14; ctx.fill(); }
      ctx.globalAlpha = 1; ctx.lineWidth = 1.2 * d; ctx.strokeStyle = accent; ctx.stroke();
      ctx.fillStyle = fg; ctx.font = font(small ? 13 : 15);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.b.name, p.x, p.y);
    });
    if (!reduce) raf = requestAnimationFrame(step);
  };

  const open = (b: Brand, ox = 50, oy = 50) => {
    lastFocus = document.activeElement as HTMLElement;
    (document.getElementById('bmCat') as HTMLElement).textContent = b.cat || 'Project';
    (document.getElementById('bmName') as HTMLElement).textContent = b.name;
    (document.getElementById('bmDesc') as HTMLElement).textContent = b.desc || '';
    const visit = document.getElementById('bmVisit') as HTMLAnchorElement;
    visit.hidden = !b.url; if (b.url) visit.href = b.url;
    screen.replaceChildren();
    if (b.video) {
      const v = Object.assign(document.createElement('video'), { src: b.video, autoplay: true, muted: true, loop: true, playsInline: true });
      screen.append(v);
    } else {
      const f = document.createElement('div'); f.className = 'fallback';
      const n = document.createElement('b'); n.textContent = b.name;
      const s = document.createElement('small'); s.textContent = 'Vertical video goes here';
      f.append(n, s); screen.append(f);
    }
    panel.style.setProperty('--ox', `${ox}%`); panel.style.setProperty('--oy', `${oy}%`);
    field.classList.add('focused'); modal.hidden = false; closeBtn.focus({ preventScroll: true });
  };
  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true; field.classList.remove('focused');
    screen.querySelector('video')?.pause();
    lastFocus?.focus({ preventScroll: true });
  };

  cv.addEventListener('click', (e) => {
    const rect = cv.getBoundingClientRect(); const d = dpr();
    const cx = (e.clientX - rect.left) * d, cy = (e.clientY - rect.top) * d;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      if (Math.hypot(cx - p.x, cy - p.y) <= p.r) { open(p.b, (p.x / d / cv.offsetWidth) * 100, (p.y / d / cv.offsetHeight) * 100); break; }
    }
  });
  cv.addEventListener('mousemove', (e) => {
    const rect = cv.getBoundingClientRect(); const d = dpr();
    const cx = (e.clientX - rect.left) * d, cy = (e.clientY - rect.top) * d;
    cv.style.cursor = items.some((p) => Math.hypot(cx - p.x, cy - p.y) <= p.r) ? 'pointer' : 'default';
  });
  field.querySelectorAll<HTMLButtonElement>('[data-brand]').forEach((btn) =>
    btn.addEventListener('click', () => open(BRANDS[Number(btn.dataset.brand)])));
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  const start = () => {
    size(); build(); step();
    new IntersectionObserver(([e]) => {
      if (reduce) return;
      if (e.isIntersecting) { if (!raf) step(); } else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(cv);
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { size(); build(); if (reduce) step(); }, 150); });
  };
  // measure names with the real font
  document.fonts?.ready ? document.fonts.ready.then(start) : start();
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

/* ---------- split hero copy into words ---------- */
function splitWords(): HTMLSpanElement[] {
  const out: HTMLSpanElement[] = [];
  document.querySelectorAll<HTMLElement>('.js-words').forEach((el) => {
    const keys = (el.dataset.keywords || '').toLowerCase().split(',').filter(Boolean);
    const words = (el.textContent || '').trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent!.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      if (keys.includes(w.toLowerCase().replace(/[^a-z-]/g, ''))) s.classList.add('key');
      s.textContent = w; el.append(s);
      if (i < words.length - 1) el.append(' ');
      out.push(s);
    });
  });
  return out;
}

/* ---------- split the headline into letters; words stay unbreakable ---------- */
function splitChars(el: HTMLElement): HTMLSpanElement[] {
  const out: HTMLSpanElement[] = [];
  const words = (el.textContent || '').trim().split(/\s+/);
  el.setAttribute('aria-label', words.join(' '));
  el.textContent = '';
  words.forEach((w, i) => {
    const word = document.createElement('span');
    word.className = 'word'; word.setAttribute('aria-hidden', 'true');
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
  brandBubbles();
  copyEmail();
  document.querySelectorAll<HTMLElement>('[data-terrain]').forEach(activityTerrain);
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitNav);
  document.querySelectorAll<HTMLFormElement>('form[data-brief]').forEach(briefForm);
  document.querySelectorAll<HTMLElement>('[data-stack]').forEach(workStack);
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

  // 1) the curtain opens, and the headline arrives letter by letter through the gap
  gsap.timeline({ scrollTrigger: { ...reveal, scrub: 0.6 } })
    .to('.curtain .half.top', { yPercent: -100, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.curtain .half.bot', { yPercent: 100, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.curtain .center', { autoAlpha: 0, filter: 'blur(8px)', duration: 0.4 }, 0)
    .to('#ink', { autoAlpha: 0, duration: 0.4 }, 0)
    // once open, the empty curtain stops catching the pointer (the headline tilt lives underneath)
    .set('.curtain', { pointerEvents: 'none' }, 0.4)
    .from(chars, { yPercent: 60, autoAlpha: 0, ease: 'power3.out', duration: 0.3, stagger: 0.018 }, 0.45)
    .from('.hero-fig, .corner', { autoAlpha: 0, y: 30, stagger: 0.06, ease: 'power3.out', duration: 0.8 }, 0.8);

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
  document.querySelectorAll('.sec-head, .customers .head, .figure, .close .top, [data-rise]').forEach((el) =>
    rise([...el.querySelectorAll(':scope > *, :scope > .invite > *')].filter((c) => !c.matches('.invite')), el));

  // the closing surname rises out of the bottom edge
  gsap.from('.close .mark', {
    scrollTrigger: { trigger: '.close', start: 'top 60%', once: true },
    yPercent: 60, duration: 1.2, ease: 'power3.out',
  });
}
