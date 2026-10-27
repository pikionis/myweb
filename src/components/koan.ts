// The KOAN chapter's map ("Opening the skies", KoanChapter.astro; src/scripts/koan.ts plays it): Europe's markets
// as dots, the three islands of the Dodecanese, and the routes the line draws between them; existing routes in ink,
// the new ones the strategy set out to open in cobalt. Each beat is one more picture on it, a function each below.
// Authored as the chapter ends (the map, and the line lifting off for what comes next), which is how it rests
// without script; the script opens it from the runway.
import { r1, C, R, P as pen } from './lineart';
import { type N, P, G, F, X, width, person, pill, walker, smooth, KOS, place } from './storypen';
import { art, t } from '../data/mystory';

const K = art.koan;
export const VIEW = { w: 640, h: 520 };

/** London, Berlin, then other markets of Europe (left unnamed) */
const MARKETS = [[120, 150], [300, 128], [205, 182], [392, 92], [250, 252], [92, 292], [432, 206], [346, 286], [196, 88]];
const [LON, BER] = MARKETS;
/** the islands: Kos (its outline, small), Astypalea to the west, Nisyros to the south */
const KOS_AT = [500, 386];
const kosPath = smooth(place(KOS, 204, 298, 0.2, KOS_AT[0], KOS_AT[1]));
const ASTY = 'M404 420c-10 -8 -6 -22 6 -22c8 0 12 6 14 12c2 -8 8 -14 16 -12c10 2 10 16 0 22c-6 4 -12 2 -16 -2c-2 6 -8 10 -14 8c-4 -1 -6 -3 -6 -6z';
const NIS = [512, 440];
/** where the routes reach the islands */
const KOS_PORT = [506, 390];
/** the route from the largest market */
const UK_WAY = [LON, [250, 175], [410, 290], KOS_PORT];
const way = (pts: N[][]) => `M${pts[0][0]} ${pts[0][1]}C${pts.slice(1).map((p) => p.join(' ')).join(' ')}`;
/** a route from a to b, bowing up (its control point, and the path) */
const bend = (a: N[], b: N[], bow: N) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  return [r1(mx + dy * bow), r1(my - Math.abs(dx) * bow)];
};
const arc = (a: N[], b: N[], bow = 0.25) => `M${a[0]} ${a[1]}Q${bend(a, b, bow).join(' ')} ${b[0]} ${b[1]}`;
/** the same route flown only to q: the part flown, where it stops and which way it was heading, and points along
 *  the part left (n of them, short of b) */
const cut = (a: N[], b: N[], bow: N, q: N, n: N) => {
  const c = bend(a, b, bow), lerp = (p: N[], s: N[], f: N) => [p[0] + (s[0] - p[0]) * f, p[1] + (s[1] - p[1]) * f];
  const p1 = lerp(a, c, q), p2 = lerp(c, b, q), at = lerp(p1, p2, q);
  const left = Array.from({ length: n }, (_, i) => {
    const f = (i + 1) / (n + 1);
    return lerp(lerp(at, p2, f), lerp(p2, b, f), f).map(r1);
  });
  return { flown: `M${a[0]} ${a[1]}Q${p1.map(r1).join(' ')} ${at.map(r1).join(' ')}`, at: at.map(r1), dir: [p2[0] - p1[0], p2[1] - p1[1]], left };
};

// ---- the map that stays

