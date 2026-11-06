// The panel's only back end: the site's repository on GitHub. Reading is reading files; saving is one commit on top of
// the branch, which starts the deploy (.github/workflows/deploy.yml). The key stays in this browser and goes nowhere but
// to GitHub's API.

export const REPO = 'pikionis/myweb';
/** The branch the panel works on (a test can ask for another with ?branch=). */
export const BRANCH = new URLSearchParams(location.search).get('branch') || 'main';
const API = 'https://api.github.com';
const KEY = 'ohl-admin-key';

export class GitHubError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Your key: kept on this device, or only until the tab closes. */
export const key = {
  get: () => { try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || ''; } catch { return ''; } },
  set: (value: string, remember: boolean) => { try { (remember ? localStorage : sessionStorage).setItem(KEY, value); } catch { /* no storage: it lasts until the tab closes */ } mem = value; },
  clear: () => { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch { /* nothing kept */ } mem = ''; },
};
let mem = '';

export async function gh<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${key.get() || mem}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    let message = `${res.status}`;
    try { message = (await res.json()).message || message; } catch { /* no JSON */ }
    throw new GitHubError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

export type Entry = { path: string; sha: string; type: string };

/** Every file on the branch, with its version. */
export async function listFiles() {
  const r = await gh<{ tree: Entry[] }>(`/repos/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`);
  return r.tree.filter((e) => e.type === 'blob');
}

export const readBlob = async (sha: string) => decode((await gh<{ content: string }>(`/repos/${REPO}/git/blobs/${sha}`)).content);

/** What a key may do here: `null` if it doesn't reach the repository. */
export async function checkKey() {
  const repo = await gh<{ permissions?: { push?: boolean } }>(`/repos/${REPO}`);
  return { canWrite: !!repo.permissions?.push };
}

export const whoAmI = () => gh<{ login: string; name: string | null }>('/user');

export type Change = { path: string; text?: string; base64?: string; remove?: boolean };

/** One commit on top of the branch. `expected` holds the version each file had when it was read: if another save has
 *  changed one of them since, nothing is written. Returns the commit and the files' new versions. */
export async function commit(message: string, changes: Change[], expected: Map<string, string>) {
  const head = await gh<{ object: { sha: string } }>(`/repos/${REPO}/git/ref/heads/${encodeURIComponent(BRANCH)}`);
  const parent = await gh<{ tree: { sha: string } }>(`/repos/${REPO}/git/commits/${head.object.sha}`);
  const now = await gh<{ tree: Entry[] }>(`/repos/${REPO}/git/trees/${parent.tree.sha}?recursive=1`);
  const current = new Map(now.tree.map((e) => [e.path, e.sha]));
  const changedElsewhere = changes.filter((c) => expected.has(c.path) && current.get(c.path) !== expected.get(c.path)).map((c) => c.path);
  if (changedElsewhere.length) throw new GitHubError(409, changedElsewhere.join(', '));

  const tree = await Promise.all(changes.map(async (c) => {
    if (c.remove) return { path: c.path, mode: '100644', type: 'blob', sha: null };
    if (c.base64 !== undefined) {
      const blob = await gh<{ sha: string }>(`/repos/${REPO}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: c.base64, encoding: 'base64' }) });
      return { path: c.path, mode: '100644', type: 'blob', sha: blob.sha };
    }
    return { path: c.path, mode: '100644', type: 'blob', content: c.text };
  }));
  // a file marked for removal that was never saved has nothing to remove
  const made = await gh<{ sha: string; tree: Entry[] }>(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: tree.filter((t) => t.sha !== null || current.has(t.path)) }),
  });
  const done = await gh<{ sha: string }>(`/repos/${REPO}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: made.sha, parents: [head.object.sha] }) });
  await gh(`/repos/${REPO}/git/refs/heads/${encodeURIComponent(BRANCH)}`, { method: 'PATCH', body: JSON.stringify({ sha: done.sha }) });
  const versions = await gh<{ tree: Entry[] }>(`/repos/${REPO}/git/trees/${made.sha}?recursive=1`);
  return { sha: done.sha, versions: new Map(versions.tree.map((e) => [e.path, e.sha])) };
}

export type Run = { id: number; status: string; conclusion: string | null; head_sha: string; display_title: string; created_at: string; updated_at: string; event: string; html_url: string };

export const deploys = async (perPage = 5) =>
  (await gh<{ workflow_runs: Run[] }>(`/repos/${REPO}/actions/workflows/deploy.yml/runs?per_page=${perPage}&branch=main`)).workflow_runs;

export const deployOf = async (sha: string) =>
  (await gh<{ workflow_runs: Run[] }>(`/repos/${REPO}/actions/runs?head_sha=${sha}&per_page=3`)).workflow_runs[0];

/** Runs the deploy now: rebuilds the site and measures PageSpeed afresh. */
export const deployNow = () => gh(`/repos/${REPO}/actions/workflows/deploy.yml/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main' }) });

export type CommitInfo = { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } };
export const recentCommits = (n = 6) => gh<CommitInfo[]>(`/repos/${REPO}/commits?sha=${encodeURIComponent(BRANCH)}&per_page=${n}`);
