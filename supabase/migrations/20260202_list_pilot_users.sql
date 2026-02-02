-- ============================================
-- LIST ALL PILOT USERS
-- Run this to see all current users and their roles
-- ============================================

SELECT
  id,
  email,
  full_name,
  pilot_role,
  user_type,
  created_at,
  last_login
FROM profiles
ORDER BY created_at DESC;

-- Count by role
SELECT
  COALESCE(pilot_role, 'unassigned') as role,
  COUNT(*) as user_count
FROM profiles
GROUP BY pilot_role
ORDER BY user_count DESC;
