// "Επισκόπηση" and "Ρυθμίσεις".
import { ago, fillIn, h, icon } from './dom';
import { copyField, plainField } from './fields';
import { deploys, deployNow, GitHubError, key, recentCommits, REPO, whoAmI, type Run } from './github';
import { addUpload, LANGS, md, text, touched } from './store';
import { progress } from './views-text';
import { readAsBase64, webp } from './views-entries';

const say = (run: Run) => {
  if (run.status !== 'completed') return { word: 'Δημοσιεύεται τώρα', cls: 'a-busy' };
  if (run.conclusion === 'success') return { word: 'Είναι live', cls: 'a-ok' };
  return { word: 'Απέτυχε η δημοσίευση', cls: 'a-bad' };
};

// /projects shows a project's numbers only while all of them are green (the same rule as green() in ProjectsHub.astro)
type Result = { scores: Record<string, number>; lab: Record<string, { v: number; s: number }>; field?: Record<string, { category?: string } | boolean>; at: string };
const lows = (r?: Result) => {
  if (!r) return ['δεν μετρήθηκε'];
  const out = Object.entries(r.scores).filter(([, n]) => n < 90).map(([k, n]) => `${k} ${n}`);
  for (const k of ['lcp', 'fcp', 'tbt', 'cls']) if (!(r.lab[k]?.s >= 0.9)) out.push(k.toUpperCase());
  for (const [k, m] of Object.entries(r.field ?? {})) if (typeof m === 'object' && m.category && m.category !== 'FAST') out.push(`πραγματικοί επισκέπτες ${k.toUpperCase()}`);
  return out;
};

