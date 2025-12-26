# Company Town: AI Behavior Specification
## How the AI Learns and Adapts to Each Company

---

## 1. THE THREE-PHASE LEARNING PROCESS

### Phase 1: Web Research (Automatic, <30 seconds)

When a company signs up with just their website URL, the AI:

```
INPUT: company_url (e.g., "mafadi.co.za")

PROCESS:
1. Crawl homepage + about + services pages
2. Extract: logo, colors, fonts, tone
3. Identify: industry, services, departments
4. Detect: terminology, compliance requirements
5. Infer: likely role types, seniority levels

OUTPUT: draft_brand_profile + suggested_taxonomy
```

**What the AI extracts from Mafadi.co.za:**

| Category | Extracted Data |
|----------|----------------|
| Brand | Logo URL, Black/Green palette, Professional tone |
| Industry | Property Management, Real Estate |
| Services | Body Corporate, Residential, Commercial, Airbnb |
| Terminology | "Letting", "Sectional title", "Managing agent", "Portfolio" |
| Likely Roles | Portfolio Manager, Letting Agent, Trustees Liaison |
| Compliance | CSOS, Sectional Title Act, POPIA |
| Geography | Johannesburg HQ, 4 provinces |

### Phase 2: Confirmation Questions (6 questions, <2 minutes)

After the AI generates its draft, show the company:

```
"We researched your business. Here's what we found.
Please confirm or correct:"

1. YOUR DEPARTMENTS
   We found these divisions:
   ☑ Body Corporate & Sectional Title
   ☑ Residential Letting
   ☑ Commercial Property
   ☑ Airbnb / Short-Stay
   ☐ Sales (Add?)
   [+ Add Custom]

2. YOUR KEY ROLES (most hired)
   Which roles do you hire most often?
   ☐ Portfolio Manager
   ☐ Letting Agent
   ☐ Property Manager
   ☐ Accountant / Bookkeeper
   ☐ Maintenance Technician
   [+ Add Custom]

3. MUST-HAVE QUALIFICATIONS
   For your industry, which matter most?
   ☐ CA(SA) or similar accounting
   ☐ CSOS Registration
   ☐ Sectional Title certification
   ☐ Real Estate license (PPRA)
   ☐ Trade certification (electrical, plumbing)
   [+ Add Custom]

4. YOUR TERMINOLOGY
   What do you call these?
   "Candidates" → [Applicants] / [Candidates] / [Custom: ___]
   "Shortlist" → [Shortlist] / [Final Round] / [Custom: ___]
   "Rejected" → [Not Suitable] / [Declined] / [Custom: ___]

5. YOUR TEAM SIZE
   How many people will use HireInbox?
   ○ Just me
   ○ 2-5 people
   ○ 6-20 people
   ○ 20+ people

6. YOUR HIRING VOLUME
   How many CVs do you receive per month?
   ○ 1-20
   ○ 21-50
   ○ 51-200
   ○ 200+
```

### Phase 3: Continuous Learning (Ongoing)

The AI learns from the company's behavior:

| Signal | What AI Learns |
|--------|----------------|
| Shortlisted candidates | What "good" looks like for this company |
| Rejected candidates | What red flags matter to them |
| Role descriptions | Their actual requirements vs. generic |
| Feedback given | Specific criteria they value |
| Time-to-hire | Which districts are urgent vs. evergreen |

---

## 2. AI SCREENING CONTEXT

### 2.1 Company-Specific Scoring Rubric

After onboarding, the AI generates a scoring rubric:

```json
{
  "company_id": "mafadi-123",
  "industry_context": "property_management",
  "scoring_rules": {
    "must_haves": [
      {
        "criteria": "property_management_experience",
        "weight": 30,
        "evidence_required": true,
        "keywords": ["portfolio", "letting", "property manager", "managing agent"]
      },
      {
        "criteria": "sectional_title_knowledge",
        "weight": 20,
        "evidence_required": true,
        "keywords": ["sectional title", "body corporate", "CSOS", "trustees"]
      }
    ],
    "nice_to_haves": [
      {
        "criteria": "gauteng_experience",
        "weight": 10,
        "keywords": ["johannesburg", "gauteng", "pretoria"]
      }
    ],
    "red_flags": [
      {
        "flag": "job_hopping",
        "threshold": "3 jobs in 2 years",
        "action": "flag_for_review"
      }
    ]
  }
}
```

### 2.2 District-Specific Screening

Each district has its own scoring context:

**Body Corporate Ops:**
```
- Must have: Sectional Title Act knowledge (evidence required)
- Must have: Trustees liaison experience
- Bonus: CSOS registration
- Bonus: Levy collection experience
- Red flag: No property background at all
```

**Finance & Collections:**
```
- Must have: Accounting qualification (CA(SA), CIMA, BCom Acc)
- Must have: Property industry experience
- Bonus: Credit control experience
- Red flag: Gaps >6 months unexplained
```

---

## 3. GUARDRAILS & COMPLIANCE

### 3.1 Anti-Discrimination Rules

The AI NEVER considers or mentions:
- Age (except "years of experience" which is legal)
- Gender
- Race
- Religion
- Marital/family status
- Disability (unless role-specific requirement)
- Pregnancy
- Political affiliation

