/*
 * The brief assistant: reads a visitor's idea, asks 2–3 sharper questions, then drafts a one-page brief.
 *
 * Only the shape lives here for now. `previewAssistant` is a stand-in that runs on your machine during
 * `npm run dev` so the flow can be seen and judged; it fills templates with the visitor's own words.
 * The real one (an endpoint that streams from the model, loaded with Petros's projects and services)
 * comes with the backend and implements the same interface. On the live site, with no assistant,
 * the form stays a plain form.
 */

export type Angle = 'Competition' | 'Business' | 'Software';
export type Question = { angle: Angle; text: string; replies: string[] };
export type Answer = Question & { answer: string };
export type BriefSection = 'problem' | 'users' | 'competition' | 'directions' | 'technical' | 'open';

export interface BriefAssistant {
  /** Streams the follow-up questions, one at a time. */
  questions(idea: string, need: string): AsyncIterable<Question>;
  /** Streams the brief, a section and a chunk of its text at a time. */
  draft(idea: string, need: string, answers: Answer[]): AsyncIterable<{ section: BriefSection; chunk: string }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The idea's first sentence, shortened, to quote back to the visitor. */
function gist(idea: string) {
  const first = idea.trim().split(/(?<=[.!?;])\s|\n/)[0] ?? idea;
  const words = first.replace(/[.!?;]+$/, '').split(/\s+/);
  return words.length > 12 ? `${words.slice(0, 12).join(' ')}…` : words.join(' ');
}

function previewQuestions(idea: string, need: string): Question[] {
  const it = gist(idea);
  const site = need === 'Website' || need === 'Booking system' || need === 'E-commerce & feeds';
  return [
    {
      angle: 'Competition',
      text: `Who handles “${it}” today — a tool you tried, a competitor, a spreadsheet — and where does it fall short?`,
      replies: ['We do it by hand', 'We tried a tool', 'Competitors already do it', 'Not sure yet'],
    },
    {
      angle: 'Business',
      text: site
        ? 'What should it bring in — more bookings, more orders, fewer emails — and how would you notice?'
        : 'What is it worth if this works — hours saved each week, more sales, a new product to sell?',
      replies: site ? ['More bookings', 'More orders', 'Less admin', 'Not sure yet'] : ['Hours saved', 'More revenue', 'A new product', 'Not sure yet'],
    },
    {
      angle: 'Software',
      text: site
        ? 'What does it have to plug into — a booking engine, a shop, a channel manager — and how much traffic do you expect?'
        : 'Which systems does it have to talk to, and how much moves through them each day?',
      replies: site ? ['Booking.com / Airbnb', 'Shopify / WooCommerce', 'Nothing yet', 'Not sure yet'] : ['ERP / CRM', 'Email', 'Excel / Sheets', 'Not sure yet'],
    },
  ];
}

const DIRECTIONS: Record<string, string> = {
  'AI automation':
    '1. An assistant that reads each incoming item, fills it into your system and leaves it for a person to approve.\n2. A fully automatic pipeline that only flags the unusual cases for review.\n3. A one-week pilot on a single process first, to measure the hours saved before going further.',
  'AI product or bot':
    '1. A focused assistant that answers from your own documents and data, not the open web.\n2. A bot inside the channel your customers already use, handing over to a person when it should.\n3. A small paid pilot with a few real users before building the full product.',
  Website:
    '1. A brand-led site designed around the one action you want visitors to take.\n2. A site with the booking, shop or content system wired in from day one.\n3. A fast first version in weeks, then improve it with what real visitors do.',
  'Booking system':
    '1. Direct bookings on your own site, synced with Airbnb and Booking.com.\n2. One calendar and one inbox for every channel, so nothing is double-booked.\n3. Automated guest messages and payments around each stay.',
  'E-commerce & feeds':
    '1. Automated product feeds to the marketplaces you sell on.\n2. AI-assisted catalogue mapping, translation and category matching.\n3. Pricing rules that update on their own across every channel.',
};

function previewDraft(idea: string, need: string, answers: Answer[]): Record<BriefSection, string> {
  const by = (a: Angle) => answers.find((x) => x.angle === a)?.answer.trim() || 'To confirm on the first call.';
  return {
    problem: `${idea.trim()}\n\nWhat it's worth: ${by('Business')}`,
    users: 'Your team, and whoever works with the result every day. To confirm on the first call.',
    competition: by('Competition'),
    directions: DIRECTIONS[need] ?? DIRECTIONS['AI automation'],
    technical: by('Software'),
    open: 'Budget and timing. Who on your side owns the process and the data. What a first version must do, and what can wait.',
  };
}

/** Local stand-in for the model: sample questions and a templated brief, streamed at a model-like pace. */
export const previewAssistant: BriefAssistant = {
  async *questions(idea, need) {
    await wait(1400);
    for (const q of previewQuestions(idea, need)) {
      yield q;
      await wait(450);
    }
  },
  async *draft(idea, need, answers) {
    await wait(700);
    const brief = previewDraft(idea, need, answers);
    for (const section of Object.keys(brief) as BriefSection[]) {
      for (const word of brief[section].split(/(?<=\s)/)) {
        yield { section, chunk: word };
        await wait(18);
      }
      await wait(160);
    }
  },
};
