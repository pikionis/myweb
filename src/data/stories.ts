// The service stories on the home page: one per service, opened from its sheet's "Read more". Each scene is
// a line of the story with its illustration (src/components/StoryArt.astro draws them by `art` name).
import type { ServiceKey } from './site';

export type Scene = { title: string; text: string; art: string };
export type Story = {
  service: ServiceKey;
  /** the address that opens it directly: /#story-web */
  id: string;
  title: string;
  scenes: Scene[];
  cta: { text: string; note?: string };
};

import { stories as storiesText } from '../text/stories.json';

export const stories = storiesText as unknown as Story[];
