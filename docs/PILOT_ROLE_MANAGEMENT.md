# Pilot Role Management Guide

## How to Assign Roles to New Users

### Option 1: Admin Panel (Recommended ⭐)

**When to use:** After a user signs up, quickly change their role via UI

**Steps:**
1. New user signs up → Automatically becomes `pilot_user` (default)
2. Log in as admin (djchernick@gmail.com or simon@mafadi.co.za)
3. Click **"Admin"** in the navigation (only visible to admins)
4. Find the user in the list
5. Use the dropdown to change their role:
   - **Admin** - Full access, billable, can manage users
   - **Pilot User** - Standard access, billable
   - **Influencer** - Full access, non-billable, gets purple badge

**URL:** `/pilot/admin/users`

---

### Option 2: SQL Query (Quick)

**When to use:** When you need to assign roles immediately or in bulk

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Make someone an influencer
UPDATE profiles
SET pilot_role = 'influencer'
WHERE email = 'newuser@example.com';

-- Make someone an admin
UPDATE profiles
SET pilot_role = 'admin'
WHERE email = 'newuser@example.com';

-- Verify
SELECT email, pilot_role FROM profiles WHERE email = 'newuser@example.com';
```

---

### Option 3: Set Role During Signup (Advanced)

**When to use:** If you're programmatically creating users

**In your signup code:**
```javascript
const { error } = await supabase.auth.signUp({
  email: 'newuser@example.com',
  password: 'password',
  options: {
    data: {
      pilot_role: 'influencer' // or 'admin' or 'pilot_user'
    }
  }
});
```

---

## Role Descriptions

| Role | Billable | Features | Badge |
|------|----------|----------|-------|
| **Admin** | ❌ No | Full access + user management | Orange "Admin" badge |
| **Pilot User** | ✅ Yes | Full access | None |
| **Influencer** | ❌ No | Full access | Purple "Influencer" badge |

---

## Current User Roles

- **djchernick@gmail.com** - influencer (for testing)
- **simon@mafadi.co.za** - admin
- **nina@hntr.co.za** - influencer
- **jann@jbrecruit.co.za** - pilot_user

---

## Billing Exclusion

Influencers are automatically excluded from billing:
- Their usage is tracked for analytics
- But they don't appear in billable events
- Usage page shows "You will not be billed" message
- The `billable_pilot_events` view filters them out

---

## Quick Reference SQL

```sql
-- List all users with roles
SELECT email, pilot_role, created_at
FROM profiles
ORDER BY pilot_role, email;

-- Count by role
SELECT pilot_role, COUNT(*)
FROM profiles
GROUP BY pilot_role;

-- Find all influencers
SELECT email FROM profiles WHERE pilot_role = 'influencer';
```
