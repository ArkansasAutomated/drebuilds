-- ============================================================
-- LEAD SOURCE ATTRIBUTION (hub & spokes)
-- ============================================================
-- Captures UTM params + referrer on every lead so the admin
-- dashboard can answer: "where did this lead come from?"
--
-- The data is split into two complementary pieces:
--
--   1. lead_sources   — one row per (source, medium, campaign)
--                       pair, with running counts + first/last-seen
--                       timestamps. Lets the dashboard show "leads
--                       by source" with cheap aggregates instead of
--                       scanning every lead row.
--
--   2. utm_params     — JSONB columns on audit_leads and
--                       newsletter_subscriptions. Stores the raw
--                       UTM payload captured at form-submit time
--                       so the admin can drill into a specific
--                       lead's full attribution context.
--
-- The existing `source TEXT` columns are kept (and now also
-- written by the new capture flow) for backward-compat with
-- anything already reading them.
-- ============================================================


-- 1) lead_sources ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution core. All four are nullable because traffic can
  -- arrive with no UTMs (organic / direct / referral).
  source TEXT,            -- utm_source or referrer host or 'direct'
  medium TEXT,            -- utm_medium or 'referral' / 'organic' / 'direct'
  campaign TEXT,          -- utm_campaign
  content TEXT,           -- utm_content

  -- Optional lead-type scoping: a row tagged 'audit' counts only
  -- audit_leads; a row tagged 'newsletter' counts only
  -- newsletter_subscriptions. NULL means "all lead types".
  lead_type TEXT,

  -- Running counters. Incremented by the application layer on
  -- each captured lead (no triggers — keeps the attribution logic
  -- in one place, the useLeadAttribution hook).
  lead_count BIGINT NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (source, medium, campaign, content, lead_type) tuple.
-- Empty strings collapse to NULLs via a partial unique index so
-- "no UTM" traffic still gets a single bucket per lead_type.
CREATE UNIQUE INDEX IF NOT EXISTS lead_sources_unique_idx
  ON public.lead_sources (
    COALESCE(source, ''),
    COALESCE(medium, ''),
    COALESCE(campaign, ''),
    COALESCE(content, ''),
    COALESCE(lead_type, '')
  );

CREATE INDEX IF NOT EXISTS lead_sources_source_idx
  ON public.lead_sources (source);

CREATE INDEX IF NOT EXISTS lead_sources_medium_idx
  ON public.lead_sources (medium);

CREATE INDEX IF NOT EXISTS lead_sources_campaign_idx
  ON public.lead_sources (campaign);

CREATE INDEX IF NOT EXISTS lead_sources_lead_type_idx
  ON public.lead_sources (lead_type);

CREATE INDEX IF NOT EXISTS lead_sources_last_seen_idx
  ON public.lead_sources (last_seen_at DESC);

-- updated_at auto-touch on UPDATE
DROP TRIGGER IF EXISTS update_lead_sources_updated_at
  ON public.lead_sources;
CREATE TRIGGER update_lead_sources_updated_at
BEFORE UPDATE ON public.lead_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Public read so the analytics view (when exposed) can fetch.
-- Insert/update is gated to service_role via the Edge Function.
DROP POLICY IF EXISTS "Anyone can read lead sources aggregate"
  ON public.lead_sources;
CREATE POLICY "Anyone can read lead sources aggregate"
  ON public.lead_sources FOR SELECT
  USING (true);

-- No anon insert/update/delete. The capture-lead edge function
-- uses the service role to bump the counters.
DROP POLICY IF EXISTS "No public write to lead sources"
  ON public.lead_sources;
CREATE POLICY "No public write to lead sources"
  ON public.lead_sources FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users can manage lead sources"
  ON public.lead_sources;
CREATE POLICY "Authenticated users can manage lead sources"
  ON public.lead_sources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2) audit_leads: add utm columns + source_url ---------------------

ALTER TABLE public.audit_leads
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE public.audit_leads
  ADD COLUMN IF NOT EXISTS utm_params JSONB;

CREATE INDEX IF NOT EXISTS audit_leads_utm_source_idx
  ON public.audit_leads ((utm_params->>'utm_source'));

CREATE INDEX IF NOT EXISTS audit_leads_source_idx
  ON public.audit_leads (source);


