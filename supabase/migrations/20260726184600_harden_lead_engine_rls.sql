-- Enforce the admin boundary in Postgres instead of relying on UI routing.

DROP POLICY IF EXISTS "Anyone can submit an audit lead" ON public.audit_leads;
DROP POLICY IF EXISTS "No public read access to audit leads" ON public.audit_leads;

CREATE POLICY "Public can submit valid audit leads"
ON public.audit_leads FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'new');

CREATE POLICY "Admins can read audit leads"
ON public.audit_leads FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update audit leads"
ON public.audit_leads FOR UPDATE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Anyone can read active newsletter lists" ON public.newsletter_lists;
DROP POLICY IF EXISTS "Authenticated users can manage newsletter lists" ON public.newsletter_lists;

CREATE POLICY "Public can read active newsletter lists"
ON public.newsletter_lists FOR SELECT
TO anon, authenticated
USING (is_active);

CREATE POLICY "Admins can manage newsletter lists"
ON public.newsletter_lists FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "No public read access to newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can manage newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Public can subscribe to active lists"
ON public.newsletter_subscriptions FOR INSERT
TO anon, authenticated
WITH CHECK (
  unsubscribed_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.newsletter_lists
    WHERE id = list_id AND is_active
  )
);

CREATE POLICY "Admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Anyone can read lead sources aggregate" ON public.lead_sources;
DROP POLICY IF EXISTS "No public write to lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Authenticated users can manage lead sources" ON public.lead_sources;

CREATE POLICY "Admins can manage lead sources"
ON public.lead_sources FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

REVOKE ALL ON FUNCTION public.capture_lead_source(TEXT, TEXT, TEXT, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_lead_source(TEXT, TEXT, TEXT, TEXT, TEXT)
TO service_role;

REVOKE ALL ON FUNCTION public.get_source_analytics(INTEGER)
FROM PUBLIC, anon;

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
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO v_audit_total FROM public.audit_leads;
  SELECT COUNT(*) INTO v_newsletter_total
  FROM public.newsletter_subscriptions
  WHERE unsubscribed_at IS NULL;

  v_totals := json_build_object(
    'audit', v_audit_total,
    'newsletter', v_newsletter_total,
    'all', v_audit_total + v_newsletter_total
  );

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.lead_count DESC), '[]'::json)
  INTO v_by_source
  FROM (
    SELECT
      source, medium, campaign, content, lead_type,
      lead_count, first_seen_at, last_seen_at
    FROM public.lead_sources
    WHERE last_seen_at >= now() - (p_days || ' days')::INTERVAL
  ) t;

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

REVOKE ALL ON FUNCTION public.get_source_analytics(INTEGER)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_source_analytics(INTEGER)
TO authenticated, service_role;
