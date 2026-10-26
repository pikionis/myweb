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
  /** a client project in this stretch of time: a dot on the parallel line */
  side?: boolean;
};

export const scenes: Scene[] = [
  {
    id: 'intro',
    rail: { en: 'Start', el: 'Αρχή' }, label: { en: '', el: '' },
    text: {
      en: "I'm not just a software engineer. I build software, organise teams and solve problems along the way.",
      el: 'Δεν είμαι μόνο software engineer. Χτίζω λογισμικό, οργανώνω ομάδες και λύνω προβλήματα στη διαδρομή.',
    },
  },
  {
    id: 'chania',
    rail: { en: '2009', el: '2009' }, label: { en: '2009', el: '2009' },
    title: { en: 'Technical University of Crete, Chania', el: 'Πολυτεχνείο Κρήτης, Χανιά' },
    text: {
      en: 'Chania, by the sea. I started Electrical & Computer Engineering at the Technical University of Crete.',
      el: 'Χανιά, δίπλα στη θάλασσα. Ξεκίνησα Ηλεκτρολόγος Μηχανικός & Μηχανικός Υπολογιστών στο Πολυτεχνείο Κρήτης.',
    },
  },
  {
    id: 'firstyear',
    rail: { en: '2010', el: '2010' }, label: { en: '2009–2010', el: '2009–2010' },
    title: { en: 'Serious mathematics, hardcore programming', el: 'Σοβαρά μαθηματικά, hardcore προγραμματισμός' },
    text: {
      en: 'From the first year: serious mathematics, and hardcore programming in C++ and Java, with my first management system, Java software for hospitals. My first real contact with programming at a high level.',
      el: 'Από τον πρώτο χρόνο: σοβαρά μαθηματικά και hardcore προγραμματισμός σε C++ και Java, με το πρώτο μου διαχειριστικό, σύστημα σε Java για νοσοκομεία. Η πρώτη μου πραγματική επαφή με τον προγραμματισμό σε υψηλό επίπεδο.',
    },
  },
  {
    id: 'postgres',
    rail: { en: 'SQL', el: 'SQL' }, label: { en: 'PostgreSQL', el: 'PostgreSQL' },
    title: { en: 'A special mention', el: 'Ειδική μνεία' },
    text: {
      en: "Six months of school for this one course. Let's just say we struggled. That's where I learned that data has architecture.",
      el: 'Έξι μήνες σχολής μόνο για αυτό το μάθημα. Ας πούμε ότι ζοριστήκαμε. Εκεί κατάλαβα ότι τα δεδομένα έχουν αρχιτεκτονική.',
    },
  },
  {
    id: 'courses',
    rail: { en: '2016', el: '2016' }, label: { en: '2009–2016', el: '2009–2016' },
    title: { en: '49 courses', el: '49 μαθήματα' },
    text: {
      en: 'Forty-nine courses from 2009 to 2016: lectures, exams, group sessions, long nights of study and code. Here are some of the most serious ones.',
      el: 'Σαράντα εννέα μαθήματα από το 2009 ως το 2016: διαλέξεις, εξετάσεις, ομαδικά sessions, ατελείωτο διάβασμα και κώδικας. Εδώ είναι μερικά από τα πιο σοβαρά.',
    },
  },
  {
    id: 'graduation',
    rail: { en: 'MEng', el: 'Δίπλωμα' }, label: { en: '2016', el: '2016' },
    title: { en: 'Diploma thesis · MEng', el: 'Διπλωματική · Δίπλωμα Μηχανικού' },
    text: {
      en: 'Smart Questionnaire Generator: a SaaS application for businesses such as restaurants, building smart questionnaires for their customers (Vue.js, Laravel). 2016 — MEng.',
      el: 'Smart Questionnaire Generator: μια SaaS εφαρμογή για επιχειρήσεις όπως τα εστιατόρια, που φτιάχνει έξυπνα ερωτηματολόγια για τους πελάτες τους (Vue.js, Laravel). 2016 — Δίπλωμα Μηχανικού.',
    },
  },
  {
    id: 'reach', side: true,
    rail: { en: '2017', el: '2017' }, label: { en: '2017–2021', el: '2017–2021' },
    title: { en: 'My first job: Reach Web Agency', el: 'Η πρώτη μου δουλειά: Reach Web Agency' },
    text: {
      en: 'My first job! At Reach I learned the trade and took my first steps in freelancing: first clients, first websites, first e-commerce stores connected to marketplaces. 2019 — political campaigns: shipping fast under pressure.',
      el: 'Η πρώτη μου δουλειά! Στη Reach έμαθα τη δουλειά και έκανα τα πρώτα μου βήματα στο freelancing: πρώτοι πελάτες, πρώτα sites, πρώτα e-shops συνδεδεμένα με marketplaces. 2019 — πολιτικές καμπάνιες: παράδοση με πίεση χρόνου.',
    },
  },
  {
    id: 'kalimera', side: true,
    rail: { en: '2021', el: '2021' }, label: { en: '2021–2024', el: '2021–2024' },
    title: { en: 'Kalimera, my own product', el: 'Kalimera, το δικό μου προϊόν' },
    text: {
      en: 'Building my own product taught me to see software as a business.',
      el: 'Φτιάχνοντας το δικό μου προϊόν, έμαθα να βλέπω το λογισμικό ως επιχείρηση.',
    },
  },
  {
    id: 'koan', side: true,
    rail: { en: '2024', el: '2024' }, label: { en: '05/2024–06/2025', el: '05/2024–06/2025' },
    title: { en: 'KOAN S.A. · Director of Sustainable Tourism Development', el: 'KOAN S.A. · Διευθυντής Ανάπτυξης Βιώσιμου Τουρισμού' },
    text: {
      en: 'Leading the digital transformation and outward reach of three islands: €500K programme, a multidisciplinary team, an 8-member consortium that secured EU funding.',
      el: 'Ψηφιακός μετασχηματισμός και εξωστρέφεια για τρία νησιά: πρόγραμμα €500K, διεπιστημονική ομάδα και κοινοπραξία 8 φορέων που εξασφάλισε ευρωπαϊκή χρηματοδότηση.',
    },
  },
  {
    id: 'ai', side: true,
    rail: { en: '2025', el: '2025' }, label: { en: '07/2025–12/2025', el: '07/2025–12/2025' },
    title: { en: 'Deep dive into AI engineering', el: 'Βουτιά στο AI engineering' },
    text: { en: 'A planned pause to study AI engineering in depth.', el: 'Μια συνειδητή παύση για να μάθω AI engineering σε βάθος.' },
  },
  {
    id: 'deindeal', side: true,
    rail: { en: '2026', el: '2026' }, label: { en: '2026', el: '2026' },
    title: { en: 'DeinDeal.ch · AI Software Engineer', el: 'DeinDeal.ch · AI Software Engineer' },
    text: {
      en: 'Responsible for integrating, filtering, translating and preparing 800,000+ products for a Swiss marketplace, with an AI application I built from scratch.',
      el: 'Υπεύθυνος για το integration, το φιλτράρισμα, τη μετάφραση και την προετοιμασία 800.000+ προϊόντων για ελβετικό marketplace, με AI εφαρμογή που έχτισα από το μηδέν.',
    },
  },
  {
    id: 'side',
    rail: { en: 'Side', el: 'Πελάτες' }, label: { en: 'All along', el: 'Σε όλη τη διαδρομή' },
    title: { en: 'The parallel line', el: 'Η παράλληλη γραμμή' },
    text: { en: 'And through all of it, I never stopped building for my own clients.', el: 'Και σε όλη τη διαδρομή, δεν σταμάτησα ποτέ να χτίζω για τους δικούς μου πελάτες.' },
  },
  {
    id: 'today',
    rail: { en: 'Today', el: 'Σήμερα' }, label: { en: 'Today', el: 'Σήμερα' },
    text: { en: 'Engineer. Manager. Problem solver.', el: 'Engineer. Manager. Problem solver.' },
  },
];

