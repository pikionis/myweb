// "My story" on /about (src/components/MyStory.astro, src/components/MyStoryArt.astro, src/scripts/mystory.ts):
// Petros's path as a scroll-driven story in thirteen scenes. Every word is here, in English and Greek (German
// later); the page shows `lang`. Words drawn inside the pictures (labels, code, formulas) are here too.

/** The language the story shows now. */
export const lang = 'en' as const;
export type Lang = 'en' | 'el' | 'de';
export type Copy = { en: string; el: string; de?: string };
/** The copy in the story's language (English when a translation is missing). */
export const t = (c: Copy) => c[lang] ?? c.en;

/** The top of /about: the portrait, a few lines about the work, the CV. */
export const aboutIntro = {
  cv: { en: 'Download CV', el: 'Κατέβασε το βιογραφικό' },
  story: { en: 'My story', el: 'Η διαδρομή μου' },
};

export type Scene = {
  id: string;
  /** the short name on the timeline rail */
  rail: Copy;
  /** the large label over the words: a year, or what the scene is about */
  label: Copy;
  title?: Copy;
  text: Copy;
  /** how long the scene holds, in screens of scroll (a phone holds it a little shorter) */
  hold: number;
  /** a client project in this stretch of time: a dot on the parallel line */
  side?: boolean;
};

