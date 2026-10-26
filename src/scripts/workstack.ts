import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * "What I build" on the home page: the service sheets stack over a held screen, and inside each
 * sheet its projects stack the same way — a stack within a stack. Each scroll step brings in one
 * thing: the next project of the current service, or, when a service is done, the next service.
 * A sheet that sets its projects' own texts beside them shows the text of the
 * project on top, or of the one under the pointer. Project videos play only while their card is on screen.
 */

// the stack can hold on a screen at least this big; on a phone held upright it holds its own way (holdPhone);
// elsewhere (a short wide screen, a phone on its side, reduced motion, no script) the sheets and their
// projects simply follow one another
const PINNED = '(min-width: 861px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)';
const PHONE = '(max-width: 860px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)';
/** Breathing room kept under a held sheet's words, in px. */
const ROOM = 12;

export function workStack(root: HTMLElement) {
  watchVideos(root);
  gsap.registerPlugin(ScrollTrigger);
  const sheets = [...root.querySelectorAll<HTMLElement>('[data-sheet]')];
  const texts = sheets.map(projectTexts);

  /** Whether every sheet's words fit beside its projects while held (measured in the held layout). */
  const fits = () => {
    const held = root.classList.contains('on');
    root.classList.add('on');
    const ok = sheets.every((sheet) => {
      const copy = sheet.querySelector<HTMLElement>('.copy');
      return !copy || copy.offsetTop + copy.offsetHeight <= sheet.clientHeight - ROOM;
    });
    if (!held) root.classList.remove('on');
    return ok;
  };

  // the stack holds only where the words fit, so longer copy falls back to the flow instead of being cut;
  // a resize can change that either way
  let mm: gsap.MatchMedia | null = null;
  let holding = false;
  const setup = () => {
    mm?.revert();
    mm = gsap.matchMedia();
    mm.add(PINNED, () => (fits() ? hold() : undefined));
  };
  const recheck = () => {
    if (window.matchMedia(PINNED).matches && fits() !== holding) { setup(); ScrollTrigger.refresh(); }
  };
  // a phone: built once the fonts are in (the words' height decides how far they scroll), and again when the
  // width changes (only the height changes as a phone's address bar comes and goes)
  const pin = root.querySelector<HTMLElement>('.pin');
  let phone: gsap.MatchMedia | null = null;
  let phoneWidth = 0;
  const setupPhone = () => {
    if (!pin) return;
    phone?.revert();
    phone = gsap.matchMedia();
    phoneWidth = window.innerWidth;
    phone.add(PHONE, () => holdPhone(root, pin, sheets));
  };
  (document.fonts?.ready ?? Promise.resolve()).then(() => { setupPhone(); ScrollTrigger.refresh(); });

  let wait = 0;
  window.addEventListener('resize', () => {
    clearTimeout(wait);
    wait = window.setTimeout(() => {
      recheck();
      if (window.innerWidth !== phoneWidth) { setupPhone(); ScrollTrigger.refresh(); }
    }, 200);
  });

  const hold = () => {
    holding = true;
    root.classList.add('on');
    // when each card has slid halfway in, by sheet
    const arrivals: { sheet: number; card: number; at: number }[] = [];
    const follow = () => {
      const t = tl.time();
      texts.forEach((show, i) => {
        if (!show) return;
        let top = 0;
        for (const a of arrivals) if (a.sheet === i && t >= a.at) top = a.card;
        show(top);
      });
    };
    const tl = gsap.timeline({
      onUpdate: follow,
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
    });
    let at = 0;
    sheets.forEach((sheet, i) => {
      if (i > 0) {
        // the next service rises from below the screen into its place in the stack
        tl.fromTo(sheet, { y: () => window.innerHeight }, { y: 0, ease: 'none', duration: 1 }, at);
        at += 1;
      }
      [...sheet.querySelectorAll<HTMLElement>('[data-pcard]')].forEach((card, j) => {
        if (j === 0) return;
        // inside the sheet, the next project rises from below the sheet over the one before
        tl.fromTo(card, { y: () => sheet.clientHeight }, { y: 0, ease: 'none', duration: 1 }, at);
        arrivals.push({ sheet: i, card: j, at: at + 0.5 });
        at += 1;
      });
    });
    // a short hold, so the last project is read before the stack lets go
    tl.to({}, { duration: 0.5 });
    return () => {
      holding = false;
      root.classList.remove('on');
      texts.forEach((show) => show?.(0));
    };
  };
  setup();
}

/**
 * The stack on a phone held upright: the sheets stack like tabs, as on a desktop. Each holds the screen in turn
 * under the title bands of the ones before it. Its title stays while its words scroll up under it, one for one
 * with the finger, until its projects fill the screen; they stack the way they do on a desktop, each with its own
 * text under its picture; then the next sheet slides up over it, leaving its band showing. A covered sheet's band
 * has a way back to it ("See again"). Every word stays: nothing is cut to make room.
 */
