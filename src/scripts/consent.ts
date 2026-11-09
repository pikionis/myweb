/*
 * Consent, and what it lets the site measure (EU visitors: nothing loads before consent). The visitor's choice
 * (analytics, marketing) is kept in localStorage (`ohl-consent`); until there is one, the banner
 * (ConsentBanner.astro) asks, and Google's Consent Mode v2 stays at "denied" (set in Base.astro's head). Only once
 * a category is granted are its tags loaded: one Google tag (gtag.js) for Google Analytics 4 and Google Ads, then
 * the Meta, TikTok and LinkedIn pixels for marketing. A visitor who declines sends nothing to any of them.
 * Withdrawing a consent reloads the page, so tags already loaded are gone.
 *
 * What it reports (`track`): generate_lead (a form sent, from post() in brief.ts; also each network's lead event),
 * cta_click (`[data-cta]`), email_copy (main.ts), outbound_click (a link to another site). Where a visit came from
 * (utm_*, gclid, fbclid, ttclid) is noted on landing and, once there is consent, kept for the session and sent with
 * a form (`attribution`), so each lead shows the post or the ad it came from.
 * The ids come from the build's environment (src/data/tracking.ts); with none the site has no banner at all.
 */

type Tags = { ga4: string; ads: string; adsLead: string; meta: string; tiktok: string; linkedin: string; linkedinLead: string };
export type Choice = { analytics: boolean; marketing: boolean };
type Params = Record<string, string | number | undefined>;
// (the tags' own globals, once loaded)
type W = Window & {
  __ohlTags?: Tags; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void;
  fbq?: ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string };
  _fbq?: unknown; ttq?: { load: (id: string) => void; page: () => void; track: (e: string, p?: unknown) => void } & unknown[];
  TiktokAnalyticsObject?: string; _linkedin_partner_id?: string; _linkedin_data_partner_ids?: string[];
  lintrk?: ((a: string, b: unknown) => void) & { q?: unknown[] };
};
const w = window as W;
const tags = w.__ohlTags;
const KEY = 'ohl-consent', ATTR = 'ohl-attr';
const FROM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid', 'ttclid'];

let choice: Choice | null = null;
const loaded = { google: false, meta: false, tiktok: false, linkedin: false };

/** the choice made, if one was */
export function stored(): Choice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return c && typeof c.analytics === 'boolean' && typeof c.marketing === 'boolean' ? { analytics: c.analytics, marketing: c.marketing } : null;
  } catch { return null; }
}

const script = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
};

