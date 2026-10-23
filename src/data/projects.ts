import { getCollection, type CollectionEntry } from 'astro:content';
import { services } from './site';

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

/** Only projects with written text get a page of their own. */
export const hasStory = (p: ProjectEntry) => !!p.body?.trim();
