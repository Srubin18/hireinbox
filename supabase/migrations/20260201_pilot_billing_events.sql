-- ============================================
-- PILOT BILLING EVENTS TABLE
-- Track billable usage for pilot users
-- ============================================

CREATE TABLE IF NOT EXISTS pilot_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN ('talent_search', 'role_created')),

  -- Event metadata
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_month TEXT NOT NULL, -- YYYY-MM format for easy grouping

  -- Related IDs (optional, for linking back to actual records)
  related_id UUID, -- report_id for talent_search, role_id for role_created

  -- Additional context (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for fast queries
  CONSTRAINT event_date_matches_month CHECK (
    event_month = to_char(event_date, 'YYYY-MM')
  )
);

-- Indexes for fast lookups
CREATE INDEX idx_pilot_billing_user_month ON pilot_billing_events(user_id, event_month);
CREATE INDEX idx_pilot_billing_event_type ON pilot_billing_events(event_type);
CREATE INDEX idx_pilot_billing_created_at ON pilot_billing_events(created_at DESC);

-- RLS Policies
ALTER TABLE pilot_billing_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own billing events
CREATE POLICY "Users can view own billing events"
  ON pilot_billing_events FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert billing events (done via API)
CREATE POLICY "Service role can insert billing events"
  ON pilot_billing_events FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE pilot_billing_events IS 'Tracks billable events for pilot users: talent searches run and roles created';
