# HireInbox AI Brain Roadmap

**Mission: Become the BEST CV assessor in South Africa for both employers and job seekers.**

**Document Version:** 1.0
**Date:** January 2026
**Author:** RALPH #1 - AI Brain Enhancement Specialist

---

## Executive Summary

HireInbox has a unique opportunity to dominate the South African recruitment AI market by combining:
1. **SA-specific intelligence** (qualifications, universities, companies)
2. **Evidence-based explainable AI** (POPIA-compliant, quotes from CV)
3. **Unified brain architecture** (B2B + B2C using same intelligence)
4. **Fine-tuned model** (currently 6K examples, targeting 20K+)

This roadmap outlines how to enhance the AI brain to deliver world-class value to both employers (B2B) and job seekers (B2C).

---

## Part 1: Current State Assessment

### Model Status

| Attribute | Current State |
|-----------|---------------|
| **Model** | `ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v3:CqlakGfJ` |
| **Training Examples** | 5,999 (5,399 train + 599 validation) |
| **Anti-hallucination Examples** | 5 (CRITICAL GAP) |
| **SA Context** | Comprehensive (sa-context.ts - 527 lines) |
| **Evidence Requirement** | Strong prompt engineering |

### Known Issues (V3 Brain Audit)

| Issue | Severity | Impact |
|-------|----------|--------|
| Education field shows `[object Object]` | CRITICAL | Model learned from broken data |
| Experience always 0 years | CRITICAL | False experience signals |
| Current role "Not specified" | CRITICAL | Role extraction failing |
| Work history often empty | HIGH | Missing job context |
| Anti-hallucination examples sparse | HIGH | Model invents details |

### What Works Well

1. **SA Context Knowledge** - Understands CA(SA), BCom, Big 4, local universities
2. **Output Format** - Consistent JSON structure
3. **Scoring Calibration** - SHORTLIST/CONSIDER/REJECT aligned with scores
4. **Evidence Prompting** - System prompt enforces quotes
5. **Dual-Mode Support** - B2B screening + B2C coaching work from same brain

---

## Part 2: Employer Benefits (B2B)

### Value Proposition for Employers

#### 1. Speed: Screening at Scale

| Metric | Current | Target |
|--------|---------|--------|
| CVs screened per minute | 10+ | 50+ |
| Time to shortlist 100 CVs | ~10 min | ~2 min |
| API response time | ~3-5 sec | ~1-2 sec |

**How to achieve:**
- Batch processing API endpoint
- Caching for similar job requirements
- Optimized prompt length

#### 2. Accuracy: Matching Requirements

| Feature | Status | Priority |
|---------|--------|----------|
| Hard requirement knockout | Implemented | - |
| Experience math validation | Needs improvement | HIGH |
| Qualification verification | Working | - |
| Skills gap identification | Working | - |
| Near-miss exception rule | Implemented | - |

**Accuracy improvements needed:**
- Better experience calculation from work history dates
- Industry-specific skill recognition
- Qualification equivalency mapping (e.g., ACCA vs CA(SA))

#### 3. Explainability: Why Someone Was Ranked

**Current capabilities:**
- Direct quotes from CV for every strength
- "Not mentioned" when evidence is missing
- Recommendation reason with specific justification
- Risk register with severity levels
- Interview questions generated

**This is our MOAT vs competitors.**

Talent Genie and Job Crystal provide match percentages but limited evidence. Our evidence-based approach is:
- POPIA Section 71 compliant (automated decisions must be explainable)
- Defensible in case of discrimination claims
- Trusted by hiring managers (they see the reasoning)

#### 4. Knockout Detection

Current knockouts detected:
- Minimum experience not met
- Required qualifications missing
- Location mismatch
- Work authorization unclear

**Improvements needed:**
- Configurable knockout rules per role
- Soft vs hard knockouts (dealbreaker vs preference)
- Industry-specific knockouts (e.g., PrEng for engineering roles)

### Competitor Comparison (SA Market)

| Feature | HireInbox | Talent Genie | Job Crystal |
|---------|-----------|--------------|-------------|
| **SA-specific context** | Deep (527 lines) | Basic | Basic |
| **Evidence-based scoring** | Yes (quotes) | No (% match) | No (% match) |
| **Explainable AI** | Full | Limited | Limited |
| **Fine-tuned model** | Yes (6K SA examples) | No (generic AI) | No |
| **POPIA compliance** | Built-in | Claims compliance | Claims compliance |
| **Video analysis** | Yes (Claude Vision) | ClipDrop (separate) | No |
| **Pricing** | R299+/mo (SME focus) | Enterprise | Per-job |
| **WhatsApp native** | Planned | No | No |

**Key insight:** Competitors use generic AI with keyword matching. We use SA-trained, evidence-based reasoning. This is a defensible moat that deepens with more training data.

