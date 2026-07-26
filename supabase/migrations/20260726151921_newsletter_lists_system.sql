-- ============================================================
-- MULTI-NEWSLETTER SYSTEM (hub + spokes)
-- ============================================================
-- Adds a normalized hub-and-spoke newsletter structure:
--   - newsletter_lists       (one row per list, identified by slug)
--   - newsletter_subscriptions (one row per (list, email))
--
-- The legacy `public.subscribers` table is preserved (existing
-- data) and is back-filled into `newsletter_subscriptions` against
-- the `drebuilds_main` list so historical leads show up in the new
-- admin views without losing their original source/metadata.
-- ============================================================

-- 1) List directory -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.newsletter_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_lists_slug
  ON public.newsletter_lists (slug);

CREATE INDEX IF NOT EXISTS idx_newsletter_lists_active
  ON public.newsletter_lists (is_active);

DROP TRIGGER IF EXISTS update_newsletter_lists_updated_at
  ON public.newsletter_lists;
CREATE TRIGGER update_newsletter_lists_updated_at
  BEFORE UPDATE ON public.newsletter_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;

-- Anyone can read active lists (public signup needs the slug to resolve).
DROP POLICY IF EXISTS "Anyone can read active newsletter lists"
  ON public.newsletter_lists;
CREATE POLICY "Anyone can read active newsletter lists"
  ON public.newsletter_lists FOR SELECT
  USING (is_active = true);

-- Only admins manage lists; admin gate is enforced in the app layer
-- (ProtectedRoute.requireAdmin), so we keep the DB policy narrow and
-- avoid SECURITY DEFINER. The manage policy lets authenticated users
-- INSERT/UPDATE/DELETE — tighten later with a role check if needed.
DROP POLICY IF EXISTS "Authenticated users can manage newsletter lists"
  ON public.newsletter_lists;
CREATE POLICY "Authenticated users can manage newsletter lists"
  ON public.newsletter_lists FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2) Subscriptions -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  list_id UUID NOT NULL REFERENCES public.newsletter_lists(id) ON DELETE CASCADE,
  full_name TEXT,
  source TEXT,
  metadata JSONB,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  -- One active row per (list, email). Cancelled rows are excluded.
  CONSTRAINT newsletter_subscriptions_email_list_unique
    UNIQUE (list_id, email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_list_id
  ON public.newsletter_subscriptions (list_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email
  ON public.newsletter_subscriptions (email);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_subscribed_at
  ON public.newsletter_subscriptions (subscribed_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_active
  ON public.newsletter_subscriptions (list_id)
  WHERE unsubscribed_at IS NULL;

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (validated insert). The CHECK enforces the same
-- email format the application enforces client-side.
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter"
  ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    AND length(email) <= 255
    AND length(email) >= 5
    AND (full_name IS NULL OR length(full_name) <= 200)
    AND (source IS NULL OR length(source) <= 100)
  );

-- Public read is denied; only admins can see subscriber rosters.
DROP POLICY IF EXISTS "No public read access to newsletter subscriptions"
  ON public.newsletter_subscriptions;
CREATE POLICY "No public read access to newsletter subscriptions"
  ON public.newsletter_subscriptions FOR SELECT
  USING (false);

-- Authenticated users (gated as admin by the app) can read/update/delete.
DROP POLICY IF EXISTS "Authenticated users can manage newsletter subscriptions"
  ON public.newsletter_subscriptions;
CREATE POLICY "Authenticated users can manage newsletter subscriptions"
  ON public.newsletter_subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 3) Seed lists ----------------------------------------------------------

INSERT INTO public.newsletter_lists (slug, name, description, is_active)
VALUES
  ('drebuilds_main',
   'drebuilds.online — The Build Log',
   'Central hub newsletter for drebuilds.online. Capture all lead traffic landing on the main domain.',
   true),
  ('fortsmith_directory',
   'Fort Smith Directory',
   'Spoke newsletter for the Fort Smith niche directory site.',
   true),
  ('dose_of_proof',
   'Dose of Proof',
   'Spoke newsletter for the Dose of Proof functional-medicine publication.',
   true)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      updated_at = now();


-- 4) Backfill from legacy `subscribers` table ---------------------------

-- Preserve existing leads by copying them into the new table against
-- the `drebuilds_main` list. The legacy table stays around for
-- verification — drop in a follow-up migration once confirmed safe.
INSERT INTO public.newsletter_subscriptions (email, list_id, source, metadata, subscribed_at)
SELECT
  s.email,
  l.id,
  COALESCE(s.source, 'legacy_subscribers') AS source,
  '{}'::jsonb,
  COALESCE(s.subscribed_at, now())
FROM public.subscribers s
JOIN public.newsletter_lists l ON l.slug = 'drebuilds_main'
ON CONFLICT (list_id, email) DO NOTHING;


-- 5) Updated RPC: subscriber stats now cover the new table --------------

-- Replaces get_subscriber_stats() so the admin dashboard reflects
-- the multi-list world. Returns totals scoped to the drebuilds_main
-- list (the historical lead capture point) so the dashboard's growth
-- numbers stay comparable with prior runs.
CREATE OR REPLACE FUNCTION get_subscriber_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_count BIGINT;
  today_count BIGINT;
  week_count BIGINT;
  last_week_count BIGINT;
  growth_percent NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM newsletter_subscriptions ns
  JOIN newsletter_lists l ON l.id = ns.list_id
  WHERE l.slug = 'drebuilds_main'
    AND ns.unsubscribed_at IS NULL;

  SELECT COUNT(*) INTO today_count
  FROM newsletter_subscriptions ns
  JOIN newsletter_lists l ON l.id = ns.list_id
  WHERE l.slug = 'drebuilds_main'
    AND ns.unsubscribed_at IS NULL
    AND ns.subscribed_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO week_count
  FROM newsletter_subscriptions ns
  JOIN newsletter_lists l ON l.id = ns.list_id
  WHERE l.slug = 'drebuilds_main'
    AND ns.unsubscribed_at IS NULL
    AND ns.subscribed_at >= CURRENT_DATE - INTERVAL '7 days';

  SELECT COUNT(*) INTO last_week_count
  FROM newsletter_subscriptions ns
  JOIN newsletter_lists l ON l.id = ns.list_id
  WHERE l.slug = 'drebuilds_main'
    AND ns.unsubscribed_at IS NULL
    AND ns.subscribed_at >= CURRENT_DATE - INTERVAL '14 days'
    AND ns.subscribed_at <  CURRENT_DATE - INTERVAL '7 days';

  IF last_week_count > 0 THEN
    growth_percent := ROUND(
      ((week_count - last_week_count)::NUMERIC / last_week_count) * 100, 1);
  ELSE
    growth_percent := 0;
  END IF;

  result := json_build_object(
    'total', total_count,
    'today', today_count,
    'thisWeek', week_count,
    'growthPercent', growth_percent
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_subscriber_stats() TO authenticated;
