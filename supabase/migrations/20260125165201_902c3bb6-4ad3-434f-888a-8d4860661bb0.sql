-- Verify RLS is enabled on subscribers (this is idempotent - safe to run)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Add admin SELECT policy for subscribers (so admins can view subscriber list)
-- First drop if exists to make idempotent
DROP POLICY IF EXISTS "Admins can read subscribers" ON public.subscribers;
CREATE POLICY "Admins can read subscribers"
ON public.subscribers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));