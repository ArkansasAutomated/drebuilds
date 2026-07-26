-- Remove the unused Whop integration after all application references are gone.
DROP VIEW IF EXISTS public.whop_users_safe;
DROP POLICY IF EXISTS "Plan holders can read active vault assets" ON public.vault_assets;
DROP FUNCTION IF EXISTS public.has_vault_plan(uuid);
DROP TABLE IF EXISTS public.webhook_events;
DROP TABLE IF EXISTS public.whop_users;

UPDATE public.offer_settings
SET link = CASE
  WHEN id = 'consulting' THEN '/audit'
  WHEN id IN ('community', 'store') THEN NULL
  WHEN id = 'learn' THEN 'https://youtube.com/@drebuilds'
  ELSE link
END
WHERE id IN ('consulting', 'community', 'store', 'learn');

CREATE TABLE public.audit_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  industry text NOT NULL,
  team_size text NOT NULL,
  current_tools text[] NOT NULL DEFAULT '{}',
  bottleneck text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  preferred_contact text NOT NULL DEFAULT 'email',
  source text NOT NULL DEFAULT 'drebuilds_audit',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'audited', 'booked', 'closed', 'lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(business_name) BETWEEN 1 AND 200),
  CHECK (char_length(full_name) BETWEEN 1 AND 200),
  CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CHECK (char_length(phone) BETWEEN 7 AND 30)
);

CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  domain text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lead_sources (source_key, display_name, domain) VALUES
  ('drebuilds_audit', 'DREBUILDS Audit', 'drebuilds.online')
ON CONFLICT (source_key) DO NOTHING;

CREATE TABLE public.newsletter_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  list_id uuid NOT NULL REFERENCES public.newsletter_lists(id) ON DELETE CASCADE,
  full_name text,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  UNIQUE (email, list_id),
  CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

INSERT INTO public.newsletter_lists (slug, name, description) VALUES
  ('drebuilds_main', 'DREBUILDS Newsletter', 'Automation systems, field notes, and practical AI workflows.'),
  ('fortsmith_directory', 'Fort Smith Directory Updates', 'Local business additions and Fort Smith community updates.'),
  ('dose_of_proof', 'Dose of Proof', 'Evidence-led health and wellness updates.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit valid audit leads"
ON public.audit_leads FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND notes IS NULL
  AND char_length(email) <= 255
);

CREATE POLICY "Admins can read audit leads"
ON public.audit_leads FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update audit leads"
ON public.audit_leads FOR UPDATE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Public can read active newsletter lists"
ON public.newsletter_lists FOR SELECT
TO anon, authenticated
USING (is_active);

CREATE POLICY "Admins can manage newsletter lists"
ON public.newsletter_lists FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Public can subscribe to active lists"
ON public.newsletter_subscriptions FOR INSERT
TO anon, authenticated
WITH CHECK (
  unsubscribed_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.newsletter_lists
    WHERE id = list_id AND is_active
  )
);

CREATE POLICY "Admins can read newsletter subscriptions"
ON public.newsletter_subscriptions FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Public can read active lead sources"
ON public.lead_sources FOR SELECT
TO anon, authenticated
USING (is_active);

CREATE POLICY "Admins can manage lead sources"
ON public.lead_sources FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE TRIGGER update_audit_leads_updated_at
BEFORE UPDATE ON public.audit_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.newsletter_lists, public.lead_sources TO anon, authenticated;
GRANT INSERT ON public.audit_leads, public.newsletter_subscriptions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.audit_leads TO authenticated;
GRANT SELECT ON public.newsletter_subscriptions TO authenticated;
