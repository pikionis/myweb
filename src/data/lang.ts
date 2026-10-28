// The site's language. Words that exist in more than one language (My story, the /services page) are `Copy`:
// English and Greek now, German later; `t` gives the one the site shows. Changing `lang` switches them all.

export type Lang = 'en' | 'el' | 'de';
export type Copy = { en: string; el: string; de?: string };
/** The language the site shows now. */
export const lang = 'en' as Lang;
/** The copy in the site's language (English when a translation is missing). */
export const t = (c: Copy) => c[lang] ?? c.en;
