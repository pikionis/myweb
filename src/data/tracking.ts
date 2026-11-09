// The measuring and ad tags of the site (src/scripts/consent.ts loads them, and only with the visitor's consent), read
// from the environment when the site is built: in `.env` locally, and as repository variables in the deploy
// workflow. A tag whose id is missing, or isn't shaped like one, is simply left out; with none at all there is no
// banner and nothing to load.

const env = (key: string) => String((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[key] ?? import.meta.env[key] ?? '').trim();
const shaped = (key: string, re: RegExp) => { const v = env(key); return re.test(v) ? v : ''; };

export const tags = {
  /** Google Analytics 4 (analytics) */
  ga4: shaped('GA4_MEASUREMENT_ID', /^G-[A-Z0-9]{4,20}$/),
  /** Google Ads, and the label of its lead conversion (marketing) */
  ads: shaped('GOOGLE_ADS_ID', /^AW-\d{5,15}$/),
  adsLead: shaped('GOOGLE_ADS_LEAD_LABEL', /^[\w-]{4,40}$/),
  /** Meta Pixel, TikTok Pixel, LinkedIn Insight Tag (marketing); LinkedIn's lead needs a conversion of its own */
  meta: shaped('META_PIXEL_ID', /^\d{6,20}$/),
  tiktok: shaped('TIKTOK_PIXEL_ID', /^[A-Z0-9]{8,30}$/),
  linkedin: shaped('LINKEDIN_PARTNER_ID', /^\d{3,12}$/),
  linkedinLead: shaped('LINKEDIN_LEAD_CONVERSION_ID', /^\d{3,15}$/),
};
export type Tags = typeof tags;

/** whether there is anything to ask consent for */
export const tracking = Boolean(tags.ga4 || tags.ads || tags.meta || tags.tiktok || tags.linkedin);
