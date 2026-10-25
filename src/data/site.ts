// All site content lives here. Edit this file to change text, projects or brands.

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
  // Put a portrait at public/petros.jpg and set this to '/petros.jpg'
  photo: '' as string,
  // Put your logo in public/ (an SVG is best) and set this, e.g. '/logo.svg'; until then the footer sets your name
  logo: '' as string,
};

// What every page's head says by default (Base.astro); the structured data and /llms.txt build on it too
export const meta = {
  description:
    'Custom websites, web applications, e-commerce and AI search visibility — designed, built and shipped end to end by Petros Pikionis.',
  /** the picture a shared link shows: 1200 × 630, in public/ */
  image: '/og.png',
  imageAlt: 'The onehub logo: three loops that meet in one point. Design. Build. Automate.',
};

// The onehub logo: the header lockup (src/components/Logo.astro) and the opening intro (LogoIntro.astro)
export const brand = {
  name: 'onehub',
  /** what a screen reader hears for the header logo, which links home */
  homeLabel: 'onehub, home',
};

// The opening intro: one word per loop (top, left, right), the line under the logo, the skip button
export const intro = {
  words: ['Design', 'Build', 'Automate'] as [string, string, string],
  line: 'Design. Build. Automate. — All in one.',
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
  needs: ['AI automation', 'AI product or bot', 'Website', 'Booking system', 'E-commerce & feeds', 'Not sure yet'],
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
  corners: [
    { pos: 'tl', top: 'AI Software', bold: 'Engineering' },
    { pos: 'tr', top: 'Cloud &', bold: 'Infrastructure' },
    { pos: 'bl', top: 'Data', bold: 'Pipelines' },
    { pos: 'br', top: 'Go-to', bold: 'Market' },
  ],
};

export const marquee = ['Web design', 'AI SaaS', 'Web applications', 'E-commerce', 'Marketplaces', 'AI search'];

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
  },
  {
    key: 'search',
    title: 'AI search & visibility',
    lead: 'Be the answer, not just a result.',
    body: [
      'Search is moving from ten blue links to one answer. More and more people ask ChatGPT, Claude, Gemini or Perplexity what to buy, where to stay and who to hire — and get back a short list of recommendations. The sites those answers draw from are the ones built for it: clean semantic content, structured data, fast pages, consistent business information across the web. Every site I build is ready for the AI era from day one, and I can audit yours so your business shows up when someone asks.',
    ],
    chips: [
      'Structured data (Schema.org)', 'llms.txt', 'Semantic content & FAQs', 'Performance & Core Web Vitals',
      'Entity consistency (Google Business, directories)', 'AI visibility audits',
    ],
    summary: 'Every site I build is ready for the AI era from day one, and I can audit yours so your business shows up when someone asks.',
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
  },
];

/** Each service's colours (ground, ink) for its projects' title cards, here and on /projects and /services. */
export const serviceColors: Record<ServiceKey | 'none', [string, string]> = {
  web: ['#141414', '#f4f3ef'],
  apps: ['#4d7cff', '#0a0b0a'],
  commerce: ['#e2e0d9', '#141414'],
  search: ['#1d3b9e', '#f4f3ef'],
  none: ['#2a2b27', '#f4f3ef'],
};

// Words the service sections and project cards use around the content
export const ui = {
  work: {
    title: 'What I build',
    intro: 'Each service, and the real projects behind it.',
    allServices: 'All services',
    allProjects: 'All projects',
  },
  visitSite: 'Visit site',
  /** under the name in the footer, after the role */
  footerLine: 'Custom websites, web applications, e-commerce and AI search visibility, designed, built and shipped end to end.',
  /** the heading for projects that sit outside the four services, on /projects */
  moreWork: 'More work',
  servicesPage: {
    title: 'Services',
    hint: 'Scroll down',
    lede: 'Four things I build end to end, each with the real projects behind it.',
    included: "What's included",
    projects: 'Projects',
    end: 'Your project next.',
    cta: 'Pitch your idea',
  },
};

// url: '' hides the "Visit site" button. video: vertical mp4 path (e.g. '/videos/arogi.mp4') or ''.
export type Brand = { name: string; cat: string; desc: string; url: string; video: string };

export const brands: Brand[] = [
  { name: 'Arogi Kos', cat: 'Web design', desc: 'Brand-led website designed with Claude Design and built with AI-assisted development.', url: 'https://arogikos.gr', video: '' },
  { name: 'Archon Yachting', cat: 'Booking engine', desc: 'Yacht charter platform with a booking system and online payments.', url: '', video: '' },
  { name: 'La Islakos', cat: 'Web · Store', desc: 'Brand site with a small online store.', url: 'https://la-islakos.gr', video: '' },
  { name: 'Kalimera', cat: 'Product', desc: 'Travel app, concept to launch — 80+ business profiles, Flutter.', url: '', video: '' },
  { name: 'Feedgenix', cat: 'AI SaaS', desc: 'AI translation and feed engine: 6 stages, 220K SKUs, multi-provider routing.', url: 'https://feedgenix.com', video: '' },
  { name: 'DeinDeal', cat: 'AI · Data', desc: 'Internal AI product for partner data — 800K+ products daily.', url: 'https://deindeal.ch', video: '' },
  { name: 'Galaxus', cat: 'Integration', desc: 'Marketplace integration with AI category matching.', url: '', video: '' },
  { name: 'Skroutz', cat: 'Marketplace', desc: 'Automated product feed integration.', url: '', video: '' },
  { name: 'Amazon', cat: 'Marketplace', desc: 'Product feeds via automated XML.', url: '', video: '' },
  { name: 'Google', cat: 'Merchant', desc: 'Google Merchant feed integration.', url: '', video: '' },
];

export const stats = [
  { value: 800, suffix: 'K+', label: 'Products processed daily with AI' },
  { value: 6, suffix: '', label: 'Agile team members led' },
  { value: 9, suffix: '+', label: 'Years designing & shipping' },
  { value: 80, suffix: '+', label: 'Business profiles on a product I built' },
];
