// "Έργα" and "Άρθρα": the Markdown files. The English file holds the entry; its translations are files of their own
// (<folder>/el/<id>.md, <folder>/de/<id>.md) with only the words.
import { fillIn, h, icon, slug, autosize } from './dom';
import { joinMd, parseFields, setField, splitMd, type Fields, type Value } from './frontmatter';
import { addUpload, exists, LANGS, md, removeMd, setMd, touched, type Lang } from './store';

const SERVICES: [string, string][] = [['web', 'Custom web & design'], ['apps', 'AI SaaS & web apps'], ['commerce', 'E-commerce & marketplaces'], ['search', 'AI search, marketing & ads']];

type Kind = 'projects' | 'blog';
const pathOf = (kind: Kind, id: string, lang: Lang = 'en') => `src/content/${kind}/${lang === 'en' ? '' : `${lang}/`}${id}.md`;
const idsOf = (kind: Kind) => [...md.keys()].map((p) => p.match(new RegExp(`^src/content/${kind}/([^/]+)\\.md$`))?.[1]).filter(Boolean) as string[];
const read = (path: string) => { const raw = md.get(path) ?? ''; const { head, body } = splitMd(raw); return { head, body, fields: parseFields(head) }; };

/** Writes one field or the body of an entry's file in a language; a translation with nothing in it is no file at all. */
function write(kind: Kind, id: string, lang: Lang, change: { field?: [string, Value]; body?: string }) {
  const path = pathOf(kind, id, lang);
  const { head, body } = read(path);
  const nextHead = change.field ? setField(head, change.field[0], change.field[1]) : head;
  const nextBody = change.body ?? body;
  if (lang !== 'en' && !nextHead.trim() && !nextBody.trim()) { removeMd(path); return; }
  setMd(path, joinMd(nextHead, nextBody));
}

/* -------------------------------------------------- small controls ------------------------------------------------- */
const uid = () => `e${Math.random().toString(36).slice(2, 9)}`;
function line(label: string, value: string, onInput: (v: string) => void, opts: { type?: string; hint?: string; area?: boolean; lang?: string } = {}) {
  const id = uid();
  // an address that isn't one would stop the site from building: it is taken once it is whole
  const bad = h('p', { class: 'a-bad a-hint', role: 'alert', hidden: true }, 'Γράψε ολόκληρη τη διεύθυνση, με https:// μπροστά. Μέχρι τότε δεν αποθηκεύεται.');
  const typed = (v: string) => {
    const wrong = opts.type === 'url' && v !== '' && !/^https?:\/\/[^\s.]+\.\S+$/.test(v);
    bad.hidden = !wrong;
    if (!wrong) onInput(v);
  };
  const input = opts.area
    ? h('textarea', { id, class: 'a-input', rows: 2, lang: opts.lang, value, oninput: (e: Event) => { const t = e.target as HTMLTextAreaElement; autosize(t); typed(t.value); } })
    : h('input', { id, class: 'a-input', type: opts.type ?? 'text', lang: opts.lang, value, oninput: (e: Event) => typed((e.target as HTMLInputElement).value) });
  return h('div', { class: 'a-field' }, h('label', { class: 'a-label', for: id }, label), input, bad, opts.hint && h('p', { class: 'a-hint' }, opts.hint));
}
const toList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
function check(label: string, on: boolean, onInput: (v: boolean) => void) {
  return h('label', { class: 'a-check' }, h('input', { type: 'checkbox', checked: on, onchange: (e: Event) => onInput((e.target as HTMLInputElement).checked) }), h('span', {}, label));
}

