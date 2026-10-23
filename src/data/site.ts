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
    'Custom websites, e-commerce, booking systems, and AI services — designed, built, and shipped end to end.',
  paletteKeywords: ['websites', 'e-commerce', 'booking', 'ai'],
  intro:
    "For over nine years I've designed and shipped software across startups, agencies, and a Swiss marketplace. I work end to end, so one person owns the whole thing — from the first sketch to production.",
  corners: [
    { pos: 'tl', top: 'AI Software', bold: 'Engineering' },
    { pos: 'tr', top: 'Cloud &', bold: 'Infrastructure' },
    { pos: 'bl', top: 'Data', bold: 'Pipelines' },
    { pos: 'br', top: 'Go-to', bold: 'Market' },
  ],
};

export const marquee = ['Web design', 'AI services', 'Booking systems', 'E-commerce', 'Integrations', 'AI bots'];

// Projects themselves live in src/content/projects/*.md; each lists the service keys it belongs to.
export type Service = {
  key: 'web' | 'ai' | 'booking' | 'commerce' | 'data';
  title: string;
  /** short name, above the claim on /services */
  label: string;
  headline: string;
  desc: string;
  /** what the service covers, listed on its /services card */
  includes: string[];
};

export const services: Service[] = [
  {
    key: 'web',
    label: 'Web & design',
    // draft copy: the claim on this service's card on /services
    headline: 'Brand-led websites, designed and built end to end',
    includes: ['Brand-led design', 'Wireframe to production', 'AI-assisted build', 'CMS sites (Statamic)', 'Small online stores'],
    title: 'Custom web & design',
    desc: 'Brand-led websites and interfaces designed and built end to end — from wireframe to production, with AI-assisted workflows.',
  },
  {
    key: 'ai',
    label: 'AI services & bots',
    // draft copy: the claim on this service's card on /services
    headline: 'LLM features that hold up in production',
    includes: ['Structured outputs', 'Multi-model routing', 'Cost optimisation', 'Review workflows', 'Customer-facing AI bots'],
    title: 'AI services & bots',
    desc: 'LLM features end to end — structured outputs, multi-model routing, cost optimisation, review workflows, and customer-facing AI bots.',
  },
  {
    key: 'booking',
    label: 'Booking systems',
    // draft copy: the claim on this service's card on /services
    headline: 'Bookings, payments and the operation behind them',
    includes: ['Availability and calendars', 'Online payments', 'Airbnb and Booking.com', 'The day-to-day operation'],
    title: 'Booking systems',
    desc: 'Reservation and booking platforms with availability, payments, and the operation running behind them.',
  },
  {
    key: 'commerce',
    label: 'E-commerce & marketplaces',
    // draft copy: the claim on this service's card on /services
    headline: 'Your catalogue on every marketplace that matters',
    includes: ['Product feeds', 'Catalogue mapping', 'Pricing automation', 'Skroutz, Amazon, Google Merchant', 'AI category matching'],
    title: 'E-commerce & marketplaces',
    desc: 'Storefronts and integrations with the big marketplaces — product feeds, catalogue mapping, pricing automation.',
  },
  {
    key: 'data',
    label: 'Data & infrastructure',
    // draft copy: the claim on this service's card on /services
    headline: 'Pipelines and servers that keep it all running',
    includes: ['ETL and feed pipelines', 'Data quality', 'Linux and Docker', 'CI/CD', 'Queues and background workers'],
    title: 'Data & infrastructure',
    desc: 'ETL and feed pipelines, data quality, and the cloud infrastructure that keeps it all running — Linux, Docker, CI/CD.',
  },
];

// url: '' hides the "Visit site" button. video: vertical mp4 path (e.g. '/videos/arogi.mp4') or ''.
export type Brand = { name: string; cat: string; desc: string; url: string; video: string };

export const brands: Brand[] = [
  { name: 'Arogi Kos', cat: 'Web design', desc: 'Brand-led website designed with Claude Design and built with AI-assisted development.', url: '', video: '' },
  { name: 'Archon Yachting', cat: 'Booking engine', desc: 'Yacht charter platform with a booking system and online payments.', url: '', video: '' },
  { name: 'La Islakos', cat: 'Web · Store', desc: 'Brand site with a small online store.', url: '', video: '' },
  { name: 'Kalimera', cat: 'Product', desc: 'Travel app, concept to launch — 80+ business profiles, Flutter.', url: '', video: '' },
  { name: 'Feed Intelligence', cat: 'AI SaaS', desc: '6-stage AI translation engine, 220K SKUs, multi-provider routing.', url: '', video: '' },
  { name: 'DeinDeal', cat: 'AI · Data', desc: 'Internal AI product for partner data — 800K+ products daily.', url: '', video: '' },
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
