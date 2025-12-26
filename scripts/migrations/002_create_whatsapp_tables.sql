-- ============================================
-- HireInbox WhatsApp Integration Tables
-- Migration: 002_create_whatsapp_tables.sql
-- Date: 2024-12-26
--
-- This migration creates tables for:
-- - WhatsApp conversations (tracking screening flow)
-- - WhatsApp notifications (outbound messages to recruiters)
-- - WhatsApp opt-outs (POPIA compliance)
-- - WhatsApp CV cache (temporary storage for processing)
-- ============================================

-- ============================================
-- 1. WhatsApp Conversations
-- Tracks the state of each candidate's WhatsApp conversation
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Phone in E.164 format: +27821234567
    candidate_phone VARCHAR(20) NOT NULL UNIQUE,

    -- Conversation stage
    stage VARCHAR(50) NOT NULL DEFAULT 'initial'
        CHECK (stage IN ('initial', 'collecting_cv', 'knockout_questions', 'complete', 'opted_out')),

    -- Links to role and candidate once created
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,

    -- Knockout question responses stored as JSONB
    -- Example: {"location": "Cape Town", "experience_years": "5", "availability": "Immediately"}
    responses JSONB DEFAULT '{}',

    -- CV tracking
    cv_received BOOLEAN DEFAULT false,
    cv_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick phone lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone
    ON whatsapp_conversations(candidate_phone);

-- Index for finding incomplete conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_stage
    ON whatsapp_conversations(stage);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_whatsapp_conversation_updated
    BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_conversation_timestamp();

-- ============================================
-- 2. WhatsApp Notifications (Outbound)
-- Logs all notifications sent to recruiters
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Recipient in E.164 format
    recipient_phone VARCHAR(20) NOT NULL,

    -- Notification type
    notification_type VARCHAR(50) NOT NULL
        CHECK (notification_type IN ('new_cv', 'shortlist_summary', 'daily_digest', 'custom')),

    -- Twilio message SID for tracking
    message_id VARCHAR(100),

    -- Company that triggered this notification
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

    -- Notification payload
    data JSONB,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'sent'
        CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
    error_message TEXT,

    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- Index for finding notifications by company
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_company
    ON whatsapp_notifications(company_id);

-- Index for finding notifications by phone
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_phone
    ON whatsapp_notifications(recipient_phone);

-- Index for analytics by type and date
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_type_date
    ON whatsapp_notifications(notification_type, sent_at);

-- ============================================
-- 3. WhatsApp Opt-Outs (POPIA Compliance)
-- Critical for legal compliance
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_optouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Phone in E.164 format
    phone VARCHAR(20) NOT NULL UNIQUE,

    -- When they opted out
    opted_out_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optional: reason provided
    reason TEXT
);

-- Fast lookup for opt-out checks
CREATE INDEX IF NOT EXISTS idx_whatsapp_optouts_phone
    ON whatsapp_optouts(phone);

-- ============================================
-- 4. WhatsApp CV Cache
-- Temporary storage for CV text during screening flow
-- Should be cleaned up after processing
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_cv_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Phone in E.164 format
    phone VARCHAR(20) NOT NULL UNIQUE,

    -- Extracted CV text (can be large)
    cv_text TEXT NOT NULL,

    -- When CV was received
    received_at TIMESTAMPTZ DEFAULT NOW(),

    -- Auto-expire after 24 hours (cleanup job can use this)
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_whatsapp_cv_cache_expires
    ON whatsapp_cv_cache(expires_at);

-- ============================================
-- 5. Add whatsapp_number to candidates table
-- ============================================

-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'candidates' AND column_name = 'whatsapp_number'
    ) THEN
        ALTER TABLE candidates ADD COLUMN whatsapp_number VARCHAR(20);
    END IF;
END $$;

-- Add source column if not exists (to track where candidate came from)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'candidates' AND column_name = 'source'
    ) THEN
        ALTER TABLE candidates ADD COLUMN source VARCHAR(50) DEFAULT 'email';
    END IF;
END $$;

-- Add knockout_responses column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'candidates' AND column_name = 'knockout_responses'
    ) THEN
        ALTER TABLE candidates ADD COLUMN knockout_responses JSONB;
    END IF;
END $$;

-- Index for finding candidates by WhatsApp
CREATE INDEX IF NOT EXISTS idx_candidates_whatsapp
    ON candidates(whatsapp_number);

-- Index for finding candidates by source
CREATE INDEX IF NOT EXISTS idx_candidates_source
    ON candidates(source);

-- ============================================
-- 6. Add recruiter_whatsapp to companies table
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'recruiter_whatsapp'
    ) THEN
        ALTER TABLE companies ADD COLUMN recruiter_whatsapp VARCHAR(20);
    END IF;
END $$;

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on WhatsApp tables
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_optouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cv_cache ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access to whatsapp_conversations"
    ON whatsapp_conversations FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to whatsapp_notifications"
    ON whatsapp_notifications FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to whatsapp_optouts"
    ON whatsapp_optouts FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to whatsapp_cv_cache"
    ON whatsapp_cv_cache FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 8. Comments for documentation
-- ============================================

COMMENT ON TABLE whatsapp_conversations IS 'Tracks WhatsApp screening conversations with candidates';
COMMENT ON TABLE whatsapp_notifications IS 'Logs outbound WhatsApp notifications to recruiters';
COMMENT ON TABLE whatsapp_optouts IS 'POPIA compliance: tracks users who opted out of WhatsApp';
COMMENT ON TABLE whatsapp_cv_cache IS 'Temporary storage for CV text during WhatsApp screening';

COMMENT ON COLUMN whatsapp_conversations.stage IS 'Conversation flow: initial -> collecting_cv -> knockout_questions -> complete';
COMMENT ON COLUMN whatsapp_conversations.responses IS 'JSONB storage for knockout question answers';
COMMENT ON COLUMN whatsapp_notifications.message_id IS 'Twilio message SID for delivery tracking';
COMMENT ON COLUMN candidates.whatsapp_number IS 'WhatsApp number in E.164 format (+27xxx)';
COMMENT ON COLUMN candidates.source IS 'How candidate applied: email, whatsapp, upload, etc.';
COMMENT ON COLUMN candidates.knockout_responses IS 'Answers to knockout questions (WhatsApp flow)';

-- ============================================
-- Done!
-- ============================================

-- Grant permissions (if needed)
-- GRANT ALL ON whatsapp_conversations TO authenticated;
-- GRANT ALL ON whatsapp_notifications TO authenticated;
-- etc.
