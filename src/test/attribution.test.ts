import { describe, it, expect, beforeEach } from "vitest";
import {
  captureUtmFromUrl,
  getAttribution,
  attributionToRowPayload,
  buildAttributionEnvelope,
  clearAttribution,
} from "@/lib/attribution";

const SESSION_KEY = "drebuilds_attribution_v1";

const setUrl = (search: string) => {
  // jsdom doesn't fully support window.location mutation, so we
  // monkey-patch it. The attribution utility uses window.location
  // at module evaluation time, but it re-reads inside each call.
  const url = `https://drebuilds.online/${search}`;
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
};

const setReferrer = (ref: string) => {
  Object.defineProperty(document, "referrer", {
    value: ref,
    configurable: true,
    writable: true,
  });
};

const clearSession = () => {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

describe("attribution utility", () => {
  beforeEach(() => {
    clearSession();
    setReferrer("");
  });

  it("captures utm params from URL and persists to sessionStorage", () => {
    setUrl("?utm_source=google&utm_medium=cpc&utm_campaign=spring");
    const result = captureUtmFromUrl();
    expect(result.source).toBe("google");
    expect(result.medium).toBe("cpc");
    expect(result.campaign).toBe("spring");
    expect(result.content).toBe("");
    expect(result.capturedAt).not.toBe("");

    const stored = window.sessionStorage.getItem(SESSION_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).source).toBe("google");
  });

  it("falls back to referrer host when no UTM is present", () => {
    setReferrer("https://www.google.com/search?q=ai+automation");
    setUrl("");
    const result = captureUtmFromUrl();
    expect(result.source).toBe("google");
    expect(result.medium).toBe("organic");
  });

  it("marks same-origin referrer as direct", () => {
    setReferrer("https://drebuilds.online/audit");
    setUrl("");
    const result = captureUtmFromUrl();
    expect(result.source).toBe("direct");
    expect(result.medium).toBe("internal");
  });

  it("returns 'direct' when no UTM and no referrer", () => {
    setReferrer("");
    setUrl("");
    const result = captureUtmFromUrl();
    expect(result.source).toBe("direct");
    expect(result.medium).toBe("direct");
  });

  it("is first-touch: a later UTM does not overwrite an earlier capture", () => {
    setUrl("?utm_source=google&utm_medium=cpc");
    captureUtmFromUrl();

    setUrl("?utm_source=facebook&utm_medium=social");
    const result = captureUtmFromUrl();

    expect(result.source).toBe("google");
    expect(result.medium).toBe("cpc");
  });

  it("getAttribution returns a stable shape", () => {
    setUrl("?utm_source=google");
    captureUtmFromUrl();
    const a = getAttribution();
    expect(typeof a.source).toBe("string");
    expect(typeof a.medium).toBe("string");
    expect(typeof a.campaign).toBe("string");
    expect(typeof a.content).toBe("string");
    expect(typeof a.term).toBe("string");
    expect(typeof a.sourceUrl).toBe("string");
    expect(typeof a.referrer).toBe("string");
    expect(typeof a.capturedAt).toBe("string");
  });

  it("attributionToRowPayload shapes fields for the lead table", () => {
    setUrl("?utm_source=google&utm_medium=cpc&utm_campaign=spring");
    captureUtmFromUrl();

    const payload = attributionToRowPayload("audit");
    expect(payload.source_url).toContain("?utm_source=google");
    expect(payload.utm_params.utm_source).toBe("google");
    expect(payload.utm_params.utm_medium).toBe("cpc");
    expect(payload.utm_params.utm_campaign).toBe("spring");
    expect(payload.utm_params.lead_type).toBe("audit");
  });

  it("buildAttributionEnvelope adds lead_type and supports meta", () => {
    setUrl("?utm_source=linkedin&utm_campaign=q3-launch");
    captureUtmFromUrl();

    const env = buildAttributionEnvelope("newsletter", {
      spoke_domain: "fortsmithdirectory.com",
    });
    expect(env.source).toBe("linkedin");
    expect(env.campaign).toBe("q3-launch");
    expect(env.lead_type).toBe("newsletter");
    expect(env.meta?.spoke_domain).toBe("fortsmithdirectory.com");
  });

  it("clearAttribution wipes the session storage entry", () => {
    setUrl("?utm_source=google");
    captureUtmFromUrl();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeTruthy();
    clearAttribution();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("derives a clean host name for unknown referrers", () => {
    setReferrer("https://www.example-marketing-blog.com/post");
    setUrl("");
    const result = captureUtmFromUrl();
    expect(result.source).toBe("example-marketing-blog.com");
    expect(result.medium).toBe("referral");
  });
});
