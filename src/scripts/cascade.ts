/**
 * Letter cascade: on hover each letter tips back and out while its echo flips up from below, in a
 * wave from the first letter to the last.
 *
 * Ported from Componentry "Letter Cascade" by Harsh Jadhav (MIT) — https://componentry.fun.
 * framer-motion's spring is sampled into a CSS linear() easing and played with the Web Animations API.
 */

const STAGGER = 0.04;

/** Samples a spring's step response so CSS can play it (stiffness 220, damping 16, as the original). */
function springEasing(stiffness = 220, damping = 16) {
  const dt = 1 / 120;
  let x = 0, v = 0;
  const pts: number[] = [];
  for (let t = 0; t < 2; t += dt) {
    v += (stiffness * (1 - x) - damping * v) * dt;
    x += v * dt;
    pts.push(x);
    if (t > 0.3 && Math.abs(1 - x) < 0.002 && Math.abs(v) < 0.02) break;
  }
  const step = Math.max(1, Math.floor(pts.length / 40));
  const list = pts.filter((_, i) => i % step === 0).map((p) => p.toFixed(3));
  const supported = typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)');
  return {
    easing: supported ? `linear(0, ${list.join(', ')}, 1)` : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    duration: pts.length * dt * 1000,
  };
}

let spring: ReturnType<typeof springEasing> | null = null;

/** Splits `el` into letters (words stay unbreakable) and plays the cascade when `trigger` is hovered. */
export function letterCascade(el: HTMLElement, trigger: HTMLElement = el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  spring ??= springEasing();
  const text = (el.textContent || '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const fronts: HTMLElement[] = [];
  const echoes: HTMLElement[] = [];
  text.split(/\s+/).forEach((word, wi, words) => {
    const w = document.createElement('span');
    w.className = 'lc-word';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const cell = document.createElement('span');
      cell.className = 'lc-cell';
      const front = document.createElement('span');
      front.className = 'lc-front';
      front.textContent = ch;
      const echo = document.createElement('span');
      echo.className = 'lc-echo';
      echo.textContent = ch;
      cell.append(front, echo);
      w.append(cell);
      fronts.push(front);
      echoes.push(echo);
    }
    el.append(w);
    if (wi < words.length - 1) el.append(' ');
  });

  let running = false;
  const play = () => {
    if (running || !spring) return;
    running = true;
    const { easing, duration } = spring;
    let left = fronts.length;
    fronts.forEach((front, i) => {
      const delay = i * STAGGER * 1000;
      // the letter tips back and away...
      const out = front.animate(
        [{ transform: 'translateY(0) rotateX(0deg)', opacity: 1, filter: 'blur(0px)' },
         { transform: 'translateY(-6px) rotateX(90deg)', opacity: 0, filter: 'blur(4px)' }],
        { duration, delay, easing, fill: 'forwards' },
      );
      // ...while its echo flips up from below into its place
      const up = echoes[i].animate(
        [{ transform: 'translateY(6px) scale(0.8) rotateX(-90deg)', opacity: 0, filter: 'blur(4px)' },
         { transform: 'translateY(0) scale(1) rotateX(0deg)', opacity: 1, filter: 'blur(0px)' }],
        { duration, delay, easing, fill: 'forwards' },
      );
      out.onfinish = () => out.cancel();
      up.onfinish = () => {
        up.cancel();
        if (--left === 0) running = false;
      };
    });
  };
  trigger.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') play(); });
}
