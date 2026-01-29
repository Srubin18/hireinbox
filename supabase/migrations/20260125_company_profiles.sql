-- ============================================
-- HIREINBOX COMPANY PROFILES EXTENSION
-- Add fields for public company profiles
-- ============================================

-- Extend businesses table with profile fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS founded TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS culture TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add employment_type and salary fields to roles if not exists
ALTER TABLE roles ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'));
ALTER TABLE roles ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_salary_visible BOOLEAN DEFAULT TRUE;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE is_active = TRUE;

-- Comments
COMMENT ON COLUMN businesses.benefits IS 'JSON array of benefit strings';
COMMENT ON COLUMN businesses.social_links IS 'JSON object with keys: linkedin, twitter, facebook, instagram';
COMMENT ON COLUMN businesses.verified IS 'Whether the company has been verified by HireInbox';
