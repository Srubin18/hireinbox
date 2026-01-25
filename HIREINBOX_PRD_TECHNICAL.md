# HIREINBOX - PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Version:** 1.0
**Date:** 25 January 2026
**Author:** Claude (CTO)
**For:** Partner Review - MVP Assessment

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [B2B Products (Employers)](#4-b2b-products-employers)
5. [B2C Products (Candidates)](#5-b2c-products-candidates)
6. [Talent Pool Platform](#6-talent-pool-platform)
7. [B2Recruiter Products](#7-b2recruiter-products)
8. [API Documentation](#8-api-documentation)
9. [Database Schema](#9-database-schema)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [Security & Compliance](#11-security--compliance)
12. [Feature Status Matrix](#12-feature-status-matrix)
13. [Pricing Summary](#13-pricing-summary)

---

## 1. EXECUTIVE SUMMARY

### What is HireInbox?

HireInbox is an AI-powered CV screening platform built specifically for South African SMEs. The platform screens CVs with evidence-based reasoning, providing explainable AI decisions that are POPIA compliant.

### Core Value Proposition

**"Less noise. Better hires."**

- Screen 200 CVs in 30 seconds (vs 17-50 hours manually)
- Every decision shows WHY with direct quotes from the CV
- South African context built-in (CA(SA), BCom, local companies)
- Per-role pricing (not per-CV) - predictable costs

### Target Markets

| Segment | Description | Pricing Model |
|---------|-------------|---------------|
| **B2B (Employers)** | SMEs hiring 1-50 roles/year | Per role (R1,750+) |
| **B2C (Candidates)** | Job seekers wanting feedback | Free + Upsells (R99-R299) |
| **B2Recruiter** | Recruitment agencies | Per search/role |

### Current Build Status

| Component | Status | Completeness |
|-----------|--------|--------------|
| AI CV Screening | LIVE | 95% |
| B2B Employer Flow | Working | 75% |
| B2C Candidate Flow | Working | 80% |
| Talent Pool | Partial | 60% |
| B2Recruiter | UI Only | 40% |
| Payments | Not Integrated | 20% |
| Mobile | Needs Work | 30% |

**Overall MVP Status: ~60%**

---

## 2. PRODUCT OVERVIEW

### 2.1 Product Philosophy

1. **AI as Assistant** - AI assists humans, never makes final decisions
2. **Evidence-Based** - Every recommendation backed by direct quotes
3. **POPIA Compliant** - Full audit trail, data rights respected
4. **SA-Specific** - Understands local qualifications, companies, context
5. **Simple Pricing** - Per-role, not per-CV; no usage anxiety

### 2.2 User Personas

#### Employer (B2B)
- **Sarah, HR Manager at SME** (50-200 employees)
- Posts 3-10 roles per year
- Gets 50-200 CVs per role
- Pain: Spends 2 days manually reviewing CVs
- Need: Quick, fair screening with audit trail

#### Candidate (B2C)
- **Thabo, Job Seeker** (entry to mid-level)
- Has a CV but unsure if it's good
- Applying to multiple jobs
- Pain: No feedback on why applications fail
- Need: Honest assessment and improvement tips

#### Recruiter (B2Recruiter)
- **Michelle, Agency Owner** (boutique firm)
- Places 20-50 candidates per year
- Manages multiple client relationships
- Pain: Manual sourcing is time-consuming
- Need: AI-powered talent mapping

### 2.3 Core Features Summary

| Feature | B2B | B2C | Recruiter |
|---------|-----|-----|-----------|
| CV Upload & Analysis | - | Yes | - |
| Role-Based Screening | Yes | - | Yes |
| AI Scoring (0-100) | Yes | Yes | Yes |
| Evidence Quotes | Yes | Yes | Yes |
| Talent Pool Access | Yes | Join Free | Yes |
| Video Analysis | - | Yes (Paid) | - |
| Talent Mapping | - | - | Yes |
| Interview Scheduling | Yes | - | Yes |
| Verification Services | Yes | - | Yes |

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | React framework with SSR |
| **Styling** | Inline CSS | No Tailwind (design decision) |
| **Language** | TypeScript | Type safety |
| **Database** | Supabase (PostgreSQL) | Data persistence, auth |
| **AI - CV Screening** | OpenAI GPT-4o-mini (Fine-tuned) | Core screening intelligence |
| **AI - Video** | Claude Vision (claude-sonnet-4) | Video analysis |
| **AI - Transcription** | Whisper-1 | Audio to text |
| **Email** | IMAP Integration | Fetch CVs from inbox |
| **Payments** | PayFast (Planned) | SA payment gateway |
| **Hosting** | Vercel | Edge deployment |
| **Domain** | hireinbox.co.za | Live |

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   (Next.js 16 + React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   B2B    │  │   B2C    │  │  Talent  │  │ Recruiter│    │
│  │Dashboard │  │Candidate │  │   Pool   │  │  Portal  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        v             v             v             v
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│                   (Next.js API Routes)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │/api/     │  │/api/     │  │/api/     │  │/api/     │    │
│  │screen    │  │analyze-cv│  │talent-   │  │recruiter/│    │
│  │          │  │          │  │pool/*    │  │*         │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        v             v             v             v
┌─────────────────────────────────────────────────────────────┐
│                    AI LAYER                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SA_CONTEXT_PROMPT                       │    │
│  │   (South African Intelligence - shared across all)   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ OpenAI   │  │ Claude   │  │ Whisper  │                  │
│  │ GPT-4o   │  │ Vision   │  │ Speech   │                  │
│  │(Fine-tune)│  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
        │             │             │
        v             v             v
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│                    (Supabase)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  roles   │  │candidates│  │cv_analyses│ │  users   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Fine-Tuned AI Model

**Model ID:** `ft:gpt-4o-mini-2024-07-18:personal:hireinbox-cv-screener:CphiMaZU`

**Training Data:**
- 860 hand-curated screening examples (v1)
- 10,000 examples generating (v2 - in progress)

**Capabilities:**
- Score CVs 0-100 with calibrated accuracy
- Extract evidence quotes for every claim
- Understand SA-specific qualifications
- Detect red flags and yellow flags
- Never invent strengths not in the CV

### 3.4 SA Context Intelligence

Location: `/src/lib/sa-context.ts`

The SA_CONTEXT_PROMPT is injected into ALL AI calls, providing:
- Local qualification understanding (CA(SA), BCom, NDip)
- SA company recognition (Big 4, banks, retailers)
- Salary norms and title mappings
- Cultural context for CV interpretation

---

## 4. B2B PRODUCTS (EMPLOYERS)

### 4.1 AI CV Screening

**Price:** R1,750 per role

**What It Does:**
1. Employer creates a role with requirements
2. System fetches CVs from their email inbox (IMAP)
3. AI screens each CV against role requirements
4. Candidates scored 0-100 with evidence
5. Auto-generates shortlist (80+), consider (60-79), reject (<60)
6. Sends acknowledgment emails to candidates

**Technical Flow:**
```
Create Role → Connect Email → Fetch CVs → AI Screen → Score → Rank → Shortlist
```

**API Endpoint:** `POST /api/screen`

**Status:** LIVE - Core feature working

### 4.2 AI Interview (Add-On)

**Price:** R799 per role

**What It Does:**
1. AI avatar conducts screening interviews
2. Asks role-specific questions
3. Transcribes and analyzes responses
4. Provides scoring and highlights
5. Optional psychometric assessment

**Technical Flow:**
```
Candidate receives link → Records video answers → Whisper transcribes → AI analyzes → Report generated
```

**API Endpoints:**
- `POST /api/interview/start`
- `POST /api/interview/analyze`

**Status:** Experimental - UI exists, needs production hardening

### 4.3 Verification Bundle (Add-On)

**Price:** R800 per role (or individual: R50 ID, R100 Credit, R200 Reference)

**What It Does:**
1. ID Verification - Confirms identity documents
2. Credit Check - Financial background (with consent)
3. Reference Check - Automated reference collection

**API Endpoints:**
- `POST /api/reference-check`
- `POST /api/reference-check/submit`

**Status:** API stubs exist, third-party integrations pending

### 4.4 Employer Dashboard

**Route:** `/hire/dashboard`

**Features:**
| Feature | Status |
|---------|--------|
| View all roles | Working |
| Create new role | Working |
| View candidates per role | Working |
| Candidate cards with scores | Working |
| Candidate detail modal | Working |
| Email settings (IMAP) | Working |
| Bulk candidate actions | Partial |
| Search/filter | Partial |
| Mobile responsive | Broken |

---

## 5. B2C PRODUCTS (CANDIDATES)

### 5.1 Free CV Scan

**Price:** FREE (1 per user)

**What It Does:**
1. Candidate uploads CV (PDF/Word)
2. Same fine-tuned AI analyzes the CV
3. Returns score 0-100
4. Shows strengths with evidence quotes
5. Shows improvement areas with suggestions
6. Lists quick wins

**Route:** `/candidates`

**API Endpoint:** `POST /api/analyze-cv`

**Status:** LIVE - Core feature working

### 5.2 Video Analysis (Paid Upsell)

**Price:** R99-R199

**What It Does:**
1. Candidate uploads a short video of themselves
2. Claude Vision analyzes:
   - Body language and posture
   - Eye contact and engagement
   - Speaking pace and clarity
   - Professional presentation
3. Provides detailed coaching feedback

**Route:** `/candidates/video`

**API Endpoint:** `POST /api/analyze-video`

**Status:** LIVE - Claude Vision working

### 5.3 AI Coaching (Paid Upsell)

**Price:** R149-R299

**What It Does:**
1. Mock interviews with AI avatar
2. Industry-specific questions
3. Real-time feedback
4. Performance scoring

**Status:** UI mockup only

### 5.4 Position Prep (Paid Upsell)

**Price:** R199

**What It Does:**
1. Candidate enters target company/role
2. AI researches company
3. Provides prep materials:
   - Company culture insights
   - Expected interview questions
   - Tips for that specific role

**Status:** UI mockup only

### 5.5 Video Pitch (Paid Upsell)

**Price:** R149

**What It Does:**
1. Guided video pitch recording
2. Script assistance
3. Multiple takes allowed
4. AI feedback on delivery

**Status:** UI mockup only

### 5.6 Candidate Funnel Flow

```
Homepage → /candidates → Upload CV → Results (Score + Feedback)
                                          ↓
                              ┌───────────┼───────────┐
                              ↓           ↓           ↓
                         Join Talent   Video      CV Rewrite
                         Pool (FREE)   Analysis   Help
                                       (R99)
```

---

## 6. TALENT POOL PLATFORM

### 6.1 Overview

The Talent Pool is a two-sided marketplace:
- **Candidates** join for FREE to be discovered
- **Employers** pay R2,500 to post a job and access matched candidates

### 6.2 Candidate Side

**Route:** `/talent-pool/join`

**What It Does:**
1. Candidate uploads CV
2. Enters basic info (name, email)
3. CV stored in database
4. Candidate marked as "discoverable"
5. When employer posts matching job, candidate is notified

**API Endpoint:** `POST /api/talent-pool/join`

**Status:** Working - saves to database

### 6.3 Employer Side

**Route:** `/talent-pool/post-job`

**Price:** R2,500 per job listing

**What It Does:**
1. Employer describes the role
2. Pays R2,500
3. AI matches against talent pool
4. Employer receives matched candidates
5. Can contact candidates directly

**API Endpoints:**
- `POST /api/talent-pool` (create listing)
- `GET /api/talent-pool/match` (get matches)
- `POST /api/talent-pool/connect` (contact candidate)

**Status:** UI exists, payment not connected, matching algorithm is stub

---

## 7. B2RECRUITER PRODUCTS

### 7.1 Talent Mapping

**Route:** `/hire/recruiter/mapping`

**Price:** R999 per search

**What It Does:**
1. Recruiter enters search criteria
2. AI searches multiple sources:
   - Company team pages
   - LinkedIn (public)
   - Conference attendees
   - News mentions
3. Returns candidate profiles with:
   - Contact suggestions
   - Approach strategy
   - Fit scoring

**API Endpoint:** `POST /api/talent-mapping`

**Status:** Working - basic search functional

### 7.2 Recruiter Dashboard

**Route:** `/hire/recruiter/dashboard`

**Features:**
- Client management
- Active searches
- Candidate pipeline
- Commission tracking

**Status:** UI only - all data is mock/hardcoded

### 7.3 Commission Tracking

**Route:** `/recruiter/commissions`

**Status:** UI mockup only - shows fake data

---

## 8. API DOCUMENTATION

### 8.1 Core Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/analyze-cv` | POST | B2C CV analysis | LIVE |
| `/api/screen` | POST | B2B role screening | LIVE |
| `/api/fetch-emails` | POST | IMAP CV fetch | LIVE |
| `/api/analyze-video` | POST | Video coaching | LIVE |
| `/api/roles` | GET/POST | Role CRUD | Working |
| `/api/candidates` | GET/POST | Candidate CRUD | Working |
| `/api/talent-pool/join` | POST | Join talent pool | Working |
| `/api/talent-pool/match` | GET | Match candidates | Stub |
| `/api/talent-mapping` | POST | Recruiter search | Working |
| `/api/interview/start` | POST | Start AI interview | Experimental |
| `/api/interview/analyze` | POST | Analyze interview | Experimental |
| `/api/payments/create` | POST | Create payment | Not integrated |
| `/api/payments/notify` | POST | PayFast webhook | Not integrated |

### 8.2 Authentication

**Current:** Supabase Auth (email + password, magic link)

**Status:** Basic structure exists, not enforced on all routes

### 8.3 Rate Limiting

**Status:** Not implemented - HIGH priority for production

---

## 9. DATABASE SCHEMA

### 9.1 Core Tables (Supabase)

```sql
-- Users (Supabase Auth handles this)
-- Extended profile stored in 'profiles' table

-- Roles (employer job postings)
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  requirements TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Candidates (from screening)
CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles,
  name TEXT,
  email TEXT,
  cv_url TEXT,
  score INTEGER,
  status TEXT DEFAULT 'pending',
  analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CV Analyses (B2C)
CREATE TABLE cv_analyses (
  id UUID PRIMARY KEY,
  email TEXT,
  cv_filename TEXT,
  analysis JSONB,
  score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Talent Pool
CREATE TABLE talent_pool (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cv_url TEXT,
  skills TEXT[],
  looking_for TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. THIRD-PARTY INTEGRATIONS

### 10.1 Current Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| OpenAI | CV Screening AI | LIVE |
| Anthropic (Claude) | Video Analysis | LIVE |
| Supabase | Database + Auth | LIVE |
| Vercel | Hosting | LIVE |

### 10.2 Planned Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| PayFast | SA Payments | Code exists, not tested |
| Gmail OAuth | One-click email connect | Planned |
| Outlook OAuth | One-click email connect | Planned |
| WhatsApp | Notifications | Planned |
| BambooHR | ATS Sync | Future |

---

## 11. SECURITY & COMPLIANCE

### 11.1 POPIA Compliance

| Requirement | Status |
|-------------|--------|
| Lawful processing | Consent obtained on signup |
| Purpose specification | Stated in terms |
| Data minimization | Only collect necessary data |
| Information quality | User can update profile |
| Security safeguards | Supabase RLS, HTTPS |
| Subject participation | Data export available |
| Audit trail | All AI decisions logged |

**Note:** Legal review pending

### 11.2 Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Candidate data | 365 days |
| CV files | 365 days |
| Audit logs | 730 days |
| Deleted accounts | 30 days grace |

### 11.3 Security Measures

| Measure | Status |
|---------|--------|
| HTTPS everywhere | Yes |
| Supabase RLS | Configured |
| API authentication | Partial |
| Rate limiting | Not implemented |
| Input validation | Partial |
| SQL injection protection | Supabase handles |
| XSS protection | React handles |

---

## 12. FEATURE STATUS MATRIX

### Legend
- LIVE = Production ready, working
- Working = Functional but needs polish
- Partial = Some functionality missing
- Stub = API exists but doesn't do much
- UI Only = Frontend exists, no backend
- Planned = Not started

### B2B Features

| Feature | Frontend | Backend | AI | Status |
|---------|----------|---------|-----|--------|
| Create Role | Yes | Yes | - | Working |
| CV Screening | Yes | Yes | Yes | LIVE |
| Candidate Cards | Yes | Yes | - | Working |
| Candidate Modal | Yes | Yes | - | Working |
| Email Setup (IMAP) | Yes | Yes | - | Working |
| AI Interview | Partial | Partial | Partial | Experimental |
| Verification | UI Only | Stub | - | Planned |
| Dashboard Stats | Partial | Partial | - | Partial |
| Mobile Dashboard | No | - | - | Broken |

### B2C Features

| Feature | Frontend | Backend | AI | Status |
|---------|----------|---------|-----|--------|
| CV Upload | Yes | Yes | - | LIVE |
| CV Analysis | Yes | Yes | Yes | LIVE |
| Results Display | Yes | - | - | LIVE |
| Video Analysis | Yes | Yes | Yes | LIVE |
| AI Coaching | UI Only | - | - | Planned |
| Position Prep | UI Only | - | - | Planned |
| Video Pitch | UI Only | - | - | Planned |
| Talent Pool Join | Yes | Yes | - | Working |

### Talent Pool

| Feature | Frontend | Backend | AI | Status |
|---------|----------|---------|-----|--------|
| Join (Candidate) | Yes | Yes | - | Working |
| Post Job (Employer) | Yes | Partial | - | UI Only |
| Matching | - | Stub | - | Planned |
| Contact Candidate | - | Stub | - | Planned |
| Payment | UI Only | - | - | Planned |

### B2Recruiter

| Feature | Frontend | Backend | AI | Status |
|---------|----------|---------|-----|--------|
| Dashboard | Yes | Mock | - | UI Only |
| Talent Mapping | Yes | Yes | Yes | Working |
| Client Management | Yes | Mock | - | UI Only |
| Commission Tracking | Yes | Mock | - | UI Only |

---

## 13. PRICING SUMMARY

### B2B Pricing

| Product | Price | Unit |
|---------|-------|------|
| AI CV Screening | R1,750 | per role |
| AI Interview | R799 | per role (add-on) |
| Verification Bundle | R800 | per role (add-on) |
| ID Check only | R50 | per candidate |
| Credit Check only | R100 | per candidate |
| Reference Check only | R200 | per candidate |
| Job Listing (Talent Pool) | R2,500 | per listing |
| Talent Mapping | R999 | per search |

### Bulk Discounts

| Roles | Discount | Price/Role |
|-------|----------|------------|
| 1-4 | 0% | R1,750 |
| 5-9 | 10% | R1,575 |
| 10-19 | 15% | R1,488 |
| 20+ | 20% | R1,400 |

### B2C Pricing

| Product | Price |
|---------|-------|
| CV Scan | FREE (1x) |
| CV Rewrite | FREE (1x) |
| Video Analysis | R99-R199 |
| AI Coaching | R149-R299 |
| Position Prep | R199 |
| Video Pitch | R149 |

### Talent Pool

| Product | Price |
|---------|-------|
| Candidate Join | FREE |
| Employer Job Post | R2,500 |

---

## APPENDIX A: FILE STRUCTURE

```
/Users/simon/Desktop/hireinbox/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage
│   │   ├── candidates/                 # B2C flows
│   │   │   ├── page.tsx               # CV upload
│   │   │   ├── create/page.tsx        # No-CV path
│   │   │   ├── video/page.tsx         # Video analysis
│   │   │   └── ...
│   │   ├── hire/                       # B2B flows
│   │   │   ├── page.tsx               # Employer landing
│   │   │   ├── dashboard/page.tsx     # Main dashboard
│   │   │   ├── recruiter/             # Recruiter portal
│   │   │   └── ...
│   │   ├── talent-pool/               # Talent marketplace
│   │   │   ├── page.tsx               # Landing
│   │   │   ├── join/page.tsx          # Candidate join
│   │   │   └── post-job/page.tsx      # Employer post
│   │   ├── api/                        # API routes
│   │   │   ├── analyze-cv/route.ts    # B2C analysis
│   │   │   ├── screen/route.ts        # B2B screening (alias)
│   │   │   ├── fetch-emails/route.ts  # IMAP fetch
│   │   │   ├── analyze-video/route.ts # Video AI
│   │   │   ├── talent-pool/           # Talent pool APIs
│   │   │   ├── talent-mapping/        # Recruiter search
│   │   │   └── ...
│   │   └── ...
│   ├── lib/
│   │   ├── sa-context.ts              # SA AI intelligence
│   │   ├── pricing.ts                 # All pricing constants
│   │   ├── supabase.ts                # DB client
│   │   └── guardrails.ts              # Ethical guidelines
│   └── components/
│       ├── CandidateCard.tsx
│       ├── CandidateModal.tsx
│       └── ...
├── CLAUDE.md                           # Project context
├── MVP_AUDIT_BRUTAL_TRUTH.md          # Honest assessment
├── REMAINING_MVP_ITEMS.md             # What's left
└── package.json
```

---

## APPENDIX B: ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Anthropic (Claude)
ANTHROPIC_API_KEY=

# PayFast (not yet integrated)
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=

# Email (IMAP)
# User-provided per account
```

---

## DOCUMENT END

**Prepared for:** Partner Review
**Next Steps:**
1. Review this PRD
2. Review REMAINING_MVP_ITEMS.md for work needed
3. Review revenue forecast (separate document)
4. Discuss go-to-market timeline

---

*HireInbox - Less noise. Better hires.*
*Built in Cape Town, South Africa*
