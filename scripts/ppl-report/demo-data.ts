// ============================================================
// DEMO DATA — clearly-labeled sample, used ONLY with --demo
// ============================================================
// Shapes mirror the real query rows (see types in generate.ts)
// so the demo report exercises the exact same render path. Demo
// mode never touches the network: these constants are injected
// instead of a Supabase fetch.
// ============================================================

export const DEMO_CLIENT = {
  slug: "demo-client",
  name: "Demo Client LLC",
  week: "2026-W34",
  generated_at: "2026-08-24T12:00:00Z",
};

export const DEMO_LEAD_SOURCES = [
  { source: "google-ads", medium: "cpc", campaign: "ar-hvac-summer", lead_count: 14 },
  { source: "facebook-ads", medium: "paid-social", campaign: "retarget-q3", lead_count: 9 },
  { source: "google.com", medium: "organic", campaign: null, lead_count: 5 },
  { source: "direct", medium: "direct", campaign: null, lead_count: 2 },
];

export const DEMO_AUDIT_LEADS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    business_name: "Ozark Comfort HVAC",
    email: "owner@ozarkcomfort.example",
    status: "booked",
    source: "google-ads",
    created_at: "2026-08-17T09:14:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    business_name: "Razorback Plumbing Co.",
    email: "info@razorbackplumbing.example",
    status: "audited",
    source: "google-ads",
    created_at: "2026-08-18T11:40:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    business_name: "Fayetteville Roof & Gutter",
    email: "hello@fayroofgutter.example",
    status: "reviewed",
    source: "facebook-ads",
    created_at: "2026-08-19T15:22:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    business_name: "NWA Electric Pros",
    email: "dispatch@nwaelectric.example",
    status: "new",
    source: "facebook-ads",
    created_at: "2026-08-20T08:05:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    business_name: "Buffalo River Landscaping",
    email: "team@buffaloriverlawn.example",
    status: "closed_won",
    source: "google.com",
    created_at: "2026-08-20T16:48:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    business_name: "Hot Springs Auto Detail",
    email: "wash@hsautodetail.example",
    status: "reviewed",
    source: "direct",
    created_at: "2026-08-21T10:31:00Z",
  },
];
