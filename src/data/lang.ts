// The site's languages. Each one is a build of its own (`npm run build` makes all of them: English at /, the others
// under /el/ and /de/), so a build knows one language and the rest of the code simply reads `lang`. The words live in
// src/text/*.json as { en, el, de } and the build keeps only its own language of each (`localize` in astro.config.mjs),
// so no page carries the other languages' words.

export type Lang = 'en' | 'el' | 'de';
export type Copy = { en: string; el?: string; de?: string };

/** Every language the site is built in, with its name in itself: the language switch. */
export const LANGS: { code: Lang; name: string; locale: string }[] = [
  { code: 'en', name: 'EN', locale: 'en-GB' },
  { code: 'el', name: 'ΕΛ', locale: 'el-GR' },
  { code: 'de', name: 'DE', locale: 'de-CH' },
];

/** The language of this build. */
export const lang = (import.meta.env.PUBLIC_LANG || 'en') as Lang;

/** The copy in this build's language (the build has already picked it; English when a translation is missing). */
export const t = (c: Copy | string) => (typeof c === 'string' ? c : c[lang] || c.en);

/** Fills a phrase's {placeholders}. */
export const fill = (s: string, values: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (all, k) => (k in values ? String(values[k]) : all));

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** An address on the site, in this build's language: `to('/services')` is /el/services in the Greek build. */
export const to = (path: string) => (path.startsWith('/') ? base + path : path);

/** A page's address without its language: what stays the same from one language to another. */
export const unlocalized = (path: string) => (base && path.startsWith(base) ? path.slice(base.length) || '/' : path);

/** The same page in another language. */
export const inLang = (code: Lang, path: string) => (code === 'en' ? '' : `/${code}`) + path;

/** A date as this language writes it. */
export const day = (d: Date | string) => new Date(d).toLocaleDateString(LANGS.find((l) => l.code === lang)!.locale, { day: 'numeric', month: 'long', year: 'numeric' });

/** A phrase in capitals as this language writes them (Greek capitals lose their accents). CSS does this for what it
 *  uppercases, given the page's lang; a script drawing text on a canvas has to ask. */
export const upper = (s: string) => s.toLocaleUpperCase(lang);
