// The Kalimera chapter's drawing ("From dawn to daylight", KalimeraChapter.astro; src/scripts/kalimera.ts plays
// it): one morning over one horizon. The world is the horizon, the landscape on it (Kos, then Athens), the side
// line of client work under it and the sun on its way across the sky; each beat of the startup is one more picture
// standing on the horizon, a function each below. Authored as the chapter ends (noon over Athens, the map of the
// ecosystem), which is how it rests without script; the script opens the morning from 05:30.
import { r1, C, R, P as pen, D } from './lineart';
import { type N, P, G, F, X, width, person, pill, walker, smooth, KOS } from './storypen';
import { art, t } from '../data/mystory';

const K = art.kalimera;
export const VIEW = { w: 900, h: 600 };
/** the horizon */
export const HZ = 480;
/** where the sun is at each beat (the opening, then beats 1 to 7): under the horizon, its first ray, its edge
 *  clearing it, up through the clouds, the pivot (where its way bends), the stage, noon, and noon still */
export const SUN = [[88, 522], [90, 512], [96, 470], [112, 360], [148, 262], [290, 150], [452, 80], [452, 80]];
const [, , , , , , NOON] = SUN;
/** the sun's way: rising almost straight up, then, at the pivot, turning hard towards noon. One line, unbroken */
const SUN_WAY = 'M88 522L90 512C92 498 94 484 96 470C100 430 104 392 112 360C120 328 134 292 148 262C200 236 236 186 290 150C340 116 396 88 452 80';
/** at the pivot: where it was heading, and the way it takes instead */
const GHOST = 'M148 262C160 232 168 204 172 172';
const NEW_WAY = 'M148 262C200 236 236 186 290 150';
/** far out either side, so the horizon runs across the whole window, however wide */
const FAR = [-1200, 2100];

/** a line split in two at its middle space when it is too wide for its box */
const lines = (text: string, size: N, max: N) => {
  if (width(text, size) <= max || !text.includes(' ')) return [text];
  const words = text.split(' '), half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
};
const label = (x: N, y: N, text: string, size: N, max: N, extra = '') =>
  lines(text, size, max).map((l, i) => X(x, y + i * (size + 3), l, size, extra)).join('');

// ---- the world ----

