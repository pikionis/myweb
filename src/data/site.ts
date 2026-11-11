// The site's words and settings are in src/text/site.json (the admin panel, /admin, edits that file); this module gives
// them their types and holds what is code. A word is written { en, el, de } there and a plain string here: the build has
// picked its language (`localize` in astro.config.mjs). Projects live in src/content/projects.
import {
  person as personText, meta as metaText, brand as brandText, intro as introText, pages as pagesText, brief as briefText,
  hero as heroText, marquee as marqueeText, services as servicesText, bots as botsText, ui as uiText, stats as statsText,
  words as wordsText,
} from '../text/site.json';

/** A text file's shape, once the build has picked its language. */
type Words<T> = T extends { en: string } ? string
  : T extends readonly (infer U)[] ? Words<U>[]
  : T extends object ? { [K in keyof T]: Words<T[K]> } : T;

export const person = personText as unknown as Words<typeof personText> & { logo: string };
export const meta = metaText as unknown as Words<typeof metaText>;
export const brand = brandText as unknown as Words<typeof brandText>;
export const intro = introText as unknown as Omit<Words<typeof introText>, 'words'> & { words: [string, string, string] };
export const pages = pagesText as unknown as { href: string; name: string; short?: string }[];
export const brief = briefText as unknown as Omit<Words<typeof briefText>, 'needs'> & { needs: { key: string; label: string }[] };
export const hero = heroText as unknown as Words<typeof heroText>;
export const marquee = marqueeText as unknown as string[];
export const ui = uiText as unknown as Words<typeof uiText>;
export const stats = statsText as unknown as Words<typeof statsText>;
/** The words that sit around the content: the footer, the forms, the page titles. */
export const words = wordsText as unknown as Words<typeof wordsText>;

// The four services. Projects live in src/content/projects/*.md and list the service keys they show under.
export type ServiceKey = 'web' | 'apps' | 'commerce' | 'search';
export type Service = {
  key: ServiceKey;
  title: string;
  /** the first line under the title on the home page */
  lead: string;
  /** the paragraphs after it */
  body: string[];
  /** what it covers, as chips (home page and the /services card) */
  chips: string[];
  /** the claim on its /services card (the lead if not set) */
  claim?: string;
  /** the sentence under the claim on its /services card (the lead if not set) */
  summary?: string;
  /** a card of evidence in place of projects: what this very site does */
  /** a card of its own for a service without projects: `live` is a page of this site, shown live in it */
  proof?: { label: string; name: string; items: string[]; link: { href: string; text: string }; live?: string };
  /** its name in the story bar, where four have to fit */
  short: string;
  /** the sheet's ground: a fill token (--sheet-paper, --sheet-ink, or the -glow gradients in global.css), or an
   *  image (in public/) under a scrim of the fill that keeps the words at 4.5:1; `tone` is the words' colour */
  background: { tone: 'light' | 'dark'; fill: 'paper' | 'ink' | 'paper-glow' | 'ink-glow'; image?: string };
  /** the key of the "What do you need?" option its story's "Start a project" pre-selects on /contact (brief.needs) */
  need: string;
  /** everything it covers, in full: the open /services card and llms.txt */
  includes: string[];
};

export const services = servicesText as unknown as Service[];

/** AI services & bots: a service of its own in llms.txt, not on the home page, where every service carries its real
 *  projects and this one has none yet (on /services, its chat and automation are part of AI SaaS & Mobile Apps). */
export const bots = botsText as unknown as { key: 'bots'; title: string; claim: string; summary: string; need: string; includes: string[] };
export type CardKey = ServiceKey | typeof bots.key;
/** The order llms.txt lists the services in. */
export const cardOrder: CardKey[] = ['web', 'bots', 'apps', 'commerce', 'search'];

/** Each service's colours (ground, ink) for its projects' title cards, on the home page and /projects. */
export const serviceColors: Record<CardKey | 'none', [string, string]> = {
  web: ['#141414', '#f4f3ef'],
  bots: ['#cfdaf8', '#141414'],
  apps: ['#4d7cff', '#0a0b0a'],
  commerce: ['#e2e0d9', '#141414'],
  search: ['#1d3b9e', '#f4f3ef'],
  none: ['#2a2b27', '#f4f3ef'],
};


