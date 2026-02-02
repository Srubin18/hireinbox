# HIREINBOX - Claude Code Context

> **Founder:** Simon Rubin, Cape Town
> **CTO:** Claude (you)
> **Mission:** AI-powered CV screening for South African SMEs

---

## WHAT IS HIREINBOX?

HireInbox is an AI recruitment platform that screens CVs with evidence-based reasoning. We work where HR already works - email inboxes - and use AI to:

1. Screen CVs against job requirements
2. Score candidates with explainable AI (quotes from CV)
3. Save recruiters time (50 CVs → 6 shortlisted in seconds)
4. Stay POPIA compliant (audit trail for all decisions)

---

## THE MOAT (COMPETITIVE ADVANTAGE)

1. **Inbox-native** - Work in email, not a new system
2. **Evidence-based AI** - Every decision shows WHY with quotes
3. **SA-specific** - Understands CA(SA), BCom, local companies
4. **Explainable** - POPIA compliant, can justify every decision
5. **SME-focused** - Simple, not enterprise bloat
6. **Human-in-loop** - AI assists, recruiter decides

---

## CORE PRINCIPLE: UNIFIED AI BRAIN

> **"The AI is a unified brain across B2B, B2C, and Video."** — Simon Rubin

This is NON-NEGOTIABLE. Every AI feature must connect to the same intelligence:

| System | Must Include |
|--------|--------------|
| B2B CV Screening | SA_CONTEXT_PROMPT (full) |
| B2C CV Analysis | SA_CONTEXT_PROMPT (full) |
| Video Analysis | SA_CONTEXT_PROMPT (full) + CV context if available |
| Any Future AI Feature | SA_CONTEXT_PROMPT (full) |

**Rules:**
1. **NEVER** create a standalone AI feature that doesn't use SA context
2. **ALWAYS** use `SA_CONTEXT_PROMPT` from `/src/lib/sa-context.ts`
3. **ALWAYS** pass context between features (CV → Video, etc.)
4. **NEVER** use the shortened `SA_CONTEXT_B2C` — always full intelligence
5. When adding new SA knowledge, add it to `sa-context.ts` so ALL features benefit

**Why:**
- One brain = consistent intelligence
- Training data benefits all features
- SA context is our moat — it must be everywhere
- Users get the same quality whether B2B, B2C, or Video

**Location of SA Intelligence:** `/src/lib/sa-context.ts`

---

## PROJECT STRUCTURE

```
/Users/simon/Desktop/hireinbox/
├── src/
│   ├── app/
│   │   ├── page.tsx              # B2B landing + dashboard
│   │   ├── upload/page.tsx       # B2C CV upload
│   │   └── api/
│   │       ├── fetch-emails/     # IMAP + AI screening
│   │       ├── analyze-cv/       # B2C CV analysis
│   │       ├── roles/            # Role CRUD
│   │       └── candidates/       # Candidate CRUD
│   ├── components/
│   │   ├── CandidateCard.tsx
│   │   ├── CandidateModal.tsx
│   │   └── ...
│   └── lib/
│       └── supabase.ts
├── scripts/
│   └── training-data/            # AI calibration pipeline
├── CLAUDE.md                     # This file
├── MASTER_TODO.md                # Full task list
└── .env.local                    # API keys (never commit)
```

---

## 5 BUCKETS

| Bucket | Description | Status |
|--------|-------------|--------|
| **B2B** | Employer dashboard, inbox screening | Core working |
| **B2C** | Job seeker CV upload, feedback | Real AI working |
| **B2Recruiter** | Pro tools, AI interview | UI mockups only |
| **General** | Auth, payments, legal, deploy | Pending |
| **Ideas** | Future features, research | Ongoing |

---

## WHAT'S REAL vs FAKE

| Feature | Status |
|---------|--------|
| B2B CV screening (Fine-tuned model) | **REAL - LIVE** |
| B2C CV analysis (Fine-tuned model) | **REAL - LIVE** |
| Video Analysis (Claude Vision) | **REAL - LIVE** |
| Headhunter Search | UI mockup only |
| Elite Talent Hub | UI mockup only |
| Reference Check Hub | UI mockup only |
| AI Interview | Not built yet |

---

## TECH STACK

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Inline CSS (no Tailwind)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o / GPT-4o-mini
- **Email:** IMAP integration
- **Hosting:** Vercel (not deployed yet)

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | B2B landing + employer dashboard |
| `src/app/upload/page.tsx` | B2C CV upload page |
| `src/app/api/fetch-emails/route.ts` | IMAP fetch + AI screening logic |
| `src/app/api/analyze-cv/route.ts` | B2C CV analysis endpoint |
| `MASTER_TODO.md` | Complete project task list |