/** a windmill on the horizon: its tower, its cap and its four sails (the script turns them) */
const windmill = (p: string, x: N, s: N) => {
  const y = HZ, cy = y - 66 * s;
  const sails = [0, 1, 2, 3].map((k) => {
    const a = (k * Math.PI) / 2 + 0.4, ex = x + Math.cos(a) * 34 * s, ey = cy + Math.sin(a) * 34 * s;
    const bx = x + Math.cos(a + 0.28) * 30 * s, by = cy + Math.sin(a + 0.28) * 30 * s;
    return `M${x} ${r1(cy)}L${r1(ex)} ${r1(ey)}L${r1(bx)} ${r1(by)}`;
  }).join('');
  return G(p, P(`M${r1(x - 14 * s)} ${y}L${r1(x - 10 * s)} ${r1(y - 60 * s)}H${r1(x + 10 * s)}L${r1(x + 14 * s)} ${y}`, 'solid') +
    pen(`M${r1(x - 12 * s)} ${r1(y - 60 * s)}Q${x} ${r1(y - 80 * s)} ${r1(x + 12 * s)} ${r1(y - 60 * s)}`) +
    pen(`M${r1(x - 4 * s)} ${y}V${r1(y - 12 * s)}A${r1(4 * s)} ${r1(4 * s)} 0 0 1 ${r1(x + 4 * s)} ${r1(y - 12 * s)}V${y}`, 'thin') +
    G(`${p}-sails`, pen(sails, 'thin'), `data-cx="${x}" data-cy="${r1(cy)}"`));
};
/** Kos, at dawn: the sea under the horizon, windmills, a chapel and white houses on the hills */
const kos = () => {
  const waves = [[500, 1.6, 40], [522, 2.4, 52], [548, 3.2, 64], [578, 4, 78]].map(([y, a, per], i) => {
    let d = `M${FAR[0]} ${y}`;
    for (let x = FAR[0]; x < FAR[1]; x += per) d += `q${per / 4} ${-a} ${per / 2} 0t${per / 2} 0`;
    return pen(d, i < 2 ? 'faint wave' : 'wave');
  }).join('');
  const houses = [[770, 26, 20], [800, 20, 26], [-150, 22, 18], [-120, 26, 22]].map(([x, w, h]) =>
    P(R(x, HZ - h - 8, w, h, 2), 'solid') + pen(`M${x + w / 2 - 3} ${HZ - 8}v-8h6v8`, 'thin')).join('');
  return G('kc-kos', [
    pen('M-320 480C-240 452 -160 440 -90 448C-40 454 -10 466 20 480', 'faint'),
    pen('M640 480C700 462 760 444 830 446C900 448 980 462 1080 480', 'faint'),
    P('M-60 452V432H-36V452', 'solid'), pen('M-60 432Q-48 418 -36 432'), pen('M-48 418V410M-52 413H-44', 'thin'),
    houses, windmill('kc-mill-0', 30, 1), windmill('kc-mill-1', 862, 0.85), waves,
  ].join(''), 'opacity="0"');
};
/** Athens, from the pivot on: the city along the horizon, the Acropolis and the Parthenon, Lycabettus */
const athens = () => {
  // the city: low blocks, a few windows
  let blocks = '';
  const spans = [[-420, -80], [228, 750], [930, 1320]];
  spans.forEach(([a, b], s) => {
    for (let x = a, i = 0; x < b; i++) {
      const w = 34 + ((i * 7 + s * 5) % 4) * 10, h = 16 + ((i * 11 + s * 3) % 5) * 7;
      blocks += R(x, HZ - h, w, h, 1.5);
      x += w + 4;
    }
  });
  const cols = Array.from({ length: 8 }, (_, i) => `M${r1(44 + i * 14.6)} 440V414`).join('');
  return G('kc-athens', [
    P(blocks, 'solid faint'),
    // the Acropolis: its rock, and the Parthenon on it
    P('M-90 480C-50 468 -18 446 16 440H176C200 446 220 466 250 480', 'solid'),
    pen('M34 440H160M38 444H156', 'thin'), pen(cols), pen('M36 414H158M36 408H158'), P('M36 408L97 390L158 408Z', 'solid'),
    // Lycabettus and its chapel
    P('M740 480C770 470 800 430 822 384C846 430 876 470 920 480', 'solid'), pen('M816 384V374H828V384', 'thin'), pen('M822 374V366', 'thin'),
  ].join(''));
};
/** the line of client work: thin cobalt under the horizon, a dot now and then */
const side = () => G('kc-side', pen(`M${FAR[0]} 560H${FAR[1]}`, 'ac thin') +
  Array.from({ length: 10 }, (_, i) => `<circle class="ac-fill" cx="${-1100 + i * 340}" cy="560" r="4"/>`).join(''));
/** the sun: a cobalt line round a soft disc, its rays; the first ray (straight up) comes before the others */
const sun = () => {
  const rays = Array.from({ length: 7 }, (_, k) => {
    const a = -Math.PI / 2 + ((k + 1) * Math.PI) / 4;
    return `M${r1(Math.cos(a) * 34)} ${r1(Math.sin(a) * 34)}L${r1(Math.cos(a) * 50)} ${r1(Math.sin(a) * 50)}`;
  }).join('');
  return G('kc-sun', `<circle class="kc-disc" r="26"/>` + pen(C(0, 0, 26), 'ac thick-ish') +
    G('kc-ray0', pen('M0 -34V-56', 'ac thick-ish')) + G('kc-rays', pen(rays, 'ac thick-ish')), `transform="translate(${NOON[0]} ${NOON[1]})"`);
};

// ---- the beats ----

/** the app, polished: its phone, drawn at (0, 0), 110 wide and 208 tall */
const phone = () => [
  P(R(0, 0, 110, 208, 16), 'solid'), pen('M40 12H70', 'thin'),
  F(R(10, 24, 90, 34, 6), 'ac-fill'), `<circle class="kc-inv" cx="24" cy="41" r="6"/>`, X(62, 46, K.app, 13, 'mid bold t-inv'),
  pen(R(10, 66, 90, 40, 6), 'thin'), pen('M18 80H70M18 92H56', 'thin'),
  pen(R(10, 114, 90, 40, 6), 'thin'), pen('M18 128H76M18 140H50', 'thin'),
  F(R(20, 168, 70, 22, 11), 'ac-fill'),
].join('');

