import { getCollection, type CollectionEntry } from 'astro:content';
import { lang } from './lang';

export type Post = CollectionEntry<'blog'>;

/** The published posts, newest first (drafts show while developing, never on the live site), each in this build's
 *  language where it has been translated (src/content/blog/el/<id>.md, .../de/<id>.md). */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  const translated = new Map((await getCollection('postText')).map((e) => [e.id, e]));
  return all
    .map((p) => {
      const tr = lang === 'en' ? undefined : translated.get(`${lang}/${p.id}`);
      if (!tr) return p;
      const words = Object.fromEntries(Object.entries(tr.data).filter(([, v]) => v));
      return { ...p, data: { ...p.data, ...words }, ...(tr.body?.trim() ? { body: tr.body, rendered: tr.rendered } : {}) };
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
