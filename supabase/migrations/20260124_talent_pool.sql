-- ============================================
-- HIREINBOX TALENT POOL SCHEMA
-- Simple, signal-rich, transparent
-- ============================================

-- Talent Pool Profiles (extends candidates table)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS talent_pool_opted_in BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS talent_pool_opted_in_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'hidden' CHECK (visibility_level IN ('hidden', 'anonymized', 'visible'));
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS candidate_intent TEXT DEFAULT 'open' CHECK (candidate_intent IN ('actively_looking', 'open', 'not_looking'));
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS intent_timeframe TEXT; -- "immediately", "1-2 weeks", "1 month", etc.
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'; -- Extracted skills array
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_highlights JSONB DEFAULT '[]'; -- Key achievements
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0; -- 0-100 score
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_video_intro BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_ai_interview BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_industries TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_expectation_min INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_expectation_max INTEGER;

-- Talent Pool Matches (when AI matches candidates to roles)
CREATE TABLE IF NOT EXISTS talent_pool_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  match_reasons JSONB NOT NULL DEFAULT '[]', -- Array of {reason, source, evidence}
  created_at TIMESTAMP DEFAULT NOW(),
  viewed_by_employer BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP,
  employer_action TEXT CHECK (employer_action IN ('interested', 'not_interested', 'contacted', 'hired')),
  employer_action_at TIMESTAMP,
  UNIQUE(candidate_id, role_id)
);

-- Employer saved candidates (bookmarks)
CREATE TABLE IF NOT EXISTS employer_saved_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  notes TEXT,
  saved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id, role_id)
);

-- Candidate pool connections (when employer requests to connect)
CREATE TABLE IF NOT EXISTS talent_pool_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  employer_message TEXT,
  candidate_response TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_talent_pool ON candidates(talent_pool_opted_in, visibility_level) WHERE talent_pool_opted_in = TRUE;
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_talent_pool_matches_role ON talent_pool_matches(role_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_talent_pool_matches_candidate ON talent_pool_matches(candidate_id);

-- Comments for documentation
COMMENT ON COLUMN candidates.visibility_level IS 'hidden=not searchable, anonymized=skills visible but name hidden, visible=full profile';
COMMENT ON COLUMN candidates.confidence_level IS 'high=CV+video+interview, medium=CV+one signal, low=CV only';
COMMENT ON TABLE talent_pool_matches IS 'AI-generated matches between candidates and roles with evidence';
