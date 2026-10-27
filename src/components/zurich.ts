// Zurich, from Petros's photograph of the Limmat (the DeinDeal chapter opens on it): the Münsterbrücke's arches,
// the Fraumünster's slender spire (the cobalt) with St. Peter's clock tower behind, the guild houses along the quay,
// a boat on the river; behind the city, the Alps. 800 by 500; its name written by hand in the sky.
import { C, R, P as pen } from './lineart';
import { type N, P, G, F, cloud, written } from './storypen';
import { art, t } from '../data/mystory';

/** a building's windows, in rows and columns */
const wins = (x: N, y: N, cols: N, rows: N, dx: N, dy: N, w: N, h: N) => {
  let d = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) d += R(x + c * dx, y + r * dy, w, h, 1.5);
  return pen(d, 'thin');
};
/** a tiled roof: tinted, then outlined */
const roof = (d: string) => F(d, 'face-r') + pen(d);

export const zurich = () => {
  // the river, its rows of waves larger towards us
  const waves = [[380, 1.4, 34], [396, 2, 40], [416, 2.8, 48], [442, 3.6, 58], [474, 4.6, 70]].map(([y, a, per], i) => {
    let d = `M${-per * 2} ${y}`;
    for (let x = -per * 2; x < 900; x += per) d += `q${per / 4} ${-a} ${per / 2} 0t${per / 2} 0`;
    return G(`zwave-${i}`, pen(d, i < 2 ? 'faint wave' : 'wave'), `data-per="${per}"`);
  }).join('');
  // the Alps, far behind the city, snow on their tops
  const alps = G('alps', pen('M-40 236L40 196L84 214L150 152L196 186L262 132L318 182L380 150L430 176L500 118L560 170L618 140L680 184L740 156L840 214', 'faint') +
    pen('M138 164L150 152L162 162M250 144L262 132L274 142M488 130L500 118L512 128M606 152L618 140L630 150', 'faint thin'));
  const city = [
    // St. Peter's tower and its great clock, behind the trees
    P('M70 318V156H114V318', 'solid'), roof('M66 156L92 104L118 156Z'), pen('M92 104V92', 'thin'),
    pen(C(92, 180, 14)), pen('M92 180V170M92 180L100 184', 'thin'), pen('M86 240V222A6 6 0 0 1 98 222V240', 'thin'),
    P('M0 318V262C10 240 34 236 46 250C54 232 84 230 96 248C110 236 136 244 140 264C152 270 150 300 140 318Z', 'solid'),
    pen('M28 300C38 290 50 292 58 284M88 298C98 288 110 290 116 282', 'thin'),
    // the guild house by the bridge: a steep roof with dormers
    P('M150 318V222H292V318', 'solid'), roof('M144 222L178 172H264L298 222Z'),
    pen('M192 204L202 190L212 204ZM230 204L240 190L250 204Z', 'thin'), wins(162, 236, 7, 3, 19, 26, 9, 15),
    // the Fraumünster: its gable, its tower with the clock and the belfry, and the spire
    P('M292 318V244L342 196L392 244V318', 'solid'), pen(C(342, 228, 8)),
    pen('M326 306V272A16 16 0 0 1 358 272V306'), pen('M342 256V306', 'thin'),
    P('M392 318V140H432V318', 'solid'), pen('M388 140H436M388 146H436', 'thin'),
    pen('M400 168V158A6 6 0 0 1 412 158V168M412 168V158A6 6 0 0 1 424 158V168', 'thin'),
    pen(C(412, 190, 10)), pen('M412 190V182M412 190L418 193', 'thin'), pen('M404 236V216A8 8 0 0 1 420 216V236', 'thin'),
    F('M394 140L412 24L430 140ZM392 140L395 122L398 140ZM426 140L429 122L432 140Z', 'ac-fill'), pen('M412 24V10', 'ac'), `<circle class="ac-fill" cx="412" cy="10" r="3"/>`,
    // Zur Meisen: a mansard roof, a pediment in the middle, rows of tall windows
    P('M440 332V236H610V332', 'solid'), roof('M436 236L450 204H600L614 236Z'), pen('M450 204L462 194H588L600 204', 'thin'),
    P('M505 236V214L525 198L545 214V236', 'solid'), pen(C(525, 222, 5), 'thin'), pen(C(470, 222, 4) + C(580, 222, 4), 'thin'),
    wins(452, 248, 8, 3, 20, 26, 10, 16),
    // the townhouses along the quay, one with the flag
    P('M610 332V216H690V332', 'solid'), roof('M606 216L650 168L694 216Z'), wins(620, 228, 3, 4, 22, 24, 10, 14),
    P('M690 332V232H770V332', 'solid'), roof('M686 232L702 204H756L774 232Z'), pen('M744 204V192H752V204', 'thin'), wins(700, 244, 3, 3, 22, 26, 10, 16),
    G('zflag', pen('M712 204V164') + pen(R(712, 164, 26, 18, 1)) + pen('M725 168V178M720 173H730', 'thin')),
    P('M770 332V248H812V332', 'solid'), roof('M766 248L788 224H812V248Z'), wins(780, 258, 2, 3, 20, 24, 9, 14),
    // the quay
    P('M470 332H812V368H470Z', 'solid'), pen('M470 350H812M520 332V350M600 350V368M680 332V350M760 350V368', 'thin'),
  ].join('');
  // the bridge: four arches (shaded under), its balustrade, two lamps
  const arches = [0, 1, 2, 3].map((k) => { const a = 14 + k * 118, b = a + 94; return `M${a} 392V358A47 24 0 0 1 ${b} 358V392Z`; }).join('');
  const bridge = [
    P(`M0 316H482V392H0Z${arches}`, 'solid', 'fill-rule="evenodd"'), pen('M0 324H482', 'thin'),
    pen('M0 296H482'), pen(Array.from({ length: 53 }, (_, i) => `M${4 + i * 9} 298V316`).join(''), 'thin'),
    [140, 376].map((x) => pen(`M${x} 296V262`) + P(R(x - 6, 248, 12, 14, 3), 'solid')).join(''),
  ].join('');
  // the boat: a long glass cabin, its wake behind it
  const boat = [
    pen('M432 424C446 418 458 418 470 420M412 434C432 428 450 428 466 430', 'faint'),
    P('M474 410H760L740 430H488Z', 'solid'), P(R(492, 386, 222, 24, 6), 'solid'),
    pen(Array.from({ length: 11 }, (_, i) => `M${512 + i * 18} 389V407`).join(''), 'thin'), pen('M484 386H722'),
  ].join('');
  return [
    cloud('zcloud-0', 520, 92, 1), cloud('zcloud-1', 650, 136, 0.7), cloud('zcloud-2', 250, 100, 0.8),
    alps, written('zurich-name', 44, 70, t(art.deindeal.city), 64, 'script'),
    G('city', city), F(arches, 'face-l'), waves, G('bridge', bridge), G('boat', boat),
  ].join('');
};
