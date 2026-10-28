/*
 * The FAQ chat on /services (src/components/FaqChat.astro). Every question and answer is in the page; this plays
 * each pair as it scrolls into view: the visitor's typing dots (0.8 s), the question slides in, Petros's dots, then
 * the answer word by word (25 ms a word, at most 1.5 s). Nothing moves while it plays: every bubble keeps its room
 * from the start and only becomes visible. The chips and "Next question" jump to a pair (it plays as it arrives);
 * the chip of the pair being read is marked. With reduced motion everything is simply there.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function faqChat(root: HTMLElement) {
  const pairs = [...root.querySelectorAll<HTMLElement>('[data-pair]')];
  const chips = [...root.querySelectorAll<HTMLAnchorElement>('[data-jump]')];
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72) + 84;

  /** Scrolls a pair to just under the chat's header. */
  const go = (k: number) => {
    const el = pairs[k];
    if (!el) { document.getElementById('start')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar(), behavior: reduce ? 'auto' : 'smooth' });
  };
  /** The pair being read: the last one whose top has passed the upper part of the screen. */
  const current = () => {
    let k = -1;
    pairs.forEach((p, i) => { if (p.getBoundingClientRect().top < window.innerHeight * 0.45) k = i; });
    return k;
  };
  next?.addEventListener('click', () => go(current() + 1));
  chips.forEach((c, i) => c.addEventListener('click', (e) => { e.preventDefault(); go(i); history.replaceState(null, '', `#faq-${i + 1}`); }));

  // the chip of the pair on screen is marked, and brought into view in the strip on a phone once the page stops
  // moving (scrolling the strip while the page glides would stop the page)
  let marked = -2;
  let settle = 0;
  const reveal = () => {
    const chip = chips[marked];
    const strip = chip?.closest('ul');
    if (chip && strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: chip.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  const mark = () => {
    const k = Math.max(0, current());
    if (k === marked) return;
    marked = k;
    chips.forEach((c, i) => c.setAttribute('aria-current', String(i === k)));
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    window.clearTimeout(settle);
    settle = window.setTimeout(reveal, 180);
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; mark(); });
  }, { passive: true });
  mark();

  if (reduce) return;

  /** An answer's words, each in its own span, so they can light up one by one (done as it is about to play). */
  const split = (a: HTMLElement) => {
    const out: HTMLSpanElement[] = [];
    const parts = (a.textContent ?? '').split(/(\s+)/);
    a.textContent = '';
    for (const w of parts) {
      if (/^\s+$/.test(w) || !w) { a.append(w); continue; }
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      a.append(s);
      out.push(s);
    }
    a.classList.add('words');
    return out;
  };
  const msgs = pairs.map((p) => [p.querySelector<HTMLElement>('.them')!, p.querySelector<HTMLElement>('.me')!] as const);
  // a pair already above the screen (a reload halfway down) is simply shown; the rest wait for their turn
  const above = pairs.map((p) => p.getBoundingClientRect().bottom < 0);
  pairs.forEach((_, i) => { if (!above[i]) msgs[i].forEach((m) => m.classList.add('hold')); });

  const play = async (i: number) => {
    const [them, me] = msgs[i];
    const ws = split(me.querySelector<HTMLElement>('[data-a]')!);
    them.classList.replace('hold', 'typing');
    await wait(800);
    them.classList.remove('typing');
    them.querySelector('.bubble')?.animate(
      [{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
    await wait(380);
    me.classList.replace('hold', 'typing');
    await wait(700);
    me.classList.remove('typing');
    const step = Math.min(25, 1500 / Math.max(ws.length, 1));
    for (const w of ws) { w.classList.add('on'); await wait(step); }
    me.querySelector('[data-a]')?.classList.remove('words');
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const i = pairs.indexOf(e.target as HTMLElement);
      if (msgs[i][0].classList.contains('hold')) play(i);
    }
  }, { rootMargin: '0px 0px -25% 0px' });
  pairs.forEach((p) => io.observe(p));
}