/** the Business Model Canvas on its easel (x 430 to 870); `p` names its parts, its blocks `${p}-box-0` to 8 */
const BOXES: [N, N, N, N, keyof typeof K.blocks | ''][] = [
  [440, 210, 84, 160, ''], [524, 210, 84, 80, ''], [524, 290, 84, 80, ''], [608, 210, 84, 160, 'value'],
  [692, 210, 84, 80, ''], [692, 290, 84, 80, 'channels'], [776, 210, 84, 160, 'segments'], [440, 370, 210, 60, ''], [650, 370, 210, 60, 'revenue'],
];
const canvas = (p: string) => [
  X(650, 188, t(K.canvas), 15, 'mid bold'),
  pen('M470 440L456 480M830 440L844 480', 'thin'), P(R(430, 200, 440, 240, 8), 'solid'),
  BOXES.map(([x, y, w, h, name], i) => G(`${p}-box-${i}`,
    // (the highlight the pivot brings: a cobalt wash and outline under the block)
    (name ? F(R(x + 3, y + 3, w - 6, h - 6, 4), 'kc-hi', `data-p="${p}-hi-${i}"`) + pen(R(x + 3, y + 3, w - 6, h - 6, 4), 'ac', `data-p="${p}-line-${i}"`) : '') +
    pen(R(x + 3, y + 3, w - 6, h - 6, 4), 'thin') +
    (name ? label(x + 10, y + 21, t(K.blocks[name]), 12, w - 18, 'bold') : pen(`M${x + 10} ${y + 22}H${x + w - 24}M${x + 10} ${y + 32}H${x + w - 36}`, 'faint thin')))).join(''),
].join('');

/** Beat 1, dawn: wireframes that become the app; the business model, block by block */
const beat1 = () => G('kc-b1', [
  // the wireframes, and the flow between them
  ...[190, 268, 346].map((x, i) => G(`kc-wf-${i}`, [
    pen(R(x, 300, 62, 112, 8), 'thin'), pen(`M${x} 314H${x + 62}`, 'thin'),
    pen(R(x + 8, 322, 46, 28, 3), 'thin'), pen(`M${x + 8} 322L${x + 54} 350M${x + 54} 322L${x + 8} 350`, 'faint thin'),
    pen(`M${x + 8} 362H${x + 52}M${x + 8} 372H${x + 40}`, 'thin'), pen(R(x + 14, 388, 34, 12, 6), 'thin'),
  ].join(''))),
  G('kc-flow', pen('M253 356H266M331 356H344', 'thin') + pen('M262 352L266 356L262 360M340 352L344 356L340 360', 'thin')),
  G('kc-phone1', phone(), 'transform="translate(236 262)"'),
  G('kc-c1', canvas('kc-c1')),
].join(''), 'opacity="0"');

/** Kos as a map: long, broad in the east (the town at its tip), a narrow neck, the peninsula of Kefalos turning
 *  south-west; its mountains, and the shops of the first year along the north coast */
const KOS_COAST = smooth(KOS);
const SHOPS = [[600, 330], [566, 337], [530, 344], [492, 350], [452, 356], [410, 363], [366, 374], [322, 386]];
/** Beat 2, first light: the app comes to Kos; one shop after another takes it on; eighty sales */
const beat2 = () => G('kc-b2', [
  P(KOS_COAST, 'solid'), pen('M470 366l14 -10 12 6 14 -12 16 10 14 -8', 'faint thin'), X(420, 416, t(K.kos), 18, 'mid bold'),
  ...SHOPS.map(([x, y], i) => G(`kc-shop-${i}`,
    pen(R(x - 9, y - 12, 18, 12, 1), 'thin') + F(`M${x - 11} ${y - 12}L${x - 8} ${y - 18}H${x + 8}L${x + 11} ${y - 12}Z`, 'kc-awn') +
    F(`M${x - 11} ${y - 12}L${x - 8} ${y - 18}H${x + 8}L${x + 11} ${y - 12}Z`, 'ac-fill', `data-p="kc-lit-${i}"`) +
    G(`kc-tick-${i}`, pen(`M${x - 5} ${y - 28}l4 4 7 -8`, 'ac')))),
  G('kc-phone2', phone(), 'transform="translate(618 238) scale(0.3)"'),
  G('kc-mvp', pill(736, 236, K.mvp, 14, 'ac')),
  X(770, 350, String(K.sales), 84, 'mid bold', 'data-count'), label(770, 382, t(K.salesLabel), 15, 150, 'mid'),
].join(''), 'opacity="0"');

