# HIREINBOX AI BRAIN - Master Architecture
## The Heart of Everything

---

## THE CORE INSIGHT

One AI brain. Four products. One SA context moat.

```
                    ┌─────────────────────────────────────┐
                    │         HIREINBOX AI BRAIN          │
                    │                                     │
                    │   SA Context Intelligence Layer     │
                    │   Evidence-Based Reasoning Engine   │
                    │   Fine-tuned on 10K+ SA Examples    │
                    └─────────────────────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
      ┌──────────┐            ┌──────────┐            ┌──────────┐
      │   B2B    │            │   B2C    │            │ B2Creator│
      │ Employer │            │Job Seeker│            │ Creator  │
      │ Screens  │            │ Feedback │            │ Passport │
      └──────────┘            └──────────┘            └──────────┘
            │                        │                        │
            ▼                        ▼                        ▼
      ┌──────────┐            ┌──────────┐            ┌──────────┐
      │B2Recruiter            │ CV Coach │            │ Video    │
      │ Pro Tools│            │ Rewriter │            │ Analysis │
      └──────────┘            └──────────┘            └──────────┘
```

---

## WHY ONE BRAIN MATTERS

1. **Training compounds** - Every screening improves all products
2. **SA context shared** - CA(SA) understood everywhere
3. **Cost efficiency** - One fine-tuned model, 4 revenue streams
4. **Moat deepens** - More data = harder to replicate

---

## SA CONTEXT INTELLIGENCE (The Moat)

### Qualifications Database

| Qualification | Meaning | Signal |
|---------------|---------|--------|
| CA(SA) | Chartered Accountant SA | Gold standard, 3yr articles, ~50% pass rate |
| AGA(SA) | Associate General Accountant | Stepping stone to CA(SA) |
| ACCA | UK accounting qualification | Respected, shows international ambition |
| BCom (Acc) | Commerce in Accounting | Foundation for CA(SA) track |
| BCom (Hons) | Honours in Commerce | Extra year, research skills |
| CFA | Chartered Financial Analyst | Investment focus, US qualification |
| FASSA | Fellow Actuarial Society SA | Elite, <500 in SA |
| Pr.Eng | Professional Engineer | ECSA registered |
| PrCPM | Project Manager | SACPCMP registered |
| LLB | Law degree | Required for attorney admission |

### University Tiers

**Tier 1 (Elite):**
- UCT (University of Cape Town) - Research flagship
- Wits (Witwatersrand) - Johannesburg, strong commerce
- Stellenbosch - Afrikaans, strong actuarial/engineering
- UP (Pretoria) - Large, well-resourced

**Tier 2 (Strong):**
- Rhodes - Small, high quality
- UKZN (KwaZulu-Natal) - Strong in certain fields
- UJ (Johannesburg) - Large, improving
- NWU (North-West) - Split campuses

**Distance/Alternative:**
- Unisa - Distance learning, shows grit (NOT penalized)
- Mancosa - Business school, practical focus
- Regent - Private, newer

**International (SA-relevant):**
- LSE, Oxford, Cambridge - Elite, if returned to SA = strong signal
- Australian unis - Common for SA students

### Company Signals

**Big 4 Accounting (Training ground):**
- PwC, Deloitte, EY, KPMG
- 3-year articles = well-trained
- Senior Manager+ = proven leader

**Elite Finance:**
- Investec - Investment bank, high bar
- RMB (Rand Merchant Bank) - Corporate finance
- Allan Gray - Asset management, very selective
- Discovery - Insurance/tech, innovative culture
- Sanlam - Traditional but solid

**Consulting:**
- McKinsey, BCG, Bain - Global elite, rare in SA
- Accenture - Large, varied quality
- Deloitte Consulting - Growing

**Tech:**
- Takealot - SA's Amazon
- Naspers/Prosus - Media/tech giant
- Discovery Vitality - Tech-driven insurance
- FNB Digital - Banking innovation

**Mining/Industrial:**
- Anglo American - Blue chip
- Sasol - Engineering powerhouse
- BHP - Global resources

### School Signals (Yes, these matter in SA)

**Traditional Boys:**
- Grey College (Bloemfontein) - Rugby, leadership
- Bishops (Cape Town) - Elite, old boys network
- Michaelhouse - KZN, boarding
- SACS - Cape Town, academics

**Traditional Girls:**
- Herschel - Cape Town elite
- St Mary's - Johannesburg
- Roedean - Johannesburg

**Academic:**
- Pretoria Boys High - Strong academics
- Rondebosch Boys - Cape Town
- King David - Jewish, strong

**Signals:**
- Head Boy/Girl = Leadership proven
- Dux Scholar = Top academic
- First Team = Commitment, pressure handling
- Prefect = Responsibility

### Township/Disadvantaged Background Signals

**POSITIVE signals (not deficits):**
- Unisa degree while working = Determination
- First in family to graduate = Pioneer mentality
- Township school to Big 4 = Exceptional grit
- Learnerships/bursaries = Resourceful

**Never penalize:**
- Non-elite school background
- Gap years (context matters)
- Multiple short roles (economy context)
- Afrikaans/Zulu names (obvious, but must be explicit)

---

## TRAINING DATA STRATEGY

