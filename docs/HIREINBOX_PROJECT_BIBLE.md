# HIREINBOX PROJECT BIBLE
> **Founder:** Simon Rubin, Cape Town
> **Last Updated:** 20 December 2024
> **Project Path:** `/Users/simon/Desktop/hireinbox`

---

## QUICK ACCESS

| Resource | Location |
|----------|----------|
| **Run Dev Server** | `cd /Users/simon/Desktop/hireinbox && npm run dev` |
| **Master Todo** | `/Users/simon/Desktop/hireinbox/MASTER_TODO.md` |
| **Training Data** | `/Users/simon/Desktop/hireinbox/scripts/training-data/` |
| **Run Training Pipeline** | `cd /Users/simon/Desktop/hireinbox/scripts/training-data && source ../../.env.local && node generate-all.mjs` |
| **OpenAI Usage** | https://platform.openai.com/usage |
| **B2C Live URL** | http://localhost:3000/upload |
| **B2B Live URL** | http://localhost:3000 |

---

## WHAT IS HIREINBOX?

HireInbox is an **AI-powered CV screening platform** for South African SMEs. We work where HR already works - **email inboxes** - and use AI to:

1. **Screen CVs** with evidence-based reasoning
2. **Score candidates** against job requirements
3. **Explain decisions** with quotes from CVs (POPIA compliant)
4. **Save time** - from 50 CVs to 6 shortlisted in seconds

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Inline CSS (no Tailwind) |
| **Database** | Supabase (PostgreSQL) |
| **AI** | OpenAI GPT-4o / GPT-4o-mini |
| **Email** | IMAP integration |
| **Hosting** | Vercel (not deployed yet) |
| **Payments** | Yoco/PayFast (not integrated yet) |

---

## PROJECT STRUCTURE

```
/Users/simon/Desktop/hireinbox/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # B2B Landing + Dashboard
│   │   ├── upload/page.tsx             # B2C CV Upload
│   │   ├── api/
│   │   │   ├── fetch-emails/route.ts   # IMAP + AI Screening
│   │   │   ├── analyze-cv/route.ts     # B2C CV Analysis
│   │   │   └── ...
│   │   └── ...
│   ├── components/
│   │   ├── CandidateCard.tsx
│   │   ├── CandidateModal.tsx
│   │   └── ...
│   └── lib/
│       └── supabase.ts
├── scripts/
│   └── training-data/
│       ├── generate-all.mjs            # Main training pipeline
│       ├── data/                        # Generated data output
│       └── ...
├── MASTER_TODO.md                       # Complete task list
├── package.json
└── .env.local                           # API keys (NEVER commit)
```

---

## 5 BUCKETS

### 1. B2B (Employer Dashboard)
**Status:** Core features working

| Feature | Status | File |
|---------|--------|------|
| Email inbox fetching | Working | `api/fetch-emails/route.ts` |
| Role creation wizard | Done | `page.tsx` |
| Candidate cards + scoring | Done | `CandidateCard.tsx` |
| Candidate detail modal | Done | `CandidateModal.tsx` |
| AI screening with SA context | Done | `fetch-emails/route.ts` |

### 2. B2C (Job Seeker Tools)
**Status:** Real AI working

| Feature | Status | File |
|---------|--------|------|
| CV upload + AI analysis | Working | `upload/page.tsx` |
| Real GPT-4o feedback | Working | `api/analyze-cv/route.ts` |
| Video Analysis (R49) | UI only | - |
| Talent Passport (R99) | UI only | - |
| **Talent Pool Bridge** | Pending | - |

### 3. B2Recruiter (Pro Tools)
**Status:** UI mockups only

| Feature | Status |
|---------|--------|
| Headhunter Search | UI only (filters work) |
| Elite Talent Hub | UI only |
| Reference Check Hub | UI only |
| AI Interview | Pending (killer feature) |

### 4. General (Business)
**Status:** Pre-launch

| Task | Status |
|------|--------|
| Payments | Pending |
| Authentication | Pending |
| Legal pages | Pending |
| Deploy to Vercel | Pending |

### 5. Ideas & Research
See MASTER_TODO.md for:
- Competitor analysis (SA, Africa, Global)
- Feature ideas (job posting, WhatsApp)
- AI HR trends 2025

---

## THE AI MOAT

Our competitive advantage is **evidence-based AI screening**:

1. **SA-specific knowledge** - Understands CA(SA), BCom, local companies
2. **Evidence discipline** - Every claim needs a quote or "not mentioned"
3. **Explainable** - Shows WHY, not just scores
4. **POPIA compliant** - Audit trail for all decisions
5. **Human-in-loop** - AI assists, recruiter decides

