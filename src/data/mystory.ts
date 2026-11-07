// "My story" on /about (src/components/MyStory.astro, src/components/MyStoryArt.astro, src/scripts/mystory.ts):
// Petros's path as a scroll-driven story. Every word is in src/text/my-story.json, in English, Greek and German; the page
// shows the site's `lang` (src/data/lang.ts). Words drawn inside the pictures (labels, code, formulas) are there too.
import { lang, t, type Lang, type Copy } from './lang';
import { aboutIntro as aboutText, scenes as scenesText, art as artText, interludes as interludesText } from '../text/my-story.json';

export { lang, t, type Lang, type Copy };

/** The top of /about: the portrait, a few lines about the work, the CV. */
export const aboutIntro = aboutText;

export type Scene = {
  id: string;
  /** the short name on the timeline rail */
  rail: Copy;
  /** the large label over the words: a year, or what the scene is about */
  label: Copy;
  title?: Copy;
  text: Copy;
  /** a client project in this stretch of time: a dot on the parallel line */
  side?: boolean;
};

export const scenes = scenesText as unknown as Scene[];

/** A comic interlude between two scenes: the little man, and what he says in his bubbles (one after another). */
export type Interlude = {
  id: string;
  /** the scene it comes before */
  before: string;
  /** the scene the timeline shows while it is on screen */
  rail: string;
  says: Copy[];
  /** what rains down on him at Reach */
  terms?: string[];
  /** the four little pictures, by name (the startup, the big league) */
  panels?: Copy[];
  /** the AI lab: what it runs on, the prompt typed, the agents and the one that runs them */
  chips?: string[];
  prompt?: Copy;
  orchestrator?: Copy;
  agents?: Copy[];
};
export const interludes = interludesText as unknown as Interlude[];

/** The words drawn inside the scenes, by scene. */
export const art = artText;
