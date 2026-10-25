// /llms.txt (https://llmstxt.org): the site in plain Markdown for language models — who, the services with
// their projects, and how to get in touch. Built from the same data as the pages, so it never drifts.
import type { APIRoute } from 'astro';
import { person, meta, hero, pages, brand, bots, cardOrder } from '../data/site';
import { servicesWithProjects, otherProjects, type ProjectEntry } from '../data/projects';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://onehublabs.com')).origin;
  const project = (p: ProjectEntry) => {
    const live = p.data.url ? ` Live site: ${p.data.url}` : '';
    const badge = p.data.badge ? ` (${p.data.badge})` : '';
    return `- [${p.data.title}](${origin}/projects?project=${p.id}): ${p.data.summary}${badge}${live}`;
  };
  const services = await servicesWithProjects();
  const others = await otherProjects();
  // in the order of the /services cards, AI services & bots among them
  const offer = cardOrder.map((key) => services.find((s) => s.key === key) ?? bots);
  const includes = (list: readonly string[]) => [...list.map((x) => `- ${x}`), ''];

  const out = [
    `# ${person.name} (${brand.name})`,
    '',
    `> ${meta.description}`,
    '',
    `${person.name} is an ${person.role} based in ${person.location.replace(' · ', ', ')}. ${hero.intro}`,
    '',
    '## Services',
    '',
    ...offer.flatMap((s) => ('body' in s ? [
      `### ${s.title}`,
      '',
      s.lead,
      '',
      ...s.body.flatMap((b) => [b, '']),
      ...includes(s.includes),
      ...(s.chips.length ? [`Also: ${s.chips.join('; ')}.`, ''] : []),
      ...(s.projects.length ? [...s.projects.map(project), ''] : []),
      ...(s.proof ? [`${s.proof.label} (${s.proof.name}): ${s.proof.items.join('; ')}.`, ''] : []),
    ] : [`### ${s.title}`, '', s.summary, '', ...includes(s.includes)])),
    ...(others.length ? ['## More work', '', ...others.map(project), ''] : []),
    '## Pages',
    '',
    ...pages.map(({ href, name }) => `- [${name}](${origin}${href === '/' ? '/' : `${href}/`})`),
    '',
    '## Contact',
    '',
    `- Email: ${person.email}`,
    `- Phone: ${person.phone}`,
    `- [LinkedIn](${person.linkedin})`,
    `- [GitHub](${person.github})`,
    `- Brief form: ${origin}/contact/`,
    '',
  ];
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
