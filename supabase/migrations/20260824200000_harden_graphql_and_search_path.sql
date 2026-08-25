-- ============================================================
-- Hardening pass — closes Supabase security advisor findings
-- post-43cfc8c Supabase cutover (drebuilds#3)
-- Authored 2026-08-24 by Hermes after black-box verification:
--   * /graphql/v1 answers anonymous POSTs (200) though the app
--     makes ZERO GraphQL calls (bundle grep count = 0).
--   * No data collections currently reflected to anon, but the
--     surface auto-exposes any future table granted to anon.
--   * 13/13 tables RLS-enabled (verified across migrations).
--   * No SECURITY DEFINER functions exist in repo migrations;
--     the flagged mutable search_path function lives outside
--     the repo (dashboard-era or managed) - the DO block below
--     pins ALL of them in public, present or future.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kill anonymous/authenticated access to the GraphQL API.
--    The application uses PostgREST only. Service role keeps
--    EXECUTE so server-side tooling and Supabase dashboard
--    integrations are unaffected.
--    Reversible alternative if ever needed: GRANT EXECUTE back.
--    Nuclear option (drops endpoint entirely): drop extension
--    pg_graphql cascade - deliberately NOT chosen.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION [graphql].graphql_root FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION graphql.graphql_root FROM anon, authenticated;

-- ------------------------------------------------------------
-- 2. Pin search_path to empty on every SECURITY DEFINER
--    function in public (advisor: "mutable search path").
--    Generic over whatever exists post-restore, including
--    functions created outside this repo's migrations.
--    Empty search_path defeats search-path hijacking.
-- ------------------------------------------------------------
DO $$
DECLARE
  fn record;
  altered integer := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS fnid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (p.proconfig IS NULL
           OR NOT ('search_path=''''') = ANY (p.proconfig))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', fn.fnid);
    altered := altered + 1;
    RAISE NOTICE 'pinned search_path on %', fn.fnid;
  END LOOP;
  RAISE NOTICE 'hardening complete: % function(s) pinned', altered;
END $$;
