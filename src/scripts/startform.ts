import { post } from './brief';
import { artTimeline } from './serviceart';

/*
 * The closing form on /services (src/components/StartForm.astro). A service's call ("Start my website",
 * a[data-need]) and /services?service=<key> pre-select what you need; sending goes through `post` (the same as
 * the brief form on /contact), and a sent form gives way to a drawn tick and "Got it. Talk soon."
 */
export function startForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-start-form]');
  const done = root.querySelector<HTMLElement>('[data-done]');
  const error = root.querySelector<HTMLElement>('[data-error]');
  const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !done || !error || !button) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pick = (key: string | null) => {
    const input = key && form.querySelector<HTMLInputElement>(`input[name="need"][data-key="${CSS.escape(key)}"]`);
    if (input) input.checked = true;
  };
  pick(new URLSearchParams(location.search).get('service'));
  document.querySelectorAll<HTMLAnchorElement>('a[data-need]').forEach((a) => a.addEventListener('click', () => pick(a.dataset.need ?? null)));
  // every way to the form ("Tell me your idea", a service's call, "Ask me something else") lands ready to type, where
  // there is a keyboard to type with (on a touch screen a field taking focus would cover the form with the keyboard)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll<HTMLAnchorElement>('a[href="#start"]').forEach((a) => a.addEventListener('click', () => {
      window.setTimeout(() => form.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true }), reduce ? 0 : 800);
    }));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (button.disabled) return;
    error.hidden = true;
    button.disabled = true;
    button.textContent = button.dataset.busy ?? '';
    post(form, new FormData(form)).then(() => {
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      const check = done.querySelector<SVGSVGElement>('[data-check] svg');
      if (check && !reduce) artTimeline(check)?.play();
    }, () => {
      error.hidden = false;
    }).finally(() => {
      button.disabled = false;
      button.textContent = button.dataset.label ?? '';
    });
  });

  done.querySelector('[data-again]')?.addEventListener('click', () => {
    form.reset();
    pick(new URLSearchParams(location.search).get('service'));
    done.hidden = true;
    form.hidden = false;
    form.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  });
}
