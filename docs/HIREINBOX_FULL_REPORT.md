# HIREINBOX - Full Company Report
## December 2024

---

## EXECUTIVE SUMMARY

**HireInbox** is an AI-powered talent intelligence platform that brings evidence-based reasoning to hiring and creator verification. We work where people already work — inboxes — and use AI to screen, score, and coach with full transparency.

**Founder:** Simon Rubin (Cape Town)
**CTO:** Claude AI
**Stage:** Pre-revenue, MVP complete
**Target Market:** South Africa (expanding to Africa)

**One-liner:** *"AI that shows its receipts."*

---

## THE PROBLEM

### For Employers (B2B)
- Recruiters spend **6 seconds per CV** — missing great candidates
- **No audit trail** for hiring decisions (POPIA risk)
- Generic ATS tools don't understand SA qualifications (CA(SA), BCom, Pr.Eng)
- SMEs can't afford enterprise recruitment tech

### For Job Seekers (B2C)
- CVs disappear into black holes — no feedback
- Don't know why they're rejected
- Can't afford career coaches (R500+/session)
- Video interviews are terrifying with zero preparation

### For Creators (B2Creator)
- **79% burnout rate** — overwhelmed by ops, deals, content
- **$2B lost to influencer fraud** — brands don't trust metrics
- No way to prove they're legit to brands
- Global tools don't understand SA market

---

## THE SOLUTION

### Core Innovation: Evidence-Based AI

Every HireInbox decision shows **exactly WHY** with quotes and proof.

```
❌ Generic AI: "Strong candidate, 75/100"
✅ HireInbox:  "75/100 — CA(SA) from Wits (gold standard),
               PwC articles (Big 4 training), but no team
               leadership evidence. Quote: 'Managed audit
               portfolio of R50M' shows individual contribution."
```

This creates:
- **Trust** — humans can verify AI reasoning
- **POPIA compliance** — full audit trail
- **Learning** — AI improves from feedback

---

## PRODUCTS

### 1. B2B: Employer Dashboard
**Status:** MVP Complete ✅

| Feature | Description |
|---------|-------------|
| Inbox Integration | IMAP connection to recruitment email |
| AI Screening | GPT-4o scores CVs against role requirements |
| Evidence Cards | Every score shows quotes from CV |
| Shortlist/Reject | One-click decisions with audit trail |
| Role Management | Create roles, set requirements |

**Pricing:** R299+/month (10 free screenings)

---

### 2. B2C: Job Seeker Tools
**Status:** MVP Complete ✅

| Feature | Description |
|---------|-------------|
| CV Upload | PDF, Word, TXT, or paste text |
| AI Analysis | Strengths, weaknesses, quick wins |
| CV Rewriter | AI rewrites CV with improvements |
| Video Coaching | 60-second pitch analysis |
| Career Insights | Role fit, industry match |

**Pricing:** 1 free, then R29/analysis

---

### 3. B2Creator: Creator Passport
**Status:** Tech Complete, UI Pending 🔄

| Feature | Description |
|---------|-------------|
| Video Pitch Score | AI analyzes presentation skills |
| Verification Badge | Prove you're a real human |
| Dynamic Media Kit | Auto-updating stats |
| SA Context | Understands local brands, culture |
| Coaching Tips | Specific improvements with timestamps |

**Pricing:** R49 one-time

---

## TECHNOLOGY STACK

### Infrastructure
| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (pending deployment) |
| Styling | Inline CSS (no Tailwind) |

### AI Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Text Analysis | GPT-4o | CV screening, evidence extraction |
| Vision | GPT-4o Vision | Video frame analysis |
| Transcription | OpenAI Whisper | Speech-to-text |
| Voice Metrics | Web Audio API | Pitch, pace, silence detection |
| Frame Capture | Canvas API | Extract video frames |
| PDF Extraction | pdf2json / ConvertAPI | Parse CV documents |

### Proprietary Components
| Component | Description |
|-----------|-------------|
| SA Context Intelligence | 200+ SA universities, companies, qualifications |
| Evidence Reasoning Engine | Prompts that require proof for every claim |
| Video Charisma Scoring | Timeline analysis, peak/dip detection |
| POPIA Audit Trail | Every decision logged with reasoning |

