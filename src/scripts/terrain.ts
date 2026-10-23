/**
 * Activity terrain: a year of GitHub contributions as columns you can tilt and turn.
 *
 * Ported from KokonutUI "Activity Terrain" by @dorianbaffier (MIT) — https://kokonutui.com
 * The projection, springs and drawing are the original. Changed for this site: no React/Tailwind,
 * the markup lives in Work.astro, and phones show the last 26 weeks so the columns stay readable.
 */

const DAYS = 7;
const GAP = 0.18;
// Tallest column, in cells.
const MAX_HEIGHT = 4.2;
const DEG = Math.PI / 180;
// Tilt of the terrain view; flat is looking straight down.
const PITCH_TERRAIN = 56 * DEG;
const YAW_TERRAIN = 18 * DEG;
// How far it turns before the edges start pulling back.
const YAW_LIMIT = 38 * DEG;
const PITCH_LIMIT = 66 * DEG;
// Drag, in radians per px.
const DRAG_YAW = 0.32 * DEG;
const DRAG_PITCH = 0.36 * DEG;
// Spin keeps going after a flick and slows on this half-life, in seconds.
const SPIN_HALF_LIFE = 0.16;
// The speed that coasts from straight on to the terrain's resting turn.
const SPIN_IN = (YAW_TERRAIN * Math.LN2) / SPIN_HALF_LIFE;
// Springs, per second squared and per second.
const PITCH_STIFFNESS = 140;
const PITCH_DAMPING = 2 * Math.sqrt(PITCH_STIFFNESS);
const EDGE_STIFFNESS = 180;
const BUMP_STIFFNESS = 400;
const BUMP_DAMPING = 2 * Math.sqrt(BUMP_STIFFNESS) * 0.7;
const BUMP = 0.45;
// Columns rise in a wave from where you grabbed; the far end lags by this share of the whole rise.
const WAVE = 0.7;
// room for the day labels that sit left of the board in the flat view
const PADDING = 44;
const REST_EPSILON = 0.0005;
const LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
// Below this width the board shows half a year.
const NARROW = 640;

