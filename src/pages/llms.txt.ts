// /llms.txt (https://llmstxt.org): the site in plain Markdown for language models — who, the services with
// their projects, and how to get in touch. Built from the same data as the pages, so it never drifts.
import type { APIRoute } from 'astro';
import { person, meta, hero, pages, brand, bots, cardOrder } from '../data/site';
import { servicesWithProjects, otherProjects, visitUrl, badgeOf, projectHref, type ProjectEntry } from '../data/projects';
import { servicesPage } from '../data/servicespage';
import { t } from '../data/lang';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://onehublabs.com')).origin;
  const project = (p: ProjectEntry) => {
    const live = visitUrl(p) ? ` Live site: ${visitUrl(p)}` : '';
    const badge = badgeOf(p) ? ` (${badgeOf(p)})` : '';
    const stack = p.data.stack.length ? ` Built with ${p.data.stack.join(', ')}.` : '';
    return `- [${p.data.title}](${origin}${projectHref(p)}/): ${p.data.summary}${badge}${stack}${live}`;
  };
  const services = await servicesWithProjects();
  const others = await otherProjects();
  // the four services, and AI services & bots among them
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
    // what /services says about timelines and how we work, and its questions and answers
    '## Timelines',
    '',
    ...servicesPage.sections.map((s) => `- ${t(s.title)}: ${t(s.timeline)}`),
    '',
    '## How we work',
    '',
    ...servicesPage.how.steps.map((st, i) => `${i + 1}. ${t(st.title)}${st.note ? ` (${t(st.note)})` : ''}`),
    '',
    '## Questions',
    '',
    ...servicesPage.faq.items.flatMap((i) => [`### ${t(i.q)}`, '', t(i.a), '']),
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