---

## AI SCREENING PROMPT

The core AI is in `src/app/api/fetch-emails/route.ts` - the `TALENT_SCOUT_PROMPT`.

Key rules:
- Zero invented strengths (evidence required)
- Every claim needs a quote or "not mentioned"
- SA-specific context (CA(SA), BCom, local companies)
- Score calibration: SHORTLIST 80-100, CONSIDER 60-79, REJECT <60
- Exception rule for near-miss candidates with strong trajectory

---

## CODING STANDARDS

1. **No Tailwind** - Use inline CSS
2. **TypeScript** - Always typed
3. **No emojis in code** - Unless user requests
4. **Prefer editing** - Don't create new files unless necessary
5. **Keep it simple** - No over-engineering
6. **SA context** - Remember this is for South African market

---

## COMMON COMMANDS

```bash
# Start dev server
npm run dev

# Check training pipeline
tail -50 scripts/training-data/pipeline_run.log

# View generated data
ls -la scripts/training-data/data/
```

---

## CUSTOM SLASH COMMANDS

Type these in Claude Code for quick actions:

| Command | What it does |
|---------|--------------|
| `/project:status` | Quick project status check |
| `/project:b2b` | Focus on B2B features |
| `/project:b2c` | Focus on B2C features |
| `/project:fix <issue>` | Fix a specific issue |
| `/project:think <topic>` | Deep think about something |
| `/project:ship` | Pre-ship verification checklist |

---

## CUTTING-EDGE PATTERNS (from Anthropic engineers)

### 1. Plan Mode for Complex Work
Use plan mode for multi-hour features. It can "2-3x success rates" by aligning first.
```
Simon: "I want to add auth"
Claude: *enters plan mode, explores codebase, presents plan*
Simon: "Approved"
Claude: *executes with clarity*
```

### 2. Diary/Memory System
After each major task, I write a diary entry documenting:
- What was tried
- What failed and why
- What worked
- Patterns to reuse
Location: `docs/DIARY.md`

### 3. Ask Me to Ask Questions
Say: "Let's brainstorm - please ask me questions"
I don't naturally ask questions, but this unlocks better collaboration.

### 4. Compounding Engineering
Every feature should produce:
- Working code
- Reusable prompt patterns
- Custom slash commands
- Documentation updates
This compounds into faster future work.

### 5. Stop Hooks (Coming Soon)
Run logic after each turn: "If tests don't pass, keep going"
Deterministic outcomes from non-deterministic processes.

---

## HOW SIMON USES ME BEST

1. **Start sessions with context** - I read CLAUDE.md automatically
2. **Use `/clear` between tasks** - Keeps context fresh
3. **Ask me to plan first** - "Read the files, then make a plan"
4. **Use "think harder"** - For complex architecture decisions
5. **Give visual context** - Drag screenshots into chat
6. **Be specific** - Details > vague requests
7. **Say "ask me questions"** - For brainstorming sessions
8. **Review diary after features** - Learn from past patterns

---

## CURRENT PRIORITIES

1. **V2 Brain Training** - 10,000 screenings in progress (v1 live with 860 examples)
2. **Video Analysis** - Claude Vision LIVE, world-class coaching
3. **B2C Monetization** - Video is paid upsell after free CV scan
4. **Deploy** - Get to Vercel with hireinbox.co.za domain

---

## AI MODELS IN USE

| Purpose | Model | Status |
|---------|-------|--------|
| CV Screening (B2B) | `ft:gpt-4o-mini-2024-07-18:personal:hireinbox-cv-screener:CphiMaZU` | **LIVE** |
| CV Analysis (B2C) | `ft:gpt-4o-mini-2024-07-18:personal:hireinbox-cv-screener:CphiMaZU` | **LIVE** |
| Video Analysis | `claude-sonnet-4-20250514` (Claude Vision) | **LIVE** |
| Transcription | `whisper-1` | **LIVE** |
| V2 Training | 10,000 examples generating | In progress |

---

## MVP STRUCTURE

| Product | Free | Paid | Purpose |
|---------|------|------|---------|
| **B2C** | 1 CV scan | Video analysis (R29-R149) | Revenue driver |
| **B2B** | - | Dashboard + screening (R299+/mo) | Core product |
| **B2Recruiter** | - | TBD | Later |