type Cell = { index: number; col: number; row: number; count: number; level: number; height: number; date: Date };
type Pose = { yaw: number; pitch: number; scale: number; cx: number; cy: number };
type Rgb = [number, number, number];
type Palette = { levels: Rgb[]; accent: Rgb; text: string; font: string };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// A gentle overshoot, so each column pops as it lands.
function easeOutBack(t: number) {
  const c = 1.4, u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

// Resistance past an edge: the further out, the less it moves.
function rubber(value: number, min: number, max: number) {
  if (value < min) return min - 0.18 * (1 - Math.exp((value - min) / 0.18));
  if (value > max) return max + 0.18 * (1 - Math.exp((max - value) / 0.18));
  return value;
}

function parseDay(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function buildCells(data: number[], endDate: string): Cell[] {
  const end = parseDay(endDate);
  const start = new Date(end.getTime() - (data.length - 1) * 86_400_000);
  // Rows run Monday to Sunday.
  const offset = (start.getUTCDay() + 6) % 7;
  const max = Math.max(1, ...data);
  return data.map((count, index) => {
    const slot = index + offset;
    const norm = count / max;
    return {
      index, count,
      col: Math.floor(slot / DAYS),
      row: slot % DAYS,
      level: count === 0 ? 0 : Math.ceil(norm * 4),
      height: 0.06 + norm ** 0.85 * MAX_HEIGHT,
      date: new Date(start.getTime() + index * 86_400_000),
    };
  });
}

function hexToRgb(value: string): Rgb {
  const hex = value.trim().replace('#', '');
  const n = Number.parseInt(hex.length === 3 ? hex.replace(/./g, '$&$&') : hex, 16);
  return [Math.floor(n / 65_536) % 256, Math.floor(n / 256) % 256, n % 256];
}

function shade([r, g, b]: Rgb, amount: number) {
  const k = 1 - amount;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
}

function readPalette(node: HTMLElement): Palette {
  const style = getComputedStyle(node);
  const read = (name: string) => style.getPropertyValue(name) || '#888888';
  return {
    levels: [0, 1, 2, 3, 4].map((l) => hexToRgb(read(`--terrain-${l}`))),
    accent: hexToRgb(read('--terrain-accent')),
    text: read('--terrain-text'),
    font: style.fontFamily,
  };
}

function project(pose: Pose, x: number, y: number, z: number) {
  const cos = Math.cos(pose.yaw), sin = Math.sin(pose.yaw);
  const xr = x * cos - z * sin;
  const zr = x * sin + z * cos;
  return [pose.cx + xr * pose.scale, pose.cy + (zr * Math.cos(pose.pitch) - y * Math.sin(pose.pitch)) * pose.scale];
}

/** The faces of one column that face the camera, top last. */
function visibleFaces(pose: Pose, x0: number, z0: number, h: number) {
  const x1 = x0 + 1 - GAP, z1 = z0 + 1 - GAP;
  const p = (x: number, y: number, z: number) => project(pose, x, y, z);
  const faces: { points: number[][]; tone: number }[] = [];
  const sin = Math.sin(pose.yaw), cos = Math.cos(pose.yaw);
  if (h > 0.02 && pose.pitch > 0.01) {
    // Of the four walls, the ones whose outward side points at the camera.
    faces.push(cos > 0
      ? { points: [p(x0, 0, z1), p(x1, 0, z1), p(x1, h, z1), p(x0, h, z1)], tone: 0.22 }
      : { points: [p(x0, 0, z0), p(x1, 0, z0), p(x1, h, z0), p(x0, h, z0)], tone: 0.22 });
    if (sin > 0.001) faces.push({ points: [p(x1, 0, z0), p(x1, 0, z1), p(x1, h, z1), p(x1, h, z0)], tone: 0.38 });
    else if (sin < -0.001) faces.push({ points: [p(x0, 0, z0), p(x0, 0, z1), p(x0, h, z1), p(x0, h, z0)], tone: 0.38 });
  }
  faces.push({ points: [p(x0, h, z0), p(x1, h, z0), p(x1, h, z1), p(x0, h, z1)], tone: 0 });
  return faces;
}

function inside(points: number[][], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function polygon(ctx: CanvasRenderingContext2D, points: number[][]) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

const formatDay = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const formatMonth = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

/**
 * Wires one terrain. Expects inside `root`: a <canvas>, a [data-readout] line,
 * [data-view="flat" | "terrain"] buttons, and a JSON <script> with { endDate, counts }.
 */
export function activityTerrain(root: HTMLElement) {
  const canvas = root.querySelector('canvas');
  const readoutEl = root.querySelector<HTMLElement>('[data-readout]');
  const dataEl = root.querySelector('script[type="application/json"]');
  if (!canvas || !readoutEl || !dataEl) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const all: { endDate: string; counts: number[] } = JSON.parse(dataEl.textContent || '{}');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-view]')];

  let data: number[] = [], cells: Cell[] = [], weeks = 1, total = 0;
  let palette: Palette | null = null;
  let flat = false, active: Cell | null = null;

  const s = {
    yaw: 0, yawSpeed: 0,
    // The intro tilts it up from flat once it's on screen.
    pitch: 0, pitchSpeed: 0, pitchTarget: PITCH_TERRAIN,
    bumps: new Float64Array(0), bumpSpeeds: new Float64Array(0),
    hovered: -1,
    origin: { col: 0, row: 3 },
    width: 0, height: 0, dpr: 1,
    drag: null as null | { id: number; x: number; y: number; yaw: number; pitch: number; moved: boolean; samples: { t: number; x: number; y: number }[] },
    raf: 0, last: 0, visible: false, started: false,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const setData = (narrow: boolean) => {
    data = narrow ? all.counts.slice(-26 * DAYS) : all.counts;
    cells = buildCells(data, all.endDate);
    weeks = (cells.at(-1)?.col ?? 0) + 1;
    total = data.reduce((sum, n) => sum + n, 0);
    s.bumps = new Float64Array(cells.length);
    s.bumpSpeeds = new Float64Array(cells.length);
    s.hovered = -1; active = null;
    canvas.setAttribute('aria-label', `GitHub activity: ${total} contributions over ${weeks} weeks. Use the arrow keys to read each day.`);
    readout();
  };

  const readout = () => {
    readoutEl.textContent = active
      ? `${active.count} ${active.count === 1 ? 'contribution' : 'contributions'} on ${formatDay(active.date)}`
      : `${total.toLocaleString('en-US')} contributions in the last ${data === all.counts ? 'year' : `${weeks} weeks`}`;
  };

  // How tall each column stands right now: the rise travels as a wave out from the origin,
  // and each column overshoots a touch as it lands.
  const columnHeight = (cell: Cell, lift: number) => {
    const span = Math.hypot(weeks, DAYS) || 1;
    const d = Math.hypot(cell.col - s.origin.col, cell.row - s.origin.row) / span;
    const local = clamp(lift * (1 + WAVE) - d * WAVE, 0, 1);
    return cell.height * easeOutBack(local) + s.bumps[cell.index];
  };

  const pose = (): Pose & { lift: number } => {
    const lift = clamp(s.pitch / PITCH_TERRAIN, 0, 1.2);
    // Fit the whole board, at its current turn and tilt, into the canvas.
    const w = weeks;
    const probe: Pose = { yaw: s.yaw, pitch: s.pitch, scale: 1, cx: 0, cy: 0 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, z] of [[0, 0], [w, 0], [0, DAYS], [w, DAYS]]) {
      for (const y of [0, MAX_HEIGHT * Math.min(lift, 1)]) {
        const [px, py] = project(probe, x - w / 2, y, z - DAYS / 2);
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
    }
    const scale = Math.min((s.width - PADDING * 2) / (maxX - minX), (s.height - PADDING * 2) / (maxY - minY));
    return {
      yaw: s.yaw, pitch: s.pitch, scale, lift,
      cx: s.width / 2 - ((minX + maxX) / 2) * scale,
      cy: s.height / 2 - ((minY + maxY) / 2) * scale + 6,
    };
  };

  // Back to front: the further a column's base, the earlier it's drawn.
  const ordered = (p: Pose) => {
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const depth = (c: Cell) => (c.col + 0.5 - weeks / 2) * sin + (c.row + 0.5 - DAYS / 2) * cos;
    return [...cells].sort((a, b) => depth(a) - depth(b));
  };

  const drawLabels = (p: Pose, lift: number, pal: Palette) => {
    // Labels lie on the ground, so they'd hide behind the columns; they fade out as the terrain
    // rises, and the readout names each day.
    const alpha = clamp(1 - lift * 1.6, 0, 1);
    if (alpha === 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pal.text;
    ctx.font = `13px ${pal.font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let month = -1;
    for (const cell of cells) {
      if (cell.row !== 0 && cell.index !== 0) continue;
      const m = cell.date.getUTCMonth();
      if (m !== month && cell.col < weeks - 1) {
        month = m;
        const [x, y] = project(p, cell.col - weeks / 2, 0, -0.75 - DAYS / 2);
        ctx.fillText(formatMonth(cell.date), x, y);
      }
    }
    ctx.textAlign = 'right';
    for (let row = 0; row < DAYS; row++) {
      if (!LABELS[row]) continue;
      const [x, y] = project(p, -0.35 - weeks / 2, 0, row + 0.4 - DAYS / 2);
      ctx.fillText(LABELS[row], x, y);
    }
    ctx.globalAlpha = 1;
  };

  const draw = () => {
    if (!s.width) return;
    // Colours come from CSS, read once rather than every frame.
    palette ??= readPalette(canvas);
    const p = pose();
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.width, s.height);
    drawLabels(p, p.lift, palette);
    ctx.lineJoin = 'round';
    for (const cell of ordered(p)) {
      const h = columnHeight(cell, p.lift);
      const color = cell.index === s.hovered ? palette.accent : palette.levels[cell.level];
      for (const face of visibleFaces(p, cell.col - weeks / 2, cell.row - DAYS / 2, h)) {
        polygon(ctx, face.points);
        const fill = shade(color, face.tone);
        ctx.fillStyle = fill;
        ctx.fill();
        // A hairline in the same colour closes the seams between faces.
        ctx.strokeStyle = fill;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  };

  const hitTest = (x: number, y: number) => {
    const p = pose();
    const list = ordered(p);
    for (let i = list.length - 1; i >= 0; i--) {
      const cell = list[i];
      const h = columnHeight(cell, p.lift);
      for (const face of visibleFaces(p, cell.col - weeks / 2, cell.row - DAYS / 2, h)) {
        if (inside(face.points, x, y)) return cell;
      }
    }
    return null;
  };

  const stepSprings = (dt: number) => {
    let energy = 0;
    if (!s.drag) {
      // Spin coasts, then the edge pulls it back in range.
      s.yawSpeed *= 0.5 ** (dt / SPIN_HALF_LIFE);
      let target = s.yaw;
      if (s.pitchTarget === 0) target = 0; // flat is always square on
      else if (s.yaw > YAW_LIMIT) target = YAW_LIMIT;
      else if (s.yaw < -YAW_LIMIT) target = -YAW_LIMIT;
      if (target !== s.yaw) {
        s.yawSpeed += ((target - s.yaw) * EDGE_STIFFNESS - s.yawSpeed * 2 * Math.sqrt(EDGE_STIFFNESS)) * dt;
      }
      s.yaw += s.yawSpeed * dt;
      energy = Math.max(energy, Math.abs(s.yawSpeed), Math.abs(target - s.yaw));

      const force = (s.pitchTarget - s.pitch) * PITCH_STIFFNESS - s.pitchSpeed * PITCH_DAMPING;
      s.pitchSpeed += force * dt;
      s.pitch += s.pitchSpeed * dt;
      energy = Math.max(energy, Math.abs(s.pitchSpeed), Math.abs(s.pitchTarget - s.pitch));
    }
    for (let i = 0; i < s.bumps.length; i++) {
      const target = i === s.hovered && s.pitch > 0.1 ? BUMP : 0;
      s.bumpSpeeds[i] += ((target - s.bumps[i]) * BUMP_STIFFNESS - s.bumpSpeeds[i] * BUMP_DAMPING) * dt;
      s.bumps[i] += s.bumpSpeeds[i] * dt;
      energy = Math.max(energy, Math.abs(s.bumpSpeeds[i]) * 0.1, Math.abs(target - s.bumps[i]));
    }
    return energy;
  };

  const tick = (now: number) => {
    s.raf = 0;
    const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
    s.last = now;
    const energy = stepSprings(dt);
    draw();
    if ((s.drag || energy > REST_EPSILON) && s.visible) s.raf = requestAnimationFrame(tick);
    else s.last = 0;
  };

  // Swing round from straight on as it tilts up, coasting to a stop at the resting turn.
  const turnIn = () => {
    if (Math.abs(s.yaw) > 2 * DEG) return;
    if (s.reduceMotion) s.yaw = YAW_TERRAIN;
    else s.yawSpeed = SPIN_IN;
  };

  const wake = () => {
    if (s.reduceMotion) {
      // No travel: everything lands where it's going.
      s.pitch = s.pitchTarget;
      s.yaw = clamp(s.yaw, -YAW_LIMIT, YAW_LIMIT);
      s.pitchSpeed = 0; s.yawSpeed = 0;
      s.bumps.fill(0);
      draw();
      return;
    }
    if (!s.raf && s.visible) s.raf = requestAnimationFrame(tick);
  };

  const setFlat = (next: boolean) => {
    flat = next;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.view === 'flat') === flat)));
  };
  const setView = (nextFlat: boolean) => {
    setFlat(nextFlat);
    s.origin = { col: nextFlat ? weeks : 0, row: 3 };
    s.pitchTarget = nextFlat ? 0 : PITCH_TERRAIN;
    s.yawSpeed = 0;
    if (!nextFlat) turnIn();
    wake();
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const next = b.dataset.view === 'flat';
    if (next !== flat) setView(next);
  }));

  setData(root.clientWidth < NARROW);
  setFlat(false);

  new ResizeObserver(([entry]) => {
    s.width = entry.contentRect.width;
    s.height = entry.contentRect.height;
    s.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(s.width * s.dpr);
    canvas.height = Math.round(s.height * s.dpr);
    const narrow = root.clientWidth < NARROW;
    if ((data.length !== all.counts.length) !== narrow) setData(narrow);
    draw();
  }).observe(canvas);

  let onScreen = false;
  const update = () => {
    s.visible = onScreen && !document.hidden;
    if (s.visible) {
      if (!s.started) {
        s.started = true;
        if (s.pitchTarget > 0) turnIn();
      }
      wake();
    } else if (s.raf) {
      cancelAnimationFrame(s.raf);
      s.raf = 0; s.last = 0;
    }
  };
  // start the rise a little before it's fully in view, so it is landing as you arrive
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); }, { threshold: 0.35 }).observe(canvas);
  document.addEventListener('visibilitychange', update);

  const localPoint = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const hover = (cell: Cell | null) => {
    const index = cell ? cell.index : -1;
    if (index === s.hovered) return;
    s.hovered = index;
    active = cell;
    readout();
    if (s.reduceMotion) draw(); else wake();
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const { x, y } = localPoint(e);
    canvas.setPointerCapture(e.pointerId);
    const cell = hitTest(x, y);
    if (cell) s.origin = { col: cell.col, row: cell.row };
    s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: s.yaw, pitch: s.pitch, moved: false, samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
    s.yawSpeed = 0; s.pitchSpeed = 0;
    canvas.classList.add('dragging');
    hover(cell);
    wake();
  });

  canvas.addEventListener('pointermove', (e) => {
    const drag = s.drag;
    if (!drag || drag.id !== e.pointerId) {
      if (e.pointerType === 'mouse') { const { x, y } = localPoint(e); hover(hitTest(x, y)); }
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    s.yaw = rubber(drag.yaw + dx * DRAG_YAW, -YAW_LIMIT, YAW_LIMIT);
    s.pitch = rubber(drag.pitch + dy * DRAG_PITCH, 0, PITCH_LIMIT);
    drag.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    if (drag.samples.length > 5) drag.samples.shift();
    if (s.reduceMotion) draw(); else wake();
  });

  const release = (e: PointerEvent) => {
    const drag = s.drag;
    if (!drag || drag.id !== e.pointerId) return;
    s.drag = null;
    canvas.classList.remove('dragging');
    if (!drag.moved) { wake(); return; }
    // Velocity from the last few samples, in px per second.
    const first = drag.samples[0];
    const lastSample = drag.samples.at(-1) ?? first;
    const dt = Math.max((lastSample.t - first.t) / 1000, 0.016);
    const recent = e.timeStamp - lastSample.t < 80;
    s.yawSpeed = recent ? ((lastSample.x - first.x) / dt) * DRAG_YAW : 0;
    s.pitchSpeed = recent ? ((lastSample.y - first.y) / dt) * DRAG_PITCH : 0;
    // Land on whichever view the throw is heading for.
    const nextFlat = s.pitch + s.pitchSpeed * 0.15 < PITCH_TERRAIN / 2;
    setFlat(nextFlat);
    s.pitchTarget = nextFlat ? 0 : PITCH_TERRAIN;
    wake();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', (e) => { if (!s.drag && e.pointerType === 'mouse') hover(null); });

  canvas.addEventListener('keydown', (e) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const current = cells[s.hovered] ?? cells.at(-1);
    if (!current) return;
    const next = cells.find((c) => c.col === current.col + move[0] && c.row === current.row + move[1]);
    hover(next ?? current);
  });
}
