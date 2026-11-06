// "Κείμενα σελίδων" and "Μεταφράσεις": the word files, by page, and by what is still missing.
import { fillIn, h, icon } from './dom';
import { copyField, languagePicker, shown, valueField } from './fields';
import { isCopy, LANGS, md, text, TEXT_FILES, type Copy, type Lang, type TextName } from './store';

type Part = [TextName, string];
export const SECTIONS: { id: string; title: string; note: string; href?: string; parts: Part[] }[] = [
  { id: 'home', title: 'Αρχική', note: 'Η πρώτη οθόνη, η κορδέλα και οι λέξεις γύρω από τις υπηρεσίες.', href: '/', parts: [['site', 'hero'], ['site', 'marquee'], ['site', 'words.home'], ['site', 'ui.work'], ['site', 'ui.live'], ['site', 'ui.visitSite'], ['site', 'ui.readStory'], ['site', 'ui.launching']] },
  { id: 'services-home', title: 'Υπηρεσίες στην αρχική', note: 'Τα τέσσερα φύλλα της αρχικής, και οι AI υπηρεσίες που φαίνονται μόνο στο llms.txt.', href: '/', parts: [['site', 'services'], ['site', 'bots']] },
  { id: 'stories', title: 'Ιστορίες υπηρεσιών', note: 'Το «Read more» κάθε υπηρεσίας: οι σκηνές με τα σχέδια.', href: '/#story-web', parts: [['stories', 'stories'], ['site', 'ui.stories']] },
  { id: 'services', title: 'Σελίδα Υπηρεσίες', note: 'Όλο το /services: υπηρεσίες, τιμές, ερωτήσεις, φόρμα.', href: '/services', parts: [['services-page', 'servicesPage']] },
  { id: 'about', title: 'Σχετικά με εμένα', note: 'Το πάνω μέρος του /about, οι αριθμοί και το GitHub.', href: '/about', parts: [['site', 'words.about'], ['my-story', 'aboutIntro'], ['site', 'stats'], ['site', 'words.terrain']] },
  { id: 'story', title: 'Η ιστορία μου', note: 'Οι σκηνές του /about και οι λέξεις μέσα στα σχέδιά τους.', href: '/about', parts: [['my-story', 'scenes'], ['my-story', 'art']] },
  { id: 'projects-page', title: 'Σελίδα Έργα', note: 'Οι λέξεις γύρω από τα έργα (τα ίδια τα έργα είναι στην ενότητα «Έργα»).', href: '/projects', parts: [['site', 'ui.projectsPage'], ['site', 'words.projects'], ['site', 'ui.moreWork']] },
  { id: 'contact', title: 'Επικοινωνία και φόρμα', note: 'Το /contact, η φόρμα του και το κάτω μέρος κάθε σελίδας.', href: '/contact', parts: [['site', 'words.contact'], ['site', 'words.form'], ['site', 'brief.needs'], ['site', 'words.footer'], ['site', 'ui.footerLine']] },
  { id: 'blog', title: 'Σελίδα Blog', note: 'Οι λέξεις γύρω από τα άρθρα.', href: '/blog', parts: [['site', 'words.blog']] },
  { id: 'general', title: 'Γενικά', note: 'Μενού, σύνθημα, το intro, και η περιγραφή για αναζήτηση και κοινοποίηση.', parts: [['site', 'pages'], ['site', 'words.nav'], ['site', 'brand'], ['site', 'intro'], ['site', 'meta']] },
];

const at = (root: any, path: string) => {
  const keys = path.split('.');
  const parent = keys.slice(0, -1).reduce((o, k) => o?.[k], root);
  return { parent, key: keys[keys.length - 1] };
};

export function textView(main: HTMLElement, sectionId?: string) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) {
    fillIn(main, h('div', { class: 'a-rows' }, SECTIONS.map((s) => h('a', { class: 'a-row', href: `#/text/${s.id}` },
      h('span', { class: 'a-row-main' }, h('b', {}, s.title), h('span', { class: 'a-muted' }, s.note)),
      h('span', { class: 'a-row-side' }, missingIn(s.parts))))));
    return;
  }
  const draw = () => {
    fillIn(main,
      h('div', { class: 'a-toolbar' },
        h('a', { class: 'a-back', href: '#/text' }, 'Κείμενα σελίδων'),
        h('p', { class: 'a-muted a-grow' }, section.note),
        section.href && h('a', { class: 'a-btn a-btn-quiet', href: section.href, target: '_blank', rel: 'noopener' }, 'Στο site', icon('open')),
        languagePicker(draw)),
      section.parts.map(([file, path]) => {
        const { parent, key } = at(text[file], path);
        return valueField(parent, key, path);
      }));
  };
  draw();
}

/* ------------------------------------------------- every word, flat ------------------------------------------------ */
export type Word = { copy: Copy; path: string; file: TextName };

export const allWords = (): Word[] => {
  const out: Word[] = [];
  const walk = (v: unknown, path: string, file: TextName) => {
    if (isCopy(v)) { if (v.en.trim()) out.push({ copy: v, path, file }); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, file));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, file);
  };
  for (const file of Object.keys(TEXT_FILES) as TextName[]) walk(text[file], '', file);
  return out;
};

export const missing = (w: Word, l: Lang) => !w.copy[l];

/** How many words are written in a language, of how many. */
export const progress = (l: Lang) => { const all = allWords(); return { done: all.filter((w) => !missing(w, l)).length, of: all.length }; };

