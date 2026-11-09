/*
 * The light pages' background is never quite still (BrandBackground.astro; each island is a BgMotif.astro): three
 * faint ink motifs, like drawings showing through the paper, in the empty parts of the page:
 * - line: one hand-drawn line that sketches a browser window, a phone, an automation graph and a rising chart
 *   (Design → Build → Automate → Scale), the chart in the accent, the pen's tip a dot; it holds, fades, draws again
 * - current: short strokes flowing round three loops that meet at one point (the onehub mark), trails fading,
 *   the loops' centres turning very slowly
 * - blueprint: a fine dot grid where wireframes draw themselves, show two lines of "text", and fade
 * Canvas 2D, one loop for all, at most 30 frames a second, only for islands on screen, nothing while the tab is
 * hidden. It starts only once the page is in use (the first scroll, touch, key or pointer move, or six seconds after
 * it has loaded), so the page's first paint and its measurements are never the background's. On a phone (under
 * 768px) only the island most in view shows. With reduced motion each shows once, as a finished frame.
 * Strength: --bg-motif-opacity (global.css) multiplies the ink (22% of the text colour) and the accent (45%).
 */

type Variant = 'line' | 'current' | 'blueprint';
type Motif = { size(w: number, h: number): void; frame(dt: number): void; still(): void };
type Island = {
  el: HTMLElement; cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; variant: Variant;
  motif: Motif; w: number; h: number; ratio: number; on: boolean; drawn: boolean;
};

const PHONE = '(max-width: 767px)';
const STILL = '(prefers-reduced-motion: reduce)';
const FRAME = 1000 / 30;

/* ---------- colours, from the page's own tokens ---------- */
type Inks = { ink: string; accent: string };
function inks(el: HTMLElement): Inks {
  const cs = getComputedStyle(el);
  const k = Math.max(0, parseFloat(cs.getPropertyValue('--bg-motif-opacity')) || 1);
  // a token's colour as the browser resolves it (rgb), then at the motif's strength
  const probe = document.createElement('i');
  el.append(probe);
  const rgb = (token: string, fallback: string) => {
    probe.style.color = `var(${token}, ${fallback})`;
    return (getComputedStyle(probe).color.match(/[\d.]+/g) ?? ['20', '20', '20']).slice(0, 3).join(', ');
  };
  const fg = rgb('--fg', '#141414'), ac = rgb('--accent', '#4d7cff');
  probe.remove();
  const a = (v: number) => Math.min(1, v * k).toFixed(3);
  return { ink: `rgba(${fg}, ${a(0.22)})`, accent: `rgba(${ac}, ${a(0.45)})` };
}

/* ---------- a tiny seeded random, so a cycle can differ from the last ---------- */
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- the ink line: Design → Build → Automate → Scale ---------- */
// its path, in a 400 × 300 box: point lists drawn one after another, the pen going straight from each to the next
function linePath(): { pts: number[][]; accentFrom: number } {
  const seqs: number[][][] = [];
  const rect = (x: number, y: number, w: number, h: number, r: number) => {
    const p: number[][] = [];
    const arc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    p.push([x, y + h - r]); p.push([x, y + r]); arc(x + r, y + r, Math.PI);
    p.push([x + w - r, y]); arc(x + w - r, y + r, -Math.PI / 2);
    p.push([x + w, y + h - r]); arc(x + w - r, y + h - r, 0);
    p.push([x + r, y + h]); arc(x + r, y + h - r, Math.PI / 2);
    return p;
  };
  const loop = (cx: number, cy: number, r: number, from = Math.PI) => Array.from({ length: 19 }, (_, i) => { const a = from + (i / 18) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  // the pen comes in, and draws a browser window: its frame, the bar and its dots, a hero block, two columns
  seqs.push([[0, 236], [10, 226], [20, 214]]);
  seqs.push(rect(20, 70, 160, 140, 8));
  seqs.push([[20, 90], [180, 90]]);
  seqs.push(loop(170, 80, 3.2, 0), loop(159, 80, 3.2, 0), loop(148, 80, 3.2, 0));
  seqs.push([[168, 102], [32, 102], [32, 128], [168, 128], [168, 198], [106, 198], [106, 140], [168, 140]]);
  seqs.push([[94, 140], [32, 140], [32, 198], [94, 198]]);
  // on to a phone: its frame, then from the bottom up its button, two lines and the notch
  seqs.push([[120, 224], [170, 236], [206, 214]]);
  seqs.push(rect(208, 92, 44, 116, 8));
  seqs.push([[222, 190], [238, 190]], [[244, 134], [216, 134], [216, 122], [244, 122]], [[238, 102], [222, 102]]);
  // out over its top, down to an automation graph: nodes joined, one after another
  seqs.push([[230, 84], [262, 90], [272, 150], [276, 180]]);
  seqs.push(loop(282, 186, 7), [[286, 179], [298, 147]], loop(300, 140, 7), [[306, 145], [321, 164]], loop(326, 170, 7), [[324, 163], [319, 119]], loop(318, 112, 7));
  // and the chart: its axes, the line rising, and its arrow (the accent)
  const accentAt = seqs.length;
  seqs.push([[330, 100], [344, 96], [344, 206], [394, 206]]);
  seqs.push([[350, 192], [362, 170], [372, 178], [386, 128], [377, 131], [386, 128], [389, 138]]);
  // all one line: resampled every 1.5 units
  const raw: number[][] = [];
  let accentPoint = 0;
  seqs.forEach((s, i) => { if (i === accentAt) accentPoint = raw.length; raw.push(...s); });
  const pts: number[][] = [raw[0]];
  let accentFrom = 0;
  for (let i = 1; i < raw.length; i++) {
    const [ax, ay] = raw[i - 1], [bx, by] = raw[i];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 1.5));
    for (let k = 1; k <= n; k++) pts.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
    if (i === accentPoint) accentFrom = pts.length - 1;
  }
  return { pts, accentFrom };
}
const LINE = linePath();

