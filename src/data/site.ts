// All site content lives here. Edit this file to change text; projects live in src/content/projects.

export const person = {
  name: 'Petros Pikionis',
  role: 'AI Software Engineer',
  email: 'petrospikionis@gmail.com',
  phone: '+30 694 803 4055',
  phoneHref: 'tel:+306948034055',
  linkedin: 'https://www.linkedin.com/in/petros-platon-pikionis-4045a782/',
  // the contribution terrain is pulled from this account at build time (scripts/github.mjs)
  github: 'https://github.com/pikionis',
  location: 'Kos · Greece',
  // the portrait (public/petros.jpg): black and white in the site's ink and ivory, the shirt in the accent blue
  photo: '/petros.jpg' as string,
  // the CV for "Download CV" on /about: a PDF at this address in public/ (the button shows on the live site once
  // the file is there) [TODO: add the CV PDF]
  cv: '/petros-pikionis-cv.pdf' as string,
  // Put your logo in public/ (an SVG is best) and set this, e.g. '/logo.svg'; until then the footer sets your name
  logo: '' as string,
};

// What every page's head says by default (Base.astro); the structured data and /llms.txt build on it too
export const meta = {
  description:
    'Custom websites, web applications, e-commerce, AI search, marketing and ads — designed, built and run end to end by Petros Pikionis.',
  /** the picture a shared link shows: 1200 × 630, in public/ */
  image: '/og.png',
  imageAlt: 'The onehub logo: three loops that meet in one point. Design. Build. Automate. Scale fast.',
};

// The onehub logo: the header lockup (src/components/Logo.astro) and the opening intro (LogoIntro.astro)
export const brand = {
  name: 'onehub',
  /** what a screen reader hears for the header logo, which links home */
  homeLabel: 'onehub, home',
  /** the line under the logo: in the header, and under the logo at the end of the intro */
  motto: 'Design. Build. Automate. Scale fast.',
};

// The opening intro: one word per loop (top, left, right), the end of the line under the logo, the skip button
export const intro = {
  words: ['Design', 'Build', 'Automate'] as [string, string, string],
  /** follows the motto (brand.motto) under the intro's logo, and fades as the logo and motto fly to the header */
  tail: '— All in one.',
  skip: 'Skip intro',
};

// The site's pages, in menu order (the menu and the footer both read this). `short` is the name a phone shows.
export const pages: { href: string; name: string; short?: string }[] = [
  { href: '/', name: 'Home' },
  { href: '/services', name: 'Services' },
  { href: '/projects', name: 'Projects' },
  { href: '/about', name: 'About me', short: 'About' },
  { href: '/contact', name: 'Contact' },
  { href: '/blog', name: 'Blog' },
];

// The brief form on /contact. Until the site has its own backend it sends through FormSubmit, which
// emails each brief to you with its files attached (10 MB in total). The first send asks you to
// activate the form by email; FormSubmit then gives you a random alias you can put here instead.
export const brief = {
  formsubmit: 'petrospikionis@gmail.com',
  maxBytes: 10 * 1024 * 1024,
  needs: ['AI automation', 'AI product or bot', 'Website', 'Booking system', 'E-commerce & feeds', 'AI search & marketing', 'Not sure yet'],
};

export const hero = {
  curtain: ['Web services in', 'the era of'],
  curtainAccent: 'AI',
  headline: 'I turn ideas into working software.',
  palette:
    'Custom websites, web applications, e-commerce, and AI search — designed, built, and shipped end to end.',
  paletteKeywords: ['websites', 'applications', 'e-commerce', 'ai', 'search'],
  intro:
    "For over nine years I've designed and shipped software across startups, agencies, and a Swiss marketplace. I work end to end, so one person owns the whole thing — from the first sketch to production.",
  // the labels in the hero's corners
  corners: [
    { pos: 'tl', top: 'AI Software', bold: 'Engineering' },
    { pos: 'tr', top: 'Startup', bold: 'Enthusiast' },
    { pos: 'bl', top: 'E-commerce', bold: 'Specialist' },
    { pos: 'br', top: 'Go-to', bold: 'Market' },
  ],
  /** under the name and role beside the portrait: the link to /about */
  bio: 'My bio',
  /** "What I work on" on /about */
  areas: ['AI Software Engineering', 'Cloud & Infrastructure', 'Data Pipelines', 'Go-to Market'],
};

