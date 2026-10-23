// Pulls the public GitHub contribution calendar into src/data/github.json.
// Runs before every build (npm "prebuild"); if GitHub can't be reached the last saved file is kept.
import { writeFile } from 'node:fs/promises';

const USER = process.argv[2] || 'pikionis';
const OUT = new URL('../src/data/github.json', import.meta.url);

try {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // Each day is a <td data-date id> cell; its count lives in the <tool-tip for=id> that labels it.
  const dates = new Map();
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"\s+id="([^"]+)"/g)) dates.set(m[2], m[1]);
  const days = [];
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dates.get(m[1]);
    if (!date) continue;
    const n = /^([\d,]+)\s+contribution/.exec(m[2].trim());
    days.push([date, n ? Number(n[1].replace(/,/g, '')) : 0]);
  }
  if (days.length < 300) throw new Error(`only ${days.length} days found; the page layout may have changed`);
  days.sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const data = { user: USER, endDate: days.at(-1)[0], counts: days.map((d) => d[1]) };
  await writeFile(OUT, JSON.stringify(data) + '\n');
  const total = data.counts.reduce((s, n) => s + n, 0);
  console.log(`github: ${total} contributions over ${days.length} days, up to ${data.endDate}`);
} catch (e) {
  console.warn(`github: kept the saved calendar (${e.message})`);
}
