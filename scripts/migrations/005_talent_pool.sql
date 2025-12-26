-- Talent Pool Migration
-- Allows companies to save rejected candidates for future opportunities

-- Talent Pool Table
CREATE TABLE IF NOT EXISTS talent_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  original_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

  -- Why they're in the pool
  rejection_reason TEXT,
  ai_recommended_roles TEXT[], -- Roles AI thinks they'd be good for
  ai_talent_notes TEXT, -- AI's assessment of their potential

  -- Pool categorization
  talent_category VARCHAR(50), -- 'finance', 'tech', 'sales', 'operations', etc.
  seniority_level VARCHAR(30), -- 'junior', 'mid', 'senior', 'executive'

  -- Sharing settings
  share_with_network BOOLEAN DEFAULT FALSE, -- Allow other HireInbox clients to see
  shared_at TIMESTAMPTZ, -- When sharing was enabled

  -- Engagement tracking
  times_viewed INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  contacted_count INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'hired', 'removed', 'expired'
  notes TEXT, -- HR notes about this candidate

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(company_id, candidate_id)
);

-- Index for fast lookups
CREATE INDEX idx_talent_pool_company ON talent_pool(company_id);
CREATE INDEX idx_talent_pool_category ON talent_pool(talent_category);
CREATE INDEX idx_talent_pool_shared ON talent_pool(share_with_network) WHERE share_with_network = TRUE;
CREATE INDEX idx_talent_pool_status ON talent_pool(status);

-- Company settings for talent pool
ALTER TABLE companies ADD COLUMN IF NOT EXISTS talent_pool_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS share_talent_network BOOLEAN DEFAULT FALSE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_talent_pool_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER talent_pool_updated
  BEFORE UPDATE ON talent_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_pool_timestamp();

-- RLS Policies
ALTER TABLE talent_pool ENABLE ROW LEVEL SECURITY;

-- Companies can only see their own talent pool
CREATE POLICY talent_pool_company_access ON talent_pool
  FOR ALL
  USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Or shared talent from other companies (if enabled)
CREATE POLICY talent_pool_shared_access ON talent_pool
  FOR SELECT
  USING (share_with_network = TRUE);

-- Comments
COMMENT ON TABLE talent_pool IS 'Stores candidates saved for future opportunities';
COMMENT ON COLUMN talent_pool.share_with_network IS 'If true, other HireInbox clients can view this candidate';
COMMENT ON COLUMN talent_pool.ai_recommended_roles IS 'Roles the AI identified as good fits for this candidate';
