-- ============================================================
-- DROP WHOP INTEGRATION
-- ============================================================
-- Whop OAuth, products, revenue, and webhook integrations are
-- being removed from drebuilds.online. This migration cleans up
-- all Whop-specific database artifacts and severs the link from
-- any unrelated tables (vault_assets) that referenced Whop data.
-- ============================================================

-- 1) Drop the vault-asset RLS policy that depended on has_vault_plan()
DROP POLICY IF EXISTS "Plan holders can read active vault assets" ON public.vault_assets;

-- 2) Drop the old permissive policy so the table is in a clean state
DROP POLICY IF EXISTS "Authenticated users can read active vault assets" ON public.vault_assets;

-- 3) Replace it: admins can manage, authenticated users with active assets can read.
--    The Builder's Vault page now gates access at the app layer (Supabase admin role),
--    so we drop the plan-tier check at the DB layer. Keep an active-only read policy
--    so non-admins only see is_active = true rows if they get past the app gate.
CREATE POLICY "Authenticated users can read active vault assets"
ON public.vault_assets
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4) Drop the Whop-aware has_vault_plan function (it queried whop_users)
DROP FUNCTION IF EXISTS public.has_vault_plan(UUID);

-- 5) Drop all Whop-related policies on whop_users (if any still exist)
DROP POLICY IF EXISTS "Users can read their own Whop data" ON public.whop_users;
DROP POLICY IF EXISTS "Admins can manage all Whop users" ON public.whop_users;
DROP POLICY IF EXISTS "Users can update their own Whop data" ON public.whop_users;
DROP POLICY IF EXISTS "Users can delete their own Whop data" ON public.whop_users;
DROP POLICY IF EXISTS "No direct user SELECT on whop_users" ON public.whop_users;

-- 6) Drop the Whop trigger (if it still exists from earlier migrations)
DROP TRIGGER IF EXISTS update_whop_users_updated_at ON public.whop_users;

-- 7) Drop the safe view (depends on whop_users)
DROP VIEW IF EXISTS public.whop_users_safe;

-- 8) Drop the table itself
DROP TABLE IF EXISTS public.whop_users;