/** a cloud of feedback: a speech bubble, in front of the sun, with its sign in it */
const bubble = (x: N, y: N) =>
  P(`M${x - 50} ${y + 16}a14 14 0 0 1 4 -28a20 20 0 0 1 32 -14a24 24 0 0 1 42 4a16 16 0 0 1 20 26a12 12 0 0 1 -10 12H${x + 6}l-10 12l2 -12Z`, 'solid');
const SIGNS = [
  (x: N, y: N) => pen(`M${x - 12} ${y - 2}h6v16h-6zM${x - 6} ${y}l6 -12c4 0 6 3 4 8l-2 4h8c3 0 4 3 3 5l-3 9c-1 2 -2 3 -5 3h-11`, 'ac'),
  (x: N, y: N) => X(x, y + 10, '?', 28, 'mid bold t-ac'),
  (x: N, y: N) => pen(`M${x} ${y - 14}L${x + 14} ${y + 10}H${x - 14}Z`, 'ac') + pen(`M${x} ${y - 5}V${y + 2}`, 'ac') + D(x, y + 6, 1.8, 'ac-fill'),
  (x: N, y: N) => pen(`M${x - 13} ${y + 12}H${x + 14}`, 'thin') + pen(`M${x - 9} ${y + 10}V${y + 2}M${x - 2} ${y + 10}V${y - 6}M${x + 5} ${y + 10}V${y - 1}M${x + 12} ${y + 10}V${y - 12}`, 'ac thick-ish'),
];
const CLOUDS = [[140, 320], [222, 396], [70, 410], [236, 292]];
/** Beat 3, clouds: feedback drifts in front of the sun; a notebook takes it all down */
const beat3 = () => G('kc-b3', [
  ...CLOUDS.map(([x, y], i) => G(`kc-cloud-${i}`, bubble(x, y) + SIGNS[i](x + 2, y - 4), i > 1 ? 'class="kc-more"' : '')),
  // the notebook, open; on each page two lines of what customers said
  P(R(390, 228, 222, 236, 6), 'solid'), P(R(616, 228, 222, 236, 6), 'solid'),
  pen(Array.from({ length: 9 }, (_, i) => C(614, 246 + i * 24, 5)).join(''), 'thin'),
  pen(Array.from({ length: 8 }, (_, i) => `M404 ${276 + i * 24}H598M630 ${276 + i * 24}H824`).join(''), 'faint thin'),
  ...[[410, 288], [410, 384], [636, 288], [636, 384]].map(([x, y], i) => G(`kc-note-${i}`,
    `<g transform="translate(${x + 12} ${y}) scale(0.55) translate(${-x - 12} ${-y})">${SIGNS[i](x + 12, y)}</g>` +
    pen(`M${x + 30} ${y + 4}q8 -8 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0M${x + 30} ${y + 30}q8 -8 16 0t16 0t16 0t16 0t16 0`, 'thin'))),
].join(''), 'opacity="0"');

/** Beat 4, the pivot: an idea platform, the team round it, a light; the business model shuffles into a new one */
const beat4 = () => G('kc-b4', [
  pen(GHOST, 'kc-ghost', 'data-p="kc-ghost"'), pen(NEW_WAY, 'ac', 'data-p="kc-newway"'),
  G('kc-glow', `<circle class="kc-glow" cx="310" cy="234" r="34"/>`),
  G('kc-bulb', P('M298 252C286 244 284 222 298 212C306 206 316 206 324 212C338 222 336 244 324 252V262H298Z', 'solid') +
    pen('M300 268H322M302 274H320', 'thin') + pen('M302 246l4 -10 4 8 4 -8 4 10', 'ac thin') +
    pen('M310 196V186M282 206L274 200M338 206L346 200M276 232H266M344 232H354', 'ac')),
  pen('M214 450L204 480M406 450L416 480', 'thin'), P(R(190, 290, 240, 160, 8), 'solid'), X(310, 318, K.idea, 14, 'mid bold'),
  ...[[206, 334], [244, 334], [282, 334], [320, 334], [358, 334], [206, 372], [244, 372], [320, 372], [376, 372]].map(([x, y], i) =>
    `<rect class="${i % 3 ? 'note' : 'note ac-note'}" data-p="kc-sticky-${i}" x="${x}" y="${y}" width="28" height="24" rx="2"/>`),
  G('kc-team', [176, 206, 236, 384, 414, 444].map((x) => person(x, 446, 0.5)).join('')),
  G('kc-c4', canvas('kc-c4')),
].join(''), 'opacity="0"');

