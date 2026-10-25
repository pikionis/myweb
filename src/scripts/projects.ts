import { gsap } from 'gsap';
import { glassCarousel, type GlassApi } from './glass';
import { serviceColors } from '../data/site';

/*
 * The projects showcase on /projects. Every project sits in the liquid glass carousel; opening one
 * shrinks the carousel and lifts it, and the project arrives below: its design video on the left and
 * a panel beside it with the title, the summary and the story. The address follows (?project=id).
 */

type ProjectData = {
  id: string;
  title: string;
  summary: string;
  services: string[];
  serviceKeys: string[];
  tags: string[];
  url?: string;
  cover?: string;
  video?: string;
  story: boolean;
};

const CARD = { w: 900, h: 1200 };
// a title card's ground and ink, by the project's first service (src/data/site.ts)
const CARD_COLORS: Record<string, [string, string]> = serviceColors;
const EASE_IN_OUT = 'power3.inOut';
const COMPACT_SCALE = () => (window.innerWidth < 760 ? 0.72 : 0.6);

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Breaks text into lines that fit `max` pixels in the current font. */
function wrap(g: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Until a project has its own cover, it gets a typeset card in the site's type and colours. */
function titleCard(p: ProjectData) {
  const c = document.createElement('canvas');
  c.width = CARD.w;
  c.height = CARD.h;
  const g = c.getContext('2d')!;
  const [ground, ink] = CARD_COLORS[p.serviceKeys[0]] ?? CARD_COLORS.none;
  g.fillStyle = ground;
  g.fillRect(0, 0, CARD.w, CARD.h);
  g.fillStyle = ink;
  g.textBaseline = 'top';
  g.font = '500 34px "Space Grotesk"';
  g.fillText(p.services[0] ?? '', 64, 64);

  let size = 150;
  let lines: string[] = [];
  do {
    g.font = `700 ${size}px "Space Grotesk"`;
    if ('letterSpacing' in g) g.letterSpacing = `${-size * 0.04}px`;
    lines = wrap(g, p.title.toUpperCase(), CARD.w - 128);
    size -= 8;
  } while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > CARD.w - 128)) && size > 60);
  const lead = (size + 8) * 0.9;
  const tagsY = CARD.h - 64 - 34;
  let y = tagsY - 40 - lines.length * lead;
  for (const l of lines) { g.fillText(l, 64, y); y += lead; }

  g.font = '500 30px "Space Grotesk"';
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  g.globalAlpha = 0.72;
  g.fillText(p.tags.join(' · '), 64, tagsY);
  g.globalAlpha = 1;
  return c;
}