---

## Part 3: Employee Benefits (B2C)

### Value Proposition for Job Seekers

#### 1. Actionable Feedback

**Current output includes:**
- Overall score (0-100) with explanation
- Specific strengths with evidence
- Prioritized improvements (HIGH/MEDIUM/LOW)
- Quick wins (3 specific changes)
- ATS check with recommendations

**What makes it different from generic tools:**
- Not just "improve your CV" but "Your role at Shoprite lacks outcomes. Add: 'Managed team of 8, reduced shrinkage by 12%'"
- SA-specific advice: "CA(SA) is gold standard - lead with this, not your BCom"
- Recruiter perspective: "In 7 seconds, a recruiter sees: X. Make them see: Y"

#### 2. SA-Specific Advice

The SA context module provides:

**Qualification recognition:**
- Explains why CA(SA) matters (<50% pass rate, globally respected)
- Identifies qualification pathways (AGA(SA) vs ACCA vs CIMA)
- Recognizes local certifications (SABPP, ECSA, HPCSA)

**University tier awareness:**
- UCT/Wits/Stellenbosch = Tier 1
- Unisa = NOT penalized, shows grit
- GIBS/UCT GSB = Top MBAs

**Company signal interpretation:**
- "Big 4 articles" = well-trained
- "Investec/Discovery" = high-performance culture
- "Township background + degree" = exceptional grit

**What competitors miss:**
- They don't know Grey College Head Boy is a leadership signal
- They don't understand CCMA experience matters for HR
- They treat Unisa same as UCT (we celebrate the determination)

#### 3. Video Analysis Coaching

Currently live with Claude Vision:
- Body language assessment
- Communication clarity
- Confidence signals
- Authenticity detection
- SA-specific presentation advice

**Upsell path:** Free CV scan > Paid video analysis (R29-R149)

#### 4. Interview Prep

Generated from CV analysis:
- 5 interview focus questions
- Risk areas to prepare for
- Strength stories to highlight
- Salary positioning advice

**Enhancement opportunity:**
- AI mock interview (coming)
- Industry-specific question banks
- SA salary benchmarking data

---

## Part 4: Brain Improvements

### Priority 1: Fix V3 Training Data Issues

| Task | Status | Effort |
|------|--------|--------|
| Fix education serialization | Pending | 2 hours |
| Fix experience calculation | Pending | 4 hours |
| Fix current role extraction | Pending | 2 hours |
| Fix work history formatting | Pending | 4 hours |
| Regenerate 10K+ clean examples | Pending | 2-3 days |

**Files to fix:**
- `/scripts/training-data/generate-cvs.ts`
- `/scripts/training-data/run-screening.ts`
- `/scripts/training-data/format-v3.mjs`

### Priority 2: Expand Training Data

| Metric | Current | V4 Target | V5 Target |
|--------|---------|-----------|-----------|
| Total examples | 6,000 | 15,000 | 25,000 |
| Anti-hallucination | 5 | 500 | 1,000 |
| SA-specific edge cases | ~100 | 500 | 1,000 |
| Industry verticals | Generic | 5 industries | 10 industries |

**Distribution targets:**
- 30% SHORTLIST examples
- 40% CONSIDER examples
- 30% REJECT examples
- 10% of all should be edge cases

### Priority 3: Industry-Specific Fine-Tuning

| Industry | Current Knowledge | Enhancement Needed |
|----------|-------------------|-------------------|
| Accounting/Finance | Strong (CA(SA), Big 4) | CFA levels, PE experience |
| Engineering | Basic (Pr.Eng) | ECSA categories, mining ops |
| IT/Tech | Basic | Stack specifics, certifications |
| Healthcare | Basic | HPCSA registration, nursing tiers |
| Retail | Basic | Merchandising, category management |
| Legal | Good (Attorneys, Advocates) | Law firm tiers, practice areas |

**Implementation:**
- Add industry-specific context blocks to sa-context.ts
- Generate 1,000+ examples per industry
- Track industry accuracy separately

### Priority 4: Bias Detection and Mitigation

**Current safeguards:**
- Gender-neutral language enforced
- Township background = positive signal (grit)
- Unisa = not penalized
- First-generation graduates = trailblazers

**Enhancements needed:**

1. **Name anonymization option** - Blind screening for B2B
2. **Bias audit logging** - Track recommendations by demographic signals
3. **Fairness metrics dashboard** - Show clients their hiring patterns
4. **Regular model audits** - Quarterly bias testing

**Research insight:** GPT models show 85% preference for white-associated names in CV screening. Our SA-trained model with explicit anti-bias rules should outperform, but needs testing.

### Priority 5: Confidence Scoring

Add confidence levels to all outputs:

