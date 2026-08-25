// ============================================================
// PPL PRICING CONFIG (table-driven)
// ============================================================
// Per-lead rate by lead source. This is the ONLY place price
// math inputs live — the generator never hardcodes a rate
// inline. Add or adjust rows here and the report follows.
//
// `source` matches the value written to lead_sources.source /
// audit_leads.source by the attribution capture flow
// (src/lib/attribution.ts): utm_source, referrer host, or
// 'direct'.
// ============================================================

export interface SourceRate {
  /** Matches lead_sources.source / audit_leads.source */
  source: string;
  /** Invoice-ready per-lead rate in whole dollars */
  rateUsd: number;
  /**
   * Optional cap: max billable leads for this source within the
   * report week (contract overage protection). Omit = no cap.
   */
  capLeads?: number;
}

export const PPL_RATES: SourceRate[] = [
  { source: "google-ads", rateUsd: 45 },
  { source: "facebook-ads", rateUsd: 40 },
  { source: "bing-ads", rateUsd: 35 },
  { source: "direct", rateUsd: 30 },
  { source: "google.com", rateUsd: 25 }, // organic search
];

/** Default rate applied to any source not listed above. */
export const DEFAULT_RATE_USD = 20;

/**
 * Resolve the per-lead rate + optional cap for a source.
 * Unknown sources fall to DEFAULT_RATE_USD so the invoice is
 * still computable — the report flags these rows as unmapped.
 */
export const resolveRate = (
  source: string | null | undefined,
): { rate: number; capped: boolean; mapped: boolean } => {
  const key = (source ?? "").toLowerCase();
  const hit = PPL_RATES.find((r) => r.source.toLowerCase() === key);
  if (!hit) return { rate: DEFAULT_RATE_USD, capped: false, mapped: false };
  return { rate: hit.rateUsd, capped: hit.capLeads !== undefined, mapped: true };
};