function holdPhone(root: HTMLElement, pin: HTMLElement, sheets: HTMLElement[]) {
  root.classList.add('phone');
  // one screen of scroll for each second of the timeline
  const unit = pin.clientHeight;
  const plans = sheets.map((sheet) => {
    const inner = sheet.querySelector<HTMLElement>('.svc-in')!;
    const title = sheet.querySelector<HTMLElement>('h3')!;
    const stack = sheet.querySelector<HTMLElement>('.pstack')!;
    const gap = parseFloat(getComputedStyle(stack).marginTop) || 0;
    const pad = getComputedStyle(inner);
    // the projects get the whole screen under the title
    const area = inner.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom) - title.offsetHeight - gap;
    sheet.style.setProperty('--area', `${Math.max(Math.round(area), 240)}px`);
    // and the words above them scroll up until the projects sit right under the title
    const shift = Math.max(stack.offsetTop - (title.offsetTop + title.offsetHeight + gap), 0);
    return {
      sheet, shift,
      words: [...inner.children].filter((el) => el !== title),
      cards: [...sheet.querySelectorAll<HTMLElement>('[data-pcard]')],
    };
  });

  const SLIDE = 0.8, CARD = 0.6, LAST = 0.3;
  const total = plans.reduce((t, p, i) => t + (i ? SLIDE : 0) + p.shift / unit + Math.max(p.cards.length - 1, 0) * CARD, 0) + LAST;
  // the stack is as tall as the scroll it plays over
  root.style.height = `${Math.round(unit * (1 + total))}px`;

  // when each sheet starts to come in, and when it is in (its words about to scroll)
  const comes: number[] = [];
  const opens: number[] = [];
  // a sheet the next one has covered shows the way back to it
  const cover = () => {
    const t = tl.time();
    plans.forEach((p, i) => p.sheet.classList.toggle('covered', i < plans.length - 1 && t >= comes[i + 1] + SLIDE * 0.6));
  };
  const tl = gsap.timeline({
    onUpdate: cover,
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.3, invalidateOnRefresh: true },
  });
  let at = 0;
  plans.forEach((p, i) => {
    comes.push(at);
    if (i > 0) {
      tl.fromTo(p.sheet, { y: () => pin.clientHeight }, { y: 0, ease: 'none', duration: SLIDE }, at);
      at += SLIDE;
    }
    opens.push(at);
    if (p.shift) {
      tl.to(p.words, { y: -p.shift, ease: 'none', duration: p.shift / unit }, at);
      at += p.shift / unit;
    }
    p.cards.forEach((card, j) => {
      if (!j) return;
      tl.fromTo(card, { y: () => pin.clientHeight }, { y: 0, ease: 'none', duration: CARD }, at);
      at += CARD;
    });
  });
  tl.to({}, { duration: LAST }, at);

  // "See again": back to the moment the sheet was in, its words about to scroll
  const again = (e: Event) => {
    const i = plans.findIndex((p) => p.sheet.contains(e.currentTarget as Node));
    const top = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.round(top + opens[i] * unit) + 1, behavior: 'smooth' });
  };
  const buttons = plans.map((p) => p.sheet.querySelector<HTMLButtonElement>('[data-again]'));
  buttons.forEach((b) => b?.addEventListener('click', again));

  return () => {
    root.classList.remove('phone');
    root.style.height = '';
    buttons.forEach((b) => b?.removeEventListener('click', again));
    sheets.forEach((s) => { s.style.removeProperty('--area'); s.classList.remove('covered'); });
  };
}

/** A sheet's project texts: one shows at a time, the hovered or focused project's, else the one on top. */
function projectTexts(sheet: HTMLElement) {
  const items = [...sheet.querySelectorAll<HTMLElement>('[data-blurb]')];
  if (!items.length) return null;
  const cards = [...sheet.querySelectorAll<HTMLElement>('[data-pcard]')];
  let onTop = 0;
  let pointed = -1;
  const render = () => {
    const i = pointed >= 0 ? pointed : onTop;
    items.forEach((b, k) => b.classList.toggle('on', k === i));
  };
  cards.forEach((card, i) => {
    if (i >= items.length) return;
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { pointed = i; render(); } });
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && pointed === i) { pointed = -1; render(); } });
    card.addEventListener('focusin', () => { pointed = i; render(); });
    card.addEventListener('focusout', () => { if (pointed === i) { pointed = -1; render(); } });
  });
  return (i: number) => {
    if (i === onTop) return;
    onTop = i;
    render();
  };
}

/** Loads a project's video when its card first comes near, and plays it only while it is in view. */
function watchVideos(root: HTMLElement) {
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video[data-src]')];
  if (!videos.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => { /* autoplay can be refused; the poster stays */ });
      } else {
        v.pause();
      }
    }
  }, { threshold: 0.35 });
  videos.forEach((v) => io.observe(v));
}
