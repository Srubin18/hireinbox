-- ============================================
-- HIREINBOX - INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ============================================
--
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
--
-- Prerequisites:
-- - Fresh Supabase project
-- - UUID extension enabled (default in Supabase)
--
-- This creates all core tables for HireInbox:
-- - companies, users, roles, candidates
-- - usage, payments
-- - interview_sessions, interview_slots, scheduled_interviews
-- - booking_links, recruiter_availability
-- - email_history, whatsapp tables
-- - talent_pool
--
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    website TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

COMMENT ON TABLE public.companies IS 'B2B customer organizations';
COMMENT ON COLUMN public.companies.size IS 'Company size range: 1-10, 11-50, 51-200, 201-500, 500+';
COMMENT ON COLUMN public.companies.settings IS 'Company-specific configuration (branding, features, etc.)';

-- ============================================
-- 2. USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter', 'viewer', 'candidate')),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    name TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

COMMENT ON TABLE public.users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN public.users.role IS 'User role: admin (full access), recruiter (manage candidates), viewer (read-only), candidate (job seeker)';
COMMENT ON COLUMN public.users.company_id IS 'NULL for B2C users (candidates without company affiliation)';

-- ============================================
-- 3. ROLES TABLE (Job Positions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    context JSONB DEFAULT '{}',
    criteria JSONB DEFAULT '{}',
    facts JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    ai_guidance JSONB DEFAULT '{}',
    auto_schedule_config JSONB,
    imap_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roles_company_id ON public.roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);

COMMENT ON TABLE public.roles IS 'Job positions/roles that candidates apply for';
COMMENT ON COLUMN public.roles.context IS 'Role context: seniority, employment_type, location, remote_option';
COMMENT ON COLUMN public.roles.facts IS 'Required qualifications: min_experience_years, required_skills, qualifications';
COMMENT ON COLUMN public.roles.criteria IS 'Scoring weights for AI screening';
COMMENT ON COLUMN public.roles.ai_guidance IS 'Custom instructions for AI screening';
COMMENT ON COLUMN public.roles.auto_schedule_config IS 'Auto-scheduling settings: enabled, min_score_to_schedule, send_invite_email';
COMMENT ON COLUMN public.roles.imap_config IS 'Email inbox connection settings for CV ingestion';

-- ============================================
-- 4. CANDIDATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cv_text TEXT,
    cv_url TEXT,
    cv_summary TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'unprocessed', 'shortlist', 'consider', 'rejected', 'interviewing', 'hired', 'archived')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_recommendation TEXT CHECK (ai_recommendation IN ('SHORTLIST', 'CONSIDER', 'REJECT')),
    ai_reasoning TEXT,
    screening_result JSONB,
    screened_at TIMESTAMPTZ,
    strengths TEXT[] DEFAULT '{}',
    missing TEXT[] DEFAULT '{}',
    experience_years INTEGER,
    education TEXT,
    interview_feedback JSONB,
    appeal_requested BOOLEAN DEFAULT FALSE,
    appeal_status TEXT CHECK (appeal_status IN ('pending', 'reviewed', 'upheld', 'overturned')),
    appeal_id UUID,
    feedback_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON public.candidates(role_id);
CREATE INDEX IF NOT EXISTS idx_candidates_company_id ON public.candidates(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_feedback_token ON public.candidates(feedback_token);
CREATE INDEX IF NOT EXISTS idx_candidates_ai_score ON public.candidates(ai_score DESC);

COMMENT ON TABLE public.candidates IS 'Job applicants and their screening results';
COMMENT ON COLUMN public.candidates.status IS 'Application status: new, unprocessed (parse failed), shortlist (80+), consider (60-79), rejected (<60), interviewing, hired, archived';
COMMENT ON COLUMN public.candidates.screening_result IS 'Complete AI screening output JSON';
COMMENT ON COLUMN public.candidates.strengths IS 'Array of identified strengths with evidence quotes';
COMMENT ON COLUMN public.candidates.missing IS 'Array of missing requirements';
COMMENT ON COLUMN public.candidates.feedback_token IS 'Token for candidate to access their feedback page';

-- ============================================
-- 5. APPEALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.appeals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Unknown Role',
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'upheld', 'overturned')),
    ai_score INTEGER,
    ai_recommendation TEXT,
    ai_decision_data JSONB,
    reviewer_name TEXT,
    reviewer_email TEXT,
    reviewer_notes TEXT,
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('upheld', 'overturned')),
    outcome_reason TEXT,
    next_steps TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_appeals_candidate_id ON public.appeals(candidate_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_company_id ON public.appeals(company_id);
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON public.appeals(created_at DESC);

-- Add foreign key from candidates to appeals
ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_appeal_id_fkey
    FOREIGN KEY (appeal_id) REFERENCES public.appeals(id) ON DELETE SET NULL;

COMMENT ON TABLE public.appeals IS 'Human review requests for AI screening decisions (POPIA compliance)';
COMMENT ON COLUMN public.appeals.status IS 'pending=awaiting review, reviewed=under review, upheld=AI confirmed, overturned=AI reversed';
COMMENT ON COLUMN public.appeals.ai_decision_data IS 'Snapshot of AI screening result at time of appeal for audit trail';

-- ============================================
-- 6. USAGE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('cv_screen', 'cv_analysis', 'interview', 'email_sent', 'whatsapp_sent')),
    count INTEGER NOT NULL DEFAULT 1,
    period TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_company_id ON public.usage(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_type_period ON public.usage(type, period);

COMMENT ON TABLE public.usage IS 'API and feature usage tracking for billing';
COMMENT ON COLUMN public.usage.type IS 'Usage type: cv_screen (B2B), cv_analysis (B2C), interview, email_sent, whatsapp_sent';
COMMENT ON COLUMN public.usage.period IS 'Billing period in YYYY-MM format';

-- ============================================
-- 7. PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ZAR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider TEXT NOT NULL CHECK (provider IN ('payfast', 'stripe', 'manual')),
    provider_ref TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_ref);