/** Beat 5, on stage: the pitch of the new model, the prize, and the door to the accelerator in Athens */
const beat5 = () => G('kc-b5', [
  // the stage, its screen with the new model on it, the one pitching, the audience
  pen('M334 400V444', 'thin'), P(R(214, 254, 240, 146, 6), 'solid'), pen('M232 276H330', 'thick-ish'),
  pen(Array.from({ length: 5 }, (_, i) => R(232 + i * 40, 292, 36, 52, 3)).join('') + R(232, 348, 98, 32, 3) + R(334, 348, 98, 32, 3), 'thin'),
  F(R(352, 292, 36, 52, 3) + R(312, 320, 36, 24, 3) + R(392, 292, 36, 52, 3) + R(334, 348, 98, 32, 3), 'ac-fill'),
  P(R(180, 444, 340, 36, 4), 'solid'),
  walker('kc-pitcher', 486, 444, 0.75), pen('M476 400L456 378', 'thin'),
  G('kc-audience', [210, 262, 314, 366, 418, 470].map((x) => person(x, 506, 0.5)).join('')),
  // the prize
  G('kc-trophy', P('M594 284H686C686 356 660 376 640 376C620 376 594 356 594 284Z', 'solid') +
    pen('M594 298C568 298 568 336 596 340M686 298C712 298 712 336 684 340') + pen('M640 376V398') + P(R(608, 398, 64, 22, 4), 'solid') +
    X(640, 346, '2', 46, 'mid bold t-ac')),
  G('kc-prize', X(640, 446, t(K.prize), 15, 'mid bold') + X(640, 464, K.contest, 11, 'mid')),
  // the door, and Athens through it
  G('kc-doorway', F(R(764, 254, 112, 222, 2), 'kc-view') +
    pen('M770 470C786 456 796 446 806 444H850C858 448 866 458 872 470', 'thin') +
    pen(Array.from({ length: 6 }, (_, i) => `M${814 + i * 6} 444V428`).join('') + 'M810 428H846M810 424L828 416L846 424Z', 'thin') +
    pen(R(760, 250, 120, 230, 4))),
  G('kc-door', P(R(764, 254, 112, 222, 2), 'solid') + D(862, 368, 4)),
  G('kc-spill', pen('M772 480L748 520M820 480V528M868 480L892 520', 'ac')),
  X(820, 222, K.accelerator, 14, 'mid bold'), X(820, 240, t(K.athens), 12, 'mid'),
].join(''), 'opacity="0"');

