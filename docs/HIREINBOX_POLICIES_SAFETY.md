# HIREINBOX - POLICIES & SAFETY

> Last Updated: 21 December 2024
> Review alongside: ARCHITECTURE.md, UX_GUIDELINES.md, MILESTONES.md
> CRITICAL: This document defines legal and ethical boundaries.

---

## LEGAL COMPLIANCE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│  APPLICABLE LAWS                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POPIA - Protection of Personal Information Act (SA)               │
│  └─ Primary data protection law for South Africa                   │
│  └─ Similar to GDPR but SA-specific                                │
│  └─ Enforced by Information Regulator                              │
│                                                                     │
│  ECT Act - Electronic Communications and Transactions Act          │
│  └─ Governs electronic contracts and communications                │
│  └─ Requires clear terms of service                                │
│                                                                     │
│  Consumer Protection Act                                            │
│  └─ Fair business practices                                        │
│  └─ Clear pricing, no hidden fees                                  │
│  └─ Cooling-off period for subscriptions                           │
│                                                                     │
│  Employment Equity Act                                              │
│  └─ Non-discrimination in hiring                                   │
│  └─ AI must not discriminate on protected grounds                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## POPIA COMPLIANCE CHECKLIST

### Condition 1: Accountability
- [ ] Appoint Information Officer (Simon Rubin)
- [ ] Register with Information Regulator
- [ ] Maintain processing records

### Condition 2: Processing Limitation
- [x] Only collect data necessary for service
- [x] Get consent before processing
- [ ] Document lawful basis for each data type

### Condition 3: Purpose Specification
- [x] Clearly state purpose at collection
- [x] Don't use data for undisclosed purposes
- [ ] Delete data when purpose is fulfilled

### Condition 4: Further Processing Limitation
- [x] Talent Pool is opt-in only
- [x] No selling data to third parties
- [x] No using CV data for marketing

### Condition 5: Information Quality
- [ ] Allow users to update their data
- [ ] Verify data accuracy where possible

### Condition 6: Openness
- [ ] Privacy Policy published at /privacy
- [ ] Explain what data we collect and why
- [ ] Provide contact for privacy queries

### Condition 7: Security Safeguards
- [x] Encrypt data at rest (Supabase)
- [x] Encrypt data in transit (HTTPS)
- [x] IMAP passwords encrypted with AES-256
- [ ] Regular security audits
- [ ] Incident response plan

### Condition 8: Data Subject Participation
- [ ] Allow data access requests
- [ ] Allow data deletion requests
- [ ] Allow data portability (export)
- [ ] Respond within 30 days

---

## CONSENT REQUIREMENTS

### B2C Signup Consent
```
┌─────────────────────────────────────────────────────────────────────┐
│  REQUIRED CHECKBOX (cannot proceed without):                        │
│                                                                     │
│  □ I agree to the Terms of Service and Privacy Policy.             │
│    I understand that HireInbox will:                               │
│    • Store my CV and personal information                          │
│    • Use AI to analyze my CV                                       │
│    • Contact me about my account                                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  OPTIONAL CHECKBOX (Talent Pool):                                   │
│                                                                     │
│  □ Add me to the Talent Pool (optional)                            │
│    By opting in, employers using HireInbox may view my             │
│    anonymized profile. I can opt out anytime in Settings.          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### B2B Signup Consent
```
┌─────────────────────────────────────────────────────────────────────┐
│  REQUIRED CHECKBOX:                                                 │
│                                                                     │
│  □ I agree to the Terms of Service and Privacy Policy.             │
│    I confirm that:                                                 │
│    • I have authority to connect company email accounts            │
│    • Candidates have submitted CVs for job applications            │
│    • I will use AI screening responsibly and legally               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  EMAIL CONNECTION CONSENT:                                          │
│                                                                     │
│  By connecting your email, you authorize HireInbox to:             │
│  • Access emails with CV attachments                               │
│  • Store CVs for AI screening                                      │
│  • Never read emails unrelated to job applications                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI ETHICS & FAIRNESS

