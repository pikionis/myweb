// The comic interludes of "My story" (MyStory.astro, between the scenes; src/scripts/interludes.ts plays them): the
// little man between one job and the next, in the story's pen (one ink line on the paper, one cobalt accent),
// authored as each ends, which is how it rests with reduced motion. What he says is in HTML bubbles beside the
// drawing (src/text/my-story.json, `interludes`), so it reads at any size; the few words drawn are large enough to
// read on a phone, where a drawing shows at about 0.6 of its size.
import { r1, C, R, P as pen } from './lineart';
import { type N, P, G, X, width, pill, person, place, smooth, KOS } from './storypen';
import { t, type Interlude } from '../data/mystory';

export const VIEW = { w: 560, h: 520 };
/** a part that is not there as the drawing ends (the script shows it on the way) */
const HIDDEN = 'style="opacity: 0"';

/** a mouth: a smile, an open "o", or a straight line */
const mouth = (x: N, y: N, s: N, kind: 'smile' | 'o' | 'flat') =>
  kind === 'o' ? pen(C(x, y, 3.2 * s)) : kind === 'flat' ? pen(`M${r1(x - 5 * s)} ${r1(y)}H${r1(x + 5 * s)}`) : pen(`M${r1(x - 6 * s)} ${r1(y - 2 * s)}Q${x} ${r1(y + 4 * s)} ${r1(x + 6 * s)} ${r1(y - 2 * s)}`);
const eyes = (x: N, y: N, s: N) => `<circle class="fill-ink" cx="${r1(x - 5.5 * s)}" cy="${r1(y)}" r="${r1(1.9 * s)}"/><circle class="fill-ink" cx="${r1(x + 5.5 * s)}" cy="${r1(y)}" r="${r1(1.9 * s)}"/>`;

type Arms = 'hips' | 'up' | 'down' | 'point' | 'hold';
/** his arms, from the shoulders: hands on his hips, on his head, down, one pointing up and on, both holding in front */
const arms = (x: N, y: N, s: N, a: Arms, extra = '') => {
  const q = (dx: N, dy: N) => `${r1(x + dx * s)} ${r1(y + dy * s)}`;
  const both = (pts: N[][]) => pen(`M${pts.map(([dx, dy]) => q(-dx, dy)).join('L')}`, extra) + pen(`M${pts.map(([dx, dy]) => q(dx, dy)).join('L')}`, extra);
  if (a === 'hips') return both([[15, -86], [31, -70], [17, -58]]);
  if (a === 'up') return both([[15, -86], [32, -106], [19, -126]]);
  if (a === 'down') return both([[15, -86], [21, -54]]);
  if (a === 'hold') return both([[15, -86], [24, -66], [8, -60]]);
  return pen(`M${q(-15, -86)}L${q(-21, -54)}`, extra) + pen(`M${q(15, -86)}L${q(34, -104)}L${q(44, -122)}`, extra);
};
/** the little man, his feet on the ground at (x, y): a round head, a body, legs and arms (or none: `arms` given
 *  apart, to change them), his face (or none, likewise). A small one casts no shadow (it would be as big as his head) */
const guy = (p: string, x: N, y: N, s = 1, o: { arms?: Arms | null; face?: 'smile' | 'o' | 'flat' | null } = {}) => {
  const body = s >= 0.9 ? P : pen;
  return G(p,
    body(R(r1(x - 16 * s), r1(y - 96 * s), r1(32 * s), r1(48 * s), r1(14 * s)), 'solid') +
    pen(`M${r1(x - 8 * s)} ${r1(y - 50 * s)}L${r1(x - 11 * s)} ${y}M${r1(x + 8 * s)} ${r1(y - 50 * s)}L${r1(x + 11 * s)} ${y}`) +
    pen(`M${r1(x - 11 * s)} ${y}H${r1(x - 20 * s)}M${r1(x + 11 * s)} ${y}H${r1(x + 20 * s)}`) +
    (o.arms === null ? '' : arms(x, y, s, o.arms ?? 'down')) +
    body(C(x, r1(y - 114 * s), r1(16 * s)), 'solid') +
    eyes(x, r1(y - 117 * s), s) +
    (o.face === null ? '' : mouth(x, r1(y - 106 * s), s, o.face ?? 'smile')));
};
/** a sparkle: four points round a centre */
const sparkle = (p: string, x: N, y: N, r: N, extra = 'ac') => G(p,
  `<path class="${extra === 'ac' ? 'ac-fill' : 'fill-ink'}" d="M${x} ${r1(y - r)}Q${x} ${y} ${r1(x + r)} ${y}Q${x} ${y} ${x} ${r1(y + r)}Q${x} ${y} ${r1(x - r)} ${y}Q${x} ${y} ${x} ${r1(y - r)}Z"/>`);