/** what each card of the accelerator shows, in its box from (x, 330) */
const CARD_ART = [
  (x: N) => P(R(x + 16, 336, 66, 96, 4), 'solid') + pen(`M${x + 24} 356H${x + 74}M${x + 24} 380H${x + 74}M${x + 24} 392H${x + 74}M${x + 24} 404H${x + 74}M${x + 46} 380V416`, 'thin') +
    pen(`M${x + 98} 440V352M${x + 98} 440H${x + 146}`, 'thin') + pen(`M${x + 102} 432L${x + 114} 416L${x + 124} 422L${x + 142} 362M${x + 134} 364L${x + 142} 360L${x + 144} 368`, 'ac'),
  (x: N) => person(x + 74, 372, 0.6) + P(`M${x + 44} 448L${x + 52} 404H${x + 96}L${x + 104} 448Z`, 'solid') +
    pen(`M${x + 108} 370q8 5 0 12M${x + 116} 364q14 11 0 24`, 'ac') + pen(C(x + 26, 360, 13)) + pen(`M${x + 26} 360V351M${x + 26} 360L${x + 32} 364M${x + 22} 343H${x + 30}`, 'thin'),
  (x: N) => P(`M${x + 16} 344H${x + 82}L${x + 60} 384V408H${x + 38}V384Z`, 'solid') + pen(`M${x + 26} 356H${x + 72}`, 'faint thin') +
    `<rect class="note" x="${x + 94}" y="342" width="52" height="16" rx="2"/><rect class="note ac-note" x="${x + 94}" y="364" width="52" height="16" rx="2"/>` +
    pen(`M${x + 90} 446H${x + 148}`, 'thin') + pen(`M${x + 98} 444V424M${x + 112} 444V412M${x + 126} 444V418M${x + 140} 444V398`, 'ac thick-ish'),
  (x: N) => person(x + 34, 352, 0.5) + person(x + 80, 344, 0.56) + person(x + 126, 352, 0.5) +
    [0, 1, 2, 3, 4, 5].map((i) => `<circle class="fill-ink" cx="${x + 58 + (i % 3) * 22}" cy="${398 + Math.floor(i / 3) * 10}" r="3"/>`).join('') +
    Array.from({ length: 6 }, (_, i) => pen(R(x + 14 + i * 22, 420, 20, 20, 3), 'thin') + F(R(x + 14 + i * 22, 420, 20, 20, 3), 'ac-fill', `data-p="kc-month-${i}"`)).join(''),
];
/** the same, small, for a row on a phone, from (x, y) */
const ROW_ART = [
  (x: N, y: N) => pen(R(x, y, 26, 34, 3)) + pen(`M${x + 6} ${y + 26}L${x + 12} ${y + 18}L${x + 16} ${y + 22}L${x + 22} ${y + 8}`, 'ac'),
  (x: N, y: N) => pen(C(x + 13, y + 6, 5)) + pen(`M${x + 2} ${y + 34}L${x + 6} ${y + 16}H${x + 22}L${x + 26} ${y + 34}Z`),
  (x: N, y: N) => pen(`M${x} ${y + 2}H${x + 28}L${x + 18} ${y + 18}V${y + 32}H${x + 10}V${y + 18}Z`, 'ac'),
  (x: N, y: N) => pen(C(x + 4, y + 10, 4) + C(x + 14, y + 6, 5) + C(x + 24, y + 10, 4)) + pen(`M${x} ${y + 32}H${x + 28}`, 'ac thick-ish'),
];
const RAY_FROM = (tx: N, ty: N) => {
  const dx = tx - NOON[0], dy = ty - NOON[1], l = Math.hypot(dx, dy);
  return `M${r1(NOON[0] + (dx / l) * 40)} ${r1(NOON[1] + (dy / l) * 40)}L${tx} ${ty}`;
};
/** Beat 6, full daylight: from the noon sun, four rays, each ending in what the accelerator gave. Side by side on
 *  a wide screen; on a phone, one under another */
const beat6 = () => G('kc-b6', [
  G('kc-wide', K.cards.map((c, i) => {
    const x = 182 + i * 180;
    return pen(RAY_FROM(x + 80, 270), 'ac', `data-p="kc-ray-${i}"`) + G(`kc-card-${i}`, P(R(x, 276, 160, 190, 10), 'solid') +
      X(x + 14, 302, t(c.title), 15, 'bold') + X(x + 14, 320, t(c.note), 11, 'muted') + CARD_ART[i](x));
  }).join('')),
  G('kc-narrow', pen('M436 104L168 232V448', 'ac', 'data-p="kc-ray-n"') + K.cards.map((c, i) => {
    const y = 236 + i * 62;
    return G(`kc-row-${i}`, pen(`M168 ${y + 26}H182`, 'ac') + P(R(182, y, 698, 52, 10), 'solid') + ROW_ART[i](198, y + 9) +
      X(244, y + 24, t(c.title), 20, 'bold') + X(244, y + 44, t(c.note), 15, 'muted'));
  }).join('')),
].join(''), 'opacity="0"');

