// A small hand for building the panel's screens: no library, every word and element in plain sight.

type Kid = Node | string | number | false | null | undefined | Kid[];
type Attrs = Record<string, unknown> | null | undefined;

const place = (el: Element, kids: Kid[]) => {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) place(el, k);
    else el.append(k instanceof Node ? k : String(k));
  }
};

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  place(el, kids);
  return el;
}

/** Replaces what an element holds. */
export const fillIn = (el: Element, ...kids: Kid[]) => { el.replaceChildren(); place(el, kids); return el; };

const P = (d: string) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/>',
  text: '<path d="M5 6h14M5 12h14M5 18h9"/>',
  work: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/>',
  post: '<path d="M7 4h8l4 4v12H7z"/><path d="M15 4v4h4M10 13h6M10 16.500h6"/>',
  lang: '<path d="M4 6h9M8.500 4v2M6 6c.5 3.500 3 6 6 7.500M11 6c-.5 3.500-3 6-6 7.500"/><path d="m12.500 20 3.750-9 3.750 9M14 17h4.500"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/>',
  out: '<path d="M14 5h5v14h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  open: '<path d="M8 16 18 6M10 6h8v8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  warn: '<path d="M12 4 3 20h18z"/><path d="M12 10v5M12 17.500v.5"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 19h14"/>',
  mail: '<rect x="3.500" y="6" width="17" height="12" rx="2"/><path d="m4 8 8 5.500L20 8"/>',
} as const;

export const icon = (name: keyof typeof ICONS) => {
  const span = document.createElement('span');
  span.className = 'a-ico';
  span.innerHTML = P(ICONS[name]);
  return span;
};

/** "πριν από 3 λεπτά". */
export const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const in_ = (n: number, one: string, many: string) => `πριν από ${n} ${n === 1 ? one : many}`;
  if (s < 60) return 'μόλις τώρα';
  if (s < 3600) return in_(Math.round(s / 60), 'λεπτό', 'λεπτά');
  if (s < 86400) return in_(Math.round(s / 3600), 'ώρα', 'ώρες');
  if (s < 86400 * 45) return in_(Math.round(s / 86400), 'μέρα', 'μέρες');
  return new Date(iso).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** A textarea grows with what it holds (where the browser can't do it by itself: `field-sizing` in admin.css). */
export const autosize = (t: HTMLTextAreaElement) => {
  if (CSS.supports('field-sizing', 'content')) return;
  t.style.height = 'auto';
  t.style.height = `${t.scrollHeight + 2}px`;
};

/** A short word that passes for an address: "Sunny Days!" is sunny-days. */
export const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