/** What is still waiting for you, read from the content itself. */
function waiting() {
  const list: { text: string; href: string }[] = [];
  const page = text['services-page'].servicesPage;
  const noPrice = page.sections.filter((s: { startingFrom: unknown }) => !s.startingFrom).length;
  if (noPrice) list.push({ text: `${noPrice === 1 ? '1 υπηρεσία δεν έχει' : `${noPrice} υπηρεσίες δεν έχουν`} τιμή: όσο λείπει, δεν φαίνεται`, href: '#/text/services' });
  if (!page.form?.budgets?.length) list.push({ text: 'Η φόρμα δεν ρωτά για budget: χρειάζεται τα εύρη', href: '#/text/services' });
  for (const [path, raw] of md) {
    const m = path.match(/^src\/content\/(projects|blog)\/([^/]+)\.md$/);
    if (!m) continue;
    if (/^(?!\s*#).*\[TODO/m.test(raw.split('---')[1] ?? '')) list.push({ text: `Το έργο ${m[2]} έχει κείμενο που περιμένει να γραφτεί`, href: `#/${m[1] === 'projects' ? 'projects' : 'posts'}/${m[2]}` });
  }
  for (const l of LANGS.filter((x) => x.code !== 'en')) {
    const p = progress(l.code);
    if (p.done < p.of) list.push({ text: `${l.long}: λείπουν ${p.of - p.done} κείμενα`, href: '#/translations' });
  }
  return list;
}

export function overview(main: HTMLElement) {
  const live = h('section', { class: 'a-block a-live' }, h('h2', {}, 'Δημοσίευση'), h('p', { class: 'a-muted' }, 'Διαβάζω…'));
  const recent = h('section', { class: 'a-block' }, h('h2', {}, 'Τελευταίες αλλαγές'), h('p', { class: 'a-muted' }, 'Διαβάζω…'));
  const speed = h('section', { class: 'a-block' }, h('h2', {}, 'PageSpeed στο /projects'), h('p', { class: 'a-muted' }, 'Διαβάζω…'));
  const todo = waiting();
  const count = (kind: string) => [...md.keys()].filter((p) => new RegExp(`^src/content/${kind}/[^/]+\\.md$`).test(p)).length;

  fillIn(main,
    h('div', { class: 'a-kpis' },
      LANGS.filter((l) => l.code !== 'en').map((l) => {
        const p = progress(l.code);
        return h('a', { class: 'a-kpi', href: '#/translations' }, h('span', { class: 'a-muted' }, l.long), h('b', {}, `${Math.floor((p.done / (p.of || 1)) * 100)}%`), h('span', { class: 'a-muted' }, `${p.done} από ${p.of} κείμενα`));
      }),
      h('a', { class: 'a-kpi', href: '#/projects' }, h('span', { class: 'a-muted' }, 'Έργα'), h('b', {}, count('projects')), h('span', { class: 'a-muted' }, 'στο /projects')),
      h('a', { class: 'a-kpi', href: '#/posts' }, h('span', { class: 'a-muted' }, 'Άρθρα'), h('b', {}, count('blog')), h('span', { class: 'a-muted' }, 'στο /blog'))),
    h('div', { class: 'a-two a-two-even' },
      h('div', { class: 'a-col' },
        live,
        h('section', { class: 'a-block' }, h('h2', {}, 'Τι περιμένει εσένα'),
          todo.length
            ? h('ul', { class: 'a-todo' }, todo.map((t) => h('li', {}, h('a', { href: t.href }, t.text))))
            : h('p', { class: 'a-muted' }, 'Τίποτα αυτή τη στιγμή.')),
        h('section', { class: 'a-block' }, h('h2', {}, 'Μηνύματα'),
          h('p', { class: 'a-muted' }, 'Οι φόρμες του site έρχονται απευθείας στο email σου, με τα αρχεία τους.'),
          h('a', { class: 'a-btn a-btn-quiet', href: `mailto:${text.site.person.email}` }, icon('mail'), text.site.person.email))),
      h('div', { class: 'a-col' }, speed, recent)));

  deploys(3).then((runs) => {
    const r = runs[0];
    if (!r) { fillIn(live, h('h2', {}, 'Δημοσίευση'), h('p', { class: 'a-muted' }, 'Δεν έχει τρέξει ακόμα.')); return; }
    const s = say(r);
    fillIn(live, h('h2', {}, 'Δημοσίευση'),
      h('p', { class: `a-state ${s.cls}` }, s.word),
      h('p', {}, r.display_title),
      h('p', { class: 'a-muted' }, ago(r.updated_at), r.event === 'schedule' ? ' · η καθημερινή, με μέτρηση PageSpeed' : ''),
      h('div', { class: 'a-actions' },
        h('a', { class: 'a-btn a-btn-quiet', href: '/', target: '_blank', rel: 'noopener' }, 'Άνοιγμα του site', icon('open')),
        h('a', { class: 'a-btn a-btn-quiet', href: r.html_url, target: '_blank', rel: 'noopener' }, 'Λεπτομέρειες', icon('open'))));
  }).catch(() => fillIn(live, h('h2', {}, 'Δημοσίευση'), h('p', { class: 'a-muted' }, 'Το κλειδί δεν έχει άδεια να διαβάζει τα Actions (δες τις Ρυθμίσεις).')));

  recentCommits(6).then((list) => fillIn(recent, h('h2', {}, 'Τελευταίες αλλαγές'),
    h('ul', { class: 'a-log' }, list.map((c) => h('li', {},
      h('a', { href: c.html_url, target: '_blank', rel: 'noopener' }, c.commit.message.split('\n')[0]),
      h('span', { class: 'a-muted' }, ago(c.commit.author.date))))))).catch(() => recent.remove());

  fetch('/pagespeed.json').then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((all: Record<string, { url: string; mobile?: Result; desktop?: Result }>) => {
    const rows = Object.entries(all).map(([id, p]) => {
      const low = [...lows(p.mobile).map((x) => `κινητό: ${x}`), ...lows(p.desktop).map((x) => `desktop: ${x}`)];
      return h('tr', {},
        h('th', { scope: 'row' }, h('a', { href: `#/projects/${id}` }, id)),
        h('td', { class: 'a-num' }, p.mobile?.scores.performance ?? '–'),
        h('td', { class: 'a-num' }, p.desktop?.scores.performance ?? '–'),
        h('td', {}, low.length ? h('span', { class: 'a-warn' }, `Κρυφά: ${low.join(', ')}`) : h('span', { class: 'a-ok' }, icon('check'), 'Φαίνονται')));
    });
    fillIn(speed, h('h2', {}, 'PageSpeed στο /projects'),
      h('div', { class: 'a-table-wrap', tabindex: 0, role: 'group', 'aria-label': 'PageSpeed ανά έργο' }, h('table', { class: 'a-table' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Έργο'), h('th', { scope: 'col', class: 'a-num' }, 'Κινητό'), h('th', { scope: 'col', class: 'a-num' }, 'Desktop'), h('th', { scope: 'col' }, 'Στο site'))),
        h('tbody', {}, rows))),
      h('p', { class: 'a-hint' }, 'Μετριέται κάθε πρωί. Τα νούμερα ενός έργου φαίνονται μόνο όσο είναι όλα πράσινα.'));
  }).catch(() => fillIn(speed, h('h2', {}, 'PageSpeed στο /projects'), h('p', { class: 'a-muted' }, 'Θα φανούν μετά την επόμενη μέτρηση.')));
}

/* ----------------------------------------------------- the settings ----------------------------------------------------- */
export function settings(main: HTMLElement, leave: () => void) {
  const p = text.site.person;
  const cvNote = h('p', { class: 'a-hint' }, `Τώρα: ${p.cv}`);
  const photoNote = h('p', { class: 'a-hint' }, `Τώρα: ${p.photo}`);
  const who = h('p', { class: 'a-muted' }, 'Διαβάζω…');
  const runNote = h('p', { class: 'a-hint', 'aria-live': 'polite' }, 'Κάθε πρωί γίνεται μόνο του. Οι αποθηκεύσεις σου δεν ξαναμετρούν, για να ανεβαίνουν σε δύο λεπτά.');
  whoAmI().then((u) => { who.textContent = `Συνδεδεμένος στο GitHub ως ${u.name || u.login}, στο ${REPO}.`; }).catch(() => { who.textContent = `Συνδεδεμένος στο ${REPO}.`; });

  fillIn(main, h('div', { class: 'a-two a-two-even' },
    h('div', { class: 'a-col' },
      h('section', { class: 'a-block' }, h('h2', {}, 'Στοιχεία επικοινωνίας'),
        plainField(p, 'email', 'Email', { type: 'email', hint: 'Το δείχνει το site. Οι φόρμες στέλνουν στο «Παραλήπτης φορμών», παρακάτω.' }),
        plainField(p, 'phone', 'Τηλέφωνο', { type: 'tel', onEdit: () => { p.phoneHref = `tel:${String(p.phone).replace(/[^+\d]/g, '')}`; } }),
        plainField(p, 'linkedin', 'LinkedIn', { type: 'url' }),
        plainField(p, 'github', 'GitHub', { type: 'url', hint: 'Από αυτόν τον λογαριασμό βγαίνει το «A year of code» στο /about.' })),
      h('section', { class: 'a-block' }, h('h2', {}, 'Το όνομά σου'),
        copyField(p.name, 'Όνομα'), copyField(p.role, 'Ιδιότητα'), copyField(p.location, 'Τοποθεσία')),
      h('section', { class: 'a-block' }, h('h2', {}, 'Φόρμες'),
        plainField(text.site.brief, 'formsubmit', 'Παραλήπτης φορμών', { hint: 'Το email ή το alias του FormSubmit που παίρνει τις φόρμες του /contact και του /services.' }))),
    h('div', { class: 'a-col' },
      h('section', { class: 'a-block' }, h('h2', {}, 'Βιογραφικό'),
        cvNote,
        h('label', { class: 'a-btn a-btn-quiet a-file' }, icon('upload'), 'Νέο PDF',
          h('input', { type: 'file', accept: 'application/pdf', onchange: async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            addUpload(`public${p.cv}`, await readAsBase64(file), 'βιογραφικό');
            cvNote.textContent = `${file.name}, ${Math.round(file.size / 1024)} KB. Ανεβαίνει με την αποθήκευση, στην ίδια διεύθυνση.`;
          } }))),
      h('section', { class: 'a-block' }, h('h2', {}, 'Πορτραίτο'),
        photoNote,
        h('label', { class: 'a-btn a-btn-quiet a-file' }, icon('upload'), 'Νέα φωτογραφία',
          h('input', { type: 'file', accept: 'image/*', onchange: async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
              const w = await webp(file, 960);
              addUpload(`public${p.photo}`, w.base64, 'πορτραίτο');
              photoNote.textContent = `Έτοιμη: ${w.width} × ${w.height}, ${w.kb} KB. Ανεβαίνει με την αποθήκευση.`;
              touched();
            } catch { photoNote.textContent = 'Δεν μπόρεσα να διαβάσω αυτή την εικόνα.'; }
          } }))),
      h('section', { class: 'a-block' }, h('h2', {}, 'Μέτρηση PageSpeed'),
        runNote,
        h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: async () => {
          try { await deployNow(); runNote.textContent = 'Ξεκίνησε: χτίζει το site και μετράει ξανά όλα τα έργα, σε περίπου δέκα λεπτά.'; }
          catch (err) { runNote.textContent = err instanceof GitHubError && err.status === 403 ? 'Το κλειδί δεν έχει άδεια «Actions: Read and write».' : 'Δεν ξεκίνησε: δοκίμασε ξανά σε λίγο.'; }
        } }, 'Μέτρηση τώρα')),
      h('section', { class: 'a-block' }, h('h2', {}, 'Σύνδεση'),
        who,
        h('p', { class: 'a-hint' }, 'Το κλειδί μένει μόνο σε αυτόν τον browser και πηγαίνει μόνο στο GitHub.'),
        h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: () => { key.clear(); leave(); } }, icon('out'), 'Έξοδος και διαγραφή κλειδιού από εδώ')))));
}
