-- ============================================
-- FIX RLS POLICIES - Remove circular reference
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_admin_update ON profiles;

-- Allow users to view their own profile + admins to view all (no EXISTS subquery)
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);

-- Allow users to update their own profile + admins to update all
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Add policy for admins to update any profile
CREATE POLICY profiles_admin_update ON profiles FOR UPDATE TO authenticated
USING (
  (SELECT pilot_role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT pilot_role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMENT ON POLICY profiles_select ON profiles IS 'All authenticated users can read profiles';
COMMENT ON POLICY profiles_update ON profiles IS 'Users can update their own profile';
COMMENT ON POLICY profiles_admin_update ON profiles IS 'Admins can update any profile';
