/**
 * Status island: a pill that reports background work. It reshapes itself as tasks change and opens
 * into a list of everything in flight on hover, focus or tap.
 *
 * Ported from KokonutUI "Status Island" by @dorianbaffier (MIT) — https://kokonutui.com
 * Changed for this site: no React or motion — a small spring sizes the pill, the Web Animations API
 * swaps its contents, and the page drives it through set / update / remove. Styles: island.css.
 */

export type IslandTaskStatus = 'running' | 'done' | 'error';

export type IslandTask = {
  id: string;
  /** What is happening, e.g. "Sending your idea". */
  label: string;
  /** Optional second part, shown dimmed after the label. */
  detail?: string;
  status: IslandTaskStatus;
  /** 0 to 1 while running. Leave it out for work without a known length. */
  progress?: number;
  /** A follow-up, like Undo or Retry. */
  action?: { label: string; onClick: () => void };
};

// Tasks that peek out behind the island when it is closed.
const MAX_PEEK = 2;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const SWAP_MS = 220;
const RING = 2 * Math.PI * 6;
// motion's { type: 'spring', duration: 0.45, bounce: 0.18 }, approximated as stiffness and damping
const ROOT = (2 * Math.PI) / (0.36 * 1.2);
const STIFFNESS = ROOT * ROOT;
const DAMPING = 2 * (1 - 0.18) * ROOT;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string) => {
  const node = document.createElement(tag);
  node.className = cls;
  return node;
};
const describe = (t: IslandTask) => [t.label, t.detail].filter(Boolean).join(', ');
const keyOf = (t: IslandTask) => `${t.id}-${t.status}`;

