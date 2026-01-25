-- Add validation constraints for data integrity

-- Content items: limit text to 500 characters (reasonable for display items)
ALTER TABLE public.content_items 
ADD CONSTRAINT content_text_length 
CHECK (char_length(text) >= 1 AND char_length(text) <= 500);

-- Offer settings: validation constraints
ALTER TABLE public.offer_settings
ADD CONSTRAINT offer_title_length 
CHECK (char_length(title) >= 1 AND char_length(title) <= 100);

ALTER TABLE public.offer_settings
ADD CONSTRAINT offer_price_length 
CHECK (char_length(price) >= 1 AND char_length(price) <= 50);

ALTER TABLE public.offer_settings
ADD CONSTRAINT offer_link_format 
CHECK (link IS NULL OR link ~ '^(/[a-zA-Z0-9_-]+)+$' OR link ~ '^https?://[a-zA-Z0-9][a-zA-Z0-9.-]+');

ALTER TABLE public.offer_settings
ADD CONSTRAINT offer_description_length 
CHECK (description IS NULL OR char_length(description) <= 500);

-- Subscribers: email format and length validation
ALTER TABLE public.subscribers
ADD CONSTRAINT subscriber_email_length 
CHECK (char_length(email) >= 5 AND char_length(email) <= 255);

ALTER TABLE public.subscribers
ADD CONSTRAINT subscriber_email_format 
CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

-- Button clicks: reasonable length limits
ALTER TABLE public.button_clicks
ADD CONSTRAINT button_id_length 
CHECK (char_length(button_id) >= 1 AND char_length(button_id) <= 100);

ALTER TABLE public.button_clicks
ADD CONSTRAINT session_id_length 
CHECK (session_id IS NULL OR char_length(session_id) <= 100);

ALTER TABLE public.button_clicks
ADD CONSTRAINT page_section_length 
CHECK (page_section IS NULL OR char_length(page_section) <= 100);