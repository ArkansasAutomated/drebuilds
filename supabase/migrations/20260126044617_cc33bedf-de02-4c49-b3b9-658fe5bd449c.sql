-- Telemetry events table for tracking user interactions
CREATE TABLE public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  element_id TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraints for field lengths
ALTER TABLE public.telemetry_events
  ADD CONSTRAINT telemetry_event_type_length CHECK (length(event_type) <= 50),
  ADD CONSTRAINT telemetry_element_id_length CHECK (element_id IS NULL OR length(element_id) <= 100),
  ADD CONSTRAINT telemetry_session_id_length CHECK (session_id IS NULL OR length(session_id) <= 100);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert telemetry (anonymous tracking)
CREATE POLICY "Anyone can insert telemetry"
  ON public.telemetry_events
  FOR INSERT
  WITH CHECK (
    length(event_type) <= 50 AND
    (element_id IS NULL OR length(element_id) <= 100) AND
    (session_id IS NULL OR length(session_id) <= 100)
  );

-- Policy: Only admins can read telemetry
CREATE POLICY "Admins can read telemetry"
  ON public.telemetry_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for common queries
CREATE INDEX idx_telemetry_event_type ON public.telemetry_events(event_type);
CREATE INDEX idx_telemetry_created_at ON public.telemetry_events(created_at DESC);