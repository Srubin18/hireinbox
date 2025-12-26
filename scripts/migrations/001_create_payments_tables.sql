-- ============================================
-- HireInbox Payments & Subscriptions Schema
-- Migration: 001_create_payments_tables.sql
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks active subscriptions for B2B customers
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner (can be user or organization)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- Add FK when organizations table exists

    -- Product info
    product_id TEXT NOT NULL, -- e.g., 'b2b_starter', 'b2b_growth', 'b2b_business'

    -- Payfast details
    payfast_token TEXT, -- Subscription token for recurring billing

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),

    -- Billing period
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- USAGE TRACKING TABLE
-- Tracks CV screening usage per billing period
-- ============================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- Add FK when organizations table exists

    -- Billing period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Usage counts
    cv_screenings_count INTEGER DEFAULT 0,
    cv_screenings_limit INTEGER NOT NULL, -- -1 for unlimited

    -- B2C single scans (not subscription based)
    b2c_scans_purchased INTEGER DEFAULT 0,
    b2c_scans_used INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one record per user per period
    UNIQUE(user_id, period_start, period_end)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_organization_id ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- ============================================
-- PAYMENTS TABLE
-- Records all payments (one-time and subscription)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID, -- Add FK when organizations table exists

    -- Payfast details
    payfast_payment_id TEXT NOT NULL, -- pf_payment_id from ITN
    m_payment_id TEXT NOT NULL, -- Our unique payment ID

    -- Product
    product_id TEXT NOT NULL,

    -- Amounts (stored in cents)
    amount INTEGER NOT NULL, -- Gross amount
    fee INTEGER DEFAULT 0, -- Payfast fee
    net_amount INTEGER DEFAULT 0, -- Amount after fee

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('complete', 'failed', 'pending', 'cancelled')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('once_off', 'subscription')),

    -- Raw ITN data for debugging
    itn_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payfast_payment_id ON payments(payfast_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_m_payment_id ON payments(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- FREE TIER TRACKING
-- Track free usage for users without subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS free_tier_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner (can be user or anonymous by session)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    email TEXT, -- Email if provided

    -- Usage
    b2c_scans_used INTEGER DEFAULT 0,
    b2c_limit INTEGER DEFAULT 1, -- 1 free scan for B2C

    b2b_scans_used INTEGER DEFAULT 0,
    b2b_limit INTEGER DEFAULT 10, -- 10 free screenings for B2B

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique per user or session
    UNIQUE(user_id),
    UNIQUE(session_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_free_tier_user_id ON free_tier_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_free_tier_session_id ON free_tier_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_free_tier_email ON free_tier_usage(email);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_free_tier_usage_updated_at ON free_tier_usage;
CREATE TRIGGER update_free_tier_usage_updated_at
    BEFORE UPDATE ON free_tier_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_tier_usage ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Usage tracking: Users can only see their own
CREATE POLICY "Users can view own usage"
    ON usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

-- Payments: Users can only see their own
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- Free tier: Users can see their own
CREATE POLICY "Users can view own free tier"
    ON free_tier_usage FOR SELECT
    USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage_tracking"
    ON usage_tracking FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payments"
    ON payments FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access free_tier"
    ON free_tier_usage FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- USAGE CHECK FUNCTION
-- Returns remaining usage for a user
-- ============================================
CREATE OR REPLACE FUNCTION check_usage_remaining(
    p_user_id UUID,
    p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
    cv_remaining INTEGER,
    cv_limit INTEGER,
    cv_used INTEGER,
    is_unlimited BOOLEAN,
    subscription_status TEXT
) AS $$
DECLARE
    v_subscription subscriptions%ROWTYPE;
    v_usage usage_tracking%ROWTYPE;
    v_free_tier free_tier_usage%ROWTYPE;
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    -- Check for active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE (user_id = p_user_id OR organization_id = p_organization_id)
      AND status = 'active'
      AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription.id IS NOT NULL THEN
        -- Get usage for current period
        SELECT * INTO v_usage
        FROM usage_tracking
        WHERE (user_id = p_user_id OR organization_id = p_organization_id)
          AND period_start <= NOW()
          AND period_end > NOW()
        ORDER BY created_at DESC
        LIMIT 1;

        v_limit := COALESCE(v_usage.cv_screenings_limit,
            CASE v_subscription.product_id
                WHEN 'b2b_starter' THEN 50
                WHEN 'b2b_growth' THEN 250
                WHEN 'b2b_business' THEN -1
                ELSE 10
            END);
        v_used := COALESCE(v_usage.cv_screenings_count, 0);

        RETURN QUERY SELECT
            CASE WHEN v_limit = -1 THEN 999999 ELSE v_limit - v_used END,
            v_limit,
            v_used,
            v_limit = -1,
            v_subscription.status;
    ELSE
        -- Check free tier
        SELECT * INTO v_free_tier
        FROM free_tier_usage
        WHERE user_id = p_user_id;

        IF v_free_tier.id IS NOT NULL THEN
            RETURN QUERY SELECT
                v_free_tier.b2b_limit - v_free_tier.b2b_scans_used,
                v_free_tier.b2b_limit,
                v_free_tier.b2b_scans_used,
                FALSE,
                'free'::TEXT;
        ELSE
            -- New user, return default free tier
            RETURN QUERY SELECT
                10, -- 10 free screenings
                10,
                0,
                FALSE,
                'free'::TEXT;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INCREMENT USAGE FUNCTION
-- Call this after each CV screening
-- ============================================
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_organization_id UUID DEFAULT NULL,
    p_is_b2c BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription subscriptions%ROWTYPE;
    v_usage usage_tracking%ROWTYPE;
BEGIN
    -- Check for active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE (user_id = p_user_id OR organization_id = p_organization_id)
      AND status = 'active'
      AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription.id IS NOT NULL THEN
        -- Update or insert usage tracking
        INSERT INTO usage_tracking (user_id, organization_id, period_start, period_end, cv_screenings_count, cv_screenings_limit)
        VALUES (
            p_user_id,
            p_organization_id,
            v_subscription.current_period_start,
            v_subscription.current_period_end,
            1,
            CASE v_subscription.product_id
                WHEN 'b2b_starter' THEN 50
                WHEN 'b2b_growth' THEN 250
                WHEN 'b2b_business' THEN -1
                ELSE 10
            END
        )
        ON CONFLICT (user_id, period_start, period_end) DO UPDATE
        SET cv_screenings_count = usage_tracking.cv_screenings_count + 1;

        RETURN TRUE;
    ELSE
        -- Update free tier
        IF p_is_b2c THEN
            INSERT INTO free_tier_usage (user_id, b2c_scans_used)
            VALUES (p_user_id, 1)
            ON CONFLICT (user_id) DO UPDATE
            SET b2c_scans_used = free_tier_usage.b2c_scans_used + 1;
        ELSE
            INSERT INTO free_tier_usage (user_id, b2b_scans_used)
            VALUES (p_user_id, 1)
            ON CONFLICT (user_id) DO UPDATE
            SET b2b_scans_used = free_tier_usage.b2b_scans_used + 1;
        END IF;

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================
-- To run this migration:
-- 1. Go to Supabase Dashboard
-- 2. Click on SQL Editor
-- 3. Paste this entire file
-- 4. Click Run
-- ============================================