---

## SOUTH AFRICAN CONTEXT INTELLIGENCE

**This is our unfair advantage.** Global AI tools have zero understanding of:

### Qualifications
- **CA(SA)** — Gold standard accounting (harder than CPA)
- **Pr.Eng** — Registered Professional Engineer
- **FASSA** — Fellow of Actuarial Society
- **Articles** — 3-year training contracts at Big 4

### Universities (Prestige Tiers)
- **Tier 1:** UCT, Wits, Stellenbosch, UP
- **Tier 2:** Rhodes, UKZN, UJ, NWU
- **Distance:** Unisa (valid, shows grit — NOT penalized)

### Companies
- **Big 4:** PwC, Deloitte, EY, KPMG (well-trained)
- **Elite Finance:** Investec, RMB, Discovery, Allan Gray
- **Consulting:** McKinsey, BCG, Bain (global elite)

### School Signals
- Head Boy/Girl at Grey College = significant leadership
- Cricket Captain at Bishops = pressure leadership
- Dux Scholar = top academic achiever

**No global tool recognizes these signals. We do.**

---

## MARKET OPPORTUNITY

### B2B: SA Recruitment Tech
| Metric | Value |
|--------|-------|
| SA SMEs | 2.6 million |
| Hiring SMEs annually | ~500,000 |
| Avg recruitment spend | R5,000-50,000/hire |
| TAM | R25B+ |

### B2C: Job Seekers
| Metric | Value |
|--------|-------|
| SA unemployment | 32% |
| Job seekers | 8+ million |
| Career coaching market | R500M+ |
| TAM | R2B+ |

### B2Creator: Creator Economy
| Metric | Value | Source |
|--------|-------|--------|
| Global creator economy | $250B (2024) | Goldman Sachs |
| Projected 2027 | $480B | Goldman Sachs |
| SA market | R500M (2024) | Statista |
| SA projected 2029 | R800M | Statista |
| Fraud losses | $2B/year | Industry reports |

---

## COMPETITIVE LANDSCAPE

### B2B Competitors
| Competitor | Weakness | Our Edge |
|------------|----------|----------|
| Pnet/Careers24 | Job boards, no AI | AI screening |
| Workable/Lever | Enterprise pricing, no SA context | SME pricing, SA intelligence |
| LinkedIn Recruiter | R10K+/month, generic | Affordable, evidence-based |

### B2C Competitors
| Competitor | Weakness | Our Edge |
|------------|----------|----------|
| TopCV | Human review, expensive | AI instant, affordable |
| Career coaches | R500+/session | R29, instant |
| None | No video coaching in SA | First mover |

### Creator Competitors
| Competitor | Weakness | Our Edge |
|------------|----------|----------|
| Linktree | Links only, no verification | Video AI, verification |
| Beacons | No video analysis | Video coaching |
| HypeAuditor | Brand-side only, no SA | Creator-side, SA context |
| Humanz | Marketplace, no coaching | AI coaching |

**Our unique position:** Video coaching + SA context + evidence-based = **no direct competitor**

---

## BUSINESS MODEL

### Revenue Streams

| Product | Model | Price | Target Users |
|---------|-------|-------|--------------|
| B2B Screening | SaaS subscription | R299-999/mo | 10K SMEs |
| B2C CV Analysis | Pay-per-use | R29/analysis | 100K job seekers |
| B2C CV Rewrite | Pay-per-use | R49/rewrite | 50K job seekers |
| Creator Passport | One-time | R49 | 500K creators |
| Creator Inbox | SaaS subscription | R99/mo | 10K creators |

### Year 1 Revenue Projection

| Product | Users | Revenue |
|---------|-------|---------|
| B2B | 1,000 | R3.6M |
| B2C | 50,000 | R1.5M |
| Creator Passport | 500,000 | R25M |
| **Total** | | **R30M** |

