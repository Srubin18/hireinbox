-- ============================================
-- HireInbox Interview Scheduling Tables
-- Migration: 004_interview_scheduling.sql
-- Created: December 2024
--
-- This migration adds tables for:
-- 1. Recruiter availability settings
-- 2. Interview slots
-- 3. Scheduled interviews
-- 4. Booking links for candidate self-scheduling
-- 5. Auto-schedule configuration on roles
-- ============================================

-- ============================================
-- 1. RECRUITER AVAILABILITY SETTINGS
-- Stores each recruiter's interview availability
-- ============================================

CREATE TABLE IF NOT EXISTS recruiter_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id TEXT NOT NULL UNIQUE,
  recruiter_email TEXT NOT NULL,
  recruiter_name TEXT,
  calendar_id TEXT DEFAULT 'primary',

  -- Availability windows stored as JSONB array
  -- Format: [{ dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 }]
  availability_windows JSONB DEFAULT '[
    {"dayOfWeek": 1, "startHour": 9, "startMinute": 0, "endHour": 17, "endMinute": 0},
    {"dayOfWeek": 2, "startHour": 9, "startMinute": 0, "endHour": 17, "endMinute": 0},
    {"dayOfWeek": 3, "startHour": 9, "startMinute": 0, "endHour": 17, "endMinute": 0},
    {"dayOfWeek": 4, "startHour": 9, "startMinute": 0, "endHour": 17, "endMinute": 0},
    {"dayOfWeek": 5, "startHour": 9, "startMinute": 0, "endHour": 17, "endMinute": 0}
  ]'::jsonb,

  interview_duration INTEGER DEFAULT 30,     -- minutes
  buffer_between INTEGER DEFAULT 15,         -- minutes between interviews
  max_per_day INTEGER DEFAULT 8,             -- max interviews per day
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  auto_create_meet BOOLEAN DEFAULT true,

  -- Google Calendar OAuth tokens (encrypted in production)
  calendar_connected BOOLEAN DEFAULT false,
  calendar_tokens JSONB,                     -- { access_token, refresh_token, expiry_date }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by recruiter
CREATE INDEX IF NOT EXISTS idx_recruiter_availability_recruiter_id
  ON recruiter_availability(recruiter_id);

-- ============================================
-- 2. INTERVIEW SLOTS
-- Individual bookable time slots
-- ============================================