function inkLine(ctx: CanvasRenderingContext2D, c: Inks): Motif {
  const DRAW = 11, HOLD = 2.6, FADE = 1.3, REST = 0.6, CYCLE = DRAW + HOLD + FADE + REST;
  let w = 0, h = 0, s = 1, ox = 0, oy = 0, t = 0, seed = 7, path: number[][] = [];
  // the line wavers a little, differently each time it is drawn
  const jitter = () => {
    const r = rnd(seed++ * 7919), a = r() * 6, b = r() * 6, amp = 1.1 + r() * 0.6;
    path = LINE.pts.map(([x, y], i) => {
      const [px, py] = LINE.pts[Math.max(0, i - 1)], [nx, ny] = LINE.pts[Math.min(LINE.pts.length - 1, i + 1)];
      const dx = nx - px, dy = ny - py, d = Math.hypot(dx, dy) || 1;
      const o = amp * (Math.sin(i * 0.045 + a) * 0.6 + Math.sin(i * 0.11 + b) * 0.4);
      return [ox + (x - (dy / d) * o) * s, oy + (y + (dx / d) * o) * s];
    });
  };
  const stroke = (from: number, to: number, color: string) => {
    if (to <= from) return;
    ctx.beginPath();
    ctx.moveTo(path[from][0], path[from][1]);
    for (let i = from + 1; i <= to; i++) ctx.lineTo(path[i][0], path[i][1]);
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const paint = (upTo: number, alpha: number) => {
    ctx.clearRect(0, 0, w, h);
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.6, 2.2 * Math.min(1, s * 1.2));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    stroke(0, Math.min(upTo, LINE.accentFrom), c.ink);
    stroke(LINE.accentFrom, upTo, c.accent);
    ctx.globalAlpha = 1;
  };
  return {
    size(W, H) {
      w = W; h = H;
      s = Math.min(W / 400, H / 300) * 0.9;
      ox = (W - 400 * s) / 2; oy = (H - 300 * s) / 2;
      jitter();
    },
    frame(dt) {
      t += dt;
      if (t >= CYCLE) { t -= CYCLE; jitter(); }
      const n = path.length - 1;
      if (t < DRAW) {
        // drawn at an even, unhurried pace, slowing a little at either end
        const q = t / DRAW, e = q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2;
        const k = Math.round(e * n);
        paint(k, 1);
        // the pen's tip
        ctx.fillStyle = c.accent;
        ctx.beginPath(); ctx.arc(path[k][0], path[k][1], 3.2, 0, Math.PI * 2); ctx.fill();
      } else if (t < DRAW + HOLD) paint(n, 1);
      else if (t < DRAW + HOLD + FADE) paint(n, 1 - (t - DRAW - HOLD) / FADE);
      else paint(0, 0);
    },
    still() { paint(path.length - 1, 1); },
  };
}

