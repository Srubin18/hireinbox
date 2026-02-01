-- Create talent_mapping_candidates table for individual candidate tracking
-- Stores feedback and status for ML training data collection
-- Legal approved: public data only (no PII, no emails)

CREATE TABLE IF NOT EXISTS public.talent_mapping_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES talent_mapping_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Candidate data (no PII - public data only per legal approval)
  name TEXT NOT NULL,
  current_role TEXT,
  company TEXT,
  location TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  discovery_method TEXT,

  -- Full candidate data from API (JSONB for flexibility)
  candidate_data JSONB NOT NULL,

  -- Status management (shortlist/archive)
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'shortlist', 'archived')),

  -- Feedback for ML training
  user_feedback TEXT
    CHECK (user_feedback IN ('good', 'bad', NULL)),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint (can't duplicate same candidate from same report)
  UNIQUE(report_id, name, company)
);

-- Indexes for performance
CREATE INDEX idx_tm_candidates_report ON talent_mapping_candidates(report_id);
CREATE INDEX idx_tm_candidates_user ON talent_mapping_candidates(user_id);
CREATE INDEX idx_tm_candidates_status ON talent_mapping_candidates(status);
CREATE INDEX idx_tm_candidates_feedback ON talent_mapping_candidates(user_feedback);
CREATE INDEX idx_tm_candidates_match_score ON talent_mapping_candidates(match_score DESC);

-- RLS Policies
ALTER TABLE talent_mapping_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own talent mapping candidates"
  ON talent_mapping_candidates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own talent mapping candidates"
  ON talent_mapping_candidates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own talent mapping candidates"
  ON talent_mapping_candidates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own talent mapping candidates"
  ON talent_mapping_candidates FOR DELETE
  USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE talent_mapping_candidates IS 'Individual candidates from talent mapping searches - stored for feedback and ML training';
COMMENT ON COLUMN talent_mapping_candidates.candidate_data IS 'Full JSON from talent mapping API (availability signals, propensity, hooks, etc)';
COMMENT ON COLUMN talent_mapping_candidates.status IS 'active=just created, shortlist=user interested, archived=user not interested';
COMMENT ON COLUMN talent_mapping_candidates.user_feedback IS 'good=quality match, bad=poor match (trains AI models)';
