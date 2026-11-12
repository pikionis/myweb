// The admin panel (/admin): the shell, the way in, and saving. Every screen's words are Greek and live in these files:
// the panel is for Petros, not part of the site's translated text.
import { symbolBox } from '../../data/logo';
import { ago, fillIn, h, icon } from './dom';
import { BRANCH, checkKey, deployOf, GitHubError, key, REPO } from './github';
import { changes, discard, load, onChange, save, uploads } from './store';
import { overview, settings } from './views-home';
import { postsView, projectsView } from './views-entries';
import { SECTIONS, textView, translationsView } from './views-text';

const root = document.getElementById('admin')!;

const NAV: { group?: string; href: string; label: string; icon: Parameters<typeof icon>[0] }[] = [
  { href: '#/', label: 'Επισκόπηση', icon: 'home' },
  { group: 'Περιεχόμενο', href: '#/text', label: 'Κείμενα σελίδων', icon: 'text' },
  { href: '#/projects', label: 'Έργα', icon: 'work' },
  { href: '#/posts', label: 'Άρθρα', icon: 'post' },
  { group: 'Γλώσσες', href: '#/translations', label: 'Μεταφράσεις', icon: 'lang' },
  { group: 'Διαχείριση', href: '#/settings', label: 'Ρυθμίσεις', icon: 'cog' },
];

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new?' + new URLSearchParams({
  name: 'onehublabs admin', description: 'Το admin panel του onehublabs.com', target_name: 'pikionis', expires_in: '366', contents: 'write', actions: 'write',
});

/* ---------------------------------------------------- the way in ---------------------------------------------------- */
function login(message = '') {
  const note = h('p', { class: 'a-login-note', role: 'alert' }, message);
  const input = h('input', { id: 'a-key', class: 'a-input', type: 'password', autocomplete: 'off', spellcheck: 'false', required: true });
  const keep = h('input', { type: 'checkbox', checked: true });
  const go = h('button', { type: 'submit', class: 'a-btn a-btn-main' }, 'Είσοδος');
  fillIn(root, h('main', { class: 'a-login' },
    h('div', { class: 'a-login-box' },
      h('p', { class: 'a-brand a-brand-dark' }, mark(), 'onehub'),
      h('h1', {}, 'Διαχείριση'),
      h('form', { onsubmit: async (e: Event) => {
        e.preventDefault();
        go.disabled = true; note.textContent = '';
        key.set(input.value.trim(), keep.checked);
        try {
          const { canWrite } = await checkKey();
          if (!canWrite) { key.clear(); note.textContent = 'Το κλειδί διαβάζει το αποθετήριο αλλά δεν μπορεί να γράψει: δώσε του «Contents: Read and write».'; go.disabled = false; return; }
          start();
        } catch (err) {
          key.clear();
          note.textContent = err instanceof GitHubError && (err.status === 401 || err.status === 404) ? `Αυτό το κλειδί δεν ανοίγει το ${REPO}.` : 'Δεν έφτασα στο GitHub: δοκίμασε ξανά σε λίγο.';
          go.disabled = false;
        }
      } },
        h('div', { class: 'a-field' }, h('label', { class: 'a-label', for: 'a-key' }, 'Κλειδί GitHub'), input),
        h('label', { class: 'a-check' }, keep, h('span', {}, 'Να με θυμάται αυτή η συσκευή')),
        note, go),
      h('details', { class: 'a-login-help' },
        h('summary', {}, 'Πώς φτιάχνω κλειδί'),
        h('ol', {},
          h('li', {}, h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, 'Άνοιξε αυτή τη σελίδα του GitHub'), ': τα περισσότερα είναι ήδη συμπληρωμένα.'),
          h('li', {}, 'Στο «Repository access» διάλεξε «Only select repositories» και μετά το ', h('b', {}, 'myweb'), '.'),
          h('li', {}, 'Κάτω κάτω πάτα «Generate token» και αντίγραψε το κλειδί που βγάζει.'),
          h('li', {}, 'Βάλε το εδώ. Μια φορά για κάθε συσκευή.'))))));
  input.focus();
}

