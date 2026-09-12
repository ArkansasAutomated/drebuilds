-- Reporting RPCs do not need to bypass RLS. Their source tables already grant
-- authenticated users access only through admin-scoped policies.
ALTER FUNCTION public.get_click_stats() SECURITY INVOKER;
ALTER FUNCTION public.get_subscriber_stats() SECURITY INVOKER;
ALTER FUNCTION public.get_source_analytics(INTEGER) SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.get_click_stats()
FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_subscriber_stats()
FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_source_analytics(INTEGER)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_click_stats()
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_subscriber_stats()
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_source_analytics(INTEGER)
TO authenticated, service_role;

-- has_role must retain definer rights: it is the non-recursive authorization
-- primitive used by RLS policies on user_roles and other admin-only tables.
-- Its body schema-qualifies user_roles, so an empty search path is safe.
ALTER FUNCTION public.has_role(UUID, public.app_role) SECURITY DEFINER;
ALTER FUNCTION public.has_role(UUID, public.app_role) SET search_path = '';

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)
TO authenticated, service_role;
