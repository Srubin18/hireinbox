-- Add user_feedback column to candidates table for ML training data collection
-- Legal approved: collecting feedback on AI screening quality for model improvement

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS user_feedback TEXT
CHECK (user_feedback IN ('good', 'bad', NULL));

COMMENT ON COLUMN candidates.user_feedback IS 'User feedback on AI screening result quality (for ML training)';

-- Note: status column already exists and supports 'shortlist' and 'archived' values
-- No changes needed to status column