/** A little Markdown, for the preview: what these files use. Everything is escaped first. */
export function preview(src: string) {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) => s
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
  return esc.replace(/<!--[\s\S]*?-->/g, '').split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    const heading = b.match(/^(#{1,4})\s+(.*)$/);
    if (heading) return `<h${heading[1].length + 1}>${inline(heading[2])}</h${heading[1].length + 1}>`;
    if (/^[-*]\s/.test(b)) return `<ul>${b.split('\n').map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function bodyField(lang: Lang, value: string, onInput: (v: string) => void, label: string) {
  const id = uid();
  const shown = h('div', { class: 'a-prose', hidden: true });
  const area = h('textarea', { id, class: 'a-input a-input-body', rows: 14, lang, value, oninput: () => { autosize(area); onInput(area.value); } });
  requestAnimationFrame(() => autosize(area));
  const toggle = h('button', { type: 'button', class: 'a-btn a-btn-quiet', 'aria-pressed': 'false', onclick: () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    shown.innerHTML = preview(area.value);
    shown.hidden = !on;
    area.hidden = on;
  } }, 'Προεπισκόπηση');
  return h('div', { class: 'a-field' },
    h('div', { class: 'a-field-head' }, h('label', { class: 'a-label', for: id }, label), toggle),
    area, shown,
    h('p', { class: 'a-hint' }, 'Markdown: ## τίτλος, κενή γραμμή για νέα παράγραφο, [κείμενο](διεύθυνση) για σύνδεσμο.'));
}

function langTabs(draw: (lang: Lang) => HTMLElement | HTMLElement[], current: { lang: Lang }, status: (l: Lang) => boolean) {
  const panel = h('div', { class: 'a-tab-panel' });
  const tabs = h('div', { class: 'a-tabs', role: 'tablist' });
  const show = () => {
    fillIn(tabs, LANGS.map((l) => h('button', { type: 'button', role: 'tab', class: 'a-tab', 'aria-selected': String(l.code === current.lang), onclick: () => { current.lang = l.code; show(); } },
      l.long, l.code !== 'en' && !status(l.code) && h('span', { class: 'a-tab-note' }, 'λείπει'))));
    fillIn(panel, draw(current.lang));
  };
  show();
  return h('div', {}, tabs, panel);
}

/* ------------------------------------------------- turning a picture -------------------------------------------------- */
const readAsBase64 = (blob: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

/** A picture as a WebP this wide (and as tall as `crop`, from its top, if given). */
async function webp(file: File, width: number, crop?: number) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, width / bmp.width);
  const w = Math.round(bmp.width * scale), full = Math.round(bmp.height * scale);
  const c = document.createElement('canvas');
  c.width = crop ? width : w;
  c.height = crop ?? full;
  const k = crop ? width / bmp.width : scale;
  c.getContext('2d')!.drawImage(bmp, 0, 0, Math.round(bmp.width * k), Math.round(bmp.height * k));
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('webp'))), 'image/webp', 0.82));
  return { base64: await readAsBase64(blob), width: c.width, height: c.height, kb: Math.round(blob.size / 1024) };
}
export { readAsBase64, webp };

/* ---------------------------------------------------- the projects ---------------------------------------------------- */
const tabState = { lang: 'en' as Lang };

export function projectsView(main: HTMLElement, id?: string) {
  if (id) return projectForm(main, id);
  const list = idsOf('projects').map((pid) => ({ id: pid, ...read(pathOf('projects', pid)) }))
    .sort((a, b) => Number(a.fields.order ?? 0) - Number(b.fields.order ?? 0) || String(a.fields.title).localeCompare(String(b.fields.title)));
  fillIn(main,
    h('div', { class: 'a-toolbar' }, h('p', { class: 'a-muted a-grow' }, `${list.length} έργα. Κάθε ένα έχει τη σελίδα του στο /projects.`),
      h('button', { type: 'button', class: 'a-btn a-btn-main', onclick: () => {
        const title = prompt('Όνομα του έργου (με λατινικούς χαρακτήρες):');
        if (!title) return;
        const pid = slug(title);
        if (!pid || exists(pathOf('projects', pid)) || md.has(pathOf('projects', pid))) { alert('Υπάρχει ήδη έργο με αυτό το όνομα, ή το όνομα δεν έχει λατινικούς χαρακτήρες.'); return; }
        setMd(pathOf('projects', pid), joinMd(`title: ${JSON.stringify(title)}\nsummary: ""\nservices: []\norder: ${list.length + 1}\ndraft: true`, ''));
        location.hash = `#/projects/${pid}`;
      } }, icon('plus'), 'Νέο έργο')),
    h('div', { class: 'a-rows' }, list.map((p) => {
      const status = p.fields.draft ? 'Πρόχειρο' : p.fields.launching ? 'Έρχεται σύντομα' : p.fields.url ? 'Live' : 'Χωρίς σύνδεσμο';
      return h('a', { class: 'a-row', href: `#/projects/${p.id}` },
        h('span', { class: 'a-row-main' }, h('b', {}, String(p.fields.title ?? p.id)), h('span', { class: 'a-muted' }, String(p.fields.summary ?? ''))),
        h('span', { class: 'a-row-side' },
          h('span', { class: 'a-tag' }, status),
          (['el', 'de'] as const).map((l) => h('span', { class: md.has(pathOf('projects', p.id, l)) ? 'a-ok' : 'a-warn' }, md.has(pathOf('projects', p.id, l)) && icon('check'), l === 'el' ? 'ΕΛ' : 'DE'))));
    })));
}

