/*
 * A project's live site in its card on the home page (Services.astro, `live_url` in the project's Markdown):
 * the site laid out at a desktop width of 1440px and scaled to the box, so it reads as the real thing, and
 * kept to the box's size as the box changes (the stack pins and unpins it, the window resizes).
 *
 * The scroll follows the pointer (the styles decide it): on a desktop, over the box the wheel scrolls the
 * site, anywhere else the page and its cards. Phones and touch screens only look at it.
 */
import { gsap } from 'gsap';

const SITE_WIDTH = 1440;

export function liveSite(box: HTMLElement) {
  const frame = box.querySelector<HTMLIFrameElement>('iframe');
  if (!frame) return;

  // the site at 1440px, scaled to the box's width; it is as tall as the box at that scale
  const fit = () => {
    const scale = box.clientWidth / SITE_WIDTH;
    if (!scale) return;
    frame.style.transform = `scale(${scale})`;
    frame.style.height = `${box.clientHeight / scale}px`;
  };
  new ResizeObserver(fit).observe(box);
  fit();
}

/*
 * On a phone the live site in a card is only to look at: we can't know whether a finger on it means to scroll
 * the site or the page, so it always scrolls the page. Its "Preview" button opens the site full screen instead,
 * at the phone's own width, to scroll and tap through; it grows out of its card. ×, Esc or the phone's back
 * button closes it, and the page is where it was.
 */
export function livePreview(root: HTMLElement) {
  // a layer of its own at the top of the page, so the page can step aside under it
  document.body.append(root);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const box = root.querySelector<HTMLElement>('[data-lp-frame]')!;
  const name = root.querySelector<HTMLElement>('[data-lp-name]')!;
  const visit = root.querySelector<HTMLAnchorElement>('[data-lp-visit]')!;
  const closer = root.querySelector<HTMLButtonElement>('[data-lp-close]')!;
  let opener: HTMLButtonElement | null = null;
  let inerted: Element[] = [];
  let open = false;

  /** The card's box, as a clip on the full screen (the preview grows out of it, and folds back into it). */
  const cardClip = () => {
    const r = opener?.closest('[data-live], [data-browser]')?.getBoundingClientRect();
    return r ? `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 12px)` : null;
  };
  const whole = 'inset(0px 0px 0px 0px round 0px)';

  const show = (button: HTMLButtonElement) => {
    if (open) return;
    open = true;
    opener = button;
    const frame = document.createElement('iframe');
    frame.src = button.dataset.preview!;
    frame.title = button.dataset.frameTitle ?? '';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    box.replaceChildren(frame);
    name.textContent = button.dataset.name ?? '';
    visit.href = button.dataset.visit ?? frame.src;
    root.hidden = false;
    inerted = [...document.body.children].filter((el) => el !== root && !(el instanceof HTMLScriptElement));
    inerted.forEach((el) => el.setAttribute('inert', ''));
    document.documentElement.classList.add('lp-open');
    // the phone's back button closes it
    history.pushState({ livePreview: true }, '');
    closer.focus({ preventScroll: true });
    const clip = cardClip();
    if (!reduce && clip) gsap.fromTo(root, { clipPath: clip }, { clipPath: whole, duration: 0.55, ease: 'expo.out', clearProps: 'clipPath' });
  };

  const hide = (fromHistory = false) => {
    if (!open) return;
    open = false;
    const done = () => {
      gsap.set(root, { clearProps: 'clipPath' });
      root.hidden = true;
      box.replaceChildren();
      inerted.forEach((el) => el.removeAttribute('inert'));
      inerted = [];
      document.documentElement.classList.remove('lp-open');
      opener?.focus({ preventScroll: true });
    };
    const clip = cardClip();
    if (!reduce && clip) gsap.fromTo(root, { clipPath: whole }, { clipPath: clip, duration: 0.4, ease: 'power3.inOut', onComplete: done });
    else done();
    // closed here rather than by the back button: take back the step it added
    if (!fromHistory) history.back();
  };

  document.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach((b) => b.addEventListener('click', () => show(b)));
  closer.addEventListener('click', () => hide());
  document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') hide(); });
  window.addEventListener('popstate', () => { if (open) hide(true); });
}
