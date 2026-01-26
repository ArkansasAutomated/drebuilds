-- Create webhook_events table for logging and deduplication
CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on event_id for fast duplicate checks
CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);

-- Create index on event_type for filtering
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);

-- Create index on created_at for time-based queries
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT policy for viewing logs
CREATE POLICY "Admins can read webhook events"
ON public.webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies needed - Edge Function uses service role