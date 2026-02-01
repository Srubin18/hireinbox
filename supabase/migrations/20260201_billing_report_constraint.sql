-- ============================================
-- PREVENT DUPLICATE BILLING FOR SAME REPORT
-- Ensures one billing event per saved report
-- ============================================

-- Add unique constraint: one billing event per talent_search report
ALTER TABLE pilot_billing_events
  ADD CONSTRAINT unique_talent_search_report
  UNIQUE (event_type, related_id)
  WHERE event_type = 'talent_search' AND related_id IS NOT NULL;

-- Comment
COMMENT ON CONSTRAINT unique_talent_search_report ON pilot_billing_events
  IS 'Prevents duplicate billing events for the same talent mapping report';
