-- ============================================
-- HIREINBOX - Automation Columns Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add auto-progression settings to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS auto_progression_enabled BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS auto_shortlist_threshold INTEGER DEFAULT 80;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS auto_reject_threshold INTEGER DEFAULT 60;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS interview_instructions TEXT;

-- Add hiring_pass column to candidates if not exists
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hiring_pass INTEGER DEFAULT 0;

-- Create email queue table for reliable email delivery
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  candidate_id UUID REFERENCES candidates(id),
  role_id UUID REFERENCES roles(id),
  email_type TEXT,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_candidate ON email_queue(candidate_id);

-- Add RLS policies for email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role can manage email_queue"
  ON email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE email_queue IS 'Queue for automated candidate emails (acknowledgment, shortlist, rejection)';
COMMENT ON COLUMN roles.auto_progression_enabled IS 'When true, candidates auto-progress based on AI score';
COMMENT ON COLUMN roles.auto_shortlist_threshold IS 'AI score >= this value triggers auto-shortlist (default 80)';
COMMENT ON COLUMN roles.auto_reject_threshold IS 'AI score < this value triggers auto-rejection email (default 60)';
COMMENT ON COLUMN candidates.hiring_pass IS 'Current stage: 0=New, 1=Screened, 2=Shortlisted, 3=Interviewed, 4=Offer, 5=Hired, 6=Withdrawn, 7=Not Successful';

-- Add calendar/booking columns to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS calendly_link TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS interview_duration_minutes INTEGER DEFAULT 30;

-- Add interview time to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_time TIMESTAMPTZ;

-- Create interview slots table for built-in scheduling
CREATE TABLE IF NOT EXISTS interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  booked_by UUID REFERENCES candidates(id),
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for interview_slots
CREATE INDEX IF NOT EXISTS idx_interview_slots_role ON interview_slots(role_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_time ON interview_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_interview_slots_available ON interview_slots(role_id, start_time) WHERE booked_by IS NULL;

-- RLS for interview_slots
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can manage interview_slots"
  ON interview_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE interview_slots IS 'Available interview time slots for scheduling';
COMMENT ON COLUMN roles.calendly_link IS 'If set, candidates book via Calendly instead of built-in slots';
COMMENT ON COLUMN roles.interview_duration_minutes IS 'Default interview duration in minutes';
