# pikioniswebdeveloper — personal site of Petros Pikionis

Astro 5 + GSAP (ScrollTrigger). Static site. All content lives in `src/data/site.ts`.

## Commands
- `npm install` → `npm run dev` (http://localhost:4321) → `npm run build` (output in `dist/`)

## Structure
- `src/data/site.ts` — text, services, projects, brands, stats (edit content here, not in components)
- `src/components/` — Nav, Intro (curtain + hero), Marquee, Services, Customers (brand bubbles + panel), Stats, Contact
- `src/scripts/main.ts` — all motion: curtain, word reveal, bubbles, counters, reveals
- `src/styles/global.css` — tokens (dark hero world → light lower page via `body.light`)
- `public/` — put `petros.jpg` (portrait) and vertical project videos here

## Design direction (the brief wins)
Dark SODA-style world: oversized uppercase Space Grotesk, one electric-blue accent (#4d7cff),
scroll-opening curtain intro, corner labels, services each carrying their real projects,
floating brand bubbles that open a phone-preview panel. Lower page turns warm light (#f4f3ef).
Keep this world. Refine, don't replace.

## Skills in `.claude/skills` — use them
- Before any UI change: `taste` (art direction) and `impeccable` (craft floor, audit, polish).
- Motion: `emil-design-eng` + `emil-review-animations`; ready transitions from `transitions-dev`.
- Scroll/timeline work: `gsap-scrolltrigger`, `gsap-timeline`, `gsap-performance`.
- Copying a reference site's look: `extract-design`.
- Before saying done: run the site, screenshot desktop (1440) and mobile (390) with `playwright-cli`, fix what you see.
- Finish with an `impeccable` audit.

## Rules
- Respect `prefers-reduced-motion` (main.ts already gates every effect).
- Small accent text uses `--accent-ink` (contrast ≥4.5:1 in both themes), not `--accent`.
- Icons are inline SVG, never emoji/unicode glyphs. No gradient text, no nested cards.
- No horizontal scroll at 390px.
