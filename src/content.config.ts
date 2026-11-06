// Projects and blog posts are Markdown files: one file per entry in src/content/<collection>/.
// Files starting with "_" (the templates) are ignored.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// keys match `services` in src/data/site.ts; a project shows under every service it lists, and one that
// lists none still shows on /projects, under "More work"
const service = z.enum(['web', 'apps', 'commerce', 'search']);

const projects = defineCollection({
  loader: glob({ pattern: '[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    services: z.array(service).default([]),
    tags: z.array(z.string()).default([]),
    // what it is built with, shown on /projects
    stack: z.array(z.string()).default([]),
    url: z.string().url().optional(),
    // the live site, shown in the box of its card on the home page (scaled from 1440px wide) in place of
    // the picture; the site must allow being framed (no X-Frame-Options / frame-ancestors against us)
    live_url: z.string().url().optional(),
    // the project's own text on its service's sheet (Custom web & design shows it beside the projects)
    blurb: z.string().optional(),
    // a small label beside the name, e.g. "Launching soon"
    badge: z.string().optional(),
    // not live yet: "Launching soon", and no link, live frame or measurements until it is
    launching: z.boolean().default(false),
    // engineering work shows its figure and scope on its card instead of a picture
    metric: z.object({ value: z.string(), label: z.string() }).optional(),
    scope: z.array(z.string()).optional(),
    // its picture (an image in public/ or a URL): a tall capture of the site works best, its top shows on the
    // /projects panel and a hover runs down it; without one the project gets a typeset title card
    cover: z.string().optional(),
    // the design video shown when the project is opened (mp4/webm in public/ or a URL)
    video: z.string().optional(),
    // lower comes first within a service
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

// A project in another language: only its words (src/content/projects/el/<id>.md), the body being its story.
const projectText = defineCollection({
  loader: glob({ pattern: '{el,de}/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    summary: z.string().optional(),
    blurb: z.string().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metric: z.object({ value: z.string(), label: z.string() }).optional(),
    scope: z.array(z.string()).optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

// A post in another language (src/content/blog/el/<id>.md); what it leaves out stays as in the English file.
const postText = defineCollection({
  loader: glob({ pattern: '{el,de}/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({ title: z.string().optional(), description: z.string().optional() }),
});

export const collections = { projects, projectText, blog, postText };
