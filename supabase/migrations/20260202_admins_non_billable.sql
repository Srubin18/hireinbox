-- ============================================
-- MAKE ADMINS NON-BILLABLE
-- Only pilot_user role is billable
-- ============================================

-- Update billing events view to exclude both admins and influencers
CREATE OR REPLACE VIEW billable_pilot_events AS
SELECT
  pbe.*,
  p.email,
  p.pilot_role
FROM pilot_billing_events pbe
JOIN profiles p ON pbe.user_id = p.id
WHERE p.pilot_role = 'pilot_user'
  OR p.pilot_role IS NULL; -- Include null for backwards compatibility

COMMENT ON VIEW billable_pilot_events IS 'Billing events for pilot_user role only (excludes admin and influencer)';

-- Update the billable users function
CREATE OR REPLACE FUNCTION get_billable_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  pilot_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.email,
    p.pilot_role
  FROM profiles p
  WHERE p.pilot_role = 'pilot_user'
    OR p.pilot_role IS NULL; -- Backwards compatibility
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_billable_users IS 'Returns only pilot_user role (excludes admin and influencer)';
