-- Create whop_users table to store Whop OAuth tokens and profile data
CREATE TABLE public.whop_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  whop_user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  company_ids TEXT[] DEFAULT '{}',
  plan_ids TEXT[] DEFAULT '{}',
  username TEXT,
  email TEXT,
  profile_pic_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whop_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own Whop data
CREATE POLICY "Users can read their own Whop data"
ON public.whop_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_whop_users_updated_at
  BEFORE UPDATE ON public.whop_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();