const base = () => G('ko-base', [
  ...MARKETS.map(([x, y], i) => `<circle class="ko-market" data-p="ko-market-${i}" cx="${x}" cy="${y}" r="4"/>`),
  G('ko-isles', [
    P(kosPath, 'solid'), P(ASTY, 'solid'), P(C(NIS[0], NIS[1], 11), 'solid'), pen(C(NIS[0], NIS[1], 4), 'thin'),
    X(560, 428, t(K.islands[0]), 12, 'mid bold'), X(420, 448, t(K.islands[1]), 12, 'mid bold'), X(512, 468, t(K.islands[2]), 12, 'mid bold'),
  ].join('')),
].join(''));
/** the line of client work: thin cobalt under the map, a dot now and then */
const side = () => G('ko-side', pen('M-400 506H1040', 'ac thin') + [-300, 40, 380, 720].map((x) => `<circle class="ac-fill" cx="${x}" cy="506" r="4"/>`).join(''));
/** the route from the UK, the largest market: thick, in ink (it was already flown), and a light running along it */
const ukRoute = () => G('ko-uk', [
  pen(way(UK_WAY), 'thick-ish', 'data-p="ko-uk-way"'),
  `<path class="ko-pulse" data-p="ko-pulse" pathLength="1" d="${way(UK_WAY)}"/>`,
  X(LON[0] - 26, LON[1] - 16, t(K.uk), 16, 'mid bold'),
].join(''));

// ---- the beats

/** the opening: the line coming down from the morning becomes a runway, then the horizon of the Dodecanese */
const beat0 = () => G('ko-b0', [
  pen('M0 0C120 30 250 120 316 232', 'ac', 'data-p="ko-descent"'),
  pen('M0 232H640', '', 'data-p="ko-horizon"'),
  G('ko-runway', pen('M300 236L170 500M340 236L470 500') + pen([0, 1, 2, 3, 4, 5].map((i) => {
    const y0 = 246 + i * 40, y1 = y0 + 14 + i * 4;
    return `M320 ${y0}V${y1}`;
  }).join(''), 'thick-ish')),
  G('ko-skyline', [
    pen('M380 232C420 228 446 214 472 206C494 200 514 212 542 220C572 226 604 230 630 232'),
    pen('M120 232C148 224 160 200 172 198C184 200 196 224 226 232'),
    pen('M8 232C20 222 34 216 46 222C54 226 60 226 68 218C80 210 92 224 104 232'),
    X(510, 258, t(K.islands[0]), 12, 'mid'), X(172, 258, t(K.islands[2]), 12, 'mid'), X(56, 258, t(K.islands[1]), 12, 'mid'),
  ].join('')),
].join(''), 'opacity="0"');

/** Beat 1, the mandate: the three islands, a mayor by each; three dotted lines meet at one figure; the budget */
const MAYORS = [[618, 364], [382, 398], [546, 432]];
const ME = [478, 296];
const dots = (a: N[], b: N[], n = 7) => Array.from({ length: n }, (_, i) => {
  const q = (i + 1) / (n + 1);
  return `<circle class="ko-dot" cx="${r1(a[0] + (b[0] - a[0]) * q)}" cy="${r1(a[1] + (b[1] - a[1]) * q)}" r="2.2"/>`;
}).join('');
const beat1 = () => G('ko-b1', [
  ...MAYORS.map(([x, y], i) => G(`ko-mayor-${i}`, person(x, y, 0.42)) + G(`ko-link-${i}`, dots([x, y + 8], [ME[0], ME[1] + 14]))),
  G('ko-me', person(ME[0], ME[1], 0.62, 'ac') + X(ME[0], ME[1] + 52, t(K.me), 13, 'mid bold')),
  G('ko-budget', pill(ME[0] - 34, ME[1] + 60, K.budget, 14, 'ac')),
].join(''), 'opacity="0"');

