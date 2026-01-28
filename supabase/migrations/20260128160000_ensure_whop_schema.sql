-- Create whop_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.whop_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    whop_user_id TEXT NOT NULL UNIQUE,
    username TEXT,
    email TEXT,
    profile_pic_url TEXT,
    company_ids TEXT[] DEFAULT '{}',
    plan_ids TEXT[] DEFAULT '{}',
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whop_users ENABLE ROW LEVEL SECURITY;

-- Create minimal RLS policies
DROP POLICY IF EXISTS "Users can view their own whop data" ON public.whop_users;
CREATE POLICY "Users can view their own whop data" ON public.whop_users
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access" ON public.whop_users;
CREATE POLICY "Service role has full access" ON public.whop_users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Drop view first to allow schema changes
DROP VIEW IF EXISTS public.whop_users_safe;

-- Create generic view that excludes sensitive tokens
CREATE VIEW public.whop_users_safe AS
SELECT
    user_id,
    whop_user_id,
    username,
    email,
    profile_pic_url,
    company_ids,
    plan_ids,
    metadata,
    created_at,
    updated_at
FROM
    public.whop_users;

-- Grant access to the view
GRANT SELECT ON public.whop_users_safe TO authenticated;
