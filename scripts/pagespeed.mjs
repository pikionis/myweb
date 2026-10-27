// Measures every live project (`live_url`, not `launching`) with Google PageSpeed Insights, on a phone and on a
// desktop, into src/data/pagespeed.json for /projects: the four Lighthouse scores, the lab metrics and, where
// Google has enough visitors to report them, the field data of real users (CrUX).
// Needs PSI_KEY, a Google API key with the PageSpeed Insights API enabled: in .env locally, a repository secret in
// the deploy workflow. Without a key Google's shared quota is usually spent; whatever can't be measured keeps its
// saved results. `npm run pagespeed -- --lhr <dir>` reads Lighthouse reports instead (<id>-mobile.json, <id>-desktop.json).
import { readdir, readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/pagespeed.json', import.meta.url);
const DIR = new URL('../src/content/projects/', import.meta.url);
const KEY = process.env.PSI_KEY;
const STRATEGIES = ['mobile', 'desktop'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
// the lab metrics, by the Lighthouse audit that holds each
const LAB = {
  fcp: 'first-contentful-paint', lcp: 'largest-contentful-paint', tbt: 'total-blocking-time',
  cls: 'cumulative-layout-shift', si: 'speed-index',
};
// the field metrics, by their CrUX name (CLS comes as a hundredfold integer)
const FIELD = {
  lcp: 'LARGEST_CONTENTFUL_PAINT_MS', inp: 'INTERACTION_TO_NEXT_PAINT', cls: 'CUMULATIVE_LAYOUT_SHIFT_SCORE',
  fcp: 'FIRST_CONTENTFUL_PAINT_MS', ttfb: 'EXPERIMENTAL_TIME_TO_FIRST_BYTE',
};

/** The live projects, read from their front matter: id, and the address to measure (`url`, else `live_url`). */
async function projects() {
  const list = [];
  for (const f of (await readdir(DIR)).sort()) {
    if (!f.endsWith('.md') || f.startsWith('_')) continue;
    const fm = (await readFile(new URL(f, DIR), 'utf8')).split(/^---\s*$/m)[1] ?? '';
    const get = (k) => fm.match(new RegExp(`^${k}:\\s*"?([^"\\n#]*?)"?\\s*(#.*)?$`, 'm'))?.[1];
    if (!get('live_url') || get('launching') === 'true' || get('draft') === 'true') continue;
    list.push({ id: f.slice(0, -3), url: get('url') || get('live_url') });
  }
  return list;
}

const round = (n, d = 0) => (typeof n === 'number' ? Math.round(n * 10 ** d) / 10 ** d : null);

/** What /projects shows of a Lighthouse report. */
function lab(lhr) {
  if (lhr.runtimeError) throw new Error(lhr.runtimeError.code);
  return {
    scores: Object.fromEntries(CATEGORIES.map((c) => [c, round((lhr.categories[c]?.score ?? 0) * 100)])),
    // each metric's value and Lighthouse's score for it (0–1: how PageSpeed colours it)
    lab: Object.fromEntries(Object.entries(LAB).map(([k, a]) => [k, {
      v: round(lhr.audits[a]?.numericValue, k === 'cls' ? 3 : 0), s: round(lhr.audits[a]?.score, 2),
    }])),
    at: lhr.fetchTime,
  };
}

/** Real users' 75th percentile and Google's verdict for each metric, when CrUX has the page (or its origin). */
function field(exp) {
  if (!exp?.metrics) return undefined;
  const out = {};
  for (const [k, m] of Object.entries(FIELD)) {
    const v = exp.metrics[m];
    if (v) out[k] = { p75: k === 'cls' ? v.percentile / 100 : v.percentile, category: v.category };
  }
  return Object.keys(out).length ? { ...out, origin: !!exp.origin_fallback } : undefined;
}

async function psi(url, strategy) {
  const q = new URLSearchParams({ url, strategy });
  for (const c of CATEGORIES) q.append('category', c.toUpperCase().replace('-', '_'));
  if (KEY) q.set('key', KEY);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(150000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const f = field(j.loadingExperience);
  return { source: 'pagespeed', ...lab(j.lighthouseResult), ...(f && { field: f }) };
}

async function fromFile(dir, id, strategy) {
  return { source: 'lighthouse', ...lab(JSON.parse(await readFile(`${dir}/${id}-${strategy}.json`, 'utf8'))) };
}

const lhrDir = process.argv.includes('--lhr') ? process.argv[process.argv.indexOf('--lhr') + 1] : null;
let saved = {};
try { saved = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

const list = await projects();
const next = {};
let measured = 0;
await Promise.all(list.map(async ({ id, url }) => {
  const before = saved[id]?.url === url ? saved[id] : undefined;
  const entry = { url };
  for (const strategy of STRATEGIES) {
    try {
      entry[strategy] = lhrDir ? await fromFile(lhrDir, id, strategy) : await psi(url, strategy);
      measured++;
    } catch (e) {
      if (before?.[strategy]) entry[strategy] = before[strategy];
      console.warn(`pagespeed: ${id} ${strategy}: ${before?.[strategy] ? 'kept the saved results' : 'no results'} (${e.message})`);
    }
  }
  if (entry.mobile || entry.desktop) next[id] = entry;
}));

const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
await writeFile(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`pagespeed: ${measured} of ${list.length * STRATEGIES.length} measured${KEY || lhrDir ? '' : ' (no PSI_KEY)'}`);