**Implementation:**
```python
FORBIDDEN_SIGNALS = [
    "age", "old", "young", "mature",
    "male", "female", "gender",
    "race", "black", "white", "coloured", "indian",
    "married", "single", "children", "pregnant",
    "disabled", "handicap",
    # etc.
]

def sanitize_output(analysis: dict) -> dict:
    for field in analysis:
        for signal in FORBIDDEN_SIGNALS:
            if signal in str(analysis[field]).lower():
                raise ComplianceError(f"Forbidden signal: {signal}")
    return analysis
```

### 3.2 POPIA Compliance

- All CV data encrypted at rest
- Candidates can request deletion
- Audit trail for all AI decisions
- No data shared between companies
- Retention policy: 24 months default, configurable

### 3.3 Evidence-Based Outputs

Every AI claim must be:
1. **Sourced**: Quote from CV or "not mentioned"
2. **Verifiable**: Link to specific section
3. **Transparent**: Show confidence level

**Bad output:**
```
"Candidate has strong leadership skills"
```

**Good output:**
```
"Leadership experience: 'Led team of 8 portfolio managers' (CV, page 2)
Confidence: HIGH - explicit mention with team size"
```

### 3.4 Audit Trail

Every screening decision is logged:

```json
{
  "screening_id": "scr_abc123",
  "timestamp": "2024-12-22T10:30:00Z",
  "candidate_id": "cand_xyz",
  "role_id": "role_456",
  "company_id": "mafadi-123",
  "ai_model": "gpt-4o-2024-08",
  "input_hash": "sha256:...",
  "decision": "shortlist",
  "score": 82,
  "evidence": [
    {"claim": "sectional_title_exp", "source": "CV page 2, line 14", "quote": "..."}
  ],
  "rubric_version": "v1.2"
}
```

---

## 4. AI PROMPTS

### 4.1 Brand Extraction Prompt

```
You are analyzing a company website to extract brand and business information for a recruitment platform.

Website content: {website_html_or_text}

Extract the following in JSON format:

{
  "brand": {
    "primary_color": "<hex or null>",
    "secondary_color": "<hex or null>",
    "accent_color": "<hex or null>",
    "tone": "<formal|professional|casual|friendly>",
    "logo_url": "<if found>"
  },
  "business": {
    "industry": "<primary industry>",
    "sub_industries": ["<list>"],
    "services": ["<list of services offered>"],
    "locations": ["<offices/regions>"],
    "company_size_hint": "<startup|sme|enterprise|unknown>"
  },
  "recruitment_context": {
    "likely_departments": ["<inferred departments>"],
    "likely_roles": ["<common role titles>"],
    "terminology": {
      "<generic_term>": "<company_specific_term>"
    },
    "compliance_hints": ["<industry regulations>"],
    "qualification_keywords": ["<relevant certifications>"]
  }
}

Be conservative. Only include what you can clearly infer. Mark uncertain fields as null.
```

### 4.2 Taxonomy Builder Prompt

```
You are building a hiring taxonomy for a {industry} company.

Company context:
- Services: {services}
- Departments: {departments}
- Common roles: {roles}
- Terminology: {terminology}

Create district definitions:

{
  "districts": [
    {
      "id": "<slug>",
      "name": "<display name using company terminology>",
      "description": "<what this district covers>",
      "typical_roles": ["<role titles>"],
      "must_have_criteria": ["<essential qualifications>"],
      "nice_to_have": ["<bonus qualifications>"],
      "red_flags": ["<warning signs>"],
      "kpis": ["<what managers care about>"]
    }
  ]
}

Create 5-8 districts that cover the company's hiring needs.
Use their terminology, not generic HR terms.
```

---

## 5. LEARNING LOOP

### 5.1 Feedback Signals

| User Action | AI Learning |
|-------------|-------------|
| Shortlist candidate | This profile pattern = good |
| Reject candidate | This profile pattern = bad |
| Edit AI summary | AI missed something or got it wrong |
| Override score | Calibration needed for this role |
| Hire candidate | Gold standard profile |

### 5.2 Model Updates

- Daily: Update scoring weights based on feedback
- Weekly: Retrain role templates from successful hires
- Monthly: Review district effectiveness, suggest merges/splits

### 5.3 Transparency

Show companies how AI is learning:

```
"AI Insights for Finance District:
- 12 candidates screened this month
- Your team shortlists candidates with CA(SA) 3x more often
- Suggestion: Increase CA(SA) weight from 15% to 25%?
[Accept] [Ignore] [Customize]"
```

---

## 6. EDGE CASES

| Scenario | Handling |
|----------|----------|
| Company website is sparse | Fall back to industry defaults, ask more questions |
| Multiple subsidiaries | Create parent company with child towns |
| Rebranding | Allow brand refresh without losing taxonomy |
| AI extracts wrong industry | Confirmation step catches this |
| Candidate disputes AI decision | Show full audit trail, allow human override |
| Company in multiple countries | Separate compliance rules per region |

---

*The AI should feel like a well-briefed recruiter who's been at the company for 6 months, not a generic chatbot.*
