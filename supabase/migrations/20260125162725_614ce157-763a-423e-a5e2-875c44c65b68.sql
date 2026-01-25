-- Fix RLS policies with proper validation

-- Drop and recreate subscribers INSERT policy with validation
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  AND length(email) <= 255
  AND length(email) >= 5
);

-- Drop and recreate button_clicks INSERT policy with validation
DROP POLICY IF EXISTS "Anyone can track clicks" ON public.button_clicks;
CREATE POLICY "Anyone can track clicks"
ON public.button_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(button_id) <= 100
  AND (session_id IS NULL OR length(session_id) <= 100)
  AND (page_section IS NULL OR length(page_section) <= 50)
);

-- Fix the update_updated_at_column function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;