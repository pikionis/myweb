// The DeinDeal chapter's drawing ("Swiss precision", DeinDealChapter.astro; src/scripts/deindeal.ts plays it): a
// watch movement that turns into a product line. Messy product data comes in on the left and leaves on the right as
// clean, translated product cards; each gear is a stage, the AI at the centre drives them. A function per beat
// below; the movement itself stays from the moment it is built. Authored as the chapter ends (Feedgenix a dot on
// the line of client work), which is how it rests without script.
import { r1, C, R, P as pen } from './lineart';
import { type N, P, G, F, X, person, pill, written } from './storypen';
import { zurich } from './zurich';
import { art, t, lang, type Lang } from '../data/mystory';

const K = art.deindeal;
export const VIEW = { w: 960, h: 540 };
/** numbers as the story's language writes them (800,000 / 800.000) */
const LOCALE = ({ en: 'en-US', el: 'el-GR', de: 'de-CH' } as Record<Lang, string>)[lang];
/** the line of client work */
const SIDE_Y = 524;

// ---- product cards: a small card with a line icon (a shoe, a lamp, a phone, a sofa), 26 by 22 from (0, 0)

const ICONS = [
  'M5 15H21C21 12 18 12 15 11L12 7H9V11H5Z',
  'M9 6H17L19 11H7ZM13 11V16M10 16H16',
  'M9.5 4H16.5V18H9.5ZM12 15.5H14',
  'M5 9V15H21V9M7 9V7H19V9M5 15V17M21 15V17M7 12H19',
];
const card = (i: N) => P(R(0, 0, 26, 22, 3), 'solid') + pen(ICONS[i % ICONS.length], 'thin');
/** a card set somewhere, as a part the script moves (its place is its transform) */
const item = (p: string, i: N, x: N, y: N, rot = 0, extra = '') =>
  G(p, card(i), `transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)} 13 11)" data-x="${r1(x)}" data-y="${r1(y)}" data-rot="${r1(rot)}"${extra}`);
/** a steady scatter (the same on every build) */
const rnd = (k: N) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ---- the movement: gears that mesh

/** a gear's outline: n teeth of module m round (0, 0), the first pointing right; its rim, spokes and hub */
const gearShape = (n: N, m: N, extra = '') => {
  const rp = (m * n) / 2, ro = rp + m * 0.9, rr = rp - m * 1.1, step = (Math.PI * 2) / n;
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = k * step;
    [[a - step * 0.5, rr], [a - step * 0.22, rr], [a - step * 0.13, ro], [a + step * 0.13, ro], [a + step * 0.22, rr]].forEach(([g, r], i) =>
      (d += `${k + i ? 'L' : 'M'}${r1(Math.cos(g) * r)} ${r1(Math.sin(g) * r)}`));
  }
  const spokes = [0, 1, 2, 3, 4].map((i) => {
    const a = (i * Math.PI * 2) / 5;
    return `M${r1(Math.cos(a) * rp * 0.32)} ${r1(Math.sin(a) * rp * 0.32)}L${r1(Math.cos(a) * (rr - 7))} ${r1(Math.sin(a) * (rr - 7))}`;
  }).join('');
  return P(d + 'Z', `solid ${extra}`.trim()) + pen(C(0, 0, rr - 7), `thin ${extra}`.trim()) + pen(spokes, `thin ${extra}`.trim()) + pen(C(0, 0, rp * 0.3), extra);
};
const M = 7;
/** the AI at the centre, and the four stages round it: Fix and Translate mesh with it, Filter with Fix, Validate
 *  with Translate (Fix and Translate do not touch, so every gear can turn) */
const CORE = { x: 480, y: 337, n: 18 };
export const GEARS = [
  { x: 312, y: 250, n: 14, on: 1 },
  { x: 410, y: 250, n: 14, on: -1 },
  { x: 550, y: 250, n: 14, on: -1 },
  { x: 648, y: 250, n: 14, on: 2 },
];
/** each gear's turn: its phase (so its teeth fall in the gaps of the gear that drives it) and its ratio to the core */
const turns = (() => {
  const phase = [0, 0, 0, 0], ratio = [0, 0, 0, 0];
  const mesh = (px: N, py: N, pn: N, pphase: N, pratio: N, i: number) => {
    const g = GEARS[i], th = Math.atan2(g.y - py, g.x - px), step = (Math.PI * 2) / pn;
    // the driving gear's tooth nearest the contact, and how far it is from it
    let e = (th - pphase) % step;
    if (e > step / 2) e -= step;
    if (e < -step / 2) e += step;
    phase[i] = th + Math.PI + Math.PI / g.n - e * (pn / g.n);
    ratio[i] = -pratio * (pn / g.n);
  };
  mesh(CORE.x, CORE.y, CORE.n, 0, 1, 1);
  mesh(CORE.x, CORE.y, CORE.n, 0, 1, 2);
  mesh(GEARS[1].x, GEARS[1].y, GEARS[1].n, phase[1], ratio[1], 0);
  mesh(GEARS[2].x, GEARS[2].y, GEARS[2].n, phase[2], ratio[2], 3);
  return { phase: phase.map((p) => (p * 180) / Math.PI), ratio };
})();
const gear = (i: number, extra = '', inner = '') => {
  const g = GEARS[i];
  return G(`dd-g-${i}`, gearShape(g.n, M, extra) + inner,
    `transform="rotate(${r1(turns.phase[i])})" data-phase="${r1(turns.phase[i])}" data-ratio="${turns.ratio[i].toFixed(4)}"`);
};