function missingIn(parts: Part[]) {
  const words = allWords().filter((w) => parts.some(([f, p]) => w.file === f && (w.path === p || w.path.startsWith(`${p}.`) || w.path.startsWith(`${p}[`))));
  const list = LANGS.filter((l) => l.code !== 'en').map((l) => [l.name, words.filter((w) => missing(w, l.code)).length] as const).filter(([, n]) => n);
  if (!list.length) return h('span', { class: 'a-ok' }, icon('check'), 'μεταφρασμένα');
  return h('span', { class: 'a-warn' }, list.map(([n, c]) => `${n}: λείπουν ${c}`).join(' · '));
}

/** The project and post translations: which exist. */
export const mdTranslations = () => {
  const out: { kind: 'projects' | 'blog'; id: string; has: Record<'el' | 'de', boolean> }[] = [];
  for (const path of md.keys()) {
    const m = path.match(/^src\/content\/(projects|blog)\/([^/]+)\.md$/);
    if (m) out.push({ kind: m[1] as 'projects' | 'blog', id: m[2], has: { el: md.has(`src/content/${m[1]}/el/${m[2]}.md`), de: md.has(`src/content/${m[1]}/de/${m[2]}.md`) } });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
};

const PAGE = 40;
const FILE_NAMES: Record<TextName, string> = { site: 'Κείμενα site', stories: 'Ιστορίες υπηρεσιών', 'services-page': 'Σελίδα Υπηρεσίες', 'my-story': 'Η ιστορία μου' };
const state = { only: 'missing' as 'missing' | 'all', lang: 'el' as 'el' | 'de', file: '' as '' | TextName, search: '', shown: PAGE };

export function translationsView(main: HTMLElement) {
  const results = h('div', { class: 'a-tr-rows' });
  const count = h('p', { class: 'a-muted', 'aria-live': 'polite' });
  const list = () => {
    const q = state.search.trim().toLowerCase();
    const words = allWords().filter((w) => (!state.file || w.file === state.file)
      && (state.only === 'all' || missing(w, state.lang))
      && (!q || [w.copy.en, w.copy.el, w.copy.de, w.path].some((s) => s?.toLowerCase().includes(q))));
    count.textContent = words.length === 1 ? '1 κείμενο' : `${words.length} κείμενα`;
    fillIn(results,
      !words.length && h('p', { class: 'a-empty' }, state.only === 'missing' ? `Δεν λείπει τίποτα στα ${state.lang === 'el' ? 'ελληνικά' : 'γερμανικά'}.` : 'Δεν βρέθηκε κείμενο.'),
      words.slice(0, state.shown).map((w) => h('div', { class: 'a-tr-row' },
        h('p', { class: 'a-path' }, `${FILE_NAMES[w.file]} · ${w.path}`),
        copyField(w.copy))),
      words.length > state.shown && h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: () => { state.shown += PAGE; list(); } }, `Άλλα ${Math.min(PAGE, words.length - state.shown)} από ${words.length - state.shown}`));
  };
  const chooser = (label: string, value: string, options: [string, string][], set: (v: string) => void) => {
    const id = `s${label.length}`;
    return h('div', { class: 'a-field a-field-inline' }, h('label', { class: 'a-label', for: id }, label),
      h('select', { id, class: 'a-input', onchange: (e: Event) => { set((e.target as HTMLSelectElement).value); state.shown = PAGE; list(); } },
        options.map(([v, n]) => h('option', { value: v, selected: v === value }, n))));
  };
  const redraw = () => list();

  fillIn(main,
    h('div', { class: 'a-kpis' }, LANGS.filter((l) => l.code !== 'en').map((l) => {
      const p = progress(l.code);
      return h('div', { class: 'a-kpi' }, h('span', { class: 'a-muted' }, l.long), h('b', {}, `${Math.floor((p.done / (p.of || 1)) * 100)}%`), h('span', { class: 'a-muted' }, `${p.done} από ${p.of} κείμενα`));
    })),
    h('div', { class: 'a-toolbar a-toolbar-wrap' },
      chooser('Γλώσσα', state.lang, [['el', 'Ελληνικά'], ['de', 'Deutsch']], (v) => { state.lang = v as 'el' | 'de'; }),
      chooser('Δείξε', state.only, [['missing', 'Όσα λείπουν'], ['all', 'Όλα']], (v) => { state.only = v as 'missing' | 'all'; }),
      chooser('Πού', state.file, [['', 'Παντού'], ...(Object.keys(FILE_NAMES) as TextName[]).map((k) => [k, FILE_NAMES[k]] as [string, string])], (v) => { state.file = v as '' | TextName; }),
      h('div', { class: 'a-field a-field-inline a-grow' }, h('label', { class: 'a-label', for: 'tr-search' }, 'Αναζήτηση'),
        h('input', { id: 'tr-search', class: 'a-input', type: 'search', value: state.search, oninput: (e: Event) => { state.search = (e.target as HTMLInputElement).value; state.shown = PAGE; list(); } })),
      languagePicker(redraw)),
    count,
    results,
    h('section', { class: 'a-block' },
      h('h2', {}, 'Έργα και άρθρα'),
      h('p', { class: 'a-muted' }, 'Το κείμενό τους μεταφράζεται μέσα σε κάθε έργο ή άρθρο.'),
      h('div', { class: 'a-rows' }, mdTranslations().map((t) => h('a', { class: 'a-row', href: `#/${t.kind === 'projects' ? 'projects' : 'posts'}/${t.id}` },
        h('span', { class: 'a-row-main' }, h('b', {}, t.id)),
        h('span', { class: 'a-row-side' }, (['el', 'de'] as const).map((l) => h('span', { class: t.has[l] ? 'a-ok' : 'a-warn' }, t.has[l] && icon('check'), l === 'el' ? 'ΕΛ' : 'DE'))))))));
  list();
  void shown;
}
