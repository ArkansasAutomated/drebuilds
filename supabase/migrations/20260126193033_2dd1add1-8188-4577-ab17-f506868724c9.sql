-- ===========================================
-- FIX 1: Vault Assets RLS - Enforce plan check at database level
-- ===========================================

-- Create function to check vault plan access
CREATE OR REPLACE FUNCTION public.has_vault_plan(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User is admin OR has vault plan in whop_users
  SELECT 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.whop_users 
      WHERE user_id = _user_id 
      AND 'plan_vault_access' = ANY(plan_ids)
    )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read active vault assets" ON public.vault_assets;

-- Create new policy that enforces plan membership at database level
CREATE POLICY "Plan holders can read active vault assets"
ON public.vault_assets
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND has_vault_plan(auth.uid())
);

-- ===========================================
-- FIX 2: Subscribers RLS - Remove conflicting false policy
-- ===========================================

-- Drop the policy that blocks ALL access with USING (false)
-- This was causing AND logic with "Admins can read subscribers" = always false
DROP POLICY IF EXISTS "No public read access to subscribers" ON public.subscribers;