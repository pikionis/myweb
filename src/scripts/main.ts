import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

/* ---------- lower page turns light once the hero has gone ---------- */
function lightZone() {
  const intro = document.querySelector('.intro-scroll');
  if (!intro) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  const check = () => {
    const past = intro.getBoundingClientRect().bottom <= window.innerHeight * 0.5;
    if (document.body.classList.contains('light') !== past) {
      document.body.classList.toggle('light', past);
      meta?.setAttribute('content', past ? '#f4f3ef' : '#0a0b0a');
    }
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
    const accent = cssVar(document.body, '--accent', '#4d7cff');
    const fg = getComputedStyle(document.body).color;
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
    try { await navigator.clipboard.writeText(mail); hint.textContent = 'Copied ✓'; }
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

export function init() {
  heroBubbles();
  lightZone();
  brandBubbles();
  copyEmail();

  if (reduce) {
    document.querySelectorAll<HTMLElement>('.curtain').forEach((c) => (c.style.display = 'none'));
    return;
  }

  const words = splitWords();
  gsap.registerPlugin(ScrollTrigger);

  // 1) the curtain opens over the first half of the scroll
  gsap.timeline({ scrollTrigger: { trigger: '.intro-scroll', start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
    .to('.curtain .half.top', { yPercent: -100, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.curtain .half.bot', { yPercent: 100, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.curtain .center', { autoAlpha: 0, filter: 'blur(8px)', duration: 0.4 }, 0)
    .from('.who, .hero-photo, .corner', { autoAlpha: 0, y: 30, stagger: 0.06, ease: 'power3.out', duration: 0.8 }, 0.8);

  // 2) then the words light up one by one, in reading order
  ScrollTrigger.create({
    trigger: '.intro-scroll', start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      const lit = Math.floor(((self.progress - 0.4) / 0.5) * words.length);
      words.forEach((s, i) => s.classList.toggle('lit', i < lit));
    },
  });

  // headline leans toward the pointer (desktop only)
  const head = document.getElementById('headlineText');
  const hero = document.querySelector<HTMLElement>('.hero-rev');
  if (head && hero && window.matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      gsap.to(head, { rotationX: ((e.clientY - r.top) / r.height - 0.5) * -8, rotationY: ((e.clientX - r.left) / r.width - 0.5) * 8,
        duration: 0.6, ease: 'power2.out', transformPerspective: 700 });
    });
    hero.addEventListener('mouseleave', () => gsap.to(head, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'power2.out' }));
  }

  // counters
  document.querySelectorAll<HTMLElement>('.n[data-count]').forEach((n) => {
    const end = Number(n.dataset.count), suf = n.dataset.suffix || '', o = { v: 0 };
    n.textContent = `0${suf}`;
    ScrollTrigger.create({ trigger: n, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.5, ease: 'power2.out', onUpdate: () => (n.textContent = `${Math.round(o.v)}${suf}`) }) });
  });

  // services: each row and its project cards rise in together
  gsap.utils.toArray<HTMLElement>('.service').forEach((el) => {
    gsap.from(el.querySelectorAll('.head, .proj'), {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      y: 36, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
    });
  });
}
