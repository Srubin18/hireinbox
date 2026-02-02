-- Make David and Simon admin users (non-billable, get orange admin badge)
UPDATE profiles
SET pilot_role = 'admin'
WHERE email IN ('djchernick@gmail.com', 'simon@mafadi.co.za');

-- Verify the changes
SELECT
  email,
  pilot_role,
  CASE
    WHEN pilot_role = 'admin' THEN '👑 Admin (non-billable)'
    WHEN pilot_role = 'influencer' THEN '⭐ Influencer (non-billable)'
    WHEN pilot_role = 'pilot_user' THEN '✅ Pilot User (billable)'
    ELSE '⚠️ Unassigned'
  END as status
FROM profiles
ORDER BY pilot_role, email;
