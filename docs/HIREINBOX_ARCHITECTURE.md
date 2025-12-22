# HIREINBOX - TECHNICAL ARCHITECTURE

> Last Updated: 21 December 2024
> Review alongside: MILESTONES.md, UX_GUIDELINES.md, POLICIES_SAFETY.md

---

## PROJECT GOALS

### Mission Statement
**Make hiring decisions faster and fairer for South African SMEs through evidence-based AI screening.**

### Success Metrics (Year 1)
| Metric | Target | Why It Matters |
|--------|--------|----------------|
| AI Accuracy | >85% match with human judgment | Trust & adoption |
| Time Saved | 10 hours/hire reduced to 1 hour | Value proposition |
| B2B Customers | 100 paying employers | Revenue |
| B2C Users | 1,000 job seekers | Talent pool |
| Revenue | R500,000 ARR | Sustainability |

### Core Value Propositions
1. **For Employers (B2B):** Screen 100 CVs in minutes, not days
2. **For Job Seekers (B2C):** Know exactly how to improve your CV
3. **For Recruiters (B2Recruiter):** AI-powered interviews at scale

---

## TECH STACK OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HIREINBOX ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   B2C WEB   │    │   B2B WEB   │    │ B2RECRUITER │                 │
│  │  (Job Seek) │    │ (Employers) │    │  (Agencies) │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            │                                            │
│                            ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      NEXT.JS 16 APP ROUTER                       │   │
│  │                    (Vercel Edge Functions)                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  /api/b2c/* │  │  /api/b2b/* │  │/api/recruit*│              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│         ┌───────────────────┼───────────────────┐                      │
│         ▼                   ▼                   ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │  SUPABASE   │    │   OPENAI    │    │    IMAP     │                │
│  │  DATABASE   │    │   GPT-4o    │    │   CLIENT    │                │
│  │  + AUTH     │    │  (AI Core)  │    │ (Email Fetch)│               │
│  │  + STORAGE  │    │             │    │             │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                         │
│  FUTURE ADDITIONS:                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │   RESEND    │    │    YOCO     │    │   SENTRY    │                │
│  │  (Emails)   │    │ (Payments)  │    │  (Errors)   │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## STACK COMPARISON (vs Industry Standard)

| Layer | Industry Standard | HireInbox Choice | Rationale |
|-------|------------------|------------------|-----------|
| **Frontend** | Next.js + Tailwind | Next.js + Inline CSS | Simpler, no build complexity |
| **Hosting** | Vercel | Vercel | Best DX, auto-scaling, free tier |
| **Database** | PostgreSQL | Supabase (PostgreSQL) | Managed, real-time, auth included |
| **Auth** | Clerk / Auth0 | Supabase Auth | One less service, free tier |
| **AI** | OpenAI / Anthropic | OpenAI GPT-4o | Best structured JSON outputs |
| **Emails** | Resend / SendGrid | IMAP (fetch) + Resend (send) | Need to add Resend |
| **Payments** | Stripe | Yoco | SA-native, ZAR support |
| **Storage** | S3 / R2 | Supabase Storage | Already integrated |
| **Monitoring** | Sentry | Sentry (planned) | Industry standard |

**Verdict: World-class stack, optimized for simplicity and SA market.**

---

## DATA FLOW DIAGRAMS

### B2B: Employer Screens CVs
```
┌──────────────────────────────────────────────────────────────────────┐
│  1. EMPLOYER CONNECTS EMAIL                                          │
│     └─> IMAP credentials stored encrypted in Supabase               │
│                                                                      │
│  2. SYSTEM FETCHES APPLICATIONS                                      │
│     └─> Cron job checks inbox every 5 minutes                       │
│     └─> Attachments (CVs) saved to Supabase Storage                 │
│                                                                      │
│  3. AI SCREENS EACH CV                                               │
│     └─> CV text extracted (PDF/DOCX parser)                         │
│     └─> GPT-4o compares CV to job requirements                      │
│     └─> Returns: score, recommendation, evidence quotes             │
│                                                                      │
│  4. RESULTS DISPLAYED                                                │
│     └─> Candidate cards sorted by score                             │
│     └─> Each card shows key evidence                                │
│     └─> Click for full modal breakdown                              │
│                                                                      │
│  5. EMPLOYER ACTS                                                    │
│     └─> Shortlist, Reject, or Email directly                        │
│     └─> All actions logged for analytics                            │
└──────────────────────────────────────────────────────────────────────┘
```

### B2C: Job Seeker Gets Feedback
```
┌──────────────────────────────────────────────────────────────────────┐
│  1. USER UPLOADS CV                                                  │
│     └─> File validated (PDF/DOCX, <5MB)                             │
│     └─> Stored in Supabase Storage                                  │
│                                                                      │
│  2. AI ANALYZES CV                                                   │
│     └─> GPT-4o evaluates against general job market                 │
│     └─> Returns: overall score, strengths, improvements             │
│                                                                      │
│  3. RESULTS DISPLAYED                                                │
│     └─> Score with visual gauge                                     │
│     └─> 3 strengths highlighted                                     │
│     └─> 3 improvement areas with specific advice                    │
│                                                                      │
│  4. UPSELL OFFERED                                                   │
│     └─> Video CV: R49                                               │
│     └─> Full Passport: R99                                          │
│     └─> Opt-in to Talent Pool (POPIA compliant)                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA (Supabase)

```sql
-- CORE TABLES
┌─────────────────────────────────────────────────────────────────────┐
│  users                        │  roles (jobs)                       │
│  ─────                        │  ─────                              │
│  id (uuid, PK)                │  id (uuid, PK)                      │
│  email                        │  employer_id (FK -> users)          │
│  user_type (b2c/b2b/recruiter)│  title                              │
│  company_name (nullable)      │  description                        │
│  created_at                   │  requirements (jsonb)               │
│  free_assessments_remaining   │  location                           │
│  subscription_tier            │  created_at                         │
├─────────────────────────────────────────────────────────────────────┤
│  candidates                   │  screenings                         │
│  ──────────                   │  ──────────                         │
│  id (uuid, PK)                │  id (uuid, PK)                      │
│  role_id (FK -> roles)        │  candidate_id (FK -> candidates)    │
│  name                         │  role_id (FK -> roles)              │
│  email                        │  score (0-100)                      │
│  cv_url                       │  recommendation (shortlist/review/  │
│  cv_text                      │                  reject)            │
│  source (email/upload)        │  evidence (jsonb)                   │
│  created_at                   │  strengths (jsonb)                  │
│                               │  gaps (jsonb)                       │
│                               │  created_at                         │
├─────────────────────────────────────────────────────────────────────┤
│  email_connections            │  payments                           │
│  ─────────────────            │  ────────                           │
│  id (uuid, PK)                │  id (uuid, PK)                      │
│  user_id (FK -> users)        │  user_id (FK -> users)              │
│  provider (gmail/outlook)     │  amount_cents                       │
│  imap_host                    │  currency (ZAR)                     │
│  imap_email (encrypted)       │  product (assessment/video/passport)│
│  imap_password (encrypted)    │  status (pending/complete/failed)   │
│  last_sync                    │  yoco_reference                     │
│  created_at                   │  created_at                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API STRUCTURE

```
/api
├── /auth
│   ├── /signup          POST - Create account
│   ├── /login           POST - Login
│   ├── /logout          POST - Logout
│   └── /verify-email    GET  - Email verification
│
├── /b2c
│   ├── /upload-cv       POST - Upload CV for analysis
│   ├── /analysis        GET  - Get CV analysis results
│   └── /talent-pool     POST - Opt-in to talent pool
│
├── /b2b
│   ├── /roles           GET/POST - List/create roles
│   ├── /roles/[id]      GET/PUT/DELETE - Single role
│   ├── /connect-email   POST - Connect IMAP
│   ├── /fetch-emails    POST - Manually trigger fetch
│   ├── /candidates      GET  - List candidates for role
│   └── /candidates/[id] GET  - Single candidate details
│
├── /payments
│   ├── /create          POST - Create Yoco payment
│   └── /webhook         POST - Yoco webhook
│
└── /webhooks
    └── /yoco            POST - Payment confirmations
```

---

## SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYERS                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. AUTHENTICATION                                                  │
│     └─> Supabase Auth (JWT tokens)                                 │
│     └─> Row Level Security (RLS) on all tables                     │
│     └─> Users can only see their own data                          │
│                                                                     │
│  2. DATA ENCRYPTION                                                 │
│     └─> IMAP passwords encrypted at rest (AES-256)                 │
│     └─> All traffic over HTTPS                                     │
│     └─> Supabase handles DB encryption                             │
│                                                                     │
│  3. INPUT VALIDATION                                                │
│     └─> File type validation (PDF/DOCX only)                       │
│     └─> File size limits (5MB max)                                 │
│     └─> Sanitize all user inputs                                   │
│                                                                     │
│  4. API SECURITY                                                    │
│     └─> Rate limiting on all endpoints                             │
│     └─> CORS configured for production domain only                 │
│     └─> API keys stored in environment variables                   │
│                                                                     │
│  5. COMPLIANCE                                                      │
│     └─> POPIA consent on signup                                    │
│     └─> Data deletion on request                                   │
│     └─> Talent pool is opt-in only                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SCALING STRATEGY

### Phase 1: 0-100 Customers (Current)
- Single Vercel deployment
- Supabase free tier
- OpenAI pay-as-you-go
- **Cost: ~R2,000/month**

### Phase 2: 100-1,000 Customers
- Vercel Pro ($20/month)
- Supabase Pro ($25/month)
- OpenAI increased limits
- Add Sentry for monitoring
- **Cost: ~R5,000/month**

### Phase 3: 1,000-10,000 Customers
- Vercel Enterprise (volume pricing)
- Supabase Team plan
- OpenAI enterprise tier
- CDN for static assets
- Queue system for heavy processing
- **Cost: ~R20,000/month**

---

## DEPLOYMENT PIPELINE

```
┌─────────────────────────────────────────────────────────────────────┐
│  LOCAL DEV → PREVIEW → PRODUCTION                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. LOCAL DEVELOPMENT                                               │
│     └─> npm run dev (Turbopack)                                    │
│     └─> Local Supabase (or dev project)                            │
│     └─> .env.local for secrets                                     │
│                                                                     │
│  2. PREVIEW (on PR)                                                 │
│     └─> Vercel auto-deploys preview URL                            │
│     └─> Uses staging Supabase project                              │
│     └─> Review before merge                                        │
│                                                                     │
│  3. PRODUCTION (on main merge)                                      │
│     └─> Vercel auto-deploys to hireinbox.co.za                     │
│     └─> Uses production Supabase                                   │
│     └─> Environment variables in Vercel dashboard                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TECHNICAL DEBT TRACKER

| Item | Priority | Effort | Status |
|------|----------|--------|--------|
| PDF parsing broken | HIGH | 2 hours | TODO |
| No email verification | HIGH | 4 hours | TODO |
| No rate limiting | MEDIUM | 2 hours | TODO |
| Inline CSS → Tailwind | LOW | 8 hours | OPTIONAL |
| Add Sentry | MEDIUM | 1 hour | TODO |
| Add Resend | MEDIUM | 2 hours | TODO |

---

*"Simple systems scale. Complex systems fail." - HireInbox Engineering*