COMMENT ON TABLE public.payments IS 'Payment transactions for billing';
COMMENT ON COLUMN public.payments.amount IS 'Amount in cents (e.g., 2900 = R29.00)';
COMMENT ON COLUMN public.payments.provider IS 'Payment provider: payfast (SA), stripe (international), manual';

-- ============================================
-- 8. INTERVIEW SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id TEXT PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'cancelled')),
    interview_plan JSONB,
    transcript JSONB,
    analysis JSONB,
    scores JSONB,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON public.interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);

COMMENT ON TABLE public.interview_sessions IS 'AI voice interview sessions';
COMMENT ON COLUMN public.interview_sessions.id IS 'Session ID format: interview_timestamp_random';
COMMENT ON COLUMN public.interview_sessions.interview_plan IS 'AI-generated interview questions and plan';
COMMENT ON COLUMN public.interview_sessions.analysis IS 'AI analysis of candidate responses';

-- ============================================
-- 9. INTERVIEW SLOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.interview_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recruiter_name TEXT,
    recruiter_email TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    location_type TEXT NOT NULL DEFAULT 'video' CHECK (location_type IN ('video', 'phone', 'in-person')),
    meeting_link TEXT,
    address TEXT,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    booked_by_candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    booked_at TIMESTAMPTZ,
    calendar_event_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_slots_role_id ON public.interview_slots(role_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_start_time ON public.interview_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_interview_slots_is_booked ON public.interview_slots(is_booked);

COMMENT ON TABLE public.interview_slots IS 'Available interview time slots';
COMMENT ON COLUMN public.interview_slots.duration IS 'Interview duration in minutes';
COMMENT ON COLUMN public.interview_slots.calendar_event_id IS 'External calendar event ID (Google, etc.)';

-- ============================================
-- 10. SCHEDULED INTERVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID NOT NULL REFERENCES public.interview_slots(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_candidate_id ON public.scheduled_interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_slot_id ON public.scheduled_interviews(slot_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON public.scheduled_interviews(status);

COMMENT ON TABLE public.scheduled_interviews IS 'Confirmed interview bookings';

-- ============================================
-- 11. BOOKING LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_links_token ON public.booking_links(token);
CREATE INDEX IF NOT EXISTS idx_booking_links_candidate_id ON public.booking_links(candidate_id);

COMMENT ON TABLE public.booking_links IS 'Candidate interview booking link tokens';
COMMENT ON COLUMN public.booking_links.token IS 'Unique token for booking page URL';

-- ============================================
-- 12. RECRUITER AVAILABILITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.recruiter_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recruiter_email TEXT NOT NULL,
    calendar_id TEXT,
    availability_windows JSONB NOT NULL DEFAULT '[]',
    interview_duration INTEGER NOT NULL DEFAULT 30,
    buffer_between INTEGER NOT NULL DEFAULT 15,
    max_per_day INTEGER NOT NULL DEFAULT 8,
    timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    auto_create_meet BOOLEAN NOT NULL DEFAULT TRUE,
    calendar_connected BOOLEAN NOT NULL DEFAULT FALSE,
    calendar_tokens JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_availability_recruiter_id ON public.recruiter_availability(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_availability_company_id ON public.recruiter_availability(company_id);

COMMENT ON TABLE public.recruiter_availability IS 'Recruiter scheduling preferences';
COMMENT ON COLUMN public.recruiter_availability.availability_windows IS 'Weekly availability windows JSON array';
COMMENT ON COLUMN public.recruiter_availability.calendar_tokens IS 'OAuth tokens for calendar integration (encrypted)';

-- ============================================
-- 13. EMAIL HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('acknowledgment', 'outcome', 'interview_invite', 'interview_confirmation', 'feedback', 'reminder')),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
    message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_history_candidate_id ON public.email_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON public.email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON public.email_history(created_at DESC);

COMMENT ON TABLE public.email_history IS 'Sent email records for audit trail';

-- ============================================
-- 14. WHATSAPP CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'initial',
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);

COMMENT ON TABLE public.whatsapp_conversations IS 'WhatsApp conversation state machine';

-- ============================================
-- 15. WHATSAPP OPTOUTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_optouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    opted_out_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_optouts_phone ON public.whatsapp_optouts(phone_number);

COMMENT ON TABLE public.whatsapp_optouts IS 'WhatsApp opt-out preferences for compliance';

-- ============================================
-- 16. WHATSAPP NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    message_type TEXT NOT NULL,
    message_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_candidate_id ON public.whatsapp_notifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_phone ON public.whatsapp_notifications(phone_number);

COMMENT ON TABLE public.whatsapp_notifications IS 'Sent WhatsApp notifications log';

-- ============================================
-- 17. WHATSAPP CV CACHE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_cv_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    cv_text TEXT,
    cv_url TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_cv_cache_phone ON public.whatsapp_cv_cache(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_cv_cache_expires ON public.whatsapp_cv_cache(expires_at);

COMMENT ON TABLE public.whatsapp_cv_cache IS 'Temporary cache for CVs received via WhatsApp';

-- ============================================
-- 18. TALENT POOL TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.talent_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    original_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'archived')),
    rejection_reason TEXT,
    ai_recommended_roles TEXT[] DEFAULT '{}',
    ai_talent_notes TEXT,
    talent_category TEXT,
    seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'lead', 'executive')),
    share_with_network BOOLEAN NOT NULL DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    contacted_at TIMESTAMPTZ,
    UNIQUE(company_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_talent_pool_company_id ON public.talent_pool(company_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidate_id ON public.talent_pool(candidate_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_status ON public.talent_pool(status);
CREATE INDEX IF NOT EXISTS idx_talent_pool_category ON public.talent_pool(talent_category);
CREATE INDEX IF NOT EXISTS idx_talent_pool_shared ON public.talent_pool(share_with_network) WHERE share_with_network = TRUE;

COMMENT ON TABLE public.talent_pool IS 'Candidates saved for future opportunities';
COMMENT ON COLUMN public.talent_pool.share_with_network IS 'Share candidate with partner network for cross-company recruiting';

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appeals_updated_at ON public.appeals;
CREATE TRIGGER update_appeals_updated_at
    BEFORE UPDATE ON public.appeals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_interviews_updated_at ON public.scheduled_interviews;
CREATE TRIGGER update_scheduled_interviews_updated_at
    BEFORE UPDATE ON public.scheduled_interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiter_availability_updated_at ON public.recruiter_availability;
CREATE TRIGGER update_recruiter_availability_updated_at
    BEFORE UPDATE ON public.recruiter_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON public.whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at
    BEFORE UPDATE ON public.whatsapp_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_optouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_cv_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_pool ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVICE ROLE POLICIES (Full Access)
-- ============================================
-- These allow the service role (backend API) to bypass RLS

CREATE POLICY "Service role full access" ON public.companies
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.candidates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.appeals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.usage
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.payments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.interview_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.interview_slots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.scheduled_interviews
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.booking_links
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.recruiter_availability
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.email_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.whatsapp_conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.whatsapp_optouts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.whatsapp_notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.whatsapp_cv_cache
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.talent_pool
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AUTHENTICATED USER POLICIES
-- ============================================
-- These allow authenticated users to access their company's data

-- Users can read their own user record
CREATE POLICY "Users can read own record" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Users can read their company
CREATE POLICY "Users can read own company" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can read roles for their company
CREATE POLICY "Users can read company roles" ON public.roles
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can read/write candidates for their company
CREATE POLICY "Users can read company candidates" ON public.candidates
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert company candidates" ON public.candidates
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update company candidates" ON public.candidates
    FOR UPDATE TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can view and update appeals for their company
CREATE POLICY "Users can view company appeals" ON public.appeals
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update company appeals" ON public.appeals
    FOR UPDATE TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can view their company's usage
CREATE POLICY "Users can view company usage" ON public.usage
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can view their company's interview slots
CREATE POLICY "Users can view company interview slots" ON public.interview_slots
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Users can view their company's talent pool
CREATE POLICY "Users can view company talent pool" ON public.talent_pool
    FOR SELECT TO authenticated
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
        OR share_with_network = TRUE
    );

-- ============================================
-- ANONYMOUS POLICIES (Public Access)
-- ============================================
-- Limited access for unauthenticated users (candidate feedback pages)

-- Anonymous can read candidate by feedback token (for feedback pages)
CREATE POLICY "Anon can read candidate by token" ON public.candidates
    FOR SELECT TO anon
    USING (
        feedback_token IS NOT NULL
        AND feedback_token = current_setting('request.headers', true)::json->>'x-feedback-token'
    );

-- Anonymous can read booking link by token
CREATE POLICY "Anon can read booking by token" ON public.booking_links
    FOR SELECT TO anon
    USING (token IS NOT NULL);

-- Anonymous can read available interview slots
CREATE POLICY "Anon can read available slots" ON public.interview_slots
    FOR SELECT TO anon
    USING (is_booked = FALSE AND start_time > NOW());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify everything is set up correctly:

-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Check foreign keys:
-- SELECT
--     tc.constraint_name,
--     tc.table_name,
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- END OF MIGRATION
-- ============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'HireInbox initial schema migration completed successfully!';
    RAISE NOTICE 'Tables created: 18';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'Next steps: Configure environment variables and test connections';
END $$;
