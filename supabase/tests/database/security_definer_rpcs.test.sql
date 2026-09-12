-- Run after migrations with psql -v ON_ERROR_STOP=1 -f <this file>.
-- This intentionally has no pgTAP dependency so it can verify a linked or
-- disposable PostgreSQL database using only the catalog.
BEGIN;

DO $verification$
DECLARE
  v_definer_reporting_functions INTEGER;
  v_has_role_definer BOOLEAN;
  v_has_role_config TEXT[];
  v_has_role_policies INTEGER;
  v_public_execute_grants INTEGER;
BEGIN
  SELECT count(*)
  INTO v_definer_reporting_functions
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'get_click_stats',
      'get_source_analytics',
      'get_subscriber_stats'
    )
    AND p.prosecdef;

  IF v_definer_reporting_functions <> 0 THEN
    RAISE EXCEPTION 'reporting RPCs still run as SECURITY DEFINER';
  END IF;

  SELECT p.prosecdef, p.proconfig
  INTO v_has_role_definer, v_has_role_config
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'has_role'
    AND pg_get_function_identity_arguments(p.oid) =
      '_user_id uuid, _role app_role';

  IF v_has_role_definer IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'has_role must remain SECURITY DEFINER for RLS';
  END IF;

  IF v_has_role_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'has_role search_path is not empty: %', v_has_role_config;
  END IF;

  SELECT count(*)
  INTO v_has_role_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%');

  IF v_has_role_policies = 0 THEN
    RAISE EXCEPTION 'expected RLS policies that depend on has_role';
  END IF;

  IF NOT has_function_privilege(
    'authenticated', 'public.get_click_stats()', 'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated', 'public.get_subscriber_stats()', 'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated', 'public.get_source_analytics(integer)', 'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated', 'public.has_role(uuid, public.app_role)', 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated lost a required RPC execute grant';
  END IF;

  IF has_function_privilege(
    'anon', 'public.get_click_stats()', 'EXECUTE'
  ) OR has_function_privilege(
    'anon', 'public.get_subscriber_stats()', 'EXECUTE'
  ) OR has_function_privilege(
    'anon', 'public.get_source_analytics(integer)', 'EXECUTE'
  ) OR has_function_privilege(
    'anon', 'public.has_role(uuid, public.app_role)', 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon retains execute on a hardened RPC';
  END IF;

  SELECT count(*)
  INTO v_public_execute_grants
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(
    COALESCE(p.proacl, acldefault('f', p.proowner))
  ) AS acl
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'get_click_stats',
      'get_source_analytics',
      'get_subscriber_stats',
      'has_role'
    )
    AND acl.grantee = 0
    AND acl.privilege_type = 'EXECUTE';

  IF v_public_execute_grants <> 0 THEN
    RAISE EXCEPTION 'PUBLIC retains execute on a hardened RPC';
  END IF;
END
$verification$;

-- Exercise the RLS boundary with disposable identities and data. Fixed UUIDs
-- make the role changes simple; the transaction rollback removes every row.
INSERT INTO auth.users (id)
VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffff1001'),
  ('ffffffff-ffff-ffff-ffff-ffffffff1002');

INSERT INTO public.user_roles (user_id, role)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffff1001', 'admin');

INSERT INTO public.button_clicks (button_id)
VALUES ('security-definer-rpc-verification');

SET LOCAL ROLE anon;
DO $anon_denial$
BEGIN
  PERFORM public.get_click_stats();
  RAISE EXCEPTION 'anon unexpectedly executed get_click_stats';
EXCEPTION
  WHEN insufficient_privilege THEN NULL;
END
$anon_denial$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  'ffffffff-ffff-ffff-ffff-ffffffff1002',
  true
);
DO $non_admin_rls$
BEGIN
  IF public.get_click_stats()::text <> '[]' THEN
    RAISE EXCEPTION 'non-admin observed click statistics';
  END IF;
END
$non_admin_rls$;

SELECT set_config(
  'request.jwt.claim.sub',
  'ffffffff-ffff-ffff-ffff-ffffffff1001',
  true
);
DO $admin_control$
BEGIN
  IF public.get_click_stats()::text NOT LIKE
    '%security-definer-rpc-verification%'
  THEN
    RAISE EXCEPTION 'admin lost click statistics access';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'has_role no longer supports admin RLS';
  END IF;
END
$admin_control$;
RESET ROLE;

SELECT 'security_definer_rpcs verification passed' AS result;
ROLLBACK;
