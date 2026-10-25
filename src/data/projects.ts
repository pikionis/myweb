import { getCollection, type CollectionEntry } from 'astro:content';
import { services, bots, cardOrder, type CardKey, type Service } from './site';

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

/** Only projects with written text get a page of their own. */
export const hasStory = (p: ProjectEntry) => !!p.body?.trim();
