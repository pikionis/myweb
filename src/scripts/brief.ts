import { createIsland } from './island';
import { services, bots } from '../data/site';
import { previewAssistant, type Answer, type BriefAssistant, type BriefSection, type Question } from './assistant';

/*
 * The brief form on /contact.
 * 1. The visitor writes the idea; the assistant reads it and asks 2–3 sharper questions.
 * 2. It drafts a final brief, written into an editable document as it streams.
 * 3. The send button slides right and becomes "Submit your brief"; files and progress ride along.
 *
 * Every form on the site sends through `post()` only (this one, and the closing form on /services). It posts to
 * FormSubmit's AJAX endpoint for now; when the site gets its own backend, point the request there and keep the rest.
 */

/** Sends a form's data to where the form points (its action), with upload progress for files. Rejects with
 *  what went wrong, in words a visitor can read. */
export function post(form: HTMLFormElement, data: FormData, onProgress?: (share: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'));
    xhr.setRequestHeader('Accept', 'application/json');
    if (onProgress) xhr.upload.addEventListener('progress', (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); });
    xhr.addEventListener('load', () => {
      let reply: { success?: string | boolean; message?: string } = {};
      try { reply = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      const ok = xhr.status >= 200 && xhr.status < 300 && String(reply.success) !== 'false';
      if (ok) resolve();
      else reject(new Error(reply.message || `the server answered ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('check your connection')));
    xhr.addEventListener('timeout', () => reject(new Error('it took too long')));
    xhr.timeout = 120000;
    xhr.send(data);
  });
}

// the real assistant arrives with the backend; until then only `npm run dev` gets the local preview
const assistant: BriefAssistant | null = import.meta.env.DEV ? previewAssistant : null;
const PREVIEW = assistant === previewAssistant;

const ACCEPT = /^image\/|\.(pdf|docx?|pptx?|key|xlsx?|csv|txt|md|rtf)$/i;
const MIN_WORDS = 8;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const size = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const autosize = (t: HTMLTextAreaElement) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; };

export function briefForm(form: HTMLFormElement) {
  const $ = <T extends Element>(sel: string) => form.querySelector<T>(sel);
  const mount = $<HTMLElement>('[data-island]');
  const input = $<HTMLInputElement>('input[type="file"]');
  const drop = $<HTMLElement>('[data-drop]');
  const list = $<HTMLElement>('[data-files]');
  const button = $<HTMLButtonElement>('button[type="submit"]');
  const idea = $<HTMLTextAreaElement>('textarea[name="message"]');
  if (!mount || !input || !drop || !list || !button || !idea) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const island = createIsland(mount);
  const maxBytes = Number(form.dataset.maxBytes) || 10 * 1024 * 1024;
  let files: File[] = [];
  let seq = 0;
  const total = () => files.reduce((s, f) => s + f.size, 0);

  /* ---------- files ---------- */
  const renderFiles = () => {
    list.replaceChildren(...files.map((f) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'fname';
      name.textContent = f.name;
      const meta = document.createElement('span');
      meta.className = 'fsize';
      meta.textContent = size(f.size);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${f.name}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      remove.addEventListener('click', () => { files = files.filter((x) => x !== f); renderFiles(); });
      li.append(name, meta, remove);
      return li;
    }));
  };

  const addFiles = (incoming: Iterable<File>) => {
    for (const f of incoming) {
      const id = `file-${++seq}`;
      if (!ACCEPT.test(f.type) && !ACCEPT.test(f.name)) {
        island.set({ id, status: 'error', label: `Can't attach ${f.name}`, detail: 'Use images, PDF, Word, slides or sheets', action: { label: 'OK', onClick: () => island.remove(id) } });
        continue;
      }
      if (total() + f.size > maxBytes) {
        island.set({ id, status: 'error', label: `${f.name} doesn't fit`, detail: `files must stay under ${size(maxBytes)} in total`, action: { label: 'OK', onClick: () => island.remove(id) } });
        continue;
      }
      files.push(f);
      island.set({
        id, status: 'done', label: f.name, detail: `${size(f.size)} added`,
        action: { label: 'Undo', onClick: () => {
          files = files.filter((x) => x !== f);
          renderFiles();
          island.update(id, { detail: 'removed', action: undefined });
        } },
      });
    }
    renderFiles();
    // the picker only collects; the list above is what gets sent
    input.value = '';
  };

  input.addEventListener('change', () => input.files && addFiles(input.files));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', (e) => { if (!drop.contains(e.relatedTarget as Node | null)) drop.classList.remove('over'); });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
  });

  /* ---------- the assistant: questions, then the final brief ---------- */
  const assist = $<HTMLElement>('[data-assist]');
  const analyse = $<HTMLButtonElement>('[data-analyse]');
  const analyseLabel = $<HTMLElement>('[data-analyse-label]');
  const ideaBox = $<HTMLElement>('[data-idea-box]');
  const questionsBox = $<HTMLElement>('[data-questions]');
  const qs = $<HTMLOListElement>('[data-qs]');
  const draftBtn = $<HTMLButtonElement>('[data-draft]');
  const template = $<HTMLTemplateElement>('[data-q-template]');
  const final = $<HTMLElement>('[data-final]');
  const actions = $<HTMLElement>('[data-actions]');
  const label = button.querySelector<HTMLElement>('.lbl');
  const forEl = $<HTMLElement>('[data-for]');
  const dateEl = $<HTMLTimeElement>('[data-date]');
  const sectionEls = new Map(
    [...form.querySelectorAll<HTMLTextAreaElement>('[data-section]')].map((t) => [t.dataset.section as BriefSection, t]),
  );
  let asked: { q: Question; answer: HTMLTextAreaElement }[] = [];
  let busy = false;
  let ready = false;

  const need = () => form.querySelector<HTMLInputElement>('input[name="need"]:checked')?.value ?? 'Not sure yet';
  // a service's "Start a project" names it (/contact?type=project&service=web): its need starts selected
  const wanted = [...services, bots].find((s) => s.key === new URLSearchParams(location.search).get('service'))?.need;
  const preset = wanted && form.querySelector<HTMLInputElement>(`input[name="need"][value="${CSS.escape(wanted)}"]`);
  if (preset) preset.checked = true;
  const words = () => idea.value.trim().split(/\s+/).filter(Boolean).length;
  const rise = (node: Element, delay = 0) => !reduce && node.animate(
    [{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
    { duration: 420, easing: EASE_OUT, delay, fill: 'backwards' },
  );
  /** Writes text in at a reading pace, so the visitor sees it arrive. */
  const type = async (node: HTMLElement, text: string) => {
    if (reduce) { node.textContent = text; return; }
    node.textContent = '';
    for (let i = 0; i < text.length; i += 2) {
      node.textContent = text.slice(0, i + 2);
      await wait(10);
    }
  };

  // the brief's header names who it's for, as they type it
  const who = () => {
    const company = $<HTMLInputElement>('input[name="company"]')?.value.trim();
    const name = $<HTMLInputElement>('input[name="name"]')?.value.trim();
    if (forEl) forEl.textContent = company || name || 'Your project';
  };
  form.querySelectorAll('input[name="company"], input[name="name"]').forEach((i) => i.addEventListener('input', who));
  sectionEls.forEach((t) => t.addEventListener('input', () => autosize(t)));

  const addQuestion = async (q: Question, n: number) => {
    if (!template || !qs) return;
    const li = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    li.querySelector('.angle')!.textContent = q.angle;
    const field = li.querySelector<HTMLInputElement>('.qfield')!;
    field.name = `Question ${n}`;
    field.value = q.text;
    const answer = li.querySelector<HTMLTextAreaElement>('.qanswer')!;
    answer.name = `Answer ${n}`;
    answer.setAttribute('aria-label', `Answer to question ${n}`);
    answer.addEventListener('input', () => {
      autosize(answer);
      replies.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === answer.value)));
    });
    const replies = li.querySelector<HTMLElement>('.replies')!;
    for (const r of q.replies) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r;
      b.setAttribute('aria-pressed', 'false');
      // a quick reply fills the answer; anything typed after it still wins
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        answer.value = on ? r : '';
        replies.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(on && x === b)));
        autosize(answer);
      });
      replies.append(b);
    }
    replies.hidden = true;
    qs.append(li);
    asked.push({ q, answer });
    rise(li);
    await type(li.querySelector<HTMLElement>('.qtext')!, q.text);
    replies.hidden = false;
    rise(replies);
  };

  const askQuestions = async () => {
    if (!assistant || busy || !questionsBox || !qs) return;
    busy = true;
    ideaBox?.classList.add('reading');
    idea.readOnly = true;
    if (analyse) analyse.disabled = true;
    if (draftBtn) draftBtn.hidden = true;
    qs.replaceChildren();
    asked = [];
    questionsBox.hidden = false;
    island.set({ id: 'assist', status: 'running', label: 'Reading your idea' });
    try {
      let n = 0;
      for await (const q of assistant.questions(idea.value, need())) {
        if (n === 0) {
          ideaBox?.classList.remove('reading');
          island.update('assist', { label: 'Writing your questions' });
        }
        await addQuestion(q, ++n);
      }
      island.update('assist', { status: 'done', label: `${plural(n, 'question')} for you`, detail: 'answer what you can' });
      if (draftBtn) { draftBtn.hidden = false; rise(draftBtn); }
      if (analyseLabel) analyseLabel.textContent = 'Ask again';
    } catch {
      island.update('assist', { status: 'error', label: "Couldn't read your idea", detail: 'try again in a moment', action: { label: 'Retry', onClick: askQuestions } });
    } finally {
      ideaBox?.classList.remove('reading');
      idea.readOnly = false;
      if (analyse) analyse.disabled = words() < MIN_WORDS;
      busy = false;
    }
  };

  /** The button slides from the left of the row to the right, and its label changes to what it now does. */
  const setReady = (on: boolean) => {
    if (!actions || !label || ready === on) return;
    ready = on;
    const first = button.getBoundingClientRect();
    actions.classList.toggle('ready', on);
    label.textContent = on ? 'Submit your brief' : 'Send my idea';
    if (reduce) return;
    const last = button.getBoundingClientRect();
    button.animate(
      [{ transform: `translateX(${first.left - last.left}px)`, width: `${first.width}px` }, { transform: 'none', width: `${last.width}px` }],
      { duration: 640, easing: EASE_IN_OUT },
    );
    label.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(6px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }], { duration: 300, easing: EASE_OUT, delay: 280, fill: 'backwards' });
    const note = actions.querySelector('.ready-note');
    if (on && note) rise(note, 200);
  };

  const draftBrief = async () => {
    if (!assistant || busy || !final) return;
    busy = true;
    if (draftBtn) draftBtn.disabled = true;
    const answers: Answer[] = asked.map(({ q, answer }) => ({ ...q, answer: answer.value }));
    who();
    if (dateEl) {
      const now = new Date();
      dateEl.dateTime = now.toISOString().slice(0, 10);
      dateEl.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    sectionEls.forEach((t) => { t.value = ''; autosize(t); });
    setReady(false);
    final.hidden = false;
    // the sheet unrolls from the top, then the brief is written into it
    if (!reduce) final.animate([{ clipPath: 'inset(0 0 100% 0 round 20px)' }, { clipPath: 'inset(0 0 0% 0 round 20px)' }], { duration: 700, easing: EASE_IN_OUT });
    final.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    island.set({ id: 'assist', status: 'running', label: 'Writing your brief', progress: 0 });
    const written = new Set<BriefSection>();
    let current: BriefSection | null = null;
    try {
      for await (const { section, chunk } of assistant.draft(idea.value, need(), answers)) {
        const t = sectionEls.get(section);
        if (!t) continue;
        if (section !== current) {
          if (current) form.querySelector(`[data-sec="${current}"]`)?.classList.remove('writing');
          form.querySelector(`[data-sec="${section}"]`)?.classList.add('writing');
          current = section;
          written.add(section);
          island.update('assist', { progress: (written.size - 1) / sectionEls.size });
        }
        t.value += chunk;
        autosize(t);
      }
      if (current) form.querySelector(`[data-sec="${current}"]`)?.classList.remove('writing');
      island.update('assist', {
        status: 'done', label: 'Brief ready', detail: 'review it, then submit', progress: undefined,
        action: { label: 'Review', onClick: () => final.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }) },
      });
      if (draftBtn) draftBtn.textContent = 'Redraft my brief';
      setReady(true);
    } catch {
      island.update('assist', { status: 'error', label: "Couldn't write the brief", detail: 'try again in a moment', progress: undefined, action: { label: 'Retry', onClick: draftBrief } });
    } finally {
      if (draftBtn) draftBtn.disabled = false;
      busy = false;
    }
  };

  if (assistant && assist && analyse) {
    assist.hidden = false;
    if (PREVIEW) $<HTMLElement>('[data-preview-note]')?.removeAttribute('hidden');
    idea.addEventListener('input', () => { analyse.disabled = busy || words() < MIN_WORDS; });
    analyse.addEventListener('click', askQuestions);
    draftBtn?.addEventListener('click', draftBrief);
  }

  const resetAssistant = () => {
    qs?.replaceChildren();
    asked = [];
    if (questionsBox) questionsBox.hidden = true;
    if (final) final.hidden = true;
    sectionEls.forEach((t) => { t.value = ''; });
    if (analyseLabel) analyseLabel.textContent = 'Analyse my idea';
    if (analyse) analyse.disabled = true;
    if (draftBtn) draftBtn.textContent = 'Draft my brief';
    setReady(false);
    who();
  };

  /* ---------- sending ---------- */
  const send = () => {
    const data = new FormData(form);
    data.delete('attachment');
    files.forEach((f, i) => data.append(i ? `attachment${i + 1}` : 'attachment', f, f.name));
    const id = 'send';
    const withFiles = files.length > 0;
    const what = ready ? 'brief' : 'idea';
    island.set({
      id, status: 'running', label: ready ? 'Submitting your brief' : 'Sending your idea',
      detail: withFiles ? plural(files.length, 'file') : undefined,
      progress: withFiles ? 0 : undefined,
    });
    button.disabled = true;

    post(form, data, withFiles ? (share) => island.update(id, { progress: share }) : undefined).then(() => {
      button.disabled = false;
      form.reset();
      files = [];
      renderFiles();
      resetAssistant();
      island.update(id, { status: 'done', label: what === 'brief' ? 'Brief submitted' : 'Idea sent', detail: "I'll reply by email", progress: undefined, action: undefined });
    }, (err: Error) => {
      button.disabled = false;
      island.update(id, { status: 'error', label: "Couldn't send", detail: err.message, progress: undefined, action: { label: 'Retry', onClick: send } });
    });
  };

  // the browser checks the required fields first; only a valid form gets here
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (button.disabled) return;
    send();
  });
}