export const scenes: Scene[] = [
  {
    id: 'intro', hold: 1,
    rail: { en: 'Start', el: 'Αρχή' }, label: { en: '', el: '' },
    text: {
      en: "I'm not just a software engineer. I build software, organise teams and solve problems along the way.",
      el: 'Δεν είμαι μόνο software engineer. Χτίζω λογισμικό, οργανώνω ομάδες και λύνω προβλήματα στη διαδρομή.',
    },
  },
  {
    id: 'chania', hold: 1.6,
    rail: { en: '2009', el: '2009' }, label: { en: '2009', el: '2009' },
    title: { en: 'Technical University of Crete, Chania', el: 'Πολυτεχνείο Κρήτης, Χανιά' },
    text: {
      en: 'Electrical & Computer Engineering. It started with serious mathematics.',
      el: 'Ηλεκτρολόγος Μηχανικός & Μηχανικός Υπολογιστών. Ξεκίνησα από τα σοβαρά μαθηματικά.',
    },
  },
  {
    id: 'cpp', hold: 1.2,
    rail: { en: 'C++', el: 'C++' }, label: { en: 'C++', el: 'C++' },
    text: { en: 'My first application, written in C++.', el: 'Η πρώτη μου εφαρμογή, σε C++.' },
  },
  {
    id: 'java', hold: 1.4,
    rail: { en: 'Java', el: 'Java' }, label: { en: 'Java', el: 'Java' },
    text: {
      en: 'My first management system: Java software for hospitals. Software for real people.',
      el: 'Το πρώτο μου διαχειριστικό: σύστημα σε Java για νοσοκομεία. Λογισμικό για πραγματικούς ανθρώπους.',
    },
  },
  {
    id: 'postgres', hold: 2.6,
    rail: { en: 'SQL', el: 'SQL' }, label: { en: 'PostgreSQL', el: 'PostgreSQL' },
    text: {
      en: "Six months inside PostgreSQL. That's where I learned that data has architecture.",
      el: 'Έξι μήνες μέσα στην PostgreSQL. Εκεί κατάλαβα ότι τα δεδομένα έχουν αρχιτεκτονική.',
    },
  },
  {
    id: 'courses', hold: 2.6,
    rail: { en: '2016', el: '2016' }, label: { en: '2009–2016', el: '2009–2016' },
    title: { en: 'The rollercoaster of courses', el: 'Το τρενάκι των μαθημάτων' },
    text: {
      en: 'Diploma thesis: Smart Questionnaire Generator for restaurant customers (Vue.js, Laravel). 2016 — MEng.',
      el: 'Διπλωματική: Smart Questionnaire Generator για πελάτες εστιατορίων (Vue.js, Laravel). 2016 — Δίπλωμα Μηχανικού.',
    },
  },
  {
    id: 'reach', hold: 1.8, side: true,
    rail: { en: '2017', el: '2017' }, label: { en: '2017–2021', el: '2017–2021' },
    title: { en: 'Reach Web Agency', el: 'Reach Web Agency' },
    text: {
      en: 'First clients, first websites, first e-commerce stores connected to marketplaces. 2019 — political campaigns: shipping fast under pressure.',
      el: 'Πρώτοι πελάτες, πρώτα sites, πρώτα e-shops συνδεδεμένα με marketplaces. 2019 — πολιτικές καμπάνιες: παράδοση με πίεση χρόνου.',
    },
  },
  {
    id: 'kalimera', hold: 2.4, side: true,
    rail: { en: '2021', el: '2021' }, label: { en: '2021–2024', el: '2021–2024' },
    title: { en: 'Kalimera, my own product', el: 'Kalimera, το δικό μου προϊόν' },
    text: {
      en: 'Building my own product taught me to see software as a business.',
      el: 'Φτιάχνοντας το δικό μου προϊόν, έμαθα να βλέπω το λογισμικό ως επιχείρηση.',
    },
  },
  {
    id: 'koan', hold: 1.8, side: true,
    rail: { en: '2024', el: '2024' }, label: { en: '05/2024–06/2025', el: '05/2024–06/2025' },
    title: { en: 'KOAN S.A. · Director of Sustainable Tourism Development', el: 'KOAN S.A. · Διευθυντής Ανάπτυξης Βιώσιμου Τουρισμού' },
    text: {
      en: 'Leading the digital transformation and outward reach of three islands: €500K programme, a multidisciplinary team, an 8-member consortium that secured EU funding.',
      el: 'Ψηφιακός μετασχηματισμός και εξωστρέφεια για τρία νησιά: πρόγραμμα €500K, διεπιστημονική ομάδα και κοινοπραξία 8 φορέων που εξασφάλισε ευρωπαϊκή χρηματοδότηση.',
    },
  },
  {
    id: 'ai', hold: 1, side: true,
    rail: { en: '2025', el: '2025' }, label: { en: '07/2025–12/2025', el: '07/2025–12/2025' },
    title: { en: 'Deep dive into AI engineering', el: 'Βουτιά στο AI engineering' },
    text: { en: 'A planned pause to study AI engineering in depth.', el: 'Μια συνειδητή παύση για να μάθω AI engineering σε βάθος.' },
  },
  {
    id: 'deindeal', hold: 2, side: true,
    rail: { en: '2026', el: '2026' }, label: { en: '2026', el: '2026' },
    title: { en: 'DeinDeal.ch · AI Software Engineer', el: 'DeinDeal.ch · AI Software Engineer' },
    text: {
      en: 'Responsible for integrating, filtering, translating and preparing 800,000+ products for a Swiss marketplace, with an AI application I built from scratch.',
      el: 'Υπεύθυνος για το integration, το φιλτράρισμα, τη μετάφραση και την προετοιμασία 800.000+ προϊόντων για ελβετικό marketplace, με AI εφαρμογή που έχτισα από το μηδέν.',
    },
  },
  {
    id: 'side', hold: 1.6,
    rail: { en: 'Side', el: 'Πελάτες' }, label: { en: 'All along', el: 'Σε όλη τη διαδρομή' },
    title: { en: 'The parallel line', el: 'Η παράλληλη γραμμή' },
    text: { en: 'And through all of it, I never stopped building for my own clients.', el: 'Και σε όλη τη διαδρομή, δεν σταμάτησα ποτέ να χτίζω για τους δικούς μου πελάτες.' },
  },
  {
    id: 'today', hold: 1.2,
    rail: { en: 'Today', el: 'Σήμερα' }, label: { en: 'Today', el: 'Σήμερα' },
    text: { en: 'Engineer. Manager. Problem solver.', el: 'Engineer. Manager. Problem solver.' },
  },
];

