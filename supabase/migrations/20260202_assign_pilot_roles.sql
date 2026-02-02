-- ============================================
-- ASSIGN PILOT ROLES TO EXISTING USERS
-- Run this after creating the pilot_role column
-- Update the emails below based on actual user roles
-- ============================================

-- Template for assigning roles
-- Replace 'user@example.com' with actual email addresses

-- ADMIN USERS (billable)
UPDATE profiles
SET pilot_role = 'admin'
WHERE email IN (
  'admin@example.com'
  -- Add more admin emails here
);

-- PILOT USERS (billable)
UPDATE profiles
SET pilot_role = 'pilot_user'
WHERE email IN (
  'pilot1@example.com',
  'pilot2@example.com'
  -- Add more pilot user emails here
);

-- INFLUENCERS (non-billable, will see badge)
UPDATE profiles
SET pilot_role = 'influencer'
WHERE email IN (
  'influencer@example.com'
  -- Add more influencer emails here
);

-- Verify the assignments
SELECT
  email,
  pilot_role,
  created_at
FROM profiles
WHERE pilot_role IS NOT NULL
ORDER BY pilot_role, email;
