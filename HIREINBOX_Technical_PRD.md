# HIREINBOX - Technical Product Requirements Document (PRD)
## Version 2.0 | January 2026

---

# DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | HireInbox Team | Initial release |
| 2.0 | 2026-01-21 | HireInbox Team | Added Security, Payments, DR, Accessibility, Mobile, Analytics |

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Database Schema](#4-database-schema)
5. [API Specifications](#5-api-specifications)
6. [Frontend Specifications](#6-frontend-specifications)
7. [Mobile Strategy](#7-mobile-strategy)
8. [AI Architecture](#8-ai-architecture)
9. [JOBIXAI Agent Platform](#9-jobixai-agent-platform)
10. [Authentication & Security](#10-authentication--security)
11. [Payment Processing](#11-payment-processing)
12. [File Handling](#12-file-handling)
13. [Notifications & Messaging](#13-notifications--messaging)
14. [Background Jobs & Queues](#14-background-jobs--queues)
15. [Search & Filtering](#15-search--filtering)
16. [Analytics & Reporting](#16-analytics--reporting)
17. [Third-Party Integrations](#17-third-party-integrations)
18. [Multi-Tenancy](#18-multi-tenancy)
19. [Internationalization & Localization](#19-internationalization--localization)
20. [Accessibility](#20-accessibility)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Testing Strategy](#22-testing-strategy)
23. [Deployment & DevOps](#23-deployment--devops)
24. [Monitoring & Observability](#24-monitoring--observability)
25. [Error Handling](#25-error-handling)
26. [Disaster Recovery & Business Continuity](#26-disaster-recovery--business-continuity)
27. [Data Migration & Versioning](#27-data-migration--versioning)
28. [Compliance & Legal](#28-compliance--legal)
29. [Appendices](#29-appendices)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Product Overview

HireInbox is a multi-tenant, AI-native SaaS recruitment platform serving two user segments:

- **B2B (Employers)**: AI-powered CV screening, candidate management, and hiring workflow automation
- **B2C (Job Seekers)**: CV analysis, improvement recommendations, video interview coaching, and job preparation

## 1.2 Core Value Proposition

- Reduce employer CV screening time by 80%
- Provide job seekers with actionable CV feedback
- South African market-specific AI training (local universities, job titles, salary bands)
- POPIA-compliant with full audit trail

## 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16+, React 19+, TypeScript |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL (Supabase) |
| Object Storage | Supabase Storage |
| Vector Database | Supabase pgvector (future) |
| AI/ML | OpenAI GPT-4o-mini (fine-tuned), Claude (Vision) |
| Authentication | Supabase Auth |
| Payments | Yoco (SA), Stripe (International) |
| Email | Nodemailer, SendGrid |
| SMS/WhatsApp | 360Dialog, Twilio |
| Hosting | Vercel |
| CDN | Vercel Edge Network |
| DNS/Security | Cloudflare |
| Domain | hireinbox.co.za |

## 1.4 Document Scope

This PRD covers all technical specifications required to build, deploy, and maintain the HireInbox platform. It is intended for:
- Development teams
- DevOps engineers
- Security auditors
- Technical partners
- System integrators

---

# 2. SYSTEM ARCHITECTURE

## 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                      │
├───────────────┬───────────────┬───────────────┬───────────────────────────┤
│   B2B Web     │   B2C Web     │   Admin       │      Mobile (PWA)         │
│   (Employer)  │   (Candidate) │   Dashboard   │      Future Native        │
└───────┬───────┴───────┬───────┴───────┬───────┴───────────┬───────────────┘
        │               │               │                   │
        └───────────────┴───────────────┴───────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Cloudflare       │
                    │   (WAF / DDoS / CDN)  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     Vercel Edge       │
                    │   (CDN / Middleware)  │
                    └───────────┬───────────┘
                                │
              ┌─────────────────▼─────────────────┐
              │        Next.js Application        │
              │   (API Routes + Server Components)│
              └─────────────────┬─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼────┐            ┌─────▼─────┐           ┌─────▼─────┐
   │Supabase │            │    AI     │           │ External  │
   │ Stack   │            │ Services  │           │ Services  │
   │         │            │           │           │           │
   │• Auth   │            │• OpenAI   │           │• SendGrid │
   │• DB     │            │• Claude   │           │• Yoco     │
   │• Storage│            │• Whisper  │           │• Twilio   │
   │• Edge   │            │           │           │• 360Dialog│
   └─────────┘            └───────────┘           └───────────┘
```

## 2.2 Core Architectural Principles

1. **Multi-tenant Isolation**: All data partitioned by `company_id` or `user_id`
2. **API-First Design**: All functionality exposed via REST APIs
3. **Stateless Backend**: No server-side sessions; JWT-based auth
4. **Async Processing**: Long-running tasks (AI analysis) run in background
5. **Event-Driven**: Actions trigger notifications via event system
6. **Horizontal Scalability**: Designed for serverless scaling
7. **Security by Default**: Encryption, input validation, output sanitization
8. **Graceful Degradation**: System remains functional if non-critical services fail

## 2.3 Service Boundaries

| Service | Responsibility | Critical? |
|---------|---------------|-----------|
| Auth Service | User registration, login, session management | Yes |
| Employer Service | Company management, job roles, settings | Yes |
| Candidate Service | Profile, CV storage, applications | Yes |
| AI Service | CV analysis, interviews, scoring | Yes |
| Notification Service | Email, SMS, WhatsApp dispatch | No |
| Billing Service | Subscriptions, invoices, payments | Yes |
| Admin Service | Platform metrics, user management | No |
| Storage Service | File upload, retrieval, processing | Yes |
| Analytics Service | Usage tracking, reporting | No |

## 2.4 Data Flow Diagram

```
CV Submission Flow:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Email  │───>│  IMAP   │───>│ Extract │───>│   AI    │───>│  Store  │
│ Arrives │    │ Fetch   │    │  Text   │    │ Analyze │    │ Result  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                │
                                                ▼
                                          ┌─────────┐
                                          │ Notify  │
                                          │Employer │
                                          └─────────┘
```

---

# 3. USER ROLES & PERMISSIONS

## 3.1 Role Hierarchy

```
HireInbox (Platform)
├── Super Admin (full platform access)
├── Support Agent (read + limited write)
└── Compliance Officer (audit + data export)

Employer (B2B - per company)
├── Owner (full company access + billing)
├── HR Admin (full HR features, no billing)
├── HR Manager (team + candidates)
├── HR Viewer (read-only)
└── Finance (billing only)

Candidate (B2C)
├── Free User (basic features)
└── Premium User (paid enhancements)
```

## 3.2 Permission Matrix

| Permission | Super Admin | Owner | HR Admin | HR Manager | HR Viewer | Finance | Candidate |
|------------|:-----------:|:-----:|:--------:|:----------:|:---------:|:-------:|:---------:|
| View all companies | Y | - | - | - | - | - | - |
| Manage company settings | Y | Y | Y | - | - | - | - |
| Create job roles | Y | Y | Y | Y | - | - | - |
| View candidates | Y | Y | Y | Y | Y | - | - |
| Move candidates (pipeline) | Y | Y | Y | Y | - | - | - |
| Export candidate data | Y | Y | Y | - | - | - | - |
| Delete candidates | Y | Y | Y | - | - | - | - |
| View billing | Y | Y | - | - | - | Y | - |
| Manage billing | Y | Y | - | - | - | Y | - |
| Invite team members | Y | Y | Y | - | - | - | - |
| View audit logs | Y | Y | Y | - | - | - | - |
| Upload CV | - | - | - | - | - | - | Y |
| View own analysis | - | - | - | - | - | - | Y |
| Purchase enhancements | - | - | - | - | - | - | Y |
| Delete own account | - | - | - | - | - | - | Y |

## 3.3 Role Assignment Rules

- First user to create a company becomes **Owner**
- Owners can invite users and assign roles
- HR Admins can invite up to HR Manager level
- Candidates self-register (no invitation needed)
- Super Admins created via database seeding only
- Role changes logged to audit trail

## 3.4 Session Management

| Parameter | Value |
|-----------|-------|
| Access Token Lifetime | 1 hour |
| Refresh Token Lifetime | 30 days |
| Maximum Sessions per User | 5 |
| Session Idle Timeout | 30 minutes |
| Force Re-auth for Sensitive Actions | Yes |

---

# 4. DATABASE SCHEMA

## 4.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   companies  │────<│    roles     │────<│  candidates  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │              ┌─────┴─────┐              │
       │              │           │              │
       ▼              ▼           ▼              ▼
┌──────────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│user_profiles │ │criteria │ │interviews│ │  cv_analyses │
└──────────────┘ └─────────┘ └─────────┘ └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │   invoices   │     │   payments   │
│  (Supabase)  │     └──────────────┘     └──────────────┘
└──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  audit_logs  │     │ notifications│
└──────────────┘     └──────────────┘
```

## 4.2 Core Tables

### 4.2.1 companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  industry VARCHAR(100),
  size_range VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '500+'
  website VARCHAR(255),
  billing_email VARCHAR(255),
  vat_number VARCHAR(50),
  registration_number VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'South Africa',

  -- Settings
  settings JSONB DEFAULT '{}',
  email_settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',

  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Usage limits
  monthly_cv_limit INTEGER DEFAULT 50,
  monthly_cvs_used INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_subscription ON companies(subscription_tier, subscription_status);
CREATE INDEX idx_companies_active ON companies(is_active) WHERE is_active = true;
```

### 4.2.2 user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'hr_viewer',

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  job_title VARCHAR(100),
  department VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- Security
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,

  -- Preferences
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{
    "email_new_candidate": true,
    "email_daily_digest": true,
    "push_enabled": false
  }',

  -- Metadata
  timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
  locale VARCHAR(10) DEFAULT 'en-ZA',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

### 4.2.3 roles (Job Roles)
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  employment_type VARCHAR(50) DEFAULT 'full-time',
  work_mode VARCHAR(50) DEFAULT 'hybrid',
  status VARCHAR(50) DEFAULT 'draft',
  description TEXT,

  -- Location
  location_city VARCHAR(100),
  location_province VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'South Africa',

  -- Criteria (structured)
  criteria JSONB NOT NULL DEFAULT '{}',

  -- AI Guidance
  ai_guidance JSONB DEFAULT '{}',

  -- Screening questions
  screening_questions JSONB DEFAULT '[]',

  -- Auto-scheduling config
  auto_schedule_config JSONB DEFAULT '{}',

  -- Metrics
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  hired_count INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_roles_company ON roles(company_id);
CREATE INDEX idx_roles_status ON roles(status);
CREATE INDEX idx_roles_company_status ON roles(company_id, status);
CREATE INDEX idx_roles_created ON roles(created_at DESC);
```

### 4.2.4 candidates
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),

  -- Source tracking
  source VARCHAR(100) DEFAULT 'email',
  source_email_id VARCHAR(255),
  source_ip INET,

  -- CV storage
  cv_url TEXT,
  cv_filename VARCHAR(255),
  cv_text TEXT,
  cv_hash VARCHAR(64),
  cv_size_bytes INTEGER,

  -- AI Analysis
  score INTEGER CHECK (score >= 0 AND score <= 100),
  recommendation VARCHAR(50),
  analysis JSONB,
  analysis_version VARCHAR(20),
  analyzed_at TIMESTAMPTZ,

  -- Pipeline
  status VARCHAR(50) DEFAULT 'new',
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES user_profiles(id),

  -- Interview
  interview_scheduled_at TIMESTAMPTZ,
  interview_completed_at TIMESTAMPTZ,
  interview_score INTEGER,
  interview_notes TEXT,

  -- Communication
  last_contacted_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  acknowledgment_sent BOOLEAN DEFAULT false,
  acknowledgment_sent_at TIMESTAMPTZ,

  -- Flags
  is_talent_pool BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES candidates(id),

  -- Notes
  internal_notes TEXT,

  -- POPIA
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  data_retention_until TIMESTAMPTZ,
  deletion_requested_at TIMESTAMPTZ,

  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidates_role ON candidates(role_id);
CREATE INDEX idx_candidates_company ON candidates(company_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_score ON candidates(score DESC);
CREATE INDEX idx_candidates_cv_hash ON candidates(cv_hash);
CREATE INDEX idx_candidates_applied ON candidates(applied_at DESC);
CREATE INDEX idx_candidates_talent_pool ON candidates(is_talent_pool) WHERE is_talent_pool = true;
CREATE INDEX idx_candidates_cv_search ON candidates USING gin(to_tsvector('english', cv_text));
```

### 4.2.5 candidate_profiles (B2C Users)
```sql
CREATE TABLE candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  headline VARCHAR(255),
  bio TEXT,
  linkedin_url VARCHAR(255),

  -- Current CV
  current_cv_url TEXT,
  current_cv_uploaded_at TIMESTAMPTZ,

  -- Latest analysis
  latest_analysis_id UUID,
  latest_score INTEGER,

  -- Preferences
  job_preferences JSONB DEFAULT '{}',

  -- Talent pool
  talent_pool_opted_in BOOLEAN DEFAULT false,
  talent_pool_opted_in_at TIMESTAMPTZ,
  talent_pool_visibility VARCHAR(50) DEFAULT 'all',

  -- Usage tracking
  free_analyses_used INTEGER DEFAULT 0,
  free_analyses_reset_at TIMESTAMPTZ,
  total_analyses INTEGER DEFAULT 0,

  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- POPIA
  marketing_consent BOOLEAN DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_candidate_profiles_user ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profiles_talent_pool ON candidate_profiles(talent_pool_opted_in) WHERE talent_pool_opted_in = true;
```

### 4.2.6 cv_analyses (B2C Analysis History)
```sql
CREATE TABLE cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE,

  -- Input
  cv_url TEXT NOT NULL,
  cv_filename VARCHAR(255),
  target_role VARCHAR(255),
  target_industry VARCHAR(100),

  -- Analysis
  overall_score INTEGER,
  analysis JSONB NOT NULL,
  analysis_version VARCHAR(20),

  -- Rewrite
  rewrite_purchased BOOLEAN DEFAULT false,
  rewrite_url TEXT,
  rewrite_generated_at TIMESTAMPTZ,

  -- Video
  video_url TEXT,
  video_analysis JSONB,
  video_analyzed_at TIMESTAMPTZ,

  -- Payment
  payment_id UUID,
  amount_paid INTEGER DEFAULT 0,

  -- Sharing
  share_token VARCHAR(64) UNIQUE,
  share_expires_at TIMESTAMPTZ,
  share_view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cv_analyses_profile ON cv_analyses(candidate_profile_id);
CREATE INDEX idx_cv_analyses_created ON cv_analyses(created_at DESC);
CREATE INDEX idx_cv_analyses_share ON cv_analyses(share_token) WHERE share_token IS NOT NULL;
```

### 4.2.7 interviews
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

  -- Type
  type VARCHAR(50) NOT NULL,

  -- Session
  status VARCHAR(50) DEFAULT 'pending',
  access_token VARCHAR(64) UNIQUE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- For AI interviews
  questions JSONB,
  responses JSONB,
  transcript TEXT,

  -- For video analysis
  video_url TEXT,
  video_duration_seconds INTEGER,

  -- Results
  score INTEGER,
  analysis JSONB,

  -- Review
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  reviewer_rating INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_role ON interviews(role_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_token ON interviews(access_token);
```

### 4.2.8 invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',

  -- Amounts (in cents)
  subtotal INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  discount_code VARCHAR(50),
  vat_rate DECIMAL(5,2) DEFAULT 15.00,
  vat_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Line items
  line_items JSONB NOT NULL,

  -- Billing info (snapshot)
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB,
  billing_vat_number VARCHAR(50),

  -- Dates
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,

  -- Payment
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),

  -- Documents
  pdf_url TEXT,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due ON invoices(due_at) WHERE status = 'sent';
```

### 4.2.9 payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  payable_type VARCHAR(50) NOT NULL,
  payable_id UUID NOT NULL,

  -- User
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),

  -- Payment details
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',

  -- Provider
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_response JSONB,

  -- Card details (masked)
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Failure
  failure_code VARCHAR(100),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  -- Refund
  refunded_at TIMESTAMPTZ,
  refund_amount INTEGER,
  refund_reason TEXT
);

CREATE INDEX idx_payments_payable ON payments(payable_type, payable_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider, provider_payment_id);
```

### 4.2.10 audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  ip_address INET,
  user_agent TEXT,

  -- Action
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,

  -- Context
  company_id UUID REFERENCES companies(id),

  -- Details
  details JSONB DEFAULT '{}',

  -- Classification
  severity VARCHAR(20) DEFAULT 'info',
  category VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Continue for future months...

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'error', 'critical');
```

### 4.2.11 notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,

  -- Action
  action_url TEXT,
  action_label VARCHAR(100),

  -- Related entity
  entity_type VARCHAR(50),
  entity_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery
  channels JSONB DEFAULT '["in_app"]',
  delivered_via JSONB DEFAULT '[]',
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
```

### 4.2.12 discount_codes
```sql
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value INTEGER NOT NULL, -- percentage (0-100) or cents

  -- Applicability
  applies_to JSONB DEFAULT '["all"]', -- ['all'], ['b2b'], ['b2c'], ['product_id']
  min_amount INTEGER DEFAULT 0,

  -- Limits
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, valid_from, valid_until);
```

### 4.2.13 api_keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 of actual key
  key_prefix VARCHAR(12) NOT NULL, -- First 12 chars for display

  -- Permissions
  scopes JSONB DEFAULT '["read"]',

  -- Limits
  rate_limit_per_minute INTEGER DEFAULT 100,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- Expiry
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_api_keys_company ON api_keys(company_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

---

# 5. API SPECIFICATIONS

## 5.1 API Design Principles

- RESTful design with predictable URLs
- JSON request/response bodies
- Bearer token authentication (JWT)
- Consistent error format
- Pagination via cursor or offset
- Rate limiting with headers
- Versioning in URL path

## 5.2 Base URL

```
Production: https://api.hireinbox.co.za/v1
Staging:    https://api-staging.hireinbox.co.za/v1
```

## 5.3 Authentication

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

API Key authentication (for integrations):
```
X-API-Key: hi_live_xxxxxxxxxxxx
```

## 5.4 Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes* | Bearer token or API key |
| Content-Type | Yes | application/json |
| Accept | No | application/json |
| X-Request-ID | No | Client-generated request ID |
| X-Idempotency-Key | No | For POST/PUT requests |

## 5.5 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "email", "message": "Invalid email format", "code": "invalid_format"}
    ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.hireinbox.co.za/errors/VALIDATION_ERROR"
  }
}
```

## 5.6 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_REQUIRED | 401 | Authentication required |
| AUTH_INVALID | 401 | Invalid or expired token |
| AUTH_MFA_REQUIRED | 401 | MFA verification needed |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| DUPLICATE_ERROR | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| PAYMENT_REQUIRED | 402 | Payment needed |
| QUOTA_EXCEEDED | 402 | Usage limit reached |
| SERVER_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| MAINTENANCE | 503 | Scheduled maintenance |

## 5.7 Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public API | 100 | 1 minute |
| Authenticated API | 500 | 1 minute |
| AI endpoints | 30 | 1 minute |
| Auth endpoints | 10 | 1 minute |
| File uploads | 20 | 1 minute |
| Bulk operations | 5 | 1 minute |

Rate limit headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1640000000
```

## 5.8 API Endpoints

### 5.8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| POST | /auth/refresh | Refresh token |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/verify-email | Verify email address |
| POST | /auth/mfa/enable | Enable MFA |
| POST | /auth/mfa/verify | Verify MFA code |
| POST | /auth/mfa/disable | Disable MFA |

### 5.8.2 Roles (Job Listings)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /roles | List all roles |
| POST | /roles | Create role |
| GET | /roles/:id | Get role details |
| PUT | /roles/:id | Update role |
| DELETE | /roles/:id | Delete role |
| POST | /roles/:id/publish | Publish role |
| POST | /roles/:id/close | Close role |
| POST | /roles/:id/duplicate | Duplicate role |
| GET | /roles/:id/stats | Get role statistics |

### 5.8.3 Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /roles/:roleId/candidates | List candidates for role |
| GET | /candidates | List all candidates (company) |
| GET | /candidates/:id | Get candidate details |
| PATCH | /candidates/:id | Update candidate |
| DELETE | /candidates/:id | Delete candidate |
| POST | /candidates/:id/move | Move pipeline stage |
| POST | /candidates/:id/star | Star/unstar candidate |
| POST | /candidates/:id/archive | Archive candidate |
| POST | /candidates/:id/contact | Log contact |
| POST | /candidates/:id/note | Add note |
| GET | /candidates/:id/history | Get activity history |
| POST | /candidates/bulk-move | Bulk move candidates |
| POST | /candidates/bulk-archive | Bulk archive |
| GET | /candidates/export | Export to CSV |

### 5.8.4 AI Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analyze-cv | Analyze CV (B2C) |
| GET | /analysis/:id | Get analysis result |
| POST | /analyze-video | Analyze video |
| POST | /rewrite-cv | Generate improved CV |
| POST | /screen | Screen CV against role (B2B) |

### 5.8.5 Interviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /interviews | Create interview |
| GET | /interviews/:id | Get interview |
| POST | /interviews/:id/start | Start interview |
| POST | /interviews/:id/respond | Submit response |
| POST | /interviews/:id/complete | Complete interview |
| GET | /interviews/:id/transcript | Get transcript |

### 5.8.6 Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /billing/subscription | Get subscription |
| POST | /billing/subscription | Create subscription |
| PUT | /billing/subscription | Update subscription |
| DELETE | /billing/subscription | Cancel subscription |
| GET | /billing/invoices | List invoices |
| GET | /billing/invoices/:id | Get invoice |
| GET | /billing/invoices/:id/pdf | Download PDF |
| POST | /billing/invoices/:id/pay | Pay invoice |
| GET | /billing/payment-methods | List payment methods |
| POST | /billing/payment-methods | Add payment method |
| DELETE | /billing/payment-methods/:id | Remove payment method |
| POST | /billing/validate-code | Validate discount code |

### 5.8.7 Company

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /company | Get company details |
| PUT | /company | Update company |
| GET | /company/team | List team members |
| POST | /company/team/invite | Invite team member |
| DELETE | /company/team/:id | Remove team member |
| PUT | /company/team/:id/role | Update member role |
| GET | /company/settings | Get settings |
| PUT | /company/settings | Update settings |
| GET | /company/api-keys | List API keys |
| POST | /company/api-keys | Create API key |
| DELETE | /company/api-keys/:id | Revoke API key |

### 5.8.8 User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /me | Get current user |
| PUT | /me | Update profile |
| PUT | /me/password | Change password |
| PUT | /me/preferences | Update preferences |
| DELETE | /me | Delete account |
| GET | /me/notifications | List notifications |
| PUT | /me/notifications/:id/read | Mark as read |
| PUT | /me/notifications/read-all | Mark all as read |

### 5.8.9 Admin (Internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/metrics | Platform metrics |
| GET | /admin/companies | List all companies |
| GET | /admin/companies/:id | Get company details |
| POST | /admin/companies/:id/suspend | Suspend company |
| POST | /admin/companies/:id/unsuspend | Unsuspend company |
| GET | /admin/users | List all users |
| GET | /admin/audit-logs | Query audit logs |
| GET | /admin/health | System health check |

### 5.8.10 Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /webhooks | List webhook endpoints |
| POST | /webhooks | Create webhook |
| PUT | /webhooks/:id | Update webhook |
| DELETE | /webhooks/:id | Delete webhook |
| GET | /webhooks/:id/logs | Get delivery logs |
| POST | /webhooks/:id/test | Send test event |

---

# 6. FRONTEND SPECIFICATIONS

## 6.1 Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16+ | Framework (App Router) |
| React 19+ | UI Library |
| TypeScript | Type Safety |
| CSS Modules / Inline | Styling (no Tailwind) |
| Zustand | Client State |
| React Query | Server State |
| React Hook Form | Forms |
| Zod | Validation |
| Recharts | Charts |
| Framer Motion | Animations |

## 6.2 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (employer)/        # B2B employer pages
│   │   ├── dashboard/
│   │   ├── roles/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── candidates/
│   │   │   └── [id]/
│   │   ├── interviews/
│   │   ├── talent-pool/
│   │   ├── team/
│   │   ├── settings/
│   │   └── billing/
│   ├── (candidate)/       # B2C candidate pages
│   │   ├── dashboard/
│   │   ├── upload/
│   │   ├── analysis/
│   │   │   └── [id]/
│   │   ├── video/
│   │   └── profile/
│   ├── (admin)/           # Admin pages
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── users/
│   │   └── metrics/
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # Primitive components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── ...
│   ├── forms/             # Form components
│   ├── charts/            # Chart components
│   ├── layouts/           # Layout components
│   ├── employer/          # B2B specific
│   ├── candidate/         # B2C specific
│   └── admin/             # Admin specific
├── lib/
│   ├── api/               # API client
│   ├── auth/              # Auth utilities
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utilities
│   └── validations/       # Zod schemas
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## 6.3 Key Pages

### 6.3.1 Employer Dashboard
- Stats overview (CVs screened, shortlisted, interviews)
- Today's actions (candidates to review)
- Recent candidates list
- Active roles summary
- Quick actions

### 6.3.2 Role Management
- Role listing with filters
- Create role wizard (or AI chat)
- Role detail with candidate list
- Role settings and criteria

### 6.3.3 Candidate Review
- Candidate list with filters/search
- Candidate detail modal
- AI analysis display
- Pipeline management
- Notes and history

### 6.3.4 B2C Upload
- Drag-drop CV upload
- Target role selection
- Analysis loading state
- Results display
- Upsell prompts

## 6.4 Component Standards

- All components typed with TypeScript
- Accessibility (ARIA labels, keyboard nav)
- Loading and error states
- Mobile responsive
- Dark mode support (future)

---

# 7. MOBILE STRATEGY

## 7.1 Approach

**Phase 1 (Current):** Progressive Web App (PWA)
- Responsive web design
- Service worker for offline
- Push notifications
- Add to home screen

**Phase 2 (Future):** React Native Apps
- iOS app (App Store)
- Android app (Play Store)
- Shared business logic

## 7.2 PWA Configuration

```json
{
  "name": "HireInbox",
  "short_name": "HireInbox",
  "description": "AI-Powered CV Screening",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0066CC",
  "background_color": "#FFFFFF",
  "icons": [
    {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

## 7.3 Mobile-Specific Features

| Feature | B2B | B2C |
|---------|-----|-----|
| Push notifications | New candidates | Analysis ready |
| Quick actions | Review candidates | Upload CV |
| Offline mode | View cached data | View saved analyses |
| Camera access | - | Record video |

## 7.4 Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | < 640px | Phones |
| Tablet | 640px - 1024px | Tablets |
| Desktop | > 1024px | Laptops/Desktops |

---

# 8. AI ARCHITECTURE

## 8.1 AI Agents Overview

| Agent | Purpose | Model | Trigger |
|-------|---------|-------|---------|
| CV Analysis Agent | Screen CVs, extract info, score | GPT-4o-mini (fine-tuned) | CV upload/email |
| Job Spec Agent | Interview employer, create role | GPT-4o | Role creation |
| Interview Agent | Conduct AI interviews | GPT-4o | Interview start |
| Video Analysis Agent | Analyze video interviews | Claude Vision | Video upload |
| Talent Intelligence Agent | Match candidates to roles | GPT-4o + Embeddings | Background |

## 8.2 CV Analysis Agent (V3 Brain)

### 8.2.1 Model Details
- **Base Model:** GPT-4o-mini
- **Fine-tuned Model ID:** `ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v3:CqlakGfJ`
- **Training Examples:** 6,000+ (South African recruitment context)
- **Context Window:** 128K tokens
- **Output Format:** Structured JSON

### 8.2.2 Input Schema
```json
{
  "cv_text": "Extracted CV text...",
  "role": {
    "title": "Senior Developer",
    "department": "Engineering",
    "criteria": {
      "min_experience_years": 5,
      "required_skills": ["Python", "Django"],
      "knockouts": ["Must have SA work permit"]
    }
  }
}
```

### 8.2.3 Output Schema
```json
{
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com",
  "candidate_phone": "+27 82 123 4567",
  "candidate_location": "Johannesburg",
  "current_title": "Software Engineer",
  "years_experience": 5,
  "education_level": "degree",

  "knockouts": {
    "passed": true,
    "results": [
      {"requirement": "5+ years experience", "status": "PASS", "evidence": "5 years at Company X"}
    ]
  },

  "ranking": {
    "experience_depth": {"score": 85, "evidence": "..."},
    "achievement_evidence": {"score": 70, "evidence": "..."},
    "skills_match": {"score": 90, "evidence": "..."},
    "trajectory": {"score": 80, "evidence": "..."},
    "culture_signals": {"score": 75, "evidence": "..."},
    "weighted_score": 82
  },

  "overall_score": 82,
  "recommendation": "SHORTLIST",

  "strengths": [
    {"strength": "Strong Python experience", "evidence": "5 years...", "impact": "Direct role match"}
  ],

  "concerns": [
    {"concern": "No AWS experience", "severity": "MEDIUM", "mitigation": "Can learn"}
  ],

  "risk_register": [
    {"risk": "Short tenure at last role", "severity": "LOW", "question": "Why did you leave..."}
  ],

  "interview_questions": [
    "Tell me about your experience with Django",
    "Describe a challenging project you led"
  ]
}
```

### 8.2.4 Scoring Calibration

| Score Range | Recommendation | Description |
|-------------|----------------|-------------|
| 80-100 | SHORTLIST | Strong match, interview immediately |
| 60-79 | CONSIDER | Potential, needs evaluation |
| 0-59 | REJECT | Does not meet requirements |

Exception rule: Candidates scoring 75-79 with strong trajectory or unique skills may be elevated to SHORTLIST.

## 8.3 Video Analysis Agent

### 8.3.1 Model
- **Provider:** Anthropic
- **Model:** Claude 3.5 Sonnet (Vision)
- **Input:** Video frames (sampled) + audio transcript

### 8.3.2 Analysis Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Communication | 25% | Clarity, articulation, pace |
| Body Language | 20% | Posture, eye contact, gestures |
| Confidence | 20% | Assertiveness, composure |
| Professionalism | 20% | Appearance, setting, demeanor |
| Content Quality | 15% | Relevance, structure, depth |

### 8.3.3 Output
```json
{
  "overall_score": 78,
  "dimensions": {
    "communication": {"score": 80, "feedback": "Clear articulation..."},
    "body_language": {"score": 75, "feedback": "Good eye contact..."},
    "confidence": {"score": 82, "feedback": "Speaks with assurance..."},
    "professionalism": {"score": 78, "feedback": "Appropriate setting..."},
    "content_quality": {"score": 72, "feedback": "Could structure better..."}
  },
  "strengths": ["Good eye contact", "Clear articulation"],
  "improvements": ["Reduce filler words", "More structured answers"],
  "coaching_tips": ["Practice STAR method", "Prepare 3-5 key stories"],
  "summary": "Solid interview presence with room for improvement..."
}
```

## 8.4 AI Safety & Quality

### 8.4.1 Bias Mitigation
- No demographic information in scoring
- Blind screening mode available
- Regular bias audits on outputs
- SA diversity context awareness
- Training data balanced across demographics

### 8.4.2 Quality Assurance
- Confidence scores on all outputs
- Flag low-confidence results for human review
- A/B testing for prompt changes
- Human-in-the-loop for edge cases
- Weekly model performance review

### 8.4.3 Error Handling
- Retry with exponential backoff
- Fallback to base model if fine-tuned unavailable
- Graceful degradation with user notification
- All errors logged with context

### 8.4.4 Cost Management
- Token usage tracking per request
- Daily/monthly budget alerts
- Automatic throttling at limits
- Usage dashboard for admins

---

# 9. JOBIXAI AGENT PLATFORM

## 9.1 Overview

JOBIXAI is HireInbox's AI Agent technology partner, founded by Shay Sinbeti and based in Cape Town, South Africa. JOBIXAI specializes in building and deploying AI agents and agentic systems for companies.

Through this partnership, HireInbox provides employers with autonomous "AI Staff Members" - intelligent agents that work alongside human HR teams to automate recruitment tasks. These agents operate 24/7, handling routine tasks while escalating complex decisions to human reviewers.

**Key Offerings:**
- **Standard Agents:** Pre-built recruitment agents included in subscription
- **Boutique AI Agents:** Custom-trained agents for R20,000/month per company
  - Trained on company-specific data (policies, culture, tone)
  - Understands company's unique requirements
  - Dedicated model per company

## 11.2 Agent Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        JOBIXAI ORCHESTRATOR                           │
│                    (Central Agent Management)                         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼────┐            ┌─────▼─────┐           ┌─────▼─────┐
   │ SCOUT   │            │ SCHEDULER │           │ INTERVIEWER│
   │ Agent   │            │   Agent   │           │   Agent    │
   │         │            │           │           │            │
   │• Source │            │• Calendar │           │• Conduct   │
   │• Screen │            │• Invites  │           │• Score     │
   │• Rank   │            │• Reminders│           │• Report    │
   └─────────┘            └───────────┘           └────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   ┌─────────┐            ┌─────────┐             ┌─────────┐
   │OUTREACH │            │ CHECKER │             │ ONBOARD │
   │  Agent  │            │  Agent  │             │  Agent  │
   │         │            │         │             │         │
   │• Email  │            │• ID     │             │• Docs   │
   │• WhatsApp│           │• Criminal│            │• Welcome│
   │• Follow-up│          │• Reference│           │• Setup  │
   └─────────┘            └─────────┘             └─────────┘
```

## 11.3 Available Agents

### 12.3.1 SCOUT Agent (CV Sourcing & Screening)

| Attribute | Value |
|-----------|-------|
| Name | Scout |
| Role | Talent Acquisition Specialist |
| Status | Active |
| Model | GPT-4o-mini (fine-tuned) |

**Capabilities:**
- Monitor email inbox for incoming CVs
- Extract text from PDF/DOC attachments
- Screen against role requirements
- Score and rank candidates
- Send acknowledgment emails
- Flag exceptional candidates

**Autonomous Actions:**
- Process CVs without human intervention
- Apply knockout criteria automatically
- Move candidates through pipeline stages
- Archive duplicate/spam submissions

**Escalation Triggers:**
- Score between 70-80 (borderline)
- Conflicting signals detected
- VIP referral source
- Unusual candidate profile

### 12.3.2 SCHEDULER Agent (Interview Coordination)

| Attribute | Value |
|-----------|-------|
| Name | Scheduler |
| Role | Interview Coordinator |
| Status | Planned |
| Model | GPT-4o |

**Capabilities:**
- Access employer calendar availability
- Send interview invitations
- Handle rescheduling requests
- Send reminders (24h, 1h before)
- Coordinate panel interviews
- Manage interview rooms/links

**Autonomous Actions:**
- Book interviews for shortlisted candidates
- Send calendar invites (Google, Outlook)
- Create video call links (Zoom, Teams, Meet)
- Handle time zone conversions
- Reschedule on request

**Escalation Triggers:**
- No availability within SLA
- Candidate requests accommodation
- Technical issues with booking
- VIP candidate

### 12.3.3 INTERVIEWER Agent (AI Interviews)

| Attribute | Value |
|-----------|-------|
| Name | Interviewer |
| Role | Screening Interviewer |
| Status | Planned |
| Model | GPT-4o + Whisper |

**Capabilities:**
- Conduct voice/video screening calls
- Ask role-specific questions
- Evaluate responses in real-time
- Score communication skills
- Generate interview transcript
- Produce summary report

**Interview Types:**
- Screening interview (10-15 min)
- Technical assessment (30 min)
- Behavioral interview (20 min)
- Language assessment (10 min)

**Autonomous Actions:**
- Schedule and conduct interview
- Record and transcribe
- Score responses
- Generate report
- Update candidate status

**Escalation Triggers:**
- Candidate requests human interviewer
- Technical difficulties
- Suspicious behavior detected
- Exceptional candidate

### 12.3.4 OUTREACH Agent (Candidate Communication)

| Attribute | Value |
|-----------|-------|
| Name | Outreach |
| Role | Candidate Engagement Specialist |
| Status | Planned |
| Model | GPT-4o |

**Capabilities:**
- Send personalized emails
- WhatsApp messaging
- SMS notifications
- Follow-up sequences
- Handle responses
- Answer FAQs

**Communication Templates:**
- Application acknowledgment
- Interview invitation
- Interview reminder
- Status update
- Rejection (compassionate)
- Offer letter
- Onboarding welcome

**Autonomous Actions:**
- Respond to basic queries
- Send scheduled follow-ups
- Update candidate preferences
- Track engagement metrics

**Escalation Triggers:**
- Salary negotiation
- Complex questions
- Complaints
- Legal queries

### 12.3.5 CHECKER Agent (Background Verification)

| Attribute | Value |
|-----------|-------|
| Name | Checker |
| Role | Verification Specialist |
| Status | Planned |
| Model | GPT-4o + External APIs |

**Capabilities:**
- ID verification (facial match)
- Criminal record check (SA)
- Qualification verification
- Employment history verification
- Reference collection
- Credit check (if applicable)

**Integration Partners:**
- Home Affairs (ID verification)
- SAPS (criminal records)
- SAQA (qualifications)
- Reference check platforms

**Autonomous Actions:**
- Initiate verification requests
- Collect reference responses
- Compile verification report
- Flag discrepancies

**Escalation Triggers:**
- Verification failure
- Discrepancy detected
- Unable to verify
- Candidate dispute

### 12.3.6 ONBOARD Agent (New Hire Onboarding)

| Attribute | Value |
|-----------|-------|
| Name | Onboard |
| Role | Onboarding Coordinator |
| Status | Future |
| Model | GPT-4o |

**Capabilities:**
- Send offer letter
- Collect signed documents
- Tax form collection (IRP5)
- Bank details verification
- Equipment requests
- Day 1 schedule
- Welcome messaging

**Autonomous Actions:**
- Send document requests
- Track document completion
- Set up system accounts
- Schedule orientation
- Assign onboarding buddy

## 11.4 Agent Configuration

### 12.4.1 Per-Company Settings

```typescript
interface AgentConfig {
  companyId: string;
  agents: {
    scout: {
      enabled: boolean;
      autoProcess: boolean;
      minScoreForShortlist: number;
      sendAcknowledgments: boolean;
      workingHours: { start: string; end: string };
    };
    scheduler: {
      enabled: boolean;
      autoSchedule: boolean;
      calendarIntegration: 'google' | 'outlook' | 'none';
      defaultInterviewDuration: number;
      bufferBetweenInterviews: number;
    };
    outreach: {
      enabled: boolean;
      channels: ('email' | 'whatsapp' | 'sms')[];
      responseTime: number; // minutes
      followUpSequence: boolean;
    };
    // ... other agents
  };
  globalSettings: {
    timezone: string;
    language: string;
    escalationEmail: string;
    brandVoice: string;
  };
}
```

### 12.4.2 Agent Permissions

| Permission | Scout | Scheduler | Interviewer | Outreach | Checker |
|------------|:-----:|:---------:|:-----------:|:--------:|:-------:|
| Read candidates | Y | Y | Y | Y | Y |
| Update candidates | Y | Y | Y | Y | Y |
| Move pipeline | Y | - | Y | - | - |
| Send emails | Y | Y | - | Y | Y |
| Send WhatsApp | - | Y | - | Y | - |
| Access calendar | - | Y | - | - | - |
| Conduct interview | - | - | Y | - | - |
| Initiate verification | - | - | - | - | Y |
| Create reports | Y | Y | Y | Y | Y |

## 11.5 Agent Activity Logging

### 12.5.1 Activity Log Table

```sql
CREATE TABLE agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  agent_type VARCHAR(50) NOT NULL, -- 'scout', 'scheduler', etc.
  action VARCHAR(100) NOT NULL,

  -- Context
  candidate_id UUID REFERENCES candidates(id),
  role_id UUID REFERENCES roles(id),

  -- Details
  input JSONB,
  output JSONB,
  decision TEXT,
  confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'escalated', 'failed'
  escalation_reason TEXT,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Performance
  tokens_used INTEGER,
  duration_ms INTEGER,
  cost_cents INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activities_company ON agent_activities(company_id);
CREATE INDEX idx_agent_activities_type ON agent_activities(agent_type);
CREATE INDEX idx_agent_activities_candidate ON agent_activities(candidate_id);
CREATE INDEX idx_agent_activities_status ON agent_activities(status);
```

### 12.5.2 Activity Types

| Agent | Activity | Description |
|-------|----------|-------------|
| Scout | cv_processed | CV analyzed and scored |
| Scout | candidate_shortlisted | Auto-moved to shortlist |
| Scout | candidate_rejected | Auto-rejected |
| Scout | acknowledgment_sent | Sent email to candidate |
| Scheduler | interview_scheduled | Booked interview |
| Scheduler | reminder_sent | Sent interview reminder |
| Scheduler | interview_rescheduled | Rescheduled interview |
| Interviewer | interview_conducted | Completed AI interview |
| Interviewer | report_generated | Created interview report |
| Outreach | email_sent | Sent communication |
| Outreach | response_handled | Replied to candidate |
| Checker | verification_initiated | Started background check |
| Checker | verification_completed | Check completed |

## 11.6 Agent Billing

### 12.6.1 Pricing Model

| Agent | Unit | Price (ZAR) |
|-------|------|-------------|
| Scout | Per CV processed | R5 |
| Scheduler | Per interview scheduled | R10 |
| Interviewer | Per interview conducted | R50 |
| Outreach | Per message sent | R1 |
| Checker (ID) | Per verification | R200 |
| Checker (Criminal) | Per check | R300 |
| Checker (Reference) | Per reference | R150 |

### 12.6.2 Subscription Bundles

| Bundle | Monthly (ZAR) | Includes |
|--------|---------------|----------|
| Starter | R299 | Scout (50 CVs) |
| Professional | R799 | Scout (200 CVs) + Scheduler |
| Business | R1,999 | All agents (500 CVs) |
| Enterprise | Custom | Unlimited + Custom agents |

## 11.7 Human-Agent Collaboration

### 12.7.1 Escalation Flow

```
Agent encounters trigger
        │
        ▼
┌───────────────┐
│ Log escalation│
│ with context  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Notify human  │
│ (in-app + email)│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Human reviews │
│ and decides   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Agent learns  │
│ from decision │
└───────────────┘
```

### 12.7.2 Override Controls

Humans can always:
- Pause any agent
- Reverse agent decisions
- Adjust agent thresholds
- Approve/reject escalations
- Review agent activity logs
- Set agent working hours
- Define escalation triggers

## 11.8 Agent Performance Metrics

### 12.8.1 Scout Metrics
- CVs processed per day
- Accuracy (vs human decisions)
- Time savings (hours saved)
- False positive rate
- False negative rate

### 12.8.2 Scheduler Metrics
- Interviews scheduled
- Reschedule rate
- No-show rate
- Candidate satisfaction
- Time to schedule

### 12.8.3 Interviewer Metrics
- Interviews conducted
- Completion rate
- Score correlation (vs human)
- Candidate feedback
- Technical issues

## 11.9 Future Roadmap

| Phase | Agents | Timeline |
|-------|--------|----------|
| Phase 1 | Scout (basic) | Live |
| Phase 2 | Scout (advanced), Scheduler | Q2 2026 |
| Phase 3 | Outreach, Checker | Q3 2026 |
| Phase 4 | Interviewer | Q4 2026 |
| Phase 5 | Onboard, Custom agents | 2027 |

---

# 10. AUTHENTICATION & SECURITY

## 11.1 Authentication Methods

| Method | Use Case | Implementation |
|--------|----------|----------------|
| Email/Password | Primary login | Supabase Auth |
| Magic Link | Passwordless option | Supabase Auth |
| Google OAuth | Social login | Supabase Auth |
| LinkedIn OAuth | Professional login | Supabase Auth |
| API Key | Machine-to-machine | Custom |

## 11.2 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Require uppercase | Yes |
| Require lowercase | Yes |
| Require number | Yes |
| Require special character | No (recommended) |
| Password history | Last 5 passwords |
| Maximum age | 90 days (optional) |
| Lockout threshold | 5 failed attempts |
| Lockout duration | 30 minutes |

## 11.3 Multi-Factor Authentication (MFA)

### 12.3.1 Supported Methods
- Time-based One-Time Password (TOTP)
- SMS OTP (backup)
- Recovery codes (10 single-use codes)

### 12.3.2 MFA Requirements
- Optional for all users
- Required for: Super Admins, Company Owners
- Prompted after suspicious activity

## 11.4 Session Security

| Parameter | Value |
|-----------|-------|
| Access token lifetime | 1 hour |
| Refresh token lifetime | 30 days |
| Max concurrent sessions | 5 |
| Session idle timeout | 30 minutes |
| Secure cookie | Yes |
| HttpOnly cookie | Yes |
| SameSite | Strict |

## 11.5 API Security

### 12.5.1 API Key Format
```
hi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
hi_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 12.5.2 API Key Storage
- Keys hashed with SHA-256 before storage
- Only prefix shown in UI
- Full key shown once on creation
- Keys can be rotated without downtime

## 11.6 Data Encryption

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| Database | AES-256 (Supabase) | TLS 1.3 |
| File storage | AES-256 (Supabase) | TLS 1.3 |
| API traffic | N/A | TLS 1.3 |
| Backups | AES-256 | TLS 1.3 |
| Sensitive fields | Application-level encryption | TLS 1.3 |

### 12.6.1 Sensitive Fields (Application-Level Encryption)
- API secrets
- OAuth tokens
- Payment card tokens
- MFA secrets

## 11.7 Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://*.supabase.co; frame-src https://js.stripe.com;
```

## 11.8 Input Validation

### 12.8.1 Validation Rules
- All inputs validated with Zod schemas
- Maximum input lengths enforced
- File type validation (magic bytes, not just extension)
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding, CSP)
- CSRF protection (SameSite cookies + tokens)

### 12.8.2 File Upload Validation
```typescript
const ALLOWED_CV_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
};
const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB
```

## 11.9 DDoS Protection

| Layer | Protection |
|-------|------------|
| Network | Cloudflare (automatic) |
| Application | Rate limiting |
| API | Per-endpoint limits |
| AI | Request queuing |

## 11.10 Security Monitoring

### 12.10.1 Monitored Events
- Failed login attempts
- Password changes
- MFA changes
- API key creation/deletion
- Unusual access patterns
- Data exports
- Admin actions

### 12.10.2 Alert Thresholds
| Event | Threshold | Action |
|-------|-----------|--------|
| Failed logins (same IP) | 10 in 5 min | Block IP, alert |
| Failed logins (same account) | 5 in 10 min | Lock account |
| Unusual country login | First time | Email notification |
| Bulk data export | Any | Log + notify admin |
| API key usage spike | 5x normal | Alert |

## 11.11 Penetration Testing

| Type | Frequency | Provider |
|------|-----------|----------|
| Automated scanning | Weekly | Internal |
| Manual pentest | Annually | External vendor |
| Bug bounty | Continuous | Planned |

---

# 11. PAYMENT PROCESSING

## 11.1 Payment Providers

### 12.1.1 Yoco (Primary - South Africa)
- Card payments (Visa, Mastercard)
- QR code payments
- Instant EFT
- Settlement: T+2

### 12.1.2 Stripe (International)
- Card payments (all major)
- Bank transfers
- Settlement: T+2

### 12.1.3 PayFast (Backup - SA)
- EFT payments
- Instant EFT
- Settlement: T+1

## 11.2 Pricing Structure

### 12.2.1 B2B Pricing (Employers)

| Product | Price (ZAR) | Price (USD) |
|---------|-------------|-------------|
| Job Listing (30 days) | R2,500 | $140 |
| Job Extension (30 days) | R1,500 | $85 |
| Premium Listing (featured) | R4,500 | $250 |
| ID Verification | R200 | $12 |
| Criminal Check | R300 | $17 |
| Reference Check | R400 | $23 |
| AI Interview Add-on | R500 | $28 |
| Bulk CV Screening (100) | R1,000 | $55 |

### 12.2.2 B2B Subscriptions

| Plan | Monthly (ZAR) | Annual (ZAR) | Features |
|------|---------------|--------------|----------|
| Starter | R299 | R2,990 | 50 CVs/mo, 2 roles |
| Professional | R799 | R7,990 | 200 CVs/mo, 10 roles |
| Business | R1,999 | R19,990 | 500 CVs/mo, unlimited roles |
| Enterprise | Custom | Custom | Custom limits, SLA |

### 12.2.3 B2C Pricing (Job Seekers)

| Product | Price (ZAR) | Description |
|---------|-------------|-------------|
| CV Analysis | Free (5/mo) | Basic analysis |
| Additional Analysis | R49 | Per analysis |
| CV Rewrite | R99 | AI-generated improved CV |
| Video Analysis | R79 | Interview coaching |
| Premium Bundle | R149 | Rewrite + Video + 3 analyses |

## 11.3 Payment Flow

### 12.3.1 One-Time Payment
```
1. User selects product
2. Create payment intent (server)
3. Display checkout (Yoco/Stripe widget)
4. User enters payment details
5. Process payment
6. Webhook confirms success
7. Fulfill order
8. Send receipt email
```

### 12.3.2 Subscription Flow
```
1. User selects plan
2. Create subscription (server)
3. Redirect to payment
4. User completes payment
5. Webhook confirms
6. Activate subscription
7. Schedule renewal
```

### 12.3.3 Invoice Flow (B2B)
```
1. Admin creates invoice
2. Email sent to company
3. Company clicks pay link
4. Redirect to checkout
5. Payment processed
6. Invoice marked paid
7. Receipt generated
```

## 11.4 Refund Policy

| Scenario | Refund |
|----------|--------|
| Service not delivered | Full refund |
| Within 24 hours | Full refund |
| Within 7 days | 50% refund |
| After 7 days | No refund |
| Subscription (unused portion) | Pro-rata refund |

## 11.5 Tax Handling

### 12.5.1 South Africa (VAT)
- VAT Rate: 15%
- VAT Number: Required for invoices
- B2B: VAT inclusive pricing
- B2C: VAT inclusive pricing

### 12.5.2 International
- No VAT charged
- Customer responsible for local taxes

## 11.6 PCI Compliance

| Requirement | Implementation |
|-------------|----------------|
| Card data storage | Never stored (tokenized) |
| Payment page | Hosted by Yoco/Stripe |
| PCI scope | SAQ-A (minimal) |
| Annual assessment | Self-assessment questionnaire |

## 11.7 Failed Payment Handling

### 12.7.1 One-Time Payments
```
Attempt 1: Immediate
→ Failure: Show error, suggest retry
→ Log failure reason
```

### 12.7.2 Subscriptions
```
Attempt 1: Due date
Attempt 2: Due + 3 days (email warning)
Attempt 3: Due + 7 days (email warning)
Attempt 4: Due + 14 days (email warning)
→ Failure: Suspend subscription, notify
→ Grace period: 7 days to reactivate
→ After grace: Cancel subscription
```

---

# 11. FILE HANDLING

## 12.1 Supported File Types

| Type | Extensions | Max Size | Use Case |
|------|------------|----------|----------|
| CV/Resume | PDF, DOC, DOCX, TXT | 10 MB | CV upload |
| Video | MP4, WebM, MOV | 100 MB | Video interview |
| Image | PNG, JPG, JPEG, GIF | 5 MB | Profile, logo |
| Export | CSV, XLSX, PDF | Generated | Data export |

## 12.2 Upload Flow

```
1. Client requests signed upload URL
2. Server validates user/limits
3. Server generates presigned URL (Supabase)
4. Client uploads directly to storage
5. Client notifies server of completion
6. Server validates file (type, size, virus)
7. Server processes file (extract text, etc.)
8. Server updates database with file URL
9. Return success response
```

## 12.3 CV Processing Pipeline

```
1. Upload received
2. File type validation (magic bytes)
3. Size validation (< 10MB)
4. Virus scan (ClamAV)
5. Text extraction:
   - PDF: pdf-parse library
   - DOC/DOCX: mammoth library
   - TXT: direct read
6. Store extracted text
7. Generate file hash (SHA-256)
8. Check for duplicates (hash match)
9. Trigger AI analysis
10. Update candidate record
```

## 12.4 Video Processing

```
1. Upload received
2. Format validation
3. Duration check (max 10 minutes)
4. Size check (max 100MB)
5. Store original
6. Extract audio (FFmpeg)
7. Transcribe audio (Whisper)
8. Sample frames for analysis
9. Trigger video analysis (Claude)
10. Store results
```

## 12.5 Storage Structure

```
storage/
├── companies/{company_id}/
│   ├── logo/
│   │   └── logo.png
│   └── exports/
│       └── {date}/
├── candidates/{candidate_id}/
│   ├── cv/
│   │   └── {filename}.pdf
│   └── videos/
│       └── {interview_id}.mp4
├── users/{user_id}/
│   ├── avatar/
│   │   └── avatar.jpg
│   └── cvs/
│       └── {analysis_id}/
└── temp/
    └── uploads/
        └── {upload_id}/
```

## 12.6 File Retention

| File Type | Retention | Deletion |
|-----------|-----------|----------|
| CVs | 2 years from last activity | Automatic |
| Videos | 1 year from upload | Automatic |
| Exports | 7 days | Automatic |
| Temp uploads | 24 hours | Automatic |
| User-deleted | 30 days (recoverable) | Permanent after |

## 12.7 Virus Scanning

| Scanner | Integration | When |
|---------|-------------|------|
| ClamAV | Server-side | All uploads |
| Supabase | Built-in | Storage layer |

Infected files are:
1. Quarantined immediately
2. Logged with details
3. User notified
4. Admin alerted

---

# 12. NOTIFICATIONS & MESSAGING

## 13.1 Notification Types

| Type | Channels | Trigger |
|------|----------|---------|
| New Application | In-app, Email | CV received |
| Analysis Complete | In-app, Email | AI analysis done |
| Interview Scheduled | Email, WhatsApp, SMS | Interview created |
| Interview Reminder | Email, WhatsApp, SMS | 24h and 1h before |
| Status Change | Email | Candidate moved |
| Application Received | Email | Ack to candidate |
| Rejection | Email | Candidate rejected |
| Payment Success | Email | Payment confirmed |
| Payment Failed | Email | Payment failed |
| Subscription Expiring | Email | 7 days before |
| Team Invite | Email | New team member |
| Weekly Digest | Email | Weekly summary |

## 13.2 Channel Configuration

### 14.2.1 Email (SendGrid)
```typescript
{
  provider: 'sendgrid',
  from: 'HireInbox <notifications@hireinbox.co.za>',
  replyTo: 'support@hireinbox.co.za',
  templates: {
    application_received: 'd-abc123...',
    interview_scheduled: 'd-def456...',
    // ...
  }
}
```

### 14.2.2 WhatsApp (360Dialog)
```typescript
{
  provider: '360dialog',
  from: '+27xxxxxxxxxx',
  templates: {
    interview_reminder: {
      name: 'interview_reminder_v1',
      language: 'en'
    }
  }
}
```

### 14.2.3 SMS (Twilio)
```typescript
{
  provider: 'twilio',
  from: '+27xxxxxxxxxx',
  maxLength: 160
}
```

## 13.3 Email Templates

All emails follow HireInbox brand guidelines:
- Logo in header
- Clean, professional layout
- Clear call-to-action
- Unsubscribe link
- Physical address (POPIA)

## 13.4 Notification Preferences

Users can configure:
- Email notifications (per type)
- WhatsApp notifications
- SMS notifications
- Push notifications (PWA)
- Digest frequency (immediate, daily, weekly)
- Quiet hours

## 13.5 Delivery Tracking

All notifications logged with:
- Delivery status
- Open tracking (email)
- Click tracking (email)
- Failure reason
- Retry count

---

# 13. BACKGROUND JOBS & QUEUES

## 14.1 Job Types

| Job | Trigger | Priority | Timeout |
|-----|---------|----------|---------|
| Email Fetch | Cron (5 min) | High | 2 min |
| CV Analysis | CV upload | High | 1 min |
| Video Analysis | Video upload | Medium | 5 min |
| Send Email | Event | High | 30 sec |
| Send SMS | Event | High | 30 sec |
| Invoice Generation | Payment | High | 30 sec |
| Report Generation | User request | Low | 5 min |
| Data Export | User request | Low | 10 min |
| Cleanup | Cron (daily) | Low | 30 min |
| Usage Reset | Cron (monthly) | Medium | 5 min |

## 14.2 Implementation

### 15.2.1 Vercel Cron Jobs (MVP)
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/fetch-emails",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-digests",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/reset-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### 15.2.2 Future: BullMQ
For scale, migrate to proper queue:
- Redis-backed
- Retry with backoff
- Priority queues
- Rate limiting
- Dashboard

## 14.3 Job Status Tracking

```sql
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  priority INTEGER DEFAULT 0,
  payload JSONB,
  result JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 60000,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 14.4 Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000, // 1 second
  maxDelay: 60000,    // 1 minute
  factor: 2
};

// Delays: 1s, 2s, 4s
```

---

# 14. SEARCH & FILTERING

## 15.1 Candidate Search

### 16.1.1 Full-Text Search
```sql
SELECT * FROM candidates
WHERE
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(cv_text, '')
  ) @@ plainto_tsquery('english', :search_term)
  AND company_id = :company_id
ORDER BY
  ts_rank(to_tsvector('english', cv_text), plainto_tsquery('english', :search_term)) DESC,
  score DESC;
```

### 16.1.2 Filter Options

| Filter | Type | Options |
|--------|------|---------|
| Status | Multi-select | new, screening, shortlist, interview, offer, hired, rejected |
| Score | Range | 0-100 |
| Recommendation | Multi-select | SHORTLIST, CONSIDER, REJECT |
| Date Applied | Date range | From - To |
| Role | Select | Role dropdown |
| Source | Multi-select | email, upload, talent_pool |
| Starred | Boolean | Yes/No |
| Location | Text | Free text |
| Skills | Multi-select | From CV analysis |

### 16.1.3 Sort Options
- Score (highest first)
- Date applied (newest first)
- Name (alphabetical)
- Status
- Last updated

## 15.2 Role Search

| Filter | Type | Options |
|--------|------|---------|
| Status | Multi-select | draft, active, paused, closed |
| Department | Select | Department dropdown |
| Employment Type | Multi-select | full-time, part-time, contract |
| Work Mode | Multi-select | onsite, hybrid, remote |
| Date Created | Date range | From - To |

## 15.3 Talent Pool Search (Future)

### 16.3.1 Semantic Search with pgvector
```sql
-- Generate embedding for search query
-- Search by vector similarity
SELECT
  cp.*,
  1 - (cv_embedding <=> :query_embedding) as similarity
FROM candidate_profiles cp
WHERE
  talent_pool_opted_in = true
  AND (1 - (cv_embedding <=> :query_embedding)) > 0.7
ORDER BY similarity DESC
LIMIT 20;
```

---

# 15. ANALYTICS & REPORTING

## 16.1 Business Metrics

### 17.1.1 Platform Metrics (Admin)
- Total users (by type)
- New signups (daily, weekly, monthly)
- Active users (DAU, WAU, MAU)
- CVs processed
- Revenue (MRR, ARR)
- Churn rate
- Conversion rate

### 17.1.2 Company Metrics (B2B)
- CVs screened
- Shortlist rate
- Time to hire
- Cost per hire
- Pipeline velocity
- Source effectiveness

### 17.1.3 Candidate Metrics (B2C)
- Analyses completed
- Score improvement
- Video analyses
- Feature adoption

## 16.2 Dashboards

### 17.2.1 Employer Dashboard
- Today's stats (new CVs, shortlisted, interviews)
- Weekly trend chart
- Role performance
- Recent activity

### 17.2.2 Admin Dashboard
- Platform overview
- Revenue chart
- User growth
- System health
- AI usage

## 16.3 Reports

| Report | Frequency | Recipients |
|--------|-----------|------------|
| Daily Summary | Daily | Company owners |
| Weekly Digest | Weekly | All HR users |
| Monthly Report | Monthly | Company owners |
| Platform Report | Monthly | HireInbox team |

## 16.4 Data Export

| Format | Use Case |
|--------|----------|
| CSV | Spreadsheet analysis |
| XLSX | Excel with formatting |
| PDF | Presentation/print |
| JSON | API integration |

## 16.5 Event Tracking

| Event | Properties |
|-------|------------|
| page_view | url, referrer |
| cv_uploaded | file_type, size |
| cv_analyzed | score, duration |
| candidate_moved | from_status, to_status |
| role_created | department, type |
| payment_completed | amount, product |

---

# 16. THIRD-PARTY INTEGRATIONS

## 17.1 Current Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Database, Auth, Storage | Active |
| OpenAI | CV Analysis AI | Active |
| Anthropic | Video Analysis | Active |
| SendGrid | Email delivery | Active |
| Cloudflare | DNS, CDN, Security | Active |

## 17.2 Planned Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| Yoco | SA Payments | High |
| Stripe | International Payments | High |
| 360Dialog | WhatsApp Business | High |
| Twilio | SMS | Medium |
| Calendly | Interview scheduling | Medium |
| Google Calendar | Calendar sync | Medium |
| Microsoft Teams | Notifications | Low |
| Slack | Notifications | Low |
| LinkedIn | Profile import | Low |
| BambooHR | ATS sync | Low |
| Sage | Payroll export | Low |

## 17.3 Webhook System

### 18.3.1 Outgoing Webhooks

Events companies can subscribe to:
```
candidate.created
candidate.analyzed
candidate.status_changed
candidate.shortlisted
role.published
role.closed
interview.scheduled
interview.completed
payment.succeeded
payment.failed
```

Webhook payload:
```json
{
  "event": "candidate.shortlisted",
  "timestamp": "2026-01-15T10:00:00Z",
  "data": {
    "candidate_id": "uuid",
    "role_id": "uuid",
    "score": 85,
    "recommendation": "SHORTLIST"
  },
  "company_id": "uuid"
}
```

### 18.3.2 Webhook Security
- HMAC-SHA256 signature
- Timestamp validation (< 5 minutes)
- Retry with exponential backoff
- Dead letter queue

### 18.3.3 Incoming Webhooks

| Source | Events |
|--------|--------|
| Yoco | payment.succeeded, payment.failed |
| Stripe | invoice.paid, subscription.updated |
| SendGrid | email.delivered, email.bounced |

## 17.4 API Integration Guidelines

For companies integrating with HireInbox:

1. **Authentication**: API keys with scopes
2. **Rate limits**: Standard limits apply
3. **Webhooks**: For real-time events
4. **Sandbox**: Test environment available
5. **Documentation**: OpenAPI/Swagger spec
6. **Support**: Integration support team

---

# 17. MULTI-TENANCY

## 18.1 Tenant Isolation

### 19.1.1 Database Level
- All tables include `company_id`
- Row-Level Security (RLS) enforced
- No cross-tenant queries possible

### 19.1.2 Application Level
- Company context loaded on auth
- All queries scoped to company
- Middleware validates tenant access

### 19.1.3 Storage Level
- Files organized by company_id
- Access policies per company
- No cross-company file access

## 18.2 Row-Level Security Policies

```sql
-- Companies: users only see their company
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Candidates: users only see company's candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view company candidates" ON candidates
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Similar policies for all tables...
```

## 18.3 Tenant Limits

| Resource | Starter | Professional | Business | Enterprise |
|----------|---------|--------------|----------|------------|
| CVs/month | 50 | 200 | 500 | Custom |
| Active roles | 2 | 10 | Unlimited | Unlimited |
| Team members | 3 | 10 | 25 | Unlimited |
| Storage | 1 GB | 5 GB | 20 GB | Custom |
| API requests/day | 1,000 | 10,000 | 50,000 | Custom |

## 18.4 Fair Use Enforcement

```typescript
async function checkQuota(companyId: string, resource: string): Promise<boolean> {
  const company = await getCompany(companyId);
  const limits = PLAN_LIMITS[company.subscription_tier];
  const usage = await getUsage(companyId, resource);

  if (usage >= limits[resource]) {
    await logQuotaExceeded(companyId, resource);
    return false;
  }

  return true;
}
```

---

# 18. INTERNATIONALIZATION & LOCALIZATION

## 19.1 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English (SA) | en-ZA | Primary |
| Afrikaans | af-ZA | Planned |
| Zulu | zu-ZA | Planned |
| Xhosa | xh-ZA | Planned |

## 19.2 Locale Settings

| Setting | Default |
|---------|---------|
| Timezone | Africa/Johannesburg |
| Date format | DD/MM/YYYY |
| Time format | HH:mm |
| Currency | ZAR |
| Number format | 1 234 567,89 |

## 19.3 Content Translation

### 20.3.1 UI Strings
```typescript
// lib/i18n/en-ZA.ts
export const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
  },
  candidates: {
    title: 'Candidates',
    shortlist: 'Shortlist',
    reject: 'Reject',
  }
};
```

### 20.3.2 Email Templates
- Separate templates per language
- Fallback to English

### 20.3.3 AI Responses
- English only (training data)
- Clear, professional language
- SA-specific terminology

## 19.4 Currency Support

| Currency | Code | Symbol | Countries |
|----------|------|--------|-----------|
| South African Rand | ZAR | R | South Africa |
| US Dollar | USD | $ | International |
| Euro | EUR | € | EU |
| British Pound | GBP | £ | UK |

---

# 19. ACCESSIBILITY

## 20.1 Standards

- WCAG 2.1 Level AA compliance
- Section 508 compliance
- Keyboard navigation
- Screen reader support

## 20.2 Implementation

### 21.2.1 Semantic HTML
```html
<main role="main">
  <nav aria-label="Main navigation">...</nav>
  <section aria-labelledby="candidates-title">
    <h1 id="candidates-title">Candidates</h1>
    ...
  </section>
</main>
```

### 21.2.2 ARIA Labels
```html
<button aria-label="Close modal" aria-pressed="false">
  <span aria-hidden="true">&times;</span>
</button>
```

### 21.2.3 Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Focus indicators visible
- Escape to close modals
- Enter to submit forms

### 21.2.4 Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Don't rely on color alone

## 20.3 Testing

| Tool | Purpose |
|------|---------|
| axe-core | Automated testing |
| WAVE | Browser extension |
| VoiceOver | Screen reader (macOS) |
| NVDA | Screen reader (Windows) |
| Lighthouse | Performance + a11y |

## 20.4 Accessibility Statement

Published at `/accessibility` with:
- Compliance status
- Known issues
- Contact for assistance
- Feedback mechanism

---

# 20. NON-FUNCTIONAL REQUIREMENTS

## 21.1 Performance

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load (LCP) | < 2.5s | < 4s |
| Time to Interactive | < 3.8s | < 7.3s |
| First Input Delay | < 100ms | < 300ms |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| API Response (p50) | < 200ms | < 500ms |
| API Response (p95) | < 500ms | < 1000ms |
| AI Analysis | < 30s | < 60s |
| Video Analysis | < 60s | < 120s |

## 21.2 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Planned Downtime | < 4 hours/month |
| RTO (Recovery Time) | < 1 hour |
| RPO (Data Loss) | < 1 hour |

## 21.3 Scalability

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Total CVs | 100K | 500K | 2M |
| CVs/Day | 1K | 5K | 20K |
| Companies | 100 | 500 | 2K |
| Candidates | 10K | 50K | 200K |
| Concurrent Users | 500 | 2K | 10K |

## 21.4 Security

- POPIA compliance (required)
- SOC 2 Type 1 (Year 2)
- ISO 27001 (Year 3)
- Annual penetration testing
- Continuous vulnerability scanning

## 21.5 Reliability

- Automated failover
- Database replication
- CDN for static assets
- Graceful degradation
- Circuit breakers for external services

---

# 21. TESTING STRATEGY

## 22.1 Testing Pyramid

```
          /\
         /  \        E2E Tests (10%)
        /----\       - Critical user flows
       /      \      - Playwright
      /--------\     Integration Tests (30%)
     /          \    - API endpoints
    /------------\   - Database operations
   /              \  Unit Tests (60%)
  /----------------\ - Utilities, hooks
                     - Components
```

## 22.2 Coverage Targets

| Area | Target | Minimum |
|------|--------|---------|
| Utilities | 90% | 80% |
| API Routes | 80% | 70% |
| Components | 70% | 60% |
| E2E Critical Paths | 100% | 100% |
| Overall | 75% | 65% |

## 22.3 Testing Tools

| Type | Tool |
|------|------|
| Unit | Vitest |
| Component | React Testing Library |
| E2E | Playwright |
| API | Supertest |
| Mocking | MSW (Mock Service Worker) |
| Visual | Percy (planned) |

## 22.4 Critical E2E Flows

1. **Employer Journey**
   - Register → Create company → Create role → Receive CV → View analysis → Move to shortlist

2. **Candidate Journey**
   - Register → Upload CV → View analysis → Purchase video → Record video → View feedback

3. **Admin Journey**
   - Login → View metrics → View company → Suspend company

4. **Payment Flow**
   - Select product → Checkout → Payment → Confirmation → Receipt

## 22.5 Test Data

- Seed data for development
- Factory functions for tests
- Anonymized production snapshots (staging)

## 22.6 CI/CD Integration

```yaml
# Run on every PR
- lint
- type-check
- unit-tests
- integration-tests
- build

# Run on merge to main
- all above
- e2e-tests
- deploy-staging
- smoke-tests
- deploy-production
```

---

# 22. DEPLOYMENT & DEVOPS

## 23.1 Environments

| Environment | URL | Purpose | Auto-deploy |
|-------------|-----|---------|-------------|
| Development | localhost:3000 | Local dev | N/A |
| Preview | pr-*.vercel.app | PR review | Yes (PR) |
| Staging | staging.hireinbox.co.za | Testing | Yes (main) |
| Production | hireinbox.co.za | Live | Manual |

## 23.2 CI/CD Pipeline

```
1. Push to branch
2. Lint (ESLint, Prettier)
3. Type check (TypeScript)
4. Unit tests (Vitest)
5. Integration tests
6. Build application
7. Deploy to preview (on PR)
8. E2E tests (Playwright)
9. Security scan
10. Manual approval
11. Deploy to production (on merge to main)
12. Post-deploy smoke tests
13. Notify team
```

## 23.3 Infrastructure

| Component | Service | Region |
|-----------|---------|--------|
| Hosting | Vercel | Global (Edge) |
| Database | Supabase | eu-west-1 |
| Storage | Supabase | eu-west-1 |
| CDN | Vercel Edge | Global |
| DNS | Cloudflare | Global |
| SSL | Cloudflare/Vercel | Automatic |

## 23.4 Environment Variables

```bash
# ========== Database ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# ========== AI ==========
OPENAI_API_KEY=sk-xxx
OPENAI_FINE_TUNED_MODEL=ft:gpt-4o-mini-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# ========== Email ==========
GMAIL_USER=xxx@hireinbox.co.za
GMAIL_APP_PASSWORD=xxx
SENDGRID_API_KEY=SG.xxx

# ========== Payments ==========
YOCO_SECRET_KEY=sk_live_xxx
YOCO_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ========== Messaging ==========
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+27xxx
DIALOG360_API_KEY=xxx
DIALOG360_PARTNER_ID=xxx

# ========== Monitoring ==========
SENTRY_DSN=https://xxx@sentry.io/xxx
LOGTAIL_SOURCE_TOKEN=xxx

# ========== Application ==========
NEXT_PUBLIC_APP_URL=https://hireinbox.co.za
NEXT_PUBLIC_API_URL=https://api.hireinbox.co.za
NODE_ENV=production
```

## 23.5 Deployment Checklist

Pre-deployment:
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmark acceptable
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Feature flags configured
- [ ] Monitoring alerts configured

Post-deployment:
- [ ] Smoke tests passing
- [ ] Error rates normal
- [ ] Performance normal
- [ ] Team notified
- [ ] Release notes published

---

# 23. MONITORING & OBSERVABILITY

## 24.1 Metrics

### 25.1.1 Business Metrics
- Daily Active Users (DAU)
- CVs uploaded
- CVs analyzed
- Conversion rate (free → paid)
- Revenue (daily, monthly)
- Churn rate

### 25.1.2 Technical Metrics
- Request rate
- Error rate
- Response time (p50, p95, p99)
- AI processing time
- Database query time
- Storage usage
- Memory usage
- CPU usage

## 24.2 Logging

### 25.2.1 Log Levels
- ERROR: System errors, failures
- WARN: Potential issues, deprecations
- INFO: Important events, milestones
- DEBUG: Detailed debugging (dev only)

### 25.2.2 Log Format
```json
{
  "timestamp": "2026-01-15T10:00:00.000Z",
  "level": "INFO",
  "service": "hireinbox-api",
  "message": "CV analysis completed",
  "context": {
    "request_id": "req_abc123",
    "candidate_id": "uuid",
    "score": 85,
    "duration_ms": 15000,
    "user_id": "uuid",
    "company_id": "uuid"
  }
}
```

### 25.2.3 Structured Logging
```typescript
logger.info('CV analysis completed', {
  candidateId: candidate.id,
  score: result.score,
  durationMs: Date.now() - startTime
});
```

## 24.3 Alerting

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| High Error Rate | > 5% in 5 min | Critical | Slack, SMS |
| Slow Response | p95 > 2s for 5 min | Warning | Slack |
| AI Failures | > 3 in 10 min | Critical | Slack |
| Database Down | Connection failed | Critical | Slack, SMS, Call |
| Payment Failures | > 5 in 1 hour | Critical | Slack, SMS |
| Disk Usage | > 80% | Warning | Slack |
| Memory Usage | > 90% | Critical | Slack |

## 24.4 Tools

| Purpose | Tool |
|---------|------|
| APM | Vercel Analytics |
| Error Tracking | Sentry |
| Logging | Vercel Logs / Logtail |
| Uptime | UptimeRobot |
| Performance | Vercel Web Vitals |

## 24.5 Dashboards

### 25.5.1 Operations Dashboard
- System health
- Error rates
- Response times
- Active users
- Queue depths

### 25.5.2 Business Dashboard
- Revenue
- Signups
- Conversions
- Usage metrics

---

# 24. ERROR HANDLING

## 25.1 Error Categories

| Category | Example | HTTP | User Message |
|----------|---------|------|--------------|
| Validation | Invalid email | 400 | "Please enter a valid email" |
| Authentication | Invalid token | 401 | "Please log in again" |
| Authorization | No permission | 403 | "You don't have access" |
| Not Found | Missing record | 404 | "Item not found" |
| Conflict | Duplicate | 409 | "This already exists" |
| Rate Limited | Too many requests | 429 | "Please try again later" |
| Payment | Card declined | 402 | "Payment failed" |
| External | OpenAI down | 503 | "Service temporarily unavailable" |
| Internal | Bug | 500 | "Something went wrong" |

## 25.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_format"
      }
    ],
    "request_id": "req_abc123",
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

## 25.3 Retry Strategy

```typescript
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  retryCondition: (error: Error) => {
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.status >= 500;
  }
};
```

## 25.4 Circuit Breaker

```typescript
const circuitBreaker = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds open
  monitor: {
    onOpen: () => logger.warn('Circuit opened'),
    onClose: () => logger.info('Circuit closed'),
    onHalfOpen: () => logger.info('Circuit half-open')
  }
};
```

## 25.5 Graceful Degradation

| Service Failure | Degradation |
|-----------------|-------------|
| OpenAI | Show "Analysis delayed" |
| SendGrid | Queue for retry |
| Yoco | Show alternative payment |
| Supabase Storage | Disable uploads temporarily |

---

# 25. DISASTER RECOVERY & BUSINESS CONTINUITY

## 26.1 Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Continuous | 30 days | Supabase (multi-region) |
| Database Snapshot | Daily | 90 days | Supabase |
| File Storage | Continuous | 30 days | Supabase |
| Logs | Real-time | 30 days | Logtail |
| Config/Secrets | On change | Unlimited | Git + Vault |

## 26.2 Recovery Procedures

### 27.2.1 Database Recovery
```
1. Identify point of failure
2. Stop writes to affected tables
3. Restore from backup (point-in-time)
4. Validate data integrity
5. Resume operations
6. Post-mortem
```

### 27.2.2 Application Recovery
```
1. Identify failing deployment
2. Rollback to previous version (Vercel)
3. Validate functionality
4. Investigate root cause
5. Fix and redeploy
```

### 27.2.3 Complete Outage Recovery
```
1. Activate incident response
2. Communicate to users (status page)
3. Identify cause
4. Execute recovery plan
5. Validate all systems
6. Resume operations
7. Post-mortem within 48 hours
```

## 26.3 RPO & RTO Targets

| Scenario | RPO | RTO |
|----------|-----|-----|
| Database corruption | 5 minutes | 1 hour |
| Application failure | 0 | 5 minutes |
| Region failure | 1 hour | 4 hours |
| Complete disaster | 1 hour | 24 hours |

## 26.4 Business Continuity

### 27.4.1 Critical Functions
1. CV screening (B2B)
2. Payment processing
3. User authentication
4. Data access

### 27.4.2 Continuity Measures
- Multi-region database (Supabase)
- CDN for static assets
- Cached AI responses
- Manual processing fallback

## 26.5 Incident Response

### 27.5.1 Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 | Complete outage | 15 minutes | Immediate |
| P2 | Major feature down | 1 hour | 30 minutes |
| P3 | Minor feature affected | 4 hours | 2 hours |
| P4 | Cosmetic/low impact | 24 hours | 8 hours |

### 27.5.2 Communication
- Status page: status.hireinbox.co.za
- Email to affected users
- Twitter updates
- In-app banner

---

# 26. DATA MIGRATION & VERSIONING

## 27.1 Database Migrations

### 29.1.1 Migration Tools
- Supabase CLI
- Version-controlled migrations
- Rollback support

### 29.1.2 Migration Process
```bash
# Create migration
supabase migration new add_feature_x

# Edit migration file
# migrations/20260115100000_add_feature_x.sql

# Apply to local
supabase db reset

# Apply to production
supabase db push
```

### 29.1.3 Migration Best Practices
- Always include rollback
- Test on staging first
- Schedule during low traffic
- Monitor after deployment
- Small, incremental changes

## 27.2 API Versioning

### 29.2.1 Strategy
- Version in URL path: `/api/v1/`, `/api/v2/`
- Support current and previous version (N-1)
- 6-month deprecation notice
- Sunset dates clearly communicated

### 29.2.2 Version Lifecycle
```
v1 Released → v2 Released → v1 Deprecated → v1 Sunset
    |             |              |              |
    Day 0       Day 180        Day 360        Day 540
```

## 27.3 Breaking Change Policy

1. Announce in changelog
2. Email affected API users
3. Update documentation
4. Provide migration guide
5. Support old version for 6 months
6. Sunset old version with notice

## 27.4 Feature Flags

```typescript
const FEATURE_FLAGS = {
  new_dashboard: {
    enabled: true,
    rollout: 100, // percentage
    allowlist: ['company_1', 'company_2']
  },
  video_analysis_v2: {
    enabled: false,
    rollout: 0
  }
};
```

---

# 27. COMPLIANCE & LEGAL

## 29.1 POPIA Compliance (South Africa)

### 29.1.1 Requirements

| Requirement | Implementation |
|-------------|----------------|
| Consent | Explicit checkbox on registration |
| Purpose Specification | Clear privacy policy |
| Processing Limitation | Only collect necessary data |
| Information Quality | Allow profile updates |
| Openness | Privacy policy accessible |
| Security Safeguards | Encryption, access controls |
| Data Subject Participation | Export, delete features |
| Accountability | DPO appointed, audits |

### 29.1.2 Consent Management
```typescript
interface Consent {
  type: 'terms' | 'privacy' | 'marketing' | 'talent_pool';
  given: boolean;
  givenAt: Date;
  version: string;
  ip: string;
}
```

### 29.1.3 Data Subject Rights
- Right to access: Export all personal data
- Right to correction: Edit profile
- Right to deletion: Delete account
- Right to object: Opt-out of processing
- Right to portability: Download in standard format

### 29.1.4 Data Breach Response
```
1. Detect breach (automated monitoring)
2. Contain breach (< 1 hour)
3. Assess impact (< 4 hours)
4. Notify Information Regulator (< 72 hours)
5. Notify affected users (< 72 hours)
6. Document and learn
```

## 29.2 Data Retention

| Data Type | Retention | Legal Basis |
|-----------|-----------|-------------|
| User accounts | Until deletion | Contract |
| CVs | 2 years after last activity | Legitimate interest |
| Analysis results | 2 years | Legitimate interest |
| Payment records | 7 years | Tax law |
| Audit logs | 7 years | Compliance |
| Backups | 90 days | Business continuity |
| Marketing preferences | Until withdrawn | Consent |

## 29.3 Data Processing Agreements

| Processor | Data Processed | DPA Status |
|-----------|----------------|------------|
| Supabase | All data | Signed |
| OpenAI | CV text | Signed |
| Anthropic | Video content | Signed |
| SendGrid | Email addresses | Signed |
| Yoco | Payment data | Signed |

## 29.4 International Considerations

### 29.4.1 GDPR (if EU expansion)
- Additional consent requirements
- DPO appointment
- EU representative
- 72-hour breach notification

### 29.4.2 Data Localization
- Primary data in EU (Supabase)
- AI processing via API (data not stored)
- Backups in same region

## 29.5 Employment Law Considerations

- No automated decision-making only (human review required)
- No discriminatory criteria in AI
- Transparent scoring methodology
- Audit trail for all decisions
- Equal opportunity compliance

## 29.6 Terms of Service

Key provisions:
- Acceptable use policy
- User responsibilities
- Limitation of liability
- Dispute resolution (SA jurisdiction)
- Termination rights

## 29.7 Privacy Policy

Required disclosures:
- Data collected
- How data is used
- Data sharing (third parties)
- Data retention
- User rights
- Contact information
- Cookie policy

---

# 29. APPENDICES

## 29.1 Glossary

| Term | Definition |
|------|------------|
| ATS | Applicant Tracking System |
| B2B | Business-to-Business (Employer features) |
| B2C | Business-to-Consumer (Job seeker features) |
| CV | Curriculum Vitae / Resume |
| DPA | Data Processing Agreement |
| DPO | Data Protection Officer |
| JWT | JSON Web Token |
| Knockout | Hard requirement that auto-rejects if not met |
| LCP | Largest Contentful Paint |
| MFA | Multi-Factor Authentication |
| POPIA | Protection of Personal Information Act |
| PWA | Progressive Web App |
| RLS | Row-Level Security |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SLA | Service Level Agreement |
| Talent Pool | Opted-in candidates available for matching |
| TOTP | Time-based One-Time Password |
| WCAG | Web Content Accessibility Guidelines |

## 29.2 References

- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- OpenAI API Reference: https://platform.openai.com/docs
- Anthropic API Reference: https://docs.anthropic.com
- POPIA Guidelines: https://popia.co.za
- Yoco API: https://developer.yoco.com
- Stripe API: https://stripe.com/docs

## 29.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | HireInbox Team | Initial release |
| 2.0 | 2026-01-21 | HireInbox Team | Added Security, Payments, DR, Accessibility, Mobile, Analytics sections |

## 29.4 Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Security Officer | | | |
| Legal | | | |

---

# END OF DOCUMENT
