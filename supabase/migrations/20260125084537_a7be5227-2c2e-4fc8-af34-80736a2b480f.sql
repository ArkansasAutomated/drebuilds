-- Create subscribers table for newsletter signups
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'landing_page'
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (public signup)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Prevent reading subscriber data from client (admin only via backend)
CREATE POLICY "No public read access to subscribers"
ON public.subscribers
FOR SELECT
USING (false);