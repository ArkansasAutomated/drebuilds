-- Create vault_assets table for gated content
CREATE TABLE public.vault_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('blueprint', 'code', 'template')),
  file_url TEXT NOT NULL,
  file_type TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints
ALTER TABLE public.vault_assets ADD CONSTRAINT vault_assets_title_length CHECK (length(title) <= 200);
ALTER TABLE public.vault_assets ADD CONSTRAINT vault_assets_file_url_format CHECK (file_url ~ '^https?://');

-- Enable RLS
ALTER TABLE public.vault_assets ENABLE ROW LEVEL SECURITY;

-- Admins can manage all vault assets
CREATE POLICY "Admins can manage vault assets"
ON public.vault_assets
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Authenticated users can read active vault assets (access control done in app layer via Whop plan check)
CREATE POLICY "Authenticated users can read active vault assets"
ON public.vault_assets
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_vault_assets_updated_at
BEFORE UPDATE ON public.vault_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample vault assets
INSERT INTO public.vault_assets (title, description, category, file_url, file_type, display_order) VALUES
('Automation Blueprint v1', 'Complete workflow architecture for AI-powered automation systems', 'blueprint', 'https://example.com/blueprints/automation-v1.pdf', 'pdf', 1),
('n8n Integration Template', 'Pre-built n8n workflow for CRM automation', 'template', 'https://example.com/templates/n8n-crm.json', 'json', 2),
('Agentic Loop Snippet', 'TypeScript implementation of self-correcting agent loop', 'code', 'https://example.com/code/agentic-loop.ts', 'ts', 3),
('API Gateway Pattern', 'Scalable API gateway architecture diagram and implementation', 'blueprint', 'https://example.com/blueprints/api-gateway.pdf', 'pdf', 4),
('Webhook Handler Template', 'Production-ready webhook handler with retry logic', 'template', 'https://example.com/templates/webhook-handler.zip', 'zip', 5),
('State Machine Utility', 'Finite state machine implementation for workflow orchestration', 'code', 'https://example.com/code/state-machine.ts', 'ts', 6);