export async function projectsShowcase(root: HTMLElement) {
  const data: ProjectData[] = JSON.parse(document.querySelector('script[data-projects]')?.textContent || '[]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const glass = root.querySelector<HTMLElement>('[data-glass]');
  const current = root.querySelector<HTMLElement>('[data-current]');
  const detail = root.querySelector<HTMLElement>('[data-detail]');
  const media = root.querySelector<HTMLElement>('[data-media]');
  const panel = root.querySelector<HTMLElement>('[data-panel]');
  const head = document.querySelector<HTMLElement>('[data-head]');
  if (!data.length || !stage || !glass || !detail || !media || !panel) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the cards are typeset in the site's face, so wait for it
  await document.fonts?.load('700 100px "Space Grotesk"').catch(() => null);
  const cards = data.map(titleCard);

  // the canvas keeps its full size and is scaled as a whole when a project opens, so it never reallocates
  const fitGlass = () => { if (!open) glass.style.height = `${stage.clientHeight}px`; };
  let open: ProjectData | null = null;
  fitGlass();

  let api: GlassApi | null = null;
  const label = (i: number) => {
    if (!current) return;
    const p = data[i];
    current.replaceChildren();
    const t = document.createElement('b');
    t.textContent = p.title;
    const s = document.createElement('span');
    s.textContent = p.services.join(', ');
    current.append(t, s);
  };
  api = glassCarousel(glass, data.map((p, i) => ({
    title: p.title,
    source: p.cover ?? cards[i],
    aspect: 3 / 4,
    base: rgb((CARD_COLORS[p.serviceKeys[0]] ?? CARD_COLORS.none)[0]),
  })), {
    background: rgb('#f4f3ef'),
    cursor: root.querySelector<HTMLElement>('[data-view]'),
    onActive: label,
    onOpen: (i) => show(data[i]),
  });
  // without WebGL the row is skipped; the index below still opens every project
  if (!api) stage.hidden = true;
  label(0);

  /* ---------- the opened project ---------- */
  const fill = (p: ProjectData) => {
    media.replaceChildren();
    if (p.video) {
      const v = document.createElement('video');
      Object.assign(v, { src: p.video, muted: true, loop: true, autoplay: true, playsInline: true, controls: false });
      if (p.cover) v.poster = p.cover;
      v.setAttribute('aria-label', `Design video of ${p.title}`);
      media.append(v);
      media.dataset.kind = 'video';
    } else {
      const img = document.createElement('img');
      img.alt = p.cover ? `${p.title}` : '';
      img.src = p.cover ?? cards[data.indexOf(p)].toDataURL('image/png');
      media.append(img);
      media.dataset.kind = p.cover ? 'cover' : 'card';
      media.style.background = p.cover ? '' : (CARD_COLORS[p.serviceKeys[0]] ?? CARD_COLORS.none)[0];
    }

    const kicker = panel.querySelector<HTMLElement>('[data-p-services]')!;
    kicker.textContent = p.services.join(', ');
    panel.querySelector<HTMLElement>('[data-p-title]')!.textContent = p.title;
    panel.querySelector<HTMLElement>('[data-p-summary]')!.textContent = p.summary;
    const story = panel.querySelector<HTMLElement>('[data-p-story]')!;
    const tpl = document.querySelector<HTMLTemplateElement>(`template[data-story="${p.id}"]`);
    story.replaceChildren(...(tpl ? [tpl.content.cloneNode(true)] : []));
    story.hidden = !tpl;
    const tags = panel.querySelector<HTMLElement>('[data-p-tags]')!;
    tags.replaceChildren(...p.tags.map((t) => { const li = document.createElement('li'); li.textContent = t; return li; }));
    const visit = panel.querySelector<HTMLAnchorElement>('[data-p-visit]')!;
    visit.hidden = !p.url;
    if (p.url) visit.href = p.url;
    const read = panel.querySelector<HTMLAnchorElement>('[data-p-read]')!;
    read.hidden = !p.story;
    read.href = `/projects/${p.id}`;
  };

  const arrive = () => {
    if (reduce) return;
    gsap.fromTo(media, { clipPath: 'inset(0 0 100% 0 round 20px)' }, { clipPath: 'inset(0 0 0% 0 round 20px)', duration: 0.8, ease: EASE_IN_OUT });
    gsap.fromTo(panel, { x: 48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', delay: 0.15 });
    gsap.fromTo(panel.querySelectorAll(':scope > *'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.06, delay: 0.3 });
  };

  const setAddress = (p: ProjectData | null) => {
    const url = new URL(window.location.href);
    if (p) url.searchParams.set('project', p.id); else url.searchParams.delete('project');
    history.replaceState(null, '', url);
  };

  /** The carousel at full size, or shrunk and lifted to make room for the open project. */
  let small = false;
  const sizeCarousel = (compact: boolean, dur: number, delay = 0, onDone?: () => void) => {
    small = compact;
    const s = compact ? COMPACT_SCALE() : 1;
    gsap.to(glass, { scale: s, duration: dur, delay, ease: EASE_IN_OUT, transformOrigin: '50% 0%', overwrite: 'auto' });
    gsap.to(stage, { height: glass.offsetHeight * s, duration: dur, delay, ease: EASE_IN_OUT, overwrite: 'auto', onComplete: onDone });
  };
  const PEEK = reduce ? 0 : 0.5;
  let enterTimer = 0, leaveTimer = 0;

  const show = (p: ProjectData, scroll = true) => {
    clearTimeout(enterTimer);
    api?.select(data.indexOf(p));
    setAddress(p);
    if (open) {
      if (open.id === p.id) { if (!small) sizeCarousel(true, PEEK); return; }
      // picked while browsing the big carousel: it steps back down to make room again
      if (!small) sizeCarousel(true, PEEK);
      // another project while one is open: the old one steps out, the new one steps in
      open = p;
      const swap = () => { fill(p); arrive(); };
      if (reduce) swap();
      else gsap.to([media, panel], { autoAlpha: 0, y: 12, duration: 0.18, ease: 'power2.in', onComplete: () => { gsap.set([media, panel], { y: 0, autoAlpha: 1 }); swap(); } });
      return;
    }
    open = p;
    fill(p);
    detail.hidden = false;
    // the carousel shrinks and lifts, the page title folds away, and the project arrives below
    const dur = reduce ? 0 : 0.7;
    sizeCarousel(true, dur);
    if (head) gsap.to(head, { height: 0, marginBottom: 0, autoAlpha: 0, duration: dur, ease: EASE_IN_OUT });
    arrive();
    if (scroll) {
      const top = root.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  const close = () => {
    if (!open) return;
    open = null;
    setAddress(null);
    const dur = reduce ? 0 : 0.6;
    gsap.to([media, panel], {
      autoAlpha: 0, y: 16, duration: reduce ? 0 : 0.25, ease: 'power2.in',
      onComplete: () => { detail.hidden = true; gsap.set([media, panel], { autoAlpha: 1, y: 0 }); },
    });
    clearTimeout(enterTimer);
    clearTimeout(leaveTimer);
    sizeCarousel(false, dur, reduce ? 0 : 0.15, () => gsap.set(stage, { clearProps: 'height' }));
    if (head) gsap.to(head, { height: 'auto', marginBottom: '', autoAlpha: 1, duration: dur, ease: EASE_IN_OUT, delay: reduce ? 0 : 0.15, onComplete: () => gsap.set(head, { clearProps: 'height,marginBottom' }) });
    stage.focus({ preventScroll: true });
  };

  // While a project is open, pointing back at the carousel brings it back to full size to browse;
  // heading off to the project shrinks it again. A short wait on each side keeps a passing pointer
  // from setting it off.
  stage.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !open) return;
    clearTimeout(leaveTimer);
    enterTimer = window.setTimeout(() => { if (open && small) sizeCarousel(false, PEEK); }, 120);
  });
  stage.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(enterTimer);
    if (open && !small) leaveTimer = window.setTimeout(() => { if (open && !small) sizeCarousel(true, PEEK); }, 250);
  });
  // touch has no hover: the first tap on the small carousel brings it back (and isn't taken as a
  // pick), a tap anywhere else shrinks it again
  let swallowUntil = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !open || !small) return;
    swallowUntil = performance.now() + 500;
    sizeCarousel(false, PEEK);
  });
  stage.addEventListener('click', (e) => {
    if (performance.now() < swallowUntil) { swallowUntil = 0; e.stopPropagation(); e.preventDefault(); }
  }, true);
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !open || small || stage.contains(e.target as Node)) return;
    sizeCarousel(true, PEEK);
  });
  // the same for the keyboard: focusing the carousel brings it back, leaving it shrinks it
  stage.addEventListener('focus', () => { if (open && small && stage.matches(':focus-visible')) sizeCarousel(false, PEEK); });
  stage.addEventListener('blur', () => { if (open && !small) sizeCarousel(true, PEEK); });

  panel.querySelector('[data-p-close]')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); api?.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); api?.previous(); }
    else if (e.key === 'Enter' && api) { e.preventDefault(); show(data[api.current()]); }
  });
  // the index below opens the same projects
  document.querySelectorAll<HTMLElement>('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const p = data.find((x) => x.id === b.dataset.open);
    if (p) show(p);
  }));
  window.addEventListener('resize', () => { fitGlass(); api?.resize(); });

  // a shared link opens its project straight away
  const asked = new URLSearchParams(window.location.search).get('project');
  const first = data.find((x) => x.id === asked);
  if (first) show(first, false);
}
