-- ============================================
-- CREATE PILOT USER SCRIPT
-- Run this in Supabase SQL Editor to create pilot recruiter accounts
-- ============================================

-- INSTRUCTIONS:
-- 1. Go to your Supabase project: https://supabase.com/dashboard
-- 2. Navigate to SQL Editor
-- 3. Replace the placeholder values below with actual user details
-- 4. Run the script
-- 5. Send the email and temporary password to the pilot user
-- 6. They can log in at: https://hireinbox.co.za/pilot

-- ============================================
-- STEP 1: Create auth user with Supabase Admin API
-- ============================================
-- NOTE: This cannot be done via SQL directly for security reasons.
-- You must use the Supabase Dashboard or API:
--
-- OPTION A: Supabase Dashboard (RECOMMENDED)
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" > "Create new user"
-- 3. Enter email: [email@company.co.za]
-- 4. Enter password: [temporary_password]
-- 5. Check "Auto Confirm User" (skip email verification)
-- 6. Click "Create user"
-- 7. Copy the user ID (UUID) from the users list
-- 8. Then run the SQL below to set user metadata

-- OPTION B: Supabase API (for automation)
-- Use the Management API to create users programmatically
-- Docs: https://supabase.com/docs/reference/javascript/auth-admin-createuser

-- ============================================
-- STEP 2: Set user metadata (after creating user via dashboard)
-- ============================================
-- Replace 'USER_UUID_HERE' with the actual user ID from Step 1

UPDATE auth.users
SET
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{user_type}',
    '"pilot_recruiter"'
  ),
  email_confirmed_at = NOW() -- Auto-confirm email
WHERE id = 'USER_UUID_HERE'; -- Replace with actual user UUID

-- ============================================
-- STEP 3: Verify user was created correctly
-- ============================================

SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type,
  created_at
FROM auth.users
WHERE email = 'email@company.co.za' -- Replace with actual email
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- EXPECTED OUTPUT:
-- ============================================
-- id                  | [UUID]
-- email               | email@company.co.za
-- email_confirmed_at  | [timestamp]
-- user_type           | pilot_recruiter
-- created_at          | [timestamp]

-- ============================================
-- STEP 4: Create profile record (optional, if you have a users table)
-- ============================================
-- If your app has a separate users/profiles table, create that record here
-- Replace values as needed

-- INSERT INTO public.users (id, email, user_type, created_at)
-- VALUES (
--   'USER_UUID_HERE', -- Same UUID from auth.users
--   'email@company.co.za',
--   'pilot_recruiter',
--   NOW()
-- );

-- ============================================
-- STEP 5: Send credentials to pilot user
-- ============================================
-- Email template:

/*
Subject: Your HireInbox Pilot Access

Hi [First Name],

Welcome to the HireInbox pilot program!

Your login credentials:
Email: [email@company.co.za]
Password: [temporary_password]
Login URL: https://hireinbox.co.za/pilot

Please change your password after your first login.

What you can do in the pilot:
1. Talent Mapping - Find hidden candidates with AI
2. CV Screening - Screen CVs in seconds with explainable AI
3. Reports - View and save your talent searches

Need help? Contact Simon at simon@mafadi.co.za or WhatsApp +27 72 117 2137

Best regards,
The HireInbox Team
*/

-- ============================================
-- QUICK REFERENCE: Create multiple users
-- ============================================
-- Use the Supabase Dashboard to create each user, then run this for each:

-- User 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{user_type}', '"pilot_recruiter"'),
    email_confirmed_at = NOW()
WHERE email = 'user1@company.co.za';

-- User 2
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{user_type}', '"pilot_recruiter"'),
    email_confirmed_at = NOW()
WHERE email = 'user2@company.co.za';

-- User 3
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{user_type}', '"pilot_recruiter"'),
    email_confirmed_at = NOW()
WHERE email = 'user3@company.co.za';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Check if user exists
SELECT id, email, email_confirmed_at, raw_user_meta_data
FROM auth.users
WHERE email = 'email@company.co.za';

-- Reset user password (if they forget)
-- Do this via Dashboard: Authentication > Users > [user] > Reset Password

-- Delete pilot user (if needed)
-- DELETE FROM auth.users WHERE email = 'email@company.co.za';

-- List all pilot users
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'pilot_recruiter'
ORDER BY created_at DESC;
