// /sitemap.xml: every page, every project (each has a page of its own), every published post, in every language, each
// naming its versions in the others. It exists once, at the root (scripts/build.mjs).
import type { APIRoute } from 'astro';
import { getPosts } from '../data/posts';
import { pages } from '../data/site';
import { getProjects } from '../data/projects';
import { LANGS, inLang, unlocalized } from '../data/lang';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://onehublabs.com')).origin;
  const projects = (await getProjects()).map((p) => `/projects/${p.id}/`);
  const posts = (await getPosts()).map((p) => `/blog/${p.id}/`);
  const paths = [...pages.map(({ href }) => (href === '/' ? '/' : `${unlocalized(href)}/`)), ...projects, ...posts];
  const url = (path: string, code: typeof LANGS[number]['code']) => {
    const others = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l.code}" href="${origin}${inLang(l.code, path)}"/>`).join('');
    return `  <url><loc>${origin}${inLang(code, path)}</loc>${others}</url>`;
  };
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...paths.flatMap((p) => LANGS.map((l) => url(p, l.code))),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
