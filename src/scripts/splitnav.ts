/**
 * Split nav: the active link splits away from its neighbours; hovering opens a hairline gap,
 * scrubbing across the bar moves the split, and a flick can skip links.
 *
 * Ported from KokonutUI "Split Nav" by @dorianbaffier (MIT) — https://kokonutui.com
 * Changed for this site: no React, motion or Next — a small spring integrator stands in for
 * motion's springs (same bounce and visual duration), the markup lives in Nav.astro with the
 * current page marked server-side, and the bar stays open (no compact fold).
 */

/** Gap opened on each side of the active link, in px. */
const SPLIT = 8;
/** Gap a hovered link opens around itself, in px. */
const HOVER_SPLIT = 2;
/** Movement before a press turns into a scrub, in px. */
const DRAG_SLOP = 4;
/** Seconds of release velocity added to where a flick lands. */
const PROJECTION = 0.16;
/** Pointer samples older than this (ms) do not count toward release velocity. */
const VELOCITY_WINDOW = 90;

// motion's { type: 'spring', bounce: 0.15, visualDuration: 0.32 }, as stiffness and damping
const ROOT = (2 * Math.PI) / (0.32 * 1.2);
const STIFFNESS = ROOT * ROOT;
const DAMPING = 2 * (1 - 0.15) * ROOT;

const round2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** How much link `k` is "the split one" when the split sits at `focus`. */
const bump = (focus: number, k: number) => Math.max(0, 1 - Math.abs(focus - k));

/**
 * x offset of every link for a split centred on `focus`, which may be fractional while scrubbing.
 * Offsets are centred so the bar grows evenly on both sides.
 */
const splitOffsets = (count: number, focus: number, hover: number | null) => {
  const cumulative = [0];
  let total = 0;
  for (let joint = 0; joint < count - 1; joint++) {
    let gap = SPLIT * Math.max(bump(focus, joint), bump(focus, joint + 1));
    if (hover !== null && hover !== Math.round(focus) && (joint === hover - 1 || joint === hover)) {
      gap = Math.max(gap, HOVER_SPLIT);
    }
    total += gap;
    cumulative.push(total);
  }
  return cumulative.map((x) => round2(x - total / 2));
};

/** Fractional link index under a row-local x, from the links' centres. */
const indexAt = (centers: number[], x: number) => {
  const last = centers.length - 1;
  if (last <= 0 || x <= (centers[0] ?? 0)) return 0;
  for (let k = 0; k < last; k++) {
    const a = centers[k] ?? 0, b = centers[k + 1] ?? a;
    if (x < b) return k + (x - a) / Math.max(1, b - a);
  }
  return last;
};

type Drag = { pointerId: number; startX: number; rowLeft: number; scrubbing: boolean; focus: number; samples: { x: number; t: number }[] };

const releaseVelocity = (samples: Drag['samples'], now: number) => {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW);
  const first = recent[0], last = recent.at(-1);
  if (!(first && last) || last.t === first.t) return 0;
  return ((last.x - first.x) / (last.t - first.t)) * 1000;
};

/** A square patch that hides a rounded corner while the neighbour touches. */
const capScale = (gap: number) => `scaleX(${round2(clamp(1 - gap / 1.5, 0, 1))})`;

/** Where each key sends keyboard focus, from index `i` of `n` links. */
const KEY_MOVES: Record<string, (i: number, n: number) => number> = {
  ArrowLeft: (i) => i - 1,
  ArrowRight: (i) => i + 1,
  Home: () => 0,
  End: (_, n) => n - 1,
};

type Spring = { x: number; v: number; to: number };

