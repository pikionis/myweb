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
    id: 'studies',
    rail: { en: '2009–16', el: '2009–16' }, label: { en: '2009–2016', el: '2009–2016' },
    title: { en: 'My first languages, and 49 courses', el: 'Οι πρώτες μου γλώσσες, και 49 μαθήματα' },
    text: {
      en: 'C++ and Java, my first programming languages. Then SQL and PostgreSQL, algorithms, mathematics: 49 courses over seven years.',
      el: 'C++ και Java, οι πρώτες μου γλώσσες προγραμματισμού. Μετά SQL και PostgreSQL, αλγόριθμοι, μαθηματικά: 49 μαθήματα σε επτά χρόνια.',
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
      en: 'My first job! At Reach I learned the trade and took my first steps in freelancing: first clients, first websites, first e-commerce stores connected to marketplaces.',
      el: 'Η πρώτη μου δουλειά! Στη Reach έμαθα τη δουλειά και έκανα τα πρώτα μου βήματα στο freelancing: πρώτοι πελάτες, πρώτα sites, πρώτα e-shops συνδεδεμένα με marketplaces.',
    },
  },
  {
    id: 'kalimera', side: true,
    rail: { en: '2021', el: '2021' }, label: { en: '2021–2024', el: '2021–2024' },
    title: { en: 'Kalimera', el: 'Kalimera' },
    // the chapter's opening line; its beats are in art.kalimera
    text: { en: 'How I learned the startup ecosystem from the inside.', el: 'Πώς γνώρισα το startup οικοσύστημα από μέσα.' },
  },
  {
    id: 'koan', side: true,
    rail: { en: '2024', el: '2024' }, label: { en: '05/2024–06/2025', el: '05/2024–06/2025' },
    title: { en: 'KOAN S.A.', el: 'ΚΩΑΝ Α.Ε.' },
    // the chapter's opening line; its beats are in art.koan
    text: { en: 'Director of Sustainable Tourism Development.', el: 'Διευθυντής Βιώσιμης Τουριστικής Ανάπτυξης.' },
  },
  {
    id: 'ai', side: true,
    rail: { en: '2025', el: '2025' }, label: { en: '07/2025–12/2025', el: '07/2025–12/2025' },
    title: { en: 'Deep dive into AI engineering', el: 'Βουτιά στο AI engineering' },
    text: { en: 'A planned pause to study AI engineering in depth.', el: 'Μια συνειδητή παύση για να μάθω AI engineering σε βάθος.' },
  },
  {
    id: 'deindeal', side: true,
    rail: { en: '2026', el: '2026' }, label: { en: '01/2026–09/2026', el: '01/2026–09/2026' },
    title: { en: 'DeinDeal.ch', el: 'DeinDeal.ch' },
    // the chapter's opening line; its beats are in art.deindeal
    text: { en: 'Swiss e-commerce marketplace. AI Software Engineer.', el: 'Ελβετικό e-commerce marketplace. AI Software Engineer.' },
  },
  {
    id: 'today',
    rail: { en: 'Today', el: 'Σήμερα' }, label: { en: 'Today', el: 'Σήμερα' },
    text: { en: 'Engineer. Manager. Problem solver.', el: 'Engineer. Manager. Problem solver.' },
  },
];