/** words that fit a panel: as large as 24, smaller for a long name */
const label = (x: N, y: N, text: string) => X(x, y, text, Math.min(24, Math.floor(250 / Math.max(1, text.length * 0.56))), 'mid bold');

// ---- after the diploma: the big deal. Cap on, shades on, hands on his hips, on the winner's step, in the light
function cocky() {
  const x = 280, y = 372, s = 1.55, hy = y - 114 * s;
  return [
    G('il-beam', `<path class="beam" d="M${x - 40} 0L${x + 40} 0L${x + 130} 412L${x - 130} 412Z"/>`),
    G('il-ground', P('M60 412H500')),
    G('il-step', P(R(x - 74, y, 148, 40, 6), 'solid') + X(x, y + 30, '1', 26, 'mid bold')),
    G('il-chest', guy('il-guy', x, y, s, { arms: 'hips' })),
    // the cap of the graduation
    G('il-cap', `<path class="fill-ink" d="M${x - 36} ${r1(hy - 22)}L${x} ${r1(hy - 38)}L${x + 36} ${r1(hy - 22)}L${x} ${r1(hy - 8)}Z"/>` + pen(`M${x + 26} ${r1(hy - 26)}V${r1(hy - 2)}`, 'ac') + `<circle class="ac-fill" cx="${x + 26}" cy="${r1(hy)}" r="4"/>`),
    // the shades, and their glint
    G('il-shades', `<path class="fill-ink" d="${R(x - 22, r1(hy - 9), 19, 13, 5)}"/><path class="fill-ink" d="${R(x + 3, r1(hy - 9), 19, 13, 5)}"/>` + pen(`M${x - 3} ${r1(hy - 5)}H${x + 3}`)),
    sparkle('il-glint', x + 20, r1(hy - 12), 9),
    sparkle('il-spark-0', 150, 150, 14), sparkle('il-spark-1', 420, 120, 18, 'ink'), sparkle('il-spark-2', 440, 270, 11),
  ].join('');
}

// ---- the first job: everything at once, then in order. The terms rain down round him (`data-dx/dy/rot`: where
// each is thrown, from where it rests), hands on his head; months go by; they line up, and he is at ease
function wtf(it: Interlude) {
  const x = 280, y = 410, s = 1.25, hy = y - 114 * s;
  const terms = it.terms ?? [];
  const half = Math.ceil(terms.length / 2);
  // a fixed scatter (no randomness: the page is the same every time)
  const throwOf = (i: number) => [((i * 97) % 220) - 110 + (i % 2 ? 60 : -60), ((i * 53) % 140) - 90, ((i * 41) % 50) - 25];
  return [
    G('il-ground', P('M40 412H520')),
    // the calendar: its months go by
    G('il-cal', P(R(246, 22, 68, 60, 8), 'solid') + pen('M262 16V30M298 16V30') + pen('M246 40H314') +
      // (its pages, the last one under the others; the script tears the top ones off)
      [2, 1, 0].map((i) => G(`il-page-${i}`, `<path class="${i ? 'face-l' : 'face-t'}" d="${R(250, 43, 60, 36, 4)}"/>` + pen(`M262 54H${298 - i * 8}M262 66H${290 - i * 6}`, 'thin'))).join('')),
    terms.map((term, i) => {
      const col = i < half ? 0 : 1, row = col ? i - half : i;
      const w = width(term, 18) + 22, cx = col ? 450 : 110;
      const [dx, dy, rot] = throwOf(i);
      return G(`il-term-${i}`, pill(r1(cx - w / 2), 108 + row * 56, term, 18, i % 3 === 1 ? 'ac' : ''), `data-dx="${dx}" data-dy="${dy}" data-rot="${rot}"`);
    }).join(''),
    guy('il-guy', x, y, s, { arms: null, face: null }),
    // (at ease, as he ends; the panic is the script's, and hidden here)
    G('il-arms-up', arms(x, y, s, 'up'), HIDDEN),
    G('il-arms-calm', arms(x, y, s, 'down')),
    G('il-face-o', mouth(x, r1(y - 106 * s), s, 'o'), HIDDEN),
    G('il-face-smile', mouth(x, r1(y - 106 * s), s, 'smile')),
    G('il-huh', X(x + 34, r1(hy - 26), '?!', 34, 'bold t-ac'), HIDDEN),
    G('il-sweat', `<path class="ac-fill" d="M${x - 26} ${r1(hy - 10)}q-5 9 0 12q5 -3 0 -12z"/>`, HIDDEN),
  ].join('');
}