/** the tags the choice allows, loaded once each (Consent Mode updated first) */
function apply(c: Choice) {
  if (!tags) return;
  const g = w.gtag;
  g?.('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied', ad_user_data: c.marketing ? 'granted' : 'denied', ad_personalization: c.marketing ? 'granted' : 'denied',
  });
  // one Google tag for both: Analytics with analytics, Ads with marketing
  const ga = c.analytics && tags.ga4, ads = c.marketing && tags.ads;
  if (g && (ga || ads) && !loaded.google) {
    loaded.google = true;
    script(`https://www.googletagmanager.com/gtag/js?id=${ga || ads}`);
    g('js', new Date());
    if (ga) g('config', tags.ga4);
    if (ads) g('config', tags.ads);
  }
  if (!c.marketing) return;
  if (tags.meta && !loaded.meta) {
    loaded.meta = true;
    const n = (w.fbq = function (...a: unknown[]) { if (n.callMethod) n.callMethod(...a); else n.queue!.push(a); } as W['fbq'] & object);
    if (!w._fbq) w._fbq = n;
    Object.assign(n, { push: n, loaded: true, version: '2.0', queue: [] });
    script('https://connect.facebook.net/en_US/fbevents.js');
    n('init', tags.meta);
    n('track', 'PageView');
  }
  if (tags.tiktok && !loaded.tiktok) {
    loaded.tiktok = true;
    // TikTok's own loader, written out: a queue that its script replays once it arrives
    w.TiktokAnalyticsObject = 'ttq';
    const ttq = (w.ttq = (w.ttq || []) as unknown as NonNullable<W['ttq']>) as unknown as Record<string, unknown> & unknown[];
    const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    const defer = (t: Record<string, unknown> & unknown[], m: string) => { t[m] = (...a: unknown[]) => { t.push([m, ...a]); }; };
    methods.forEach((m) => defer(ttq, m));
    ttq.load = (id: string) => {
      const u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      Object.assign(ttq, { _i: { ...((ttq._i as object) ?? {}), [id]: Object.assign([], { _u: u }) }, _t: { [id]: Date.now() }, _o: { [id]: {} } });
      script(`${u}?sdkid=${id}&lib=ttq`);
    };
    (ttq.load as (id: string) => void)(tags.tiktok);
    (ttq.page as () => void)();
  }
  if (tags.linkedin && !loaded.linkedin) {
    loaded.linkedin = true;
    w._linkedin_partner_id = tags.linkedin;
    w._linkedin_data_partner_ids = [...(w._linkedin_data_partner_ids ?? []), tags.linkedin];
    const l = (w.lintrk = Object.assign((a: string, b: unknown) => { l.q!.push([a, b]); }, { q: [] as unknown[] }));
    script('https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }
}

/** The visitor's choice: kept, applied, and (if something granted before is now withdrawn) the page reloaded. */
export function choose(c: Choice) {
  const was = choice;
  choice = c;
  try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: new Date().toISOString() })); } catch { /* storage blocked: asked again next time */ }
  if (was && ((was.analytics && !c.analytics) || (was.marketing && !c.marketing)) && Object.values(loaded).some(Boolean)) { location.reload(); return; }
  if (c.analytics || c.marketing) keepAttribution();
  apply(c);
}

/* ---------- where the visit came from ---------- */
// noted on landing; kept for the session only once there is consent (before that, only this page has it)
const landing: Record<string, string> = {};
new URLSearchParams(location.search).forEach((v, k) => { if (FROM.includes(k) && v) landing[k] = v.slice(0, 200); });
function keepAttribution() {
  if (!Object.keys(landing).length) return;
  try { sessionStorage.setItem(ATTR, JSON.stringify(landing)); } catch { /* storage blocked */ }
}
/** where the visit came from, to send with a form: only with consent */
export function attribution(): Record<string, string> {
  if (!choice || !(choice.analytics || choice.marketing)) return {};
  try { return { ...JSON.parse(sessionStorage.getItem(ATTR) ?? '{}'), ...landing }; } catch { return { ...landing }; }
}

/* ---------- what it reports ---------- */
/** An event to Google Analytics (with analytics); a lead also to each ad network (with marketing). */
export function track(name: string, params: Params = {}) {
  if (!tags || !choice) return;
  const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  if (choice.analytics && tags.ga4) w.gtag?.('event', name, { ...p, send_to: tags.ga4 });
  if (name !== 'generate_lead' || !choice.marketing) return;
  if (tags.ads && tags.adsLead) w.gtag?.('event', 'conversion', { send_to: `${tags.ads}/${tags.adsLead}` });
  w.fbq?.('track', 'Lead', { content_category: p.service });
  w.ttq?.track('SubmitForm');
  if (tags.linkedinLead) w.lintrk?.('track', { conversion_id: Number(tags.linkedinLead) });
}

/** Sets consent up: applies a choice already made, and reports the calls to action and the links that leave. */
export function consent() {
  if (!tags) return;
  choice = stored();
  if (choice) { if (choice.analytics || choice.marketing) keepAttribution(); apply(choice); }
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.('a, button');
    if (!el) return;
    const cta = (el as HTMLElement).dataset.cta;
    if (cta) track('cta_click', { cta, service: (el as HTMLElement).dataset.service, link_url: (el as HTMLAnchorElement).href || undefined });
    if (el instanceof HTMLAnchorElement && /^https?:$/.test(el.protocol) && el.host !== location.host) {
      track('outbound_click', { link_url: el.href, link_domain: el.hostname.replace(/^www\./, ''), link_text: (el.textContent ?? '').trim().slice(0, 80) });
    }
  }, { capture: true });
}
