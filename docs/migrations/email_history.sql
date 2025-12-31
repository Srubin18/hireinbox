-- Email History Table
-- Tracks all emails sent to candidates for audit trail and communication history
-- Run this in Supabase SQL Editor

-- Create email_history table
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  message_id VARCHAR(255),
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by candidate
CREATE INDEX IF NOT EXISTS idx_email_history_candidate_id ON email_history(candidate_id);

-- Create index for lookups by sent_at (for recent emails)
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at DESC);

-- Create index for email type filtering
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);

-- Enable Row Level Security
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their company's email history
CREATE POLICY "Users can view their company's email history" ON email_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = email_history.candidate_id
      AND c.company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow authenticated users to insert email history for their company's candidates
CREATE POLICY "Users can insert email history for their candidates" ON email_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = email_history.candidate_id
      AND c.company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow service role full access (for API routes)
CREATE POLICY "Service role has full access" ON email_history
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: Create booking_links table if it doesn't exist
-- This stores interview booking links sent to candidates
CREATE TABLE IF NOT EXISTS booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  selected_slot_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for token lookups (booking page)
CREATE INDEX IF NOT EXISTS idx_booking_links_token ON booking_links(token);

-- Create index for candidate lookups
CREATE INDEX IF NOT EXISTS idx_booking_links_candidate_id ON booking_links(candidate_id);

-- Enable RLS on booking_links
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;

-- Policy for booking_links
CREATE POLICY "Anyone can view booking link by token" ON booking_links
  FOR SELECT
  USING (true);  -- Public access needed for booking page

CREATE POLICY "Service role can manage booking links" ON booking_links
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE email_history IS 'Tracks all emails sent to candidates for audit trail and POPIA compliance';
COMMENT ON COLUMN email_history.email_type IS 'Type of email: acknowledgment, shortlist, rejection, talent_pool, interview_invite, custom';
COMMENT ON COLUMN email_history.metadata IS 'Additional context: role_title, company_name, custom_message, etc.';
COMMENT ON TABLE booking_links IS 'Interview booking links sent to candidates via email';