// ---- four little pictures in a grid, each with its name under it (the startup, the big league)
const CELL = { w: 280, h: 260 };
const grid = (panels: string[], names: string[]) => panels.map((inner, i) => {
  const ox = (i % 2) * CELL.w, oy = Math.floor(i / 2) * CELL.h;
  return G(`il-panel-${i}`, `<g transform="translate(${ox} ${oy})">${inner}${label(140, 238, names[i] ?? '')}</g>`);
}).join('');

/** a speech balloon with three dots */
const dots = (x: N, y: N) => P(R(x - 30, y - 18, 60, 32, 14), 'solid') + pen(`M${x - 14} ${y + 14}l-8 12l16 -12`) +
  `<circle class="fill-ink" cx="${x - 12}" cy="${y - 2}" r="3"/><circle class="fill-ink" cx="${x}" cy="${y - 2}" r="3"/><circle class="ac-fill" cx="${x + 12}" cy="${y - 2}" r="3"/>`;

function startup(it: Interlude) {
  const names = (it.panels ?? []).map(t);
  return grid([
    // meetings: round a table, the talk going round
    person(84, 98, 0.75) + person(196, 98, 0.75) + guy('il-p0-guy', 140, 160, 0.62) + P('M52 168H228', 'thick-ish') + P('M70 168V200M210 168V200') + dots(140, 46),
    // sales: at a shop, a handshake, the deal in cobalt
    `<path class="kc-awn" d="M168 64H262V86Q251 96 239 86Q227 96 215 86Q203 96 191 86Q179 96 168 86Z"/>` + P('M168 64H262V86M174 92V200M256 92V200') +
      person(214, 118, 0.7) + guy('il-p1-guy', 92, 200, 0.68, { arms: null }) + pen('M82 142L78 164M102 142L122 140') +
      P('M122 140Q154 132 186 146', 'ac') + `<path class="ac-fill" d="M144 162l16 -6 10 10 -16 6z"/>` + P('M60 200H240'),
    // writing code: behind the laptop, the brackets of the code about him
    person(140, 74, 0.82) + P('M70 196L86 122H194L210 196Z', 'solid') + pen('M104 146H156M104 160H176M116 174H160', 'thin') +
      P('M70 60L46 84L70 108', 'ac thick-ish') + P('M210 60L234 84L210 108', 'ac thick-ish') + P('M40 196H240'),
    // presentations: at the screen, the chart rising
    guy('il-p3-guy', 66, 200, 0.62, { arms: 'point' }) + P(R(112, 40, 140, 100, 8), 'solid') + pen('M182 140V196M152 196H212') +
      `<path class="face-r" d="M132 120h20v-24h-20z"/><path class="face-r" d="M162 120h20v-40h-20z"/><path class="ac-fill" d="M192 120h20v-64h-20z"/>` + pen('M126 120H238', 'thin') + P('M30 200H250'),
  ], names);
}

function league(it: Interlude) {
  const names = (it.panels ?? []).map(t);
  const kos = smooth(place(KOS, 204, 298, 0.36, 66, 108));
  return grid([
    // big contracts: a contract taller than he is, its seal in cobalt, his pen
    P(R(84, 18, 120, 176, 8), 'solid') + pen('M102 46H186M102 62H180M102 78H186M102 94H170M102 110H186M102 126H176M102 142H150', 'thin') +
      pen('M110 172Q124 160 136 172T164 170', 'ac') + `<circle class="ac-fill" cx="182" cy="166" r="12"/>` +
      guy('il-p0-guy', 236, 200, 0.5, { arms: 'point' }) + P('M40 200H260'),
    // big organisations: columns over a small man
    `<path class="face-l" d="M60 70H220V188H60Z"/>` + P('M48 70L140 22L232 70Z', 'solid') + P('M52 70H228M56 188H224M48 200H232') +
      [80, 120, 160, 200].map((cx) => pen(`M${cx - 8} 76V184M${cx + 8} 76V184`)).join('') + guy('il-p1-guy', 140, 200, 0.34),
    // destination management: the island, its pin, a route coming in
    `<path class="sea" d="${R(30, 30, 220, 170, 18)}"/>` + P(kos, 'solid') + pen('M44 58Q130 14 214 82', 'ac net') +
      `<path class="ac-fill" d="M217 92c0-12 18-12 18 0c0 9-9 18-9 18s-9-9-9-18z"/>` + `<circle class="t-inv" cx="226" cy="92" r="3"/>` + pen('M34 62l13-8 3 11z', 'ac'),
    // state bureaucracy: the stack of papers, the stamp coming down, the clock, and him waiting
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => P(R(118 + (i % 2) * 6, 176 - i * 18, 110, 16, 3), 'solid')).join('') +
      // (the stamp rests on the top paper; the script brings it down on it, again and again)
      G('il-stamp', P(R(152, 32, 44, 18, 4), 'solid ac') + pen('M174 32V20M162 20H186', 'ac')) +
      P(C(66, 52, 22), 'solid') + pen('M66 52V38M66 52L76 58') + guy('il-p3-guy', 70, 200, 0.5, { face: 'flat' }) + P('M30 200H250'),
  ], names);
}

