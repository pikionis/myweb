// The fields of the word files: a word in three languages side by side, and everything around it (groups, lists).
import { autosize, fillIn, h, icon } from './dom';
import { isCopy, LANGS, touched, type Copy, type Lang } from './store';

/** Which languages are on screen, for the whole panel. */
const SHOWN = 'ohl-admin-langs';
export const shown = {
  get(): Lang[] {
    try { const v = JSON.parse(localStorage.getItem(SHOWN) || 'null'); if (Array.isArray(v) && v.length) return v; } catch { /* the default */ }
    return ['en', 'el', 'de'];
  },
  set(v: Lang[]) { try { localStorage.setItem(SHOWN, JSON.stringify(v)); } catch { /* for this screen only */ } },
};

/** The toggle over a screen of words: which languages to show side by side. */
export function languagePicker(onChange: () => void) {
  const now = shown.get();
  return h('fieldset', { class: 'a-seg' },
    h('legend', { class: 'a-sr' }, 'Γλώσσες στην οθόνη'),
    LANGS.map((l) => {
      const input = h('input', { type: 'checkbox', checked: now.includes(l.code), onchange: () => {
        const on = LANGS.filter((x) => (x.code === l.code ? input.checked : shown.get().includes(x.code))).map((x) => x.code);
        if (!on.length) { input.checked = true; return; }
        shown.set(on);
        onChange();
      } });
      return h('label', { class: 'a-seg-opt', title: l.long }, input, h('span', {}, l.name));
    }),
  );
}

const typed = (t: HTMLTextAreaElement) => { autosize(t); };

/** One word in the languages on screen. `onEmpty` lets a value turn back into nothing (a price not set). */
export function copyField(copy: Copy, label?: string, opts: { onEdit?: () => void } = {}) {
  const on = shown.get();
  const box = h('div', { class: `a-copy a-copy-${on.length}` });
  const areas = new Map<Lang, HTMLTextAreaElement>();
  for (const l of LANGS) {
    if (!on.includes(l.code)) continue;
    const id = `f${Math.random().toString(36).slice(2, 9)}`;
    const area = h('textarea', {
      id, rows: 1, lang: l.code, spellcheck: 'true', value: copy[l.code] ?? '',
      class: l.code !== 'en' && !copy[l.code] && copy.en ? 'a-missing' : undefined,
      placeholder: l.code === 'en' ? '' : 'Δεν έχει μεταφραστεί: θα φαίνονται τα αγγλικά',
      oninput: () => {
        if (area.value || l.code === 'en') copy[l.code] = area.value;
        else delete copy[l.code];
        typed(area);
        areas.forEach((a, code) => a.classList.toggle('a-missing', code !== 'en' && !a.value && !!copy.en));
        // the English changed: the translations beside it may no longer say the same
        if (l.code === 'en') box.classList.toggle('a-en-changed', LANGS.some((x) => x.code !== 'en' && copy[x.code]));
        opts.onEdit?.();
        touched();
      },
    });
    areas.set(l.code, area);
    box.append(h('div', { class: 'a-copy-col' }, h('label', { class: 'a-copy-lang', for: id }, l.name), area));
    requestAnimationFrame(() => autosize(area));
  }
  box.append(h('p', { class: 'a-copy-note' }, 'Άλλαξαν τα αγγλικά: δες αν λένε το ίδιο και οι μεταφράσεις.'));
  return label ? h('div', { class: 'a-field' }, h('p', { class: 'a-label' }, label), box) : box;
}