function projectForm(main: HTMLElement, id: string) {
  if (!md.has(pathOf('projects', id))) { fillIn(main, h('p', { class: 'a-empty' }, 'Δεν υπάρχει αυτό το έργο.'), h('a', { class: 'a-back', href: '#/projects' }, 'Έργα')); return; }
  const f = () => read(pathOf('projects', id)).fields;
  const en = (field: string) => (v: Value) => write('projects', id, 'en', { field: [field, v] });
  const fields = f();
  const services = new Set((fields.services as string[]) ?? []);
  const picture = h('p', { class: 'a-hint' }, fields.cover ? `Τώρα: ${fields.cover}` : 'Χωρίς εικόνα: φαίνεται κάρτα με το όνομά του.');

  fillIn(main,
    h('div', { class: 'a-toolbar' }, h('a', { class: 'a-back', href: '#/projects' }, 'Έργα'), h('p', { class: 'a-grow' }),
      !fields.draft && h('a', { class: 'a-btn a-btn-quiet', href: `/projects/${id}/`, target: '_blank', rel: 'noopener' }, 'Στο site', icon('open'))),
    h('div', { class: 'a-two' },
      h('section', { class: 'a-block' }, h('h2', {}, 'Κείμενα'),
        langTabs((lang) => {
          const r = read(pathOf('projects', id, lang)).fields;
          const say = (field: string) => (v: Value) => write('projects', id, lang, { field: [field, v] });
          const rows: HTMLElement[] = [];
          rows.push(lang === 'en'
            ? line('Όνομα', String(r.title ?? ''), say('title') as (v: string) => void)
            : line('Όνομα σε αυτή τη γλώσσα', String(r.title ?? ''), say('title') as (v: string) => void, { lang, hint: 'Μόνο αν γράφεται αλλιώς, π.χ. με ελληνικά γράμματα. Αν μείνει κενό, φαίνεται όπως στα αγγλικά.' }));
          rows.push(
            line('Περίληψη', String(r.summary ?? ''), say('summary') as (v: string) => void, { area: true, lang, hint: 'Στην κάρτα του και στις αναζητήσεις.' }),
            line('Κείμενο στην αρχική', String(r.blurb ?? ''), say('blurb') as (v: string) => void, { area: true, lang, hint: 'Δίπλα στο έργο, στο φύλλο της υπηρεσίας του. Κενό: φαίνεται η περίληψη.' }),
            line('Ετικέτα δίπλα στο όνομα', String(r.badge ?? ''), say('badge') as (v: string) => void, { lang, hint: 'Π.χ. Private beta.' }),
            line('Κατηγορίες', ((r.tags as string[]) ?? []).join(', '), (v) => say('tags')(toList(v)), { lang, hint: 'Χωρισμένες με κόμμα.' }),
          );
          const metric = read(pathOf('projects', id)).fields.metric as Record<string, string> | undefined;
          if (metric) {
            rows.push(line('Αριθμός στην κάρτα: λεζάντα', String((r.metric as Record<string, string>)?.label ?? ''), (v) => say('metric')({ value: metric.value, label: v }), { lang }));
            rows.push(line('Τι κάλυψε', ((r.scope as string[]) ?? []).join(', '), (v) => say('scope')(toList(v)), { lang, hint: 'Χωρισμένα με κόμμα.' }));
          }
          rows.push(bodyField(lang, read(pathOf('projects', id, lang)).body, (v) => write('projects', id, lang, { body: v }), 'Η ιστορία του'));
          return rows;
        }, tabState, (l) => md.has(pathOf('projects', id, l)))),
      h('div', { class: 'a-side' },
        h('section', { class: 'a-block' }, h('h2', {}, 'Κατάσταση'),
          check('Πρόχειρο: δεν φαίνεται στο site', !!fields.draft, (v) => en('draft')(v ? true : undefined)),
          check('Δεν είναι ακόμα live («Launching soon»)', !!fields.launching, (v) => en('launching')(v ? true : undefined)),
          line('Σειρά', String(fields.order ?? 0), (v) => en('order')(Number(v) || 0), { type: 'number', hint: 'Το μικρότερο έρχεται πρώτο.' })),
        h('section', { class: 'a-block' }, h('h2', {}, 'Υπηρεσίες'),
          h('p', { class: 'a-hint' }, 'Κάτω από ποιες φαίνεται στην αρχική. Καμία: μόνο στο /projects.'),
          SERVICES.map(([k, name]) => check(name, services.has(k), (v) => { if (v) services.add(k); else services.delete(k); en('services')(SERVICES.map(([s]) => s).filter((s) => services.has(s))); }))),
        h('section', { class: 'a-block' }, h('h2', {}, 'Σύνδεσμοι'),
          line('Διεύθυνση του site', String(fields.url ?? ''), en('url') as (v: string) => void, { type: 'url' }),
          line('Ζωντανό στο frame', String(fields.live_url ?? ''), en('live_url') as (v: string) => void, { type: 'url', hint: 'Το ανοίγει μέσα στην κάρτα και το μετράει το PageSpeed. Κενό: φαίνεται η εικόνα. Το site πρέπει να επιτρέπει frames.' })),
        h('section', { class: 'a-block' }, h('h2', {}, 'Τεχνικά'),
          line('Φτιαγμένο με', ((fields.stack as string[]) ?? []).join(', '), (v) => en('stack')(toList(v)), { hint: 'Χωρισμένα με κόμμα.' })),
        h('section', { class: 'a-block' }, h('h2', {}, 'Εικόνα'),
          picture,
          h('label', { class: 'a-btn a-btn-quiet a-file' }, icon('upload'), 'Ανέβασμα εικόνας',
            h('input', { type: 'file', accept: 'image/*', onchange: async (e: Event) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              try {
                const big = await webp(file, 800);
                const thumb = await webp(file, 640, 400);
                addUpload(`public/projects/${id}.webp`, big.base64, 'εικόνα');
                addUpload(`public/projects/thumbs/${id}.webp`, thumb.base64, 'μικρογραφία');
                en('cover')(`/projects/${id}.webp`);
                picture.textContent = `Έτοιμη: ${big.width} × ${big.height}, ${big.kb} KB (και μικρογραφία). Ανεβαίνει με την αποθήκευση.`;
              } catch { picture.textContent = 'Δεν μπόρεσα να διαβάσω αυτή την εικόνα.'; }
            } })),
          h('p', { class: 'a-hint' }, 'Μια ψηλή καταγραφή του site. Γίνεται WebP 800px, και η κορυφή της μικρογραφία 640 × 400.')),
        h('section', { class: 'a-block' },
          h('button', { type: 'button', class: 'a-btn a-btn-danger', onclick: () => {
            if (!confirm(`Να σβηστεί το έργο «${fields.title}» σε όλες τις γλώσσες;`)) return;
            for (const l of LANGS) removeMd(pathOf('projects', id, l.code));
            location.hash = '#/projects';
          } }, 'Διαγραφή έργου')))));
}

