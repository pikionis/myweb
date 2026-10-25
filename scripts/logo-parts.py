"""Builds src/data/logo.ts, the onehub logo as compact SVG path data, from the brand folder.

    python scripts/logo-parts.py <brand logo folder> src/data/logo.ts
    (needs numpy, pillow, scipy, scikit-image and shapely: pip install numpy pillow scipy scikit-image shapely)

The brand folder holds onehub-logo.svg (a potrace trace: the whole symbol is one outline) and the
parts as PNGs on the same canvas (onehub-symbol-1-top-loop.png ... onehub-symbol-4-blue-arc.png).
Outer edges come from the vector, smoothed so the trace's stair steps melt away; the split between
the three loops comes from the part PNGs (they partition the symbol); the draw-on centerlines are
the PNG skeletons. The letters are the vector's own subpaths.
"""
import json, re, sys
from collections import deque
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, MultiPolygon, LineString
from shapely.ops import unary_union
from skimage import measure, morphology
from scipy import ndimage

SRC = sys.argv[1]
OUT = sys.argv[2]
GRID = 20.0          # output unit = 20 canvas units (canvas is 40752 x 33012)
PNG_SCALE = 40752 / 2000  # canvas units per part-PNG pixel


# ---------- vector: parse potrace path data into rings (canvas coords, y down) ----------
def parse_rings(d, tx, ty):
    toks = re.findall(r'[MmLlCcZz]|-?\d+(?:\.\d+)?', d)
    rings, ring = [], []
    x = y = 0.0
    i, cmd = 0, None
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd in 'Zz':
                if ring: rings.append(ring); ring = []
                continue
        if cmd in 'Mm':
            dx, dy = num(), num()
            if cmd == 'm': x, y = x + dx, y + dy
            else: x, y = dx, dy
            if ring: rings.append(ring)
            ring = [(x, y)]
            cmd = 'l' if cmd == 'm' else 'L'
        elif cmd in 'Ll':
            dx, dy = num(), num()
            x, y = (x + dx, y + dy) if cmd == 'l' else (dx, dy)
            ring.append((x, y))
        elif cmd in 'Cc':
            p = [num() for _ in range(6)]
            if cmd == 'c': p = [x + p[0], y + p[1], x + p[2], y + p[3], x + p[4], y + p[5]]
            x0, y0 = x, y
            for k in range(1, 7):
                s = k / 6; u = 1 - s
                bx = u**3 * x0 + 3 * u * u * s * p[0] + 3 * u * s * s * p[2] + s**3 * p[4]
                by = u**3 * y0 + 3 * u * u * s * p[1] + 3 * u * s * s * p[3] + s**3 * p[5]
                ring.append((bx, by))
            x, y = p[4], p[5]
    if ring: rings.append(ring)
    # potrace draws in a flipped frame: translate(tx,ty) scale(1,-1)
    return [[(px + tx, ty - py) for px, py in r] for r in rings if len(r) > 2]


def evenodd(rings):
    geom = Polygon()
    for r in rings:
        p = Polygon(r).buffer(0)
        geom = geom.symmetric_difference(p)
    return geom


svg = open(f'{SRC}/onehub-logo.svg', encoding='utf-8').read()
tx, ty = map(float, re.search(r'translate\(([\d.]+),([\d.]+)\)', svg).groups())
paths = re.findall(r'<path fill="(#[0-9A-Fa-f]+)"[^>]*d="([^"]+)"', svg)
ink = evenodd(parse_rings(paths[0][1], tx, ty))
blue = evenodd(parse_rings(paths[1][1], tx, ty))
ink_parts = list(ink.geoms) if isinstance(ink, MultiPolygon) else [ink]
ink_parts = [p for p in ink_parts if p.area > 50000]  # drops the 30x30 tracing specks
symbol_ink = max(ink_parts, key=lambda p: p.bounds[3] - p.bounds[1] if p.bounds[1] < 20000 else 0)
letters = sorted([p for p in ink_parts if p is not symbol_ink and p.bounds[1] > 20000], key=lambda p: p.bounds[0])
assert len(letters) == 6, len(letters)
print('symbol ink bounds', symbol_ink.bounds, 'blue', blue.bounds)


# ---------- PNG masks: the split between loops ----------
def mask(name):
    a = np.array(Image.open(f'{SRC}/onehub-{name}.png'))
    return a[..., 3] > 127


