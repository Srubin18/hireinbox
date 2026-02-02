-- ============================================
-- BACKFILL BILLING EVENTS FROM EXISTING DATA
-- Migrate historical talent searches and roles
-- ============================================

-- Backfill talent searches from talent_mapping_reports
INSERT INTO pilot_billing_events (user_id, event_type, event_date, event_month, related_id, metadata, created_at)
SELECT
  user_id,
  'talent_search' as event_type,
  created_at::date as event_date,
  to_char(created_at, 'YYYY-MM') as event_month,
  id as related_id,
  jsonb_build_object(
    'search_prompt', SUBSTRING(search_prompt, 1, 200),
    'role', role_parsed,
    'location', location,
    'candidates_found', candidate_count,
    'backfilled', true
  ) as metadata,
  created_at
FROM talent_mapping_reports
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill roles from roles table (where criteria.user_id exists)
INSERT INTO pilot_billing_events (user_id, event_type, event_date, event_month, related_id, metadata, created_at)
SELECT
  (criteria->>'user_id')::uuid as user_id,
  'role_created' as event_type,
  created_at::date as event_date,
  to_char(created_at, 'YYYY-MM') as event_month,
  id as related_id,
  jsonb_build_object(
    'role_title', title,
    'location', (facts->>'location'),
    'seniority', (context->>'seniority'),
    'backfilled', true
  ) as metadata,
  created_at
FROM roles
WHERE criteria ? 'user_id'
  AND (criteria->>'user_id') IS NOT NULL
ON CONFLICT DO NOTHING;

-- Show counts
SELECT
  event_type,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(event_date) as earliest_event,
  MAX(event_date) as latest_event
FROM pilot_billing_events
GROUP BY event_type
ORDER BY event_type;