const movement = () => G('dd-move', [
  pen('M-60 250H1020', '', 'data-p="dd-flow"'),
  ...[0, 1, 3].map((i) => `<g transform="translate(${GEARS[i].x} ${GEARS[i].y})">${gear(i)}</g>`),
  `<g transform="translate(${CORE.x} ${CORE.y})">` + G('dd-core', gearShape(CORE.n, M, 'ac'), 'data-phase="0" data-ratio="1"') + `</g>`,
  X(CORE.x, CORE.y + 8, 'AI', 22, 'mid bold t-ac'),
  ...K.gears.map((g, i) => X(GEARS[i].x, 182, t(g), 15, 'mid bold', `data-p="dd-gname-${i}"`)),
].join(''));
/** the Translate gear, on its own (it leaves the movement to become Feedgenix): as it ends, rolled onto the line */
const translateGear = () =>
  G('dd-tpos', `<circle class="dd-glow" data-p="dd-tglow" r="64" opacity="0"/>` + gear(2, '', G('dd-tlit', gearShape(14, M, 'ac'), 'opacity="0"')),
    `transform="translate(760 ${SIDE_Y}) scale(0.1)" opacity="0"`);

// ---- the beats

/** the opening: the flight from KOAN lands over Zurich, the Alps behind it */
const beat0 = () => G('dd-b0', `<g transform="translate(80 14)">${zurich()}</g>` +
  pen('M-40 -10C30 30 70 190 100 308', 'ac', 'data-p="dd-landing"'), 'opacity="0"');

/** a small shop, its awning and door, its front from (x, y), w wide and h tall */
const shop = (x: N, y: N, w: N, h: N) => P(R(x, y, w, h, 3), 'solid') +
  pen(`M${x - 4} ${y}L${x + 4} ${y - h * 0.28}H${x + w - 4}L${x + w + 4} ${y}`) + pen(`M${x + w * 0.38} ${y + h}V${y + h * 0.45}H${x + w * 0.62}V${y + h}`, 'thin');
/** a warehouse: a long shed under a pitched roof, a wide door */
const shed = (x: N, y: N, w: N, h: N) => P(`M${x} ${y + h}V${y + h * 0.35}L${x + w / 2} ${y}L${x + w} ${y + h * 0.35}V${y + h}Z`, 'solid') +
  pen(`M${x + w * 0.28} ${y + h}V${y + h * 0.58}H${x + w * 0.72}V${y + h}M${x + w * 0.28} ${y + h * 0.72}H${x + w * 0.72}`, 'thin');
/** the marketplace: a big hall under its sign, shelves inside */
const hall = () => P(R(640, 232, 220, 188, 6), 'solid') + P(R(682, 204, 136, 30, 6), 'solid') + X(750, 225, t(K.marketplace), 15, 'mid bold') +
  pen('M656 282H844M656 330H844M656 378H844', 'thin') +
  `<rect class="note" x="664" y="262" width="22" height="18" rx="2"/><rect class="note ac-note" x="694" y="262" width="22" height="18" rx="2"/><rect class="note" x="800" y="310" width="22" height="18" rx="2"/><rect class="note" x="664" y="358" width="22" height="18" rx="2"/>`;
const arrow = (d: string, tip: N[], back: N[]) => pen(d) + pen(`M${back[0]} ${back[1]}L${tip[0]} ${tip[1]}L${back[2]} ${back[3]}`);
/** Beat 1, the other side of the counter: then, a shop sending its products to the marketplace; it flips, and now
 *  he stands in the marketplace, the shops sending theirs to him */
