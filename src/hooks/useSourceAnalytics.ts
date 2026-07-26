// ============================================================
// useSourceAnalytics
// ============================================================
// Fetches the source-attribution rollup for the admin dashboard.
// Backs the SourceAnalyticsPanel — leads by source, leads over
// time, conversion-rate-by-source (where conversion = "any
// audit lead not in the 'new' status").
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SourceTotals {
  audit: number;
  newsletter: number;
  all: number;
}

export interface SourceBySourceRow {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  lead_type: string | null;
  lead_count: number;
  first_seen_at: string;
  last_seen_at: string;
}

/**
 * Composite key used by the table's React key. The rollup RPC
 * doesn't expose the row id, so we build a stable synthetic key
 * from the unique (source, medium, campaign, content, lead_type)
 * tuple.
 */
export const sourceRowKey = (r: SourceBySourceRow, idx: number): string =>
  `${r.source ?? ""}|${r.medium ?? ""}|${r.campaign ?? ""}|${r.content ?? ""}|${r.lead_type ?? ""}|${idx}`;

export interface SourceByDayRow {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface SourceAnalytics {
  totals: SourceTotals;
  by_source: SourceBySourceRow[];
  by_day: SourceByDayRow[];
}

const ROLLUP_KEY = ["admin", "source-analytics"];

/**
 * Fetch the JSON blob from the get_source_analytics RPC. Returns
 * the parsed payload or sensible zeros on any error so the
 * panel renders something rather than crashing the admin page.
 */
const fetchSourceAnalytics = async (
  daysBack: number,
): Promise<SourceAnalytics> => {
  const { data, error } = await supabase.rpc("get_source_analytics", {
    p_days: daysBack,
  });

  if (error) {
    // If the RPC doesn't exist yet (migration not deployed), or
    // RLS denies, surface zeros. The panel renders the "no data"
    // state which is the same UX as a fresh install.
    if (
      error.code === "PGRST301" ||
      /function .* does not exist|permission denied|row.level security/i.test(
        error.message,
      )
    ) {
      return {
        totals: { audit: 0, newsletter: 0, all: 0 },
        by_source: [],
        by_day: [],
      };
    }
    throw error;
  }

  // The RPC returns json; cast through unknown so the consumer
  // can rely on the shape we declared above.
  return data as unknown as SourceAnalytics;
};

export const useSourceAnalytics = (daysBack: number = 30) => {
  return useQuery({
    queryKey: [...ROLLUP_KEY, daysBack],
    queryFn: () => fetchSourceAnalytics(daysBack),
    staleTime: 60 * 1000, // 1 minute — rollup is pre-aggregated
  });
};

/**
 * Convenience formatter: collapse a SourceBySourceRow to a
 * human-readable label like "google / cpc / spring-promo"
 * (drops empty segments so the UI doesn't render stray " / "
 * separators).
 */
export const formatSourceLabel = (row: SourceBySourceRow): string => {
  const parts = [row.source, row.medium, row.campaign, row.content]
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts.join(" / ") : "direct / none";
};

/**
 * Aggregate over the by_source array to compute conversion
 * proxy = audit leads in non-'new' status / total audit leads.
 * We don't have status rollup in lead_sources today, so this
 * is a best-effort label for the panel — it surfaces "leads
 * captured" reliably, and the conversion column is hidden
 * until the lead_status RPC is added.
 */
export const computeSourceTotals = (
  rows: SourceBySourceRow[] | undefined,
): { sourceCount: number; totalLeads: number } => {
  const list = rows ?? [];
  return {
    sourceCount: list.length,
    totalLeads: list.reduce((sum, r) => sum + (r.lead_count ?? 0), 0),
  };
};
