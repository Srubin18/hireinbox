-- ============================================
-- HIREINBOX REFERENCE CHECK SCHEMA
-- Extract refs from CV, send questions, receive responses
-- ============================================

-- References extracted from CVs
CREATE TABLE IF NOT EXISTS candidate_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT, -- "Manager at ABC Corp", "Supervisor at XYZ"
  company TEXT,
  extracted_from TEXT DEFAULT 'cv', -- cv, manual, linkedin
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reference check requests
CREATE TABLE IF NOT EXISTS reference_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID REFERENCES candidate_references(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  requested_by UUID, -- employer user
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL, -- secure token for email link
  questions JSONB NOT NULL DEFAULT '[]', -- array of questions
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reference responses
CREATE TABLE IF NOT EXISTS reference_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES reference_requests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- {question: answer} pairs
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  would_rehire BOOLEAN,
  additional_comments TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Default reference questions
CREATE TABLE IF NOT EXISTS reference_question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  role_type TEXT, -- null = all roles, or specific like "developer", "manager"
  questions JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_references_candidate ON candidate_references(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_status ON reference_requests(status, candidate_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_token ON reference_requests(token);
CREATE INDEX IF NOT EXISTS idx_reference_responses_request ON reference_responses(request_id);

-- Insert default questions
INSERT INTO reference_question_templates (id, questions, is_default) VALUES
(gen_random_uuid(), '[
  {"id": "q1", "text": "How long did you work with this person?", "type": "text"},
  {"id": "q2", "text": "What was their role and your relationship to them?", "type": "text"},
  {"id": "q3", "text": "What would you say are their key strengths?", "type": "text"},
  {"id": "q4", "text": "What areas could they improve on?", "type": "text"},
  {"id": "q5", "text": "How would you rate their overall performance? (1-5)", "type": "rating"},
  {"id": "q6", "text": "Would you work with them again?", "type": "boolean"},
  {"id": "q7", "text": "Is there anything else you would like to add?", "type": "text"}
]', true)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE candidate_references IS 'References extracted from CVs or added manually';
COMMENT ON TABLE reference_requests IS 'Outbound reference check requests sent to referees';
COMMENT ON TABLE reference_responses IS 'Responses received from referees';