function iconHTML(t: IslandTask) {
  if (t.status === 'done') {
    return `<svg class="isl-ic isl-done" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.18"/><path class="isl-check" pathLength="1" d="M4.75 8.25 7 10.5l4.25-4.75" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (t.status === 'error') {
    return `<svg class="isl-ic isl-error" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.18"/><path d="M8 4.5v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><circle cx="8" cy="11.25" r="1" fill="currentColor"/></svg>`;
  }
  const known = typeof t.progress === 'number';
  const p = known ? clamp01(t.progress!) : 0.25;
  return `<svg class="isl-ic isl-run${known ? '' : ' isl-spin'}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.18" stroke-width="2"/><circle class="isl-ring" cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="${RING}" stroke-dashoffset="${RING * (1 - p)}"/></svg>`;
}

/** A number whose digits roll to their new value, keyed from the right so the ones stay the ones. */
function setRolling(box: HTMLElement, value: number) {
  const text = String(value);
  while (box.children.length < text.length) {
    const col = el('span', 'isl-digit');
    const strip = el('span', 'isl-strip');
    strip.textContent = '0123456789';
    col.append(strip);
    box.prepend(col);
  }
  while (box.children.length > text.length) box.firstElementChild!.remove();
  [...box.children].forEach((col, i) => {
    (col.firstElementChild as HTMLElement).style.transform = `translateY(${-Number(text[i]) * 10}%)`;
  });
}

/** The trailing slot: an action (a label inside the closed pill, a real button in the list) or the percent. */
function trailing(t: IslandTask, inert: boolean): HTMLElement | null {
  if (t.action) {
    const { label, onClick } = t.action;
    if (inert) {
      const s = el('span', 'isl-act');
      s.textContent = label;
      return s;
    }
    const b = el('button', 'isl-act');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }
  if (t.status === 'running' && typeof t.progress === 'number') {
    const s = el('span', 'isl-pct');
    const digits = el('span', 'isl-digits');
    digits.setAttribute('aria-hidden', 'true');
    setRolling(digits, Math.round(clamp01(t.progress) * 100));
    s.append(digits, '%');
    return s;
  }
  return null;
}

function rowEl(t: IslandTask, inert: boolean) {
  const row = el('div', 'isl-row');
  row.dataset.key = keyOf(t);
  row.innerHTML = iconHTML(t);
  const text = el('span', 'isl-text');
  text.textContent = t.label;
  if (t.detail) {
    const d = el('span', 'isl-detail');
    d.textContent = ` · ${t.detail}`;
    text.append(d);
  }
  row.append(text);
  const trail = trailing(t, inert);
  if (trail) row.append(trail);
  return row;
}

/** Brings an existing row up to date without replacing it, so the ring and the digits can travel. */
function patchRow(row: HTMLElement, t: IslandTask, inert: boolean) {
  const text = row.querySelector('.isl-text')!;
  text.textContent = t.label;
  if (t.detail) {
    const d = el('span', 'isl-detail');
    d.textContent = ` · ${t.detail}`;
    text.append(d);
  }
  const ring = row.querySelector<SVGCircleElement>('.isl-ring');
  if (ring && typeof t.progress === 'number') {
    ring.setAttribute('stroke-dashoffset', String(RING * (1 - clamp01(t.progress))));
    row.querySelector('.isl-ic')?.classList.remove('isl-spin');
  }
  const old = row.querySelector('.isl-act, .isl-pct');
  const digits = old?.querySelector<HTMLElement>('.isl-digits');
  if (digits && !t.action && t.status === 'running' && typeof t.progress === 'number') {
    setRolling(digits, Math.round(clamp01(t.progress) * 100));
    return;
  }
  old?.remove();
  const trail = trailing(t, inert);
  if (trail) row.append(trail);
}

export function createIsland(mount: HTMLElement, { dismissAfter = 4000 } = {}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tasks: IslandTask[] = [];
  let open = false;
  let mode: 'pill' | 'list' | null = null;
  const doneAt = new Map<string, number>();
  let timers: number[] = [];

  const output = el('output', 'sr-only');
  output.setAttribute('aria-live', 'polite');
  const stage = el('div', 'isl-stage');
  stage.hidden = true;
  const peeks = Array.from({ length: MAX_PEEK }, (_, i) => {
    const p = el('div', 'isl-peek');
    p.setAttribute('aria-hidden', 'true');
    p.style.zIndex = String(-1 - i);
    stage.append(p);
    return p;
  });
  const isl = el('div', 'isl');
  stage.append(isl);
  mount.append(output, stage);

  // the pill's size rides a spring, so it reshapes rather than jumps
  const W = { x: 0, v: 0, to: 0 }, H = { x: 0, v: 0, to: 0 };
  let raf = 0, last = 0;
  const applySize = () => { isl.style.width = `${W.x}px`; isl.style.height = `${H.x}px`; };
  const tick = (now: number) => {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    let moving = false;
    for (const s of [W, H]) {
      const steps = Math.ceil(dt * 240), h = dt / steps;
      for (let k = 0; k < steps; k++) {
        s.v += (-STIFFNESS * (s.x - s.to) - DAMPING * s.v) * h;
        s.x += s.v * h;
      }
      if (Math.abs(s.x - s.to) < 0.1 && Math.abs(s.v) < 0.5) { s.x = s.to; s.v = 0; } else moving = true;
    }
    applySize();
    if (moving) raf = requestAnimationFrame(tick); else last = 0;
  };
  const morph = (jump: boolean) => {
    isl.style.width = 'max-content';
    isl.style.height = 'auto';
    const r = isl.getBoundingClientRect();
    W.to = r.width; H.to = r.height;
    if (jump || reduce) { W.x = W.to; H.x = H.to; W.v = H.v = 0; }
    applySize();
    if (!raf && (W.x !== W.to || H.x !== H.to)) { last = 0; raf = requestAnimationFrame(tick); }
  };

  const fade = (node: Element, from: Keyframe, to: Keyframe, delay = 0) =>
    reduce ? null : node.animate([from, to], { duration: SWAP_MS, easing: EASE_OUT, delay, fill: 'backwards' });
  const IN = { opacity: 0, transform: 'translateY(6px)', filter: 'blur(4px)' };
  const SHOWN = { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' };
  const OUT = { opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)' };

  const renderPill = (current: IslandTask) => {
    let pill = isl.querySelector<HTMLButtonElement>('.isl-pill');
    if (mode !== 'pill' || !pill) {
      isl.replaceChildren();
      pill = el('button', 'isl-pill');
      pill.type = 'button';
      pill.addEventListener('click', () => setOpen(true, true));
      pill.append(rowEl(current, true));
      isl.append(pill);
      mode = 'pill';
    } else {
      const row = pill.querySelector<HTMLElement>('.isl-row:not(.isl-leaving)')!;
      if (row.dataset.key === keyOf(current)) {
        patchRow(row, current, true);
      } else {
        // the old row leaves upward while the new one arrives from below
        const next = rowEl(current, true);
        row.classList.add('isl-leaving');
        row.style.width = `${row.offsetWidth}px`;
        pill.append(next);
        const leave = fade(row, SHOWN, OUT);
        if (leave) leave.onfinish = () => row.remove(); else row.remove();
        fade(next, IN, SHOWN);
      }
    }
    pill.setAttribute('aria-expanded', 'false');
    pill.setAttribute('aria-label', `${describe(current)}. ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}, show all`);
  };

  const renderList = () => {
    const hadFocus = isl.contains(document.activeElement);
    const list = el('ul', 'isl-list');
    list.tabIndex = -1;
    for (const t of tasks) {
      const li = document.createElement('li');
      li.append(rowEl(t, false));
      list.append(li);
    }
    const opening = mode !== 'list';
    isl.replaceChildren(list);
    mode = 'list';
    if (opening) fade(list, { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)' }, 50);
    // keep keyboard focus inside when the pill that held it is replaced by the list
    if (hadFocus) list.focus({ preventScroll: true });
  };

  const show = () => {
    stage.hidden = false;
    if (!reduce) stage.animate([{ opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }, SHOWN], { duration: SWAP_MS, easing: EASE_OUT });
  };
  const hide = () => {
    mode = null;
    if (reduce) { stage.hidden = true; isl.replaceChildren(); return; }
    const a = stage.animate([SHOWN, { opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }], { duration: SWAP_MS, easing: EASE_OUT });
    a.onfinish = () => { if (!tasks.length) { stage.hidden = true; isl.replaceChildren(); } };
  };

  const render = () => {
    const current = tasks.at(-1);
    if (!current) {
      open = false;
      if (!stage.hidden) hide();
      return;
    }
    const appearing = stage.hidden;
    if (appearing) show();
    const expanded = open;
    // tasks waiting behind the current one peek out above it
    const behind = Math.min(tasks.length - 1, MAX_PEEK);
    peeks.forEach((p, i) => {
      p.style.display = i < behind ? '' : 'none';
      p.style.opacity = expanded ? '0' : String(1 - (i + 1) * 0.3);
      p.style.transform = `translateY(${expanded ? 0 : -(i + 1) * 5}px) scale(${1 - (i + 1) * 0.06})`;
    });
    if (expanded) renderList(); else renderPill(current);
    morph(appearing);
  };

  // Finished tasks leave on their own, but never while someone is reading.
  const schedule = () => {
    timers.forEach(clearTimeout);
    timers = [];
    if (open) return;
    const now = Date.now();
    for (const t of tasks) {
      if (t.status !== 'done') { doneAt.delete(t.id); continue; }
      const since = doneAt.get(t.id) ?? now;
      doneAt.set(t.id, since);
      timers.push(window.setTimeout(() => api.remove(t.id), Math.max(0, dismissAfter - (now - since))));
    }
  };

  const setOpen = (next: boolean, fromTap = false) => {
    if (next === open || (next && !tasks.length)) return;
    open = next;
    // reading restarts the clock, so a task doesn't vanish as the pointer leaves
    if (open) for (const id of doneAt.keys()) doneAt.set(id, Date.now());
    render();
    schedule();
    if (open && fromTap) isl.querySelector<HTMLElement>('.isl-list')?.focus({ preventScroll: true });
  };

  isl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setOpen(true); });
  isl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setOpen(false); });
  isl.addEventListener('focusin', () => setOpen(true));
  isl.addEventListener('focusout', (e) => { if (!isl.contains(e.relatedTarget as Node | null)) setOpen(false); });
  isl.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  // a tap anywhere else closes the list on touch screens
  document.addEventListener('pointerdown', (e) => { if (open && !isl.contains(e.target as Node)) setOpen(false); });

  const api = {
    /** Adds a task, or replaces the one with the same id. The newest task is the one the pill shows. */
    set(task: IslandTask) {
      const i = tasks.findIndex((t) => t.id === task.id);
      const prev = i >= 0 ? tasks[i] : null;
      if (i >= 0) tasks[i] = task; else tasks.push(task);
      // announce new tasks and status changes, not every progress tick
      if (!prev || prev.status !== task.status) output.textContent = describe(task);
      render();
      schedule();
    },
    /** Changes part of a task; a key set to undefined is cleared. */
    update(id: string, patch: Partial<IslandTask>) {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      api.set({ ...t, ...patch, id });
    },
    remove(id: string) {
      tasks = tasks.filter((t) => t.id !== id);
      doneAt.delete(id);
      render();
      schedule();
    },
  };
  return api;
}
