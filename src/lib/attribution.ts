// ============================================================
// UTM + source attribution
// ============================================================
// Captures utm_* params from the URL on first page load (and any
// in-app navigation that re-applies them), persists them to
// sessionStorage, and exposes a single getter that downstream
// forms use to attach attribution to every lead submission.
//
// Strategy:
//   - First-touch attribution: the very first UTM seen in this
//     session wins and is not overwritten. This matches standard
//     marketing-attribution conventions and gives the admin panel
//     a stable "where did this lead come from" answer.
//   - Fallback chain: UTM → referrer host → 'direct'.
//   - Storage: sessionStorage (not localStorage) so a fresh
//     tab/window in the same browser still has a clean slate.
//
// Public API:
//   captureUtmFromUrl()        — call once on app boot; idempotent
//   getAttribution()           — returns { source, medium, campaign,
//                                          content, sourceUrl,
//                                          referrer }
//   clearAttribution()         — wipe (used by tests / admin reset)
// ============================================================

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  sourceUrl: string;
  referrer: string;
  capturedAt: string; // ISO timestamp of first capture
}

const STORAGE_KEY = "drebuilds_attribution_v1";

const EMPTY: Attribution = {
  source: "",
  medium: "",
  campaign: "",
  content: "",
  term: "",
  sourceUrl: "",
  referrer: "",
  capturedAt: "",
};

/**
 * Pull a single UTM param from the current URL search params.
 * Returns empty string when missing — never undefined — so the
 * downstream lead capture has predictable string fields.
 */
const readUrlParam = (key: UtmKey): string => {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    return (params.get(key) ?? "").trim();
  } catch {
    return "";
  }
};

/**
 * Derive a coarse `source` from the referrer host when no
 * utm_source was present. Keeps the "leads by source" rollup
 * useful even for organic traffic.
 *
 *  - empty / same-origin     → "direct"
 *  - google / bing / duckduck → "<engine>"
 *  - facebook / twitter / etc → "<network>"
 *  - anything else           → the bare host
 */
const deriveReferrerSource = (referrer: string): string => {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (!host) return "direct";

    if (window.location.hostname && host === window.location.hostname) {
      return "direct";
    }

    if (host.endsWith("google.com") || host.endsWith("google.co.uk") || host === "google.com") {
      return "google";
    }
    if (host.endsWith("bing.com")) return "bing";
    if (host.endsWith("duckduckgo.com")) return "duckduckgo";
    if (host.endsWith("facebook.com") || host.endsWith("fb.com")) return "facebook";
    if (host === "t.co" || host.endsWith("twitter.com")) return "twitter";
    if (host === "lnkd.in" || host.endsWith("linkedin.com")) return "linkedin";
    if (host.endsWith("yelp.com")) return "yelp";
    if (host.endsWith("instagram.com")) return "instagram";

    // Strip leading www. for readability
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "direct";
  }
};

const deriveReferrerMedium = (referrer: string, utmSource: string): string => {
  if (utmSource) return "utm"; // explicit campaign
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    if (window.location.hostname && url.hostname === window.location.hostname) {
      return "internal";
    }
    const host = url.hostname.toLowerCase();
    if (
      host.endsWith("google.com") ||
      host.endsWith("bing.com") ||
      host.endsWith("duckduckgo.com")
    ) {
      return "organic";
    }
    return "referral";
  } catch {
    return "direct";
  }
};

const safeRead = (): Partial<Attribution> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const safeWrite = (value: Attribution): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage may be disabled (private mode, quota) — swallow.
  }
};

/**
 * Pull the current page's full URL. Used as source_url on the
 * lead row so the admin can see exactly which page the form was
 * submitted from.
 */
const currentSourceUrl = (): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
};

const currentReferrer = (): string => {
  if (typeof document === "undefined") return "";
  return document.referrer || "";
};

/**
 * Capture UTMs from the URL and persist to sessionStorage.
 *
 * First-touch semantics: if a previous capture exists, only
 * overwrite fields that are still empty (i.e. UTMs are sticky
 * for the session even after the user navigates within the
 * site). sourceUrl and referrer always reflect the current page.
 *
 * Returns the resulting Attribution snapshot.
 */
export const captureUtmFromUrl = (): Attribution => {
  if (typeof window === "undefined") return EMPTY;

  const existing = safeRead();

  const utm: Record<UtmKey, string> = {
    utm_source: readUrlParam("utm_source"),
    utm_medium: readUrlParam("utm_medium"),
    utm_campaign: readUrlParam("utm_campaign"),
    utm_content: readUrlParam("utm_content"),
    utm_term: readUrlParam("utm_term"),
  };

  const hasAnyUtm = UTM_KEYS.some((k) => utm[k].length > 0);

  const referrer = currentReferrer();
  const sourceUrl = currentSourceUrl();

  // Source: explicit UTM wins; otherwise derive from referrer; else "direct".
  const derivedSource = hasAnyUtm
    ? utm.utm_source
    : deriveReferrerSource(referrer);
  const derivedMedium = hasAnyUtm
    ? utm.utm_medium || "utm"
    : deriveReferrerMedium(referrer, utm.utm_source);

  const next: Attribution = {
    source: existing.source || derivedSource,
    medium: existing.medium || derivedMedium,
    campaign: existing.campaign || utm.utm_campaign,
    content: existing.content || utm.utm_content,
    term: existing.term || utm.utm_term,
    sourceUrl,
    referrer: existing.referrer || referrer,
    capturedAt: existing.capturedAt || new Date().toISOString(),
  };

  safeWrite(next);
  return next;
};

/**
 * Read the current attribution snapshot without re-capturing.
 * Useful inside form submit handlers that want a stable view
 * of what's about to be attached to the lead.
 */
export const getAttribution = (): Attribution => {
  const stored = safeRead();
  return {
    source: stored.source ?? "",
    medium: stored.medium ?? "",
    campaign: stored.campaign ?? "",
    content: stored.content ?? "",
    term: stored.term ?? "",
    sourceUrl: stored.sourceUrl ?? currentSourceUrl(),
    referrer: stored.referrer ?? currentReferrer(),
    capturedAt: stored.capturedAt ?? "",
  };
};

/**
 * Convert the current attribution into the shape the
 * audit_leads and newsletter_subscriptions rows expect.
 * Always returns a complete object — empty strings for fields
 * that weren't set, so the DB inserts are deterministic.
 */
export const attributionToRowPayload = (
  leadType: "audit" | "newsletter",
): {
  source_url: string;
  utm_params: Record<string, string>;
} => {
  const a = getAttribution();
  return {
    source_url: a.sourceUrl,
    utm_params: {
      utm_source: a.source,
      utm_medium: a.medium,
      utm_campaign: a.campaign,
      utm_content: a.content,
      utm_term: a.term,
      lead_type: leadType,
      referrer: a.referrer,
    },
  };
};

/**
 * Wipe stored attribution. Used by tests and the (future) admin
 * "reset attribution" tool.
 */
export const clearAttribution = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Build the lightweight "envelope" sent to the capture-lead
 * edge function. Spoke sites POST this; the hub uses the same
 * shape when a form is submitted locally.
 */
export const buildAttributionEnvelope = (
  leadType: "audit" | "newsletter",
  extra?: Record<string, string>,
): {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  source_url: string;
  referrer: string;
  lead_type: string;
  meta?: Record<string, string>;
} => {
  const a = getAttribution();
  return {
    source: a.source,
    medium: a.medium,
    campaign: a.campaign,
    content: a.content,
    source_url: a.sourceUrl,
    referrer: a.referrer,
    lead_type: leadType,
    meta: extra,
  };
};