### Phase 1: Current (Dec 2024)
- Jobs: 2,835 → 3,500 target
- CVs: 5,089 → 10,000 target
- Screenings: 0 → 10,000 target

### Phase 2: Screening Pairs (Jan 2025)
Create intelligent pairs:
- Strong match (CV fits job well)
- Weak match (major gaps)
- Edge cases (close but not quite)
- Exception candidates (potential despite gaps)

Distribution target:
- 30% SHORTLIST examples
- 40% CONSIDER examples
- 30% REJECT examples

### Phase 3: Quality Control
For each screening, validate:
- Score matches recommendation
- Evidence quotes are real (from CV)
- Experience math is correct
- SA context applied correctly

### Phase 4: Fine-Tuning
Model: GPT-4o-mini (cheaper inference)
Training: 10K+ high-quality examples
Expected improvement:
- Faster (cached patterns)
- Cheaper (1/10th cost)
- Consistent (our voice)
- SA-native (baked in context)

---

## UNIFIED PROMPT ARCHITECTURE

### Core Components (shared across all products)

```javascript
const SA_CONTEXT_BLOCK = `
SA CONTEXT INTELLIGENCE:
[Full qualification/university/company database above]
`;

const EVIDENCE_RULES = `
EVIDENCE-BASED REASONING (MANDATORY):
- Every claim needs a quote from source material
- No quote = don't make the claim
- Score justification must reference specific evidence
- "Not mentioned" is valid when something is missing
`;

const TONE_RULES = `
TONE:
- Direct, not corporate speak
- Specific, not generic
- Honest about gaps
- SA-aware, not US-centric
`;
```

### Product-Specific Layers

**B2B Screening:**
```javascript
const B2B_LAYER = `
OUTPUT: Screening decision for recruiter
GOAL: Save time, catch good candidates, justify rejections
SCORING: Strict, evidence-required, POPIA-ready
`;
```

**B2C Feedback:**
```javascript
const B2C_LAYER = `
OUTPUT: Helpful feedback for job seeker
GOAL: Be honest, be helpful, show quick wins
TONE: Coach, not critic
SCORING: Constructive, not brutal
`;
```

**B2Creator Video:**
```javascript
const B2CREATOR_LAYER = `
OUTPUT: Authenticity verification + coaching
GOAL: Help creators land brand deals
ANALYSIS: Video presence, not metrics
TONE: Encouraging but real
`;
```

**B2Recruiter Pro:**
```javascript
const B2RECRUITER_LAYER = `
OUTPUT: Deep analysis for professional recruiters
GOAL: Nuanced assessment, interview questions, salary range
SCORING: Context-aware, market-aware
`;
```

---

## BRAIN TRAINING PIPELINE

### Files & Scripts

| Script | Purpose |
|--------|---------|
| `mega-pipeline.mjs` | Generate jobs + CVs in bulk |
| `run-screening.mjs` | Run AI screening on pairs |
| `validate-quality.mjs` | Check output quality (TO BUILD) |
| `prepare-finetune.mjs` | Format for OpenAI fine-tuning (TO BUILD) |

### Commands

```bash
# Generate more data
OPENAI_API_KEY="..." node scripts/training-data/mega-pipeline.mjs

# Run screenings (will take 10-14 hours for 10K)
OPENAI_API_KEY="..." node scripts/training-data/run-screening.mjs

# Check quality (TO BUILD)
node scripts/training-data/validate-quality.mjs

# Prepare for fine-tuning (TO BUILD)
node scripts/training-data/prepare-finetune.mjs
```

---

## METRICS TO TRACK

### Quality Metrics
- % of screenings with valid evidence quotes
- % of scores within expected ranges
- % of SA qualifications correctly identified
- False positive rate (bad candidates shortlisted)
- False negative rate (good candidates rejected)

### Business Metrics
- Screening accuracy vs human decision
- Time saved per screening
- API cost per screening
- Fine-tuned model improvement %

---

## COMPETITIVE MOAT CHECKLIST

| Asset | Status | Moat Strength |
|-------|--------|---------------|
| SA qualification database | ✅ Complete | Strong |
| SA university tiers | ✅ Complete | Strong |
| SA company signals | ✅ Complete | Strong |
| Evidence-based prompts | ✅ Proven | Strong |
| 10K+ screening examples | 🔄 Building | Growing |
| Fine-tuned model | ⏳ Pending | Will be strongest |
| Video authenticity scoring | ✅ Working | Unique |
| Creator verification | 🔄 Building | New market |

---

## NEXT STEPS (PRIORITY ORDER)

1. **Generate remaining data** (CVs to 10K, jobs to 3.5K)
2. **Run 10K screenings** (overnight pipeline)
3. **Validate quality** (build checker script)
4. **Fine-tune model** (OpenAI API)
5. **Deploy unified brain** (single SA context module)
6. **Measure vs baseline** (before/after fine-tuning)

---

## THE VISION

**Month 1:** 10K examples, patterns identified
**Month 3:** Fine-tuned model live, 10x cheaper
**Month 6:** 100K examples, SA's smartest recruiter
**Year 1:** The AI that actually understands SA talent

No global tool will catch up. They don't have:
- The data (SA-specific)
- The context (qualifications, companies, culture)
- The evidence requirement (POPIA-ready)
- The local partnerships (coming)

---

*Document created: December 22, 2024*
*This is the heart of HireInbox.*