/** a pavilion at a fair: its posts, its name across the top, the islands on its back wall, its counter */
const booth = (x: N, y: N, fair: string) => [
  pen(`M${x - 42} ${y + 64}V${y}M${x + 42} ${y + 64}V${y}`), P(R(x - 48, y - 6, 96, 20, 3), 'solid'), X(x, y + 9, fair, 12, 'mid bold'),
  P(R(x - 40, y + 18, 80, 40, 3), 'solid'),
  pen(smooth(place(KOS, 204, 298, 0.09, x - 10, y + 26)), 'thin'), pen(C(x - 4, y + 44, 4) + C(x - 26, y + 40, 5), 'thin'),
  P(R(x - 30, y + 52, 60, 12, 2), 'solid'),
].join('');
/** Beat 2, on Europe's biggest stages: a pavilion of our own at each fair, and the people gathering at them */
const beat2 = () => G('ko-b2', K.fairs.map((f, i) => {
  const [x, y] = MARKETS[i], top = y + 22;
  return G(`ko-fair-${i}`, X(x, y - 12, t(f.city), 13, 'mid bold') + booth(x, top, f.fair)) +
    G(`ko-crowd-${i}`, [-34, -8, 22, 46].map((dx, k) => walker(`ko-visitor-${i}-${k}`, x + dx, top + 98, 0.36)).join(''));
}).join(''), 'opacity="0"');

/** what each action is, in a small sign */
const SIGN = [
  (x: N, y: N) => pen(`M${x - 11} ${y + 3}L${x + 11} ${y - 3}M${x - 2} ${y}L${x - 8} ${y + 10}M${x + 2} ${y - 1}L${x - 2} ${y - 11}M${x + 9} ${y - 2}L${x + 11} ${y - 8}`),
  (x: N, y: N) => pen(R(x - 11, y - 7, 15, 14, 2)) + pen(`M${x + 4} ${y - 2}L${x + 11} ${y - 6}V${y + 6}L${x + 4} ${y + 2}`),
  (x: N, y: N) => pen(C(x, y, 10)) + F(`M${x - 3} ${y - 5}L${x + 5} ${y}L${x - 3} ${y + 5}Z`, 'fill-ink'),
  (x: N, y: N) => pen(`M${x - 11} ${y - 8}H${x + 11}V${y + 4}H${x - 2}L${x - 8} ${y + 10}V${y + 4}H${x - 11}Z`),
];
/** Beat 3, the strongest market: the map comes in close on the UK; the portfolio of actions fans out round it
 *  (the cards stay put while the map zooms behind them) */
// (two over the route from London, two under it)
const CARDS = [[170, 26], [214, 82], [150, 300], [150, 352]];
const beat3 = () => G('ko-b3', K.actions.map((a, i) => {
  const [x, y] = CARDS[i];
  return G(`ko-card-${i}`, P(R(x, y, 262, 44, 9), 'solid') + SIGN[i](x + 22, y + 22) +
    X(x + 44, y + 19, t(a.what), 12, 'bold') + X(x + 44, y + 35, t(a.with), 12, 't-ac'));
}).join('') + G('ko-more', X(CARDS[3][0] + 14, CARDS[3][1] + 66, t(K.more), 12, 'muted')), 'opacity="0"');

/** the markets the strategy would target (left unnamed, clear of the route from the UK): the portfolio goes to
 *  their airlines, the new routes head for them */
const NEW = [MARKETS[8], MARKETS[3]];
/** where the new routes leave from: the airport's runway */
const AIR = [528, 376];
/** an airline over a market: a tail fin on a stub of fuselage (no livery: partners in words, never logos) */
const fin = (x: N, y: N) => pen(`M${x - 16} ${y - 10}H${x + 12}`, 'thin') + P(`M${x - 9} ${y - 10}L${x + 1} ${y - 30}H${x + 8}L${x + 6} ${y - 10}Z`, 'solid');
/** Beat 4, the aim: the actions gathered into one portfolio, and dotted lines from it to the airlines of the markets
 *  we would target */
const FROM = [[178, 364], [212, 364]];
const beat4 = () => G('ko-b4', [
  G('ko-folder', P(R(56, 356, 64, 24, 6), 'solid') + P(R(56, 368, 172, 94, 8), 'solid') +
    X(142, 396, t(K.portfolio), 12, 'mid bold') + SIGN.map((s, i) => s(85 + i * 38, 432)).join('')),
  ...NEW.map(([x, y], i) => G(`ko-ask-${i}`, dots(FROM[i], [x, y - 2], Math.round(Math.hypot(x - FROM[i][0], y - FROM[i][1]) / 18)))),
  ...NEW.map(([x, y], i) => G(`ko-fin-${i}`, fin(x, y))),
  G('ko-airlines', X(NEW[1][0] + 20, NEW[1][1] - 18, t(K.airlines), 12, 'bold')),
].join(''), 'opacity="0"');