```json
{
  "confidence": {
    "level": "HIGH|MEDIUM|LOW",
    "reasons": [
      "Complete work history with dates",
      "Quantified achievements present",
      "SA qualifications verified"
    ],
    "data_quality_score": 0.85
  }
}
```

**When confidence is LOW:**
- Flag for human review
- Show "Unable to verify" statements
- Suggest additional information needed

### Priority 6: Explanation Quality

**Current:** Good but verbose explanations

**Target:** Concise, recruiter-focused insights

| Before | After |
|--------|-------|
| "The candidate has 5 years of experience which exceeds the minimum requirement of 3 years" | "5 years exp (req: 3+) - EXCEEDS" |
| "This is a significant leadership signal from a prestigious school" | "Head Boy at Grey College = proven leadership" |

**Implementation:**
- Train on more concise examples
- Add "TL;DR" summary field
- Recruiter mode vs detailed mode option

---

## Part 5: Training Data Expansion Plan

### Phase 1: Fix and Clean (Week 1-2)

1. Fix data generation pipeline
2. Validate existing 6K examples
3. Remove/flag broken examples
4. Generate 500 anti-hallucination examples

### Phase 2: Scale Up (Week 3-6)

1. Generate to 15,000 total examples
2. Ensure distribution: 30/40/30 (SL/C/R)
3. Add 500 SA-specific edge cases
4. Quality review sample of 500

### Phase 3: Specialize (Week 7-10)

1. Add 2,000 examples per industry (5 industries)
2. Add 200 executive-level examples
3. Add 200 entry-level/graduate examples
4. Add 200 career-changer examples

### Phase 4: Train V4 (Week 11-12)

1. Prepare fine-tuning dataset
2. Run OpenAI fine-tuning job
3. A/B test V3 vs V4
4. Deploy winner

### Quality Criteria for All Examples

- [ ] Education properly formatted (degree, institution, year)
- [ ] Experience calculated correctly from work dates
- [ ] Current role extracted from most recent position
- [ ] Work history formatted with company, dates, achievements
- [ ] Skills listed (not `[object Object]`)
- [ ] Evidence quotes exist in source CV
- [ ] Score matches recommendation
- [ ] SA context referenced where applicable

---

## Part 6: Metrics to Track Brain Quality

### Accuracy Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Evidence accuracy | Unknown | >95% | Spot-check quotes exist in CV |
| Score/recommendation alignment | ~90% | >98% | Automated validation |
| Experience calculation accuracy | ~50% | >95% | Compare to manual calc |
| SA qualification recognition | ~85% | >98% | Test on known CVs |
| False positive rate | Unknown | <5% | Human review sample |
| False negative rate | Unknown | <10% | Track candidate appeals |

### Quality Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Hallucination rate | Unknown (suspected high) | <1% |
| "Not mentioned" when missing | Partial | 100% |
| Confidence calibration | Not tracked | Track accuracy by confidence level |

### Business Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Screening accuracy vs human | Unknown | >90% agreement |
| Time saved per screening | ~5 min | ~8 min (with confidence) |
| API cost per screening | ~$0.03 | ~$0.02 (optimized prompts) |
| Customer satisfaction (B2B) | Not tracked | >85% |
| Job seeker feedback (B2C) | Not tracked | >4.2/5 stars |

### Tracking Implementation

1. **Logging:** Every screening logged with traceId, inputs, outputs
2. **Sampling:** Weekly random sample of 50 screenings for manual review
3. **Feedback loops:**
   - B2B: Did employer agree with recommendation?
   - B2C: Did feedback help? (post-scan survey)
4. **A/B testing:** New model versions tested on 10% traffic first

---

## Part 7: Competitive Moat Analysis

### Why HireInbox Wins

| Moat Layer | Description | Defensibility |
|------------|-------------|---------------|
| **SA Context** | 527 lines of SA-specific intelligence | HIGH - Takes years to build |
| **Training Data** | 6K+ SA examples (targeting 20K+) | HIGH - Proprietary |
| **Evidence-Based** | Every claim has a quote | HIGH - Unique approach |
| **Unified Brain** | Same AI for B2B + B2C | MEDIUM - Architecture choice |
| **POPIA Native** | Explainability built-in | HIGH - Regulatory advantage |
| **Price** | R299/mo vs enterprise pricing | MEDIUM - Can be copied |

### Competitor Vulnerabilities

**Talent Genie:**
- Generic AI (not SA-trained)
- No evidence-based scoring
- Enterprise-focused (ignores SME)
- ClipDrop video is separate product

**Job Crystal:**
- Per-job pricing (expensive at scale)
- Candidate database focus (not screening)
- No explainability

**Global Players (HireVue, Eightfold):**
- Minimum $35K/year
- No SA context
- Under regulatory scrutiny for bias
- Won't serve SA SME market

### Moat Deepening Strategy