// the field names as the panel says them; anything else shows its own name
const NAMES: Record<string, string> = {
  title: 'Τίτλος', short: 'Σύντομο όνομα', lead: 'Πρώτη γραμμή', body: 'Παράγραφοι', chips: 'Ετικέτες', claim: 'Βασική φράση', summary: 'Περίληψη',
  includes: 'Τι περιλαμβάνει', text: 'Κείμενο', cta: 'Κουμπί', note: 'Σημείωση', meta: 'Αναζήτηση και κοινοποίηση', description: 'Περιγραφή', imageAlt: 'Περιγραφή εικόνας',
  name: 'Όνομα', role: 'Ιδιότητα', location: 'Τοποθεσία', motto: 'Σύνθημα', homeLabel: 'Ετικέτα συνδέσμου αρχικής', words: 'Λέξεις', tail: 'Κατάληξη', skip: 'Παράλειψη',
  curtain: 'Τίτλος στην αυλαία', curtainAccent: 'Τονισμένη λέξη', headline: 'Τίτλος', palette: 'Περιγραφή', paletteKeywords: 'Λέξεις που τονίζονται', intro: 'Εισαγωγή',
  corners: 'Γωνίες', top: 'Πάνω', bold: 'Έντονο', bio: 'Σύνδεσμος βιογραφικού', areas: 'Τι δουλεύω', label: 'Ετικέτα', items: 'Στοιχεία', link: 'Σύνδεσμος', proof: 'Απόδειξη',
  need: 'Ανάγκη', needs: 'Επιλογές «Τι χρειάζεσαι»', q: 'Ερώτηση', a: 'Απάντηση', promise: 'Υπόσχεση', bullets: 'Κουκκίδες', chipsLabel: 'Τίτλος ετικετών', line: 'Γραμμή',
  timeline: 'Χρόνος', then: 'Μετά', startingFrom: 'Τιμή από', scenes: 'Σκηνές', rail: 'Όνομα στη γραμμή χρόνου', sections: 'Ενότητες', steps: 'Βήματα', budgets: 'Εύρη budget',
  hero: 'Πρώτη οθόνη', picker: '«Πού βρίσκεσαι»', how: 'Πώς δουλεύουμε', prices: 'Χρόνοι και τιμές', faq: 'Ερωτήσεις', form: 'Φόρμα', art: 'Λέξεις μέσα στα σχέδια',
};
export const nameOf = (key: string) => NAMES[key] ?? key;

// which lists can grow and shrink: the others have as many items as their design holds
const GROWS = /(^|\.)(body|chips|includes|items\b|bullets|marquee|budgets|needs|scenes|stats|areas|proof\.items)(\[|\.|$)/;
const LEAF_SKIP = new Set(['key', 'id', 'service', 'art', 'pos', 'tone', 'fill', 'image', 'icon', 'box', 'href', 'project']);

const describe = (v: any): string => {
  if (isCopy(v)) return v.en;
  if (v && typeof v === 'object') {
    for (const k of ['title', 'short', 'q', 'name', 'label', 'text', 'rail']) if (v[k]) return describe(v[k]);
    for (const k of ['id', 'key']) if (typeof v[k] === 'string') return v[k];
  }
  return typeof v === 'string' ? v : '';
};

const blankLike = (item: any): any => {
  if (isCopy(item)) return { en: '' };
  if (Array.isArray(item)) return [];
  if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([k, v]) => [k, blankLike(v)]));
  return typeof item === 'number' ? 0 : typeof item === 'string' ? '' : item;
};

const worth = (v: unknown): boolean => {
  if (isCopy(v)) return true;
  if (Array.isArray(v)) return v.some(worth);
  if (v && typeof v === 'object') return Object.values(v).some(worth);
  return false;
};