def mask_region(m, grow_px):
    m2 = ndimage.binary_dilation(m, iterations=grow_px)
    cs = measure.find_contours(np.pad(m2.astype(float), 1), 0.5)
    polys = []
    for c in cs:
        pts = [((col - 1) * PNG_SCALE, (row - 1) * PNG_SCALE) for row, col in c]
        if len(pts) > 3: polys.append(Polygon(pts).buffer(0))
    return evenodd([list(p.exterior.coords) for p in polys])


LOOPS = [('top', 'symbol-1-top-loop'), ('left', 'symbol-2-left-loop'), ('right', 'symbol-3-right-loop')]
masks = {k: mask(n) for k, n in LOOPS}
masks['arc'] = mask('symbol-4-blue-arc')
loop_shapes = {}
for k, _ in LOOPS:
    region = mask_region(masks[k], 2)
    loop_shapes[k] = symbol_ink.intersection(region)
    print(k, 'area', round(loop_shapes[k].area), 'of', round(symbol_ink.area))
cover = unary_union(list(loop_shapes.values()))
print('ink not covered by any loop:', round(symbol_ink.difference(cover).area))


# ---------- centerlines from skeletons ----------
def skeleton_graph(m):
    sk = morphology.skeletonize(m)
    pts = set(zip(*np.nonzero(sk)))
    nb = lambda p: [(p[0] + dy, p[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (p[0] + dy, p[1] + dx) in pts]
    # prune short spurs repeatedly
    for _ in range(4):
        ends = [p for p in pts if len(nb(p)) == 1]
        removed = False
        for e in ends:
            branch, cur, prev = [e], e, None
            while True:
                n = [q for q in nb(cur) if q != prev]
                if len(n) != 1 or len(nb(n[0])) > 2: break
                prev, cur = cur, n[0]; branch.append(cur)
                if len(branch) > 25: break
            if len(branch) <= 25 and len(pts) > 200:
                # only a spur if it ends at a junction
                last = branch[-1]
                n = [q for q in nb(last) if q not in branch]
                if n and len(nb(n[0])) >= 3:
                    for b in branch: pts.discard(b)
                    removed = True
        if not removed: break
    return pts, nb


def order_open(pts, nb):
    ends = [p for p in pts if len(nb(p)) == 1]
    start = ends[0]
    # BFS for the farthest point, then the path back (the longest route through the skeleton)
    def bfs(s):
        prev = {s: None}; q = deque([s]); last = s
        while q:
            c = q.popleft(); last = c
            for n in nb(c):
                if n not in prev: prev[n] = c; q.append(n)
        return last, prev
    a, _ = bfs(start)
    b, prev = bfs(a)
    path = []
    c = b
    while c is not None: path.append(c); c = prev[c]
    return path  # from b back to a


def order_cycle(pts, nb):
    start = min(pts, key=lambda p: (p[1], p[0]))
    path, prev, cur = [start], None, start
    seen = {start}
    while True:
        n = [q for q in nb(cur) if q not in seen]
        if not n: break
        # prefer orthogonal neighbours for a tidy walk
        n.sort(key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1]))
        prev, cur = cur, n[0]; seen.add(cur); path.append(cur)
    return path


def smooth(path, win=9, closed=False):
    a = np.array([(c, r) for r, c in path], float)  # (x, y) in png px
    if len(a) < win: return a
    k = np.ones(win) / win
    if closed:
        pad = np.vstack([a[-win:], a, a[:win]])
        xs = np.convolve(pad[:, 0], k, 'same')[win:-win]; ys = np.convolve(pad[:, 1], k, 'same')[win:-win]
    else:
        pad = np.vstack([np.repeat(a[:1], win, 0), a, np.repeat(a[-1:], win, 0)])
        xs = np.convolve(pad[:, 0], k, 'same')[win:-win]; ys = np.convolve(pad[:, 1], k, 'same')[win:-win]
        xs[0], ys[0], xs[-1], ys[-1] = a[0, 0], a[0, 1], a[-1, 0], a[-1, 1]
    return np.stack([xs, ys], 1)


def thickness(m):
    dt = ndimage.distance_transform_edt(m)
    sk = morphology.skeletonize(m)
    return float(np.median(dt[sk]) * 2 * PNG_SCALE)