export const marquee = ['Web design', 'AI SaaS', 'Web applications', 'E-commerce', 'Marketplaces', 'AI search', 'Marketing & ads'];

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
  proof?: { label: string; name: string; items: string[]; link: { href: string; text: string } };
  /** its name in the story bar, where four have to fit */
  short: string;
  /** the sheet's ground: a fill token (--sheet-paper, --sheet-ink, or the -glow gradients in global.css), or an
   *  image (in public/) under a scrim of the fill that keeps the words at 4.5:1; `tone` is the words' colour */
  background: { tone: 'light' | 'dark'; fill: 'paper' | 'ink' | 'paper-glow' | 'ink-glow'; image?: string };
  /** the "What do you need?" option its story's "Start a project" pre-selects on /contact (one of brief.needs) */
  need: string;
  /** everything it covers, in full: the open /services card and llms.txt */
  includes: string[];
};

export const services: Service[] = [
  {
    key: 'web',
    title: 'Custom web & design',
    lead: 'Brand-led websites and interfaces, designed and built end to end — from wireframe to production, with AI-assisted workflows.',
    body: [
      'Visit any of them. No templates, no recycled layouts — every site starts from the business itself: its people, its place, its pace. Each one is a different concept, down to the typography, the motion and the last hover state. Nothing looks the same, because no two businesses are.',
    ],
    chips: [],
    claim: 'No templates, no recycled layouts.',
    short: 'Web & design',
    background: { tone: 'light', fill: 'paper' },
    need: 'Website',
    includes: [
      'Every site is ready for AI from day one: structured data, llms.txt, clean semantic content',
      'Built-in AI chat assistant available as an add-on',
      'Fast, accessible, multilingual',
    ],
  },
  {
    key: 'apps',
    title: 'AI SaaS & web applications',
    lead: "When a website isn't enough.",
    body: [
      'Some businesses need software that runs part of the business — taking bookings, managing properties and teams, tracking partners, answering customers at 3 a.m. I design and build these web applications end to end: data model, backend, AI features and the interface people actually use every day.',
    ],
    chips: [
      'Booking & reservations', 'Property & channel management', 'Project & task management', 'Affiliate & referral tracking',
      'AI chat assistants & bots', 'AI content & translation pipelines', 'Payments & invoicing', 'Dashboards & reporting',
      'Client portals & user roles',
    ],
    summary: 'Some businesses need software that runs part of the business — taking bookings, managing properties and teams, tracking partners, answering customers at 3 a.m.',
    short: 'AI SaaS & apps',
    background: { tone: 'dark', fill: 'ink' },
    need: 'AI product or bot',
    includes: [
      'Booking & reservation platforms connected to your chat bot, CRM and payments',
      'One system instead of five tools: bot, bookings, CRM, accounting and marketing share the same data',
      'Ask your data in plain language: “How did August compare to last year?”',
      'Demand forecasting and smart pricing suggestions',
      'Admin dashboards to run it all',
    ],
  },
  {
    key: 'commerce',
    title: 'E-commerce & marketplaces',
    lead: 'Shops that sell — and the plumbing behind them.',
    body: [
      "I build custom e-commerce with a modern, fast, conversion-focused UI/UX. But I don't stop at the storefront. As an engineer for DeinDeal, a large Swiss online marketplace, I connected small suppliers to major European marketplaces — product feeds, category mapping, pricing, orders and stock sync, at 800K+ products a day. So I know marketplaces from the inside and the outside. If you need to sell on the big ones — Amazon, Google Shopping, Skroutz or Galaxus, the Swiss marketplace — send me a message. I know this job inside out. Trust me, I'm an engineer. Hold my beer: this is my territory.",
    ],
    chips: [],
    summary: "I build custom e-commerce with a modern, fast, conversion-focused UI/UX. But I don't stop at the storefront.",
    short: 'E-commerce',
    background: { tone: 'light', fill: 'paper' },
    need: 'E-commerce & feeds',
    includes: [
      'AI product descriptions and automatic translation into 20 languages',
      'Personalised emails and offers based on what each customer bought or viewed',
      'Automated stock, price and order sync with marketplaces across Europe and Greece',
    ],
  },
  {
    key: 'search',
    title: 'AI search, marketing & ads',
    lead: 'Be the answer, not just a result.',
    body: [
      'Search is moving from ten blue links to one answer. More and more people ask ChatGPT, Claude, Gemini or Perplexity what to buy, where to stay and who to hire — and get back a short list of recommendations. The sites those answers draw from are the ones built for it: clean semantic content, structured data, fast pages, consistent business information across the web. Every site I build is ready for the AI era from day one, and I can audit yours so your business shows up when someone asks.',
      // draft: marketing & ads, from the services Petros picked (no social media ads)
      'Search is only half of it. I also run the marketing that brings people in: SEO and content that answer what your customers actually ask, Google Ads and Shopping campaigns fed straight from your product catalogue, and analytics and conversion tracking set up properly, so you can see what every campaign brings in.',
    ],
    chips: [
      'Structured data (Schema.org)', 'llms.txt', 'Semantic content & FAQs', 'Performance & Core Web Vitals',
      'Entity consistency (Google Business, directories)', 'AI visibility audits',
      'SEO & content', 'Google Ads & Shopping', 'Analytics & tracking',
    ],
    summary: 'Every site I build is ready for the AI era from day one. Around it, I run the SEO, Google Ads and tracking that bring people in.',
    proof: {
      label: 'This site',
      name: 'onehublabs.com',
      items: [
        'Structured data: Person, ProfessionalService, WebSite',
        'An llms.txt with every service and project',
        'A sitemap, and clean meta and Open Graph data on every page',
      ],
      link: { href: '/llms.txt', text: 'Read its llms.txt' },
    },
    short: 'AI search & ads',
    background: { tone: 'dark', fill: 'ink' },
    need: 'AI search & marketing',
    includes: [
      'Visibility in ChatGPT, Claude and Gemini when customers ask for recommendations',
      'Consistent business information everywhere (Google Business, directories)',
      'AI-written posts, newsletters and ad copy in your brand’s voice, approved by you',
      'Google Ads with automated A/B testing, server-side tracking and AI that shifts budget to what sells',
      'AI replies to reviews, and spots recurring complaints (“5 guests mentioned slow Wi-Fi”)',
      'Core Web Vitals in the green, solid SEO',
    ],
  },
];