/** the closing map: who is in it, where */
const NODES: [keyof typeof K.nodes, N, N][] = [['founders', 250, 254], ['mentors', 396, 188], ['investors', 616, 188], ['customers', 766, 300], ['partners', 690, 418], ['accelerator', 296, 412]];
const CENTRE = [500, 318];
const ICONS: Record<keyof typeof K.nodes, (x: N, y: N) => string> = {
  founders: (x, y) => pen(C(x - 7, y - 5, 4) + C(x + 7, y - 5, 4)) + pen(`M${x - 15} ${y + 10}c0 -8 16 -8 16 0M${x - 1} ${y + 10}c0 -8 16 -8 16 0`),
  mentors: (x, y) => pen(`M${x - 7} ${y + 2}c-6 -6 -4 -16 7 -16c11 0 13 10 7 16v6h-14z`) + pen(`M${x - 5} ${y + 12}H${x + 5}`, 'thin'),
  investors: (x, y) => X(x, y + 7, '€', 20, 'mid bold'),
  customers: (x, y) => pen(R(x - 10, y - 6, 20, 18, 3)) + pen(`M${x - 5} ${y - 6}v-3a5 5 0 0 1 10 0v3`),
  partners: (x, y) => pen(C(x - 5, y, 7) + C(x + 5, y, 7)),
  accelerator: (x, y) => pen(`M${x} ${y - 13}c7 6 7 16 0 24c-7 -8 -7 -18 0 -24zM${x - 5} ${y + 6}l-5 6h6M${x + 5} ${y + 6}l5 6h-6`),
};
const TAGS: [N, N][] = [[176, 112], [296, 90], [552, 98], [726, 132], [772, 234], [826, 436], [352, 444]];
const curve = (a: N[], c: N[], b: N[]) => `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
/** Beat 7, the map: everything the morning held, joined by one line, with what flows between; the sun over it all */
const beat7 = () => {
  const at = Object.fromEntries(NODES.map(([n, x, y]) => [n, [x, y]])) as Record<keyof typeof K.nodes, N[]>;
  const toward = (a: N[], b: N[], ra: N, rb: N) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return `M${r1(a[0] + (dx / l) * ra)} ${r1(a[1] + (dy / l) * ra)}L${r1(b[0] - (dx / l) * rb)} ${r1(b[1] - (dy / l) * rb)}`;
  };
  return G('kc-b7', [
    G('kc-links', pen(NODES.map(([, x, y]) => toward(CENTRE, [x, y], 38, 28)).join(''), 'thin')),
    G('kc-flows', [
      pen(curve([598, 178], [440, 128], [272, 234]), 'ac') + pen('M282 222L272 234L288 236', 'ac') + X(436, 148, t(K.flows.funding), 13, 'mid mono t-ac'),
      pen(curve([538, 312], [650, 270], [740, 292]), 'ac') + pen('M726 284L740 292L726 300', 'ac') + X(644, 270, t(K.flows.product), 13, 'mid mono t-ac'),
      pen(curve([770, 330], [770, 396], [716, 414]), 'ac') + pen('M728 404L716 414L732 420', 'ac') + X(784, 400, t(K.flows.market), 13, 'mono t-ac'),
    ].join('')),
    ...NODES.map(([n, x, y]) => G(`kc-node-${n}`, P(C(x, y, 26), 'solid') + ICONS[n](x, y) + X(x, y + 44, t(K.nodes[n]), 14, 'mid bold'))),
    G('kc-centre', P(C(CENTRE[0], CENTRE[1], 36), 'solid ac') + pen(C(CENTRE[0], CENTRE[1] - 4, 9), 'ac') +
      pen(`M${CENTRE[0]} ${CENTRE[1] - 22}v-4M${CENTRE[0] - 16} ${CENTRE[1] - 4}h-4M${CENTRE[0] + 16} ${CENTRE[1] - 4}h4M${CENTRE[0] - 12} ${CENTRE[1] - 16}l-3 -3M${CENTRE[0] + 12} ${CENTRE[1] - 16}l3 -3`, 'ac thin') +
      X(CENTRE[0], CENTRE[1] + 20, K.app, 11, 'mid bold')),
    ...K.words.map((w, i) => G(`kc-tag-${i}`, pill(TAGS[i][0], TAGS[i][1], t(w), 14, i === 6 ? 'ac' : ''))),
    // and the line of the sun flows on, down, into the next scene
    pen(`M478 ${NOON[1] + 8}C760 60 990 150 1010 640`, 'ac', 'data-p="kc-onward"'),
  ].join(''));
};

/** the whole morning, as it ends (noon over Athens, the map) */
export const kalimeraArt = () => [
  `<defs><clipPath id="kc-sky"><rect x="${FAR[0]}" y="-1200" width="${FAR[1] - FAR[0]}" height="${1200 + HZ}"/></clipPath></defs>`,
  `<g data-p="kc-cam">`,
  G('kc-land', kos() + athens() + side()),
  pen(`M${FAR[0]} ${HZ}H${FAR[1]}`, '', 'data-p="kc-horizon"'),
  `<g clip-path="url(#kc-sky)">`,
  `<path class="kc-trail" data-p="kc-trail" d="${SUN_WAY}"/>`,
  sun(),
  `</g>`,
  `<circle class="ac-fill" data-p="kc-dot" cx="${SUN[0][0]}" cy="${HZ + 18}" r="5" opacity="0"/>`,
  beat1(), beat2(), beat3(), beat4(), beat5(), beat6(), beat7(),
  `</g>`,
].join('');