const mark = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'a-mark');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('viewBox', `0 0 ${symbolBox.w} ${symbolBox.h}`);
  // the arc first: its round ends sit under the loops it meets
  for (const part of ['arc', 'top', 'left', 'right']) {
    const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', `#ohl-${part}`);
    if (part === 'arc') u.setAttribute('class', 'arc');
    s.append(u);
  }
  return s;
};

/* ----------------------------------------------------- the shell ----------------------------------------------------- */
let main: HTMLElement;
let heading: HTMLElement;
let bar: HTMLElement;
let nav: HTMLElement;

function shell() {
  main = h('main', { class: 'a-content', id: 'a-main', tabindex: -1 });
  heading = h('h1', {});
  bar = h('section', { class: 'a-savebar', hidden: true, 'aria-label': 'Αποθήκευση' });
  nav = h('nav', { class: 'a-nav', 'aria-label': 'Ενότητες' });
  const side = h('aside', { class: 'a-sidebar' },
    h('a', { class: 'a-brand', href: '#/' }, mark(), 'onehub'),
    nav);
  const menu = h('button', { type: 'button', class: 'a-icon-btn a-menu-btn', 'aria-label': 'Μενού', 'aria-expanded': 'false', onclick: () => {
    const open = side.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  } }, icon('menu'));
  nav.addEventListener('click', () => { side.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); });
  fillIn(root, h('div', { class: 'a-shell' }, side,
    h('div', { class: 'a-page' },
      h('header', { class: 'a-topbar' }, menu, heading,
        BRANCH !== 'main' && h('span', { class: 'a-tag' }, BRANCH),
        h('a', { class: 'a-btn a-btn-quiet a-view', href: '/', target: '_blank', rel: 'noopener' }, 'Προβολή site', icon('open'))),
      main, bar)));
}

function drawNav() {
  const here = location.hash.split('/').slice(0, 2).join('/') || '#/';
  fillIn(nav, NAV.map((n) => [
    n.group && h('span', { class: 'a-nav-group' }, n.group),
    h('a', { class: 'a-nav-link', href: n.href, 'aria-current': n.href === here || (n.href === '#/' && here === '#') ? 'page' : undefined }, icon(n.icon), n.label),
  ]));
}

/* ------------------------------------------------------- saving ------------------------------------------------------- */
let publishing: { sha: string; since: number } | null = null;
let pollTimer = 0;

function drawBar() {
  const list = changes();
  if (publishing) return;
  bar.hidden = !list.length;
  if (!list.length) return;
  const files = list.length === 1 ? '1 αρχείο' : `${list.length} αρχεία`;
  const notes = [...new Set([...uploads.values()].map((u) => u.note))];
  fillIn(bar,
    h('p', {}, h('b', {}, 'Μη αποθηκευμένες αλλαγές'), ' σε ', files, notes.length ? ` (${notes.join(', ')})` : ''),
    h('div', { class: 'a-actions' },
      h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: () => { if (confirm('Να χαθούν όλες οι αλλαγές που δεν έχουν αποθηκευτεί;')) { discard(); route(); } } }, 'Απόρριψη'),
      h('button', { type: 'button', class: 'a-btn a-btn-main', onclick: saveNow }, 'Αποθήκευση και δημοσίευση')));
}

async function saveNow() {
  fillIn(bar, h('p', {}, 'Αποθηκεύω…'));
  try {
    const sha = await save();
    if (!sha) { drawBar(); return; }
    publishing = { sha, since: Date.now() };
    watchDeploy();
    route();
  } catch (err) {
    let message = 'Δεν αποθηκεύτηκε: δοκίμασε ξανά. Οι αλλαγές σου είναι ακόμα εδώ.';
    if (err instanceof GitHubError && err.status === 409) message = `Κάποιος άλλος άλλαξε στο μεταξύ: ${err.message}. Κράτα αντίγραφο όσων έγραψες και ξαναφόρτωσε τη σελίδα.`;
    if (err instanceof GitHubError && err.status === 401) message = 'Το κλειδί έληξε: κάνε νέα είσοδο. Οι αλλαγές σου μένουν σε αυτόν τον browser.';
    if (err instanceof GitHubError && err.status === 403) message = 'Το κλειδί δεν έχει άδεια να γράφει («Contents: Read and write»).';
    fillIn(bar, h('p', { class: 'a-bad', role: 'alert' }, message),
      h('div', { class: 'a-actions' }, h('button', { type: 'button', class: 'a-btn a-btn-main', onclick: saveNow }, 'Ξανά')));
  }
}

