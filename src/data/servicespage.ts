// Every word of /services (src/pages/services.astro), in English and Greek (German later); the page shows the
// site's `lang` (src/data/lang.ts). The four services here are the same four as the home page's (site.ts keys),
// told for someone who doesn't know the technical name of what they need. Words drawn inside the pictures are
// in `art`. Proof is never invented: a proof card names a real project, and one without an address has no link.
import type { Copy } from './lang';
import type { ServiceKey } from './site';

export type Proof = {
  /** a project in src/content/projects: its capture (public/projects/thumbs/<id>.webp) becomes the picture */
  project?: string;
  name: string;
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

export const servicesPage = {
  meta: {
    title: { en: 'Services — Petros Pikionis', el: 'Υπηρεσίες — Πέτρος Πικιώνης' },
    description: {
      en: 'Websites, apps, e-shops and AI, from the first idea to a product that works: what I build, how we work, how long it takes, and answers to the questions I hear most.',
      el: 'Sites, εφαρμογές, e-shops και AI, από την πρώτη ιδέα σε ένα προϊόν που δουλεύει: τι φτιάχνω, πώς δουλεύουμε, πόσο χρόνο παίρνει και απαντήσεις στις πιο συχνές ερωτήσεις.',
    },
  },

  hero: {
    title: { en: 'From idea to a product that works.', el: 'Από την ιδέα σε ένα προϊόν που δουλεύει.' },
    sub: {
      en: 'Websites, apps, e-shops and AI, built by one engineer who also understands business.',
      el: 'Sites, εφαρμογές, e-shops και AI, από έναν μηχανικό που καταλαβαίνει και από επιχείρηση.',
    },
    primary: { en: 'Tell me your idea', el: 'Πες μου την ιδέα σου' },
    secondary: { en: 'See services', el: 'Δες τις υπηρεσίες' },
  },

  picker: {
    title: { en: 'Where are you right now?', el: 'Πού βρίσκεσαι τώρα;' },
    items: [
      { key: 'web', text: { en: 'I have a business and need a website that brings customers.', el: 'Έχω επιχείρηση και θέλω site που φέρνει πελάτες.' } },
      { key: 'apps', text: { en: 'I have an idea for an app or a platform.', el: 'Έχω μια ιδέα για εφαρμογή ή πλατφόρμα.' } },
      { key: 'commerce', text: { en: 'I sell products and want to sell more, in more places.', el: 'Πουλάω προϊόντα και θέλω να πουλάω περισσότερα, σε περισσότερα μέρη.' } },
      { key: 'search', text: { en: 'Nobody finds me on Google, or in ChatGPT.', el: 'Δεν με βρίσκει κανείς στο Google, ούτε στο ChatGPT.' } },
    ] as { key: ServiceKey; text: Copy }[],
  },

  /** the words around every service section */
  section: {
    proof: { en: 'Real projects', el: 'Πραγματικά έργα' },
    timeline: { en: 'Timeline', el: 'Χρόνος' },
    from: { en: 'Starting from', el: 'Από' },
    open: { en: 'See the project', el: 'Δες το έργο' },
  },

  sections: [
    {
      key: 'web',
      title: { en: 'Custom Web Design', el: 'Ιστοσελίδες κατά παραγγελία' },
      short: { en: 'Web Design', el: 'Web design' },
      promise: { en: 'A website made for your business, not a template.', el: 'Ένα site φτιαγμένο για την επιχείρησή σου, όχι ένα template.' },
      bullets: [
        { en: 'Branding help: logo, palette, typography (with partner designers if needed)', el: 'Βοήθεια με το branding: logo, παλέτα, γραμματοσειρές (με συνεργάτες designers αν χρειάζεται)' },
        { en: '3–4 design directions to choose from', el: '3–4 κατευθύνσεις design για να διαλέξεις' },
        { en: 'Fast, mobile-first site (100/100 Core Web Vitals target)', el: 'Γρήγορο, mobile-first site (στόχος 100/100 στα Core Web Vitals)' },
        { en: 'Content management so you can edit texts and photos yourself', el: 'Διαχείριση περιεχομένου, για να αλλάζεις μόνος σου κείμενα και φωτογραφίες' },
        { en: 'Multilingual (EL / EN / DE and more)', el: 'Πολυγλωσσικό (EL / EN / DE και άλλες)' },
        { en: 'Bookings, contact forms, maps, Google Business integration', el: 'Κρατήσεις, φόρμες επικοινωνίας, χάρτες, σύνδεση με Google Business' },
      ],
      chipsLabel: { en: 'Made for businesses like', el: 'Για επιχειρήσεις όπως' },
      chips: [
        { en: 'Restaurant', el: 'Εστιατόριο' },
        { en: 'Beach bar', el: 'Beach bar' },
        { en: 'Villa or boutique hotel', el: 'Βίλα ή boutique ξενοδοχείο' },
        { en: 'Short-term rental', el: 'Airbnb κατάλυμα' },
        { en: 'Wine shop', el: 'Κάβα' },
        { en: 'Doctor or dentist', el: 'Ιατρείο ή οδοντιατρείο' },
        { en: 'Law or accounting office', el: 'Δικηγορικό ή λογιστικό γραφείο' },
        { en: 'Gym or yoga studio', el: 'Γυμναστήριο ή studio yoga' },
        { en: 'Photographer', el: 'Φωτογράφος' },
        { en: 'Tour or boat trips', el: 'Εκδρομές ή θαλάσσια tours' },
        { en: 'Architect', el: 'Αρχιτεκτονικό γραφείο' },
      ],
      proof: [
        { project: 'arangia', name: 'Arangia', line: { en: 'Short-term rental, direct bookings', el: 'Βραχυχρόνια μίσθωση, απευθείας κρατήσεις' }, url: '/projects/arangia' },
        { project: 'arogi-kos', name: 'Arogi Kos', line: { en: 'Brand-led website', el: 'Site χτισμένο πάνω στο brand' }, url: '/projects/arogi-kos' },
      ],
      timeline: { en: '2–5 weeks', el: '2–5 εβδομάδες' },
      weeks: [2, 5],
      startingFrom: null,
      cta: { en: 'Start my website', el: 'Ξεκίνα το site μου' },
    },
    {
      key: 'apps',
      title: { en: 'AI SaaS & Mobile Apps', el: 'AI SaaS & εφαρμογές κινητού' },
      short: { en: 'AI SaaS & Mobile', el: 'AI SaaS & κινητό' },
      promise: {
        en: "You have the idea. I'll turn it into an MVP you can show, sell and grow.",
        el: 'Εσύ έχεις την ιδέα. Εγώ τη μετατρέπω σε MVP που δείχνεις, πουλάς και μεγαλώνεις.',
      },
      intro: {
        en: "Pitch me your idea or send me a brief. We'll talk it through, I'll estimate cost and time, and we'll decide together which features and services the first version needs.",
        el: 'Κάνε μου pitch την ιδέα σου ή στείλε μου ένα brief. Τη συζητάμε, σου κοστολογώ χρόνο και κόστος, και αποφασίζουμε μαζί τι χρειάζεται η πρώτη έκδοση.',
      },
      bullets: [
        { en: 'Product roadmap and MVP scope', el: 'Roadmap προϊόντος και scope του MVP' },
        { en: 'Branding and UX/UI design', el: 'Branding και UX/UI design' },
        { en: 'Web app + iOS & Android apps (Flutter, one codebase)', el: 'Web app + εφαρμογές iOS & Android (Flutter, ένας κώδικας)' },
        { en: 'Admin dashboard to manage users, content and data', el: 'Admin dashboard για χρήστες, περιεχόμενο και δεδομένα' },
        { en: 'AI features: chat, search, translation, automation, document processing', el: 'AI λειτουργίες: chat, αναζήτηση, μετάφραση, αυτοματισμοί, επεξεργασία εγγράφων' },
        { en: 'Payments, subscriptions, notifications, hosting and launch', el: 'Πληρωμές, συνδρομές, notifications, hosting και launch' },
      ],
      chipsLabel: { en: 'Ideas like', el: 'Ιδέες όπως' },
      chips: [
        { en: 'Boat / yacht booking app', el: 'App κρατήσεων σκαφών' },
        { en: 'Loyalty app for cafés', el: 'App επιβράβευσης για καφέ' },
        { en: 'Appointment booking for salons & clinics', el: 'Ραντεβού για κομμωτήρια & ιατρεία' },
        { en: 'Marketplace for local producers', el: 'Marketplace για τοπικούς παραγωγούς' },
        { en: 'AI assistant for accountants', el: 'AI βοηθός για λογιστές' },
        { en: 'Property management platform', el: 'Πλατφόρμα διαχείρισης ακινήτων' },
        { en: 'Tourist guide app for an island', el: 'App ξενάγησης για ένα νησί' },
        { en: 'Delivery app for a restaurant group', el: 'App delivery για όμιλο εστιατορίων' },
        { en: 'Internal tool that replaces spreadsheets', el: 'Εσωτερικό εργαλείο που αντικαθιστά τα Excel' },
      ],
      proof: [
        {
          project: 'feedgenix', name: 'Feedgenix', icon: 'gear', url: '/projects/feedgenix',
          line: { en: 'AI SaaS: translates large product datasets. Pick the fields and the languages.', el: 'AI SaaS: μεταφράζει μεγάλα σύνολα δεδομένων προϊόντων. Διαλέγεις πεδία και γλώσσες.' },
        },
        { name: 'Archon Yachting', icon: 'sail', url: 'https://archonyachting.com', line: { en: 'Charter platform with bookings and payments', el: 'Πλατφόρμα ναύλωσης σκαφών με κρατήσεις και πληρωμές' } },
        {
          project: 'kalimera', name: 'Kalimera', url: '/projects/kalimera',
          // 2nd place was at Idea Platform, the contest in which CapsuleT filters ideas, not the main CapsuleT competition
          line: { en: "My own startup: 2nd place at Idea Platform, CapsuleT's ideas contest", el: 'Η δική μου startup: 2η θέση στο Idea Platform, τον διαγωνισμό ιδεών του CapsuleT' },
        },
      ],
      timeline: { en: 'MVP in 6–12 weeks', el: 'MVP σε 6–12 εβδομάδες' },
      weeks: [6, 12],
      startingFrom: null,
      cta: { en: 'Pitch me your idea', el: 'Κάνε μου pitch' },
    },
    {
      key: 'commerce',
      title: { en: 'E-commerce: zero to hero', el: 'E-commerce: από το μηδέν στην κορυφή' },
      short: { en: 'E-commerce', el: 'E-commerce' },
      promise: {
        en: 'From your first online store to selling automatically across Europe.',
        el: 'Από το πρώτο σου e-shop μέχρι αυτοματοποιημένες πωλήσεις σε όλη την Ευρώπη.',
      },
      bullets: [
        { en: 'Store build and design (Shopify, WooCommerce, PrestaShop or custom)', el: 'Στήσιμο και design του καταστήματος (Shopify, WooCommerce, PrestaShop ή custom)' },
        { en: 'Import of your full product catalogue, cleaned and organised', el: 'Πέρασμα ολόκληρου του καταλόγου σου, καθαρού και οργανωμένου' },
        { en: 'Automatic connection to big marketplaces in Greece and Europe', el: 'Αυτόματη σύνδεση με μεγάλα marketplaces σε Ελλάδα και Ευρώπη' },
        { en: 'Automatic translation of products into up to 20 languages', el: 'Αυτόματη μετάφραση προϊόντων σε έως 20 γλώσσες' },
        { en: 'Selling in up to 5 countries, with the right feeds for each', el: 'Πωλήσεις σε έως 5 χώρες, με τα σωστά feeds για την καθεμία' },
        { en: 'Step-by-step guidance: the bigger you get, the easier it becomes', el: 'Καθοδήγηση βήμα βήμα: όσο μεγαλώνεις, τόσο πιο εύκολο γίνεται' },
      ],
      chipsLabel: { en: 'For stores like', el: 'Για καταστήματα όπως' },
      chips: [
        { en: 'Clothing boutique', el: 'Μπουτίκ ρούχων' },
        { en: 'Olive oil or honey producer', el: 'Παραγωγός λαδιού ή μελιού' },
        { en: 'Jewellery', el: 'Κοσμήματα' },
        { en: 'Handmade ceramics', el: 'Χειροποίητα κεραμικά' },
        { en: 'Natural cosmetics', el: 'Φυσικά καλλυντικά' },
        { en: 'Wine & local spirits', el: 'Κρασί & τοπικά αποστάγματα' },
        { en: 'Electronics or home goods retailer', el: 'Κατάστημα ηλεκτρονικών ή ειδών σπιτιού' },
        { en: 'Wholesaler with a big catalogue', el: 'Χονδρέμπορος με μεγάλο κατάλογο' },
      ],
      proof: [
        { project: 'la-islakos', name: 'La Islakos', line: { en: 'Online store', el: 'Ηλεκτρονικό κατάστημα' }, url: '/projects/la-islakos' },
        {
          project: 'deindeal', name: 'DeinDeal.ch', icon: 'cards', url: '/projects/deindeal',
          line: { en: '800,000+ products integrated, filtered and translated for a Swiss marketplace', el: '800.000+ προϊόντα ενσωματωμένα, φιλτραρισμένα και μεταφρασμένα για ένα ελβετικό marketplace' },
        },
      ],
      timeline: { en: 'Store in 3–6 weeks; marketplaces and translations in phases', el: 'Κατάστημα σε 3–6 εβδομάδες· marketplaces και μεταφράσεις σε φάσεις' },
      weeks: [3, 6],
      then: { en: 'marketplaces and translations in phases', el: 'marketplaces και μεταφράσεις σε φάσεις' },
      startingFrom: null,
      cta: { en: 'Grow my store', el: 'Μεγάλωσε το e-shop μου' },
    },
    {
      key: 'search',
      title: { en: 'Digital Marketing & AI Search', el: 'Digital marketing & AI αναζήτηση' },
      short: { en: 'Marketing & AI Search', el: 'Marketing & AI αναζήτηση' },
      promise: { en: 'Be found on Google, on the map, and in AI answers.', el: 'Να σε βρίσκουν στο Google, στον χάρτη και στις απαντήσεις των AI.' },
      bullets: [
        { en: 'LLM visibility: structure your site so ChatGPT, Claude and Gemini can understand and recommend you', el: 'Ορατότητα σε LLMs: δομή site ώστε ChatGPT, Claude και Gemini να σε καταλαβαίνουν και να σε προτείνουν' },
        { en: '100/100 on all Core Web Vitals', el: '100/100 σε όλα τα Core Web Vitals' },
        { en: 'Technical and local SEO, Google Business profile', el: 'Τεχνικό και τοπικό SEO, προφίλ Google Business' },
        { en: 'Google Ads campaigns built with AI automations', el: 'Καμπάνιες Google Ads με AI αυτοματισμούς' },
        { en: 'Conversion tracking that shows what actually brings customers', el: 'Tracking μετατροπών που δείχνει τι φέρνει πραγματικά πελάτες' },
        { en: 'Monthly report in plain language', el: 'Μηνιαίο report σε απλά λόγια' },
      ],
      chipsLabel: { en: 'For businesses like', el: 'Για επιχειρήσεις όπως' },
      chips: [
        { en: 'Hotel that wants direct bookings', el: 'Ξενοδοχείο που θέλει απευθείας κρατήσεις' },
        { en: 'Restaurant in a tourist area', el: 'Εστιατόριο σε τουριστική περιοχή' },
        { en: 'Clinic or practice', el: 'Ιατρείο ή κλινική' },
        { en: 'Car or bike rental', el: 'Ενοικιάσεις αυτοκινήτων ή μηχανών' },
        { en: 'Real estate agency', el: 'Μεσιτικό γραφείο' },
        { en: 'E-shop with low traffic', el: 'E-shop με λίγη επισκεψιμότητα' },
        { en: 'Any business with an old, slow site', el: 'Κάθε επιχείρηση με παλιό, αργό site' },
      ],
      proof: [
        // the Site Health dashboard (a claude.ai artifact) with its weekly agent, which reads the scan of every site
        // (pikionis/site-monitor) and opens fix PRs, and its monthly report; on /projects, scripts/pagespeed.mjs
        {
          name: 'Site Health Monitor', icon: 'gauge', url: '/projects',
          line: { en: 'My own system: it tracks the performance and SEO scores of client sites, and an AI agent fixes what drops', el: 'Δικό μου σύστημα: παρακολουθεί τις βαθμολογίες ταχύτητας και SEO των sites των πελατών, και ένας AI agent διορθώνει ό,τι πέφτει' },
        },
        { project: 'arangia', name: 'Arangia', line: { en: 'Direct-booking site, tuned for speed and search', el: 'Site απευθείας κρατήσεων, ρυθμισμένο για ταχύτητα και αναζήτηση' }, url: '/projects/arangia' },
      ],
      timeline: { en: 'Audit in 1 week; ongoing monthly', el: 'Audit σε 1 εβδομάδα· μετά μηνιαία' },
      weeks: [0, 1],
      then: { en: 'ongoing monthly', el: 'μετά μηνιαία' },
      startingFrom: null,
      cta: { en: 'Check my site', el: 'Τσέκαρε το site μου' },
    },
  ] as ServiceSection[],

  how: {
    title: { en: 'How we work', el: 'Πώς δουλεύουμε' },
    // each step draws the picture of its scene in the home page's story (StoryArt.astro, by name), cropped to it
    steps: [
      { title: { en: 'Discovery call', el: 'Γνωριμία και συζήτηση' }, art: 'meet', box: '55 98 290 168' },
      { title: { en: 'Branding and material', el: 'Branding και υλικό' }, art: 'brand', box: '27 68 343 202' },
      { title: { en: '3–4 design directions', el: '3–4 κατευθύνσεις design' }, art: 'directions', box: '50 89 301 152' },
      { title: { en: 'We agree on scope', el: 'Συμφωνούμε στο τελικό πλάνο' }, art: 'agree', box: '24 2 352 272' },
      { title: { en: 'I build', el: 'Υλοποίηση' }, art: 'build-site', box: '30 30 340 240' },
      {
        title: { en: 'Payments 30 / 40 / 30', el: 'Πληρωμές 30 / 40 / 30' }, art: 'payment', box: '44 90 312 106',
        note: { en: 'deposit · delivery · one month after', el: 'προκαταβολή · παράδοση · έναν μήνα μετά' },
      },
    ] as { title: Copy; art: string; box: string; note?: Copy }[],
    story: { en: 'See the full story', el: 'Δες όλη την ιστορία' },
    /** the home page's story of how we work together */
    storyHref: '/#story-web',
  },

  prices: {
    title: { en: 'Timelines and prices', el: 'Χρόνοι και τιμές' },
    /** the title while no service shows a price */
    titleNoPrices: { en: 'How long it takes', el: 'Πόσο χρόνο παίρνει' },
    timeline: { en: 'Typical timeline', el: 'Συνήθης χρόνος' },
    weeks: { en: 'weeks', el: 'εβδομάδες' },
    note: {
      en: 'After a short call you get a clear quote with everything it includes, so there are no surprises.',
      el: 'Μετά από μια σύντομη συζήτηση παίρνεις σαφή προσφορά με όλα όσα περιλαμβάνει, χωρίς εκπλήξεις.',
    },
  },

  faq: {
    title: { en: 'Questions I hear often', el: 'Ερωτήσεις που ακούω συχνά' },
    /** the chat's name for each side, and what a screen reader hears for the typing dots */
    petros: { en: 'Petros', el: 'Πέτρος' },
    visitor: { en: 'You', el: 'Εσύ' },
    typing: { en: 'typing', el: 'γράφει' },
    jump: { en: 'Jump to a question', el: 'Πήγαινε σε μια ερώτηση' },
    next: { en: 'Next question', el: 'Επόμενη ερώτηση' },
    ask: { en: 'Ask me something else', el: 'Ρώτα με κάτι άλλο' },
    items: [
      {
        short: { en: 'Cost', el: 'Κόστος' },
        q: { en: 'How much does a website cost?', el: 'Πόσο κοστίζει ένα site;' },
        a: {
          en: "It depends on what it needs to do. A presentation site for a shop is very different from a booking platform. After a short call I send you a clear quote with what's included, so there are no surprises.",
          el: 'Εξαρτάται από το τι πρέπει να κάνει. Ένα site παρουσίασης για μαγαζί διαφέρει πολύ από μια πλατφόρμα κρατήσεων. Μετά από μια σύντομη συζήτηση σου στέλνω σαφή προσφορά με όλα όσα περιλαμβάνει, χωρίς εκπλήξεις.',
        },
      },
      {
        short: { en: 'Time', el: 'Χρόνος' },
        q: { en: 'How long does it take?', el: 'Πόσο χρόνο παίρνει;' },
        a: {
          en: 'A business website usually takes 2–5 weeks, an e-shop 3–6 weeks, and an app MVP 6–12 weeks. You get a timeline with milestones before we start.',
          el: 'Ένα site επιχείρησης συνήθως 2–5 εβδομάδες, ένα e-shop 3–6 εβδομάδες και ένα MVP εφαρμογής 6–12 εβδομάδες. Πριν ξεκινήσουμε παίρνεις χρονοδιάγραμμα με ορόσημα.',
        },
      },
      {
        short: { en: 'Only an idea', el: 'Μόνο μια ιδέα' },
        q: { en: 'I only have an idea, not a plan. Can we still work together?', el: 'Έχω μόνο μια ιδέα, όχι σχέδιο. Μπορούμε να συνεργαστούμε;' },
        a: {
          en: "That's the best place to start. We turn the idea into a scope, a roadmap and a budget together. I've been through it myself with my own startup, from MVP to accelerator.",
          el: 'Από εκεί είναι το καλύτερο να ξεκινάμε. Κάνουμε μαζί την ιδέα scope, roadmap και budget. Το έχω ζήσει κι εγώ με τη δική μου startup, από το MVP μέχρι τον accelerator.',
        },
      },
      {
        short: { en: 'Editing it myself', el: 'Αλλαγές μόνος μου' },
        q: { en: 'Will I be able to change things on my own?', el: 'Θα μπορώ να αλλάζω πράγματα μόνος μου;' },
        a: {
          en: 'Yes. You get a simple admin panel to edit texts, photos, products and prices without calling me.',
          el: 'Ναι. Παίρνεις ένα απλό admin panel για να αλλάζεις κείμενα, φωτογραφίες, προϊόντα και τιμές χωρίς να με παίρνεις τηλέφωνο.',
        },
      },
      {
        short: { en: 'Ownership', el: 'Ιδιοκτησία' },
        q: { en: 'Who owns the website and the code?', el: 'Σε ποιον ανήκει το site και ο κώδικας;' },
        a: {
          en: 'You do. Domain, content and code are yours once the project is paid in full.',
          el: 'Σε εσένα. Domain, περιεχόμενο και κώδικας είναι δικά σου μόλις εξοφληθεί το έργο.',
        },
      },
      {
        short: { en: 'After delivery', el: 'Μετά την παράδοση' },
        q: { en: 'What happens after delivery?', el: 'Τι γίνεται μετά την παράδοση;' },
        a: {
          en: 'The last 30% is paid one month after delivery, after corrections and small additions. After that you can choose a monthly plan for maintenance, updates, security and performance monitoring.',
          el: 'Το τελευταίο 30% πληρώνεται έναν μήνα μετά, αφού γίνουν οι διορθώσεις και οι μικρές προσθήκες. Μετά μπορείς να διαλέξεις μηνιαίο πλάνο για συντήρηση, ενημερώσεις, ασφάλεια και παρακολούθηση ταχύτητας.',
        },
      },
      {
        short: { en: 'iPhone & Android', el: 'iPhone & Android' },
        q: { en: 'Do you build mobile apps for both iPhone and Android?', el: 'Φτιάχνεις εφαρμογές για iPhone και Android;' },
        a: {
          en: 'Yes, with one codebase for both, plus a web version and an admin dashboard if you need them.',
          el: 'Ναι, με έναν κώδικα και για τα δύο, μαζί με web έκδοση και admin dashboard αν τα χρειάζεσαι.',
        },
      },
      {
        short: { en: 'Marketplaces', el: 'Marketplaces' },
        q: { en: 'Can my products appear on Skroutz, Amazon or other marketplaces?', el: 'Μπορούν τα προϊόντα μου να μπουν στο Skroutz, στο Amazon ή σε άλλα marketplaces;' },
        a: {
          en: 'Yes. I connect your store to the marketplaces that fit you and keep the feeds updated automatically, in as many languages as you need.',
          el: 'Ναι. Συνδέω το κατάστημά σου με τα marketplaces που σου ταιριάζουν και κρατάω τα feeds ενημερωμένα αυτόματα, σε όσες γλώσσες χρειάζεσαι.',
        },
      },
      {
        short: { en: 'AI answers', el: 'Απαντήσεις AI' },
        q: { en: "What does 'being found in AI answers' mean?", el: 'Τι σημαίνει «να με βρίσκουν στις απαντήσεις των AI»;' },
        a: {
          en: 'More and more people ask ChatGPT or Claude instead of Google. I structure your site and information so these assistants understand your business and can recommend it.',
          el: 'Όλο και περισσότεροι ρωτάνε το ChatGPT ή το Claude αντί για το Google. Οργανώνω το site και τις πληροφορίες σου ώστε αυτοί οι βοηθοί να καταλαβαίνουν την επιχείρησή σου και να την προτείνουν.',
        },
      },
      {
        short: { en: 'Outside Kos', el: 'Εκτός Κω' },
        q: { en: 'Do you work with clients outside Kos or outside Greece?', el: 'Δουλεύεις με πελάτες εκτός Κω ή εκτός Ελλάδας;' },
        a: {
          en: "Yes. I've worked remotely with companies in Switzerland and across Greece. We meet on video calls and share progress online.",
          el: 'Ναι. Έχω δουλέψει remote με εταιρείες στην Ελβετία και σε όλη την Ελλάδα. Τα λέμε με video calls και βλέπεις την πρόοδο online.',
        },
      },
      {
        short: { en: 'Payments', el: 'Πληρωμές' },
        q: { en: 'How do payments work?', el: 'Πώς γίνονται οι πληρωμές;' },
        a: {
          en: '30% to start, 40% on delivery, and 30% one month later, after corrections.',
          el: '30% στην αρχή, 40% στην παράδοση και 30% έναν μήνα μετά, αφού γίνουν οι διορθώσεις.',
        },
      },
      {
        short: { en: 'Working alone?', el: 'Δουλεύεις μόνος;' },
        q: { en: 'Do you work alone?', el: 'Δουλεύεις μόνος σου;' },
        a: {
          en: 'I lead and build every project myself, and bring in trusted designers and specialists when a project needs them.',
          el: 'Καθοδηγώ και υλοποιώ κάθε έργο ο ίδιος, και φέρνω έμπιστους designers και ειδικούς όταν ένα έργο το χρειάζεται.',
        },
      },
    ] as { short: Copy; q: Copy; a: Copy }[],
  },

  /** the closing form: it sends like the brief form on /contact (src/scripts/brief.ts, `post`) */
  start: {
    title: { en: 'Tell me your idea.', el: 'Πες μου την ιδέα σου.' },
    sub: { en: 'I reply within 24 hours.', el: 'Απαντώ μέσα σε 24 ώρες.' },
    subject: 'New request from onehublabs.com/services',
    name: { en: 'Name', el: 'Όνομα' },
    email: { en: 'Email', el: 'Email' },
    phone: { en: 'Phone', el: 'Τηλέφωνο' },
    optional: { en: '(optional)', el: '(προαιρετικό)' },
    need: { en: 'What do you need?', el: 'Τι χρειάζεσαι;' },
    unsure: { en: 'Not sure yet', el: 'Δεν ξέρω ακόμα' },
    idea: { en: 'Your business, or your idea', el: 'Η επιχείρησή σου ή η ιδέα σου' },
    ideaHint: {
      en: "A few lines are enough: what you do, what you'd like to build, and by when.",
      el: 'Λίγες γραμμές αρκούν: τι κάνεις, τι θέλεις να φτιάξουμε και μέχρι πότε.',
    },
    budget: { en: 'Budget', el: 'Budget' },
    budgetPick: { en: 'Choose a range', el: 'Διάλεξε εύρος' },
    // [TODO: budget ranges, when Petros sets them] while this is empty the budget field stays hidden
    budgets: [] as Copy[],
    language: { en: 'Preferred language', el: 'Γλώσσα επικοινωνίας' },
    languages: [['el', 'Ελληνικά'], ['en', 'English'], ['de', 'Deutsch']] as [string, string][],
    send: { en: 'Send my idea', el: 'Στείλε την ιδέα μου' },
    sending: { en: 'Sending…', el: 'Αποστολή…' },
    done: { en: 'Got it. Talk soon.', el: 'Το έλαβα. Τα λέμε σύντομα.' },
    error: { en: "Couldn't send it. Check your connection and try again.", el: 'Δεν στάλθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.' },
    another: { en: 'Send another', el: 'Στείλε κι άλλο' },
  },

  /** words inside the drawings */
  art: {
    domain: { en: 'yourbusiness.com', el: 'yourbusiness.gr' },
    countries: { en: 'countries', el: 'χώρες' },
    query: { en: 'restaurant near me', el: 'εστιατόριο κοντά μου' },
    you: { en: 'Your business', el: 'Η επιχείρησή σου' },
    recommend: { en: 'I recommend', el: 'Σου προτείνω' },
    marketplaces: ['Skroutz', 'Amazon', 'Galaxus'],
    languages: ['EL', 'EN', 'DE', 'FR', 'IT', 'ES'],
  },
};
