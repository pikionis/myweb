// The logo's files, all made from the logo itself (src/data/logo.ts), so none of them falls behind it:
//   public/favicon.svg  the symbol on the hero's dark ground, drawn with a heavier line so it reads at 16px
//   public/logo.png     the structured-data logo (Base.astro), 512 × 512
//   public/og.png       the share card, 1200 × 630: the master lockup, the motto, the address and the name
// and, given a folder, the logo as SVG files to hand out (the master lockup, the header's horizontal one, the
// symbol alone; each also on dark).
//
//   npm run brand                    (npm run brand -- "<folder for the SVG files>")
//
// The two pictures are taken by a Chromium browser on this machine (CHROME_PATH, or Chrome or Edge where they
// install); the SVG files need nothing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { symbolBox as S, wordBox as W, lockup, parts, letters, lines } from '../src/data/logo.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = JSON.parse(fs.readFileSync(path.join(root, 'src/text/site.json'), 'utf8'));
const C = { ink: '#1f2020', cobalt: '#2d49ad', ivory: '#f8f4e6', night: '#0a0b0a' };
const r1 = (v) => Math.round(v * 10) / 10;

// ---- the logo as SVG markup ----
// the true logo: each part is the outline of its stretch of line, filled nonzero, the arc first (it sits under the
// loops it meets)
const symbol = (ink, arc) =>
  `<path fill="${arc}" d="${parts.arc}"/><g fill="${ink}"><path d="${parts.top}"/><path d="${parts.left}"/><path d="${parts.right}"/></g>`;
const word = (ink) => `<g fill="${ink}" fill-rule="evenodd">${letters.map((l) => `<path d="${l.d}"/>`).join('')}</g>`;
// the symbol as its centre lines at a chosen width, for small sizes where the true line would thin to nothing
const lineSymbol = (ink, arc, width) =>
  `<g fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">` +
  `<path stroke="${arc}" d="${lines.arcL}"/><path stroke="${arc}" d="${lines.arcR}"/>` +
  `<path stroke="${ink}" d="${lines.top}"/><path stroke="${ink}" d="${lines.left}"/><path stroke="${ink}" d="${lines.right}"/></g>`;
const svg = (viewBox, inner, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${extra}><title>onehub</title>${inner}</svg>\n`;

// the master lockup: the symbol, the wordmark centred under it
const mx0 = Math.min(0, lockup.x), mW = Math.max(S.w, lockup.x + W.w) - mx0, mH = lockup.y + W.h;
const master = (ink, arc) => symbol(ink, arc) + `<g transform="translate(${lockup.x} ${lockup.y})">${word(ink)}</g>`;
const masterBox = `${mx0} 0 ${mW} ${mH}`;
// the header's lockup: the symbol 44 wide, a gap of 10, the wordmark 80 wide, centred beside it
const k = S.w / 44, wk = (80 * k) / W.w, wTop = (S.h - W.h * wk) / 2;
const hW = S.w + 10 * k + W.w * wk;
const horizontal = (ink, arc) =>
  symbol(ink, arc) + `<g transform="translate(${r1(S.w + 10 * k)} ${r1(wTop)}) scale(${wk.toFixed(5)})">${word(ink)}</g>`;

// ---- favicon.svg: a rounded tile of the hero's ground, the symbol in the header's colours there ----
{
  const line = 84; // symbol units: about 2px at 32px
  const pad = line / 2, bw = S.w + line, bh = S.h + line; // the symbol's box with its line's ends
  const inner = 50, sc = inner / Math.max(bw, bh);
  const tx = 32 - (bw * sc) / 2 + pad * sc, ty = 32 - (bh * sc) / 2 + pad * sc;
  fs.writeFileSync(path.join(root, 'public/favicon.svg'), svg('0 0 64 64',
    `<rect width="64" height="64" rx="14" fill="${C.night}"/>` +
    `<g transform="translate(${r1(tx * 100) / 100} ${r1(ty * 100) / 100}) scale(${sc.toFixed(5)})">${lineSymbol(C.ivory, C.cobalt, line)}</g>`));
  console.log('public/favicon.svg');
}

// ---- the SVG files to hand out ----
const folder = process.argv[2];
if (folder) {
  fs.mkdirSync(folder, { recursive: true });
  for (const [tone, ink] of [['', C.ink], ['-on-dark', C.ivory]]) {
    const files = {
      [`onehub-logo${tone}.svg`]: svg(masterBox, master(ink, C.cobalt)),
      [`onehub-logo-horizontal${tone}.svg`]: svg(`0 0 ${r1(hW)} ${S.h}`, horizontal(ink, C.cobalt)),
      [`onehub-symbol${tone}.svg`]: svg(`0 0 ${S.w} ${S.h}`, symbol(ink, C.cobalt)),
    };
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(folder, name), `<?xml version="1.0" encoding="UTF-8"?>\n${body}`);
      console.log(path.join(folder, name));
    }
  }
}

// ---- the two pictures, taken by a browser ----
function browser() {
  const found = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('No Chromium browser found: set CHROME_PATH to one.');
  return found;
}
function shoot(html, w, h, out) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohl-brand-'));
  const page = path.join(tmp, 'page.html');
  fs.writeFileSync(page, html);
  execFileSync(browser(), [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${path.join(tmp, 'profile')}`,
    '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=3000',
    `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(path.relative(root, out));
}
const font = (weight) =>
  pathToFileURL(path.join(root, `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${weight}-normal.woff2`)).href;
const page = (w, h, body, style = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: SG; font-weight: 400; src: url(${font(400)}) format('woff2'); }
@font-face { font-family: SG; font-weight: 500; src: url(${font(500)}) format('woff2'); }
html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; background: ${C.ivory}; }
svg { position: absolute; display: block; }
${style}</style></head><body>${body}</body></html>`;

// logo.png: the symbol alone on ivory, with the heavier line the search results' small sizes need
{
  const line = 34, bw = S.w + line, bh = S.h + line, size = 400; // the symbol 400 wide in 512
  const h = (size * bh) / bw;
  shoot(page(512, 512,
    `<svg viewBox="${-line / 2} ${-line / 2} ${bw} ${bh}" style="left:${(512 - size) / 2}px; top:${r1((512 - h) / 2)}px; width:${size}px">${lineSymbol(C.ink, C.cobalt, line)}</svg>`),
    512, 512, path.join(root, 'public/logo.png'));
}

// og.png: the master lockup, the motto with its tail, the address bottom left and the name bottom right
{
  const lockW = 440 * (mW / W.w); // the wordmark 440 wide
  const motto = `${site.brand.motto.en} ${site.intro.tail.en}`;
  const name = site.person?.name?.en ?? site.name?.en ?? 'Petros Pikionis';
  shoot(page(1200, 630,
    `<svg viewBox="${masterBox}" style="left:${r1((1200 - lockW) / 2)}px; top:104px; width:${r1(lockW)}px">${master(C.ink, C.cobalt)}</svg>` +
    `<p class="motto">${motto}</p><p class="corner l">onehublabs.com</p><p class="corner r">${name}</p>`,
    `p { position: absolute; margin: 0; font-family: SG, sans-serif; }
     .motto { left: 0; right: 0; top: 482px; text-align: center; font-size: 28px; font-weight: 500; color: ${C.ink}; letter-spacing: 0.01em; }
     .corner { bottom: 44px; font-size: 20px; font-weight: 400; color: #5b5c58; }
     .l { left: 56px; } .r { right: 56px; }`),
    1200, 630, path.join(root, 'public/og.png'));
}
