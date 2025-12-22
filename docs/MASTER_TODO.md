# HIREINBOX MASTER TODO LIST
> Last updated: 20 Dec 2024
> OpenAI Budget: $99 | Estimated spend this session: ~$50-70 | Monitor at: https://platform.openai.com/usage

---

## PROJECT STRUCTURE (5 BUCKETS)

| Bucket | Description |
|--------|-------------|
| **B2B** | Employer dashboard, inbox screening, candidate management |
| **B2C** | Job seeker tools, CV upload, feedback, upsells |
| **B2Recruiter** | Agency/recruiter pro tools, headhunting, references, AI interview |
| **General** | Marketing, pricing, go-to-market, legal, first 10 clients |
| **Ideas & Research** | Competitor intel, feature ideas, market trends, future roadmap |

---

# B2B (Employer Dashboard)

### Core Features
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Email inbox fetching | Working | IMAP integration |
| 2 | Role creation wizard | Done | 4-step wizard |
| 3 | Candidate cards + scoring | Done | AI reasoning displayed |
| 4 | Candidate detail modal | Done | Full breakdown |
| 5 | Authentication system | Pending | Multi-tenant login |
| 6 | Dashboard analytics | Basic | Stats cards exist |

### AI Sharpening (THE MOAT)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 7 | Generate 300 synthetic job posts | Running | Pipeline started |
| 8 | Generate 1000 synthetic CVs | Pending | After jobs complete |
| 9 | Run AI screening on 1000 pairs | Pending | Calibration data |
| 10 | Human review of AI verdicts | Pending | CSV export ready |
| 11 | Add SA-specific knowledge to prompts | Done | Added to screening prompt |
| 12 | Industry-specific prompt variants | Pending | Sales, Tech, Finance scouts |
| 13 | Build recruiter feedback loop | Pending | "AI wrong" button |

### Infrastructure (B2B)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | Setup apply@hireinbox.co.za | Pending | Professional inbound |
| 15 | Deploy to Vercel | Pending | Not live yet |

---

# B2C (Job Seeker Tools)

### Core Features
| # | Task | Status | Notes |
|---|------|--------|-------|
| 16 | CV upload + AI analysis | Working | Real GPT-4o feedback |
| 17 | Fix PDF upload | Pending | Only Word works |
| 18 | Results display | Done | Score, strengths, improvements |

### Upsells (B2C)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 19 | Video Personality Analysis (R49) | UI only | Backend not built |
| 20 | Talent Passport (R99) | UI only | Backend not built |
| 21 | Payment flow for upsells | Pending | Needs Yoco |

### Design (B2C)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 22 | Remove fake stats | Done | Authenticity fix |
| 23 | Founder footer | Done | Simon Rubin, Cape Town |

### B2C → B2B Talent Pool Bridge
| # | Task | Status | Notes |
|---|------|--------|-------|
| 24 | Opt-in checkbox for B2C users | Pending | "Join our talent pool?" consent |
| 25 | Store consented CVs in talent pool | Pending | Supabase table with consent flag |
| 26 | B2B talent pool search UI | Pending | Search/filter screened candidates |
| 27 | Match B2C candidates to B2B roles | Pending | AI matching with job requirements |
| 28 | Employer contact request flow | Pending | B2B pays to contact candidates |

---

# B2Recruiter (Pro Recruiter Tools)

### AI Interview (Killer Feature)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 24 | Video recording in browser | Pending | MediaRecorder API |
| 25 | Video storage (S3/R2) | Pending | Store candidate videos |
| 26 | Whisper transcription | Pending | Speech to text |
| 27 | AI analysis of answers | Pending | GPT-4o analysis |
| 28 | Interview report UI | Pending | Transcript + AI notes |
| 29 | Email interview link | Pending | Resend/SendGrid |
| 30 | Question generation from CV + role | Pending | AI creates questions |

### Pro Tools (UI Mockups - Roadmap)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 31 | Headhunter Search | UI only | Filters work |
| 32 | Elite Talent Hub | UI only | Badges are roadmap |
| 33 | Reference Check Hub | UI only | Hardcoded demo |
| 34 | ID Verification | Not built | Future feature |

### Talent Pool Features
| # | Task | Status | Notes |
|---|------|--------|-------|
| 35 | Opt-in candidate pool | Pending | B2C users consent to be found |
| 36 | Verified/reference-checked tier | Pending | Premium candidates |

