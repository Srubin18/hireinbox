-- ============================================
-- SIMPLE PROFILES TABLE WITH PILOT ROLE
-- Just what you need, nothing more
-- ============================================

-- Create minimal profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  pilot_role TEXT CHECK (pilot_role IN ('admin', 'pilot_user', 'influencer')) DEFAULT 'pilot_user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pilot_role ON profiles(pilot_role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except pilot_role - only admins should change that)
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pilot_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'pilot_role', 'pilot_user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO profiles (id, email, pilot_role)
SELECT
  id,
  email,
  'pilot_user' -- Default all existing users to pilot_user
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- View that filters billing events to exclude influencers
CREATE OR REPLACE VIEW billable_pilot_events AS
SELECT
  pbe.*,
  p.email,
  p.pilot_role
FROM pilot_billing_events pbe
JOIN profiles p ON pbe.user_id = p.id
WHERE p.pilot_role IN ('admin', 'pilot_user')
  OR p.pilot_role IS NULL;

COMMENT ON TABLE profiles IS 'User profiles with pilot role tracking';
COMMENT ON VIEW billable_pilot_events IS 'Billing events excluding influencers';