1. **More SA data** - Every screening makes us smarter
2. **Industry expertise** - Build vertical-specific knowledge
3. **Integration network** - Connect to SA job boards, WhatsApp
4. **Regulatory compliance** - Be the POPIA-compliant choice
5. **Community** - Build SA recruiter community around the platform

---

## Part 8: Implementation Roadmap

### Immediate (January 2026)

| Task | Owner | Due |
|------|-------|-----|
| Fix training data pipeline | Dev | Jan 31 |
| Generate 500 anti-hallucination examples | Dev | Jan 31 |
| Add runtime hallucination detection | Dev | Jan 31 |
| Deploy V3 with human oversight disclaimer | Dev | Jan 31 |

### Short-term (Q1 2026)

| Task | Owner | Due |
|------|-------|-----|
| Regenerate 15K clean training examples | Dev | Feb 28 |
| Train and deploy V4 model | Dev | Mar 15 |
| Implement confidence scoring | Dev | Mar 31 |
| Add bias audit logging | Dev | Mar 31 |
| Launch industry-specific modes (3 industries) | Dev | Mar 31 |

### Medium-term (Q2 2026)

| Task | Owner | Due |
|------|-------|-----|
| Scale to 20K+ training examples | Dev | Apr 30 |
| Train V5 model | Dev | May 15 |
| Add 5 more industry verticals | Dev | May 31 |
| Implement A/B testing framework | Dev | Jun 30 |
| Build feedback loop from production | Dev | Jun 30 |

### Long-term (H2 2026)

| Task | Owner | Due |
|------|-------|-----|
| 25K+ training examples | Dev | Aug 31 |
| Real-time bias monitoring dashboard | Dev | Sep 30 |
| AI interview prep module | Dev | Oct 31 |
| WhatsApp-native screening | Dev | Nov 30 |
| Pan-African expansion (Nigeria, Kenya context) | Dev | Dec 31 |

---

## Part 9: Success Metrics (12-Month View)

### January 2027 Targets

| Metric | Target |
|--------|--------|
| Training examples | 25,000+ |
| Screening accuracy vs human | >92% |
| Evidence hallucination rate | <1% |
| B2B customer satisfaction | >88% |
| B2C feedback rating | >4.3/5 |
| Industries with specialized models | 10 |
| Monthly screenings | 50,000+ |
| API cost per screening | <$0.015 |

### The Vision

**Month 3:** V4 model live, hallucination fixed, 15K examples
**Month 6:** Industry-specific modes, bias dashboard, 20K examples
**Month 12:** SA's most trusted AI recruiter, expanding to Africa

---

## Appendix A: Technical Architecture

### Current Flow

```
CV Upload → Text Extraction → SA Context + Prompt → GPT-4o-mini (fine-tuned) → JSON Response
```

### Enhanced Flow (Target)

```
CV Upload → Text Extraction → Validation Layer → SA Context + Industry Context + Prompt
    → GPT-4o-mini (V4+) → Response Validation → Confidence Scoring → JSON Response
    → Logging → Feedback Loop → Model Retraining
```

### Key Files

| File | Purpose |
|------|---------|
| `/src/lib/sa-context.ts` | SA intelligence module |
| `/src/app/api/analyze-cv/route.ts` | B2C CV analysis |
| `/src/app/api/screen/route.ts` | B2B CV screening |
| `/scripts/training-data/` | Training pipeline |

---

## Appendix B: SA Context Module Summary

The `sa-context.ts` file contains:

- **Universities:** 4 tiers, 30+ institutions
- **Qualifications:** CA(SA), Pr.Eng, CFA, CIMA, ACCA, FASSA, etc.
- **Companies:** Big 4, Banks, Consulting, Tech, Mining, Retail
- **Schools:** Elite private, top government, leadership signals
- **Cities:** Major, secondary, suburbs, townships
- **Salary ranges:** Entry to executive, by role type
- **Social mission:** Graduate support, township background recognition

This is the moat. No global tool has this depth of SA knowledge.

---

## Appendix C: Competitor URLs

- **Talent Genie:** https://talentgenie.co.za
- **Job Crystal:** https://www.jobcrystal.com
- **ClipDrop (Talent Genie video):** https://clipdrop.io

---

## Conclusion

HireInbox has a clear path to becoming South Africa's best CV assessor:

1. **Fix the data** - V3's training issues must be resolved
2. **Scale the examples** - 6K → 20K+ with quality controls
3. **Deepen the moat** - SA context + evidence-based = unbeatable
4. **Track everything** - Metrics drive improvement
5. **Build the community** - SA recruiters trusting HireInbox

The technology works. The moat exists. The market is ready.

**Next step:** Fix the training data pipeline (this week).

---

*Document created: January 2026*
*RALPH #1 - AI Brain Enhancement Specialist*
*HireInbox: AI-powered CV screening for South African SMEs*
