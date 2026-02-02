-- ============================================
-- PILOT ROLES
-- Add role field for pilot program users
-- ============================================

-- Add pilot_role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pilot_role TEXT
  CHECK (pilot_role IN ('admin', 'pilot_user', 'influencer'))
  DEFAULT 'pilot_user';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_pilot_role ON profiles(pilot_role);

-- Add comment
COMMENT ON COLUMN profiles.pilot_role IS 'Role in pilot program: admin, pilot_user (billable), or influencer (non-billable)';

-- Update billing events view to exclude influencers
-- This ensures influencers are never billed
CREATE OR REPLACE VIEW billable_pilot_events AS
SELECT
  pbe.*,
  p.email,
  p.pilot_role
FROM pilot_billing_events pbe
JOIN profiles p ON pbe.user_id = p.id
WHERE p.pilot_role IN ('admin', 'pilot_user')
  OR p.pilot_role IS NULL; -- Include null for backwards compatibility

COMMENT ON VIEW billable_pilot_events IS 'Billing events filtered to exclude influencers';

-- Create a function that returns all billable users (excluding influencers)
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
  WHERE p.pilot_role IN ('admin', 'pilot_user')
    OR p.pilot_role IS NULL; -- Backwards compatibility
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_billable_users IS 'Returns list of users who should be billed (excludes influencers)';
