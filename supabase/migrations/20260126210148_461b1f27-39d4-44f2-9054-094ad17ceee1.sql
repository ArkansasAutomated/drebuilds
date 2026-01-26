-- Drop the existing view
DROP VIEW IF EXISTS public.whop_users_safe;

-- Recreate the view with security_barrier and built-in row filtering
-- This view only returns rows belonging to the current user OR all rows for admins
CREATE VIEW public.whop_users_safe
WITH (security_invoker = true, security_barrier = true)
AS 
SELECT 
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
FROM public.whop_users
WHERE 
  -- User can see their own record
  user_id = auth.uid()
  -- OR user is admin (can see all records)
  OR has_role(auth.uid(), 'admin'::app_role);

-- Grant SELECT to authenticated users
GRANT SELECT ON public.whop_users_safe TO authenticated;

-- Add comment documenting the security model
COMMENT ON VIEW public.whop_users_safe IS 'Safe view excluding access/refresh tokens. Row filtering enforced: users see only their own data, admins see all.';