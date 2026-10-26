/*
 * A project's live site in its card on the home page (Services.astro, `live_url` in the project's Markdown):
 * the site laid out at a desktop width of 1440px and scaled to the box, so it reads as the real thing, and
 * kept to the box's size as the box changes (the stack pins and unpins it, the window resizes).
 *
 * The scroll follows the pointer (the styles decide it): on a desktop, over the box the wheel scrolls the
 * site, anywhere else the page and its cards. Phones and touch screens only look at it.
 */
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