CREATE TABLE IF NOT EXISTS interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  recruiter_id TEXT NOT NULL,
  recruiter_name TEXT,
  recruiter_email TEXT,

  -- Time slot details
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 30,               -- minutes

  -- Location
  location_type TEXT DEFAULT 'video' CHECK (location_type IN ('video', 'phone', 'in-person')),
  meeting_link TEXT,                         -- Google Meet / Zoom link
  address TEXT,                              -- For in-person interviews

  -- Booking status
  is_booked BOOLEAN DEFAULT false,
  booked_by_candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ,

  -- Calendar integration
  calendar_event_id TEXT,                    -- Google Calendar event ID

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_interview_slots_role_id ON interview_slots(role_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_recruiter_id ON interview_slots(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_start_time ON interview_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_interview_slots_is_booked ON interview_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_interview_slots_available
  ON interview_slots(role_id, is_booked, start_time)
  WHERE is_booked = false;

-- ============================================
-- 3. SCHEDULED INTERVIEWS
-- Tracks all scheduled/pending interviews
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Link to slot if booked
  slot_id UUID REFERENCES interview_slots(id) ON DELETE SET NULL,

  -- Booking link for self-scheduling
  booking_token TEXT,
  booking_link TEXT,

  -- Status
  status TEXT DEFAULT 'pending_booking' CHECK (status IN (
    'pending_booking',   -- Booking link sent, waiting for candidate
    'booked',            -- Slot selected and confirmed
    'completed',         -- Interview happened
    'cancelled',         -- Cancelled by either party
    'no_show',           -- Candidate didn't show up
    'rescheduled'        -- Moved to a different slot
  )),

  -- Calendar integration
  calendar_event_id TEXT,
  meeting_link TEXT,

  -- Timing
  scheduled_at TIMESTAMPTZ,                  -- When the interview is scheduled for
  reminder_sent_at TIMESTAMPTZ,              -- When reminder email was sent

  -- Notes
  notes TEXT,
  interviewer_notes TEXT,                    -- Notes from the interview

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_candidate_id
  ON scheduled_interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_role_id
  ON scheduled_interviews(role_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status
  ON scheduled_interviews(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_scheduled_at
  ON scheduled_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_booking_token
  ON scheduled_interviews(booking_token);

-- ============================================
-- 4. BOOKING LINKS
-- One-time links for candidate self-scheduling
-- ============================================

CREATE TABLE IF NOT EXISTS booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Unique token for URL
  token TEXT NOT NULL UNIQUE,

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage tracking
  used_at TIMESTAMPTZ,
  selected_slot_id UUID REFERENCES interview_slots(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_links_token ON booking_links(token);
CREATE INDEX IF NOT EXISTS idx_booking_links_candidate_id ON booking_links(candidate_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_expires_at ON booking_links(expires_at);

-- ============================================
-- 5. ADD AUTO-SCHEDULE CONFIG TO ROLES
-- Stores auto-scheduling rules per role
-- ============================================

-- Add auto_schedule_config column to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS auto_schedule_config JSONB DEFAULT NULL;

-- Comment explaining the structure
COMMENT ON COLUMN roles.auto_schedule_config IS 'Auto-scheduling configuration. Format:
{
  "enabled": boolean,
  "min_score_to_schedule": number (0-100),
  "max_candidates_per_batch": number,
  "interview_duration": number (minutes),
  "interview_type": "video" | "phone" | "in-person",
  "interview_address": string (optional),
  "auto_create_meet": boolean,
  "look_ahead_days": number,
  "send_invite_email": boolean,
  "auto_book_first_slot": boolean
}';

-- Add knockout_rules column to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS knockout_rules JSONB DEFAULT '[]'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN roles.knockout_rules IS 'Knockout rules that auto-reject candidates. Format:
[
  {
    "id": string,
    "field": "years_experience" | "education_level" | "required_skill" | "location" | "qualification",
    "operator": "equals" | "contains" | "gte" | "lte" | "exists",
    "value": string | number | boolean,
    "label": string,
    "is_knockout": boolean
  }
]';

-- ============================================
-- 6. ADD INTERVIEW STATUS TO CANDIDATES
-- Track interview scheduling status
-- ============================================

-- Add new status values to candidates if using enum
-- If status is TEXT, we just use the new values directly:
-- 'interview_invited', 'interview_scheduled', 'interviewed'

-- ============================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_recruiter_availability_updated_at
  BEFORE UPDATE ON recruiter_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_slots_updated_at
  BEFORE UPDATE ON interview_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_interviews_updated_at
  BEFORE UPDATE ON scheduled_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE recruiter_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;

-- Policies for recruiter_availability
CREATE POLICY "Users can view their company's recruiter availability"
  ON recruiter_availability FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own availability"
  ON recruiter_availability FOR ALL
  USING (recruiter_id = auth.uid()::text);

-- Policies for interview_slots
CREATE POLICY "Users can view their company's interview slots"
  ON interview_slots FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Recruiters can manage interview slots"
  ON interview_slots FOR ALL
  USING (recruiter_id = auth.uid()::text);

-- Policies for scheduled_interviews
CREATE POLICY "Users can view their company's scheduled interviews"
  ON scheduled_interviews FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

-- Policies for booking_links (candidates can view their own)
CREATE POLICY "Candidates can view their booking links"
  ON booking_links FOR SELECT
  USING (true);  -- Public access for booking (token-based auth)

-- ============================================
-- 9. SAMPLE DATA (FOR DEVELOPMENT)
-- ============================================

-- Uncomment to insert sample data for testing:
/*
INSERT INTO recruiter_availability (
  recruiter_id,
  recruiter_email,
  recruiter_name,
  interview_duration,
  buffer_between,
  max_per_day
) VALUES (
  'recruiter-1',
  'recruiter@hireinbox.co.za',
  'Hiring Manager',
  30,
  15,
  8
);
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
