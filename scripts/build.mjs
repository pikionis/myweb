// `npm run build`: the site in each language, one build per language (see src/data/lang.ts). English goes to dist/ and
// keeps everything that exists once (public/, robots.txt, sitemap.xml, llms.txt, /admin); the others to dist/el, dist/de.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const LANGS = ['en', 'el', 'de'];
const ONCE = ['robots.txt', 'sitemap.xml', 'llms.txt', 'admin'];
const astro = 'node_modules/astro/astro.js';

for (const lang of LANGS) {
  console.log(`\n— ${lang} —`);
  const run = spawnSync(process.execPath, [astro, 'build'], { stdio: 'inherit', env: { ...process.env, PUBLIC_LANG: lang } });
  if (run.status !== 0) process.exit(run.status ?? 1);
  if (lang !== 'en') {
    for (const f of ONCE) fs.rmSync(`dist/${lang}/${f}`, { recursive: true, force: true });
    // what is in public/ exists once, at the root, whatever the build prefixed to its address
    for (const file of fs.readdirSync(`dist/${lang}`, { recursive: true })) {
      if (!/\.(css|html)$/.test(file)) continue;
      const at = `dist/${lang}/${file}`;
      const before = fs.readFileSync(at, 'utf8');
      const after = before.split(`/${lang}/fonts/`).join('/fonts/');
      if (after !== before) fs.writeFileSync(at, after);
    }
  }
}

// a deploy that isn't the day's measuring reads these back from the live site (scripts/pagespeed.mjs)
fs.copyFileSync('src/data/pagespeed.json', 'dist/pagespeed.json');