lines = {}
thick = {}
for k in ['top', 'left', 'right', 'arc']:
    m = masks[k]
    thick[k] = thickness(m)
    pts, nb = skeleton_graph(m)
    if k == 'top':
        p = smooth(order_cycle(pts, nb), closed=True)
        # start at the bottom-left corner, walk up the left side first (clockwise on screen)
        i0 = int(np.argmin(p[:, 0] - p[:, 1]))
        p = np.vstack([p[i0:], p[:i0]])
        if p[min(20, len(p) - 1), 1] > p[0, 1]: p = p[::-1]; p = np.vstack([p[-1:], p[:-1]])
        p = np.vstack([p, p[:1]])
    else:
        p = smooth(order_open(pts, nb))
    lines[k] = p * PNG_SCALE  # canvas units
    print(k, 'centerline pts', len(p), 'thickness', round(thick[k]))

# left loop: from its top end (near the top-left crossing) round to the bottom centre; right mirrors it
for k in ['left', 'right']:
    p = lines[k]
    if p[0, 1] > p[-1, 1]: lines[k] = p[::-1]
# the blue arc: two halves, each from its top end down to the tip where the loops meet
arc = lines.pop('arc')
tip = int(np.argmax(arc[:, 1]))
h1, h2 = arc[:tip + 1], arc[tip:][::-1]
if h1[0, 0] > h2[0, 0]: h1, h2 = h2, h1
lines['arcL'], lines['arcR'] = h1, h2


# ---------- output in local boxes ----------
def simplify(g, tol):
    return g.simplify(tol, preserve_topology=True)


def ring_d(coords, ox, oy):
    pts = [(round((x - ox) / GRID), round((y - oy) / GRID)) for x, y in coords]
    # drop repeats after rounding
    out = [pts[0]]
    for p in pts[1:]:
        if p != out[-1]: out.append(p)
    if out[0] == out[-1]: out = out[:-1]
    s = f'M{out[0][0]} {out[0][1]}l'
    prev = out[0]
    parts = []
    for p in out[1:]:
        parts.append(f'{p[0] - prev[0]} {p[1] - prev[1]}'); prev = p
    s += ' '.join(parts)
    return re.sub(r' -', '-', s) + 'z'


def smooth_ring(coords, step=15, win=7):
    """Resamples a ring evenly and averages it along its length: the trace's 30-unit stairs melt
    into the curve they approximate, while features larger than the window keep their shape."""
    ls = LineString(coords)
    n = max(int(ls.length / step), 8)
    pts = np.array([ls.interpolate(i / n, normalized=True).coords[0] for i in range(n)])
    k = np.ones(win) / win
    pad = np.vstack([pts[-win:], pts, pts[:win]])
    xs = np.convolve(pad[:, 0], k, 'same')[win:-win]
    ys = np.convolve(pad[:, 1], k, 'same')[win:-win]
    out = np.stack([xs, ys], 1)
    return np.vstack([out, out[:1]])


def geom_d(g, ox, oy, tol, win=7):
    polys = list(g.geoms) if hasattr(g, 'geoms') else [g]
    out = ''
    for p in polys:
        if p.is_empty or p.area < 2000: continue
        rings = [p.exterior.coords] + [h.coords for h in p.interiors if Polygon(h).area > 2000]
        for i, r in enumerate(rings):
            sm = LineString(smooth_ring(r, win=win)).simplify(tol)
            out += ring_d(sm.coords, ox, oy)
    return out


def line_d(p, ox, oy, tol):
    ls = LineString(p).simplify(tol)
    pts = [(round((x - ox) / GRID), round((y - oy) / GRID)) for x, y in ls.coords]
    s = f'M{pts[0][0]} {pts[0][1]}L' + ' '.join(f'{x} {y}' for x, y in pts[1:])
    return s


PAD = 40  # canvas units around each box
sym_all = unary_union([*loop_shapes.values(), blue])
sx0, sy0, sx1, sy1 = sym_all.bounds
sx0 -= PAD; sy0 -= PAD; sx1 += PAD; sy1 += PAD
word_all = unary_union(letters)
wx0, wy0, wx1, wy1 = word_all.bounds
wx0 -= PAD; wy0 -= PAD; wx1 += PAD; wy1 += PAD

