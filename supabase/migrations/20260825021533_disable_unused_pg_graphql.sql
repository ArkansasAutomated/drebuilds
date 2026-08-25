-- Dre Builds uses PostgREST only. The shipped application bundle contains no
-- GraphQL calls, while pg_graphql exposes public-schema metadata through
-- /graphql/v1. Its endpoint function is owned by Supabase's managed
-- supabase_admin role, so project-level REVOKE statements cannot change the
-- managed ACL. Disable the unused extension through the supported path.
DROP EXTENSION IF EXISTS pg_graphql;
