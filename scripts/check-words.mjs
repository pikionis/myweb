// `node scripts/check-words.mjs`: finds words written into the code instead of src/text (they would stay in English on
// the other languages' pages). It builds the site with every word of src/text wrapped in ⟦ ⟧ and lists whatever a page
// shows outside them. Project texts and proper names show up too: read the list, don't aim for an empty one.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'check-words-'));
const run = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build', '--outDir', out], { stdio: 'ignore', env: { ...process.env, PUBLIC_LANG: 'en', TEXT_PSEUDO: '1' } });
if (run.status !== 0) { console.error('the build failed'); process.exit(1); }

const pages = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === '_astro' ? [] : pages(path.join(d, e.name))) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
const found = new Map();
const note = (text, file) => {
  const clean = text.replace(/&#\d+;|&\w+;/g, ' ').replace(/⟦[^⟧]*⟧/g, '').replace(/\s+/g, ' ').trim();
  if (!/\p{L}{2,}/u.test(clean)) return;
  if (!found.has(clean)) found.set(clean, new Set());
  found.get(clean).add(path.relative(out, file).replace(/\\/g, '/').replace('/index.html', ''));
};
for (const file of pages(out)) {
  const html = fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<svg[\s\S]*?<\/svg>/g, (svg) => (svg.match(/<text[\s\S]*?<\/text>/g) ?? []).join(' '));
  for (const m of html.matchAll(/\b(aria-label|alt|title|placeholder)="([^"]*)"/g)) note(m[2], file);
  for (const m of html.replace(/<head[\s\S]*?<\/head>/, '').matchAll(/>([^<]+)</g)) note(m[1], file);
}
fs.rmSync(out, { recursive: true, force: true });
for (const [text, files] of [...found].sort((a, b) => b[1].size - a[1].size)) console.log(`${String(files.size).padStart(3)}  ${text.slice(0, 150)}   [${[...files][0]}]`);
console.log(`\n${found.size} pieces of text outside src/text`);