/** The words drawn inside the scenes, by scene. */
export const art = {
  // the blackboard in Chania, one line at a time
  board: ['d/dx (x² + 3x) = 2x + 3', '∫ 2x dx = x² + C', "y'' + y = 0", 'y = C₁ cos x + C₂ sin x'],
  chania: { campus: { en: 'Technical University of Crete', el: 'Πολυτεχνείο Κρήτης' } },
  firstyear: {
    java: ['class Patient {', '  String name;', '  Ward ward;', '}'],
  },
  cpp: {
    code: ['#include <iostream>', '', 'int main() {', '  std::cout << "Hello, world!";', '  return 0;', '}'],
    out: '> Hello, world!',
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
  /** all the courses (the ones named above are some of the most serious) */
  total: 49,
  years: [2009, 2016],
  /** the course counter beside the ride */
  course: { en: 'course', el: 'μάθημα' },
  /** the ride can be taken by hand: dragged sideways, or sent back and on again */
  ride: {
    back: { en: 'Ride it back', el: 'Πίσω με το τρενάκι' },
    again: { en: 'Ride it again', el: 'Ξανά το τρενάκι' },
    drag: { en: 'Or drag the ride sideways', el: 'Ή σύρε το τρενάκι δεξιά-αριστερά' },
  },
  /** what the years held, drawn along the ride */
  moments: [
    { en: 'code', el: 'κώδικας' }, { en: 'lectures', el: 'διαλέξεις' }, { en: 'group sessions', el: 'ομαδικά sessions' },
    { en: 'exams', el: 'εξετάσεις' }, { en: 'study', el: 'διάβασμα' }, { en: 'programming', el: 'προγραμματισμός' },
  ] as Copy[],
  graduation: {
    app: 'Smart Questionnaire Generator',
    question: { en: 'How was your meal?', el: 'Πώς ήταν το γεύμα σας;' },
    send: { en: 'Send', el: 'Αποστολή' },
  },
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
    { name: 'Arogi Kos · Arangia · La Islakos', text: { en: 'Brand-led websites and an online store.', el: 'Brand-led ιστοσελίδες και ένα online κατάστημα.' } },
    { name: 'Feed Intelligence', text: { en: '6-stage translation pipeline, 220,000-SKU catalogue.', el: 'Pipeline μετάφρασης 6 σταδίων, κατάλογος 220.000 SKU.' } },
  ],
  roles: [{ en: 'Engineer', el: 'Engineer' }, { en: 'Manager', el: 'Manager' }, { en: 'Problem solver', el: 'Problem solver' }] as Copy[],
  cta: { en: "Let's build something together.", el: 'Ας χτίσουμε κάτι μαζί.' },
  contact: { en: 'Contact', el: 'Επικοινωνία' },
};