/** Beat 5, new routes: Kos airport and its tower; with Fraport Greece's marketing, new routes in cobalt leave its
 *  runway for the markets we would target, and stop halfway (a bar where each stops; the rest of the way in faded dots) */
const beat5 = () => G('ko-b5', [
  G('ko-airport', pen('M524 378L600 368', 'thick') + pen('M532 377L540 376M556 374L564 373M580 371L588 370', 'thin') +
    P('M610 372V340H618V372Z', 'solid') + P('M602 340L606 326H622L626 340Z', 'solid') + pen('M614 326V318', 'thin') +
    X(566, 360, t(K.airport), 11, 'mid')),
  G('ko-fraport', person(596, 280, 0.5) + X(566, 262, t(K.fraport), 11, 'mid bold')),
  ...NEW.map((m, i) => {
    const { flown, at, dir, left } = cut(AIR, m, 0.18, 0.5, Math.round(Math.hypot(m[0] - AIR[0], m[1] - AIR[1]) / 30));
    const l = Math.hypot(dir[0], dir[1]), nx = (-dir[1] / l) * 8, ny = (dir[0] / l) * 8;
    return G(`ko-new-${i}`, pen(flown, 'ac') + pen(`M${r1(at[0] - nx)} ${r1(at[1] - ny)}L${r1(at[0] + nx)} ${r1(at[1] + ny)}`, 'ac thick-ish')) +
      G(`ko-plan-${i}`, left.map(([x, y]) => `<circle class="ko-plan" cx="${x}" cy="${y}" r="2"/>`).join(''));
  }),
].join(''), 'opacity="0"');

/** Beat 6, the machine behind it: a kanban the team works through; a ring of eight around it, ESPA at its heart */
const COLS = [170, 280, 390];
const beat6 = () => {
  const ring = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return [r1(320 + Math.cos(a) * 280), r1(268 + Math.sin(a) * 196)];
  });
  return G('ko-b6', [
    G('ko-board', P(R(150, 150, 340, 190, 10), 'solid') + pen('M260 158V332M370 158V332M158 184H482', 'thin') +
      K.kanban.map((c, i) => X(COLS[i] + 45, 176, t(c), 12, 'mid bold')).join('')),
    ...[[0, 196], [0, 228], [0, 260], [1, 196], [1, 228], [2, 196], [2, 228]].map(([c, y], i) =>
      G(`ko-task-${i}`, `<rect class="${i % 3 ? 'note' : 'note ac-note'}" x="${COLS[c]}" y="${y}" width="90" height="24" rx="4"/>`)),
    G('ko-team', K.roles.map((r, i) => person(220 + i * 100, 368, 0.5) + X(220 + i * 100, 412, t(r), 12, 'mid')).join('')),
    G('ko-ring', ring.map(([x, y], i) => P(C(x, y, 15), i % 2 ? 'solid' : 'solid ac')).join('')),
    G('ko-espa', pill(320 - (width(t(K.espa), 14) + 22) / 2, 106, t(K.espa), 14, 'ac')),
  ].join(''), 'opacity="0"');
};

/** the closing: the line lifts off from Kos for what comes next */
const beat7 = () => G('ko-b7', pen(`M${KOS_PORT[0]} ${KOS_PORT[1]}C560 330 600 190 720 40`, 'ac thick-ish', 'data-p="ko-liftoff"'));

/** the whole chapter, as it ends */
export const koanArt = () => [
  `<g data-p="ko-cam">`, side(), base(), ukRoute(), beat1(), beat2(), beat4(), beat5(), beat6(), beat7(), `</g>`,
  beat0(), beat3(),
].join('');
