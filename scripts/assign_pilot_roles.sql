-- ============================================
-- ASSIGN PILOT ROLES
-- Run this in Supabase SQL Editor
-- ============================================

-- Make Nina an influencer (non-billable, gets badge)
UPDATE profiles
SET pilot_role = 'influencer'
WHERE email = 'nina@hntr.co.za';

-- Jann stays as pilot_user (billable)
-- No update needed - already pilot_user

-- Make David and Simon admins (billable, can manage users)
UPDATE profiles
SET pilot_role = 'admin'
WHERE email IN ('djchernick@gmail.com', 'simon@mafadi.co.za');

-- Verify the assignments
SELECT
  email,
  pilot_role,
  CASE
    WHEN pilot_role = 'influencer' THEN '❌ Non-billable'
    WHEN pilot_role IN ('admin', 'pilot_user') THEN '✅ Billable'
    ELSE '⚠️ Unassigned'
  END as billing_status
FROM profiles
ORDER BY pilot_role, email;
