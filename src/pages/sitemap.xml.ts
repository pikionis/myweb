// /sitemap.xml: every page, every project with a page of its own, every published post.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pages } from '../data/site';
import { getProjects, hasStory } from '../data/projects';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://onehublabs.com')).origin;
  const projects = (await getProjects()).filter(hasStory).map((p) => `/projects/${p.id}/`);
  const posts = (await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft)).map((p) => `/blog/${p.id}/`);
  const paths = [...pages.map(({ href }) => (href === '/' ? '/' : `${href}/`)), ...projects, ...posts];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
