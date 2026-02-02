-- ============================================
-- HIREINBOX - RECRUITER PORTAL TABLES
-- Migration: 20260125_recruiter_portal.sql
-- ============================================
--
-- Creates tables for the B2Recruiter portal:
-- - recruiter_clients: Companies the recruiter works with
-- - recruiter_talent: Recruiter's personal talent pool
-- - recruiter_commissions: Commission tracking for placements
--
-- ============================================

-- ============================================
-- 1. RECRUITER_CLIENTS TABLE
-- ============================================
-- Tracks the client companies a recruiter works with

CREATE TABLE IF NOT EXISTS public.recruiter_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL,  -- The recruiter's auth user ID
    company_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    industry TEXT,
    notes TEXT,
    contract_type TEXT CHECK (contract_type IN ('retained', 'contingency', 'exclusive', 'contract')),
    fee_percentage DECIMAL(5,2) DEFAULT 15.00,  -- Commission percentage
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_clients_recruiter_id ON public.recruiter_clients(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_clients_status ON public.recruiter_clients(status);

COMMENT ON TABLE public.recruiter_clients IS 'Client companies that recruiters work with';
COMMENT ON COLUMN public.recruiter_clients.fee_percentage IS 'Commission percentage for placements (e.g., 15.00 = 15%)';
COMMENT ON COLUMN public.recruiter_clients.contract_type IS 'Type of recruitment agreement: retained, contingency, exclusive, contract';

-- ============================================
-- 2. RECRUITER_CLIENT_ROLES TABLE
-- ============================================
-- Tracks open roles for each client

CREATE TABLE IF NOT EXISTS public.recruiter_client_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.recruiter_clients(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    location TEXT,
    remote_option TEXT CHECK (remote_option IN ('remote', 'hybrid', 'onsite')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'filled', 'cancelled')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    candidates_submitted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_client_roles_client_id ON public.recruiter_client_roles(client_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_client_roles_recruiter_id ON public.recruiter_client_roles(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_client_roles_status ON public.recruiter_client_roles(status);

COMMENT ON TABLE public.recruiter_client_roles IS 'Open job roles for recruiter clients';

-- ============================================
-- 3. RECRUITER_TALENT TABLE
-- ============================================
-- Recruiter's personal talent pool (candidates they've sourced)

CREATE TABLE IF NOT EXISTS public.recruiter_talent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL,  -- The recruiter's auth user ID
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    current_title TEXT,
    current_company TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years INTEGER,
    location TEXT,
    salary_expectation INTEGER,  -- In ZAR
    cv_url TEXT,
    cv_text TEXT,
    linkedin_url TEXT,
    notes TEXT,
    source TEXT,  -- Where the candidate was sourced from
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'interviewing', 'placed', 'unavailable', 'do_not_contact')),
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_talent_recruiter_id ON public.recruiter_talent(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_talent_email ON public.recruiter_talent(email);
CREATE INDEX IF NOT EXISTS idx_recruiter_talent_status ON public.recruiter_talent(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_talent_skills ON public.recruiter_talent USING GIN(skills);

COMMENT ON TABLE public.recruiter_talent IS 'Personal talent pool for recruiters - candidates they have sourced';
COMMENT ON COLUMN public.recruiter_talent.source IS 'Where the candidate was found: LinkedIn, referral, job board, etc.';

-- ============================================
-- 4. RECRUITER_COMMISSIONS TABLE
-- ============================================
-- Tracks placements and commissions

CREATE TABLE IF NOT EXISTS public.recruiter_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL,
    client_id UUID REFERENCES public.recruiter_clients(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.recruiter_client_roles(id) ON DELETE SET NULL,
    talent_id UUID REFERENCES public.recruiter_talent(id) ON DELETE SET NULL,
    candidate_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    placement_date DATE NOT NULL,
    start_date DATE,
    salary INTEGER NOT NULL,  -- Annual salary in ZAR
    fee_percentage DECIMAL(5,2) NOT NULL,  -- Commission percentage
    fee_amount INTEGER NOT NULL,  -- Calculated fee in ZAR
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'cancelled', 'refunded')),
    invoice_number TEXT,
    invoice_date DATE,
    payment_date DATE,
    guarantee_end_date DATE,  -- End of guarantee period
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_commissions_recruiter_id ON public.recruiter_commissions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_commissions_client_id ON public.recruiter_commissions(client_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_commissions_status ON public.recruiter_commissions(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_commissions_placement_date ON public.recruiter_commissions(placement_date DESC);

COMMENT ON TABLE public.recruiter_commissions IS 'Commission tracking for recruiter placements';
COMMENT ON COLUMN public.recruiter_commissions.fee_amount IS 'Commission amount in ZAR (salary * fee_percentage / 100)';
COMMENT ON COLUMN public.recruiter_commissions.guarantee_end_date IS 'End of guarantee period - if candidate leaves before, may need refund';

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_recruiter_clients_updated_at ON public.recruiter_clients;
CREATE TRIGGER update_recruiter_clients_updated_at
    BEFORE UPDATE ON public.recruiter_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiter_client_roles_updated_at ON public.recruiter_client_roles;
CREATE TRIGGER update_recruiter_client_roles_updated_at
    BEFORE UPDATE ON public.recruiter_client_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiter_talent_updated_at ON public.recruiter_talent;
CREATE TRIGGER update_recruiter_talent_updated_at
    BEFORE UPDATE ON public.recruiter_talent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiter_commissions_updated_at ON public.recruiter_commissions;
CREATE TRIGGER update_recruiter_commissions_updated_at
    BEFORE UPDATE ON public.recruiter_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.recruiter_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_client_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_commissions ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON public.recruiter_clients
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.recruiter_client_roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.recruiter_talent
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.recruiter_commissions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- END OF MIGRATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Recruiter portal tables migration completed!';
    RAISE NOTICE 'Tables created: recruiter_clients, recruiter_client_roles, recruiter_talent, recruiter_commissions';
END $$;
