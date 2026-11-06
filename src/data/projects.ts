import { getCollection, type CollectionEntry } from 'astro:content';
import { services, ui } from './site';
import { lang, to } from './lang';

export type ProjectEntry = CollectionEntry<'projects'>;

// drafts show while developing, never on the live site
const published = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

// A project's translations are files of their own (src/content/projects/el/<id>.md, .../de/<id>.md) holding only what
// is written in words; what they leave out stays as in the English file.
const translations = async () => new Map((await getCollection('projectText')).map((e) => [e.id, e]));
const inThisLanguage = (all: Awaited<ReturnType<typeof translations>>) => (p: ProjectEntry): ProjectEntry => {
  const tr = lang === 'en' ? undefined : all.get(`${lang}/${p.id}`);
  if (!tr) return p;
  const words = Object.fromEntries(Object.entries(tr.data).filter(([, v]) => v !== undefined));
  return { ...p, data: { ...p.data, ...words }, ...(tr.body?.trim() ? { body: tr.body, rendered: tr.rendered } : {}) };
};

export async function getProjects() {
  const all = (await getCollection('projects', published)).map(inThisLanguage(await translations()));
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

/** The services in page order, each carrying its projects. */
export async function servicesWithProjects() {
  const all = await getProjects();
  return services.map((s) => ({ ...s, projects: all.filter((p) => p.data.services.includes(s.key)) }));
}

/** Projects outside the four services: they stay on /projects, under "More work". */
export async function otherProjects() {
  return (await getProjects()).filter((p) => !p.data.services.length);
}

/** Every project in the order /projects shows them: the services' projects in page order, then the rest. */
export async function projectsInOrder() {
  const grouped = (await servicesWithProjects()).flatMap((s) => s.projects);
  return [...new Set([...grouped, ...(await otherProjects())])];
}

/** Whether a project has written text (the home page links to it as its story). */
export const hasStory = (p: ProjectEntry) => !!p.body?.replace(/<!--[\s\S]*?-->/g, '').trim();

/** Its page on /projects. */
export const projectHref = (p: ProjectEntry) => to(`/projects/${p.id}`);

/** The live site to visit: none while it is still launching. */
export const visitUrl = (p: ProjectEntry) => (p.data.launching ? undefined : p.data.url);

/** The label beside its name. */
export const badgeOf = (p: ProjectEntry) => p.data.badge ?? (p.data.launching ? ui.launching : undefined);