/** AI services & bots: a service of its own on /services (and in llms.txt), not on the home page, where every
 *  service carries its real projects and this one has none yet. Its card works like the others'. */
export const bots = {
  key: 'bots',
  title: 'AI services & bots',
  claim: 'Answers in seconds, at any hour, in any language.',
  summary: 'AI chat that answers the questions you hear every day, takes bookings and orders, and hands over to a person when it should. And the back-office work nobody wants to do.',
  need: 'AI product or bot',
  includes: [
    '24/7 AI chat that answers the repeat questions (hours, prices, availability, order status, cancellations) instantly, in any language',
    'Works on your site, WhatsApp, Messenger, Instagram and Airbnb/Booking messages',
    'Takes action, not just answers: books appointments, checks availability, creates orders, captures leads',
    'Answers only from your own documents (FAQs, price lists, terms), so it never makes things up',
    'Hands over to a human, with the full conversation, when it’s unsure or the customer is upset',
    'Admin panel: review conversations, correct answers, see what customers ask most',
    'Automates back-office work: reads invoices, sorts emails and drafts replies, with a human approving before anything is sent',
  ],
} as const;
export type CardKey = ServiceKey | typeof bots.key;
/** The /services cards, in order. */
export const cardOrder: CardKey[] = ['web', 'bots', 'apps', 'commerce', 'search'];

/** How I work: true of every service, so it runs under the /services cards. */
export const howIWork = {
  title: 'How I work',
  steps: [
    { title: 'Find the leak', text: 'Where you lose the most time or money' },
    { title: 'Start small', text: 'One measurable pilot (e.g. a booking-questions bot)' },
    { title: 'Connect', text: 'AI plugged into the systems you already use' },
    { title: 'Stay safe', text: 'Human approval, limits, GDPR, cost control' },
    { title: 'Measure, then grow', text: 'Hours saved, conversions, then expand' },
  ],
};

/** Each service's colours (ground, ink) for its projects' title cards, here and on /projects and /services. */
export const serviceColors: Record<CardKey | 'none', [string, string]> = {
  web: ['#141414', '#f4f3ef'],
  bots: ['#cfdaf8', '#141414'],
  apps: ['#4d7cff', '#0a0b0a'],
  commerce: ['#e2e0d9', '#141414'],
  search: ['#1d3b9e', '#f4f3ef'],
  none: ['#2a2b27', '#f4f3ef'],
};