/** The words drawn inside the scenes, by scene. */
export const art = {
  // the blackboard in Chania, one line at a time
  board: ['d/dx (x² + 3x) = 2x + 3', '∫ 2x dx = x² + C', "y'' + y = 0", 'y = C₁ cos x + C₂ sin x'],
  cpp: {
    code: ['#include <iostream>', '', 'int main() {', '  std::cout << "Hello, world!";', '  return 0;', '}'],
    run: '$ g++ main.cpp && ./a.out',
    out: 'Hello, world!',
  },
  java: {
    forms: [{ en: 'Patients', el: 'Ασθενείς' }, { en: 'Appointments', el: 'Ραντεβού' }, { en: 'Beds', el: 'Κλίνες' }, { en: 'Doctors', el: 'Γιατροί' }],
    classes: ['Patient', 'Doctor', 'Appointment', 'Ward'],
  },
  postgres: {
    entities: ['Customer', 'Order', 'Product'],
    nf: ['1NF', '2NF', '3NF', 'BCNF'],
    join: 'JOIN',
    tags: [
      'relational model', 'relational algebra: σ π ⋈', 'functional dependencies', 'normalisation',
      'SQL: DDL / DML', 'JOINs · subqueries · GROUP BY', 'views · triggers · procedures', 'indexes (B-tree)',
      'query plans', 'transactions · ACID', 'isolation levels', 'concurrency',
    ],
  },
  courses: [
    { en: 'Linear Algebra', el: 'Γραμμική Άλγεβρα' },
    { en: 'Introduction to Programming', el: 'Εισαγωγή στον Προγραμματισμό' },
    { en: 'Logic Design', el: 'Λογική Σχεδίαση' },
    { en: 'Discrete Mathematics', el: 'Διακριτά Μαθηματικά' },
    { en: 'Object-Oriented Programming', el: 'Αντικειμενοστρεφής Προγραμματισμός' },
    { en: 'Probability Theory', el: 'Θεωρία Πιθανοτήτων' },
    { en: 'Signals and Systems', el: 'Σήματα και Συστήματα' },
    { en: 'Digital Computer Systems', el: 'Ψηφιακά Υπολογιστικά Συστήματα' },
    { en: 'Software Development Tools and Systems Programming', el: 'Εργαλεία Ανάπτυξης Λογισμικού και Προγραμματισμός Συστημάτων' },
    { en: 'Electric Circuit Analysis', el: 'Ανάλυση Ηλεκτρικών Κυκλωμάτων' },
    { en: 'Data Structures and Algorithms', el: 'Δομές Δεδομένων και Αλγόριθμοι' },
    { en: 'Differential Equations', el: 'Διαφορικές Εξισώσεις' },
    { en: 'Operating Systems', el: 'Λειτουργικά Συστήματα' },
    { en: 'Information Systems Design and Development', el: 'Σχεδίαση και Ανάπτυξη Πληροφοριακών Συστημάτων' },
    { en: 'Databases', el: 'Βάσεις Δεδομένων' },
    { en: 'Computer Organisation', el: 'Οργάνωση Υπολογιστών' },
    { en: 'Telecommunication Systems I', el: 'Τηλεπικοινωνιακά Συστήματα 1' },
    { en: 'Quantum Information Algorithms', el: 'Αλγόριθμοι Κβαντικής Πληροφορίας' },
    { en: 'Applied Mathematics', el: 'Εφαρμοσμένα Μαθηματικά' },
    { en: 'Artificial Intelligence', el: 'Τεχνητή Νοημοσύνη' },
    { en: 'Algorithms and Complexity', el: 'Αλγόριθμοι και Πολυπλοκότητα' },
    { en: 'Modern Mobile Systems, Applications and Services', el: 'Μοντέρνα Κινητά Συστήματα, Εφαρμογές και Υπηρεσίες' },
    { en: 'Cloud and Fog Computing Services', el: 'Υπηρεσίες στο Υπολογιστικό Νέφος και την Ομίχλη' },
  ] as Copy[],
  /** the course drawn in cobalt, the highest peak: it comes back in 2025 */
  peak: 19,
  station: { en: 'Diploma Thesis', el: 'Διπλωματική' },
  reach: {
    markets: ['Skroutz', 'Amazon', 'Google'],
    feed: 'XML',
    year: '2019',
    clock: '23:59:59',
  },
  kalimera: {
    mvp: { en: '2021 — MVP launch', el: '2021 — Λανσάρισμα MVP' },
    profiles: { en: 'business profiles', el: 'επαγγελματικά προφίλ' },
    count: 80,
    prize: { en: '2022 — 2nd Prize, CapsuleT Innovation Contest (Hellenic Chamber of Hotels)', el: '2022 — 2ο Βραβείο, CapsuleT Innovation Contest (Ξενοδοχειακό Επιμελητήριο Ελλάδος)' },
    accelerator: { en: '2023 — Selected for the CapsuleT Accelerator', el: '2023 — Επιλογή στον CapsuleT Accelerator' },
    words: [
      { en: 'funding', el: 'χρηματοδότηση' }, { en: 'pitching', el: 'pitching' }, { en: 'scalability', el: 'κλιμάκωση' },
      { en: 'roadmap', el: 'roadmap' }, { en: 'go-to-market', el: 'go-to-market' }, { en: 'sales', el: 'πωλήσεις' },
      { en: 'team leadership', el: 'ηγεσία ομάδας' },
    ] as Copy[],
  },
  koan: {
    islands: [{ en: 'Kos', el: 'Κως' }, { en: 'Astypalea', el: 'Αστυπάλαια' }, { en: 'Nisyros', el: 'Νίσυρος' }] as Copy[],
    roles: [{ en: 'developers', el: 'developers' }, { en: 'content', el: 'περιεχόμενο' }, { en: 'advertising', el: 'διαφήμιση' }] as Copy[],
    budget: '€500K',
    espa: 'ESPA 2021–2027',
  },
  ai: ['LLMs', 'RAG', 'Agents', 'MCP'],
  deindeal: {
    city: { en: 'Zurich', el: 'Ζυρίχη' },
    files: ['XML', 'CSV', 'JSON', 'FTP'],
    stages: [{ en: 'filter', el: 'φιλτράρισμα' }, { en: 'translate', el: 'μετάφραση' }, { en: 'enrich', el: 'εμπλουτισμός' }, { en: 'validate', el: 'έλεγχος' }] as Copy[],
    count: 800000,
    products: { en: 'products', el: 'προϊόντα' },
    refresh: { en: 'daily refresh', el: 'καθημερινή ανανέωση' },
  },
  side: [
    { name: 'Archon Yachting', text: { en: 'Yacht charter platform with bookings and payments.', el: 'Πλατφόρμα ναύλωσης σκαφών με κρατήσεις και πληρωμές.' } },
    { name: 'Arogi Kos · Arangia · La Islakos', text: { en: 'Brand-led websites and an online store.', el: 'Brand-led ιστοσελίδες και ένα online κατάστημα.' } },
    { name: 'Feed Intelligence', text: { en: '6-stage translation pipeline, 220,000-SKU catalogue.', el: 'Pipeline μετάφρασης 6 σταδίων, κατάλογος 220.000 SKU.' } },
  ],
  roles: [{ en: 'Engineer', el: 'Engineer' }, { en: 'Manager', el: 'Manager' }, { en: 'Problem solver', el: 'Problem solver' }] as Copy[],
  cta: { en: "Let's build something together.", el: 'Ας χτίσουμε κάτι μαζί.' },
  contact: { en: 'Contact', el: 'Επικοινωνία' },
};
