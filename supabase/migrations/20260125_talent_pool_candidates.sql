-- ============================================
-- HIREINBOX TALENT POOL DIRECT CANDIDATES
-- For candidates who join the talent pool directly (not through CV screening)
-- ============================================

-- Talent Pool Candidates (direct signups)
CREATE TABLE IF NOT EXISTS talent_pool_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  location TEXT,

  -- Professional info
  job_title TEXT,
  years_experience TEXT, -- "0-1", "2-5", "5-10", "10+"
  open_to_remote BOOLEAN DEFAULT TRUE,
  available_from TEXT DEFAULT 'immediately', -- "immediately", "2-weeks", "1-month", "2-months", "not-looking"
  salary_expectation TEXT,
  linkedin_url TEXT,

  -- CV storage
  cv_file_name TEXT,
  cv_file_url TEXT,
  cv_file_size INTEGER,

  -- AI analysis (populated after processing)
  skills JSONB DEFAULT '[]',
  experience_highlights JSONB DEFAULT '[]',
  cv_summary TEXT,
  ai_score INTEGER CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100)),

  -- Talent pool settings
  visibility_level TEXT DEFAULT 'visible' CHECK (visibility_level IN ('hidden', 'anonymized', 'visible')),
  intent TEXT DEFAULT 'actively_looking' CHECK (intent IN ('actively_looking', 'open', 'not_looking')),
  profile_completeness INTEGER DEFAULT 20 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),

  -- Signals
  has_video BOOLEAN DEFAULT FALSE,
  has_ai_interview BOOLEAN DEFAULT FALSE,
  wants_free_scan BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_email ON talent_pool_candidates(email);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_intent ON talent_pool_candidates(intent, visibility_level);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_skills ON talent_pool_candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_location ON talent_pool_candidates(location);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_job_title ON talent_pool_candidates(job_title);

-- Enable Row Level Security
ALTER TABLE talent_pool_candidates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all reads for authenticated users (employers browsing)
CREATE POLICY IF NOT EXISTS "Talent pool candidates are readable by authenticated users"
  ON talent_pool_candidates FOR SELECT
  USING (visibility_level != 'hidden');

-- Policy: Allow inserts for new signups (public can join)
CREATE POLICY IF NOT EXISTS "Anyone can join talent pool"
  ON talent_pool_candidates FOR INSERT
  WITH CHECK (true);

-- Policy: Candidates can update their own profiles
CREATE POLICY IF NOT EXISTS "Candidates can update own profile"
  ON talent_pool_candidates FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Comments for documentation
COMMENT ON TABLE talent_pool_candidates IS 'Candidates who joined the talent pool directly (not through CV screening)';
COMMENT ON COLUMN talent_pool_candidates.visibility_level IS 'hidden=not searchable, anonymized=skills visible but name hidden, visible=full profile';
COMMENT ON COLUMN talent_pool_candidates.intent IS 'actively_looking=job hunting, open=considering offers, not_looking=passive';
