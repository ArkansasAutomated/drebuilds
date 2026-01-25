-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create button_clicks table for analytics
CREATE TABLE public.button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  button_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT,
  page_section TEXT DEFAULT 'logic_gates'
);

-- Enable RLS on button_clicks
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert clicks (anonymous tracking)
CREATE POLICY "Anyone can track clicks"
ON public.button_clicks FOR INSERT
WITH CHECK (true);

-- Only admins can read click data
CREATE POLICY "Admins can read clicks"
ON public.button_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create content_items table for marquee
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on content_items
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active content
CREATE POLICY "Anyone can read active content"
ON public.content_items FOR SELECT
USING (is_active = true);

-- Admins can manage all content
CREATE POLICY "Admins can manage content"
ON public.content_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed content_items with current marquee data
INSERT INTO public.content_items (text, display_order) VALUES
  ('Real-time Builds', 1),
  ('Weekly Automation Breakdowns', 2),
  ('Raw Code Sessions', 3),
  ('AI Strategy Deep-Dives', 4),
  ('System Architecture Reviews', 5),
  ('Agentic Workflow Tutorials', 6);

-- Create offer_settings table
CREATE TABLE public.offer_settings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on offer_settings
ALTER TABLE public.offer_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active offers
CREATE POLICY "Anyone can read offers"
ON public.offer_settings FOR SELECT
USING (is_active = true);

-- Admins can manage offers
CREATE POLICY "Admins can manage offers"
ON public.offer_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed offer_settings with current data
INSERT INTO public.offer_settings (id, title, description, price, link) VALUES
  ('consulting', 'Business Systems Architecture', 'Custom automation frameworks designed for your unique business logic. From workflow mapping to full implementation.', '$500', '/consulting'),
  ('community', 'Agentic Engineering Hub', 'Join a community of builders creating the next generation of intelligent automation systems.', 'Free', '/community'),
  ('store', 'Plug-and-Play Logic', 'Pre-built automation templates and digital products ready to deploy in your workflow stack.', 'From $29', '/store'),
  ('learn', 'Content & Education', 'Deep-dive tutorials, raw code sessions, and weekly automation breakdowns to level up your skills.', 'Free', '/learn');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_settings_updated_at
  BEFORE UPDATE ON public.offer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();