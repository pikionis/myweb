/*
 * A project's live site in its card on the home page (Services.astro, `live_url` in the project's Markdown):
 * the site laid out at a desktop width of 1440px and scaled to the box, so it reads as the real thing, and
 * kept to the box's size as the box changes (the stack pins and unpins it, the window resizes).
 *
 * It rests still, so the wheel and a finger keep moving the page and the cards keep coming. On a desktop a
 * click on the box lets you scroll the site inside it; once the pointer leaves the box, it rests again and the
 * page scrolls on. Phones and touch screens only look at it (and a tap opens the project, like the card).
 */
const SITE_WIDTH = 1440;
const canScroll = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');

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

  const scrolling = (on: boolean) => {
    box.classList.toggle('active', on);
    frame.tabIndex = on ? 0 : -1;
  };
  box.querySelector('[data-live-cover]')?.addEventListener('click', () => {
    if (!canScroll.matches) return;
    scrolling(true);
    // the keys scroll it too, from here
    frame.focus({ preventScroll: true });
  });
  box.addEventListener('pointerleave', () => scrolling(false));
}
