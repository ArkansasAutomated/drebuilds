-- ===========================================
-- FIX 3: Hide OAuth tokens from user SELECT queries
-- Create a view that excludes sensitive token columns
-- ===========================================

-- Create a safe view that excludes access_token and refresh_token
CREATE VIEW public.whop_users_safe
WITH (security_invoker = true)
AS SELECT 
  id,
  user_id,
  whop_user_id,
  company_ids,
  plan_ids,
  username,
  email,
  profile_pic_url,
  metadata,
  created_at,
  updated_at
FROM public.whop_users;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.whop_users_safe TO authenticated;

-- Drop the policy that allows users to read tokens directly
DROP POLICY IF EXISTS "Users can read their own Whop data" ON public.whop_users;

-- Create new restrictive policy that denies direct user SELECT access
-- (Service role and admin still have access for edge functions)
CREATE POLICY "No direct user SELECT on whop_users"
ON public.whop_users
FOR SELECT
TO authenticated
USING (
  -- Only admins can read directly (includes tokens for edge function use)
  has_role(auth.uid(), 'admin'::app_role)
);

-- Note: UPDATE and DELETE policies remain unchanged for user self-management