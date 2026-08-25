#!/usr/bin/env bun
// ============================================================
// PPL CLIENT REPORT GENERATOR
// ============================================================
// Weekly pay-per-lead report: queries lead data with source
// attribution, applies the table-driven rate config, and emits
// one self-contained HTML artifact.
//
// Usage:
//   bun run scripts/ppl-report/generate.ts --client <slug> --week <YYYY-Www> [--out <path>]
//   bun run scripts/ppl-report/generate.ts --demo [--out <path>]
//
// Live mode reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// (or the NEXT_PUBLIC_* equivalents) from the environment, same
// as src/integrations/supabase/client.ts, and SELECTs from
// audit_leads + lead_sources — read-only, service-role key in
// env is respected via SUPABASE_SERVICE_ROLE_KEY if provided.
//
// Demo mode (--demo) requires NO network and NO env vars: it
// renders clearly-labeled sample data from demo-data.ts.
// ============================================================

import { renderHtml } from "./template";
import { resolveRate } from "./pricing";
import {
  DEMO_CLIENT,
  DEMO_LEAD_SOURCES,
  DEMO_AUDIT_LEADS,
} from "./demo-data";

// ------------------------------------------------------------
// Types — mirror of supabase/migrations tables (audit_leads,
// lead_sources). Kept local so this script stays decoupled
// from the Vite app's generated Database type.
// ------------------------------------------------------------

export interface LeadSourceRow {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  lead_count: number;
}

export interface AuditLeadRow {
  business_name: string;
  email: string;
  status: string;
  source: string | null;
  created_at: string;
}

export interface ProvenanceRow extends AuditLeadRow {}

export interface ReportData {
  clientName: string;
  week: string;
  generatedAt: string;
  isDemo: boolean;
  totals: { leads: number; amountDue: number };
  bySource: LeadSourceRow[];
  leads: ProvenanceRow[];
}

interface CliArgs {
  client?: string;
  week?: string;
  out?: string;
  demo: boolean;
}

const WEEK_RE = /^\d{4}-W\d{2}$/;

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = { demo: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo") args.demo = true;
    else if (a === "--client") args.client = argv[++i];
    else if (a === "--week") args.week = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
};

const requireArg = (v: string | undefined, flag: string): string => {
  if (!v) throw new Error(`Missing required argument: ${flag}`);
  return v;
};

// ------------------------------------------------------------
// Week window → UTC timestamp range. A YYYY-Www label maps to
// its Monday 00:00 through next Monday 00:00 (ISO week start).
// ------------------------------------------------------------

const isoWeekMonday = (label: string): Date => {
  const m = WEEK_RE.exec(label);
  if (!m) throw new Error(`--week must match YYYY-Www (e.g. 2026-W34), got: ${label}`);
  const [year, week] = label.split("-W").map(Number);
  if (week < 1 || week > 53) throw new Error(`Invalid ISO week number: ${week}`);
  // Jan 4 is always inside ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // 1=Mon..7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
};

const weekWindow = (
  label: string,
): { startIso: string; endIso: string } => {
  const start = isoWeekMonday(label);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

// ------------------------------------------------------------
// Data fetch. Demo mode short-circuits before any client is
// constructed, guaranteeing zero network calls.
// ------------------------------------------------------------

interface FetchedData {
  bySource: LeadSourceRow[];
  leads: AuditLeadRow[];
}

const fetchDemo = async (): Promise<FetchedData> => ({
  bySource: DEMO_LEAD_SOURCES,
  leads: DEMO_AUDIT_LEADS,
});

const fetchLive = async (): Promise<FetchedData> => {
  const { createClient } = await import("@supabase/supabase-js");
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || // admin reads; RLS denies anon SELECT on audit_leads
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Live mode needs Supabase env vars (VITE_SUPABASE_URL + publishable/service key), or use --demo.",
    );
  }
  const supabase = createClient(url, key);
  const { startIso, endIso } = weekWindow(currentWeek!);

  const [{ data: sources, error: sErr }, { data: leads, error: lErr }] =
    await Promise.all([
      supabase
        .from("lead_sources")
        .select("source, medium, campaign, lead_count")
        .gte("last_seen_at", startIso)
        .lt("last_seen_at", endIso),
      supabase
        .from("audit_leads")
        .select("business_name, email, status, source, created_at")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false }),
    ]);
  if (sErr) throw new Error(`lead_sources query failed: ${sErr.message}`);
  if (lErr) throw new Error(`audit_leads query failed: ${lErr.message}`);
  return {
    bySource: (sources ?? []) as LeadSourceRow[],
    leads: (leads ?? []) as AuditLeadRow[],
  };
};

let currentWeek: string | undefined;

// ------------------------------------------------------------
// Totals — every number traces to lead_count / row count × the
// pricing-table rate. Nothing invented.
// ------------------------------------------------------------

const computeTotals = (bySource: LeadSourceRow[]): { leads: number; amountDue: number } => {
  let leads = 0;
  let amountDue = 0;
  for (const s of bySource) {
    const { rate } = resolveRate(s.source);
    leads += s.lead_count;
    amountDue += rate * s.lead_count;
  }
  return { leads, amountDue };
};

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.demo) {
    args.client = requireArg(args.client, "--client");
    args.week = requireArg(args.week, "--week");
  }

  const week = args.demo ? (args.week ?? DEMO_CLIENT.week) : args.week!;
  currentWeek = week;

  const clientName = args.demo ? DEMO_CLIENT.name : requireArg(args.client, "--client");

  let fetched: FetchedData;
  try {
    fetched = args.demo ? await fetchDemo() : await fetchLive();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const data: ReportData = {
    clientName,
    week,
    generatedAt: args.demo ? DEMO_CLIENT.generated_at : new Date().toISOString(),
    isDemo: args.demo,
    totals: computeTotals(fetched.bySource),
    bySource: fetched.bySource,
    leads: fetched.leads,
  };

  const html = renderHtml(data);
  const outPath = args.out ?? "artifacts/ppl-report-sample.html";
  await Bun.write(outPath, html);
  console.log(`Wrote ${outPath} (${html.length} bytes, demo=${args.demo})`);
};

main();
