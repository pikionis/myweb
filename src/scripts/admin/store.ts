// What the panel has read from the repository, what has changed since, and saving it as one commit.
import { commit, listFiles, readBlob, GitHubError, type Change } from './github';

export type Lang = 'en' | 'el' | 'de';
export const LANGS: { code: Lang; name: string; long: string }[] = [
  { code: 'en', name: 'EN', long: 'English' },
  { code: 'el', name: 'ΕΛ', long: 'Ελληνικά' },
  { code: 'de', name: 'DE', long: 'Deutsch' },
];

export type Copy = Partial<Record<Lang, string>> & { en: string };
export const isCopy = (v: unknown): v is Copy => !!v && typeof v === 'object' && !Array.isArray(v)
  && typeof (v as Copy).en === 'string' && Object.keys(v as object).every((k) => k === 'en' || k === 'el' || k === 'de');

export const TEXT_FILES = { site: 'src/text/site.json', stories: 'src/text/stories.json', 'services-page': 'src/text/services-page.json', 'my-story': 'src/text/my-story.json' } as const;
export type TextName = keyof typeof TEXT_FILES;

const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`;
const DRAFT = 'ohl-admin-draft';

/** The word files, parsed: the fields edit these objects directly. */
export const text = {} as Record<TextName, any>;
/** Markdown files by path, as they stand now. */
export const md = new Map<string, string>();
/** Files about to go up (a picture, the CV). */
export const uploads = new Map<string, { base64: string; note: string }>();

const saved = new Map<string, string>();
const versions = new Map<string, string>();
const removed = new Set<string>();
let listeners: (() => void)[] = [];

const isOurs = (path: string) => /^src\/content\/(projects|blog)\/(?:(?:el|de)\/)?[^_/][^/]*\.md$/.test(path);

/** Reads everything the panel edits. */
export async function load() {
  const files = await listFiles();
  for (const f of files) versions.set(f.path, f.sha);
  const wanted = files.filter((f) => isOurs(f.path) || Object.values(TEXT_FILES).includes(f.path as never));
  const read = await Promise.all(wanted.map(async (f) => [f.path, await readBlob(f.sha)] as const));
  for (const [path, content] of read) {
    saved.set(path, content);
    const name = (Object.keys(TEXT_FILES) as TextName[]).find((k) => TEXT_FILES[k] === path);
    if (name) text[name] = JSON.parse(content);
    else md.set(path, content);
  }
  return restoreDraft();
}

export const exists = (path: string) => versions.has(path);
export const fileList = () => [...versions.keys()];

/** Every file that differs from the repository. */
export function changes(): Change[] {
  const out: Change[] = [];
  for (const name of Object.keys(text) as TextName[]) {
    const path = TEXT_FILES[name], now = json(text[name]);
    if (now !== saved.get(path)) out.push({ path, text: now });
  }
  for (const [path, now] of md) if (now !== saved.get(path)) out.push({ path, text: now });
  for (const path of removed) if (versions.has(path)) out.push({ path, remove: true });
  for (const [path, u] of uploads) out.push({ path, base64: u.base64 });
  return out;
}

export const onChange = (fn: () => void) => { listeners.push(fn); return () => { listeners = listeners.filter((l) => l !== fn); }; };

let timer = 0;
/** A field changed: the save bar and the draft follow, a moment later. */
export function touched() {
  clearTimeout(timer);
  timer = window.setTimeout(() => { listeners.forEach((l) => l()); keepDraft(); }, 120);
}

export function setMd(path: string, content: string) { removed.delete(path); md.set(path, content); touched(); }
export function removeMd(path: string) { md.delete(path); if (saved.has(path)) removed.add(path); touched(); }
export function addUpload(path: string, base64: string, note: string) { uploads.set(path, { base64, note }); touched(); }

/* A draft survives a closed tab: what has changed is kept in this browser until it is saved or thrown away. */
function keepDraft() {
  try {
    const list = changes().filter((c) => c.text !== undefined);
    if (!list.length) { localStorage.removeItem(DRAFT); return; }
    localStorage.setItem(DRAFT, JSON.stringify(list.map((c) => ({ path: c.path, text: c.text, base: versions.get(c.path) ?? null }))));
  } catch { /* no storage: no draft */ }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT);
    if (!raw) return 0;
    const list = JSON.parse(raw) as { path: string; text: string; base: string | null }[];
    let n = 0;
    for (const d of list) {
      if ((versions.get(d.path) ?? null) !== d.base) continue; // the file moved on since: the draft of it is out of date
      const name = (Object.keys(TEXT_FILES) as TextName[]).find((k) => TEXT_FILES[k] === d.path);
      if (name) text[name] = JSON.parse(d.text);
      else md.set(d.path, d.text);
      n++;
    }
    return n;
  } catch { return 0; }
}

export function discard() {
  for (const name of Object.keys(TEXT_FILES) as TextName[]) text[name] = JSON.parse(saved.get(TEXT_FILES[name])!);
  md.clear();
  for (const [path, content] of saved) if (!Object.values(TEXT_FILES).includes(path as never)) md.set(path, content);
  removed.clear();
  uploads.clear();
  try { localStorage.removeItem(DRAFT); } catch { /* nothing kept */ }
  listeners.forEach((l) => l());
}

/** What a commit's first line says, in words. */
function describe(list: Change[]) {
  const names = list.map((c) => {
    const m = c.path.match(/content\/(projects|blog)\/(?:(el|de)\/)?([^/]+)\.md$/);
    if (m) return `${m[1] === 'projects' ? 'project' : 'post'} ${m[3]}`;
    if (c.path.startsWith('src/text/')) return c.path.slice(9, -5);
    return c.path.split('/').pop()!;
  });
  return `Admin: ${[...new Set(names)].slice(0, 4).join(', ')}${new Set(names).size > 4 ? ' and more' : ''}`;
}

/** Saves every change as one commit. Throws GitHubError(409) naming the files another save has changed since. */
export async function save() {
  const list = changes();
  if (!list.length) return null;
  const expected = new Map<string, string>();
  for (const c of list) { const v = versions.get(c.path); if (v) expected.set(c.path, v); }
  const done = await commit(describe(list), list, expected);
  versions.clear();
  for (const [p, v] of done.versions) versions.set(p, v);
  for (const c of list) {
    if (c.remove) saved.delete(c.path);
    else if (c.text !== undefined) saved.set(c.path, c.text);
  }
  removed.clear();
  uploads.clear();
  try { localStorage.removeItem(DRAFT); } catch { /* nothing kept */ }
  listeners.forEach((l) => l());
  return done.sha;
}

export { GitHubError };