/** The words drawn inside the scenes, by scene. */
export const art = {
  chania: { city: { en: 'Chania', el: 'Χανιά' }, campus: { en: 'Technical University of Crete', el: 'Πολυτεχνείο Κρήτης' } },
  /** the skills the train carries: the first ones on board from the start, then one more loaded at every stop */
  cargo: {
    first: ['C++', 'Java', 'Maths'],
    stops: ['Algorithms', 'Databases', 'OOP', 'Python', 'AI', 'Cloud', 'Mobile'],
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
  /** the course whose hill is drawn in cobalt, the highest on the way: it comes back in 2025 */
  peak: 19,
  /** all the courses (the ones named above are some of the most serious) */
  total: 49,
  years: [2009, 2016],
  /** the course counter beside the journey */
  course: { en: 'course', el: 'μάθημα' },
  /** the journey can be taken by hand: dragged sideways, or sent back and on again */
  ride: {
    back: { en: 'Back up the train', el: 'Όπισθεν το τρένο' },
    again: { en: 'All aboard again', el: 'Ξανά επιβίβαση' },
    drag: { en: 'Or drag the train sideways', el: 'Ή σύρε το τρένο δεξιά-αριστερά' },
  },
  /** read one after another as the train goes: each from the point of the journey (0 to 1) it is reached */
  lines: [
    { at: 0, text: {
      en: 'From the first year: serious mathematics, and hardcore programming in C++ and Java. My first real contact with programming at a high level.',
      el: 'Από τον πρώτο χρόνο: σοβαρά μαθηματικά και hardcore προγραμματισμός σε C++ και Java. Η πρώτη μου πραγματική επαφή με τον προγραμματισμό σε υψηλό επίπεδο.' } },
    { at: 0.1, text: {
      en: 'My first management system: Java software for hospitals. Software for real people.',
      el: 'Το πρώτο μου διαχειριστικό: σύστημα σε Java για νοσοκομεία. Λογισμικό για πραγματικούς ανθρώπους.' } },
    { at: 0.22, text: {
      en: "A special mention: six months of school for one course, PostgreSQL. Let's just say we struggled. That's where I learned that data has architecture.",
      el: 'Ειδική μνεία: έξι μήνες σχολής για ένα μάθημα, την PostgreSQL. Ας πούμε ότι ζοριστήκαμε. Εκεί κατάλαβα ότι τα δεδομένα έχουν αρχιτεκτονική.' } },
    { at: 0.9, text: { en: 'And at the end of the line, the diploma thesis.', el: 'Και στο τέλος της γραμμής, η διπλωματική.' } },
  ] as { at: number; text: Copy }[],
  /** what the years held, one at each station on the way (one with a note: the special mention) */
  moments: [
    { label: { en: 'lectures', el: 'διαλέξεις' } },
    { label: { en: 'study nights at friends’ houses', el: 'διάβασμα και μαζώξεις σε σπίτια' } },
    { label: { en: 'experiments in the lab', el: 'πειράματα στο εργαστήριο' } },
    { label: { en: 'six months of PostgreSQL', el: 'έξι μήνες PostgreSQL' }, note: { en: 'one course. We struggled.', el: 'ένα μάθημα. Ζοριστήκαμε.' } },
    { label: { en: 'big group projects', el: 'μεγάλα ομαδικά projects' } },
    { label: { en: 'Python', el: 'Python' } },
    { label: { en: 'exams', el: 'εξετάσεις' } },
    { label: { en: 'our first application', el: 'η πρώτη μας εφαρμογή' } },
  ] as { label: Copy; note?: Copy }[],
  graduation: {
    app: 'Smart Questionnaire Generator',
    question: { en: 'How was your meal?', el: 'Πώς ήταν το γεύμα σας;' },
    send: { en: 'Send', el: 'Αποστολή' },
    graduated: { en: 'Graduated', el: 'Αποφοίτησα' },
    degree: { en: 'MEng · Electrical & Computer Engineering', el: 'Δίπλωμα Μηχανικού · Ηλεκτρολόγων Μηχανικών & Μηχανικών Υπολογιστών' },
  },
  station: { en: 'Diploma Thesis', el: 'Διπλωματική' },
  reach: {
    markets: ['Skroutz', 'Amazon', 'Google'],
    feed: 'XML',
  },
  /** the Kalimera chapter, "From dawn to daylight" (KalimeraChapter.astro): one morning, a beat for each step of
   *  the startup; the opening line is the scene's text */
  kalimera: {
    /** the clock in the corner: the opening, then each beat */
    clock: ['05:30', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
    beats: [
      { en: 'I led the product design and shaped the business model.', el: 'Καθοδήγησα το design του προϊόντος και διαμόρφωσα το business model.' },
      { en: 'We launched the MVP in a local market: 80 sales in the first year.', el: 'Βγάλαμε το MVP σε τοπική αγορά: 80 πωλήσεις τον πρώτο χρόνο.' },
      { en: "Real customers, real feedback. We tested the product and learned what worked and what didn't.", el: 'Πραγματικοί πελάτες, πραγματικό feedback. Δοκιμάσαμε το προϊόν και μάθαμε τι δουλεύει και τι όχι.' },
      {
        en: "We took part in Idea Platform, the contest in which CapsuleT, Greece's incubator for technology and tourism, filters business ideas. We pivoted and proposed a new business model to its judges: the president of the hoteliers' association, the director of Athens Eleftherios Venizelos International Airport (ATH), the head of the Onassis Foundation and the head of startup seed at the National Bank of Greece.",
        el: 'Πήραμε μέρος στο Idea Platform, τον διαγωνισμό με τον οποίο το CapsuleT, το incubator της Ελλάδας για τεχνολογία και τουρισμό, φιλτράρει επιχειρηματικές ιδέες. Κάναμε pivot και προτείναμε νέο business model στους κριτές του: τον πρόεδρο της ένωσης ξενοδόχων, τη διευθύντρια του Διεθνούς Αερολιμένα Αθηνών «Ελευθέριος Βενιζέλος» (ATH), τον head του Ιδρύματος Ωνάση και τον επικεφαλής startup seed της Εθνικής Τράπεζας της Ελλάδος.',
      },
      {
        en: 'In 2022 our pivot took 2nd place at Idea Platform. In 2023, as a team of six, we took part in the main CapsuleT competition, at its accelerator in Athens, and came away with a lot of experience.',
        el: 'Το 2022 το pivot μας πήρε τη 2η θέση στο Idea Platform. Το 2023, ομάδα έξι ατόμων, πήραμε μέρος στον κεντρικό διαγωνισμό του CapsuleT, στο accelerator του στην Αθήνα, και φύγαμε με πολλές εμπειρίες.',
      },
      {
        en: "We learned to write a business plan, trained in pitching with Linda Plano for two weeks, joined Google's digital marketing workshops, and were guided by three mentors for six months.",
        el: 'Μάθαμε να φτιάχνουμε business plan, κάναμε δύο εβδομάδες pitching με τη Linda Plano, workshops ψηφιακού μάρκετινγκ με τη Google και είχαμε τρεις μέντορες για έξι μήνες.',
      },
      {
        en: "That's how I learned how the startup ecosystem really works, and how to build software as a business.",
        el: 'Έτσι γνώρισα πώς λειτουργεί πραγματικά το startup οικοσύστημα και πώς χτίζεται το λογισμικό ως επιχείρηση.',
      },
    ] as Copy[],
    app: 'Kalimera',
    canvas: { en: 'Business Model Canvas', el: 'Business Model Canvas' },
    /** the canvas's four named blocks: the ones the pivot rewrites */
    blocks: {
      value: { en: 'Value proposition', el: 'Πρόταση αξίας' },
      channels: { en: 'Channels', el: 'Κανάλια' },
      segments: { en: 'Customer segments', el: 'Τμήματα πελατών' },
      revenue: { en: 'Revenue streams', el: 'Ροές εσόδων' },
    },
    kos: { en: 'Kos', el: 'Κως' },
    mvp: 'MVP',
    sales: 80,
    salesLabel: { en: 'sales in the first year', el: 'πωλήσεις τον πρώτο χρόνο' },
    idea: 'Idea Platform · CapsuleT',
    prize: { en: '2nd place', el: '2η θέση' },
    contest: 'Idea Platform · 2022',
    accelerator: 'CapsuleT Accelerator',
    athens: { en: 'Athens · 2023', el: 'Αθήνα · 2023' },
    /** what the accelerator gave: a card each, at the end of a ray of the noon sun */
    cards: [
      { title: { en: 'Business plan', el: 'Business plan' }, note: { en: 'growth and financials', el: 'ανάπτυξη και οικονομικά' } },
      { title: { en: 'Pitch training', el: 'Pitch training' }, note: { en: 'Linda Plano · 2 weeks', el: 'Linda Plano · 2 εβδομάδες' } },
      { title: { en: 'Digital marketing', el: 'Ψηφιακό μάρκετινγκ' }, note: { en: 'workshops with Google', el: 'workshops με τη Google' } },
      { title: { en: '3 mentors', el: '3 μέντορες' }, note: { en: '6 months', el: '6 μήνες' } },
    ] as { title: Copy; note: Copy }[],
    /** the ecosystem, as the closing map draws it */
    nodes: {
      founders: { en: 'founders', el: 'ιδρυτές' },
      mentors: { en: 'mentors', el: 'μέντορες' },
      investors: { en: 'investors', el: 'επενδυτές' },
      customers: { en: 'customers', el: 'πελάτες' },
      partners: { en: 'partners', el: 'συνεργάτες' },
      accelerator: { en: 'accelerator', el: 'accelerator' },
    },
    flows: { funding: { en: 'funding', el: 'χρηματοδότηση' }, product: { en: 'product', el: 'προϊόν' }, market: { en: 'market', el: 'αγορά' } },
    words: [
      { en: 'funding', el: 'χρηματοδότηση' }, { en: 'pitching', el: 'pitching' }, { en: 'scalability', el: 'κλιμάκωση' },
      { en: 'roadmap', el: 'roadmap' }, { en: 'go-to-market', el: 'go-to-market' }, { en: 'sales', el: 'πωλήσεις' },
      { en: 'team leadership · 6-member team', el: 'ηγεσία ομάδας · ομάδα 6 ατόμων' },
    ] as Copy[],
  },
  /** the KOAN chapter, "Opening the skies" (KoanChapter.astro): a departures board and a map, a beat for each move;
   *  the opening line is the scene's text. Partners are named in words only, never as logos */
  koan: {
    beats: [
      {
        en: 'Appointed by the mayors of Kos, Astypalea and Nisyros with one goal: the digital transformation and international outreach of three islands. Budget: €500,000.',
        el: 'Η θέση μού ανατέθηκε από τους δημάρχους Κω, Αστυπάλαιας και Νισύρου με έναν στόχο: την ψηφιακή μετάβαση και την εξωστρέφεια τριών νησιών. Budget: €500.000.',
      },
      {
        en: "We represented the islands with our own pavilions at Europe's largest tourism fairs: WTM London and ITB Berlin.",
        el: 'Εκπροσωπήσαμε τα νησιά με δικά μας περίπτερα στις μεγαλύτερες εκθέσεις τουρισμού της Ευρώπης: WTM London και ITB Berlin.',
      },
      {
        en: 'The UK was our largest market, so I built a portfolio of actions around it: an airline partnership with Jet2, content with National Geographic, a Disney+ campaign and targeted social media, plus a few smaller ones.',
        el: 'Η Βρετανία ήταν η μεγαλύτερη αγορά μας, οπότε έστησα γύρω της ένα portfolio δράσεων: συνεργασία με τη Jet2, περιεχόμενο με το National Geographic, καμπάνια στο Disney+ και στοχευμένα social media, και μερικές ακόμα μικρότερης κλίμακας.',
      },
      {
        en: 'The aim was to show it, as a portfolio of actions, to the airlines of the countries we would target, to open the routes we wanted.',
        el: 'Σκοπός ήταν να το δείξουμε ως portfolio δράσεων στις αεροπορικές των χωρών που θα στοχεύαμε, για να ανοίξουμε τα δρομολόγια που μας ενδιέφεραν.',
      },
      {
        en: "We would choose those countries strategically with Fraport Greece's marketing team, to bring in new airlines and, through them, new markets. Somewhere along the way, political disagreements stopped the strategy halfway.",
        el: 'Τις χώρες αυτές θα τις στοχεύαμε στρατηγικά μαζί με το marketing της Fraport Greece, για να φέρουμε νέες αεροπορικές και, μέσα από αυτές, νέες αγορές. Κάπου εκεί, λόγω πολιτικών διαφωνιών, η στρατηγική σταμάτησε στη μέση.',
      },
      {
        en: 'Behind it: a multidisciplinary team run with Agile and Jira, and an 8-member consortium that secured EU funding (ESPA 2021–2027) for digital technologies and data management.',
        el: 'Από πίσω: μια διεπιστημονική ομάδα με Agile και Jira, και μια κοινοπραξία 8 φορέων που εξασφάλισε ευρωπαϊκή χρηματοδότηση (ΕΣΠΑ 2021–2027) για ψηφιακές τεχνολογίες και διαχείριση δεδομένων.',
      },
      {
        en: 'What I took with me: strategy, negotiation with big partners, and leading people toward one goal.',
        el: 'Τι κράτησα: στρατηγική, διαπραγμάτευση με μεγάλους συνεργάτες και καθοδήγηση ανθρώπων προς έναν στόχο.',
      },
    ] as Copy[],
    islands: [{ en: 'Kos', el: 'Κως' }, { en: 'Astypalea', el: 'Αστυπάλαια' }, { en: 'Nisyros', el: 'Νίσυρος' }] as Copy[],
    me: { en: 'Petros', el: 'Πέτρος' },
    budget: '€500K',
    /** the departures board: its name, its columns, and a row for each move (shown from the beat it arrives at;
     *  each status from its beat on, at k + 0.5 once that beat has played a while; the closing clears the board for
     *  its own row) */
    board: { name: { en: 'Departures', el: 'Αναχωρήσεις' }, dest: { en: 'Destination', el: 'Προορισμός' }, status: { en: 'Status', el: 'Κατάσταση' } },
    rows: [
      { at: 1, dest: { en: '3 ISLANDS', el: '3 ΝΗΣΙΑ' }, act: { en: 'DIGITAL TRANSFORMATION · OUTREACH', el: 'ΨΗΦΙΑΚΗ ΜΕΤΑΒΑΣΗ · ΕΞΩΣΤΡΕΦΕΙΑ' }, status: [[1, { en: 'CHECK-IN', el: 'CHECK-IN' }]] },
      { at: 2, dest: { en: 'LONDON', el: 'ΛΟΝΔΙΝΟ' }, act: { en: 'WTM', el: 'WTM' }, status: [[2, { en: 'OWN PAVILION', el: 'ΔΙΚΟ ΠΕΡΙΠΤ.' }]] },
      { at: 2, dest: { en: 'BERLIN', el: 'ΒΕΡΟΛΙΝΟ' }, act: { en: 'ITB', el: 'ITB' }, status: [[2, { en: 'OWN PAVILION', el: 'ΔΙΚΟ ΠΕΡΙΠΤ.' }]] },
      { at: 3, dest: { en: 'UK', el: 'ΗΒ' }, act: { en: 'AIRLINE PARTNERSHIP · JET2', el: 'ΣΥΝΕΡΓΑΣΙΑ ΜΕ ΑΕΡΟΠΟΡΙΚΗ · JET2' }, status: [[3, { en: 'SCHEDULED', el: 'ΠΡΟΓΡΑΜΜ.' }], [4, { en: 'ON TIME', el: 'ΣΤΗΝ ΩΡΑ' }]] },
      { at: 3, dest: { en: 'UK', el: 'ΗΒ' }, act: { en: 'DOCUMENTARY & TRAVEL CONTENT · NATIONAL GEOGRAPHIC', el: 'ΝΤΟΚΙΜΑΝΤΕΡ & ΤΑΞΙΔΙΩΤΙΚΟ ΠΕΡΙΕΧΟΜΕΝΟ · NATIONAL GEOGRAPHIC' }, status: [[3, { en: 'SCHEDULED', el: 'ΠΡΟΓΡΑΜΜ.' }], [4, { en: 'ON TIME', el: 'ΣΤΗΝ ΩΡΑ' }]] },
      { at: 3, dest: { en: 'UK', el: 'ΗΒ' }, act: { en: 'STREAMING CAMPAIGN · DISNEY+', el: 'ΚΑΜΠΑΝΙΑ STREAMING · DISNEY+' }, status: [[3, { en: 'SCHEDULED', el: 'ΠΡΟΓΡΑΜΜ.' }], [4, { en: 'ON TIME', el: 'ΣΤΗΝ ΩΡΑ' }]] },
      { at: 3, dest: { en: 'UK', el: 'ΗΒ' }, act: { en: 'SOCIAL MEDIA CAMPAIGNS · UK AUDIENCE', el: 'ΚΑΜΠΑΝΙΕΣ SOCIAL MEDIA · ΚΟΙΝΟ ΗΒ' }, status: [[3, { en: 'SCHEDULED', el: 'ΠΡΟΓΡΑΜΜ.' }], [4, { en: 'ON TIME', el: 'ΣΤΗΝ ΩΡΑ' }]] },
      { at: 5, dest: { en: 'NEW MARKETS', el: 'ΝΕΕΣ ΑΓΟΡΕΣ' }, act: { en: 'NEW AIRLINES · WITH FRAPORT GREECE', el: 'ΝΕΕΣ ΑΕΡΟΠΟΡΙΚΕΣ · ΜΕ ΤΗ FRAPORT GREECE' }, status: [[5, { en: 'BOARDING', el: 'ΕΠΙΒΙΒΑΣΗ' }], [5.5, { en: 'HALTED', el: 'ΔΙΑΚΟΠΗΚΕ' }]] },
      { at: 7, dest: { en: 'AI ENGINEERING', el: 'AI ENGINEERING' }, act: { en: 'NEXT DESTINATION', el: 'ΕΠΟΜΕΝΟΣ ΠΡΟΟΡΙΣΜΟΣ' }, status: [[7, { en: 'BOARDING', el: 'ΕΠΙΒΙΒΑΣΗ' }]] },
    ] as { at: number; dest: Copy; act: Copy; status: [number, Copy][] }[],
    /** the fairs, at their cities on the map */
    fairs: [{ city: { en: 'London', el: 'Λονδίνο' }, fair: 'WTM' }, { city: { en: 'Berlin', el: 'Βερολίνο' }, fair: 'ITB' }] as { city: Copy; fair: string }[],
    uk: { en: 'UK', el: 'ΗΒ' },
    /** the actions around the UK: what each is, and with whom (in words) */
    actions: [
      { what: { en: 'Airline partnership', el: 'Συνεργασία με αεροπορική' }, with: { en: 'Jet2', el: 'Jet2' } },
      { what: { en: 'Documentary & travel content', el: 'Ντοκιμαντέρ & ταξιδιωτικό περιεχόμενο' }, with: { en: 'National Geographic', el: 'National Geographic' } },
      { what: { en: 'Streaming campaign', el: 'Καμπάνια streaming' }, with: { en: 'Disney+', el: 'Disney+' } },
      { what: { en: 'Social media campaigns', el: 'Καμπάνιες social media' }, with: { en: 'UK audience', el: 'κοινό ΗΒ' } },
    ] as { what: Copy; with: Copy }[],
    more: { en: '+ a few smaller actions', el: '+ μερικές μικρότερες δράσεις' },
    portfolio: { en: 'Portfolio of actions', el: 'Portfolio δράσεων' },
    airlines: { en: 'airlines', el: 'αεροπορικές' },
    airport: { en: 'Kos airport', el: 'Αεροδρόμιο Κω' },
    fraport: { en: 'Fraport Greece marketing', el: 'Marketing Fraport Greece' },
    kanban: [{ en: 'To do', el: 'Προς υλοποίηση' }, { en: 'In progress', el: 'Σε εξέλιξη' }, { en: 'Done', el: 'Ολοκληρώθηκε' }] as Copy[],
    roles: [{ en: 'developers', el: 'developers' }, { en: 'content', el: 'περιεχόμενο' }, { en: 'advertising', el: 'διαφήμιση' }] as Copy[],
    espa: { en: 'ESPA 2021–2027', el: 'ΕΣΠΑ 2021–2027' },
  },
  ai: ['LLMs', 'RAG', 'Agents', 'MCP'],
  /** the DeinDeal chapter, "Swiss precision" (DeinDealChapter.astro): a watch movement that turns into a product
   *  line, a beat for each step; the opening line is the scene's text */
  deindeal: {
    city: { en: 'Zurich', el: 'Ζυρίχη' },
    beats: [
      {
        en: 'For years I helped small e-shops get their products onto big marketplaces. At DeinDeal I switched sides: I became the one onboarding them.',
        el: 'Για χρόνια βοηθούσα μικρά e-shops να περάσουν τα προϊόντα τους σε μεγάλα marketplaces. Στη DeinDeal άλλαξα πλευρά: έγινα αυτός που τα κάνει onboard.',
      },
      {
        en: 'I built the integrations: every partner, every format, every feed, connected end to end.',
        el: 'Έστησα τα integrations: κάθε συνεργάτης, κάθε format, κάθε feed, συνδεδεμένο από άκρη σε άκρη.',
      },
      {
        en: 'I was responsible for managing more than 800,000 unique product codes.',
        el: 'Ήμουν υπεύθυνος για τη διαχείριση περισσότερων από 800.000 μοναδικών κωδικών προϊόντων.',
      },
      {
        en: 'My job was to make it manageable: filter it, fix it and translate it into four languages, with an AI application I built from scratch.',
        el: 'Ο στόχος μου ήταν να γίνουν διαχειρίσιμα: να φιλτραριστούν, να διορθωθούν και να μεταφραστούν σε τέσσερις γλώσσες, με μια AI εφαρμογή που έχτισα από το μηδέν.',
      },
      {
        en: 'The result: 800,000+ products refreshed daily, ready for the marketplace, no spreadsheets.',
        el: 'Το αποτέλεσμα: 800.000+ προϊόντα με καθημερινή ανανέωση, έτοιμα για το marketplace, χωρίς spreadsheets.',
      },
      {
        en: 'Somewhere in there my first AI SaaS was born: Feedgenix. Upload a large dataset, pick the fields you want translated and the languages you need.',
        el: 'Κάπου εκεί γεννήθηκε το πρώτο μου AI SaaS: το Feedgenix. Ανεβάζεις ένα μεγάλο dataset, διαλέγεις ποια fields θέλεις να μεταφραστούν και σε ποιες γλώσσες.',
      },
      {
        en: "From solving one company's problem to building a product for many.",
        el: 'Από τη λύση ενός προβλήματος για μία εταιρεία, σε ένα προϊόν για πολλές.',
      },
    ] as Copy[],
    /** the other side of the counter: then, and now */
    then: '2017–2021',
    now: '2026',
    marketplace: { en: 'marketplace', el: 'marketplace' },
    hub: 'DeinDeal',
    formats: ['XML', 'CSV', 'JSON', 'FTP', 'SFTP', 'API'],
    count: 800000,
    codes: { en: 'unique product codes', el: 'μοναδικοί κωδικοί προϊόντων' },
    /** the movement: a gear for each stage, round the AI that drives them */
    gears: [{ en: 'Filter', el: 'Φιλτράρισμα' }, { en: 'Fix', el: 'Διόρθωση' }, { en: 'Translate', el: 'Μετάφραση' }, { en: 'Validate', el: 'Έλεγχος' }] as Copy[],
    /** the four languages, and one product's title in each (an example) */
    langs: [['DE', 'Ledersofa'], ['FR', 'Canapé en cuir'], ['IT', 'Divano in pelle'], ['EN', 'Leather sofa']],
    tags: [
      { en: 'structured JSON outputs', el: 'δομημένα JSON outputs' }, { en: 'multi-model routing', el: 'multi-model routing' },
      { en: 'content-hash caching', el: 'content-hash caching' }, { en: 'daily refresh', el: 'καθημερινή ανανέωση' },
    ] as Copy[],
    refresh: { en: 'daily refresh', el: 'καθημερινή ανανέωση' },
    feedgenix: {
      name: 'Feedgenix', site: 'feedgenix.com', url: 'https://feedgenix.com',
      visit: { en: 'Visit feedgenix.com', el: 'Δες το feedgenix.com' },
      dataset: 'dataset.csv',
      fields: [{ en: 'title', el: 'τίτλος' }, { en: 'description', el: 'περιγραφή' }, { en: 'attributes', el: 'χαρακτηριστικά' }] as Copy[],
      fieldsLabel: { en: 'Fields', el: 'Πεδία' },
      langsLabel: { en: 'Languages', el: 'Γλώσσες' },
      go: { en: 'Translate', el: 'Μετάφραση' },
    },
  },
  roles: [{ en: 'Engineer', el: 'Engineer' }, { en: 'Manager', el: 'Manager' }, { en: 'Problem solver', el: 'Problem solver' }] as Copy[],
  cta: { en: "Let's build something together.", el: 'Ας χτίσουμε κάτι μαζί.' },
  contact: { en: 'Contact', el: 'Επικοινωνία' },
};
