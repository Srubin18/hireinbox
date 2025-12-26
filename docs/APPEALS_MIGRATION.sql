-- ============================================
-- HIREINBOX APPEALS SYSTEM - DATABASE MIGRATION
-- ============================================
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
--
-- This creates the appeals table and updates the candidates table
-- for the Human Available Badge and Appeal System feature.
--
-- POPIA Compliance: This system enables human review of AI decisions,
-- which is required under South African data protection law.
-- ============================================

-- 1. Create the appeals table
CREATE TABLE IF NOT EXISTS public.appeals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Core references
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

    -- Candidate info (denormalized for audit trail)
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Unknown Role',

    -- Appeal details
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'upheld', 'overturned')),

    -- AI decision snapshot (for audit trail)
    ai_score INTEGER,
    ai_recommendation TEXT,
    ai_decision_data JSONB,

    -- Reviewer info
    reviewer_name TEXT,
    reviewer_email TEXT,
    reviewer_notes TEXT,

    -- Outcome
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('upheld', 'overturned')),
    outcome_reason TEXT,
    next_steps TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,

    -- Audit fields
    ip_address TEXT,
    user_agent TEXT
);

-- 2. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appeals_candidate_id ON public.appeals(candidate_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_company_id ON public.appeals(company_id);
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON public.appeals(created_at DESC);

-- 3. Add appeal tracking columns to candidates table
DO $$
BEGIN
    -- Add appeal_requested column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'appeal_requested'
    ) THEN
        ALTER TABLE public.candidates ADD COLUMN appeal_requested BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add appeal_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'appeal_status'
    ) THEN
        ALTER TABLE public.candidates ADD COLUMN appeal_status TEXT;
    END IF;

    -- Add appeal_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'appeal_id'
    ) THEN
        ALTER TABLE public.candidates ADD COLUMN appeal_id UUID REFERENCES public.appeals(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appeals_updated_at ON public.appeals;
CREATE TRIGGER appeals_updated_at
    BEFORE UPDATE ON public.appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_appeals_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON public.appeals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Authenticated users can view appeals for their company
CREATE POLICY "Users can view company appeals" ON public.appeals
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Authenticated users can update appeals for their company
CREATE POLICY "Users can update company appeals" ON public.appeals
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 6. Add comments for documentation
COMMENT ON TABLE public.appeals IS 'Human review appeals for AI screening decisions (POPIA compliance)';
COMMENT ON COLUMN public.appeals.status IS 'pending=awaiting review, reviewed=under review, upheld=AI decision confirmed, overturned=AI decision changed';
COMMENT ON COLUMN public.appeals.ai_decision_data IS 'Snapshot of AI screening result at time of appeal for audit trail';
COMMENT ON COLUMN public.appeals.reviewer_notes IS 'Notes shared with candidate explaining the review outcome';

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked:
-- ============================================

-- Check appeals table exists:
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appeals');

-- Check columns on candidates table:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates' AND column_name LIKE 'appeal%';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'appeals';

-- ============================================
-- SAMPLE DATA (for testing - comment out in production)
-- ============================================

-- INSERT INTO public.appeals (
--     candidate_id,
--     candidate_name,
--     candidate_email,
--     role_title,
--     reason,
--     status,
--     ai_score,
--     ai_recommendation
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with real candidate_id
--     'Test Candidate',
--     'test@example.com',
--     'Software Developer',
--     'I have additional experience that was not reflected in my CV',
--     'pending',
--     65,
--     'CONSIDER'
-- );