**B2C Funnel:**
```
Free CV Scan → Show gaps → Upsell Video → "Your CV gets you considered. Your video gets you interviewed."
```

---

## PRICING STRATEGY (Updated January 2026)

> **CORE PRINCIPLE:** HireInbox is an AI Hiring Utility, NOT a marketplace.
> We charge **per role**, NOT per CV, because employers don't control CV volume.

### B2B Per-Role Pricing

| Product | Price | What's Included |
|---------|-------|-----------------|
| **AI CV Screening** | R1,750/role | Unlimited CVs, AI ranking, shortlist, ack emails |
| **AI Interview (Add-On)** | R1,250/role | Avatar interviews, transcripts, psychometric |
| **Verification (Add-On)** | R800/role | ID check, criminal check, reference verification |
| **Full Package** | R3,800/role | All of the above |

### B2C Pricing

| Product | Price |
|---------|-------|
| CV Scan | FREE (1x) |
| CV Rewrite | FREE (1x) |
| Video Analysis | R99-R199 |
| AI Coaching | R149-R299 |
| Position Prep | R199 |
| Video Pitch | R149 |

### Pricing Constants Location

All pricing is centralized in: `/src/lib/pricing.ts`

**Why Per-Role?**
1. Employers cannot control CV volume
2. Per-CV pricing punishes popular employers
3. Fixed per-role cost is predictable and fair
4. Value: R1,750 for 200 CVs = R8.75/CV effective rate

---

## REMINDERS

- Simon is Steve Jobs, you are CTO
- "We have just begun..." - polish hard before ship
- Beat all competitors with simplicity + SA-specific + evidence
- Monitor OpenAI spend: https://platform.openai.com/usage
- Desktop files: `HIREINBOX_TODO/` folder has all bucket checklists
- Desktop files: `HIREINBOX_PROJECT_BIBLE.md` has full documentation

---

## DON'T DO

- Don't add Tailwind
- Don't create unnecessary files
- Don't add emojis unless asked
- Don't over-engineer
- Don't commit .env files
- Don't push to main without asking

---

---

## RALPH - Autonomous Feature Agent

> **RALPH** = Relentless Autonomous Launch & Progress Handler
> Ships features by breaking them into atomic, testable tasks.

### Commands

```
RALPH, build [description]    → Start new feature
RALPH, status                 → Check progress
RALPH, next                   → Get next task
RALPH, done [task-id]         → Complete task
RALPH, fail [task-id]         → Mark failed
RALPH, clear                  → Start fresh
```

### Files

| File | Purpose |
|------|---------|
| `src/agents/ralph/index.ts` | Main agent logic |
| `src/agents/ralph/prd-generator.ts` | Feature → PRD |
| `src/agents/ralph/story-splitter.ts` | PRD → atomic tasks |
| `src/agents/ralph/progress.ts` | Persistence |
| `.claude/memory/agents.md` | Long-term memory |
| `.claude/memory/ralph-progress.json` | Current session |

### Workflow

```
Feature Description → PRD → Atomic Tasks → Execute → Commit → Ship
```

---

## GUARDRAILS & ETHICS

> **Tone:** "Less noise. More hires."

### Core Principles

| Principle | Enforcement |
|-----------|-------------|
| Respectful language | No "rejected", use "not successful" |
| AI is assistive only | Humans make final decisions |
| No auto-outreach | Manual approval required |
| POPIA compliant | Full audit trail, data rights |
| Support everywhere | Support button on all screens |

### Language Guidelines

**Never use:** rejected, failed, unqualified, bad, poor

**Use instead:** not successful, did not meet criteria, does not match requirements, area for improvement, needs development

### AI Guidelines

**Must do:**
- Provide evidence for all recommendations
- Show confidence levels
- Allow human override
- Explain reasoning clearly

**Must not:**
- Make final hiring decisions automatically
- Send outreach without human approval
- Scrape private social media

### POPIA Configuration

| Data Type | Retention |
|-----------|-----------|
| Candidate data | 365 days |
| CV files | 365 days |
| Audit logs | 730 days |
| Deleted account data | 30 days grace |

### Files

| File | Purpose |
|------|---------|
| `src/lib/guardrails.ts` | Core guardrails configuration |
| `src/lib/candidate-emails.ts` | POPIA-compliant email templates |
| `src/components/SupportButton.tsx` | Global support button component |

---

### Last updated: 23 January 2026
