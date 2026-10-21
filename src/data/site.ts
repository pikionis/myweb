// All site content lives here. Edit this file to change text, projects or brands.

export const person = {
  name: 'Petros Pikionis',
  role: 'AI Software Engineer',
  email: 'petrospikionis@gmail.com',
  phone: '+30 694 803 4055',
  phoneHref: 'tel:+306948034055',
  linkedin: 'https://www.linkedin.com/in/petros-platon-pikionis-4045a782/',
  location: 'Kos · Greece',
  // Put a portrait at public/petros.jpg and set this to '/petros.jpg'
  photo: '' as string,
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

export type Project = { name: string; meta: string; tags: string };
export type Service = { title: string; desc: string; projects: Project[] };

export const services: Service[] = [
  {
    title: 'Custom web & design',
    desc: 'Brand-led websites and interfaces designed and built end to end — from wireframe to production, with AI-assisted workflows.',
    projects: [
      { name: 'Arogi Kos', meta: 'Brand-led website, designed with Claude Design and AI-assisted build.', tags: 'Web design · Statamic' },
      { name: 'La Islakos', meta: 'Brand site with a small online store.', tags: 'Web · E-commerce' },
      { name: 'Arangia', meta: 'Property brand site tied to the booking operation.', tags: 'Web design' },
    ],
  },
  {
    title: 'AI services & bots',
    desc: 'LLM features end to end — structured outputs, multi-model routing, cost optimisation, review workflows, and customer-facing AI bots.',
    projects: [
      { name: 'Feed Intelligence', meta: '6-stage AI translation engine, 220K SKUs, multi-provider routing.', tags: 'AI SaaS · Laravel' },
      { name: 'DeinDeal AI product', meta: 'Internal AI product for partner data — 800K+ products daily.', tags: 'LLM · React' },
      { name: 'Category matching', meta: 'AI product category matching engine for marketplace integration.', tags: 'Classification' },
    ],
  },
  {
    title: 'Booking systems',
    desc: 'Reservation and booking platforms with availability, payments, and the operation running behind them.',
    projects: [
      { name: 'Arangia', meta: 'Booking operation across Airbnb and Booking.com.', tags: 'Booking · Ops' },
      { name: 'Kalimera', meta: 'Travel app with 80+ business profiles, concept to launch.', tags: 'Product' },
    ],
  },
  {
    title: 'E-commerce & marketplaces',
    desc: 'Storefronts and integrations with the big marketplaces — product feeds, catalogue mapping, pricing automation.',
    projects: [
      { name: 'Marketplace feeds', meta: 'Skroutz, Amazon, Google Merchant via automated XML feeds.', tags: 'PrestaShop · Feeds' },
      { name: 'Galaxus integration', meta: 'Marketplace integration with AI category matching.', tags: 'Integration' },
      { name: 'Channable ops', meta: 'Feed orchestration, deduplication, pricing rule automation.', tags: 'Data · Channable' },
    ],
  },
  {
    title: 'Data & infrastructure',
    desc: 'ETL and feed pipelines, data quality, and the cloud infrastructure that keeps it all running — Linux, Docker, CI/CD.',
    projects: [
      { name: 'Medallion pipeline', meta: 'Ingest → map → validate on a medallion architecture.', tags: 'ETL · Data' },
      { name: 'VPS deployment', meta: 'Linux VPS, queues, background workers, CI/CD.', tags: 'Infrastructure' },
    ],
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
