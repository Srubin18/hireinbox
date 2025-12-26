-- Migration: Add Candidate Feedback Portal columns
-- Run this in Supabase SQL Editor
-- Created: 2024-12-26
-- Purpose: Enable candidate feedback portal feature

-- ============================================
-- ADD FEEDBACK COLUMNS TO CANDIDATES TABLE
-- ============================================

-- feedback_token: Unique, unguessable token for public feedback link
-- This is NOT the candidate ID - it's a secure token that can't be enumerated
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS feedback_token VARCHAR(64) UNIQUE;

-- feedback_viewed_at: Timestamp when candidate first viewed their feedback
-- Useful for analytics and audit trail
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS feedback_viewed_at TIMESTAMP WITH TIME ZONE;

-- feedback_sent_at: Timestamp when feedback email was sent to candidate
-- Prevents duplicate emails
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS feedback_sent_at TIMESTAMP WITH TIME ZONE;

-- review_requested_at: Timestamp when candidate requested human review
-- Used to flag candidates for manual review
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMP WITH TIME ZONE;

-- review_request_message: The message candidate wrote when requesting review
-- Limited to 2000 chars in API
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS review_request_message TEXT;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on feedback_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_candidates_feedback_token
ON candidates(feedback_token)
WHERE feedback_token IS NOT NULL;

-- Index on review_requested_at to find candidates needing review
CREATE INDEX IF NOT EXISTS idx_candidates_review_requested
ON candidates(review_requested_at)
WHERE review_requested_at IS NOT NULL;

-- ============================================
-- ADD NEW STATUS VALUE (optional)
-- ============================================

-- If you're using an enum for status, you may need to add 'review_requested'
-- Run this if status is an enum type:
-- ALTER TYPE candidate_status ADD VALUE IF NOT EXISTS 'review_requested';

-- ============================================
-- ENABLE RLS POLICIES (if needed)
-- ============================================

-- The feedback API uses service role key, so RLS doesn't apply
-- But if you want to enable RLS for the public feedback page:

-- Allow reading feedback by token (public access)
-- CREATE POLICY "Allow read by feedback token" ON candidates
--   FOR SELECT
--   USING (feedback_token IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify columns were added:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidates'
AND column_name IN (
  'feedback_token',
  'feedback_viewed_at',
  'feedback_sent_at',
  'review_requested_at',
  'review_request_message'
);

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To remove these columns:
-- ALTER TABLE candidates DROP COLUMN IF EXISTS feedback_token;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS feedback_viewed_at;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS feedback_sent_at;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS review_requested_at;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS review_request_message;
-- DROP INDEX IF EXISTS idx_candidates_feedback_token;
-- DROP INDEX IF EXISTS idx_candidates_review_requested;
