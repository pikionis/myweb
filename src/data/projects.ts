import { getCollection, type CollectionEntry } from 'astro:content';
import { services, bots, cardOrder, ui, type CardKey, type Service } from './site';

export type ProjectEntry = CollectionEntry<'projects'>;

// drafts show while developing, never on the live site
const published = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

export async function getProjects() {
  const all = await getCollection('projects', published);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

/** The services in page order, each carrying its projects. */
export async function servicesWithProjects() {
  const all = await getProjects();
  return services.map((s) => ({ ...s, projects: all.filter((p) => p.data.services.includes(s.key)) }));
}

/** What a /services card shows. */
export type ServiceCard = Pick<Service, 'title' | 'need' | 'claim' | 'summary' | 'proof'> & {
  key: CardKey; lead?: string; includes: readonly string[]; projects: ProjectEntry[];
};

/** The /services cards in their order: the four services with their projects, and AI services & bots. */
export async function serviceCards(): Promise<ServiceCard[]> {
  const withProjects = await servicesWithProjects();
  return cardOrder.map((key) => withProjects.find((s) => s.key === key) ?? { ...bots, projects: [] });
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
export const projectHref = (p: ProjectEntry) => `/projects/${p.id}`;

/** The live site to visit: none while it is still launching. */
export const visitUrl = (p: ProjectEntry) => (p.data.launching ? undefined : p.data.url);

/** The label beside its name. */
export const badgeOf = (p: ProjectEntry) => p.data.badge ?? (p.data.launching ? ui.launching : undefined);
