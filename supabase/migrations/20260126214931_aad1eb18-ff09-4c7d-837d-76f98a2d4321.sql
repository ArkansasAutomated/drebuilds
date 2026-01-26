-- Enable Supabase Realtime on webhook_events table for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_events;