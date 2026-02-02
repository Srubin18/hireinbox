-- ============================================
-- HIREINBOX WHATSAPP TABLES
-- Tables for WhatsApp job seeker flow
-- ============================================

-- WhatsApp CV Scans (tracks free scan usage)
CREATE TABLE IF NOT EXISTS whatsapp_cv_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  candidate_name TEXT,
  overall_score INTEGER CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  scanned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient lookup by phone number
CREATE INDEX IF NOT EXISTS idx_whatsapp_cv_scans_phone ON whatsapp_cv_scans(phone_number);

-- WhatsApp Talent Pool (job seekers who opt-in via WhatsApp)
-- This is separate from the B2B talent_pool table which requires company_id
CREATE TABLE IF NOT EXISTS whatsapp_talent_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- CV data
  cv_text TEXT,
  overall_score INTEGER CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  current_title TEXT,
  years_experience TEXT,
  education_level TEXT,
  natural_fit_roles TEXT[],
  industries TEXT[],

  -- Full AI analysis stored as JSON
  full_analysis JSONB,

  -- Opt-in tracking
  opted_in_at TIMESTAMP DEFAULT NOW(),
  source TEXT DEFAULT 'whatsapp',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'hired', 'inactive')),
  last_contacted_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for searching
CREATE INDEX IF NOT EXISTS idx_whatsapp_talent_pool_phone ON whatsapp_talent_pool(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_talent_pool_score ON whatsapp_talent_pool(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_talent_pool_status ON whatsapp_talent_pool(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_talent_pool_roles ON whatsapp_talent_pool USING GIN(natural_fit_roles);

-- Enable Row Level Security
ALTER TABLE whatsapp_cv_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_talent_pool ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can access all (webhook uses service role key)
CREATE POLICY "Service role access for whatsapp_cv_scans"
  ON whatsapp_cv_scans
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role access for whatsapp_talent_pool"
  ON whatsapp_talent_pool
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_talent_pool_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_talent_pool_updated
  BEFORE UPDATE ON whatsapp_talent_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_talent_pool_timestamp();

-- Comments
COMMENT ON TABLE whatsapp_cv_scans IS 'Tracks CV scans initiated via WhatsApp for free usage limits';
COMMENT ON TABLE whatsapp_talent_pool IS 'Job seekers who opted into the talent pool via WhatsApp';