### Non-Discrimination Policy
```
┌─────────────────────────────────────────────────────────────────────┐
│  THE AI MUST NEVER DISCRIMINATE BASED ON:                           │
│                                                                     │
│  • Race, ethnicity, or national origin                             │
│  • Gender or gender identity                                       │
│  • Age (except where legally required)                             │
│  • Disability                                                      │
│  • Religion                                                        │
│  • Sexual orientation                                              │
│  • Marital or family status                                        │
│  • Pregnancy                                                       │
│  • Political opinion                                               │
│                                                                     │
│  HOW WE ENSURE THIS:                                                │
│                                                                     │
│  1. AI prompt explicitly prohibits discrimination                  │
│  2. Training data reviewed for bias                                │
│  3. Regular audits of AI decisions                                 │
│  4. Human can always override AI recommendation                    │
│  5. Evidence-based reasoning makes bias visible                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### AI Transparency
```
┌─────────────────────────────────────────────────────────────────────┐
│  WE ALWAYS TELL USERS:                                              │
│                                                                     │
│  1. AI is making screening recommendations                         │
│  2. Final hiring decisions are made by humans                      │
│  3. How the AI reached its conclusion (evidence)                   │
│  4. That they can dispute AI assessments                           │
│                                                                     │
│  WE NEVER:                                                          │
│                                                                     │
│  1. Pretend AI decisions are final                                 │
│  2. Hide that AI is being used                                     │
│  3. Make AI decisions without explanation                          │
│  4. Use AI for decisions beyond screening                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DATA RETENTION POLICY

```
┌─────────────────────────────────────────────────────────────────────┐
│  DATA TYPE               │ RETENTION        │ DELETION              │
├──────────────────────────┼──────────────────┼───────────────────────┤
│  User account data       │ Until deleted    │ On account deletion   │
│  CV files (B2C)          │ 2 years          │ Auto-delete           │
│  CV files (B2B)          │ 1 year           │ After role closed     │
│  AI screening results    │ 1 year           │ With CV deletion      │
│  Email credentials       │ Until disconnect │ On disconnect         │
│  Payment records         │ 7 years          │ Legal requirement     │
│  Talent Pool profiles    │ Until opt-out    │ On opt-out            │
│  Usage analytics         │ 2 years          │ Anonymized after      │
│  Support conversations   │ 1 year           │ Auto-delete           │
└─────────────────────────────────────────────────────────────────────┘

USER RIGHTS:
• Request deletion anytime (except legal holds)
• Download all their data (portability)
• Request we stop processing (right to object)
• Correct inaccurate data
```

---

## SECURITY POLICIES

### Password Requirements
```
MINIMUM REQUIREMENTS:
• 8 characters minimum
• At least one number
• At least one letter
• No common passwords (checked against list)

STORAGE:
• Passwords hashed with bcrypt (via Supabase Auth)
• Never stored in plain text
• Never logged or displayed
```

### API Key Security
```
RULES:
• Never commit API keys to git
• Store in environment variables only
• Rotate keys if exposed
• Use minimum required permissions

CURRENT KEYS:
• OPENAI_API_KEY - Stored in Vercel env vars
• SUPABASE_SERVICE_KEY - Stored in Vercel env vars
• IMAP passwords - Encrypted in database
```