---

# General (Business & GTM)

### Payments & Pricing
| # | Task | Status | Notes |
|---|------|--------|-------|
| 37 | Payment integration (Yoco/PayFast) | Pending | Critical for revenue |
| 38 | Decide B2B pricing tiers | Pending | R299/R599/R999? |
| 39 | Decide B2C pricing | Set | Video R49, Passport R99 |

### Legal
| # | Task | Status | Notes |
|---|------|--------|-------|
| 40 | Privacy Policy page | Pending | Legal requirement |
| 41 | Terms of Service page | Pending | Legal requirement |
| 42 | POPIA compliance docs | Pending | SA law |

### Marketing
| # | Task | Status | Notes |
|---|------|--------|-------|
| 43 | Record Loom demo video | Pending | Script ready |
| 44 | LinkedIn content plan | Pending | I can write copy |
| 45 | Landing page copy polish | Ongoing | Refinement |

### Go-To-Market
| # | Task | Status | Notes |
|---|------|--------|-------|
| 46 | First 10 customers list | Pending | Personal network |
| 47 | Recruiter agency partnerships | Pending | 10x better than SMEs |
| 48 | Partner demo deck | Pending | Vision + roadmap |

### Testing & Calibration
| # | Task | Status | Notes |
|---|------|--------|-------|
| 49 | Recruit recruiter friend for testing | Pending | Real CV feedback |
| 50 | Build CV collection form | Done | Part of pipeline |
| 51 | Live testing with first 5 users | Pending | Real feedback loop |

---

# Ideas & Research (5th Bucket)

## COMPETITOR LANDSCAPE - SA & AFRICA

### South African Competitors
| Company | What They Do | Our Advantage |
|---------|--------------|---------------|
| **Talent Genie** | AI recruitment software, NLP matching | We're inbox-native, they require new system |
| **Job Crystal** | AI recruiter + human hybrid | We're pure AI with explainability |
| **PNet** | Job board, adding AI features | We screen, they list |
| **JobJack** | Entry-level job board | We're professional/SME focused |
| **peopleHum** | HR platform with ATS | We're simpler, screening-first |
| **Exelare** | ATS & CRM | We're AI-first, they're database-first |

### African Competitors
| Company | What They Do | Our Advantage |
|---------|--------------|---------------|
| **Jobberman** (Nigeria) | Large job board | We're AI screening, not listings |
| **Afriwork** (Ethiopia) | Telegram-based hiring | We're email/inbox native |
| **Andela** | Vetted tech talent marketplace | We screen, they place |
| **Jobzyn** (Morocco) | AI matching + video | We're more evidence-focused |

### Global Competitors
| Company | Valuation | Our Advantage |
|---------|-----------|---------------|
| **HireVue** | Private (large) | We're SMB, they're enterprise |
| **Eightfold AI** | Private (large) | We're simpler, SA-specific |
| **Beamery** | ~$1B unicorn | We're leaner, inbox-native |
| **Paradox (Olivia)** | Private | We're CV-first, they're chat-first |
| **SeekOut** | Private | We screen inbound, they source |

---

## HOW TO BEAT THEM ALL

1. **Inbox-native** - We work where HR already works (email)
2. **Evidence-based AI** - We show WHY with quotes, not just scores
3. **SA-specific** - We understand BCom, CA(SA), local companies
4. **Explainable** - Every decision can be justified (POPIA compliant)
5. **SME-focused** - Not enterprise complexity
6. **Human-in-loop** - AI assists, recruiter decides

---

## FEATURE IDEAS (FUTURE ROADMAP)

### AI Job Posting to Platforms
| Platform | Integration Approach | Priority |
|----------|---------------------|----------|
| **Gumtree SA** | They have API for business accounts | Medium |
| **PNet** | API available for ATS integrations | High |
| **LinkedIn** | LinkedIn Recruiter API (expensive) | Low |
| **Indeed SA** | XML feed or API | Medium |
| **Careers24** | API for partners | Medium |
| **JobJack** | API inquiry needed | Low |

**Feature concept:**
- Employer creates role in HireInbox
- AI generates optimized job posting
- One-click publish to multiple platforms
- All applications flow back to HireInbox inbox
- Single dashboard for all channels

