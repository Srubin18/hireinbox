-- ============================================
-- HIREINBOX MULTI-TENANT SCHEMA
-- Supports hundreds of businesses, thousands of candidates
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('employer', 'candidate', 'recruiter', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Businesses (employers)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- acme-corp, for URLs and email subdomain
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  location TEXT,
  website TEXT,
  logo_url TEXT,

  -- HireInbox config
  inbox_email TEXT, -- acme@hireinbox.co.za
  screening_enabled BOOLEAN DEFAULT TRUE,
  auto_acknowledge BOOLEAN DEFAULT TRUE,

  -- Billing
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  billing_email TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Business members (who can access the business)
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(business_id, user_id)
);

-- Roles belong to a business
ALTER TABLE roles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Candidates belong to a user profile (optional - can be anonymous)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view and update their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Businesses: Members can view their businesses
CREATE POLICY businesses_select ON businesses FOR SELECT USING (
  id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE)
);

-- Business members can only be managed by admins/owners
CREATE POLICY business_members_select ON business_members FOR SELECT USING (
  user_id = auth.uid() OR
  business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = TRUE
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_roles_business ON roles(business_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user ON candidates(user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comments
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE businesses IS 'Employer/business accounts';
COMMENT ON TABLE business_members IS 'Team members who can access a business';