/* ---------- the current: three loops meeting at one point ---------- */
function inkCurrent(ctx: CanvasRenderingContext2D, c: Inks, few: boolean): Motif {
  type P = { k: number; a: number; o: number; v: number; life: number; age: number; accent: boolean };
  const N = few ? 34 : 64;
  const r = rnd(4242);
  let w = 0, h = 0, R = 60, cx = 0, cy = 0, spin = r() * 6;
  const make = (): P => ({ k: Math.floor(r() * 3), a: r() * Math.PI * 2, o: (r() - 0.5) * 14, v: 20 + r() * 20, life: 4 + r() * 5, age: r() * 4, accent: r() < 0.12 });
  const ps: P[] = Array.from({ length: N }, make);
  // where a stroke is on its loop: each loop passes through the meeting point
  const at = (p: P) => {
    const th = spin + (p.k * Math.PI * 2) / 3, lx = cx + Math.cos(th) * R, ly = cy + Math.sin(th) * R, rr = R + p.o;
    return [lx + Math.cos(p.a) * rr, ly + Math.sin(p.a) * rr];
  };
  const dot = () => { ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, Math.PI * 2); ctx.fill(); };
  return {
    size(W, H) {
      w = W; h = H; cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.24;
      ctx.clearRect(0, 0, w, h);
    },
    frame(dt) {
      // the trails fade
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      spin += dt * 0.025;
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const p of ps) {
        const [x0, y0] = at(p);
        p.a += (p.v * dt) / (R + p.o);
        p.age += dt;
        if (p.age > p.life) { Object.assign(p, make(), { age: 0 }); continue; }
        const [x1, y1] = at(p);
        // (each stroke comes and goes softly over its life)
        ctx.globalAlpha = Math.min(1, p.age / 0.8, (p.life - p.age) / 0.8);
        ctx.strokeStyle = p.accent ? c.accent : c.ink;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      dot();
    },
    still() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const p of ps) {
        const [x0, y0] = at(p);
        p.a += 16 / (R + p.o);
        const [x1, y1] = at(p);
        ctx.strokeStyle = p.accent ? c.accent : c.ink;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      dot();
    },
  };
}

/* ---------- the blueprint: a dot grid, wireframes drawing themselves ---------- */
function blueprint(ctx: CanvasRenderingContext2D, c: Inks, few: boolean): Motif {
  type F = { x: number; y: number; w: number; h: number; t: number; accent: boolean };
  const G = few ? 14 : 16, EVERY = few ? 4.2 : 3.2, LIFE = 6;
  const r = rnd(1717);
  let w = 0, h = 0, cols = 0, rows = 0, wait = 0.4;
  let frames: F[] = [];
  let grid: HTMLCanvasElement | null = null;
  const dots = () => {
    grid = document.createElement('canvas');
    grid.width = ctx.canvas.width; grid.height = ctx.canvas.height;
    const g = grid.getContext('2d')!;
    g.setTransform(ctx.getTransform());
    g.fillStyle = c.ink;
    for (let y = G / 2; y < h; y += G) for (let x = G / 2; x < w; x += G) { g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill(); }
  };
  const place = (): F | null => {
    for (let tries = 0; tries < 8; tries++) {
      const fw = 5 + Math.floor(r() * 6), fh = 3 + Math.floor(r() * 3);
      if (fw > cols - 2 || fh > rows - 2) return null;
      const fx = 1 + Math.floor(r() * (cols - fw - 1)), fy = 1 + Math.floor(r() * (rows - fh - 1));
      const f = { x: fx * G + G / 2, y: fy * G + G / 2, w: fw * G, h: fh * G, t: 0, accent: r() < 0.25 };
      if (frames.every((o) => f.x + f.w < o.x - G || o.x + o.w < f.x - G || f.y + f.h < o.y - G || o.y + o.h < f.y - G)) return f;
    }
    return null;
  };
  // a wireframe at its time: its outline drawn round, then its two lines, then it fades
  const draw = (f: F) => {
    const per = 2 * (f.w + f.h), q = Math.min(1, f.t / 1.4), lines = Math.min(1, Math.max(0, (f.t - 1.4) / 0.8));
    const alpha = f.t < LIFE - 1.2 ? 1 : Math.max(0, (LIFE - f.t) / 1.2);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = f.accent ? c.accent : c.ink;
    ctx.lineWidth = 1.8;
    let left = per * q, x = f.x, y = f.y;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (const [dx, dy, len] of [[1, 0, f.w], [0, 1, f.h], [-1, 0, f.w], [0, -1, f.h]]) {
      const d = Math.min(left, len);
      x += dx * d; y += dy * d;
      ctx.lineTo(x, y);
      left -= d;
      if (left <= 0) break;
    }
    ctx.stroke();
    if (lines > 0) {
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      const lx = f.x + G * 0.75;
      ctx.beginPath(); ctx.moveTo(lx, f.y + f.h * 0.38); ctx.lineTo(lx + (f.w * 0.62 - G * 0.75) * lines, f.y + f.h * 0.38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, f.y + f.h * 0.62); ctx.lineTo(lx + (f.w * 0.4 - G * 0.75) * lines, f.y + f.h * 0.62); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    ctx.globalAlpha = 1;
  };
  const base = () => { ctx.clearRect(0, 0, w, h); if (grid) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(grid, 0, 0); ctx.restore(); } };
  return {
    size(W, H) { w = W; h = H; cols = Math.floor(W / G); rows = Math.floor(H / G); frames = []; dots(); },
    frame(dt) {
      wait -= dt;
      if (wait <= 0) { const f = place(); if (f) frames.push(f); wait = EVERY * (0.8 + r() * 0.4); }
      frames.forEach((f) => (f.t += dt));
      frames = frames.filter((f) => f.t < LIFE);
      base();
      frames.forEach(draw);
    },
    still() {
      frames = [];
      for (let i = 0; i < 2; i++) { const f = place(); if (f) { f.t = 3; frames.push(f); } }
      base();
      frames.forEach(draw);
    },
  };
}