### Unit Economics
- **CAC (estimated):** R50-100 (organic + referral)
- **LTV B2B:** R3,600 (12 months avg)
- **LTV B2C:** R78 (2-3 uses avg)
- **LTV Creator:** R150 (passport + inbox)
- **Gross Margin:** 85%+ (AI costs minimal per transaction)

---

## TRACTION & STATUS

### What's Built
| Component | Status |
|-----------|--------|
| B2B Dashboard | ✅ Complete |
| IMAP Integration | ✅ Working |
| AI CV Screening | ✅ Working |
| B2C CV Upload | ✅ Working |
| AI CV Analysis | ✅ Working |
| AI CV Rewriter | ✅ Working |
| Video Recording | ✅ Working |
| Video Analysis | ✅ Working (Dec 22) |
| Creator Passport UI | 🔄 Pending |
| Payment Integration | 🔄 Pending |
| Authentication | 🔄 Pending |
| Production Deploy | 🔄 Pending |

### Training Data
| Asset | Count |
|-------|-------|
| Synthetic Jobs | 2,676 |
| Synthetic CVs | 4,932 |
| Screening Examples | 740+ (running) |

### Technical Milestones
- ✅ GPT-4o Vision facial analysis working
- ✅ Whisper transcription integrated
- ✅ Web Audio API voice metrics
- ✅ SA Context Intelligence complete
- ✅ Evidence-based prompts refined

---

## TEAM

### Current
- **Simon Rubin** — Founder, Product, Business
- **Claude (AI)** — CTO, Engineering, Architecture

### Needed (Post-Funding)
- Full-stack developer (Next.js/TypeScript)
- Sales/BD (SA recruitment market)
- Creator partnerships lead

---

## ROADMAP

### Q1 2025
- [ ] Deploy to Vercel (hireinbox.co.za)
- [ ] Supabase Auth integration
- [ ] Payment integration (Yoco/PayFast)
- [ ] Launch B2C publicly
- [ ] Launch Creator Passport
- [ ] First 1,000 users

### Q2 2025
- [ ] B2B sales push (50 SME clients)
- [ ] Creator Business Inbox (Phase 2)
- [ ] Partnership with Humanz or similar
- [ ] 10,000 Creator Passports sold

### Q3 2025
- [ ] Fine-tune models on screening data
- [ ] Expand to Nigeria, Kenya
- [ ] Enterprise tier for corporates
- [ ] R5M ARR milestone

### Q4 2025
- [ ] Series A preparation
- [ ] 50,000 Creator Passports
- [ ] R10M ARR target

---

## INVESTMENT ASK

### Use of Funds (Seed: R5M)

| Category | Allocation | Purpose |
|----------|------------|---------|
| Engineering | 40% | 2 developers, infrastructure |
| Sales/Marketing | 30% | B2B sales, creator acquisition |
| Operations | 20% | Legal, compliance, support |
| Reserve | 10% | Runway buffer |

### Milestones to Series A
1. R5M ARR
2. 100 B2B clients
3. 100K Creator Passports sold
4. Nigeria/Kenya expansion started

---

## WHY NOW

1. **AI Moment** — GPT-4o Vision just became capable enough for video analysis
2. **SA Unemployment Crisis** — 32% unemployment, government pressure to solve
3. **Creator Economy Boom** — $480B by 2027, SA underserved
4. **POPIA Enforcement** — Companies need audit trails, we provide
5. **Remote Work** — Video interviews normalized, coaching needed

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| OpenAI API dependence | Multi-model architecture, can swap to Claude/Gemini |
| Platform risk (YouTube/TikTok) | Multi-platform from day 1 |
| Competition from global players | SA context moat, local partnerships |
| AI hallucination | Evidence-required prompts, human review option |
| Slow enterprise sales | Focus on SME self-serve first |

---

## THE VISION

**Year 1:** The AI that screens CVs with receipts
**Year 3:** The trust layer for SA talent (jobs + creators)
**Year 5:** The LinkedIn of Africa — where talent meets opportunity with AI verification

---

## CONTACT

**Simon Rubin**
Founder, HireInbox
Cape Town, South Africa

*"Less noise. Better hires."*

---

*Report generated: December 22, 2024*
*Version: 1.0*