/** The accent in each /services card's drawing, chosen to read on its ground. */
export const artAccent: Record<CardKey, string> = {
  web: '#4d7cff',
  bots: '#2a55d9',
  apps: '#f4f3ef',
  commerce: '#2a55d9',
  search: '#8fb0ff',
};

// Words the service sections and project cards use around the content
export const ui = {
  work: {
    title: 'What I build',
    intro: 'Each service, and the real projects behind it.',
    allServices: 'All services',
    allProjects: 'All projects',
    /** on a phone, on the band of a service the next one has covered: back to it */
    again: 'See again',
  },
  visitSite: 'Visit site',
  /** beside the name of a project that is not live yet */
  launching: 'Launching soon',
  /** a project's live site in its card (home page): the frame's name, after the title; on a phone, the button
   *  that opens it full screen, and the one that closes it */
  live: { site: 'website', preview: 'Preview', close: 'Close preview' },
  /** under a project's own text, when it has a story to read (its page) */
  readStory: 'Read the full story of our collaboration',
  /** the service stories (src/components/Stories.astro) */
  stories: {
    readMore: 'Read more',
    /** follows "Read more" where the sheet has room for it */
    readMoreRest: ' — how I work for you',
    close: 'Close',
    start: 'Start a project',
    /** the story player: its scenes, its buttons */
    scenes: 'Scenes',
    scene: 'Scene',
    of: 'of',
    previous: 'Previous scene',
    next: 'Next scene',
    pause: 'Pause',
    play: 'Play',
    again: 'Play again',
  },
  /** under the name in the footer, after the role */
  footerLine: 'Custom websites, web applications, e-commerce, AI search, marketing and ads, designed, built and run end to end.',
  /** the heading for projects that sit outside the four services, on /projects */
  moreWork: 'More work',
  /** /projects: the panel of every project at the top, the one picked under it */
  projectsPage: {
    title: 'Projects',
    /** after the number of projects */
    lede: 'projects. Pick one for its PageSpeed results, its stack, its story and, where it is live, the site itself.',
    previous: 'Previous projects',
    more: 'More projects',
    /** the switch that shows the numbers, and the site, as a phone or a desktop gets them */
    viewAs: 'View as',
    phone: 'Phone',
    desktop: 'Desktop',
    speed: 'PageSpeed',
    scores: { performance: 'Performance', accessibility: 'Accessibility', 'best-practices': 'Best practices', seo: 'SEO' },
    vitals: 'Web Vitals',
    metrics: {
      lcp: ['LCP', 'Largest Contentful Paint'], fcp: ['FCP', 'First Contentful Paint'], tbt: ['TBT', 'Total Blocking Time'],
      cls: ['CLS', 'Cumulative Layout Shift'], si: ['SI', 'Speed Index'], inp: ['INP', 'Interaction to Next Paint'],
      ttfb: ['TTFB', 'Time to First Byte'],
    },
    verdict: { good: 'Good', average: 'Needs work', poor: 'Poor' },
    /** CrUX: what Google saw from real visitors */
    field: 'Real visitors, last 28 days',
    /** where the numbers come from: the tool, the device, the date */
    source: { pagespeed: 'PageSpeed Insights', lighthouse: 'Lighthouse' },
    measured: 'measured',
    report: 'Measure it again on PageSpeed Insights',
    stack: 'Built with',
    story: 'The story',
    /** the live site in its frame */
    site: 'The site',
    open: 'Open in a new tab',
    /** on a phone: the site full screen */
    browse: 'Browse the site',
    /** a project that is not live yet, or not ours to measure */
    soon: 'Not live yet, so there is no site to measure or browse.',
    next: 'Next',
  },
  servicesPage: {
    title: 'Services',
    hint: 'Scroll down',
    lede: 'Five things I build end to end. Open a card for everything it includes.',
    included: "What's included",
    /** the button on each card that opens it */
    open: "See what's included",
    close: 'Close',
    start: 'Start a project',
    replay: 'Play again',
    projects: 'Projects',
    end: 'Your project next.',
    cta: 'Pitch your idea',
  },
};

// The numbers on /about
export const stats = [
  { value: 800, suffix: 'K+', label: 'Products processed daily with AI' },
  { value: 6, suffix: '', label: 'Agile team members led' },
  { value: 9, suffix: '+', label: 'Years designing & shipping' },
  { value: 80, suffix: '+', label: 'Business profiles on a product I built' },
];