/* ---------- the islands, and the one loop that runs them ---------- */
export function brandBackground() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-bgm]')];
  if (!els.length) return;
  const phone = matchMedia(PHONE), still = matchMedia(STILL).matches;
  const islands: Island[] = [];
  let raf = 0, last = 0;

  const fit = (i: Island) => {
    const r = i.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    i.w = r.width; i.h = r.height;
    i.cv.width = Math.round(r.width * dpr); i.cv.height = Math.round(r.height * dpr);
    i.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    i.motif.size(r.width, r.height);
    i.drawn = false;
    if (still && i.on) { i.motif.still(); i.drawn = true; }
  };
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - last < FRAME - 2) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    for (const i of islands) if (i.on) i.motif.frame(dt);
  };
  const run = () => {
    const any = islands.some((i) => i.on);
    if (any && !still && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if ((!any || document.hidden) && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  // which are on: every island in view (a phone: only the one most in view)
  const choose = () => {
    let best: Island | null = null;
    if (phone.matches) for (const i of islands) if (i.ratio > 0 && (!best || i.ratio > best.ratio)) best = i;
    for (const i of islands) {
      const on = phone.matches ? i === best : i.ratio > 0;
      if (on === i.on) continue;
      i.on = on;
      i.el.classList.toggle('on', on);
      if (on && still && !i.drawn) { i.motif.still(); i.drawn = true; }
    }
    run();
  };

  const start = () => {
    for (const el of els) {
      const cv = el.querySelector('canvas');
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) continue;
      const c = inks(el), variant = el.dataset.bgm as Variant, few = phone.matches;
      const motif = variant === 'current' ? inkCurrent(ctx, c, few) : variant === 'blueprint' ? blueprint(ctx, c, few) : inkLine(ctx, c);
      islands.push({ el, cv, ctx, variant, motif, w: 0, h: 0, ratio: 0, on: false, drawn: false });
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { const i = islands.find((x) => x.el === e.target); if (i) i.ratio = e.isIntersecting ? e.intersectionRatio : 0; }
      choose();
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    const ro = new ResizeObserver((entries) => entries.forEach((e) => { const i = islands.find((x) => x.el === e.target); if (i) fit(i); }));
    islands.forEach((i) => { fit(i); io.observe(i.el); ro.observe(i.el); });
    document.addEventListener('visibilitychange', run);
    phone.addEventListener('change', choose);
  };

  // not before the page is in use: its first paint and its measurements stay its own
  const kick = () => {
    if (started) return;
    started = true;
    EVENTS.forEach((e) => removeEventListener(e, kick));
    clearTimeout(timer);
    start();
  };
  let started = false, timer = 0;
  const EVENTS = ['scroll', 'wheel', 'touchstart', 'pointermove', 'keydown'];
  const armed = () => {
    EVENTS.forEach((e) => addEventListener(e, kick, { passive: true, once: true }));
    timer = window.setTimeout(kick, 6000);
  };
  if (document.readyState === 'complete') armed(); else addEventListener('load', armed, { once: true });
}
