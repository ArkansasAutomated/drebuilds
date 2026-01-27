-- RPC function for subscriber statistics
-- Offloads computation from client to database for better performance

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
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM subscribers;
  
  -- Get today's count
  SELECT COUNT(*) INTO today_count 
  FROM subscribers 
  WHERE subscribed_at >= CURRENT_DATE;
  
  -- Get this week's count
  SELECT COUNT(*) INTO week_count 
  FROM subscribers 
  WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Get last week's count for growth calculation
  SELECT COUNT(*) INTO last_week_count 
  FROM subscribers 
  WHERE subscribed_at >= CURRENT_DATE - INTERVAL '14 days'
    AND subscribed_at < CURRENT_DATE - INTERVAL '7 days';
  
  -- Calculate growth percent
  IF last_week_count > 0 THEN
    growth_percent := ROUND(((week_count - last_week_count)::NUMERIC / last_week_count) * 100, 1);
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

-- Grant execute permission to authenticated users (admin check in app layer)
GRANT EXECUTE ON FUNCTION get_subscriber_stats() TO authenticated;

-- RPC function for click statistics
CREATE OR REPLACE FUNCTION get_click_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  click_data JSON;
  total_clicks BIGINT;
BEGIN
  -- Get total clicks
  SELECT COUNT(*) INTO total_clicks FROM button_clicks;
  
  -- Get clicks per button with percentages
  SELECT json_agg(
    json_build_object(
      'buttonId', button_id,
      'clicks', clicks,
      'percentage', ROUND((clicks::NUMERIC / NULLIF(total_clicks, 0)) * 100, 1)
    )
  ) INTO click_data
  FROM (
    SELECT 
      button_id,
      COUNT(*) as clicks
    FROM button_clicks
    GROUP BY button_id
  ) sub;
  
  RETURN COALESCE(click_data, '[]'::JSON);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_click_stats() TO authenticated;
