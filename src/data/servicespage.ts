// The shape of /services (src/pages/services.astro); every word is in src/text/services-page.json, in English, Greek
// and German, and the page shows the site's `lang` (src/data/lang.ts). The four services here are the same four as the home page's (site.ts keys),
// told for someone who doesn't know the technical name of what they need. Words drawn inside the pictures are
// in `art`. Proof is never invented: a proof card names a real project, and one without an address has no link.
import type { Copy } from './lang';
import type { ServiceKey } from './site';

export type Proof = {
  /** a project in src/content/projects: its capture (public/projects/thumbs/<id>.webp) becomes the picture */
  project?: string;
  /** a plain string where the name is the same in every language */
  name: Copy | string;
  line: Copy;
  /** where the card leads: the project's page, or a site; null hides the link */
  url: string | null;
  /** the line drawing that stands in for a picture when there is no capture */
  icon?: 'gear' | 'cards' | 'sail' | 'gauge';
};

export type ServiceSection = {
  key: ServiceKey;
  title: Copy;
  /** its name where it has to be short: the form, the timelines, the picker */
  short: Copy;
  promise: Copy;
  /** a paragraph before the list (only where the service needs explaining) */
  intro?: Copy;
  bullets: Copy[];
  /** the label over the chips, and the chips: who this is for, so a visitor recognises themselves */
  chipsLabel: Copy;
  chips: Copy[];
  proof: Proof[];
  timeline: Copy;
  /** the timeline on a scale of weeks (/services "Timelines and prices"); `then` is what follows it, in phases */
  weeks: [number, number];
  then?: Copy;
  /** the price line: hidden while null [TODO: prices, when Petros sets them] */
  startingFrom: Copy | null;
  cta: Copy;
};

import { servicesPage as pageText } from '../text/services-page.json';

export const servicesPage = pageText as unknown as typeof pageText & { sections: ServiceSection[] };