/* ------------------------------------------------------ the posts ------------------------------------------------------ */
export function postsView(main: HTMLElement, id?: string) {
  if (id) return postForm(main, id);
  const list = idsOf('blog').map((pid) => ({ id: pid, ...read(pathOf('blog', pid)) })).sort((a, b) => String(b.fields.date).localeCompare(String(a.fields.date)));
  fillIn(main,
    h('div', { class: 'a-toolbar' }, h('p', { class: 'a-muted a-grow' }, list.length ? `${list.length} άρθρα.` : ''),
      h('button', { type: 'button', class: 'a-btn a-btn-main', onclick: () => {
        const title = prompt('Τίτλος του άρθρου (με λατινικούς χαρακτήρες, γίνεται και η διεύθυνσή του):');
        if (!title) return;
        const pid = slug(title);
        if (!pid || md.has(pathOf('blog', pid))) { alert('Υπάρχει ήδη άρθρο με αυτή τη διεύθυνση, ή ο τίτλος δεν έχει λατινικούς χαρακτήρες.'); return; }
        setMd(pathOf('blog', pid), joinMd(`title: ${JSON.stringify(title)}\ndescription: ""\ndate: ${new Date().toISOString().slice(0, 10)}\ndraft: true`, ''));
        location.hash = `#/posts/${pid}`;
      } }, icon('plus'), 'Νέο άρθρο')),
    list.length
      ? h('div', { class: 'a-rows' }, list.map((p) => h('a', { class: 'a-row', href: `#/posts/${p.id}` },
        h('span', { class: 'a-row-main' }, h('b', {}, String(p.fields.title ?? p.id)), h('span', { class: 'a-muted' }, String(p.fields.description ?? ''))),
        h('span', { class: 'a-row-side' }, h('span', { class: 'a-tag' }, p.fields.draft ? 'Πρόχειρο' : 'Δημοσιευμένο'), h('span', { class: 'a-muted' }, String(p.fields.date ?? ''))))))
      : h('p', { class: 'a-empty' }, 'Δεν υπάρχουν ακόμα άρθρα. Το πρώτο ξεκινά ως πρόχειρο και φαίνεται στο /blog μόλις το δημοσιεύσεις.'));
}

