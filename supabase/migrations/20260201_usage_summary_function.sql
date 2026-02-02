-- Create a function to summarize usage by month
CREATE OR REPLACE FUNCTION get_monthly_usage_summary(p_user_id UUID)
RETURNS TABLE (
  event_month TEXT,
  talent_searches BIGINT,
  candidates_found BIGINT,
  roles_created BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pbe.event_month,
    -- Only count non-backfilled searches (real searches after tracking started)
    COUNT(*) FILTER (WHERE pbe.event_type = 'talent_search' AND (pbe.metadata->>'backfilled')::boolean IS NOT TRUE) AS talent_searches,
    COALESCE(SUM((pbe.metadata->>'candidates_found')::int) FILTER (WHERE pbe.event_type = 'talent_search' AND (pbe.metadata->>'backfilled')::boolean IS NOT TRUE), 0) AS candidates_found,
    COUNT(*) FILTER (WHERE pbe.event_type = 'role_created' AND (pbe.metadata->>'backfilled')::boolean IS NOT TRUE) AS roles_created
  FROM pilot_billing_events pbe
  WHERE pbe.user_id = p_user_id
  GROUP BY pbe.event_month
  ORDER BY pbe.event_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