/** After a save: the deploy, until the site is live. */
function watchDeploy() {
  clearTimeout(pollTimer);
  if (!publishing) return;
  const { sha, since } = publishing;
  const show = (cls: string, words: string, closing = false) => {
    bar.hidden = false;
    fillIn(bar, h('p', { class: cls, role: 'status' }, words),
      closing && h('div', { class: 'a-actions' },
        h('a', { class: 'a-btn a-btn-quiet', href: '/', target: '_blank', rel: 'noopener' }, 'Άνοιγμα του site', icon('open')),
        h('button', { type: 'button', class: 'a-btn a-btn-quiet', onclick: () => { publishing = null; drawBar(); } }, 'Εντάξει')));
  };
  show('a-busy', 'Αποθηκεύτηκε. Δημοσιεύεται: περίπου δύο λεπτά…');
  const check = async () => {
    try {
      const run = await deployOf(sha);
      if (run?.status === 'completed') {
        if (run.conclusion === 'success') { show('a-ok', 'Είναι live.', true); return; }
        show('a-bad', 'Αποθηκεύτηκε, αλλά η δημοσίευση απέτυχε. Το παλιό site μένει όπως ήταν. Δες τις λεπτομέρειες στο GitHub Actions.', true);
        return;
      }
    } catch { /* it may not have started yet, or the key can't read Actions */ }
    if (Date.now() - since > 15 * 60 * 1000) { show('a-muted', 'Αποθηκεύτηκε. Η δημοσίευση αργεί: θα φανεί στο site όταν τελειώσει.', true); return; }
    pollTimer = window.setTimeout(check, 10000);
  };
  pollTimer = window.setTimeout(check, 8000);
}

/* ------------------------------------------------------ the screens ------------------------------------------------------ */
function route() {
  const [, screen = '', id] = location.hash.split('/');
  drawNav();
  const title = (s: string) => { heading.textContent = s; document.title = `${s} · Διαχείριση`; };
  switch (screen) {
    case 'text': title(id ? SECTIONS.find((s) => s.id === id)?.title ?? 'Κείμενα σελίδων' : 'Κείμενα σελίδων'); textView(main, id); break;
    case 'projects': title(id ? `Έργο: ${id}` : 'Έργα'); projectsView(main, id); break;
    case 'posts': title(id ? `Άρθρο: ${id}` : 'Άρθρα'); postsView(main, id); break;
    case 'translations': title('Μεταφράσεις'); translationsView(main); break;
    case 'settings': title('Ρυθμίσεις'); settings(main, () => login()); break;
    default: title('Επισκόπηση'); overview(main);
  }
  main.scrollTop = 0;
  window.scrollTo(0, 0);
}

async function start() {
  fillIn(root, h('main', { class: 'a-login' }, h('p', { class: 'a-muted', role: 'status' }, 'Διαβάζω τα αρχεία του site…')));
  try {
    const restored = await load();
    shell();
    onChange(drawBar);
    window.addEventListener('hashchange', route);
    window.addEventListener('beforeunload', (e) => { if (changes().length) e.preventDefault(); });
    route();
    drawBar();
    if (restored) bar.prepend(h('p', { class: 'a-muted' }, `Βρήκα ${restored === 1 ? 'ένα αρχείο' : `${restored} αρχεία`} που δεν είχες αποθηκεύσει, και τα επανέφερα.`));
    void ago;
  } catch (err) {
    if (err instanceof GitHubError && (err.status === 401 || err.status === 403 || err.status === 404)) { key.clear(); login(`Αυτό το κλειδί δεν ανοίγει πια το ${REPO}: φτιάξε νέο.`); return; }
    fillIn(root, h('main', { class: 'a-login' }, h('p', { role: 'alert' }, 'Δεν έφτασα στο GitHub.'), h('button', { type: 'button', class: 'a-btn a-btn-main', onclick: start }, 'Ξανά')));
  }
}

if (key.get()) start(); else login();
