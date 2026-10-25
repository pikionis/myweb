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

export const stories: Story[] = [
  {
    service: 'web',
    id: 'story-web',
    title: 'How we work together',
    scenes: [
      { title: 'Intro', art: 'meet', text: "Every great website starts with a conversation. Here's how we'll build yours." },
      {
        title: 'Your brand', art: 'brand',
        text: "Already have a logo and brand material? Send it over and we'll build on it. Starting from scratch? My partners and I will shape it with you — colour palette, brand design, brand awareness — until it feels like you.",
      },
      { title: 'Choose a direction', art: 'directions', text: 'I design 3–4 different directions for your site. You pick the one that fits — or we combine the best of each.' },
      { title: 'We agree', art: 'agree', text: 'We lock in the content, the services or products you want to sell, and the final design. No surprises later.' },
      { title: 'I build it', art: 'build-site', text: 'Then I build your one-of-a-kind website — fast, responsive, ready for search and AI from day one.' },
      {
        title: 'Simple, fair payment', art: 'payment',
        text: "30% to start. 40% on delivery. 30% one month later — after we've fine-tuned everything and added whatever new ideas you've had.",
      },
    ],
    cta: { text: 'Ready to start yours?' },
  },
  {
    service: 'apps',
    id: 'story-saas',
    title: 'From idea to MVP',
    scenes: [
      { title: 'The idea', art: 'idea', text: "You've got an idea. A startup concept. A solution to a real problem — and you want to turn it into a working application." },
      { title: 'Pitch me', art: 'pitch', text: 'Pitch it to me. Send a brief — a few lines is enough to begin.' },
      {
        title: 'Cost & time, upfront', art: 'estimate',
        text: "I'll estimate your idea: what it will cost and how long it will take. Then we sit down together and shape it — which features, which services, what matters for launch and what can wait.",
      },
      { title: 'Your roadmap', art: 'roadmap', text: 'You get a clear roadmap of the services and features, phase by phase, plus the branding to make it look like a real product from day one.' },
      { title: 'I build it', art: 'app', text: "I build the application itself — and the admin dashboard you'll use to run it: users, content, data, settings." },
      { title: 'Launch', art: 'launch', text: 'Your MVP goes live. Real users, real feedback — and a solid base to grow on.' },
    ],
    cta: { text: 'Got an idea? Send me the brief.', note: '[TODO: payment terms for apps — confirm or remove]' },
  },
  {
    service: 'commerce',
    id: 'story-ecommerce',
    title: 'Zero to hero',
    scenes: [
      { title: 'Start', art: 'shopfront', text: "From zero to hero — step by step, I'll guide you." },
      { title: 'Your store', art: 'store', text: 'I design and build your e-shop: custom, modern, made to sell.' },
      {
        title: 'Your products, loaded', art: 'catalogue',
        text: 'Send me your product data — spreadsheets, supplier feeds, whatever you have. I bring the whole catalogue into your shop, clean and structured.',
      },
      {
        title: 'Sell on the big marketplaces', art: 'marketplaces',
        text: 'Then I connect you to the major marketplaces in Europe and Greece, so you sell there automatically — stock, prices and orders in sync.',
      },
      {
        title: '20 languages, 5 countries', art: 'globe',
        text: 'Your products are translated automatically into up to 20 languages, so you can sell in 5 countries — or more — if you want to.',
      },
      {
        title: 'Scale', art: 'scale',
        text: "The bigger you are, the easier it gets. I've done this at marketplace scale — 800K+ products a day — so your catalogue is in safe hands.",
      },
    ],
    cta: { text: "Let's get your products selling." },
  },
  {
    service: 'search',
    id: 'story-ai-search',
    title: 'Be found in the AI era',
    scenes: [
      {
        title: 'The shift', art: 'shift',
        text: 'People are moving from scrolling search results to asking AI. ChatGPT, Claude and Gemini now recommend businesses — the question is whether they recommend yours.',
      },
      {
        title: 'AI-ready', art: 'ai-ready',
        text: 'I make your site readable and trustworthy for large language models: structured data, clean content, llms.txt, consistent business information across the web.',
      },
      { title: 'Speed', art: 'speed', text: 'Performance tuned to the top: Core Web Vitals in the green and Lighthouse scores aiming for 100 across the board.' },
      { title: 'SEO', art: 'seo', text: 'Solid technical and content SEO, so you rank in classic search too.' },
      {
        title: 'Ads with AI', art: 'ads',
        text: "Google Ads campaigns built with AI automation, with precise tracking and AI agents I've built and tuned to optimise for conversions.",
      },
    ],
    cta: { text: 'Want to know how visible you are to AI? Ask for an audit.' },
  },
];
