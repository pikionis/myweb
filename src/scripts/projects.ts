/*
 * /projects (src/components/ProjectsHub.astro): every project in the panel at the top, the one picked under it.
 *
 * Picking a project (its tile, or "Next project" under the one shown) shows it in place, without a reload: the
 * address becomes its page (/projects/<id>), the back button returns to the one before, and an old ?project=<id>
 * link opens that one. One switch shows every project's PageSpeed numbers, and its site, as a phone or a desktop
 * gets them; it starts on the reader's own. The site is the real one in a frame: laid out at its own width (1440px,
 * or a phone's 390px) and scaled into the box, loaded only once it nears the screen and dropped when another
 * project is picked. On a phone the frame stays a picture and its button opens the site full screen (livePreview).
 */
import { gsap } from 'gsap';

const SITE_WIDTH = 1440;
const PHONE = { w: 390, h: 844 };
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';

export function projectsHub(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 820px)');
  const rail = root.querySelector<HTMLElement>('[data-rail]')!;
  const tiles = [...rail.querySelectorAll<HTMLAnchorElement>('[data-pick]')];
  const projects = new Map([...root.querySelectorAll<HTMLElement>('[data-proj]')].map((el) => [el.dataset.proj!, el]));
  const first = [...projects.keys()][0];
  let current = [...projects.values()].find((el) => !el.hidden)?.dataset.proj ?? first;

  /* ---- phone or desktop ---- */
  const run = (proj: HTMLElement) =>
    proj.querySelector<HTMLElement>(`[data-run="${root.dataset.mode === 'phone' ? 'mobile' : 'desktop'}"]`);

  // the scores fill their rings and count up, once they are on screen
  const draw = (r: HTMLElement | null) => {
    if (!r || r.classList.contains('drawn')) return;
    r.classList.add('drawn');
    if (reduce) return;
    r.querySelectorAll<HTMLElement>('[data-score]').forEach((b) => {
      const n = Number(b.dataset.score);
      const o = { v: 0 };
      gsap.to(o, { v: n, duration: 1.1, ease: 'expo.out', onUpdate: () => { b.textContent = String(Math.round(o.v)); } });
    });
  };
  const inView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  // shown again (another project, the other device): from nothing once more
  const redraw = (proj: HTMLElement) => {
    proj.querySelectorAll('.s-run.drawn').forEach((r) => r.classList.remove('drawn'));
    const speed = proj.querySelector('[data-speed]');
    if (speed && inView(speed)) requestAnimationFrame(() => draw(run(proj)));
  };
  const speedSeen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) draw(run(e.target.closest<HTMLElement>('[data-proj]')!));
  }, { threshold: 0.35 });
  root.querySelectorAll('[data-speed]').forEach((s) => speedSeen.observe(s));

  const setMode = (mode: 'phone' | 'desktop') => {
    root.dataset.mode = mode;
    root.querySelectorAll<HTMLButtonElement>('[data-switch] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    const proj = projects.get(current)!;
    redraw(proj);
    const b = proj.querySelector<HTMLElement>('[data-browser]');
    if (b) fit(b);
  };
  root.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-switch] button');
    if (b && b.dataset.mode !== root.dataset.mode) setMode(b.dataset.mode as 'phone' | 'desktop');
  });

  /* ---- the site in its frame ---- */
  const fit = (b: HTMLElement) => {
    const view = b.querySelector<HTMLElement>('[data-view]')!;
    const frame = view.querySelector<HTMLIFrameElement>('iframe');
    if (!frame) return;
    const w = view.clientWidth, h = view.clientHeight;
    if (root.dataset.mode === 'phone') {
      const s = Math.min(1, h / PHONE.h, w / PHONE.w);
      Object.assign(frame.style, { width: `${PHONE.w}px`, height: `${h / s}px`, left: `${(w - PHONE.w * s) / 2}px`, transform: `scale(${s})` });
    } else {
      const s = w / SITE_WIDTH;
      Object.assign(frame.style, { width: `${SITE_WIDTH}px`, height: `${h / s}px`, left: '0px', transform: `scale(${s})` });
    }
  };
  const load = (b: HTMLElement) => {
    if (small.matches || b.closest('[hidden]') || b.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.src = b.dataset.src!;
    frame.title = b.dataset.name ?? '';
    frame.setAttribute('sandbox', SANDBOX);
    frame.addEventListener('load', () => b.classList.add('loaded'), { once: true });
    b.querySelector('[data-view]')!.append(frame);
    fit(b);
  };
  const unload = (b: HTMLElement | null) => {
    b?.querySelector('iframe')?.remove();
    b?.classList.remove('loaded');
  };
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) load(e.target as HTMLElement);
  }, { rootMargin: '300px 0px' });
  const browsers = [...root.querySelectorAll<HTMLElement>('[data-browser]')];
  const resized = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target.closest<HTMLElement>('[data-browser]')!)));
  browsers.forEach((b) => { near.observe(b); resized.observe(b.querySelector('[data-view]')!); });
  // from a phone's width to a wider one and back: the frame comes, or goes back to its picture
  small.addEventListener('change', () => browsers.forEach((b) => {
    if (small.matches) unload(b);
    else { near.unobserve(b); near.observe(b); }
  }));

  /* ---- the panel ---- */
  const steps = [...root.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const ends = () => {
    steps[0].disabled = rail.scrollLeft < 4;
    steps[1].disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4;
  };
  steps.forEach((s) => s.addEventListener('click', () => {
    rail.scrollBy({ left: Number(s.dataset.step) * rail.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }));
  rail.addEventListener('scroll', ends, { passive: true });
  new ResizeObserver(ends).observe(rail);

  // the tile of the project shown, within the rail's view (the page itself stays where it is)
  const reveal = (id: string, smooth: boolean) => {
    const tile = tiles.find((t) => t.dataset.pick === id);
    if (!tile) return;
    const r = tile.getBoundingClientRect(), box = rail.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(rail).paddingLeft);
    if (r.left < box.left + pad || r.right > box.right - pad) {
      rail.scrollTo({ left: rail.scrollLeft + r.left - box.left - pad, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    }
  };

  /* ---- picking a project ---- */
  const pick = (id: string, { push = true, scroll = true } = {}) => {
    const to = projects.get(id);
    if (!to || id === current) return;
    const from = projects.get(current)!;
    unload(from.querySelector('[data-browser]'));
    from.hidden = true;
    to.hidden = false;
    current = id;
    tiles.forEach((t) => (t.dataset.pick === id ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
    reveal(id, true);
    document.title = `${to.dataset.title} — ${root.dataset.suffix}`;
    if (push) history.pushState({ project: id }, '', to.dataset.href);
    redraw(to);
    if (!reduce) {
      gsap.fromTo(to.querySelectorAll('[data-in]'), { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out', clearProps: 'opacity,visibility,transform' });
    }
    if (scroll) {
      // the project comes into view if it isn't: from the panel on a phone, from "Next project" at its foot
      const top = to.getBoundingClientRect().top;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72;
      if (top < 0 || top > window.innerHeight * 0.55) {
        window.scrollTo({ top: window.scrollY + top - bar, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  };

  root.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[data-pick]');
    // a new tab or window is the link's own business
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    pick(link.dataset.pick!);
  });
  const fromAddress = () => {
    const m = /^\/projects\/([^/]+)\/?$/.exec(location.pathname);
    return m ? decodeURIComponent(m[1]) : first;
  };
  window.addEventListener('popstate', () => pick(fromAddress(), { push: false, scroll: false }));

  // the reader's own device to start with
  setMode(small.matches ? 'phone' : 'desktop');
  // an old link (/projects?project=<id>): that project, at its own address
  const asked = new URLSearchParams(location.search).get('project');
  if (asked && projects.has(asked)) {
    pick(asked, { push: false, scroll: false });
    history.replaceState(null, '', projects.get(asked)!.dataset.href);
  }
  reveal(current, false);
  ends();
}
