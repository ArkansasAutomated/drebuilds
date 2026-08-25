-- ============================================================
-- Hardening pass — closes Supabase security advisor findings
-- post-43cfc8c Supabase cutover (drebuilds#3)
-- Authored 2026-08-24 by Hermes after black-box verification:
--   * /graphql/v1 answers anonymous POSTs (200) though the app
--     makes ZERO GraphQL calls (bundle grep count = 0).
--   * No data collections currently reflected to anon, but the
--     surface auto-exposes any future table granted to anon.
--   * 13/13 tables RLS-enabled (verified across migrations).
--   * The live advisor identifies set_updated_at_audit_leads()
--     as the mutable-search-path function; its body is safe with
--     an empty path because it references no application objects.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kill anonymous/authenticated access to the GraphQL API.
--    The application uses PostgREST only. Service role keeps
--    EXECUTE so server-side tooling and Supabase dashboard
--    integrations are unaffected.
--    The live catalog exposes graphql_public.graphql(text,text,jsonb,jsonb).
--    Revoke PUBLIC as well because anon/authenticated inherit its grants.
--    Reversible alternative if ever needed: GRANT EXECUTE back.
--    The extension remains installed for service-role/dashboard tooling.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION graphql_public.graphql(text, text, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 2. Pin the advisor-flagged trigger function's search_path.
--    Do not generically rewrite every SECURITY DEFINER function:
--    several existing admin RPCs intentionally use unqualified table
--    references and would fail at runtime with an empty search_path.
--    This trigger only touches NEW and pg_catalog.now(), so empty is safe.
-- ------------------------------------------------------------
ALTER FUNCTION public.set_updated_at_audit_leads() SET search_path = '';