export function splitNav(nav: HTMLElement) {
  const row = nav.querySelector<HTMLElement>('.row');
  if (!row) return;
  const segs = [...row.querySelectorAll<HTMLElement>('.seg')];
  const links = segs.map((s) => s.querySelector('a') as HTMLAnchorElement);
  const caps = segs.map((s) => [s.querySelector<HTMLElement>('.cap.l'), s.querySelector<HTMLElement>('.cap.r')]);
  const count = segs.length;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the page you are on, as Nav.astro marked it (-1 on a page outside the menu)
  let active = segs.findIndex((s) => s.classList.contains('on'));
  /** Where a scrub or keyboard focus has moved the split, before committing. */
  let preview: number | null = null;
  let hover: number | null = null;
  let centers: number[] = [];
  let drag: Drag | null = null;
  let suppressClick = false;

  const highlight = () => preview ?? active;
  // One spring-driven offset per link.
  const xs: Spring[] = splitOffsets(count, highlight(), null).map((x) => ({ x, v: 0, to: x }));

  const render = () => {
    segs.forEach((seg, i) => {
      seg.style.transform = `translate3d(${xs[i].x}px,0,0)`;
      const [l, r] = caps[i];
      if (l) l.style.transform = capScale(xs[i].x - xs[i - 1].x);
      if (r) r.style.transform = capScale(xs[i + 1].x - xs[i].x);
    });
  };

  let raf = 0, last = 0;
  const tick = (now: number) => {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    let moving = false;
    for (const s of xs) {
      if (s.x === s.to && s.v === 0) continue;
      // semi-implicit Euler in small steps keeps the spring stable at any frame rate
      const steps = Math.ceil(dt * 240), h = dt / steps;
      for (let k = 0; k < steps; k++) {
        s.v += (-STIFFNESS * (s.x - s.to) - DAMPING * s.v) * h;
        s.x += s.v * h;
      }
      if (Math.abs(s.x - s.to) < 0.01 && Math.abs(s.v) < 0.05) { s.x = s.to; s.v = 0; } else moving = true;
    }
    render();
    if (moving) raf = requestAnimationFrame(tick); else last = 0;
  };

  /** Sends every offset towards where the current state says it belongs. */
  const retarget = (instant = false) => {
    const scrub = drag?.scrubbing;
    const targets = splitOffsets(count, scrub ? drag!.focus : highlight(), scrub ? null : hover);
    xs.forEach((s, i) => {
      s.to = targets[i] ?? 0;
      if (instant || reduce) { s.x = s.to; s.v = 0; }
    });
    const lit = highlight();
    segs.forEach((seg, i) => seg.classList.toggle('on', i === lit));
    if (instant || reduce) render();
    else if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  };

  // Measures the links' natural (untransformed) positions.
  new ResizeObserver(() => {
    centers = segs.map((s) => s.offsetLeft + s.offsetWidth / 2);
  }).observe(row);
  render();

  links.forEach((a, i) => {
    // the split moves to the clicked link while the next page loads
    a.addEventListener('click', () => { active = i; preview = null; retarget(); });
    a.addEventListener('dragstart', (e) => e.preventDefault());
    a.addEventListener('focus', () => {
      if (!a.matches(':focus-visible')) return;
      // Keyboard moves are instant: no spring for something done this often.
      preview = i;
      retarget(true);
    });
    segs[i].addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || drag?.scrubbing) return;
      hover = i;
      retarget();
    });
    segs[i].addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || drag?.scrubbing) return;
      if (hover === i) { hover = null; retarget(); }
    });
  });

  const toFocus = (clientX: number, d: Drag) => clamp(indexAt(centers, clientX - d.rowLeft), 0, count - 1);

  row.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = {
      pointerId: e.pointerId, startX: e.clientX, rowLeft: row.getBoundingClientRect().left,
      scrubbing: false, focus: Math.max(0, highlight()), samples: [{ x: e.clientX, t: e.timeStamp }],
    };
  });
  row.addEventListener('pointermove', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.scrubbing) {
      if (Math.abs(e.clientX - drag.startX) < DRAG_SLOP) return;
      drag.scrubbing = true;
      row.setPointerCapture(e.pointerId);
      hover = null;
    }
    drag.samples.push({ x: e.clientX, t: e.timeStamp });
    if (drag.samples.length > 12) drag.samples.shift();
    drag.focus = toFocus(e.clientX, drag);
    preview = Math.round(drag.focus);
    retarget();
  });
  const endDrag = (e: PointerEvent, commit: boolean) => {
    const d = drag;
    if (!d || d.pointerId !== e.pointerId) return;
    drag = null;
    if (!d.scrubbing) return;
    preview = null;
    if (!commit) { retarget(); return; }
    // A flick lands where its velocity would carry it, so it can skip links.
    const index = Math.round(toFocus(e.clientX + releaseVelocity(d.samples, e.timeStamp) * PROJECTION, d));
    // The browser still sends a click for this press; swallow it and follow the chosen link instead.
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    links[index]?.click();
  };
  row.addEventListener('pointerup', (e) => endDrag(e, true));
  row.addEventListener('pointercancel', (e) => endDrag(e, false));
  row.addEventListener('click', (e) => {
    if (suppressClick && e.isTrusted) { suppressClick = false; e.preventDefault(); e.stopPropagation(); }
  }, true);

  row.addEventListener('keydown', (e) => {
    const move = KEY_MOVES[e.key];
    const from = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (!move || from < 0) return;
    e.preventDefault();
    const next = clamp(move(from, count), 0, count - 1);
    preview = next;
    links[next]?.focus();
    retarget(true);
  });
  row.addEventListener('focusout', (e) => {
    if (row.contains(e.relatedTarget as Node | null)) return;
    preview = null;
    retarget(true);
  });
}
