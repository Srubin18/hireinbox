-- ============================================
-- ALLOW ADMINS TO VIEW ALL USERS
-- Update RLS policy so admins can see all profiles
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS profiles_select ON profiles;

-- New policy: Users can see their own profile, admins can see all
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  auth.uid() = id  -- Users can see their own profile
  OR
  EXISTS (  -- Admins can see all profiles
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND pilot_role = 'admin'
  )
);

COMMENT ON POLICY profiles_select ON profiles IS 'Users see own profile, admins see all';

-- Drop existing update policy
DROP POLICY IF EXISTS profiles_update ON profiles;

-- New policy: Users can update their own profile (except pilot_role), admins can update all
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (
  auth.uid() = id  -- Users can update their own profile
  OR
  EXISTS (  -- Admins can update any profile
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND pilot_role = 'admin'
  )
);

COMMENT ON POLICY profiles_update ON profiles IS 'Users update own profile, admins update all';
