// The words inside the /services drawings (src/components/ServiceArt.astro). They are examples of what each
// service does, drawn as part of the picture: no claims, no numbers beyond what the cards say.
export const serviceArt = {
  web: {
    data: '{ }',
    llms: 'llms.txt',
    /** the language switch in the drawn site's menu; the first one is where it rests */
    langs: ['EN', 'EL', 'DE'],
    greet: 'Hi! How can I help?',
  },
  /** a guest and the bot: they talk, it books, the guest is delighted */
  bots: [
    { from: 'guest', text: 'Free room this Friday?' },
    { from: 'bot', text: 'Yes, two. Book one?' },
    { from: 'guest', text: 'Yes please!' },
    { from: 'bot', text: 'Booked for Friday.' },
  ],
  apps: {
    ask: 'How did August compare to last year?',
    months: ['Jun', 'Jul', 'Aug', 'Sep'],
  },
  commerce: {
    /** six of the twenty languages, then the rest */
    langs: ['EN', 'DE', 'FR', 'IT', 'EL', 'ES'],
    more: '+14',
  },
  search: {
    ask: 'Best hotel near the beach?',
    you: 'Your business',
  },
} as const;