### Key AI Prompt (TALENT_SCOUT_PROMPT)
Located in: `src/app/api/fetch-emails/route.ts`

Features:
- Zero invented strengths
- SA qualification rankings
- Exception rules for near-miss candidates
- Score calibration (SHORTLIST 80-100, CONSIDER 60-79, REJECT <60)

---

## TRAINING DATA PIPELINE

**Purpose:** Generate synthetic data to calibrate AI accuracy

**Files:**
- `scripts/training-data/generate-all.mjs` - Complete standalone pipeline
- Outputs to `scripts/training-data/data/`

**Run command:**
```bash
cd /Users/simon/Desktop/hireinbox/scripts/training-data
source ../../.env.local
node generate-all.mjs
```

**Generates:**
- 300 South African job posts
- 1000 synthetic CVs (varied quality)
- 1000 AI screening verdicts
- human_review.csv for calibration

**Cost:** ~$50-70 | **Time:** 2-3 hours

**CV Categories:**
| Category | Count | Description |
|----------|-------|-------------|
| STRONG_MATCH | 300 | Exceeds requirements |
| WEAK_MATCH | 300 | Missing 1-2 requirements |
| WRONG_ROLE | 200 | Good candidate, wrong fit |
| EDGE_CASE | 100 | Career changers, gaps |
| POOR_CV | 100 | Buzzwords only |

---

## WHAT'S REAL vs FAKE

| Feature | Status |
|---------|--------|
| B2B CV screening | **REAL** - GPT-4o |
| B2B email fetching | **REAL** - IMAP |
| B2C CV analysis | **REAL** - GPT-4o |
| Headhunter Search | FAKE - UI mockup |
| Elite Talent Hub | FAKE - UI mockup |
| Reference Check | FAKE - UI mockup |
| Video Analysis | FAKE - UI only |
| Talent Passport | FAKE - UI only |

---

## COMPETITORS (HOW WE BEAT THEM)

### Our Advantages:
1. **Inbox-native** - Work where HR already works
2. **Evidence-based AI** - Show WHY with quotes
3. **SA-specific** - Understand local context
4. **Explainable** - POPIA compliant
5. **SME-focused** - Not enterprise complexity
6. **Human-in-loop** - AI assists, recruiter decides

### SA Competitors:
- Talent Genie, Job Crystal, PNet, peopleHum, Exelare

### Global Competitors:
- HireVue, Eightfold AI, Beamery, Paradox, SeekOut

---

## PRIORITY ROADMAP

### Phase 1: AI Excellence (CURRENT)
- [x] SA context in prompts
- [ ] Generate training data (300 jobs, 1000 CVs)
- [ ] Human review of AI verdicts
- [ ] Feedback loop ("AI wrong" button)

### Phase 2: Ship Core
- [ ] Fix PDF upload (B2C)
- [ ] Authentication system
- [ ] Payment integration
- [ ] Deploy to Vercel

### Phase 3: AI Interview
- [ ] Video recording (MediaRecorder API)
- [ ] Whisper transcription
- [ ] GPT-4o analysis
- [ ] Interview report UI

### Phase 4: Scale & Differentiate
- [ ] Job posting to platforms (PNet, Gumtree, Indeed)
- [ ] WhatsApp integration
- [ ] B2C talent pool for B2B clients
- [ ] Pro tool backends

---

## BUDGET TRACKING

| Resource | Budget | Used |
|----------|--------|------|
| OpenAI API | $99 | ~$50-70 (est) |
| Supabase | Free tier | - |
| Vercel | Free tier | - |

**Alert:** Top up OpenAI when below $20

---

## KEY FILES TO KNOW

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | B2B landing page + dashboard |
| `src/app/upload/page.tsx` | B2C CV upload |
| `src/app/api/fetch-emails/route.ts` | IMAP + AI screening |
| `src/app/api/analyze-cv/route.ts` | B2C CV analysis |
| `MASTER_TODO.md` | Complete task list |
| `scripts/training-data/generate-all.mjs` | Training pipeline |

---

## REMINDERS

1. B2B + B2C core AI is **REAL and working**
2. B2Recruiter tools are **roadmap/demo only**
3. The moat = AI quality + SA knowledge + feedback loop
4. POPIA: Opt-in talent pool is legal, scraping is not
5. Monitor OpenAI spend: https://platform.openai.com/usage
6. First 10 clients from personal network + recruiter partnerships

---

*"We have just begun..." - Simon Rubin, Founder*