### Incident Response Plan
```
┌─────────────────────────────────────────────────────────────────────┐
│  IF DATA BREACH DETECTED:                                           │
│                                                                     │
│  1. CONTAIN (immediately)                                          │
│     └─ Disable affected systems                                    │
│     └─ Rotate compromised credentials                              │
│                                                                     │
│  2. ASSESS (within 24 hours)                                       │
│     └─ What data was affected?                                     │
│     └─ How many users impacted?                                    │
│     └─ How did breach occur?                                       │
│                                                                     │
│  3. NOTIFY (within 72 hours per POPIA)                             │
│     └─ Information Regulator                                       │
│     └─ Affected users                                              │
│     └─ What happened and what we're doing                          │
│                                                                     │
│  4. REMEDIATE                                                       │
│     └─ Fix vulnerability                                           │
│     └─ Implement additional controls                               │
│     └─ Document lessons learned                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TERMS OF SERVICE - KEY POINTS

### Service Description
- HireInbox provides AI-powered CV screening
- AI makes recommendations, not decisions
- Employers are responsible for final hiring decisions
- We do not guarantee employment outcomes

### User Responsibilities
- Provide accurate information
- Use service for legitimate recruitment only
- Not use for discriminatory purposes
- Comply with employment laws
- Keep login credentials secure

### Our Responsibilities
- Provide service as described
- Protect user data per Privacy Policy
- Maintain reasonable uptime
- Fix reported bugs in reasonable time

### Limitations
- AI is not perfect, may make errors
- Not liable for hiring decisions made
- Not liable for employment outcomes
- Service provided "as is"

### Termination
- User can cancel anytime
- We can terminate for ToS violations
- Data deleted per retention policy after termination
- No refunds for partial months (subscriptions)

---

## PRIVACY POLICY - KEY POINTS

### What We Collect
```
DIRECTLY FROM YOU:
• Name, email, password (account)
• Company name (B2B)
• CV content (uploaded)
• Payment information (via Yoco, we don't store cards)

AUTOMATICALLY:
• IP address
• Browser type
• Pages visited
• Time spent
• Error logs

FROM THIRD PARTIES:
• Email content (with your authorization, B2B)
• Payment confirmation (from Yoco)
```

### How We Use Data
```
• Provide the service (CV analysis, screening)
• Improve AI accuracy
• Send account-related emails
• Process payments
• Prevent fraud
• Comply with legal obligations
```

### Who We Share With
```
NEVER SELL DATA.

Share only with:
• OpenAI (for AI processing, anonymized)
• Supabase (data storage)
• Yoco (payment processing)
• Law enforcement (if legally required)
• Employers (Talent Pool opt-in only)
```

### Your Rights (POPIA)
```
• Access your data
• Correct your data
• Delete your data
• Object to processing
• Withdraw consent
• Lodge complaint with Information Regulator
```

---

## CONTENT POLICIES

### Prohibited Use
```
DO NOT USE HIREINBOX TO:

• Discriminate illegally
• Collect data for purposes other than recruitment
• Spam or harass candidates
• Scrape or bulk download data
• Attempt to reverse-engineer AI
• Share account credentials
• Process CVs without candidate consent
• Store non-recruitment data
```

### Acceptable Use
```
YOU MAY USE HIREINBOX TO:

• Screen CVs for legitimate job openings
• Get AI feedback on your own CV
• Store candidate data for active recruitment
• Contact candidates about jobs they applied for
• Export your own data
• Integrate with other recruitment tools (API)
```

---

## COMPLIANCE CALENDAR

```
┌─────────────────────────────────────────────────────────────────────┐
│  MONTHLY                                                            │
│  • Review error logs for security issues                           │
│  • Check for failed login attempts (brute force)                   │
│                                                                     │
│  QUARTERLY                                                          │
│  • Audit AI decisions for bias                                     │
│  • Review and update documentation                                 │
│  • Check data retention compliance                                 │
│                                                                     │
│  ANNUALLY                                                           │
│  • Full security audit                                             │
│  • Privacy Policy review and update                                │
│  • Terms of Service review and update                              │
│  • POPIA compliance review                                         │
│  • AI training data bias audit                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CONTACT INFORMATION

```
INFORMATION OFFICER:
Simon Rubin
Email: privacy@hireinbox.co.za (to be set up)

INFORMATION REGULATOR (SA):
Website: https://inforegulator.org.za
Email: complaints.IR@justice.gov.za

COMPANY DETAILS:
HireInbox (Pty) Ltd (to be registered)
South Africa
```

---

*"Trust is our most valuable feature." - HireInbox*