TOL = 10
out = {
    'symbol': {'w': round((sx1 - sx0) / GRID), 'h': round((sy1 - sy0) / GRID)},
    'word': {'w': round((wx1 - wx0) / GRID), 'h': round((wy1 - wy0) / GRID)},
    # where the word box sits relative to the symbol box in the master (stacked) lockup, in output units
    'lockup': {'wordX': round((wx0 - sx0) / GRID), 'wordY': round((wy0 - sy0) / GRID)},
    'stroke': round(max(thick.values()) / GRID, 1),
    'parts': {},
    'lines': {},
    'letters': [],
}
for k, g in loop_shapes.items():
    out['parts'][k] = geom_d(g, sx0, sy0, TOL, win=15)
out['parts']['arc'] = geom_d(blue, sx0, sy0, TOL, win=15)
for k, p in lines.items():
    out['lines'][k] = line_d(p, sx0, sy0, 12)
# letters keep their serifs: a shorter window
for ch, g in zip('onehub', letters):
    out['letters'].append({'ch': ch, 'd': geom_d(g, wx0, wy0, TOL, win=7)})

# centres of each loop in output units (for transform origins and scatter maths)
out['centers'] = {}
for k, g in [*loop_shapes.items(), ('arc', blue)]:
    c = g.centroid
    bx0, by0, bx1, by1 = g.bounds
    out['centers'][k] = {'x': round((c.x - sx0) / GRID), 'y': round((c.y - sy0) / GRID),
                         'bx': round((bx0 - sx0) / GRID), 'by': round((by0 - sy0) / GRID),
                         'bw': round((bx1 - bx0) / GRID), 'bh': round((by1 - by0) / GRID)}

tip = re.search(r'(-?\d+) (-?\d+)$', out['lines']['arcL']).groups()
q = json.dumps
ts = [
    '// The onehub logo as path data, generated from the brand files (logo/onehub-logo.svg and the part PNGs):',
    "// outer edges from the vector trace, the split between the loops from the part PNGs, and each part's",
    '// centerline (its skeleton) for the draw-on. Coordinates are whole units on the boxes below; the',
    '// symbol and the wordmark each have their own box so the header can set them side by side.',
    '// Do not edit by hand: run scripts/logo-parts.py on the brand folder instead.',
    '',
    "/** The symbol's box, and the wordmark's. */",
    f"export const symbolBox = {{ w: {out['symbol']['w']}, h: {out['symbol']['h']} }};",
    f"export const wordBox = {{ w: {out['word']['w']}, h: {out['word']['h']} }};",
    '/** In the master (stacked) lockup the wordmark box sits here, in symbol units. */',
    f"export const lockup = {{ x: {out['lockup']['wordX']}, y: {out['lockup']['wordY']} }};",
    "/** The line's thickness, in symbol units. */",
    f"export const stroke = {out['stroke']};",
    '',
    "export type LoopKey = 'top' | 'left' | 'right';",
    '',
    '/** Filled outlines of the three loops and the blue arc. */',
    'export const parts = {',
    *[f"  {k}: {q(out['parts'][k])}," for k in ['top', 'left', 'right', 'arc']],
    '};',
    '',
    '/** Centerlines in drawing order: the top loop clockwise from its lower-left corner, the side loops from',
    ' * the upper crossing round to the bottom tip, the arc in two halves that meet at the tip. */',
    'export const lines = {',
    *[f"  {k}: {q(out['lines'][k])}," for k in ['top', 'left', 'right', 'arcL', 'arcR']],
    '};',
    '',
    '/** Where the loops meet: the tip of the blue arc. */',
    f'export const tip = {{ x: {tip[0]}, y: {tip[1]} }};',
    '',
    "/** Each part's centre and bounds, for transform origins and placing the intro words. */",
    "export const centers: Record<LoopKey | 'arc', { x: number; y: number; bx: number; by: number; bw: number; bh: number }> = {"
    + ', '.join(f"{k}: {{{', '.join(f'{a}: {b}' for a, b in v.items())}}}" for k, v in out['centers'].items()) + '};',
    '',
    '/** The wordmark, letter by letter. */',
    'export const letters = [',
    *[f"  {{ ch: {q(l['ch'])}, d: {q(l['d'])} }}," for l in out['letters']],
    '];',
    '',
]
open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(ts))
size = sum(len(v) for v in out['parts'].values()) + sum(len(l['d']) for l in out['letters']) + sum(len(v) for v in out['lines'].values())
print('boxes', out['symbol'], out['word'], out['lockup'], 'stroke', out['stroke'], 'path chars', size, '->', OUT)
