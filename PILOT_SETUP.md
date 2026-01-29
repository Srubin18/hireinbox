# HireInbox Pilot Program Setup Guide

## Overview

This guide explains how to set up and manage pilot users for the HireInbox recruitment platform. During the pilot phase, user registration is disabled and all accounts are created manually from the backend.

---

## Quick Start: Create a Pilot User

### Step 1: Create User in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `https://uloenybeeozjwfsuhbpi.supabase.co`
3. Click **Authentication** > **Users** in the left sidebar
4. Click **Add User** > **Create new user**
5. Fill in:
   - **Email**: `recruiter@company.co.za`
   - **Password**: Generate a secure temporary password (min 6 chars)
   - **Auto Confirm User**: ✓ Check this box (skips email verification)
6. Click **Create user**
7. Copy the **User ID (UUID)** that appears in the users list

### Step 2: Set User Metadata

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query (replace `USER_UUID_HERE` with the actual UUID from Step 1):

```sql
UPDATE auth.users
SET
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{user_type}',
    '"pilot_recruiter"'
  ),
  email_confirmed_at = NOW()
WHERE id = 'USER_UUID_HERE';
```

### Step 3: Verify User Creation

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type,
  created_at
FROM auth.users
WHERE email = 'recruiter@company.co.za'
ORDER BY created_at DESC
LIMIT 1;
```

Expected output:
- `user_type`: `pilot_recruiter`
- `email_confirmed_at`: Should have a timestamp (not null)

### Step 4: Send Credentials to Pilot User

Email template:

```
Subject: Your HireInbox Pilot Access

Hi [First Name],

Welcome to the HireInbox pilot program! You're part of an exclusive group testing our AI recruitment platform.

Your login credentials:
Email: [their email]
Password: [temporary password]
Login URL: https://hireinbox.co.za/pilot

Please change your password after your first login by clicking your profile.

What you can do in the pilot:
1. **Talent Mapping** - Find hidden candidates with AI-powered intelligence
2. **CV Screening** - Screen 50+ CVs in seconds with explainable AI
3. **Reports** - View and save your talent search reports

Need help?
- Email: simon@mafadi.co.za
- WhatsApp: +27 72 117 2137

Best regards,
The HireInbox Team
```

---

## Bulk Create Multiple Pilot Users

To create multiple users at once:

1. Create each user via Supabase Dashboard (Step 1 above)
2. Run this batch SQL script:

```sql
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
```

---

## Pilot User Management

### List All Pilot Users

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'pilot_recruiter'
ORDER BY created_at DESC;
```

### Reset User Password

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Find the user
3. Click the three dots **...** next to their name
4. Click **Reset password**
5. They'll receive an email with a reset link

### Delete Pilot User

⚠️ **Use with caution** - This permanently deletes the user and all their data.

```sql
DELETE FROM auth.users WHERE email = 'user@company.co.za';
```

### Check User Activity

```sql
-- Recent logins
SELECT
  email,
  last_sign_in_at,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'pilot_recruiter'
ORDER BY last_sign_in_at DESC;

-- User statistics
SELECT
  u.email,
  COUNT(DISTINCT r.id) as roles_created,
  COUNT(DISTINCT c.id) as cvs_screened,
  COUNT(DISTINCT tm.id) as talent_searches
FROM auth.users u
LEFT JOIN roles r ON r.user_id = u.id
LEFT JOIN candidates c ON c.role_id = r.id
LEFT JOIN talent_mapping_reports tm ON tm.user_id = u.id
WHERE u.raw_user_meta_data->>'user_type' = 'pilot_recruiter'
GROUP BY u.email
ORDER BY u.email;
```

---

## Re-Enable Public Signup (Post-Pilot)

When you're ready to allow public signups:

1. Open `/src/app/pilot/page.tsx`
2. Look for comments that say `SIGNUP DISABLED`
3. Uncomment the signup code blocks:
   - Uncomment the `mode` state variable
   - Uncomment the signup logic in `handleSubmit`
   - Uncomment the dynamic UI text (heading, description, button)
   - Uncomment the signup toggle section at the bottom
4. Remove or comment out the "Access is by invitation only" message

The commented code is fully functional and ready to be re-enabled.

---

## Pilot Testing Checklist

Before inviting pilot users:

- [ ] Create pilot user accounts in Supabase
- [ ] Set `user_type: 'pilot_recruiter'` metadata
- [ ] Confirm emails are verified (`email_confirmed_at` is set)
- [ ] Test login at `/pilot`
- [ ] Verify dashboard loads with stats
- [ ] Test CV screening flow (create role, upload CVs)
- [ ] Test talent mapping (run search, save report)
- [ ] Send credentials to pilot users
- [ ] Monitor for errors in first 24 hours

---

## Troubleshooting

### User can't log in

Check:
1. Email is correct (case-sensitive)
2. Email is confirmed: `SELECT email_confirmed_at FROM auth.users WHERE email = 'user@company.co.za'`
3. User metadata is set: `SELECT raw_user_meta_data FROM auth.users WHERE email = 'user@company.co.za'`

### User gets "redirected too many times" error

This usually means RLS policies are blocking access. Check:
```sql
-- Ensure pilot users have proper access
-- RLS policies should check user_type or use service role key in API routes
```

### Dashboard shows no data

Check:
1. User is logged in: `SELECT * FROM auth.sessions WHERE user_id = 'USER_UUID'`
2. Data exists for user: `SELECT * FROM roles WHERE user_id = 'USER_UUID'`
3. RLS policies allow access: Test queries in SQL Editor with user's session token

---

## Database Schema Reference

### Tables Used by Pilot

- `auth.users` - Supabase authentication
- `roles` - CV screening role definitions
- `candidates` - Screened CV records
- `talent_mapping_reports` - Saved talent searches

### Important Columns

**auth.users:**
- `id` - User UUID (primary key)
- `email` - User email
- `email_confirmed_at` - Timestamp of email confirmation
- `raw_user_meta_data` - JSON with `user_type: 'pilot_recruiter'`
- `last_sign_in_at` - Last login timestamp

**roles:**
- `id` - Role UUID
- `user_id` - Foreign key to auth.users
- `title` - Job title
- `created_at` - Creation timestamp

**candidates:**
- `id` - Candidate UUID
- `role_id` - Foreign key to roles
- `ai_score` - AI screening score (0-100)
- `status` - 'shortlist', 'consider', 'reject'

**talent_mapping_reports:**
- `id` - Report UUID
- `user_id` - Foreign key to auth.users
- `search_prompt` - User's search query
- `candidate_count` - Number of candidates found
- `role_parsed` - Extracted job title

---

## Support

For pilot program support:
- **Email**: simon@mafadi.co.za
- **WhatsApp**: +27 72 117 2137
- **GitHub Issues**: For technical bugs only

---

Last updated: 2026-01-29
