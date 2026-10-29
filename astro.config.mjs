import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A page's module script sits at the end of its body, and the chunks it imports (GSAP, ScrollTrigger) are found only
// once it has arrived: on a phone that is a round trip or two before anything moves. After the build, the first
// script names everything the page's scripts import (`modulepreload`), so it is all fetched together. The links stand
// where the script does, not in the head, so the page's own pictures (an LCP image) are still asked for first.
function modulePreload() {
  return {
    name: 'module-preload',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        const imported = new Map();
        // a chunk's static imports, and theirs (an import() is fetched only when it runs, so it is left out)
        const deps = (src, seen = new Set()) => {
          if (seen.has(src)) return seen;
          seen.add(src);
          if (!imported.has(src)) {
            const code = fs.readFileSync(path.join(out, src), 'utf8');
            const found = [...code.matchAll(/import\s*(?:[\w$*{}\s,]+from\s*)?["'](\.\/[^"']+\.js)["']/g)]
              .map((m) => path.posix.join(path.posix.dirname(src), m[1]));
            imported.set(src, found);
          }
          for (const d of imported.get(src)) deps(d, seen);
          return seen;
        };
        const pages = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? pages(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
        for (const file of pages(out)) {
          const html = fs.readFileSync(file, 'utf8');
          const tags = [...html.matchAll(/<script type="module" src="(\/[^"]+\.js)"[^>]*>/g)];
          if (!tags.length || html.includes('rel="modulepreload"')) continue;
          const all = new Set();
          for (const [, s] of tags) for (const d of deps(s)) all.add(d);
          // the scripts themselves are found where they stand; what they import is named with the first
          for (const [, s] of tags) all.delete(s);
          // low priority: they come after the page's styles and fonts, never before its first picture
          const links = [...all].map((src) => `<link rel="modulepreload" href="${src}" fetchpriority="low">`).join('');
          const at = tags[0].index;
          fs.writeFileSync(file, html.slice(0, at) + links + html.slice(at));
        }
      },
    },
  };
}

export default defineConfig({
  // the live domain (GitHub Pages, see .github/workflows/deploy.yml)
  site: 'https://onehublabs.com',
  // the dev toolbar sits bottom-centre, right where the status island lives on /contact
  devToolbar: { enabled: false },
  integrations: [modulePreload()],
});