// ---- the AI lab: the agents and the one that runs them over the screen where he writes, with the prompt typed
function lab(it: Interlude) {
  const agents = (it.agents ?? []).map(t);
  const xs = [76, 212, 348, 484];
  const icon = [
    (x: N, y: N) => pen(C(x - 3, y - 3, 9)) + pen(`M${x + 4} ${y + 4}l8 8`),
    (x: N, y: N) => pen(`M${x - 6} ${y - 9}l-9 9l9 9M${x + 6} ${y - 9}l9 9l-9 9`),
    (x: N, y: N) => pen(`M${x - 10} ${y}l7 7l13 -14`, 'ac'),
    (x: N, y: N) => pen(`M${x - 14} ${y}Q${x} ${y - 13} ${x + 14} ${y}Q${x} ${y + 13} ${x - 14} ${y}Z`) + `<circle class="fill-ink" cx="${x}" cy="${y}" r="4"/>`,
  ];
  const orch = t(it.orchestrator ?? '');
  const ow = width(orch, 20) + 40;
  const code = [[0, 150], [16, 120], [16, 170], [32, 96], [16, 60], [0, 40], [0, 130], [16, 150]];
  return [
    // the one that runs them, and the agents
    G('il-orch', P(R(r1(280 - ow / 2), 30, ow, 44, 22), 'solid ac') + X(280, 59, orch, 20, 'mid bold t-ac')),
    xs.map((x, i) => G(`il-edge-${i}`, pen(`M280 74C280 120 ${x} 110 ${x} 150`, 'faint')) + `<path class="il-pulse" d="M280 74C280 120 ${x} 110 ${x} 150" pathLength="1"/>`).join(''),
    xs.map((x, i) => G(`il-agent-${i}`, P(C(x, 178, 27), 'solid') + icon[i](x, 178) + X(x, 228, agents[i] ?? '', 18, 'mid bold'))).join(''),
    // the desk, the screen and its code, the man
    G('il-desk', P('M30 458H530') + pen('M280 420V458M240 458H320')),
    G('il-screen', P(R(150, 262, 280, 160, 12), 'solid') + pen('M150 286H430', 'thin') +
      `<circle class="fill-ink" cx="166" cy="274" r="3"/><circle class="fill-ink" cx="178" cy="274" r="3"/><circle class="ac-fill" cx="190" cy="274" r="3"/>`),
    code.map(([ind, w], i) => G(`il-code-${i}`, pen(`M${170 + ind} ${304 + i * 14}h${w}`, i % 3 === 1 ? 'ac' : ''))).join(''),
    G('il-man', person(82, 352, 1.05)),
    G('il-prompt', X(280, 500, `> ${t(it.prompt ?? '')}`, 19, 'mid mono')),
    G('il-caret', `<rect class="ac-fill" x="${r1(280 + (width(`> ${t(it.prompt ?? '')}`, 19) * 1.07) / 2 + 4)}" y="485" width="10" height="20"/>`),
  ].join('');
}

export function interludeArt(it: Interlude) {
  const make: Record<string, (it: Interlude) => string> = { cocky, wtf, startup, league, lab };
  // (the two with the man alone end at the ground: no paper under it)
  const h = it.id === 'cocky' || it.id === 'wtf' ? 432 : VIEW.h;
  return { view: `0 0 ${VIEW.w} ${h}`, inner: make[it.id]?.(it) ?? '' };
}