### WhatsApp Integration
- SA is WhatsApp-heavy
- Candidate notifications via WhatsApp
- Could use WhatsApp Business API
- Afriwork proves this works in Africa

### AI Candidate Engagement
- Auto-acknowledge all applications
- Send status updates automatically
- Rejection emails with feedback (kind, constructive)
- Interview scheduling via chat

### Compliance Features
- Employment Equity tracking (SA requirement)
- POPIA consent management
- Audit trail for all decisions
- Bias detection in AI recommendations

### Video Features (Phase 2)
- AI Interview (in progress)
- Video Personality Analysis
- Async video screening
- Interview recording + transcription

---

## AI HR TECH TRENDS 2025 (Key Insights)

### Trust Problem
- Only small % of candidates trust AI screening
- Solution: **Explainability** - show WHY (we do this!)

### AI vs AI Arms Race
- Candidates using AI to write CVs
- Employers using AI to screen
- Our edge: Evidence-based detection of genuine vs fluff

### Adoption Stats
- 88-99% of large orgs use AI in HR
- SMEs still underserved (our market!)

### Emerging Tech
- **Agentic AI** - AI that acts autonomously
- **Cheating Detection** - Alex AI detects ChatGPT use in interviews
- **Skills Ontology** - Dynamic skill extraction without predefined lists

### Key Players to Watch
- **Harver** - Bias-aware screening
- **Paradox (Olivia)** - Conversational AI recruiting
- **SeekOut** - AI-powered sourcing
- **HireVue** - Video + AI assessment

---

## RESEARCH LINKS (Saved for Reference)

### Global Trends
- [AI Recruitment 2025 Guide](https://www.herohunt.ai/blog/ai-recruitment-2025-the-extremely-in-depth-expert-guide-10k-words)
- [HR Tech 2025 Products](https://www.hrtechnologyconference.com/new-products)
- [AI Recruitment Trends](https://www.talentmsh.com/insights/ai-in-recruitment)

### African Market
- Talent Genie SA - Local AI recruitment leader
- Afriwork - Telegram-based hiring in East Africa
- Jobberman - Pan-African job network

---

## API SPEND TRACKING

| Date | Spend | Purpose | Running Total |
|------|-------|---------|---------------|
| 20 Dec 2024 | ~$50-70 (est) | Training data generation (1300 items) | ~$50-70 |
| | | | |
| **Budget** | **$99** | | |
| **Remaining** | **~$29-49** | | |

**Alert:** Top up when remaining drops below $20

---

## PRIORITY ROADMAP

### Phase 1: AI Excellence (Current)
| Task | Bucket | Status |
|------|--------|--------|
| SA context in prompts | B2B | Done |
| Generate training data | B2B | Running |
| Calibrate AI accuracy | B2B | Pending |
| Feedback loop | B2B | Pending |

### Phase 2: Ship Core
| Task | Bucket | Status |
|------|--------|--------|
| Fix PDF upload | B2C | Pending |
| Auth system | B2B | Pending |
| Payments | General | Pending |
| Deploy | General | Pending |

### Phase 3: AI Interview
| Task | Bucket | Status |
|------|--------|--------|
| Video recording | B2Recruiter | Pending |
| Transcription | B2Recruiter | Pending |
| AI analysis | B2Recruiter | Pending |
| Interview UI | B2Recruiter | Pending |

### Phase 4: Scale & Differentiate
| Task | Bucket | Status |
|------|--------|--------|
| Job posting to platforms | Ideas | Future |
| WhatsApp integration | Ideas | Future |
| Pro Tools backends | B2Recruiter | Future |
| B2C upsell backends | B2C | Future |

---

## REMINDERS

1. **B2B + B2C core AI is REAL and working**
2. B2Recruiter tools are roadmap/demo only
3. The moat = AI quality + SA knowledge + feedback loop
4. AI Interview is the killer B2Recruiter feature
5. Beat competitors with: Inbox-native + Evidence + SA-specific
6. POPIA: Opt-in talent pool is legal, scraping is not
7. Year 1 realistic: R30k-R100k revenue with hustle
8. Monitor OpenAI spend: https://platform.openai.com/usage
9. First 10 clients from personal network + recruiter partnerships
10. WhatsApp integration could be game-changer for SA market

---

*"We have just begun..." - Simon Rubin, Founder*