const postTab = { lang: 'en' as Lang };
function postForm(main: HTMLElement, id: string) {
  if (!md.has(pathOf('blog', id))) { fillIn(main, h('p', { class: 'a-empty' }, 'Δεν υπάρχει αυτό το άρθρο.'), h('a', { class: 'a-back', href: '#/posts' }, 'Άρθρα')); return; }
  const fields: Fields = read(pathOf('blog', id)).fields;
  fillIn(main,
    h('div', { class: 'a-toolbar' }, h('a', { class: 'a-back', href: '#/posts' }, 'Άρθρα'), h('p', { class: 'a-grow' }),
      !fields.draft && h('a', { class: 'a-btn a-btn-quiet', href: `/blog/${id}/`, target: '_blank', rel: 'noopener' }, 'Στο site', icon('open'))),
    h('div', { class: 'a-two' },
      h('section', { class: 'a-block' }, h('h2', {}, 'Κείμενο'),
        langTabs((lang) => {
          const r = read(pathOf('blog', id, lang)).fields;
          const say = (field: string) => (v: string) => write('blog', id, lang, { field: [field, v] });
          return [
            line('Τίτλος', String(r.title ?? ''), say('title'), { lang }),
            line('Περιγραφή', String(r.description ?? ''), say('description'), { area: true, lang, hint: 'Στη λίστα των άρθρων και στις αναζητήσεις.' }),
            bodyField(lang, read(pathOf('blog', id, lang)).body, (v) => write('blog', id, lang, { body: v }), 'Το άρθρο'),
          ];
        }, postTab, (l) => md.has(pathOf('blog', id, l)))),
      h('div', { class: 'a-side' },
        h('section', { class: 'a-block' }, h('h2', {}, 'Κατάσταση'),
          check('Πρόχειρο: δεν φαίνεται στο site', !!fields.draft, (v) => write('blog', id, 'en', { field: ['draft', v ? true : undefined] })),
          line('Ημερομηνία', String(fields.date ?? '').slice(0, 10), (v) => write('blog', id, 'en', { field: ['date', v] }), { type: 'date' })),
        h('section', { class: 'a-block' },
          h('button', { type: 'button', class: 'a-btn a-btn-danger', onclick: () => {
            if (!confirm(`Να σβηστεί το άρθρο «${fields.title}» σε όλες τις γλώσσες;`)) return;
            for (const l of LANGS) removeMd(pathOf('blog', id, l.code));
            location.hash = '#/posts';
          } }, 'Διαγραφή άρθρου')))));
  void touched;
}
