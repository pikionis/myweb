// Markdown files with front matter, the way this site writes them: one line per field (strings in double quotes, arrays
// and small maps inline). Changing a field touches only its line, so the comments beside the fields stay where they are.

export type Value = string | number | boolean | string[] | Record<string, string> | undefined;
export type Fields = Record<string, Value>;

export function splitMd(raw: string) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n?---\r?\n?([\s\S]*)$/);
  return m ? { head: m[1].replace(/\r\n/g, '\n'), body: m[2].replace(/\r\n/g, '\n').replace(/^\n+/, '') } : { head: '', body: raw.replace(/\r\n/g, '\n') };
}

const unquote = (s: string) => {
  const v = s.trim();
  if (v.startsWith('"')) { try { return JSON.parse(v) as string; } catch { return v.slice(1, -1); } }
  if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
};

/** Splits on a separator that isn't inside quotes. */
const parts = (s: string, sep: string) => {
  const out: string[] = [];
  let quote = '', cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) { cur += c; if (c === '\\') cur += s[++i] ?? ''; else if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === sep) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
};

const withoutComment = (s: string) => {
  let quote = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
};

const parseValue = (raw: string): Value => {
  const v = withoutComment(raw).trim();
  if (v === '') return undefined;
  if (v.startsWith('[')) return parts(v.slice(1, v.lastIndexOf(']')), ',').map(unquote);
  if (v.startsWith('{')) return Object.fromEntries(parts(v.slice(1, v.lastIndexOf('}')), ',').map((p) => { const i = p.indexOf(':'); return [p.slice(0, i).trim(), unquote(p.slice(i + 1))]; }));
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return unquote(v);
};

export function parseFields(head: string): Fields {
  const out: Fields = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^([A-Za-z_]\w*):(.*)$/);
    if (m) out[m[1]] = parseValue(m[2]);
  }
  return out;
}

const quoted = (s: string) => JSON.stringify(s);
const writeValue = (v: Value): string => {
  if (Array.isArray(v)) return `[${v.map(quoted).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${quoted(x)}`).join(', ')} }`;
  return typeof v === 'string' ? quoted(v) : String(v);
};

const empty = (v: Value) => v === undefined || v === '' || (Array.isArray(v) && !v.length) || (v !== null && typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(Boolean));

/** The head with one field changed: its line replaced, removed if it is now empty, or added at the end. */
export function setField(head: string, name: string, value: Value) {
  const lines = head ? head.split('\n') : [];
  const at = lines.findIndex((l) => l.startsWith(`${name}:`));
  if (empty(value)) { if (at >= 0) lines.splice(at, 1); }
  else if (at >= 0) lines[at] = `${name}: ${writeValue(value)}`;
  else lines.push(`${name}: ${writeValue(value)}`);
  return lines.join('\n');
}

export const joinMd = (head: string, body: string) => `---\n${head}\n---\n\n${body.replace(/\s+$/, '')}\n`;