-- 3) newsletter_subscriptions: add utm columns + source_url -------

ALTER TABLE public.newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE public.newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS utm_params JSONB;

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_utm_source_idx
  ON public.newsletter_subscriptions ((utm_params->>'utm_source'));


-- 4) capture_lead RPC ----------------------------------------------
-- Atomic upsert into lead_sources with running counter increment.
-- Called by the capture-lead edge function with the service role
-- after a lead is inserted into its target table.
-- Returns the lead_source row id so the caller can correlate.

CREATE OR REPLACE FUNCTION public.capture_lead_source(
  p_source TEXT,
  p_medium TEXT,
  p_campaign TEXT,
  p_content TEXT,
  p_lead_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.lead_sources (
    source, medium, campaign, content, lead_type, lead_count,
    first_seen_at, last_seen_at
  )
  VALUES (
    NULLIF(p_source, ''), NULLIF(p_medium, ''),
    NULLIF(p_campaign, ''), NULLIF(p_content, ''),
    NULLIF(p_lead_type, ''), 1, now(), now()
  )
  ON CONFLICT (
    COALESCE(source, ''),
    COALESCE(medium, ''),
    COALESCE(campaign, ''),
    COALESCE(content, ''),
    COALESCE(lead_type, '')
  )
  DO UPDATE SET
    lead_count = lead_sources.lead_count + 1,
    last_seen_at = now(),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_lead_source(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;


-- 5) Source analytics RPC ------------------------------------------
-- Returns leads-by-source rows for the admin dashboard. Aggregates
-- straight from lead_sources so the panel renders in a single
-- query regardless of how many leads exist.
--
-- Returns JSON shaped as:
--   {
--     "totals": { "audit": n, "newsletter": n, "all": n },
--     "by_source": [
--       { "source": "...", "medium": "...", "campaign": "...",
--         "lead_type": "...", "lead_count": n, "last_seen_at": "..." },
--       ...
--     ],
--     "by_day": [ { "day": "2026-07-26", "count": n }, ... ]
--   }
--
-- by_day is computed from the raw lead tables (audit_leads +
-- newsletter_subscriptions) so a spike that hasn't been rolled
-- into lead_sources yet still shows up.

CREATE OR REPLACE FUNCTION public.get_source_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_totals JSON;
  v_by_source JSON;
  v_by_day JSON;
  v_audit_total BIGINT;
  v_newsletter_total BIGINT;
BEGIN
  -- Totals
  SELECT COUNT(*) INTO v_audit_total FROM public.audit_leads;
  SELECT COUNT(*) INTO v_newsletter_total FROM public.newsletter_subscriptions
    WHERE unsubscribed_at IS NULL;

  v_totals := json_build_object(
    'audit', v_audit_total,
    'newsletter', v_newsletter_total,
    'all', v_audit_total + v_newsletter_total
  );

  -- By source from the rollup table (cheap, pre-aggregated)
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.lead_count DESC), '[]'::json)
  INTO v_by_source
  FROM (
    SELECT
      source, medium, campaign, content, lead_type,
      lead_count, first_seen_at, last_seen_at
    FROM public.lead_sources
    WHERE last_seen_at >= now() - (p_days || ' days')::INTERVAL
  ) t;

  -- By day from raw lead tables (catches anything not yet rolled up)
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.day ASC), '[]'::json)
  INTO v_by_day
  FROM (
    SELECT day::text AS day, SUM(cnt)::bigint AS count
    FROM (
      SELECT date_trunc('day', created_at) AS day, COUNT(*) AS cnt
      FROM public.audit_leads
      WHERE created_at >= now() - (p_days || ' days')::INTERVAL
      GROUP BY 1
      UNION ALL
      SELECT date_trunc('day', subscribed_at) AS day, COUNT(*) AS cnt
      FROM public.newsletter_subscriptions
      WHERE subscribed_at >= now() - (p_days || ' days')::INTERVAL
        AND unsubscribed_at IS NULL
      GROUP BY 1
    ) s
    GROUP BY day
    ORDER BY day ASC
  ) t;

  RETURN json_build_object(
    'totals', v_totals,
    'by_source', v_by_source,
    'by_day', v_by_day
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_source_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_source_analytics(INTEGER) TO service_role;