const beat1 = () => G('dd-b1', [
  pen('M60 420H900', 'faint'),
  G('dd-then', [
    shop(120, 330, 96, 90), [130, 154, 178].map((x) => P(R(x, 398, 20, 22, 2), 'solid')).join(''),
    person(262, 360, 0.7),
    arrow('M300 360C420 326 520 326 624 346', [630, 348], [616, 338, 618, 356]),
    X(462, 312, K.then, 16, 'mid mono bold'),
    hall(),
  ].join('')),
  G('dd-now', [
    ...[[96, 214], [186, 214], [96, 294], [186, 294], [96, 374], [186, 374]].map(([x, y]) =>
      shop(x, y, 44, 38) + arrow(`M${x + 50} ${y + 20}C${x + 220} ${y + 20} ${520} ${300 + (y - 294) * 0.4} ${626} ${306 + (y - 294) * 0.5}`,
        [632, 307 + (y - 294) * 0.5], [620, 299 + (y - 294) * 0.5, 621, 315 + (y - 294) * 0.5])),
    X(460, 196, K.now, 16, 'mid mono bold t-ac'),
    hall(), person(750, 318, 0.78, 'ac'),
  ].join(''), 'opacity="0"'),
].join(''), 'opacity="0"');

/** Beat 2, the integrations: every partner, every format, into one hub, each pipe clicking into place */
const HUB = [600, 230, 150, 110];
const beat2 = () => G('dd-b2', K.formats.map((f, i) => {
  const y = 110 + i * 72, hy = 254 + i * 13, x0 = 128, x1 = HUB[0];
  const d = `M${x0} ${y}C${x0 + 220} ${y} ${x1 - 230} ${hy} ${x1} ${hy}`;
  const q = 0.42, bx = (1 - q) ** 3 * x0 + 3 * (1 - q) ** 2 * q * (x0 + 220) + 3 * (1 - q) * q * q * (x1 - 230) + q ** 3 * x1;
  const by = (1 - q) ** 3 * y + 3 * (1 - q) ** 2 * q * y + 3 * (1 - q) * q * q * hy + q ** 3 * hy;
  return G(`dd-pipe-${i}`, (i % 2 ? shed(64, y - 26, 56, 48) : shop(68, y - 20, 50, 40)) +
    pen(d, 'dd-pipe') + pen(d, 'dd-pipe-in') + X(r1(bx), r1(by - 12), f, 13, 'mid mono bold dd-halo') +
    G(`dd-ok-${i}`, pen(`M${x1 - 22} ${hy - 4}l4 4 8 -9`, 'ac')));
}).join('') + G('dd-hub', P(R(HUB[0], HUB[1], HUB[2], HUB[3], 14), 'solid') + X(HUB[0] + 75, HUB[1] + 50, K.hub, 18, 'mid bold') +
  pen(`M${HUB[0] + 40} ${HUB[1] + 70}H${HUB[0] + 110}M${HUB[0] + 52} ${HUB[1] + 84}H${HUB[0] + 98}`, 'thin')), 'opacity="0"');

/** Beat 3, the scale: product cards pour out of the hub and pile up; the count runs to 800,000+ */
const FLOOD = 40;
const beat3 = () => G('dd-b3', [
  ...Array.from({ length: FLOOD }, (_, i) => {
    // (most in a pile, the rest still tumbling, clear of the count)
    const pile = i < 30, x = pile ? 640 + rnd(i) * 260 : 770 + rnd(i) * 160, y = pile ? 400 + rnd(i + 50) * 90 - (i % 6) * 6 : 212 + rnd(i + 90) * 150;
    return item(`dd-flood-${i}`, i, x, y, (rnd(i + 7) - 0.5) * 70, i >= 15 ? ' class="dd-more"' : '');
  }),
  G('dd-count', X(800, 150, `${K.count.toLocaleString(LOCALE)}+`, 52, 'mid bold', `data-count="${K.count}" data-locale="${LOCALE}"`) + X(800, 178, t(K.codes), 15, 'mid')),
].join(''), 'opacity="0"');

/** Beat 4, the movement: the pile is pulled in; Filter sieves out what can't go on, Fix corrects a broken field,
 *  Translate turns a card through four languages, Validate stamps it (a person checks); the AI drives them all */
