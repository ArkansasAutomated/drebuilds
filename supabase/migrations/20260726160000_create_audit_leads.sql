-- ============================================================
-- CREATE AUDIT_LEADS TABLE
-- ============================================================
-- Captures leads from the /audit lead capture funnel on
-- drebuilds.online (Free AI Automation Audit). Each row is a
-- prospective Arkansas small business requesting an audit.
-- Status is managed by the admin team via the Admin panel.
-- ============================================================

CREATE TABLE public.audit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Step 1: Business
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  team_size TEXT NOT NULL,

  -- Step 2: Pain
  current_tools TEXT[] NOT NULL DEFAULT '{}',
  biggest_bottleneck TEXT NOT NULL,

  -- Step 3: Contact
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact_method TEXT NOT NULL,

  -- Pipeline
  status TEXT NOT NULL DEFAULT 'new',

  -- Provenance
  source TEXT DEFAULT 'audit_page',
  user_agent TEXT,
  referrer TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Single canonical status pipeline for the admin panel
ALTER TABLE public.audit_leads
ADD CONSTRAINT audit_leads_status_check
CHECK (status IN ('new', 'reviewed', 'audited', 'booked', 'closed_won', 'closed_lost'));

-- Length & format guards (defense in depth alongside zod)
ALTER TABLE public.audit_leads
ADD CONSTRAINT audit_leads_business_name_length
CHECK (char_length(business_name) BETWEEN 1 AND 200);

ALTER TABLE public.audit_leads
ADD CONSTRAINT audit_leads_full_name_length
CHECK (char_length(full_name) BETWEEN 1 AND 200);

ALTER TABLE public.audit_leads
ADD CONSTRAINT audit_leads_email_length
CHECK (char_length(email) BETWEEN 5 AND 255);

ALTER TABLE public.audit_leads
ADD CONSTRAINT audit_leads_phone_length
CHECK (char_length(phone) BETWEEN 7 AND 30);

-- Index for admin panel listing (newest first) and status filtering
CREATE INDEX audit_leads_created_at_idx
  ON public.audit_leads (created_at DESC);

CREATE INDEX audit_leads_status_idx
  ON public.audit_leads (status);

-- updated_at auto-touch on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at_audit_leads()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_leads_updated_at
BEFORE UPDATE ON public.audit_leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_audit_leads();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (anon included) can submit a lead from the /audit form
CREATE POLICY "Anyone can submit an audit lead"
ON public.audit_leads
FOR INSERT
WITH CHECK (true);

-- Public reads are blocked; only admins (gated at the app layer)
-- access rows. The Admin page renders only for users with role=admin.
CREATE POLICY "No public read access to audit leads"
ON public.audit_leads
FOR SELECT
USING (false);