/** A value of a word file, whatever it holds. `path` says where it is, for what can grow. */
export function valueField(parent: any, key: string | number, path: string, depth = 0): HTMLElement | null {
  const v = parent[key];
  const name = typeof key === 'number' ? '' : nameOf(key);

  // a price not set yet is nothing, and becomes a word once it is typed
  if (key === 'startingFrom') return priceField(parent);

  if (typeof v === 'number' && (key === 'value')) {
    const id = `n${Math.random().toString(36).slice(2, 9)}`;
    return h('div', { class: 'a-field' }, h('label', { class: 'a-label', for: id }, 'Αριθμός'),
      h('input', { id, type: 'number', class: 'a-input a-input-num', value: v, oninput: (e: Event) => { parent[key] = Number((e.target as HTMLInputElement).value); touched(); } }));
  }
  if (isCopy(v)) return copyField(v, name || undefined);
  if (typeof v !== 'object' || v === null) return null;
  if (typeof key === 'string' && LEAF_SKIP.has(key)) return null;

  if (Array.isArray(v)) {
    const grows = GROWS.test(path);
    if (!worth(v) && !grows) return null;
    const simple = v.every(isCopy);
    const list = h('div', { class: simple ? 'a-list a-list-simple' : 'a-list' });
    const draw = () => {
      fillIn(list, v.map((item, i) => {
        const inner = valueField(v, i, `${path}[${i}]`, depth + 1);
        if (!inner) return null;
        const tools = grows ? itemTools(v, i, draw) : null;
        if (simple) return h('div', { class: 'a-item' }, inner, tools);
        return h('details', { class: 'a-group', open: v.length <= 1 }, h('summary', {}, h('span', { class: 'a-group-name' }, describe(item) || `#${i + 1}`), tools), h('div', { class: 'a-group-body' }, inner));
      }));
      if (grows) list.append(h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: () => { v.push(v.length ? blankLike(v[0]) : { en: '' }); touched(); draw(); } }, icon('plus'), 'Προσθήκη'));
    };
    draw();
    return name ? h('div', { class: 'a-field' }, h('p', { class: 'a-label' }, name), list) : list;
  }

  const inner = Object.keys(v).map((k) => valueField(v, k, path ? `${path}.${k}` : k, depth + 1)).filter(Boolean) as HTMLElement[];
  if (!inner.length) return null;
  if (typeof key === 'number') return h('div', { class: 'a-group-fields' }, inner);
  return depth === 0
    ? h('section', { class: 'a-block' }, h('h2', {}, name), inner)
    : h('details', { class: 'a-group' }, h('summary', {}, h('span', { class: 'a-group-name' }, name)), h('div', { class: 'a-group-body' }, inner));
}

function itemTools(list: any[], i: number, redraw: () => void) {
  const stop = (fn: () => void) => (e: Event) => { e.preventDefault(); e.stopPropagation(); fn(); touched(); redraw(); };
  return h('span', { class: 'a-item-tools' },
    h('button', { type: 'button', class: 'a-icon-btn', 'aria-label': 'Πάνω', disabled: i === 0, onclick: stop(() => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; }) }, icon('up')),
    h('button', { type: 'button', class: 'a-icon-btn', 'aria-label': 'Κάτω', disabled: i === list.length - 1, onclick: stop(() => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; }) }, icon('down')),
    h('button', { type: 'button', class: 'a-icon-btn', 'aria-label': 'Αφαίρεση', onclick: stop(() => { list.splice(i, 1); }) }, icon('close')),
  );
}

function priceField(parent: any) {
  const copy: Copy = parent.startingFrom ?? { en: '' };
  return copyField(copy, `${nameOf('startingFrom')} (κενό: δεν φαίνεται τιμή)`, {
    onEdit: () => { parent.startingFrom = copy.en || copy.el || copy.de ? copy : null; },
  });
}

/** A plain setting: an address, a phone. */
export function plainField(obj: any, key: string, label: string, opts: { type?: string; hint?: string; onEdit?: () => void } = {}) {
  const id = `p${Math.random().toString(36).slice(2, 9)}`;
  return h('div', { class: 'a-field' },
    h('label', { class: 'a-label', for: id }, label),
    h('input', { id, class: 'a-input', type: opts.type ?? 'text', value: obj[key] ?? '', oninput: (e: Event) => { obj[key] = (e.target as HTMLInputElement).value; opts.onEdit?.(); touched(); } }),
    opts.hint && h('p', { class: 'a-hint' }, opts.hint));
}