const beat4 = () => G('dd-b4', [
  ...[[110, 300], [150, 330], [128, 360], [178, 300], [196, 352], [92, 338]].map(([x, y], i) => item(`dd-pile-${i}`, i, x, y, (rnd(i + 3) - 0.5) * 50)),
  // Filter: a sieve under it, and the rejects falling through
  G('dd-sieve', P('M276 326H348L336 354H288Z', 'solid') + pen('M296 340h2M310 340h2M324 340h2M302 348h2M318 348h2', 'thick-ish')),
  ...[0, 1, 2].map((k) => G(`dd-reject-${k}`, `<g transform="translate(${296 + k * 14} 360) scale(0.6)">${card(k)}${pen('M6 5L20 17M20 5L6 17', 'thin')}</g>`)),
  // Fix: a card with a broken field, made whole; a wrench
  G('dd-fix', P(R(368, 80, 84, 54, 6), 'solid') + pen('M380 98H438', 'thin') + pen('M380 114H430', 'dd-broken thin') +
    pen('M380 114H430', 'thin', 'data-p="dd-fixed"') + pen('M380 126H418', 'thin') +
    G('dd-wrench', pen('M466 112l12 12M460 104a7 7 0 1 0 9 9l-4 -4l3 -3l4 4a7 7 0 1 0 -12 -6z'))),
  // Translate: a product card flipping through the languages
  G('dd-card', P(R(498, 78, 104, 56, 6), 'solid') + F(R(508, 88, 30, 18, 9), 'ac-fill') +
    X(523, 101, K.langs[0][0], 11, 'mid bold t-inv', 'data-p="dd-lang"') + X(508, 124, K.langs[0][1], 13, 'bold', 'data-p="dd-title"'),
    `data-langs="${K.langs.map((l) => l.join('|')).join(';')}"`),
  // Validate: a card stamped, and the person who checked it
  G('dd-check', P(R(612, 330, 72, 54, 6), 'solid') + pen('M622 346H672M622 358H660M622 370H668', 'thin')),
  G('dd-stamp', pen(C(686, 334, 15), 'ac') + pen('M679 334l5 5 9 -10', 'ac thick-ish')),
  G('dd-reviewer', person(734, 340, 0.5)),
  ...K.tags.map((g, i) => G(`dd-tag-${i}`, pill([46, 742, 40, 752][i], [86, 86, 452, 452][i], t(g), 13, i === 3 ? 'ac' : ''))),
].join(''), 'opacity="0"');

/** Beat 5, clean output: the cards come out and stand in rows on the marketplace's shelves; a daily refresh loops
 *  round the whole movement */
const SHELF = [[778, 150], [778, 236], [778, 322]];
const beat5 = () => G('dd-b5', [
  G('dd-shelves', SHELF.map(([x, y]) => pen(`M${x - 8} ${y + 24}H${x + 158}M${x - 4} ${y + 24}V${y + 34}M${x + 154} ${y + 24}V${y + 34}`)).join('')),
  ...SHELF.flatMap(([x, y], s) => [0, 1, 2, 3, 4].map((k) => item(`dd-out-${s * 5 + k}`, s * 5 + k, x + k * 30, y, 0))),
  G('dd-refresh', pen('M710 210A246 176 0 1 1 690 166', 'ac') + pen('M680 158L692 168L678 176', 'ac') + X(480, 82, t(K.refresh), 14, 'mid bold t-ac')),
].join(''), 'opacity="0"');

/** Beat 6, the spark: the Translate gear rolls out on its own and becomes a product, Feedgenix: a dataset in, the
 *  fields ticked, the languages picked */
const FG = K.feedgenix;
const beat6 = () => G('dd-b6', [
  G('dd-panel', P(R(596, 108, 334, 356, 14), 'solid') + X(676, 158, FG.name, 22, 'bold') +
    pen(R(622, 184, 284, 62, 8), 'dd-drop thin') + pen('M648 230V202M640 210L648 202L656 210', 'ac') + X(672, 221, FG.dataset, 14, 'mono') +
    X(622, 278, t(FG.fieldsLabel), 12, 'bold muted')),
  ...FG.fields.map((f, i) => G(`dd-field-${i}`, pen(R(622, 288 + i * 24, 14, 14, 3), 'thin') + pen(`M625 ${295 + i * 24}l3 3 6 -7`, 'ac') + X(646, 300 + i * 24, t(f), 13))),
  G('dd-langs', X(622, 382, t(FG.langsLabel), 12, 'bold muted') +
    K.langs.map(([code], i) => F(R(622 + i * 58, 392, 50, 24, 12), 'ac-fill') + X(647 + i * 58, 408, code, 12, 'mid bold t-inv')).join('')),
  G('dd-go', F(R(790, 426, 116, 28, 14), 'ac-fill') + X(848, 445, t(FG.go), 13, 'mid bold t-inv')),
  written('dd-site', 763, 496, FG.site, 22, 'mid mono bold'),
].join(''), 'opacity="0"');

/** Beat 7, the close: Feedgenix rolls onto the line of client work and becomes one of its dots */
const beat7 = () => G('dd-b7', `<circle class="ac-fill" data-p="dd-dot" cx="760" cy="${SIDE_Y}" r="7"/>` + X(760, SIDE_Y - 16, FG.name, 13, 'mid bold t-ac'));

const side = () => G('dd-side', pen(`M-400 ${SIDE_Y}H1360`, 'ac thin') + [-200, 120, 440, 1080].map((x) => `<circle class="ac-fill" cx="${x}" cy="${SIDE_Y}" r="4"/>`).join(''));

/** the whole chapter, as it ends */
export const deindealArt = () => [
  `<g data-p="dd-cam">`, side(), beat0(), beat1(), beat2(), beat3(), movement(), beat4(), beat5(), beat6(), translateGear(), beat7(), `</g>`,
].join('');
